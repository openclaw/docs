---
read_when:
    - Quieres eliminar el servicio Gateway y/o el estado local
    - Quieres una simulación primero
summary: Referencia de CLI para `openclaw uninstall` (eliminar el servicio Gateway + datos locales)
title: Desinstalar
x-i18n:
    generated_at: "2026-07-05T11:12:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Desinstala el servicio Gateway y/o los datos locales. La CLI en sí no se
elimina; desinstálala mediante npm/pnpm por separado.

## Opciones

| Marca               | Predeterminado | Descripción                                               |
| ------------------- | -------------- | --------------------------------------------------------- |
| `--service`         | `false`        | Elimina el servicio Gateway.                              |
| `--state`           | `false`        | Elimina el estado y la configuración.                     |
| `--workspace`       | `false`        | Elimina los directorios de espacio de trabajo.            |
| `--app`             | `false`        | Elimina la app de macOS.                                  |
| `--all`             | `false`        | Atajo para `--service --state --workspace --app`.         |
| `--yes`             | `false`        | Omite las solicitudes de confirmación.                    |
| `--non-interactive` | `false`        | Desactiva las solicitudes; requiere `--yes`.              |
| `--dry-run`         | `false`        | Imprime las acciones planificadas sin eliminar archivos.  |

Sin marcas de alcance, una selección múltiple interactiva solicita qué componentes
eliminar (de forma predeterminada, servicio, estado y espacio de trabajo vienen preseleccionados).

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

- Ejecuta primero `openclaw backup create` para crear una instantánea restaurable antes de eliminar
  el estado o los espacios de trabajo.
- `--state` conserva los directorios de espacio de trabajo configurados a menos que también se
  seleccione `--workspace`.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Desinstalar](/es/install/uninstall)
