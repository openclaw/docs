---
read_when:
    - Quieres eliminar el servicio Gateway y/o el estado local
    - Primero quieres hacer una ejecución de prueba
summary: Referencia de la CLI para `openclaw uninstall` (elimina el servicio Gateway y los datos locales)
title: Desinstalar
x-i18n:
    generated_at: "2026-07-11T23:02:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Desinstala el servicio Gateway y/o los datos locales. La propia CLI no se
elimina; desinstálala por separado mediante npm/pnpm.

## Opciones

| Indicador           | Predeterminado | Descripción                                                   |
| ------------------- | -------------- | ------------------------------------------------------------- |
| `--service`         | `false`        | Elimina el servicio Gateway.                                  |
| `--state`           | `false`        | Elimina el estado y la configuración.                         |
| `--workspace`       | `false`        | Elimina los directorios del espacio de trabajo.               |
| `--app`             | `false`        | Elimina la aplicación para macOS.                             |
| `--all`             | `false`        | Abreviatura de `--service --state --workspace --app`.         |
| `--yes`             | `false`        | Omite las solicitudes de confirmación.                        |
| `--non-interactive` | `false`        | Desactiva las solicitudes; requiere `--yes`.                  |
| `--dry-run`         | `false`        | Muestra las acciones previstas sin eliminar archivos.         |

Si no se especifican indicadores de alcance, una selección múltiple interactiva
pregunta qué componentes se deben eliminar (de forma predeterminada, el servicio,
el estado y el espacio de trabajo aparecen preseleccionados).

## Ejemplos

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## Notas

- Ejecuta primero `openclaw backup create` para crear una instantánea restaurable
  antes de eliminar el estado o los espacios de trabajo.
- `--state` conserva los directorios de espacios de trabajo configurados, salvo que
  también se seleccione `--workspace`.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Desinstalación](/es/install/uninstall)
