---
read_when:
    - Agregar o modificar Skills
    - Cambiar las puertas de activación de Skills, las listas de permitidos o las reglas de carga
    - Comprender la precedencia de Skills y el comportamiento de las instantáneas
sidebarTitle: Skills
summary: Skills enseñan a tu agente cómo usar herramientas. Aprende cómo se cargan, cómo funciona la precedencia y cómo configurar la activación controlada, las listas de permitidos y la inyección de entorno.
title: Skills
x-i18n:
    generated_at: "2026-07-05T11:45:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d532282eafcc5ac50a83e66b35100a928d99f536c6743c07cccba2da7721be40
    source_path: tools/skills.md
    workflow: 16
---

Skills son archivos de instrucciones en Markdown que enseñan al agente cómo y cuándo usar
herramientas. Cada skill vive en un directorio que contiene un archivo `SKILL.md` con
frontmatter YAML y un cuerpo en Markdown. OpenClaw carga Skills incluidas más cualquier
anulación local, y las filtra en el momento de carga según el entorno, la configuración y
la presencia de binarios.

<CardGroup cols={2}>
  <Card title="Crear Skills" href="/es/tools/creating-skills" icon="hammer">
    Crea y prueba una skill personalizada desde cero.
  </Card>
  <Card title="Taller de Skills" href="/es/tools/skill-workshop" icon="flask">
    Revisa y aprueba propuestas de Skills redactadas por el agente.
  </Card>
  <Card title="Configuración de Skills" href="/es/tools/skills-config" icon="gear">
    Esquema de configuración completo de `skills.*` y listas de permitidos para agentes.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explora e instala Skills de la comunidad.
  </Card>
</CardGroup>

## Orden de carga

OpenClaw carga desde estas fuentes, **con la precedencia más alta primero**. Cuando el mismo
nombre de skill aparece en varios lugares, gana la fuente más alta.

| Prioridad      | Fuente                         | Ruta                                    |
| -------------- | ------------------------------ | --------------------------------------- |
| 1 — más alta   | Skills del espacio de trabajo  | `<workspace>/skills`                    |
| 2              | Skills de agente del proyecto  | `<workspace>/.agents/skills`            |
| 3              | Skills de agente personales    | `~/.agents/skills`                      |
| 4              | Skills gestionadas / locales   | `~/.openclaw/skills`                    |
| 5              | Skills incluidas               | incluidas con la instalación            |
| 6 — más baja   | Directorios adicionales        | `skills.load.extraDirs` + Skills de Plugin |

Las raíces de Skills admiten diseños agrupados. OpenClaw descubre una skill cuando
`SKILL.md` aparece en cualquier lugar bajo una raíz configurada (hasta 6 niveles de profundidad):

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

La ruta de carpeta solo sirve para organización. El nombre de la skill y el comando de barra
vienen del campo de frontmatter `name` (o del nombre del directorio cuando falta `name`).
Las listas de permitidos de agentes (abajo) también coinciden con este `name`.

<Note>
  El directorio nativo `$CODEX_HOME/skills` de Codex CLI **no** es una raíz de Skills
  de OpenClaw. Usa `openclaw migrate plan codex` para inventariar esas Skills y luego
  `openclaw migrate codex` para copiarlas en tu espacio de trabajo de OpenClaw.
</Note>

## Skills por agente frente a Skills compartidas

En configuraciones multiagente, cada agente tiene su propio espacio de trabajo. Usa la ruta que
coincida con la visibilidad deseada:

| Alcance        | Ruta                         | Visible para                         |
| -------------- | ---------------------------- | ------------------------------------ |
| Por agente     | `<workspace>/skills`         | Solo ese agente                      |
| Agente de proyecto | `<workspace>/.agents/skills` | Solo el agente de ese espacio de trabajo |
| Agente personal | `~/.agents/skills`           | Todos los agentes en esta máquina    |
| Gestionadas compartidas | `~/.openclaw/skills`         | Todos los agentes en esta máquina    |
| Directorios adicionales | `skills.load.extraDirs`      | Todos los agentes en esta máquina    |

