---
read_when:
    - Añadiendo o modificando la configuración de Skills
    - Ajustando el comportamiento de la lista de permitidos incluida o de la instalación
summary: Esquema de configuración de Skills y ejemplos
title: Configuración de Skills
x-i18n:
    generated_at: "2026-04-24T05:55:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

La mayor parte de la configuración del cargador/instalación de Skills vive bajo `skills` en
`~/.openclaw/openclaw.json`. La visibilidad de Skills específica por agente vive bajo
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

Para generación/edición de imágenes integrada, prefiere `agents.defaults.imageGenerationModel`
más la herramienta core `image_generate`. `skills.entries.*` es solo para flujos
de trabajo de Skills personalizados o de terceros.

Si seleccionas un proveedor/modelo de imagen específico, configura también la
autenticación/clave API de ese proveedor. Ejemplos típicos: `GEMINI_API_KEY` o `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*` y `FAL_KEY` para `fal/*`.

Ejemplos:

- Configuración nativa estilo Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuración nativa de fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listas de permitidos de Skills por agente

Usa la configuración de agente cuando quieras las mismas raíces de Skills de máquina/espacio de trabajo, pero un
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
- Omite `agents.defaults.skills` para dejar las Skills sin restricciones por defecto.
- `agents.list[].skills`: conjunto final explícito de Skills para ese agente; no se
  fusiona con los valores predeterminados.
- `agents.list[].skills: []`: no expone ninguna Skill para ese agente.

## Campos

- Las raíces de Skills integradas siempre incluyen `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` y `<workspace>/skills`.
- `allowBundled`: lista de permitidos opcional solo para Skills **incluidas**. Cuando está configurada, solo
  las Skills incluidas presentes en la lista son elegibles (las Skills gestionadas, del agente y del espacio de trabajo no se ven afectadas).
- `load.extraDirs`: directorios adicionales de Skills para analizar (prioridad más baja).
- `load.watch`: observa las carpetas de Skills y actualiza la instantánea de Skills (predeterminado: true).
- `load.watchDebounceMs`: debounce para eventos del watcher de Skills en milisegundos (predeterminado: 250).
- `install.preferBrew`: preferir instaladores brew cuando estén disponibles (predeterminado: true).
- `install.nodeManager`: preferencia del instalador de node (`npm` | `pnpm` | `yarn` | `bun`, predeterminado: npm).
  Esto solo afecta a las **instalaciones de Skills**; el entorno de ejecución del Gateway debería seguir siendo Node
  (Bun no se recomienda para WhatsApp/Telegram).
  - `openclaw setup --node-manager` es más limitado y actualmente acepta `npm`,
    `pnpm` o `bun`. Establece `skills.install.nodeManager: "yarn"` manualmente si
    quieres instalaciones de Skills respaldadas por Yarn.
- `entries.<skillKey>`: anulaciones por Skill.
- `agents.defaults.skills`: lista de permitidos predeterminada opcional de Skills heredada por agentes
  que omiten `agents.list[].skills`.
- `agents.list[].skills`: lista de permitidos final opcional por agente; las listas explícitas sustituyen
  los valores predeterminados heredados en lugar de fusionarse.

Campos por Skill:

- `enabled`: establece `false` para deshabilitar una Skill incluso si está incluida/instalada.
- `env`: variables de entorno inyectadas para la ejecución del agente (solo si aún no están configuradas).
- `apiKey`: comodidad opcional para Skills que declaran una variable de entorno principal.
  Admite cadena en texto sin formato u objeto SecretRef (`{ source, provider, id }`).

## Notas

- Las claves bajo `entries` se asignan al nombre de la Skill por defecto. Si una Skill define
  `metadata.openclaw.skillKey`, usa esa clave en su lugar.
- La prioridad de carga es `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills incluidas →
  `skills.load.extraDirs`.
- Los cambios en Skills se recogen en el siguiente turno del agente cuando el watcher está habilitado.

### Skills en sandbox + variables de entorno

Cuando una sesión está en **sandbox**, los procesos de Skill se ejecutan dentro del
backend sandbox configurado. El sandbox **no** hereda el `process.env` del host.

Usa una de estas opciones:

- `agents.defaults.sandbox.docker.env` para el backend Docker (o `agents.list[].sandbox.docker.env` por agente)
- incorporar el entorno en tu imagen sandbox personalizada o en el entorno sandbox remoto

`env` global y `skills.entries.<skill>.env/apiKey` se aplican solo a ejecuciones en el **host**.

## Relacionado

- [Skills](/es/tools/skills)
- [Creación de Skills](/es/tools/creating-skills)
- [Comandos slash](/es/tools/slash-commands)
