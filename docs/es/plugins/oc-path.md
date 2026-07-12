---
read_when:
    - Quieres inspeccionar o editar un único elemento terminal dentro de un archivo del espacio de trabajo desde la terminal
    - Estás creando scripts que interactúan con el estado del espacio de trabajo y necesitas un esquema de direccionamiento estable e independiente del tipo.
    - Estás decidiendo si habilitar el Plugin opcional `oc-path` en un Gateway autoalojado
summary: 'Plugin `oc-path` incluido: proporciona la CLI `openclaw path` para el esquema de direccionamiento de archivos del espacio de trabajo `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-07-11T23:19:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

El plugin incluido `oc-path` añade la CLI [`openclaw path`](/es/cli/path) para el
esquema de direccionamiento de archivos del espacio de trabajo `oc://`. Se
distribuye en el repositorio de OpenClaw dentro de `extensions/oc-path/`, pero
es opcional: tras instalarlo o compilarlo, permanece inactivo hasta que lo
habilites.

Las direcciones `oc://` apuntan a una única hoja (o a un conjunto de hojas
mediante comodines) dentro de un archivo del espacio de trabajo. El plugin
admite cuatro tipos de archivo:

- **markdown** (`.md`): frontmatter, secciones, elementos y campos
- **jsonc** (`.jsonc`, `.json`): conserva los comentarios y el formato
- **jsonl** (`.jsonl`, `.ndjson`): registros orientados a líneas
- **yaml** (`.yaml`, `.yml`, `.lobster`): nodos de mapa, secuencia y escalares
  mediante la API `Document` del paquete `yaml`

Quienes alojan sus propias instalaciones y las extensiones de editores usan la
CLI para leer o escribir una única hoja sin programar directamente contra el
SDK; los agentes y hooks la tratan como un sustrato determinista, de modo que
las operaciones de ida y vuelta con fidelidad de bytes y la protección del
centinela de ocultación se apliquen uniformemente a todos los tipos. Consulta
la [referencia de la CLI](/es/cli/path) para ver la gramática completa, la lista de
opciones de cada verbo y ejemplos desarrollados para cada tipo de archivo; esta
página explica por qué y cómo habilitar el plugin.

## Por qué habilitarlo

Habilita `oc-path` cuando los scripts, hooks o las herramientas de agentes
locales necesiten apuntar a una parte precisa del estado del espacio de trabajo
sin un analizador específico para cada estructura de archivo. Una sola
dirección `oc://` puede identificar una clave del frontmatter de Markdown, un
elemento de una sección, una hoja de configuración JSONC, un campo de evento
JSONL o un paso de flujo de trabajo YAML.

Esto es importante para los flujos de trabajo de mantenimiento en los que el
cambio debe mantenerse pequeño, auditable y repetible: inspeccionar un valor,
buscar registros coincidentes, simular una escritura y, después, aplicar solo
esa hoja sin modificar los comentarios, los finales de línea ni el formato
cercano.

Motivos habituales para habilitarlo:

- **Automatización local**: los scripts de shell resuelven o actualizan un
  valor del espacio de trabajo con `openclaw path … --json`, en lugar de
  mantener código de análisis independiente para Markdown, JSONC, JSONL y
  YAML.
- **Ediciones visibles para agentes**: un agente muestra una diferencia
  simulada de una hoja direccionada antes de escribirla, lo que resulta más
  fácil de revisar que una reescritura libre del archivo.
- **Integraciones con editores**: un editor asigna
  `oc://AGENTS.md/tools/gh` al nodo de Markdown y al número de línea exactos,
  sin hacer suposiciones a partir del texto del encabezado.
- **Diagnóstico**: `emit` hace pasar un archivo por el analizador y el emisor
  en una operación de ida y vuelta, para que puedas comprobar si un tipo de
  archivo conserva los bytes antes de depender de ediciones automatizadas.

```bash
# ¿Está habilitado el plugin de GitHub en esta configuración?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# ¿Qué nombres de llamadas a herramientas aparecen en este registro de sesión?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# ¿Qué bytes escribiría esta pequeña edición de configuración?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` no es deliberadamente el propietario de la semántica de nivel
superior. Los plugins de memoria siguen siendo responsables de las escrituras
de memoria, los comandos de configuración siguen siendo responsables de la
gestión completa de la configuración y la recuperación de la última
configuración válida conocida (LKG) sigue siendo responsable de la
restauración y promoción. `oc-path` es la capa limitada de direccionamiento y
operaciones de archivo con conservación de bytes sobre la que pueden construirse
esas herramientas de nivel superior.

