---
read_when:
    - Quieres ejecutar o escribir archivos de flujo de trabajo `.prose`
    - Quieres habilitar el plugin OpenProse
    - Debes comprender cómo OpenProse se corresponde con las primitivas de OpenClaw
sidebarTitle: OpenProse
summary: OpenProse es un formato de flujo de trabajo basado en Markdown para sesiones de IA multiagente. En OpenClaw se distribuye como un Plugin con el comando de barra diagonal /prose y un paquete de Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-11T23:27:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse es un formato de flujo de trabajo portátil, basado principalmente en Markdown, para orquestar sesiones de IA. En OpenClaw se distribuye como un Plugin que instala un paquete de Skills de OpenProse y un comando de barra diagonal `/prose`. Los programas se encuentran en archivos `.prose` y pueden iniciar varios subagentes con un flujo de control explícito.

<CardGroup cols={3}>
  <Card title="Instalar" icon="download" href="#install">
    Habilite el Plugin OpenProse y reinicie el Gateway.
  </Card>
  <Card title="Ejecutar un programa" icon="play" href="#slash-command">
    Use `/prose run` para ejecutar un archivo `.prose` o un programa remoto.
  </Card>
  <Card title="Escribir programas" icon="pencil" href="#example-parallel-research-and-synthesis">
    Cree flujos de trabajo multiagente con pasos paralelos y secuenciales.
  </Card>
</CardGroup>

## Instalación

<Steps>
  <Step title="Habilitar el Plugin">
    OpenProse viene incluido, pero está deshabilitado de forma predeterminada. Habilítelo:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Reiniciar el Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verificar">
    ```bash
    openclaw plugins list | grep prose
    ```

    Debería ver `open-prose` como habilitado. El comando de Skill `/prose` ya
    está disponible en el chat.

  </Step>
</Steps>

Desde una copia local del repositorio, puede instalar el Plugin directamente:
`openclaw plugins install ./extensions/open-prose`

## Comando de barra diagonal

OpenProse registra `/prose` como un comando de Skill que puede invocar el usuario:

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
Las URL directas se obtienen sin modificaciones mediante la herramienta `web_fetch`.

Las ejecuciones remotas de nivel superior son explícitas. Las importaciones remotas dentro de un programa `.prose` son dependencias de código transitivas: antes de que OpenProse obtenga cualquier destino remoto de `use`, muestra la lista de importaciones resueltas y exige que el operador responda exactamente `approve remote prose imports` para esa ejecución.

## Qué puede hacer

- Investigación y síntesis multiagente con paralelismo explícito.
- Flujos de trabajo repetibles y seguros mediante aprobaciones (revisión de código, triaje de incidentes y canalizaciones de contenido).
- Programas `.prose` reutilizables que puede ejecutar en entornos de ejecución de agentes compatibles.

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

## Correspondencia con el entorno de ejecución de OpenClaw

Los programas de OpenProse se corresponden con primitivas de OpenClaw:

| Concepto de OpenProse              | Herramienta de OpenClaw                           |
| ---------------------------------- | ------------------------------------------------- |
| Iniciar sesión / herramienta Task | `sessions_spawn`                                  |
| Lectura y escritura de archivos   | `read` / `write`                                  |
| Obtención web                     | `web_fetch` (`exec` + curl cuando se requiere POST) |

<Warning>
  Si su lista de herramientas permitidas bloquea `sessions_spawn`, `read`, `write` o
  `web_fetch`, los programas de OpenProse fallarán. Revise la
  [configuración de la lista de herramientas permitidas](/es/gateway/config-tools).
</Warning>

## Ubicaciones de archivos

OpenProse mantiene el estado en `.prose/` dentro de su espacio de trabajo:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

Los agentes persistentes de nivel de usuario (compartidos entre proyectos) se encuentran en:

```text
~/.prose/agents/
```

## Sistemas de almacenamiento del estado

<AccordionGroup>
  <Accordion title="sistema de archivos (predeterminado)">
    El estado se escribe en `.prose/runs/...` dentro del espacio de trabajo. No se
    requieren dependencias adicionales.
  </Accordion>
  <Accordion title="en contexto">
    El estado transitorio se conserva en la ventana de contexto; selecciónelo con `--in-context`.
    Es adecuado para programas pequeños y de corta duración.
  </Accordion>
  <Accordion title="sqlite (experimental)">
    Selecciónelo con `--state=sqlite`. Requiere el binario `sqlite3` en `PATH`
    (recurre al sistema de archivos si no está disponible); el estado se guarda en
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (experimental)">
    Selecciónelo con `--state=postgres`. Requiere `psql` y una cadena de conexión en
    `OPENPROSE_POSTGRES_URL` (configúrela en `.prose/.env`).

    <Warning>
      Las credenciales de Postgres se incluyen en los registros de los subagentes. Use una base de datos
      dedicada y con privilegios mínimos.
    </Warning>

  </Accordion>
</AccordionGroup>

## Seguridad

Trate los archivos `.prose` como código. Revíselos antes de ejecutarlos, incluidas las importaciones remotas de `use`. Las solicitudes de nivel superior `/prose run https://...` son explícitas, pero las importaciones remotas transitivas requieren aprobación en cada ejecución antes de obtenerse o ejecutarse. Use las listas de herramientas permitidas y las puertas de aprobación de OpenClaw para controlar los efectos secundarios. Para flujos de trabajo deterministas sujetos a aprobación, compárelo con [Lobster](/es/tools/lobster).

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Referencia de Skills" href="/es/tools/skills" icon="puzzle-piece">
    Cómo se carga el paquete de Skills de OpenProse y qué puertas se aplican.
  </Card>
  <Card title="Subagentes" href="/es/tools/subagents" icon="users">
    La capa nativa de coordinación multiagente de OpenClaw.
  </Card>
  <Card title="Texto a voz" href="/es/tools/tts" icon="volume-high">
    Añada salida de audio a sus flujos de trabajo.
  </Card>
  <Card title="Comandos de barra diagonal" href="/es/tools/slash-commands" icon="terminal">
    Todos los comandos de chat disponibles, incluido /prose.
  </Card>
</CardGroup>

Sitio oficial: [https://www.prose.md](https://www.prose.md)
