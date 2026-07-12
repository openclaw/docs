---
read_when:
    - Añadir o modificar Skills
    - Cambio de las restricciones, las listas de permitidos o las reglas de carga de Skills
    - Comprender la precedencia de Skills y el comportamiento de las instantáneas
sidebarTitle: Skills
summary: Las Skills enseñan a tu agente a usar herramientas. Aprende cómo se cargan, cómo funciona la precedencia y cómo configurar el control de acceso, las listas de permitidos y la inyección de variables de entorno.
title: Skills
x-i18n:
    generated_at: "2026-07-11T23:36:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills son archivos de instrucciones en Markdown que enseñan al agente cómo y cuándo usar
herramientas. Cada Skill reside en un directorio que contiene un archivo `SKILL.md` con
frontmatter YAML y un cuerpo en Markdown. OpenClaw carga las Skills incluidas junto con
cualquier anulación local y las filtra durante la carga según el entorno, la configuración
y la presencia de binarios.

<CardGroup cols={2}>
  <Card title="Crear Skills" href="/es/tools/creating-skills" icon="hammer">
    Crea y prueba una Skill personalizada desde cero.
  </Card>
  <Card title="Taller de Skills" href="/es/tools/skill-workshop" icon="flask">
    Revisa y aprueba propuestas de Skills redactadas por el agente.
  </Card>
  <Card title="Configuración de Skills" href="/es/tools/skills-config" icon="gear">
    Esquema completo de configuración `skills.*` y listas de permitidos de agentes.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explora e instala Skills de la comunidad.
  </Card>
</CardGroup>

## Orden de carga

OpenClaw carga desde estas fuentes, **primero la de mayor precedencia**. Cuando el mismo
nombre de Skill aparece en varios lugares, prevalece la fuente de mayor prioridad.

| Prioridad     | Fuente                          | Ruta                                    |
| ------------- | ------------------------------- | --------------------------------------- |
| 1 — máxima    | Skills del espacio de trabajo   | `<workspace>/skills`                    |
| 2             | Skills del agente del proyecto  | `<workspace>/.agents/skills`            |
| 3             | Skills personales del agente    | `~/.agents/skills`                      |
| 4             | Skills gestionadas/locales      | `~/.openclaw/skills`                    |
| 5             | Skills incluidas                | suministradas con la instalación        |
| 6 — mínima    | Directorios adicionales         | `skills.load.extraDirs` + Skills de Plugins |

Las raíces de Skills admiten estructuras agrupadas. OpenClaw detecta una Skill siempre que
`SKILL.md` aparezca en cualquier lugar dentro de una raíz configurada (hasta 6 niveles de profundidad):

```text
<workspace>/skills/research/SKILL.md          ✓ detectada como "research"
<workspace>/skills/personal/research/SKILL.md ✓ también detectada como "research"
```

La ruta de la carpeta solo sirve para organizar. El nombre de la Skill y el comando con barra
proceden del campo `name` del frontmatter (o del nombre del directorio cuando falta `name`).
Las listas de permitidos de agentes (descritas más adelante) también se comparan con este `name`.

<Note>
  El directorio nativo `$CODEX_HOME/skills` de Codex CLI **no** es una raíz de
  Skills de OpenClaw. Usa `openclaw migrate plan codex` para inventariar esas Skills y, después,
  `openclaw migrate codex` para copiarlas en tu espacio de trabajo de OpenClaw.
</Note>

## Skills alojadas en Node

Un Node sin interfaz conectado puede publicar Skills instaladas en su directorio activo de
Skills de OpenClaw (`~/.openclaw/skills` de forma predeterminada; se aplican las anulaciones
del entorno del perfil). Aparecen en la lista normal de Skills del agente mientras el Node
está conectado y desaparecen cuando se desconecta. Si hay una colisión, una Skill local o
del Gateway conserva su nombre; la Skill del Node recibe un nombre determinista con un
prefijo del Node. La versión 1 de Skills alojadas en Node requiere que el nombre del directorio
coincida con el campo `name` del frontmatter de la Skill.

