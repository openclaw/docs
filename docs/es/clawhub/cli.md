---
read_when:
    - Uso de la CLI de ClawHub
    - Depuración de instalación, actualización o publicación
summary: 'Referencia de la CLI: comandos, flags, configuración y comportamiento del lockfile.'
x-i18n:
    generated_at: "2026-07-01T05:27:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4467e589a4892d513e4ca715b73a81147abb59cb7706b0068a11af6c95ea08f9
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Paquete de CLI: `clawhub`, binario: `clawhub`.

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

## Indicadores globales

- `--workdir <dir>`: directorio de trabajo (predeterminado: cwd; recurre al espacio de trabajo de Clawdbot si está configurado)
- `--dir <dir>`: directorio de instalación bajo workdir (predeterminado: `skills`)
- `--site <url>`: URL base para el inicio de sesión en el navegador (predeterminado: `https://clawhub.ai`)
- `--registry <url>`: URL base de la API (predeterminado: detectada; si no, `https://clawhub.ai`)
- `--no-input`: desactiva los prompts

Equivalentes de entorno:

- `CLAWHUB_SITE` (legado `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legado `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legado `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI respeta las variables de entorno de proxy HTTP estándar para sistemas detrás de
proxies corporativos o redes restringidas:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Cuando cualquiera de estas variables está definida, la CLI enruta las solicitudes salientes a través
del proxy especificado. `HTTPS_PROXY` se usa para solicitudes HTTPS, `HTTP_PROXY`
para HTTP simple. `NO_PROXY` / `no_proxy` se respeta para omitir el proxy para
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

Cuando no hay ninguna variable de proxy definida, el comportamiento no cambia (conexiones directas).

## Archivo de configuración

Almacena tu token de API + la URL de registro en caché.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Recurso legado: si `clawhub/config.json` aún no existe pero `clawdhub/config.json` sí, la CLI reutiliza la ruta heredada
- anulación: `CLAWHUB_CONFIG_PATH` (legado `CLAWDHUB_CONFIG_PATH`)

## Comandos

### `login` / `auth login`

- Predeterminado: abre el navegador en `<site>/cli/auth` y completa mediante una devolución de llamada de loopback.
- Sin interfaz: `clawhub login --token clh_...`
- Remoto/interactivo sin interfaz: `clawhub login --device` imprime un código y espera mientras lo autorizas en `<site>/cli/device`.

### `whoami`

- Verifica el token almacenado mediante `/api/v1/whoami`.

### `token`

- Imprime el token de API almacenado en stdout.
- Útil para canalizar un token de inicio de sesión local hacia comandos de configuración de secretos de CI.

### `star <skill>` / `unstar <skill>`

- Agrega/elimina una habilidad de tus destacados.
- Llama a `POST /api/v1/stars/<slug>` y `DELETE /api/v1/stars/<slug>`.
- `--yes` omite la confirmación.

### `search <query...>`

- Llama a `/api/v1/search?q=...`.
- La salida incluye el slug de la habilidad, el identificador del propietario, el nombre visible y la puntuación de relevancia.
- La búsqueda favorece coincidencias exactas de tokens de slug/nombre antes que la popularidad de descargas. Un token de slug independiente como `map` coincide con `personal-map` con más fuerza que con la subcadena dentro de `amap`.
- La popularidad es un pequeño indicio de ordenamiento, no una garantía de primera posición.
- Si una habilidad debería aparecer pero no aparece, ejecuta `clawhub inspect @owner/slug` con sesión iniciada para revisar diagnósticos de moderación visibles para el propietario antes de renombrar metadatos.

### `explore`

- Lista las habilidades más recientes mediante `/api/v1/skills?limit=...&sort=createdAt` (ordenadas por `createdAt` desc).
- Indicadores:
  - `--limit <n>` (1-200, predeterminado: 25)
  - `--sort newest|updated|rating|downloads|trending` (predeterminado: newest). Los alias de ordenamiento de instalación heredados siguen funcionando por compatibilidad.
  - `--json` (salida legible por máquina)
- Salida: `<slug>  v<version>  <age>  <summary>` (resumen truncado a 50 caracteres).

### `inspect @owner/slug`

- Obtiene metadatos de habilidades y archivos de versión sin instalar.
- `--version <version>`: inspecciona una versión específica (predeterminado: latest).
- `--tag <tag>`: inspecciona una versión etiquetada (p. ej., `latest`).
- `--versions`: lista el historial de versiones (primera página).
- `--limit <n>`: versiones máximas a listar (1-200).
- `--files`: lista archivos para la versión seleccionada.
- `--file <path>`: obtiene contenido de archivo sin procesar (solo archivos de texto; límite de 200 KB).
- `--json`: salida legible por máquina.

### `install @owner/slug`

- Resuelve la versión más reciente para el propietario y la habilidad nombrados.
- Descarga zip mediante `/api/v1/download`.
- Extrae en `<workdir>/<dir>/<slug>`.
- Se niega a sobrescribir habilidades fijadas; ejecuta primero `clawhub unpin <skill>`.
- Escribe:
  - `<workdir>/.clawhub/lock.json` (legado `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legado `.clawdhub`)

