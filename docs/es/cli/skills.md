---
read_when:
    - Quieres ver qué Skills están disponibles y listas para ejecutarse
    - Quieres buscar, instalar o actualizar Skills desde ClawHub
    - Quieres depurar binarios, entorno o configuración faltantes para Skills
summary: Referencia de CLI para `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-30T05:35:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecciona las Skills locales e instala/actualiza Skills desde ClawHub.

Relacionado:

- Sistema de Skills: [Skills](/es/tools/skills)
- Configuración de Skills: [Configuración de Skills](/es/tools/skills-config)
- Instalaciones de ClawHub: [ClawHub](/es/tools/clawhub)

## Comandos

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` usan ClawHub directamente e instalan en el directorio
`skills/` del espacio de trabajo activo. `list`/`info`/`check` aún inspeccionan
las Skills locales visibles para el espacio de trabajo y la configuración
actuales. Los comandos basados en espacios de trabajo resuelven el espacio de
trabajo de destino desde `--agent <id>`, luego desde el directorio de trabajo
actual cuando está dentro de un espacio de trabajo de agente configurado y, por
último, desde el agente predeterminado.

Este comando `install` de la CLI descarga carpetas de Skills desde ClawHub. Las
instalaciones de dependencias de Skills respaldadas por Gateway que se activan
desde la incorporación o la configuración de Skills usan en su lugar la ruta de
solicitud `skills.install` separada.

Notas:

- `search [query...]` acepta una consulta opcional; omítela para explorar el feed
  de búsqueda predeterminado de ClawHub.
- `search --limit <n>` limita los resultados devueltos.
- `install --force` sobrescribe una carpeta de Skill existente del espacio de
  trabajo para el mismo slug.
- `--agent <id>` apunta a un espacio de trabajo de agente configurado y anula la
  inferencia del directorio de trabajo actual.
- `update --all` solo actualiza las instalaciones rastreadas de ClawHub en el
  espacio de trabajo activo.
- `list` es la acción predeterminada cuando no se proporciona ningún subcomando.
- `list`, `info` y `check` escriben su salida renderizada en stdout. Con
  `--json`, eso significa que la carga útil legible por máquina permanece en
  stdout para tuberías y scripts.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Skills](/es/tools/skills)