## Dónde se ejecuta

El plugin se ejecuta **dentro del proceso de la CLI `openclaw`** en el host
donde invocas el comando. No necesita un Gateway en ejecución ni abre ningún
socket de red; cada verbo es una transformación pura de un archivo que le
indiques.

Los metadatos del plugin se encuentran en
`extensions/oc-path/openclaw.plugin.json`:

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

`onStartup: false` mantiene el plugin fuera de la ruta de inicio del Gateway.
`commandAliases` y `activation.onCommands` indican a la CLI que cargue el
plugin de forma diferida la primera vez que ejecutes `openclaw path …`, por lo
que las instalaciones que nunca usan el verbo no incurren en ningún coste.

## Habilitación

```bash
openclaw plugins enable oc-path
```

Reinicia el Gateway (si ejecutas uno) para que la instantánea del manifiesto
detecte el nuevo estado. Las invocaciones directas de `openclaw path` funcionan
inmediatamente en el mismo host; la CLI carga el plugin bajo demanda.

Deshabilítalo con:

```bash
openclaw plugins disable oc-path
```

## Dependencias

Todas las dependencias de análisis son locales al plugin; habilitar `oc-path`
no incorpora paquetes nuevos al entorno de ejecución principal:

| Dependencia    | Propósito                                                                      |
| -------------- | ------------------------------------------------------------------------------ |
| `commander`    | Conexión de los subcomandos `resolve`, `find`, `set`, `validate` y `emit`.      |
| `jsonc-parser` | Análisis de JSONC y edición de hojas conservando comentarios y comas finales.   |
| `markdown-it`  | Tokenización de Markdown para el modelo de secciones, elementos y campos.       |
| `yaml`         | Análisis, emisión y edición de `Document` YAML conservando comentarios y estilo de flujo. |

JSONL sigue implementado manualmente: el análisis orientado a líneas es más
sencillo que cualquier dependencia y el análisis de cada línea ya pasa por
`jsonc-parser`.

## Qué proporciona

| Superficie                     | Proporcionada por                                         |
| ------------------------------ | --------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                  |
| Analizador/formateador `oc://` | `extensions/oc-path/src/oc-path/oc-path.ts`               |
| Análisis/emisión/edición por tipo | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| Resolución/búsqueda/asignación universal | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Protección del centinela de ocultación | `extensions/oc-path/src/oc-path/sentinel.ts`          |

Actualmente, la CLI es la única superficie pública. Los verbos del sustrato son
privados del plugin; los consumidores usan la CLI (o crean su propio plugin
contra el SDK).

## Relación con otros plugins

- **`memory-*`**: las escrituras de memoria pasan por los plugins de memoria,
  no por `oc-path`. `oc-path` es un sustrato genérico de archivos; los plugins
  de memoria añaden su propia semántica sobre él.
- **LKG**: `path` no conoce la restauración de la última configuración válida
  conocida. Si un archivo que editas mediante `path` también está supervisado
  por LKG, el siguiente ciclo de observación de la configuración decide si se
  promociona o se recupera; trata una edición mediante `path` igual que
  cualquier otra escritura directa en ese archivo.

## Seguridad

`set` escribe bytes sin procesar mediante la ruta de emisión del sustrato, que
aplica automáticamente la protección del centinela de ocultación. Una hoja que
contenga `__OPENCLAW_REDACTED__` (literalmente o como subcadena) se rechaza en el
momento de la escritura con `OC_EMIT_SENTINEL`. La CLI también elimina el
centinela literal de cualquier salida legible o JSON que imprima y lo sustituye
por `[REDACTED]`, para que las capturas del terminal y las canalizaciones nunca
expongan el marcador.

## Contenido relacionado

- [Referencia de la CLI `openclaw path`](/es/cli/path)
- [Gestionar plugins](/es/plugins/manage-plugins)
- [Crear plugins](/es/plugins/building-plugins)
