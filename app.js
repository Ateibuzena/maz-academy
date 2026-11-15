import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { CFG } from './config.js';
const sb = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let user = null, admin = false;

const toast = (m, err) => {
  const t = $('#toast'); t.textContent = m; t.className = 'show' + (err ? ' err' : '');
  clearTimeout(toast.id); toast.id = setTimeout(() => t.className = '', 4500);
};

$('#burger').onclick = () => $('#nav').classList.toggle('open');
$('#nav').onclick = () => $('#nav').classList.remove('open');

const login = () => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
$('#auth').onclick = () => user ? sb.auth.signOut() : login();
$('#gateBtn').onclick = login;

async function refresh() {
  admin = false;
  if (user) { const { data } = await sb.rpc('is_admin'); admin = data === true; }
  $('#auth').textContent = user ? 'Salir' : 'Entrar con Google';
  $('#apptForm').hidden = !user; $('#gate').hidden = !!user;
  $('#upForm').hidden = !admin;
  if (user && !$('#name').value) $('#name').value = user.user_metadata?.full_name || '';
  loadItems();
}
sb.auth.onAuthStateChange((_e, s) => { user = s?.user ?? null; setTimeout(refresh, 0); });

$('#apptForm').onsubmit = async e => {
  e.preventDefault();
  const f = e.target, b = f.querySelector('button'), d = Object.fromEntries(new FormData(f));
  b.disabled = true; b.textContent = 'Enviando…';
  const [db, mail] = await Promise.allSettled([
    sb.from('appointments').insert({ name: d.name.trim(), phone: d.phone.trim(), reason: d.reason.trim() }),
    fetch('https://api.web3forms.com/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: CFG.WEB3FORMS_KEY, subject: 'Nueva llamada solicitada: ' + d.name, from_name: 'MAZ Academy',
        replyto: user.email, nombre: d.name, telefono: d.phone, motivo: d.reason, correo_google: user.email })
    }).then(r => r.json())
  ]);
  const ok = (db.status === 'fulfilled' && !db.value.error) || (mail.status === 'fulfilled' && mail.value.success);
  if (ok) { toast('Llamada solicitada. Te llamaremos pronto.'); f.reset(); $('#name').value = d.name; }
  else toast('No se pudo enviar. Inténtalo de nuevo en unos minutos.', 1);
  b.disabled = false; b.textContent = 'Solicitar llamada';
};

async function loadItems() {
  const g = $('#grid');
  const { data, error } = await sb.from('materials').select('*').order('created_at', { ascending: false });
  if (error || !data?.length) { g.innerHTML = '<p class="muted">Pronto publicaremos aquí nuestros proyectos y material.</p>'; return; }
  g.innerHTML = data.map(m => {
    const u = m.path ? sb.storage.from('materials').getPublicUrl(m.path).data.publicUrl : m.url;
    const media = m.kind === 'video'
      ? `<video controls playsinline preload="metadata" src="${esc(u)}"></video>`
      : `<a class="doc" href="${esc(u)}" target="_blank" rel="noopener">${{ pdf: '📄 Abrir PDF', link: '🔗 Abrir enlace' }[m.kind] || '⬇️ Descargar archivo'}</a>`;
    return `<article class="card item">${media}<h3>${esc(m.title)}</h3><p>${esc(m.description)}</p>` +
      (admin ? `<button class="del" data-id="${m.id}" data-path="${esc(m.path || '')}">Eliminar</button>` : '') + '</article>';
  }).join('');
}

$('#grid').onclick = async e => {
  const b = e.target.closest('.del');
  if (!b || !confirm('¿Eliminar este elemento?')) return;
  if (b.dataset.path) await sb.storage.from('materials').remove([b.dataset.path]);
  await sb.from('materials').delete().eq('id', b.dataset.id);
  loadItems();
};

$('#upForm').onsubmit = async e => {
  e.preventDefault();
  const f = e.target, b = f.querySelector('button'), fd = new FormData(f), file = fd.get('file'), link = (fd.get('link') || '').trim();
  if (!file.size && !link) return toast('Elige un archivo o pega un enlace.', 1);
  if (!file.size && !/^https?:\/\//i.test(link)) return toast('El enlace debe empezar por https://', 1);
  b.disabled = true; b.textContent = 'Subiendo…';
  try {
    let path = null, kind = 'link';
    if (file.size) {
      const t = file.type;
      kind = t.startsWith('video/') ? 'video' : t === 'application/pdf' ? 'pdf' : 'file';
      path = crypto.randomUUID() + '-' + file.name.normalize('NFD').replace(/[^\w.-]+/g, '_');
      const { error } = await sb.storage.from('materials').upload(path, file, { contentType: t || undefined });
      if (error) throw error;
    }
    const { error } = await sb.from('materials').insert({ title: fd.get('title').trim(), description: fd.get('description').trim(), kind, path, url: path ? null : link });
    if (error) throw error;
    f.reset(); toast('Publicado.'); loadItems();
  } catch (err) { toast('No se pudo publicar: ' + err.message, 1); }
  b.disabled = false; b.textContent = 'Publicar';
};

if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
