---
read_when:
    - Buscar, instalar o actualizar Skills o plugins
    - Publicar Skills o Plugins en el registro
    - Configurar la CLI de clawhub o sus anulaciones de entorno
sidebarTitle: ClawHub
summary: 'ClawHub: registro público para Skills y plugins de OpenClaw, flujos de instalación nativos y la CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T05:50:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub es el registro público para **Skills y plugins de OpenClaw**.

- Usa comandos nativos de `openclaw` para buscar, instalar y actualizar Skills, y para instalar plugins desde ClawHub.
- Usa la CLI `clawhub` separada para flujos de autenticación del registro, publicación, eliminación/restauración y sincronización.

Sitio: [clawhub.ai](https://clawhub.ai)

## Inicio rápido

<Steps>
  <Step title="Buscar">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Instalar">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Usar">
    Inicia una nueva sesión de OpenClaw: detectará la nueva skill.
  </Step>
  <Step title="Publicar (opcional)">
    Para flujos autenticados con el registro (publicar, sincronizar, administrar), instala
    la CLI `clawhub` separada:

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
    conservan los metadatos de origen para que las llamadas posteriores a `update` puedan seguir en ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` consulta el catálogo de plugins de ClawHub e imprime nombres
    de paquetes listos para instalar. Usa `clawhub:<package>` cuando quieras la resolución de ClawHub.
    Las especificaciones de plugin básicas compatibles con npm se instalan desde npm durante la transición de lanzamiento:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` también es solo npm y resulta útil cuando una especificación podría ser
    ambigua:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Las instalaciones de plugins validan la compatibilidad anunciada de `pluginApi` y
    `minGatewayVersion` antes de que se ejecute la instalación del archivo, por lo que
    los hosts incompatibles fallan de forma cerrada temprano en lugar de instalar parcialmente
    el paquete. Cuando una versión de paquete publica un artefacto ClawPack,
    OpenClaw prefiere el `.tgz` exacto de npm-pack subido, verifica el encabezado de resumen de ClawHub
    y los bytes descargados, y registra el tipo de artefacto, la integridad de npm,
    el shasum de npm, el nombre del tarball y los metadatos de resumen de ClawPack para actualizaciones
    posteriores. Las versiones de paquetes anteriores sin metadatos de ClawPack siguen usando la
    ruta heredada de verificación de archivo de paquete.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` solo acepta familias de plugins
instalables. Si un paquete de ClawHub es en realidad una skill, OpenClaw se detiene y
te dirige a `openclaw skills install <slug>` en su lugar.

Las instalaciones anónimas de plugins de ClawHub también fallan de forma cerrada para paquetes privados.
Los canales comunitarios u otros no oficiales aún pueden instalarse, pero OpenClaw
advierte para que los operadores puedan revisar el origen y la verificación antes de habilitarlos.
</Note>

## Qué es ClawHub

- Un registro público para Skills y plugins de OpenClaw.
- Un almacén versionado de paquetes de Skills y metadatos.
- Una superficie de descubrimiento para búsquedas, etiquetas y señales de uso.

Una skill típica es un paquete versionado de archivos que incluye:

- Un archivo `SKILL.md` con la descripción principal y el uso.
- Configuraciones, scripts o archivos de apoyo opcionales usados por la skill.
- Metadatos como etiquetas, resumen y requisitos de instalación.

ClawHub usa metadatos para impulsar el descubrimiento y exponer de forma segura las
capacidades de las Skills. El registro hace seguimiento de señales de uso (estrellas, descargas) para
mejorar la clasificación y la visibilidad. Cada publicación crea una nueva versión
semver, y el registro conserva el historial de versiones para que los usuarios puedan auditar
los cambios.

## Espacio de trabajo y carga de Skills

La CLI `clawhub` separada también instala Skills en `./skills` dentro de
tu directorio de trabajo actual. Si hay configurado un espacio de trabajo de OpenClaw,
`clawhub` recurre a ese espacio de trabajo a menos que sobrescribas `--workdir`
(o `CLAWHUB_WORKDIR`). OpenClaw carga las Skills del espacio de trabajo desde
`<workspace>/skills` y las detecta en la **siguiente** sesión.

Si ya usas `~/.openclaw/skills` o Skills incluidas, las Skills del espacio de trabajo
tienen prioridad. Para más detalles sobre cómo se cargan, comparten
y controlan las Skills, consulta [Skills](/es/tools/skills).

## Funciones del servicio

| Función                  | Notas                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Navegación pública          | Las Skills y su contenido `SKILL.md` son visibles públicamente.          |
| Búsqueda                   | Impulsada por embeddings (búsqueda vectorial), no solo palabras clave.               |
| Versionado               | Semver, registros de cambios y etiquetas (incluida `latest`).                  |
| Descargas                | Zip por versión.                                                    |
| Estrellas y comentarios       | Comentarios de la comunidad.                                                 |
| Resúmenes de análisis de seguridad  | Las páginas de detalle muestran el estado del análisis más reciente antes de instalar o descargar. |
| Páginas de detalle del escáner     | Los resultados de VirusTotal, ClawScan y análisis estático tienen enlaces profundos.  |
| Panel de recuperación del propietario | Los publicadores pueden ver contenido propio retenido por análisis desde `/dashboard`.       |
| Reanálisis solicitados por propietarios  | Los propietarios pueden solicitar reanálisis limitados para recuperación de falsos positivos.     |
| Moderación               | Aprobaciones y auditorías.                                               |
| API compatible con CLI         | Adecuada para automatización y scripting.                              |

## Seguridad y moderación

ClawHub es abierto de forma predeterminada: cualquiera puede subir Skills, pero una cuenta de GitHub
debe tener **al menos una semana de antigüedad** para publicar. Esto ralentiza el
abuso sin bloquear a colaboradores legítimos.

<AccordionGroup>
  <Accordion title="Análisis de seguridad">
    ClawHub ejecuta comprobaciones de seguridad automatizadas en Skills publicadas y lanzamientos
    de plugins. Las páginas de detalle públicas resumen el resultado actual, y las filas de escáner
    enlazan a páginas de detalle dedicadas para VirusTotal, ClawScan y análisis
    estático.

    Los lanzamientos retenidos por análisis o bloqueados pueden no estar disponibles en el catálogo público y
    las superficies de instalación mientras siguen siendo visibles para su propietario en `/dashboard`.

  </Accordion>
  <Accordion title="Reportes">
    - Cualquier usuario con sesión iniciada puede reportar una skill.
    - Los motivos del reporte son obligatorios y se registran.
    - Cada usuario puede tener hasta 20 reportes activos a la vez.
    - Las Skills con más de 3 reportes únicos se ocultan automáticamente de forma predeterminada.

  </Accordion>
  <Accordion title="Moderación">
    - Los moderadores pueden ver Skills ocultas, volver a mostrarlas, eliminarlas o prohibir usuarios.
    - Abusar de la función de reportes puede resultar en prohibiciones de cuenta.
    - ¿Te interesa ser moderador? Pregunta en el Discord de OpenClaw y contacta a un moderador o mantenedor.

  </Accordion>
</AccordionGroup>

## CLI de ClawHub

Solo necesitas esto para flujos autenticados con el registro, como
publicación/sincronización.

### Opciones globales

<ParamField path="--workdir <dir>" type="string">
  Directorio de trabajo. Valor predeterminado: directorio actual; recurre al espacio de trabajo de OpenClaw.
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
  Deshabilita los prompts (no interactivo).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Imprime la versión de la CLI.
</ParamField>

### Comandos

<AccordionGroup>
  <Accordion title="Autenticación (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opciones de inicio de sesión:

    - `--token <token>`: pega un token de API.
    - `--label <label>`: etiqueta almacenada para tokens de inicio de sesión en navegador (valor predeterminado: `CLI token`).
    - `--no-browser`: no abrir un navegador (requiere `--token`).

  </Accordion>
  <Accordion title="Búsqueda">
    ```bash
    clawhub search "query"
    ```

    Busca Skills. Para descubrimiento de plugins/paquetes, usa `clawhub package explore`.

    - `--limit <n>`: resultados máximos.

  </Accordion>
  <Accordion title="Explorar / inspeccionar plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` y `package inspect` son las superficies de la CLI de ClawHub para descubrimiento de plugins/paquetes e inspección de metadatos. Las instalaciones nativas de OpenClaw siguen usando `openclaw plugins install clawhub:<package>`.

    Opciones:

    - `--family skill|code-plugin|bundle-plugin`: filtra la familia de paquete.
    - `--official`: muestra solo paquetes oficiales.
    - `--executes-code`: muestra solo paquetes que ejecutan código.
    - `--version <version>` / `--tag <tag>`: inspecciona una versión específica del paquete.
    - `--versions`, `--files`, `--file <path>`: inspecciona el historial y los archivos del paquete.
    - `--json`: salida legible por máquina.

  </Accordion>
  <Accordion title="Instalar / actualizar / listar">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opciones:

    - `--version <version>`: instala o actualiza a una versión específica (solo un slug en `update`).
    - `--force`: sobrescribe si la carpeta ya existe, o cuando los archivos locales no coinciden con ninguna versión publicada.
    - `clawhub list` lee `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publicar Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opciones:

    - `--slug <slug>`: slug de la skill.
    - `--name <name>`: nombre visible.
    - `--version <version>`: versión semver.
    - `--changelog <text>`: texto del registro de cambios (puede estar vacío).
    - `--tags <tags>`: etiquetas separadas por comas (valor predeterminado: `latest`).

  </Accordion>
  <Accordion title="Publicar plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` puede ser una carpeta local, `owner/repo`, `owner/repo@ref` o una
    URL de GitHub.

    Opciones:

    - `--dry-run`: construye el plan de publicación exacto sin subir nada.
    - `--json`: emite salida legible por máquina para CI.
    - `--source-repo`, `--source-commit`, `--source-ref`: sobrescrituras opcionales cuando la detección automática no es suficiente.

  </Accordion>
  <Accordion title="Solicitar reanálisis">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Los comandos de reanálisis requieren un token de propietario con sesión iniciada y apuntan a la versión de skill
    publicada más reciente o al lanzamiento de plugin. En ejecuciones no interactivas, pasa
    `--yes`.

    Las respuestas JSON incluyen el tipo de objetivo, nombre, versión, estado de reanálisis y
    recuentos de solicitudes restantes/máximos para esa versión o lanzamiento.

  </Accordion>
  <Accordion title="Eliminar / restaurar (propietario o administrador)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sincronizar (analizar local + publicar nuevo o actualizado)">
    ```bash
    clawhub sync
    ```

    Opciones:

    - `--root <dir...>`: raíces de análisis adicionales.
    - `--all`: sube todo sin prompts.
    - `--dry-run`: muestra qué se subiría.
    - `--bump <type>`: `patch|minor|major` para actualizaciones (valor predeterminado: `patch`).
    - `--changelog <text>`: registro de cambios para actualizaciones no interactivas.
    - `--tags <tags>`: etiquetas separadas por comas (valor predeterminado: `latest`).
    - `--concurrency <n>`: comprobaciones del registro (valor predeterminado: `4`).

  </Accordion>
</AccordionGroup>

## Flujos de trabajo comunes

<Tabs>
  <Tab title="Buscar">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Buscar un plugin">
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
  <Tab title="Publicar una sola skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sincronizar muchas Skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publicar un plugin desde GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadatos del paquete de Plugin

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

Los paquetes publicados deben incluir **JavaScript compilado** y apuntar
`runtimeExtensions` a esa salida. Las instalaciones desde checkout de Git aún pueden
recurrir al código fuente TypeScript cuando no existan archivos compilados, pero las entradas
de runtime compiladas evitan la compilación de TypeScript en tiempo de ejecución durante el inicio, doctor y
las rutas de carga de plugins.

## Versionado, lockfile y telemetría

<AccordionGroup>
  <Accordion title="Versionado y etiquetas">
    - Cada publicación crea una nueva `SkillVersion` **semver**.
    - Las etiquetas (como `latest`) apuntan a una versión; mover etiquetas te permite revertir.
    - Los changelogs se adjuntan por versión y pueden estar vacíos al sincronizar o publicar actualizaciones.

  </Accordion>
  <Accordion title="Cambios locales frente a versiones del registro">
    Las actualizaciones comparan el contenido local de la skill con las versiones del registro mediante un
    hash de contenido. Si los archivos locales no coinciden con ninguna versión publicada, la
    CLI pregunta antes de sobrescribir (o requiere `--force` en
    ejecuciones no interactivas).
  </Accordion>
  <Accordion title="Escaneo de sincronización y raíces de respaldo">
    `clawhub sync` escanea primero tu workdir actual. Si no se encuentran Skills,
    recurre a ubicaciones heredadas conocidas (por ejemplo
    `~/openclaw/skills` y `~/.openclaw/skills`). Esto está diseñado para
    encontrar instalaciones de Skills antiguas sin flags adicionales.
  </Accordion>
  <Accordion title="Almacenamiento y lockfile">
    - Las Skills instaladas se registran en `.clawhub/lock.json` bajo tu workdir.
    - Los tokens de autenticación se almacenan en el archivo de configuración de la CLI de ClawHub (anula mediante `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetría (conteos de instalación)">
    Cuando ejecutas `clawhub sync` con sesión iniciada, la CLI envía una instantánea
    mínima para calcular los conteos de instalación. Puedes desactivar esto por completo:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variables de entorno

| Variable                      | Efecto                                          |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Anula la URL del sitio.                         |
| `CLAWHUB_REGISTRY`            | Anula la URL de la API del registro.            |
| `CLAWHUB_CONFIG_PATH`         | Anula dónde almacena la CLI el token/configuración. |
| `CLAWHUB_WORKDIR`             | Anula el workdir predeterminado.                |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desactiva la telemetría en `sync`.              |

## Relacionado

- [Plugins de la comunidad](/es/plugins/community)
- [Plugins](/es/tools/plugin)
- [Skills](/es/tools/skills)