### `uninstall <skill>`

- Elimina `<workdir>/<dir>/<slug>` y borra la entrada del lockfile.
- Envía telemetría de mejor esfuerzo con sesión iniciada para que los recuentos de instalación actuales puedan
  desactivarse.
- Interactivo: pide confirmación.
- No interactivo (`--no-input`): requiere `--yes`.

### `list`

- Lee `<workdir>/.clawhub/lock.json` (legado `.clawdhub`).
- Muestra `pinned` junto a las habilidades congeladas con `clawhub pin`, incluida la razón opcional.

### `pin <skill>`

- Marca una habilidad instalada como fijada en el lockfile.
- `--reason <text>` registra por qué la habilidad está congelada.
- Las habilidades fijadas se omiten en `update --all` y se rechazan en `update <skill>` directo.
- Las habilidades fijadas también rechazan `install --force` para que los bytes locales no puedan reemplazarse accidentalmente.

### `unpin <skill>`

- Elimina la fijación del lockfile de una habilidad instalada para que futuras actualizaciones puedan modificarla.

### `update [@owner/slug]` / `update --all`

- Calcula la huella a partir de archivos locales.
- Si la huella coincide con una versión conocida: no hay prompt.
- Si la huella no coincide:
  - se niega de forma predeterminada
  - sobrescribe con `--force` (o prompt, si es interactivo)
- Las habilidades fijadas nunca se actualizan con `--force`.
- `update <skill>` falla rápido para habilidades fijadas y te indica ejecutar primero `clawhub unpin <skill>`.
- `update --all` omite slugs fijados e imprime un resumen de lo que quedó congelado.

### `skill publish <path>`

- Compara la huella del paquete local con ClawHub y sale correctamente cuando
  el contenido ya está publicado.
- Las habilidades nuevas usan `1.0.0` de forma predeterminada; las habilidades modificadas usan de forma predeterminada la siguiente versión
  de parche.
- `--version <version>` selecciona explícitamente una versión y publica incluso cuando el
  contenido coincide con una versión existente.
- `--dry-run` resuelve la publicación sin subir; `--json` imprime un resultado
  legible por máquina.
- `--owner <handle>` publica bajo un identificador de publicador de organización/usuario cuando el
  actor tiene acceso de publicador.
- `--migrate-owner` mueve una habilidad existente a `--owner` mientras publica una nueva
  versión. Requiere acceso de administrador/propietario en ambos publicadores.
- El comportamiento de propietario y revisión se explica en `docs/publishing.md`.
- Publicar una habilidad significa que se lanza bajo `MIT-0` en ClawHub.
- Las habilidades publicadas son libres de usar, modificar y redistribuir sin atribución.
- ClawHub no admite habilidades pagas ni precios por habilidad.
- Alias legado: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

El workflow reutilizable de ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
llama a `skill publish` para un `skill_path`, o para cada carpeta de habilidad inmediata
bajo `root` (predeterminado: `skills`). Omite habilidades sin cambios y usa el
mismo comportamiento automático de versión de parche.

Define `dry_run: true` para previsualizar sin un token. Las publicaciones reales requieren el
secreto `clawhub_token`.

### `sync`

- Escanea el workdir actual, el directorio de habilidades configurado y cualquier
  carpeta `--root <dir>` en busca de carpetas de habilidades locales que contengan `SKILL.md` o
  `skill.md`.
- Compara la huella de cada habilidad local con ClawHub y publica solo habilidades nuevas o
  modificadas.
- Las habilidades nuevas se publican como `1.0.0`; las habilidades modificadas publican la siguiente versión de parche
  de forma predeterminada. Usa `--bump minor|major` para lotes de actualización que deberían avanzar por un
  paso semver mayor.
