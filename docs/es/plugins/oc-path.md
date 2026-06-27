---
read_when:
    - Quieres inspeccionar o editar una sola hoja dentro de un archivo del espacio de trabajo desde la terminal
    - Estás creando scripts contra el estado del espacio de trabajo y necesitas un esquema de direccionamiento estable e independiente del tipo.
    - Está decidiendo si habilitar el Plugin opcional `oc-path` en un Gateway autoalojado
summary: 'Plugin `oc-path` incluido: incluye la CLI `openclaw path` para el esquema de direccionamiento de archivos de espacio de trabajo `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-06-27T12:16:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

El plugin `oc-path` incluido añade la CLI [`openclaw path`](/es/cli/path) para el
esquema de direccionamiento de archivos de espacio de trabajo `oc://`. Se incluye en el repo de OpenClaw bajo
`extensions/oc-path/`, pero es opcional: instalar/compilar lo deja inactivo hasta que lo
habilites.

Las direcciones `oc://` apuntan a una sola hoja (o a un conjunto de hojas con comodín) dentro de
un archivo de espacio de trabajo. El plugin entiende hoy cuatro tipos de archivos:

- **markdown** (`.md`, `.mdx`): frontmatter, secciones, elementos, campos
- **jsonc** (`.jsonc`, `.json5`, `.json`): comentarios y formato preservados
- **jsonl** (`.jsonl`, `.ndjson`): registros orientados por línea
- **yaml** (`.yaml`, `.yml`, `.lobster`): nodos de mapa/secuencia/escalar mediante la
  API de documentos YAML

Los autoalojadores y las extensiones de editor usan la CLI para leer o escribir una sola hoja
sin crear scripts directamente contra el SDK; los agentes y hooks la tratan como un
sustrato determinista para que los recorridos de ida y vuelta con fidelidad de bytes y la protección del
centinela de redacción se apliquen de forma uniforme entre tipos.

## Por qué habilitarlo

Habilita `oc-path` cuando quieras que scripts, hooks o herramientas locales de agentes apunten
a una parte precisa del estado del espacio de trabajo sin inventar un analizador para cada forma de
archivo. Una sola dirección `oc://` puede nombrar una clave de frontmatter de markdown, un elemento
de sección, una hoja de configuración JSONC, un campo de evento JSONL o un paso de flujo de trabajo YAML.

Eso importa para los flujos de trabajo de mantenedores donde el cambio debe ser pequeño,
auditable y repetible: inspeccionar un valor, encontrar registros coincidentes, simular una
escritura y luego aplicar solo esa hoja dejando intactos los comentarios, los finales de línea y el
formato cercano. Mantener esto como un plugin opcional da a los usuarios avanzados el
sustrato de direccionamiento sin poner dependencias de analizadores ni superficie de CLI en el
núcleo para instalaciones que nunca lo necesitan.

Razones comunes para habilitarlo:

- **Automatización local**: los scripts de shell pueden resolver o actualizar un valor del espacio de trabajo
  con `openclaw path … --json` en lugar de llevar código separado de análisis de markdown, JSONC,
  JSONL y YAML.
- **Ediciones visibles para agentes**: un agente puede mostrar una diff de simulación para una
  hoja direccionada antes de escribir, lo que es más fácil de revisar que una reescritura de archivo libre.
- **Integraciones de editor**: un editor puede mapear `oc://AGENTS.md/tools/gh` al
  nodo markdown exacto y al número de línea sin adivinar a partir del texto del encabezado.
- **Diagnósticos**: `emit` hace un recorrido de ida y vuelta de un archivo por el analizador y emisor, para que
  puedas comprobar si un tipo de archivo es estable en bytes antes de depender de ediciones
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

