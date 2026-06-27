---
read_when:
    - Depuración de autenticación del modelo o caducidad de OAuth
    - Documentar la autenticación o el almacenamiento de credenciales
summary: 'Autenticación de modelos: OAuth, claves de API, reutilización de la CLI de Claude y setup-token de Anthropic'
title: Autenticación
x-i18n:
    generated_at: "2026-06-27T11:22:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Esta página es la referencia de autenticación de **proveedor de modelos** (claves de API, OAuth, reutilización de Claude CLI y setup-token de Anthropic). Para la autenticación de **conexión del Gateway** (token, contraseña, trusted-proxy), consulta [Configuración](/es/gateway/configuration) y [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
</Note>

OpenClaw admite OAuth y claves de API para proveedores de modelos. Para hosts de Gateway siempre activos, las claves de API suelen ser la opción más predecible. Los flujos de suscripción/OAuth también son compatibles cuando coinciden con el modelo de cuenta de tu proveedor.

Consulta [/concepts/oauth](/es/concepts/oauth) para ver el flujo completo de OAuth y el diseño de almacenamiento.
Para autenticación basada en SecretRef (proveedores `env`/`file`/`exec`), consulta [Gestión de secretos](/es/gateway/secrets).
Para las reglas de elegibilidad de credenciales/códigos de motivo usadas por `models status --probe`, consulta
[Semántica de credenciales de autenticación](/es/auth-credential-semantics).

## Configuración recomendada (clave de API, cualquier proveedor)

Si estás ejecutando un Gateway de larga duración, empieza con una clave de API para el proveedor que elijas.
En el caso específico de Anthropic, la autenticación con clave de API sigue siendo la configuración de servidor más predecible, pero OpenClaw también admite reutilizar un inicio de sesión local de Claude CLI.

