---
read_when:
    - Los comandos de ClawHub CLI o del registro de OpenClaw fallan
    - No se puede instalar, publicar ni actualizar un paquete
summary: Solución de problemas de inicio de sesión, instalación, publicación, sincronización, actualización y API de ClawHub.
x-i18n:
    generated_at: "2026-05-12T00:57:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Solución de problemas

## `clawhub login` abre un navegador pero nunca se completa

La CLI inicia un servidor local de devolución de llamada de corta duración durante el inicio de sesión en el navegador.

- Asegúrate de que tu navegador pueda llegar a `http://127.0.0.1:<port>/callback`.
- Comprueba las reglas del firewall local, la VPN y el proxy si la devolución de llamada nunca llega.
- En entornos sin interfaz gráfica, crea un token de API en la interfaz web de ClawHub y ejecuta:

```bash
clawhub login --token clh_...
```

## `whoami` o `publish` devuelve `Unauthorized` (401)

- Inicia sesión de nuevo con `clawhub login`.
- Si usas una ruta de configuración personalizada, confirma que `CLAWHUB_CONFIG_PATH` apunte al
  archivo que contiene tu token actual.
- Si usas un token de API, confirma que no se haya revocado en la interfaz web.

## La búsqueda o instalación devuelve `Rate limit exceeded` (429)

Lee la información de reintento en la respuesta:

- `Retry-After`: segundos que debes esperar antes de volver a intentarlo.
- `RateLimit-Remaining` y `RateLimit-Limit`: tu presupuesto actual.
- `RateLimit-Reset` o `X-RateLimit-Reset`: momento del restablecimiento.

Si muchos usuarios comparten una IP de salida, se pueden alcanzar los límites de IP anónima incluso cuando cada
persona solo envía unas pocas solicitudes. Inicia sesión cuando sea posible y vuelve a intentarlo después del
retraso informado.

## La búsqueda o instalación falla detrás de un proxy

La CLI respeta las variables de proxy estándar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Los nombres admitidos incluyen `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` y
`http_proxy`.

## Un skill no aparece en la búsqueda

- Comprueba el slug exacto o la página del propietario si lo conoces.
- Confirma que la versión sea pública y no esté retenida por análisis o moderación.
- Si eres propietario del skill, inicia sesión e inspecciónalo:

```bash
clawhub inspect <skill-slug>
```

Los diagnósticos visibles para el propietario pueden explicar el estado de análisis, compuerta de carga o moderación.

## La publicación falla porque faltan metadatos obligatorios

Para Skills, comprueba el frontmatter de `SKILL.md`. Las variables de entorno y
herramientas obligatorias deben declararse para que los usuarios y los escáneres puedan entender el paquete.

Para plugins, comprueba los metadatos de compatibilidad de `package.json`. Las publicaciones de code-plugin
necesitan campos de compatibilidad de OpenClaw como `openclaw.compat.pluginApi` y
`openclaw.build.openclawVersion`.

Previsualiza primero la carga útil de publicación:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La publicación falla con un error de propietario o fuente de GitHub

ClawHub usa la identidad de GitHub y la atribución de la fuente para conectar los paquetes con sus
publicadores.

- Asegúrate de haber iniciado sesión con la cuenta de GitHub que posee o puede publicar
  el paquete.
- Comprueba que la URL de origen sea pública o accesible para ClawHub.
- Para fuentes de GitHub, usa `owner/repo`, `owner/repo@ref` o una URL completa de GitHub.

## `sync` indica que no se encontraron Skills

`sync` busca carpetas que contengan `SKILL.md` o `skill.md`.

Apúntalo a las raíces que quieres analizar:

```bash
clawhub sync --root /path/to/skills
```

Previsualiza primero si no estás seguro de qué se publicará:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` se niega por cambios locales

Los archivos locales no coinciden con ninguna versión que ClawHub conozca. Elige una opción:

- Conserva las ediciones locales y omite la actualización.
- Sobrescribe con la versión publicada:

```bash
clawhub update <slug> --force
```

- Publica tu copia editada como un nuevo slug o fork.

## La instalación de un plugin falla en OpenClaw

- Usa una fuente explícita de ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Comprueba la página de detalles del paquete para ver el estado de análisis y los metadatos de compatibilidad.
- Confirma que tu versión de OpenClaw satisfaga el rango de compatibilidad
  anunciado por el paquete.
- Si el paquete está oculto, retenido o bloqueado, puede que no se pueda instalar hasta que
  el propietario resuelva el problema.

## Fallan las solicitudes de API pública

- Respeta los encabezados de reintento `429` y almacena en caché las respuestas públicas de lista/búsqueda.
- Devuelve a los usuarios al listado canónico de ClawHub.
- No repliques contenido oculto, privado, retenido o bloqueado por moderación fuera de la
  superficie de API pública.

Consulta [API HTTP](/es/clawhub/http-api) para ver los detalles de los endpoints.
