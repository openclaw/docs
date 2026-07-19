---
read_when:
    - Uso de la CLI de ClawHub
    - Depuración de la instalación, actualización o publicación
summary: 'Referencia de la CLI: comandos, opciones, configuración y comportamiento del archivo de bloqueo.'
x-i18n:
    generated_at: "2026-07-19T01:51:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa830e77a2fe0639b113b5f3171da138189c3bdf0271f7b729ad0a84404bce72
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Paquete de CLI: `clawhub`, binario: `clawhub`.

Instálelo globalmente con npm o pnpm:

```bash
npm i -g clawhub
# o
pnpm add -g clawhub
```

Luego verifíquelo:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Opciones globales

- `--workdir <dir>`: directorio de trabajo (predeterminado: cwd; recurre al espacio de trabajo de Clawdbot si está configurado)
- `--dir <dir>`: directorio de instalación dentro del directorio de trabajo (predeterminado: `skills`)
- `--site <url>`: URL base para iniciar sesión mediante el navegador (predeterminada: `https://clawhub.ai`)
- `--registry <url>`: URL base de la API (predeterminada: la detectada; de lo contrario, `https://clawhub.ai`)
- `--no-input`: deshabilita las solicitudes de entrada

Equivalentes de entorno:

- `CLAWHUB_SITE` (anterior: `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (anterior: `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (anterior: `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI respeta las variables de entorno estándar de proxy HTTP en sistemas detrás de
proxies corporativos o redes restringidas:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Cuando se establece alguna de estas variables, la CLI enruta las solicitudes salientes a través
del proxy especificado. `HTTPS_PROXY` se utiliza para solicitudes HTTPS y `HTTP_PROXY`
para HTTP sin cifrar. Se respeta `NO_PROXY` / `no_proxy` para omitir el proxy en
hosts o dominios específicos.

Esto es necesario en sistemas donde están bloqueadas las conexiones salientes directas
(p. ej., contenedores Docker, VPS de Hetzner con acceso a Internet únicamente mediante proxy,
cortafuegos corporativos).

Ejemplo:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "mi consulta"
```

Cuando no se establece ninguna variable de proxy, el comportamiento no cambia (conexiones directas).

## Archivo de configuración

Almacena el token de la API y la URL del registro almacenada en caché.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Alternativa anterior: si `clawhub/config.json` aún no existe, pero `clawdhub/config.json` sí, la CLI reutiliza la ruta anterior
- anulación: `CLAWHUB_CONFIG_PATH` (anterior: `CLAWDHUB_CONFIG_PATH`)

## Comandos

### `login` / `auth login`

- Predeterminado: abre el navegador en `<site>/cli/auth` y finaliza mediante una devolución de llamada de bucle invertido.
- Sin interfaz gráfica: `clawhub login --token clh_...`
- Interactivo remoto/sin interfaz gráfica: `clawhub login --device` muestra un código y espera mientras se autoriza en `<site>/cli/device`.

### `whoami`

- Verifica el token almacenado mediante `/api/v1/whoami`.

### `token`

- Muestra el token de la API almacenado en stdout.
- Resulta útil para canalizar un token de inicio de sesión local hacia comandos de configuración de secretos de CI.

### `star <skill>` / `unstar <skill>`

- Añade o elimina una skill de sus destacados.
- Llama a `POST /api/v1/stars/<slug>` y `DELETE /api/v1/stars/<slug>`.
- `--yes` omite la confirmación.

### `search <query...>`

- Llama a `/api/v1/search?q=...`.
- La salida incluye el slug de la skill, el identificador del propietario, el nombre para mostrar y la puntuación de relevancia.
- La búsqueda favorece las coincidencias exactas de tokens de slug/nombre antes que la popularidad de las descargas. Un token de slug independiente como `map` coincide con `personal-map` con mayor fuerza que con la subcadena dentro de `amap`.
- La popularidad es un factor previo de clasificación menor, no una garantía de aparecer en las primeras posiciones.
- Si una skill debería aparecer pero no lo hace, ejecute `clawhub inspect @owner/slug` con la sesión iniciada para comprobar los diagnósticos de moderación visibles para el propietario antes de cambiar el nombre de los metadatos.

### `explore`

- Enumera las skills más recientes mediante `/api/v1/skills?limit=...&sort=createdAt` (ordenadas por `createdAt` de forma descendente).
- Opciones:
  - `--limit <n>` (1-200, predeterminado: 25)
  - `--sort newest|updated|rating|downloads|trending` (predeterminado: las más recientes). Los alias anteriores de ordenación de instalaciones siguen funcionando por compatibilidad.
  - `--json` (salida legible por máquinas)
- Salida: `<slug>  v<version>  <age>  <summary>` (resumen truncado a 50 caracteres).

### `inspect @owner/slug`

- Obtiene los metadatos y archivos de versión de la skill sin instalarla.
- `--version <version>`: inspecciona una versión específica (predeterminada: la más reciente).
- `--tag <tag>`: inspecciona una versión etiquetada (p. ej., `latest`).
- `--versions`: enumera el historial de versiones (primera página).
- `--limit <n>`: número máximo de versiones que se enumerarán (1-200).
- `--files`: enumera los archivos de la versión seleccionada.
- `--file <path>`: obtiene el contenido sin procesar del archivo (solo archivos de texto; límite de 200KB).
- `--json`: salida legible por máquinas.

### `install @owner/slug`

- Resuelve la versión más reciente para el propietario y la skill indicados.
- Descarga el archivo ZIP mediante `/api/v1/download`.
- Lo extrae en `<workdir>/<dir>/<slug>`.
- Se niega a sobrescribir las skills fijadas; ejecute primero `clawhub unpin <skill>`.
- Escribe:
  - `<workdir>/.clawhub/lock.json` (anterior: `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (anterior: `.clawdhub`)

### `uninstall <skill>`

- Elimina `<workdir>/<dir>/<slug>` y borra la entrada del archivo de bloqueo.
- Envía telemetría en la medida de lo posible mientras la sesión está iniciada para que los recuentos de instalaciones actuales puedan
  desactivarse.
- Interactivo: solicita confirmación.
- No interactivo (`--no-input`): requiere `--yes`.

### `list`

- Lee `<workdir>/.clawhub/lock.json` (anterior: `.clawdhub`).
- Muestra `pinned` junto a las skills inmovilizadas con `clawhub pin`, incluido el motivo opcional.

### `pin <skill>`

- Marca una skill instalada como fijada en el archivo de bloqueo.
- `--reason <text>` registra por qué está inmovilizada la skill.
- `update --all` omite las skills fijadas y `update <skill>` directo las rechaza.
- Las skills fijadas también rechazan `install --force` para que los bytes locales no puedan sustituirse accidentalmente.

### `unpin <skill>`

- Elimina la fijación del archivo de bloqueo de una skill instalada para que futuras actualizaciones puedan modificarla.

### `update [@owner/slug]` / `update --all`

- Calcula la huella digital a partir de los archivos locales.
- Si la huella digital coincide con una versión conocida: no se solicita confirmación.
- Si la huella digital no coincide:
  - se niega de forma predeterminada
  - sobrescribe con `--force` (o solicita confirmación si es interactivo)
- `--force` nunca actualiza las skills fijadas.
- `update <skill>` falla inmediatamente para las skills fijadas e indica que se ejecute primero `clawhub unpin <skill>`.
- `update --all` omite los slugs fijados y muestra un resumen de lo que permaneció inmovilizado.

### `skill publish <path>`

- Compara la huella digital del paquete local con ClawHub y finaliza correctamente cuando
  el contenido ya está publicado.
- Las skills nuevas utilizan `1.0.0` de forma predeterminada; las skills modificadas utilizan de forma predeterminada la siguiente versión
  de parche.
- `--version <version>` selecciona explícitamente una versión y la publica incluso cuando el
  contenido coincide con una versión existente.
- `--dry-run` resuelve la publicación sin cargar contenido; `--json` muestra un
  resultado legible por máquinas.
- `--owner <handle>` publica con el identificador de editor de una organización o un usuario cuando el
  actor tiene acceso de editor.
- `--migrate-owner` mueve una skill existente a `--owner` mientras publica una nueva
  versión. Requiere acceso de administrador o propietario en ambos editores.
- El comportamiento del propietario y de la revisión se explica en `docs/publishing.md`.
- Publicar una skill significa que se lanza bajo `MIT-0` en ClawHub.
- Las skills publicadas pueden utilizarse, modificarse y redistribuirse libremente sin atribución.
- ClawHub no admite skills de pago ni precios por skill.
- Alias anterior: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

El flujo de trabajo reutilizable
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
de ClawHub llama a `skill publish` para un `skill_path` o para cada carpeta de skill
inmediata dentro de `root` (predeterminado: `skills`). Omite las skills sin cambios y utiliza el
mismo comportamiento automático para la versión de parche.

Establezca `dry_run: true` para obtener una vista previa sin token. Las publicaciones reales requieren el
secreto `clawhub_token`.

### `sync`

- Explora el directorio de trabajo actual, el directorio de skills configurado y cualquier
  carpeta `--root <dir>` para encontrar carpetas de skills locales que contengan `SKILL.md` o
  `skill.md`.
- Compara la huella digital de cada skill local con ClawHub y publica únicamente las skills nuevas o
  modificadas.
- Las skills nuevas se publican como `1.0.0`; las skills modificadas publican la siguiente versión de parche
  de forma predeterminada. Utilice `--bump minor|major` para lotes de actualizaciones que deban avanzar mediante un
  incremento semver mayor.
- `--dry-run` muestra el plan de publicación sin cargar contenido; `--json` muestra un
  plan legible por máquinas.
- `--all` publica todas las skills nuevas o modificadas sin solicitar confirmación. Sin
  `--all`, los terminales interactivos permiten seleccionar las skills que se publicarán.
- `--owner <handle>` publica con el identificador de editor de una organización o un usuario cuando el
  actor tiene acceso de editor.
- `sync` solo publica en un sentido. No instala, actualiza, descarga ni
  informa de telemetría de instalaciones o descargas.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Requiere `clawhub login`.
- Ejecuta ClawScan de ClawHub mediante `POST /api/v1/skills/-/scan` y luego consulta periódicamente hasta que el análisis alcanza un estado terminal.
- Los análisis son asíncronos y pueden tardar en completarse. Mientras están en cola, el indicador giratorio del terminal muestra la posición priorizada actual del análisis y cuántos análisis hay por delante.
- Los análisis publicados requieren acceso de propietario o de administración del editor. Los moderadores y administradores pueden utilizar el mismo backend mediante `clawhub-admin`.
- `--update` solo es válido con `--slug`; vuelve a escribir los resultados correctos del análisis publicado en la versión seleccionada.
- `--output <file.zip>` descarga el archivo completo del informe con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` y `README.md`.
- `--json` muestra la respuesta completa de la consulta periódica para la automatización.
- Los análisis de rutas locales ya no son compatibles. Cargue una nueva versión y luego utilice `scan download` para recuperar los resultados de análisis almacenados de esa versión enviada.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Requiere `clawhub login`.
- Descarga el ZIP almacenado del informe de análisis de una versión enviada de una skill o un plugin, incluidas las versiones bloqueadas u ocultadas por las comprobaciones de seguridad de ClawHub.
- Las descargas de skills usan el slug de la skill y, de forma predeterminada, `--kind skill`.
- Las descargas de plugins usan el nombre del paquete y requieren `--kind plugin`.
- `--version` es obligatorio para que los autores inspeccionen la versión exacta enviada que ClawHub bloqueó.
- `--output <file.zip>` elige la ruta de destino.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub incluye un flujo de trabajo reutilizable oficial en
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/aaa73625ed4100b1006653f49089f2a2d969a427/.github/workflows/skill-publish.yml)
para repositorios de skills y repositorios de catálogos.

Configuración típica de un catálogo:

```yaml
name: Publicación de skills

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

- `root` usa de forma predeterminada `skills` para los repositorios de catálogos.
- Pase `skill_path: skills/review-helper` para procesar una sola carpeta de skill.
- `owner` corresponde a la opción de la CLI `--owner`; omítala para publicar como el usuario autenticado.
- La publicación de skills V1 usa `clawhub_token`; por ahora, la publicación de confianza mediante OIDC de GitHub solo está disponible para paquetes.

### `delete <skill>`

- Sin `--version`, elimina de forma lógica una skill (propietario, moderador o administrador).
- Llama a `DELETE /api/v1/skills/{slug}`.
- Las eliminaciones lógicas iniciadas por el propietario reservan el slug durante 30 días; el comando muestra la hora de vencimiento.
- `--version <version>` elimina permanentemente una versión propia que no sea la más reciente mediante una ruta de cierre seguro
  específica de la versión.
  Las versiones eliminadas no se pueden restaurar ni volver a publicar. Publique un reemplazo antes de eliminar la
  versión más reciente actual. El personal de la plataforma no elude la propiedad en este flujo exclusivo para versiones.
- `--reason <text>` registra una nota de moderación en la eliminación lógica de toda la skill y en el registro de auditoría.
- `--note <text>` es un alias de `--reason`.
- `--yes` omite la confirmación.

### `undelete <skill>`

- Restaura una skill oculta (propietario, moderador o administrador).
- No existe la restauración de versiones eliminadas; las versiones eliminadas permanentemente no se pueden restaurar.
- Llama a `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra una nota de moderación en la skill y en el registro de auditoría.
- `--note <text>` es un alias de `--reason`.
- `--yes` omite la confirmación.

### `hide <skill>`

- Oculta una skill (propietario, moderador o administrador).
- Alias de `delete`.

### `unhide <skill>`

- Hace visible una skill oculta (propietario, moderador o administrador).
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

- Flujo de trabajo de transferencia de propiedad.
- Las transferencias a identificadores de usuario crean una solicitud pendiente que el destinatario debe aceptar.
- Las transferencias a identificadores de organizaciones o publicadores se aplican inmediatamente solo cuando el actor tiene
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
- Utilice esta opción para plugins y otras entradas de familias de paquetes; `search` en el nivel superior sigue siendo la interfaz de búsqueda de skills.
- Opciones:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, valor predeterminado: 25)
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

- Obtiene los metadatos del paquete sin instalarlo.
- Utilice esta opción para inspeccionar los metadatos, la compatibilidad, la verificación, el origen y las versiones o archivos de los plugins.
- `--version <version>`: inspecciona una versión específica (valor predeterminado: la más reciente).
- `--tag <tag>`: inspecciona una versión etiquetada (p. ej., `latest`).
- `--versions`: enumera el historial de versiones (primera página).
- `--limit <n>`: número máximo de versiones que se mostrarán (1-100).
- `--files`: enumera los archivos de la versión seleccionada.
- `--file <path>`: obtiene el contenido sin procesar del archivo (solo archivos de texto; límite de 200KB).
- `--json`: salida legible por máquina.

### `package download <name>`

- Resuelve una versión de paquete mediante
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Descarga el artefacto desde `downloadUrl` del resolutor.
- Verifica el SHA-256 de ClawHub para todos los artefactos.
- Para los artefactos npm-pack de ClawPack, también verifica la integridad `sha512` de npm,
  el shasum de npm y el nombre y la versión de `package.json` del tarball.
- Las versiones ZIP heredadas se descargan mediante la ruta ZIP heredada.
- Opciones:
  - `--version <version>`: descarga una versión específica.
  - `--tag <tag>`: descarga una versión etiquetada (valor predeterminado: `latest`).
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
- Con opciones de resumen directas, realiza la verificación sin una consulta de red.
- Opciones:
  - `--package <name>`: nombre del paquete para resolver los metadatos esperados del artefacto.
  - `--version <version>` o `--tag <tag>`: versión esperada del paquete.
  - `--sha256 <hex>`: SHA-256 esperado de ClawHub.
  - `--npm-integrity <sri>`: integridad esperada de npm.
  - `--npm-shasum <sha1>`: shasum esperado de npm.
  - `--json`: salida legible por máquina.

Ejemplos:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Ejecuta el Inspector de plugins incluido en la CLI de ClawHub sobre una carpeta local
  de paquete de plugin.
- De forma predeterminada, realiza una validación estática sin conexión, sin localizar ni importar una copia de trabajo local
  de OpenClaw.
- Los errores graves de compatibilidad terminan con un código distinto de cero. Los hallazgos que son solo advertencias se muestran, pero
  terminan con un código cero.
- Opciones:
  - `--out <dir>`: escribe los informes del Inspector de plugins en este directorio.
  - `--openclaw <path>`: inspecciona con respecto a una copia de trabajo local explícita de OpenClaw.
  - `--runtime`: habilita la captura en tiempo de ejecución; importa código del plugin.
  - `--allow-execute`: permite la captura en tiempo de ejecución en un espacio de trabajo aislado.
  - `--no-mock-sdk`: deshabilita el SDK simulado de OpenClaw durante la captura en tiempo de ejecución.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package validate ./example-plugin
```

Si la validación informa de un hallazgo relacionado con el paquete, el manifiesto, la importación del SDK o el artefacto, consulte
[Correcciones de validación de plugins](/clawhub/plugin-validation-fixes) y vuelva a ejecutar el comando.

### `package delete <name>`

- Sin `--version`, elimina de forma lógica un paquete y todas sus versiones publicadas.
- `--version <version>` elimina permanentemente una versión propia que no sea la más reciente mediante una ruta de cierre seguro
  específica de la versión.
  Las versiones eliminadas no se pueden restaurar ni volver a publicar. Publique un reemplazo antes de eliminar la
  versión más reciente actual. Este flujo exclusivo para versiones requiere ser el propietario del paquete o un administrador
  del publicador de una organización; el personal de la plataforma no elude la propiedad del paquete.
- La eliminación lógica de todo el paquete requiere ser el propietario del paquete, propietario o administrador del publicador de una organización, moderador
  de la plataforma o administrador de la plataforma.
- Opciones:
  - `--version <version>`: elimina permanentemente una versión que no sea la más reciente.
  - `--yes`: omite la confirmación.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Restaura un paquete eliminado de forma lógica y sus versiones publicadas.
- No existe la restauración de versiones eliminadas; las versiones eliminadas permanentemente no se pueden restaurar.
- Requiere ser el propietario del paquete, propietario o administrador del publicador de una organización, moderador
  de la plataforma o administrador de la plataforma.
- Llama a `POST /api/v1/packages/{name}/undelete`.
- Opciones:
  - `--yes`: omite la confirmación.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Transfiere un paquete a otro editor.
- Requiere acceso de administrador tanto al propietario actual del paquete como al editor
  de destino, salvo que lo realice un administrador de la plataforma.
- Los nombres de paquetes con ámbito deben transferirse al propietario del ámbito correspondiente.
- Llama a `POST /api/v1/packages/{name}/transfer`.
- Indicadores:
  - `--to <owner>`: identificador del editor de destino.
  - `--reason <text>`: motivo de auditoría opcional.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Comando autenticado para denunciar un paquete a los moderadores.
- Llama a `POST /api/v1/packages/{name}/report`.
- Las denuncias corresponden al paquete completo, pueden vincularse opcionalmente a una versión y se hacen visibles
  para que los moderadores las revisen.
- Las denuncias no ocultan automáticamente los paquetes ni bloquean por sí solas las descargas.
- Indicadores:
  - `--version <version>`: versión opcional del paquete que se adjuntará a la denuncia.
  - `--reason <text>`: motivo obligatorio de la denuncia.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "carga nativa sospechosa"
```

### `package moderation-status`

- Comando del propietario para comprobar la visibilidad de moderación del paquete.
- Llama a `GET /api/v1/packages/{name}/moderation`.
- Muestra el estado actual del análisis del paquete, el número de denuncias abiertas, el estado de moderación
  manual de la versión más reciente, el estado de bloqueo de descargas y los motivos de moderación.
- Indicadores:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Comprueba si un paquete está preparado para su uso futuro por OpenClaw.
- Llama a `GET /api/v1/packages/{name}/readiness`.
- Informa de los impedimentos para el estado oficial, la disponibilidad de ClawPack, el resumen del artefacto,
  la procedencia del código fuente, la compatibilidad con OpenClaw, los destinos de host, los metadatos del entorno
  y el estado del análisis.
- Indicadores:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Muestra el estado de migración orientado a operadores de un paquete que puede sustituir a un
  plugin incluido con OpenClaw.
- Llama al mismo endpoint de preparación calculada que `package readiness`, pero muestra
  el estado centrado en la migración, la versión más reciente, el estado de paquete oficial, las comprobaciones y
  los impedimentos.
- Indicadores:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Crea un editor de organización propiedad del usuario autenticado.
- El identificador se normaliza a minúsculas y puede proporcionarse con o sin `@`.
- Los editores de organización recién creados no son de confianza ni oficiales de forma predeterminada.
- Falla si el identificador ya lo utiliza un editor o usuario existente, o una ruta reservada.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Publica un plugin de código o un plugin de paquete mediante `POST /api/v1/packages`.
- `<source>` acepta:
  - Ruta de carpeta local: `./my-plugin`
  - Archivo tar de npm pack de ClawPack local: `./my-plugin-1.2.3.tgz`
  - Repositorio de GitHub: `owner/repo` o `owner/repo@ref`
  - URL de GitHub: `https://github.com/owner/repo`
- Los metadatos se detectan automáticamente a partir de `package.json`, `openclaw.plugin.json` y
  marcadores reales de paquetes de OpenClaw, como `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` y `.cursor-plugin/plugin.json`.
- Las fuentes `.tgz` se tratan como ClawPack. La CLI carga los bytes exactos de npm pack
  y utiliza el contenido extraído de `package/` únicamente para la validación y
  el rellenado previo de metadatos.
- Las carpetas de plugins de código se empaquetan en un archivo tar de npm de ClawPack antes de cargarse para que
  las instalaciones de OpenClaw puedan verificar el artefacto exacto. Las carpetas de plugins de paquete siguen
  utilizando la ruta de publicación de archivos extraídos.
- Para las fuentes de GitHub, la atribución del código fuente se rellena automáticamente con el repositorio, el commit resuelto, la referencia y la subruta.
- Para las carpetas locales, la atribución del código fuente se detecta automáticamente desde el repositorio git local cuando el remoto de origen apunta a GitHub.
- Los plugins de código externos deben declarar explícitamente `openclaw.compat.pluginApi` y
  `openclaw.build.openclawVersion`.
  El valor `package.json.version` de nivel superior no se utiliza como alternativa para la validación de publicación.
- `--dry-run` muestra una vista previa de la carga útil de publicación resuelta sin cargarla.
- `--json` genera una salida legible por máquina para la CI.
- `--owner <handle>` publica bajo el identificador de un editor de usuario u organización cuando el actor tiene acceso al editor.
- Los nombres de paquetes con ámbito deben coincidir con el propietario seleccionado. Consulte `docs/publishing.md`.
- Los indicadores existentes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) siguen funcionando como anulaciones.
- Los repositorios privados de GitHub requieren `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Flujo local recomendado

Utilice primero `--dry-run` para poder confirmar los metadatos resueltos del paquete y
la atribución del código fuente antes de crear una versión activa:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flujo de carpeta local

Para los plugins de código, la publicación de una carpeta crea y carga un artefacto ClawPack desde
la carpeta del paquete:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` mínimo para `--family code-plugin`

