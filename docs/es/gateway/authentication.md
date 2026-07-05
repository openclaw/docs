---
read_when:
    - Depuración de la autenticación del modelo o de la caducidad de OAuth
    - Documentar la autenticación o el almacenamiento de credenciales
summary: 'Autenticación de modelos: OAuth, claves de API, reutilización de Claude CLI y setup-token de Anthropic'
title: Autenticación
x-i18n:
    generated_at: "2026-07-05T11:17:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Esta página cubre la autenticación de **proveedor de modelos** (claves de API, OAuth, reutilización de Claude CLI, token de configuración de Anthropic). Para la autenticación de **conexión al Gateway** (token, contraseña, proxy de confianza), consulta [Configuración](/es/gateway/configuration) y [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
</Note>

OpenClaw admite OAuth y claves de API para proveedores de modelos. Para un host de Gateway siempre activo, una clave de API es la opción más predecible; los flujos de suscripción/OAuth también funcionan cuando coinciden con el modelo de cuenta de tu proveedor.

- Flujo OAuth completo y diseño de almacenamiento: [/concepts/oauth](/es/concepts/oauth)
- Autenticación basada en SecretRef (proveedores `env`/`file`/`exec`): [Gestión de secretos](/es/gateway/secrets)
- Códigos de elegibilidad/motivo de credenciales usados por `models status --probe`: [Semántica de credenciales de autenticación](/es/auth-credential-semantics)

## Configuración recomendada: clave de API (cualquier proveedor)

1. Crea una clave de API en la consola de tu proveedor.
2. Colócala en el **host de Gateway** (la máquina que ejecuta `openclaw gateway`):

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si el Gateway se ejecuta bajo systemd/launchd, coloca la clave en `~/.openclaw/.env` para que el daemon pueda leerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Reinicia el proceso del Gateway (o el daemon) y vuelve a comprobar:

```bash
openclaw models status
openclaw doctor
```

