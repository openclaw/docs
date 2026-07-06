---
read_when:
    - Usar la CLI de ClawHub
    - Depurar instalación, actualización o publicación
summary: 'Referencia de CLI: comandos, flags, configuración y comportamiento del archivo de bloqueo.'
x-i18n:
    generated_at: "2026-07-06T10:46:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa8be4ef260a5211aee7377779c4b56741541d4221e32954f603c52d08aef22
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

## Indicadores globales

- `--workdir <dir>`: directorio de trabajo (predeterminado: cwd; recurre al espacio de trabajo de Clawdbot si está configurado)
- `--dir <dir>`: directorio de instalación bajo workdir (predeterminado: `skills`)
- `--site <url>`: URL base para el inicio de sesión en navegador (predeterminado: `https://clawhub.ai`)
- `--registry <url>`: URL base de la API (predeterminado: detectada; si no, `https://clawhub.ai`)
- `--no-input`: desactivar solicitudes interactivas

Equivalentes de entorno:

- `CLAWHUB_SITE` (`CLAWDHUB_SITE` heredado)
- `CLAWHUB_REGISTRY` (`CLAWDHUB_REGISTRY` heredado)
- `CLAWHUB_WORKDIR` (`CLAWDHUB_WORKDIR` heredado)

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
(por ejemplo, contenedores Docker, VPS Hetzner con internet solo mediante proxy, firewalls
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
- Respaldo heredado: si `clawhub/config.json` aún no existe pero `clawdhub/config.json` sí, la CLI reutiliza la ruta heredada
- override: `CLAWHUB_CONFIG_PATH` (`CLAWDHUB_CONFIG_PATH` heredado)

## Comandos

### `login` / `auth login`

- Predeterminado: abre el navegador en `<site>/cli/auth` y completa mediante callback de local loopback.
- Sin interfaz: `clawhub login --token clh_...`
- Remoto/sin interfaz interactivo: `clawhub login --device` imprime un código y espera mientras lo autorizas en `<site>/cli/device`.

### `whoami`

- Verifica el token almacenado mediante `/api/v1/whoami`.

### `token`

- Imprime el token de API almacenado en stdout.
- Útil para canalizar un token de inicio de sesión local a comandos de configuración de secretos de CI.

### `star <skill>` / `unstar <skill>`

- Añade/elimina una skill de tus destacados.
- Llama a `POST /api/v1/stars/<slug>` y `DELETE /api/v1/stars/<slug>`.
- `--yes` omite la confirmación.

### `search <query...>`

- Llama a `/api/v1/search?q=...`.
- La salida incluye el slug de la skill, el identificador del propietario, el nombre para mostrar y la puntuación de relevancia.
- La búsqueda favorece coincidencias exactas de tokens de slug/nombre antes que la popularidad de descargas. Un token de slug independiente como `map` coincide con `personal-map` con más fuerza que la subcadena dentro de `amap`.
- La popularidad es un pequeño criterio previo de ordenación, no una garantía de aparecer en primer lugar.
- Si una skill debería aparecer pero no lo hace, ejecuta `clawhub inspect @owner/slug` con sesión iniciada para revisar los diagnósticos de moderación visibles para el propietario antes de cambiar el nombre de los metadatos.

### `explore`

- Lista las Skills más recientes mediante `/api/v1/skills?limit=...&sort=createdAt` (ordenadas por `createdAt` desc).
- Indicadores:
  - `--limit <n>` (1-200, predeterminado: 25)
  - `--sort newest|updated|rating|downloads|trending` (predeterminado: newest). Los alias heredados de ordenación de instalación siguen funcionando por compatibilidad.
  - `--json` (salida legible por máquina)
- Salida: `<slug>  v<version>  <age>  <summary>` (resumen truncado a 50 caracteres).

### `inspect @owner/slug`

- Obtiene metadatos de la skill y archivos de versión sin instalar.
- `--version <version>`: inspecciona una versión específica (predeterminado: latest).
- `--tag <tag>`: inspecciona una versión etiquetada (por ejemplo, `latest`).
- `--versions`: lista el historial de versiones (primera página).
- `--limit <n>`: máximo de versiones para listar (1-200).
- `--files`: lista los archivos de la versión seleccionada.
- `--file <path>`: obtiene contenido de archivo sin procesar (solo archivos de texto; límite de 200 KB).
- `--json`: salida legible por máquina.

### `install @owner/slug`

- Resuelve la versión más reciente para el propietario y la skill indicados.
- Descarga el ZIP mediante `/api/v1/download`.
- Extrae en `<workdir>/<dir>/<slug>`.
- Se niega a sobrescribir Skills fijadas; ejecuta primero `clawhub unpin <skill>`.
- Escribe:
  - `<workdir>/.clawhub/lock.json` (`.clawdhub` heredado)
  - `<skill>/.clawhub/origin.json` (`.clawdhub` heredado)

### `uninstall <skill>`

- Elimina `<workdir>/<dir>/<slug>` y borra la entrada del lockfile.
- Envía telemetría con mejor esfuerzo mientras hay sesión iniciada para que los recuentos de instalación actuales puedan
  desactivarse.
- Interactivo: pide confirmación.
- No interactivo (`--no-input`): requiere `--yes`.

### `list`

- Lee `<workdir>/.clawhub/lock.json` (`.clawdhub` heredado).
- Muestra `pinned` junto a las Skills congeladas con `clawhub pin`, incluida la razón opcional.

### `pin <skill>`

- Marca una skill instalada como fijada en el lockfile.
- `--reason <text>` registra por qué la skill está congelada.
- Las Skills fijadas se omiten en `update --all` y se rechazan con `update <skill>` directo.
- Las Skills fijadas también rechazan `install --force` para que los bytes locales no puedan reemplazarse accidentalmente.

### `unpin <skill>`

- Elimina la fijación del lockfile de una skill instalada para que futuras actualizaciones puedan modificarla.

### `update [@owner/slug]` / `update --all`

- Calcula la huella a partir de los archivos locales.
- Si la huella coincide con una versión conocida: no solicita confirmación.
- Si la huella no coincide:
  - se niega de forma predeterminada
  - sobrescribe con `--force` (o solicita confirmación si es interactivo)
- Las Skills fijadas nunca se actualizan con `--force`.
- `update <skill>` falla rápidamente para Skills fijadas y te indica que ejecutes primero `clawhub unpin <skill>`.
- `update --all` omite slugs fijados e imprime un resumen de lo que permaneció congelado.

### `skill publish <path>`

- Compara la huella del paquete local con ClawHub y sale correctamente cuando
  el contenido ya está publicado.
- Las Skills nuevas usan `1.0.0` de forma predeterminada; las Skills modificadas usan la siguiente versión de parche
  de forma predeterminada.
- `--version <version>` selecciona explícitamente una versión y publica incluso cuando el
  contenido coincide con una versión existente.
- `--dry-run` resuelve la publicación sin subir; `--json` imprime un
  resultado legible por máquina.
- `--owner <handle>` publica bajo el identificador de publicador de una organización/usuario cuando el
  actor tiene acceso de publicador.
- `--migrate-owner` mueve una skill existente a `--owner` mientras publica una nueva
  versión. Requiere acceso de administrador/propietario en ambos publicadores.
- El comportamiento de propietario y revisión se explica en `docs/publishing.md`.
- Publicar una skill significa que se libera bajo `MIT-0` en ClawHub.
- Las Skills publicadas son gratuitas para usar, modificar y redistribuir sin atribución.
- ClawHub no admite Skills de pago ni precios por skill.
- Alias heredado: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

El workflow reutilizable de ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
llama a `skill publish` para un `skill_path`, o para cada carpeta de skill inmediata
bajo `root` (predeterminado: `skills`). Omite Skills sin cambios y usa el
mismo comportamiento automático de versión de parche.

Define `dry_run: true` para previsualizar sin token. Las publicaciones reales requieren el
secreto `clawhub_token`.

### `sync`

- Escanea el workdir actual, el directorio de Skills configurado y cualquier
  carpeta `--root <dir>` en busca de carpetas de Skills locales que contengan `SKILL.md` o
  `skill.md`.
- Compara la huella de cada skill local con ClawHub y publica solo Skills nuevas o
  modificadas.
- Las Skills nuevas se publican como `1.0.0`; las Skills modificadas publican la siguiente versión de parche
  de forma predeterminada. Usa `--bump minor|major` para lotes de actualización que deban avanzar con un
  paso semver mayor.
- `--dry-run` muestra el plan de publicación sin subir; `--json` imprime un
  plan legible por máquina.
- `--all` publica cada skill nueva o modificada sin solicitar confirmación. Sin
  `--all`, las terminales interactivas te permiten seleccionar las Skills a publicar.
- `--owner <handle>` publica bajo el identificador de publicador de una organización/usuario cuando el
  actor tiene acceso de publicador.
- `sync` es solo publicación unidireccional. No instala, actualiza, descarga ni
  reporta telemetría de instalaciones/descargas.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Requiere `clawhub login`.
- Ejecuta ClawHub ClawScan mediante `POST /api/v1/skills/-/scan`, luego sondea hasta que el escaneo llegue a un estado terminal.
- Los escaneos son asíncronos y pueden tardar en completarse. Mientras está en cola, el indicador de la terminal muestra la posición actual del escaneo priorizado y cuántos escaneos hay por delante.
- Los escaneos publicados requieren propiedad o acceso de gestión de publicador. Moderadores/administradores pueden usar el mismo backend mediante `clawhub-admin`.
- `--update` solo es válido con `--slug`; escribe los resultados de escaneo publicados correctamente en la versión seleccionada.
- `--output <file.zip>` descarga el archivo completo del informe con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` y `README.md`.
- `--json` imprime la respuesta completa de sondeo para automatización.
- Los escaneos de rutas locales ya no son compatibles. Sube una nueva versión y luego usa `scan download` para recuperar los resultados de escaneo almacenados de esa versión enviada.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Requiere `clawhub login`.
- Descarga el ZIP del informe de escaneo almacenado para una versión enviada de skill o Plugin, incluidas las versiones bloqueadas u ocultas por las comprobaciones de seguridad de ClawHub.
- Las descargas de Skills usan el slug de la skill y el valor predeterminado es `--kind skill`.
- Las descargas de Plugin usan el nombre del paquete y requieren `--kind plugin`.
- `--version` es obligatorio para que los autores inspeccionen la versión enviada exacta que ClawHub bloqueó.
- `--output <file.zip>` elige la ruta de destino.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub incluye un workflow reutilizable oficial en
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/c1ffa9aba27b78eda1066e5a8a54e30a51f393c2/.github/workflows/skill-publish.yml)
para repositorios de Skills y repositorios de catálogo.

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

- `root` usa `skills` de forma predeterminada para repositorios de catálogo.
- Pasa `skill_path: skills/review-helper` para procesar una carpeta de skill.
- `owner` se asigna al indicador CLI `--owner`; omítelo para publicar como el usuario autenticado.
- La publicación de Skills V1 usa `clawhub_token`; la publicación confiable con GitHub OIDC es solo para paquetes por ahora.

### `delete <skill>`

- Sin `--version`, elimina de forma reversible una habilidad (propietario, moderador o administrador).
- Llama a `DELETE /api/v1/skills/{slug}`.
- Las eliminaciones reversibles iniciadas por el propietario reservan el slug durante 30 días; el comando imprime la hora de vencimiento.
- `--version <version>` elimina permanentemente una versión propia que no sea la más reciente mediante una ruta de cierre ante fallo
  específica de la versión.
  Las versiones eliminadas no se pueden restaurar ni volver a publicar. Publica un reemplazo antes de eliminar la
  versión más reciente actual. El personal de la plataforma no omite la propiedad en este flujo exclusivo de versión.
- `--reason <text>` registra una nota de moderación en una eliminación reversible de toda la habilidad y en el registro de auditoría.
- `--note <text>` es un alias de `--reason`.
- `--yes` omite la confirmación.

### `undelete <skill>`

- Restaura una habilidad oculta (propietario, moderador o administrador).
- No hay recuperación de versión eliminada; las versiones eliminadas permanentemente no se pueden restaurar.
- Llama a `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra una nota de moderación en la habilidad y en el registro de auditoría.
- `--note <text>` es un alias de `--reason`.
- `--yes` omite la confirmación.

### `hide <skill>`

- Oculta una habilidad (propietario, moderador o administrador).
- Alias de `delete`.

### `unhide <skill>`

- Muestra una habilidad oculta (propietario, moderador o administrador).
- Alias de `undelete`.

### `skill rename <skill> <new-name>`

- Cambia el nombre de una habilidad propia y conserva el slug anterior como alias de redirección.
- Llama a `POST /api/v1/skills/{slug}/rename`.
- `--yes` omite la confirmación.

### `skill merge <source> <target>`

- Fusiona una habilidad propia en otra habilidad propia.
- El slug de origen deja de listarse públicamente y se convierte en un alias de redirección al destino.
- Llama a `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` omite la confirmación.

### `transfer`

- Flujo de transferencia de propiedad.
- Las transferencias a identificadores de usuario crean una solicitud pendiente que acepta el destinatario.
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
- Úsalo para plugins y otras entradas de familias de paquetes; `search` de nivel superior sigue siendo la superficie de búsqueda de habilidades.
- Banderas:
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

- Obtiene metadatos del paquete sin instalar.
- Úsalo para metadatos de plugins, compatibilidad, verificación, origen e inspección de versiones/archivos.
- `--version <version>`: inspecciona una versión específica (valor predeterminado: la más reciente).
- `--tag <tag>`: inspecciona una versión etiquetada (p. ej., `latest`).
- `--versions`: lista el historial de versiones (primera página).
- `--limit <n>`: máximo de versiones para listar (1-100).
- `--files`: lista los archivos de la versión seleccionada.
- `--file <path>`: obtiene contenido de archivo sin procesar (solo archivos de texto; límite de 200 KB).
- `--json`: salida legible por máquina.

### `package download <name>`

- Resuelve una versión de paquete mediante
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Descarga el artefacto desde el `downloadUrl` del resolutor.
- Verifica el SHA-256 de ClawHub para todos los artefactos.
- Para artefactos ClawPack npm-pack, también verifica la integridad `sha512` de npm,
  el shasum de npm y el nombre/versión de `package.json` del tarball.
- Las versiones ZIP heredadas se descargan mediante la ruta ZIP heredada.
- Banderas:
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

- Calcula el SHA-256 de ClawHub, la integridad `sha512` de npm y el shasum de npm para un
  artefacto local.
- Con `--package`, resuelve los metadatos esperados desde ClawHub y compara el
  archivo local con los metadatos del artefacto publicado.
- Con banderas de resumen directas, verifica sin una consulta de red.
- Banderas:
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

- Ejecuta el Plugin Inspector incluido en la CLI de ClawHub contra una carpeta local de paquete de plugin.
- De forma predeterminada usa validación offline/estática, sin ubicar ni importar un checkout local de
  OpenClaw.
- Los errores graves de compatibilidad salen con código distinto de cero. Los hallazgos solo de advertencia se imprimen pero
  salen con código cero.
- Banderas:
  - `--out <dir>`: escribe informes de Plugin Inspector en este directorio.
  - `--openclaw <path>`: inspecciona contra un checkout local explícito de OpenClaw.
  - `--runtime`: habilita la captura de runtime; importa código del plugin.
  - `--allow-execute`: permite la captura de runtime en un espacio de trabajo aislado.
  - `--no-mock-sdk`: deshabilita el SDK simulado de OpenClaw durante la captura de runtime.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package validate ./example-plugin
```

Si la validación informa un hallazgo de paquete, manifiesto, importación del SDK o artefacto, consulta
[Correcciones de validación de Plugin](/clawhub/plugin-validation-fixes) y luego vuelve a ejecutar el comando.

### `package delete <name>`

- Sin `--version`, elimina de forma reversible un paquete y todas sus publicaciones.
- `--version <version>` elimina permanentemente una publicación propia que no sea la más reciente mediante una ruta de cierre ante fallo
  específica de la versión.
  Las versiones eliminadas no se pueden restaurar ni volver a publicar. Publica un reemplazo antes de eliminar la
  versión más reciente actual. Este flujo exclusivo de versión requiere el propietario del paquete o un administrador de publicador
  de organización; el personal de la plataforma no omite la propiedad del paquete.
- La eliminación reversible de un paquete completo requiere el propietario del paquete, un propietario/administrador de publicador de organización, un moderador
  de plataforma o un administrador de plataforma.
- Banderas:
  - `--version <version>`: elimina permanentemente una versión que no sea la más reciente.
  - `--yes`: omite la confirmación.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Restaura un paquete eliminado de forma reversible y sus publicaciones.
- No hay recuperación de versión eliminada; las versiones eliminadas permanentemente no se pueden restaurar.
- Requiere el propietario del paquete, un propietario/administrador de publicador de organización, un moderador
  de plataforma o un administrador de plataforma.
- Llama a `POST /api/v1/packages/{name}/undelete`.
- Banderas:
  - `--yes`: omite la confirmación.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Transfiere un paquete a otro publicador.
- Requiere acceso de administrador tanto al propietario actual del paquete como al publicador
  de destino, salvo que lo realice un administrador de plataforma.
- Los nombres de paquetes con ámbito deben transferirse al propietario del ámbito correspondiente.
- Llama a `POST /api/v1/packages/{name}/transfer`.
- Banderas:
  - `--to <owner>`: identificador del publicador de destino.
  - `--reason <text>`: motivo de auditoría opcional.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Comando autenticado para reportar un paquete a los moderadores.
- Llama a `POST /api/v1/packages/{name}/report`.
- Los reportes son de nivel de paquete, opcionalmente asociados a una versión, y se vuelven visibles
  para revisión por los moderadores.
- Los reportes no ocultan automáticamente los paquetes ni bloquean las descargas por sí mismos.
- Banderas:
  - `--version <version>`: versión opcional del paquete para adjuntar al reporte.
  - `--reason <text>`: motivo requerido del reporte.
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Comando de propietario para comprobar la visibilidad de moderación del paquete.
- Llama a `GET /api/v1/packages/{name}/moderation`.
- Muestra el estado actual de escaneo del paquete, el recuento de reportes abiertos, el estado de moderación manual de la publicación
  más reciente, el estado de bloqueo de descarga y los motivos de moderación.
- Banderas:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Comprueba si un paquete está listo para el consumo futuro de OpenClaw.
- Llama a `GET /api/v1/packages/{name}/readiness`.
- Informa bloqueadores de estado oficial, disponibilidad de ClawPack, resumen de artefacto,
  procedencia del origen, compatibilidad con OpenClaw, destinos de host, metadatos de entorno
  y estado de escaneo.
- Banderas:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Muestra el estado de migración orientado a operadores para un paquete que puede reemplazar un
  plugin incluido de OpenClaw.
- Llama al mismo endpoint de preparación calculada que `package readiness`, pero imprime
  estado enfocado en migración, versión más reciente, estado de paquete oficial, comprobaciones y
  bloqueadores.
- Banderas:
  - `--json`: salida legible por máquina.

Ejemplo:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Crea un publicador de organización propiedad del usuario autenticado.
- El identificador se normaliza a minúsculas y puede pasarse con o sin `@`.
- Los publicadores de organización recién creados no son de confianza/oficiales de forma predeterminada.
- Falla si el identificador ya lo usa un publicador, usuario o ruta reservada existente.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Publica un Plugin de código o un Plugin de bundle mediante `POST /api/v1/packages`.
- `<source>` acepta:
  - Ruta de carpeta local: `./my-plugin`
  - Tarball local de ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - Repositorio de GitHub: `owner/repo` u `owner/repo@ref`
  - URL de GitHub: `https://github.com/owner/repo`
- Los metadatos se detectan automáticamente desde `package.json`, `openclaw.plugin.json` y
  marcadores reales de bundle de OpenClaw como `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` y `.cursor-plugin/plugin.json`.
- Las fuentes `.tgz` se tratan como ClawPack. La CLI carga los bytes exactos de npm-pack
  y usa el contenido extraído de `package/` solo para validación y
  prerrelleno de metadatos.
- Las carpetas de Plugins de código se empaquetan en un tarball npm de ClawPack antes de la carga para que
  las instalaciones de OpenClaw puedan verificar el artefacto exacto. Las carpetas de Plugins de bundle todavía
  usan la ruta de publicación de archivos extraídos.
- Para fuentes de GitHub, la atribución de origen se rellena automáticamente desde el repositorio, el commit resuelto, la ref y la subruta.
- Para carpetas locales, la atribución de origen se detecta automáticamente desde git local cuando el remoto de origen apunta a GitHub.
- Los Plugins de código externos deben declarar `openclaw.compat.pluginApi` y
  `openclaw.build.openclawVersion` explícitamente.
  El `package.json.version` de nivel superior no se usa como alternativa para la validación de publicación.
- `--dry-run` previsualiza la carga útil de publicación resuelta sin cargarla.
- `--json` emite salida legible por máquinas para CI.
- `--owner <handle>` publica bajo un identificador de publicador de usuario u organización cuando el actor tiene acceso de publicador.
- Los nombres de paquetes con ámbito deben coincidir con el propietario seleccionado. Consulta `docs/publishing.md`.
- Las banderas existentes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) siguen funcionando como sobrescrituras.
- Los repositorios privados de GitHub requieren `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Flujo local recomendado

Usa `--dry-run` primero para confirmar los metadatos del paquete resueltos y
la atribución de origen antes de crear una versión real:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flujo de carpeta local

Para Plugins de código, la publicación de carpetas crea y carga un artefacto ClawPack desde
la carpeta del paquete:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` mínimo para `--family code-plugin`

