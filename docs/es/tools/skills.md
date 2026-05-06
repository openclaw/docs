---
read_when:
    - Agregar o modificar Skills
    - Cambiar el control de acceso de Skills, las listas de permitidos o las reglas de carga
    - Comprender la precedencia de Skills y el comportamiento de las instantáneas
sidebarTitle: Skills
summary: 'Skills: administradas frente a las del espacio de trabajo, reglas de control, listas de permitidos de agentes e integración de configuración'
title: Skills
x-i18n:
    generated_at: "2026-05-06T05:52:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa carpetas de habilidades **compatibles con [AgentSkills](https://agentskills.io)** para enseñarle al agente cómo usar herramientas. Cada habilidad es un directorio que contiene un `SKILL.md` con frontmatter YAML e instrucciones. OpenClaw carga habilidades incluidas más anulaciones locales opcionales, y las filtra en tiempo de carga según el entorno, la configuración y la presencia de binarios.

## Ubicaciones y precedencia

OpenClaw carga habilidades desde estas fuentes, **con la precedencia más alta primero**:

| #   | Fuente                       | Ruta                             |
| --- | ---------------------------- | -------------------------------- |
| 1   | Habilidades del workspace    | `<workspace>/skills`             |
| 2   | Habilidades del agente del proyecto | `<workspace>/.agents/skills`     |
| 3   | Habilidades personales del agente | `~/.agents/skills`               |
| 4   | Habilidades gestionadas/locales | `~/.openclaw/skills`             |
| 5   | Habilidades incluidas        | incluidas con la instalación     |
| 6   | Carpetas de habilidades adicionales | `skills.load.extraDirs` (config) |

Si un nombre de habilidad entra en conflicto, gana la fuente con mayor precedencia.

El directorio nativo `$CODEX_HOME/skills` de Codex CLI no es una de estas raíces de habilidades de OpenClaw. En modo de arnés de Codex, los lanzamientos locales del app-server usan homes de Codex aislados por agente, por lo que las habilidades personales de Codex CLI no se cargan implícitamente. Usa `openclaw migrate codex --dry-run` para inventariarlas y `openclaw migrate codex` para elegir directorios de habilidades con una solicitud interactiva de casillas antes de copiarlas al workspace actual del agente de OpenClaw. Para ejecuciones no interactivas, repite `--skill <name>` para las habilidades exactas que quieras copiar.

## Habilidades por agente frente a compartidas

En configuraciones **multiagente**, cada agente tiene su propio workspace:

| Alcance              | Ruta                                        | Visible para                 |
| -------------------- | ------------------------------------------- | ---------------------------- |
| Por agente           | `<workspace>/skills`                        | Solo ese agente              |
| Agente del proyecto  | `<workspace>/.agents/skills`                | Solo el agente de ese workspace |
| Agente personal      | `~/.agents/skills`                          | Todos los agentes en esa máquina |
| Compartidas gestionadas/locales | `~/.openclaw/skills`                        | Todos los agentes en esa máquina |
| Directorios adicionales compartidos | `skills.load.extraDirs` (menor precedencia) | Todos los agentes en esa máquina |

Mismo nombre en varios lugares → gana la fuente con mayor precedencia. Workspace supera a agente del proyecto, supera a agente personal, supera a gestionadas/locales, supera a incluidas, supera a directorios adicionales.

## Listas de permitidos de habilidades del agente

