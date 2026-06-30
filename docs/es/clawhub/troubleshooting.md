---
read_when:
    - Los comandos de CLI de ClawHub o del registro de OpenClaw fallan
    - No se puede instalar, publicar ni actualizar un paquete
summary: Solución de problemas de inicio de sesión, instalación, publicación, actualización y API de ClawHub.
x-i18n:
    generated_at: "2026-06-30T22:05:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Solución de problemas

## `clawhub login` abre un navegador, pero nunca se completa

La CLI inicia un servidor local de devolución de llamada de corta duración durante el inicio de sesión en el navegador.

- Asegúrate de que tu navegador pueda acceder a `http://127.0.0.1:<port>/callback`.
- Revisa las reglas del firewall local, la VPN y el proxy si la devolución de llamada nunca llega.
- En entornos sin interfaz gráfica, crea un token de API en la interfaz web de ClawHub y ejecuta:

```bash
clawhub login --token clh_...
```

## `whoami` o `publish` devuelve `Unauthorized` (401)

- Inicia sesión de nuevo con `clawhub login`.
- Si usas una ruta de configuración personalizada, confirma que `CLAWHUB_CONFIG_PATH` apunte al
  archivo que contiene tu token actual.
- Si usas un token de API, confirma que no haya sido revocado en la interfaz web.

## La búsqueda o instalación devuelve `Rate limit exceeded` (429)

Lee la información de reintento en la respuesta:

- `Retry-After`: segundos que se deben esperar antes de reintentar.
- `RateLimit-Limit`: el límite aplicado a esta solicitud.
- `RateLimit-Remaining`: tu presupuesto restante exacto cuando el encabezado está presente. En `429`, es `0`.
- `RateLimit-Reset` o `X-RateLimit-Reset`: momento del restablecimiento.

Si muchos usuarios comparten una sola IP de salida, los límites de IP anónima pueden alcanzarse aunque cada
persona solo envíe unas pocas solicitudes. Inicia sesión cuando sea posible y reintenta después del
retraso informado.

## La búsqueda o instalación falla detrás de un proxy

La CLI respeta las variables de proxy estándar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Los nombres admitidos incluyen `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` y
`http_proxy`.

## Una skill no aparece en la búsqueda

- Revisa el slug exacto o la página del propietario si lo conoces.
- Confirma que la versión sea pública y que no esté retenida por análisis o moderación.
- Si eres propietario de la skill, inicia sesión e inspecciónala:

```bash
clawhub inspect @openclaw/demo
```

Los diagnósticos visibles para el propietario pueden explicar el estado de análisis, upload-gate o moderación.

## La publicación falla porque faltan metadatos requeridos

Para Skills, revisa el frontmatter de `SKILL.md`. Las variables de entorno y
herramientas requeridas deben declararse para que los usuarios y analizadores puedan entender el paquete.

Para plugins, revisa los metadatos de compatibilidad de `package.json`. Las publicaciones de code-plugin
necesitan campos de compatibilidad de OpenClaw como `openclaw.compat.pluginApi` y
`openclaw.build.openclawVersion`.

Previsualiza primero la carga útil de publicación:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La publicación falla con un error de propietario o fuente de GitHub

ClawHub usa la identidad de GitHub y la atribución de fuente para conectar paquetes con sus
publicadores.

- Asegúrate de haber iniciado sesión con la cuenta de GitHub que posee o puede publicar
  el paquete.
- Revisa que la URL de origen sea pública o accesible para ClawHub.
- Para fuentes de GitHub, usa `owner/repo`, `owner/repo@ref` o una URL completa de GitHub.

## La publicación falla porque un espacio de nombres está reclamado o reservado

Si una publicación falla porque el identificador del propietario, el espacio de nombres de la organización, el alcance del paquete, el
slug de la skill o el nombre del paquete ya está reclamado o reservado, confirma primero que estás
publicando con el propietario que coincide con el espacio de nombres. Para paquetes de Plugin,
los nombres con alcance como `@example-org/example-plugin` deben publicarse como el
propietario `example-org` correspondiente.

Si crees que tu organización, proyecto o marca es el propietario legítimo del espacio de nombres pero
no puedes gestionar el propietario actual de ClawHub, abre un
[problema de reclamación de organización / espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con pruebas públicas y no confidenciales. Consulta
[Reclamaciones de organización y espacio de nombres](/clawhub/namespace-claims) para obtener orientación sobre las pruebas y qué
mantener fuera de los problemas públicos.

## `sync` dice que no se encontraron Skills

`sync` busca carpetas que contengan `SKILL.md` o `skill.md`.

Apúntalo a las raíces que quieras analizar:

```bash
clawhub sync --root /path/to/skills
```

Previsualiza primero si no tienes claro qué se publicará:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` se niega por cambios locales

Los archivos locales no coinciden con ninguna versión que ClawHub conozca. Elige una opción:

- Conserva las ediciones locales y omite la actualización.
- Sobrescribe con la versión publicada:

```bash
clawhub update @openclaw/demo --force
```

- Publica tu copia editada como un slug nuevo o una bifurcación.

## Una instalación de Plugin falla en OpenClaw

- Usa una fuente explícita de ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Revisa la página de detalles del paquete para ver el estado de análisis y los metadatos de compatibilidad.
- Confirma que tu versión de OpenClaw satisfaga el rango de compatibilidad
  anunciado por el paquete.
- Si el paquete está oculto, retenido o bloqueado, puede que no se pueda instalar hasta que
  el propietario resuelva el problema.

## Fallan las solicitudes a la API pública

- Respeta los encabezados de reintento `429` y almacena en caché las respuestas públicas de lista/búsqueda.
- Enlaza a los usuarios de vuelta al listado canónico de ClawHub.
- No dupliques contenido oculto, privado, retenido o bloqueado por moderación fuera de la
  superficie de la API pública.

Consulta [API HTTP](/clawhub/http-api) para obtener detalles de los endpoints.
