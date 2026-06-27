---
read_when:
    - Desea eliminar el servicio Gateway o el estado local, o ambos
    - Quieres hacer primero un ensayo en seco
summary: Referencia de CLI para `openclaw uninstall` (eliminar el servicio Gateway + datos locales)
title: Desinstalar
x-i18n:
    generated_at: "2026-06-27T11:06:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Desinstala el servicio Gateway + los datos locales (la CLI permanece).

Opciones:

- `--service`: elimina el servicio Gateway
- `--state`: elimina el estado y la configuración
- `--workspace`: elimina los directorios de espacio de trabajo
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

- Ejecuta `openclaw backup create` primero si quieres una instantánea restaurable antes de eliminar el estado o los espacios de trabajo.
- `--state` conserva los directorios de espacio de trabajo configurados a menos que también se seleccione `--workspace`.
- `--all` es una forma abreviada de eliminar el servicio, el estado, el espacio de trabajo y la aplicación juntos.
- `--non-interactive` requiere `--yes`.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Desinstalar](/es/install/uninstall)
