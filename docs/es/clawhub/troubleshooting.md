---
read_when:
    - Los comandos de la CLI de ClawHub o del registro de OpenClaw fallan
    - No se puede instalar, publicar ni actualizar un paquete
summary: Solución de problemas de inicio de sesión, instalación, publicación, actualización y API de ClawHub.
x-i18n:
    generated_at: "2026-07-05T20:18:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Solución de problemas

## `clawhub login` abre un navegador pero nunca se completa

La CLI inicia un servidor local de callback de corta duración durante el inicio de sesión en el navegador.

- Asegúrate de que tu navegador pueda acceder a `http://127.0.0.1:<port>/callback`.
- Revisa las reglas del firewall local, la VPN y el proxy si el callback nunca llega.
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
- `RateLimit-Limit`: el límite aplicado a esta solicitud.
- `RateLimit-Remaining`: tu presupuesto restante exacto cuando el encabezado está presente. En `429`, es `0`.
- `RateLimit-Reset` o `X-RateLimit-Reset`: momento del restablecimiento.

Si muchos usuarios comparten una misma IP de salida, se pueden alcanzar los límites de IP anónima incluso cuando cada
persona solo envía unas pocas solicitudes. Inicia sesión cuando sea posible y vuelve a intentarlo después del
retraso indicado.

## La búsqueda o instalación falla detrás de un proxy

La CLI respeta las variables de proxy estándar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Los nombres admitidos incluyen `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` y
`http_proxy`.

## Una skill no aparece en la búsqueda

- Revisa el slug exacto o la página del propietario si la conoces.
- Confirma que la versión sea pública y no esté retenida por análisis o moderación.
- Si la skill es tuya, inicia sesión e inspecciónala:

```bash
clawhub inspect @openclaw/demo
```

Los diagnósticos visibles para el propietario pueden explicar el estado de análisis, upload-gate o moderación.

## La publicación falla porque faltan metadatos requeridos

Para Skills, revisa el frontmatter de `SKILL.md`. Las variables de entorno y
herramientas requeridas deben declararse para que los usuarios y los analizadores puedan entender el paquete.

Para plugins, revisa los metadatos de compatibilidad de `package.json`. Las publicaciones de code-plugin
necesitan campos de compatibilidad de OpenClaw como `openclaw.compat.pluginApi` y
`openclaw.build.openclawVersion`.

Previsualiza primero la carga útil de publicación:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La publicación falla con un error de propietario o fuente de GitHub

ClawHub usa la identidad de GitHub y la atribución de fuente para conectar los paquetes con sus
publicadores.

- Asegúrate de haber iniciado sesión con la cuenta de GitHub que posee o puede publicar
  el paquete.
- Comprueba que la URL de origen sea pública o accesible para ClawHub.
- Para fuentes de GitHub, usa `owner/repo`, `owner/repo@ref` o una URL completa de GitHub.

## La publicación falla porque un namespace está reclamado o reservado

Si una publicación falla porque el identificador del propietario, el namespace de la organización, el ámbito del paquete, el slug de la skill
o el nombre del paquete ya está reclamado o reservado, primero confirma que estás
publicando con el propietario que coincide con el namespace. Para paquetes de plugins,
los nombres con ámbito como `@example-org/example-plugin` deben publicarse como el
propietario `example-org` correspondiente.

Si crees que tu organización, proyecto o marca es el propietario legítimo del namespace pero
no puedes administrar el propietario actual de ClawHub, abre un
[issue de reclamación de organización / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con pruebas públicas y no sensibles. Consulta
[Reclamaciones de organización y namespace](/clawhub/namespace-claims) para obtener orientación sobre evidencias y qué
mantener fuera de los issues públicos.

## `sync` dice que no se encontraron Skills

`sync` busca carpetas que contengan `SKILL.md` o `skill.md`.

Apúntalo a las raíces que quieres escanear:

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

- Publica tu copia editada como un nuevo slug o fork.

## La instalación de un plugin falla en OpenClaw

- Usa una fuente explícita de ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Revisa la página de detalles del paquete para ver el estado de análisis y los metadatos de compatibilidad.
- Confirma que tu versión de OpenClaw satisfaga el rango de compatibilidad
  anunciado por el paquete.
- Si el paquete está oculto, retenido o bloqueado, puede que no se pueda instalar hasta que
  el propietario resuelva el problema.

## Las solicitudes a la API pública fallan

- Respeta los encabezados de reintento `429` y almacena en caché las respuestas públicas de listado/búsqueda.
- Dirige a los usuarios de vuelta al listado canónico de ClawHub.
- No reflejes contenido oculto, privado, retenido o bloqueado por moderación fuera de la
  superficie de la API pública.

Consulta [API HTTP](/clawhub/http-api) para obtener detalles de los endpoints.