- `--dry-run` muestra el plan de publicación sin subir; `--json` imprime un plan
  legible por máquina.
- `--all` publica cada habilidad nueva o modificada sin preguntar. Sin
  `--all`, las terminales interactivas te permiten seleccionar las habilidades que se publicarán.
- `--owner <handle>` publica bajo un identificador de publicador de organización/usuario cuando el
  actor tiene acceso de publicador.
- `sync` es solo publicación unidireccional. No instala, actualiza, descarga ni
  reporta telemetría de instalación/descarga.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Requiere `clawhub login`.
- Ejecuta ClawHub ClawScan mediante `POST /api/v1/skills/-/scan`, luego sondea hasta que el escaneo sea terminal.
- Los escaneos son asíncronos y pueden tardar en completarse. Mientras están en cola, el spinner de terminal muestra la posición actual priorizada del escaneo y cuántos escaneos hay por delante.
- Los escaneos publicados requieren propiedad o acceso de gestión de publicador. Moderadores/administradores pueden usar el mismo backend mediante `clawhub-admin`.
- `--update` solo es válido con `--slug`; escribe resultados de escaneo publicado correctos de vuelta en la versión seleccionada.
- `--output <file.zip>` descarga el archivo completo del informe con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` y `README.md`.
- `--json` imprime la respuesta de sondeo completa para automatización.
- Los escaneos de rutas locales ya no son compatibles. Sube una nueva versión y luego usa `scan download` para recuperar los resultados de escaneo almacenados para esa versión enviada.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Requiere `clawhub login`.
- Descarga el ZIP de informe de escaneo almacenado para una versión enviada de habilidad o plugin, incluidas versiones bloqueadas u ocultas por las comprobaciones de seguridad de ClawHub.
- Las descargas de habilidades usan el slug de la habilidad y usan `--kind skill` de forma predeterminada.
- Las descargas de plugins usan el nombre del paquete y requieren `--kind plugin`.
- `--version` es obligatorio para que los autores inspeccionen la versión enviada exacta que ClawHub bloqueó.
- `--output <file.zip>` elige la ruta de destino.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub incluye un workflow reutilizable oficial en
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/skill-publish.yml)
para repos de habilidades y repos de catálogo.

Configuración típica de catálogo:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Notas:

- `root` usa `skills` de forma predeterminada para repos de catálogo.
- Pasa `skill_path: skills/review-helper` para procesar una carpeta de habilidad.
- `owner` se asigna al indicador de CLI `--owner`; omítelo para publicar como el usuario autenticado.
- La publicación de habilidades V1 usa `clawhub_token`; la publicación confiable con GitHub OIDC es solo para paquetes por ahora.

### `delete <skill>`

- Sin `--version`, elimina de forma reversible una skill (propietario, moderador o administrador).
- Llama a `DELETE /api/v1/skills/{slug}`.
- Las eliminaciones reversibles iniciadas por el propietario reservan el slug durante 30 días; el comando imprime la hora de expiración.
- `--version <version>` elimina permanentemente una versión propia que no sea la más reciente mediante una ruta fail-closed,
  específica de la versión.
  Las versiones eliminadas no se pueden restaurar ni volver a publicar. Publica un reemplazo antes de eliminar la
  versión actual más reciente. El personal de la plataforma no omite la propiedad en este flujo solo de versión.
- `--reason <text>` registra una nota de moderación en una eliminación reversible de toda la skill y en el registro de auditoría.
- `--note <text>` es un alias de `--reason`.
- `--yes` omite la confirmación.

### `undelete <skill>`

- Restaura una skill oculta (propietario, moderador o administrador).
- No hay restauración de versiones eliminadas; las versiones eliminadas permanentemente no se pueden restaurar.
- Llama a `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra una nota de moderación en la skill y en el registro de auditoría.
- `--note <text>` es un alias de `--reason`.
- `--yes` omite la confirmación.

### `hide <skill>`

- Oculta una skill (propietario, moderador o administrador).
- Alias de `delete`.

### `unhide <skill>`

- Muestra una skill (propietario, moderador o administrador).
- Alias de `undelete`.

### `skill rename <skill> <new-name>`

- Cambia el nombre de una skill propia y conserva el slug anterior como alias de redirección.
- Llama a `POST /api/v1/skills/{slug}/rename`.
- `--yes` omite la confirmación.

### `skill merge <source> <target>`