Los Plugins de código externos necesitan una pequeña cantidad de metadatos de OpenClaw en
`package.json`. Este manifiesto mínimo es suficiente para una publicación correcta:

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
  ClawHub puede mostrarlos cuando están presentes, pero no son obligatorios para publicar.
- `openclaw.compat.minGatewayVersion` y
  `openclaw.build.pluginSdkVersion` son extras opcionales si quieres publicar
  metadatos de compatibilidad más detallados.
- Si estás usando una versión anterior de la CLI `clawhub`, actualiza antes de publicar para que
  las comprobaciones previas locales se ejecuten antes de la carga.
- Si la validación informa un código de corrección, consulta
  [Correcciones de validación de Plugins](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub también incluye un flujo de trabajo reutilizable oficial en
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/c1ffa9aba27b78eda1066e5a8a54e30a51f393c2/.github/workflows/package-publish.yml)
para repositorios de Plugins.

Configuración típica del invocador:

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

- El flujo de trabajo reutilizable usa de forma predeterminada `source` como el repositorio invocador.
- Para monorepos, pasa `source_path` para que el flujo de trabajo publique la carpeta del paquete
  del Plugin, por ejemplo `source_path: extensions/codex`.
- Fija el flujo de trabajo reutilizable a una etiqueta estable o a un SHA de commit completo. No ejecutes publicaciones de versiones desde `@main`.
- `pull_request` debe usar `dry_run: true` para que CI no contamine.
- Las publicaciones reales deben limitarse a eventos de confianza como `workflow_dispatch` o pushes de etiquetas.
- La publicación de confianza sin secreto solo funciona en `workflow_dispatch`; los pushes de etiquetas todavía necesitan `clawhub_token`.
- Mantén `clawhub_token` disponible para la primera publicación, paquetes no confiables o publicaciones de emergencia.
- El flujo de trabajo carga el resultado JSON como artefacto y lo expone como salidas del flujo de trabajo.

