---
read_when:
    - Depuración de la autenticación del modelo o del vencimiento de OAuth
    - Documentación de la autenticación o el almacenamiento de credenciales
summary: 'Autenticación de modelos: OAuth, claves de API, reutilización de la CLI de Claude y token de configuración de Anthropic'
title: Autenticación
x-i18n:
    generated_at: "2026-07-11T23:06:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Esta página trata sobre la autenticación del **proveedor de modelos** (claves de API, OAuth, reutilización de la CLI de Claude y token de configuración de Anthropic). Para la autenticación de la **conexión al Gateway** (token, contraseña y proxy de confianza), consulta [Configuración](/es/gateway/configuration) y [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).
</Note>

OpenClaw admite OAuth y claves de API para los proveedores de modelos. Para un host de Gateway siempre activo, una clave de API es la opción más predecible; los flujos de suscripción/OAuth también funcionan cuando son compatibles con el modelo de cuenta de tu proveedor.

- Flujo completo de OAuth y estructura de almacenamiento: [/concepts/oauth](/es/concepts/oauth)
- Autenticación basada en SecretRef (proveedores `env`/`file`/`exec`): [Gestión de secretos](/es/gateway/secrets)
- Códigos de elegibilidad y motivo de las credenciales que utiliza `models status --probe`: [Semántica de las credenciales de autenticación](/es/auth-credential-semantics)

## Configuración recomendada: clave de API (cualquier proveedor)

1. Crea una clave de API en la consola de tu proveedor.
2. Colócala en el **host del Gateway** (la máquina que ejecuta `openclaw gateway`):

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si el Gateway se ejecuta mediante systemd/launchd, coloca la clave en `~/.openclaw/.env` para que el daemon pueda leerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Reinicia el proceso del Gateway (o el daemon) y vuelve a comprobarlo:

```bash
openclaw models status
openclaw doctor
```