- Fusiona una skill propia con otra skill propia.
- El slug de origen deja de aparecer públicamente y se convierte en un alias de redirección al destino.
- Llama a `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` omite la confirmación.

### `transfer`

- Flujo de transferencia de propiedad.
- Las transferencias a identificadores de usuario crean una solicitud pendiente que el destinatario acepta.
- Las transferencias a identificadores de organización/publicador se aplican de inmediato solo cuando el actor tiene
  acceso de administrador tanto al propietario actual como al publicador de destino.
- Subcomandos:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Explora o busca en el catálogo unificado de paquetes mediante `GET /api/v1/packages` y `GET /api/v1/packages/search`.
- Usa esto para plugins y otras entradas de familias de paquetes; `search` de nivel superior sigue siendo la superficie de búsqueda de skills.
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
- Usa esto para metadatos de plugins, compatibilidad, verificación, origen e inspección de versiones/archivos.
- `--version <version>`: inspecciona una versión específica (predeterminado: la más reciente).
- `--tag <tag>`: inspecciona una versión etiquetada (p. ej., `latest`).
- `--versions`: enumera el historial de versiones (primera página).
- `--limit <n>`: número máximo de versiones a enumerar (1-100).
- `--files`: enumera archivos de la versión seleccionada.
- `--file <path>`: obtiene contenido de archivo sin procesar (solo archivos de texto; límite de 200 KB).
- `--json`: salida legible por máquina.

### `package download <name>`

- Resuelve una versión de paquete mediante
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Descarga el artefacto desde el `downloadUrl` del resolvedor.
- Verifica el SHA-256 de ClawHub para todos los artefactos.
- Para artefactos npm-pack de ClawPack, también verifica la integridad `sha512` de npm,
  el shasum de npm y el nombre/versión de `package.json` del tarball.
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

- Calcula el SHA-256 de ClawHub, la integridad `sha512` de npm y el shasum de npm de un
  artefacto local.
- Con `--package`, resuelve los metadatos esperados desde ClawHub y compara el
  archivo local con los metadatos del artefacto publicado.
- Con flags de digest directos, verifica sin una consulta de red.
- Flags:
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

### `package validate <source>`

- Ejecuta el Plugin Inspector incluido en la CLI de ClawHub contra una carpeta de paquete de plugin
  local.
- De forma predeterminada usa validación sin conexión/estática, sin localizar ni importar un checkout local de
  OpenClaw.
- Los errores graves de compatibilidad salen con código distinto de cero. Los hallazgos de solo advertencia se imprimen pero
  salen con cero.
- Flags:
  - `--out <dir>`: escribe los informes de Plugin Inspector en este directorio.
  - `--openclaw <path>`: inspecciona contra un checkout local explícito de OpenClaw.
  - `--runtime`: habilita captura en tiempo de ejecución; importa código del plugin.
  - `--allow-execute`: permite captura en tiempo de ejecución en un espacio de trabajo aislado.
  - `--no-mock-sdk`: deshabilita el SDK simulado de OpenClaw durante la captura en tiempo de ejecución.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package validate ./example-plugin
```

Si la validación informa un hallazgo de paquete, manifiesto, importación de SDK o artefacto, consulta
[Correcciones de validación de plugins](/clawhub/plugin-validation-fixes) y vuelve a ejecutar el comando.

### `package delete <name>`

- Sin `--version`, elimina de forma reversible un paquete y todas sus versiones publicadas.
- `--version <version>` elimina permanentemente una versión propia que no sea la más reciente mediante una ruta fail-closed,
  específica de la versión.
  Las versiones eliminadas no se pueden restaurar ni volver a publicar. Publica un reemplazo antes de eliminar la
  versión actual más reciente. Este flujo solo de versión requiere el propietario del paquete o un administrador del publicador de la organización; el personal de la plataforma no omite la propiedad del paquete.
- La eliminación reversible de todo el paquete requiere el propietario del paquete, un propietario/administrador del publicador de la organización, un
  moderador de plataforma o un administrador de plataforma.
- Flags:
  - `--version <version>`: elimina permanentemente una versión que no sea la más reciente.
  - `--yes`: omite la confirmación.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Restaura un paquete y sus versiones publicadas eliminados de forma reversible.
- No hay restauración de versiones eliminadas; las versiones eliminadas permanentemente no se pueden restaurar.
- Requiere el propietario del paquete, un propietario/administrador del publicador de la organización, un moderador de plataforma
  o un administrador de plataforma.
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
- Requiere acceso de administrador tanto al propietario actual del paquete como al publicador de
  destino, salvo que lo realice un administrador de plataforma.
- Los nombres de paquetes con ámbito deben transferirse al propietario del ámbito correspondiente.
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
- Los informes son de nivel de paquete, opcionalmente vinculados a una versión, y se vuelven visibles
  para los moderadores para su revisión.
- Los informes no ocultan automáticamente paquetes ni bloquean descargas por sí solos.
- Flags:
  - `--version <version>`: versión opcional del paquete para adjuntar al informe.
  - `--reason <text>`: motivo requerido del informe.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "payload nativo sospechoso"
```

