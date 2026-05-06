---
read_when:
    - Agregar o modificar la configuración de Skills
    - Ajustar la lista de permitidos incluida o el comportamiento de instalación
summary: Esquema de configuración y ejemplos de Skills
title: Configuración de Skills
x-i18n:
    generated_at: "2026-05-06T05:52:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1acfd34c7af3b8909187d77ae74c52656b5dcfa1abf42ca6a7fdb391854e5c7c
    source_path: tools/skills-config.md
    workflow: 16
---

La mayor parte de la configuración del cargador/instalación de Skills vive bajo `skills` en
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
junto con la herramienta principal `image_generate`. `skills.entries.*` es solo para flujos de trabajo de Skills personalizados o
de terceros.

Si seleccionas un proveedor/modelo de imagen específico, configura también la
autenticación/clave de API de ese proveedor. Ejemplos típicos: `GEMINI_API_KEY` o `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*` y `FAL_KEY` para `fal/*`.

Ejemplos:

- Configuración nativa estilo Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuración nativa de fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listas de permitidos de Skills del agente

Usa la configuración del agente cuando quieras las mismas raíces de Skills de máquina/espacio de trabajo, pero un
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
  `<workspace>/.agents/skills` y `<workspace>/skills`.
- `allowBundled`: lista de permitidos opcional solo para Skills **incluidas**. Cuando está configurada, solo
  las Skills incluidas en la lista son elegibles (las Skills gestionadas, del agente y del espacio de trabajo no se ven afectadas).
- `load.extraDirs`: directorios de Skills adicionales para escanear (precedencia más baja).
- `load.watch`: vigila las carpetas de Skills y actualiza la instantánea de Skills (predeterminado: true).
- `load.watchDebounceMs`: espera antirrebote para eventos del observador de Skills en milisegundos (predeterminado: 250).
- `install.preferBrew`: prefiere instaladores de brew cuando estén disponibles (predeterminado: true).
- `install.nodeManager`: preferencia de instalador de Node (`npm` | `pnpm` | `yarn` | `bun`, predeterminado: npm).
  Esto solo afecta a las **instalaciones de Skills**; el runtime de Gateway debe seguir siendo Node
  (Bun no recomendado para WhatsApp/Telegram).
  - `openclaw setup --node-manager` es más limitado y actualmente acepta `npm`,
    `pnpm` o `bun`. Configura `skills.install.nodeManager: "yarn"` manualmente si
    quieres instalaciones de Skills respaldadas por Yarn.
- `entries.<skillKey>`: sobrescrituras por Skill.
- `agents.defaults.skills`: lista de permitidos predeterminada opcional de Skills heredada por los agentes
  que omiten `agents.list[].skills`.
- `agents.list[].skills`: lista de permitidos final opcional de Skills por agente; las
  listas explícitas reemplazan los valores predeterminados heredados en lugar de combinarlos.

Campos por Skill:

- `enabled`: configura `false` para desactivar una Skill aunque esté incluida/instalada.
- `env`: variables de entorno inyectadas para la ejecución del agente (solo si aún no están configuradas).
- `apiKey`: comodidad opcional para Skills que declaran una variable de entorno principal.
  Admite una cadena de texto plano u objeto SecretRef (`{ source, provider, id }`).

## Notas

- Las claves bajo `entries` se asignan al nombre de la Skill de forma predeterminada. Si una Skill define
  `metadata.openclaw.skillKey`, usa esa clave en su lugar.
- La precedencia de carga es `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills incluidas →
  `skills.load.extraDirs`.
- Los cambios en Skills se recogen en el siguiente turno del agente cuando el observador está habilitado.

### Skills en sandbox y variables de entorno

Cuando una sesión está en **sandbox**, los procesos de Skills se ejecutan dentro del backend de sandbox configurado. El sandbox **no** hereda el `process.env` del host.

<Warning>
  `env` global y `skills.entries.<skill>.env`/`apiKey` se aplican solo a ejecuciones del **host**. Dentro de un sandbox no tienen efecto, por lo que una Skill que depende de `GEMINI_API_KEY` fallará con `apiKey not configured` a menos que se proporcione la variable al sandbox por separado.
</Warning>

Usa una de estas opciones:

- `agents.defaults.sandbox.docker.env` para el backend de Docker (o `agents.list[].sandbox.docker.env` por agente).
- Incorpora el env en tu imagen de sandbox personalizada o en el entorno de sandbox remoto.

## Relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/es/tools/skills" icon="puzzle-piece">
    Qué son las Skills y cómo se cargan.
  </Card>
  <Card title="Crear Skills" href="/es/tools/creating-skills" icon="hammer">
    Creación de paquetes de Skills personalizados.
  </Card>
  <Card title="Comandos de barra" href="/es/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos y directivas de chat.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de `skills` y `agents.skills`.
  </Card>
</CardGroup>
