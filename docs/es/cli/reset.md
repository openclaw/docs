---
read_when:
    - Quieres borrar el estado local mientras mantienes la CLI instalada
    - Quieres una simulación de lo que se eliminaría
summary: Referencia de CLI para `openclaw reset` (restablecer estado/configuración locales)
title: Restablecer
x-i18n:
    generated_at: "2026-07-05T11:11:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Restablece la configuración/el estado local (mantiene la CLI instalada).

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
- `--dry-run`: imprime las acciones sin eliminar archivos

## Alcances

| Alcance                 | Elimina                                                                                                                 | Detiene primero el gateway |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `config`                | solo el archivo de configuración                                                                                        | no                         |
| `config+creds+sessions` | archivo de configuración, directorio de OAuth/credenciales, directorios de sesión por agente                            | sí                         |
| `full`                  | directorio de estado (incluidos config/credenciales si están anidados dentro) más directorios de trabajo y atestaciones de espacios de trabajo | sí                         |

`config+creds+sessions` y `full` detienen un servicio de gateway administrado en ejecución antes de eliminar el estado.

## Notas

- Ejecuta primero `openclaw backup create` para crear una instantánea restaurable antes de eliminar el estado local.
- Sin `--scope`, `openclaw reset` solicita interactivamente el alcance que se va a eliminar.
- `--non-interactive` solo es válido cuando tanto `--scope` como `--yes` están definidos.
- `config+creds+sessions` y `full` imprimen `Next: openclaw onboard --install-daemon` al finalizar.

## Relacionado

- [Referencia de la CLI](/es/cli)
