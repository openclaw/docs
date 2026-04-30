---
read_when:
    - Buscar, instalar o actualizar Skills o plugins
    - Publicación de Skills o Plugins en el registro
    - Configurar la CLI de clawhub o sus anulaciones de entorno
sidebarTitle: ClawHub
summary: 'ClawHub: registro público para Skills y plugins de OpenClaw, flujos de instalación nativos y la CLI de clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-30T06:03:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub es el registro público de **Skills y plugins de OpenClaw**.

- Usa comandos nativos de `openclaw` para buscar, instalar y actualizar Skills, y para instalar plugins desde ClawHub.
- Usa la CLI `clawhub` independiente para flujos de autenticación del registro, publicación, eliminación/restauración y sincronización.

Sitio: [clawhub.ai](https://clawhub.ai)

## Inicio rápido

<Steps>
  <Step title="Search">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Install">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Use">
    Inicia una nueva sesión de OpenClaw: detectará la nueva skill.
  </Step>
  <Step title="Publish (optional)">
    Para flujos autenticados con el registro (publicar, sincronizar, administrar), instala
    la CLI `clawhub` independiente:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Flujos nativos de OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Los comandos nativos de `openclaw` instalan en tu espacio de trabajo activo y
    conservan los metadatos de origen para que las llamadas posteriores a `update` puedan seguir usando ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Las especificaciones de plugin simples y seguras para npm también se prueban contra ClawHub antes que npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Usa `npm:<package>` cuando quieras resolución solo mediante npm sin una
    consulta a ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Las instalaciones de plugins validan la compatibilidad anunciada de `pluginApi` y
    `minGatewayVersion` antes de ejecutar la instalación del archivo, de modo que
    los hosts incompatibles fallan de forma cerrada temprano en vez de instalar
    parcialmente el paquete.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` solo acepta familias de plugins
instalables. Si un paquete de ClawHub es en realidad una skill, OpenClaw se detiene y
te indica que uses `openclaw skills install <slug>` en su lugar.

Las instalaciones anónimas de plugins de ClawHub también fallan de forma cerrada para paquetes privados.
Los canales comunitarios u otros canales no oficiales aún pueden instalarse, pero OpenClaw
avisa para que los operadores puedan revisar el origen y la verificación antes de habilitarlos.
</Note>

## Qué es ClawHub

- Un registro público para Skills y plugins de OpenClaw.
- Un almacén versionado de paquetes de skills y metadatos.
- Una superficie de descubrimiento para búsquedas, etiquetas y señales de uso.

Una skill típica es un paquete versionado de archivos que incluye:

- Un archivo `SKILL.md` con la descripción principal y el uso.
- Configuraciones, scripts o archivos de soporte opcionales usados por la skill.
- Metadatos como etiquetas, resumen y requisitos de instalación.

ClawHub usa metadatos para impulsar el descubrimiento y exponer de forma segura las
capacidades de las skills. El registro rastrea señales de uso (estrellas, descargas) para
mejorar la clasificación y la visibilidad. Cada publicación crea una nueva versión semver,
y el registro conserva el historial de versiones para que los usuarios puedan auditar
los cambios.

## Espacio de trabajo y carga de skills

La CLI `clawhub` independiente también instala Skills en `./skills` dentro de
tu directorio de trabajo actual. Si hay un espacio de trabajo de OpenClaw configurado,
`clawhub` usa ese espacio de trabajo como alternativa a menos que sobrescribas `--workdir`
(o `CLAWHUB_WORKDIR`). OpenClaw carga Skills del espacio de trabajo desde
`<workspace>/skills` y las detecta en la **siguiente** sesión.

Si ya usas `~/.openclaw/skills` o Skills incluidas, las Skills del espacio de trabajo
tienen prioridad. Para más detalles sobre cómo se cargan, comparten y controlan las Skills,
consulta [Skills](/es/tools/skills).

## Funciones del servicio

| Función                  | Notas                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Exploración pública      | Las Skills y su contenido de `SKILL.md` son visibles públicamente.          |
| Búsqueda                 | Impulsada por embeddings (búsqueda vectorial), no solo palabras clave.               |
| Versionado               | Semver, registros de cambios y etiquetas (incluida `latest`).                  |
| Descargas                | Zip por versión.                                                    |
| Estrellas y comentarios  | Comentarios de la comunidad.                                                 |
| Resúmenes de análisis de seguridad | Las páginas de detalle muestran el estado del análisis más reciente antes de instalar o descargar. |
| Páginas de detalle de escáner | Los resultados de VirusTotal, ClawScan y análisis estático tienen enlaces profundos.  |
| Panel de recuperación del propietario | Los publicadores pueden ver desde `/dashboard` el contenido propio retenido por análisis.       |
| Reanálisis solicitados por el propietario | Los propietarios pueden solicitar reanálisis limitados para recuperación ante falsos positivos.     |
| Moderación               | Aprobaciones y auditorías.                                               |
| API apta para CLI        | Adecuada para automatización y scripts.                              |

## Seguridad y moderación

ClawHub es abierto por defecto: cualquiera puede subir Skills, pero una cuenta de GitHub
debe tener **al menos una semana de antigüedad** para publicar. Esto ralentiza
los abusos sin bloquear a colaboradores legítimos.

<AccordionGroup>
  <Accordion title="Security scans">
    ClawHub ejecuta comprobaciones de seguridad automatizadas en Skills y versiones de plugins
    publicadas. Las páginas de detalle públicas resumen el resultado actual, y las filas de escáner
    enlazan a páginas de detalle dedicadas para VirusTotal, ClawScan y análisis
    estático.

    Las versiones retenidas por análisis o bloqueadas pueden no estar disponibles en el catálogo público ni en
    superficies de instalación, aunque sigan siendo visibles para su propietario en `/dashboard`.

  </Accordion>
  <Accordion title="Reporting">
    - Cualquier usuario con sesión iniciada puede reportar una skill.
    - Los motivos del reporte son obligatorios y quedan registrados.
    - Cada usuario puede tener hasta 20 reportes activos a la vez.
    - Las Skills con más de 3 reportes únicos se ocultan automáticamente por defecto.

  </Accordion>
  <Accordion title="Moderation">
    - Los moderadores pueden ver Skills ocultas, volver a mostrarlas, eliminarlas o prohibir usuarios.
    - Abusar de la función de reportes puede resultar en la prohibición de la cuenta.
    - ¿Te interesa convertirte en moderador? Pregunta en el Discord de OpenClaw y contacta con un moderador o mantenedor.

  </Accordion>
</AccordionGroup>

## CLI de ClawHub

Solo necesitas esto para flujos autenticados con el registro, como
publicar/sincronizar.

### Opciones globales

<ParamField path="--workdir <dir>" type="string">
  Directorio de trabajo. Predeterminado: directorio actual; recurre al espacio de trabajo de OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Directorio de Skills, relativo a workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL base del sitio (inicio de sesión en navegador).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL base de la API del registro.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Desactiva los prompts (no interactivo).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Imprime la versión de la CLI.
</ParamField>

### Comandos

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opciones de inicio de sesión:

    - `--token <token>` — pega un token de API.
    - `--label <label>` — etiqueta almacenada para tokens de inicio de sesión en navegador (predeterminado: `CLI token`).
    - `--no-browser` — no abrir un navegador (requiere `--token`).

  </Accordion>
  <Accordion title="Search">
    ```bash
    clawhub search "query"
    ```

    Busca Skills. Para descubrir plugins/paquetes, usa `clawhub package explore`.

    - `--limit <n>` — resultados máximos.

  </Accordion>
  <Accordion title="Browse / inspect plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` y `package inspect` son las superficies de la CLI de ClawHub para descubrir plugins/paquetes e inspeccionar metadatos. Las instalaciones nativas de OpenClaw siguen usando `openclaw plugins install clawhub:<package>`.

    Opciones:

    - `--family skill|code-plugin|bundle-plugin` — filtrar familia de paquete.
    - `--official` — mostrar solo paquetes oficiales.
    - `--executes-code` — mostrar solo paquetes que ejecutan código.
    - `--version <version>` / `--tag <tag>` — inspeccionar una versión específica del paquete.
    - `--versions`, `--files`, `--file <path>` — inspeccionar el historial y los archivos del paquete.
    - `--json` — salida legible por máquinas.

  </Accordion>
  <Accordion title="Install / update / list">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opciones:

    - `--version <version>` — instalar o actualizar a una versión específica (solo un slug en `update`).
    - `--force` — sobrescribir si la carpeta ya existe, o cuando los archivos locales no coinciden con ninguna versión publicada.
    - `clawhub list` lee `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publish skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opciones:

    - `--slug <slug>` — slug de la skill.
    - `--name <name>` — nombre para mostrar.
    - `--version <version>` — versión semver.
    - `--changelog <text>` — texto del registro de cambios (puede estar vacío).
    - `--tags <tags>` — etiquetas separadas por comas (predeterminado: `latest`).

  </Accordion>
  <Accordion title="Publish plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` puede ser una carpeta local, `owner/repo`, `owner/repo@ref` o una
    URL de GitHub.

    Opciones:

    - `--dry-run` — construir el plan exacto de publicación sin subir nada.
    - `--json` — emitir salida legible por máquinas para CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — sobrescrituras opcionales cuando la detección automática no es suficiente.

  </Accordion>
  <Accordion title="Request rescans">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Los comandos de reanálisis requieren un token de propietario con sesión iniciada y apuntan a la versión de skill
    publicada más reciente o a la versión de plugin más reciente. En ejecuciones no interactivas, pasa
    `--yes`.

    Las respuestas JSON incluyen el tipo de destino, nombre, versión, estado de reanálisis y
    recuentos restantes/máximos de solicitudes para esa versión o release.

  </Accordion>
  <Accordion title="Delete / undelete (owner or admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sync (scan local + publish new or updated)">
    ```bash
    clawhub sync
    ```

    Opciones:

    - `--root <dir...>` — raíces de análisis adicionales.
    - `--all` — subir todo sin prompts.
    - `--dry-run` — mostrar qué se subiría.
    - `--bump <type>` — `patch|minor|major` para actualizaciones (predeterminado: `patch`).
    - `--changelog <text>` — registro de cambios para actualizaciones no interactivas.
    - `--tags <tags>` — etiquetas separadas por comas (predeterminado: `latest`).
    - `--concurrency <n>` — comprobaciones del registro (predeterminado: `4`).

  </Accordion>
</AccordionGroup>

## Flujos de trabajo comunes

<Tabs>
  <Tab title="Buscar">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Buscar un Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Instalar">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Actualizar todo">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publicar una sola Skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sincronizar muchas Skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publicar un Plugin desde GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadatos del paquete del Plugin

Los plugins de código deben incluir los metadatos requeridos de OpenClaw en
`package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Los paquetes publicados deben distribuir **JavaScript compilado** y apuntar
`runtimeExtensions` a esa salida. Las instalaciones desde una extracción de Git todavía pueden recurrir
al código fuente TypeScript cuando no existan archivos compilados, pero las entradas de runtime
compiladas evitan la compilación de TypeScript en runtime en las rutas de inicio, doctor y
carga de plugins.

## Versionado, archivo de bloqueo y telemetría

<AccordionGroup>
  <Accordion title="Versionado y etiquetas">
    - Cada publicación crea una nueva `SkillVersion` **semver**.
    - Las etiquetas (como `latest`) apuntan a una versión; mover etiquetas te permite revertir.
    - Los registros de cambios se adjuntan por versión y pueden estar vacíos al sincronizar o publicar actualizaciones.

  </Accordion>
  <Accordion title="Cambios locales frente a versiones del registro">
    Las actualizaciones comparan el contenido local de la Skill con las versiones del registro mediante un
    hash de contenido. Si los archivos locales no coinciden con ninguna versión publicada, la
    CLI pregunta antes de sobrescribir (o requiere `--force` en
    ejecuciones no interactivas).
  </Accordion>
  <Accordion title="Escaneo de sincronización y raíces de respaldo">
    `clawhub sync` escanea primero tu directorio de trabajo actual. Si no se encuentran Skills,
    recurre a ubicaciones heredadas conocidas (por ejemplo
    `~/openclaw/skills` y `~/.openclaw/skills`). Esto está diseñado para
    encontrar instalaciones de Skills más antiguas sin flags adicionales.
  </Accordion>
  <Accordion title="Almacenamiento y archivo de bloqueo">
    - Las Skills instaladas se registran en `.clawhub/lock.json` dentro de tu directorio de trabajo.
    - Los tokens de autenticación se almacenan en el archivo de configuración de la CLI de ClawHub (se puede anular mediante `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetría (recuentos de instalación)">
    Cuando ejecutas `clawhub sync` con sesión iniciada, la CLI envía una instantánea
    mínima para calcular los recuentos de instalación. Puedes desactivar esto por completo:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variables de entorno

| Variable                      | Efecto                                             |
| ----------------------------- | -------------------------------------------------- |
| `CLAWHUB_SITE`                | Anula la URL del sitio.                            |
| `CLAWHUB_REGISTRY`            | Anula la URL de la API del registro.               |
| `CLAWHUB_CONFIG_PATH`         | Anula dónde la CLI almacena el token/configuración. |
| `CLAWHUB_WORKDIR`             | Anula el directorio de trabajo predeterminado.     |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desactiva la telemetría en `sync`.                 |

## Relacionado

- [Plugins de la comunidad](/es/plugins/community)
- [Plugins](/es/tools/plugin)
- [Skills](/es/tools/skills)