El plugin no es intencionalmente el dueño de semánticas de nivel superior. Los plugins de memoria
siguen siendo dueños de las escrituras de memoria, los comandos de configuración siguen siendo dueños de la gestión completa de
configuración y la lógica LKG sigue siendo dueña de la restauración/promoción. `oc-path` es la capa estrecha
de direccionamiento y operación de archivos con preservación de bytes alrededor de la cual esas herramientas de nivel superior
pueden construir.

## Dónde se ejecuta

El plugin se ejecuta **en proceso dentro de la CLI `openclaw`** en el host donde
invocas el comando. No necesita un Gateway en ejecución y no abre ningún
socket de red: cada verbo es una transformación pura sobre un archivo al que apuntas.

Los metadatos del plugin viven en `extensions/oc-path/openclaw.plugin.json`:

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

`onStartup: false` mantiene el plugin fuera de la ruta caliente del Gateway. `onCommands:
["path"]` indica a la CLI que cargue el plugin de forma diferida la primera vez que ejecutes
`openclaw path …`, así que las instalaciones que nunca usan el verbo no pagan ningún costo.

## Habilitar

```bash
openclaw plugins enable oc-path
```

Reinicia el Gateway (si ejecutas uno) para que la instantánea del manifiesto recoja el nuevo
estado. Las invocaciones directas de `openclaw path` funcionan de inmediato en el mismo host:
la CLI carga el plugin bajo demanda.

Deshabilitar con:

```bash
openclaw plugins disable oc-path
```

## Dependencias

Todas las dependencias de analizadores son locales al plugin: habilitar `oc-path` no introduce
paquetes nuevos en el runtime del núcleo:

| Dependencia    | Propósito                                                              |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Cableado de subcomandos para `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Análisis JSONC + ediciones de hoja con comentarios y comas finales preservados. |
| `markdown-it`  | Tokenización Markdown para el modelo de sección / elemento / campo.    |
| `yaml`         | Análisis / emisión / edición de `Document` YAML con comentarios y estilo de flujo preservados. |

JSONL sigue implementado a mano: el análisis orientado por línea es más simple que cualquier
dependencia, y el análisis JSONC por línea ya pasa por `jsonc-parser`.

## Qué proporciona

| Superficie                     | Proporcionada por                                       |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Analizador / formateador `oc://` | `extensions/oc-path/src/oc-path/oc-path.ts`           |
| Análisis / emisión / edición por tipo | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Resolución / búsqueda / asignación universales | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Protección del centinela de redacción | `extensions/oc-path/src/oc-path/sentinel.ts`     |

La CLI es la única superficie pública hoy. Los verbos del sustrato son privados del
plugin; los consumidores usan la CLI (o crean su propio plugin contra el SDK).

## Relación con otros plugins

- **`memory-*`**: las escrituras de memoria pasan por los plugins de memoria, no por `oc-path`.
  `oc-path` es un sustrato genérico de archivos; los plugins de memoria superponen sus propias
  semánticas encima.
- **LKG**: `path` no conoce la restauración de configuración Last-Known-Good. Si un
  archivo está rastreado por LKG, la siguiente llamada `observe` decide si promover o
  recuperar; `set --batch` para múltiples asignaciones atómicas a través del ciclo de vida de promoción/recuperación
  de LKG está planificado junto con el sustrato de recuperación LKG.

## Seguridad

`set` escribe bytes sin procesar mediante la ruta de emisión del sustrato, que aplica la
protección del centinela de redacción automáticamente. Una hoja que contiene
`__OPENCLAW_REDACTED__` (textual o como subcadena) se rechaza en el momento de escritura
con `OC_EMIT_SENTINEL`. La CLI también depura el centinela literal de cualquier
salida humana o JSON que imprime, reemplazándolo con `[REDACTED]` para que las
capturas de terminal y las canalizaciones nunca filtren el marcador.

## Relacionado

- [Referencia de la CLI `openclaw path`](/es/cli/path)
- [Gestionar plugins](/es/plugins/manage-plugins)
- [Crear plugins](/es/plugins/building-plugins)