## Listas de permitidos de agentes

La **ubicación** de una skill (precedencia) y la **visibilidad** de una skill (qué agente puede usarla)
son controles separados. Usa listas de permitidos para restringir qué Skills ve un agente,
independientemente de desde dónde se carguen.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Reglas de listas de permitidos">
    - Omite `agents.defaults.skills` para dejar todas las Skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar `agents.defaults.skills`.
    - Define `agents.list[].skills: []` para no exponer Skills a ese agente.
    - Una lista `agents.list[].skills` no vacía es el conjunto **final**: no se
      combina con los valores predeterminados.
    - La lista de permitidos efectiva se aplica a la construcción del prompt, el descubrimiento
      de comandos de barra, la sincronización del sandbox y las instantáneas de Skills.
    - Esto no es un límite de autorización del shell del host. Si el mismo agente puede
      usar `exec`, restringe ese shell por separado con sandboxing, aislamiento de usuario
      del SO, listas de denegación/permitidos de exec y credenciales por recurso.
  </Accordion>
</AccordionGroup>

## Plugins y Skills

Los Plugins pueden incluir sus propias Skills listando directorios `skills` en
`openclaw.plugin.json` (rutas relativas a la raíz del Plugin). Las Skills de Plugin se cargan
cuando el Plugin está habilitado; por ejemplo, el Plugin de navegador incluye una skill
`browser-automation` para control de navegador de varios pasos.

Los directorios de Skills de Plugin se combinan en el mismo nivel de baja precedencia que
`skills.load.extraDirs`, por lo que una skill incluida, gestionada, de agente o de espacio de trabajo
con el mismo nombre los anula. Controla la elegibilidad propia de una skill de Plugin mediante
`metadata.openclaw.requires` en su frontmatter, igual que cualquier otra skill.

Consulta [Plugins](/es/tools/plugin) y [Herramientas](/es/tools) para ver el sistema completo de Plugins.

## Taller de Skills

[Skill Workshop](/es/tools/skill-workshop) es una cola de propuestas entre el agente
y tus archivos de Skills activos. Cuando el agente detecta trabajo reutilizable, redacta una
propuesta en lugar de escribir directamente en `SKILL.md`. Tú revisas y apruebas
antes de que algo cambie.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulta [Skill Workshop](/es/tools/skill-workshop) para ver el ciclo de vida completo, la referencia
de CLI y la configuración.

## Instalación desde ClawHub

