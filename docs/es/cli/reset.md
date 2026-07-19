---
read_when:
    - Quiere borrar el estado local y mantener instalada la CLI
    - Se desea una simulación de lo que se eliminaría
summary: Referencia de la CLI para `openclaw reset` (restablecer el estado y la configuración locales)
title: Restablecer
x-i18n:
    generated_at: "2026-07-19T01:54:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54f1d320ee368dae4a4bfb32dea73d19eb35f9f30edd12d9c2580ab7e6a26fa6
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Restablece la configuración y el estado locales (mantiene la CLI instalada).

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

| Ámbito                  | Elimina                                                                                  | Detiene primero el Gateway |
| ----------------------- | ---------------------------------------------------------------------------------------- | -------------------------- |
| `config`      | solo el archivo de configuración                                                         | no                         |
| `config+creds+sessions`      | el archivo de configuración, el directorio de OAuth/credenciales y los directorios de sesiones de cada agente | sí |
| `full`      | el directorio de estado (incluida la base de datos SQLite compartida) y los directorios del espacio de trabajo | sí |

`config+creds+sessions` y `full` detienen un servicio Gateway administrado en ejecución antes de eliminar el estado.

## Notas

- Ejecute primero `openclaw backup create` para crear una instantánea restaurable antes de eliminar el estado local.
- El estado de configuración del espacio de trabajo y las certificaciones son filas de la base de datos SQLite compartida, por lo que `full` las elimina junto con el directorio de estado; actualmente no hay archivos auxiliares de certificación que deban eliminarse por separado.
- Sin `--scope`, `openclaw reset` solicita de forma interactiva el ámbito que se debe eliminar.
- `--non-interactive` solo es válido cuando se establecen tanto `--scope` como `--yes`.
- `config+creds+sessions` y `full` muestran `Next: openclaw onboard --install-daemon` al finalizar.

## Relacionado

- [Referencia de la CLI](/es/cli)
