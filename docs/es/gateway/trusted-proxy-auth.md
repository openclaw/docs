---
read_when:
    - Ejecución de OpenClaw detrás de un proxy con reconocimiento de identidad
    - Configurar Pomerium, Caddy o nginx con OAuth delante de OpenClaw
    - Solución de errores WebSocket 1008 de acceso no autorizado en configuraciones con proxy inverso
    - Decidir dónde configurar HSTS y otras cabeceras de refuerzo de seguridad HTTP
sidebarTitle: Trusted proxy auth
summary: Delega la autenticación del Gateway a un proxy inverso de confianza (Pomerium, Caddy, nginx + OAuth)
title: Autenticación mediante proxy de confianza
x-i18n:
    generated_at: "2026-07-11T23:10:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Función sensible para la seguridad.** Este modo delega por completo la autenticación en el proxy inverso. Una configuración incorrecta puede exponer el Gateway a accesos no autorizados. Lea esta página detenidamente antes de habilitarlo.
</Warning>

## Cuándo usarlo

- Ejecuta OpenClaw detrás de un **proxy con reconocimiento de identidad** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + autenticación reenviada).
- Su proxy gestiona toda la autenticación y transmite la identidad del usuario mediante encabezados.
- Se encuentra en un entorno de Kubernetes o contenedores donde el proxy es la única ruta al Gateway.
- Recibe errores de WebSocket `1008 unauthorized` porque los navegadores no pueden enviar tokens en las cargas útiles de WS.

## Cuándo NO usarlo

- Su proxy no autentica a los usuarios (solo actúa como terminador TLS o balanceador de carga).
- Existe alguna ruta al Gateway que evita el proxy (brechas en el cortafuegos, acceso desde la red interna).
- No está seguro de que su proxy elimine o sobrescriba correctamente los encabezados reenviados.
- Solo necesita acceso personal para un único usuario (considere Tailscale Serve + local loopback en su lugar).

## Cómo funciona

