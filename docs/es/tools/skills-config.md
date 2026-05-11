---
read_when:
    - Agregar o modificar la configuración de Skills
    - Ajuste de la lista de permitidos incluida o del comportamiento de instalación
summary: Esquema de configuración y ejemplos de Skills
title: Configuración de Skills
x-i18n:
    generated_at: "2026-05-11T20:57:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

La mayor parte de la configuración del cargador/de instalación de Skills vive bajo `skills` en
`~/.openclaw/openclaw.json`. La visibilidad de Skills específica de cada agente vive bajo
`agents.defaults.skills` y `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
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
junto con la herramienta central `image_generate`. `skills.entries.*` es solo para flujos de trabajo
de Skills personalizados o de terceros.

Si seleccionas un proveedor/modelo de imagen específico, configura también la clave
de autenticación/API de ese proveedor. Ejemplos típicos: `GEMINI_API_KEY` o `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*`, y `FAL_KEY` para `fal/*`.

Ejemplos:

- Configuración nativa de estilo Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuración nativa de fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listas de permitidos de Skills de agentes

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

- `agents.defaults.skills`: lista base compartida de permitidos para agentes que omiten
  `agents.list[].skills`.
- Omite `agents.defaults.skills` para dejar Skills sin restricciones de forma predeterminada.
- `agents.list[].skills`: conjunto final explícito de Skills para ese agente; no se
  combina con los valores predeterminados.
- `agents.list[].skills: []`: no expone ningún Skill para ese agente.

## Campos

- Las raíces de Skills integradas siempre incluyen `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, y `<workspace>/skills`.
- `allowBundled`: lista opcional de permitidos solo para Skills **incluidos**. Cuando se establece, solo
  son elegibles los Skills incluidos en la lista (los Skills gestionados, de agente y de espacio de trabajo no se ven afectados).
- `load.extraDirs`: directorios adicionales de Skills que escanear (precedencia más baja).
- `load.allowSymlinkTargets`: directorios de destino reales y confiables en los que las carpetas
  de Skills enlazadas simbólicamente pueden resolverse incluso cuando el enlace simbólico vive fuera de esa
  raíz de destino. Usa esto para diseños intencionales de repositorios hermanos, como
  `~/.agents/skills/manager -> ~/Projects/manager/skills`.
- `load.watch`: vigila las carpetas de Skills y actualiza la instantánea de Skills (predeterminado: true).
- `load.watchDebounceMs`: antirrebote para eventos del vigilante de Skills en milisegundos (predeterminado: 250).
- `install.preferBrew`: prefiere instaladores de brew cuando estén disponibles (predeterminado: true).
- `install.nodeManager`: preferencia del instalador de Node (`npm` | `pnpm` | `yarn` | `bun`, predeterminado: npm).
  Esto solo afecta a las **instalaciones de Skills**; el runtime del Gateway debe seguir siendo Node
  (Bun no se recomienda para WhatsApp/Telegram).
  - `openclaw setup --node-manager` es más limitado y actualmente acepta `npm`,
    `pnpm`, o `bun`. Establece `skills.install.nodeManager: "yarn"` manualmente si
    quieres instalaciones de Skills respaldadas por Yarn.
- `install.allowUploadedArchives`: permite que clientes Gateway `operator.admin` confiables
  instalen archivos zip privados preparados mediante `skills.upload.*`
  (predeterminado: false). Esto solo habilita la ruta de archivos subidos; las instalaciones normales de ClawHub
  no lo requieren.
- `entries.<skillKey>`: sobrescrituras por Skill.
- `agents.defaults.skills`: lista opcional predeterminada de permitidos de Skills heredada por agentes
  que omiten `agents.list[].skills`.
- `agents.list[].skills`: lista final opcional de permitidos por agente; las
  listas explícitas reemplazan los valores predeterminados heredados en lugar de combinarse.

## Repositorios hermanos enlazados simbólicamente

De forma predeterminada, cada raíz de Skills es un límite de contención. Si una carpeta de Skill bajo
`~/.agents/skills` es un enlace simbólico que se resuelve fuera de `~/.agents/skills`,
OpenClaw la omite y registra `Skipping escaped skill path outside its configured
root`.

Mantén el diseño con enlace simbólico y permite solo la raíz de destino confiable:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Con esta configuración, se acepta un enlace simbólico como
`~/.agents/skills/manager -> ~/Projects/manager/skills` después de la
resolución de realpath. `extraDirs` también escanea el repositorio hermano directamente, mientras que
`allowSymlinkTargets` conserva la ruta enlazada simbólicamente para diseños existentes de Skills de agente.
Mantén las entradas de destino acotadas; no apuntes a raíces amplias como `~` o
`~/Projects` a menos que cada árbol de Skills bajo esa raíz sea confiable.

Campos por Skill:

- `enabled`: establece `false` para deshabilitar un Skill incluso si está incluido/instalado.
- `env`: variables de entorno inyectadas para la ejecución del agente (solo si aún no están definidas).
- `apiKey`: comodidad opcional para Skills que declaran una variable de entorno principal.
  Admite cadena de texto sin formato u objeto SecretRef (`{ source, provider, id }`).

## Notas

- Las claves bajo `entries` se asignan al nombre del Skill de forma predeterminada. Si un Skill define
  `metadata.openclaw.skillKey`, usa esa clave en su lugar.
- La precedencia de carga es `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills incluidos →
  `skills.load.extraDirs`.
- Los cambios en Skills se recogen en el siguiente turno del agente cuando el vigilante está habilitado.

### Skills en sandbox y variables de entorno

Cuando una sesión está **en sandbox**, los procesos de Skills se ejecutan dentro del backend de sandbox configurado. El sandbox **no** hereda el `process.env` del host.

<Warning>
  `env` global y `skills.entries.<skill>.env`/`apiKey` se aplican solo a ejecuciones en el **host**. Dentro de un sandbox no tienen efecto, por lo que un Skill que dependa de `GEMINI_API_KEY` fallará con `apiKey not configured` a menos que se entregue la variable al sandbox por separado.
</Warning>

Usa una de estas opciones:

- `agents.defaults.sandbox.docker.env` para el backend Docker (o `agents.list[].sandbox.docker.env` por agente).
- Integra la variable de entorno en tu imagen de sandbox personalizada o en el entorno de sandbox remoto.

## Relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/es/tools/skills" icon="puzzle-piece">
    Qué son los Skills y cómo se cargan.
  </Card>
  <Card title="Creating skills" href="/es/tools/creating-skills" icon="hammer">
    Creación de paquetes de Skills personalizados.
  </Card>
  <Card title="Slash commands" href="/es/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos y directivas de chat.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de `skills` y `agents.skills`.
  </Card>
</CardGroup>
