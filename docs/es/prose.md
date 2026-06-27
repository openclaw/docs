---
read_when:
    - Quieres ejecutar o escribir archivos de flujo de trabajo .prose
    - Quieres habilitar el plugin OpenProse
    - Necesitas entender cómo OpenProse se asigna a las primitivas de OpenClaw
sidebarTitle: OpenProse
summary: OpenProse es un formato de flujo de trabajo centrado en Markdown para sesiones de IA multiagente. En OpenClaw se distribuye como un Plugin con un comando de barra /prose y un paquete de Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T12:32:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse es un formato de flujo de trabajo portable, centrado en Markdown, para orquestar sesiones de IA. En OpenClaw se distribuye como un plugin que instala un paquete de skill de OpenProse y un comando de barra `/prose`. Los programas viven en archivos `.prose` y pueden iniciar varios subagentes con flujo de control explícito.

<CardGroup cols={3}>
  <Card title="Instalar" icon="download" href="#install">
    Habilita el plugin OpenProse y reinicia el Gateway.
  </Card>
  <Card title="Ejecutar un programa" icon="play" href="#slash-command">
    Usa `/prose run` para ejecutar un archivo `.prose` o un programa remoto.
  </Card>
  <Card title="Escribir programas" icon="pencil" href="#example">
    Crea flujos de trabajo multiagente con pasos paralelos y secuenciales.
  </Card>
</CardGroup>

## Instalar

<Steps>
  <Step title="Habilita el plugin">
    Los plugins incluidos están deshabilitados de forma predeterminada. Habilita OpenProse:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Reinicia el Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verifica">
    ```bash
    openclaw plugins list | grep prose
    ```

    Deberías ver `open-prose` como habilitado. El comando de skill `/prose` ahora
    está disponible en el chat.

  </Step>
</Steps>

Para un checkout local: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Comando de barra

OpenProse registra `/prose` como un comando de skill invocable por el usuario:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` se resuelve como `https://p.prose.md/<handle>/<slug>`.
Las URL directas se obtienen tal cual usando la herramienta `web_fetch`.

Las ejecuciones remotas de nivel superior son explícitas. Las importaciones remotas dentro de un programa `.prose` son dependencias de código transitivas: antes de que OpenProse obtenga cualquier destino remoto de `use`, muestra la lista de importaciones resueltas y requiere que el operador responda exactamente `approve remote prose imports` para esa ejecución.

## Qué puede hacer

- Investigación y síntesis multiagente con paralelismo explícito.
- Flujos de trabajo repetibles y seguros por aprobación (revisión de código, triaje de incidentes, pipelines de contenido).
- Programas `.prose` reutilizables que puedes ejecutar en los runtimes de agentes compatibles.

## Ejemplo: investigación y síntesis en paralelo

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

## Asignación al runtime de OpenClaw

Los programas de OpenProse se asignan a primitivas de OpenClaw:

| Concepto de OpenProse         | Herramienta de OpenClaw |
| ----------------------------- | ----------------------- |
| Iniciar sesión / herramienta Task | `sessions_spawn` |
| Lectura / escritura de archivos | `read` / `write` |
| Obtención web                 | `web_fetch`             |

<Warning>
  Si tu lista de herramientas permitidas bloquea `sessions_spawn`, `read`, `write` o
  `web_fetch`, los programas de OpenProse fallarán. Revisa tu
  [configuración de lista de herramientas permitidas](/es/gateway/config-tools).
</Warning>

## Ubicaciones de archivos

OpenProse mantiene el estado bajo `.prose/` en tu espacio de trabajo:

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

## Backends de estado

<AccordionGroup>
  <Accordion title="sistema de archivos (predeterminado)">
    El estado se escribe en `.prose/runs/...` dentro del espacio de trabajo. No se requieren
    dependencias adicionales.
  </Accordion>
  <Accordion title="en contexto">
    Estado transitorio mantenido en la ventana de contexto. Adecuado para programas
    pequeños y de corta duración.
  </Accordion>
  <Accordion title="sqlite (experimental)">
    Requiere el binario `sqlite3` en `PATH`.
  </Accordion>
  <Accordion title="postgres (experimental)">
    Requiere `psql` y una cadena de conexión.

    <Warning>
      Las credenciales de Postgres fluyen hacia los registros de subagentes. Usa una base de datos dedicada
      y con privilegios mínimos.
    </Warning>

  </Accordion>
</AccordionGroup>

## Seguridad

Trata los archivos `.prose` como código. Revísalos antes de ejecutarlos, incluidas las importaciones remotas de `use`. Las solicitudes `/prose run https://...` de nivel superior son explícitas, pero las importaciones remotas transitivas requieren aprobación por ejecución antes de obtenerse o ejecutarse. Usa las listas de herramientas permitidas y las puertas de aprobación de OpenClaw para controlar los efectos secundarios. Para flujos de trabajo deterministas con aprobación obligatoria, compáralo con [Lobster](/es/tools/lobster).

## Relacionado

<CardGroup cols={2}>
  <Card title="Referencia de Skills" href="/es/tools/skills" icon="puzzle-piece">
    Cómo se carga el paquete de skill de OpenProse y qué puertas se aplican.
  </Card>
  <Card title="Subagentes" href="/es/tools/subagents" icon="users">
    La capa nativa de coordinación multiagente de OpenClaw.
  </Card>
  <Card title="Texto a voz" href="/es/tools/tts" icon="volume-high">
    Añade salida de audio a tus flujos de trabajo.
  </Card>
  <Card title="Comandos de barra" href="/es/tools/slash-commands" icon="terminal">
    Todos los comandos de chat disponibles, incluido /prose.
  </Card>
</CardGroup>

Sitio oficial: [https://www.prose.md](https://www.prose.md)
