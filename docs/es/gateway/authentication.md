---
read_when:
    - Depuración de la autenticación del modelo o del vencimiento de OAuth
    - Documentación de la autenticación o del almacenamiento de credenciales
summary: 'Autenticación del modelo: OAuth, claves API, reutilización de Claude CLI y token de configuración de Anthropic'
title: Autenticación
x-i18n:
    generated_at: "2026-04-23T14:56:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a7c20872b915d1d079f0578c933e43cbdb97eca1c60d8c4e6e5137ca83f8b2
    source_path: gateway/authentication.md
    workflow: 15
---

# Autenticación (proveedores de modelos)

<Note>
Esta página cubre la autenticación de **proveedores de modelos** (claves API, OAuth, reutilización de Claude CLI y token de configuración de Anthropic). Para la autenticación de **conexión del Gateway** (token, contraseña, proxy de confianza), consulta [Configuration](/es/gateway/configuration) y [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth).
</Note>

OpenClaw admite OAuth y claves API para proveedores de modelos. Para hosts de Gateway siempre activos, las claves API suelen ser la opción más predecible. Los flujos de suscripción/OAuth también son compatibles cuando coinciden con el modelo de cuenta de tu proveedor.

Consulta [/concepts/oauth](/es/concepts/oauth) para ver el flujo completo de OAuth y el diseño de almacenamiento.
Para la autenticación basada en SecretRef (proveedores `env`/`file`/`exec`), consulta [Secrets Management](/es/gateway/secrets).
Para las reglas de elegibilidad de credenciales/códigos de motivo que usa `models status --probe`, consulta
[Semántica de credenciales de autenticación](/es/auth-credential-semantics).

## Configuración recomendada (clave API, cualquier proveedor)

Si estás ejecutando un Gateway de larga duración, comienza con una clave API para el proveedor que elijas.
Para Anthropic en concreto, la autenticación con clave API sigue siendo la configuración de servidor más predecible, pero OpenClaw también admite reutilizar un inicio de sesión local de Claude CLI.

