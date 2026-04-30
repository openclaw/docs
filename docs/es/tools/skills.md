---
read_when:
    - Añadir o modificar Skills
    - Cambiar el control de activación de Skills, las listas de permitidos o las reglas de carga
    - Comprender la precedencia de Skills y el comportamiento de las instantáneas
sidebarTitle: Skills
summary: 'Skills: administradas frente a espacio de trabajo, reglas de control, listas de permitidos de agentes y conexión de configuración'
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:34:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa carpetas de skills **compatibles con [AgentSkills](https://agentskills.io)** para enseñar al agente a usar herramientas. Cada skill es un directorio que contiene un `SKILL.md` con frontmatter YAML e instrucciones. OpenClaw carga skills incluidas más reemplazos locales opcionales, y las filtra en tiempo de carga según el entorno, la configuración y la presencia de binarios.

## Ubicaciones y precedencia

OpenClaw carga skills desde estas fuentes, **con la mayor precedencia primero**:

| #   | Fuente                    | Ruta                             |
| --- | ------------------------- | -------------------------------- |
| 1   | Skills del workspace      | `<workspace>/skills`             |
| 2   | Skills del agente del proyecto | `<workspace>/.agents/skills`     |
| 3   | Skills personales del agente | `~/.agents/skills`               |
| 4   | Skills gestionadas/locales | `~/.openclaw/skills`             |
| 5   | Skills incluidas          | incluidas con la instalación     |
| 6   | Carpetas de skills adicionales | `skills.load.extraDirs` (config) |

Si un nombre de skill entra en conflicto, gana la fuente de mayor precedencia.

## Skills por agente frente a compartidas

En configuraciones **multiagente**, cada agente tiene su propio workspace:

| Ámbito               | Ruta                                        | Visible para                 |
| -------------------- | ------------------------------------------- | ---------------------------- |
| Por agente           | `<workspace>/skills`                        | Solo ese agente              |
| Agente del proyecto  | `<workspace>/.agents/skills`                | Solo el agente de ese workspace |
| Agente personal      | `~/.agents/skills`                          | Todos los agentes en esa máquina |
| Gestionadas/locales compartidas | `~/.openclaw/skills`                        | Todos los agentes en esa máquina |
| Directorios adicionales compartidos | `skills.load.extraDirs` (menor precedencia) | Todos los agentes en esa máquina |

Mismo nombre en varios lugares → gana la fuente de mayor precedencia. Workspace supera a
agente del proyecto, supera a agente personal, supera a gestionadas/locales, supera a incluidas,
supera a directorios adicionales.

## Listas de permisos de skills por agente

La **ubicación** de la skill y la **visibilidad** de la skill son controles separados.
La ubicación/precedencia decide qué copia de una skill con el mismo nombre gana; las listas
de permisos del agente deciden qué skills puede usar realmente un agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Reglas de listas de permisos">
    - Omite `agents.defaults.skills` para permitir skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar `agents.defaults.skills`.
    - Define `agents.list[].skills: []` para no permitir skills.
    - Una lista no vacía `agents.list[].skills` es el conjunto **final** para ese
      agente; no se fusiona con los valores predeterminados.
    - La lista de permisos efectiva se aplica a la construcción de prompts, el descubrimiento
      de comandos slash de skills, la sincronización del sandbox y las instantáneas de skills.
  </Accordion>
</AccordionGroup>

## Plugins y skills

Los Plugins pueden incluir sus propias skills listando directorios `skills` en
`openclaw.plugin.json` (rutas relativas a la raíz del Plugin). Las skills del Plugin
se cargan cuando el Plugin está habilitado. Este es el lugar adecuado para guías operativas
específicas de herramientas que son demasiado largas para la descripción de la herramienta pero deben estar
disponibles siempre que el Plugin esté instalado; por ejemplo, el Plugin de navegador
incluye una skill `browser-automation` para el control del navegador en varios pasos.

Los directorios de skills de Plugin se fusionan en la misma ruta de baja precedencia que
`skills.load.extraDirs`, por lo que una skill incluida, gestionada, de agente o de workspace
con el mismo nombre los reemplaza. Puedes condicionarlas mediante
`metadata.openclaw.requires.config` en la entrada de configuración del Plugin.

Consulta [Plugins](/es/tools/plugin) para descubrimiento/configuración y [Herramientas](/es/tools) para
la superficie de herramientas que esas skills enseñan.

## Taller de Skills

El Plugin opcional y experimental **Taller de Skills** puede crear o actualizar
skills del workspace a partir de procedimientos reutilizables observados durante el trabajo del agente. Está
deshabilitado de forma predeterminada y debe habilitarse explícitamente mediante
`plugins.entries.skill-workshop`.

Taller de Skills escribe solo en `<workspace>/skills`, analiza el contenido generado,
admite aprobación pendiente o escrituras seguras automáticas, pone en cuarentena
propuestas inseguras y actualiza la instantánea de skills después de escrituras
correctas para que las nuevas skills estén disponibles sin reiniciar el Gateway.

Úsalo para correcciones como _"la próxima vez, verifica la atribución de GIF"_ o
flujos de trabajo difíciles de obtener, como listas de comprobación de QA de medios. Empieza con aprobación
pendiente; usa escrituras automáticas solo en workspaces de confianza después de revisar
sus propuestas. Guía completa: [Plugin Taller de Skills](/es/plugins/skill-workshop).

## ClawHub (instalación y sincronización)

[ClawHub](https://clawhub.ai) es el registro público de skills para OpenClaw.
Usa los comandos nativos `openclaw skills` para descubrir/instalar/actualizar, o la
CLI `clawhub` separada para flujos de trabajo de publicación/sincronización. Guía completa:
[ClawHub](/es/tools/clawhub).

| Acción                             | Comando                                |
| ---------------------------------- | -------------------------------------- |
| Instalar una skill en el workspace | `openclaw skills install <skill-slug>` |
| Actualizar todas las skills instaladas | `openclaw skills update --all`         |
| Sincronizar (analizar + publicar actualizaciones) | `clawhub sync --all`                   |

`openclaw skills install` nativo instala en el directorio `skills/` del workspace activo.
La CLI `clawhub` separada también instala en `./skills` bajo tu directorio de trabajo actual
(o recurre al workspace configurado de OpenClaw). OpenClaw lo recoge como
`<workspace>/skills` en la siguiente sesión.
Las raíces de skills configuradas también admiten un nivel de agrupación, como
`skills/<group>/<skill>/SKILL.md`, para que las skills de terceros relacionadas puedan
mantenerse bajo una carpeta compartida sin un escaneo recursivo amplio.

Las páginas de skills de ClawHub muestran el estado más reciente del análisis de seguridad antes de instalar,
con páginas de detalle del analizador para VirusTotal, ClawScan y análisis estático.
`openclaw skills install <slug>` sigue siendo solo la ruta de instalación; los publicadores
recuperan falsos positivos mediante el panel de ClawHub o
`clawhub skill rescan <slug>`.

## Seguridad

<Warning>
Trata las skills de terceros como **código no confiable**. Léelas antes de habilitarlas.
Prefiere ejecuciones en sandbox para entradas no confiables y herramientas riesgosas. Consulta
[Sandboxing](/es/gateway/sandboxing) para los controles del lado del agente.
</Warning>

- El descubrimiento de skills de workspace y directorios adicionales solo acepta raíces de skills y archivos `SKILL.md` cuyo realpath resuelto permanezca dentro de la raíz configurada.
- Las instalaciones de dependencias de skills respaldadas por Gateway (`skills.install`, onboarding y la UI de configuración de Skills) ejecutan el analizador de código peligroso integrado antes de ejecutar metadatos de instalador. Los hallazgos `critical` bloquean de forma predeterminada salvo que el llamador defina explícitamente el override peligroso; los hallazgos sospechosos siguen solo advirtiendo.
- `openclaw skills install <slug>` es distinto: descarga una carpeta de skill de ClawHub en el workspace y no usa la ruta de metadatos de instalador anterior.
- `skills.entries.*.env` y `skills.entries.*.apiKey` inyectan secretos en el proceso **host** para ese turno del agente (no en el sandbox). Mantén los secretos fuera de prompts y logs.

Para un modelo de amenazas y listas de comprobación más amplios, consulta [Seguridad](/es/gateway/security).

## Formato de SKILL.md

`SKILL.md` debe incluir al menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw sigue la especificación AgentSkills para diseño/intención. El analizador usado
por el agente integrado solo admite claves de frontmatter de **una línea**;
`metadata` debe ser un **objeto JSON de una línea**. Usa `{baseDir}` en
las instrucciones para hacer referencia a la ruta de la carpeta de la skill.

### Claves opcionales de frontmatter

<ParamField path="homepage" type="string">
  URL mostrada como "Sitio web" en la UI de Skills de macOS. También se admite mediante `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Cuando es `true`, la skill se expone como un comando slash de usuario.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Cuando es `true`, la skill se excluye del prompt del modelo (sigue disponible mediante invocación de usuario).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Cuando se define como `tool`, el comando slash omite el modelo y se despacha directamente a una herramienta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nombre de la herramienta que se invoca cuando se define `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para el despacho a herramienta, reenvía la cadena de argumentos sin procesar a la herramienta (sin análisis del core). La herramienta se invoca con `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Condicionamiento (filtros en tiempo de carga)

OpenClaw filtra skills en tiempo de carga usando `metadata` (JSON de una línea):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Campos bajo `metadata.openclaw`:

<ParamField path="always" type="boolean">
  Cuando es `true`, incluye siempre la skill (omite otras condiciones).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opcional usado por la UI de Skills de macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opcional mostrada como "Sitio web" en la UI de Skills de macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Lista opcional de plataformas. Si se define, la skill solo es elegible en esos SO.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Cada uno debe existir en `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Al menos uno debe existir en `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  La variable de entorno debe existir o proporcionarse en la configuración.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lista de rutas de `openclaw.json` que deben ser truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nombre de la variable de entorno asociada con `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Especificaciones opcionales de instalador usadas por la UI de Skills de macOS (brew/node/go/uv/download).
</ParamField>

Si no hay `metadata.openclaw`, la skill siempre es elegible (salvo que esté
deshabilitada en la configuración o bloqueada por `skills.allowBundled` para skills incluidas).

<Note>
Los bloques heredados `metadata.clawdbot` todavía se aceptan cuando
`metadata.openclaw` está ausente, por lo que las skills instaladas antiguas conservan sus
condiciones de dependencias y sugerencias de instalador. Las skills nuevas y actualizadas deben usar
`metadata.openclaw`.
</Note>

### Notas de sandboxing

- `requires.bins` se comprueba en el **host** en tiempo de carga de la skill.
- Si un agente está en sandbox, el binario también debe existir **dentro del contenedor**. Instálalo mediante `agents.defaults.sandbox.docker.setupCommand` (o una imagen personalizada). `setupCommand` se ejecuta una vez después de crear el contenedor. Las instalaciones de paquetes también requieren salida de red, un FS raíz escribible y un usuario root en el sandbox.
- Ejemplo: la skill `summarize` (`skills/summarize/SKILL.md`) necesita la CLI `summarize` en el contenedor de sandbox para ejecutarse allí.

### Especificaciones de instalador

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Reglas de selección del instalador">
    - Si se enumeran varios instaladores, el Gateway elige una sola opción preferida (brew cuando está disponible; de lo contrario, node).
    - Si todos los instaladores son `download`, OpenClaw enumera cada entrada para que puedas ver los artefactos disponibles.
    - Las especificaciones del instalador pueden incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opciones por plataforma.
    - Las instalaciones de Node respetan `skills.install.nodeManager` en `openclaw.json` (predeterminado: npm; opciones: npm/pnpm/yarn/bun). Esto solo afecta a las instalaciones de Skills; el entorno de ejecución del Gateway debe seguir siendo Node; no se recomienda Bun para WhatsApp/Telegram.
    - La selección de instalador respaldada por el Gateway se basa en preferencias: cuando las especificaciones de instalación mezclan tipos, OpenClaw prefiere Homebrew cuando `skills.install.preferBrew` está habilitado y `brew` existe, luego `uv`, luego el gestor de node configurado, y luego otros recursos alternativos como `go` o `download`.
    - Si cada especificación de instalación es `download`, OpenClaw muestra todas las opciones de descarga en lugar de reducirlas a un instalador preferido.

  </Accordion>
  <Accordion title="Detalles por instalador">
    - **Instalaciones de Go:** si falta `go` y `brew` está disponible, el gateway instala primero Go mediante Homebrew y define `GOBIN` en el `bin` de Homebrew cuando es posible.
    - **Instalaciones por descarga:** `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predeterminado: automático cuando se detecta un archivo), `stripComponents`, `targetDir` (predeterminado: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Sobrescrituras de configuración

Las Skills incluidas y administradas pueden activarse o desactivarse y recibir valores de entorno
en `skills.entries` dentro de `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` desactiva la Skill incluso si está incluida o instalada.
  La Skill incluida `coding-agent` es opcional: define
  `skills.entries.coding-agent.enabled: true` antes de exponerla a los agentes,
  y luego asegúrate de que uno de `claude`, `codex`, `opencode` o `pi` esté instalado y
  autenticado para su propia CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Atajo para Skills que declaran `metadata.openclaw.primaryEnv`. Admite texto plano o SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Se inyecta solo si la variable aún no está definida en el proceso.
</ParamField>
<ParamField path="config" type="object">
  Contenedor opcional para campos personalizados por Skill. Las claves personalizadas deben vivir aquí.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Lista de permitidos opcional solo para Skills **incluidas**. Si se define, solo las Skills incluidas en la lista son elegibles (las Skills administradas/de espacio de trabajo no se ven afectadas).
</ParamField>

Si el nombre de la Skill contiene guiones, pon la clave entre comillas (JSON5 permite claves
entre comillas). Las claves de configuración coinciden con el **nombre de la Skill** de forma predeterminada; si una Skill
define `metadata.openclaw.skillKey`, usa esa clave en `skills.entries`.

<Note>
Para generación/edición de imágenes de stock dentro de OpenClaw, usa la herramienta principal
`image_generate` con `agents.defaults.imageGenerationModel` en lugar
de una Skill incluida. Los ejemplos de Skills aquí son para flujos de trabajo personalizados o de terceros.
Para análisis de imágenes nativo, usa la herramienta `image` con
`agents.defaults.imageModel`. Si eliges `openai/*`, `google/*`,
`fal/*` u otro modelo de imagen específico de proveedor, añade también la clave de autenticación/API
de ese proveedor.
</Note>

## Inyección de entorno

Cuando se inicia una ejecución de agente, OpenClaw:

1. Lee los metadatos de la Skill.
2. Aplica `skills.entries.<key>.env` y `skills.entries.<key>.apiKey` a `process.env`.
3. Construye el prompt del sistema con Skills **elegibles**.
4. Restaura el entorno original después de que finaliza la ejecución.

La inyección de entorno está **limitada a la ejecución del agente**, no a un entorno de shell
global.

Para el backend incluido `claude-cli`, OpenClaw también materializa la misma
instantánea elegible como un Plugin temporal de Claude Code y la pasa con
`--plugin-dir`. Claude Code puede entonces usar su resolutor nativo de Skills mientras
OpenClaw sigue controlando la precedencia, las listas de permitidos por agente, las puertas de activación y
la inyección de variables de entorno/claves de API de `skills.entries.*`. Otros backends de CLI usan solo el
catálogo del prompt.

## Instantáneas y actualización

OpenClaw toma instantáneas de las Skills elegibles **cuando se inicia una sesión** y
reutiliza esa lista para los turnos posteriores de la misma sesión. Los cambios en
Skills o en la configuración surten efecto en la siguiente sesión nueva.

Las Skills pueden actualizarse a mitad de sesión en dos casos:

- El observador de Skills está habilitado.
- Aparece un nuevo nodo remoto elegible.

Piensa en esto como una **recarga en caliente**: la lista actualizada se usa en el
siguiente turno del agente. Si la lista efectiva de Skills permitidas para el agente cambia para esa
sesión, OpenClaw actualiza la instantánea para que las Skills visibles permanezcan alineadas
con el agente actual.

### Observador de Skills

De forma predeterminada, OpenClaw observa las carpetas de Skills e incrementa la instantánea de Skills
cuando cambian archivos `SKILL.md`. Configúralo en `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### Nodos macOS remotos (Gateway en Linux)

Si el Gateway se ejecuta en Linux pero hay un **nodo macOS** conectado con
`system.run` permitido (seguridad de aprobaciones de Exec no definida en `deny`),
OpenClaw puede tratar las Skills solo para macOS como elegibles cuando los binarios requeridos
están presentes en ese nodo. El agente debe ejecutar esas Skills
mediante la herramienta `exec` con `host=node`.

Esto depende de que el nodo informe su soporte de comandos y de una comprobación de binarios
mediante `system.which` o `system.run`. Los nodos sin conexión **no** hacen
visibles las Skills solo remotas. Si un nodo conectado deja de responder a comprobaciones de
binarios, OpenClaw borra sus coincidencias de binarios en caché para que los agentes ya no vean
Skills que actualmente no pueden ejecutarse allí.

## Impacto en tokens

Cuando las Skills son elegibles, OpenClaw inyecta una lista XML compacta de Skills
disponibles en el prompt del sistema (mediante `formatSkillsForPrompt` en
`pi-coding-agent`). El coste es determinista:

- **Sobrecoste base** (solo cuando hay ≥1 Skill): 195 caracteres.
- **Por Skill:** 97 caracteres + la longitud de los valores `<name>`, `<description>` y `<location>` escapados para XML.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

El escape XML expande `& < > " '` en entidades (`&amp;`, `&lt;`, etc.),
lo que aumenta la longitud. Los conteos de tokens varían según el tokenizador del modelo. Una estimación aproximada
de estilo OpenAI es ~4 caracteres/token, por lo que **97 caracteres ≈ 24 tokens** por
Skill más las longitudes reales de tus campos.

## Ciclo de vida de Skills administradas

OpenClaw incluye un conjunto base de Skills como **Skills incluidas** con la
instalación (paquete npm u OpenClaw.app). `~/.openclaw/skills` existe para
sobrescrituras locales; por ejemplo, fijar o parchear una Skill sin
cambiar la copia incluida. Las Skills de espacio de trabajo pertenecen al usuario y sobrescriben
ambas cuando hay conflictos de nombre.

## ¿Buscas más Skills?

Explora [https://clawhub.ai](https://clawhub.ai). Esquema completo de configuración:
[Configuración de Skills](/es/tools/skills-config).

## Relacionado

- [ClawHub](/es/tools/clawhub) — registro público de Skills
- [Crear Skills](/es/tools/creating-skills) — creación de Skills personalizadas
- [Plugins](/es/tools/plugin) — descripción general del sistema de Plugins
- [Plugin Skill Workshop](/es/plugins/skill-workshop) — genera Skills a partir del trabajo del agente
- [Configuración de Skills](/es/tools/skills-config) — referencia de configuración de Skills
- [Comandos de barra](/es/tools/slash-commands) — todos los comandos de barra disponibles
