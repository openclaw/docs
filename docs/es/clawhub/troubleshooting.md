---
read_when:
    - Los comandos de la CLI de ClawHub o del registro de OpenClaw fallan
    - No se puede instalar, publicar ni actualizar un paquete
summary: Solución de problemas de inicio de sesión, instalación, publicación, actualización y API de ClawHub.
x-i18n:
    generated_at: "2026-07-06T10:48:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Solución de problemas

## `clawhub login` abre un navegador pero nunca finaliza

La CLI inicia un servidor local de devolución de llamada de corta duración durante el inicio de sesión en el navegador.

- Asegúrate de que tu navegador pueda acceder a `http://127.0.0.1:<port>/callback`.
- Revisa las reglas del firewall local, la VPN y el proxy si la devolución de llamada nunca llega.
- En entornos sin interfaz gráfica, crea un token de API en la interfaz web de ClawHub y ejecuta:

```bash
clawhub login --token clh_...
```

## `whoami` o `publish` devuelve `Unauthorized` (401)

- Vuelve a iniciar sesión con `clawhub login`.
- Si usas una ruta de configuración personalizada, confirma que `CLAWHUB_CONFIG_PATH` apunte al
  archivo que contiene tu token actual.
- Si usas un token de API, confirma que no haya sido revocado en la interfaz web.

## La búsqueda o la instalación devuelve `Rate limit exceeded` (429)

Lee la información de reintento en la respuesta:

- `Retry-After`: segundos que esperar antes de volver a intentarlo.
- `RateLimit-Limit`: el límite aplicado a esta solicitud.
- `RateLimit-Remaining`: tu presupuesto restante exacto cuando el encabezado está presente. En `429`, es `0`.
- `RateLimit-Reset` o `X-RateLimit-Reset`: momento del restablecimiento.

Si muchos usuarios comparten una IP de salida, los límites de IP anónima pueden alcanzarse aunque cada
persona solo envíe unas pocas solicitudes. Inicia sesión cuando sea posible y vuelve a intentarlo después del
retraso indicado.

## La búsqueda o la instalación falla detrás de un proxy

La CLI respeta las variables de proxy estándar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Los nombres admitidos incluyen `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` y
`http_proxy`.

## Una skill no aparece en la búsqueda

- Revisa el slug exacto o la página del propietario si lo conoces.
- Confirma que la publicación sea pública y no esté retenida por escaneo o moderación.
- Si eres propietario de la skill, inicia sesión e inspecciónala:

```bash
clawhub inspect @openclaw/demo
```

Los diagnósticos visibles para el propietario pueden explicar el estado de escaneo, bloqueo de carga o moderación.

## La publicación falla porque faltan metadatos obligatorios

Para skills, revisa el frontmatter de `SKILL.md`. Las variables de entorno y
herramientas obligatorias deben declararse para que los usuarios y los analizadores puedan entender el paquete.

Para plugins, revisa los metadatos de compatibilidad de `package.json`. Las publicaciones de plugins de código
necesitan campos de compatibilidad con OpenClaw como `openclaw.compat.pluginApi` y
`openclaw.build.openclawVersion`.

Previsualiza primero la carga útil de publicación:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La publicación falla con un error de propietario de GitHub o de origen

ClawHub usa la identidad de GitHub y la atribución de origen para conectar los paquetes con sus
publicadores.

- Asegúrate de haber iniciado sesión con la cuenta de GitHub que posee el paquete o puede publicarlo.
- Comprueba que la URL de origen sea pública o accesible para ClawHub.
- Para orígenes de GitHub, usa `owner/repo`, `owner/repo@ref` o una URL completa de GitHub.

## La publicación falla porque un espacio de nombres está reclamado o reservado

Si una publicación falla porque el identificador del propietario, el espacio de nombres de la organización, el alcance del paquete, el slug de la skill
o el nombre del paquete ya está reclamado o reservado, primero confirma que estás
publicando con el propietario que coincide con el espacio de nombres. Para paquetes de plugins,
los nombres con alcance como `@example-org/example-plugin` deben publicarse como el propietario
`example-org` correspondiente.

Si crees que tu organización, proyecto o marca es el propietario legítimo del espacio de nombres pero
no puedes administrar el propietario actual de ClawHub, abre un
[issue de reclamación de organización / espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con pruebas públicas y no sensibles. Consulta
[Reclamaciones de organización y espacio de nombres](/clawhub/namespace-claims) para obtener orientación sobre las pruebas y qué
mantener fuera de los issues públicos.

## `sync` dice que no se encontraron skills

`sync` busca carpetas que contengan `SKILL.md` o `skill.md`.

Apúntalo a las raíces que quieres escanear:

```bash
clawhub sync --root /path/to/skills
```

Previsualiza primero si no tienes claro qué se publicará:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` se niega debido a cambios locales

Los archivos locales no coinciden con ninguna versión que ClawHub conozca. Elige una opción:

- Conserva las ediciones locales y omite la actualización.
- Sobrescribe con la versión publicada:

```bash
clawhub update @openclaw/demo --force
```

- Publica tu copia editada como un nuevo slug o fork.

## Falla la instalación de un plugin en OpenClaw

- Usa un origen explícito de ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Revisa la página de detalles del paquete para ver el estado del escaneo y los metadatos de compatibilidad.
- Confirma que tu versión de OpenClaw satisfaga el rango de compatibilidad
  anunciado por el paquete.
- Si el paquete está oculto, retenido o bloqueado, puede que no sea instalable hasta que
  el propietario resuelva el problema.

## Fallan las solicitudes de la API pública

- Respeta los encabezados de reintento `429` y almacena en caché las respuestas públicas de lista/búsqueda.
- Remite a los usuarios al listado canónico de ClawHub.
- No repliques contenido oculto, privado, retenido o bloqueado por moderación fuera de la
  superficie de la API pública.

Consulta [API HTTP](/clawhub/http-api) para obtener detalles de los endpoints.
