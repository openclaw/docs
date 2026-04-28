---
read_when:
    - Agregar o modificar Skills
    - Cambiar el control de Skills, las listas de permitidos o las reglas de carga
    - Comprender la precedencia de Skills y el comportamiento de las instantáneas
sidebarTitle: Skills
summary: 'Skills: administradas vs. del espacio de trabajo, reglas de control, listas de permitidos del agente y configuración del cableado'
title: Skills
x-i18n:
    generated_at: "2026-04-26T11:40:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw usa carpetas de Skills **compatibles con [AgentSkills](https://agentskills.io)** para enseñarle al agente cómo usar herramientas. Cada Skill es un directorio
que contiene un `SKILL.md` con frontmatter YAML e instrucciones. OpenClaw
carga Skills integradas más anulaciones locales opcionales, y las filtra en
tiempo de carga según el entorno, la configuración y la presencia de binarios.

## Ubicaciones y precedencia

OpenClaw carga Skills desde estas fuentes, **de mayor precedencia a menor**:

| #   | Fuente                | Ruta                             |
| --- | --------------------- | -------------------------------- |
| 1   | Skills del espacio de trabajo | `<workspace>/skills`             |
| 2   | Skills de agente del proyecto  | `<workspace>/.agents/skills`     |
| 3   | Skills de agente personales | `~/.agents/skills`               |
| 4   | Skills administradas/locales  | `~/.openclaw/skills`             |
| 5   | Skills integradas        | incluidas con la instalación         |
| 6   | Carpetas de Skills adicionales   | `skills.load.extraDirs` (configuración) |

Si hay un conflicto de nombres de Skills, gana la fuente con mayor precedencia.

## Skills por agente vs. compartidas

En configuraciones de **múltiples agentes**, cada agente tiene su propio espacio de trabajo:

| Alcance                | Ruta                                        | Visible para                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| Por agente            | `<workspace>/skills`                        | Solo para ese agente             |
| Agente del proyecto        | `<workspace>/.agents/skills`                | Solo para el agente de ese espacio de trabajo |
| Agente personal       | `~/.agents/skills`                          | Todos los agentes de esa máquina  |
| Administradas/locales compartidas | `~/.openclaw/skills`                        | Todos los agentes de esa máquina  |
| Directorios adicionales compartidos    | `skills.load.extraDirs` (precedencia más baja) | Todos los agentes de esa máquina  |

El mismo nombre en varios lugares → gana la fuente más alta. El espacio de trabajo supera
al agente del proyecto, que supera al agente personal, que supera a administradas/locales, que supera a integradas,
que supera a directorios adicionales.

## Listas de permitidos de Skills por agente

La **ubicación** de una Skill y la **visibilidad** de una Skill son controles separados.
La ubicación/precedencia decide qué copia de una Skill con el mismo nombre gana; las
listas de permitidos del agente deciden qué Skills puede usar realmente un agente.

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
  <Accordion title="Reglas de la lista de permitidos">
    - Omite `agents.defaults.skills` para Skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar `agents.defaults.skills`.
    - Establece `agents.list[].skills: []` para no tener Skills.
    - Una lista `agents.list[].skills` no vacía es el conjunto **final** para ese
      agente: no se combina con los valores predeterminados.
    - La lista de permitidos efectiva se aplica en la construcción del prompt, el
      descubrimiento de comandos de barra de Skills, la sincronización del sandbox y las instantáneas de Skills.
  </Accordion>
</AccordionGroup>

## Plugins y Skills

Los plugins pueden incluir sus propias Skills enumerando directorios `skills` en
`openclaw.plugin.json` (rutas relativas a la raíz del plugin). Las Skills del plugin
se cargan cuando el plugin está habilitado. Este es el lugar correcto para guías de operación
específicas de herramientas que son demasiado largas para la descripción de la herramienta pero que
deben estar disponibles siempre que el plugin esté instalado; por ejemplo, el plugin
del navegador incluye una Skill `browser-automation` para el control del navegador en varios pasos.

Los directorios de Skills del plugin se combinan en la misma ruta de baja precedencia que
`skills.load.extraDirs`, por lo que una Skill integrada, administrada, de agente o de espacio de trabajo
con el mismo nombre las anula. Puedes controlarlas mediante
`metadata.openclaw.requires.config` en la entrada de configuración del plugin.

Consulta [Plugins](/es/tools/plugin) para descubrimiento/configuración y [Tools](/es/tools) para
la superficie de herramientas que enseñan esas Skills.

## Skill Workshop

El plugin opcional y experimental **Skill Workshop** puede crear o actualizar
Skills del espacio de trabajo a partir de procedimientos reutilizables observados durante el trabajo del agente. Está
deshabilitado de forma predeterminada y debe habilitarse explícitamente mediante
`plugins.entries.skill-workshop`.

