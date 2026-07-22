---
read_when:
    - Quiere leer o editar la configuración de forma no interactiva
sidebarTitle: Config
summary: Referencia de la CLI para `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuración
x-i18n:
    generated_at: "2026-07-22T10:26:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c4f8edb19737070e421c9107f7da8886e5617d9a043d8647666505c7ac9638d
    source_path: cli/config.md
    workflow: 16
---

Ayudantes no interactivos para `openclaw.json`: obtener/establecer/aplicar un parche/eliminar un valor por ruta, imprimir el esquema, validar o imprimir la ruta del archivo activo. Ejecute `openclaw config` sin subcomando para abrir el mismo asistente guiado que `openclaw configure`.

<Note>
Cuando `OPENCLAW_NIX_MODE=1`, OpenClaw trata `openclaw.json` como inmutable. Los comandos de solo lectura (`config get`, `config file`, `config schema`, `config validate`) siguen funcionando; los comandos de escritura de configuración se niegan a operar. En su lugar, edite la fuente de Nix de la instalación; para la distribución oficial nix-openclaw, consulte el [inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) y establezca los valores en `programs.openclaw.config` o `instances.<name>.config`.
</Note>

## Opciones raíz

<ParamField path="--section <section>" type="string">
  Filtro repetible de secciones de configuración guiada cuando se ejecuta `openclaw config` sin un subcomando.
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
openclaw config set 'agents.entries.main.tools.exec.node' "node-id-or-name"
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

Notación de puntos o corchetes. Ponga entre comillas las rutas con corchetes en los ejemplos del shell para que zsh no expanda mediante glob `[0]`:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.entries.main
openclaw config get agents.entries
openclaw config set 'agents.entries.work.tools.exec.node' "node-id-or-name"
```

### `config get`

Lee un valor de la instantánea de configuración censurada (los secretos nunca se imprimen). `--json` imprime el valor sin procesar como JSON; de lo contrario, las cadenas, los números y los booleanos se imprimen sin formato, mientras que los objetos y las matrices se imprimen como JSON con formato.

Cuando falta la ruta, `--json` escribe `{ "error": "Config path not found: <path>" }` en la salida estándar y termina con el estado 1. Sin `--json`, el diagnóstico permanece en la salida de error estándar.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Imprime la ruta del archivo de configuración activo, resuelta a partir de `OPENCLAW_CONFIG_PATH` o de la ubicación predeterminada. La ruta designa un archivo normal, no un enlace simbólico; consulte [Seguridad de escritura](#write-safety).

### `config schema`

Imprime en la salida estándar el esquema JSON generado para `openclaw.json`.

<AccordionGroup>
  <Accordion title="Qué incluye">
    - El esquema raíz de configuración actual, además de un campo de cadena raíz `$schema` para herramientas de edición.
    - Metadatos de documentación de los campos `title` / `description` utilizados por la interfaz de control.
    - Los nodos de objetos anidados, comodines (`*`) y elementos de matriz (`[]`) heredan los mismos metadatos `title` / `description` cuando existen documentos de campos coincidentes.
    - Las ramas `anyOf` / `oneOf` / `allOf` también heredan los mismos metadatos de documentación.
    - Metadatos de esquema en vivo y de mejor esfuerzo de plugins y canales cuando se pueden cargar los manifiestos de tiempo de ejecución.
    - Un esquema alternativo limpio incluso cuando la configuración actual no es válida.

  </Accordion>
  <Accordion title="RPC de tiempo de ejecución relacionado">
    `config.schema.lookup` devuelve una ruta de configuración normalizada con un nodo de esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes), metadatos de indicaciones de la interfaz coincidentes y resúmenes de los elementos secundarios inmediatos. Úselo para explorar en detalle por ruta en la interfaz de control o en clientes personalizados.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Valida la configuración actual con el esquema activo sin iniciar el Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Si la validación ya está fallando, comience con `openclaw configure` o `openclaw doctor --fix`. `openclaw chat` no omite la protección contra configuraciones no válidas.
</Note>

## Valores

Los valores se analizan como JSON5 cuando es posible; de lo contrario, se tratan como cadenas sin procesar. Use `--strict-json` para exigir JSON estándar sin alternativa de cadena (en ese caso, se rechaza la sintaxis exclusiva de JSON5, como comentarios, comas finales o claves sin comillas). `--json` es un alias heredado de `--strict-json` en `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime el valor sin procesar como JSON en lugar de texto con formato para terminal.

Cuando una escritura modifica `agents.defaults.model` o un `agents.entries.*.model` por agente, OpenClaw resuelve cada modelo principal o alternativo modificado mediante los catálogos de proveedores configurados antes de escribir. Las referencias a modelos desconocidos se rechazan sin modificar la configuración activa; ejecute `openclaw models list` para ver los modelos disponibles.

<Note>
De manera predeterminada, la asignación de objetos reemplaza la ruta de destino. Las rutas protegidas que suelen contener entradas añadidas por el usuario rechazan los reemplazos que eliminarían entradas existentes, a menos que se pase `--replace`: `agents.defaults.models`, `agents.entries`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` y `auth.profiles`.
</Note>

