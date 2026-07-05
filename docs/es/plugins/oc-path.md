---
read_when:
    - Quieres inspeccionar o editar un único nodo hoja dentro de un archivo del espacio de trabajo desde la terminal
    - Estás creando scripts sobre el estado del espacio de trabajo y necesitas un esquema de direccionamiento estable e independiente del tipo.
    - Estás decidiendo si habilitar el Plugin opcional `oc-path` en un Gateway autohospedado
summary: 'Plugin `oc-path` incluido: incluye la CLI `openclaw path` para el esquema de direccionamiento de archivos del espacio de trabajo `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-07-05T11:31:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

El Plugin incluido `oc-path` agrega la CLI [`openclaw path`](/es/cli/path) para el
esquema de direccionamiento de archivos del espacio de trabajo `oc://`. Se distribuye en el repositorio de OpenClaw bajo
`extensions/oc-path/`, pero es opcional: instalar/compilar lo deja inactivo hasta que lo
habilites.

`oc://` apunta a una sola hoja (o a un conjunto comodín de hojas) dentro de
un archivo del espacio de trabajo. El Plugin entiende cuatro tipos de archivo:

- **markdown** (`.md`): frontmatter, secciones, elementos, campos
- **jsonc** (`.jsonc`, `.json`): comentarios y formato preservados
- **jsonl** (`.jsonl`, `.ndjson`): registros orientados a líneas
- **yaml** (`.yaml`, `.yml`, `.lobster`): nodos de mapa/secuencia/escalar mediante la
  API `Document` del paquete `yaml`

Quienes hacen autoalojamiento y las extensiones de editor usan la CLI para leer o escribir una sola hoja
sin crear scripts directamente contra el SDK; los agentes y hooks la tratan como un
sustrato determinista para que los ciclos de ida y vuelta con fidelidad de bytes y la protección del
centinela de redacción se apliquen de forma uniforme entre tipos. Consulta la
[referencia de la CLI](/es/cli/path) para ver la gramática completa, la lista de flags verbo por verbo y
ejemplos desarrollados por tipo de archivo; esta página explica por qué y cómo habilitar el
Plugin.

## Por qué habilitarlo

Habilita `oc-path` cuando scripts, hooks o herramientas locales de agentes necesiten apuntar a
una parte precisa del estado del espacio de trabajo sin un analizador a medida para cada forma de archivo. Una
dirección `oc://` puede nombrar una clave de frontmatter de markdown, un elemento de sección, una
hoja de configuración JSONC, un campo de evento JSONL o un paso de flujo de trabajo YAML.

Eso importa en flujos de trabajo de mantenimiento donde el cambio debe mantenerse pequeño,
auditable y repetible: inspeccionar un valor, encontrar registros coincidentes, simular
una escritura y luego aplicar solo esa hoja, dejando intactos los comentarios, finales de línea y
formato cercano.

Motivos comunes para habilitarlo:

- **Automatización local**: los scripts de shell resuelven o actualizan un valor del espacio de trabajo
  con `openclaw path … --json` en lugar de cargar código separado de análisis de markdown, JSONC,
  JSONL y YAML.
- **Ediciones visibles para agentes**: un agente muestra un diff de simulación para una
  hoja direccionada antes de escribir, lo que es más fácil de revisar que una reescritura
  libre de archivo.
- **Integraciones de editor**: un editor asigna `oc://AGENTS.md/tools/gh` al
  nodo markdown exacto y al número de línea sin adivinar desde el texto del encabezado.
