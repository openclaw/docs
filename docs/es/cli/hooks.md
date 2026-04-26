---
read_when:
    - Quieres gestionar hooks del agente
    - Quieres inspeccionar la disponibilidad de hooks o habilitar hooks del espacio de trabajo
summary: Referencia de la CLI para `openclaw hooks` (hooks del agente)
title: Hooks
x-i18n:
    generated_at: "2026-04-26T11:25:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 874c3c7e7b603066209857e8b8b39bbe23eb8d1eda148025c74907c05bacd8f2
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gestiona hooks del agente (automatizaciones impulsadas por eventos para comandos como `/new`, `/reset` y el inicio del gateway).

Ejecutar `openclaw hooks` sin subcomando equivale a `openclaw hooks list`.

Relacionado:

- Hooks: [Hooks](/es/automation/hooks)
- Hooks de plugins: [Plugin hooks](/es/plugins/hooks)

## Listar todos los hooks

```bash
openclaw hooks list
```

Lista todos los hooks detectados en los directorios del espacio de trabajo, gestionados, adicionales e incluidos.
El inicio del Gateway no carga controladores de hooks internos hasta que se configure al menos un hook interno.

**Opciones:**

- `--eligible`: mostrar solo hooks elegibles (requisitos cumplidos)
- `--json`: salida en JSON
- `-v, --verbose`: mostrar información detallada, incluidos los requisitos que faltan

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

- `<name>`: nombre del hook o clave del hook (por ejemplo, `session-memory`)

**Opciones:**

- `--json`: salida en JSON

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

Muestra un resumen del estado de elegibilidad de hooks (cuántos están listos frente a cuántos no lo están).

**Opciones:**

- `--json`: salida en JSON

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

**Nota:** Los hooks del espacio de trabajo están deshabilitados de forma predeterminada hasta que se habiliten aquí o en la configuración. Los hooks gestionados por plugins muestran `plugin:<id>` en `openclaw hooks list` y no se pueden habilitar/deshabilitar aquí. En su lugar, habilita/deshabilita el plugin.

**Argumentos:**

- `<name>`: nombre del hook (por ejemplo, `session-memory`)

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

Si el hook procede de `<workspace>/hooks/`, este paso de activación explícita es obligatorio antes de que el Gateway lo cargue.

**Después de habilitarlo:**

- Reinicia el gateway para que los hooks se recarguen (reinicio de la app de barra de menú en macOS, o reinicia tu proceso de gateway en desarrollo).

## Deshabilitar un hook

```bash
openclaw hooks disable <name>
```

Deshabilita un hook específico actualizando tu configuración.

**Argumentos:**

- `<name>`: nombre del hook (por ejemplo, `command-logger`)

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
- Los hooks gestionados por plugins no se pueden habilitar ni deshabilitar aquí; en su lugar, habilita o deshabilita el plugin propietario.

## Instalar hook packs

```bash
openclaw plugins install <package>        # ClawHub primero, luego npm
openclaw plugins install <package> --pin  # fijar versión
openclaw plugins install <path>           # ruta local
```

Instala hook packs mediante el instalador unificado de plugins.

`openclaw hooks install` sigue funcionando como alias de compatibilidad, pero muestra una advertencia de deprecación y redirige a `openclaw plugins install`.

Las especificaciones npm son **solo del registro** (nombre del paquete + **versión exacta** opcional o **dist-tag**). Se rechazan las especificaciones Git/URL/archivo y los rangos semver. Las instalaciones de dependencias se ejecutan de forma local al proyecto con `--ignore-scripts` por seguridad, incluso cuando tu shell tiene configuraciones globales de instalación de npm.

Las especificaciones simples y `@latest` permanecen en la vía estable. Si npm resuelve cualquiera de ellas a una versión preliminar, OpenClaw se detiene y te pide que aceptes explícitamente con una etiqueta preliminar como `@beta`/`@rc` o una versión preliminar exacta.

**Qué hace:**

- Copia el hook pack en `~/.openclaw/hooks/<id>`
- Habilita los hooks instalados en `hooks.internal.entries.*`
- Registra la instalación en `hooks.internal.installs`

**Opciones:**

- `-l, --link`: enlazar un directorio local en lugar de copiarlo (lo añade a `hooks.internal.load.extraDirs`)
- `--pin`: registrar instalaciones npm como `name@version` exacto resuelto en `hooks.internal.installs`

**Archivos compatibles:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Ejemplos:**

```bash
# Directorio local
openclaw plugins install ./my-hook-pack

# Archivo local
openclaw plugins install ./my-hook-pack.zip

# Paquete NPM
openclaw plugins install @openclaw/my-hook-pack

# Enlazar un directorio local sin copiar
openclaw plugins install -l ./my-hook-pack
```

Los hook packs enlazados se tratan como hooks gestionados desde un directorio configurado por un operador, no como hooks del espacio de trabajo.

## Actualizar hook packs

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Actualiza hook packs basados en npm rastreados mediante el actualizador unificado de plugins.

`openclaw hooks update` sigue funcionando como alias de compatibilidad, pero muestra una advertencia de deprecación y redirige a `openclaw plugins update`.

**Opciones:**

- `--all`: actualizar todos los hook packs rastreados
- `--dry-run`: mostrar qué cambiaría sin escribir cambios

Cuando existe un hash de integridad almacenado y cambia el hash del artefacto obtenido, OpenClaw muestra una advertencia y pide confirmación antes de continuar. Usa `--yes` global para omitir confirmaciones en ejecuciones de CI/no interactivas.

## Hooks incluidos

### session-memory

Guarda el contexto de la sesión en memoria cuando emites `/new` o `/reset`.

**Habilitar:**

```bash
openclaw hooks enable session-memory
```

**Salida:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Consulta:** [documentación de session-memory](/es/automation/hooks#session-memory)

### bootstrap-extra-files

Inyecta archivos bootstrap adicionales (por ejemplo, `AGENTS.md` / `TOOLS.md` locales del monorepo) durante `agent:bootstrap`.

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

**Ver logs:**

```bash
# Comandos recientes
tail -n 20 ~/.openclaw/logs/commands.log

# Formatear de forma legible
cat ~/.openclaw/logs/commands.log | jq .

# Filtrar por acción
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Consulta:** [documentación de command-logger](/es/automation/hooks#command-logger)

### boot-md

Ejecuta `BOOT.md` cuando se inicia el gateway (después de que se inicien los canales).

**Eventos**: `gateway:startup`

**Habilitar**:

```bash
openclaw hooks enable boot-md
```

**Consulta:** [documentación de boot-md](/es/automation/hooks#boot-md)

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Hooks de automatización](/es/automation/hooks)
