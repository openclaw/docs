---
read_when:
    - Quieres leer o escribir un nodo hoja dentro de un archivo del espacio de trabajo desde la terminal
    - Estás escribiendo scripts que usan el estado del espacio de trabajo y quieres un esquema de direccionamiento estable e independiente del tipo
    - Estás depurando una ruta `oc://` (valida la sintaxis, comprueba en qué se resuelve)
summary: Referencia de CLI para `openclaw path` (inspecciona y edita archivos del espacio de trabajo mediante el esquema de direccionamiento `oc://`)
title: Ruta
x-i18n:
    generated_at: "2026-05-11T20:27:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Acceso de shell proporcionado por Plugin al sustrato de direccionamiento `oc://`: un
esquema de rutas despachado por tipo para inspeccionar y editar archivos
direccionables del espacio de trabajo (markdown, jsonc, jsonl). Quienes se autoalojan,
los autores de Plugin y las extensiones de editor lo usan para leer, buscar o
actualizar una ubicación acotada sin crear parsers manuales por archivo.

La CLI refleja los verbos públicos del sustrato:

- `resolve` es concreto y de coincidencia única.
- `find` es el verbo de coincidencia múltiple para comodines, uniones, predicados y
  expansión posicional.
- `set` solo acepta rutas concretas o marcadores de inserción; los patrones comodín se
  rechazan antes de escribir.

`path` lo proporciona el Plugin opcional incluido `oc-path`. Habilítalo antes del
primer uso:

```bash
openclaw plugins enable oc-path
```

## Por qué usarlo

El estado de OpenClaw se distribuye entre markdown editado por humanos,
configuración JSONC con comentarios y registros JSONL de solo anexado. Los scripts de
shell, hooks y agentes suelen necesitar un único valor pequeño de esos archivos: una
clave de frontmatter, una configuración de Plugin, un campo de registro de log o un
elemento de viñeta bajo una sección nombrada.

`openclaw path` da a esos llamadores una dirección estable en lugar de un grep, regex
o parser puntual para cada tipo de archivo. La misma ruta `oc://` se puede validar,
resolver, buscar, ejecutar en modo de prueba y escribir desde la terminal, lo que hace
que la automatización acotada sea más fácil de revisar y más segura de reproducir. Es
especialmente útil cuando quieres actualizar una sola hoja preservando el resto de los
comentarios, finales de línea y formato circundante del archivo.

Úsalo cuando lo que quieres tiene una dirección lógica, pero la forma física del
archivo varía:

- Un hook quiere leer una configuración de JSONC con comentarios sin perder comentarios
  cuando escribe el valor de vuelta.
- Un script de mantenimiento quiere encontrar todos los campos de evento coincidentes
  en un log JSONL sin cargar todo el log en un parser personalizado.
- Una extensión de editor quiere saltar a una sección o elemento de viñeta de markdown
  por slug y luego renderizar la línea exacta a la que se resolvió.
- Un agente quiere ejecutar en modo de prueba una edición diminuta del espacio de
  trabajo antes de aplicarla, con los bytes modificados visibles en la revisión.

Probablemente no necesitas `openclaw path` para ediciones ordinarias de archivo
completo, migraciones ricas de configuración o escrituras específicas de memoria. Esas
deben usar el comando o Plugin propietario. `path` es para operaciones de archivo
pequeñas y direccionables donde un comando de terminal repetible es más claro que otro
parser a medida.

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

Direccionar una instrucción en markdown por sección y elemento en lugar de por número
de línea:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Validar una ruta en CI o en un script de comprobación previa antes de que el script lea
o escriba:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Esos comandos están pensados para poder copiarse en scripts de shell. Usa `--json`
cuando un llamador necesite salida estructurada y `--human` cuando una persona esté
inspeccionando el resultado.

## Cómo funciona

`openclaw path` hace cuatro cosas:

1. Analiza la dirección `oc://` en ranuras: archivo, sección, elemento, campo y
   sesión opcional.
2. Elige el adaptador de tipo de archivo a partir de la extensión de destino (`.md`,
   `.jsonc`, `.jsonl` y alias relacionados).
3. Resuelve las ranuras contra el AST de ese tipo de archivo: encabezados/elementos de
   markdown, claves de objeto/índices de arreglo JSONC o registros de línea JSONL.
4. Para `set`, emite bytes editados mediante el mismo adaptador para que las partes no
   tocadas del archivo conserven sus comentarios, finales de línea y formato cercano
   donde el tipo lo admita.

`resolve` y `set` requieren un único destino concreto. `find` es el verbo
exploratorio: expande comodines, uniones, predicados y ordinales en las coincidencias
concretas que puedes inspeccionar antes de elegir una para escribir.

## Subcomandos

