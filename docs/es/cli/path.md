---
read_when:
    - Quieres leer o escribir una hoja dentro de un archivo del espacio de trabajo desde la terminal
    - Estás creando scripts contra el estado del workspace y quieres un esquema de direccionamiento estable e independiente del tipo.
    - Estás depurando una ruta `oc://` (valida la sintaxis, mira a qué se resuelve)
summary: Referencia de la CLI para `openclaw path` (inspeccione y edite archivos del espacio de trabajo mediante el esquema de direccionamiento `oc://`)
title: Ruta
x-i18n:
    generated_at: "2026-06-27T11:03:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Acceso de shell proporcionado por un Plugin al sustrato de direccionamiento `oc://`: un
esquema de rutas despachado por tipo para inspeccionar y editar archivos de
espacio de trabajo direccionables (markdown, jsonc, jsonl, yaml/yml/lobster). Quienes se autoalojan, los autores de Plugins
y las extensiones de editor lo usan para leer, buscar o actualizar una ubicación
acotada sin crear analizadores específicos para cada tipo de archivo.

La CLI refleja los verbos públicos del sustrato:

- `resolve` es concreto y de coincidencia única.
- `find` es el verbo de coincidencias múltiples para comodines, uniones, predicados y
  expansión posicional.
- `set` solo acepta rutas concretas o marcadores de inserción; los patrones con comodines se
  rechazan antes de escribir.

`path` lo proporciona el Plugin opcional incluido `oc-path`. Habilítalo antes del
primer uso:

```bash
openclaw plugins enable oc-path
```

## Por qué usarlo

El estado de OpenClaw está distribuido entre markdown editado por humanos, configuración JSONC con comentarios,
registros JSONL de solo anexado y archivos YAML de flujo de trabajo/especificación. Los scripts de shell, hooks
y agentes a menudo necesitan un valor pequeño de esos archivos: una clave de frontmatter, una
configuración de Plugin, un campo de registro de log, un paso YAML o un elemento de viñeta bajo una sección
nombrada.

`openclaw path` ofrece a esos llamadores una dirección estable en lugar de un grep,
regex o analizador puntual para cada tipo de archivo. La misma ruta `oc://` se puede validar,
resolver, buscar, simular y escribir desde la terminal, lo que hace que la automatización acotada
sea más fácil de revisar y más segura de reproducir. Es especialmente útil cuando
quieres actualizar una hoja mientras preservas el resto de los comentarios del archivo,
los finales de línea y el formato circundante.

Úsalo cuando lo que quieres tiene una dirección lógica, pero la forma física del archivo
varía:

- Un hook quiere leer una configuración de JSONC con comentarios sin perder comentarios
  cuando vuelve a escribir el valor.
- Un script de mantenimiento quiere encontrar todos los campos de eventos coincidentes en un log JSONL
  sin cargar todo el log en un analizador personalizado.
- Una extensión de editor quiere saltar a una sección markdown o elemento de viñeta por
  slug y luego renderizar la línea exacta a la que se resolvió.
- Un agente quiere simular una edición mínima del espacio de trabajo antes de aplicarla, con los
  bytes cambiados visibles en la revisión.

Probablemente no necesitas `openclaw path` para ediciones ordinarias de archivo completo, migraciones
ricas de configuración o escrituras específicas de memoria. Esas deben usar el comando o Plugin
propietario. `path` es para operaciones pequeñas de archivo direccionable donde un
comando de terminal repetible es más claro que otro analizador a medida.

## Cómo se usa

Leer un valor de un archivo de configuración editado por humanos:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Previsualizar una escritura sin tocar el disco:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Buscar registros coincidentes en un log JSONL de solo anexado:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Direccionar una instrucción en markdown por sección y elemento en lugar de por número de
línea:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Validar una ruta en CI o un script de preflight antes de que el script lea o escriba:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Esos comandos están pensados para poder copiarse en scripts de shell. Usa `--json` cuando un
llamador necesita salida estructurada y `--human` cuando una persona está inspeccionando el
resultado.

