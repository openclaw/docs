---
read_when:
    - Depurar la autenticación del modelo o el vencimiento de OAuth
    - Documentar la autenticación o el almacenamiento de credenciales
summary: 'Autenticación de modelos: OAuth, claves API, reutilización de Claude CLI y setup-token de Anthropic'
title: Autenticación
x-i18n:
    generated_at: "2026-04-24T05:27:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# Autenticación (proveedores de modelos)

<Note>
Esta página cubre la autenticación de **proveedores de modelos** (claves API, OAuth, reutilización de Claude CLI y setup-token de Anthropic). Para la autenticación de **conexión al Gateway** (token, contraseña, trusted-proxy), consulta [Configuration](/es/gateway/configuration) y [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth).
</Note>

OpenClaw admite OAuth y claves API para proveedores de modelos. Para hosts Gateway siempre activos,
las claves API suelen ser la opción más predecible. Los flujos de suscripción/OAuth
también son compatibles cuando coinciden con el modelo de cuenta de tu proveedor.

Consulta [/concepts/oauth](/es/concepts/oauth) para ver el flujo completo de OAuth y el diseño
de almacenamiento.
Para autenticación basada en SecretRef (proveedores `env`/`file`/`exec`), consulta [Gestión de Secrets](/es/gateway/secrets).
Para las reglas de elegibilidad de credenciales/códigos de motivo usadas por `models status --probe`, consulta
[Semántica de credenciales de autenticación](/es/auth-credential-semantics).

## Configuración recomendada (clave API, cualquier proveedor)

Si estás ejecutando un Gateway de larga duración, comienza con una clave API para el
proveedor elegido.
En el caso específico de Anthropic, la autenticación con clave API sigue siendo la configuración
de servidor más predecible, pero OpenClaw también admite reutilizar un inicio de sesión local de Claude CLI.

