---
read_when:
    - Quieres ver qué Skills están disponibles y listas para ejecutarse
    - Quieres buscar en ClawHub o instalar Skills desde ClawHub, Git o directorios locales
    - Quieres verificar una habilidad de ClawHub con ClawHub
    - Quieres depurar binarios, variables de entorno o configuración faltantes para Skills
summary: Referencia de la CLI para `openclaw skills` (buscar/instalar/actualizar/verificar/listar/información/comprobar/taller)
title: Skills
x-i18n:
    generated_at: "2026-07-05T11:11:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecciona Skills locales, busca en ClawHub, instala Skills desde directorios
ClawHub/Git/locales, verifica Skills de ClawHub y actualiza instalaciones rastreadas
por ClawHub.

Relacionado:

- Sistema de Skills: [Skills](/es/tools/skills)
- Taller de Skills: [Taller de Skills](/es/tools/skill-workshop)
- Configuración de Skills: [Configuración de Skills](/es/tools/skills-config)
- Instalaciones de ClawHub: [ClawHub](/es/clawhub/cli)

## Comandos

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update` y `verify` usan ClawHub directamente. `install @owner/<slug>`
instala una Skill de ClawHub, `install git:owner/repo[@ref]` clona una Skill de Git,
e `install ./path` copia un directorio de Skill local. De forma predeterminada,
`install`, `update` y `verify` apuntan al directorio `skills/` del espacio de trabajo
activo; con `--global`, apuntan al directorio compartido de Skills administradas.
`list`/`info`/`check` siguen inspeccionando las Skills locales visibles para el
espacio de trabajo y la configuración actuales. Los comandos respaldados por un
espacio de trabajo resuelven el espacio de trabajo de destino desde `--agent <id>`,
luego desde el directorio de trabajo actual cuando está dentro de un espacio de
trabajo de agente configurado y, después, desde el agente predeterminado.

Las instalaciones desde Git y directorios locales esperan `SKILL.md` en la raíz
de origen. El slug de instalación viene del `name` del frontmatter de `SKILL.md`
cuando es válido, luego del nombre del directorio o repositorio de origen; usa
`--as <slug>` para reemplazarlo. `--version` es solo para ClawHub. Las
instalaciones de Skills no admiten especificaciones de paquetes npm ni rutas
zip/de archivo, y `openclaw skills update` solo actualiza instalaciones rastreadas
por ClawHub.

Las instalaciones de dependencias de Skills respaldadas por Gateway que se
activan desde la incorporación o la configuración de Skills usan en su lugar la
ruta de solicitud separada `skills.install`.

Notas:

| Indicador/comportamiento         | Descripción                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Consulta opcional; omítela para explorar el feed de búsqueda predeterminado de ClawHub.                                                                                                                                                                                          |
| `search --limit <n>`             | Limita los resultados devueltos.                                                                                                                                                                                                                                                  |
| `install git:owner/repo[@ref]`   | Instala una Skill de Git. Las referencias de rama pueden contener barras, como `git:owner/repo@feature/foo`.                                                                                                                                                                      |
| `install ./path/to/skill`        | Instala un directorio local cuya raíz contiene `SKILL.md`.                                                                                                                                                                                                                        |
| `install --as <slug>`            | Reemplaza el slug inferido para instalaciones desde Git y directorios locales.                                                                                                                                                                                                     |
| `install --version <version>`    | Solo se aplica a referencias de Skills de ClawHub.                                                                                                                                                                                                                                |
| `install --force`                | Sobrescribe una carpeta de Skill existente en el espacio de trabajo para el mismo slug.                                                                                                                                                                                           |
| `install/update --force-install` | Instala una Skill de ClawHub pendiente y respaldada por GitHub antes de que finalice el análisis de ClawHub.                                                                                                                                                                      |
| `--global`                       | Apunta al directorio compartido de Skills administradas; no puede combinarse con `--agent <id>`.                                                                                                                                                                                  |
| `--agent <id>`                   | Apunta a un espacio de trabajo de agente configurado; reemplaza la inferencia desde el directorio de trabajo actual.                                                                                                                                                              |
| `update @owner/<slug>`           | Actualiza una sola Skill rastreada. Agrega `--global` para apuntar al directorio compartido de Skills administradas en lugar del espacio de trabajo.                                                                                                                              |
| `update --all`                   | Actualiza las instalaciones rastreadas de ClawHub en el espacio de trabajo seleccionado, o el directorio compartido de Skills administradas con `--global`.                                                                                                                       |
| `verify @owner/<slug>`           | Imprime de forma predeterminada el sobre JSON `clawhub.skill.verify.v1` de ClawHub. No hay indicador `--json` porque JSON ya es el valor predeterminado. Se aceptan slugs sin propietario por compatibilidad cuando la Skill ya está instalada o no hay ambigüedad; las referencias con propietario evitan ambigüedad del publicador. |
| Procedencia de `verify`          | Cuando ClawHub devuelve procedencia de origen resuelta por el servidor, el JSON de verificación también incluye un `openclaw.verifiedSourceUrl` fijado a un commit. Las URL de origen no disponibles o autodeclaradas permanecen solo en el sobre de procedencia sin procesar y no se promocionan. |
| Selector de versión de `verify`  | `verify` usa `.clawhub/origin.json` para Skills de ClawHub instaladas, por lo que verifica la versión instalada contra el registro del que provino. `--version` y `--tag` reemplazan el selector de versión, pero conservan ese registro instalado cuando existen metadatos de origen. |
| `verify --card`                  | Imprime el Markdown generado de la tarjeta de Skill en lugar de JSON. Sale con estado distinto de cero cuando ClawHub devuelve `ok: false` o `decision: "fail"`; las firmas sin firmar son informativas salvo que cambie la política de ClawHub. |
| Huella de tarjeta de Skill       | Los paquetes de ClawHub instalados pueden incluir un `skill-card.md` generado. OpenClaw trata la verificación como una decisión del servidor de ClawHub y no rechaza una Skill instalada solo porque esa tarjeta generada cambie la huella del paquete. |
| `check --agent <id>`             | Comprueba el espacio de trabajo del agente seleccionado e informa qué Skills listas son realmente visibles para el prompt o la superficie de comandos de ese agente.                                                                                                              |
| `list`                           | Acción predeterminada cuando no se proporciona ningún subcomando.                                                                                                                                                                                                                  |
| Salida de `list`/`info`/`check`  | La salida renderizada va a stdout. Con `--json`, la carga útil legible por máquina permanece en stdout para tuberías y scripts.                                                                                                                                                    |

Las instalaciones y actualizaciones de Skills comunitarias de ClawHub comprueban
la confianza antes de descargar. Las versiones de archivo comunitarias versionadas
usan metadatos de confianza de versión exacta. Las Skills de GitHub respaldadas
por el resolver dependen del resolver de instalación de ClawHub para aplicar la
política de análisis e instalación forzada antes de devolver un commit fijado; usa
`--force-install` para instalar una Skill pendiente y respaldada por GitHub antes
de que finalice ese análisis. Se rechazan las versiones comunitarias maliciosas o
bloqueadas. Las versiones comunitarias riesgosas requieren revisión y
`--acknowledge-clawhub-risk` cuando un comando no interactivo debe continuar
después de esa revisión. Los publicadores oficiales de Skills de ClawHub y las
fuentes de Skills incluidas con OpenClaw omiten este prompt de confianza de versión.

## Taller de Skills

`openclaw skills workshop` administra propuestas de Skills pendientes en el
espacio de trabajo seleccionado. Las propuestas no son Skills activas hasta que se
aplican. Para el almacenamiento de propuestas, salvaguardas de archivos de soporte,
métodos de Gateway y política de aprobación, consulta
[Taller de Skills](/es/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`propose-create`, `propose-update` y `revise` también aceptan `--goal <text>`
y `--evidence <text>` para registrar la motivación de la propuesta y las notas
de respaldo junto con el contenido de `--proposal`/`--proposal-dir`.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Skills](/es/tools/skills)