Skill Workshop escribe solo en `<workspace>/skills`, analiza el
contenido generado, admite aprobación pendiente o escrituras seguras automáticas, pone en cuarentena
las propuestas inseguras y actualiza la instantánea de Skills después de escrituras correctas
para que las nuevas Skills estén disponibles sin reiniciar el Gateway.

Úsalo para correcciones como _"la próxima vez, verifica la atribución del GIF"_ o
flujos de trabajo difíciles de conseguir, como listas de verificación de QA de medios. Empieza con aprobación
pendiente; usa escrituras automáticas solo en espacios de trabajo de confianza después de revisar
sus propuestas. Guía completa: [plugin Skill Workshop](/es/plugins/skill-workshop).

## ClawHub (instalar y sincronizar)

[ClawHub](https://clawhub.ai) es el registro público de Skills para OpenClaw.
Usa los comandos nativos `openclaw skills` para descubrir/instalar/actualizar, o la
CLI `clawhub` independiente para flujos de trabajo de publicación/sincronización. Guía completa:
[ClawHub](/es/tools/clawhub).

| Acción                             | Comando                                |
| ---------------------------------- | -------------------------------------- |
| Instalar una Skill en el espacio de trabajo | `openclaw skills install <skill-slug>` |
| Actualizar todas las Skills instaladas        | `openclaw skills update --all`         |
| Sincronizar (escanear + publicar actualizaciones)      | `clawhub sync --all`                   |

El comando nativo `openclaw skills install` instala en el directorio
`skills/` del espacio de trabajo activo. La CLI `clawhub` independiente también instala en
`./skills` bajo tu directorio de trabajo actual (o usa como alternativa el
espacio de trabajo de OpenClaw configurado). OpenClaw detecta eso como
`<workspace>/skills` en la siguiente sesión.

## Seguridad

<Warning>
Trata las Skills de terceros como **código no confiable**. Léelas antes de habilitarlas.
Prefiere ejecuciones en sandbox para entradas no confiables y herramientas riesgosas. Consulta
[Sandboxing](/es/gateway/sandboxing) para los controles del lado del agente.
</Warning>

- El descubrimiento de Skills del espacio de trabajo y de directorios adicionales solo acepta raíces de Skills y archivos `SKILL.md` cuyo realpath resuelto permanezca dentro de la raíz configurada.
- Las instalaciones de dependencias de Skills respaldadas por Gateway (`skills.install`, onboarding y la interfaz de configuración de Skills) ejecutan el escáner integrado de código peligroso antes de ejecutar metadatos del instalador. Los hallazgos `critical` bloquean de forma predeterminada a menos que quien llama establezca explícitamente la anulación de peligro; los hallazgos sospechosos siguen siendo solo advertencias.
- `openclaw skills install <slug>` es diferente: descarga una carpeta de Skill de ClawHub al espacio de trabajo y no usa la ruta de metadatos del instalador anterior.
- `skills.entries.*.env` y `skills.entries.*.apiKey` inyectan secretos en el proceso **host** para ese turno del agente (no en el sandbox). Mantén los secretos fuera de los prompts y los registros.

Para un modelo de amenazas más amplio y listas de verificación, consulta [Security](/es/gateway/security).

## Formato de `SKILL.md`

`SKILL.md` debe incluir al menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw sigue la especificación de AgentSkills para el diseño/la intención. El analizador usado
por el agente integrado admite solo claves de frontmatter de **una sola línea**;
`metadata` debe ser un **objeto JSON de una sola línea**. Usa `{baseDir}` en las
instrucciones para hacer referencia a la ruta de la carpeta de la Skill.

### Claves opcionales de frontmatter

<ParamField path="homepage" type="string">
  URL mostrada como "Website" en la interfaz de Skills de macOS. También se admite mediante `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Cuando es `true`, la Skill se expone como un comando de barra para el usuario.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Cuando es `true`, la Skill se excluye del prompt del modelo (sigue disponible mediante invocación del usuario).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Cuando se establece en `tool`, el comando de barra omite el modelo y se envía directamente a una herramienta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nombre de la herramienta que se invocará cuando se establezca `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para el envío a herramientas, reenvía la cadena de argumentos sin procesar a la herramienta (sin análisis del núcleo). La herramienta se invoca con `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Control (filtros en tiempo de carga)

OpenClaw filtra Skills en tiempo de carga usando `metadata` (JSON de una sola línea):

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

Campos en `metadata.openclaw`:

<ParamField path="always" type="boolean">
  Cuando es `true`, siempre incluye la Skill (omite otros controles).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opcional usado por la interfaz de Skills de macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opcional mostrada como "Website" en la interfaz de Skills de macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Lista opcional de plataformas. Si se establece, la Skill solo es apta en esos sistemas operativos.
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
  Lista de rutas de `openclaw.json` que deben ser verdaderas.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nombre de variable de entorno asociado con `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Especificaciones opcionales del instalador usadas por la interfaz de Skills de macOS (brew/node/go/uv/download).
</ParamField>

Si no hay `metadata.openclaw`, la Skill siempre es apta (a menos que
esté deshabilitada en la configuración o bloqueada por `skills.allowBundled` para Skills integradas).

<Note>
Los bloques heredados `metadata.clawdbot` siguen aceptándose cuando
`metadata.openclaw` está ausente, por lo que las Skills antiguas instaladas conservan sus
controles de dependencias y sugerencias del instalador. Las Skills nuevas y actualizadas deben usar
`metadata.openclaw`.
</Note>

### Notas sobre sandboxing

- `requires.bins` se verifica en el **host** en el momento de cargar la Skill.
- Si un agente está en sandbox, el binario también debe existir **dentro del contenedor**. Instálalo mediante `agents.defaults.sandbox.docker.setupCommand` (o una imagen personalizada). `setupCommand` se ejecuta una vez después de crear el contenedor. Las instalaciones de paquetes también requieren salida de red, un sistema de archivos raíz escribible y un usuario root en el sandbox.
- Ejemplo: la Skill `summarize` (`skills/summarize/SKILL.md`) necesita la CLI `summarize` en el contenedor sandbox para ejecutarse allí.

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
    - Si se enumeran varios instaladores, el Gateway elige una única opción preferida (brew cuando está disponible; en caso contrario, node).
    - Si todos los instaladores son `download`, OpenClaw enumera cada entrada para que puedas ver los artefactos disponibles.
    - Las especificaciones del instalador pueden incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opciones por plataforma.
    - Las instalaciones de Node respetan `skills.install.nodeManager` en `openclaw.json` (predeterminado: npm; opciones: npm/pnpm/yarn/bun). Esto solo afecta a las instalaciones de Skills; el runtime del Gateway debe seguir siendo Node — Bun no se recomienda para WhatsApp/Telegram.
    - La selección del instalador respaldada por Gateway se basa en preferencias: cuando las especificaciones de instalación mezclan tipos, OpenClaw prefiere Homebrew cuando `skills.install.preferBrew` está habilitado y existe `brew`, luego `uv`, luego el gestor de node configurado y después otras alternativas como `go` o `download`.
    - Si todas las especificaciones de instalación son `download`, OpenClaw muestra todas las opciones de descarga en lugar de reducirlas a un único instalador preferido.

  </Accordion>
  <Accordion title="Detalles por instalador">
    - **Instalaciones de Go:** si falta `go` y `brew` está disponible, el Gateway instala primero Go mediante Homebrew y establece `GOBIN` en `bin` de Homebrew cuando es posible.
    - **Instalaciones por descarga:** `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predeterminado: automático cuando se detecta un archivo), `stripComponents`, `targetDir` (predeterminado: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Anulaciones de configuración

Las Skills integradas y administradas pueden activarse o desactivarse y recibir valores de entorno
en `skills.entries` dentro de `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // o cadena en texto plano
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
  `false` desactiva la Skill aunque esté integrada o instalada.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Comodidad para Skills que declaran `metadata.openclaw.primaryEnv`. Admite texto plano o SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Se inyecta solo si la variable aún no está establecida en el proceso.
</ParamField>
<ParamField path="config" type="object">
  Contenedor opcional para campos personalizados por Skill. Las claves personalizadas deben ir aquí.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Lista de permitidos opcional solo para Skills **integradas**. Si se establece, solo las Skills integradas de la lista son aptas (las Skills administradas/del espacio de trabajo no se ven afectadas).
</ParamField>

Si el nombre de la Skill contiene guiones, pon la clave entre comillas (JSON5 permite
claves entre comillas). Las claves de configuración coinciden con el **nombre de la Skill** de forma predeterminada; si una Skill
define `metadata.openclaw.skillKey`, usa esa clave en `skills.entries`.

<Note>
Para la generación/edición de imágenes estándar dentro de OpenClaw, usa la herramienta central
`image_generate` con `agents.defaults.imageGenerationModel` en lugar
de una Skill integrada. Los ejemplos de Skills aquí son para flujos de trabajo personalizados o de terceros.
Para análisis de imágenes nativo usa la herramienta `image` con
`agents.defaults.imageModel`. Si eliges `openai/*`, `google/*`,
`fal/*` u otro modelo de imagen específico de proveedor, añade también
la autenticación/la clave de API de ese proveedor.
</Note>

## Inyección de entorno

Cuando comienza una ejecución del agente, OpenClaw:

1. Lee los metadatos de la Skill.
2. Aplica `skills.entries.<key>.env` y `skills.entries.<key>.apiKey` a `process.env`.
3. Construye el prompt del sistema con las Skills **aptas**.
4. Restaura el entorno original después de que termina la ejecución.

La inyección de entorno está **limitada a la ejecución del agente**, no a un entorno
global del shell.

Para el backend integrado `claude-cli`, OpenClaw también materializa la misma
instantánea apta como un plugin temporal de Claude Code y la pasa con
`--plugin-dir`. Claude Code puede entonces usar su resolvedor nativo de Skills mientras
OpenClaw sigue controlando la precedencia, las listas de permitidos por agente, el control y la
inyección de env/clave de API de `skills.entries.*`. Los otros backends de CLI usan solo el
catálogo de prompts.

## Instantáneas y actualización

OpenClaw toma una instantánea de las Skills aptas **cuando comienza una sesión** y
reutiliza esa lista en los turnos posteriores de la misma sesión. Los cambios en
Skills o en la configuración surten efecto en la siguiente sesión nueva.

Las Skills pueden actualizarse a mitad de sesión en dos casos:

- El observador de Skills está habilitado.
- Aparece un nuevo Node remoto apto.

Piensa en esto como una **recarga en caliente**: la lista actualizada se recoge en el
siguiente turno del agente. Si la lista de permitidos efectiva de Skills del agente cambia para esa
sesión, OpenClaw actualiza la instantánea para que las Skills visibles sigan alineadas
con el agente actual.

### Observador de Skills

De forma predeterminada, OpenClaw observa las carpetas de Skills y actualiza la instantánea de Skills
cuando cambian archivos `SKILL.md`. Configura esto en `skills.load`:

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

### Nodos macOS remotos (Gateway de Linux)

Si el Gateway se ejecuta en Linux pero hay un **Node macOS** conectado con
`system.run` permitido (aprobaciones Exec security no establecidas en `deny`),
OpenClaw puede tratar como aptas las Skills exclusivas de macOS cuando los binarios
necesarios están presentes en ese Node. El agente debe ejecutar esas Skills
mediante la herramienta `exec` con `host=node`.

Esto depende de que el Node informe de su compatibilidad de comandos y de una prueba de binarios
mediante `system.which` o `system.run`. Los nodos sin conexión **no** hacen visibles
las Skills solo remotas. Si un Node conectado deja de responder a las pruebas de binarios,
OpenClaw borra sus coincidencias de binarios en caché para que los agentes ya no vean
Skills que en ese momento no pueden ejecutarse allí.

## Impacto en tokens

Cuando las Skills son aptas, OpenClaw inyecta una lista XML compacta de Skills disponibles
en el prompt del sistema (mediante `formatSkillsForPrompt` en
`pi-coding-agent`). El costo es determinista:

- **Sobrecarga base** (solo cuando hay ≥1 Skill): 195 caracteres.
- **Por Skill:** 97 caracteres + la longitud de los valores escapados en XML de `<name>`, `<description>` y `<location>`.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

El escape XML expande `& < > " '` en entidades (`&amp;`, `&lt;`, etc.),
lo que aumenta la longitud. La cantidad de tokens varía según el tokenizador del modelo. Una
estimación aproximada al estilo OpenAI es ~4 caracteres/token, así que **97 caracteres ≈ 24 tokens** por
Skill más las longitudes reales de tus campos.

## Ciclo de vida de las Skills administradas

OpenClaw incluye un conjunto base de Skills como **Skills integradas** con la
instalación (paquete npm o OpenClaw.app). `~/.openclaw/skills` existe para
anulaciones locales; por ejemplo, fijar o aplicar un parche a una Skill sin
cambiar la copia integrada. Las Skills del espacio de trabajo pertenecen al usuario y anulan
ambas en conflictos de nombres.

## ¿Buscas más Skills?

Explora [https://clawhub.ai](https://clawhub.ai). Esquema completo de
configuración: [Configuración de Skills](/es/tools/skills-config).

## Relacionado

- [ClawHub](/es/tools/clawhub) — registro público de Skills
- [Crear Skills](/es/tools/creating-skills) — crear Skills personalizadas
- [Plugins](/es/tools/plugin) — descripción general del sistema de plugins
- [Plugin Skill Workshop](/es/plugins/skill-workshop) — generar Skills a partir del trabajo del agente
- [Configuración de Skills](/es/tools/skills-config) — referencia de configuración de Skills
- [Comandos de barra](/es/tools/slash-commands) — todos los comandos de barra disponibles