`openclaw onboard` también puede almacenar claves de API para uso del daemon si no quieres gestionar variables de entorno por tu cuenta. Consulta [Variables de entorno](/es/help/environment) para ver la precedencia completa de carga de entorno (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic: reutilización de Claude CLI

La autenticación mediante token de configuración de Anthropic sigue siendo una ruta admitida. La reutilización de Claude CLI (uso de estilo `claude -p`) también está autorizada para esta integración; cuando hay un inicio de sesión de Claude CLI disponible en el host, esa es la ruta preferida para uso local/de escritorio. Para hosts de Gateway de larga duración, una clave de API de Anthropic sigue siendo la opción más predecible, con control explícito de facturación del lado del servidor.

Configuración del host para reutilización de Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Esto son dos pasos: iniciar sesión de Claude Code en Anthropic en el host y luego indicar a OpenClaw que enrute la selección de modelos de Anthropic a través del backend local `claude-cli` y almacene el perfil de autenticación de OpenClaw correspondiente.

Si `claude` no está en `PATH`, instala Claude Code o establece `agents.defaults.cliBackends.claude-cli.command` en la ruta del binario.

## Entrada manual de token

Funciona con cualquier proveedor; escribe el almacén de autenticación SQLite por agente y actualiza la configuración:

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw lee perfiles de autenticación desde el `openclaw-agent.sqlite` de cada agente. Los detalles de endpoint (`baseUrl`, `api`, ids de modelo, encabezados, tiempos de espera) pertenecen a `models.providers.<id>` en `openclaw.json` o `models.json`, no a los perfiles de autenticación.

Si una instalación antigua todavía tiene `auth-profiles.json`, `auth-state.json` o una forma plana como `{ "openrouter": { "apiKey": "..." } }`, ejecuta `openclaw doctor --fix` para importarla en SQLite; doctor mantiene copias de seguridad con marca de tiempo junto a los archivos JSON originales.

Las rutas de autenticación externas como Bedrock `auth: "aws-sdk"` no son credenciales. Para una ruta Bedrock con nombre, establece `auth.profiles.<id>.mode: "aws-sdk"` en `openclaw.json`; no escribas `type: "aws-sdk"` en el almacén de perfiles de autenticación. `openclaw doctor --fix` migra los marcadores heredados de AWS SDK desde el almacén de credenciales a los metadatos de configuración.

### Credenciales respaldadas por SecretRef

- Las credenciales `api_key` pueden usar `keyRef: { source, provider, id }`
- Las credenciales `token` pueden usar `tokenRef: { source, provider, id }`
- Los perfiles en modo OAuth rechazan credenciales SecretRef: si `auth.profiles.<id>.mode` es `"oauth"`, se rechaza un `keyRef`/`tokenRef` respaldado por SecretRef para ese perfil.

## Comprobación del estado de autenticación de modelos

```bash
openclaw models status
openclaw doctor
```

Comprobación apta para automatización, salida `1` cuando falta o ha expirado, `2` cuando está por expirar:

```bash
openclaw models status --check
```

Sondeos de autenticación en vivo (añade `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` o `--probe-max-tokens` para acotar el alcance):

```bash
openclaw models status --probe
```

Notas:

- Las filas de sondeo pueden venir de perfiles de autenticación, credenciales de entorno o `models.json`.
- Si `auth.order.<provider>` omite un perfil almacenado, el sondeo informa `excluded_by_auth_order` para ese perfil en lugar de intentarlo.
- Si existe autenticación pero OpenClaw no puede resolver un modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.
- Los enfriamientos por límite de tasa pueden estar acotados al modelo: un perfil en enfriamiento para un modelo todavía puede servir un modelo hermano en el mismo proveedor.

Scripts opcionales de operaciones (systemd/Termux): [Scripts de monitoreo de autenticación](/es/help/scripts#auth-monitoring-scripts).

## Rotación de claves de API (Gateway)

Algunos proveedores reintentan una solicitud con una clave alternativa configurada cuando una llamada alcanza un límite de tasa del proveedor.

Orden de prioridad de claves por proveedor:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (sobrescritura única, fija una clave)
2. `<PROVIDER>_API_KEYS` (lista separada por comas/espacios/punto y coma)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (cualquier variable de entorno con este prefijo)

Los proveedores de Google (`google`, `google-vertex`) además recurren a `GOOGLE_API_KEY`. La lista combinada se deduplica antes de usarse.

OpenClaw rota a la siguiente clave solo cuando el mensaje de error coincide con: `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` o `too many requests`. Otros errores no se reintentan con claves alternativas. Si todas las claves fallan, se devuelve el error final del último intento.

<Note>
Frases específicas de proveedor como `ThrottlingException`, `concurrency limit reached` o `workers_ai ... quota limit exceeded` impulsan la **clasificación de conmutación por error/reintento** (cambiar modelos o proveedores ante fallos repetidos), un mecanismo separado de la rotación de claves de API anterior.
</Note>

Eliminar la autenticación guardada no revoca la clave en el proveedor; rótala o revócala en el panel del proveedor cuando necesites invalidación del lado del proveedor.

## Eliminación de autenticación de proveedor mientras el Gateway está en ejecución

Cuando eliminas la autenticación de proveedor a través del plano de control del Gateway, OpenClaw elimina los perfiles de autenticación guardados para ese proveedor y aborta las ejecuciones activas de chat/agente cuyo proveedor de modelo seleccionado coincide con el eliminado. Las ejecuciones abortadas emiten los eventos normales de cancelación/ciclo de vida con `stopReason: "auth-revoked"`, para que los clientes conectados puedan mostrar que la ejecución se detuvo porque se eliminaron las credenciales.

## Control de qué credencial se usa

### OpenAI e ids heredados `openai-codex`

Los perfiles de clave de API de OpenAI y los perfiles OAuth de ChatGPT/Codex usan ambos el id de proveedor canónico `openai`. Usa ids de perfil `openai:*` y `auth.order.openai` para configuración nueva.

Si ves `openai-codex` en configuración antigua, ids de perfil de autenticación o `auth.order.openai-codex`, trátalo como entrada de migración heredada; no crees perfiles `openai-codex` nuevos. Ejecuta:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor reescribe los ids de perfil heredados `openai-codex:*` y las entradas `auth.order.openai-codex` a la ruta canónica `openai`. Para enrutamiento de modelo/runtime específico de OpenAI, consulta [OpenAI](/es/providers/openai).

### Durante el inicio de sesión (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` mantiene separados varios inicios de sesión OAuth para el mismo proveedor dentro de un agente.

`--force` elimina los perfiles de autenticación guardados para ese proveedor en el directorio del agente seleccionado y luego vuelve a ejecutar el mismo flujo de autenticación. Úsalo cuando un perfil guardado esté bloqueado, expirado o vinculado a la cuenta incorrecta. No revoca credenciales en el proveedor.

```bash
openclaw models auth login --provider anthropic --force
```

### Por sesión (comando de chat)

- `/model <alias-or-id>@<profileId>` fija una credencial de proveedor específica para la sesión actual (ids de perfil de ejemplo: `anthropic:default`, `anthropic:work`).
- `/model` (o `/model list`) muestra un selector compacto; `/model status` muestra la vista completa (candidatos + siguiente perfil de autenticación, además de detalles de endpoint del proveedor cuando están configurados).

Si cambias el orden de autenticación o la fijación de perfil para un chat que ya está en ejecución, envía `/new` o `/reset` para iniciar una sesión nueva; las sesiones existentes conservan su selección actual de modelo/perfil hasta reiniciarse.

### Por agente (sobrescritura CLI)

Las sobrescrituras de orden de autenticación se almacenan en el estado de autenticación SQLite de ese agente:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` para apuntar a un agente específico; omítelo para usar el agente predeterminado configurado. `openclaw models status --probe` muestra los perfiles almacenados omitidos como `excluded_by_auth_order` en lugar de omitirlos silenciosamente.

## Solución de problemas

### "No se encontraron credenciales"

Configura una clave de API de Anthropic en el **host de Gateway**, o configura la ruta de token de configuración de Anthropic, y vuelve a comprobar:

```bash
openclaw models status
```

### Token por expirar/expirado

Ejecuta `openclaw models status` para ver qué perfil está por expirar. Si falta un perfil de token de Anthropic o ha expirado, actualízalo mediante token de configuración o migra a una clave de API de Anthropic.

## Relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Acceso remoto](/es/gateway/remote)
- [Almacenamiento de autenticación](/es/concepts/oauth)
