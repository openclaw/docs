---
read_when:
    - Quieres borrar el estado local manteniendo la CLI instalada
    - Quieres una simulación de lo que se eliminaría
summary: Referencia de la CLI para `openclaw reset` (restablecer estado/configuración local)
title: Restablecer
x-i18n:
    generated_at: "2026-04-24T05:23:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw reset`

Restablece la configuración/estado local (mantiene la CLI instalada).

Opciones:

- `--scope <scope>`: `config`, `config+creds+sessions` o `full`
- `--yes`: omite las solicitudes de confirmación
- `--non-interactive`: desactiva las solicitudes; requiere `--scope` y `--yes`
- `--dry-run`: muestra las acciones sin eliminar archivos

Ejemplos:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Notas:

- Ejecuta primero `openclaw backup create` si quieres una instantánea restaurable antes de eliminar el estado local.
- Si omites `--scope`, `openclaw reset` usa una solicitud interactiva para elegir qué eliminar.
- `--non-interactive` solo es válido cuando están establecidos tanto `--scope` como `--yes`.

## Relacionado

- [Referencia de la CLI](/es/cli)
