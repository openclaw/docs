---
read_when:
    - Quieres gestionar los hooks del agente
    - Quieres comprobar la disponibilidad de hooks o habilitar hooks del espacio de trabajo
summary: Referencia de la CLI para `openclaw hooks` (hooks de agentes)
title: Hooks
x-i18n:
    generated_at: "2026-07-11T22:56:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gestiona los hooks del agente (automatizaciones basadas en eventos para comandos como `/new`, `/reset` y el inicio del Gateway). Ejecutar únicamente `openclaw hooks` equivale a `openclaw hooks list`.

Relacionado: [Hooks](/es/automation/hooks) - [Hooks de Plugin](/es/plugins/hooks)

## Listar hooks

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Lista los hooks detectados en los directorios del espacio de trabajo, administrados, adicionales e integrados.

- `--eligible`: solo los hooks cuyos requisitos se cumplen.
- `--json`: salida estructurada.
- `-v, --verbose`: incluye una columna Missing con los requisitos no cumplidos.

```
Hooks (4/5 listos)

Listos:
  🚀 boot-md ✓ - Ejecutar BOOT.md al iniciar el Gateway
  📎 bootstrap-extra-files ✓ - Inyectar archivos de arranque adicionales del espacio de trabajo durante el arranque del agente
  📝 command-logger ✓ - Registrar todos los eventos de comandos en un archivo de auditoría centralizado
  💾 session-memory ✓ - Guardar el contexto de la sesión en la memoria cuando se emite el comando /new o /reset
```

## Obtener información de un hook

```bash
openclaw hooks info <name> [--json]
```

`<name>` es el nombre o la clave del hook (por ejemplo, `session-memory`). Muestra el origen, las rutas del archivo y del controlador, la página principal, los eventos y el estado de cada requisito (binarios, entorno, configuración y sistema operativo).

## Comprobar la elegibilidad

```bash
openclaw hooks check [--json]
```

Muestra un resumen del número de hooks listos y no listos; si hay hooks que no están listos, enumera cada uno con el motivo que lo bloquea.

## Activar un hook

```bash
openclaw hooks enable <name>
```

Añade o actualiza `hooks.internal.entries.<name>.enabled = true` en la configuración y también activa el interruptor maestro `hooks.internal.enabled` (el Gateway no carga ningún controlador de hooks internos hasta que se configura al menos uno). Falla si el hook no existe, está administrado por un Plugin o no es elegible (faltan requisitos).

Los hooks administrados por Plugins muestran `plugin:<id>` en `hooks list` y no pueden activarse ni desactivarse aquí; en su lugar, activa o desactiva el Plugin propietario.

Reinicia el Gateway después de activarlo (reinicia la aplicación de la barra de menús de macOS o el proceso del Gateway en desarrollo) para que vuelva a cargar los hooks.

## Desactivar un hook

```bash
openclaw hooks disable <name>
```

Establece `hooks.internal.entries.<name>.enabled = false`. Reinicia el Gateway después.

## Instalar y actualizar paquetes de hooks

```bash
openclaw plugins install <package>        # npm de forma predeterminada
openclaw plugins install npm:<package>    # solo npm
openclaw plugins install <package> --pin  # fijar la versión resuelta
openclaw plugins install <path>           # directorio local o archivo
openclaw plugins install -l <path>        # enlazar un directorio local en lugar de copiarlo

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Los paquetes de hooks se instalan mediante el instalador y actualizador unificado de Plugins; `openclaw hooks install` y `openclaw hooks update` siguen funcionando como alias obsoletos que muestran una advertencia y redirigen a los comandos de `plugins`.

- Las especificaciones de npm se limitan al registro: un nombre de paquete y, opcionalmente, una versión exacta o una etiqueta de distribución. Se rechazan las especificaciones de Git, URL y archivos, así como los intervalos semver. Las dependencias se instalan localmente en el proyecto con `--ignore-scripts`.
- Las especificaciones simples y `@latest` permanecen en el canal estable; si npm resuelve una versión preliminar, OpenClaw se detiene y solicita que la aceptes explícitamente (`@beta`, `@rc` o una versión preliminar exacta).
- Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` enlaza un directorio local en lugar de copiarlo (lo añade a `hooks.internal.load.extraDirs`); los paquetes de hooks enlazados son hooks administrados desde un directorio configurado por el operador, no hooks del espacio de trabajo.
- `--pin` registra las instalaciones de npm como un `name@version` exacto resuelto en `hooks.internal.installs`.
- La instalación copia el paquete en `~/.openclaw/hooks/<id>`, activa sus hooks en `hooks.internal.entries.*` y registra la instalación en `hooks.internal.installs`.
- Si un hash de integridad almacenado ya no coincide con el artefacto obtenido, OpenClaw muestra una advertencia y solicita confirmación antes de continuar; pasa la opción global `--yes` para omitir la confirmación (por ejemplo, en CI).

## Hooks integrados

| Hook                  | Eventos                                           | Función                                                                                                          |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Ejecuta `BOOT.md` al iniciar el Gateway para cada ámbito de agente configurado                                   |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inyecta archivos de arranque adicionales (por ejemplo, `AGENTS.md`/`TOOLS.md` de un monorepo) al arrancar el agente |
| command-logger        | `command`                                         | Registra los eventos de comandos en `~/.openclaw/logs/commands.log`                                              |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envía avisos visibles en el chat cuando comienza y termina la compactación de la sesión                           |
| session-memory        | `command:new`, `command:reset`                    | Guarda el contexto de la sesión en la memoria al ejecutar `/new` o `/reset`                                      |

Activa cualquier hook integrado con `openclaw hooks enable <hook-name>`. Detalles completos, claves de configuración y valores predeterminados: [Hooks integrados](/es/automation/hooks#bundled-hooks).

### Archivo de registro de command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # comandos recientes
cat ~/.openclaw/logs/commands.log | jq .          # mostrar con formato legible
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filtrar por acción
```

## Notas

- `hooks list --json`, `info --json` y `check --json` escriben el JSON estructurado directamente en la salida estándar.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Hooks de automatización](/es/automation/hooks)
