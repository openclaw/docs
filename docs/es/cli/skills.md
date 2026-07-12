---
read_when:
    - Quieres ver qué Skills están disponibles y listas para ejecutarse
    - Quieres buscar en ClawHub o instalar Skills desde ClawHub, Git o directorios locales
    - Quieres verificar una skill de ClawHub con ClawHub
    - Quieres depurar la falta de binarios, variables de entorno o configuración para Skills
summary: Referencia de la CLI para `openclaw skills` (buscar/instalar/actualizar/verificar/listar/información/comprobar/taller)
title: Skills
x-i18n:
    generated_at: "2026-07-11T23:01:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecciona las Skills locales, busca en ClawHub, instala Skills desde ClawHub, Git o directorios locales, verifica Skills de ClawHub y actualiza las instalaciones registradas por ClawHub.

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

`search`, `update` y `verify` usan ClawHub directamente. `install @owner/<slug>` instala una Skill de ClawHub, `install git:owner/repo[@ref]` clona una Skill de Git y `install ./path` copia un directorio local de Skill. De forma predeterminada, `install`, `update` y `verify` usan como destino el directorio `skills/` del espacio de trabajo activo; con `--global`, usan el directorio compartido de Skills administradas. `list`/`info`/`check` siguen inspeccionando las Skills locales visibles para el espacio de trabajo y la configuración actuales. Los comandos basados en el espacio de trabajo determinan el espacio de trabajo de destino a partir de `--agent <id>`; después, del directorio de trabajo actual cuando se encuentra dentro del espacio de trabajo de un agente configurado; y, por último, del agente predeterminado.

Las instalaciones desde Git y directorios locales requieren `SKILL.md` en la raíz del origen. El slug de instalación se obtiene primero del campo `name` del frontmatter de `SKILL.md` cuando es válido y, después, del nombre del directorio de origen o del repositorio; usa `--as <slug>` para sustituirlo. `--version` solo es compatible con ClawHub. Las instalaciones de Skills no admiten especificaciones de paquetes npm ni rutas de archivos zip o archivados, y `openclaw skills update` solo actualiza instalaciones registradas por ClawHub.

Las instalaciones de dependencias de Skills respaldadas por el Gateway que se activan desde la incorporación o la configuración de Skills usan en su lugar la ruta de solicitud independiente `skills.install`.

Notas:

| Opción/comportamiento             | Descripción                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`               | Consulta opcional; omítela para explorar el canal de búsqueda predeterminado de ClawHub.                                                                                                                                                                                                                                                     |
| `search --limit <n>`              | Limita la cantidad de resultados devueltos.                                                                                                                                                                                                                                                                                                  |
| `install git:owner/repo[@ref]`    | Instala una Skill de Git. Las referencias de rama pueden contener barras, como `git:owner/repo@feature/foo`.                                                                                                                                                                                                                                  |
| `install ./path/to/skill`         | Instala un directorio local cuya raíz contiene `SKILL.md`.                                                                                                                                                                                                                                                                                   |
| `install --as <slug>`             | Sustituye el slug inferido para las instalaciones desde Git y directorios locales.                                                                                                                                                                                                                                                           |
| `install --version <version>`     | Solo se aplica a referencias de Skills de ClawHub.                                                                                                                                                                                                                                                                                           |
| `install --force`                 | Sobrescribe una carpeta de Skill existente en el espacio de trabajo para el mismo slug.                                                                                                                                                                                                                                                      |
| `install/update --force-install`  | Instala una Skill pendiente de ClawHub respaldada por GitHub antes de que finalice el análisis de ClawHub.                                                                                                                                                                                                                                   |
| `--global`                        | Usa como destino el directorio compartido de Skills administradas; no se puede combinar con `--agent <id>`.                                                                                                                                                                                                                                  |
| `--agent <id>`                    | Usa como destino el espacio de trabajo de un agente configurado; sustituye la inferencia basada en el directorio de trabajo actual.                                                                                                                                                                                                           |
| `update @owner/<slug>`            | Actualiza una sola Skill registrada. Añade `--global` para usar como destino el directorio compartido de Skills administradas en lugar del espacio de trabajo.                                                                                                                                                                                |
| `update --all`                    | Actualiza las instalaciones de ClawHub registradas en el espacio de trabajo seleccionado o, con `--global`, en el directorio compartido de Skills administradas.                                                                                                                                                                              |
| `verify @owner/<slug>`            | De forma predeterminada, imprime el contenedor JSON `clawhub.skill.verify.v1` de ClawHub. No existe la opción `--json` porque JSON ya es el formato predeterminado. Se aceptan slugs sin propietario por compatibilidad cuando la Skill ya está instalada o no es ambigua; las referencias que incluyen al propietario evitan la ambigüedad sobre el publicador. |
| Procedencia de `verify`           | Cuando ClawHub devuelve la procedencia del origen resuelta por el servidor, el JSON de verificación también incluye un `openclaw.verifiedSourceUrl` fijado a un commit. Las URL de origen no disponibles o declaradas por el propio origen permanecen únicamente en el contenedor de procedencia sin procesar y no se promocionan.                  |
| Selector de versión de `verify`   | `verify` usa `.clawhub/origin.json` para las Skills de ClawHub instaladas, por lo que verifica la versión instalada en el registro del que procede. `--version` y `--tag` sustituyen el selector de versión, pero conservan ese registro instalado cuando existen metadatos de origen.                                                            |
| `verify --card`                   | Imprime el Markdown generado de la tarjeta de la Skill en lugar de JSON. Finaliza con un código distinto de cero cuando ClawHub devuelve `ok: false` o `decision: "fail"`; las firmas sin firmar son informativas, a menos que cambie la política de ClawHub.                                                                                      |
| Huella de la tarjeta de la Skill  | Los paquetes de ClawHub instalados pueden incluir un archivo `skill-card.md` generado. OpenClaw trata la verificación como una decisión del servidor de ClawHub y no rechaza una Skill instalada solo porque esa tarjeta generada cambie la huella del paquete.                                                                                  |
| `check --agent <id>`              | Comprueba el espacio de trabajo del agente seleccionado e informa qué Skills listas están realmente visibles para el prompt o la superficie de comandos de ese agente.                                                                                                                                                                       |
| `list`                            | Acción predeterminada cuando no se proporciona ningún subcomando.                                                                                                                                                                                                                                                                            |
| Salida de `list`/`info`/`check`   | La salida renderizada se envía a stdout. Con `--json`, la carga útil legible por máquina permanece en stdout para canalizaciones y scripts.                                                                                                                                                                                                    |

Las instalaciones y actualizaciones de Skills comunitarias de ClawHub comprueban la confianza antes de la descarga. Las versiones archivadas y versionadas de la comunidad usan metadatos de confianza específicos de la versión exacta. Las Skills de GitHub respaldadas por un resolutor dependen del resolutor de instalación de ClawHub para aplicar la política de análisis e instalación forzada antes de devolver un commit fijado; usa `--force-install` para instalar una Skill pendiente respaldada por GitHub antes de que finalice dicho análisis. Se rechazan las versiones comunitarias maliciosas o bloqueadas. Las versiones comunitarias de riesgo requieren revisión y `--acknowledge-clawhub-risk` cuando un comando no interactivo deba continuar después de esa revisión. Los publicadores oficiales de Skills de ClawHub y los orígenes de Skills incluidos con OpenClaw omiten esta solicitud de confianza de la versión.

## Taller de Skills

`openclaw skills workshop` administra las propuestas de Skills pendientes en el espacio de trabajo seleccionado. Las propuestas no son Skills activas hasta que se aplican. Para obtener información sobre el almacenamiento de propuestas, las medidas de protección de archivos auxiliares, los métodos del Gateway y la política de aprobación, consulta [Taller de Skills](/es/tools/skill-workshop).

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

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Skills](/es/tools/skills)
