---
read_when:
    - Ejecutar OpenClaw detrás de un proxy con reconocimiento de identidad
    - Configurar Pomerium, Caddy o nginx con OAuth delante de OpenClaw
    - Corregir errores WebSocket 1008 no autorizado en configuraciones con proxy inverso
    - Decidir dónde establecer HSTS y otros encabezados de endurecimiento HTTP
summary: Delegar la autenticación del gateway a un proxy inverso de confianza (Pomerium, Caddy, nginx + OAuth)
title: Autenticación de proxy de confianza
x-i18n:
    generated_at: "2026-04-24T05:31:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: af406f218fb91c5ae2fed04921670bfc4cd3d06f51b08eec91cddde4521bf771
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

> ⚠️ **Función sensible a la seguridad.** Este modo delega la autenticación por completo a tu proxy inverso. Una mala configuración puede exponer tu Gateway a acceso no autorizado. Lee esta página cuidadosamente antes de habilitarlo.

## Cuándo usarlo

Usa el modo de autenticación `trusted-proxy` cuando:

- Ejecutas OpenClaw detrás de un **proxy con reconocimiento de identidad** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Tu proxy gestiona toda la autenticación y transmite la identidad del usuario mediante encabezados
- Estás en un entorno de Kubernetes o contenedores donde el proxy es la única ruta hacia el Gateway
- Estás encontrando errores WebSocket `1008 unauthorized` porque los navegadores no pueden pasar tokens en cargas útiles de WS

## Cuándo NO usarlo

- Si tu proxy no autentica usuarios (solo termina TLS o actúa como balanceador de carga)
- Si existe cualquier ruta al Gateway que omita el proxy (huecos en el firewall, acceso a red interna)
- Si no estás seguro de que tu proxy elimine/sobrescriba correctamente los encabezados reenviados
- Si solo necesitas acceso personal de un único usuario (considera Tailscale Serve + loopback para una configuración más simple)

## Cómo funciona

1. Tu proxy inverso autentica a los usuarios (OAuth, OIDC, SAML, etc.)
2. El proxy añade un encabezado con la identidad autenticada del usuario (por ejemplo, `x-forwarded-user: nick@example.com`)
3. OpenClaw comprueba que la solicitud provenga de una **IP de proxy de confianza** (configurada en `gateway.trustedProxies`)
4. OpenClaw extrae la identidad del usuario del encabezado configurado
5. Si todo cuadra, la solicitud se autoriza

## Comportamiento de emparejamiento de Control UI

Cuando `gateway.auth.mode = "trusted-proxy"` está activo y la solicitud supera
las comprobaciones de proxy de confianza, las sesiones WebSocket de Control UI pueden conectarse sin identidad de emparejamiento de dispositivo.

Implicaciones:

- El emparejamiento deja de ser la barrera principal para el acceso a Control UI en este modo.
- La política de autenticación de tu proxy inverso y `allowUsers` se convierten en el control de acceso efectivo.
- Mantén el ingreso del gateway bloqueado solo a IPs de proxy de confianza (`gateway.trustedProxies` + firewall).

## Configuración

```json5
{
  gateway: {
    // La autenticación de proxy de confianza espera solicitudes desde una fuente proxy de confianza no loopback
    bind: "lan",

    // CRÍTICO: Añade aquí solo las IP de tu proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Encabezado que contiene la identidad del usuario autenticado (obligatorio)
        userHeader: "x-forwarded-user",

        // Opcional: encabezados que DEBEN estar presentes (verificación del proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcional: restringir a usuarios específicos (vacío = permitir todos)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Regla importante de entorno de ejecución:

- La autenticación de proxy de confianza rechaza solicitudes con origen loopback (`127.0.0.1`, `::1`, CIDR de loopback).
- Los proxies inversos loopback en el mismo host **no** cumplen con la autenticación de proxy de confianza.
- Para configuraciones de proxy loopback en el mismo host, usa autenticación por token/contraseña en su lugar, o enruta a través de una dirección de proxy de confianza no loopback que OpenClaw pueda verificar.
- Las implementaciones de Control UI no loopback siguen necesitando `gateway.controlUi.allowedOrigins` explícito.
- **La evidencia de encabezados reenviados prevalece sobre la localidad loopback.** Si una solicitud llega por loopback pero lleva encabezados `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` que apuntan a un origen no local, esa evidencia invalida la afirmación de localidad loopback. La solicitud se trata como remota para emparejamiento, autenticación de proxy de confianza y control de identidad de dispositivo de Control UI. Esto evita que un proxy loopback en el mismo host introduzca indebidamente identidad de encabezados reenviados en la autenticación de proxy de confianza.

### Referencia de configuración

| Campo                                       | Obligatorio | Descripción                                                                 |
| ------------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Sí          | Matriz de direcciones IP de proxy en las que confiar. Las solicitudes desde otras IP se rechazan. |
| `gateway.auth.mode`                         | Sí          | Debe ser `"trusted-proxy"`                                                  |
| `gateway.auth.trustedProxy.userHeader`      | Sí          | Nombre del encabezado que contiene la identidad del usuario autenticado     |
| `gateway.auth.trustedProxy.requiredHeaders` | No          | Encabezados adicionales que deben estar presentes para que la solicitud sea de confianza |
| `gateway.auth.trustedProxy.allowUsers`      | No          | Allowlist de identidades de usuario. Vacío significa permitir todos los usuarios autenticados. |

## Terminación TLS y HSTS

Usa un único punto de terminación TLS y aplica HSTS allí.

### Patrón recomendado: terminación TLS en el proxy

Cuando tu proxy inverso gestiona HTTPS para `https://control.example.com`, configura
`Strict-Transport-Security` en el proxy para ese dominio.

