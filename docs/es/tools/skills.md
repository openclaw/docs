---
read_when:
    - Añadir o modificar Skills
    - Cambiar las restricciones, las listas de permitidos o las reglas de carga de Skills
    - Comprender la precedencia de Skills y el comportamiento de las instantáneas
sidebarTitle: Skills
summary: Las Skills enseñan a su agente a usar herramientas. Aprenda cómo se cargan, cómo funciona la precedencia y cómo configurar las restricciones, las listas de permitidos y la inyección de variables de entorno.
title: Skills
x-i18n:
    generated_at: "2026-07-12T14:53:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Las Skills son archivos de instrucciones en Markdown que enseñan al agente cómo y cuándo usar
herramientas. Cada Skill se encuentra en un directorio que contiene un archivo `SKILL.md` con
frontmatter YAML y un cuerpo en Markdown. OpenClaw carga las Skills incluidas junto con cualquier
reemplazo local y las filtra durante la carga según el entorno, la configuración y
la presencia de binarios.

<CardGroup cols={2}>
  <Card title="Creación de Skills" href="/es/tools/creating-skills" icon="hammer">
    Cree y pruebe una Skill personalizada desde cero.
  </Card>
  <Card title="Taller de Skills" href="/es/tools/skill-workshop" icon="flask">
    Revise y apruebe propuestas de Skills redactadas por el agente.
  </Card>
  <Card title="Configuración de Skills" href="/es/tools/skills-config" icon="gear">
    Esquema completo de configuración `skills.*` y listas de permitidas para agentes.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explore e instale Skills de la comunidad.
  </Card>
</CardGroup>

## Orden de carga

OpenClaw carga desde estas fuentes, **empezando por la de mayor precedencia**. Cuando el mismo
nombre de Skill aparece en varios lugares, prevalece la fuente de mayor prioridad.

| Prioridad    | Fuente                       | Ruta                                    |
| ------------ | ---------------------------- | --------------------------------------- |
| 1 — máxima   | Skills del espacio de trabajo | `<workspace>/skills`                    |
| 2            | Skills del agente del proyecto | `<workspace>/.agents/skills`            |
| 3            | Skills personales del agente | `~/.agents/skills`                      |
| 4            | Skills gestionadas/locales   | `~/.openclaw/skills`                    |
| 5            | Skills incluidas             | distribuidas con la instalación         |
| 6 — mínima   | Directorios adicionales      | `skills.load.extraDirs` + Skills de Plugins |

Las raíces de Skills admiten estructuras agrupadas. OpenClaw descubre una Skill siempre que
`SKILL.md` aparezca en cualquier lugar bajo una raíz configurada (hasta 6 niveles de profundidad):

```text
<workspace>/skills/research/SKILL.md          ✓ encontrada como "research"
<workspace>/skills/personal/research/SKILL.md ✓ también encontrada como "research"
```

La ruta de la carpeta solo sirve para organizar. El nombre y el comando con barra de la Skill
provienen del campo `name` del frontmatter (o del nombre del directorio cuando falta `name`).
Las listas de permitidas para agentes (descritas a continuación) también se comparan con este `name`.

<Note>
  El directorio nativo `$CODEX_HOME/skills` de Codex CLI **no** es una raíz de
  Skills de OpenClaw. Use `openclaw migrate plan codex` para inventariar esas Skills y luego
  `openclaw migrate codex` para copiarlas en su espacio de trabajo de OpenClaw.
</Note>

## Skills alojadas en Node

Un Node sin interfaz gráfica conectado puede publicar las Skills instaladas en su directorio activo de
Skills de OpenClaw (`~/.openclaw/skills` de forma predeterminada; se aplican las sustituciones del
entorno del perfil). Aparecen en la lista normal de Skills del agente mientras el Node está conectado
y desaparecen cuando se desconecta. Una Skill local o del Gateway conserva su nombre en
caso de colisión; la Skill del Node recibe un nombre determinista con un prefijo del Node.
La versión v1 de las Skills alojadas en Node requiere que el nombre del directorio coincida con el campo
`name` del frontmatter de la Skill.