## Cómo funciona

`openclaw path` hace cuatro cosas:

1. Analiza la dirección `oc://` en ranuras: archivo, sección, elemento, campo y
   sesión opcional.
2. Elige el adaptador de tipo de archivo a partir de la extensión de destino (`.md`, `.jsonc`,
   `.jsonl`, `.yaml`, `.yml`, `.lobster` y alias relacionados).
3. Resuelve las ranuras contra el AST de ese tipo de archivo: encabezados/elementos markdown,
   claves de objeto/índices de array JSONC, registros de línea JSONL o nodos
   mapa/secuencia YAML.
4. Para `set`, emite bytes editados mediante el mismo adaptador para que las partes
   no tocadas del archivo conserven sus comentarios, finales de línea y formato cercano
   donde el tipo lo admite.

`resolve` y `set` requieren un destino concreto. `find` es el verbo exploratorio:
expande comodines, uniones, predicados y ordinales en las coincidencias concretas
que puedes inspeccionar antes de elegir una para escribir.

## Subcomandos

| Subcomando             | Propósito                                                                    |
| ---------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`    | Imprimir la coincidencia concreta en la ruta (o "no encontrado").             |
| `find <pattern>`       | Enumerar coincidencias para una ruta con comodín / unión / predicado.         |
| `set <oc-path> <value>` | Escribir una hoja o destino de inserción en una ruta concreta. Admite `--dry-run`. |
| `validate <oc-path>`   | Solo analizar; imprimir desglose estructural (archivo / sección / elemento / campo). |
| `emit <file>`          | Hacer round-trip de un archivo mediante `parseXxx` + `emitXxx` (diagnóstico de fidelidad de bytes). |

## Flags globales

| Flag            | Propósito                                                                 |
| --------------- | ------------------------------------------------------------------------- |
| `--cwd <dir>`   | Resolver la ranura de archivo contra este directorio (predeterminado: `process.cwd()`). |
| `--file <path>` | Anular la ruta resuelta de la ranura de archivo (acceso absoluto).         |
| `--json`        | Forzar salida JSON (predeterminado cuando stdout no es una TTY).           |
| `--human`       | Forzar salida humana (predeterminado cuando stdout es una TTY).            |
| `--dry-run`     | (solo en `set`) imprimir los bytes que se escribirían sin escribir.        |
| `--diff`        | (con `set --dry-run`) imprimir un diff unificado en lugar de los bytes completos. |

## Sintaxis `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Reglas de ranuras: `field` requiere `item`, y `item` requiere `section`. En las cuatro
ranuras:

- **Segmentos entre comillas** — `"a/b.c"` sobrevive a los separadores `/` y `.`.
  El contenido es literal de bytes; `"` y `\` no se permiten dentro de comillas.
  La ranura de archivo también reconoce comillas: `oc://"skills/email-drafter"/Tools/$last`
  trata `skills/email-drafter` como una sola ruta de archivo.
- **Predicados** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Las operaciones numéricas requieren que ambos lados se conviertan a números finitos.
- **Uniones** — `{a,b,c}` coincide con cualquiera de las alternativas.
- **Comodines** — `*` (un solo subsegmento) y `**` (cero o más,
  recursivo). `find` los acepta; `resolve` y `set` los rechazan por
  ambiguos.
- **Posicional** — `$first` / `$last` se resuelven al primer / último índice o
  clave declarada.
- **Ordinal** — `#N` para la enésima coincidencia por orden del documento.
- **Marcadores de inserción** — `+`, `+key`, `+nnn` para inserción con clave / indexada
  (usar con `set`).
- **Ámbito de sesión** — `?session=cron-daily`, etc. Ortogonal al anidamiento de
  ranuras. Los valores de sesión son sin procesar, no decodificados por porcentaje; no pueden contener
  caracteres de control ni delimitadores de consulta reservados (`?`, `&`, `%`).

