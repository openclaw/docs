---
read_when:
    - Quieres gestionar los hooks de los agentes
    - Quieres consultar la disponibilidad de hooks o habilitar hooks del espacio de trabajo
summary: Referencia de la CLI para `openclaw hooks` (hooks de agentes)
title: Hooks
x-i18n:
    generated_at: "2026-07-22T10:28:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d4d58ea2270cf5122018f7be2943401229929f48f448b15fdd126d1cc99e1e56
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gestiona los hooks de agentes (automatizaciones basadas en eventos para comandos como `/new`, `/reset` y el inicio del gateway). `openclaw hooks` por sí solo equivale a `openclaw hooks list`.

Relacionado: [Hooks](/es/automation/hooks) - [Hooks de plugins](/es/plugins/hooks)

## Listar hooks

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Lista los hooks detectados en los directorios del espacio de trabajo, gestionados, adicionales e incluidos.

- `--eligible`: solo los hooks cuyos requisitos se cumplen.
- `--json`: salida estructurada.
- `-v, --verbose`: incluye una columna Missing con los requisitos no cumplidos.

```
Hooks (4/5 listos)

Listos:
  🚀 boot-md ✓ - Ejecuta BOOT.md al iniciar el gateway
  📎 bootstrap-extra-files ✓ - Inyecta archivos de arranque adicionales del espacio de trabajo durante el arranque del agente
  📝 command-logger ✓ - Registra todos los eventos de comandos en un archivo de auditoría centralizado
  💾 session-memory ✓ - Guarda el contexto de la sesión en la memoria cuando se ejecuta el comando /new o /reset
```

## Obtener información de un hook

```bash
openclaw hooks info <name> [--json]
```

`<name>` es el nombre o la clave del hook (por ejemplo, `session-memory`). Muestra el origen, las rutas de archivos/controladores, la página de inicio, los eventos y el estado de cada requisito (binarios, entorno, configuración y sistema operativo).

## Comprobar la elegibilidad

```bash
openclaw hooks check [--json]
```

Muestra un resumen del número de hooks listos y no listos; si hay hooks que no están listos, enumera cada uno con el motivo que lo bloquea.

## Activar un hook

```bash
openclaw hooks enable <name>
```

Añade o actualiza `hooks.internal.entries.<name>.enabled = true` en la configuración y también activa el interruptor maestro `hooks.internal.enabled` (el gateway no carga ningún controlador interno de hooks hasta que se configura al menos uno). Falla si el hook no existe, está gestionado por un plugin o no es elegible (faltan requisitos).

Los hooks gestionados por plugins muestran `plugin:<id>` en `hooks list` y no pueden activarse ni desactivarse aquí; active o desactive en su lugar el plugin propietario.

Reinicie el gateway después de activarlo (reinicie la aplicación de la barra de menús de macOS o el proceso del gateway en desarrollo) para que vuelva a cargar los hooks.

## Desactivar un hook

```bash
openclaw hooks disable <name>
```

Establece `hooks.internal.entries.<name>.enabled = false`. Reinicie el gateway después.

## Instalar y actualizar paquetes de hooks

```bash
openclaw plugins install <package>        # npm de forma predeterminada
openclaw plugins install npm:<package>    # solo npm
openclaw plugins install <package> --pin  # fija la versión resuelta
openclaw plugins install <path>           # directorio local o archivo
openclaw plugins install -l <path>        # enlaza un directorio local en lugar de copiarlo

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Los paquetes de hooks se instalan mediante el instalador y actualizador unificado de plugins; `openclaw hooks install` y `openclaw hooks update` siguen funcionando como alias obsoletos que muestran una advertencia y redirigen a los comandos `plugins`.

- Las especificaciones de npm se limitan al registro: el nombre del paquete más una versión exacta o una etiqueta de distribución opcional. Se rechazan las especificaciones de Git, URL y archivos, así como los intervalos semver. Las instalaciones de dependencias se ejecutan localmente en el proyecto con `--ignore-scripts`.
- Las especificaciones simples y `@latest` permanecen en el canal estable; si npm resuelve una versión preliminar, OpenClaw se detiene y solicita que se acepte explícitamente (`@beta`, `@rc` o una versión preliminar exacta).
- Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` enlaza un directorio local en lugar de copiarlo (lo añade a `hooks.internal.load.extraDirs`); los paquetes de hooks enlazados son hooks gestionados desde un directorio configurado por un operador, no hooks del espacio de trabajo.
- `--pin` registra las instalaciones de npm como un `name@version` exacto resuelto en el estado compartido de SQLite.
- La instalación copia el paquete en `~/.openclaw/hooks/<id>`, activa sus hooks en `hooks.internal.entries.*` y registra la procedencia de la instalación en el estado compartido de SQLite.
- Si un hash de integridad almacenado ya no coincide con el artefacto obtenido, OpenClaw muestra una advertencia y solicita confirmación antes de continuar; utilice la opción global `--yes` para omitir la solicitud (por ejemplo, en CI).

## Hooks incluidos

| Hook                  | Eventos                                           | Función                                                                                                     |
| --------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                | Ejecuta `BOOT.md` al iniciar el gateway para cada ámbito de agente configurado                     |
| bootstrap-extra-files | `agent:bootstrap`                                | Inyecta archivos de arranque adicionales (por ejemplo, `AGENTS.md`/`TOOLS.md` de un monorepo) durante el arranque del agente |
| command-logger        | `command`                                | Registra los eventos de comandos en `~/.openclaw/logs/commands.log`                                                      |
| compaction-notifier   | `session:compact:before`, `session:compact:after`            | Envía avisos visibles en el chat cuando comienza y termina la compactación de la sesión                     |
| session-memory        | `command:new`, `command:reset`            | Guarda el contexto de la sesión en la memoria al ejecutar `/new` o `/reset`           |

Active cualquier hook incluido con `openclaw hooks enable <hook-name>`. Para obtener información completa, las claves de configuración y los valores predeterminados, consulte [Hooks incluidos](/es/automation/hooks#bundled-hooks).

### Archivo de registro de command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # comandos recientes
cat ~/.openclaw/logs/commands.log | jq .          # salida con formato legible
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filtrar por acción
```

## Notas

- `hooks list --json`, `info --json` y `check --json` escriben JSON estructurado directamente en la salida estándar.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Hooks de automatización](/es/automation/hooks)
