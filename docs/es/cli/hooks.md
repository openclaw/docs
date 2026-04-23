---
read_when:
    - Quieres gestionar hooks de agente
    - Quieres inspeccionar la disponibilidad de hooks o habilitar hooks del espacio de trabajo
summary: Referencia de CLI para `openclaw hooks` (hooks de agente)
title: hooks
x-i18n:
    generated_at: "2026-04-23T14:01:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gestiona hooks de agente (automatizaciones impulsadas por eventos para comandos como `/new`, `/reset` y el inicio del gateway).

Ejecutar `openclaw hooks` sin subcomando equivale a `openclaw hooks list`.

Relacionado:

- Hooks: [Hooks](/es/automation/hooks)
- Hooks de Plugin: [Hooks de Plugin](/es/plugins/architecture#provider-runtime-hooks)

## Listar todos los hooks

```bash
openclaw hooks list
```

Lista todos los hooks detectados de los directorios de espacio de trabajo, gestionados, extra y agrupados.
El inicio del gateway no carga controladores de hooks internos hasta que al menos un hook interno esté configurado.

**Opciones:**

- `--eligible`: Muestra solo los hooks elegibles (requisitos cumplidos)
- `--json`: Salida como JSON
- `-v, --verbose`: Muestra información detallada, incluidos los requisitos faltantes

**Ejemplo de salida:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Ejemplo (detallado):**

```bash
openclaw hooks list --verbose
```

Muestra los requisitos faltantes para los hooks no elegibles.

**Ejemplo (JSON):**

```bash
openclaw hooks list --json
```

Devuelve JSON estructurado para uso programático.

## Obtener información de un hook

```bash
openclaw hooks info <name>
```

Muestra información detallada sobre un hook específico.

**Argumentos:**

- `<name>`: Nombre del hook o clave del hook (por ejemplo, `session-memory`)

**Opciones:**

- `--json`: Salida como JSON

**Ejemplo:**

```bash
openclaw hooks info session-memory
```

**Salida:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Comprobar elegibilidad de hooks

```bash
openclaw hooks check
```

Muestra un resumen del estado de elegibilidad de los hooks (cuántos están listos frente a cuántos no).

**Opciones:**

- `--json`: Salida como JSON

**Ejemplo de salida:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Habilitar un hook

```bash
openclaw hooks enable <name>
```

Habilita un hook específico añadiéndolo a tu configuración (`~/.openclaw/openclaw.json` de forma predeterminada).

**Nota:** Los hooks del espacio de trabajo están deshabilitados de forma predeterminada hasta que se habiliten aquí o en la configuración. Los hooks gestionados por plugins muestran `plugin:<id>` en `openclaw hooks list` y no se pueden habilitar/deshabilitar aquí. En su lugar, habilita/deshabilita el Plugin.

**Argumentos:**

- `<name>`: Nombre del hook (por ejemplo, `session-memory`)

**Ejemplo:**

```bash
openclaw hooks enable session-memory
```

**Salida:**

```
✓ Enabled hook: 💾 session-memory
```

**Qué hace:**

- Comprueba si el hook existe y es elegible
- Actualiza `hooks.internal.entries.<name>.enabled = true` en tu configuración
- Guarda la configuración en disco

Si el hook proviene de `<workspace>/hooks/`, este paso de aceptación es obligatorio antes de
que el Gateway lo cargue.

**Después de habilitarlo:**

- Reinicia el gateway para que los hooks se recarguen (reinicio de la app de barra de menú en macOS, o reinicia tu proceso del gateway en desarrollo).

## Deshabilitar un hook

```bash
openclaw hooks disable <name>
```

Deshabilita un hook específico actualizando tu configuración.

**Argumentos:**

- `<name>`: Nombre del hook (por ejemplo, `command-logger`)

**Ejemplo:**

```bash
openclaw hooks disable command-logger
```

**Salida:**

```
⏸ Disabled hook: 📝 command-logger
```

**Después de deshabilitarlo:**

- Reinicia el gateway para que los hooks se recarguen

## Notas

- `openclaw hooks list --json`, `info --json` y `check --json` escriben JSON estructurado directamente en stdout.
- Los hooks gestionados por plugins no se pueden habilitar ni deshabilitar aquí; en su lugar, habilita o deshabilita el Plugin propietario.

## Instalar paquetes de hooks

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Instala paquetes de hooks mediante el instalador unificado de plugins.

`openclaw hooks install` sigue funcionando como alias de compatibilidad, pero muestra una
advertencia de desaprobación y redirige a `openclaw plugins install`.

Las especificaciones de npm son **solo de registro** (nombre del paquete + **versión exacta** opcional o
**dist-tag**). Las especificaciones Git/URL/archivo y los rangos de semver se rechazan. Las
instalaciones de dependencias se ejecutan con `--ignore-scripts` por seguridad.

Las especificaciones simples y `@latest` permanecen en la vía estable. Si npm resuelve cualquiera de
ellas a una versión preliminar, OpenClaw se detiene y te pide que aceptes explícitamente con una
etiqueta preliminar como `@beta`/`@rc` o una versión preliminar exacta.

**Qué hace:**

- Copia el paquete de hooks en `~/.openclaw/hooks/<id>`
- Habilita los hooks instalados en `hooks.internal.entries.*`
- Registra la instalación en `hooks.internal.installs`

**Opciones:**

- `-l, --link`: Vincula un directorio local en lugar de copiarlo (lo añade a `hooks.internal.load.extraDirs`)
- `--pin`: Registra las instalaciones de npm como `name@version` exacto resuelto en `hooks.internal.installs`

**Archivos compatibles:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Ejemplos:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Los paquetes de hooks vinculados se tratan como hooks gestionados desde un
directorio configurado por el operador, no como hooks del espacio de trabajo.

## Actualizar paquetes de hooks

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Actualiza los paquetes de hooks basados en npm rastreados mediante el actualizador unificado de plugins.

`openclaw hooks update` sigue funcionando como alias de compatibilidad, pero muestra una
advertencia de desaprobación y redirige a `openclaw plugins update`.

**Opciones:**

- `--all`: Actualiza todos los paquetes de hooks rastreados
- `--dry-run`: Muestra qué cambiaría sin escribir nada

Cuando existe un hash de integridad almacenado y cambia el hash del artefacto obtenido,
OpenClaw muestra una advertencia y pide confirmación antes de continuar. Usa la opción
global `--yes` para omitir las solicitudes en ejecuciones de CI/no interactivas.

## Hooks agrupados

### session-memory

Guarda el contexto de la sesión en memoria cuando emites `/new` o `/reset`.

**Habilitar:**

```bash
openclaw hooks enable session-memory
```

**Salida:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Consulta:** [documentación de session-memory](/es/automation/hooks#session-memory)

### bootstrap-extra-files

Inyecta archivos de arranque adicionales (por ejemplo, `AGENTS.md` / `TOOLS.md` locales del monorrepo) durante `agent:bootstrap`.

**Habilitar:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Consulta:** [documentación de bootstrap-extra-files](/es/automation/hooks#bootstrap-extra-files)

### command-logger

Registra todos los eventos de comandos en un archivo centralizado de auditoría.

**Habilitar:**

```bash
openclaw hooks enable command-logger
```

**Salida:** `~/.openclaw/logs/commands.log`

**Ver registros:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Consulta:** [documentación de command-logger](/es/automation/hooks#command-logger)

### boot-md

Ejecuta `BOOT.md` cuando se inicia el gateway (después de iniciar los canales).

**Eventos**: `gateway:startup`

**Habilitar**:

```bash
openclaw hooks enable boot-md
```

**Consulta:** [documentación de boot-md](/es/automation/hooks#boot-md)
