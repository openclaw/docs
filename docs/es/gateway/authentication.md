---
read_when:
    - Depuración de la autenticación del modelo o la expiración de OAuth
    - Documentar la autenticación o el almacenamiento de credenciales
summary: 'Autenticación de modelos: OAuth, claves de API, reutilización de Claude CLI y setup-token de Anthropic'
title: Autenticación
x-i18n:
    generated_at: "2026-04-30T05:39:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Esta página es la referencia de autenticación de **proveedores de modelos** (claves de API, OAuth, reutilización de Claude CLI y setup-token de Anthropic). Para la autenticación de **conexión del Gateway** (token, contraseña, proxy de confianza), consulta [Configuración](/es/gateway/configuration) y [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
</Note>

OpenClaw admite OAuth y claves de API para proveedores de modelos. Para hosts de Gateway
siempre activos, las claves de API suelen ser la opción más predecible. Los flujos
de suscripción/OAuth también son compatibles cuando coinciden con el modelo de cuenta de tu proveedor.

Consulta [/concepts/oauth](/es/concepts/oauth) para ver el flujo OAuth completo y el diseño
de almacenamiento.
Para la autenticación basada en SecretRef (proveedores `env`/`file`/`exec`), consulta [Gestión de secretos](/es/gateway/secrets).
Para las reglas de elegibilidad de credenciales/códigos de motivo usadas por `models status --probe`, consulta
[Semántica de credenciales de autenticación](/es/auth-credential-semantics).

## Configuración recomendada (clave de API, cualquier proveedor)

Si estás ejecutando un Gateway de larga duración, empieza con una clave de API para el
proveedor elegido.
Para Anthropic específicamente, la autenticación con clave de API sigue siendo la configuración de servidor
más predecible, pero OpenClaw también admite reutilizar un inicio de sesión local de Claude CLI.

1. Crea una clave de API en la consola de tu proveedor.
2. Colócala en el **host del Gateway** (la máquina que ejecuta `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si el Gateway se ejecuta bajo systemd/launchd, prefiere colocar la clave en
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

Si prefieres no gestionar variables de entorno por tu cuenta, la incorporación puede almacenar
claves de API para uso del daemon: `openclaw onboard`.

Consulta [Ayuda](/es/help) para obtener detalles sobre la herencia de entorno (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilidad con Claude CLI y tokens

La autenticación setup-token de Anthropic sigue disponible en OpenClaw como una ruta de token
compatible. Desde entonces, el personal de Anthropic nos indicó que el uso de Claude CLI al estilo de OpenClaw
vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como
aprobados para esta integración salvo que Anthropic publique una nueva política. Cuando
la reutilización de Claude CLI esté disponible en el host, ahora esa es la ruta preferida.

Para hosts de Gateway de larga duración, una clave de API de Anthropic sigue siendo la configuración
más predecible. Si quieres reutilizar un inicio de sesión existente de Claude en el mismo host, usa la
ruta Anthropic Claude CLI en la incorporación/configuración.

Configuración recomendada del host para reutilizar Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Esta es una configuración de dos pasos:

1. Inicia sesión en Anthropic desde Claude Code en el host del Gateway.
2. Indica a OpenClaw que cambie la selección de modelos de Anthropic al backend local `claude-cli`
   y almacene el perfil de autenticación de OpenClaw correspondiente.

Si `claude` no está en `PATH`, instala primero Claude Code o define
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

OpenClaw espera la forma canónica `version` + `profiles` en tiempo de ejecución. Si una instalación anterior aún tiene un archivo plano como `{ "openrouter": { "apiKey": "..." } }`, ejecuta `openclaw doctor --fix` para reescribirlo como un perfil de clave de API `openrouter:default`; doctor mantiene una copia `.legacy-flat.*.bak` junto al original. Los detalles de endpoint como `baseUrl`, `api`, identificadores de modelos, encabezados y tiempos de espera pertenecen a `models.providers.<id>` en `openclaw.json` o `models.json`, no a `auth-profiles.json`.

También se admiten referencias a perfiles de autenticación para credenciales estáticas:

- Las credenciales `api_key` pueden usar `keyRef: { source, provider, id }`
- Las credenciales `token` pueden usar `tokenRef: { source, provider, id }`
- Los perfiles en modo OAuth no admiten credenciales SecretRef; si `auth.profiles.<id>.mode` está establecido en `"oauth"`, se rechaza la entrada `keyRef`/`tokenRef` respaldada por SecretRef para ese perfil.

Comprobación adecuada para automatización (salida `1` cuando está caducado/falta, `2` cuando está por caducar):

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
- Los enfriamientos por límite de tasa pueden tener alcance de modelo. Un perfil en enfriamiento para un
  modelo aún puede ser utilizable para un modelo hermano del mismo proveedor.

Los scripts opcionales de operaciones (systemd/Termux) se documentan aquí:
[Scripts de monitoreo de autenticación](/es/help/scripts#auth-monitoring-scripts)

## Nota sobre Anthropic

El backend `claude-cli` de Anthropic vuelve a ser compatible.

- El personal de Anthropic nos indicó que esta ruta de integración de OpenClaw vuelve a estar permitida.
- Por lo tanto, OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como aprobados
  para ejecuciones respaldadas por Anthropic salvo que Anthropic publique una nueva política.
- Las claves de API de Anthropic siguen siendo la opción más predecible para hosts de Gateway
  de larga duración y control explícito de facturación del lado del servidor.

## Comprobar el estado de autenticación de modelos

```bash
openclaw models status
openclaw doctor
```

## Comportamiento de rotación de claves de API (Gateway)

Algunos proveedores admiten reintentar una solicitud con claves alternativas cuando una llamada de API
alcanza un límite de tasa del proveedor.

- Orden de prioridad:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (sobrescritura única)
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

Usa `/model <alias-or-id>@<profileId>` para fijar una credencial de proveedor específica para la sesión actual (identificadores de perfil de ejemplo: `anthropic:default`, `anthropic:work`).

Usa `/model` (o `/model list`) para un selector compacto; usa `/model status` para la vista completa (candidatos + siguiente perfil de autenticación, además de detalles del endpoint del proveedor cuando esté configurado).

### Por agente (sobrescritura de CLI)

Establece una sobrescritura explícita del orden de perfiles de autenticación para un agente (almacenada en el `auth-state.json` de ese agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` para apuntar a un agente específico; omítelo para usar el agente predeterminado configurado.
Cuando depures problemas de orden, `openclaw models status --probe` muestra los perfiles
almacenados omitidos como `excluded_by_auth_order` en lugar de saltarlos silenciosamente.
Cuando depures problemas de enfriamiento, recuerda que los enfriamientos por límite de tasa pueden estar vinculados
a un identificador de modelo en lugar de a todo el perfil del proveedor.

## Solución de problemas

### "No credentials found"

Si falta el perfil de Anthropic, configura una clave de API de Anthropic en el
**host del Gateway** o configura la ruta setup-token de Anthropic, y luego vuelve a comprobar:

```bash
openclaw models status
```

### Token por caducar/caducado

Ejecuta `openclaw models status` para confirmar qué perfil está por caducar. Si falta un
perfil de token de Anthropic o está caducado, actualiza esa configuración mediante
setup-token o migra a una clave de API de Anthropic.

## Relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Acceso remoto](/es/gateway/remote)
- [Almacenamiento de autenticación](/es/concepts/oauth)
