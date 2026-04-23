---
read_when:
    - Quiere cambiar los modelos predeterminados o ver el estado de autenticación del proveedor
    - Quiere escanear modelos/proveedores disponibles y depurar perfiles de autenticación
summary: Referencia de CLI para `openclaw models` (estado/lista/configurar/escanear, alias, respaldos, autenticación)
title: modelos
x-i18n:
    generated_at: "2026-04-23T14:01:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Descubrimiento, escaneo y configuración de modelos (modelo predeterminado, respaldos, perfiles de autenticación).

Relacionado:

- Proveedores + modelos: [Models](/es/providers/models)
- Conceptos de selección de modelos + comando slash `/models`: [Concepto de modelos](/es/concepts/models)
- Configuración de autenticación del proveedor: [Primeros pasos](/es/start/getting-started)

## Comandos comunes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` muestra el predeterminado/respaldo resuelto junto con un resumen de autenticación.
Cuando hay instantáneas disponibles del uso del proveedor, la sección de estado de OAuth/clave de API incluye
ventanas de uso del proveedor e instantáneas de cuota.
Proveedores actuales de ventana de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi y z.ai. La autenticación de uso proviene de hooks específicos
del proveedor cuando están disponibles; de lo contrario, OpenClaw recurre a hacer coincidir
credenciales de OAuth/clave de API de perfiles de autenticación, variables de entorno o configuración.
En la salida `--json`, `auth.providers` es el resumen del proveedor con conocimiento
de entorno/configuración/almacén, mientras que `auth.oauth` es solo el estado de los perfiles del almacén de autenticación.
Añada `--probe` para ejecutar sondeos de autenticación en vivo contra cada perfil de proveedor configurado.
Los sondeos son solicitudes reales (pueden consumir tokens y activar límites de tasa).
Use `--agent <id>` para inspeccionar el estado de modelo/autenticación de un agente configurado. Si se omite,
el comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` si está configurado; en caso contrario, el
agente predeterminado configurado.
Las filas de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.

Notas:

- `models set <model-or-alias>` acepta `provider/model` o un alias.
- `models list --all` incluye filas estáticas de catálogo incluidas que pertenecen al proveedor incluso
  cuando todavía no se ha autenticado con ese proveedor. Esas filas seguirán mostrándose
  como no disponibles hasta que se configure una autenticación coincidente.
- `models list --provider <id>` filtra por ID de proveedor, como `moonshot` u
  `openai-codex`. No acepta etiquetas visibles de selectores interactivos de proveedor,
  como `Moonshot AI`.
- Las referencias de modelo se analizan dividiendo por la **primera** `/`. Si el ID del modelo incluye `/` (estilo OpenRouter), incluya el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omite el proveedor, OpenClaw resuelve primero la entrada como alias, luego
  como una coincidencia única de proveedor configurado para ese ID de modelo exacto, y solo entonces
  recurre al proveedor predeterminado configurado con una advertencia de desaprobación.
  Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
  recurre al primer proveedor/modelo configurado en lugar de mostrar un
  predeterminado obsoleto de un proveedor eliminado.
- `models status` puede mostrar `marker(<value>)` en la salida de autenticación para marcadores de posición no secretos (por ejemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) en lugar de enmascararlos como secretos.

### `models status`

Opciones:

- `--json`
- `--plain`
- `--check` (salida 1=faltante/caducado, 2=próximo a caducar)
- `--probe` (sondeo en vivo de perfiles de autenticación configurados)
- `--probe-provider <name>` (sondear un proveedor)
- `--probe-profile <id>` (repetir o IDs de perfil separados por comas)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID de agente configurado; sobrescribe `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Categorías de estado de sondeo:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos de detalle/código de motivo de sondeo que cabe esperar:

- `excluded_by_auth_order`: existe un perfil almacenado, pero `auth.order.<provider>`
  explícito lo omitió, por lo que el sondeo informa la exclusión en lugar de
  intentarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  el perfil está presente, pero no es apto/no se puede resolver.
- `no_model`: existe autenticación del proveedor, pero OpenClaw no pudo resolver
  un candidato de modelo sondeable para ese proveedor.

## Alias + respaldos

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Perfiles de autenticación

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` es el asistente interactivo de autenticación. Puede iniciar un flujo de autenticación
del proveedor (OAuth/clave de API) o guiarle a un pegado manual de token, según el
proveedor que elija.

`models auth login` ejecuta el flujo de autenticación de un plugin de proveedor (OAuth/clave de API). Use
`openclaw plugins list` para ver qué proveedores están instalados.

Ejemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notas:

- `setup-token` y `paste-token` siguen siendo comandos genéricos de token para proveedores
  que exponen métodos de autenticación por token.
- `setup-token` requiere un TTY interactivo y ejecuta el método de autenticación por token del proveedor
  (de forma predeterminada usa el método `setup-token` de ese proveedor cuando expone
  uno).
- `paste-token` acepta una cadena de token generada en otro lugar o desde automatización.
- `paste-token` requiere `--provider`, solicita el valor del token y lo escribe
  en el ID de perfil predeterminado `<provider>:manual` a menos que pase
  `--profile-id`.
- `paste-token --expires-in <duration>` almacena un vencimiento absoluto del token a partir de una
  duración relativa como `365d` o `12h`.
- Nota sobre Anthropic: el personal de Anthropic nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración, a menos que Anthropic publique una política nueva.
- `setup-token` / `paste-token` de Anthropic siguen estando disponibles como una ruta de token compatible de OpenClaw, pero OpenClaw ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.
