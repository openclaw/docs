---
read_when:
    - Ejecutar OpenClaw detrás de un proxy consciente de la identidad
    - Configurar Pomerium, Caddy o nginx con OAuth delante de OpenClaw
    - Solución de errores WebSocket 1008 no autorizados con configuraciones de proxy inverso
    - Decidir dónde configurar HSTS y otros encabezados de protección HTTP
sidebarTitle: Trusted proxy auth
summary: Delegar la autenticación del gateway a un proxy inverso de confianza (Pomerium, Caddy, nginx + OAuth)
title: Autenticación de proxy de confianza
x-i18n:
    generated_at: "2026-07-05T11:23:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Función sensible para la seguridad.** Este modo delega la autenticación por completo en tu proxy inverso. Una configuración incorrecta puede exponer tu Gateway a accesos no autorizados. Lee esta página detenidamente antes de habilitarlo.
</Warning>

## Cuándo usarlo

- Ejecutas OpenClaw detrás de un **proxy con reconocimiento de identidad** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Tu proxy gestiona toda la autenticación y pasa la identidad del usuario mediante encabezados.
- Estás en un entorno de Kubernetes o contenedores donde el proxy es la única ruta hacia el Gateway.
- Te encuentras con errores WebSocket `1008 unauthorized` porque los navegadores no pueden pasar tokens en cargas útiles de WS.

## Cuándo NO usarlo

- Tu proxy no autentica usuarios (solo es un terminador TLS o balanceador de carga).
- Hay alguna ruta hacia el Gateway que evita el proxy (huecos de firewall, acceso de red interno).
- No tienes certeza de que tu proxy elimine o sobrescriba correctamente los encabezados reenviados.
- Solo necesitas acceso personal de un único usuario (considera Tailscale Serve + loopback en su lugar).

## Cómo funciona