- **Diagnósticos**: `emit` hace pasar un archivo por el analizador y emisor y lo devuelve,
  para que puedas comprobar si un tipo de archivo es estable a nivel de bytes antes de depender de
  ediciones automatizadas.

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` no es intencionalmente el propietario de semánticas de nivel superior. Los
plugins de memoria siguen siendo propietarios de las escrituras de memoria, los comandos de configuración siguen siendo propietarios de la gestión
completa de configuración, y la recuperación de configuración de última configuración buena conocida (LKG) sigue siendo propietaria de
restauración/promoción. `oc-path` es la capa estrecha de direccionamiento y operaciones
de archivo que preservan bytes alrededor de la cual esas herramientas de nivel superior pueden construirse.

## Dónde se ejecuta

El Plugin se ejecuta **en proceso dentro de la CLI `openclaw`** en el host donde
invocas el comando. No necesita un Gateway en ejecución y no abre ningún
socket de red; cada verbo es una transformación pura sobre un archivo al que apuntes.

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

`onStartup: false` mantiene el Plugin fuera de la ruta de inicio del Gateway.
`commandAliases` y `activation.onCommands` indican a la CLI que cargue el Plugin
de forma diferida la primera vez que ejecutes `openclaw path …`, de modo que las instalaciones que nunca usan
el verbo no pagan ningún coste.

## Habilitar

```bash
openclaw plugins enable oc-path
```

Reinicia el Gateway (si ejecutas uno) para que la instantánea del manifiesto recoja el nuevo
estado. Las invocaciones directas de `openclaw path` funcionan inmediatamente en el mismo host;
la CLI carga el Plugin bajo demanda.

Deshabilitar con:

```bash
openclaw plugins disable oc-path
```

## Dependencias

Todas las dependencias de analizadores son locales del Plugin; habilitar `oc-path` no incorpora
paquetes nuevos al runtime principal:

| Dependencia    | Propósito                                                               |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Cableado de subcomandos para `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Análisis de JSONC y ediciones de hojas conservando comentarios y comas finales. |
| `markdown-it`  | Tokenización de Markdown para el modelo de sección / elemento / campo. |
| `yaml`         | Análisis / emisión / edición de `Document` YAML conservando comentarios y estilo de flujo. |

JSONL sigue implementado a mano: el análisis orientado a líneas es más sencillo que cualquier
dependencia, y el análisis por línea ya pasa por `jsonc-parser`.

## Qué proporciona

| Superficie                     | Proporcionada por                                       |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Analizador / formateador `oc://` | `extensions/oc-path/src/oc-path/oc-path.ts`           |
| Análisis / emisión / edición por tipo | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Resolución / búsqueda / asignación universales | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Protección del centinela de redacción | `extensions/oc-path/src/oc-path/sentinel.ts`      |

La CLI es la única superficie pública hoy. Los verbos del sustrato son privados del
Plugin; los consumidores usan la CLI (o crean su propio Plugin contra el
SDK).

## Relación con otros plugins

- **`memory-*`**: las escrituras de memoria pasan por los plugins de memoria, no por
  `oc-path`. `oc-path` es un sustrato genérico de archivos; los plugins de memoria superponen
  sus propias semánticas encima.
- **LKG**: `path` no conoce la restauración de configuración de última configuración buena conocida. Si un
  archivo que editas mediante `path` también está rastreado por LKG, el siguiente ciclo de observación
  de configuración decide si promoverlo o recuperarlo; trata una edición de `path` igual que
  cualquier otra escritura directa en ese archivo.

## Seguridad

`set` escribe bytes sin procesar mediante la ruta de emisión del sustrato, que aplica la
protección del centinela de redacción automáticamente. Una hoja que contiene
`__OPENCLAW_REDACTED__` (literalmente o como subcadena) se rechaza al escribir
con `OC_EMIT_SENTINEL`. La CLI también elimina el centinela literal de cualquier
salida humana o JSON que imprima, reemplazándolo por `[REDACTED]` para que las capturas
de terminal y las canalizaciones nunca filtren el marcador.

## Relacionado

- [Referencia de la CLI `openclaw path`](/es/cli/path)
- [Gestionar plugins](/es/plugins/manage-plugins)
- [Crear plugins](/es/plugins/building-plugins)
