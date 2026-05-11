---
read_when:
    - Uso de la CLI de ClawHub
    - Depuración de instalación, actualización, publicación o sincronización
summary: 'Referencia de la CLI: comandos, opciones, configuración, archivo de bloqueo, comportamiento de sincronización.'
x-i18n:
    generated_at: "2026-05-11T22:19:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: abbe12a07f8947f8c65ba6eaae6fa6ff7fb8bfb12fbcb339abccd12225a2e791
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Paquete CLI: `clawhub`, binario: `clawhub`.

Instálelo globalmente con npm o pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Luego verifíquelo:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Marcas globales

- `--workdir <dir>`: directorio de trabajo (predeterminado: cwd; recurre al espacio de trabajo de Clawdbot si está configurado)
- `--dir <dir>`: directorio de instalación bajo workdir (predeterminado: `skills`)
- `--site <url>`: URL base para el inicio de sesión en el navegador (predeterminado: `https://clawhub.ai`)
- `--registry <url>`: URL base de la API (predeterminado: detectada; si no, `https://clawhub.ai`)
- `--no-input`: deshabilitar mensajes interactivos

Equivalentes de entorno:

- `CLAWHUB_SITE` (heredado `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (heredado `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (heredado `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI respeta las variables de entorno estándar de proxy HTTP para sistemas detrás de
proxies corporativos o redes restringidas:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Cuando cualquiera de estas variables está definida, la CLI enruta las solicitudes salientes a través
del proxy especificado. `HTTPS_PROXY` se usa para solicitudes HTTPS, `HTTP_PROXY`
para HTTP simple. `NO_PROXY` / `no_proxy` se respeta para omitir el proxy en
hosts o dominios específicos.

Esto es necesario en sistemas donde las conexiones salientes directas están bloqueadas
(p. ej., contenedores Docker, VPS de Hetzner con internet solo mediante proxy, firewalls
corporativos).

Ejemplo:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Cuando no se define ninguna variable de proxy, el comportamiento no cambia (conexiones directas).

## Archivo de configuración

Almacena su token de API y la URL del registro en caché.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Reserva heredada: si `clawhub/config.json` aún no existe pero `clawdhub/config.json` sí, la CLI reutiliza la ruta heredada
- anulación: `CLAWHUB_CONFIG_PATH` (heredado `CLAWDHUB_CONFIG_PATH`)

## Comandos

### `login` / `auth login`

- Predeterminado: abre el navegador en `<site>/cli/auth` y se completa mediante devolución de llamada de local loopback.
- Sin entorno gráfico: `clawhub login --token clh_...`
- Interactivo remoto/sin entorno gráfico: `clawhub login --device` imprime un código y espera mientras usted lo autoriza en `<site>/cli/device`.

### `whoami`

- Verifica el token almacenado mediante `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Agrega/elimina una skill de sus destacados.
- Llama a `POST /api/v1/stars/<slug>` y `DELETE /api/v1/stars/<slug>`.
- `--yes` omite la confirmación.

### `search <query...>`

- Llama a `/api/v1/search?q=...`.
- La búsqueda prioriza las coincidencias exactas de token de slug/nombre antes que la popularidad de descargas. Un token de slug independiente como `map` coincide con `personal-map` con más fuerza que la subcadena dentro de `amap`.
- Las descargas son una señal previa pequeña de popularidad, no una garantía de posición superior.
- Si una skill debería aparecer pero no aparece, ejecute `clawhub inspect <slug>` con la sesión iniciada para revisar los diagnósticos de moderación visibles para el propietario antes de cambiar el nombre de los metadatos.

### `explore`

- Lista las skills más recientes mediante `/api/v1/skills?limit=...&sort=createdAt` (ordenadas por `createdAt` desc).
- Marcas:
  - `--limit <n>` (1-200, predeterminado: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (predeterminado: newest)
  - `--json` (salida legible por máquina)
- Salida: `<slug>  v<version>  <age>  <summary>` (resumen truncado a 50 caracteres).

### `inspect <slug>`

- Obtiene los metadatos de la skill y los archivos de versión sin instalar.
- `--version <version>`: inspeccionar una versión específica (predeterminado: latest).
- `--tag <tag>`: inspeccionar una versión etiquetada (p. ej., `latest`).
- `--versions`: listar historial de versiones (primera página).
- `--limit <n>`: número máximo de versiones a listar (1-200).
- `--files`: listar archivos para la versión seleccionada.
- `--file <path>`: obtener contenido de archivo sin procesar (solo archivos de texto; límite de 200 KB).
- `--json`: salida legible por máquina.

### `install <slug>`

- Resuelve la versión más reciente mediante `/api/v1/skills/<slug>`.
- Descarga el zip mediante `/api/v1/download`.
- Extrae en `<workdir>/<dir>/<slug>`.
- Se niega a sobrescribir skills fijadas; ejecute `clawhub unpin <slug>` primero.
- Escribe:
  - `<workdir>/.clawhub/lock.json` (heredado `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (heredado `.clawdhub`)

### `uninstall <slug>`

- Elimina `<workdir>/<dir>/<slug>` y borra la entrada del archivo de bloqueo.
- Interactivo: solicita confirmación.
- No interactivo (`--no-input`): requiere `--yes`.

### `list`

- Lee `<workdir>/.clawhub/lock.json` (legado `.clawdhub`).
- Muestra `pinned` junto a las habilidades congeladas con `clawhub pin`, incluida la razón opcional.

### `pin <slug>`

- Marca una habilidad instalada como fijada en el lockfile.
- `--reason <text>` registra por qué la habilidad está congelada.
- Las habilidades fijadas se omiten con `update --all` y se rechazan con `update <slug>` directo.
- Las habilidades fijadas también rechazan `install --force` para que los bytes locales no se reemplacen accidentalmente.

### `unpin <slug>`

- Quita la fijación del lockfile de una habilidad instalada para que las actualizaciones futuras puedan modificarla.

### `update [slug]` / `update --all`

- Calcula la huella a partir de los archivos locales.
- Si la huella coincide con una versión conocida: no hay solicitud de confirmación.
- Si la huella no coincide:
  - se rechaza de forma predeterminada
  - sobrescribe con `--force` (o solicita confirmación, si es interactivo)
- Las habilidades fijadas nunca se actualizan con `--force`.
- `update <slug>` falla rápido para slugs fijados y te indica que primero ejecutes `clawhub unpin <slug>`.
- `update --all` omite los slugs fijados e imprime un resumen de lo que permaneció congelado.

### `skill publish <path>`

- Publica mediante `POST /api/v1/skills` (multipart).
- Requiere semver: `--version 1.2.3`.
- `--owner <handle>` publica bajo un identificador de editor de organización/usuario cuando el
  actor tiene acceso de editor.
- `--migrate-owner` mueve una habilidad existente a `--owner` mientras publica una nueva
  versión. Requiere acceso de administrador/propietario en ambos editores.
- El comportamiento de propietario y revisión se explica en `docs/publishing.md`.
- Publicar una habilidad significa que se lanza bajo `MIT-0` en ClawHub.
- Las habilidades publicadas se pueden usar, modificar y redistribuir libremente sin atribución.
- ClawHub no admite habilidades de pago ni precios por habilidad.
- `--clawscan-note <text>` añade una nota de ClawScan. Esta nota le da a ClawScan
  contexto para comportamientos que de otro modo podrían parecer inusuales, como acceso de red,
  acceso al host nativo o credenciales específicas del proveedor. La nota se almacena en
  la versión publicada.
- Alias legado: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Elimina temporalmente una habilidad (propietario, moderador o administrador).
- Llama a `DELETE /api/v1/skills/{slug}`.
- Las eliminaciones temporales iniciadas por el propietario reservan el slug durante 30 días; el comando imprime la hora de vencimiento.
- `--reason <text>` registra una nota de moderación en la habilidad y el registro de auditoría.
- `--note <text>` es un alias de `--reason`.
- `--yes` omite la confirmación.

### `undelete <slug>`

- Restaura una habilidad oculta (propietario, moderador o administrador).
- Llama a `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra una nota de moderación en la habilidad y el registro de auditoría.
- `--note <text>` es un alias de `--reason`.
- `--yes` omite la confirmación.

### `hide <slug>`

- Oculta una habilidad (propietario, moderador o administrador).
- Alias de `delete`.

### `unhide <slug>`

- Deja de ocultar una habilidad (propietario, moderador o administrador).
- Alias de `undelete`.

### `skill rename <slug> <new-slug>`

- Cambia el nombre de una habilidad propia y conserva el slug anterior como alias de redirección.
- Llama a `POST /api/v1/skills/{slug}/rename`.
- `--yes` omite la confirmación.

### `skill merge <source-slug> <target-slug>`

- Fusiona una habilidad propia con otra habilidad propia.
- El slug de origen deja de aparecer públicamente y se convierte en un alias de redirección al destino.
- Llama a `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` omite la confirmación.

### `transfer`

- Flujo de transferencia de propiedad.
- Las transferencias a identificadores de usuario crean una solicitud pendiente que acepta el destinatario.
- Las transferencias a identificadores de organización/editor se aplican inmediatamente solo cuando el actor tiene
  acceso de administrador tanto al propietario actual como al editor de destino.
- Subcomandos:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Explora o busca en el catálogo unificado de paquetes mediante `GET /api/v1/packages` y `GET /api/v1/packages/search`.
- Úsalo para plugins y otras entradas de familias de paquetes; `search` de nivel superior sigue siendo la superficie de búsqueda de habilidades.
- Indicadores:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, predeterminado: 25)
  - `--json`

Ejemplos:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Obtiene metadatos del paquete sin instalar.
- Úsalo para metadatos de plugins, compatibilidad, verificación, origen e inspección de versiones/archivos.
- `--version <version>`: inspecciona una versión específica (predeterminado: latest).
- `--tag <tag>`: inspecciona una versión etiquetada (p. ej., `latest`).
- `--versions`: lista el historial de versiones (primera página).
- `--limit <n>`: máximo de versiones que listar (1-100).
- `--files`: lista archivos de la versión seleccionada.
- `--file <path>`: obtiene contenido de archivo sin procesar (solo archivos de texto; límite de 200 KB).
- `--json`: salida legible por máquina.

### `package download <name>`

- Resuelve una versión de paquete mediante
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Descarga el artefacto desde el `downloadUrl` del resolvedor.
- Verifica el SHA-256 de ClawHub para todos los artefactos.
- Para artefactos ClawPack npm-pack, también verifica la integridad npm `sha512`,
  el shasum de npm y el nombre/versión de `package.json` del tarball.
- Las versiones ZIP legadas se descargan mediante la ruta ZIP legada.
- Indicadores:
  - `--version <version>`: descarga una versión específica.
  - `--tag <tag>`: descarga una versión etiquetada (predeterminado: `latest`).
  - `-o, --output <path>`: archivo o directorio de salida.
  - `--force`: sobrescribe un archivo de salida existente.
  - `--json`: salida legible por máquina.

Ejemplos:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Calcula el SHA-256 de ClawHub, la integridad npm `sha512` y el shasum de npm para un
  artefacto local.
- Con `--package`, resuelve los metadatos esperados desde ClawHub y compara el
  archivo local con los metadatos del artefacto publicado.
- Con indicadores de digest directos, verifica sin una consulta de red.
- Indicadores:
  - `--package <name>`: nombre del paquete para resolver los metadatos esperados del artefacto.
  - `--version <version>` o `--tag <tag>`: versión esperada del paquete.
  - `--sha256 <hex>`: SHA-256 esperado de ClawHub.
  - `--npm-integrity <sri>`: integridad npm esperada.
  - `--npm-shasum <sha1>`: shasum npm esperado.
  - `--json`: salida legible por máquina.

Ejemplos:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Elimina de forma lógica un paquete y todas las versiones.
- Requiere el propietario del paquete, un propietario/administrador de publicador de organización, moderador de la plataforma
  o administrador de la plataforma.
- Flags:
  - `--yes`: omite la confirmación.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Restaura un paquete eliminado de forma lógica y sus versiones.
- Requiere el propietario del paquete, un propietario/administrador de publicador de organización, moderador de la plataforma
  o administrador de la plataforma.
- Llama a `POST /api/v1/packages/{name}/undelete`.
- Flags:
  - `--yes`: omite la confirmación.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Transfiere un paquete a otro publicador.
- Requiere acceso de administrador tanto al propietario actual del paquete como al publicador
  de destino, salvo que lo realice un administrador de la plataforma.
- Los nombres de paquete con ámbito deben transferirse al propietario del ámbito correspondiente.
- Llama a `POST /api/v1/packages/{name}/transfer`.
- Flags:
  - `--to <owner>`: identificador del publicador de destino.
  - `--reason <text>`: motivo de auditoría opcional.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Comando autenticado para informar de un paquete a los moderadores.
- Llama a `POST /api/v1/packages/{name}/report`.
- Los informes se aplican al nivel del paquete, opcionalmente vinculados a una versión, y pasan a ser visibles
  para revisión por los moderadores.
- Los informes no ocultan automáticamente los paquetes ni bloquean las descargas por sí solos.
- Flags:
  - `--version <version>`: versión opcional del paquete para adjuntar al informe.
  - `--reason <text>`: motivo obligatorio del informe.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Comando de propietario para comprobar la visibilidad de moderación del paquete.
- Llama a `GET /api/v1/packages/{name}/moderation`.
- Muestra el estado actual de análisis del paquete, el recuento de informes abiertos, el estado de moderación manual
  de la última versión, el estado de bloqueo de descargas y los motivos de moderación.
- Flags:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Comprueba si un paquete está listo para el consumo futuro de OpenClaw.
- Llama a `GET /api/v1/packages/{name}/readiness`.
- Informa bloqueadores para el estado oficial, la disponibilidad de ClawPack, el resumen criptográfico del artefacto,
  la procedencia del código fuente, la compatibilidad con OpenClaw, los destinos de host, los metadatos de entorno
  y el estado de análisis.
- Flags:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Muestra el estado de migración orientado a operadores para un paquete que podría reemplazar un
  plugin incluido de OpenClaw.
- Llama al mismo endpoint de preparación calculada que `package readiness`, pero imprime
  el estado centrado en migración, la última versión, el estado de paquete oficial, las comprobaciones y
  los bloqueadores.
- Flags:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Publica un plugin de código o un plugin de paquete mediante `POST /api/v1/packages`.
- `<source>` acepta:
  - Ruta de carpeta local: `./my-plugin`
  - Tarball npm-pack local de ClawPack: `./my-plugin-1.2.3.tgz`
  - Repositorio de GitHub: `owner/repo` u `owner/repo@ref`
  - URL de GitHub: `https://github.com/owner/repo`
- Los metadatos se detectan automáticamente desde `package.json`, `openclaw.plugin.json` y
  marcadores reales de paquete de OpenClaw como `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` y `.cursor-plugin/plugin.json`.
- Las fuentes `.tgz` se tratan como ClawPack. La CLI sube los bytes exactos
  de npm-pack y usa el contenido extraído de `package/` solo para validación y
  rellenado previo de metadatos.
- Las carpetas de plugin de código se empaquetan en un tarball npm de ClawPack antes de la subida para que
  las instalaciones de OpenClaw puedan verificar el artefacto exacto. Las carpetas de plugin de paquete siguen
  usando la ruta de publicación de archivos extraídos.
- Para fuentes de GitHub, la atribución de código fuente se rellena automáticamente a partir del repositorio, el commit resuelto, la ref y la subruta.
- Para carpetas locales, la atribución de código fuente se detecta automáticamente desde git local cuando el remoto de origen apunta a GitHub.
- Los plugins de código externos deben declarar `openclaw.compat.pluginApi` y
  `openclaw.build.openclawVersion` explícitamente.
  `package.json.version` de nivel superior no se usa como alternativa para la validación de publicación.
- `--dry-run` previsualiza la carga útil de publicación resuelta sin subirla.
- `--json` emite salida legible por máquina para CI.
- `--owner <handle>` publica bajo un identificador de publicador de usuario u organización cuando el actor tiene acceso de publicador.
- `--clawscan-note <text>` añade una nota de ClawScan. Esta nota da a ClawScan
  contexto para comportamiento que de otro modo podría parecer inusual, como acceso a red,
  acceso a host nativo o credenciales específicas de proveedor. La nota se almacena en
  la versión publicada.
- Los nombres de paquete con ámbito deben coincidir con el propietario seleccionado. Consulta `docs/publishing.md`.
- Las flags existentes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) siguen funcionando como anulaciones.
- Los repositorios privados de GitHub requieren `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Flujo local recomendado

Usa `--dry-run` primero para poder confirmar los metadatos resueltos del paquete y
la atribución de código fuente antes de crear una versión real:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flujo de carpeta local

Para plugins de código, la publicación de carpeta crea y sube un artefacto ClawPack desde
la carpeta del paquete:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` mínimo para `--family code-plugin`

Los plugins de código externos necesitan una pequeña cantidad de metadatos de OpenClaw en
`package.json`. Este manifiesto mínimo basta para una publicación correcta:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Campos obligatorios:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Notas:

- `package.json.version` es la versión de publicación de tu paquete, pero no se usa como
  alternativa para la validación de compatibilidad/compilación de OpenClaw.
- `openclaw.hostTargets` y `openclaw.environment` son metadatos opcionales.
  ClawHub puede mostrarlos cuando estén presentes, pero no son obligatorios para publicar.
- `openclaw.compat.minGatewayVersion` y
  `openclaw.build.pluginSdkVersion` son extras opcionales si quieres publicar
  metadatos de compatibilidad más detallados.
- Si usas una versión antigua de la CLI `clawhub`, actualízala antes de publicar para que
  las comprobaciones locales previas se ejecuten antes de la subida.

#### GitHub Actions

ClawHub también incluye un flujo de trabajo reutilizable oficial en
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/c51cfe2459f3482c315a7c8c71b2efd2637bb0e8/.github/workflows/package-publish.yml)
para repositorios de plugins.

Configuración típica del llamador:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Notas:

- El flujo de trabajo reutilizable usa de forma predeterminada `source` como el repositorio llamador.
- Para monorepos, pasa `source_path` para que el flujo de trabajo publique la carpeta
  del paquete del plugin, por ejemplo `source_path: extensions/codex`.
- Fija el flujo de trabajo reutilizable a una etiqueta estable o a un SHA de commit completo. No ejecutes publicaciones de versiones desde `@main`.
- `pull_request` debe usar `dry_run: true` para que CI no contamine el estado.
- Las publicaciones reales deben limitarse a eventos de confianza como `workflow_dispatch` o envíos de etiquetas.
- La publicación de confianza sin un secreto solo funciona en `workflow_dispatch`; los envíos de etiquetas siguen necesitando `clawhub_token`.
- Mantén `clawhub_token` disponible para la primera publicación, paquetes no confiables o publicaciones de emergencia.
- El flujo de trabajo sube el resultado JSON como un artefacto y lo expone como salidas del flujo de trabajo.

### `sync`

- Busca carpetas locales de Skills y publica las nuevas o modificadas.
- Las raíces pueden ser cualquier carpeta: un directorio de Skills o una sola carpeta de Skill con `SKILL.md`.
- Añade automáticamente raíces de Skills de Clawdbot cuando `~/.clawdbot/clawdbot.json` está presente:
  - `agent.workspace/skills` (agente principal)
  - `routing.agents.*.workspace/skills` (por agente)
  - `~/.clawdbot/skills` (compartidas)
  - `skills.load.extraDirs` (paquetes compartidos)
- Respeta `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` y `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Flags:
  - `--root <dir...>` raíces de análisis adicionales
  - `--all` subir sin preguntar
  - `--dry-run` mostrar solo el plan
  - `--bump patch|minor|major` (predeterminado: patch)
  - `--changelog <text>` (no interactivo)
  - `--tags a,b,c` (predeterminado: latest)
  - `--concurrency <n>` (predeterminado: 4)

Telemetría:

- Se envía durante `sync` cuando se ha iniciado sesión, salvo que `CLAWHUB_DISABLE_TELEMETRY=1` (heredado `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Detalles: `docs/telemetry.md`.