| Subcomando              | Propósito                                                                    |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Imprime la coincidencia concreta en la ruta (o "no encontrado").             |
| `find <pattern>`        | Enumera coincidencias para una ruta con comodín / unión / predicado.         |
| `set <oc-path> <value>` | Escribe una hoja o destino de inserción en una ruta concreta. Admite `--dry-run`. |
| `validate <oc-path>`    | Solo analiza; imprime el desglose estructural (archivo / sección / elemento / campo). |
| `emit <file>`           | Hace round-trip de un archivo mediante `parseXxx` + `emitXxx` (diagnóstico de fidelidad de bytes). |

## Flags globales

| Flag            | Propósito                                                                |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Resuelve la ranura de archivo contra este directorio (predeterminado: `process.cwd()`). |
| `--file <path>` | Sobrescribe la ruta resuelta de la ranura de archivo (acceso absoluto).  |
| `--json`        | Fuerza salida JSON (predeterminado cuando stdout no es una TTY).         |
| `--human`       | Fuerza salida humana (predeterminado cuando stdout es una TTY).          |
| `--dry-run`     | (solo en `set`) imprime los bytes que se escribirían sin escribirlos.    |

## Sintaxis `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Reglas de ranuras: `field` requiere `item`, y `item` requiere `section`. En las cuatro
ranuras:

- **Segmentos entre comillas** — `"a/b.c"` sobrevive a separadores `/` y `.`.
  El contenido es literal de bytes; `"` y `\` no se permiten dentro de comillas.
  La ranura de archivo también reconoce comillas: `oc://"skills/email-drafter"/Tools/$last`
  trata `skills/email-drafter` como una sola ruta de archivo.
- **Predicados** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Las operaciones numéricas requieren que ambos lados se conviertan a números finitos.
- **Uniones** — `{a,b,c}` coincide con cualquiera de las alternativas.
- **Comodines** — `*` (un solo subsegmento) y `**` (cero o más,
  recursivo). `find` los acepta; `resolve` y `set` los rechazan como ambiguos.
- **Posicional** — `$last` se resuelve al último índice / última clave declarada.
- **Ordinal** — `#N` para la enésima coincidencia por orden de documento.
- **Marcadores de inserción** — `+`, `+key`, `+nnn` para inserción con clave / indexada
  (usar con `set`).
- **Ámbito de sesión** — `?session=cron-daily`, etc. Ortogonal al anidamiento de ranuras.
  Los valores de sesión son crudos, no decodificados por porcentaje; no pueden contener
  caracteres de control ni delimitadores de consulta reservados (`?`, `&`, `%`).

Los caracteres reservados (`?`, `&`, `%`) fuera de segmentos entre comillas, de
predicado o de unión se rechazan. Los caracteres de control (U+0000-U+001F, U+007F) se
rechazan en cualquier lugar, incluido el valor de consulta `session`.

`formatOcPath(parseOcPath(path)) === path` está garantizado para rutas canónicas.
Los parámetros de consulta no canónicos se ignoran excepto el primer valor no vacío
`session=`.

## Direccionamiento por tipo de archivo

| Tipo       | Modelo de direccionamiento                                                              |
| ---------- | ---------------------------------------------------------------------------------------- |
| Markdown   | Secciones H2 por slug, elementos de viñeta por slug o `#N`, frontmatter mediante `[frontmatter]`. |
| JSONC/JSON | Claves de objeto e índices de arreglo; los puntos dividen subsegmentos anidados salvo que estén entre comillas. |
| JSONL      | Direcciones de línea de nivel superior (`L1`, `L2`, `$last`), luego descenso estilo JSONC dentro de la línea. |

`resolve` devuelve una coincidencia estructurada: `root`, `node`, `leaf` o
`insertion-point`, con un número de línea basado en 1. Los valores hoja se exponen como
texto más un `leafType` para que los autores de Plugin puedan renderizar
previsualizaciones sin depender de la forma del AST de cada tipo.

## Contrato de mutación

`set` escribe un destino concreto:

- Los valores de frontmatter de Markdown y los campos de elemento `- key: value` son
  hojas de cadena. Las inserciones de Markdown anexan secciones, claves de frontmatter
  o elementos de sección y renderizan una forma markdown canónica para el archivo cambiado.
- Las escrituras de hoja JSONC convierten el valor de cadena al tipo de hoja existente
  (`string`, `number` finito, `true`/`false` o `null`). Las inserciones de objetos y
  arreglos JSONC analizan `<value>` como JSON y usan la ruta de edición de `jsonc-parser`
  para escrituras de hoja ordinarias, preservando comentarios y formato cercano.
- Las escrituras de hoja JSONL convierten como JSONC dentro de una línea. El reemplazo y
  anexado de líneas completas analizan `<value>` como JSON. El JSONL renderizado conserva
  la convención dominante de final de línea LF/CRLF del archivo.