Los plugins de código externos necesitan una pequeña cantidad de metadatos de OpenClaw en
`package.json`. Este manifiesto mínimo es suficiente para realizar correctamente una publicación:

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

- `package.json.version` es la versión de lanzamiento del paquete, pero no se utiliza como
  alternativa para la validación de compatibilidad o compilación de OpenClaw.
- `openclaw.hostTargets` y `openclaw.environment` son metadatos opcionales.
  ClawHub puede mostrarlos cuando están presentes, pero no son obligatorios para publicar.
- `openclaw.compat.minGatewayVersion` y
  `openclaw.build.pluginSdkVersion` son elementos adicionales opcionales si se desean publicar
  metadatos de compatibilidad más detallados.
- Si se utiliza una versión anterior de la CLI `clawhub`, debe actualizarse antes de publicar para que
  las comprobaciones preliminares locales se ejecuten antes de la carga.
- Si la validación informa de un código de corrección, consulte
  [Correcciones de validación de plugins](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub también proporciona un flujo de trabajo reutilizable oficial en
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/aaa73625ed4100b1006653f49089f2a2d969a427/.github/workflows/package-publish.yml)
para repositorios de plugins.

Configuración habitual del llamador:

```yaml
name: Publicación de paquetes

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

- El flujo de trabajo reutilizable establece de forma predeterminada `source` en el repositorio llamador.
- Para monorepos, proporcione `source_path` para que el flujo de trabajo publique la carpeta
  del paquete del plugin, por ejemplo `source_path: extensions/codex`.
- Fije el flujo de trabajo reutilizable a una etiqueta estable o a un SHA de commit completo. No ejecute la publicación de versiones desde `@main`.
- `pull_request` debe utilizar `dry_run: true` para que la CI no genere cambios persistentes.
- Las publicaciones reales deben limitarse a eventos de confianza, como `workflow_dispatch` o los envíos de etiquetas.
- La publicación de confianza sin secreto solo funciona en `workflow_dispatch`; los envíos de etiquetas siguen necesitando `clawhub_token`.
- Mantenga `clawhub_token` disponible para la primera publicación, los paquetes que no sean de confianza o las publicaciones de emergencia.
- El flujo de trabajo carga el resultado JSON como artefacto y lo expone como salidas del flujo de trabajo.

### `package trusted-publisher get <name>`

- Muestra la configuración del editor de confianza de GitHub Actions para un paquete.
- Utilice este comando después de establecer la configuración para confirmar el repositorio, el nombre del archivo del flujo de trabajo
  y la fijación opcional del entorno.
- Indicadores:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Adjunta o sustituye la configuración del editor de confianza de GitHub Actions para un
  paquete existente.
- El paquete debe crearse primero mediante la publicación normal manual o autenticada con token
  `clawhub package publish`.
- Una vez establecida la configuración, las publicaciones futuras compatibles desde GitHub Actions pueden utilizar
  OIDC/publicación de confianza sin un token de ClawHub de larga duración.
- `--repository <repo>` debe ser `owner/repo`.
- `--workflow-filename <file>` debe coincidir con el nombre del archivo del flujo de trabajo en
  `.github/workflows/`.
- `--environment <name>` es opcional. Cuando se configura, el entorno de GitHub Actions
  de la declaración OIDC debe coincidir exactamente.
- ClawHub verifica el repositorio de GitHub configurado cuando se ejecuta este comando.
  Los repositorios públicos pueden verificarse mediante los metadatos públicos de GitHub. Los repositorios
  privados requieren que ClawHub tenga acceso de GitHub a ese repositorio, por
  ejemplo mediante una futura instalación de la GitHub App de ClawHub u otra integración
  autorizada de GitHub.
- Indicadores:
  - `--repository <repo>`: repositorio de GitHub, por ejemplo `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nombre del archivo del flujo de trabajo, por ejemplo `package-publish.yml`.
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

- Elimina la configuración del editor de confianza de un paquete.
- Utilice este comando para revertir los cambios si es necesario deshabilitar o volver a crear el flujo de trabajo, el repositorio o la fijación
  del entorno.
- Las publicaciones reales futuras deben utilizar la publicación autenticada normal hasta que se vuelva a
  establecer la configuración.
- Indicadores:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetría de instalación

- Se envía después de `clawhub install <slug>` cuando se ha iniciado sesión, salvo que
  se establezca `CLAWHUB_DISABLE_TELEMETRY=1`.
- El envío de informes se realiza con el mejor esfuerzo posible. Los comandos de instalación no fallan si la telemetría
  no está disponible.
- Detalles: `docs/telemetry.md`.
