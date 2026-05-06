---
read_when:
    - Depuración de autenticación del modelo o caducidad de OAuth
    - Documentar la autenticación o el almacenamiento de credenciales
summary: 'Autenticación de modelos: OAuth, claves de API, reutilización de Claude CLI y setup-token de Anthropic'
title: Autenticación
x-i18n:
    generated_at: "2026-05-06T05:33:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Esta página es la referencia de autenticación de **proveedores de modelos** (claves API, OAuth, reutilización de Claude CLI y setup-token de Anthropic). Para la autenticación de **conexión de Gateway** (token, contraseña, trusted-proxy), consulta [Configuración](/es/gateway/configuration) y [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
</Note>

OpenClaw admite OAuth y claves API para proveedores de modelos. Para hosts de Gateway siempre activos, las claves API suelen ser la opción más predecible. Los flujos de suscripción/OAuth también son compatibles cuando coinciden con el modelo de cuenta de tu proveedor.

Consulta [/concepts/oauth](/es/concepts/oauth) para ver el flujo completo de OAuth y el diseño de almacenamiento.
Para la autenticación basada en SecretRef (proveedores `env`/`file`/`exec`), consulta [Gestión de secretos](/es/gateway/secrets).
Para las reglas de elegibilidad de credenciales/códigos de motivo que usa `models status --probe`, consulta
[Semántica de credenciales de autenticación](/es/auth-credential-semantics).

## Configuración recomendada (clave API, cualquier proveedor)

Si estás ejecutando un Gateway de larga duración, empieza con una clave API para el proveedor que elijas.
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

Si prefieres no gestionar variables de entorno por tu cuenta, la incorporación puede almacenar claves API para uso del daemon: `openclaw onboard`.

Consulta [Ayuda](/es/help) para obtener detalles sobre la herencia de entorno (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI y compatibilidad de tokens

La autenticación setup-token de Anthropic sigue disponible en OpenClaw como una ruta de token admitida. Desde entonces, el personal de Anthropic nos ha dicho que el uso de Claude CLI al estilo de OpenClaw vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración, salvo que Anthropic publique una nueva política. Cuando la reutilización de Claude CLI está disponible en el host, ahora es la ruta preferida.

Para hosts de Gateway de larga duración, una clave API de Anthropic sigue siendo la configuración más predecible. Si quieres reutilizar un inicio de sesión de Claude existente en el mismo host, usa la ruta de Anthropic Claude CLI en onboarding/configure.

Configuración de host recomendada para reutilizar Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Esta es una configuración de dos pasos:

1. Inicia sesión de Claude Code en Anthropic en el host del Gateway.
2. Indica a OpenClaw que cambie la selección de modelos de Anthropic al backend local `claude-cli`
   y almacene el perfil de autenticación de OpenClaw correspondiente.

Si `claude` no está en `PATH`, instala primero Claude Code o configura
`agents.defaults.cliBackends.claude-cli.command` con la ruta real del binario.

Entrada manual de token (cualquier proveedor; escribe `auth-profiles.json` + actualiza la configuración):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` almacena solo credenciales. La forma canónica es:

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

OpenClaw espera la forma canónica `version` + `profiles` en tiempo de ejecución. Si una instalación más antigua aún tiene un archivo plano como `{ "openrouter": { "apiKey": "..." } }`, ejecuta `openclaw doctor --fix` para reescribirlo como un perfil de clave API `openrouter:default`; doctor conserva una copia `.legacy-flat.*.bak` junto al original. Los detalles de endpoint como `baseUrl`, `api`, ids de modelo, encabezados y tiempos de espera pertenecen a `models.providers.<id>` en `openclaw.json` o `models.json`, no a `auth-profiles.json`.

También se admiten referencias de perfil de autenticación para credenciales estáticas:

- Las credenciales `api_key` pueden usar `keyRef: { source, provider, id }`
- Las credenciales `token` pueden usar `tokenRef: { source, provider, id }`
- Los perfiles en modo OAuth no admiten credenciales SecretRef; si `auth.profiles.<id>.mode` está establecido en `"oauth"`, se rechaza la entrada `keyRef`/`tokenRef` respaldada por SecretRef para ese perfil.

Comprobación apta para automatización (sale con `1` cuando falta o ha caducado, `2` cuando está a punto de caducar):

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
- Los enfriamientos por límite de tasa pueden estar asociados a un modelo. Un perfil en enfriamiento para un
  modelo puede seguir siendo utilizable para un modelo hermano del mismo proveedor.

Los scripts opcionales de operaciones (systemd/Termux) están documentados aquí:
[Scripts de supervisión de autenticación](/es/help/scripts#auth-monitoring-scripts)

## Nota sobre Anthropic

El backend `claude-cli` de Anthropic vuelve a estar admitido.

- El personal de Anthropic nos dijo que esta ruta de integración de OpenClaw vuelve a estar permitida.
- Por tanto, OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados
  para ejecuciones respaldadas por Anthropic, salvo que Anthropic publique una nueva política.
- Las claves API de Anthropic siguen siendo la opción más predecible para hosts de Gateway
  de larga duración y control explícito de facturación del lado del servidor.

## Comprobar el estado de autenticación de modelos

```bash
openclaw models status
openclaw doctor
```

## Comportamiento de rotación de claves API (Gateway)

Algunos proveedores admiten reintentar una solicitud con claves alternativas cuando una llamada API
alcanza un límite de tasa del proveedor.

- Orden de prioridad:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (anulación única)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Los proveedores de Google también incluyen `GOOGLE_API_KEY` como reserva adicional.
- La misma lista de claves se deduplica antes de usarse.
- OpenClaw reintenta con la siguiente clave solo para errores de límite de tasa (por ejemplo
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` o
  `workers_ai ... quota limit exceeded`).
- Los errores que no son de límite de tasa no se reintentan con claves alternativas.
- Si todas las claves fallan, se devuelve el error final del último intento.

## Controlar qué credencial se usa

### Por sesión (comando de chat)

Usa `/model <alias-or-id>@<profileId>` para fijar una credencial de proveedor específica para la sesión actual (ids de perfil de ejemplo: `anthropic:default`, `anthropic:work`).

Usa `/model` (o `/model list`) para un selector compacto; usa `/model status` para la vista completa (candidatos + siguiente perfil de autenticación, además de detalles del endpoint del proveedor cuando estén configurados).

### Por agente (anulación de CLI)

Establece una anulación explícita del orden de perfiles de autenticación para un agente (almacenada en el `auth-state.json` de ese agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` para apuntar a un agente específico; omítelo para usar el agente predeterminado configurado.
Al depurar problemas de orden, `openclaw models status --probe` muestra los perfiles almacenados omitidos como `excluded_by_auth_order` en lugar de saltárselos silenciosamente.
Al depurar problemas de enfriamiento, recuerda que los enfriamientos por límite de tasa pueden estar ligados
a un id de modelo en lugar de a todo el perfil del proveedor.

## Solución de problemas

### "No credentials found"

Si falta el perfil de Anthropic, configura una clave API de Anthropic en el
**host del Gateway** o configura la ruta setup-token de Anthropic, y luego vuelve a comprobar:

```bash
openclaw models status
```

### Token a punto de caducar/caducado

Ejecuta `openclaw models status` para confirmar qué perfil está a punto de caducar. Si falta un
perfil de token de Anthropic o ha caducado, actualiza esa configuración mediante
setup-token o migra a una clave API de Anthropic.

## Relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Acceso remoto](/es/gateway/remote)
- [Almacenamiento de autenticación](/es/concepts/oauth)
