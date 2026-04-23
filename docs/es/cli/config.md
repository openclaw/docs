---
read_when:
    - Quieres leer o editar la configuración sin interacción
summary: Referencia de la CLI para `openclaw config` (get/set/unset/file/schema/validate)
title: config
x-i18n:
    generated_at: "2026-04-23T14:00:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b496b6c02eeb144bfe800b801ea48a178b02bc7a87197dbf189b27d6fcf41c9
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Helpers de configuración para ediciones sin interacción en `openclaw.json`: obtener/establecer/eliminar/archivo/esquema/validar
valores por ruta e imprimir el archivo de configuración activo. Ejecútalo sin un subcomando para
abrir el asistente de configuración (igual que `openclaw configure`).

Opciones raíz:

- `--section <section>`: filtro repetible de secciones de configuración guiada cuando ejecutas `openclaw config` sin un subcomando

Secciones guiadas compatibles:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Ejemplos

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Imprime el esquema JSON generado para `openclaw.json` en stdout como JSON.

Qué incluye:

- El esquema actual de configuración raíz, más un campo de cadena `$schema` en la raíz para herramientas del editor
- Los metadatos de documentación de los campos `title` y `description` usados por la interfaz de Control
- Los nodos de objetos anidados, comodines (`*`) y elementos de arreglo (`[]`) heredan los mismos metadatos `title` / `description` cuando existe documentación del campo coincidente
- Las ramas `anyOf` / `oneOf` / `allOf` también heredan los mismos metadatos de documentación cuando existe documentación del campo coincidente
- Metadatos de esquema de plugins + canales en vivo en el mejor esfuerzo cuando se pueden cargar los manifiestos en tiempo de ejecución
- Un esquema de respaldo limpio incluso cuando la configuración actual no es válida

RPC de tiempo de ejecución relacionado:

- `config.schema.lookup` devuelve una ruta de configuración normalizada con un nodo de
  esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes),
  metadatos coincidentes de sugerencias de interfaz y resúmenes de hijos inmediatos. Úsalo para
  profundización acotada por ruta en la interfaz de Control o en clientes personalizados.

```bash
openclaw config schema
```

Canalízalo a un archivo cuando quieras inspeccionarlo o validarlo con otras herramientas:

```bash
openclaw config schema > openclaw.schema.json
```

### Rutas

Las rutas usan notación de punto o de corchetes:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Usa el índice de la lista de agentes para apuntar a un agente específico:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valores

Los valores se analizan como JSON5 cuando es posible; de lo contrario, se tratan como cadenas.
Usa `--strict-json` para exigir el análisis JSON5. `--json` sigue siendo compatible como alias heredado.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime el valor sin procesar como JSON en lugar de texto con formato de terminal.

La asignación de objetos reemplaza la ruta de destino de forma predeterminada. Las rutas protegidas de mapa/lista
que suelen contener entradas agregadas por el usuario, como `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` y
`auth.profiles`, rechazan reemplazos que eliminarían entradas existentes a menos
que pases `--replace`.

Usa `--merge` al agregar entradas a esos mapas:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usa `--replace` solo cuando realmente quieras que el valor proporcionado pase a ser
el valor de destino completo.

## Modos de `config set`

`openclaw config set` admite cuatro estilos de asignación:

