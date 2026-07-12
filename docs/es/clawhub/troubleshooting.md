---
read_when:
    - La CLI de ClawHub o los comandos del registro de OpenClaw fallan
    - No se puede instalar, publicar ni actualizar un paquete.
summary: Solución de problemas de inicio de sesión, instalación, publicación, actualización y API de ClawHub.
x-i18n:
    generated_at: "2026-07-11T22:57:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Solución de problemas

## `clawhub login` abre un navegador, pero nunca finaliza

La CLI inicia un servidor local de devolución de llamada de corta duración durante el inicio de sesión mediante el navegador.

- Asegúrate de que tu navegador pueda acceder a `http://127.0.0.1:<port>/callback`.
- Comprueba las reglas locales del cortafuegos, la VPN y el proxy si la devolución de llamada nunca llega.
- En entornos sin interfaz gráfica, crea un token de API en la interfaz web de ClawHub y ejecuta:

```bash
clawhub login --token clh_...
```

## `whoami` o `publish` devuelve `Unauthorized` (401)

- Vuelve a iniciar sesión con `clawhub login`.
- Si usas una ruta de configuración personalizada, confirma que `CLAWHUB_CONFIG_PATH` apunte al
  archivo que contiene tu token actual.
- Si usas un token de API, confirma que no se haya revocado en la interfaz web.

## La búsqueda o la instalación devuelve `Rate limit exceeded` (429)

Consulta la información de reintento en la respuesta:

- `Retry-After`: segundos que debes esperar antes de volver a intentarlo.
- `RateLimit-Limit`: límite aplicado a esta solicitud.
- `RateLimit-Remaining`: tu cuota restante exacta cuando está presente el encabezado. En caso de `429`, es `0`.
- `RateLimit-Reset` o `X-RateLimit-Reset`: momento del restablecimiento.

Si muchos usuarios comparten una misma IP de salida, se pueden alcanzar los límites de IP anónima aunque cada
persona solo envíe unas pocas solicitudes. Inicia sesión cuando sea posible y vuelve a intentarlo tras la
espera indicada.

## La búsqueda o la instalación falla detrás de un proxy

La CLI respeta las variables de proxy estándar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Los nombres compatibles incluyen `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` y
`http_proxy`.

## Una Skill no aparece en la búsqueda

- Comprueba el slug exacto o la página del propietario si los conoces.
- Confirma que la versión sea pública y que no esté retenida por el análisis o la moderación.
- Si eres propietario de la Skill, inicia sesión e inspecciónala:

```bash
clawhub inspect @openclaw/demo
```

Los diagnósticos visibles para el propietario pueden explicar el estado del análisis, el control de carga o la moderación.

## La publicación falla porque faltan metadatos obligatorios

Para las Skills, comprueba el frontmatter de `SKILL.md`. Deben declararse las variables de entorno y
las herramientas obligatorias para que los usuarios y los analizadores puedan comprender el paquete.

Para los plugins, comprueba los metadatos de compatibilidad de `package.json`. Las publicaciones de
plugins de código necesitan campos de compatibilidad con OpenClaw, como `openclaw.compat.pluginApi` y
`openclaw.build.openclawVersion`.

Previsualiza primero la carga útil de publicación:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La publicación falla por un error del propietario o del origen de GitHub

ClawHub usa la identidad de GitHub y la atribución del origen para vincular los paquetes con sus
editores.

- Asegúrate de haber iniciado sesión con la cuenta de GitHub que posee o puede publicar
  el paquete.
- Comprueba que la URL de origen sea pública o accesible para ClawHub.
- Para orígenes de GitHub, usa `owner/repo`, `owner/repo@ref` o una URL completa de GitHub.

## La publicación falla porque se ha reclamado o reservado un espacio de nombres

Si una publicación falla porque el identificador del propietario, el espacio de nombres de la organización, el ámbito del paquete, el
slug de la Skill o el nombre del paquete ya están reclamados o reservados, confirma primero que estés
publicando con el propietario correspondiente al espacio de nombres. Para paquetes de plugins,
los nombres con ámbito, como `@example-org/example-plugin`, deben publicarse con el propietario
`example-org` correspondiente.

Si crees que tu organización, proyecto o marca es el propietario legítimo del espacio de nombres, pero
no puedes administrar al propietario actual de ClawHub, abre una
[incidencia de reclamación de organización o espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con pruebas públicas y no confidenciales. Consulta
[Reclamaciones de organizaciones y espacios de nombres](/clawhub/namespace-claims) para obtener orientación sobre las pruebas y saber qué
debes excluir de las incidencias públicas.

## `sync` indica que no se encontraron Skills

`sync` busca carpetas que contengan `SKILL.md` o `skill.md`.

Indícale las raíces que quieres analizar:

```bash
clawhub sync --root /path/to/skills
```

Previsualiza primero si no estás seguro de qué se publicará:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` se niega a continuar debido a cambios locales

Los archivos locales no coinciden con ninguna versión conocida por ClawHub. Elige una opción:

- Conserva las modificaciones locales y omite la actualización.
- Sobrescribe los archivos con la versión publicada:

```bash
clawhub update @openclaw/demo --force
```

- Publica tu copia modificada con un slug nuevo o como una bifurcación.

## La instalación de un plugin falla en OpenClaw

- Usa un origen de ClawHub explícito:

```bash
openclaw plugins install clawhub:<package>
```

- Comprueba en la página de detalles del paquete el estado del análisis y los metadatos de compatibilidad.
- Confirma que tu versión de OpenClaw satisfaga el intervalo de compatibilidad
  anunciado por el paquete.
- Si el paquete está oculto, retenido o bloqueado, es posible que no pueda instalarse hasta que
  el propietario resuelva el problema.

## Las solicitudes a la API pública fallan

- Respeta los encabezados de reintento de `429` y almacena en caché las respuestas públicas de listas y búsquedas.
- Remite a los usuarios al listado canónico de ClawHub.
- No repliques contenido oculto, privado, retenido o bloqueado por moderación fuera de la
  superficie de la API pública.

Consulta [API HTTP](/clawhub/http-api) para obtener detalles sobre los endpoints.
