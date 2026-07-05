---
read_when:
    - Quiere leer o escribir una hoja dentro de un archivo del espacio de trabajo desde la terminal
    - Estás creando scripts contra el estado del espacio de trabajo y quieres un esquema de direccionamiento estable e independiente del tipo.
    - Estás depurando una ruta `oc://` (valida la sintaxis, mira a qué se resuelve)
summary: Referencia de CLI para `openclaw path` (inspecciona y edita archivos del espacio de trabajo mediante el esquema de direccionamiento `oc://`)
title: Ruta
x-i18n:
    generated_at: "2026-07-05T11:09:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Acceso desde shell al esquema de direccionamiento `oc://`: una sintaxis de rutas despachada por tipo para inspeccionar y editar archivos direccionables del espacio de trabajo (markdown, jsonc, jsonl, yaml/yml/lobster). Quienes se autohospedan, los autores de plugins y las extensiones de editores lo usan para leer, buscar o actualizar una ubicación acotada sin crear manualmente un analizador por archivo.

`path` lo proporciona el Plugin opcional incluido `oc-path`. Habilítalo antes del primer uso:

```bash
openclaw plugins enable oc-path
```

Los verbos de la CLI reflejan el modelo de direccionamiento:

- `resolve` es concreto y de coincidencia única.
- `find` es el verbo de múltiples coincidencias para comodines, uniones, predicados y expansión posicional.
- `set` solo acepta rutas concretas o marcadores de inserción; los patrones con comodines se rechazan antes de escribir.
- `validate` analiza una ruta sin acceso al sistema de archivos.
- `emit` hace una ida y vuelta de un archivo mediante parse + emit (diagnóstico de fidelidad byte a byte).

## Por qué usarlo

El estado de OpenClaw está repartido entre markdown editado por humanos, configuración JSONC con comentarios, registros JSONL de solo anexado y archivos YAML de flujos de trabajo/especificaciones. Scripts, hooks y agentes a menudo necesitan un valor pequeño de esos archivos: una clave de frontmatter, una configuración de plugin, un campo de registro de log, un paso YAML o un elemento de lista bajo una sección con nombre.

`openclaw path` da a esos llamadores una dirección estable en lugar de un grep, una regex o un analizador puntual por cada tipo de archivo. La misma ruta `oc://` se puede validar, resolver, buscar, ejecutar en simulación y escribir desde la terminal, lo que mantiene la automatización acotada revisable y reproducible. Preserva el resto del archivo, de modo que escribir una hoja no altera sus comentarios, finales de línea ni el formato cercano.

Úsalo cuando lo que quieres tiene una dirección lógica, pero la forma del archivo varía:

- Un hook lee una configuración de JSONC con comentarios sin perder comentarios cuando vuelve a escribir el valor.
- Un script de mantenimiento encuentra todos los campos de evento coincidentes en un log JSONL sin cargar todo el log en un analizador personalizado.
- Un editor salta a una sección de markdown o a un elemento de lista por slug, y luego renderiza la línea exacta que resolvió.
- Un agente simula una pequeña edición del espacio de trabajo antes de aplicarla, con los bytes cambiados visibles en la revisión.

Omite `openclaw path` para ediciones ordinarias de archivos completos, migraciones ricas de configuración o escrituras específicas de memoria; esas deben usar el comando o Plugin propietario. `path` es para operaciones pequeñas y direccionables sobre archivos en las que un comando de terminal repetible supera a otro analizador a medida.

## Cómo se usa

Leer un valor de un archivo de configuración editado por humanos:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Previsualizar una escritura sin tocar el disco:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Encontrar registros coincidentes en un log JSONL de solo anexado:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Direccionar una instrucción en markdown por sección y elemento en lugar de por número de línea:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Validar una ruta en CI o en un script de preflight antes de que el script lea o escriba:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Estos comandos están pensados para copiarse en scripts de shell. Usa `--json` cuando un llamador necesite salida estructurada y `--human` cuando una persona esté inspeccionando el resultado.

## Cómo funciona

