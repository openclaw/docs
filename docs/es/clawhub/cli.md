---
read_when:
    - Uso de la CLI de ClawHub
    - Depuración de la instalación, la actualización, la publicación o la sincronización
summary: 'Referencia de CLI: comandos, opciones, configuración, archivo de bloqueo, comportamiento de sincronización.'
x-i18n:
    generated_at: "2026-05-11T20:23:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b07c0a4cf2896ac8ffbaf9d65b913523a565a7030c9c255c0d27e0af7ad28b4
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Paquete CLI: `clawhub`, binario: `clawhub`.

Instálalo globalmente con npm o pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Luego verifícalo:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Banderas globales

- `--workdir <dir>`: directorio de trabajo (predeterminado: cwd; recurre al espacio de trabajo de Clawdbot si está configurado)
- `--dir <dir>`: directorio de instalación bajo el directorio de trabajo (predeterminado: `skills`)
- `--site <url>`: URL base para el inicio de sesión en el navegador (predeterminado: `https://clawhub.ai`)
- `--registry <url>`: URL base de la API (predeterminado: detectada; si no, `https://clawhub.ai`)
- `--no-input`: desactiva los prompts

Equivalentes de entorno:

- `CLAWHUB_SITE` (legado `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legado `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legado `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI respeta las variables de entorno estándar de proxy HTTP para sistemas detrás de
proxies corporativos o redes restringidas:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Cuando cualquiera de estas variables está definida, la CLI enruta las solicitudes salientes a través
del proxy especificado. `HTTPS_PROXY` se usa para solicitudes HTTPS, `HTTP_PROXY`
para HTTP sin cifrar. `NO_PROXY` / `no_proxy` se respeta para omitir el proxy en
hosts o dominios específicos.

Esto es obligatorio en sistemas donde las conexiones salientes directas están bloqueadas
(p. ej., contenedores Docker, VPS de Hetzner con Internet solo mediante proxy, firewalls
corporativos).

Ejemplo:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Cuando no hay ninguna variable de proxy definida, el comportamiento no cambia (conexiones directas).

## Archivo de configuración

Almacena tu token de API y la URL de registro en caché.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Recurso legado: si `clawhub/config.json` aún no existe pero `clawdhub/config.json` sí, la CLI reutiliza la ruta legada
- sobrescritura: `CLAWHUB_CONFIG_PATH` (legado `CLAWDHUB_CONFIG_PATH`)

## Comandos

### `login` / `auth login`

- Predeterminado: abre el navegador en `<site>/cli/auth` y completa mediante una devolución de llamada de loopback.
- Sin interfaz gráfica: `clawhub login --token clh_...`
- Remoto/sin interfaz gráfica interactivo: `clawhub login --device` imprime un código y espera mientras lo autorizas en `<site>/cli/device`.

### `whoami`

- Verifica el token almacenado mediante `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Agrega o quita una habilidad de tus destacados.
- Llama a `POST /api/v1/stars/<slug>` y `DELETE /api/v1/stars/<slug>`.
- `--yes` omite la confirmación.

### `search <query...>`

- Llama a `/api/v1/search?q=...`.
- La búsqueda favorece las coincidencias exactas de tokens de slug/nombre antes que la popularidad de descargas. Un token de slug independiente como `map` coincide con `personal-map` con más fuerza que con la subcadena dentro de `amap`.
- Las descargas son una pequeña señal previa de popularidad, no una garantía de la primera posición.
- Si una habilidad debería aparecer pero no aparece, ejecuta `clawhub inspect <slug>` con sesión iniciada para revisar los diagnósticos de moderación visibles para el propietario antes de renombrar los metadatos.

### `explore`

- Lista las habilidades más recientes mediante `/api/v1/skills?limit=...&sort=createdAt` (ordenadas por `createdAt` desc).
- Banderas:
  - `--limit <n>` (1-200, predeterminado: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (predeterminado: newest)
  - `--json` (salida legible por máquina)
- Salida: `<slug>  v<version>  <age>  <summary>` (resumen truncado a 50 caracteres).

### `inspect <slug>`

- Obtiene los metadatos de la habilidad y los archivos de versión sin instalar.
- `--version <version>`: inspecciona una versión específica (predeterminado: la más reciente).
- `--tag <tag>`: inspecciona una versión etiquetada (p. ej., `latest`).
- `--versions`: lista el historial de versiones (primera página).
- `--limit <n>`: número máximo de versiones que listar (1-200).
- `--files`: lista los archivos de la versión seleccionada.
- `--file <path>`: obtiene el contenido sin procesar del archivo (solo archivos de texto; límite de 200 KB).
- `--json`: salida legible por máquina.

### `install <slug>`

- Resuelve la versión más reciente mediante `/api/v1/skills/<slug>`.
- Descarga el zip mediante `/api/v1/download`.
- Extrae en `<workdir>/<dir>/<slug>`.
- Rechaza sobrescribir habilidades ancladas; ejecuta primero `clawhub unpin <slug>`.
- Escribe:
  - `<workdir>/.clawhub/lock.json` (legado `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legado `.clawdhub`)

### `uninstall <slug>`

- Elimina `<workdir>/<dir>/<slug>` y borra la entrada del archivo de bloqueo.
- Interactivo: pide confirmación.
- No interactivo (`--no-input`): requiere `--yes`.

### `list`

- Lee `<workdir>/.clawhub/lock.json` (`.clawdhub` heredado).
- Muestra `pinned` junto a las Skills congeladas con `clawhub pin`, incluida la razón opcional.

### `pin <slug>`

- Marca una Skill instalada como fijada en el lockfile.
- `--reason <text>` registra por qué la Skill está congelada.
- Las Skills fijadas se omiten con `update --all` y se rechazan con `update <slug>` directo.
- Las Skills fijadas también rechazan `install --force` para que los bytes locales no se puedan reemplazar accidentalmente.

### `unpin <slug>`

- Elimina la fijación del lockfile de una Skill instalada para que las actualizaciones futuras puedan modificarla.

### `update [slug]` / `update --all`

- Calcula la huella a partir de los archivos locales.
- Si la huella coincide con una versión conocida: no hay prompt.
- Si la huella no coincide:
  - rechaza de forma predeterminada
  - sobrescribe con `--force` (o prompt, si es interactivo)
- Las Skills fijadas nunca se actualizan con `--force`.
- `update <slug>` falla rápido para slugs fijados y te indica que ejecutes primero `clawhub unpin <slug>`.
- `update --all` omite los slugs fijados e imprime un resumen de lo que permaneció congelado.

### `skill publish <path>`

- Publica mediante `POST /api/v1/skills` (multipart).
- Requiere semver: `--version 1.2.3`.
- `--owner <handle>` publica bajo un identificador de publicador de organización/usuario cuando el
  actor tiene acceso de publicador.
- `--migrate-owner` mueve una Skill existente a `--owner` mientras publica una nueva
  versión. Requiere acceso de administrador/propietario en ambos publicadores.
- El comportamiento de propietario y revisión se explica en `docs/publishing.md`.
- Publicar una Skill significa que se publica bajo `MIT-0` en ClawHub.
- Las Skills publicadas son libres de usar, modificar y redistribuir sin atribución.
- ClawHub no admite Skills de pago ni precios por Skill.
- Alias heredado: `publish <path>`.

### `delete <slug>`

- Elimina de forma reversible una Skill (propietario, moderador o administrador).
- Llama a `DELETE /api/v1/skills/{slug}`.
- Las eliminaciones reversibles iniciadas por el propietario reservan el slug durante 30 días; el comando imprime la hora de expiración.
- `--reason <text>` registra una nota de moderación en la Skill y en el registro de auditoría.
- `--note <text>` es un alias de `--reason`.
- `--yes` omite la confirmación.

### `undelete <slug>`

- Restaura una Skill oculta (propietario, moderador o administrador).
- Llama a `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra una nota de moderación en la Skill y en el registro de auditoría.
- `--note <text>` es un alias de `--reason`.
- `--yes` omite la confirmación.

### `hide <slug>`

- Oculta una Skill (propietario, moderador o administrador).
- Alias de `delete`.

### `unhide <slug>`

- Muestra una Skill (propietario, moderador o administrador).
- Alias de `undelete`.

### `skill rename <slug> <new-slug>`

- Cambia el nombre de una Skill propia y conserva el slug anterior como alias de redirección.
- Llama a `POST /api/v1/skills/{slug}/rename`.
- `--yes` omite la confirmación.

### `skill merge <source-slug> <target-slug>`

- Fusiona una Skill propia con otra Skill propia.
- El slug de origen deja de listarse públicamente y se convierte en un alias de redirección al destino.
- Llama a `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` omite la confirmación.

### `skill rescan <slug>`

- Solicita un nuevo análisis de seguridad para la última versión publicada de la Skill.
- Los propietarios y administradores de publicador pueden volver a analizar sus propias Skills hasta el límite de
  recuperación por versión.
- Los moderadores y administradores de la plataforma pueden volver a analizar cualquier Skill y no están bloqueados por el
  límite de recuperación del propietario, aunque solo puede ejecutarse un nuevo análisis a la vez por versión.
- Llama a `POST /api/v1/skills/{slug}/rescan`.
- Flags:
  - `--yes`: omite la confirmación.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- Flujo de transferencia de propiedad.
- Las transferencias a identificadores de usuario crean una solicitud pendiente que el destinatario acepta.
- Las transferencias a identificadores de organización/publicador se aplican inmediatamente solo cuando el actor tiene
  acceso de administrador tanto al propietario actual como al publicador de destino.
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

- Navega o busca en el catálogo unificado de paquetes mediante `GET /api/v1/packages` y `GET /api/v1/packages/search`.
- Usa esto para plugins y otras entradas de familias de paquetes; `search` de nivel superior sigue siendo la superficie de búsqueda de Skills.
- Flags:
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
- Usa esto para metadatos, compatibilidad, verificación, origen e inspección de versiones/archivos de plugins.
- `--version <version>`: inspecciona una versión específica (predeterminado: latest).
- `--tag <tag>`: inspecciona una versión etiquetada (por ejemplo, `latest`).
- `--versions`: lista el historial de versiones (primera página).
- `--limit <n>`: versiones máximas para listar (1-100).
- `--files`: lista los archivos de la versión seleccionada.
- `--file <path>`: obtiene el contenido sin procesar de un archivo (solo archivos de texto; límite de 200 KB).
- `--json`: salida legible por máquina.

### `package download <name>`

- Resuelve una versión de paquete mediante
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Descarga el artefacto desde el `downloadUrl` del resolutor.
- Verifica el SHA-256 de ClawHub para todos los artefactos.
- Para artefactos npm-pack de ClawPack, también verifica la integridad npm `sha512`,
  el shasum npm y el nombre/versión de `package.json` del tarball.
- Las versiones ZIP heredadas se descargan mediante la ruta ZIP heredada.
- Flags:
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

- Calcula el SHA-256 de ClawHub, la integridad npm `sha512` y el shasum npm para un
  artefacto local.
- Con `--package`, resuelve los metadatos esperados desde ClawHub y compara el
  archivo local con los metadatos del artefacto publicado.
- Con flags de resumen directos, verifica sin una consulta de red.
- Flags:
  - `--package <name>`: nombre del paquete para resolver los metadatos esperados del artefacto.
  - `--version <version>` o `--tag <tag>`: versión esperada del paquete.
  - `--sha256 <hex>`: SHA-256 de ClawHub esperado.
  - `--npm-integrity <sri>`: integridad npm esperada.
  - `--npm-shasum <sha1>`: shasum npm esperado.
  - `--json`: salida legible por máquina.

Ejemplos:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Elimina de forma lógica un paquete y todas sus versiones.
- Requiere ser propietario del paquete, propietario/administrador de un publicador de organización, moderador de la plataforma
  o administrador de la plataforma.
- Opciones:
  - `--yes`: omite la confirmación.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Restaura un paquete y sus versiones eliminados de forma lógica.
- Requiere ser propietario del paquete, propietario/administrador de un publicador de organización, moderador de la plataforma
  o administrador de la plataforma.
- Llama a `POST /api/v1/packages/{name}/undelete`.
- Opciones:
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
- Opciones:
  - `--to <owner>`: identificador del publicador de destino.
  - `--reason <text>`: motivo opcional de auditoría.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package rescan <name>`

- Solicita un nuevo análisis de seguridad para la última versión publicada del paquete.
- Los propietarios y administradores del publicador pueden volver a analizar sus propios paquetes hasta el límite de recuperación
  por versión.
- Los moderadores y administradores de la plataforma pueden volver a analizar cualquier paquete y no quedan bloqueados por
  el límite de recuperación del propietario, aunque solo puede ejecutarse un nuevo análisis a la vez por versión.
- Llama a `POST /api/v1/packages/{name}/rescan`.
- Opciones:
  - `--yes`: omite la confirmación.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- Comando autenticado para reportar un paquete a los moderadores.
- Llama a `POST /api/v1/packages/{name}/report`.
- Los reportes son a nivel de paquete, pueden vincularse opcionalmente a una versión y pasan a ser visibles
  para que los moderadores los revisen.
- Los reportes no ocultan automáticamente los paquetes ni bloquean las descargas por sí mismos.
- Opciones:
  - `--version <version>`: versión opcional del paquete que se adjuntará al reporte.
  - `--reason <text>`: motivo requerido del reporte.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- Comando de propietario/publicador para apelar la moderación de una versión.
- Llama a `POST /api/v1/packages/{name}/appeal`.
- Se aceptan apelaciones para versiones en cuarentena, revocadas, sospechosas o maliciosas.
- Opciones:
  - `--version <version>`: versión requerida del paquete.
  - `--message <text>`: mensaje de apelación requerido.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- Comando de propietario para comprobar la visibilidad de moderación del paquete.
- Llama a `GET /api/v1/packages/{name}/moderation`.
- Muestra el estado actual de análisis del paquete, el número de reportes abiertos, el estado de moderación manual de la última versión,
  el estado de bloqueo de descargas y los motivos de moderación.
- Opciones:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Comprueba si un paquete está listo para el consumo futuro por OpenClaw.
- Llama a `GET /api/v1/packages/{name}/readiness`.
- Reporta bloqueadores para el estado oficial, la disponibilidad de ClawPack, el resumen del artefacto,
  la procedencia del código fuente, la compatibilidad con OpenClaw, los destinos de host, los metadatos de entorno
  y el estado de análisis.
- Opciones:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Muestra el estado de migración orientado al operador para un paquete que puede reemplazar un
  plugin incluido de OpenClaw.
- Llama al mismo endpoint de preparación calculada que `package readiness`, pero imprime
  estado centrado en la migración, última versión, estado de paquete oficial, comprobaciones y
  bloqueadores.
- Opciones:
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
  marcadores reales de paquete OpenClaw como `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` y `.cursor-plugin/plugin.json`.
- Las fuentes `.tgz` se tratan como ClawPack. La CLI sube los bytes exactos de npm-pack
  y usa el contenido extraído de `package/` solo para validación y prerrelleno de
  metadatos.
- Las carpetas de plugin de código se empaquetan en un tarball npm de ClawPack antes de la subida para que
  las instalaciones de OpenClaw puedan verificar el artefacto exacto. Las carpetas de plugin de paquete siguen
  usando la ruta de publicación de archivos extraídos.
- Para fuentes de GitHub, la atribución de origen se rellena automáticamente desde el repositorio, el commit resuelto, la ref y la subruta.
- Para carpetas locales, la atribución de origen se detecta automáticamente desde git local cuando el remoto de origen apunta a GitHub.
- Los plugins de código externos deben declarar `openclaw.compat.pluginApi` y
  `openclaw.build.openclawVersion` explícitamente.
  `package.json.version` de nivel superior no se usa como alternativa para la validación de publicación.
- `--dry-run` previsualiza la carga útil de publicación resuelta sin subirla.
- `--json` emite salida legible por máquina para CI.
- `--owner <handle>` publica bajo un identificador de publicador de usuario u organización cuando el actor tiene acceso de publicador.
- Los nombres de paquete con ámbito deben coincidir con el propietario seleccionado. Consulta `docs/publishing.md`.
- Las opciones existentes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) siguen funcionando como sobrescrituras.
- Los repositorios privados de GitHub requieren `GITHUB_TOKEN`.

#### Flujo local recomendado

Usa `--dry-run` primero para poder confirmar los metadatos de paquete resueltos y
la atribución de origen antes de crear una versión activa:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flujo de carpeta local

Para plugins de código, la publicación de carpeta construye y sube un artefacto ClawPack desde
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

Campos requeridos:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Notas:

- `package.json.version` es la versión de lanzamiento de tu paquete, pero no se usa como
  alternativa para la validación de compatibilidad/compilación de OpenClaw.
- `openclaw.hostTargets` y `openclaw.environment` son metadatos opcionales.
  ClawHub puede mostrarlos cuando estén presentes, pero no son obligatorios para publicar.
- `openclaw.compat.minGatewayVersion` y
  `openclaw.build.pluginSdkVersion` son extras opcionales si quieres publicar
  metadatos de compatibilidad más detallados.
- Si estás usando una versión anterior de la CLI `clawhub`, actualiza antes de publicar para que
  las comprobaciones previas locales se ejecuten antes de la subida.

#### GitHub Actions

ClawHub también incluye un flujo de trabajo reutilizable oficial en
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8ed84813808a116d30aebe4357bb367b0786bb9c/.github/workflows/package-publish.yml)
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

- El flujo de trabajo reutilizable establece `source` de forma predeterminada en el repositorio llamador.
- Para monorepos, pasa `source_path` para que el flujo de trabajo publique la carpeta
  del paquete del plugin, por ejemplo `source_path: extensions/codex`.
- Fija el flujo de trabajo reutilizable a una etiqueta estable o a un SHA de commit completo. No ejecutes publicaciones de lanzamiento desde `@main`.
- `pull_request` debe usar `dry_run: true` para que CI no genere cambios persistentes.
- Las publicaciones reales deben limitarse a eventos de confianza como `workflow_dispatch` o pushes de etiquetas.
- La publicación de confianza sin secreto solo funciona en `workflow_dispatch`; los pushes de etiquetas siguen necesitando `clawhub_token`.
- Mantén `clawhub_token` disponible para la primera publicación, paquetes no confiables o publicaciones de emergencia.
- El flujo de trabajo sube el resultado JSON como artefacto y lo expone como salidas del flujo de trabajo.

### `sync`

- Busca carpetas locales de Skills y publica las nuevas o modificadas.
- Las raíces pueden ser cualquier carpeta: un directorio de Skills o una sola carpeta de Skill con `SKILL.md`.
- Añade automáticamente raíces de Skills de Clawdbot cuando `~/.clawdbot/clawdbot.json` está presente:
  - `agent.workspace/skills` (agente principal)
  - `routing.agents.*.workspace/skills` (por agente)
  - `~/.clawdbot/skills` (compartidas)
  - `skills.load.extraDirs` (paquetes compartidos)
- Respeta `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` y `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Opciones:
  - `--root <dir...>` raíces de análisis adicionales
  - `--all` subir sin pedir confirmación
  - `--dry-run` mostrar solo el plan
  - `--bump patch|minor|major` (predeterminado: patch)
  - `--changelog <text>` (no interactivo)
  - `--tags a,b,c` (predeterminado: latest)
  - `--concurrency <n>` (predeterminado: 4)

Telemetría:

- Se envía durante `sync` al iniciar sesión, salvo que `CLAWHUB_DISABLE_TELEMETRY=1` (heredado `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Detalles: `docs/telemetry.md`.