Los caracteres reservados (`?`, `&`, `%`) fuera de segmentos entre comillas, predicado o unión
se rechazan. Los caracteres de control (U+0000-U+001F, U+007F) se rechazan
en cualquier lugar, incluido el valor de consulta `session`.

`formatOcPath(parseOcPath(path)) === path` está garantizado para rutas canónicas.
Los parámetros de consulta no canónicos se ignoran excepto por el primer valor
`session=` no vacío.

## Direccionamiento por tipo de archivo

| Tipo              | Modelo de direccionamiento                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Markdown          | Secciones H2 por slug, elementos de viñeta por slug o `#N`, frontmatter mediante `[frontmatter]`. |
| JSONC/JSON        | Claves de objeto e índices de array; los puntos dividen subsegmentos anidados salvo que estén entre comillas. |
| JSONL             | Direcciones de línea de nivel superior (`L1`, `L2`, `$first`, `$last`), luego descenso estilo JSONC dentro de la línea. |
| YAML/YML/.lobster | Claves de mapa e índices de secuencia; los comentarios y el estilo flow los maneja la API de documento YAML. |

`resolve` devuelve una coincidencia estructurada: `root`, `node`, `leaf` o
`insertion-point`, con un número de línea basado en 1. Los valores hoja se exponen como texto
más un `leafType` para que los autores de Plugins puedan renderizar vistas previas sin depender de
la forma AST específica de cada tipo.

## Contrato de mutación

`set` escribe un destino concreto:

- Los valores de frontmatter markdown y los campos de elemento `- key: value` son hojas de cadena.
  Las inserciones markdown anexan secciones, claves de frontmatter o elementos de sección y
  renderizan una forma markdown canónica para el archivo cambiado.
- Las escrituras de hojas JSONC convierten el valor de cadena al tipo de hoja existente
  (`string`, `number` finito, `true`/`false` o `null`). Usa `--value-json`
  cuando un reemplazo de hoja JSONC/JSON/JSONL deba analizar `<value>` como JSON y
  pueda cambiar de forma, como reemplazar un atajo de cadena SecretRef por un
  objeto. Las inserciones de objeto y array JSONC analizan `<value>` como JSON y usan la
  ruta de edición de `jsonc-parser` para escrituras ordinarias de hojas, preservando comentarios y
  formato cercano.
- Las escrituras de hojas JSONL convierten como JSONC dentro de una línea. El reemplazo de línea completa y
  el anexado analizan `<value>` como JSON. El JSONL renderizado preserva la convención dominante
  de finales de línea LF/CRLF del archivo.
- Las escrituras de hojas YAML convierten al tipo escalar existente (`string`, `number`
  finito, `true`/`false` o `null`). Las inserciones YAML usan la API de documento
  del paquete `yaml` incluido para actualizaciones de mapa/secuencia. Los documentos YAML mal formados
  con errores de analizador se rechazan antes de la mutación con `parse-error`.

Usa `--dry-run` antes de escrituras visibles para el usuario cuando los bytes exactos importan. El
sustrato preserva salida idéntica byte a byte para round-trips de parseo/emisión, pero una
mutación puede canonizar la región editada o el archivo según el tipo.
Añade `--diff` cuando quieras la vista previa como un parche antes/después enfocado en lugar
del archivo renderizado completo.

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

Los mismos cinco verbos funcionan en todos los tipos; el esquema de direccionamiento despacha según la extensión del archivo. Los ejemplos siguientes usan los fixtures de la descripción del PR.

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

El predicado `[frontmatter]` direcciona el bloque de frontmatter YAML; `tools` coincide con el encabezado `## Tools` mediante slug, y las hojas de elementos conservan su forma de slug incluso cuando la fuente usa guiones bajos (`send_email` → `send-email`).

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