1. Analiza la dirección `oc://` en ranuras: archivo, sección, elemento, campo y una consulta de sesión opcional.
2. Elige el adaptador de tipo de archivo a partir de la extensión de destino (`.md`, `.jsonc`, `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Resuelve las ranuras contra la estructura de ese tipo de archivo: encabezados/elementos de markdown, claves de objeto/índices de array JSONC, registros de línea JSONL o nodos de mapa/secuencia YAML.
4. Para `set`, emite bytes editados mediante el mismo adaptador, de modo que las partes intactas del archivo conserven sus comentarios, finales de línea y formato cercano cuando el tipo lo admite.

`resolve` y `set` requieren un objetivo concreto. `find` es el verbo exploratorio: expande comodines, uniones, predicados y ordinales en las coincidencias concretas que puedes inspeccionar antes de elegir una para escribir.

## Subcomandos

| Subcomando              | Propósito                                                                   |
| ----------------------- | --------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Imprimir la coincidencia concreta en la ruta (o "no encontrado").           |
| `find <pattern>`        | Enumerar coincidencias para una ruta con comodín / unión / predicado.       |
| `set <oc-path> <value>` | Escribir una hoja u objetivo de inserción en una ruta concreta. Admite `--dry-run`. |
| `validate <oc-path>`    | Solo análisis; imprimir el desglose estructural (archivo / sección / elemento / campo). |
| `emit <file>`           | Hacer una ida y vuelta de un archivo mediante parse + emit (diagnóstico de fidelidad byte a byte). |

## Flags globales

| Flag            | Se aplica a                      | Propósito                                                                |
| --------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | Resolver la ranura de archivo contra este directorio (predeterminado: `process.cwd()`). |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | Sustituir la ruta resuelta de la ranura de archivo (acceso absoluto).    |
| `--json`        | todos                            | Forzar salida JSON (predeterminado cuando stdout no es una TTY).         |
| `--human`       | todos                            | Forzar salida humana (predeterminado cuando stdout es una TTY).          |
| `--value-json`  | `set`                            | Analizar `<value>` como JSON para reemplazo de hojas JSON/JSONC/JSONL.   |
| `--dry-run`     | `set`                            | Imprimir los bytes que se escribirían sin escribir.                      |
| `--diff`        | `set` (requiere `--dry-run`)     | Imprimir un diff unificado en lugar de los bytes completos.              |

`validate` solo acepta `--json` / `--human`; no realiza acceso al sistema de archivos, por lo que `--cwd` y `--file` no se aplican.

## Sintaxis `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Reglas de ranuras: `field` requiere `item`, e `item` requiere `section`. En las cuatro ranuras:

- **Segmentos entre comillas** — `"a/b.c"` sobrevive a los separadores `/` y `.`. El contenido es literal a nivel de bytes; `"` y `\` no están permitidos dentro de las comillas. La ranura de archivo también reconoce comillas: `oc://"skills/email-drafter"/Tools/$last` trata `skills/email-drafter` como una única ruta de archivo.
- **Predicados** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`. Los operadores numéricos requieren que ambos lados se conviertan a números finitos.
- **Uniones** — `{a,b,c}` coincide con cualquiera de las alternativas.
- **Comodines** — `*` (un solo subsegmento) y `**` (cero o más, recursivo). `find` los acepta; `resolve` y `set` los rechazan por ambiguos.
- **Posicional** — `$first` / `$last` se resuelven al primer / último índice o clave declarada.
- **Ordinal** — `#N` para la enésima coincidencia según el orden del documento.
- **Marcadores de inserción** — `+`, `+key`, `+nnn` para inserción con clave / indexada (usar con `set`).
- **Ámbito de sesión** — `?session=cron-daily`, etc. Ortogonal al anidamiento de ranuras. Los valores de sesión son raw, no decodificados por porcentaje; no pueden contener caracteres de control ni delimitadores de consulta reservados (`?`, `&`, `%`).

Los caracteres reservados (`?`, `&`, `%`) fuera de segmentos entre comillas, de predicado o de unión se rechazan. Los caracteres de control (U+0000-U+001F, U+007F) se rechazan en cualquier lugar, incluido el valor de consulta `session`.

`formatOcPath(parseOcPath(path)) === path` está garantizado para rutas canónicas. Los parámetros de consulta no canónicos se ignoran salvo por el primer valor `session=` no vacío.

Límites estrictos: una ruta tiene un máximo de 4096 bytes, como máximo 4 ranuras (archivo/sección/elemento/campo), como máximo 64 subsegmentos con puntos por ranura y como máximo 256 niveles de recorrido anidado para rutas JSON profundas. Por separado, cualquier entrada de archivo JSONC/JSON de más de 16 MiB se rechaza con un diagnóstico de análisis en lugar de analizarse, para cualquier verbo que cargue ese archivo.

## Direccionamiento por tipo de archivo

| Tipo          | Extensiones de archivo       | Modelo de direccionamiento                                                                         |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                       | Secciones H2 por slug, elementos de lista por slug o `#N`, frontmatter mediante `[frontmatter]`.   |
| JSONC/JSON    | `.jsonc`, `.json`           | Claves de objeto e índices de array; los puntos separan subsegmentos anidados salvo que estén entre comillas. |
| JSONL         | `.jsonl`, `.ndjson`         | Direcciones de línea de nivel superior (`L1`, `L2`, `$first`, `$last`), luego descenso estilo JSONC dentro de la línea. |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster` | Claves de mapa e índices de secuencia; los comentarios y el estilo de flujo los maneja la API de documento YAML. |

`resolve` devuelve una coincidencia estructurada: `root`, `node`, `leaf` o `insertion-point`, con un número de línea basado en 1. Los valores de hoja se exponen como texto más un `leafType`, de modo que los autores de plugins puedan renderizar previsualizaciones sin depender de la forma AST específica de cada tipo.

## Contrato de mutación

`set` escribe un objetivo concreto:

- Los valores de frontmatter de Markdown y los campos de elemento `- key: value` son hojas de cadena. Las inserciones de Markdown anexan secciones, claves de frontmatter o elementos de sección, y renderizan una forma markdown canónica para el archivo cambiado. Los cuerpos de sección no se pueden escribir completos mediante `set`.
- Las escrituras de hojas JSONC convierten el valor de cadena al tipo de hoja existente (`string`, `number` finito, `true`/`false` o `null`). Usa `--value-json` cuando un reemplazo de hoja JSONC/JSON/JSONL deba analizar `<value>` como JSON y pueda cambiar de forma, como reemplazar una abreviatura de referencia secreta de cadena por un objeto. Las inserciones de objetos y arrays JSONC analizan `<value>` como JSON y usan la ruta de edición de `jsonc-parser` para escrituras ordinarias de hojas, preservando comentarios y formato cercano.
- Las escrituras de hojas JSONL convierten como JSONC dentro de una línea. El reemplazo de línea completa y el anexado analizan `<value>` como JSON. El JSONL renderizado preserva la convención dominante de finales de línea LF/CRLF del archivo (voto mayoritario entre los saltos de línea del archivo, de modo que un archivo mayoritariamente CRLF permanece CRLF incluso con unos pocos LF sueltos).
- Las escrituras de hojas YAML convierten al tipo escalar existente (`string`, `number` finito, `true`/`false` o `null`). Las inserciones YAML usan la API de documento del paquete `yaml` incluido para actualizaciones de mapas/secuencias. Los documentos YAML malformados con errores de analizador se rechazan antes de la mutación con `parse-error`.

Usa `--dry-run` antes de escrituras visibles para usuarios cuando importen los bytes exactos. Las ediciones JSONC y YAML parchean el documento existente (mediante `jsonc-parser` o la API de documento `yaml`), por lo que los bytes intactos normalmente sobreviven; markdown reconstruye el archivo desde su estructura analizada en cualquier edición, lo que puede normalizar formato incidental fuera de la hoja cambiada. Añade `--diff` cuando quieras la previsualización como un parche enfocado de antes/después en lugar del archivo renderizado completo.

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

Más ejemplos de gramática:

```bash
# Entrecomilla claves que contienen / o .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Las rutas JSON/JSONC profundas pueden usar segmentos con barras; se normalizan a subsegmentos con puntos
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Sustituye una hoja JSONC por un objeto analizado
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Búsqueda por predicado sobre hijos JSONC
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Inserta en un arreglo JSONC
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Inserta una clave de objeto JSONC
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Agrega un evento JSONL
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resuelve la última línea de valor JSONL
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resuelve un paso de flujo de trabajo YAML
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Actualiza un escalar YAML
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Dirige a frontmatter de markdown
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Inserta frontmatter de markdown
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Busca campos de elementos markdown
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Valida una ruta con ámbito de sesión
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Recetas por tipo de archivo

Los mismos cinco verbos funcionan en todos los tipos; el esquema de direccionamiento se despacha según
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

El predicado `[frontmatter]` dirige al bloque de frontmatter YAML; `tools`
coincide con el encabezado `## Tools` mediante slug, y las hojas de elementos conservan su forma de slug
incluso cuando el origen usa guiones bajos (`send_email` se convierte en `send-email`).

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

Las ediciones JSONC pasan por `jsonc-parser`, por lo que los comentarios y los espacios sobreviven a un
`set`. Ejecuta primero con `--dry-run` para inspeccionar los bytes antes de confirmar.
Los archivos `.json` usan el mismo adaptador y ruta de edición que `.jsonc`.

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

Cada línea es un registro. Dirige por predicado (`[event=action]`) cuando no
conozcas el número de línea, o por el segmento canónico `LN` cuando sí.
Los archivos `.ndjson` usan el mismo adaptador que `.jsonl`.

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

YAML usa la API `Document` del paquete `yaml` en lugar de un
analizador hecho a mano, por lo que los recorridos ordinarios de analizar/emitir conservan comentarios y la forma de autoría
mientras las rutas resueltas usan el mismo modelo de clave de mapa / índice de secuencia que
JSONC. El mismo adaptador gestiona archivos `.yaml`, `.yml` y `.lobster`.

## Referencia de subcomandos

### `resolve <oc-path>`

Lee una sola hoja o nodo. Los comodines se rechazan: usa `find` para ellos.
Sale con `0` si hay coincidencia, `1` en una ausencia limpia, `2` ante un error de análisis o un patrón
rechazado.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumera cada coincidencia para un patrón de comodín / predicado / unión. Sale con `0`
si hay al menos una coincidencia, `1` si no hay ninguna. Los comodines en la posición de archivo se rechazan con
`OC_PATH_FILE_WILDCARD_UNSUPPORTED`: pasa un archivo concreto (el globbing
de varios archivos es una función futura).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Escribe una hoja. Combínalo con `--dry-run` para previsualizar los bytes que se
escribirían sin tocar el archivo. Añade `--diff` para una vista previa de diff unificado.
Sale con `0` si la escritura se completa correctamente, `1` si el sustrato la rechaza (por ejemplo, si se activa una
guarda centinela), `2` ante errores de análisis.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

El marcador de inserción `+key` crea el hijo nombrado si todavía no
existe; `+nnn` y `+` sin más funcionan para inserción indexada y agregación,
respectivamente.

### `validate <oc-path>`

Comprobación solo de análisis. Sin acceso al sistema de archivos. Útil cuando quieres confirmar que una
ruta de plantilla está bien formada antes de sustituir variables, o cuando quieres
el desglose estructural para depuración:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Sale con `0` cuando es válida, `1` cuando no lo es (con un `code` y
`message` estructurados), `2` ante errores de argumentos.

### `emit <file>`

Hace un recorrido de ida y vuelta de un archivo por el analizador y emisor de su tipo. La salida debería
ser idéntica byte a byte a la entrada en un archivo sano; cualquier divergencia indica un
error del analizador o la activación de un centinela. Útil para depurar el comportamiento del sustrato en
entradas reales.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Códigos de salida

| Código | Significado                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Éxito. (`resolve` / `find`: al menos una coincidencia. `set`: escritura completada correctamente.) |
| `1`  | Sin coincidencia, o `set` rechazado por el sustrato (sin error a nivel de sistema).      |
| `2`  | Error de argumento o de análisis.                                                   |

## Modo de salida

`openclaw path` detecta TTY: salida legible para humanos en un terminal, JSON cuando
stdout se canaliza o redirige. `--json` y `--human` anulan la
detección automática.

## Notas

- `set` escribe bytes mediante la ruta de emisión del sustrato, que aplica la
  guarda de centinela de redacción automáticamente. Una hoja que contenga
  `__OPENCLAW_REDACTED__` (literalmente o como subcadena) se rechaza en el momento de escritura.
- El análisis JSONC y las ediciones de hojas usan la dependencia local del Plugin `jsonc-parser`,
  por lo que los comentarios y el formato se preservan en escrituras ordinarias de hojas
  en lugar de pasar por una ruta de analizador/reprocesado hecha a mano.
- `path` no conoce el seguimiento ni la recuperación de la configuración last-known-good (LKG);
  ese ciclo de vida pertenece a otra parte. Si un archivo que editas mediante `path` también tiene seguimiento
  LKG, la siguiente lectura de configuración decide si promoverlo o
  recuperarlo; trata una edición de `path` igual que cualquier otra escritura directa en
  ese archivo.

## Relacionado

- [Referencia de CLI](/es/cli)
