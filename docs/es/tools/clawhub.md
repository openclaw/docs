---
read_when:
    - Presentando ClawHub a usuarios nuevos
    - Instalar, buscar o publicar Skills o Plugins
    - Explicando banderas de la CLI de ClawHub y el comportamiento de sincronización
summary: 'Guía de ClawHub: registro público, flujos de instalación nativos de OpenClaw y flujos de trabajo de la CLI de ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T05:52:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub es el registro público de **Skills y Plugins de OpenClaw**.

- Usa los comandos nativos de `openclaw` para buscar/instalar/actualizar Skills e instalar
  Plugins desde ClawHub.
- Usa la CLI independiente `clawhub` cuando necesites autenticación del registro, publicar, eliminar,
  restaurar o flujos de sincronización.

Sitio: [clawhub.ai](https://clawhub.ai)

## Flujos nativos de OpenClaw

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Las especificaciones de Plugin bare compatibles con npm también se prueban contra ClawHub antes que contra npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Los comandos nativos de `openclaw` instalan en tu espacio de trabajo activo y persisten los metadatos de origen
para que llamadas posteriores a `update` puedan mantenerse en ClawHub.

Las instalaciones de Plugins validan la compatibilidad anunciada de `pluginApi` y `minGatewayVersion`
antes de ejecutar la instalación del archivo, de modo que los hosts incompatibles fallen en modo cerrado
temprano en lugar de instalar parcialmente el paquete.

`openclaw plugins install clawhub:...` solo acepta familias de Plugins instalables.
Si un paquete de ClawHub es en realidad una Skill, OpenClaw se detiene y te indica
`openclaw skills install <slug>` en su lugar.

## Qué es ClawHub

- Un registro público de Skills y Plugins de OpenClaw.
- Un almacén versionado de bundles de Skills y metadatos.
- Una superficie de descubrimiento para búsqueda, etiquetas y señales de uso.

## Cómo funciona

1. Un usuario publica un bundle de Skill (archivos + metadatos).
2. ClawHub almacena el bundle, analiza los metadatos y asigna una versión.
3. El registro indexa la Skill para búsqueda y descubrimiento.
4. Los usuarios navegan, descargan e instalan Skills en OpenClaw.

## Qué puedes hacer

- Publicar Skills nuevas y nuevas versiones de Skills existentes.
- Descubrir Skills por nombre, etiquetas o búsqueda.
- Descargar bundles de Skills e inspeccionar sus archivos.
- Informar sobre Skills abusivas o inseguras.
- Si eres moderador, ocultar, mostrar, eliminar o banear.

## Para quién es esto (apto para principiantes)

Si quieres añadir nuevas capacidades a tu agente OpenClaw, ClawHub es la forma más sencilla de encontrar e instalar Skills. No necesitas saber cómo funciona el backend. Puedes:

- Buscar Skills en lenguaje natural.
- Instalar una Skill en tu espacio de trabajo.
- Actualizar Skills después con un solo comando.
- Hacer copia de seguridad de tus propias Skills publicándolas.

## Inicio rápido (no técnico)

1. Busca algo que necesites:
   - `openclaw skills search "calendar"`
2. Instala una Skill:
   - `openclaw skills install <skill-slug>`
3. Inicia una nueva sesión de OpenClaw para que recoja la nueva Skill.
4. Si quieres publicar o gestionar autenticación del registro, instala también la
   CLI independiente `clawhub`.

## Instalar la CLI de ClawHub

Solo la necesitas para flujos autenticados del registro como publicar/sincronizar:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Cómo encaja en OpenClaw

`openclaw skills install` nativo instala en el directorio `skills/`
del espacio de trabajo activo. `openclaw plugins install clawhub:...` registra una instalación normal gestionada
de Plugin más metadatos de origen de ClawHub para actualizaciones.

Las instalaciones anónimas de Plugins de ClawHub también fallan en modo cerrado para paquetes privados.
Los canales comunitarios u otros no oficiales aún pueden instalar, pero OpenClaw advierte
para que los operadores puedan revisar la fuente y la verificación antes de habilitarlos.

La CLI independiente `clawhub` también instala Skills en `./skills` bajo tu
directorio de trabajo actual. Si hay configurado un espacio de trabajo de OpenClaw, `clawhub`
recurre a ese espacio de trabajo a menos que anules `--workdir` (o
`CLAWHUB_WORKDIR`). OpenClaw carga Skills del espacio de trabajo desde `<workspace>/skills`
y las recogerá en la **siguiente** sesión. Si ya usas
`~/.openclaw/skills` o Skills incluidas, las Skills del espacio de trabajo tienen prioridad.

Para más detalle sobre cómo se cargan, comparten y controlan las Skills, consulta
[Skills](/es/tools/skills).

## Resumen del sistema de Skills

Una Skill es un bundle versionado de archivos que enseña a OpenClaw cómo realizar una
tarea específica. Cada publicación crea una nueva versión, y el registro mantiene un
historial de versiones para que los usuarios puedan auditar cambios.

Una Skill típica incluye:

- Un archivo `SKILL.md` con la descripción y el uso principal.
- Configuraciones, scripts o archivos de apoyo opcionales usados por la Skill.
- Metadatos como etiquetas, resumen y requisitos de instalación.

ClawHub usa metadatos para impulsar el descubrimiento y exponer con seguridad las capacidades de la Skill.
El registro también rastrea señales de uso (como estrellas y descargas) para mejorar
el ranking y la visibilidad.

## Lo que ofrece el servicio (funciones)

- **Navegación pública** de Skills y de su contenido `SKILL.md`.
- **Búsqueda** impulsada por embeddings (búsqueda vectorial), no solo por palabras clave.
- **Versionado** con semver, changelogs y etiquetas (incluida `latest`).
- **Descargas** como zip por versión.
- **Estrellas y comentarios** para feedback de la comunidad.
- **Hooks de moderación** para aprobaciones y auditorías.
- **API amigable para CLI** para automatización y scripting.

## Seguridad y moderación

ClawHub es abierto por defecto. Cualquiera puede subir Skills, pero una cuenta de GitHub debe
tener al menos una semana de antigüedad para publicar. Esto ayuda a frenar abusos sin bloquear
a colaboradores legítimos.

Informes y moderación:

- Cualquier usuario con sesión iniciada puede informar sobre una Skill.
- Los motivos del informe son obligatorios y se registran.
- Cada usuario puede tener hasta 20 informes activos a la vez.
- Las Skills con más de 3 informes únicos se ocultan automáticamente por defecto.
- Los moderadores pueden ver Skills ocultas, volver a mostrarlas, eliminarlas o banear usuarios.
- Abusar de la función de informe puede dar lugar a baneos de cuenta.

¿Te interesa convertirte en moderador? Pregunta en el Discord de OpenClaw y contacta con un
moderador o mantenedor.

## Comandos CLI y parámetros

Opciones globales (se aplican a todos los comandos):

- `--workdir <dir>`: directorio de trabajo (predeterminado: directorio actual; recurre al espacio de trabajo de OpenClaw).
- `--dir <dir>`: directorio de Skills, relativo a workdir (predeterminado: `skills`).
- `--site <url>`: URL base del sitio (inicio de sesión en navegador).
- `--registry <url>`: URL base de la API del registro.
- `--no-input`: desactiva prompts (no interactivo).
- `-V, --cli-version`: imprime la versión de la CLI.

Autenticación:

- `clawhub login` (flujo de navegador) o `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opciones:

- `--token <token>`: pega un token de API.
- `--label <label>`: etiqueta almacenada para tokens de inicio de sesión en navegador (predeterminado: `CLI token`).
- `--no-browser`: no abrir un navegador (requiere `--token`).

Búsqueda:

- `clawhub search "query"`
- `--limit <n>`: máximo de resultados.

Instalación:

- `clawhub install <slug>`
- `--version <version>`: instala una versión específica.
- `--force`: sobrescribe si la carpeta ya existe.

Actualización:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: actualiza a una versión específica (solo un slug).
- `--force`: sobrescribe cuando los archivos locales no coinciden con ninguna versión publicada.

Listar:

- `clawhub list` (lee `.clawhub/lock.json`)

Publicar Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: slug de la Skill.
- `--name <name>`: nombre visible.
- `--version <version>`: versión semver.
- `--changelog <text>`: texto del changelog (puede estar vacío).
- `--tags <tags>`: etiquetas separadas por comas (predeterminado: `latest`).

Publicar Plugins:

- `clawhub package publish <source>`
- `<source>` puede ser una carpeta local, `owner/repo`, `owner/repo@ref` o una URL de GitHub.
- `--dry-run`: construye el plan exacto de publicación sin subir nada.
- `--json`: emite salida legible por máquina para CI.
- `--source-repo`, `--source-commit`, `--source-ref`: anulaciones opcionales cuando la autodetección no basta.

Eliminar/restaurar (solo propietario/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sincronizar (analizar Skills locales + publicar nuevas/actualizadas):

- `clawhub sync`
- `--root <dir...>`: raíces extra de análisis.
- `--all`: sube todo sin prompts.
- `--dry-run`: muestra qué se subiría.
- `--bump <type>`: `patch|minor|major` para actualizaciones (predeterminado: `patch`).
- `--changelog <text>`: changelog para actualizaciones no interactivas.
- `--tags <tags>`: etiquetas separadas por comas (predeterminado: `latest`).
- `--concurrency <n>`: comprobaciones del registro (predeterminado: 4).

## Flujos de trabajo comunes para agentes

### Buscar Skills

```bash
clawhub search "postgres backups"
```

### Descargar Skills nuevas

```bash
clawhub install my-skill-pack
```

### Actualizar Skills instaladas

```bash
clawhub update --all
```

### Hacer copia de seguridad de tus Skills (publicar o sincronizar)

Para una sola carpeta de Skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Para analizar y hacer copia de seguridad de muchas Skills a la vez:

```bash
clawhub sync --all
```

### Publicar un Plugin desde GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Los Plugins de código deben incluir los metadatos requeridos de OpenClaw en `package.json`:

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

Los paquetes publicados deberían incluir JavaScript ya compilado y apuntar `runtimeExtensions`
a esa salida. Las instalaciones desde copias Git pueden seguir recurriendo al código fuente TypeScript
cuando no existan archivos compilados, pero las entradas de tiempo de ejecución compiladas evitan
la compilación de TypeScript en tiempo de ejecución en rutas de inicio, doctor y carga de Plugins.

## Detalles avanzados (técnicos)

### Versionado y etiquetas

- Cada publicación crea una nueva `SkillVersion` **semver**.
- Las etiquetas (como `latest`) apuntan a una versión; mover etiquetas te permite revertir.
- Los changelogs se adjuntan por versión y pueden estar vacíos al sincronizar o publicar actualizaciones.

### Cambios locales frente a versiones del registro

Las actualizaciones comparan el contenido local de la Skill con las versiones del registro usando un hash de contenido. Si los archivos locales no coinciden con ninguna versión publicada, la CLI pregunta antes de sobrescribir (o requiere `--force` en ejecuciones no interactivas).

### Análisis de sync y raíces de reserva

`clawhub sync` analiza primero tu workdir actual. Si no encuentra Skills, recurre a ubicaciones heredadas conocidas (por ejemplo `~/openclaw/skills` y `~/.openclaw/skills`). Esto está diseñado para encontrar instalaciones antiguas de Skills sin banderas adicionales.

### Almacenamiento y lockfile

- Las Skills instaladas se registran en `.clawhub/lock.json` bajo tu workdir.
- Los tokens de autenticación se almacenan en el archivo de configuración de la CLI de ClawHub (anúlalo con `CLAWHUB_CONFIG_PATH`).

### Telemetría (recuentos de instalación)

Cuando ejecutas `clawhub sync` con la sesión iniciada, la CLI envía una instantánea mínima para calcular recuentos de instalación. Puedes desactivar esto por completo:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variables de entorno

- `CLAWHUB_SITE`: anula la URL del sitio.
- `CLAWHUB_REGISTRY`: anula la URL de la API del registro.
- `CLAWHUB_CONFIG_PATH`: anula dónde almacena la CLI el token/configuración.
- `CLAWHUB_WORKDIR`: anula el workdir predeterminado.
- `CLAWHUB_DISABLE_TELEMETRY=1`: desactiva la telemetría en `sync`.

## Relacionado

- [Plugin](/es/tools/plugin)
- [Skills](/es/tools/skills)
- [Plugins de la comunidad](/es/plugins/community)
