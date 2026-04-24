---
read_when:
    - Quieres ver qué Skills están disponibles y listas para ejecutarse
    - Quieres buscar, instalar o actualizar Skills desde ClawHub
    - Quieres depurar binarios/env/config faltantes para Skills
summary: Referencia de la CLI para `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-24T05:24:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Inspecciona Skills locales e instala/actualiza Skills desde ClawHub.

Relacionado:

- Sistema Skills: [Skills](/es/tools/skills)
- Configuración de Skills: [Configuración de Skills](/es/tools/skills-config)
- Instalaciones de ClawHub: [ClawHub](/es/tools/clawhub)

## Comandos

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` usan ClawHub directamente e instalan en el directorio
`skills/` del espacio de trabajo activo. `list`/`info`/`check` siguen inspeccionando las
Skills locales visibles para el espacio de trabajo y la configuración actuales.

Este comando `install` de la CLI descarga carpetas de Skills desde ClawHub. Las
instalaciones de dependencias de Skills iniciadas desde el gateway a partir de la incorporación o la configuración de Skills usan en su lugar la ruta de solicitud separada `skills.install`.

Notas:

- `search [query...]` acepta una consulta opcional; omítela para explorar el feed de búsqueda predeterminado
  de ClawHub.
- `search --limit <n>` limita los resultados devueltos.
- `install --force` sobrescribe una carpeta de Skill existente del espacio de trabajo para el mismo
  slug.
- `update --all` solo actualiza instalaciones de ClawHub rastreadas en el espacio de trabajo activo.
- `list` es la acción predeterminada cuando no se proporciona un subcomando.
- `list`, `info` y `check` escriben su salida renderizada en stdout. Con
  `--json`, eso significa que la carga útil legible por máquina permanece en stdout para tuberías
  y scripts.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Skills](/es/tools/skills)