[ClawHub](https://clawhub.ai) es el registro público de Skills. Usa comandos
`openclaw skills` para instalar y actualizar, o la CLI `clawhub` para
publicar y sincronizar.

| Acción                                      | Comando                                                |
| ------------------------------------------- | ------------------------------------------------------ |
| Instalar una skill en el espacio de trabajo | `openclaw skills install @owner/<slug>`                |
| Instalar desde un repositorio Git           | `openclaw skills install git:owner/repo@ref`           |
| Instalar un directorio local de skill       | `openclaw skills install ./path/to/skill --as my-tool` |
| Instalar para todos los agentes locales     | `openclaw skills install @owner/<slug> --global`       |
| Actualizar todas las Skills del espacio de trabajo | `openclaw skills update --all`                         |
| Actualizar una skill gestionada compartida  | `openclaw skills update @owner/<slug> --global`        |
| Actualizar todas las Skills gestionadas compartidas | `openclaw skills update --all --global`                |
| Verificar el sobre de confianza de una skill | `openclaw skills verify @owner/<slug>`                 |
| Imprimir la Skill Card generada             | `openclaw skills verify @owner/<slug> --card`          |
| Publicar / sincronizar mediante ClawHub CLI | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Detalles de instalación">
    `openclaw skills install` instala en el directorio `skills/` del espacio de trabajo
    activo de forma predeterminada. Añade `--global` para instalar en el directorio compartido
    `~/.openclaw/skills`, visible para todos los agentes locales salvo que las listas de
    permitidos de agentes lo restrinjan.

    Las instalaciones desde Git y locales esperan `SKILL.md` en la raíz de origen. El slug viene
    del frontmatter `name` de `SKILL.md` cuando es válido, y luego recurre al nombre del
    directorio o repositorio. Usa `--as <slug>` para anularlo.
    `openclaw skills update` solo rastrea instalaciones de ClawHub: reinstala fuentes Git o
    locales para actualizarlas.

  </Accordion>
  <Accordion title="Verificación y análisis de seguridad">
    `openclaw skills verify @owner/<slug>` pide a ClawHub el sobre de confianza
    `clawhub.skill.verify.v1` de la skill. Las Skills de ClawHub instaladas se verifican
    contra la versión y el registro guardados en `.clawhub/origin.json`.
    Los slugs simples siguen aceptándose para Skills instaladas existentes o inequívocas, pero
    las referencias con propietario evitan ambigüedad de publicador.

    Las páginas de Skills de ClawHub muestran el estado del análisis de seguridad más reciente antes de la instalación,
    con páginas de detalle para VirusTotal, ClawScan y análisis estático. El
    comando sale con código distinto de cero cuando ClawHub marca la verificación como fallida. Los publicadores
    corrigen falsos positivos mediante el panel de ClawHub o
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalaciones de archivos privados">
    Los clientes de Gateway que necesiten distribución no basada en ClawHub pueden preparar un archivo zip de skill
    con `skills.upload.begin`, `skills.upload.chunk` y `skills.upload.commit`,
    y luego instalar con `skills.install({ source: "upload", ... })`. Esta ruta está
    desactivada de forma predeterminada y requiere `skills.install.allowUploadedArchives: true` en
    `openclaw.json`. Las instalaciones normales de ClawHub nunca necesitan esa configuración.
  </Accordion>
</AccordionGroup>

## Seguridad

<Warning>
  Trata las Skills de terceros como **código no confiable**. Léelas antes de habilitarlas.
  Prefiere ejecuciones con sandbox para entradas no confiables y herramientas riesgosas. Consulta
  [Sandboxing](/es/gateway/sandboxing) para controles del lado del agente.
</Warning>

<AccordionGroup>
  <Accordion title="Contención de rutas">
    El descubrimiento de Skills de espacio de trabajo, agente de proyecto y directorio adicional solo acepta raíces de Skills
    cuyo realpath resuelto permanezca dentro de la raíz configurada, salvo que
    `skills.load.allowSymlinkTargets` confíe explícitamente en una raíz de destino.
    Skill Workshop escribe a través de esos destinos confiables solo cuando
    `skills.workshop.allowSymlinkTargetWrites` está habilitado.
    Las Skills gestionadas `~/.openclaw/skills` y personales `~/.agents/skills` pueden contener
    carpetas de Skills enlazadas simbólicamente, pero el realpath de cada `SKILL.md` debe seguir quedándose
    dentro de su directorio de skill resuelto.
  </Accordion>
  <Accordion title="Política de instalación del operador">
    Configura `security.installPolicy` para ejecutar un comando de política local confiable
    antes de que continúen las instalaciones de Skills. La política recibe metadatos y la ruta de origen
    preparada, se aplica a rutas de ClawHub, subidas, Git, locales, de actualización e instalador
    de dependencias, y falla cerrada cuando el comando no puede devolver una decisión válida.
  </Accordion>
  <Accordion title="Alcance de inyección de secretos">
    `skills.entries.*.env` y `skills.entries.*.apiKey` inyectan secretos en el
    proceso **host** solo para ese turno del agente, no en el sandbox. Mantén los
    secretos fuera de prompts y registros.
  </Accordion>
</AccordionGroup>

Para el modelo de amenazas más amplio y las listas de verificación de seguridad, consulta
[Seguridad](/es/gateway/security).

## Formato de SKILL.md

Cada skill necesita como mínimo un `name` y una `description` en el frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw sigue la especificación [AgentSkills](https://agentskills.io). El frontmatter
  se analiza primero como YAML; si eso falla, recurre a un analizador de una sola línea.
  Los bloques `metadata` anidados (incluidos mapeos YAML multilínea) se aplanan
  a una cadena JSON y se vuelven a analizar como JSON5, por lo que la forma de bloque mostrada
  en [Control de elegibilidad](#gating) funciona. Usa `{baseDir}` en el cuerpo para referenciar la
  ruta de la carpeta de la skill.
</Note>

### Claves opcionales de frontmatter

<ParamField path="homepage" type="string">
  URL mostrada como "Sitio web" en la interfaz de Skills de macOS. También compatible mediante
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Cuando es `true`, la skill se expone como un comando de barra invocable por el usuario.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Cuando es `true`, OpenClaw mantiene las instrucciones de la skill fuera del prompt normal
  del agente. La skill sigue estando disponible como comando de barra cuando `user-invocable`
  también es `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Cuando se establece en `tool`, el comando de barra omite el modelo y se
  despacha directamente a una herramienta registrada.
</ParamField>

<ParamField path="command-tool" type="string">
  Nombre de la herramienta que se invocará cuando `command-dispatch: tool` esté establecido.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para el despacho de herramientas, reenvía la cadena de argumentos sin procesar a la herramienta sin
  análisis del núcleo. La herramienta recibe
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Control de acceso

OpenClaw filtra las Skills en el momento de carga usando `metadata.openclaw` (objeto JSON5
incrustado en el frontmatter; consulta la nota de análisis anterior). Una Skill sin
bloque `metadata.openclaw` siempre es elegible salvo que se deshabilite explícitamente.

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

<ParamField path="always" type="boolean">
  Cuando es `true`, incluye siempre la Skill y omite todos los demás controles.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji opcional mostrado en la interfaz de usuario de Skills de macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL opcional mostrada como "Sitio web" en la interfaz de usuario de Skills de macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Filtro de plataforma. Cuando se establece, la Skill solo es elegible en un SO enumerado.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Cada binario debe existir en `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Al menos un binario debe existir en `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Cada variable de entorno debe existir en el proceso o proporcionarse mediante configuración.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Cada ruta de `openclaw.json` debe evaluarse como verdadera.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nombre de la variable de entorno asociada con `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Especificaciones opcionales de instalador usadas por la interfaz de usuario de Skills de macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Los bloques heredados `metadata.clawdbot` todavía se aceptan cuando
  `metadata.openclaw` está ausente, por lo que las Skills instaladas antiguas conservan sus
  controles de dependencias y sugerencias de instalador. Las Skills nuevas deben usar
  `metadata.openclaw`.
</Note>

### Especificaciones del instalador

Las especificaciones del instalador indican a la interfaz de usuario de Skills de macOS cómo instalar una dependencia:

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
    - Cuando se enumeran varios instaladores, el Gateway elige una opción preferida
      (brew cuando está disponible; si no, node).
    - Si todos los instaladores son `download`, OpenClaw enumera cada entrada para que puedas
      ver todos los artefactos disponibles.
    - Las especificaciones pueden incluir `os: ["darwin"|"linux"|"win32"]` para filtrar por plataforma.
    - Las instalaciones de Node respetan `skills.install.nodeManager` en `openclaw.json`
      (predeterminado: npm; opciones: npm / pnpm / yarn / bun). Esto solo afecta a las
      instalaciones de Skills; el runtime del Gateway debe seguir siendo Node.
    - Preferencia de instalador del Gateway: Homebrew → uv → gestor de node configurado →
      go → download.
  </Accordion>
  <Accordion title="Detalles por instalador">
    - **Homebrew:** OpenClaw no instala Homebrew automáticamente ni traduce fórmulas de brew
      a comandos de paquetes del sistema. En contenedores Linux sin
      `brew`, los instaladores que solo usan brew se ocultan; usa una imagen personalizada o instala
      la dependencia manualmente.
    - **Go:** OpenClaw requiere Go 1.21 o posterior para instalaciones automáticas de Skills.
      Si falta `go` y Homebrew está disponible, OpenClaw instala Go mediante
      Homebrew primero; en Linux sin Homebrew, puede usar `apt-get`
      como root o mediante `sudo` sin contraseña cuando el candidato actualizado `golang-go`
      cumple la versión mínima. El `go install` real de la
      dependencia siempre apunta a un directorio binario dedicado administrado por OpenClaw
      (`bin` de Homebrew en una instalación nueva; si no, `~/.local/bin`) en lugar de
      tu `GOBIN` configurado: tus propias variables de entorno `GOBIN`, `GOPATH` y `GOTOOLCHAIN`
      se leen, pero nunca se sobrescriben.
    - **Download:** `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (predeterminado: auto cuando se detecta un archivo), `stripComponents`,
      `targetDir` (predeterminado: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Notas de sandboxing">
    `requires.bins` se comprueba en el **host** en el momento de carga de la Skill. Si un agente
    se ejecuta en un sandbox, el binario también debe existir **dentro del contenedor**.
    Instálalo mediante `agents.defaults.sandbox.docker.setupCommand` o una imagen
    personalizada. `setupCommand` se ejecuta una vez después de la creación del contenedor y requiere
    salida de red, un sistema de archivos raíz escribible y un usuario root en el sandbox.
  </Accordion>
</AccordionGroup>

## Anulaciones de configuración

Activa y configura Skills incluidas o administradas bajo `skills.entries` en
`~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
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
  `false` deshabilita la Skill incluso cuando está incluida o instalada. La Skill incluida `coding-agent`
  es opt-in: establece `skills.entries.coding-agent.enabled: true`
  y asegúrate de que `claude`, `codex`, `opencode` u otra CLI compatible
  esté instalada y autenticada.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo de conveniencia para Skills que declaran `metadata.openclaw.primaryEnv`.
  Admite una cadena de texto plano o un objeto SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variables de entorno inyectadas para la ejecución del agente. Solo se inyectan cuando la
  variable aún no está establecida en el proceso.
</ParamField>

<ParamField path="config" type="object">
  Bolsa opcional para campos personalizados de configuración por Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Lista de permitidos opcional solo para Skills **incluidas**. Cuando se establece, solo las Skills incluidas
  en la lista son elegibles. Las Skills administradas y del espacio de trabajo no se ven afectadas.
</ParamField>

<Note>
  Las claves de configuración coinciden con el **nombre de la Skill** de forma predeterminada. Si una Skill define
  `metadata.openclaw.skillKey`, usa esa clave bajo `skills.entries` en su lugar.
  Pon entre comillas los nombres con guiones: JSON5 permite claves entre comillas.
</Note>

## Inyección de entorno

Cuando comienza una ejecución de agente, OpenClaw:

<Steps>
  <Step title="Lee metadatos de Skills">
    OpenClaw resuelve la lista efectiva de Skills para el agente, aplicando reglas de control,
    listas de permitidos y anulaciones de configuración.
  </Step>
  <Step title="Inyecta entorno y claves de API">
    `skills.entries.<key>.env` y `skills.entries.<key>.apiKey` se aplican a
    `process.env` durante la ejecución.
  </Step>
  <Step title="Construye el prompt del sistema">
    Las Skills elegibles se compilan en un bloque XML compacto y se inyectan en el
    prompt del sistema.
  </Step>
  <Step title="Restaura el entorno">
    Después de que termina la ejecución, se restaura el entorno original.
  </Step>
</Steps>

<Warning>
  La inyección de entorno está limitada a la ejecución del agente en el **host**, no al sandbox. Dentro de un
  sandbox, `env` y `apiKey` no tienen efecto. Consulta
  [Configuración de Skills](/es/tools/skills-config#sandboxed-skills-and-env-vars) para saber cómo
  pasar secretos a ejecuciones en sandbox.
</Warning>

Para el backend incluido `claude-cli`, OpenClaw también materializa la misma
instantánea de Skills elegibles como un Plugin temporal de Claude Code y la pasa mediante
`--plugin-dir`. Otros backends de CLI usan solo el catálogo del prompt.

## Instantáneas y actualización

OpenClaw toma instantáneas de las Skills elegibles **cuando comienza una sesión** y reutiliza esa
lista para todos los turnos posteriores de la sesión. Los cambios en Skills o configuración surten
efecto en la siguiente sesión nueva.

Las Skills se actualizan a mitad de sesión en dos casos:

- El observador de Skills detecta un cambio en `SKILL.md`.
- Se conecta un nuevo nodo remoto elegible.

La lista actualizada se recoge en el siguiente turno del agente. Si cambia la lista de permitidos efectiva
del agente, OpenClaw actualiza la instantánea para mantener alineadas las Skills visibles.

<AccordionGroup>
  <Accordion title="Observador de Skills">
    De forma predeterminada, OpenClaw observa las carpetas de Skills y aumenta la instantánea cuando
    cambian los archivos `SKILL.md`. Configúralo bajo `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    Usa `allowSymlinkTargets` para diseños con enlaces simbólicos intencionales donde un enlace simbólico de raíz
    de Skill apunta fuera de la raíz configurada, por ejemplo
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Habilita `skills.workshop.allowSymlinkTargetWrites` solo cuando Skill Workshop
    también deba aplicar propuestas a través de esas rutas con enlaces simbólicos de confianza.

  </Accordion>
  <Accordion title="Nodos remotos de macOS (Gateway de Linux)">
    Si el Gateway se ejecuta en Linux pero hay un **nodo macOS** conectado con
    `system.run` permitido, OpenClaw puede tratar las Skills solo para macOS como elegibles cuando
    los binarios requeridos están presentes en ese nodo. El agente debe ejecutar esas
    Skills mediante la herramienta `exec` con `host=node`.

    Los nodos sin conexión **no** hacen visibles las Skills solo remotas. Si un nodo deja de
    responder a sondeos de binarios, OpenClaw borra sus coincidencias de binarios en caché.

  </Accordion>
</AccordionGroup>

## Impacto en tokens

Cuando las Skills son elegibles, OpenClaw inyecta un bloque XML compacto en el prompt del sistema.
El coste es determinista y escala linealmente por Skill:

- **Sobrecoste base** (solo cuando hay 1 o más Skills elegibles): un bloque fijo de prosa
  introductoria más el contenedor `<available_skills>`.
- **Por Skill:** ~97 caracteres + las longitudes de los campos `name`, `description` y `location`.
- El escapado XML expande `& < > " '` en entidades, lo que añade unos pocos caracteres por
  aparición.
- Con ~4 caracteres/token, 97 caracteres ≈ 24 tokens por Skill antes de las longitudes de campo.

Si el bloque renderizado excediera el presupuesto de prompt configurado
(`skills.limits.maxSkillsPromptChars`), OpenClaw primero elimina las descripciones
(formato compacto: solo nombre + ubicación), luego trunca la lista de Skills y añade
una nota que apunta a `openclaw skills check`.

Mantén las descripciones breves y descriptivas para minimizar el sobrecoste del prompt.

## Relacionado

<CardGroup cols={2}>
  <Card title="Crear Skills" href="/es/tools/creating-skills" icon="hammer">
    Guía paso a paso para crear una Skill personalizada.
  </Card>
  <Card title="Taller de Skills" href="/es/tools/skill-workshop" icon="flask">
    Cola de propuestas para Skills redactadas por agentes.
  </Card>
  <Card title="Configuración de Skills" href="/es/tools/skills-config" icon="gear">
    Esquema completo de configuración de `skills.*` y listas de permitidos de agentes.
  </Card>
  <Card title="Comandos slash" href="/es/tools/slash-commands" icon="terminal">
    Cómo se registran y enrutan los comandos slash de Skills.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explora y publica Skills en el registro público.
  </Card>
  <Card title="Plugins" href="/es/tools/plugin" icon="plug">
    Los Plugins pueden incluir Skills junto con las herramientas que documentan.
  </Card>
</CardGroup>