1. Crea una clave API en la consola de tu proveedor.
2. Colócala en el **host del Gateway** (la máquina que ejecuta `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si el Gateway se ejecuta bajo systemd/launchd, es preferible colocar la clave en
   `~/.openclaw/.env` para que el daemon pueda leerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Luego reinicia el daemon (o reinicia tu proceso de Gateway) y vuelve a comprobar:

```bash
openclaw models status
openclaw doctor
```

Si prefieres no gestionar las variables de entorno por tu cuenta, la incorporación puede almacenar
claves API para el uso del daemon: `openclaw onboard`.

Consulta [Help](/es/help) para obtener detalles sobre la herencia de variables de entorno (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilidad de Claude CLI y tokens

La autenticación con token de configuración de Anthropic sigue disponible en OpenClaw como una ruta de token compatible. Desde entonces, el personal de Anthropic nos ha dicho que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como permitidos para esta integración, salvo que Anthropic publique una nueva política. Cuando la reutilización de Claude CLI está disponible en el host, ahora es la ruta preferida.

Para hosts de Gateway de larga duración, una clave API de Anthropic sigue siendo la configuración más predecible. Si quieres reutilizar un inicio de sesión existente de Claude en el mismo host, usa la ruta de Anthropic Claude CLI en onboarding/configure.

Configuración recomendada del host para reutilizar Claude CLI:

```bash
# Ejecuta en el host del Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Esta es una configuración de dos pasos:

1. Inicia sesión de Claude Code en Anthropic en el host del Gateway.
2. Indica a OpenClaw que cambie la selección de modelos de Anthropic al backend local `claude-cli`
   y almacene el perfil de autenticación de OpenClaw correspondiente.

Si `claude` no está en `PATH`, instala primero Claude Code o establece
`agents.defaults.cliBackends.claude-cli.command` en la ruta real del binario.

Entrada manual de token (cualquier proveedor; escribe en `auth-profiles.json` + actualiza la configuración):

```bash
openclaw models auth paste-token --provider openrouter
```

También se admiten referencias de perfiles de autenticación para credenciales estáticas:

- las credenciales `api_key` pueden usar `keyRef: { source, provider, id }`
- las credenciales `token` pueden usar `tokenRef: { source, provider, id }`
- los perfiles en modo OAuth no admiten credenciales SecretRef; si `auth.profiles.<id>.mode` está establecido en `"oauth"`, se rechaza la entrada `keyRef`/`tokenRef` respaldada por SecretRef para ese perfil.

Comprobación apta para automatización (salida `1` cuando falta/ha expirado, `2` cuando está por expirar):

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
- Si existe autenticación pero OpenClaw no puede resolver un candidato de modelo sondeable para
  ese proveedor, el sondeo informa `status: no_model`.
- Los periodos de enfriamiento por límite de tasa pueden estar delimitados por modelo. Un perfil en enfriamiento para un
  modelo puede seguir siendo utilizable para un modelo relacionado en el mismo proveedor.

Los scripts operativos opcionales (systemd/Termux) están documentados aquí:
[Scripts de supervisión de autenticación](/es/help/scripts#auth-monitoring-scripts)

## Nota sobre Anthropic

El backend `claude-cli` de Anthropic vuelve a estar admitido.

- El personal de Anthropic nos dijo que esta ruta de integración de OpenClaw vuelve a estar permitida.
- Por lo tanto, OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como permitidos
  para ejecuciones respaldadas por Anthropic, salvo que Anthropic publique una nueva política.
- Las claves API de Anthropic siguen siendo la opción más predecible para hosts de Gateway
  de larga duración y para un control explícito de facturación del lado del servidor.

## Comprobar el estado de autenticación del modelo

```bash
openclaw models status
openclaw doctor
```

## Comportamiento de rotación de claves API (Gateway)

Algunos proveedores admiten reintentar una solicitud con claves alternativas cuando una llamada API
alcanza un límite de tasa del proveedor.

- Orden de prioridad:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (una sola anulación)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Los proveedores de Google también incluyen `GOOGLE_API_KEY` como una alternativa adicional.
- La misma lista de claves se desduplica antes de usarse.
- OpenClaw reintenta con la siguiente clave solo para errores de límite de tasa (por ejemplo
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, o
  `workers_ai ... quota limit exceeded`).
- Los errores que no son de límite de tasa no se reintentan con claves alternativas.
- Si todas las claves fallan, se devuelve el error final del último intento.

## Controlar qué credencial se usa

### Por sesión (comando de chat)

Usa `/model <alias-or-id>@<profileId>` para fijar una credencial específica del proveedor para la sesión actual (ejemplos de IDs de perfil: `anthropic:default`, `anthropic:work`).

Usa `/model` (o `/model list`) para un selector compacto; usa `/model status` para la vista completa (candidatos + siguiente perfil de autenticación, además de detalles del endpoint del proveedor cuando estén configurados).

### Por agente (anulación de CLI)

Establece una anulación explícita del orden de perfiles de autenticación para un agente (se almacena en el `auth-state.json` de ese agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` para apuntar a un agente específico; omítelo para usar el agente predeterminado configurado.
Cuando depures problemas de orden, `openclaw models status --probe` muestra los
perfiles almacenados omitidos como `excluded_by_auth_order` en lugar de omitirlos silenciosamente.
Cuando depures problemas de enfriamiento, recuerda que los periodos de enfriamiento por límite de tasa pueden estar asociados
a un ID de modelo concreto en lugar de a todo el perfil del proveedor.

## Solución de problemas

### "No credentials found"

Si falta el perfil de Anthropic, configura una clave API de Anthropic en el
**host del Gateway** o configura la ruta de token de configuración de Anthropic, y luego vuelve a comprobar:

```bash
openclaw models status
```

### Token a punto de expirar/expirado

Ejecuta `openclaw models status` para confirmar qué perfil está por expirar. Si falta un
perfil de token de Anthropic o ha expirado, actualiza esa configuración mediante
setup-token o migra a una clave API de Anthropic.