### `package moderation-status`

- Comando de propietario para comprobar la visibilidad de moderación del paquete.
- Llama a `GET /api/v1/packages/{name}/moderation`.
- Muestra el estado actual de escaneo del paquete, el recuento de informes abiertos, el estado de moderación manual de la versión más reciente,
  el estado de bloqueo de descarga y los motivos de moderación.
- Flags:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Comprueba si un paquete está listo para consumo futuro por OpenClaw.
- Llama a `GET /api/v1/packages/{name}/readiness`.
- Informa bloqueadores para el estado oficial, disponibilidad de ClawPack, digest del artefacto,
  procedencia del origen, compatibilidad con OpenClaw, destinos de host, metadatos de entorno
  y estado de escaneo.
- Flags:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Muestra el estado de migración orientado a operadores para un paquete que puede reemplazar un
  plugin incluido de OpenClaw.
- Llama al mismo endpoint de preparación calculada que `package readiness`, pero imprime
  estado enfocado en la migración, versión más reciente, estado de paquete oficial, comprobaciones y
  bloqueadores.
- Flags:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Crea un publicador de organización propiedad del usuario autenticado.
- El identificador se normaliza a minúsculas y se puede pasar con o sin `@`.
- Los publicadores de organización recién creados no son de confianza/oficiales de forma predeterminada.
- Falla si el identificador ya lo usa un publicador, usuario o ruta reservada existente.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Publica un Plugin de código o un Plugin de paquete mediante `POST /api/v1/packages`.
- `<source>` acepta:
  - Ruta de carpeta local: `./my-plugin`
  - Tarball local de npm-pack de ClawPack: `./my-plugin-1.2.3.tgz`
  - Repositorio de GitHub: `owner/repo` u `owner/repo@ref`
  - URL de GitHub: `https://github.com/owner/repo`
- Los metadatos se detectan automáticamente desde `package.json`, `openclaw.plugin.json` y
  marcadores reales de paquete de OpenClaw como `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` y `.cursor-plugin/plugin.json`.
- Las fuentes `.tgz` se tratan como ClawPack. La CLI sube los bytes exactos de
  npm-pack y usa el contenido extraído de `package/` solo para validación y
  prerrelleno de metadatos.
- Las carpetas de Plugin de código se empaquetan en un tarball npm de ClawPack
  antes de subirse para que las instalaciones de OpenClaw puedan verificar el
  artefacto exacto. Las carpetas de Plugin de paquete siguen usando la ruta de
  publicación de archivos extraídos.
- Para fuentes de GitHub, la atribución de origen se rellena automáticamente a partir del repositorio, el commit resuelto, la referencia y la subruta.
- Para carpetas locales, la atribución de origen se detecta automáticamente desde git local cuando el remoto de origen apunta a GitHub.
- Los Plugins de código externos deben declarar `openclaw.compat.pluginApi` y
  `openclaw.build.openclawVersion` explícitamente.
  El `package.json.version` de nivel superior no se usa como alternativa para la validación de publicación.
- `--dry-run` previsualiza la carga útil de publicación resuelta sin subirla.
- `--json` emite salida legible por máquina para CI.
- `--owner <handle>` publica bajo un identificador de publicador de usuario u organización cuando el actor tiene acceso de publicador.
- Los nombres de paquetes con ámbito deben coincidir con el propietario seleccionado. Consulta `docs/publishing.md`.
- Las flags existentes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) siguen funcionando como sobrescrituras.
- Los repositorios privados de GitHub requieren `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Flujo local recomendado

Usa `--dry-run` primero para poder confirmar los metadatos resueltos del paquete y
la atribución de origen antes de crear una versión real:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flujo de carpeta local

Para Plugins de código, la publicación de carpeta crea y sube un artefacto
ClawPack desde la carpeta del paquete:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` mínimo para `--family code-plugin`

