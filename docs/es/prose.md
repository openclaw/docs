---
read_when:
    - Quieres ejecutar o escribir archivos de flujo de trabajo .prose
    - Quiere habilitar el plugin OpenProse
    - Necesitas entender cómo OpenProse se asigna a las primitivas de OpenClaw
sidebarTitle: OpenProse
summary: OpenProse es un formato de flujo de trabajo centrado en Markdown para sesiones de IA multiagente. En OpenClaw se distribuye como un plugin con un comando de barra inclinada /prose y un paquete de habilidades.
title: OpenProse
x-i18n:
    generated_at: "2026-07-05T11:38:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse es un formato de flujo de trabajo portable y centrado en Markdown para orquestar
sesiones de IA. En OpenClaw se distribuye como un plugin que instala un paquete de Skills
de OpenProse y un comando de barra `/prose`. Los programas viven en archivos `.prose` y pueden
generar varios subagentes con flujo de control explícito.

<CardGroup cols={3}>
  <Card title="Instalar" icon="download" href="#install">
    Habilita el plugin OpenProse y reinicia el Gateway.
  </Card>
  <Card title="Ejecutar un programa" icon="play" href="#slash-command">
    Usa `/prose run` para ejecutar un archivo `.prose` o un programa remoto.
  </Card>
  <Card title="Escribir programas" icon="pencil" href="#example-parallel-research-and-synthesis">
    Crea flujos de trabajo multiagente con pasos paralelos y secuenciales.
  </Card>
</CardGroup>

## Instalar

<Steps>
  <Step title="Habilitar el plugin">
    OpenProse viene incluido, pero está deshabilitado de forma predeterminada. Habilítalo:

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

    Deberías ver `open-prose` como habilitado. El comando de Skills `/prose` ahora está
    disponible en el chat.

  </Step>
</Steps>

Desde un checkout del repositorio puedes instalar el plugin directamente:
`openclaw plugins install ./extensions/open-prose`

## Comando de barra

OpenProse registra `/prose` como un comando de Skills invocable por el usuario:

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
Las URL directas se obtienen tal cual mediante la herramienta `web_fetch`.

Las ejecuciones remotas de nivel superior son explícitas. Las importaciones remotas dentro de un programa `.prose` son
dependencias transitivas de código: antes de que OpenProse obtenga cualquier destino remoto `use`,
muestra la lista de importaciones resuelta y requiere que el operador responda exactamente
`approve remote prose imports` para esa ejecución.

## Qué puede hacer

- Investigación y síntesis multiagente con paralelismo explícito.
- Flujos de trabajo repetibles y seguros mediante aprobación (revisión de código, triaje de incidentes, canalizaciones de contenido).
- Programas `.prose` reutilizables que puedes ejecutar en los entornos de ejecución de agentes compatibles.

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

## Mapeo del entorno de ejecución de OpenClaw

Los programas de OpenProse se asignan a primitivas de OpenClaw:

| Concepto de OpenProse     | Herramienta de OpenClaw                         |
| ------------------------- | ----------------------------------------------- |
| Generar sesión / herramienta Task | `sessions_spawn`                                |
| Leer / escribir archivos  | `read` / `write`                                |
| Web fetch                 | `web_fetch` (`exec` + curl cuando se necesita POST) |

<Warning>
  Si tu lista de herramientas permitidas bloquea `sessions_spawn`, `read`, `write` o
  `web_fetch`, los programas de OpenProse fallarán. Revisa tu
  [configuración de la lista de herramientas permitidas](/es/gateway/config-tools).
</Warning>

## Ubicaciones de archivos

OpenProse conserva el estado en `.prose/` dentro de tu espacio de trabajo:

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

Los agentes persistentes de nivel de usuario (compartidos entre proyectos) viven en:

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
    Estado transitorio conservado en la ventana de contexto; selecciónalo con `--in-context`.
    Adecuado para programas pequeños y de corta duración.
  </Accordion>
  <Accordion title="sqlite (experimental)">
    Selecciónalo con `--state=sqlite`. Requiere el binario `sqlite3` en `PATH`
    (vuelve al sistema de archivos si falta); el estado se guarda en
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (experimental)">
    Selecciónalo con `--state=postgres`. Requiere `psql` y una cadena de conexión en
    `OPENPROSE_POSTGRES_URL` (configúrala en `.prose/.env`).

    <Warning>
      Las credenciales de Postgres fluyen a los registros de subagentes. Usa una base de datos dedicada
      y con privilegios mínimos.
    </Warning>

  </Accordion>
</AccordionGroup>

## Seguridad

Trata los archivos `.prose` como código. Revísalos antes de ejecutarlos, incluidas las importaciones
remotas `use`. Las solicitudes `/prose run https://...` de nivel superior son explícitas, pero
las importaciones remotas transitivas requieren aprobación por ejecución antes de obtenerse o
ejecutarse. Usa las listas de herramientas permitidas y las barreras de aprobación de OpenClaw para controlar los
efectos secundarios. Para flujos de trabajo deterministas y con aprobación, compáralo con
[Lobster](/es/tools/lobster).

## Relacionado

<CardGroup cols={2}>
  <Card title="Referencia de Skills" href="/es/tools/skills" icon="puzzle-piece">
    Cómo se carga el paquete de Skills de OpenProse y qué barreras se aplican.
  </Card>
  <Card title="Subagentes" href="/es/tools/subagents" icon="users">
    Capa nativa de coordinación multiagente de OpenClaw.
  </Card>
  <Card title="Texto a voz" href="/es/tools/tts" icon="volume-high">
    Añade salida de audio a tus flujos de trabajo.
  </Card>
  <Card title="Comandos de barra" href="/es/tools/slash-commands" icon="terminal">
    Todos los comandos de chat disponibles, incluido /prose.
  </Card>
</CardGroup>

Sitio oficial: [https://www.prose.md](https://www.prose.md)
