---
read_when:
    - Quieres ver qué Skills están disponibles y listas para ejecutarse
    - Desea buscar en ClawHub o instalar Skills desde ClawHub, Git o directorios locales
    - Quieres verificar una Skills de ClawHub con ClawHub
    - Quieres depurar binarios/entorno/configuración faltantes para Skills
summary: Referencia de la CLI para `openclaw skills` (buscar/instalar/actualizar/verificar/listar/información/comprobar/taller)
title: Skills
x-i18n:
    generated_at: "2026-06-27T11:06:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecciona Skills locales, busca en ClawHub, instala Skills desde ClawHub/Git/directorios
locales, verifica Skills de ClawHub y actualiza instalaciones rastreadas por ClawHub.

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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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
instala una Skill de ClawHub, `install git:owner/repo[@ref]` clona una Skill de Git, y
`install ./path` copia un directorio local de Skill. De forma predeterminada, `install`, `update`
y `verify` apuntan al directorio `skills/` del espacio de trabajo activo; con `--global`,
apuntan al directorio compartido de Skills administradas. `list`/`info`/`check` siguen
inspeccionando las Skills locales visibles para el espacio de trabajo y la configuración actuales.
Los comandos respaldados por espacios de trabajo resuelven el espacio de trabajo de destino a partir de `--agent <id>`, luego
el directorio de trabajo actual cuando está dentro de un espacio de trabajo de agente configurado,
y después el agente predeterminado.

Las instalaciones desde Git y directorios locales esperan `SKILL.md` en la raíz de origen. El
slug de instalación proviene del frontmatter `name` de `SKILL.md` cuando es válido, luego del
directorio de origen o el nombre del repositorio; usa `--as <slug>` para sobrescribirlo. `--version`
es solo para ClawHub. Las instalaciones de Skills no admiten especificaciones de paquetes npm ni rutas
zip/archivo, y `openclaw skills update` actualiza solo instalaciones rastreadas por ClawHub.

Las instalaciones de dependencias de Skills respaldadas por Gateway que se activan desde la incorporación o la configuración de Skills
usan en su lugar la ruta de solicitud separada `skills.install`.

Notas:

- `search [query...]` acepta una consulta opcional; omítela para explorar el feed de búsqueda predeterminado
  de ClawHub.
- `search --limit <n>` limita los resultados devueltos.
- `install git:owner/repo[@ref]` instala una Skill de Git. Las referencias de rama pueden contener
  barras, como `git:owner/repo@feature/foo`.
- `install ./path/to/skill` instala un directorio local cuya raíz contiene
  `SKILL.md`.
- `install --as <slug>` sobrescribe el slug inferido para instalaciones desde Git y directorios locales.
- `install --version <version>` se aplica solo a referencias de Skills de ClawHub.
- `install --force` sobrescribe una carpeta de Skill existente en el espacio de trabajo para el mismo
  slug.
- Las instalaciones y actualizaciones de Skills comunitarias de ClawHub comprueban la confianza antes de descargar.
  Las versiones de archivo comunitarias versionadas usan metadatos de confianza de release exacta.
  Las Skills de GitHub respaldadas por resolvedor dependen del resolvedor de instalación de ClawHub para aplicar
  la política de escaneo e instalación forzada antes de que devuelva un commit fijado. Las releases comunitarias maliciosas o
  bloqueadas se rechazan. Las releases comunitarias riesgosas requieren
  revisión y `--acknowledge-clawhub-risk` cuando un comando no interactivo debe
  continuar después de esa revisión. Los publicadores oficiales de Skills de ClawHub y las fuentes de Skills
  incluidas con OpenClaw omiten este aviso de confianza de release.
- `--global` apunta al directorio compartido de Skills administradas y no se puede combinar
  con `--agent <id>`.
- `--agent <id>` apunta a un espacio de trabajo de agente configurado y sobrescribe la inferencia del
  directorio de trabajo actual.
- `update @owner/<slug>` actualiza una única Skill rastreada. Añade `--global` para
  apuntar al directorio compartido de Skills administradas en lugar del espacio de trabajo.
- `update --all` actualiza las instalaciones rastreadas de ClawHub en el espacio de trabajo seleccionado, o
  en el directorio compartido de Skills administradas cuando se combina con `--global`.
- `verify @owner/<slug>` imprime de forma predeterminada el sobre JSON `clawhub.skill.verify.v1`
  de ClawHub. No hay flag `--json` porque JSON ya es el valor
  predeterminado. Los slugs sin prefijo siguen aceptándose por compatibilidad cuando la Skill ya está
  instalada o no es ambigua, pero las referencias calificadas por propietario evitan la ambigüedad del
  publicador.
- Cuando ClawHub devuelve procedencia de origen resuelta por el servidor, el JSON de verificación también
  incluye un `openclaw.verifiedSourceUrl` fijado a commit. Las URL de origen no disponibles o
  autodeclaradas permanecen solo en el sobre de procedencia sin procesar y no se
  promocionan.
- `verify` usa `.clawhub/origin.json` para Skills de ClawHub instaladas, por lo que
  verifica la versión instalada contra el registro del que provino. `--version`
  y `--tag` sobrescriben el selector de versión, pero conservan ese registro instalado
  cuando existen metadatos de origen.
- `verify --card` imprime el Markdown de la Tarjeta de Skill generada en lugar de JSON. El
  comando sale con un valor distinto de cero cuando ClawHub devuelve `ok: false` o `decision: "fail"`;
  las firmas sin firmar son informativas salvo que cambie la política de ClawHub.
- Los paquetes de ClawHub instalados pueden incluir un `skill-card.md` generado. OpenClaw
  trata la verificación como una decisión del servidor de ClawHub y no rechaza una
  Skill instalada solo porque esa tarjeta generada cambie la huella digital del paquete.
- `check --agent <id>` comprueba el espacio de trabajo del agente seleccionado e informa qué
  Skills listas son realmente visibles para la superficie de prompt o comando de ese agente.
- `list` es la acción predeterminada cuando no se proporciona ningún subcomando.
- `list`, `info` y `check` escriben su salida renderizada en stdout. Con
  `--json`, eso significa que la carga útil legible por máquina permanece en stdout para pipes
  y scripts.

## Taller de Skills

`openclaw skills workshop` administra propuestas de Skills pendientes en el
espacio de trabajo seleccionado. Las propuestas no son Skills activas hasta que se aplican. Para el almacenamiento de propuestas,
salvaguardas de archivos de soporte, métodos de Gateway y política de aprobación, consulta
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

## Relacionado

- [Referencia de CLI](/es/cli)
- [Skills](/es/tools/skills)
