---
read_when:
    - Quieres gestionar los ganchos de agente
    - Quieres inspeccionar la disponibilidad de hooks o habilitar hooks de espacio de trabajo
summary: Referencia de CLI para `openclaw hooks` (ganchos de agente)
title: Ganchos
x-i18n:
    generated_at: "2026-05-02T20:44:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b02c176b4a310adba3fa1fde3758f6c8a19d454aeec58e919458b3f1a66c87d
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gestiona hooks de agente (automatizaciones basadas en eventos para comandos como `/new`, `/reset` y el inicio del Gateway).

Ejecutar `openclaw hooks` sin subcomando equivale a `openclaw hooks list`.

Relacionado:

- Hooks: [Hooks](/es/automation/hooks)
- Hooks de Plugin: [Hooks de Plugin](/es/plugins/hooks)

## Listar todos los hooks

```bash
openclaw hooks list
```

Lista todos los hooks descubiertos desde directorios del espacio de trabajo, administrados, adicionales e incluidos.
El inicio del Gateway no carga controladores internos de hooks hasta que se configura al menos un hook interno.

**Opciones:**

- `--eligible`: Muestra solo hooks elegibles (requisitos cumplidos)
- `--json`: Genera salida como JSON
- `-v, --verbose`: Muestra información detallada, incluidos los requisitos faltantes

**Salida de ejemplo:**

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

Muestra los requisitos faltantes para hooks no elegibles.

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

- `--json`: Genera salida como JSON

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

## Comprobar la elegibilidad de hooks

```bash
openclaw hooks check
```

Muestra un resumen del estado de elegibilidad de los hooks (cuántos están listos frente a no listos).

**Opciones:**

- `--json`: Genera salida como JSON

**Salida de ejemplo:**

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

Habilita un hook específico agregándolo a tu configuración (`~/.openclaw/openclaw.json` de forma predeterminada).

**Nota:** Los hooks del espacio de trabajo están deshabilitados de forma predeterminada hasta que se habilitan aquí o en la configuración. Los hooks administrados por plugins muestran `plugin:<id>` en `openclaw hooks list` y no se pueden habilitar/deshabilitar aquí. Habilita/deshabilita el plugin en su lugar.

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

Si el hook provino de `<workspace>/hooks/`, este paso de adhesión explícita es obligatorio antes de que
el Gateway lo cargue.

**Después de habilitarlo:**

- Reinicia el Gateway para que los hooks se recarguen (reinicia la aplicación de la barra de menús en macOS o reinicia tu proceso de Gateway en desarrollo).

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

- Reinicia el Gateway para que los hooks se recarguen

## Notas

- `openclaw hooks list --json`, `info --json` y `check --json` escriben JSON estructurado directamente en stdout.
- Los hooks administrados por plugins no se pueden habilitar ni deshabilitar aquí; habilita o deshabilita el plugin propietario en su lugar.

## Instalar paquetes de hooks

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Instala paquetes de hooks mediante el instalador unificado de plugins.

`openclaw hooks install` sigue funcionando como alias de compatibilidad, pero imprime una
advertencia de obsolescencia y reenvía a `openclaw plugins install`.

Las especificaciones de npm son **solo de registro** (nombre de paquete + **versión exacta** opcional o
**dist-tag**). Se rechazan las especificaciones Git/URL/archivo y los rangos semver. Las instalaciones de
dependencias se ejecutan localmente en el proyecto con `--ignore-scripts` por seguridad, incluso cuando tu
shell tiene configuraciones globales de instalación de npm.

Las especificaciones simples y `@latest` permanecen en la rama estable. Si npm resuelve cualquiera de
ellas a una versión preliminar, OpenClaw se detiene y te pide que aceptes explícitamente con una
etiqueta de versión preliminar como `@beta`/`@rc` o una versión preliminar exacta.

**Qué hace:**

- Copia el paquete de hooks en `~/.openclaw/hooks/<id>`
- Habilita los hooks instalados en `hooks.internal.entries.*`
- Registra la instalación en `hooks.internal.installs`

**Opciones:**

- `-l, --link`: Vincula un directorio local en lugar de copiarlo (lo agrega a `hooks.internal.load.extraDirs`)
- `--pin`: Registra las instalaciones de npm como `name@version` resuelto exacto en `hooks.internal.installs`

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

Los paquetes de hooks vinculados se tratan como hooks administrados desde un directorio
configurado por el operador, no como hooks del espacio de trabajo.

## Actualizar paquetes de hooks

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Actualiza paquetes de hooks basados en npm con seguimiento mediante el actualizador unificado de plugins.

`openclaw hooks update` sigue funcionando como alias de compatibilidad, pero imprime una
advertencia de obsolescencia y reenvía a `openclaw plugins update`.

**Opciones:**

- `--all`: Actualiza todos los paquetes de hooks con seguimiento
- `--dry-run`: Muestra qué cambiaría sin escribir

Cuando existe un hash de integridad almacenado y cambia el hash del artefacto recuperado,
OpenClaw imprime una advertencia y pide confirmación antes de continuar. Usa
`--yes` global para omitir prompts en CI/ejecuciones no interactivas.

## Hooks incluidos

### session-memory

Guarda el contexto de sesión en memoria cuando ejecutas `/new` o `/reset`.

**Habilitar:**

```bash
openclaw hooks enable session-memory
```

**Salida:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Consulta:** [documentación de session-memory](/es/automation/hooks#session-memory)

### bootstrap-extra-files

Inyecta archivos de bootstrap adicionales (por ejemplo, `AGENTS.md` / `TOOLS.md` locales de monorepo) durante `agent:bootstrap`.

**Habilitar:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Consulta:** [documentación de bootstrap-extra-files](/es/automation/hooks#bootstrap-extra-files)

### command-logger

Registra todos los eventos de comandos en un archivo de auditoría centralizado.

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

Ejecuta `BOOT.md` cuando se inicia el Gateway (después de que se inician los canales).

**Eventos**: `gateway:startup`

**Habilitar**:

```bash
openclaw hooks enable boot-md
```

**Consulta:** [documentación de boot-md](/es/automation/hooks#boot-md)

## Relacionado

- [Referencia de CLI](/es/cli)
- [Hooks de automatización](/es/automation/hooks)
