---
read_when:
    - Agregar o modificar Skills
    - Cambiar el control de Skills, las listas de permitidos o las reglas de carga
    - Comprender la precedencia de Skills y el comportamiento de las instantáneas
sidebarTitle: Skills
summary: Skills enseña a tu agente cómo usar herramientas. Aprende cómo se cargan, cómo funciona la precedencia y cómo configurar gating, allowlists e inyección de entorno.
title: Skills
x-i18n:
    generated_at: "2026-06-27T13:09:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills son archivos de instrucciones en markdown que enseñan al agente cómo y cuándo usar
herramientas. Cada skill vive en un directorio que contiene un archivo `SKILL.md` con
frontmatter YAML y un cuerpo en markdown. OpenClaw carga las Skills incluidas junto con cualquier
sobrescritura local, y las filtra en el momento de carga según el entorno, la configuración y la
presencia de binarios.

<CardGroup cols={2}>
  <Card title="Crear Skills" href="/es/tools/creating-skills" icon="hammer">
    Construye y prueba una skill personalizada desde cero.
  </Card>
  <Card title="Taller de Skills" href="/es/tools/skill-workshop" icon="flask">
    Revisa y aprueba propuestas de skills redactadas por agentes.
  </Card>
  <Card title="Configuración de Skills" href="/es/tools/skills-config" icon="gear">
    Esquema completo de configuración `skills.*` y listas de permitidos de agentes.
  </Card>
  <Card title="ClawHub" href="/es/clawhub" icon="cloud">
    Explora e instala skills de la comunidad.
  </Card>
</CardGroup>

## Orden de carga

OpenClaw carga desde estas fuentes, **con la mayor precedencia primero**. Cuando el mismo
nombre de skill aparece en varios lugares, gana la fuente con mayor precedencia.

| Prioridad        | Fuente                    | Ruta                                    |
| ---------------- | ------------------------- | --------------------------------------- |
| 1 — la más alta  | Skills del workspace      | `<workspace>/skills`                    |
| 2                | Skills de agente del proyecto | `<workspace>/.agents/skills`         |
| 3                | Skills personales de agente | `~/.agents/skills`                    |
| 4                | Skills gestionadas / locales | `~/.openclaw/skills`                  |
| 5                | Skills incluidas          | incluidas con la instalación            |
| 6 — la más baja  | Directorios adicionales   | `skills.load.extraDirs` + skills de plugin |

Las raíces de skills admiten diseños agrupados. OpenClaw descubre una skill siempre que
`SKILL.md` aparezca en cualquier lugar bajo una raíz configurada:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

La ruta de carpeta es solo para organización. El nombre de la skill, el comando slash y la
clave de lista de permitidos provienen todos del campo de frontmatter `name` (o del nombre del directorio
cuando falta `name`).

<Note>
  El directorio nativo `$CODEX_HOME/skills` de Codex CLI **no** es una raíz de
  skills de OpenClaw. Usa `openclaw migrate plan codex` para inventariar esas skills, y luego
  `openclaw migrate codex` para copiarlas a tu workspace de OpenClaw.
</Note>

## Skills por agente frente a compartidas

En configuraciones multiagente, cada agente tiene su propio workspace. Usa la ruta que
coincida con la visibilidad que deseas:

| Alcance            | Ruta                         | Visible para                 |
| ------------------ | ---------------------------- | ---------------------------- |
| Por agente         | `<workspace>/skills`         | Solo ese agente              |
| Agente del proyecto | `<workspace>/.agents/skills` | Solo el agente de ese workspace |
| Agente personal    | `~/.agents/skills`           | Todos los agentes en esta máquina |
| Gestionadas compartidas | `~/.openclaw/skills`     | Todos los agentes en esta máquina |
| Directorios adicionales | `skills.load.extraDirs`  | Todos los agentes en esta máquina |

## Listas de permitidos de agentes

