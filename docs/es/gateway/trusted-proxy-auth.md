---
read_when:
    - Ejecutar OpenClaw detrás de un proxy con reconocimiento de identidad
    - Configurar Pomerium, Caddy o nginx con OAuth delante de OpenClaw
    - Corregir errores WebSocket 1008 de no autorizado en configuraciones con proxy inverso
    - Decidir dónde establecer HSTS y otras cabeceras de endurecimiento HTTP
sidebarTitle: Trusted proxy auth
summary: Delegar la autenticación del gateway a un proxy inverso de confianza (Pomerium, Caddy, nginx + OAuth)
title: Autenticación trusted-proxy
x-i18n:
    generated_at: "2026-04-26T11:30:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**Función sensible a la seguridad.** Este modo delega la autenticación por completo a tu proxy inverso. Una mala configuración puede exponer tu Gateway a acceso no autorizado. Lee esta página cuidadosamente antes de habilitarlo.
</Warning>

## Cuándo usarlo

Usa el modo de autenticación `trusted-proxy` cuando:

- Ejecutas OpenClaw detrás de un **proxy con reconocimiento de identidad** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Tu proxy maneja toda la autenticación y pasa la identidad del usuario mediante cabeceras.
- Estás en un entorno Kubernetes o de contenedores donde el proxy es la única ruta hacia el Gateway.
- Estás viendo errores WebSocket `1008 unauthorized` porque los navegadores no pueden pasar tokens en cargas útiles de WS.

## Cuándo NO usarlo

- Si tu proxy no autentica usuarios (solo es un terminador TLS o balanceador de carga).
- Si existe cualquier ruta hacia el Gateway que omita el proxy (huecos en el firewall, acceso a red interna).
- Si no estás seguro de que tu proxy elimine/sobrescriba correctamente las cabeceras reenviadas.
- Si solo necesitas acceso personal de un solo usuario (considera Tailscale Serve + loopback para una configuración más sencilla).

## Cómo funciona

<Steps>
  <Step title="El proxy autentica al usuario">
    Tu proxy inverso autentica a los usuarios (OAuth, OIDC, SAML, etc.).
  </Step>
  <Step title="El proxy agrega una cabecera de identidad">
    El proxy agrega una cabecera con la identidad del usuario autenticado (por ejemplo, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="El Gateway verifica el origen de confianza">
    OpenClaw comprueba que la solicitud vino de una **IP de proxy de confianza** (configurada en `gateway.trustedProxies`).
  </Step>
  <Step title="El Gateway extrae la identidad">
    OpenClaw extrae la identidad del usuario de la cabecera configurada.
  </Step>
  <Step title="Autorizar">
    Si todo cuadra, la solicitud queda autorizada.
  </Step>
</Steps>

## Comportamiento de emparejamiento de la UI de control

Cuando `gateway.auth.mode = "trusted-proxy"` está activo y la solicitud pasa las comprobaciones de trusted-proxy, las sesiones WebSocket de la UI de control pueden conectarse sin identidad de emparejamiento de dispositivo.

Implicaciones:

- El emparejamiento ya no es la compuerta principal para el acceso a la UI de control en este modo.
- La política de autenticación de tu proxy inverso y `allowUsers` se convierten en el control de acceso efectivo.
- Mantén el ingreso del gateway bloqueado solo a IP de proxy de confianza (`gateway.trustedProxies` + firewall).

## Configuración

```json5
{
  gateway: {
    // La autenticación trusted-proxy espera solicitudes desde un origen de proxy de confianza no loopback
    bind: "lan",

    // CRÍTICO: agrega aquí solo la(s) IP(s) de tu proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Cabecera que contiene la identidad del usuario autenticado (obligatoria)
        userHeader: "x-forwarded-user",

        // Opcional: cabeceras que DEBEN estar presentes (verificación del proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcional: restringir a usuarios específicos (vacío = permitir a todos)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**Reglas importantes en tiempo de ejecución**

- La autenticación trusted-proxy rechaza solicitudes de origen loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Los proxies inversos loopback en el mismo host **no** cumplen la autenticación trusted-proxy.
- Para configuraciones de proxy loopback en el mismo host, usa en su lugar autenticación por token/contraseña, o enruta a través de una dirección de proxy de confianza no loopback que OpenClaw pueda verificar.
- Los despliegues de UI de control no loopback siguen necesitando `gateway.controlUi.allowedOrigins` explícito.
- **La evidencia de cabeceras reenviadas sobrescribe la localidad loopback.** Si una solicitud llega por loopback pero lleva cabeceras `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` que apuntan a un origen no local, esa evidencia invalida la afirmación de localidad loopback. La solicitud se trata como remota para emparejamiento, autenticación trusted-proxy y compuerta de identidad de dispositivo de la UI de control. Esto evita que un proxy loopback en el mismo host blanquee identidad de cabeceras reenviadas hacia la autenticación trusted-proxy.

</Warning>

### Referencia de configuración

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Matriz de direcciones IP de proxy en las que confiar. Las solicitudes desde otras IP se rechazan.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Debe ser `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nombre de la cabecera que contiene la identidad del usuario autenticado.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Cabeceras adicionales que deben estar presentes para que la solicitud sea de confianza.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Lista de permitidos de identidades de usuario. Vacío significa permitir a todos los usuarios autenticados.
</ParamField>

## Terminación TLS y HSTS

Usa un único punto de terminación TLS y aplica HSTS allí.

<Tabs>
  <Tab title="Terminación TLS en el proxy (recomendado)">
    Cuando tu proxy inverso maneja HTTPS para `https://control.example.com`, establece `Strict-Transport-Security` en el proxy para ese dominio.

    - Buena opción para despliegues expuestos a Internet.
    - Mantiene certificado + política de endurecimiento HTTP en un solo lugar.
    - OpenClaw puede quedarse en HTTP loopback detrás del proxy.

    Valor de ejemplo para la cabecera:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminación TLS en el Gateway">
    Si OpenClaw mismo sirve HTTPS directamente (sin proxy terminador TLS), establece:

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

    `strictTransportSecurity` acepta un valor de cabecera en cadena, o `false` para deshabilitarlo explícitamente.

  </Tab>
</Tabs>

### Guía de despliegue

- Comienza primero con un max age corto (por ejemplo `max-age=300`) mientras validas el tráfico.
- Aumenta a valores de larga duración (por ejemplo `max-age=31536000`) solo cuando la confianza sea alta.
- Agrega `includeSubDomains` solo si cada subdominio está listo para HTTPS.
- Usa preload solo si cumples intencionalmente los requisitos de preload para todo tu conjunto de dominios.
- El desarrollo local solo loopback no se beneficia de HSTS.

## Ejemplos de configuración de proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium pasa la identidad en `x-pomerium-claim-email` (u otras cabeceras de claim) y un JWT en `x-pomerium-jwt-assertion`.

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

  </Accordion>
  <Accordion title="Caddy con OAuth">
    Caddy con el plugin `caddy-security` puede autenticar usuarios y pasar cabeceras de identidad.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP de Caddy/proxy sidecar
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

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy autentica a los usuarios y pasa la identidad en `x-auth-request-email`.

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

  </Accordion>
  <Accordion title="Traefik con forward auth">
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
  </Accordion>
</AccordionGroup>

## Configuración mixta de token

OpenClaw rechaza configuraciones ambiguas donde tanto `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`) como el modo `trusted-proxy` están activos al mismo tiempo. Las configuraciones mixtas de token pueden hacer que las solicitudes loopback se autentiquen silenciosamente por la ruta de autenticación equivocada.