<Steps>
  <Step title="Proxy authenticates the user">
    Tu proxy inverso autentica a los usuarios (OAuth, OIDC, SAML, etc.).
  </Step>
  <Step title="Proxy adds an identity header">
    El proxy agrega un encabezado con la identidad del usuario autenticado (por ejemplo, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw comprueba que la solicitud provenga de una **IP de proxy de confianza** (`gateway.trustedProxies`) y que no sea la propia dirección de loopback o de interfaz local del Gateway.
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw lee los encabezados requeridos y luego la identidad de usuario desde el encabezado configurado.
  </Step>
  <Step title="Authorize">
    Si todo se valida correctamente y el usuario pasa `allowUsers` (cuando está configurado), se autoriza la solicitud.
  </Step>
</Steps>

## Configuración

```json5
{
  gateway: {
    // Trusted-proxy auth expects the proxy's source IP to be non-loopback by default
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
**Reglas de ejecución, en orden de evaluación**

1. La IP de origen de la solicitud debe coincidir con `gateway.trustedProxies` (con reconocimiento de CIDR), o se rechaza (`trusted_proxy_untrusted_source`).
2. Las solicitudes con origen de loopback (`127.0.0.1`, `::1`) se rechazan salvo que `gateway.auth.trustedProxy.allowLoopback = true` y la dirección de loopback también esté en `trustedProxies` (`trusted_proxy_loopback_source`). Esta comprobación se ejecuta antes de las comprobaciones de encabezados, por lo que un origen de loopback falla de esta manera aunque también falten encabezados requeridos.
3. Los orígenes que no son de loopback y coinciden con una de las direcciones de interfaz de red local propias del host del Gateway se rechazan como protección contra suplantación (`trusted_proxy_local_interface_source`). Si falla el descubrimiento de interfaces, la solicitud también se rechaza (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` y `userHeader` deben estar presentes y no estar en blanco.
5. `allowUsers`, si no está vacío, debe incluir al usuario extraído.

**La evidencia de encabezados reenviados anula la localidad de loopback para el respaldo local directo.** Si una solicitud llega por loopback pero contiene un encabezado `Forwarded`, cualquier encabezado `X-Forwarded-*` o `X-Real-IP`, esa evidencia la descalifica del respaldo local directo con contraseña y del control por identidad de dispositivo, aunque todavía falle la autenticación de proxy de confianza por ser loopback.

`allowLoopback` confía en los procesos locales del host del Gateway en el mismo grado que en el proxy inverso. Habilítalo solo cuando el Gateway siga protegido por firewall contra acceso remoto directo y el proxy local elimine o sobrescriba los encabezados de identidad proporcionados por clientes.

Los clientes internos del Gateway que no pasen por el proxy inverso deben usar `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, no encabezados de identidad de proxy de confianza. Los despliegues de Control UI que no sean de loopback aún necesitan `gateway.controlUi.allowedOrigins` explícito.
</Warning>

### Referencia de configuración

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Arreglo de direcciones IP de proxy (o CIDR) en las que confiar. Las solicitudes de otras IP se rechazan.
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
  Lista de permitidos de identidades de usuario. Vacía significa permitir todos los usuarios autenticados.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Soporte opcional para proxies inversos de loopback en el mismo host.
</ParamField>

<Warning>
Habilita `allowLoopback` solo cuando el proxy inverso local sea el límite de confianza previsto. Cualquier proceso local que pueda conectarse al Gateway puede intentar enviar encabezados de identidad de proxy, así que mantén el acceso directo al Gateway privado para el host y exige encabezados propiedad del proxy, como `x-forwarded-proto`, o un encabezado de afirmación firmado cuando tu proxy admita uno.
</Warning>

## Comportamiento de emparejamiento de Control UI

Cuando `gateway.auth.mode = "trusted-proxy"` está activo y la solicitud supera las comprobaciones de proxy de confianza, las sesiones WebSocket de Control UI pueden conectarse sin identidad de emparejamiento de dispositivo.

Implicaciones de alcance:

- Las sesiones WebSocket de Control UI sin dispositivo se conectan, pero no reciben alcances de operador de forma predeterminada. OpenClaw borra la lista de alcances solicitados a `[]` para que una sesión no vinculada a un dispositivo/token emparejado aprobado no pueda autodeclarar permisos.
- Si los métodos fallan con `missing scope` después de una conexión WebSocket correcta, usa HTTPS para que el navegador pueda generar identidad de dispositivo y completar el emparejamiento. Consulta [HTTP inseguro de Control UI](/es/web/control-ui#insecure-http).
- Solo para emergencia: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` conserva los alcances solicitados incluso sin identidad de dispositivo. Esto es una degradación de seguridad grave; reviértelo rápidamente. Consulta [HTTP inseguro de Control UI](/es/web/control-ui#insecure-http).

Limitación de alcances por proxy inverso: si tu proxy envía `x-openclaw-scopes` en la solicitud de actualización WebSocket de Control UI, OpenClaw limita los alcances de la sesión a la intersección de los alcances solicitados y los alcances declarados. Este encabezado no concede alcances; solo restringe lo que la sesión puede tener.

Implicaciones:

- El emparejamiento ya no es la puerta principal para el acceso a Control UI en este modo.
- La política de autenticación de tu proxy inverso y `allowUsers` se convierten en el control de acceso efectivo.
- Mantén la entrada al Gateway bloqueada solo para IP de proxy de confianza (`gateway.trustedProxies` + firewall).

Los clientes WebSocket personalizados no son sesiones de Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` no concede alcances a clientes arbitrarios con `client.mode: "backend"` o con forma de CLI. La automatización personalizada debe usar identidad/emparejamiento de dispositivo, la ruta auxiliar backend local directa reservada `client.id: "gateway-client"` o el [Plugin admin HTTP RPC](/es/plugins/admin-http-rpc) cuando una superficie HTTP de solicitud/respuesta encaje mejor.

## Encabezado de alcances de operador

La autenticación de proxy de confianza es un modo HTTP **portador de identidad**, por lo que los llamadores pueden declarar opcionalmente alcances de operador con `x-openclaw-scopes` en solicitudes de API HTTP.

Nota: los alcances de WebSocket se determinan mediante el handshake del protocolo del Gateway y la vinculación de identidad de dispositivo. En solicitudes de actualización WebSocket de Control UI, `x-openclaw-scopes` solo es un límite sobre los alcances de sesión negociados, no una concesión. Consulta [Comportamiento de emparejamiento de Control UI](#control-ui-pairing-behavior).

Ejemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamiento:

- Cuando el encabezado está presente, OpenClaw respeta el conjunto de alcances declarado.
- Cuando el encabezado está presente pero vacío, la solicitud declara **ningún** alcance de operador.
- Cuando el encabezado está ausente, las API HTTP normales portadoras de identidad recurren al conjunto de alcances de operador predeterminado estándar (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Las **rutas HTTP de Plugin** con autenticación de Gateway son más restringidas de forma predeterminada: cuando `x-openclaw-scopes` está ausente, su alcance de ejecución recurre solo a `operator.write`.
- Las solicitudes HTTP con origen de navegador aún tienen que pasar `gateway.controlUi.allowedOrigins` (o el modo deliberado de respaldo por encabezado Host) incluso después de que la autenticación de proxy de confianza tenga éxito.

Regla práctica: envía `x-openclaw-scopes` explícitamente cuando quieras que una solicitud de proxy de confianza sea más restringida que los valores predeterminados, o cuando una ruta de Plugin con autenticación de Gateway necesite algo más fuerte que el alcance de escritura.

## Terminación TLS y HSTS

Usa un solo punto de terminación TLS y aplica HSTS allí.

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    Cuando tu proxy inverso gestiona HTTPS para `https://control.example.com`, configura `Strict-Transport-Security` en el proxy para ese dominio.

    - Buena opción para despliegues expuestos a Internet.
    - Mantiene la política de certificados y endurecimiento HTTP en un solo lugar.
    - OpenClaw puede permanecer en HTTP de loopback detrás del proxy.

    Valor de encabezado de ejemplo:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    Si OpenClaw sirve HTTPS directamente por sí mismo (sin proxy que termine TLS), configura:

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

- Empieza primero con una duración máxima corta (por ejemplo, `max-age=300`) mientras validas el tráfico.
- Aumenta a valores de larga duración (por ejemplo, `max-age=31536000`) solo después de tener alta confianza.
- Agrega `includeSubDomains` solo si todos los subdominios están listos para HTTPS.
- Usa preload solo si cumples intencionadamente los requisitos de preload para todo tu conjunto de dominios.
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
  <Accordion title="Caddy with OAuth">
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

    ```caddy
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
  <Accordion title="Traefik con autenticación reenviada">
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

El arranque del Gateway rechaza la autenticación trusted-proxy si también se configura un token compartido (`gateway.auth.token` u `OPENCLAW_GATEWAY_TOKEN`). Ambos son mutuamente excluyentes porque un token compartido permitiría que los llamadores del mismo host se autentiquen por una ruta completamente distinta de la identidad verificada por el proxy que este modo pretende imponer.

Si el arranque falla con un error como `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Elimina el token compartido al usar el modo trusted-proxy, o
- Cambia `gateway.auth.mode` a `"token"` si quieres usar autenticación basada en token.

Los encabezados de identidad trusted-proxy desde loopback siguen fallando en modo cerrado: los llamadores del mismo host no se autentican silenciosamente como usuarios del proxy. Los llamadores internos de OpenClaw que omiten el proxy pueden autenticarse con `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` en su lugar. La alternativa de token sigue sin estar admitida intencionalmente en modo trusted-proxy.

## Lista de verificación de seguridad

Antes de habilitar la autenticación trusted-proxy, verifica:

- [ ] **El proxy es la única ruta**: el puerto del Gateway está protegido por firewall frente a todo salvo tu proxy.
- [ ] **trustedProxies es mínimo**: solo las IP reales de tu proxy, no subredes completas.
- [ ] **El origen de proxy desde loopback es deliberado**: la autenticación trusted-proxy falla en modo cerrado para solicitudes con origen de loopback a menos que `gateway.auth.trustedProxy.allowLoopback` esté habilitado explícitamente para un proxy en el mismo host.
- [ ] **El proxy elimina encabezados**: tu proxy sobrescribe (no agrega) los encabezados `x-forwarded-*` de los clientes.
- [ ] **Terminación TLS**: tu proxy gestiona TLS; los usuarios se conectan mediante HTTPS.
- [ ] **allowedOrigins es explícito**: Control UI fuera de loopback usa `gateway.controlUi.allowedOrigins` explícito.
- [ ] **allowUsers está definido** (recomendado): restringe el acceso a usuarios conocidos en lugar de permitir a cualquiera que esté autenticado.
- [ ] **Sin configuración mixta de tokens**: no definas tanto `gateway.auth.token` como `gateway.auth.mode: "trusted-proxy"`.
- [ ] **La alternativa de contraseña local es privada**: si configuras `gateway.auth.password` para llamadores internos directos, mantén el puerto del Gateway protegido por firewall para que los clientes remotos que no pasan por el proxy no puedan alcanzarlo directamente.

## Auditoría de seguridad

`openclaw security audit` marca la autenticación trusted-proxy con un hallazgo de gravedad **crítica**. Esto es intencional; es un recordatorio de que estás delegando la seguridad a la configuración de tu proxy.

La auditoría comprueba:

- Advertencia/recordatorio crítico base `gateway.trusted_proxy_auth`.
- Falta de configuración de `trustedProxies`.
- Falta de configuración de `userHeader`.
- `allowUsers` vacío (permite cualquier usuario autenticado).
- `allowLoopback` habilitado para orígenes de proxy en el mismo host.

También se aplican hallazgos separados, no específicos de trusted-proxy, siempre que Control UI esté expuesto: `gateway.controlUi.allowedOrigins` comodín o ausente, y alternativa de origen mediante encabezado Host.

## Solución de problemas

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La solicitud no provino de una IP en `gateway.trustedProxies`. Comprueba:

    - ¿La IP del proxy es correcta? (Las IP de contenedores Docker pueden cambiar.)
    - ¿Hay un balanceador de carga delante de tu proxy?
    - Usa `docker inspect` o `kubectl get pods -o wide` para encontrar las IP reales.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw rechazó una solicitud trusted-proxy con origen de loopback.

    Comprueba:

    - ¿El proxy se conecta desde `127.0.0.1` / `::1`?
    - ¿Intentas usar autenticación trusted-proxy con un proxy inverso de loopback en el mismo host?

    Corrección:

    - Prefiere autenticación por token/contraseña para clientes internos del mismo host que no pasan por el proxy, o
    - Enruta a través de una dirección de proxy confiable que no sea loopback y conserva esa IP en `gateway.trustedProxies`, o
    - Para un proxy inverso deliberado en el mismo host, define `gateway.auth.trustedProxy.allowLoopback = true`, conserva la dirección de loopback en `gateway.trustedProxies` y asegúrate de que el proxy elimine o sobrescriba los encabezados de identidad.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    La IP de origen de la solicitud coincidió con una de las direcciones de interfaz de red no loopback propias del host del Gateway (no el proxy), una protección contra tráfico falsificado del mismo host en tailnets o redes puente de Docker. `..._check_failed` significa que el propio descubrimiento de interfaces produjo un error, por lo que OpenClaw falla en modo cerrado.

    Comprueba:

    - ¿Un proceso en el propio host del Gateway envía encabezados de identidad directamente, omitiendo el proxy?
    - ¿El proxy se ejecuta en el mismo espacio de nombres de red que el Gateway, con una IP que también aparece como interfaz local?

    Corrección: enruta el tráfico del proxy a través de una dirección que tampoco esté enlazada localmente por el host del Gateway, o usa `allowLoopback` solo para una configuración genuina de proxy en el mismo host.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    El encabezado de usuario estaba vacío o faltaba. Comprueba:

    - ¿Tu proxy está configurado para pasar encabezados de identidad?
    - ¿El nombre del encabezado es correcto? (no distingue mayúsculas y minúsculas, pero la ortografía importa)
    - ¿El usuario está realmente autenticado en el proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    No había un encabezado requerido. Comprueba:

    - La configuración de tu proxy para esos encabezados específicos.
    - Si los encabezados se están eliminando en algún punto de la cadena.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    El usuario está autenticado, pero no está en `allowUsers`. Agrégalo o elimina la lista de permitidos.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` es `"trusted-proxy"`, pero `gateway.trustedProxies` está vacío, o falta el propio `gateway.auth.trustedProxy`. Todas las solicitudes se rechazan hasta que ambos estén configurados.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    La autenticación trusted-proxy se realizó correctamente, pero el encabezado `Origin` del navegador no pasó las comprobaciones de origen de Control UI.

    Comprueba:

    - `gateway.controlUi.allowedOrigins` incluye el origen exacto del navegador.
    - No dependes de orígenes comodín a menos que quieras intencionalmente un comportamiento de permitir todo.
    - Si usas intencionalmente el modo de alternativa mediante encabezado Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` está definido deliberadamente.

  </Accordion>
  <Accordion title="La conexión se realiza correctamente, pero los métodos informan que falta el ámbito">
    El WebSocket se conecta, pero `chat.history`, `sessions.list` o
    `models.list` falla con `missing scope: operator.read`.

    Causas comunes:

    - Sesión de Control UI sin dispositivo: la autenticación trusted-proxy puede admitir la conexión WebSocket sin identidad de dispositivo, pero OpenClaw elimina los ámbitos en las sesiones sin dispositivo por diseño.
    - Cliente backend personalizado: `gateway.controlUi.dangerouslyDisableDeviceAuth` está limitado a Control UI y no concede ámbitos a clientes WebSocket arbitrarios con forma de backend o CLI.
    - `x-openclaw-scopes` demasiado restringido: si tu proxy inyecta este encabezado en la solicitud de upgrade WebSocket de Control UI, los ámbitos de la sesión quedan limitados a ese conjunto. Un valor de encabezado vacío produce cero ámbitos.

    Corrección:

    - Para Control UI, usa HTTPS para que el navegador pueda generar la identidad de dispositivo y completar el emparejamiento.
    - Para automatización personalizada, usa identidad/emparejamiento de dispositivo, la ruta auxiliar backend reservada directa-local `gateway-client` o [RPC HTTP de administración](/es/plugins/admin-http-rpc).
    - Usa `gateway.controlUi.dangerouslyDisableDeviceAuth: true` solo como una ruta temporal de emergencia para Control UI.

  </Accordion>
  <Accordion title="WebSocket sigue fallando">
    Asegúrate de que tu proxy:

    - Admita upgrades de WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Pase los encabezados de identidad en solicitudes de upgrade WebSocket (no solo HTTP).
    - No tenga una ruta de autenticación separada para conexiones WebSocket.

  </Accordion>
</AccordionGroup>

## Migración desde autenticación por token

<Steps>
  <Step title="Configurar el proxy">
    Configura tu proxy para autenticar usuarios y pasar encabezados.
  </Step>
  <Step title="Probar el proxy de forma independiente">
    Prueba la configuración del proxy de forma independiente (curl con encabezados).
  </Step>
  <Step title="Actualizar la configuración de OpenClaw">
    Actualiza la configuración de OpenClaw con autenticación trusted-proxy.
  </Step>
  <Step title="Reiniciar el Gateway">
    Reinicia el Gateway.
  </Step>
  <Step title="Probar WebSocket">
    Prueba las conexiones WebSocket desde Control UI.
  </Step>
  <Step title="Auditar">
    Ejecuta `openclaw security audit` y revisa los hallazgos.
  </Step>
</Steps>

## Relacionado

- [Configuración](/es/gateway/configuration) — referencia de configuración
- [Ámbitos de operador](/es/gateway/operator-scopes) — roles, ámbitos y comprobaciones de aprobación
- [Acceso remoto](/es/gateway/remote) — otros patrones de acceso remoto
- [Seguridad](/es/gateway/security) — guía de seguridad completa
- [Tailscale](/es/gateway/tailscale) — alternativa más simple para acceso solo por tailnet
