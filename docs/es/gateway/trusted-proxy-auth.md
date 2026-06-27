---
read_when:
    - Ejecutar OpenClaw detrás de un proxy con reconocimiento de identidad
    - Configurar Pomerium, Caddy o nginx con OAuth delante de OpenClaw
    - Solucionar errores no autorizados WebSocket 1008 con configuraciones de proxy inverso
    - Decidir dónde configurar HSTS y otros encabezados de endurecimiento HTTP
sidebarTitle: Trusted proxy auth
summary: Delegar la autenticación del gateway a un proxy inverso de confianza (Pomerium, Caddy, nginx + OAuth)
title: Autenticación de proxy de confianza
x-i18n:
    generated_at: "2026-06-27T11:39:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Función sensible para la seguridad.** Este modo delega la autenticación por completo en tu proxy inverso. Una configuración incorrecta puede exponer tu Gateway a accesos no autorizados. Lee esta página con atención antes de habilitarlo.
</Warning>

## Cuándo usarlo

Usa el modo de autenticación `trusted-proxy` cuando:

- Ejecutas OpenClaw detrás de un **proxy con identidad integrada** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Tu proxy gestiona toda la autenticación y pasa la identidad del usuario mediante encabezados.
- Estás en un entorno Kubernetes o de contenedores donde el proxy es la única ruta hacia el Gateway.
- Te encuentras con errores WebSocket `1008 unauthorized` porque los navegadores no pueden pasar tokens en las cargas útiles de WS.

## Cuándo NO usarlo

- Si tu proxy no autentica usuarios (solo es un terminador TLS o balanceador de carga).
- Si existe alguna ruta hacia el Gateway que omite el proxy (huecos de firewall, acceso desde la red interna).
- Si no tienes certeza de que tu proxy elimine o sobrescriba correctamente los encabezados reenviados.
- Si solo necesitas acceso personal de un único usuario (considera Tailscale Serve + loopback para una configuración más sencilla).

## Cómo funciona