<Steps>
  <Step title="El proxy autentica al usuario">
    Su proxy inverso autentica a los usuarios (OAuth, OIDC, SAML, etc.).
  </Step>
  <Step title="El proxy añade un encabezado de identidad">
    El proxy añade un encabezado con la identidad del usuario autenticado (por ejemplo, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="El Gateway verifica la fuente de confianza">
    OpenClaw comprueba que la solicitud proceda de una **IP de proxy de confianza** (`gateway.trustedProxies`) y que no sea la dirección de local loopback ni una dirección de interfaz local del propio Gateway.
  </Step>
  <Step title="El Gateway extrae la identidad">
    OpenClaw lee los encabezados obligatorios y, a continuación, la identidad del usuario del encabezado configurado.
  </Step>
  <Step title="Autorizar">
    Si todas las comprobaciones son correctas y el usuario cumple `allowUsers` (cuando está configurado), se autoriza la solicitud.
  </Step>
</Steps>

## Configuración

```json5
{
  gateway: {
    // La autenticación mediante proxy de confianza espera de forma predeterminada que la IP de origen del proxy no sea de loopback
    bind: "lan",

    // CRÍTICO: Añada aquí únicamente las IP de su proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Encabezado que contiene la identidad del usuario autenticado (obligatorio)
        userHeader: "x-forwarded-user",

        // Opcional: encabezados que DEBEN estar presentes (verificación del proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcional: restringir a usuarios específicos (vacío = permitir a todos)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Opcional: permitir un proxy de loopback en el mismo host tras habilitarlo explícitamente
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Reglas de ejecución, por orden de evaluación**

1. La IP de origen de la solicitud debe coincidir con `gateway.trustedProxies` (teniendo en cuenta CIDR); de lo contrario, se rechaza (`trusted_proxy_untrusted_source`).
2. Las solicitudes cuyo origen sea loopback (`127.0.0.1`, `::1`) se rechazan, salvo que `gateway.auth.trustedProxy.allowLoopback = true` y la dirección de loopback también figure en `trustedProxies` (`trusted_proxy_loopback_source`). Esta comprobación se ejecuta antes que las de los encabezados, por lo que un origen de loopback falla de este modo incluso si también faltan encabezados obligatorios.
3. Los orígenes que no sean loopback y coincidan con una de las direcciones de interfaz de red local del host del Gateway se rechazan como medida de protección contra la suplantación (`trusted_proxy_local_interface_source`). Si falla la detección de interfaces, la solicitud también se rechaza (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` y `userHeader` deben estar presentes y no pueden estar en blanco.
5. Si `allowUsers` no está vacío, debe incluir al usuario extraído.

**La evidencia de encabezados reenviados prevalece sobre la condición local de loopback para la alternativa local directa.** Si una solicitud llega mediante loopback, pero contiene un encabezado `Forwarded`, cualquier encabezado `X-Forwarded-*` o `X-Real-IP`, dicha evidencia la excluye de la alternativa de contraseña local directa y del control mediante identidad del dispositivo, aunque la autenticación mediante proxy de confianza siga fallando por proceder de loopback.

`allowLoopback` confía en los procesos locales del host del Gateway en la misma medida que en el proxy inverso. Habilítelo únicamente cuando el Gateway siga protegido mediante cortafuegos frente al acceso remoto directo y el proxy local elimine o sobrescriba los encabezados de identidad proporcionados por el cliente.

Los clientes internos del Gateway que no pasan por el proxy inverso deben usar `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, no encabezados de identidad de proxy de confianza. Las implementaciones de la interfaz de control que no sean de loopback siguen necesitando una configuración explícita de `gateway.controlUi.allowedOrigins`.
</Warning>

### Referencia de configuración

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Matriz de direcciones IP de proxy (o CIDR) en las que confiar. Se rechazan las solicitudes procedentes de otras IP.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Debe ser `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nombre del encabezado que contiene la identidad del usuario autenticado.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Encabezados adicionales que deben estar presentes para confiar en la solicitud.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Lista de identidades de usuario permitidas. Si está vacía, se permiten todos los usuarios autenticados.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Compatibilidad opcional con proxies inversos de loopback en el mismo host.
</ParamField>

<Warning>
Habilite `allowLoopback` únicamente cuando el proxy inverso local sea el límite de confianza previsto. Cualquier proceso local que pueda conectarse al Gateway puede intentar enviar encabezados de identidad del proxy; por tanto, mantenga privado para el host el acceso directo al Gateway y exija encabezados controlados por el proxy, como `x-forwarded-proto`, o un encabezado de aserción firmado si su proxy lo admite.
</Warning>

## Comportamiento del emparejamiento de la interfaz de control

Cuando `gateway.auth.mode = "trusted-proxy"` está activo y la solicitud supera las comprobaciones del proxy de confianza, las sesiones WebSocket de la interfaz de control pueden conectarse sin una identidad de emparejamiento del dispositivo.

Implicaciones de los ámbitos:

- Las sesiones WebSocket de la interfaz de control sin dispositivo se conectan, pero de forma predeterminada no reciben ningún ámbito de operador. OpenClaw borra la lista de ámbitos solicitados y la establece en `[]` para que una sesión no vinculada a un dispositivo o token emparejado y aprobado no pueda autodeclarar permisos.
- Si los métodos fallan con `missing scope` tras establecer correctamente una conexión WebSocket, use HTTPS para que el navegador pueda generar la identidad del dispositivo y completar el emparejamiento. Consulte [HTTP no seguro de la interfaz de control](/es/web/control-ui#insecure-http).
- Solo para emergencias: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` conserva los ámbitos solicitados incluso sin identidad del dispositivo. Esto supone una grave reducción de la seguridad; reviértalo cuanto antes. Consulte [HTTP no seguro de la interfaz de control](/es/web/control-ui#insecure-http).

Limitación de ámbitos mediante el proxy inverso: si su proxy envía `x-openclaw-scopes` en la solicitud de actualización a WebSocket de la interfaz de control, OpenClaw limita los ámbitos de la sesión a la intersección de los ámbitos solicitados y los declarados. Este encabezado no concede ámbitos; solo restringe los que puede tener la sesión.

Implicaciones:

- El emparejamiento deja de ser el control principal para acceder a la interfaz de control en este modo.
- La política de autenticación de su proxy inverso y `allowUsers` se convierten en el control de acceso efectivo.
- Mantenga la entrada al Gateway restringida únicamente a las IP de los proxies de confianza (`gateway.trustedProxies` + cortafuegos).

Los clientes WebSocket personalizados no son sesiones de la interfaz de control. `gateway.controlUi.dangerouslyDisableDeviceAuth` no concede ámbitos a clientes arbitrarios con `client.mode: "backend"` ni a clientes con formato de CLI. La automatización personalizada debe usar la identidad y el emparejamiento del dispositivo, la ruta auxiliar reservada del backend local directo `client.id: "gateway-client"` o el [Plugin RPC HTTP de administración](/es/plugins/admin-http-rpc) cuando resulte más adecuada una interfaz HTTP de solicitud y respuesta.

## Encabezado de ámbitos del operador

La autenticación mediante proxy de confianza es un modo HTTP **que incorpora identidad**, por lo que los clientes pueden declarar opcionalmente ámbitos de operador mediante `x-openclaw-scopes` en las solicitudes a la API HTTP.

Nota: los ámbitos de WebSocket se determinan mediante el protocolo de enlace del Gateway y la vinculación de la identidad del dispositivo. En las solicitudes de actualización a WebSocket de la interfaz de control, `x-openclaw-scopes` solo limita los ámbitos negociados de la sesión; no los concede. Consulte [Comportamiento del emparejamiento de la interfaz de control](#control-ui-pairing-behavior).

Ejemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamiento:

- Cuando el encabezado está presente, OpenClaw respeta el conjunto de ámbitos declarado.
- Cuando el encabezado está presente, pero vacío, la solicitud declara que no tiene **ningún** ámbito de operador.
- Cuando el encabezado está ausente, las API HTTP normales que incorporan identidad recurren al conjunto predeterminado estándar de ámbitos de operador (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Las **rutas HTTP de Plugin** con autenticación del Gateway tienen un valor predeterminado más restringido: cuando `x-openclaw-scopes` está ausente, su ámbito de ejecución se limita a `operator.write`.
- Las solicitudes HTTP originadas en navegadores deben seguir cumpliendo `gateway.controlUi.allowedOrigins` (o el modo alternativo deliberado basado en el encabezado Host), incluso después de superar la autenticación mediante proxy de confianza.

Regla práctica: envíe `x-openclaw-scopes` explícitamente cuando quiera que una solicitud mediante proxy de confianza tenga menos privilegios que los predeterminados o cuando una ruta de Plugin con autenticación del Gateway necesite algo más potente que el ámbito de escritura.

## Terminación TLS y HSTS

Use un único punto de terminación TLS y aplique HSTS allí.

<Tabs>
  <Tab title="Terminación TLS en el proxy (recomendada)">
    Cuando su proxy inverso gestiona HTTPS para `https://control.example.com`, configure `Strict-Transport-Security` en el proxy para ese dominio.

    - Adecuado para implementaciones expuestas a Internet.
    - Mantiene en un único lugar la política de certificados y protección de HTTP.
    - OpenClaw puede permanecer en HTTP mediante loopback detrás del proxy.

    Ejemplo de valor del encabezado:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminación TLS en el Gateway">
    Si el propio OpenClaw proporciona HTTPS directamente (sin un proxy que termine TLS), configure:

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

    `strictTransportSecurity` acepta una cadena con el valor del encabezado o `false` para deshabilitarlo explícitamente.

  </Tab>
</Tabs>

### Guía de implementación

- Comience con una duración máxima corta (por ejemplo, `max-age=300`) mientras valida el tráfico.
- Auméntela a valores de larga duración (por ejemplo, `max-age=31536000`) solo cuando tenga un alto grado de confianza.
- Añada `includeSubDomains` únicamente si todos los subdominios están preparados para HTTPS.
- Use la precarga solo si cumple intencionadamente sus requisitos para todo el conjunto de dominios.
- El desarrollo local únicamente mediante loopback no se beneficia de HSTS.

## Ejemplos de configuración del proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium transmite la identidad mediante `x-pomerium-claim-email` (u otros encabezados de declaraciones) y un JWT mediante `x-pomerium-jwt-assertion`.

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
    Caddy con el Plugin `caddy-security` puede autenticar a los usuarios y transmitir encabezados de identidad.

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
    oauth2-proxy autentica a los usuarios y transmite la identidad en `x-auth-request-email`.

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
  <Accordion title="Traefik con autenticación reenviada">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // IP del contenedor de Traefik
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

El inicio del Gateway rechaza la autenticación mediante proxy de confianza si también hay configurado un token compartido (`gateway.auth.token` u `OPENCLAW_GATEWAY_TOKEN`). Ambos son mutuamente excluyentes porque un token compartido permitiría a los clientes del mismo host autenticarse mediante una ruta completamente distinta de la identidad verificada por el proxy que este modo debe exigir.

Si el inicio falla con un error como `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Elimine el token compartido cuando use el modo de proxy de confianza, o
- Cambie `gateway.auth.mode` a `"token"` si pretende usar autenticación basada en tokens.

Las cabeceras de identidad de proxy de confianza procedentes de local loopback también producen un rechazo seguro: los clientes del mismo host no se autentican silenciosamente como usuarios del proxy. Los clientes internos de OpenClaw que omiten el proxy pueden autenticarse con `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. La alternativa mediante token sigue sin admitirse intencionadamente en el modo de proxy de confianza.

## Lista de comprobación de seguridad

Antes de habilitar la autenticación mediante proxy de confianza, compruebe lo siguiente:

- [ ] **El proxy es la única ruta**: El puerto del Gateway está protegido por un cortafuegos frente a todo excepto su proxy.
- [ ] **trustedProxies es mínimo**: Solo contiene las IP reales de sus proxies, no subredes completas.
- [ ] **El origen local loopback del proxy es intencionado**: La autenticación mediante proxy de confianza produce un rechazo seguro para solicitudes cuyo origen sea local loopback, salvo que `gateway.auth.trustedProxy.allowLoopback` se habilite explícitamente para un proxy del mismo host.
- [ ] **El proxy elimina las cabeceras**: Su proxy sobrescribe, en lugar de anexar, las cabeceras `x-forwarded-*` de los clientes.
- [ ] **Terminación TLS**: Su proxy gestiona TLS; los usuarios se conectan mediante HTTPS.
- [ ] **allowedOrigins es explícito**: La interfaz de control que no use local loopback utiliza un valor explícito de `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers está configurado** (recomendado): Restrinja el acceso a usuarios conocidos en lugar de permitirlo a cualquier usuario autenticado.
- [ ] **No hay una configuración mixta de tokens**: No configure simultáneamente `gateway.auth.token` y `gateway.auth.mode: "trusted-proxy"`.
- [ ] **La alternativa de contraseña local es privada**: Si configura `gateway.auth.password` para clientes internos directos, mantenga el puerto del Gateway protegido por un cortafuegos para que los clientes remotos ajenos al proxy no puedan acceder directamente a él.

## Auditoría de seguridad

`openclaw security audit` marca la autenticación mediante proxy de confianza con un hallazgo de gravedad **crítica**. Esto es intencionado; sirve para recordarle que está delegando la seguridad en la configuración de su proxy.

La auditoría comprueba:

- El aviso o recordatorio crítico base `gateway.trusted_proxy_auth`.
- La ausencia de la configuración `trustedProxies`.
- La ausencia de la configuración `userHeader`.
- Un valor `allowUsers` vacío (permite el acceso a cualquier usuario autenticado).
- La habilitación de `allowLoopback` para orígenes de proxy del mismo host.

También se aplican hallazgos independientes que no son específicos de los proxies de confianza siempre que la interfaz de control esté expuesta: un valor comodín o ausente de `gateway.controlUi.allowedOrigins`, y la alternativa de origen mediante la cabecera Host.

## Solución de problemas

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La solicitud no procedía de una IP incluida en `gateway.trustedProxies`. Compruebe lo siguiente:

    - ¿La IP del proxy es correcta? (Las IP de los contenedores Docker pueden cambiar).
    - ¿Hay un equilibrador de carga delante de su proxy?
    - Use `docker inspect` o `kubectl get pods -o wide` para encontrar las IP reales.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw rechazó una solicitud de proxy de confianza cuyo origen era local loopback.

    Compruebe lo siguiente:

    - ¿El proxy se conecta desde `127.0.0.1` / `::1`?
    - ¿Está intentando usar la autenticación mediante proxy de confianza con un proxy inverso local loopback en el mismo host?

    Solución:

    - Prefiera la autenticación mediante token o contraseña para clientes internos del mismo host que no pasan por el proxy, o
    - Enrute el tráfico a través de una dirección de proxy de confianza que no sea local loopback y mantenga esa IP en `gateway.trustedProxies`, o
    - Para un proxy inverso intencionado en el mismo host, configure `gateway.auth.trustedProxy.allowLoopback = true`, mantenga la dirección local loopback en `gateway.trustedProxies` y asegúrese de que el proxy elimine o sobrescriba las cabeceras de identidad.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    La IP de origen de la solicitud coincidía con una de las direcciones de interfaz de red del propio host del Gateway que no eran local loopback (no con el proxy), como protección frente al tráfico falsificado del mismo host en redes Tailscale o redes puente de Docker. `..._check_failed` significa que el propio descubrimiento de interfaces produjo un error, por lo que OpenClaw aplica un rechazo seguro.

    Compruebe lo siguiente:

    - ¿Un proceso del propio host del Gateway envía directamente cabeceras de identidad y omite el proxy?
    - ¿El proxy se ejecuta en el mismo espacio de nombres de red que el Gateway, con una IP que también aparece como interfaz local?

    Solución: enrute el tráfico del proxy a través de una dirección que no esté también vinculada localmente por el host del Gateway, o use `allowLoopback` únicamente para una configuración real de proxy en el mismo host.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    La cabecera de usuario estaba vacía o ausente. Compruebe lo siguiente:

    - ¿Su proxy está configurado para transmitir cabeceras de identidad?
    - ¿El nombre de la cabecera es correcto? (No distingue entre mayúsculas y minúsculas, pero la ortografía debe ser correcta).
    - ¿El usuario está realmente autenticado en el proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Faltaba una cabecera obligatoria. Compruebe lo siguiente:

    - La configuración de su proxy para esas cabeceras específicas.
    - Si las cabeceras se están eliminando en algún punto de la cadena.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    El usuario está autenticado, pero no figura en `allowUsers`. Añádalo o elimine la lista de permitidos.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` es `"trusted-proxy"`, pero `gateway.trustedProxies` está vacío o falta el propio `gateway.auth.trustedProxy`. Todas las solicitudes se rechazan hasta que ambos estén configurados.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    La autenticación mediante proxy de confianza se realizó correctamente, pero la cabecera `Origin` del navegador no superó las comprobaciones de origen de la interfaz de control.

    Compruebe lo siguiente:

    - `gateway.controlUi.allowedOrigins` incluye el origen exacto del navegador.
    - No depende de orígenes comodín, salvo que desee intencionadamente permitir todos los orígenes.
    - Si usa intencionadamente el modo de alternativa mediante la cabecera Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` está configurado deliberadamente.

  </Accordion>
  <Accordion title="La conexión se realiza correctamente, pero los métodos indican que falta un ámbito">
    WebSocket se conecta, pero `chat.history`, `sessions.list` o
    `models.list` falla con `missing scope: operator.read`.

    Causas habituales:

    - Sesión de la interfaz de control sin dispositivo: la autenticación mediante proxy de confianza puede admitir la conexión WebSocket sin identidad de dispositivo, pero OpenClaw elimina los ámbitos de las sesiones sin dispositivo por diseño.
    - Cliente de backend personalizado: `gateway.controlUi.dangerouslyDisableDeviceAuth` solo se aplica a la interfaz de control y no concede ámbitos a clientes WebSocket arbitrarios de backend o con formato de CLI.
    - `x-openclaw-scopes` demasiado restrictivo: si su proxy inyecta esta cabecera en la solicitud de actualización de WebSocket de la interfaz de control, los ámbitos de la sesión se limitan a ese conjunto. Un valor de cabecera vacío no concede ningún ámbito.

    Solución:

    - Para la interfaz de control, use HTTPS para que el navegador pueda generar una identidad de dispositivo y completar el emparejamiento.
    - Para automatizaciones personalizadas, use una identidad de dispositivo y emparejamiento, la ruta auxiliar reservada de backend local directo `gateway-client` o la [RPC HTTP de administración](/es/plugins/admin-http-rpc).
    - Use `gateway.controlUi.dangerouslyDisableDeviceAuth: true` únicamente como ruta temporal de emergencia para la interfaz de control.

  </Accordion>
  <Accordion title="WebSocket sigue fallando">
    Asegúrese de que su proxy:

    - Admite actualizaciones de WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Transmite las cabeceras de identidad en las solicitudes de actualización de WebSocket, no solo en HTTP.
    - No tiene una ruta de autenticación independiente para las conexiones WebSocket.

  </Accordion>
</AccordionGroup>

## Migración desde la autenticación mediante token

<Steps>
  <Step title="Configurar el proxy">
    Configure su proxy para autenticar a los usuarios y transmitir las cabeceras.
  </Step>
  <Step title="Probar el proxy de forma independiente">
    Pruebe la configuración del proxy de forma independiente (con curl y cabeceras).
  </Step>
  <Step title="Actualizar la configuración de OpenClaw">
    Actualice la configuración de OpenClaw con la autenticación mediante proxy de confianza.
  </Step>
  <Step title="Reiniciar el Gateway">
    Reinicie el Gateway.
  </Step>
  <Step title="Probar WebSocket">
    Pruebe las conexiones WebSocket desde la interfaz de control.
  </Step>
  <Step title="Realizar una auditoría">
    Ejecute `openclaw security audit` y revise los hallazgos.
  </Step>
</Steps>

## Temas relacionados

- [Configuración](/es/gateway/configuration) — referencia de configuración
- [Ámbitos del operador](/es/gateway/operator-scopes) — roles, ámbitos y comprobaciones de aprobación
- [Acceso remoto](/es/gateway/remote) — otros patrones de acceso remoto
- [Seguridad](/es/gateway/security) — guía completa de seguridad
- [Tailscale](/es/gateway/tailscale) — alternativa más sencilla para el acceso exclusivo mediante redes Tailscale