La entrada de la Skill incluye el localizador del Node. Sus archivos, referencias relativas y
binarios residen en el Node, por lo que debes cargarla y ejecutarla con
`exec host=node node=<node-id>`. Reinicia el host del Node después de cambiar los archivos
de la Skill. Consulta [Nodos](/es/nodes#node-hosted-skills) para obtener información sobre el
emparejamiento y los mecanismos de desactivación.

## Skills por agente y compartidas

En configuraciones con varios agentes, cada agente tiene su propio espacio de trabajo. Usa la
ruta que corresponda con la visibilidad que deseas:

| Ámbito                       | Ruta                         | Visible para                                 |
| ---------------------------- | ---------------------------- | -------------------------------------------- |
| Por agente                   | `<workspace>/skills`         | Solo ese agente                              |
| Agente del proyecto          | `<workspace>/.agents/skills` | Solo el agente de ese espacio de trabajo     |
| Agente personal              | `~/.agents/skills`           | Todos los agentes de esta máquina            |
| Gestionadas compartidas      | `~/.openclaw/skills`         | Todos los agentes de esta máquina            |
| Directorios adicionales      | `skills.load.extraDirs`      | Todos los agentes de esta máquina            |

## Listas de permitidos de agentes

La **ubicación** de una Skill (precedencia) y su **visibilidad** (qué agente puede usarla)
son controles independientes. Usa listas de permitidos para restringir qué Skills ve un agente,
independientemente de dónde se carguen.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // base compartida
    },
    list: [
      { id: "writer" }, // hereda github, weather
      { id: "docs", skills: ["docs-search"] }, // sustituye por completo los valores predeterminados
      { id: "locked-down", skills: [] }, // ninguna Skill
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Reglas de las listas de permitidos">
    - Omite `agents.defaults.skills` para que, de forma predeterminada, ninguna Skill esté restringida.
    - Omite `agents.list[].skills` para heredar `agents.defaults.skills`.
    - Establece `agents.list[].skills: []` para no exponer ninguna Skill a ese agente.
    - Una lista `agents.list[].skills` no vacía es el conjunto **definitivo**: no se
      combina con los valores predeterminados.
    - La lista de permitidos efectiva se aplica a la creación de prompts, la detección de
      comandos con barra, la sincronización del sandbox y las instantáneas de Skills.
    - Esto no constituye un límite de autorización para el shell del host. Si el mismo agente puede
      usar `exec`, restringe ese shell por separado mediante sandboxing, aislamiento de
      usuarios del sistema operativo, listas de denegación/permitidos de ejecución y credenciales por recurso.
  </Accordion>
</AccordionGroup>

## Plugins y Skills

Los Plugins pueden incluir sus propias Skills enumerando directorios `skills` en
`openclaw.plugin.json` (rutas relativas a la raíz del Plugin). Las Skills del Plugin se cargan
cuando el Plugin está habilitado; por ejemplo, el Plugin del navegador incluye una Skill
`browser-automation` para el control del navegador en varios pasos.

Los directorios de Skills de Plugins se combinan en el mismo nivel de baja precedencia que
`skills.load.extraDirs`, por lo que una Skill con el mismo nombre incluida, gestionada, de agente
o del espacio de trabajo prevalece sobre ellas. Controla la elegibilidad de la propia Skill de un
Plugin mediante `metadata.openclaw.requires` en su frontmatter, igual que con cualquier otra Skill.

Consulta [Plugins](/es/tools/plugin) y [Herramientas](/es/tools) para conocer el sistema completo de Plugins.

## Taller de Skills

El [Taller de Skills](/es/tools/skill-workshop) es una cola de propuestas entre el agente
y tus archivos de Skills activos. Cuando el agente detecta trabajo reutilizable, redacta una
propuesta en lugar de escribir directamente en `SKILL.md`. Tú la revisas y apruebas
antes de que se realice cualquier cambio.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulta [Taller de Skills](/es/tools/skill-workshop) para conocer el ciclo de vida completo, la
referencia de la CLI y la configuración.

## Instalación desde ClawHub

[ClawHub](https://clawhub.ai) es el registro público de Skills. Usa los comandos
`openclaw skills` para instalar y actualizar, o la CLI `clawhub` para publicar
y sincronizar.

| Acción                                        | Comando                                                |
| --------------------------------------------- | ------------------------------------------------------ |
| Instalar una Skill en el espacio de trabajo   | `openclaw skills install @owner/<slug>`                |
| Instalar desde un repositorio Git             | `openclaw skills install git:owner/repo@ref`           |
| Instalar un directorio local de Skills        | `openclaw skills install ./path/to/skill --as my-tool` |
| Instalar para todos los agentes locales       | `openclaw skills install @owner/<slug> --global`       |
| Actualizar todas las Skills del espacio       | `openclaw skills update --all`                         |
| Actualizar una Skill gestionada compartida    | `openclaw skills update @owner/<slug> --global`        |
| Actualizar todas las Skills compartidas       | `openclaw skills update --all --global`                |
| Verificar el perímetro de confianza de una Skill | `openclaw skills verify @owner/<slug>`              |
| Mostrar la tarjeta de Skill generada          | `openclaw skills verify @owner/<slug> --card`          |
| Publicar/sincronizar mediante la CLI de ClawHub | `clawhub sync --all`                                 |

<AccordionGroup>
  <Accordion title="Detalles de la instalación">
    De forma predeterminada, `openclaw skills install` instala en el directorio `skills/`
    del espacio de trabajo activo. Añade `--global` para instalar en el directorio compartido
    `~/.openclaw/skills`, visible para todos los agentes locales salvo que las listas de
    permitidos de agentes lo restrinjan.

    Las instalaciones desde Git y locales esperan encontrar `SKILL.md` en la raíz del origen. El slug se
    obtiene de `name` en el frontmatter de `SKILL.md` cuando es válido; de lo contrario, se usa el
    nombre del directorio o repositorio. Usa `--as <slug>` para anularlo.
    `openclaw skills update` solo realiza el seguimiento de instalaciones de ClawHub; vuelve a instalar
    los orígenes Git o locales para actualizarlos.

  </Accordion>
  <Accordion title="Verificación y análisis de seguridad">
    `openclaw skills verify @owner/<slug>` solicita a ClawHub el perímetro de confianza
    `clawhub.skill.verify.v1` de la Skill. Las Skills instaladas desde ClawHub se verifican
    con la versión y el registro guardados en `.clawhub/origin.json`.
    Se siguen aceptando slugs sin propietario para Skills ya instaladas o inequívocas, pero
    las referencias que incluyen el propietario evitan ambigüedades sobre el publicador.

    Las páginas de Skills de ClawHub muestran el estado del análisis de seguridad más reciente antes de la instalación,
    con páginas detalladas para VirusTotal, ClawScan y el análisis estático. El
    comando termina con un código distinto de cero cuando ClawHub marca la verificación como fallida. Los publicadores
    pueden resolver falsos positivos mediante el panel de ClawHub o
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalaciones desde archivos privados">
    Los clientes de Gateway que necesiten una entrega ajena a ClawHub pueden preparar un archivo zip de una Skill
    con `skills.upload.begin`, `skills.upload.chunk` y `skills.upload.commit`,
    y después instalarlo con `skills.install({ source: "upload", ... })`. Esta vía está
    desactivada de forma predeterminada y requiere `skills.install.allowUploadedArchives: true` en
    `openclaw.json`. Las instalaciones normales de ClawHub nunca necesitan ese ajuste.
  </Accordion>
</AccordionGroup>

## Seguridad

<Warning>
  Trata las Skills de terceros como **código que no es de confianza**. Léelas antes de habilitarlas.
  Da preferencia a las ejecuciones en sandbox para entradas que no sean de confianza y herramientas de riesgo. Consulta
  [Sandboxing](/es/gateway/sandboxing) para conocer los controles del agente.
</Warning>

<AccordionGroup>
  <Accordion title="Contención de rutas">
    La detección de Skills del espacio de trabajo, del agente del proyecto y de directorios adicionales solo acepta raíces de
    Skills cuya ruta real resuelta permanezca dentro de la raíz configurada, salvo que
    `skills.load.allowSymlinkTargets` confíe explícitamente en una raíz de destino.
    El Taller de Skills solo escribe a través de esos destinos de confianza cuando
    `skills.workshop.allowSymlinkTargetWrites` está habilitado.
    Los directorios gestionados `~/.openclaw/skills` y personales `~/.agents/skills` pueden contener
    carpetas de Skills enlazadas simbólicamente, pero la ruta real de cada `SKILL.md` debe permanecer
    dentro de su directorio de Skill resuelto.
  </Accordion>
  <Accordion title="Política de instalación del operador">
    Configura `security.installPolicy` para ejecutar un comando de política local de confianza
    antes de continuar con la instalación de Skills. La política recibe metadatos y la ruta del
    origen preparado, se aplica a ClawHub, cargas, Git, orígenes locales, actualizaciones y
    rutas de instaladores de dependencias, y deniega de forma predeterminada cuando el comando no puede devolver
    una decisión válida.
  </Accordion>
  <Accordion title="Ámbito de la inyección de secretos">
    `skills.entries.*.env` y `skills.entries.*.apiKey` inyectan secretos en el
    proceso del **host** solo durante ese turno del agente, no en el sandbox. Mantén los
    secretos fuera de los prompts y registros.
  </Accordion>
</AccordionGroup>

Para consultar el modelo de amenazas más amplio y las listas de comprobación de seguridad, consulta
[Seguridad](/es/gateway/security).

## Formato de SKILL.md

Cada Skill necesita como mínimo `name` y `description` en el frontmatter:

```markdown
---
name: image-lab
description: Genera o edita imágenes mediante un flujo de trabajo de imágenes respaldado por un proveedor
---

Cuando el usuario solicite generar una imagen, usa la herramienta `image_generate`...
```

<Note>
  OpenClaw sigue la especificación [AgentSkills](https://agentskills.io). El frontmatter
  se analiza primero como YAML; si eso falla, se recurre a un analizador que solo admite
  una línea. Los bloques `metadata` anidados (incluidas las asignaciones YAML multilínea)
  se convierten en una cadena JSON y se vuelven a analizar como JSON5, por lo que funciona
  la forma de bloque que se muestra en [Control de acceso](#gating). Use `{baseDir}` en el cuerpo
  para hacer referencia a la ruta de la carpeta de la skill.
</Note>

### Claves opcionales del frontmatter

<ParamField path="homepage" type="string">
  URL que se muestra como "Website" en la interfaz de Skills de macOS. También se admite mediante
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Cuando es `true`, la skill se expone como un comando de barra diagonal invocable por el usuario.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Cuando es `true`, OpenClaw mantiene las instrucciones de la skill fuera del prompt normal
  del agente. La skill sigue disponible como comando de barra diagonal cuando `user-invocable`
  también es `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Cuando se establece en `tool`, el comando de barra diagonal omite el modelo y se envía
  directamente a una herramienta registrada.
</ParamField>

<ParamField path="command-tool" type="string">
  Nombre de la herramienta que se invocará cuando se establezca `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para el envío a herramientas, reenvía la cadena de argumentos sin procesar a la herramienta, sin
  análisis del núcleo. La herramienta recibe
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Control de acceso

OpenClaw filtra las skills durante la carga mediante `metadata.openclaw` (un objeto JSON5
insertado en el frontmatter; consulte la nota de análisis anterior). Una skill sin un
bloque `metadata.openclaw` siempre es apta, salvo que se deshabilite explícitamente.

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
  Cuando es `true`, siempre incluye la skill y omite todos los demás controles.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji opcional que se muestra en la interfaz de Skills de macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL opcional que se muestra como "Website" en la interfaz de Skills de macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Filtro de plataforma. Cuando se establece, la skill solo es apta en uno de los sistemas operativos indicados.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Cada binario debe existir en `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Al menos un binario debe existir en `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Cada variable de entorno debe existir en el proceso o proporcionarse mediante la configuración.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Cada ruta de `openclaw.json` debe evaluarse como verdadera.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nombre de la variable de entorno asociada con `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Especificaciones opcionales de instalación utilizadas por la interfaz de Skills de macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Los bloques heredados `metadata.clawdbot` aún se aceptan cuando
  `metadata.openclaw` está ausente, de modo que las skills instaladas anteriormente conservan sus
  controles de dependencias y sugerencias de instalación. Las skills nuevas deben usar
  `metadata.openclaw`.
</Note>

### Especificaciones de instalación

Las especificaciones de instalación indican a la interfaz de Skills de macOS cómo instalar una dependencia:

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
    - Cuando se indican varios instaladores, el Gateway elige una opción
      preferida (brew cuando está disponible; de lo contrario, node).
    - Si todos los instaladores son `download`, OpenClaw enumera cada entrada para que pueda
      ver todos los artefactos disponibles.
    - Las especificaciones pueden incluir `os: ["darwin"|"linux"|"win32"]` para filtrar por plataforma.
    - Las instalaciones de Node respetan `skills.install.nodeManager` en `openclaw.json`
      (valor predeterminado: npm; opciones: npm / pnpm / yarn / bun). Esto solo afecta a las
      instalaciones de skills; el entorno de ejecución del Gateway debe seguir siendo Node.
    - Preferencia de instalación del Gateway: Homebrew → uv → gestor de node configurado →
      go → download.
  </Accordion>
  <Accordion title="Detalles de cada instalador">
    - **Homebrew:** OpenClaw no instala automáticamente Homebrew ni convierte las
      fórmulas de brew en comandos de paquetes del sistema. En contenedores Linux sin
      `brew`, los instaladores que solo usan brew se ocultan; use una imagen personalizada o instale
      la dependencia manualmente.
    - **Go:** OpenClaw requiere Go 1.21 o una versión posterior para las instalaciones automáticas de skills.
      Si falta `go` y Homebrew está disponible, OpenClaw instala primero Go mediante
      Homebrew; en Linux sin Homebrew, puede usar en su lugar `apt-get`
      como root o mediante `sudo` sin contraseña cuando el candidato actualizado `golang-go`
      cumple la versión mínima. El comando `go install` real para la
      dependencia siempre usa como destino un directorio de binarios dedicado y administrado por OpenClaw
      (el directorio `bin` de Homebrew en una instalación nueva; de lo contrario, `~/.local/bin`), en vez
      del `GOBIN` configurado; se leen sus propias variables de entorno `GOBIN`, `GOPATH` y `GOTOOLCHAIN`,
      pero nunca se sobrescriben.
    - **Descarga:** `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (valor predeterminado: automático cuando se detecta un archivo), `stripComponents`,
      `targetDir` (valor predeterminado: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Notas sobre el aislamiento">
    `requires.bins` se comprueba en el **host** durante la carga de la skill. Si un agente
    se ejecuta en un entorno aislado, el binario también debe existir **dentro del contenedor**.
    Instálelo mediante `agents.defaults.sandbox.docker.setupCommand` o una imagen
    personalizada. `setupCommand` se ejecuta una vez después de crear el contenedor y requiere
    acceso de salida a la red, un sistema de archivos raíz con permisos de escritura y un usuario root en el entorno aislado.
  </Accordion>
</AccordionGroup>

## Anulaciones de configuración

Active y configure las skills incluidas o administradas en `skills.entries` dentro de
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
  `false` deshabilita la skill incluso si está incluida o instalada. La skill incluida `coding-agent`
  es opcional: establezca `skills.entries.coding-agent.enabled: true`
  y asegúrese de que `claude`, `codex`, `opencode` u otra CLI compatible
  esté instalada y autenticada.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo práctico para las skills que declaran `metadata.openclaw.primaryEnv`.
  Admite una cadena de texto sin formato o un objeto SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variables de entorno inyectadas durante la ejecución del agente. Solo se inyectan cuando la
  variable aún no está definida en el proceso.
</ParamField>

<ParamField path="config" type="object">
  Contenedor opcional para campos de configuración personalizados de cada skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Lista de permitidas opcional solo para las skills **incluidas**. Cuando se establece, solo son
  aptas las skills incluidas en la lista. Las skills administradas y las del espacio de trabajo no se ven afectadas.
</ParamField>

<Note>
  De forma predeterminada, las claves de configuración coinciden con el **nombre de la skill**. Si una skill define
  `metadata.openclaw.skillKey`, use esa clave en `skills.entries`.
  Escriba entre comillas los nombres con guiones: JSON5 permite claves entre comillas.
</Note>

## Inyección del entorno

Cuando comienza la ejecución de un agente, OpenClaw:

<Steps>
  <Step title="Lee los metadatos de las skills">
    OpenClaw resuelve la lista efectiva de skills para el agente y aplica las reglas de control,
    las listas de permitidas y las anulaciones de configuración.
  </Step>
  <Step title="Inyecta las variables de entorno y las claves de API">
    `skills.entries.<key>.env` y `skills.entries.<key>.apiKey` se aplican a
    `process.env` durante la ejecución.
  </Step>
  <Step title="Crea el prompt del sistema">
    Las skills aptas se compilan en un bloque XML compacto y se inyectan en el
    prompt del sistema.
  </Step>
  <Step title="Restaura el entorno">
    Una vez finalizada la ejecución, se restaura el entorno original.
  </Step>
</Steps>

<Warning>
  La inyección de variables de entorno se limita a la ejecución del agente en el **host**, no al entorno aislado. Dentro de un
  entorno aislado, `env` y `apiKey` no tienen efecto. Consulte
  [Configuración de Skills](/es/tools/skills-config#sandboxed-skills-and-env-vars) para saber cómo
  transferir secretos a ejecuciones aisladas.
</Warning>

Para el backend incluido `claude-cli`, OpenClaw también materializa la misma
instantánea de skills aptas como un Plugin temporal de Claude Code y la transmite mediante
`--plugin-dir`. Los demás backends de CLI solo usan el catálogo del prompt.

## Instantáneas y actualización

OpenClaw crea una instantánea de las skills aptas **cuando comienza una sesión** y reutiliza esa
lista en todos los turnos posteriores de la sesión. Los cambios en las skills o en la configuración
surten efecto en la siguiente sesión nueva.

Las skills se actualizan durante la sesión en dos casos:

- El monitor de skills detecta un cambio en `SKILL.md`.
- Se conecta un nuevo nodo remoto apto.

La lista actualizada se utiliza en el siguiente turno del agente. Si cambia la lista de permitidas efectiva
del agente, OpenClaw actualiza la instantánea para mantener alineadas las skills visibles.

<AccordionGroup>
  <Accordion title="Monitor de Skills">
    De forma predeterminada, OpenClaw supervisa las carpetas de skills y actualiza la instantánea cuando
    cambian los archivos `SKILL.md`. Configúrelo en `skills.load`:

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

    Use `allowSymlinkTargets` para estructuras intencionadas con enlaces simbólicos en las que un enlace
    simbólico de la raíz de una skill apunte fuera de la raíz configurada, por ejemplo,
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Habilite `skills.workshop.allowSymlinkTargetWrites` solo cuando Skill Workshop
    también deba aplicar propuestas mediante esas rutas de enlaces simbólicos de confianza.

  </Accordion>
  <Accordion title="Nodos macOS remotos (Gateway Linux)">
    Si el Gateway se ejecuta en Linux, pero hay conectado un **nodo macOS** con
    `system.run` permitido, OpenClaw puede considerar aptas las skills exclusivas de macOS cuando
    los binarios necesarios estén presentes en ese nodo. El agente debe ejecutar esas
    skills mediante la herramienta `exec` con `host=node`.

    Los nodos sin conexión **no** hacen visibles las skills que solo están disponibles de forma remota. Si un nodo deja
    de responder a las comprobaciones de binarios, OpenClaw borra de la caché sus coincidencias de binarios.

  </Accordion>
</AccordionGroup>

## Impacto en los tokens

Cuando hay skills aptas, OpenClaw inyecta un bloque XML compacto en el prompt
del sistema. El coste es determinista y aumenta linealmente por skill:

- **Sobrecarga base** (solo cuando hay una o más skills aptas): un bloque fijo de texto
  introductorio más el contenedor `<available_skills>`.
- **Por skill:** aproximadamente 97 caracteres más la longitud de los campos `name`, `description` y `location`.
- El escapado XML convierte `& < > " '` en entidades, lo que añade algunos caracteres por
  aparición.
- Con aproximadamente 4 caracteres por token, 97 caracteres ≈ 24 tokens por skill antes de sumar la longitud de los campos.

Si el bloque renderizado excediera el presupuesto de prompt configurado
(`skills.limits.maxSkillsPromptChars`), OpenClaw conserva primero tantas
identidades de Skills (nombre, ubicación y versión) como permita el formato
compacto sin descripciones. A continuación, utiliza el presupuesto restante
para descripciones abreviadas. Si no queda presupuesto para descripciones,
estas se omiten. El prompt incluye una nota que remite a
`openclaw skills check` siempre que sea necesario usar el formato compacto o
truncar la lista.

Mantén las descripciones breves y descriptivas para minimizar la sobrecarga del prompt.

## Relacionado

<CardGroup cols={2}>
  <Card title="Creación de Skills" href="/es/tools/creating-skills" icon="hammer">
    Guía paso a paso para crear una Skill personalizada.
  </Card>
  <Card title="Taller de Skills" href="/es/tools/skill-workshop" icon="flask">
    Cola de propuestas de Skills redactadas por agentes.
  </Card>
  <Card title="Configuración de Skills" href="/es/tools/skills-config" icon="gear">
    Esquema completo de configuración de `skills.*` y listas de agentes permitidos.
  </Card>
  <Card title="Comandos con barra" href="/es/tools/slash-commands" icon="terminal">
    Cómo se registran y enrutan los comandos con barra de las Skills.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explora y publica Skills en el registro público.
  </Card>
  <Card title="Plugins" href="/es/tools/plugin" icon="plug">
    Los Plugins pueden incluir Skills junto con las herramientas que documentan.
  </Card>
</CardGroup>