`openclaw onboard` también puede almacenar claves de API para que las use el daemon si no quieres gestionar las variables de entorno por tu cuenta. Consulta [Variables de entorno](/es/help/environment) para conocer la precedencia completa de carga del entorno (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic: reutilización de la CLI de Claude

La autenticación mediante token de configuración de Anthropic sigue siendo una vía admitida. La reutilización de la CLI de Claude (uso al estilo de `claude -p`) también está autorizada para esta integración; cuando hay disponible un inicio de sesión de la CLI de Claude en el host, esta es la vía preferida para el uso local o de escritorio. Para hosts de Gateway de larga duración, una clave de API de Anthropic sigue siendo la opción más predecible, con un control explícito de la facturación en el servidor.

Configuración del host para reutilizar la CLI de Claude:

```bash
# Ejecutar en el host del Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Este proceso consta de dos pasos: iniciar sesión en Anthropic con Claude Code en el host y, después, indicar a OpenClaw que enrute la selección de modelos de Anthropic mediante el backend local `claude-cli` y almacene el perfil de autenticación correspondiente de OpenClaw.

Si `claude` no está en `PATH`, instala Claude Code o establece `agents.defaults.cliBackends.claude-cli.command` en la ruta del binario.

## Introducción manual del token

Funciona con cualquier proveedor; escribe en el almacén SQLite de autenticación de cada agente y actualiza la configuración:

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw lee los perfiles de autenticación del archivo `openclaw-agent.sqlite` de cada agente. Los detalles del endpoint (`baseUrl`, `api`, identificadores de modelos, encabezados y tiempos de espera) deben estar en `models.providers.<id>` de `openclaw.json` o `models.json`, no en los perfiles de autenticación.

Si una instalación anterior todavía contiene `auth-profiles.json`, `auth-state.json` o una estructura plana como `{ "openrouter": { "apiKey": "..." } }`, ejecuta `openclaw doctor --fix` para importarla a SQLite; doctor conserva copias de seguridad con marca de tiempo junto a los archivos JSON originales.

Las rutas de autenticación externas, como `auth: "aws-sdk"` de Bedrock, no son credenciales. Para una ruta de Bedrock con nombre, establece `auth.profiles.<id>.mode: "aws-sdk"` en `openclaw.json`; no escribas `type: "aws-sdk"` en el almacén de perfiles de autenticación. `openclaw doctor --fix` migra los marcadores heredados de AWS SDK del almacén de credenciales a los metadatos de configuración.

### Credenciales basadas en SecretRef

- Las credenciales `api_key` pueden usar `keyRef: { source, provider, id }`
- Las credenciales `token` pueden usar `tokenRef: { source, provider, id }`
- Los perfiles en modo OAuth rechazan las credenciales SecretRef: si `auth.profiles.<id>.mode` es `"oauth"`, se rechaza un `keyRef`/`tokenRef` basado en SecretRef para ese perfil.

## Comprobación del estado de autenticación de los modelos

```bash
openclaw models status
openclaw doctor
```

Comprobación apta para automatización, con código de salida `1` cuando las credenciales han caducado o faltan y `2` cuando están a punto de caducar:

```bash
openclaw models status --check
```

Sondeos de autenticación en vivo (añade `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` o `--probe-max-tokens` para limitar el alcance):

```bash
openclaw models status --probe
```

Notas:

- Las filas de sondeo pueden proceder de perfiles de autenticación, credenciales del entorno o `models.json`.
- Si `auth.order.<provider>` omite un perfil almacenado, el sondeo informa `excluded_by_auth_order` para ese perfil en lugar de probarlo.
- Si existe autenticación, pero OpenClaw no puede resolver un modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.
- Los periodos de espera por limitación de solicitudes pueden limitarse a un modelo: un perfil en espera para un modelo todavía puede servir otro modelo del mismo proveedor.

Scripts operativos opcionales (systemd/Termux): [Scripts de supervisión de la autenticación](/es/help/scripts#auth-monitoring-scripts).

## Rotación de claves de API (Gateway)

Algunos proveedores vuelven a intentar una solicitud con otra clave configurada cuando una llamada alcanza un límite de solicitudes del proveedor.

Orden de prioridad de las claves para cada proveedor:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (anulación única que fija una clave)
2. `<PROVIDER>_API_KEYS` (lista separada por comas, espacios o puntos y coma)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (cualquier variable de entorno con este prefijo)

Además, los proveedores de Google (`google`, `google-vertex`) recurren a `GOOGLE_API_KEY` como alternativa. La lista combinada se deduplica antes de usarla.

OpenClaw solo rota a la siguiente clave cuando el mensaje de error coincide con: `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` o `too many requests`. Los demás errores no se vuelven a intentar con claves alternativas. Si todas las claves fallan, se devuelve el error final del último intento.

<Note>
Las frases específicas del proveedor, como `ThrottlingException`, `concurrency limit reached` o `workers_ai ... quota limit exceeded`, determinan la **clasificación de conmutación por error/reintento** (cambiar de modelo o proveedor tras fallos repetidos), un mecanismo independiente de la rotación de claves de API descrita anteriormente.
</Note>

Eliminar la autenticación guardada no revoca la clave en el proveedor; rótala o revócala en el panel del proveedor cuando necesites invalidarla en el lado del proveedor.

## Eliminación de la autenticación del proveedor mientras se ejecuta el Gateway

Cuando eliminas la autenticación de un proveedor mediante el plano de control del Gateway, OpenClaw elimina los perfiles de autenticación guardados para ese proveedor y cancela las ejecuciones activas de chats o agentes cuyo proveedor de modelos seleccionado coincida con el eliminado. Las ejecuciones canceladas emiten los eventos normales de cancelación y ciclo de vida con `stopReason: "auth-revoked"`, para que los clientes conectados puedan indicar que la ejecución se detuvo porque se eliminaron las credenciales.

## Control de la credencial utilizada

### OpenAI e identificadores heredados de `openai-codex`

Los perfiles de clave de API de OpenAI y los perfiles OAuth de ChatGPT/Codex utilizan el identificador canónico de proveedor `openai`. Usa identificadores de perfil `openai:*` y `auth.order.openai` en las configuraciones nuevas.

Si encuentras `openai-codex` en configuraciones antiguas, identificadores de perfiles de autenticación o `auth.order.openai-codex`, trátalo como entrada para una migración heredada; no crees perfiles nuevos de `openai-codex`. Ejecuta:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor reescribe los identificadores de perfil heredados `openai-codex:*` y las entradas `auth.order.openai-codex` para usar la ruta canónica `openai`. Para obtener información sobre el enrutamiento de modelos y del entorno de ejecución específico de OpenAI, consulta [OpenAI](/es/providers/openai).

### Durante el inicio de sesión (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` mantiene separados varios inicios de sesión OAuth del mismo proveedor dentro de un agente.

`--force` elimina los perfiles de autenticación guardados de ese proveedor en el directorio del agente seleccionado y, después, vuelve a ejecutar el mismo flujo de autenticación. Úsalo cuando un perfil guardado esté bloqueado, haya caducado o esté vinculado a la cuenta equivocada. No revoca las credenciales en el proveedor.

```bash
openclaw models auth login --provider anthropic --force
```

### Por sesión (comando de chat)

- `/model <alias-or-id>@<profileId>` fija una credencial específica del proveedor para la sesión actual (ejemplos de identificadores de perfil: `anthropic:default`, `anthropic:work`).
- `/model` (o `/model list`) muestra un selector compacto; `/model status` muestra la vista completa (candidatos y siguiente perfil de autenticación, además de los detalles del endpoint del proveedor cuando estén configurados).

Si cambias el orden de autenticación o la fijación de perfiles de un chat que ya está en ejecución, envía `/new` o `/reset` para iniciar una sesión nueva; las sesiones existentes conservan su selección actual de modelo y perfil hasta que se restablezcan.

### Por agente (anulación mediante CLI)

Las anulaciones del orden de autenticación se almacenan en el estado de autenticación SQLite de ese agente:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` para seleccionar un agente específico; omítelo para usar el agente predeterminado configurado. `openclaw models status --probe` muestra los perfiles almacenados omitidos como `excluded_by_auth_order` en lugar de ignorarlos silenciosamente.

## Solución de problemas

### "No se encontraron credenciales"

Configura una clave de API de Anthropic en el **host del Gateway** o configura la vía del token de configuración de Anthropic y, después, vuelve a comprobarlo:

```bash
openclaw models status
```

### Token próximo a caducar o caducado

Ejecuta `openclaw models status` para ver qué perfil está próximo a caducar. Si falta un perfil de token de Anthropic o ha caducado, actualízalo mediante el token de configuración o migra a una clave de API de Anthropic.

## Temas relacionados

- [Gestión de secretos](/es/gateway/secrets)
- [Acceso remoto](/es/gateway/remote)
- [Almacenamiento de la autenticación](/es/concepts/oauth)