Los Plugins de código externos necesitan una pequeña cantidad de metadatos de
OpenClaw en `package.json`. Este manifiesto mínimo basta para una publicación correcta:

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

- `package.json.version` es la versión de lanzamiento de tu paquete, pero no se usa como
  alternativa para la validación de compatibilidad/compilación de OpenClaw.
- `openclaw.hostTargets` y `openclaw.environment` son metadatos opcionales.
  ClawHub puede mostrarlos cuando estén presentes, pero no son obligatorios para publicar.
- `openclaw.compat.minGatewayVersion` y
  `openclaw.build.pluginSdkVersion` son extras opcionales si quieres publicar
  metadatos de compatibilidad más detallados.
- Si estás usando una versión antigua de la CLI `clawhub`, actualiza antes de publicar para que
  las comprobaciones previas locales se ejecuten antes de la subida.
- Si la validación informa un código de corrección, consulta
  [Correcciones de validación de Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub también incluye un workflow reutilizable oficial en
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/package-publish.yml)
para repositorios de Plugins.

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

- El workflow reutilizable establece `source` de forma predeterminada en el repositorio llamador.
- Para monorepos, pasa `source_path` para que el workflow publique la carpeta
  del paquete del Plugin, por ejemplo `source_path: extensions/codex`.
- Fija el workflow reutilizable a una etiqueta estable o a un SHA de commit completo. No ejecutes publicaciones de lanzamiento desde `@main`.
- `pull_request` debe usar `dry_run: true` para que CI no contamine.
- Las publicaciones reales deben limitarse a eventos de confianza como `workflow_dispatch` o pushes de etiquetas.
- La publicación de confianza sin secreto solo funciona en `workflow_dispatch`; los pushes de etiquetas todavía necesitan `clawhub_token`.
- Mantén `clawhub_token` disponible para la primera publicación, paquetes no confiables o publicaciones de emergencia.
- El workflow sube el resultado JSON como artefacto y lo expone como salidas del workflow.

### `package trusted-publisher get <name>`

- Muestra la configuración de publicador de confianza de GitHub Actions para un paquete.
- Usa esto después de establecer la configuración para confirmar el repositorio, el nombre de archivo del workflow
  y el pin de entorno opcional.
- Flags:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Adjunta o reemplaza la configuración de publicador de confianza de GitHub Actions para un paquete
  existente.
- El paquete debe crearse primero mediante una publicación normal manual o autenticada con token
  con `clawhub package publish`.
- Una vez establecida la configuración, las futuras publicaciones compatibles de GitHub Actions pueden usar
  OIDC/publicación de confianza sin un token de ClawHub de larga duración.
- `--repository <repo>` debe ser `owner/repo`.
- `--workflow-filename <file>` debe coincidir con el nombre del archivo de workflow en
  `.github/workflows/`.
- `--environment <name>` es opcional. Cuando esté configurado, el entorno de GitHub Actions
  en la afirmación OIDC debe coincidir exactamente.
- ClawHub verifica el repositorio de GitHub configurado cuando se ejecuta este comando.
  Los repositorios públicos se pueden verificar mediante metadatos públicos de GitHub. Los repositorios
  privados requieren que ClawHub tenga acceso de GitHub a ese repositorio, por
  ejemplo mediante una futura instalación de la GitHub App de ClawHub u otra
  integración autorizada de GitHub.
- Flags:
  - `--repository <repo>`: repositorio de GitHub, por ejemplo `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nombre del archivo de workflow, por ejemplo `package-publish.yml`.
  - `--environment <name>`: entorno opcional de GitHub Actions con coincidencia exacta.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Elimina la configuración de publicador de confianza de un paquete.
- Usa esto como reversión si el workflow, el repositorio o el pin de entorno necesitan
  deshabilitarse o volver a crearse.
- Las futuras publicaciones reales deben usar la publicación autenticada normal hasta que la configuración se
  establezca de nuevo.
- Flags:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetría de instalación

- Se envía después de `clawhub install <slug>` cuando se ha iniciado sesión, a menos que
  `CLAWHUB_DISABLE_TELEMETRY=1` esté establecido.
- Los informes son de mejor esfuerzo. Los comandos de instalación no fallan si la telemetría no está
  disponible.
- Detalles: `docs/telemetry.md`.
