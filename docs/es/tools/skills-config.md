---
read_when:
    - Agregar o modificar la configuración de Skills
    - Ajustar la lista de permitidos incluida o el comportamiento de instalación
summary: Esquema de configuración de Skills y ejemplos
title: Configuración de Skills
x-i18n:
    generated_at: "2026-05-06T09:07:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

La mayor parte de la configuración de carga/instalación de Skills vive bajo `skills` en
`~/.openclaw/openclaw.json`. La visibilidad de Skills específica del agente vive bajo
`agents.defaults.skills` y `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Para la generación/edición de imágenes integrada, prefiere `agents.defaults.imageGenerationModel`
más la herramienta principal `image_generate`. `skills.entries.*` es solo para flujos de trabajo de Skills personalizados o
de terceros.

Si seleccionas un proveedor/modelo de imagen específico, configura también la
autenticación/clave de API de ese proveedor. Ejemplos típicos: `GEMINI_API_KEY` o `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*`, y `FAL_KEY` para `fal/*`.

Ejemplos:

- Configuración nativa estilo Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuración nativa de fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listas de permitidos de Skills de agente

Usa la configuración del agente cuando quieras las mismas raíces de Skills de máquina/área de trabajo, pero un
conjunto visible de Skills distinto por agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Reglas:

- `agents.defaults.skills`: lista de permitidos base compartida para agentes que omiten
  `agents.list[].skills`.
- Omite `agents.defaults.skills` para dejar Skills sin restricciones de forma predeterminada.
- `agents.list[].skills`: conjunto final explícito de Skills para ese agente; no se
  combina con los valores predeterminados.
- `agents.list[].skills: []`: no expone ninguna Skill para ese agente.

## Campos

- Las raíces de Skills integradas siempre incluyen `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, y `<workspace>/skills`.
- `allowBundled`: lista de permitidos opcional solo para Skills **incluidas**. Cuando se define, solo
  las Skills incluidas en la lista son elegibles (Skills administradas, de agente y de área de trabajo no afectadas).
- `load.extraDirs`: directorios de Skills adicionales para escanear (menor precedencia).
- `load.watch`: vigila carpetas de Skills y actualiza la instantánea de Skills (predeterminado: true).
- `load.watchDebounceMs`: debounce para eventos del vigilante de Skills en milisegundos (predeterminado: 250).
- `install.preferBrew`: prefiere instaladores de brew cuando estén disponibles (predeterminado: true).
- `install.nodeManager`: preferencia de instalador de node (`npm` | `pnpm` | `yarn` | `bun`, predeterminado: npm).
  Esto solo afecta a **instalaciones de Skills**; el runtime del Gateway debe seguir siendo Node
  (Bun no recomendado para WhatsApp/Telegram).
  - `openclaw setup --node-manager` es más específico y actualmente acepta `npm`,
    `pnpm`, o `bun`. Define `skills.install.nodeManager: "yarn"` manualmente si
    quieres instalaciones de Skills respaldadas por Yarn.
- `entries.<skillKey>`: sobrescrituras por Skill.
- `agents.defaults.skills`: lista de permitidos de Skills predeterminada opcional heredada por agentes
  que omiten `agents.list[].skills`.
- `agents.list[].skills`: lista de permitidos final opcional por agente; las listas explícitas
  reemplazan los valores predeterminados heredados en lugar de combinarse.

Campos por Skill:

- `enabled`: define `false` para desactivar una Skill incluso si está incluida/instalada.
- `env`: variables de entorno inyectadas para la ejecución del agente (solo si aún no están definidas).
- `apiKey`: comodidad opcional para Skills que declaran una variable de entorno principal.
  Admite cadena de texto sin formato u objeto SecretRef (`{ source, provider, id }`).

## Notas

- Las claves bajo `entries` se asignan al nombre de la Skill de forma predeterminada. Si una Skill define
  `metadata.openclaw.skillKey`, usa esa clave en su lugar.
- La precedencia de carga es `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills incluidas →
  `skills.load.extraDirs`.
- Los cambios en Skills se recogen en el siguiente turno del agente cuando el vigilante está activado.

### Skills en sandbox y variables de entorno

Cuando una sesión está **en sandbox**, los procesos de Skills se ejecutan dentro del backend de sandbox configurado. El sandbox **no** hereda el `process.env` del host.

<Warning>
  `env` global y `skills.entries.<skill>.env`/`apiKey` solo se aplican a ejecuciones del **host**. Dentro de un sandbox no tienen efecto, por lo que una Skill que depende de `GEMINI_API_KEY` fallará con `apiKey not configured` a menos que la variable se proporcione al sandbox por separado.
</Warning>

Usa una de estas opciones:

- `agents.defaults.sandbox.docker.env` para el backend Docker (o `agents.list[].sandbox.docker.env` por agente).
- Incorpora las variables de entorno en tu imagen de sandbox personalizada o entorno de sandbox remoto.

## Relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/es/tools/skills" icon="puzzle-piece">
    Qué son las Skills y cómo se cargan.
  </Card>
  <Card title="Crear Skills" href="/es/tools/creating-skills" icon="hammer">
    Creación de paquetes de Skills personalizados.
  </Card>
  <Card title="Comandos slash" href="/es/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos y directivas de chat.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de `skills` y `agents.skills`.
  </Card>
</CardGroup>