### `package trusted-publisher get <name>`

- Muestra la configuración de publicador de confianza de GitHub Actions para un paquete.
- Usa esto después de establecer la configuración para confirmar el repositorio, el nombre del archivo de flujo de trabajo
  y el anclaje opcional de entorno.
- Banderas:
  - `--json`: salida legible por máquinas.

Ejemplo:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Adjunta o reemplaza la configuración de publicador de confianza de GitHub Actions para un paquete
  existente.
- El paquete debe crearse primero mediante una publicación `clawhub package publish` normal manual o autenticada con token.
- Después de establecer la configuración, las futuras publicaciones compatibles de GitHub Actions pueden usar
  OIDC/publicación de confianza sin un token de ClawHub de larga duración.
- `--repository <repo>` debe ser `owner/repo`.
- `--workflow-filename <file>` debe coincidir con el nombre del archivo de flujo de trabajo en
  `.github/workflows/`.
- `--environment <name>` es opcional. Cuando se configura, el entorno de GitHub Actions
  en la afirmación OIDC debe coincidir exactamente.
- ClawHub verifica el repositorio de GitHub configurado cuando se ejecuta este comando.
  Los repositorios públicos pueden verificarse mediante metadatos públicos de GitHub. Los repositorios privados
  requieren que ClawHub tenga acceso de GitHub a ese repositorio, por
  ejemplo mediante una futura instalación de la GitHub App de ClawHub u otra integración autorizada
  de GitHub.
- Banderas:
  - `--repository <repo>`: repositorio de GitHub, por ejemplo `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nombre del archivo de flujo de trabajo, por ejemplo `package-publish.yml`.
  - `--environment <name>`: entorno de GitHub Actions opcional de coincidencia exacta.
  - `--json`: salida legible por máquinas.

Ejemplo:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Elimina la configuración de publicador de confianza de un paquete.
- Usa esto como reversión si el flujo de trabajo, el repositorio o el anclaje de entorno deben
  deshabilitarse o volver a crearse.
- Las futuras publicaciones reales deben usar publicación autenticada normal hasta que la configuración se
  establezca de nuevo.
- Banderas:
  - `--json`: salida legible por máquinas.

Ejemplo:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetría de instalación

- Se envía después de `clawhub install <slug>` al iniciar sesión, salvo que
  `CLAWHUB_DISABLE_TELEMETRY=1` esté configurado.
- El reporte se realiza con el mejor esfuerzo. Los comandos de instalación no fallan si la telemetría
  no está disponible.
- Detalles: `docs/telemetry.md`.
