---
read_when:
    - Quieres eliminar el servicio de Gateway y/o el estado local de OpenClaw
    - Quieres primero una ejecución de prueba
summary: Referencia de la CLI para `openclaw uninstall` (eliminar el servicio de Gateway y los datos locales)
title: Desinstalar
x-i18n:
    generated_at: "2026-04-24T05:24:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Desinstala el servicio de Gateway y los datos locales (la CLI permanece).

Opciones:

- `--service`: elimina el servicio de Gateway
- `--state`: elimina el estado y la configuración
- `--workspace`: elimina los directorios de espacios de trabajo
- `--app`: elimina la aplicación de macOS
- `--all`: elimina el servicio, el estado, el espacio de trabajo y la aplicación
- `--yes`: omite las solicitudes de confirmación
- `--non-interactive`: desactiva las solicitudes; requiere `--yes`
- `--dry-run`: imprime las acciones sin eliminar archivos

Ejemplos:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Notas:

- Ejecuta primero `openclaw backup create` si quieres una instantánea restaurable antes de eliminar el estado o los espacios de trabajo.
- `--all` es una abreviatura para eliminar conjuntamente el servicio, el estado, el espacio de trabajo y la aplicación.
- `--non-interactive` requiere `--yes`.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Desinstalar](/es/install/uninstall)
