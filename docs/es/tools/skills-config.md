---
read_when:
    - Agregar o modificar la configuración de Skills
    - Ajustar la allowlist integrada o el comportamiento de instalación
summary: Esquema de configuración de Skills y ejemplos
title: Configuración de Skills
x-i18n:
    generated_at: "2026-04-21T05:19:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# Configuración de Skills

La mayor parte de la configuración de carga/instalación de Skills vive bajo `skills` en
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime sigue siendo Node; bun no se recomienda)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // o string en texto plano
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
más la herramienta central `image_generate`. `skills.entries.*` es solo para flujos de Skills personalizados o
de terceros.

Si seleccionas un proveedor/modelo de imagen específico, configura también la
autenticación/clave de API de ese proveedor. Ejemplos típicos: `GEMINI_API_KEY` o `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*` y `FAL_KEY` para `fal/*`.

Ejemplos:

- Configuración nativa tipo Nano Banana: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Configuración nativa de fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlists de Skills por agente

Usa la configuración del agente cuando quieras las mismas raíces de Skills de máquina/espacio de trabajo, pero un
conjunto visible de Skills distinto por agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // hereda los predeterminados -> github, weather
      { id: "docs", skills: ["docs-search"] }, // reemplaza los predeterminados
      { id: "locked-down", skills: [] }, // sin Skills
    ],
  },
}
```

Reglas:

- `agents.defaults.skills`: allowlist base compartida para agentes que omiten
  `agents.list[].skills`.
- Omite `agents.defaults.skills` para dejar las Skills sin restricciones por defecto.
- `agents.list[].skills`: conjunto final explícito de Skills para ese agente; no
  se combina con los predeterminados.
- `agents.list[].skills: []`: no expone ninguna Skills para ese agente.

## Campos

- Las raíces de Skills integradas siempre incluyen `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` y `<workspace>/skills`.
- `allowBundled`: allowlist opcional solo para Skills **integradas**. Cuando se configura, solo
  las Skills integradas de la lista son elegibles (las Skills administradas, del agente y del espacio de trabajo no se ven afectadas).
- `load.extraDirs`: directorios de Skills adicionales para escanear (precedencia más baja).
- `load.watch`: vigilar carpetas de Skills y actualizar la instantánea de Skills (predeterminado: true).
- `load.watchDebounceMs`: debounce para eventos del watcher de Skills en milisegundos (predeterminado: 250).
- `install.preferBrew`: preferir instaladores brew cuando estén disponibles (predeterminado: true).
- `install.nodeManager`: preferencia del instalador de Node (`npm` | `pnpm` | `yarn` | `bun`, predeterminado: npm).
  Esto solo afecta a las **instalaciones de Skills**; el runtime del Gateway debe seguir siendo Node
  (Bun no se recomienda para WhatsApp/Telegram).
  - `openclaw setup --node-manager` es más acotado y actualmente acepta `npm`,
    `pnpm` o `bun`. Configura `skills.install.nodeManager: "yarn"` manualmente si
    quieres instalaciones de Skills respaldadas por Yarn.
- `entries.<skillKey>`: sobrescrituras por Skills.
- `agents.defaults.skills`: allowlist predeterminada opcional de Skills heredada por agentes
  que omiten `agents.list[].skills`.
- `agents.list[].skills`: allowlist final opcional de Skills por agente; las listas explícitas
  reemplazan los predeterminados heredados en lugar de combinarse.

Campos por Skills:

- `enabled`: configura `false` para deshabilitar una Skills aunque esté integrada/instalada.
- `env`: variables de entorno inyectadas para la ejecución del agente (solo si aún no están configuradas).
- `apiKey`: conveniencia opcional para Skills que declaran una variable principal de entorno.
  Admite string en texto plano u objeto SecretRef (`{ source, provider, id }`).

## Notas

- Las claves bajo `entries` se asignan al nombre de la Skills por defecto. Si una Skills define
  `metadata.openclaw.skillKey`, usa esa clave en su lugar.
- La precedencia de carga es `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills integradas →
  `skills.load.extraDirs`.
- Los cambios en Skills se aplican en el siguiente turno del agente cuando el watcher está habilitado.

### Skills con sandbox + variables de entorno

Cuando una sesión está **en sandbox**, los procesos de Skills se ejecutan dentro del
backend sandbox configurado. El sandbox **no** hereda el `process.env` del host.

Usa una de estas opciones:

- `agents.defaults.sandbox.docker.env` para el backend Docker (o `agents.list[].sandbox.docker.env` por agente)
- incorpora las variables de entorno en tu imagen sandbox personalizada o en el entorno sandbox remoto

`env` global y `skills.entries.<skill>.env/apiKey` se aplican solo a ejecuciones en el **host**.
