---
read_when:
    - Quieres leer o editar la configuración de forma no interactiva
sidebarTitle: Config
summary: Referencia de CLI para `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Config
x-i18n:
    generated_at: "2026-07-05T11:06:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e338747649c0780d422ddcea3b86bed78fddd1d73d0dff73e5c2e8d60982ed0
    source_path: cli/config.md
    workflow: 16
---

Ayudantes no interactivos para `openclaw.json`: obtener/establecer/parchear/anular un valor por ruta, imprimir el esquema, validar o imprimir la ruta del archivo activo. Ejecuta `openclaw config` sin subcomando para abrir el mismo asistente guiado que `openclaw configure`.

<Note>
Cuando `OPENCLAW_NIX_MODE=1`, OpenClaw trata `openclaw.json` como inmutable. Los comandos de solo lectura (`config get`, `config file`, `config schema`, `config validate`) siguen funcionando; los escritores de configuración se rechazan. Edita en su lugar el origen de Nix de la instalación; para la distribución propia nix-openclaw, usa la [Guía rápida de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) y define valores en `programs.openclaw.config` o `instances.<name>.config`.
</Note>

## Opciones raíz

<ParamField path="--section <section>" type="string">
  Filtro repetible de sección de configuración guiada cuando ejecutas `openclaw config` sin un subcomando.
</ParamField>

Secciones guiadas: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## Ejemplos

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### Rutas

Notación de punto o de corchetes. Pon entre comillas las rutas con corchetes en ejemplos de shell para que zsh no expanda `[0]` como patrón glob:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Lee un valor de la instantánea de configuración redactada (los secretos nunca se imprimen). `--json` imprime el valor sin procesar como JSON; de lo contrario, las cadenas/números/booleanos se imprimen sin formato y los objetos/arreglos se imprimen como JSON formateado.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Imprime la ruta del archivo de configuración activo, resuelta desde `OPENCLAW_CONFIG_PATH` o la ubicación predeterminada. La ruta apunta a un archivo normal, no a un enlace simbólico; consulta [Seguridad de escritura](#write-safety).

### `config schema`

Imprime en stdout el esquema JSON generado para `openclaw.json`.

<AccordionGroup>
  <Accordion title="What it includes">
    - El esquema de configuración raíz actual, más un campo de cadena raíz `$schema` para herramientas de edición.
    - Metadatos de documentación `title` / `description` de campos usados por la Control UI.
    - Los nodos de objeto anidado, comodín (`*`) y elemento de arreglo (`[]`) heredan los mismos metadatos `title` / `description` cuando existen documentos de campo coincidentes.
    - Las ramas `anyOf` / `oneOf` / `allOf` también heredan los mismos metadatos de documentación.
    - Metadatos de esquema de Plugin + canal en vivo con el mejor esfuerzo cuando se pueden cargar manifiestos de runtime.
    - Un esquema de respaldo limpio incluso cuando la configuración actual no es válida.

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` devuelve una ruta de configuración normalizada con un nodo de esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes), metadatos de sugerencia de UI coincidentes y resúmenes de hijos inmediatos. Úsalo para exploración detallada por ruta en Control UI o clientes personalizados.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Valida la configuración actual contra el esquema activo sin iniciar el Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Si la validación ya falla, empieza con `openclaw configure` o `openclaw doctor --fix`. `openclaw chat` no omite la protección contra configuración no válida.
</Note>

## Valores

Los valores se analizan como JSON5 cuando es posible; de lo contrario se tratan como cadenas sin procesar. Usa `--strict-json` para exigir JSON estándar sin respaldo de cadena (entonces se rechaza la sintaxis solo de JSON5, como comentarios, comas finales o claves sin comillas). `--json` es un alias heredado de `--strict-json` en `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime el valor sin procesar como JSON en lugar de texto formateado para terminal.

<Note>
La asignación de objetos reemplaza la ruta de destino de forma predeterminada. Las rutas protegidas que suelen contener entradas agregadas por el usuario rechazan reemplazos que eliminarían entradas existentes, a menos que pases `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` y `auth.profiles`.
</Note>

Usa `--merge` al agregar entradas a esos mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usa `--replace` solo cuando el valor proporcionado deba convertirse intencionalmente en el valor completo de destino.

## Modos de `config set`

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    Solo se admiten rutas de destino `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
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

  </Tab>
