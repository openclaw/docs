---
read_when:
    - Quieres gestionar hooks de agente
    - Quieres inspeccionar la disponibilidad de hooks o habilitar hooks de espacio de trabajo
summary: Referencia de la CLI para `openclaw hooks` (hooks de agente)
title: Ganchos
x-i18n:
    generated_at: "2026-07-05T11:10:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gestiona los hooks de agente (automatizaciones basadas en eventos para comandos como `/new`, `/reset` y el inicio del Gateway). `openclaw hooks` sin argumentos equivale a `openclaw hooks list`.

Relacionado: [Hooks](/es/automation/hooks) - [Hooks de Plugin](/es/plugins/hooks)

## Listar hooks

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Lista los hooks detectados en los directorios del espacio de trabajo, administrados, adicionales y empaquetados.

- `--eligible`: solo hooks cuyos requisitos se cumplen.
- `--json`: salida estructurada.
- `-v, --verbose`: incluye una columna Missing con requisitos no cumplidos.

```
Hooks (4/5 listos)

Listos:
  🚀 boot-md ✓ - Ejecutar BOOT.md al iniciar el Gateway
  📎 bootstrap-extra-files ✓ - Inyectar archivos adicionales de arranque del espacio de trabajo durante el arranque del agente
  📝 command-logger ✓ - Registrar todos los eventos de comandos en un archivo de auditoría centralizado
  💾 session-memory ✓ - Guardar el contexto de la sesión en memoria cuando se emite el comando /new o /reset
```

## Obtener información de un hook

```bash
openclaw hooks info <name> [--json]
```

`<name>` es el nombre del hook o la clave del hook (por ejemplo, `session-memory`). Muestra el origen, las rutas de archivo/controlador, la página principal, los eventos y el estado por requisito (binarios, env, configuración, SO).

## Comprobar elegibilidad

```bash
openclaw hooks check [--json]
```

Imprime un resumen de recuento de listos/no listos; si hay hooks no listos, lista cada uno con su motivo de bloqueo.

## Habilitar un hook

```bash
openclaw hooks enable <name>
```

Añade/actualiza `hooks.internal.entries.<name>.enabled = true` en la configuración y también activa el interruptor maestro `hooks.internal.enabled` (el Gateway no carga ningún controlador de hook interno hasta que al menos uno esté configurado). Falla si el hook no existe, está administrado por un Plugin o no es elegible (faltan requisitos).

Los hooks administrados por Plugin muestran `plugin:<id>` en `hooks list` y no se pueden habilitar/deshabilitar aquí; habilita o deshabilita el Plugin propietario en su lugar.

Reinicia el Gateway después de habilitarlo (reinicia la app de la barra de menús de macOS o reinicia tu proceso de Gateway en desarrollo) para que vuelva a cargar los hooks.

## Deshabilitar un hook

```bash
openclaw hooks disable <name>
```

Establece `hooks.internal.entries.<name>.enabled = false`. Reinicia el Gateway después.

## Instalar y actualizar paquetes de hooks

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin resolved version
openclaw plugins install <path>           # local directory or archive
openclaw plugins install -l <path>        # link a local directory instead of copying

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Los paquetes de hooks se instalan mediante el instalador/actualizador unificado de plugins; `openclaw hooks install` / `openclaw hooks update` siguen funcionando como alias obsoletos que imprimen una advertencia y reenvían a los comandos `plugins`.

- Las especificaciones de npm son solo de registro: nombre del paquete más una versión exacta opcional o una etiqueta dist-tag. Se rechazan las especificaciones Git/URL/file y los rangos semver. Las instalaciones de dependencias se ejecutan localmente en el proyecto con `--ignore-scripts`.
- Las especificaciones sin prefijo y `@latest` permanecen en el canal estable; si npm resuelve a una versión preliminar, OpenClaw se detiene y te pide que optes explícitamente por ella (`@beta`, `@rc` o una versión preliminar exacta).
- Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` enlaza un directorio local en lugar de copiarlo (lo añade a `hooks.internal.load.extraDirs`); los paquetes de hooks enlazados son hooks administrados desde un directorio configurado por el operador, no hooks del espacio de trabajo.
- `--pin` registra las instalaciones de npm como un `name@version` exacto resuelto en `hooks.internal.installs`.
- La instalación copia el paquete en `~/.openclaw/hooks/<id>`, habilita sus hooks en `hooks.internal.entries.*` y registra la instalación en `hooks.internal.installs`.
- Si un hash de integridad almacenado ya no coincide con el artefacto obtenido, OpenClaw advierte y solicita confirmación antes de continuar; pasa el `--yes` global para omitir la confirmación (por ejemplo, en CI).

## Hooks empaquetados

| Hook                  | Eventos                                           | Qué hace                                                                                           |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Ejecuta `BOOT.md` al iniciar el Gateway para cada ámbito de agente configurado                     |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inyecta archivos de arranque adicionales (por ejemplo, `AGENTS.md`/`TOOLS.md` de monorepo) durante el arranque del agente |
| command-logger        | `command`                                         | Registra eventos de comandos en `~/.openclaw/logs/commands.log`                                    |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envía avisos visibles en el chat cuando la compactación de la sesión empieza y termina             |
| session-memory        | `command:new`, `command:reset`                    | Guarda el contexto de la sesión en memoria en `/new` o `/reset`                                    |

Habilita cualquier hook empaquetado con `openclaw hooks enable <hook-name>`. Detalles completos, claves de configuración y valores predeterminados: [Hooks empaquetados](/es/automation/hooks#bundled-hooks).

### Archivo de registro de command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # recent commands
cat ~/.openclaw/logs/commands.log | jq .          # pretty-print
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filter by action
```

## Notas

- `hooks list --json`, `info --json` y `check --json` escriben JSON estructurado directamente en stdout.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Hooks de automatización](/es/automation/hooks)