Si ves un error `mixed_trusted_proxy_token` al iniciar:

- Elimina el token compartido cuando uses el modo trusted-proxy, o
- Cambia `gateway.auth.mode` a `"token"` si tu intención es usar autenticación basada en token.

La autenticación trusted-proxy en loopback también falla de forma cerrada: los llamadores en el mismo host deben proporcionar las cabeceras de identidad configuradas a través de un proxy de confianza en lugar de autenticarse silenciosamente.

## Cabecera de alcances de operator

La autenticación trusted-proxy es un modo HTTP **portador de identidad**, por lo que los llamadores pueden declarar opcionalmente alcances de operator con `x-openclaw-scopes`.

Ejemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamiento:

- Cuando la cabecera está presente, OpenClaw respeta el conjunto de alcances declarado.
- Cuando la cabecera está presente pero vacía, la solicitud declara **ningún** alcance de operator.
- Cuando la cabecera no está presente, las API HTTP normales portadoras de identidad recurren al conjunto de alcances predeterminado estándar de operator.
- Las **rutas HTTP de plugin** con autenticación de gateway son más limitadas por defecto: cuando `x-openclaw-scopes` no está presente, su alcance en tiempo de ejecución recurre a `operator.write`.
- Las solicitudes HTTP originadas en navegador todavía tienen que pasar `gateway.controlUi.allowedOrigins` (o el modo deliberado de respaldo de cabecera Host) incluso después de que la autenticación trusted-proxy tenga éxito.

Regla práctica: envía `x-openclaw-scopes` explícitamente cuando quieras que una solicitud trusted-proxy sea más limitada que los valores predeterminados, o cuando una ruta de plugin con autenticación de gateway necesite algo más fuerte que alcance de escritura.

## Lista de comprobación de seguridad

Antes de habilitar la autenticación trusted-proxy, verifica:

- [ ] **El proxy es la única ruta**: el puerto del Gateway está protegido por firewall frente a todo excepto tu proxy.
- [ ] **trustedProxies es mínimo**: solo las IP reales de tu proxy, no subredes completas.
- [ ] **Sin origen de proxy loopback**: la autenticación trusted-proxy falla de forma cerrada para solicitudes de origen loopback.
- [ ] **El proxy elimina cabeceras**: tu proxy sobrescribe (no anexa) las cabeceras `x-forwarded-*` de los clientes.
- [ ] **Terminación TLS**: tu proxy maneja TLS; los usuarios se conectan mediante HTTPS.
- [ ] **allowedOrigins es explícito**: la UI de control no loopback usa `gateway.controlUi.allowedOrigins` explícito.
- [ ] **allowUsers está configurado** (recomendado): restringe a usuarios conocidos en lugar de permitir a cualquier usuario autenticado.
- [ ] **Sin configuración mixta de token**: no establezcas a la vez `gateway.auth.token` y `gateway.auth.mode: "trusted-proxy"`.

## Auditoría de seguridad

`openclaw security audit` marcará la autenticación trusted-proxy con un hallazgo de severidad **critical**. Esto es intencional: es un recordatorio de que estás delegando la seguridad a la configuración de tu proxy.

La auditoría comprueba:

- Recordatorio base `gateway.trusted_proxy_auth` de advertencia/critical
- Falta de configuración de `trustedProxies`
- Falta de configuración de `userHeader`
- `allowUsers` vacío (permite a cualquier usuario autenticado)
- Política de origen del navegador comodín o ausente en superficies expuestas de la UI de control

## Solución de problemas

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La solicitud no vino de una IP de `gateway.trustedProxies`. Comprueba:

    - ¿Es correcta la IP del proxy? (Las IP de contenedores Docker pueden cambiar.)
    - ¿Hay un balanceador de carga delante de tu proxy?
    - Usa `docker inspect` o `kubectl get pods -o wide` para encontrar las IP reales.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw rechazó una solicitud trusted-proxy de origen loopback.

    Comprueba:

    - ¿Se está conectando el proxy desde `127.0.0.1` / `::1`?
    - ¿Estás intentando usar autenticación trusted-proxy con un proxy inverso loopback en el mismo host?

    Solución:

    - Usa autenticación por token/contraseña para configuraciones de proxy loopback en el mismo host, o
    - Enruta a través de una dirección de proxy de confianza no loopback y mantén esa IP en `gateway.trustedProxies`.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    La cabecera de usuario estaba vacía o faltaba. Comprueba:

    - ¿Tu proxy está configurado para pasar cabeceras de identidad?
    - ¿Es correcto el nombre de la cabecera? (no distingue mayúsculas/minúsculas, pero la ortografía importa)
    - ¿Está el usuario realmente autenticado en el proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    No estaba presente una cabecera obligatoria. Comprueba:

    - La configuración de tu proxy para esas cabeceras específicas.
    - Si las cabeceras se están eliminando en algún punto de la cadena.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    El usuario está autenticado pero no está en `allowUsers`. Agrégalo o elimina la lista de permitidos.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    La autenticación trusted-proxy tuvo éxito, pero la cabecera `Origin` del navegador no pasó las comprobaciones de origen de la UI de control.

    Comprueba:

    - `gateway.controlUi.allowedOrigins` incluye el origen exacto del navegador.
    - No estás confiando en orígenes comodín a menos que intencionalmente quieras un comportamiento de permitir todo.
    - Si intencionalmente usas el modo de respaldo de cabecera Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` está establecido deliberadamente.

  </Accordion>
  <Accordion title="WebSocket sigue fallando">
    Asegúrate de que tu proxy:

    - Admite actualizaciones WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Pasa las cabeceras de identidad en solicitudes de actualización WebSocket (no solo HTTP).
    - No tiene una ruta de autenticación separada para conexiones WebSocket.

  </Accordion>
</AccordionGroup>

## Migración desde autenticación por token

Si te estás moviendo de autenticación por token a trusted-proxy:

<Steps>
  <Step title="Configura el proxy">
    Configura tu proxy para autenticar usuarios y pasar cabeceras.
  </Step>
  <Step title="Prueba el proxy de forma independiente">
    Prueba la configuración del proxy de forma independiente (curl con cabeceras).
  </Step>
  <Step title="Actualiza la configuración de OpenClaw">
    Actualiza la configuración de OpenClaw con autenticación trusted-proxy.
  </Step>
  <Step title="Reinicia el Gateway">
    Reinicia el Gateway.
  </Step>
  <Step title="Prueba WebSocket">
    Prueba las conexiones WebSocket desde la UI de control.
  </Step>
  <Step title="Audita">
    Ejecuta `openclaw security audit` y revisa los hallazgos.
  </Step>
</Steps>

## Relacionado

- [Configuración](/es/gateway/configuration) — referencia de configuración
- [Acceso remoto](/es/gateway/remote) — otros patrones de acceso remoto
- [Seguridad](/es/gateway/security) — guía completa de seguridad
- [Tailscale](/es/gateway/tailscale) — alternativa más sencilla para acceso solo por tailnet
