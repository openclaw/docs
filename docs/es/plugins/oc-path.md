---
read_when:
    - Desea inspeccionar o editar una única hoja dentro de un archivo del espacio de trabajo desde la terminal
    - Estás escribiendo scripts sobre el estado del espacio de trabajo y necesitas un esquema de direccionamiento estable e independiente del tipo
    - Está decidiendo si habilitar el Plugin opcional `oc-path` en un Gateway autohospedado
summary: 'Plugin incluido `oc-path`: incluye la CLI `openclaw path` para el esquema de direccionamiento de archivos de espacio de trabajo `oc://`'
title: Plugin de ruta de OC
x-i18n:
    generated_at: "2026-05-11T20:45:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

El Plugin `oc-path` incluido añade la CLI [`openclaw path`](/es/cli/path) para el
esquema de direccionamiento de archivos de espacio de trabajo `oc://`. Se distribuye en el repositorio de OpenClaw bajo
`extensions/oc-path/`, pero es opcional: la instalación/compilación lo deja inactivo hasta que
lo habilitas.

Las direcciones `oc://` apuntan a una única hoja (o a un conjunto comodín de hojas) dentro de
un archivo de espacio de trabajo. El Plugin entiende actualmente tres tipos de archivos:

- **markdown** (`.md`, `.mdx`): frontmatter, secciones, elementos, campos
- **jsonc** (`.jsonc`, `.json5`, `.json`): comentarios y formato conservados
- **jsonl** (`.jsonl`, `.ndjson`): registros orientados a líneas

Los autohospedadores y las extensiones de editor usan la CLI para leer o escribir una sola hoja
sin crear scripts directamente contra el SDK; los agentes y hooks lo tratan como un
sustrato determinista para que los recorridos de ida y vuelta con fidelidad de bytes y la protección del
centinela de redacción se apliquen de forma uniforme entre tipos.

## Por qué habilitarlo

Habilita `oc-path` cuando quieras que scripts, hooks o herramientas locales de agentes apunten
a una parte precisa del estado del espacio de trabajo sin inventar un parser para cada forma de
archivo. Una sola dirección `oc://` puede nombrar una clave de frontmatter markdown, un elemento
de sección, una hoja de configuración JSONC o un campo de evento JSONL.

Eso importa para flujos de trabajo de mantenimiento donde el cambio debe ser pequeño,
auditable y repetible: inspeccionar un valor, encontrar registros coincidentes, hacer una simulación de una
escritura y luego aplicar solo esa hoja dejando intactos los comentarios, finales de línea y
formato cercano. Mantener esto como un Plugin opcional da a los usuarios avanzados el
sustrato de direccionamiento sin poner dependencias de parser ni superficie de CLI en el
núcleo para instalaciones que nunca lo necesitan.

Razones habituales para habilitarlo:

- **Automatización local**: los scripts de shell pueden resolver o actualizar un valor del espacio de trabajo
  con `openclaw path … --json` en lugar de cargar código de parseo separado para markdown, JSONC
  y JSONL.
- **Ediciones visibles para agentes**: un agente puede mostrar un diff de simulación para una hoja
  direccionada antes de escribir, lo que es más fácil de revisar que una reescritura libre de archivo.
- **Integraciones de editor**: un editor puede mapear `oc://AGENTS.md/tools/gh` al
  nodo markdown y número de línea exactos sin adivinar a partir del texto del encabezado.
- **Diagnósticos**: `emit` hace un recorrido de ida y vuelta de un archivo por el parser y emisor, para que
  puedas comprobar si un tipo de archivo es estable a nivel de bytes antes de depender de ediciones
  automatizadas.

Ejemplos concretos:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

El Plugin no es intencionadamente el propietario de semánticas de nivel superior. Los plugins de memoria
siguen siendo dueños de las escrituras de memoria, los comandos de configuración siguen siendo dueños de la gestión completa de configuración,
y la lógica LKG sigue siendo dueña de restauración/promoción. `oc-path` es la capa estrecha
de direccionamiento y operación de archivos con preservación de bytes sobre la que esas herramientas de nivel superior
pueden construir.

## Dónde se ejecuta

El Plugin se ejecuta **en proceso dentro de la CLI `openclaw`** en el host donde
invocas el comando. No necesita un Gateway en ejecución y no abre ningún
socket de red: cada verbo es una transformación pura sobre un archivo al que apuntas.

Los metadatos del Plugin viven en `extensions/oc-path/openclaw.plugin.json`:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` mantiene el Plugin fuera de la ruta crítica del Gateway. `onCommands:
["path"]` indica a la CLI que cargue el Plugin de forma diferida la primera vez que ejecutes
`openclaw path …`, así que las instalaciones que nunca usan el verbo no pagan ningún coste.

## Habilitar

```bash
openclaw plugins enable oc-path
```

Reinicia el Gateway (si ejecutas uno) para que la instantánea del manifiesto recoja el nuevo
estado. Las invocaciones directas de `openclaw path` funcionan inmediatamente en el mismo host:
la CLI carga el Plugin bajo demanda.

Deshabilítalo con:

```bash
openclaw plugins disable oc-path
```

## Dependencias

Todas las dependencias de parser son locales al Plugin: habilitar `oc-path` no incorpora
paquetes nuevos al runtime del núcleo:

| Dependencia    | Propósito                                                           |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | Cableado de subcomandos para `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Parseo JSONC + ediciones de hojas conservando comentarios y comas finales. |
| `markdown-it`  | Tokenización Markdown para el modelo de sección / elemento / campo. |

JSONL sigue implementado a mano: el parseo orientado a líneas es más simple que cualquier
dependencia, y el parseo JSONC por línea ya pasa por `jsonc-parser`.

## Qué proporciona

| Superficie                     | Proporcionado por                                       |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Parser / formateador `oc://`   | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Parseo / emisión / edición por tipo | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| Resolución / búsqueda / asignación universales | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Protección de centinela de redacción | `extensions/oc-path/src/oc-path/sentinel.ts`            |

La CLI es la única superficie pública hoy. Los verbos del sustrato son privados del
Plugin; los consumidores usan la CLI (o crean su propio Plugin contra el SDK).

## Relación con otros plugins

- **`memory-*`**: las escrituras de memoria pasan por los plugins de memoria, no por `oc-path`.
  `oc-path` es un sustrato genérico de archivos; los plugins de memoria colocan sus propias
  semánticas encima.
- **LKG**: `path` no sabe nada sobre restauración de configuración Last-Known-Good. Si un
  archivo está rastreado por LKG, la siguiente llamada `observe` decide si promover o
  recuperar; `set --batch` para asignación múltiple atómica a través del ciclo de vida de promoción/recuperación
  de LKG está planificado junto con el sustrato de recuperación LKG.

## Seguridad

`set` escribe bytes sin procesar a través de la ruta de emisión del sustrato, que aplica la
protección de centinela de redacción automáticamente. Una hoja que contenga
`__OPENCLAW_REDACTED__` (literalmente o como subcadena) se rechaza en tiempo de escritura
con `OC_EMIT_SENTINEL`. La CLI también elimina el centinela literal de cualquier
salida humana o JSON que imprime, sustituyéndolo por `[REDACTED]` para que las capturas de terminal
y pipelines nunca filtren el marcador.

## Relacionado

- [Referencia de la CLI `openclaw path`](/es/cli/path)
- [Gestionar plugins](/es/plugins/manage-plugins)
- [Crear plugins](/es/plugins/building-plugins)
