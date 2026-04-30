---
read_when:
    - Quieres gestionar los hooks de agente
    - Quieres inspeccionar la disponibilidad de los ganchos o habilitar los ganchos del espacio de trabajo
summary: Referencia de CLI para `openclaw hooks` (hooks de agente)
title: Ganchos
x-i18n:
    generated_at: "2026-04-30T05:33:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gestiona los ganchos de agente (automatizaciones basadas en eventos para comandos como `/new`, `/reset` y el inicio del Gateway).

Ejecutar `openclaw hooks` sin subcomando equivale a `openclaw hooks list`.

Relacionado:

- Ganchos: [Ganchos](/es/automation/hooks)
- Ganchos de Plugin: [Ganchos de Plugin](/es/plugins/hooks)

## Listar todos los ganchos

```bash
openclaw hooks list
```

Lista todos los ganchos descubiertos desde los directorios del espacio de trabajo, administrados, adicionales y empaquetados.
El inicio del Gateway no carga los manejadores internos de ganchos hasta que al menos un gancho interno esté configurado.

**Opciones:**

- `--eligible`: Muestra solo los ganchos aptos (requisitos cumplidos)
- `--json`: Emite como JSON
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

Muestra los requisitos faltantes de los ganchos no aptos.

**Ejemplo (JSON):**

```bash
openclaw hooks list --json
```

Devuelve JSON estructurado para uso programático.

## Obtener información de un gancho

```bash
openclaw hooks info <name>
```

Muestra información detallada sobre un gancho específico.

**Argumentos:**

- `<name>`: Nombre del gancho o clave del gancho (por ejemplo, `session-memory`)

**Opciones:**

- `--json`: Emite como JSON

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

## Comprobar la aptitud de los ganchos

```bash
openclaw hooks check
```

Muestra un resumen del estado de aptitud de los ganchos (cuántos están listos frente a no listos).

**Opciones:**

- `--json`: Emite como JSON

**Salida de ejemplo:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Habilitar un gancho

```bash
openclaw hooks enable <name>
```

Habilita un gancho específico agregándolo a tu configuración (`~/.openclaw/openclaw.json` de forma predeterminada).

**Nota:** Los ganchos del espacio de trabajo están deshabilitados de forma predeterminada hasta que se habiliten aquí o en la configuración. Los ganchos administrados por plugins muestran `plugin:<id>` en `openclaw hooks list` y no se pueden habilitar/deshabilitar aquí. En su lugar, habilita/deshabilita el Plugin.

**Argumentos:**

- `<name>`: Nombre del gancho (por ejemplo, `session-memory`)

**Ejemplo:**

```bash
openclaw hooks enable session-memory
```

**Salida:**

```
✓ Enabled hook: 💾 session-memory
```

**Qué hace:**

- Comprueba si el gancho existe y es apto
- Actualiza `hooks.internal.entries.<name>.enabled = true` en tu configuración
- Guarda la configuración en el disco

Si el gancho proviene de `<workspace>/hooks/`, este paso de suscripción es obligatorio antes de que el Gateway lo cargue.

**Después de habilitar:**

- Reinicia el gateway para que los ganchos se recarguen (reinicio de la app de la barra de menús en macOS, o reinicia tu proceso de gateway en desarrollo).

## Deshabilitar un gancho

```bash
openclaw hooks disable <name>
```

Deshabilita un gancho específico actualizando tu configuración.

**Argumentos:**

- `<name>`: Nombre del gancho (por ejemplo, `command-logger`)

**Ejemplo:**

```bash
openclaw hooks disable command-logger
```

**Salida:**

```
⏸ Disabled hook: 📝 command-logger
```

**Después de deshabilitar:**

- Reinicia el gateway para que los ganchos se recarguen

## Notas

- `openclaw hooks list --json`, `info --json` y `check --json` escriben JSON estructurado directamente en stdout.
- Los ganchos administrados por plugins no se pueden habilitar ni deshabilitar aquí; habilita o deshabilita el Plugin propietario en su lugar.

## Instalar paquetes de ganchos

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Instala paquetes de ganchos mediante el instalador unificado de plugins.

`openclaw hooks install` sigue funcionando como alias de compatibilidad, pero imprime una advertencia de obsolescencia y reenvía a `openclaw plugins install`.

Las especificaciones de npm son **solo de registro** (nombre del paquete + **versión exacta** opcional o **dist-tag**). Se rechazan las especificaciones de Git/URL/archivo y los rangos semver. Las instalaciones de dependencias se ejecutan de forma local al proyecto con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene ajustes globales de instalación de npm.

Las especificaciones simples y `@latest` permanecen en la pista estable. Si npm resuelve cualquiera de ellas a una versión preliminar, OpenClaw se detiene y te pide que optes explícitamente por una etiqueta de versión preliminar como `@beta`/`@rc` o una versión preliminar exacta.

**Qué hace:**

- Copia el paquete de ganchos en `~/.openclaw/hooks/<id>`
- Habilita los ganchos instalados en `hooks.internal.entries.*`
- Registra la instalación en `hooks.internal.installs`

**Opciones:**

- `-l, --link`: Enlaza un directorio local en lugar de copiarlo (lo agrega a `hooks.internal.load.extraDirs`)
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

Los paquetes de ganchos enlazados se tratan como ganchos administrados desde un directorio configurado por el operador, no como ganchos del espacio de trabajo.

## Actualizar paquetes de ganchos

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Actualiza los paquetes de ganchos basados en npm con seguimiento mediante el actualizador unificado de plugins.

`openclaw hooks update` sigue funcionando como alias de compatibilidad, pero imprime una advertencia de obsolescencia y reenvía a `openclaw plugins update`.

**Opciones:**

- `--all`: Actualiza todos los paquetes de ganchos con seguimiento
- `--dry-run`: Muestra qué cambiaría sin escribir

Cuando existe un hash de integridad almacenado y cambia el hash del artefacto obtenido, OpenClaw imprime una advertencia y solicita confirmación antes de continuar. Usa el `--yes` global para omitir los prompts en ejecuciones de CI/no interactivas.

## Ganchos incluidos

### session-memory

Guarda el contexto de la sesión en la memoria cuando emites `/new` o `/reset`.

**Habilitar:**

```bash
openclaw hooks enable session-memory
```

**Salida:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Consulta:** [documentación de session-memory](/es/automation/hooks#session-memory)

### bootstrap-extra-files

Inyecta archivos de bootstrap adicionales (por ejemplo, `AGENTS.md` / `TOOLS.md` locales al monorepo) durante `agent:bootstrap`.

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

Ejecuta `BOOT.md` cuando se inicia el gateway (después de que se inician los canales).

**Eventos**: `gateway:startup`

**Habilitar**:

```bash
openclaw hooks enable boot-md
```

**Consulta:** [documentación de boot-md](/es/automation/hooks#boot-md)

## Relacionado

- [Referencia de CLI](/es/cli)
- [Ganchos de automatización](/es/automation/hooks)