1. Crea una clave de API en la consola de tu proveedor.
2. Ponla en el **host del Gateway** (la máquina que ejecuta `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si el Gateway se ejecuta con systemd/launchd, prefiere poner la clave en
   `~/.openclaw/.env` para que el daemon pueda leerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Después reinicia el daemon (o reinicia tu proceso de Gateway) y vuelve a comprobar:

```bash
openclaw models status
openclaw doctor
```

Si prefieres no gestionar variables de entorno tú mismo, el onboarding puede almacenar claves de API para uso del daemon: `openclaw onboard`.

Consulta [Ayuda](/es/help) para obtener detalles sobre la herencia de entorno (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilidad con Claude CLI y tokens

La autenticación con setup-token de Anthropic sigue disponible en OpenClaw como una ruta de token compatible. Desde entonces, el personal de Anthropic nos ha dicho que el uso de Claude CLI al estilo de OpenClaw vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración salvo que Anthropic publique una nueva política. Cuando la reutilización de Claude CLI está disponible en el host, ahora es la ruta preferida.

Para hosts de Gateway de larga duración, una clave de API de Anthropic sigue siendo la configuración más predecible. Si quieres reutilizar un inicio de sesión existente de Claude en el mismo host, usa la ruta de Anthropic Claude CLI en onboarding/configure.

Configuración de host recomendada para reutilizar Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Esta es una configuración de dos pasos:

1. Inicia sesión en Anthropic con Claude Code en el host del Gateway.
2. Indica a OpenClaw que cambie la selección de modelos de Anthropic al backend local `claude-cli` y almacene el perfil de autenticación de OpenClaw correspondiente.

Si `claude` no está en `PATH`, instala primero Claude Code o establece
`agents.defaults.cliBackends.claude-cli.command` en la ruta real del binario.

Entrada manual de token (cualquier proveedor; escribe en el almacén de autenticación SQLite por agente y actualiza la configuración):

```bash
openclaw models auth paste-token --provider openrouter
```

El almacén de perfiles de autenticación conserva solo credenciales. Los archivos heredados `auth-profiles.json` usaban esta forma canónica:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw ahora lee los perfiles de autenticación desde el `openclaw-agent.sqlite` de cada agente. Si una instalación anterior todavía tiene `auth-profiles.json`, `auth-state.json` o un archivo plano de perfil de autenticación como `{ "openrouter": { "apiKey": "..." } }`, ejecuta `openclaw doctor --fix` para importarlo a SQLite; doctor conserva copias de seguridad con marca de tiempo junto a los archivos JSON originales. Los detalles de endpoint como `baseUrl`, `api`, ids de modelo, encabezados y tiempos de espera pertenecen a `models.providers.<id>` en `openclaw.json` o `models.json`, no a perfiles de autenticación.

Las rutas de autenticación externas como `auth: "aws-sdk"` de Bedrock tampoco son credenciales. Si quieres una ruta de Bedrock con nombre, pon `auth.profiles.<id>.mode: "aws-sdk"` en `openclaw.json`; no escribas `type: "aws-sdk"` en el almacén de perfiles de autenticación. `openclaw doctor --fix` mueve los marcadores heredados de AWS SDK desde el almacén de credenciales a los metadatos de configuración.

Las referencias de perfil de autenticación también son compatibles con credenciales estáticas:

- Las credenciales `api_key` pueden usar `keyRef: { source, provider, id }`
- Las credenciales `token` pueden usar `tokenRef: { source, provider, id }`
- Los perfiles en modo OAuth no admiten credenciales SecretRef; si `auth.profiles.<id>.mode` se establece en `"oauth"`, se rechaza la entrada `keyRef`/`tokenRef` respaldada por SecretRef para ese perfil.

Comprobación apta para automatización (salida `1` cuando caducó/falta, `2` cuando está por caducar):

```bash
openclaw models status --check
```

Sondeos de autenticación en vivo:

```bash
openclaw models status --probe
```

Notas:

- Las filas de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.
- Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa
  `excluded_by_auth_order` para ese perfil en lugar de intentarlo.
- Si existe autenticación pero OpenClaw no puede resolver un candidato de modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.
- Los enfriamientos por límite de tasa pueden tener alcance de modelo. Un perfil en enfriamiento para un modelo todavía puede ser utilizable para un modelo hermano en el mismo proveedor.

Los scripts operativos opcionales (systemd/Termux) están documentados aquí:
[Scripts de supervisión de autenticación](/es/help/scripts#auth-monitoring-scripts)

## Nota de Anthropic

El backend `claude-cli` de Anthropic vuelve a ser compatible.

- El personal de Anthropic nos dijo que esta ruta de integración de OpenClaw vuelve a estar permitida.
- Por lo tanto, OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para ejecuciones respaldadas por Anthropic salvo que Anthropic publique una nueva política.
- Las claves de API de Anthropic siguen siendo la opción más predecible para hosts de Gateway de larga duración y control explícito de facturación del lado del servidor.

## Comprobar el estado de autenticación de modelos

```bash
openclaw models status
openclaw doctor
```

## Comportamiento de rotación de claves de API (Gateway)

Algunos proveedores admiten reintentar una solicitud con claves alternativas cuando una llamada de API alcanza un límite de tasa del proveedor.

- Orden de prioridad:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (sobrescritura única)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Los proveedores de Google también incluyen `GOOGLE_API_KEY` como respaldo adicional.
- La misma lista de claves se deduplica antes de usarla.
- OpenClaw reintenta con la siguiente clave solo para errores de límite de tasa (por ejemplo
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` o
  `workers_ai ... quota limit exceeded`).
- Los errores que no son de límite de tasa no se reintentan con claves alternativas.
- Si todas las claves fallan, se devuelve el error final del último intento.

## Eliminar la autenticación de proveedor mientras el Gateway está en ejecución

Cuando la autenticación de proveedor se elimina a través del plano de control del Gateway, OpenClaw elimina los perfiles de autenticación guardados para ese proveedor y aborta las ejecuciones activas de chat o agente cuyo proveedor de modelo seleccionado coincida con el proveedor eliminado. Las ejecuciones abortadas emiten los eventos normales de cancelación de chat y de ciclo de vida con
`stopReason: "auth-revoked"`, de modo que los clientes conectados puedan mostrar que la ejecución se detuvo porque se eliminaron las credenciales.