</Tabs>

<Warning>
Las asignaciones de SecretRef se rechazan en superficies mutables en runtime no admitidas (por ejemplo, `hooks.token`, `commands.ownerDisplaySecret`, tokens de Webhook de vinculación de hilos de Discord y JSON de credenciales de WhatsApp). Consulta [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).
</Warning>

El análisis por lotes siempre usa la carga por lotes (`--batch-json`/`--batch-file`) como fuente de verdad; `--strict-json` / `--json` no cambian el comportamiento de análisis por lotes.

El modo de ruta/valor JSON también funciona directamente para SecretRefs y proveedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Banderas del generador de proveedores

Los destinos del generador de proveedores deben usar `secrets.providers.<alias>` como ruta.

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (repetible)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (obligatorio)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
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

  </Accordion>
</AccordionGroup>

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

## `config patch`

Pega o canaliza un parche JSON5 con forma de configuración en lugar de ejecutar muchos comandos `config set` basados en rutas. Los objetos se fusionan recursivamente; los arreglos y valores escalares reemplazan el destino; `null` elimina la ruta de destino.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Canaliza un parche por stdin para scripts de configuración remota:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Parche de ejemplo:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

Usa `--replace-path <path>` cuando un objeto o arreglo deba convertirse exactamente en el valor proporcionado en lugar de parchearse recursivamente:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` ejecuta comprobaciones de esquema y de resolubilidad de SecretRef sin escribir. Los SecretRefs respaldados por exec se omiten de forma predeterminada durante dry-run; agrega `--allow-exec` cuando quieras intencionalmente que dry-run ejecute comandos de proveedor.

## Simulación

`--dry-run` valida cambios sin escribir `openclaw.json`. Disponible en `config set`, `config patch` y `config unset`.

```bash
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

<AccordionGroup>
  <Accordion title="Comportamiento de simulación">
    - Modo constructor: ejecuta comprobaciones de resolubilidad de SecretRef para refs/proveedores modificados.
    - Modo JSON (`--strict-json`, `--json` o modo por lotes): ejecuta la validación de esquema más comprobaciones de resolubilidad de SecretRef.
    - La validación de políticas se ejecuta contra la configuración completa posterior al cambio, por lo que las escrituras de objetos padre (por ejemplo, establecer `hooks` como un objeto) no pueden eludir la validación de superficies no admitidas.
    - Las comprobaciones de SecretRef de exec se omiten por defecto para evitar efectos secundarios de comandos; pasa `--allow-exec` para habilitarlas (esto puede ejecutar comandos de proveedores). `--allow-exec` solo es para simulación y da error sin `--dry-run`.

  </Accordion>
  <Accordion title="Campos de --dry-run --json">
    - `ok`: si la simulación pasó
    - `operations`: número de asignaciones evaluadas
    - `checks`: si se ejecutaron comprobaciones de esquema/resolubilidad
    - `checks.resolvabilityComplete`: si las comprobaciones de resolubilidad se ejecutaron hasta completarse (false cuando se omiten refs de exec)
    - `refsChecked`: número de refs resueltas realmente durante la simulación
    - `skippedExecRefs`: número de refs de exec omitidas porque `--allow-exec` no estaba establecido
    - `errors`: fallos estructurados de ruta faltante, esquema o resolubilidad cuando `ok=false`

  </Accordion>
</AccordionGroup>