1. Crea una clave API en la consola de tu proveedor.
2. Colócala en el **host Gateway** (la máquina que ejecuta `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si el Gateway se ejecuta bajo systemd/launchd, es preferible poner la clave en
   `~/.openclaw/.env` para que el daemon pueda leerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Luego reinicia el daemon (o reinicia tu proceso Gateway) y vuelve a comprobar:

```bash
openclaw models status
openclaw doctor
```

Si prefieres no gestionar variables de entorno tú mismo, la incorporación puede almacenar
claves API para que las use el daemon: `openclaw onboard`.

Consulta [Ayuda](/es/help) para ver detalles sobre herencia de entorno (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilidad con Claude CLI y token

La autenticación con setup-token de Anthropic sigue disponible en OpenClaw como una ruta de
token compatible. Desde entonces, el personal de Anthropic nos ha dicho que el uso tipo Claude CLI de OpenClaw
vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de
`claude -p` como autorizados para esta integración, salvo que Anthropic publique una nueva política. Cuando
la reutilización de Claude CLI está disponible en el host, ahora esa es la ruta preferida.

Para hosts Gateway de larga duración, una clave API de Anthropic sigue siendo la configuración
más predecible. Si quieres reutilizar un inicio de sesión existente de Claude en el mismo host, usa la
ruta de Anthropic Claude CLI en onboarding/configure.

Configuración recomendada del host para reutilizar Claude CLI:

```bash
# Ejecuta esto en el host Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Esta es una configuración de dos pasos:

1. Inicia sesión de Claude Code en Anthropic en el host Gateway.
2. Indica a OpenClaw que cambie la selección de modelos de Anthropic al backend local `claude-cli`
   y almacene el perfil de autenticación correspondiente de OpenClaw.

Si `claude` no está en `PATH`, instala primero Claude Code o establece
`agents.defaults.cliBackends.claude-cli.command` con la ruta real del binario.

Entrada manual de token (cualquier proveedor; escribe `auth-profiles.json` + actualiza la configuración):

```bash
openclaw models auth paste-token --provider openrouter
```

También se admiten referencias de perfiles de autenticación para credenciales estáticas:

- Las credenciales `api_key` pueden usar `keyRef: { source, provider, id }`
- Las credenciales `token` pueden usar `tokenRef: { source, provider, id }`
- Los perfiles en modo OAuth no admiten credenciales SecretRef; si `auth.profiles.<id>.mode` está establecido en `"oauth"`, se rechaza la entrada `keyRef`/`tokenRef` respaldada por SecretRef para ese perfil.

Comprobación apta para automatización (sale con `1` cuando falta/ha expirado, `2` cuando está por expirar):

```bash
openclaw models status --check
```

Comprobaciones de autenticación en vivo:

```bash
openclaw models status --probe
```

Notas:

- Las filas de comprobación pueden venir de perfiles de autenticación, credenciales de entorno o `models.json`.
- Si `auth.order.<provider>` explícito omite un perfil almacenado, la comprobación informa
  `excluded_by_auth_order` para ese perfil en lugar de intentarlo.
- Si existe autenticación pero OpenClaw no puede resolver un modelo candidato comprobable para
  ese proveedor, la comprobación informa `status: no_model`.
- Los cooldowns por límite de tasa pueden tener alcance por modelo. Un perfil en cooldown para un
  modelo aún puede ser utilizable para un modelo hermano del mismo proveedor.

Los scripts opcionales de operaciones (systemd/Termux) están documentados aquí:
[Scripts de supervisión de autenticación](/es/help/scripts#auth-monitoring-scripts)

## Nota sobre Anthropic

El backend `claude-cli` de Anthropic vuelve a ser compatible.

- El personal de Anthropic nos dijo que esta ruta de integración de OpenClaw vuelve a estar permitida.
- Por lo tanto, OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados
  para ejecuciones respaldadas por Anthropic, salvo que Anthropic publique una nueva política.
- Las claves API de Anthropic siguen siendo la opción más predecible para hosts Gateway
  de larga duración y para un control explícito de facturación del lado del servidor.

## Comprobar el estado de autenticación del modelo

```bash
openclaw models status
openclaw doctor
```

## Comportamiento de rotación de claves API (Gateway)

Algunos proveedores admiten reintentar una solicitud con claves alternativas cuando una llamada API
alcanza el límite de tasa del proveedor.

- Orden de prioridad:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (sobrescritura única)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Los proveedores de Google también incluyen `GOOGLE_API_KEY` como fallback adicional.
- La misma lista de claves se desduplica antes de usarse.
- OpenClaw reintenta con la siguiente clave solo en errores de límite de tasa (por ejemplo
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` o
  `workers_ai ... quota limit exceeded`).
- Los errores que no sean de límite de tasa no se reintentan con claves alternativas.
- Si fallan todas las claves, se devuelve el error final del último intento.

## Controlar qué credencial se usa

### Por sesión (comando de chat)

Usa `/model <alias-or-id>@<profileId>` para fijar una credencial específica del proveedor para la sesión actual (ejemplos de ids de perfil: `anthropic:default`, `anthropic:work`).

Usa `/model` (o `/model list`) para un selector compacto; usa `/model status` para la vista completa (candidatos + siguiente perfil de autenticación, además de detalles del endpoint del proveedor cuando estén configurados).

### Por agente (sobrescritura de CLI)

Establece una sobrescritura explícita del orden de perfiles de autenticación para un agente (se almacena en el `auth-state.json` de ese agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` para apuntar a un agente específico; omítelo para usar el agente predeterminado configurado.
Cuando depures problemas de orden, `openclaw models status --probe` muestra los
perfiles almacenados omitidos como `excluded_by_auth_order` en lugar de omitirlos silenciosamente.
Cuando depures problemas de cooldown, recuerda que los cooldowns por límite de tasa pueden estar vinculados
a un id de modelo en lugar de a todo el perfil del proveedor.

## Solución de problemas

### "No credentials found"

Si falta el perfil de Anthropic, configura una clave API de Anthropic en el
**host Gateway** o establece la ruta de setup-token de Anthropic, y luego vuelve a comprobar:

```bash
openclaw models status
```

### Token por expirar/expirado

Ejecuta `openclaw models status` para confirmar qué perfil está por expirar. Si un
perfil de token de Anthropic falta o ha expirado, actualiza esa configuración mediante
setup-token o migra a una clave API de Anthropic.

## Relacionado

- [Gestión de Secrets](/es/gateway/secrets)
- [Acceso remoto](/es/gateway/remote)
- [Almacenamiento de autenticación](/es/concepts/oauth)