La **ubicación** de la habilidad y la **visibilidad** de la habilidad son controles separados. La ubicación/precedencia decide qué copia de una habilidad con el mismo nombre gana; las listas de permitidos del agente deciden qué habilidades puede usar realmente un agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // hereda github, weather
      { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
      { id: "locked-down", skills: [] }, // sin habilidades
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Reglas de listas de permitidos">
    - Omite `agents.defaults.skills` para habilidades sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar `agents.defaults.skills`.
    - Define `agents.list[].skills: []` para no permitir habilidades.
    - Una lista no vacía `agents.list[].skills` es el conjunto **final** para ese agente: no se fusiona con los valores predeterminados.
    - La lista de permitidos efectiva se aplica a la construcción de prompts, el descubrimiento de comandos slash de habilidades, la sincronización de sandbox y las instantáneas de habilidades.

  </Accordion>
</AccordionGroup>

## Plugins y habilidades

Los Plugins pueden incluir sus propias habilidades listando directorios `skills` en `openclaw.plugin.json` (rutas relativas a la raíz del Plugin). Las habilidades del Plugin se cargan cuando el Plugin está habilitado. Este es el lugar adecuado para guías operativas específicas de herramientas que son demasiado largas para la descripción de la herramienta, pero que deberían estar disponibles siempre que el Plugin esté instalado; por ejemplo, el Plugin del navegador incluye una habilidad `browser-automation` para el control del navegador en varios pasos.

Los directorios de habilidades de Plugins se fusionan en la misma ruta de baja precedencia que `skills.load.extraDirs`, por lo que una habilidad incluida, gestionada, de agente o de workspace con el mismo nombre las anula. Puedes condicionarlas mediante `metadata.openclaw.requires.config` en la entrada de configuración del Plugin.

Consulta [Plugins](/es/tools/plugin) para descubrimiento/configuración y [Herramientas](/es/tools) para la superficie de herramientas que esas habilidades enseñan.

## Skill Workshop

El Plugin opcional y experimental **Skill Workshop** puede crear o actualizar habilidades del workspace a partir de procedimientos reutilizables observados durante el trabajo del agente. Está deshabilitado de forma predeterminada y debe habilitarse explícitamente mediante `plugins.entries.skill-workshop`.

Skill Workshop escribe solo en `<workspace>/skills`, escanea el contenido generado, admite aprobación pendiente o escrituras seguras automáticas, pone en cuarentena las propuestas no seguras y actualiza la instantánea de habilidades después de escrituras correctas para que las habilidades nuevas estén disponibles sin reiniciar Gateway.

Úsalo para correcciones como _"la próxima vez, verifica la atribución de GIF"_ o flujos de trabajo ganados con esfuerzo, como listas de comprobación de QA de medios. Empieza con aprobación pendiente; usa escrituras automáticas solo en workspaces de confianza después de revisar sus propuestas. Guía completa: [Plugin Skill Workshop](/es/plugins/skill-workshop).

## ClawHub (instalación y sincronización)

[ClawHub](https://clawhub.ai) es el registro público de habilidades para OpenClaw. Usa los comandos nativos `openclaw skills` para descubrir/instalar/actualizar, o la CLI `clawhub` separada para flujos de trabajo de publicación/sincronización. Guía completa: [ClawHub](/es/tools/clawhub).

| Acción                             | Comando                                |
| ---------------------------------- | -------------------------------------- |
| Instalar una habilidad en el workspace | `openclaw skills install <skill-slug>` |
| Actualizar todas las habilidades instaladas | `openclaw skills update --all`         |
| Sincronizar (escanear + publicar actualizaciones) | `clawhub sync --all`                   |

El comando nativo `openclaw skills install` instala en el directorio activo `skills/` del workspace. La CLI `clawhub` separada también instala en `./skills` bajo tu directorio de trabajo actual (o usa como respaldo el workspace de OpenClaw configurado). OpenClaw lo recoge como `<workspace>/skills` en la siguiente sesión.
Las raíces de habilidades configuradas también admiten un nivel de agrupación, como `skills/<group>/<skill>/SKILL.md`, para que las habilidades de terceros relacionadas puedan mantenerse bajo una carpeta compartida sin un escaneo recursivo amplio.

Las páginas de habilidades de ClawHub exponen el estado del escaneo de seguridad más reciente antes de la instalación, con páginas de detalle del escáner para VirusTotal, ClawScan y análisis estático. `openclaw skills install <slug>` sigue siendo solo la ruta de instalación; los publicadores recuperan falsos positivos mediante el panel de ClawHub o `clawhub skill rescan <slug>`.

## Seguridad

<Warning>
Trata las habilidades de terceros como **código no confiable**. Léelas antes de habilitarlas. Prefiere ejecuciones en sandbox para entradas no confiables y herramientas riesgosas. Consulta [Sandboxing](/es/gateway/sandboxing) para los controles del lado del agente.
</Warning>

- El descubrimiento de habilidades en workspace y directorios adicionales solo acepta raíces de habilidades y archivos `SKILL.md` cuyo realpath resuelto permanezca dentro de la raíz configurada.
- Las instalaciones de dependencias de habilidades respaldadas por Gateway (`skills.install`, onboarding y la IU de configuración de Skills) ejecutan el escáner integrado de código peligroso antes de ejecutar metadatos del instalador. Los hallazgos `critical` bloquean de forma predeterminada salvo que el llamador establezca explícitamente la anulación peligrosa; los hallazgos sospechosos siguen solo advirtiendo.
- `openclaw skills install <slug>` es diferente: descarga una carpeta de habilidad de ClawHub en el workspace y no usa la ruta de metadatos del instalador anterior.
- `skills.entries.*.env` y `skills.entries.*.apiKey` inyectan secretos en el proceso **host** para ese turno del agente (no en el sandbox). Mantén los secretos fuera de prompts y registros.

Para un modelo de amenazas y listas de comprobación más amplios, consulta [Seguridad](/es/gateway/security).

## Formato de SKILL.md

`SKILL.md` debe incluir al menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw sigue la especificación AgentSkills para diseño/intención. El parser usado por el agente integrado admite solo claves de frontmatter de **una sola línea**; `metadata` debe ser un **objeto JSON de una sola línea**. Usa `{baseDir}` en las instrucciones para hacer referencia a la ruta de la carpeta de la habilidad.

### Claves opcionales de frontmatter

<ParamField path="homepage" type="string">
  URL mostrada como "Sitio web" en la IU de Skills de macOS. También se admite mediante `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Cuando es `true`, la habilidad se expone como comando slash de usuario.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Cuando es `true`, OpenClaw mantiene las instrucciones de la habilidad fuera del prompt normal del agente. La habilidad sigue instalada y todavía puede ejecutarse explícitamente como comando slash cuando `user-invocable` también es `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Cuando se define como `tool`, el comando slash omite el modelo y despacha directamente a una herramienta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nombre de la herramienta que se invocará cuando `command-dispatch: tool` esté definido.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para despacho de herramientas, reenvía la cadena de argumentos sin procesar a la herramienta (sin análisis del core). La herramienta se invoca con `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Condicionamiento (filtros de tiempo de carga)

OpenClaw filtra habilidades en tiempo de carga usando `metadata` (JSON de una sola línea):

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
  Cuando es `true`, incluye siempre la habilidad (omite otras condiciones).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opcional usado por la IU de Skills de macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opcional mostrada como "Sitio web" en la IU de Skills de macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Lista opcional de plataformas. Si se define, la habilidad solo es elegible en esos sistemas operativos.
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
  Nombre de variable de entorno asociado con `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Especificaciones opcionales del instalador usadas por la IU de Skills de macOS (brew/node/go/uv/download).
</ParamField>

Si no hay `metadata.openclaw`, la habilidad siempre es elegible (salvo que esté deshabilitada en la configuración o bloqueada por `skills.allowBundled` para habilidades incluidas).

<Note>
Los bloques heredados `metadata.clawdbot` aún se aceptan cuando `metadata.openclaw` está ausente, por lo que las habilidades instaladas antiguas conservan sus condiciones de dependencias y sugerencias del instalador. Las habilidades nuevas y actualizadas deben usar `metadata.openclaw`.
</Note>

### Notas de sandboxing

- `requires.bins` se comprueba en el **host** en tiempo de carga de la habilidad.
- Si un agente está en sandbox, el binario también debe existir **dentro del contenedor**. Instálalo mediante `agents.defaults.sandbox.docker.setupCommand` (o una imagen personalizada). `setupCommand` se ejecuta una vez después de crear el contenedor. Las instalaciones de paquetes también requieren salida de red, un FS raíz escribible y un usuario root en el sandbox.
- Ejemplo: la habilidad `summarize` (`skills/summarize/SKILL.md`) necesita la CLI `summarize` en el contenedor de sandbox para ejecutarse allí.

### Especificaciones del instalador

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
    - Si se enumeran varios instaladores, el gateway elige una única opción preferida (brew cuando está disponible; si no, node).
    - Si todos los instaladores son `download`, OpenClaw enumera cada entrada para que puedas ver los artefactos disponibles.
    - Las especificaciones del instalador pueden incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opciones por plataforma.
    - Las instalaciones de Node respetan `skills.install.nodeManager` en `openclaw.json` (predeterminado: npm; opciones: npm/pnpm/yarn/bun). Esto solo afecta a las instalaciones de skills; el runtime del Gateway aún debería ser Node; Bun no se recomienda para WhatsApp/Telegram.
    - La selección del instalador respaldada por el Gateway se basa en preferencias: cuando las especificaciones de instalación mezclan tipos, OpenClaw prefiere Homebrew cuando `skills.install.preferBrew` está habilitado y `brew` existe; luego `uv`; luego el gestor de node configurado; luego otros recursos de respaldo como `go` o `download`.
    - Si cada especificación de instalación es `download`, OpenClaw muestra todas las opciones de descarga en lugar de reducirlas a un instalador preferido.

  </Accordion>
  <Accordion title="Detalles por instalador">
    - **Instalaciones de Go:** si falta `go` y `brew` está disponible, el gateway instala Go primero mediante Homebrew y establece `GOBIN` en el `bin` de Homebrew cuando es posible.
    - **Instalaciones por descarga:** `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predeterminado: auto cuando se detecta un archivo), `stripComponents`, `targetDir` (predeterminado: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Sobrescrituras de configuración

Las skills incluidas y gestionadas se pueden activar o desactivar y se les pueden proporcionar valores de entorno
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
  `false` deshabilita la skill aunque esté incluida o instalada.
  La skill incluida `coding-agent` es opt-in: establece
  `skills.entries.coding-agent.enabled: true` antes de exponerla a los agentes,
  luego asegúrate de que uno de `claude`, `codex`, `opencode` o `pi` esté instalado y
  autenticado para su propia CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Comodidad para skills que declaran `metadata.openclaw.primaryEnv`. Admite texto plano o SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Se inyecta solo si la variable aún no está establecida en el proceso.
</ParamField>
<ParamField path="config" type="object">
  Contenedor opcional para campos personalizados por skill. Las claves personalizadas deben estar aquí.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Lista de permitidos opcional solo para skills **incluidas**. Si se establece, solo las skills incluidas en la lista son elegibles (las skills gestionadas/de workspace no se ven afectadas).
</ParamField>

Si el nombre de la skill contiene guiones, pon la clave entre comillas (JSON5 permite claves
entre comillas). Las claves de configuración coinciden con el **nombre de la skill** de forma predeterminada; si una skill
define `metadata.openclaw.skillKey`, usa esa clave en `skills.entries`.

<Note>
Para generación/edición de imágenes de stock dentro de OpenClaw, usa la herramienta core
`image_generate` con `agents.defaults.imageGenerationModel` en lugar
de una skill incluida. Los ejemplos de skills aquí son para flujos de trabajo personalizados o de terceros.
Para análisis de imágenes nativo, usa la herramienta `image` con
`agents.defaults.imageModel`. Si eliges `openai/*`, `google/*`,
`fal/*` u otro modelo de imagen específico de proveedor, añade también la clave de
auth/API de ese proveedor.
</Note>

## Inyección de entorno

Cuando se inicia una ejecución de agente, OpenClaw:

1. Lee los metadatos de la skill.
2. Aplica `skills.entries.<key>.env` y `skills.entries.<key>.apiKey` a `process.env`.
3. Construye el prompt del sistema con skills **elegibles**.
4. Restaura el entorno original después de que finaliza la ejecución.

La inyección de entorno está **limitada a la ejecución del agente**, no a un entorno
global de shell.

Para el backend incluido `claude-cli`, OpenClaw también materializa el mismo
snapshot elegible como un Plugin temporal de Claude Code y lo pasa con
`--plugin-dir`. Claude Code puede entonces usar su resolvedor nativo de skills mientras
OpenClaw aún controla la precedencia, las listas de permitidos por agente, los controles y la
inyección de entorno/clave de API de `skills.entries.*`. Otros backends de CLI usan solo el
catálogo del prompt.

## Snapshots y actualización

OpenClaw toma snapshots de las skills elegibles **cuando se inicia una sesión** y
reutiliza esa lista para turnos posteriores en la misma sesión. Los cambios en
skills o configuración surten efecto en la siguiente sesión nueva.

Las Skills pueden actualizarse a mitad de sesión en dos casos:

- El watcher de skills está habilitado.
- Aparece un nuevo nodo remoto elegible.

Piensa en esto como una **recarga en caliente**: la lista actualizada se recoge en el
siguiente turno del agente. Si cambia la lista efectiva de skills permitidas para el agente en esa
sesión, OpenClaw actualiza el snapshot para que las skills visibles se mantengan alineadas
con el agente actual.

### Watcher de Skills

De forma predeterminada, OpenClaw observa las carpetas de skills y actualiza el snapshot de skills
cuando cambian los archivos `SKILL.md`. Configúralo en `skills.load`:

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

### Nodos remotos macOS (gateway Linux)

Si el Gateway se ejecuta en Linux pero hay un **nodo macOS** conectado con
`system.run` permitido (la seguridad de aprobaciones de Exec no está establecida en `deny`),
OpenClaw puede tratar las skills exclusivas de macOS como elegibles cuando los
binarios requeridos están presentes en ese nodo. El agente debería ejecutar esas skills
mediante la herramienta `exec` con `host=node`.

Esto depende de que el nodo informe su compatibilidad con comandos y de una comprobación de binarios
mediante `system.which` o `system.run`. Los nodos sin conexión **no** hacen
visibles las skills solo remotas. Si un nodo conectado deja de responder a las
comprobaciones de binarios, OpenClaw borra sus coincidencias de binarios en caché para que los agentes ya no vean
skills que no pueden ejecutarse allí actualmente.

## Impacto en tokens

Cuando las skills son elegibles, OpenClaw inyecta una lista XML compacta de skills disponibles
en el prompt del sistema (mediante `formatSkillsForPrompt` en
`pi-coding-agent`). El coste es determinista:

- **Sobrecarga base** (solo cuando hay ≥1 skill): 195 caracteres.
- **Por skill:** 97 caracteres + la longitud de los valores `<name>`, `<description>` y `<location>` con escape XML.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

El escape XML expande `& < > " '` en entidades (`&amp;`, `&lt;`, etc.),
lo que aumenta la longitud. Los recuentos de tokens varían según el tokenizador del modelo. Una estimación aproximada
al estilo de OpenAI es ~4 caracteres/token, por lo que **97 caracteres ≈ 24 tokens** por
skill más las longitudes reales de tus campos.

## Ciclo de vida de skills gestionadas

OpenClaw distribuye un conjunto base de skills como **skills incluidas** con la
instalación (paquete npm u OpenClaw.app). `~/.openclaw/skills` existe para
sobrescrituras locales; por ejemplo, para fijar o parchear una skill sin
cambiar la copia incluida. Las skills de workspace son propiedad del usuario y sobrescriben
ambas en conflictos de nombre.

## ¿Buscas más skills?

Explora [https://clawhub.ai](https://clawhub.ai). Esquema de configuración
completo: [Configuración de Skills](/es/tools/skills-config).

## Relacionado

- [ClawHub](/es/tools/clawhub) - registro público de skills
- [Crear skills](/es/tools/creating-skills) - crear skills personalizadas
- [Plugins](/es/tools/plugin) - resumen del sistema de Plugin
- [Plugin Skill Workshop](/es/plugins/skill-workshop) - genera skills a partir del trabajo del agente
- [Configuración de Skills](/es/tools/skills-config) - referencia de configuración de skills
- [Comandos slash](/es/tools/slash-commands) - todos los comandos slash disponibles
