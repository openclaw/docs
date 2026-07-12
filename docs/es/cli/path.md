---
read_when:
    - Quieres leer o escribir una hoja dentro de un archivo del espacio de trabajo desde la terminal.
    - Estás creando scripts que operan sobre el estado del espacio de trabajo y quieres un esquema de direccionamiento estable e independiente del tipo
    - Estás depurando una ruta `oc://` (valida la sintaxis y comprueba a qué se resuelve)
summary: Referencia de la CLI para `openclaw path` (inspecciona y edita archivos del espacio de trabajo mediante el esquema de direccionamiento `oc://`)
title: Ruta
x-i18n:
    generated_at: "2026-07-11T23:01:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Acceso desde el shell al esquema de direccionamiento `oc://`: una sintaxis de rutas con despacho por tipo para inspeccionar y editar archivos direccionables del espacio de trabajo (markdown, jsonc, jsonl, yaml/yml/lobster). Quienes alojan sus propias instancias, los autores de plugins y las extensiones de editores lo utilizan para leer, buscar o actualizar una ubicación específica sin tener que crear manualmente un analizador para cada tipo de archivo.

`path` lo proporciona el plugin opcional incluido `oc-path`. Actívelo antes de usarlo por primera vez:

```bash
openclaw plugins enable oc-path
```

Los verbos de la CLI reflejan el modelo de direccionamiento:

- `resolve` es concreto y devuelve una sola coincidencia.
- `find` es el verbo para obtener varias coincidencias mediante comodines, uniones, predicados y expansión posicional.
- `set` solo acepta rutas concretas o marcadores de inserción; los patrones con comodines se rechazan antes de escribir.
- `validate` analiza una ruta sin acceder al sistema de archivos.
- `emit` hace un recorrido de ida y vuelta de un archivo mediante análisis + emisión (diagnóstico de fidelidad de bytes).

## Por qué usarlo

El estado de OpenClaw se distribuye entre archivos markdown editados por personas, configuraciones JSONC con comentarios, registros JSONL de solo anexado y archivos YAML de flujos de trabajo o especificaciones. Los scripts, hooks y agentes suelen necesitar un único valor pequeño de esos archivos: una clave de frontmatter, un ajuste de plugin, un campo de un registro, un paso de YAML o un elemento de viñeta bajo una sección con nombre.

`openclaw path` proporciona a esos consumidores una dirección estable en lugar de recurrir a una búsqueda con grep, una expresión regular o un analizador específico para cada tipo de archivo. La misma ruta `oc://` puede validarse, resolverse, buscarse, simularse y escribirse desde la terminal, lo que permite revisar y repetir automatizaciones específicas. Conserva el resto del archivo, por lo que escribir una sola hoja no altera sus comentarios, finales de línea ni el formato cercano.

Úselo cuando el elemento que busca tenga una dirección lógica, pero la estructura del archivo varíe:

- Un hook lee un ajuste de un archivo JSONC con comentarios sin perderlos al volver a escribir el valor.
- Un script de mantenimiento encuentra todos los campos de evento coincidentes en un registro JSONL sin cargar el registro completo en un analizador personalizado.
- Un editor salta a una sección o elemento de viñeta de markdown mediante su slug y después muestra la línea exacta que se resolvió.
- Un agente simula una pequeña edición del espacio de trabajo antes de aplicarla, con los bytes modificados visibles durante la revisión.

No use `openclaw path` para ediciones ordinarias de archivos completos, migraciones complejas de configuración ni escrituras específicas de memoria; para ello debe usar el comando o plugin propietario correspondiente. `path` está pensado para operaciones pequeñas sobre archivos direccionables en las que un comando de terminal repetible resulta preferible a otro analizador a medida.

## Cómo se usa

Lea un valor de un archivo de configuración editado por personas:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Previsualice una escritura sin modificar el disco:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Encuentre registros coincidentes en un registro JSONL de solo anexado:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Direccione una instrucción en markdown mediante su sección y elemento, en lugar de hacerlo por número de línea:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valide una ruta en CI o en un script de comprobación previa antes de que el script lea o escriba:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Estos comandos están diseñados para poder copiarse en scripts de shell. Use `--json` cuando un consumidor necesite una salida estructurada y `--human` cuando una persona inspeccione el resultado.

## Cómo funciona