Use `--merge` al añadir entradas a esos mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Use `--replace` solo cuando el valor proporcionado deba convertirse intencionadamente en el valor de destino completo.

## Modos de `config set`

<Tabs>
  <Tab title="Modo de valor">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Modo de creación de SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Modo de creación de proveedores">
    Solo admite rutas `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Modo por lotes">
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

    Los archivos por lotes tienen un límite de 8 MiB.

  </Tab>
</Tabs>

<Warning>
Las asignaciones de SecretRef se rechazan en superficies mutables durante la ejecución que no son compatibles (por ejemplo, `hooks.token`, `commands.ownerDisplaySecret`, los tokens de Webhook de vinculación de hilos de Discord y el JSON de credenciales de WhatsApp). Consulte [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
</Warning>

El análisis por lotes siempre usa la carga útil del lote (`--batch-json`/`--batch-file`) como fuente de verdad; `--strict-json` / `--json` no modifican el comportamiento del análisis por lotes.

El modo de ruta/valor JSON también funciona directamente con SecretRefs y proveedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Indicadores del creador de proveedores

Los destinos del creador de proveedores deben usar `secrets.providers.<alias>` como ruta.

<AccordionGroup>
  <Accordion title="Indicadores comunes">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Proveedor de entorno (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (repetible)

  </Accordion>
  <Accordion title="Proveedor de archivos (--provider-source file)">
    - `--provider-path <path>` (obligatorio)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Proveedor de ejecución (--provider-source exec)">
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

Ejemplo de proveedor de ejecución reforzado:

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

Pegue o canalice un parche JSON5 con forma de configuración en lugar de ejecutar muchos comandos `config set` basados en rutas. Los objetos se fusionan recursivamente; las matrices y los valores escalares reemplazan el destino; `null` elimina la ruta de destino.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Los archivos de parche tienen un límite de 8 MiB. Los parches `--stdin` canalizados tienen un límite de 1 MiB.

Canalice un parche por la entrada estándar para los scripts de configuración remota:

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Use `--replace-path <path>` cuando un objeto o una matriz deba convertirse exactamente en el valor proporcionado, en lugar de aplicarle un parche recursivo:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` ejecuta comprobaciones del esquema y de la capacidad de resolución de SecretRef sin escribir. Las SecretRefs respaldadas por exec se omiten de forma predeterminada durante la ejecución de prueba; añada `--allow-exec` cuando quiera expresamente que la ejecución de prueba ejecute comandos del proveedor.

## Ejecución de prueba

`--dry-run` valida los cambios sin escribir `openclaw.json`. Disponible en `config set`, `config patch` y `config unset`.

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
  <Accordion title="Comportamiento de la ejecución de prueba">
    - Modo de creación: ejecuta comprobaciones de la capacidad de resolución de SecretRef para las referencias y los proveedores modificados.
    - Modo JSON (`--strict-json`, `--json` o modo por lotes): ejecuta la validación del esquema y las comprobaciones de la capacidad de resolución de SecretRef.
    - La validación de políticas se ejecuta sobre toda la configuración posterior al cambio, por lo que las escrituras de objetos superiores (por ejemplo, establecer `hooks` como objeto) no pueden eludir la validación de superficies no compatibles.
    - Las comprobaciones de SecretRef de exec se omiten de forma predeterminada para evitar efectos secundarios de los comandos; pase `--allow-exec` para habilitarlas (esto puede ejecutar comandos del proveedor). `--allow-exec` solo es válido para ejecuciones de prueba y genera un error sin `--dry-run`.

  </Accordion>
  <Accordion title="Campos de --dry-run --json">
    - `ok`: indica si la ejecución de prueba se completó correctamente
    - `operations`: número de asignaciones evaluadas
    - `checks`: indica si se ejecutaron las comprobaciones del esquema y de la capacidad de resolución
    - `checks.resolvabilityComplete`: indica si las comprobaciones de capacidad de resolución finalizaron (es falso cuando se omiten referencias de exec)
    - `refsChecked`: número de referencias resueltas realmente durante la ejecución de prueba
    - `skippedExecRefs`: número de referencias de exec omitidas porque no se estableció `--allow-exec`
    - `errors`: errores estructurados de rutas ausentes, del esquema o de capacidad de resolución cuando `ok=false`

  </Accordion>
</AccordionGroup>

