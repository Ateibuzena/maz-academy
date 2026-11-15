# MAZ Academy

Web app estática (HTML + CSS + JS, sin compilar) con instalación en móvil (PWA). Hosting gratis en GitHub Pages; Google login, base de datos y archivos en Supabase (plan gratuito).

## Puesta en marcha

1. **Supabase**: crea un proyecto en supabase.com. En *SQL Editor* ejecuta `supabase-setup.sql` (antes cambia los correos de `admins`).
2. **Google login**: en Google Cloud Console crea un *OAuth Client ID* (tipo Web) con la URI de redirección `https://TU-PROYECTO.supabase.co/auth/v1/callback`. Pega Client ID y Secret en Supabase > Authentication > Providers > Google.
3. **URLs**: en Supabase > Authentication > URL Configuration, pon como *Site URL* y en *Redirect URLs* `https://TU-USUARIO.github.io/TU-REPO/` (y `http://localhost:8000/` para pruebas).
4. **Correo de avisos**: en web3forms.com crea una Access Key con el correo donde quieres recibir las llamadas.
5. **config.js**: pega la URL del proyecto, la `anon public key` (Supabase > Project Settings > API) y la Access Key de Web3Forms.
6. **GitHub Pages**: sube estos archivos a un repositorio, y en Settings > Pages elige *Deploy from a branch* > `main` > `/ (root)`.
7. **Móvil**: abre la web en Safari (iPhone: Compartir > Añadir a pantalla de inicio) o Chrome (Android: menú > Instalar app).

## Uso
- Las cuentas de `admins` ven el formulario de subida en *Proyectos y material* (vídeo, PDF, otros archivos o un enlace de YouTube) y pueden eliminar elementos.
- Cada solicitud de llamada se guarda en la tabla `appointments` (Supabase > Table Editor) y llega por correo.

## Notas
- Edita los textos de María y Ana en `index.html` (sección `#team`) y los cursos en `#courses`.
- Plan gratuito: 50 MB por archivo y 1 GB en total; para vídeos largos usa un enlace de YouTube. Supabase pausa los proyectos tras 7 días sin actividad (se reactivan desde su panel).
- Web3Forms gratis: 250 correos al mes.
