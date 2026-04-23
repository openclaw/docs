---
read_when:
    - Añadir o modificar la configuración de Skills
    - Ajustar la lista de permitidos agrupada o el comportamiento de instalación
summary: Esquema de configuración de Skills y ejemplos
title: Configuración de Skills
x-i18n:
    generated_at: "2026-04-23T14:08:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# Configuración de Skills

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
más la herramienta principal `image_generate`. `skills.entries.*` es solo para flujos de trabajo de Skills personalizados o de terceros.

Si seleccionas un proveedor/modelo de imagen específico, configura también la
autenticación/clave API de ese proveedor. Ejemplos típicos: `GEMINI_API_KEY` o `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*` y `FAL_KEY` para `fal/*`.

Ejemplos:

- Configuración nativa estilo Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuración nativa de fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listas de permitidos de Skills por agente

Usa la configuración del agente cuando quieras las mismas raíces de Skills de máquina/espacio de trabajo, pero un
conjunto visible distinto de Skills por agente.

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
- Omite `agents.defaults.skills` para dejar Skills sin restringir de forma predeterminada.
- `agents.list[].skills`: conjunto final explícito de Skills para ese agente; no
  se fusiona con los valores predeterminados.
- `agents.list[].skills: []`: no expone ninguna Skill para ese agente.

## Campos

- Las raíces integradas de Skills siempre incluyen `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` y `<workspace>/skills`.
- `allowBundled`: lista de permitidos opcional solo para Skills **agrupadas**. Cuando se establece, solo
  las Skills agrupadas de la lista son elegibles (las Skills gestionadas, del agente y del espacio de trabajo no se ven afectadas).
- `load.extraDirs`: directorios adicionales de Skills que se deben explorar (precedencia más baja).
- `load.watch`: observar carpetas de Skills y actualizar la instantánea de Skills (predeterminado: true).
- `load.watchDebounceMs`: debounce para eventos del observador de Skills en milisegundos (predeterminado: 250).
- `install.preferBrew`: preferir instaladores brew cuando estén disponibles (predeterminado: true).
- `install.nodeManager`: preferencia de instalador de Node (`npm` | `pnpm` | `yarn` | `bun`, predeterminado: npm).
  Esto solo afecta a las **instalaciones de Skills**; el entorno de ejecución del Gateway debe seguir siendo Node
  (Bun no se recomienda para WhatsApp/Telegram).
  - `openclaw setup --node-manager` es más limitado y actualmente acepta `npm`,
    `pnpm` o `bun`. Establece manualmente `skills.install.nodeManager: "yarn"` si
    quieres instalaciones de Skills respaldadas por Yarn.
- `entries.<skillKey>`: anulaciones por Skill.
- `agents.defaults.skills`: lista de permitidos predeterminada opcional de Skills heredada por los agentes
  que omiten `agents.list[].skills`.
- `agents.list[].skills`: lista de permitidos final opcional por agente para Skills; las listas explícitas
  reemplazan los valores predeterminados heredados en lugar de fusionarse.

Campos por Skill:

- `enabled`: establece `false` para deshabilitar una Skill incluso si está agrupada/instalada.
- `env`: variables de entorno inyectadas para la ejecución del agente (solo si no están ya establecidas).
- `apiKey`: comodidad opcional para Skills que declaran una variable de entorno principal.
  Admite cadena en texto plano u objeto SecretRef (`{ source, provider, id }`).

## Notas

- Las claves bajo `entries` se asignan al nombre de la Skill de forma predeterminada. Si una Skill define
  `metadata.openclaw.skillKey`, usa esa clave en su lugar.
- La precedencia de carga es `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills agrupadas →
  `skills.load.extraDirs`.
- Los cambios en Skills se recogen en el siguiente turno del agente cuando el observador está habilitado.

### Skills en entorno aislado + variables de entorno

Cuando una sesión está **en entorno aislado**, los procesos de Skills se ejecutan dentro del
backend de entorno aislado configurado. El entorno aislado **no** hereda `process.env` del host.

Usa una de estas opciones:

- `agents.defaults.sandbox.docker.env` para el backend de Docker (o `agents.list[].sandbox.docker.env` por agente)
- incorpora la variable de entorno en tu imagen personalizada de entorno aislado o en el entorno remoto de entorno aislado

`env` global y `skills.entries.<skill>.env/apiKey` se aplican solo a ejecuciones en el **host**.