### Estructura de la salida JSON

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
      kind: "missing-path" | "schema" | "resolvability" | "model",
      message: string,
      ref?: string, // presente para errores de capacidad de resolución
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
  <Tab title="Ejemplo de error">
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
          "message": "Error: La variable de entorno \"MISSING_TEST_SECRET\" no está establecida.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Si falla la ejecución de prueba">
    - `config schema validation failed`: la estructura de la configuración posterior al cambio no es válida; corrija la ruta o el valor, o bien la estructura del objeto de proveedor o referencia.
    - `Config policy validation failed: unsupported SecretRef usage`: vuelva a introducir esa credencial como texto sin formato o cadena; mantenga las SecretRefs únicamente en superficies compatibles.
    - `SecretRef assignment(s) could not be resolved`: el proveedor o la referencia especificados no pueden resolverse actualmente (variable de entorno ausente, puntero de archivo no válido, fallo del proveedor de exec o incompatibilidad entre proveedor y fuente).
    - `model reference validation failed`: se desconoce un modelo de texto principal o alternativo modificado; ejecute `openclaw models list` y elija un modelo disponible.
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: vuelva a ejecutar con `--allow-exec` si necesita validar la capacidad de resolución de exec.
    - Para el modo por lotes, corrija las entradas con errores y vuelva a ejecutar `--dry-run` antes de escribir.

  </Accordion>
</AccordionGroup>

## Aplicación de cambios

Después de cada `config set` / `config patch` / `config unset` completado correctamente, la CLI muestra una de tres indicaciones para informar si es necesario reiniciar el Gateway:

| Indicación                                          | Significado                                            |
| --------------------------------------------------- | ------------------------------------------------------ |
| `Restart the gateway to apply.`                     | La ruta modificada requiere un reinicio completo.      |
| `Change will apply without restarting the gateway.` | La recarga en caliente la aplica automáticamente.      |
| `No gateway restart needed.`                        | No se modificó nada relevante para el entorno de ejecución. |

Las escrituras en `plugins.entries` (o cualquier subruta) siempre requieren un reinicio, ya que la CLI no puede demostrar que se hayan cargado los metadatos de recarga de todos los plugins.

## Seguridad de escritura

`openclaw config set` y otros procesos de escritura de configuración propiedad de OpenClaw validan toda la configuración posterior al cambio antes de guardarla en el disco. Si la nueva carga útil no supera la validación del esquema o parece una sobrescritura destructiva, la configuración activa no se modifica y la carga útil rechazada se guarda junto a ella como `openclaw.json.rejected.*`.

Las escrituras propiedad de OpenClaw vuelven a serializar JSON5 como JSON estándar. Cuando el origen contiene comentarios, el proceso de escritura muestra una advertencia justo antes de eliminarlos; utilice un editor directamente cuando sea importante conservarlos.

<Warning>
La ruta de configuración activa debe ser un archivo normal. Las disposiciones de `openclaw.json` con enlaces simbólicos no son compatibles con las escrituras; utilice `OPENCLAW_CONFIG_PATH` para apuntar directamente al archivo real.
</Warning>

Para ediciones pequeñas, se recomienda escribir mediante la CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si se rechaza una escritura, inspeccione la carga útil guardada y corrija toda la estructura de la configuración:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Se sigue permitiendo escribir directamente con un editor, pero el Gateway en ejecución considera estas escrituras no fiables hasta que se validan. Las ediciones directas no válidas impiden el inicio o se omiten durante la recarga en caliente; el Gateway no vuelve a escribir `openclaw.json`. Ejecute `openclaw doctor --fix` para reparar una configuración con prefijos o sobrescrita, o para restaurar la última copia válida conocida. Consulte [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config).

La recuperación del archivo completo se reserva para la reparación mediante doctor. Los cambios en el esquema de plugins o la discrepancia de `minHostVersion` siguen generando errores explícitos en lugar de revertir ajustes de usuario no relacionados, como modelos, proveedores, perfiles de autenticación, canales, exposición del Gateway, herramientas, memoria, navegador o configuración de cron.

## Bucle de reparación

Después de que `openclaw config validate` se complete correctamente, utilice la TUI local para que un agente integrado compare la configuración activa con la documentación mientras se valida cada cambio desde el mismo terminal:

```bash
openclaw chat
```

Dentro de la TUI, un `!` inicial ejecuta un comando literal del shell local (tras una solicitud de confirmación que se muestra una vez por sesión):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Comparar con la documentación">
    Pida al agente que compare la configuración actual con la página de documentación pertinente y sugiera la corrección más pequeña.
  </Step>
  <Step title="Aplicar ediciones específicas">
    Aplique ediciones específicas con `openclaw config set` o `openclaw configure`.
  </Step>
  <Step title="Volver a validar">
    Vuelva a ejecutar `openclaw config validate` después de cada cambio.
  </Step>
  <Step title="Usar doctor para problemas del entorno de ejecución">
    Si la validación se completa correctamente, pero el entorno de ejecución sigue sin funcionar correctamente, ejecute `openclaw doctor` o `openclaw doctor --fix` para obtener ayuda con la migración y la reparación.
  </Step>
</Steps>

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Configuración](/es/gateway/configuration)