- Encaja bien en implementaciones expuestas a internet.
- Mantiene el certificado + la política de endurecimiento HTTP en un solo lugar.
- OpenClaw puede permanecer en HTTP loopback detrás del proxy.

Valor de encabezado de ejemplo:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminación TLS en Gateway

Si el propio OpenClaw sirve HTTPS directamente (sin proxy que termine TLS), configura:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` acepta un valor de encabezado string, o `false` para deshabilitarlo explícitamente.

### Guía de despliegue

- Comienza primero con un max age corto (por ejemplo `max-age=300`) mientras validas el tráfico.
- Aumenta a valores de larga duración (por ejemplo `max-age=31536000`) solo cuando la confianza sea alta.
- Añade `includeSubDomains` solo si cada subdominio está listo para HTTPS.
- Usa preload solo si cumples intencionalmente los requisitos de preload para todo tu conjunto de dominios.
- El desarrollo local solo con loopback no se beneficia de HSTS.

## Ejemplos de configuración de proxy

### Pomerium

Pomerium pasa la identidad en `x-pomerium-claim-email` (u otros encabezados de claim) y un JWT en `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP de Pomerium
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Fragmento de configuración de Pomerium:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy con OAuth

Caddy con el Plugin `caddy-security` puede autenticar usuarios y pasar encabezados de identidad.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP del proxy Caddy/sidecar
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Fragmento de Caddyfile:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy autentica usuarios y pasa la identidad en `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP de nginx/oauth2-proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

Fragmento de configuración de nginx:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik con Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // IP del contenedor Traefik
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Configuración mixta de token

OpenClaw rechaza configuraciones ambiguas donde tanto `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`) como el modo `trusted-proxy` están activos al mismo tiempo. Las configuraciones mixtas de token pueden hacer que las solicitudes loopback se autentiquen silenciosamente mediante la ruta de autenticación incorrecta.

Si ves un error `mixed_trusted_proxy_token` al iniciar:

- Elimina el token compartido cuando uses el modo trusted-proxy, o
- Cambia `gateway.auth.mode` a `"token"` si tu intención es usar autenticación basada en token.

La autenticación de proxy de confianza en loopback también falla en modo cerrado: quienes llamen desde el mismo host deben proporcionar los encabezados de identidad configurados a través de un proxy de confianza en lugar de autenticarse silenciosamente.

## Encabezado de alcances de operador

La autenticación de proxy de confianza es un modo HTTP **con identidad**, así que quienes llaman
pueden declarar opcionalmente alcances de operador con `x-openclaw-scopes`.

Ejemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamiento:

- Cuando el encabezado está presente, OpenClaw respeta el conjunto de alcances declarado.
- Cuando el encabezado está presente pero vacío, la solicitud declara **ningún** alcance de operador.
- Cuando el encabezado está ausente, las API HTTP normales con identidad usan como respaldo el conjunto estándar de alcances predeterminados de operador.
- Las **rutas HTTP de plugin** con autenticación de gateway son más limitadas por defecto: cuando falta `x-openclaw-scopes`, su alcance de entorno de ejecución usa como respaldo `operator.write`.
- Las solicitudes HTTP originadas en navegador siguen teniendo que superar `gateway.controlUi.allowedOrigins` (o el modo de respaldo deliberado por encabezado Host) incluso después de que la autenticación de proxy de confianza tenga éxito.

Regla práctica:

- Envía `x-openclaw-scopes` explícitamente cuando quieras que una solicitud de trusted-proxy
  sea más limitada que los valores predeterminados, o cuando una ruta de plugin con autenticación de gateway necesite
  algo más fuerte que alcance de escritura.

## Lista de verificación de seguridad

Antes de habilitar la autenticación de proxy de confianza, verifica:

- [ ] **El proxy es la única ruta**: el puerto del Gateway está protegido por firewall contra todo excepto tu proxy
- [ ] **trustedProxies es mínimo**: solo las IP reales de tu proxy, no subredes enteras
- [ ] **Sin origen de proxy loopback**: la autenticación trusted-proxy falla en modo cerrado para solicitudes con origen loopback
- [ ] **El proxy elimina encabezados**: tu proxy sobrescribe (no añade) encabezados `x-forwarded-*` de los clientes
- [ ] **Terminación TLS**: tu proxy gestiona TLS; los usuarios se conectan por HTTPS
- [ ] **allowedOrigins es explícito**: Control UI no loopback usa `gateway.controlUi.allowedOrigins` explícito
- [ ] **allowUsers está configurado** (recomendado): restringe a usuarios conocidos en lugar de permitir a cualquiera autenticado
- [ ] **Sin configuración mixta de token**: no configures a la vez `gateway.auth.token` y `gateway.auth.mode: "trusted-proxy"`

## Auditoría de seguridad

`openclaw security audit` marcará la autenticación de proxy de confianza con un hallazgo de severidad **crítica**. Esto es intencional: es un recordatorio de que estás delegando la seguridad a la configuración de tu proxy.

La auditoría comprueba:

- advertencia/base crítica `gateway.trusted_proxy_auth`
- falta de configuración `trustedProxies`
- falta de configuración `userHeader`
- `allowUsers` vacío (permite cualquier usuario autenticado)
- política de origen de navegador comodín o ausente en superficies expuestas de Control UI

## Solución de problemas

### "trusted_proxy_untrusted_source"

La solicitud no provino de una IP incluida en `gateway.trustedProxies`. Comprueba:

- ¿Es correcta la IP del proxy? (Las IP de contenedores Docker pueden cambiar)
- ¿Hay un balanceador de carga delante de tu proxy?
- Usa `docker inspect` o `kubectl get pods -o wide` para encontrar las IP reales

### "trusted_proxy_loopback_source"

OpenClaw rechazó una solicitud de proxy de confianza con origen loopback.

Comprueba:

- ¿Se está conectando el proxy desde `127.0.0.1` / `::1`?
- ¿Estás intentando usar autenticación trusted-proxy con un proxy inverso loopback en el mismo host?

Corrección:

- Usa autenticación por token/contraseña para configuraciones de proxy loopback en el mismo host, o
- Enruta a través de una dirección de proxy de confianza no loopback y mantén esa IP en `gateway.trustedProxies`.

### "trusted_proxy_user_missing"

El encabezado del usuario estaba vacío o faltaba. Comprueba:

- ¿Está tu proxy configurado para pasar encabezados de identidad?
- ¿Es correcto el nombre del encabezado? (no distingue mayúsculas/minúsculas, pero la ortografía importa)
- ¿Está realmente autenticado el usuario en el proxy?

### "trusted*proxy_missing_header*\*"

Faltaba un encabezado obligatorio. Comprueba:

- La configuración de tu proxy para esos encabezados concretos
- Si los encabezados se están eliminando en algún punto de la cadena

### "trusted_proxy_user_not_allowed"

El usuario está autenticado, pero no está en `allowUsers`. Añádelo o elimina la allowlist.

### "trusted_proxy_origin_not_allowed"

La autenticación de proxy de confianza tuvo éxito, pero el encabezado `Origin` del navegador no superó las comprobaciones de origen de Control UI.

Comprueba:

- `gateway.controlUi.allowedOrigins` incluye el origen exacto del navegador
- No estás confiando en orígenes comodín a menos que intencionalmente quieras un comportamiento de permitir todo
- Si intencionalmente usas el modo de respaldo por encabezado Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` está configurado deliberadamente

### El WebSocket sigue fallando

Asegúrate de que tu proxy:

- Admite upgrades de WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Pasa los encabezados de identidad en las solicitudes de upgrade de WebSocket (no solo HTTP)
- No tiene una ruta de autenticación separada para conexiones WebSocket

## Migración desde autenticación por token

Si te estás moviendo de autenticación por token a trusted-proxy:

1. Configura tu proxy para autenticar usuarios y pasar encabezados
2. Prueba la configuración del proxy de forma independiente (curl con encabezados)
3. Actualiza la configuración de OpenClaw con autenticación trusted-proxy
4. Reinicia el Gateway
5. Prueba las conexiones WebSocket desde la Control UI
6. Ejecuta `openclaw security audit` y revisa los hallazgos

## Relacionado

- [Seguridad](/es/gateway/security) — guía completa de seguridad
- [Configuración](/es/gateway/configuration) — referencia de configuración
- [Acceso remoto](/es/gateway/remote) — otros patrones de acceso remoto
- [Tailscale](/es/gateway/tailscale) — alternativa más simple para acceso solo por tailnet