### Forma de salida JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Ejemplo correcto">
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
  </Tab>
  <Tab title="Ejemplo de fallo">
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
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Si la simulación falla">
    - `config schema validation failed`: la forma de tu configuración posterior al cambio no es válida; corrige la ruta/valor o la forma del objeto de proveedor/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: vuelve a mover esa credencial a entrada de texto sin formato/cadena; mantén SecretRefs solo en superficies admitidas.
    - `SecretRef assignment(s) could not be resolved`: el proveedor/ref referenciado no puede resolverse actualmente (variable de entorno faltante, puntero de archivo no válido, fallo del proveedor de exec o desajuste entre proveedor/fuente).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: vuelve a ejecutar con `--allow-exec` si necesitas validar la resolubilidad de exec.
    - Para el modo por lotes, corrige las entradas con fallos y vuelve a ejecutar `--dry-run` antes de escribir.

  </Accordion>
</AccordionGroup>

## Aplicación de cambios

Después de cada `config set` / `config patch` / `config unset` correcto, la CLI imprime una de tres indicaciones para que sepas si el Gateway necesita reiniciarse:

| Indicación                                         | Significado                                    |
| -------------------------------------------------- | ---------------------------------------------- |
| `Restart the gateway to apply.`                    | La ruta modificada necesita un reinicio completo. |
| `Change will apply without restarting the gateway.` | La recarga en caliente lo recoge automáticamente. |
| `No gateway restart needed.`                       | No cambió nada relevante para el runtime.      |

Las escrituras en `plugins.entries` (o cualquier subruta) siempre requieren un reinicio, ya que la CLI no puede demostrar que los metadatos de recarga de cada plugin estén cargados.

## Seguridad de escritura

`openclaw config set` y otros escritores de configuración propiedad de OpenClaw validan la configuración completa posterior al cambio antes de confirmarla en disco. Si la nueva carga falla la validación de esquema o parece una sobrescritura destructiva, la configuración activa se deja intacta y la carga rechazada se guarda junto a ella como `openclaw.json.rejected.*`.

<Warning>
La ruta de configuración activa debe ser un archivo normal. Los diseños de `openclaw.json` con enlaces simbólicos no son compatibles para escrituras; usa `OPENCLAW_CONFIG_PATH` para apuntar directamente al archivo real en su lugar.
</Warning>

Prefiere escrituras de CLI para ediciones pequeñas:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si se rechaza una escritura, inspecciona la carga guardada y corrige la forma de la configuración completa:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Las escrituras directas con editor siguen permitidas, pero el Gateway en ejecución las trata como no confiables hasta que se validan. Las ediciones directas no válidas hacen fallar el inicio o se omiten durante la recarga en caliente; Gateway no reescribe `openclaw.json`. Ejecuta `openclaw doctor --fix` para reparar una configuración con prefijos/sobrescrita o restaurar la última copia válida conocida. Consulta [solución de problemas de Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config).

La recuperación de archivo completo se reserva para reparación con doctor. Los cambios de esquema de plugin o el desajuste de `minHostVersion` permanecen visibles en lugar de revertir ajustes de usuario no relacionados, como modelos, proveedores, perfiles de autenticación, canales, exposición de gateway, herramientas, memoria, navegador o configuración de cron.

## Bucle de reparación

Después de que `openclaw config validate` pase, usa la TUI local para que un agente integrado compare la configuración activa con la documentación mientras validas cada cambio desde el mismo terminal:

```bash
openclaw chat
```

Dentro de la TUI, un `!` inicial ejecuta un comando literal del shell local (después de una solicitud de confirmación única por sesión):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Comparar con la documentación">
    Pide al agente que compare tu configuración actual con la página de documentación relevante y sugiera la corrección más pequeña.
  </Step>
  <Step title="Aplicar ediciones específicas">
    Aplica ediciones específicas con `openclaw config set` u `openclaw configure`.
  </Step>
  <Step title="Volver a validar">
    Vuelve a ejecutar `openclaw config validate` después de cada cambio.
  </Step>
  <Step title="Doctor para problemas de runtime">
    Si la validación pasa pero el runtime sigue sin estar sano, ejecuta `openclaw doctor` u `openclaw doctor --fix` para obtener ayuda de migración y reparación.
  </Step>
</Steps>

## Relacionado

- [Referencia de CLI](/es/cli)
- [Configuración](/es/gateway/configuration)