Eliminar la autenticación guardada no revoca las claves en el proveedor. Rota o revoca la clave en el panel del proveedor cuando necesites invalidación del lado del proveedor.

## Controlar qué credencial se usa

### OpenAI e ids heredados `openai-codex`

Los perfiles de clave de API de OpenAI y los perfiles OAuth de ChatGPT/Codex usan ambos el id de proveedor canónico `openai`. La configuración nueva debe usar ids de perfil `openai:*` y
`auth.order.openai`.

Si ves `openai-codex` en una configuración anterior, ids de perfil de autenticación o
`auth.order.openai-codex`, trátalo como entrada de migración heredada. No crees nuevos perfiles `openai-codex`. Ejecuta:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor reescribe los ids de perfil heredados `openai-codex:*` y las entradas
`auth.order.openai-codex` a la ruta de autenticación canónica `openai`. Para el enrutamiento de modelo/runtime específico de OpenAI, consulta [OpenAI](/es/providers/openai).

### Durante el inicio de sesión (CLI)

Usa `openclaw models auth login --provider <id> --profile-id <profileId>` para proveedores que admiten perfiles de autenticación con nombre durante el inicio de sesión.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

Esta es la forma más sencilla de mantener separados varios inicios de sesión OAuth para el mismo proveedor dentro de un agente.

Usa `--force` cuando un perfil de proveedor guardado esté bloqueado, caducado o vinculado a la cuenta equivocada y el comando normal de inicio de sesión siga reutilizándolo. `--force` elimina los perfiles de autenticación guardados para ese proveedor en el directorio del agente seleccionado y luego vuelve a ejecutar el mismo flujo de autenticación del proveedor. No revoca credenciales en el proveedor; rótalas o revócalas en el panel del proveedor cuando necesites invalidación del lado del proveedor.

```bash
openclaw models auth login --provider anthropic --force
```

### Por sesión (comando de chat)

Usa `/model <alias-or-id>@<profileId>` para fijar una credencial de proveedor específica para la sesión actual (ids de perfil de ejemplo: `anthropic:default`, `anthropic:work`).

Usa `/model` (o `/model list`) para un selector compacto; usa `/model status` para la vista completa (candidatos + siguiente perfil de autenticación, además de detalles de endpoint del proveedor cuando estén configurados).

### Por agente (sobrescritura de CLI)

Establece una sobrescritura explícita del orden de perfiles de autenticación para un agente (almacenada en el estado de autenticación SQLite de ese agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` para apuntar a un agente específico; omítelo para usar el agente predeterminado configurado.
Cuando depures problemas de orden, `openclaw models status --probe` muestra los perfiles almacenados omitidos como `excluded_by_auth_order` en lugar de saltárselos silenciosamente.
Cuando depures problemas de enfriamiento, recuerda que los enfriamientos por límite de tasa pueden estar vinculados a un id de modelo en lugar de a todo el perfil del proveedor.

Si cambias el orden de autenticación o la fijación de perfil para un chat que ya está en ejecución, envía `/new` o `/reset` en ese chat para iniciar una sesión nueva. Las sesiones existentes pueden conservar su selección actual de modelo/perfil hasta que se restablezcan.

## Solución de problemas

### "No se encontraron credenciales"

Si falta el perfil de Anthropic, configura una clave de API de Anthropic en el
**host del Gateway** o configura la ruta setup-token de Anthropic, y luego vuelve a comprobar:

```bash
openclaw models status
```

### Token por caducar/caducado

Ejecuta `openclaw models status` para confirmar qué perfil está por caducar. Si falta un perfil de token de Anthropic o caducó, actualiza esa configuración mediante setup-token o migra a una clave de API de Anthropic.

## Relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Acceso remoto](/es/gateway/remote)
- [Almacenamiento de autenticación](/es/concepts/oauth)
