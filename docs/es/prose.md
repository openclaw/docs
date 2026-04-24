---
read_when:
    - Quieres ejecutar o escribir flujos de trabajo `.prose`
    - Quieres habilitar el Plugin de OpenProse
    - Necesitas entender el almacenamiento del estado
summary: 'OpenProse: flujos de trabajo `.prose`, comandos de barra y estado en OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T05:43:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse es un formato portátil de flujos de trabajo, orientado a Markdown, para orquestar sesiones de IA. En OpenClaw se distribuye como un Plugin que instala un paquete de Skills de OpenProse más un comando de barra `/prose`. Los programas viven en archivos `.prose` y pueden generar varios subagentes con un flujo de control explícito.

Sitio oficial: [https://www.prose.md](https://www.prose.md)

## Qué puede hacer

- Investigación + síntesis multiagente con paralelismo explícito.
- Flujos de trabajo repetibles y seguros con aprobación (revisión de código, triaje de incidentes, canalizaciones de contenido).
- Programas `.prose` reutilizables que puedes ejecutar en los runtimes de agente compatibles.

## Instalar + habilitar

Los Plugins incluidos están desactivados de forma predeterminada. Habilita OpenProse:

```bash
openclaw plugins enable open-prose
```

Reinicia el Gateway después de habilitar el Plugin.

Copia local/de desarrollo: `openclaw plugins install ./path/to/local/open-prose-plugin`

Documentación relacionada: [Plugins](/es/tools/plugin), [Manifiesto de Plugin](/es/plugins/manifest), [Skills](/es/tools/skills).

## Comando de barra

OpenProse registra `/prose` como un comando de Skill invocable por el usuario. Enruta a las instrucciones de la VM de OpenProse y usa herramientas de OpenClaw internamente.

Comandos comunes:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Ejemplo: un archivo `.prose` simple

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## Ubicaciones de archivos

OpenProse mantiene el estado en `.prose/` dentro de tu espacio de trabajo:

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Los agentes persistentes a nivel de usuario viven en:

```text
~/.prose/agents/
```

## Modos de estado

OpenProse admite varios backends de estado:

- **filesystem** (predeterminado): `.prose/runs/...`
- **in-context**: transitorio, para programas pequeños
- **sqlite** (experimental): requiere el binario `sqlite3`
- **postgres** (experimental): requiere `psql` y una cadena de conexión

Notas:

- sqlite/postgres son experimentales y requieren activación explícita.
- Las credenciales de postgres fluyen a los registros de subagentes; usa una base de datos dedicada con los mínimos privilegios.

## Programas remotos

`/prose run <handle/slug>` se resuelve como `https://p.prose.md/<handle>/<slug>`.
Las URL directas se obtienen tal cual. Esto usa la herramienta `web_fetch` (o `exec` para POST).

## Asignación al runtime de OpenClaw

Los programas OpenProse se asignan a primitivas de OpenClaw:

| Concepto de OpenProse       | Herramienta de OpenClaw |
| --------------------------- | ----------------------- |
| Generar sesión / herramienta Task | `sessions_spawn`   |
| Lectura/escritura de archivos | `read` / `write`      |
| Obtención web               | `web_fetch`            |

Si tu lista de permitidos de herramientas bloquea estas herramientas, los programas de OpenProse fallarán. Consulta [Configuración de Skills](/es/tools/skills-config).

## Seguridad + aprobaciones

Trata los archivos `.prose` como código. Revísalos antes de ejecutarlos. Usa listas de permitidos de herramientas y barreras de aprobación de OpenClaw para controlar los efectos secundarios.

Para flujos de trabajo deterministas y controlados por aprobación, compáralo con [Lobster](/es/tools/lobster).

## Relacionado

- [Texto a voz](/es/tools/tts)
- [Formato Markdown](/es/concepts/markdown-formatting)