Usa `--dry-run` antes de escrituras visibles para el usuario cuando importen los bytes
exactos. El sustrato preserva salida byte a byte idéntica para round-trips de
parseo/emisión, pero una mutación puede canonicalizar la región editada o el archivo
según el tipo.

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

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Más ejemplos de gramática:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

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

Los mismos cinco verbos funcionan en todos los tipos; el esquema de direccionamiento
despacha según la extensión del archivo. Los ejemplos siguientes usan los fixtures de
la descripción del PR.

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

El predicado `[frontmatter]` direcciona el bloque de frontmatter YAML; `tools`
coincide con el encabezado `## Tools` mediante slug, y las hojas de elementos conservan
su forma de slug incluso cuando el origen usa guiones bajos (`send_email` → `send-email`).

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

Las ediciones de JSONC pasan por `jsonc-parser`, por lo que los comentarios y
los espacios en blanco sobreviven a un `set`. Ejecútalo primero con `--dry-run`
para inspeccionar los bytes antes de confirmar los cambios.

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

Cada línea es un registro. Dirígete a él mediante un predicado
(`[event=action]`) cuando no sepas el número de línea, o mediante el segmento
canónico `LN` cuando sí lo sepas.

## Referencia de subcomandos

### `resolve <oc-path>`

Lee una única hoja o nodo. Los comodines se rechazan: usa `find` para ellos.
Sale con `0` si hay coincidencia, `1` si no hay coincidencia de forma limpia,
`2` si hay un error de análisis o un patrón rechazado.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumera todas las coincidencias de un patrón con comodines, predicados o
uniones. Sale con `0` si hay al menos una coincidencia, `1` si no hay ninguna.
Los comodines en la posición de archivo se rechazan con
`OC_PATH_FILE_WILDCARD_UNSUPPORTED`: pasa un archivo concreto (la expansión de
globos en múltiples archivos es una función futura).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Escribe una hoja. Combínalo con `--dry-run` para previsualizar los bytes que se
escribirían sin tocar el archivo. Sale con `0` si la escritura se completa
correctamente, `1` si el sustrato la rechaza (por ejemplo, por activar una
protección centinela), `2` si hay errores de análisis.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

El marcador de inserción `+key` crea el elemento secundario con ese nombre si
todavía no existe; `+nnn` y `+` solo funcionan para inserción indexada y anexada,
respectivamente.

### `validate <oc-path>`

Comprobación solo de análisis. Sin acceso al sistema de archivos. Útil cuando
quieres confirmar que una ruta de plantilla está bien formada antes de sustituir
variables, o cuando quieres el desglose estructural para depuración:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Sale con `0` cuando es válido, `1` cuando no es válido (con un `code` y un
`message` estructurados), `2` si hay errores de argumentos.

### `emit <file>`

Hace un recorrido de ida y vuelta de un archivo por el analizador y emisor
correspondientes a cada tipo. La salida debería ser idéntica byte a byte a la
entrada en un archivo correcto: una divergencia indica un error del analizador o
la activación de un centinela. Útil para depurar el comportamiento del sustrato
con entradas reales.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Códigos de salida

| Código | Significado                                                                        |
| ------ | ---------------------------------------------------------------------------------- |
| `0`    | Correcto. (`resolve` / `find`: al menos una coincidencia. `set`: escritura exitosa.) |
| `1`    | Sin coincidencias, o `set` rechazado por el sustrato (sin error de nivel sistema). |
| `2`    | Error de argumentos o de análisis.                                                 |

## Modo de salida

`openclaw path` detecta si usa TTY: salida legible por humanos en una terminal,
JSON cuando stdout se canaliza o redirige. `--json` y `--human` anulan la
detección automática.

## Notas

- `set` escribe bytes mediante la ruta de emisión del sustrato, que aplica
  automáticamente la protección del centinela de redacción. Una hoja que lleve
  `__OPENCLAW_REDACTED__` (literalmente o como subcadena) se rechaza en el
  momento de escritura.
- El análisis de JSONC y las ediciones de hojas usan la dependencia
  `jsonc-parser` local del plugin, por lo que los comentarios y el formato se
  conservan en escrituras ordinarias de hojas, en lugar de pasar por una ruta de
  analizador y regeneración manual.
- `path` no sabe nada de LKG. Si el archivo está rastreado por LKG, la siguiente
  llamada de observación decide si promocionar o recuperar. Está previsto
  `set --batch` para múltiples `set` atómicos mediante el ciclo de vida de
  promoción y recuperación de LKG, junto con el sustrato de recuperación de LKG.

## Relacionado

- [Referencia de CLI](/es/cli)