<Steps>
  <Step title="El proxy autentica al usuario">
    Tu proxy inverso autentica a los usuarios (OAuth, OIDC, SAML, etc.).
  </Step>
  <Step title="El proxy agrega un encabezado de identidad">
    El proxy agrega un encabezado con la identidad del usuario autenticado (por ejemplo, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="El Gateway verifica la fuente de confianza">
    OpenClaw comprueba que la solicitud provenga de una **IP de proxy de confianza** (configurada en `gateway.trustedProxies`).
  </Step>
  <Step title="El Gateway extrae la identidad">
    OpenClaw extrae la identidad del usuario del encabezado configurado.
  </Step>
  <Step title="Autorizar">
    Si todo se verifica correctamente, la solicitud queda autorizada.
  </Step>
</Steps>

## Comportamiento de emparejamiento de la Control UI

Cuando `gateway.auth.mode = "trusted-proxy"` está activo y la solicitud supera las comprobaciones de trusted-proxy, las sesiones WebSocket de la Control UI pueden conectarse sin identidad de emparejamiento de dispositivo.

Implicaciones de alcance:

- Las sesiones WebSocket de la Control UI sin dispositivo se conectan, pero no reciben alcances de operador de forma predeterminada. OpenClaw vacía la lista de alcances solicitados a `[]` para que una sesión que no está vinculada a un dispositivo/token emparejado aprobado no pueda autodeclarar permisos.
- Si los métodos fallan con `missing scope` después de una conexión WebSocket correcta, usa HTTPS para que el navegador pueda generar identidad de dispositivo y completar el emparejamiento. Consulta [HTTP inseguro de la Control UI](/es/web/control-ui#insecure-http).
- Solo para emergencia: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` conserva los alcances solicitados incluso sin identidad de dispositivo. Esto supone una degradación grave de la seguridad; revierte el cambio rápidamente. Consulta [HTTP inseguro de la Control UI](/es/web/control-ui#insecure-http).

Limitación de alcances mediante proxy inverso:

- Si tu proxy envía `x-openclaw-scopes` en la solicitud de actualización WebSocket de la Control UI, OpenClaw limita los alcances de la sesión a la intersección entre los alcances solicitados y los declarados. Este encabezado no concede alcances; solo reduce lo que la sesión puede conservar.

Implicaciones:

- El emparejamiento ya no es la puerta principal para acceder a la Control UI en este modo.
- La política de autenticación de tu proxy inverso y `allowUsers` se convierten en el control de acceso efectivo.
- Mantén el ingreso del Gateway restringido solo a las IP de proxy de confianza (`gateway.trustedProxies` + firewall).

Los clientes WebSocket personalizados no son sesiones de la Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` no concede alcances a clientes arbitrarios con `client.mode: "backend"` o con forma de CLI. La automatización personalizada debe usar identidad/emparejamiento de dispositivo, la ruta auxiliar backend directa-local reservada `client.id: "gateway-client"` o el [Plugin HTTP RPC de administración](/es/plugins/admin-http-rpc) cuando una superficie HTTP de solicitud/respuesta encaje mejor.

## Configuración

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Reglas importantes en tiempo de ejecución**

- La autenticación trusted-proxy rechaza de forma predeterminada las solicitudes cuyo origen sea loopback (`127.0.0.1`, `::1`, CIDR de loopback).
- Los proxies inversos loopback del mismo host **no** satisfacen la autenticación trusted-proxy salvo que establezcas explícitamente `gateway.auth.trustedProxy.allowLoopback = true` e incluyas la dirección de loopback en `gateway.trustedProxies`.
- `allowLoopback` confía en los procesos locales del host del Gateway en el mismo grado que en el proxy inverso. Habilítalo solo cuando el Gateway siga aislado por firewall frente al acceso remoto directo y el proxy local elimine o sobrescriba los encabezados de identidad suministrados por el cliente.
- Los clientes internos del Gateway que no pasan por el proxy inverso deben usar `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, no encabezados de identidad trusted-proxy.
- Los despliegues no loopback de la Control UI siguen necesitando `gateway.controlUi.allowedOrigins` explícito.
- **La evidencia de encabezados reenviados prevalece sobre la localidad loopback para la alternativa directa local.** Si una solicitud llega por loopback pero contiene evidencia en encabezados `Forwarded`, cualquier `X-Forwarded-*` o `X-Real-IP`, esa evidencia descalifica la alternativa de contraseña directa local y la compuerta de identidad de dispositivo. Con `allowLoopback: true`, la autenticación trusted-proxy aún puede aceptar la solicitud como una solicitud de proxy del mismo host, mientras `requiredHeaders` y `allowUsers` siguen aplicándose.

</Warning>

### Referencia de configuración

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Arreglo de direcciones IP de proxy en las que confiar. Las solicitudes desde otras IP se rechazan.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Debe ser `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nombre del encabezado que contiene la identidad del usuario autenticado.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Encabezados adicionales que deben estar presentes para que la solicitud sea de confianza.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Lista de permitidos de identidades de usuario. Vacío significa permitir todos los usuarios autenticados.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Compatibilidad opcional para proxies inversos loopback del mismo host. El valor predeterminado es `false`.
</ParamField>

<Warning>
Habilita `allowLoopback` solo cuando el proxy inverso local sea el límite de confianza previsto. Cualquier proceso local que pueda conectarse al Gateway puede intentar enviar encabezados de identidad de proxy, así que mantén el acceso directo al Gateway privado para el host y exige encabezados propiedad del proxy, como `x-forwarded-proto`, o un encabezado de aserción firmado cuando tu proxy lo admita.
</Warning>

## Terminación TLS y HSTS

Usa un único punto de terminación TLS y aplica HSTS allí.

<Tabs>
  <Tab title="Terminación TLS en el proxy (recomendada)">
    Cuando tu proxy inverso gestiona HTTPS para `https://control.example.com`, establece `Strict-Transport-Security` en el proxy para ese dominio.

    - Buena opción para despliegues expuestos a internet.
    - Mantiene la política de certificados y refuerzo HTTP en un solo lugar.
    - OpenClaw puede permanecer en HTTP loopback detrás del proxy.

    Valor de encabezado de ejemplo:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminación TLS en el Gateway">
    Si OpenClaw sirve HTTPS directamente por sí mismo (sin proxy que termine TLS), establece:

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

    `strictTransportSecurity` acepta un valor de encabezado de cadena, o `false` para deshabilitarlo explícitamente.

  </Tab>
</Tabs>

### Guía de despliegue gradual

- Empieza primero con una edad máxima corta (por ejemplo, `max-age=300`) mientras validas el tráfico.
- Aumenta a valores de larga duración (por ejemplo, `max-age=31536000`) solo cuando la confianza sea alta.
- Agrega `includeSubDomains` solo si todos los subdominios están preparados para HTTPS.
- Usa preload solo si cumples intencionalmente los requisitos de preload para todo tu conjunto de dominios.
- El desarrollo local solo con loopback no se beneficia de HSTS.

## Ejemplos de configuración de proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium pasa la identidad en `x-pomerium-claim-email` (u otros encabezados de reclamación) y un JWT en `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
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
    Caddy con el Plugin `caddy-security` puede autenticar usuarios y pasar encabezados de identidad.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
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
    oauth2-proxy autentica usuarios y pasa la identidad en `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
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
        trustedProxies: ["172.17.0.1"], // Traefik container IP
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

## Configuración mixta de tokens

OpenClaw rechaza configuraciones ambiguas en las que tanto un `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`) como el modo `trusted-proxy` están activos al mismo tiempo. Las configuraciones mixtas de tokens pueden hacer que las solicitudes loopback se autentiquen silenciosamente en la ruta de autenticación equivocada.

Si ves un error `mixed_trusted_proxy_token` al iniciar:

- Elimina el token compartido cuando uses el modo trusted-proxy, o
- Cambia `gateway.auth.mode` a `"token"` si quieres autenticación basada en tokens.

Los encabezados de identidad de proxy de confianza de loopback siguen fallando de forma cerrada: los llamadores del mismo host no se autentican silenciosamente como usuarios del proxy. Los llamadores internos de OpenClaw que omiten el proxy pueden autenticarse con `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` en su lugar. La alternativa con token sigue sin estar admitida intencionalmente en modo trusted-proxy.

## Encabezado de ámbitos de operador

La autenticación trusted-proxy es un modo HTTP **portador de identidad**, por lo que los llamadores pueden declarar opcionalmente ámbitos de operador con `x-openclaw-scopes` en solicitudes de API HTTP.

Nota: los ámbitos de WebSocket se determinan mediante el handshake del protocolo Gateway y la vinculación de identidad del dispositivo. En las solicitudes de actualización de WebSocket de Control UI, `x-openclaw-scopes` es solo un límite para los ámbitos de sesión negociados, no una concesión. Para el comportamiento de ámbitos de WebSocket con trusted-proxy, consulta [Comportamiento de emparejamiento de Control UI](#control-ui-pairing-behavior).

Ejemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamiento:

- Cuando el encabezado está presente, OpenClaw respeta el conjunto de ámbitos declarado.
- Cuando el encabezado está presente pero vacío, la solicitud declara **ningún** ámbito de operador.
- Cuando el encabezado está ausente, las API HTTP normales portadoras de identidad recurren al conjunto estándar predeterminado de ámbitos de operador.
- Las **rutas HTTP de Plugin** con autenticación Gateway son más restringidas de forma predeterminada: cuando `x-openclaw-scopes` está ausente, su ámbito en tiempo de ejecución recurre a `operator.write`.
- Las solicitudes HTTP de origen de navegador aún deben pasar `gateway.controlUi.allowedOrigins` (o el modo deliberado de alternativa con encabezado Host) incluso después de que la autenticación trusted-proxy se complete correctamente.
- Para las sesiones WebSocket de Control UI, `x-openclaw-scopes` es un límite de ámbito cuando está presente en la solicitud de actualización. Un valor vacío produce cero ámbitos.

Regla práctica: envía `x-openclaw-scopes` explícitamente cuando quieras que una solicitud trusted-proxy sea más restringida que los valores predeterminados, o cuando una ruta de Plugin con autenticación Gateway necesite algo más fuerte que el ámbito de escritura.

## Lista de verificación de seguridad

Antes de activar la autenticación trusted-proxy, verifica:

- [ ] **El proxy es la única ruta**: el puerto del Gateway está protegido por firewall contra todo excepto tu proxy.
- [ ] **trustedProxies es mínimo**: solo las IP reales de tu proxy, no subredes enteras.
- [ ] **El origen del proxy de loopback es deliberado**: la autenticación trusted-proxy falla de forma cerrada para solicitudes con origen de loopback, a menos que `gateway.auth.trustedProxy.allowLoopback` esté activado explícitamente para un proxy del mismo host.
- [ ] **El proxy elimina encabezados**: tu proxy sobrescribe (no añade) los encabezados `x-forwarded-*` de los clientes.
- [ ] **Terminación TLS**: tu proxy gestiona TLS; los usuarios se conectan mediante HTTPS.
- [ ] **allowedOrigins es explícito**: Control UI sin loopback usa `gateway.controlUi.allowedOrigins` explícito.
- [ ] **allowUsers está configurado** (recomendado): restringe a usuarios conocidos en lugar de permitir a cualquiera que esté autenticado.
- [ ] **Sin configuración mixta de tokens**: no configures tanto `gateway.auth.token` como `gateway.auth.mode: "trusted-proxy"`.
- [ ] **La alternativa de contraseña local es privada**: si configuras `gateway.auth.password` para llamadores directos internos, mantén el puerto del Gateway protegido por firewall para que los clientes remotos que no pasen por el proxy no puedan alcanzarlo directamente.

## Auditoría de seguridad

`openclaw security audit` marcará la autenticación trusted-proxy con un hallazgo de severidad **crítica**. Esto es intencional: es un recordatorio de que estás delegando la seguridad a la configuración de tu proxy.

La auditoría comprueba:

- Advertencia/recordatorio crítico base `gateway.trusted_proxy_auth`
- Falta de configuración `trustedProxies`
- Falta de configuración `userHeader`
- `allowUsers` vacío (permite cualquier usuario autenticado)
- `allowLoopback` activado para orígenes de proxy del mismo host
- Política de origen de navegador comodín o ausente en superficies expuestas de Control UI

## Solución de problemas

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La solicitud no provino de una IP en `gateway.trustedProxies`. Comprueba:

    - ¿La IP del proxy es correcta? (Las IP de contenedores Docker pueden cambiar).
    - ¿Hay un balanceador de carga delante de tu proxy?
    - Usa `docker inspect` o `kubectl get pods -o wide` para encontrar las IP reales.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw rechazó una solicitud trusted-proxy con origen de loopback.

    Comprueba:

    - ¿El proxy se conecta desde `127.0.0.1` / `::1`?
    - ¿Estás intentando usar autenticación trusted-proxy con un proxy inverso de loopback en el mismo host?

    Corrección:

    - Prefiere autenticación con token/contraseña para clientes internos del mismo host que no pasan por el proxy, o
    - Enruta mediante una dirección de proxy de confianza que no sea loopback y mantén esa IP en `gateway.trustedProxies`, o
    - Para un proxy inverso deliberado en el mismo host, establece `gateway.auth.trustedProxy.allowLoopback = true`, mantén la dirección de loopback en `gateway.trustedProxies` y asegúrate de que el proxy elimine o sobrescriba los encabezados de identidad.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    El encabezado de usuario estaba vacío o faltaba. Comprueba:

    - ¿Tu proxy está configurado para pasar encabezados de identidad?
    - ¿El nombre del encabezado es correcto? (no distingue mayúsculas y minúsculas, pero la ortografía importa)
    - ¿El usuario está realmente autenticado en el proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    No había un encabezado obligatorio. Comprueba:

    - La configuración de tu proxy para esos encabezados específicos.
    - Si los encabezados se están eliminando en algún punto de la cadena.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    El usuario está autenticado, pero no está en `allowUsers`. Añádelo o elimina la lista de permitidos.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    La autenticación trusted-proxy se completó correctamente, pero el encabezado `Origin` del navegador no pasó las comprobaciones de origen de Control UI.

    Comprueba:

    - `gateway.controlUi.allowedOrigins` incluye el origen exacto del navegador.
    - No dependes de orígenes comodín a menos que quieras intencionalmente un comportamiento de permitir todo.
    - Si usas intencionalmente el modo de alternativa con encabezado Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` está establecido deliberadamente.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    El WebSocket se conecta, pero `chat.history`, `sessions.list` o
    `models.list` falla con `missing scope: operator.read`.

    Causas comunes:

    - Sesión de Control UI sin dispositivo: la autenticación trusted-proxy puede admitir la conexión WebSocket sin identidad de dispositivo, pero OpenClaw borra los ámbitos en sesiones sin dispositivo por diseño.
    - Cliente backend personalizado: `gateway.controlUi.dangerouslyDisableDeviceAuth` tiene ámbito de Control UI y no concede ámbitos a clientes WebSocket arbitrarios con forma de backend o CLI.
    - `x-openclaw-scopes` demasiado restringido: si tu proxy inyecta este encabezado en la solicitud de actualización de WebSocket de Control UI, los ámbitos de sesión quedan limitados a ese conjunto. Un valor de encabezado vacío produce cero ámbitos.

    Corrección:

    - Para Control UI, usa HTTPS para que el navegador pueda generar identidad de dispositivo y completar el emparejamiento.
    - Para automatización personalizada, usa identidad/emparejamiento de dispositivo, la ruta auxiliar backend reservada directa local `gateway-client` o [RPC HTTP de administración](/es/plugins/admin-http-rpc).
    - Usa `gateway.controlUi.dangerouslyDisableDeviceAuth: true` solo como una vía temporal de emergencia para Control UI.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Asegúrate de que tu proxy:

    - Admita actualizaciones de WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Pase los encabezados de identidad en solicitudes de actualización de WebSocket (no solo HTTP).
    - No tenga una ruta de autenticación separada para conexiones WebSocket.

  </Accordion>
</AccordionGroup>

## Migración desde autenticación con token

Si vas a cambiar de autenticación con token a trusted-proxy:

<Steps>
  <Step title="Configure the proxy">
    Configura tu proxy para autenticar usuarios y pasar encabezados.
  </Step>
  <Step title="Test the proxy independently">
    Prueba la configuración del proxy de forma independiente (curl con encabezados).
  </Step>
  <Step title="Update OpenClaw config">
    Actualiza la configuración de OpenClaw con autenticación trusted-proxy.
  </Step>
  <Step title="Restart the Gateway">
    Reinicia el Gateway.
  </Step>
  <Step title="Test WebSocket">
    Prueba las conexiones WebSocket desde Control UI.
  </Step>
  <Step title="Audit">
    Ejecuta `openclaw security audit` y revisa los hallazgos.
  </Step>
</Steps>

## Relacionado

- [Configuración](/es/gateway/configuration) — referencia de configuración
- [Acceso remoto](/es/gateway/remote) — otros patrones de acceso remoto
- [Seguridad](/es/gateway/security) — guía completa de seguridad
- [Tailscale](/es/gateway/tailscale) — alternativa más sencilla para acceso solo por tailnet
