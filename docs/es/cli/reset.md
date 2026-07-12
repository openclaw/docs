---
read_when:
    - Quieres borrar el estado local y mantener instalada la CLI
    - Quieres una simulación de lo que se eliminaría
summary: Referencia de la CLI para `openclaw reset` (restablecer el estado y la configuración locales)
title: Restablecer
x-i18n:
    generated_at: "2026-07-11T23:01:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Restablece la configuración y el estado locales (mantiene instalada la CLI).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Opciones

- `--scope <scope>`: `config`, `config+creds+sessions` o `full`
- `--yes`: omite las solicitudes de confirmación
- `--non-interactive`: desactiva las solicitudes; requiere `--scope` y `--yes`
- `--dry-run`: muestra las acciones sin eliminar archivos

## Ámbitos

| Ámbito                  | Elimina                                                                                                              | Detiene primero el Gateway |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `config`                | solo el archivo de configuración                                                                                     | no                         |
| `config+creds+sessions` | el archivo de configuración, el directorio de OAuth/credenciales y los directorios de sesiones de cada agente        | sí                         |
| `full`                  | el directorio de estado (incluidos configuración/credenciales si están dentro de él), los directorios del espacio de trabajo y las certificaciones del espacio de trabajo | sí |

`config+creds+sessions` y `full` detienen un servicio Gateway administrado que esté en ejecución antes de eliminar el estado.

## Notas

- Ejecuta primero `openclaw backup create` para crear una instantánea restaurable antes de eliminar el estado local.
- Sin `--scope`, `openclaw reset` solicita interactivamente el ámbito que se eliminará.
- `--non-interactive` solo es válido cuando se especifican tanto `--scope` como `--yes`.
- Al finalizar, `config+creds+sessions` y `full` muestran `Next: openclaw onboard --install-daemon`.

## Temas relacionados

- [Referencia de la CLI](/es/cli)