Las ediciones JSONC pasan por `jsonc-parser`, por lo que los comentarios y los espacios en blanco sobreviven a un `set`. Ejecuta primero con `--dry-run` para inspeccionar los bytes antes de confirmar.

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

Cada línea es un registro. Direcciona por predicado (`[event=action]`) cuando no conozcas el número de línea, o por el segmento canónico `LN` cuando sí lo conozcas.

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

YAML usa la API `Document` del paquete `yaml` en lugar de un parser manual, por lo que los ciclos ordinarios de análisis/emisión conservan los comentarios y la forma de autoría, mientras que las rutas resueltas usan el mismo modelo de clave de mapa / índice de secuencia que JSONC. El mismo adaptador maneja archivos `.yaml`, `.yml` y `.lobster`.

## Referencia de subcomandos

### `resolve <oc-path>`

Lee una sola hoja o nodo. Los comodines se rechazan; usa `find` para ellos. Sale con `0` si hay coincidencia, `1` si no hay coincidencia limpia, `2` si hay un error de análisis o un patrón rechazado.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumera cada coincidencia para un patrón de comodín / predicado / unión. Sale con `0` si hay al menos una coincidencia, `1` si no hay ninguna. Los comodines en la ranura de archivo se rechazan con `OC_PATH_FILE_WILDCARD_UNSUPPORTED`; pasa un archivo concreto (el globbing de varios archivos es una función futura).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Escribe una hoja. Combínalo con `--dry-run` para previsualizar los bytes que se escribirían sin tocar el archivo. Agrega `--diff` para una vista previa de diff unificado. Sale con `0` si la escritura se realiza correctamente, `1` si el sustrato la rechaza (por ejemplo, por activar una guarda centinela), `2` si hay errores de análisis.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

El marcador de inserción `+key` crea el hijo nombrado si aún no existe; `+nnn` y `+` simple funcionan para inserción indexada y anexado, respectivamente.

### `validate <oc-path>`

Comprobación solo de análisis. Sin acceso al sistema de archivos. Útil cuando quieres confirmar que una ruta de plantilla está bien formada antes de sustituir variables, o cuando quieres el desglose estructural para depuración:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Sale con `0` si es válido, `1` si no es válido (con un `code` y un `message` estructurados), `2` si hay errores de argumentos.

### `emit <file>`

Hace un ciclo de ida y vuelta de un archivo mediante el parser y el emisor por tipo. La salida debería ser idéntica byte por byte a la entrada en un archivo correcto; una divergencia indica un error del parser o la activación de un centinela. Útil para depurar el comportamiento del sustrato en entradas reales.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Códigos de salida

| Código | Significado                                                               |
| ------ | ------------------------------------------------------------------------- |
| `0`    | Correcto. (`resolve` / `find`: al menos una coincidencia. `set`: escritura correcta.) |
| `1`    | Sin coincidencia, o `set` rechazado por el sustrato (sin error de nivel de sistema). |
| `2`    | Error de argumentos o de análisis.                                        |

## Modo de salida

`openclaw path` detecta TTY: salida legible por humanos en una terminal, JSON cuando stdout se canaliza o redirige. `--json` y `--human` anulan la autodetección.

## Notas

- `set` escribe bytes mediante la ruta de emisión del sustrato, que aplica automáticamente la guarda de centinela de redacción. Una hoja que contenga `__OPENCLAW_REDACTED__` (literalmente o como subcadena) se rechaza en el momento de escritura.
- El análisis JSONC y las ediciones de hojas usan la dependencia `jsonc-parser` local del plugin, por lo que los comentarios y el formato se preservan en escrituras ordinarias de hojas en lugar de pasar por una ruta de parser/renderizado manual.
- `path` no conoce LKG. Si el archivo está rastreado por LKG, la siguiente llamada `observe` decide si promover / recuperar. `set --batch` para multisets atómicos mediante el ciclo de vida de promover/recuperar de LKG está planificado junto con el sustrato de recuperación de LKG.

## Relacionado

- [Referencia de CLI](/es/cli)