1. Analiza la dirección `oc://` en campos: archivo, sección, elemento, campo y una consulta de sesión opcional.
2. Elige el adaptador del tipo de archivo según la extensión de destino (`.md`, `.jsonc`, `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Resuelve los campos con respecto a la estructura de ese tipo de archivo: encabezados/elementos de markdown, claves de objetos/índices de matrices de JSONC, registros por línea de JSONL o nodos de mapas/secuencias de YAML.
4. Para `set`, emite los bytes editados mediante el mismo adaptador, de modo que las partes no modificadas del archivo conserven sus comentarios, finales de línea y formato cercano cuando el tipo lo permita.

`resolve` y `set` requieren un único destino concreto. `find` es el verbo exploratorio: expande comodines, uniones, predicados y ordinales en coincidencias concretas que puede inspeccionar antes de elegir una para escribir.

## Subcomandos

| Subcomando               | Finalidad                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `resolve <oc-path>`      | Imprime la coincidencia concreta de la ruta (o «no encontrada»).                            |
| `find <pattern>`         | Enumera las coincidencias de una ruta con comodín, unión o predicado.                       |
| `set <oc-path> <value>`  | Escribe una hoja o un destino de inserción en una ruta concreta. Admite `--dry-run`.        |
| `validate <oc-path>`     | Solo analiza; imprime el desglose estructural (archivo/sección/elemento/campo).              |
| `emit <file>`            | Hace un recorrido de ida y vuelta mediante análisis + emisión (diagnóstico de fidelidad de bytes). |

## Opciones globales

| Opción          | Se aplica a                       | Finalidad                                                                            |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit`  | Resuelve el campo de archivo respecto a este directorio (predeterminado: `process.cwd()`). |
| `--file <path>` | `resolve`, `find`, `set`, `emit`  | Sustituye la ruta resuelta del campo de archivo (acceso absoluto).                    |
| `--json`        | todos                             | Fuerza la salida JSON (predeterminada cuando stdout no es una TTY).                   |
| `--human`       | todos                             | Fuerza la salida legible para personas (predeterminada cuando stdout es una TTY).     |
| `--value-json`  | `set`                             | Analiza `<value>` como JSON al reemplazar hojas de JSON/JSONC/JSONL.                  |
| `--dry-run`     | `set`                             | Imprime los bytes que se escribirían sin realizar la escritura.                       |
| `--diff`        | `set` (requiere `--dry-run`)      | Imprime un diff unificado en lugar de todos los bytes.                                |

`validate` solo admite `--json`/`--human`; no accede al sistema de archivos, por lo que `--cwd` y `--file` no se aplican.

## Sintaxis de `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Reglas de los campos: `field` requiere `item`, y `item` requiere `section`. En los cuatro campos:

- **Segmentos entre comillas** — `"a/b.c"` conserva los separadores `/` y `.`. El contenido es literal a nivel de bytes; `"` y `\` no se permiten dentro de las comillas. El campo de archivo también reconoce comillas: `oc://"skills/email-drafter"/Tools/$last` trata `skills/email-drafter` como una única ruta de archivo.
- **Predicados** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`. Los operadores numéricos requieren que ambos lados puedan convertirse en números finitos.
- **Uniones** — `{a,b,c}` coincide con cualquiera de las alternativas.
- **Comodines** — `*` (un solo subsegmento) y `**` (cero o más, recursivo). `find` los acepta; `resolve` y `set` los rechazan por ser ambiguos.
- **Posicionales** — `$first`/`$last` se resuelven en el primer/último índice o clave declarada.
- **Ordinales** — `#N` representa la coincidencia número N según el orden del documento.
- **Marcadores de inserción** — `+`, `+key`, `+nnn` para inserciones por clave o índice (se usan con `set`).
- **Ámbito de sesión** — `?session=cron-daily`, etc. Es independiente del anidamiento de campos. Los valores de sesión son literales, no se decodifican por porcentaje y no pueden contener caracteres de control ni delimitadores de consulta reservados (`?`, `&`, `%`).

Los caracteres reservados (`?`, `&`, `%`) situados fuera de segmentos entre comillas, predicados o uniones se rechazan. Los caracteres de control (U+0000-U+001F, U+007F) se rechazan en cualquier lugar, incluido el valor de la consulta `session`.

Se garantiza que `formatOcPath(parseOcPath(path)) === path` para las rutas canónicas. Los parámetros de consulta no canónicos se ignoran, excepto el primer valor no vacío de `session=`.

Límites estrictos: una ruta está limitada a 4096 bytes, un máximo de 4 campos (archivo/sección/elemento/campo), un máximo de 64 subsegmentos separados por puntos en cada campo y un máximo de 256 niveles de recorrido anidado para rutas JSON profundas. Por separado, cualquier archivo de entrada JSONC/JSON que supere los 16 MiB se rechaza con un diagnóstico de análisis en lugar de analizarse, para cualquier verbo que cargue dicho archivo.

## Direccionamiento por tipo de archivo

| Tipo          | Extensiones de archivo       | Modelo de direccionamiento                                                                             |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                        | Secciones H2 por slug, elementos de viñeta por slug o `#N`, frontmatter mediante `[frontmatter]`.      |
| JSONC/JSON    | `.jsonc`, `.json`            | Claves de objetos e índices de matrices; los puntos separan subsegmentos anidados, salvo entre comillas. |
| JSONL         | `.jsonl`, `.ndjson`          | Direcciones de líneas de nivel superior (`L1`, `L2`, `$first`, `$last`) y, después, descenso al estilo JSONC dentro de la línea. |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`  | Claves de mapas e índices de secuencias; los comentarios y el estilo de flujo se gestionan mediante la API de documentos YAML. |

`resolve` devuelve una coincidencia estructurada: `root`, `node`, `leaf` o `insertion-point`, con un número de línea basado en 1. Los valores de hoja se presentan como texto junto con un `leafType`, para que los autores de plugins puedan mostrar vistas previas sin depender de la estructura AST específica de cada tipo.

## Contrato de mutación

`set` escribe en un único destino concreto:

- Los valores del frontmatter de Markdown y los campos de elementos `- key: value` son hojas de cadena. Las inserciones de Markdown agregan secciones, claves de frontmatter o elementos de sección y generan una estructura canónica de markdown para el archivo modificado. Los cuerpos de las secciones no pueden escribirse en su totalidad mediante `set`.
- Las escrituras de hojas JSONC convierten el valor de cadena al tipo de la hoja existente (`string`, `number` finito, `true`/`false` o `null`). Use `--value-json` cuando el reemplazo de una hoja JSONC/JSON/JSONL deba analizar `<value>` como JSON y pueda cambiar de estructura, por ejemplo al sustituir una forma abreviada de referencia a un secreto por un objeto. Las inserciones en objetos y matrices JSONC analizan `<value>` como JSON y utilizan la ruta de edición de `jsonc-parser` para las escrituras ordinarias de hojas, conservando los comentarios y el formato cercano.
- Las escrituras de hojas JSONL realizan la misma conversión que JSONC dentro de una línea. El reemplazo de líneas completas y el anexado analizan `<value>` como JSON. El JSONL generado conserva la convención dominante de finales de línea LF/CRLF del archivo (por mayoría entre los saltos de línea del archivo, de modo que un archivo mayoritariamente CRLF permanece en CRLF aunque contenga algunos LF aislados).
- Las escrituras de hojas YAML convierten el valor al tipo escalar existente (`string`, `number` finito, `true`/`false` o `null`). Las inserciones YAML utilizan la API de documentos del paquete `yaml` incluido para actualizar mapas y secuencias. Los documentos YAML mal formados con errores del analizador se rechazan antes de la mutación con `parse-error`.

Use `--dry-run` antes de realizar escrituras visibles para el usuario cuando importen los bytes exactos. Las ediciones JSONC y YAML modifican el documento existente (mediante `jsonc-parser` o la API de documentos de `yaml`), por lo que los bytes no modificados suelen conservarse; Markdown reconstruye el archivo a partir de su estructura analizada en cualquier edición, lo que puede normalizar el formato accidental situado fuera de la hoja modificada. Añada `--diff` cuando quiera ver la previsualización como un parche específico de antes/después en lugar del archivo generado completo.

## Ejemplos

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Más ejemplos de la gramática:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Recetas por tipo de archivo

Los mismos cinco verbos funcionan con todos los tipos; el esquema de direccionamiento selecciona el comportamiento según
la extensión del archivo.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

El predicado `[frontmatter]` apunta al bloque de metadatos YAML; `tools`
coincide con el encabezado `## Tools` mediante su slug, y las hojas de los elementos conservan la forma de su slug
incluso cuando el código fuente utiliza guiones bajos (`send_email` se convierte en `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

Las ediciones de JSONC pasan por `jsonc-parser`, por lo que los comentarios y los espacios en blanco se conservan tras un
`set`. Ejecute primero con `--dry-run` para inspeccionar los bytes antes de confirmar los cambios.
Los archivos `.json` utilizan el mismo adaptador y la misma ruta de edición que los archivos `.jsonc`.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Cada línea es un registro. Apunte mediante un predicado (`[event=action]`) cuando
no conozca el número de línea, o mediante el segmento canónico `LN` cuando sí lo conozca.
Los archivos `.ndjson` utilizan el mismo adaptador que los archivos `.jsonl`.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML utiliza la API `Document` del paquete `yaml` en lugar de un
analizador creado manualmente, por lo que los ciclos normales de análisis y emisión conservan los comentarios y
la estructura de autoría, mientras que las rutas resueltas utilizan el mismo modelo de clave de mapa e índice de secuencia que
JSONC. El mismo adaptador gestiona los archivos `.yaml`, `.yml` y `.lobster`.

## Referencia de subcomandos

### `resolve <oc-path>`

Lee una sola hoja o nodo. Los comodines se rechazan; utilice `find` para ellos.
Finaliza con `0` si hay una coincidencia, con `1` si no hay coincidencias y con `2` si se produce un error de análisis o se rechaza
el patrón.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumera todas las coincidencias de un patrón con comodines, predicados o uniones. Finaliza con `0`
si hay al menos una coincidencia y con `1` si no hay ninguna. Los comodines en la posición del archivo se rechazan con
`OC_PATH_FILE_WILDCARD_UNSUPPORTED`; proporcione un archivo concreto (la expansión de patrones para varios archivos
es una función prevista para más adelante).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Escribe una hoja. Combínelo con `--dry-run` para previsualizar los bytes que se
escribirían sin modificar el archivo. Añada `--diff` para obtener una vista previa de las diferencias unificadas.
Finaliza con `0` tras una escritura correcta, con `1` si el sustrato la rechaza (por ejemplo, si
se activa una protección de centinela) y con `2` si se producen errores de análisis.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

El marcador de inserción `+key` crea el elemento secundario con el nombre indicado si aún no
existe; `+nnn` y `+` sin más se utilizan para la inserción por índice y al final,
respectivamente.

### `validate <oc-path>`

Comprobación únicamente de análisis. No accede al sistema de archivos. Resulta útil para confirmar que una
ruta de plantilla está bien formada antes de sustituir variables o para obtener
el desglose estructural durante la depuración:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Finaliza con `0` si es válida, con `1` si no lo es (con un `code` y un
`message` estructurados) y con `2` si se producen errores en los argumentos.

### `emit <file>`

Procesa un archivo de ida y vuelta mediante el analizador y el emisor correspondientes a su tipo. La salida debería
ser idéntica byte por byte a la entrada si el archivo es válido; cualquier diferencia indica un
error del analizador o la activación de un centinela. Resulta útil para depurar el comportamiento del sustrato con
entradas reales.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Códigos de salida

| Código | Significado                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| `0`    | Éxito. (`resolve` / `find`: al menos una coincidencia. `set`: escritura correcta). |
| `1`    | Sin coincidencias, o el sustrato rechazó `set` (sin error a nivel del sistema). |
| `2`    | Error de argumentos o de análisis.                                             |

## Modo de salida

`openclaw path` detecta el TTY: muestra una salida legible para humanos en un terminal y JSON cuando
la salida estándar se canaliza o redirige. `--json` y `--human` anulan la
detección automática.

## Notas

- `set` escribe bytes mediante la ruta de emisión del sustrato, que aplica automáticamente la
  protección del centinela de ocultación. Una hoja que contenga
  `__OPENCLAW_REDACTED__` (de forma literal o como subcadena) se rechaza al intentar
  escribirla.
- El análisis de JSONC y las ediciones de hojas utilizan la dependencia local del Plugin `jsonc-parser`,
  por lo que los comentarios y el formato se conservan durante las escrituras normales de hojas,
  en lugar de pasar por una ruta de análisis y renderizado creada manualmente.
- `path` no conoce el seguimiento ni la recuperación de la última configuración válida (LKG);
  ese ciclo de vida se gestiona en otro lugar. Si un archivo que edita mediante `path`
  también está sujeto al seguimiento LKG, la siguiente lectura de configuración decide si debe promoverlo o
  recuperarlo; trate una edición mediante `path` igual que cualquier otra escritura directa en
  ese archivo.

## Relacionado

- [Referencia de la CLI](/es/cli)