La **ubicación** de la skill (precedencia) y la **visibilidad** de la skill (qué agente puede usarla)
son controles separados. Usa listas de permitidos para restringir qué skills ve un agente,
sin importar desde dónde se carguen.

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
  <Accordion title="Reglas de lista de permitidos">
    - Omite `agents.defaults.skills` para dejar todas las skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar `agents.defaults.skills`.
    - Establece `agents.list[].skills: []` para no exponer ninguna skill para ese agente.
    - Una lista no vacía `agents.list[].skills` es el conjunto **final**: no se
      fusiona con los valores predeterminados.
    - La lista de permitidos efectiva se aplica en la construcción de prompts, el
      descubrimiento de comandos slash, la sincronización de sandbox y las instantáneas de skills.
  </Accordion>
</AccordionGroup>

## Plugins y skills

Los plugins pueden incluir sus propias skills listando directorios `skills` en
`openclaw.plugin.json` (rutas relativas a la raíz del plugin). Las skills de plugin se cargan
cuando el plugin está habilitado; por ejemplo, el plugin de navegador incluye una skill
`browser-automation` para control de navegador de varios pasos.

Los directorios de skills de plugin se fusionan en el mismo nivel de baja precedencia que
`skills.load.extraDirs`, así que una skill incluida, gestionada, de agente o de workspace
con el mismo nombre los sobrescribe. Contrólalos mediante `metadata.openclaw.requires.config` en la
entrada de configuración del plugin.

Consulta [Plugins](/es/tools/plugin) y [Herramientas](/es/tools) para ver el sistema completo de plugins.

## Taller de Skills

[Taller de Skills](/es/tools/skill-workshop) es una cola de propuestas entre el agente
y tus archivos de skills activos. Cuando el agente detecta trabajo reutilizable, redacta una
propuesta en lugar de escribir directamente en `SKILL.md`. Tú revisas y apruebas
antes de que cambie nada.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulta [Taller de Skills](/es/tools/skill-workshop) para ver el ciclo de vida completo, la referencia de CLI
y la configuración.

## Instalación desde ClawHub