La entrada de la Skill incluye el localizador del Node. Sus archivos, referencias relativas y
binarios se encuentran en el Node, por lo que debe cargarla y ejecutarla con
`exec host=node node=<node-id>`. Reinicie el host del Node después de modificar sus archivos de
Skill. Consulte [Nodes](/es/nodes#node-hosted-skills) para obtener información sobre el emparejamiento y los mecanismos de desactivación.

## Skills por agente frente a Skills compartidas

En configuraciones con varios agentes, cada agente tiene su propio espacio de trabajo. Use la ruta que
corresponda a la visibilidad deseada:

| Ámbito             | Ruta                         | Visible para                              |
| ------------------ | ---------------------------- | ----------------------------------------- |
| Por agente         | `<workspace>/skills`         | Solo ese agente                           |
| Agente del proyecto | `<workspace>/.agents/skills` | Solo el agente de ese espacio de trabajo  |
| Agente personal    | `~/.agents/skills`           | Todos los agentes de esta máquina         |
| Compartido y gestionado | `~/.openclaw/skills`     | Todos los agentes de esta máquina         |
| Directorios adicionales | `skills.load.extraDirs`  | Todos los agentes de esta máquina         |

## Listas de Skills permitidas para agentes

La **ubicación** de la Skill (precedencia) y su **visibilidad** (qué agente puede usarla)
son controles independientes. Use listas de permitidas para restringir qué Skills ve un agente,
sin importar desde dónde se carguen.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // base compartida
    },
    list: [
      { id: "writer" }, // hereda github, weather
      { id: "docs", skills: ["docs-search"] }, // sustituye por completo los valores predeterminados
      { id: "locked-down", skills: [] }, // sin Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Reglas de las listas de permitidas">
    - Omita `agents.defaults.skills` para dejar todas las Skills sin restricciones de forma predeterminada.
    - Omita `agents.list[].skills` para heredar `agents.defaults.skills`.
    - Establezca `agents.list[].skills: []` para no exponer ninguna Skill a ese agente.
    - Una lista no vacía de `agents.list[].skills` constituye el conjunto **definitivo**; no se
      combina con los valores predeterminados.
    - La lista de permitidas efectiva se aplica a la construcción de prompts, el descubrimiento de
      comandos con barra, la sincronización del entorno aislado y las instantáneas de Skills.
    - Esto no constituye un límite de autorización para el shell del host. Si el mismo agente puede
      usar `exec`, restrinja ese shell por separado mediante aislamiento, separación por
      usuario del SO, listas de denegación/permisos de ejecución y credenciales por recurso.
  </Accordion>
</AccordionGroup>

## Plugins y Skills

Los Plugins pueden incluir sus propias Skills enumerando directorios `skills` en
`openclaw.plugin.json` (rutas relativas a la raíz del Plugin). Las Skills de los Plugins se cargan
cuando el Plugin está habilitado; por ejemplo, el Plugin del navegador incluye una Skill
`browser-automation` para controlar el navegador en varios pasos.

Los directorios de Skills de Plugins se combinan en el mismo nivel de baja precedencia que
`skills.load.extraDirs`, por lo que una Skill con el mismo nombre que esté incluida, gestionada, pertenezca a un agente o al espacio de trabajo
tiene prioridad sobre ellas. Controle la elegibilidad propia de una Skill de Plugin mediante
`metadata.openclaw.requires` en su frontmatter, igual que para cualquier otra Skill.

Consulte [Plugins](/es/tools/plugin) y [Herramientas](/es/tools) para conocer el sistema completo de Plugins.

## Taller de Skills

El [Taller de Skills](/es/tools/skill-workshop) es una cola de propuestas entre el agente
y sus archivos de Skills activos. Cuando el agente detecta trabajo reutilizable, redacta una
propuesta en lugar de escribir directamente en `SKILL.md`. Debe revisarla y aprobarla
antes de que se produzca cualquier cambio.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consulte [Taller de Skills](/es/tools/skill-workshop) para conocer el ciclo de vida completo, la referencia de la
CLI y la configuración.

## Instalación desde ClawHub

[ClawHub](https://clawhub.ai) es el registro público de Skills. Use los comandos
`openclaw skills` para instalar y actualizar, o la CLI `clawhub` para
publicar y sincronizar.

| Acción                                      | Comando                                                |
| ------------------------------------------- | ------------------------------------------------------ |
| Instalar una Skill en el espacio de trabajo | `openclaw skills install @owner/<slug>`                |
| Instalar desde un repositorio Git           | `openclaw skills install git:owner/repo@ref`           |
| Instalar un directorio local de Skills      | `openclaw skills install ./path/to/skill --as my-tool` |
| Instalar para todos los agentes locales     | `openclaw skills install @owner/<slug> --global`       |
| Actualizar todas las Skills del espacio de trabajo | `openclaw skills update --all`                   |
| Actualizar una Skill compartida y gestionada | `openclaw skills update @owner/<slug> --global`       |
| Actualizar todas las Skills compartidas y gestionadas | `openclaw skills update --all --global`          |
| Verificar el perímetro de confianza de una Skill | `openclaw skills verify @owner/<slug>`             |
| Mostrar la tarjeta de Skill generada        | `openclaw skills verify @owner/<slug> --card`          |
| Publicar/sincronizar mediante la CLI de ClawHub | `clawhub sync --all`                               |

<AccordionGroup>
  <Accordion title="Detalles de instalación">
    `openclaw skills install` instala de forma predeterminada en el directorio `skills/`
    del espacio de trabajo activo. Añada `--global` para instalar en el directorio compartido
    `~/.openclaw/skills`, visible para todos los agentes locales salvo que sus listas de
    permitidas lo restrinjan.

    Las instalaciones desde Git y locales esperan encontrar `SKILL.md` en la raíz de origen. El slug se obtiene
    del campo `name` del frontmatter de `SKILL.md` cuando es válido y, en caso contrario, se usa el
    nombre del directorio o repositorio. Use `--as <slug>` para sustituirlo.
    `openclaw skills update` solo realiza el seguimiento de instalaciones desde ClawHub; reinstale las fuentes
    Git o locales para actualizarlas.

  </Accordion>
  <Accordion title="Verificación y análisis de seguridad">
    `openclaw skills verify @owner/<slug>` solicita a ClawHub el perímetro de confianza
    `clawhub.skill.verify.v1` de la Skill. Las Skills instaladas desde ClawHub se verifican
    con la versión y el registro guardados en `.clawhub/origin.json`.
    Se siguen aceptando slugs sin propietario para las Skills existentes instaladas o inequívocas, pero
    las referencias que incluyen el propietario evitan ambigüedades sobre el editor.

    Las páginas de Skills de ClawHub muestran el estado del análisis de seguridad más reciente antes de la instalación,
    con páginas de detalles para VirusTotal, ClawScan y el análisis estático. El
    comando termina con un código distinto de cero cuando ClawHub marca la verificación como fallida. Los editores
    pueden resolver falsos positivos mediante el panel de ClawHub o
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalaciones desde archivos privados">
    Los clientes de Gateway que necesiten una distribución ajena a ClawHub pueden preparar un archivo zip de una Skill
    con `skills.upload.begin`, `skills.upload.chunk` y `skills.upload.commit`,
    y después instalarlo con `skills.install({ source: "upload", ... })`. Esta ruta está
    desactivada de forma predeterminada y requiere `skills.install.allowUploadedArchives: true` en
    `openclaw.json`. Las instalaciones normales desde ClawHub nunca necesitan ese ajuste.
  </Accordion>
</AccordionGroup>

## Seguridad

<Warning>
  Trate las Skills de terceros como **código no confiable**. Léalas antes de habilitarlas.
  Prefiera ejecuciones aisladas para entradas no confiables y herramientas de riesgo. Consulte
  [Aislamiento](/es/gateway/sandboxing) para conocer los controles del lado del agente.
</Warning>

<AccordionGroup>
  <Accordion title="Contención de rutas">
    El descubrimiento de Skills del espacio de trabajo, del agente del proyecto y de directorios adicionales solo acepta raíces de
    Skills cuya ruta real resuelta permanezca dentro de la raíz configurada, salvo que
    `skills.load.allowSymlinkTargets` confíe explícitamente en una raíz de destino.
    El Taller de Skills escribe a través de esos destinos confiables solo cuando
    `skills.workshop.allowSymlinkTargetWrites` está habilitado.
    Los directorios gestionados `~/.openclaw/skills` y personales `~/.agents/skills` pueden contener
    carpetas de Skills enlazadas simbólicamente, pero la ruta real de cada `SKILL.md` debe permanecer
    dentro de su directorio de Skill resuelto.
  </Accordion>
  <Accordion title="Política de instalación del operador">
    Configure `security.installPolicy` para ejecutar un comando de política local confiable
    antes de continuar con las instalaciones de Skills. La política recibe los metadatos y la ruta
    de origen preparada, se aplica a las rutas de ClawHub, archivos subidos, Git, fuentes locales, actualizaciones e
    instaladores de dependencias, y aplica un cierre seguro cuando el comando no puede devolver
    una decisión válida.
  </Accordion>
  <Accordion title="Ámbito de inyección de secretos">
    `skills.entries.*.env` y `skills.entries.*.apiKey` inyectan secretos en el
    proceso del **host** solo durante ese turno del agente, no en el entorno aislado. Mantenga los
    secretos fuera de los prompts y registros.
  </Accordion>
</AccordionGroup>

Para consultar el modelo de amenazas y las listas de comprobación de seguridad generales, consulte
[Seguridad](/es/gateway/security).

## Formato de SKILL.md

Cada Skill necesita como mínimo un `name` y una `description` en el frontmatter:

```markdown
---
name: image-lab
description: Generar o editar imágenes mediante un flujo de trabajo de imágenes respaldado por un proveedor
---

Cuando el usuario solicite generar una imagen, use la herramienta `image_generate`...
```

<Note>
  OpenClaw sigue la especificación de [AgentSkills](https://agentskills.io). El frontmatter
  se analiza primero como YAML; si eso falla, se recurre a un analizador
  limitado a una sola línea. Los bloques `metadata` anidados (incluidas las
  asignaciones YAML de varias líneas) se aplanan en una cadena JSON y se vuelven
  a analizar como JSON5, por lo que funciona la forma de bloque que se muestra
  en [Filtrado](#gating). Use `{baseDir}` en el cuerpo para hacer referencia a
  la ruta de la carpeta de la skill.
</Note>

### Claves opcionales del frontmatter

<ParamField path="homepage" type="string">
  URL que se muestra como "Website" en la interfaz de Skills de macOS. También
  se admite mediante `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Cuando es `true`, la skill se expone como un comando de barra diagonal que
  puede invocar el usuario.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Cuando es `true`, OpenClaw mantiene las instrucciones de la skill fuera del
  prompt normal del agente. La skill sigue disponible como comando de barra
  diagonal cuando `user-invocable` también es `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Cuando se establece en `tool`, el comando de barra diagonal omite el modelo y
  se envía directamente a una herramienta registrada.
</ParamField>

<ParamField path="command-tool" type="string">
  Nombre de la herramienta que se debe invocar cuando se establece
  `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para el envío a herramientas, reenvía la cadena de argumentos sin procesar a
  la herramienta, sin análisis del núcleo. La herramienta recibe
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Filtrado

OpenClaw filtra las skills durante la carga mediante `metadata.openclaw` (un
objeto JSON5 incrustado en el frontmatter; consulte la nota de análisis
anterior). Una skill sin un bloque `metadata.openclaw` siempre es apta, salvo
que esté deshabilitada explícitamente.

```markdown
---
name: image-lab
description: Generar o editar imágenes mediante un flujo de trabajo de imágenes respaldado por un proveedor
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
  Cuando es `true`, siempre incluye la skill y omite todos los demás filtros.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji opcional que se muestra en la interfaz de Skills de macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL opcional que se muestra como "Website" en la interfaz de Skills de macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Filtro de plataforma. Cuando se establece, la skill solo es apta en uno de
  los sistemas operativos enumerados.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Cada binario debe existir en `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Al menos un binario debe existir en `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Cada variable de entorno debe existir en el proceso o proporcionarse mediante
  la configuración.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Cada ruta de `openclaw.json` debe tener un valor verdadero.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nombre de la variable de entorno asociada con
  `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Especificaciones opcionales del instalador utilizadas por la interfaz de
  Skills de macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Los bloques heredados `metadata.clawdbot` todavía se aceptan cuando
  `metadata.openclaw` está ausente, de modo que las skills instaladas
  anteriormente conserven sus filtros de dependencias y sugerencias del
  instalador. Las skills nuevas deben usar `metadata.openclaw`.
</Note>

### Especificaciones del instalador

Las especificaciones del instalador indican a la interfaz de Skills de macOS
cómo instalar una dependencia:

```markdown
---
name: gemini
description: Usar la CLI de Gemini para asistencia de programación y consultas de búsqueda en Google.
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
              "label": "Instalar la CLI de Gemini (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Reglas de selección del instalador">
    - Cuando se enumeran varios instaladores, el Gateway elige una opción
      preferida (brew cuando está disponible; de lo contrario, node).
    - Si todos los instaladores son `download`, OpenClaw enumera cada entrada
      para que pueda ver todos los artefactos disponibles.
    - Las especificaciones pueden incluir `os: ["darwin"|"linux"|"win32"]` para
      filtrar por plataforma.
    - Las instalaciones de Node respetan `skills.install.nodeManager` en
      `openclaw.json` (valor predeterminado: npm; opciones: npm / pnpm / yarn /
      bun). Esto solo afecta a las instalaciones de skills; el entorno de
      ejecución del Gateway debe seguir siendo Node.
    - Preferencia de instaladores del Gateway: Homebrew → uv → gestor de node
      configurado → go → download.
  </Accordion>
  <Accordion title="Detalles por instalador">
    - **Homebrew:** OpenClaw no instala automáticamente Homebrew ni convierte
      las fórmulas de brew en comandos de paquetes del sistema. En contenedores
      Linux sin `brew`, se ocultan los instaladores que solo usan brew; utilice
      una imagen personalizada o instale la dependencia manualmente.
    - **Go:** OpenClaw requiere Go 1.21 o posterior para las instalaciones
      automáticas de skills. Si falta `go` y Homebrew está disponible, OpenClaw
      instala primero Go mediante Homebrew; en Linux sin Homebrew, puede usar
      `apt-get` como root o mediante `sudo` sin contraseña cuando el candidato
      actualizado de `golang-go` cumple la versión mínima. El comando
      `go install` real para la dependencia siempre apunta a un directorio de
      binarios dedicado administrado por OpenClaw (el directorio `bin` de
      Homebrew en una instalación nueva; en caso contrario, `~/.local/bin`) en
      lugar del `GOBIN` configurado; las variables de entorno propias `GOBIN`,
      `GOPATH` y `GOTOOLCHAIN` se leen, pero nunca se sobrescriben.
    - **Descarga:** `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` |
      `zip`), `extract` (valor predeterminado: automático cuando se detecta un
      archivo), `stripComponents`, `targetDir` (valor predeterminado:
      `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Notas sobre el aislamiento">
    `requires.bins` se comprueba en el **host** durante la carga de la skill. Si
    un agente se ejecuta en un entorno aislado, el binario también debe existir
    **dentro del contenedor**. Instálelo mediante
    `agents.defaults.sandbox.docker.setupCommand` o una imagen personalizada.
    `setupCommand` se ejecuta una vez después de crear el contenedor y requiere
    acceso de salida a la red, un sistema de archivos raíz con permisos de
    escritura y un usuario root en el entorno aislado.
  </Accordion>
</AccordionGroup>

## Anulaciones de configuración

Active y configure las skills incluidas o administradas en `skills.entries`
dentro de `~/.openclaw/openclaw.json`:

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
  `false` deshabilita la skill incluso cuando está incluida o instalada. La
  skill incluida `coding-agent` requiere activación explícita: establezca
  `skills.entries.coding-agent.enabled: true` y asegúrese de que `claude`,
  `codex`, `opencode` u otra CLI compatible esté instalada y autenticada.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo práctico para las skills que declaran
  `metadata.openclaw.primaryEnv`. Admite una cadena de texto sin formato o un
  objeto SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variables de entorno inyectadas para la ejecución del agente. Solo se
  inyectan cuando la variable aún no está establecida en el proceso.
</ParamField>

<ParamField path="config" type="object">
  Contenedor opcional para campos de configuración personalizados por skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Lista de permitidas opcional únicamente para las skills **incluidas**. Cuando
  se establece, solo son aptas las skills incluidas que figuran en la lista.
  Las skills administradas y del espacio de trabajo no se ven afectadas.
</ParamField>

<Note>
  De forma predeterminada, las claves de configuración coinciden con el
  **nombre de la skill**. Si una skill define
  `metadata.openclaw.skillKey`, use esa clave en `skills.entries`. Escriba
  entre comillas los nombres con guiones: JSON5 permite claves entre comillas.
</Note>

## Inyección del entorno

Cuando se inicia una ejecución del agente, OpenClaw:

<Steps>
  <Step title="Lee los metadatos de las skills">
    OpenClaw resuelve la lista efectiva de skills para el agente y aplica las
    reglas de filtrado, las listas de permitidas y las anulaciones de
    configuración.
  </Step>
  <Step title="Inyecta variables de entorno y claves de API">
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
  La inyección de variables de entorno se limita a la ejecución del agente en
  el **host**, no al entorno aislado. Dentro de un entorno aislado, `env` y
  `apiKey` no tienen efecto. Consulte
  [Configuración de Skills](/es/tools/skills-config#sandboxed-skills-and-env-vars)
  para saber cómo pasar secretos a ejecuciones aisladas.
</Warning>

Para el backend incluido `claude-cli`, OpenClaw también materializa la misma
instantánea de skills aptas como un plugin temporal de Claude Code y la pasa
mediante `--plugin-dir`. Los demás backends de CLI solo utilizan el catálogo
del prompt.

## Instantáneas y actualización

OpenClaw captura una instantánea de las skills aptas **cuando se inicia una
sesión** y reutiliza esa lista en todos los turnos posteriores de la sesión.
Los cambios en las skills o en la configuración surten efecto en la siguiente
sesión nueva.

Las skills se actualizan durante la sesión en dos casos:

- El observador de skills detecta un cambio en `SKILL.md`.
- Se conecta un nuevo nodo remoto apto.

La lista actualizada se utiliza en el siguiente turno del agente. Si cambia la
lista de permitidas efectiva del agente, OpenClaw actualiza la instantánea para
mantener alineadas las skills visibles.

<AccordionGroup>
  <Accordion title="Observador de skills">
    De forma predeterminada, OpenClaw observa las carpetas de skills y actualiza
    la instantánea cuando cambian los archivos `SKILL.md`. Configure esta
    función en `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // valor predeterminado
          watchDebounceMs: 250, // valor predeterminado
        },
      },
    }
    ```

    Use `allowSymlinkTargets` para disposiciones intencionadas con enlaces
    simbólicos en las que un enlace simbólico de la raíz de una skill apunte
    fuera de la raíz configurada, por ejemplo,
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Active `skills.workshop.allowSymlinkTargetWrites` únicamente cuando Skill
    Workshop también deba aplicar propuestas a través de esas rutas de enlaces
    simbólicos de confianza.

  </Accordion>
  <Accordion title="Nodos macOS remotos (Gateway Linux)">
    Si el Gateway se ejecuta en Linux, pero hay un **nodo macOS** conectado con
    `system.run` permitido, OpenClaw puede considerar aptas las skills
    exclusivas de macOS cuando los binarios necesarios estén presentes en ese
    nodo. El agente debe ejecutar esas skills mediante la herramienta `exec`
    con `host=node`.

    Los nodos sin conexión **no** hacen visibles las skills exclusivamente
    remotas. Si un nodo deja de responder a los sondeos de binarios, OpenClaw
    borra las coincidencias de binarios almacenadas en caché.

  </Accordion>
</AccordionGroup>

## Impacto en los tokens

Cuando hay skills aptas, OpenClaw inyecta un bloque XML compacto en el prompt
del sistema. El coste es determinista y aumenta linealmente por skill:

- **Sobrecarga base** (solo cuando hay 1 o más skills aptas): un bloque fijo de
  texto introductorio más el contenedor `<available_skills>`.
- **Por skill:** ~97 caracteres + las longitudes de los campos `name`,
  `description` y `location`.
- El escape de XML expande `& < > " '` a entidades, lo que añade algunos
  caracteres por aparición.
- Con ~4 caracteres/token, 97 caracteres ≈ 24 tokens por skill antes de las
  longitudes de los campos.

Si el bloque renderizado superara el presupuesto configurado para el prompt
(`skills.limits.maxSkillsPromptChars`), OpenClaw primero conserva tantas
identidades de Skills (nombre, ubicación y versión) como permita el formato
compacto sin descripciones. A continuación, utiliza el presupuesto restante
para descripciones abreviadas. Si no queda presupuesto para descripciones, se
omiten. El prompt incluye una nota que remite a `openclaw skills check` siempre
que se requiere el formato compacto o el truncamiento de la lista.

Mantenga las descripciones breves y descriptivas para minimizar la sobrecarga del prompt.

## Relacionado

<CardGroup cols={2}>
  <Card title="Creación de Skills" href="/es/tools/creating-skills" icon="hammer">
    Guía paso a paso para crear una Skill personalizada.
  </Card>
  <Card title="Taller de Skills" href="/es/tools/skill-workshop" icon="flask">
    Cola de propuestas de Skills redactadas por agentes.
  </Card>
  <Card title="Configuración de Skills" href="/es/tools/skills-config" icon="gear">
    Esquema de configuración completo de `skills.*` y listas de permitidos para agentes.
  </Card>
  <Card title="Comandos de barra" href="/es/tools/slash-commands" icon="terminal">
    Cómo se registran y enrutan los comandos de barra de las Skills.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Explore y publique Skills en el registro público.
  </Card>
  <Card title="Plugins" href="/es/tools/plugin" icon="plug">
    Los Plugins pueden incluir Skills junto con las herramientas que documentan.
  </Card>
</CardGroup>