1. Modo valor: `openclaw config set <path> <value>`
2. Modo de creación de SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Modo de creación de proveedor (solo ruta `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Modo por lotes (`--batch-json` o `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

Nota de política:

- Las asignaciones de SecretRef se rechazan en superficies mutables en tiempo de ejecución no compatibles (por ejemplo `hooks.token`, `commands.ownerDisplaySecret`, tokens de Webhook de vinculación de hilos de Discord y JSON de credenciales de WhatsApp). Consulta [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).

El análisis por lotes siempre usa la carga útil del lote (`--batch-json`/`--batch-file`) como fuente de verdad.
`--strict-json` / `--json` no cambian el comportamiento de análisis por lotes.

El modo JSON de ruta/valor sigue siendo compatible tanto para SecretRef como para proveedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Indicadores del creador de proveedor

Los destinos del creador de proveedor deben usar `secrets.providers.<alias>` como ruta.

Indicadores comunes:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Proveedor env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (repetible)

Proveedor file (`--provider-source file`):

- `--provider-path <path>` (obligatorio)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Proveedor exec (`--provider-source exec`):

- `--provider-command <path>` (obligatorio)
- `--provider-arg <arg>` (repetible)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (repetible)
- `--provider-pass-env <ENV_VAR>` (repetible)
- `--provider-trusted-dir <path>` (repetible)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Ejemplo de proveedor exec reforzado:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Simulación

Usa `--dry-run` para validar cambios sin escribir en `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Comportamiento de la simulación:

- Modo creador: ejecuta comprobaciones de resolubilidad de SecretRef para refs/proveedores modificados.
- Modo JSON (`--strict-json`, `--json` o modo por lotes): ejecuta validación de esquema más comprobaciones de resolubilidad de SecretRef.
- La validación de políticas también se ejecuta para superficies de destino de SecretRef incompatibles conocidas.
- Las comprobaciones de política evalúan toda la configuración posterior al cambio, por lo que las escrituras de objetos padre (por ejemplo establecer `hooks` como objeto) no pueden omitir la validación de superficies incompatibles.
- Las comprobaciones de SecretRef de exec se omiten de forma predeterminada durante la simulación para evitar efectos secundarios de comandos.
- Usa `--allow-exec` con `--dry-run` para habilitar las comprobaciones de SecretRef de exec (esto puede ejecutar comandos del proveedor).
- `--allow-exec` es solo para simulación y genera un error si se usa sin `--dry-run`.

`--dry-run --json` imprime un informe legible por máquina:

- `ok`: si la simulación pasó
- `operations`: número de asignaciones evaluadas
- `checks`: si se ejecutaron comprobaciones de esquema/resolubilidad
- `checks.resolvabilityComplete`: si las comprobaciones de resolubilidad se completaron (false cuando se omiten refs de exec)
- `refsChecked`: número de refs realmente resueltas durante la simulación
- `skippedExecRefs`: número de refs de exec omitidas porque no se estableció `--allow-exec`
- `errors`: fallos estructurados de esquema/resolubilidad cuando `ok=false`

### Forma de la salida JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

Ejemplo de éxito:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

Ejemplo de fallo:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Si la simulación falla:

- `config schema validation failed`: la forma de tu configuración posterior al cambio no es válida; corrige la ruta/valor o la forma del objeto proveedor/ref.
- `Config policy validation failed: unsupported SecretRef usage`: vuelve a mover esa credencial a una entrada de texto sin formato/cadena y mantén SecretRefs solo en superficies compatibles.
- `SecretRef assignment(s) could not be resolved`: el proveedor/ref referenciado actualmente no puede resolverse (variable de entorno faltante, puntero de archivo no válido, fallo del proveedor exec o incompatibilidad de proveedor/origen).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: la simulación omitió refs de exec; vuelve a ejecutarla con `--allow-exec` si necesitas validar la resolubilidad de exec.
- Para el modo por lotes, corrige las entradas fallidas y vuelve a ejecutar `--dry-run` antes de escribir.

## Seguridad de escritura

`openclaw config set` y otros escritores de configuración controlados por OpenClaw validan toda la
configuración posterior al cambio antes de confirmarla en disco. Si la nueva carga útil falla la
validación de esquema o parece una sobrescritura destructiva, la configuración activa se deja intacta
y la carga útil rechazada se guarda junto a ella como `openclaw.json.rejected.*`.
La ruta de configuración activa debe ser un archivo normal. Los diseños con `openclaw.json`
enlace simbólico no son compatibles para escrituras; usa `OPENCLAW_CONFIG_PATH` para apuntar directamente
al archivo real en su lugar.

Prefiere escrituras por CLI para ediciones pequeñas:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si una escritura es rechazada, inspecciona la carga útil guardada y corrige la forma completa de la configuración:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Las escrituras directas del editor siguen estando permitidas, pero el Gateway en ejecución las trata como
no confiables hasta que validan. Las ediciones directas no válidas se pueden restaurar desde la
copia de seguridad de último estado válido durante el inicio o la recarga en caliente. Consulta
[Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Subcomandos

- `config file`: Imprime la ruta del archivo de configuración activo (resuelta desde `OPENCLAW_CONFIG_PATH` o la ubicación predeterminada). La ruta debe nombrar un archivo normal, no un enlace simbólico.

Reinicia el Gateway después de las ediciones.

## Validar

Valida la configuración actual contra el esquema activo sin iniciar el
Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Después de que `openclaw config validate` pase, puedes usar la TUI local para que
un agente integrado compare la configuración activa con la documentación mientras validas
cada cambio desde la misma terminal:

Si la validación ya está fallando, empieza con `openclaw configure` o
`openclaw doctor --fix`. `openclaw chat` no omite la protección contra
configuración no válida.

```bash
openclaw chat
```

Luego, dentro de la TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Bucle de reparación típico:

- Pide al agente que compare tu configuración actual con la página de documentación relevante y sugiera la corrección más pequeña.
- Aplica ediciones específicas con `openclaw config set` o `openclaw configure`.
- Vuelve a ejecutar `openclaw config validate` después de cada cambio.
- Si la validación pasa pero el tiempo de ejecución sigue sin estar en buen estado, ejecuta `openclaw doctor` o `openclaw doctor --fix` para obtener ayuda con migración y reparación.