[ClawHub](https://clawhub.ai) es el registro público de skills. Usa los comandos
`openclaw skills` para instalar y actualizar, o la CLI `clawhub` para
publicar y sincronizar.

| Acción                              | Comando                                                |
| ----------------------------------- | ------------------------------------------------------ |
| Instalar una skill en el workspace  | `openclaw skills install @owner/<slug>`                |
| Instalar desde un repositorio Git   | `openclaw skills install git:owner/repo@ref`           |
| Instalar un directorio local de skill | `openclaw skills install ./path/to/skill --as my-tool` |
| Instalar para todos los agentes locales | `openclaw skills install @owner/<slug> --global`    |
| Actualizar todas las skills del workspace | `openclaw skills update --all`                   |
| Actualizar una skill gestionada compartida | `openclaw skills update @owner/<slug> --global` |
| Actualizar todas las skills gestionadas compartidas | `openclaw skills update --all --global` |
| Verificar el sobre de confianza de una skill | `openclaw skills verify @owner/<slug>`        |
| Imprimir la Skill Card generada     | `openclaw skills verify @owner/<slug> --card`          |
| Publicar / sincronizar mediante la CLI de ClawHub | `clawhub sync --all`                    |

<AccordionGroup>
  <Accordion title="Detalles de instalación">
    `openclaw skills install` instala en el directorio `skills/` del workspace activo
    de forma predeterminada. Agrega `--global` para instalar en el directorio compartido
    `~/.openclaw/skills`, visible para todos los agentes locales salvo que las listas de permitidos
    de agentes lo restrinjan.

    Las instalaciones desde Git y locales esperan `SKILL.md` en la raíz de origen. El slug proviene
    del `name` del frontmatter de `SKILL.md` cuando es válido, y luego recurre al
    nombre del directorio o repositorio. Usa `--as <slug>` para sobrescribirlo.
    `openclaw skills update` rastrea solo instalaciones de ClawHub; reinstala fuentes Git o
    locales para actualizarlas.

  </Accordion>
  <Accordion title="Verificación y escaneo de seguridad">
    `openclaw skills verify @owner/<slug>` solicita a ClawHub el sobre de confianza
    `clawhub.skill.verify.v1` de la skill. Las skills de ClawHub instaladas se verifican
    contra la versión y el registro guardados en `.clawhub/origin.json`.
    Los slugs simples siguen aceptándose para skills existentes instaladas o inequívocas, pero
    las referencias con propietario evitan ambigüedad sobre el publicador.

    Las páginas de skills de ClawHub muestran el estado más reciente del escaneo de seguridad antes de instalar,
    con páginas de detalle para VirusTotal, ClawScan y análisis estático. El
    comando termina con código distinto de cero cuando ClawHub marca la verificación como fallida. Los publicadores
    recuperan falsos positivos mediante el panel de ClawHub o
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalaciones desde archivos privados">
    Los clientes de Gateway que necesiten entrega fuera de ClawHub pueden preparar un archivo zip de skill
    con `skills.upload.begin`, `skills.upload.chunk` y `skills.upload.commit`,
    y luego instalar con `skills.install({ source: "upload", ... })`. Esta ruta está
    desactivada de forma predeterminada y requiere `skills.install.allowUploadedArchives: true` en
    `openclaw.json`. Las instalaciones normales de ClawHub nunca necesitan esa opción.
  </Accordion>
</AccordionGroup>

## Seguridad

<Warning>
  Trata las skills de terceros como **código no confiable**. Léelas antes de habilitarlas.
  Prefiere ejecuciones en sandbox para entradas no confiables y herramientas riesgosas. Consulta
  [Sandboxing](/es/gateway/sandboxing) para ver controles del lado del agente.
</Warning>

<AccordionGroup>
  <Accordion title="Contención de rutas">
    El descubrimiento de skills de workspace, agente del proyecto y directorios adicionales solo acepta raíces de skills
    cuyo realpath resuelto permanezca dentro de la raíz configurada, salvo que
    `skills.load.allowSymlinkTargets` confíe explícitamente en una raíz de destino.
    El Taller de Skills escribe a través de esos destinos confiables solo cuando
    `skills.workshop.allowSymlinkTargetWrites` está habilitado.
    Las skills gestionadas `~/.openclaw/skills` y personales `~/.agents/skills` pueden contener
    carpetas de skills con enlaces simbólicos, pero cada realpath de `SKILL.md` aún debe permanecer
    dentro de su directorio de skill resuelto.
  </Accordion>
  <Accordion title="Política de instalación del operador">
    Configura `security.installPolicy` para ejecutar un comando de política local confiable
    antes de que continúen las instalaciones de skills. La política recibe metadatos y la ruta de origen
    preparada, se aplica a rutas de ClawHub, subidas, Git, locales, de actualización y de
    instalador de dependencias, y falla cerrada cuando el comando no puede devolver
    una decisión válida.
  </Accordion>
  <Accordion title="Alcance de inyección de secretos">
    `skills.entries.*.env` y `skills.entries.*.apiKey` inyectan secretos en el
    proceso **host** solo para ese turno del agente, no en el sandbox. Mantén
    los secretos fuera de prompts y registros.
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
  OpenClaw sigue la especificación [AgentSkills](https://agentskills.io). El
  analizador de frontmatter admite **solo claves de una línea**: `metadata` debe ser un
  objeto JSON de una sola línea. Usa `{baseDir}` en el cuerpo para referenciar la ruta de carpeta
  de la skill.
</Note>

### Claves opcionales de frontmatter

<ParamField path="homepage" type="string">
  URL mostrada como "Sitio web" en la UI de Skills de macOS. También se admite mediante
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Cuando es `true`, la skill se expone como un comando slash invocable por el usuario.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Cuando es `true`, OpenClaw mantiene las instrucciones de la skill fuera del prompt normal
  del agente. La skill sigue disponible como comando slash cuando `user-invocable`
  también es `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Cuando se establece en `tool`, el comando slash omite el modelo y despacha
  directamente a una herramienta registrada.
</ParamField>

<ParamField path="command-tool" type="string">
  Nombre de la herramienta que se invoca cuando `command-dispatch: tool` está establecido.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para el despacho de herramienta, reenvía la cadena de argumentos sin procesar a la herramienta sin
  análisis del núcleo. La herramienta recibe
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Control de acceso

OpenClaw filtra Skills en tiempo de carga usando `metadata.openclaw` (JSON de una sola línea
en el frontmatter). Una Skill sin bloque `metadata.openclaw` siempre es
elegible salvo que se deshabilite explícitamente.

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
  Cuando es `true`, incluye siempre la Skill y omite todas las demás comprobaciones.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji opcional mostrado en la interfaz de Skills de macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL opcional mostrada como "Sitio web" en la interfaz de Skills de macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filtro de plataforma. Cuando se define, la Skill solo es elegible en los sistemas operativos indicados.
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
  Nombre de variable de entorno asociado con `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Especificaciones de instalador opcionales usadas por la interfaz de Skills de macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Los bloques heredados `metadata.clawdbot` todavía se aceptan cuando
  `metadata.openclaw` está ausente, por lo que las Skills instaladas más antiguas conservan sus
  comprobaciones de dependencias y sugerencias de instalador. Las Skills nuevas deben usar
  `metadata.openclaw`.
</Note>

### Especificaciones del instalador

Las especificaciones del instalador indican a la interfaz de Skills de macOS cómo instalar una dependencia:

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
    - Cuando se listan varios instaladores, el gateway elige una opción
      preferida (brew cuando está disponible; de lo contrario, node).
    - Si todos los instaladores son `download`, OpenClaw lista cada entrada para que puedas
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
    - **Go:** si falta `go` y `brew` está disponible, el gateway instala
      Go primero mediante Homebrew y establece `GOBIN` en el `bin` de Homebrew.
    - **Download:** `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (predeterminado: automático cuando se detecta un archivo), `stripComponents`,
      `targetDir` (predeterminado: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Notas de sandboxing">
    `requires.bins` se comprueba en el **host** durante la carga de Skills. Si un agente
    se ejecuta en un sandbox, el binario también debe existir **dentro del contenedor**.
    Instálalo mediante `agents.defaults.sandbox.docker.setupCommand` o una imagen
    personalizada. `setupCommand` se ejecuta una vez después de crear el contenedor y requiere
    salida de red, un sistema de archivos raíz escribible y un usuario root en el sandbox.
  </Accordion>
</AccordionGroup>

## Sobrescrituras de configuración

Activa y configura Skills incluidas o gestionadas en `skills.entries` dentro de
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
  `false` deshabilita la Skill incluso si está incluida o instalada. La Skill incluida `coding-agent`
  es opcional: establece `skills.entries.coding-agent.enabled: true`
  y asegúrate de que `claude`, `codex`, `opencode` u otra CLI compatible
  esté instalada y autenticada.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo de conveniencia para Skills que declaran `metadata.openclaw.primaryEnv`.
  Admite una cadena de texto sin formato o un objeto SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variables de entorno inyectadas para la ejecución del agente. Solo se inyectan cuando la
  variable aún no está definida en el proceso.
</ParamField>

<ParamField path="config" type="object">
  Contenedor opcional para campos de configuración personalizados por Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Lista de permitidos opcional solo para Skills **incluidas**. Cuando se define, solo las Skills incluidas
  en la lista son elegibles. Las Skills gestionadas y de workspace no se ven afectadas.
</ParamField>

<Note>
  Las claves de configuración coinciden con el **nombre de la Skill** de forma predeterminada. Si una Skill define
  `metadata.openclaw.skillKey`, usa esa clave en `skills.entries`. Entrecomilla
  los nombres con guiones: JSON5 permite claves entrecomilladas.
</Note>

## Inyección de entorno

Cuando comienza la ejecución de un agente, OpenClaw:

<Steps>
  <Step title="Lee metadatos de Skills">
    OpenClaw resuelve la lista efectiva de Skills para el agente aplicando reglas de comprobación,
    listas de permitidos y sobrescrituras de configuración.
  </Step>
  <Step title="Inyecta env y claves de API">
    `skills.entries.<key>.env` y `skills.entries.<key>.apiKey` se aplican a
    `process.env` durante la ejecución.
  </Step>
  <Step title="Construye el prompt del sistema">
    Las Skills elegibles se compilan en un bloque XML compacto y se inyectan en el
    prompt del sistema.
  </Step>
  <Step title="Restaura el entorno">
    Una vez finalizada la ejecución, se restaura el entorno original.
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
`--plugin-dir`. Otros backends de CLI solo usan el catálogo del prompt.

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
    cambian los archivos `SKILL.md`. Configúralo en `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    Usa `allowSymlinkTargets` para diseños con enlaces simbólicos intencionales donde un enlace simbólico de raíz de Skill
    apunta fuera de la raíz configurada, por ejemplo
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Habilita `skills.workshop.allowSymlinkTargetWrites` solo cuando Skill Workshop
    también deba aplicar propuestas a través de esas rutas con enlaces simbólicos de confianza.

  </Accordion>
  <Accordion title="Nodos macOS remotos (gateway Linux)">
    Si el Gateway se ejecuta en Linux pero hay un **nodo macOS** conectado con
    `system.run` permitido, OpenClaw puede tratar las Skills exclusivas de macOS como elegibles cuando
    los binarios requeridos están presentes en ese nodo. El agente debe ejecutar esas
    Skills mediante la herramienta `exec` con `host=node`.

    Los nodos sin conexión **no** hacen visibles las Skills solo remotas. Si un nodo deja de
    responder a sondeos de binarios, OpenClaw borra sus coincidencias de binarios en caché.

  </Accordion>
</AccordionGroup>

## Impacto en tokens

Cuando hay Skills elegibles, OpenClaw inyecta un bloque XML compacto en el
prompt del sistema. El coste es determinista:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Sobrecoste base** (solo cuando hay ≥ 1 Skill): ~195 caracteres
- **Por Skill:** ~97 caracteres + las longitudes de tus campos `name`, `description` y `location`
- El escapado XML expande `& < > " '` en entidades, agregando algunos caracteres por aparición
- A ~4 caracteres/token, 97 caracteres ≈ 24 tokens por Skill antes de las longitudes de los campos

Mantén las descripciones breves y descriptivas para minimizar el sobrecoste del prompt.

## Relacionado

<CardGroup cols={2}>
  <Card title="Crear Skills" href="/es/tools/creating-skills" icon="hammer">
    Guía paso a paso para crear una Skill personalizada.
  </Card>
  <Card title="Skill Workshop" href="/es/tools/skill-workshop" icon="flask">
    Cola de propuestas para Skills redactadas por agentes.
  </Card>
  <Card title="Configuración de Skills" href="/es/tools/skills-config" icon="gear">
    Esquema completo de configuración `skills.*` y listas de permitidos de agentes.
  </Card>
  <Card title="Comandos slash" href="/es/tools/slash-commands" icon="terminal">
    Cómo se registran y enrutan los comandos slash de Skills.
  </Card>
  <Card title="ClawHub" href="/es/clawhub" icon="cloud">
    Explora y publica Skills en el registro público.
  </Card>
  <Card title="Plugins" href="/es/tools/plugin" icon="plug">
    Los Plugins pueden incluir Skills junto con las herramientas que documentan.
  </Card>
</CardGroup>
