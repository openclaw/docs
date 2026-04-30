---
read_when:
    - Agregar o modificar Skills
    - Cambiar el control de acceso de Skills, las listas de permitidos o las reglas de carga
    - Comprender la precedencia de Skills y el comportamiento de las instantáneas
sidebarTitle: Skills
summary: 'Skills: administradas frente a las del espacio de trabajo, reglas de control, listas de permitidos de agentes y cableado de configuración'
title: Skills
x-i18n:
    generated_at: "2026-04-30T06:06:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f744f5e961f872cae02aa0ed77e0bbba35e4715f5762ac45ce190b74b2fd8c5e
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa carpetas de skill **compatibles con [AgentSkills](https://agentskills.io)** para enseñar al agente cómo usar herramientas. Cada skill es un directorio que contiene un `SKILL.md` con frontmatter YAML e instrucciones. OpenClaw carga Skills incluidas junto con anulaciones locales opcionales, y las filtra en el momento de carga según el entorno, la configuración y la presencia de binarios.

## Ubicaciones y precedencia

OpenClaw carga Skills desde estas fuentes, **primero la precedencia más alta**:

| #   | Fuente                | Ruta                             |
| --- | --------------------- | -------------------------------- |
| 1   | Skills del espacio de trabajo | `<workspace>/skills`             |
| 2   | Skills de agente del proyecto | `<workspace>/.agents/skills`     |
| 3   | Skills de agente personales | `~/.agents/skills`               |
| 4   | Skills gestionadas/locales | `~/.openclaw/skills`             |
| 5   | Skills incluidas        | incluidas con la instalación     |
| 6   | Carpetas de skill adicionales | `skills.load.extraDirs` (configuración) |

Si un nombre de skill entra en conflicto, gana la fuente con mayor precedencia.

## Skills por agente frente a compartidas

En configuraciones **multiagente**, cada agente tiene su propio espacio de trabajo:

| Ámbito               | Ruta                                        | Visible para                 |
| -------------------- | ------------------------------------------- | --------------------------- |
| Por agente           | `<workspace>/skills`                        | Solo ese agente             |
| Agente del proyecto  | `<workspace>/.agents/skills`                | Solo el agente de ese espacio de trabajo |
| Agente personal      | `~/.agents/skills`                          | Todos los agentes en esa máquina |
| Gestionadas/locales compartidas | `~/.openclaw/skills`                        | Todos los agentes en esa máquina |
| Directorios adicionales compartidos | `skills.load.extraDirs` (precedencia más baja) | Todos los agentes en esa máquina |

Mismo nombre en varios lugares → gana la fuente con mayor precedencia. El espacio de trabajo supera al agente del proyecto, supera al agente personal, supera a gestionadas/locales, supera a incluidas, supera a directorios adicionales.

## Listas de permitidos de Skills de agente

La **ubicación** de un skill y la **visibilidad** de un skill son controles separados. La ubicación/precedencia decide qué copia de un skill con el mismo nombre gana; las listas de permitidos del agente deciden qué Skills puede usar realmente un agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // hereda github, weather
      { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
      { id: "locked-down", skills: [] }, // sin Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Reglas de lista de permitidos">
    - Omite `agents.defaults.skills` para permitir Skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar `agents.defaults.skills`.
    - Define `agents.list[].skills: []` para no permitir ningún skill.
    - Una lista no vacía `agents.list[].skills` es el conjunto **final** para ese
      agente; no se combina con los valores predeterminados.
    - La lista de permitidos efectiva se aplica a la construcción de prompts, el
      descubrimiento de comandos de barra de Skills, la sincronización de sandbox y las instantáneas de Skills.
  </Accordion>
</AccordionGroup>

## Plugins y Skills

Los Plugins pueden incluir sus propios Skills enumerando directorios `skills` en
`openclaw.plugin.json` (rutas relativas a la raíz del Plugin). Los Skills del Plugin
se cargan cuando el Plugin está habilitado. Este es el lugar adecuado para guías operativas específicas de herramientas que son demasiado largas para la descripción de la herramienta, pero que deberían estar disponibles siempre que el Plugin esté instalado; por ejemplo, el Plugin de navegador incluye un skill `browser-automation` para control de navegador de varios pasos.

Los directorios de Skills de Plugin se fusionan en la misma ruta de baja precedencia que
`skills.load.extraDirs`, por lo que un skill incluido, gestionado, de agente o
de espacio de trabajo con el mismo nombre los anula. Puedes restringirlos mediante
`metadata.openclaw.requires.config` en la entrada de configuración del Plugin.

Consulta [Plugins](/es/tools/plugin) para descubrimiento/configuración y [Herramientas](/es/tools) para
la superficie de herramientas que enseñan esos Skills.

## Skill Workshop

El Plugin opcional y experimental **Skill Workshop** puede crear o actualizar
Skills de espacio de trabajo a partir de procedimientos reutilizables observados durante el trabajo del agente. Está deshabilitado de forma predeterminada y debe habilitarse explícitamente mediante
`plugins.entries.skill-workshop`.

Skill Workshop escribe solo en `<workspace>/skills`, escanea el contenido generado,
admite aprobación pendiente o escrituras seguras automáticas, pone en cuarentena
propuestas inseguras y actualiza la instantánea de Skills después de escrituras correctas para que los nuevos Skills estén disponibles sin reiniciar el Gateway.

Úsalo para correcciones como _"la próxima vez, verifica la atribución del GIF"_ o
flujos de trabajo difíciles de consolidar, como listas de comprobación de QA de medios. Empieza con aprobación pendiente; usa escrituras automáticas solo en espacios de trabajo de confianza después de revisar sus propuestas. Guía completa: [Plugin Skill Workshop](/es/plugins/skill-workshop).

## ClawHub (instalación y sincronización)

[ClawHub](https://clawhub.ai) es el registro público de Skills para OpenClaw.
Usa los comandos nativos `openclaw skills` para descubrir/instalar/actualizar, o la
CLI `clawhub` independiente para flujos de trabajo de publicación/sincronización. Guía completa:
[ClawHub](/es/tools/clawhub).

| Acción                             | Comando                                |
| ---------------------------------- | -------------------------------------- |
| Instalar un skill en el espacio de trabajo | `openclaw skills install <skill-slug>` |
| Actualizar todos los Skills instalados | `openclaw skills update --all`         |
| Sincronizar (escanear + publicar actualizaciones) | `clawhub sync --all`                   |

`openclaw skills install` nativo instala en el directorio `skills/` del espacio de trabajo activo. La CLI `clawhub` independiente también instala en
`./skills` bajo tu directorio de trabajo actual (o recurre al espacio de trabajo de OpenClaw configurado). OpenClaw lo recoge como
`<workspace>/skills` en la siguiente sesión.

Las páginas de Skills de ClawHub muestran el estado del análisis de seguridad más reciente antes de instalar, con páginas de detalle de analizadores para VirusTotal, ClawScan y análisis estático.
`openclaw skills install <slug>` sigue siendo solo la ruta de instalación; los publicadores
recuperan falsos positivos mediante el panel de ClawHub o
`clawhub skill rescan <slug>`.

## Seguridad

<Warning>
Trata los Skills de terceros como **código no confiable**. Léelos antes de habilitarlos.
Prefiere ejecuciones en sandbox para entradas no confiables y herramientas riesgosas. Consulta
[Sandboxing](/es/gateway/sandboxing) para los controles del lado del agente.
</Warning>

- El descubrimiento de Skills de espacio de trabajo y directorios adicionales solo acepta raíces de skill y archivos `SKILL.md` cuyo realpath resuelto permanezca dentro de la raíz configurada.
- Las instalaciones de dependencias de Skills respaldadas por Gateway (`skills.install`, onboarding y la UI de configuración de Skills) ejecutan el analizador integrado de código peligroso antes de ejecutar metadatos de instalador. Los hallazgos `critical` bloquean de forma predeterminada salvo que el llamador establezca explícitamente la anulación peligrosa; los hallazgos sospechosos solo siguen avisando.
- `openclaw skills install <slug>` es diferente: descarga una carpeta de skill de ClawHub en el espacio de trabajo y no usa la ruta de metadatos de instalador anterior.
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

OpenClaw sigue la especificación AgentSkills para diseño/intención. El parser usado
por el agente incrustado admite solo claves de frontmatter de **una sola línea**;
`metadata` debe ser un **objeto JSON de una sola línea**. Usa `{baseDir}` en
las instrucciones para hacer referencia a la ruta de la carpeta del skill.

### Claves de frontmatter opcionales

<ParamField path="homepage" type="string">
  URL mostrada como "Sitio web" en la UI de Skills de macOS. También se admite mediante `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Cuando es `true`, el skill se expone como comando de barra de usuario.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Cuando es `true`, el skill se excluye del prompt del modelo (sigue disponible mediante invocación de usuario).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Cuando se establece en `tool`, el comando de barra omite el modelo y despacha directamente a una herramienta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nombre de la herramienta que se invoca cuando se establece `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para despacho a herramientas, reenvía la cadena de argumentos sin procesar a la herramienta (sin análisis del núcleo). La herramienta se invoca con `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Restricciones (filtros en tiempo de carga)

OpenClaw filtra Skills en el momento de carga usando `metadata` (JSON de una sola línea):

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
  Cuando es `true`, incluye siempre el skill (omite otras restricciones).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opcional usado por la UI de Skills de macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opcional mostrada como "Sitio web" en la UI de Skills de macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Lista opcional de plataformas. Si se define, el skill solo es elegible en esos sistemas operativos.
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
  Especificaciones de instalador opcionales usadas por la UI de Skills de macOS (brew/node/go/uv/download).
</ParamField>

Si no hay `metadata.openclaw`, el skill siempre es elegible (salvo que
esté deshabilitado en la configuración o bloqueado por `skills.allowBundled` para Skills incluidos).

<Note>
Los bloques heredados `metadata.clawdbot` aún se aceptan cuando
`metadata.openclaw` está ausente, por lo que los Skills instalados antiguos conservan sus
restricciones de dependencias y sugerencias de instalador. Los Skills nuevos y actualizados deberían usar
`metadata.openclaw`.
</Note>

### Notas de sandboxing

- `requires.bins` se comprueba en el **host** en el momento de carga del skill.
- Si un agente está en sandbox, el binario también debe existir **dentro del contenedor**. Instálalo mediante `agents.defaults.sandbox.docker.setupCommand` (o una imagen personalizada). `setupCommand` se ejecuta una vez después de crear el contenedor. Las instalaciones de paquetes también requieren salida de red, un FS raíz escribible y un usuario root en el sandbox.
- Ejemplo: el skill `summarize` (`skills/summarize/SKILL.md`) necesita la CLI `summarize` en el contenedor de sandbox para ejecutarse allí.

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
  <Accordion title="Reglas de selección de instalador">
    - Si se listan varios instaladores, el Gateway elige una única opción preferida (brew cuando esté disponible; de lo contrario, node).
    - Si todos los instaladores son `download`, OpenClaw lista cada entrada para que puedas ver los artefactos disponibles.
    - Las especificaciones de instalador pueden incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opciones por plataforma.
    - Las instalaciones de Node respetan `skills.install.nodeManager` en `openclaw.json` (predeterminado: npm; opciones: npm/pnpm/yarn/bun). Esto solo afecta las instalaciones de Skills; el runtime del Gateway debe seguir siendo Node: Bun no se recomienda para WhatsApp/Telegram.
    - La selección de instalador respaldada por el Gateway se basa en preferencias: cuando las especificaciones de instalación mezclan tipos, OpenClaw prefiere Homebrew cuando `skills.install.preferBrew` está habilitado y `brew` existe, luego `uv`, luego el gestor de node configurado, y después otros respaldos como `go` o `download`.
    - Si cada especificación de instalación es `download`, OpenClaw muestra todas las opciones de descarga en lugar de reducirlas a un instalador preferido.

  </Accordion>
  <Accordion title="Detalles por instalador">
    - **Instalaciones de Go:** si falta `go` y `brew` está disponible, el gateway instala Go primero mediante Homebrew y establece `GOBIN` en el `bin` de Homebrew cuando es posible.
    - **Instalaciones por descarga:** `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predeterminado: automático cuando se detecta un archivo comprimido), `stripComponents`, `targetDir` (predeterminado: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Sobrescrituras de configuración

Las Skills incluidas y gestionadas se pueden activar o desactivar y recibir valores de env
bajo `skills.entries` en `~/.openclaw/openclaw.json`:

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
  La skill incluida `coding-agent` es de activación explícita: establece
  `skills.entries.coding-agent.enabled: true` antes de exponerla a los agentes;
  luego asegúrate de que uno de `claude`, `codex`, `opencode` o `pi` esté instalado y
  autenticado para su propia CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Atajo para Skills que declaran `metadata.openclaw.primaryEnv`. Admite texto sin formato o SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Se inyecta solo si la variable aún no está establecida en el proceso.
</ParamField>
<ParamField path="config" type="object">
  Contenedor opcional para campos personalizados por skill. Las claves personalizadas deben vivir aquí.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Lista de permitidos opcional solo para Skills **incluidas**. Si se establece, solo las Skills incluidas en la lista son aptas (las Skills gestionadas/de espacio de trabajo no se ven afectadas).
</ParamField>

Si el nombre de la skill contiene guiones, pon la clave entre comillas (JSON5 permite claves
entre comillas). Las claves de configuración coinciden con el **nombre de la skill** de forma predeterminada; si una skill
define `metadata.openclaw.skillKey`, usa esa clave bajo `skills.entries`.

<Note>
Para generar/editar imágenes de stock dentro de OpenClaw, usa la herramienta principal
`image_generate` con `agents.defaults.imageGenerationModel` en lugar
de una skill incluida. Los ejemplos de Skills aquí son para flujos de trabajo personalizados o de terceros.
Para el análisis nativo de imágenes, usa la herramienta `image` con
`agents.defaults.imageModel`. Si eliges `openai/*`, `google/*`,
`fal/*` u otro modelo de imagen específico de proveedor, agrega también la
autenticación/clave de API de ese proveedor.
</Note>

## Inyección de entorno

Cuando se inicia una ejecución de agente, OpenClaw:

1. Lee los metadatos de la skill.
2. Aplica `skills.entries.<key>.env` y `skills.entries.<key>.apiKey` a `process.env`.
3. Construye el prompt del sistema con Skills **aptas**.
4. Restaura el entorno original después de que termina la ejecución.

La inyección de entorno está **limitada a la ejecución del agente**, no a un entorno
de shell global.

Para el backend incluido `claude-cli`, OpenClaw también materializa la misma
instantánea apta como un Plugin temporal de Claude Code y la pasa con
`--plugin-dir`. Claude Code puede usar entonces su resolutor nativo de Skills mientras
OpenClaw sigue siendo propietario de la precedencia, las listas de permitidos por agente, las puertas de control y la
inyección de env/clave de API de `skills.entries.*`. Otros backends de CLI usan solo el
catálogo del prompt.

## Instantáneas y actualización

OpenClaw toma instantáneas de las Skills aptas **cuando se inicia una sesión** y
reutiliza esa lista para los turnos posteriores en la misma sesión. Los cambios en
Skills o configuración surten efecto en la siguiente sesión nueva.

Las Skills pueden actualizarse a mitad de sesión en dos casos:

- El observador de Skills está habilitado.
- Aparece un nuevo nodo remoto apto.

Piensa en esto como una **recarga en caliente**: la lista actualizada se adopta en el
siguiente turno del agente. Si la lista de Skills permitidas efectiva del agente cambia para esa
sesión, OpenClaw actualiza la instantánea para que las Skills visibles se mantengan alineadas
con el agente actual.

### Observador de Skills

De forma predeterminada, OpenClaw observa las carpetas de Skills e incrementa la instantánea de Skills
cuando cambian archivos `SKILL.md`. Configura esto bajo `skills.load`:

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

### Nodos macOS remotos (gateway Linux)

Si el Gateway se ejecuta en Linux pero hay un **nodo macOS** conectado con
`system.run` permitido (seguridad de aprobaciones Exec no establecida en `deny`),
OpenClaw puede tratar las Skills exclusivas de macOS como aptas cuando los binarios
requeridos están presentes en ese nodo. El agente debe ejecutar esas Skills
mediante la herramienta `exec` con `host=node`.

Esto depende de que el nodo informe su compatibilidad con comandos y de una prueba de bin
mediante `system.which` o `system.run`. Los nodos sin conexión **no** hacen visibles
las Skills solo remotas. Si un nodo conectado deja de responder a las pruebas de bin,
OpenClaw borra sus coincidencias de bin en caché para que los agentes ya no vean
Skills que no pueden ejecutarse allí en ese momento.

## Impacto en tokens

Cuando las Skills son aptas, OpenClaw inyecta una lista XML compacta de Skills
disponibles en el prompt del sistema (mediante `formatSkillsForPrompt` en
`pi-coding-agent`). El costo es determinista:

- **Sobrecarga base** (solo cuando hay ≥1 skill): 195 caracteres.
- **Por skill:** 97 caracteres + la longitud de los valores `<name>`, `<description>` y `<location>` escapados para XML.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

El escapado XML expande `& < > " '` en entidades (`&amp;`, `&lt;`, etc.),
aumentando la longitud. Los conteos de tokens varían según el tokenizador del modelo. Una estimación aproximada
estilo OpenAI es ~4 caracteres/token, por lo que **97 caracteres ≈ 24 tokens** por
skill más las longitudes reales de tus campos.

## Ciclo de vida de Skills gestionadas

OpenClaw distribuye un conjunto base de Skills como **Skills incluidas** con la
instalación (paquete npm u OpenClaw.app). `~/.openclaw/skills` existe para
sobrescrituras locales; por ejemplo, fijar o parchear una skill sin
cambiar la copia incluida. Las Skills de espacio de trabajo son propiedad del usuario y sobrescriben
ambas en conflictos de nombre.

## ¿Buscas más Skills?

Explora [https://clawhub.ai](https://clawhub.ai). Esquema completo de configuración:
[Configuración de Skills](/es/tools/skills-config).

## Relacionado

- [ClawHub](/es/tools/clawhub) — registro público de Skills
- [Crear Skills](/es/tools/creating-skills) — crear Skills personalizadas
- [Plugins](/es/tools/plugin) — descripción general del sistema de plugins
- [Plugin Skill Workshop](/es/plugins/skill-workshop) — genera Skills a partir del trabajo del agente
- [Configuración de Skills](/es/tools/skills-config) — referencia de configuración de Skills
- [Comandos slash](/es/tools/slash-commands) — todos los comandos slash disponibles
