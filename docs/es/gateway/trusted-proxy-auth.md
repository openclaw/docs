---
read_when:
    - Ejecución de OpenClaw detrás de un proxy con reconocimiento de identidad
    - Configurar Pomerium, Caddy o nginx con OAuth delante de OpenClaw
    - Corrección de errores de WebSocket 1008 por falta de autorización en configuraciones con proxy inverso
    - Decidir dónde configurar HSTS y otras cabeceras de refuerzo de seguridad HTTP
sidebarTitle: Trusted proxy auth
summary: Delegar la autenticación del Gateway a un proxy inverso de confianza (Pomerium, Caddy, nginx + OAuth)
title: Autenticación mediante proxy de confianza
x-i18n:
    generated_at: "2026-07-20T00:53:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 849824b53e518391d1a81f8a9a17320df3f42749f37d0c49b0e8b662f82b27cb
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Función sensible para la seguridad.** Este modo delega por completo la autenticación en el proxy inverso. Una configuración incorrecta puede exponer el Gateway a accesos no autorizados. Lea detenidamente esta página antes de habilitarlo.
</Warning>

## Cuándo usarlo

- OpenClaw se ejecuta detrás de un **proxy con reconocimiento de identidad** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + autenticación reenviada).
- El proxy gestiona toda la autenticación y transmite la identidad del usuario mediante encabezados.
- Se encuentra en un entorno de Kubernetes o contenedores donde el proxy es la única ruta al Gateway.
- Se producen errores de WebSocket `1008 unauthorized` porque los navegadores no pueden transmitir tokens en las cargas útiles de WS.

## Cuándo NO usarlo

- El proxy no autentica a los usuarios (solo es un terminador TLS o un equilibrador de carga).
- Existe alguna ruta al Gateway que elude el proxy (brechas en el cortafuegos, acceso desde la red interna).
- No se sabe con certeza si el proxy elimina o sobrescribe correctamente los encabezados reenviados.
- Solo se necesita acceso personal para un único usuario (considere Tailscale Serve + bucle invertido en su lugar).

## Cómo funciona

<Steps>
  <Step title="El proxy autentica al usuario">
    El proxy inverso autentica a los usuarios (OAuth, OIDC, SAML, etc.).
  </Step>
  <Step title="El proxy añade un encabezado de identidad">
    El proxy añade un encabezado con la identidad del usuario autenticado (p. ej., `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="El Gateway verifica el origen de confianza">
    OpenClaw comprueba que la solicitud proceda de una **IP de proxy de confianza** (`gateway.trustedProxies`) y que no sea la dirección de bucle invertido ni una dirección de interfaz local del propio Gateway.
  </Step>
  <Step title="El Gateway extrae la identidad">
    OpenClaw lee los encabezados obligatorios y, a continuación, la identidad del usuario del encabezado configurado.
  </Step>
  <Step title="Autorización">
    Si todas las comprobaciones son correctas y el usuario supera `allowUsers` (cuando está configurado), se autoriza la solicitud.
  </Step>
</Steps>

## Configuración

```json5
{
  gateway: {
    // La autenticación mediante proxy de confianza espera de forma predeterminada que la IP de origen del proxy no sea de bucle invertido
    bind: "lan",

    // CRÍTICO: Añada aquí únicamente las IP del proxy
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

        // Opcional: permitir un proxy de bucle invertido en el mismo host tras habilitarlo explícitamente
        allowLoopback: false,

        // Opcional: permitir que los usuarios autenticados por el proxy registren nuevos dispositivos de navegador
        deviceAutoApprove: {
          enabled: false,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

<Warning>
**Reglas de ejecución, en orden de evaluación**

1. La IP de origen de la solicitud debe coincidir con `gateway.trustedProxies` (compatible con CIDR); de lo contrario, se rechaza (`trusted_proxy_untrusted_source`).
2. Las solicitudes cuyo origen sea de bucle invertido (`127.0.0.1`, `::1`) se rechazan a menos que `gateway.auth.trustedProxy.allowLoopback = true` y que la dirección de bucle invertido también figure en `trustedProxies` (`trusted_proxy_loopback_source`). Esta comprobación se ejecuta antes que las comprobaciones de encabezados, por lo que un origen de bucle invertido falla de este modo aunque también falten encabezados obligatorios.
3. Los orígenes que no sean de bucle invertido y coincidan con una de las direcciones de interfaz de red local del host del Gateway se rechazan como protección contra la suplantación (`trusted_proxy_local_interface_source`). Si falla la propia detección de interfaces, también se rechaza la solicitud (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` y `userHeader` deben estar presentes y no estar en blanco.
5. `allowUsers`, si no está vacío, debe incluir al usuario extraído.

**La evidencia de encabezados reenviados prevalece sobre la condición de bucle invertido para la alternativa local directa.** Si una solicitud llega mediante bucle invertido pero contiene un encabezado `Forwarded`, cualquier `X-Forwarded-*` o `X-Real-IP`, esa evidencia impide que se aplique la alternativa local directa con contraseña y el control mediante identidad del dispositivo, aunque la autenticación mediante proxy de confianza siga fallando por proceder de un bucle invertido.

`allowLoopback` confía en los procesos locales del host del Gateway en la misma medida que en el proxy inverso. Habilítelo únicamente cuando el Gateway siga protegido mediante cortafuegos frente al acceso remoto directo y el proxy local elimine o sobrescriba los encabezados de identidad proporcionados por el cliente.

Los clientes internos del Gateway que no pasen por el proxy inverso deben utilizar `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, no encabezados de identidad de proxy de confianza. Las implementaciones de la interfaz de control que no sean de bucle invertido siguen necesitando `gateway.controlUi.allowedOrigins` explícito.
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
  Encabezados adicionales que deben estar presentes para que la solicitud se considere de confianza.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Lista de identidades de usuario permitidas. Si está vacía, se permiten todos los usuarios autenticados.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Compatibilidad opcional con proxies inversos de bucle invertido en el mismo host.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.enabled" type="boolean" default="false">
  Aprueba automáticamente las identidades de dispositivos nuevos de la interfaz de control y WebChat después de la autenticación mediante proxy de confianza.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.scopes" type="string[]" default='["operator.read", "operator.write", "operator.approvals"]'>
  Permisos máximos concedidos a un dispositivo de navegador aprobado automáticamente. Incluir explícitamente `operator.admin` permite que todos los usuarios autenticados por el proxy soliciten la concesión automática de permisos de administrador completos para el dispositivo, hace que las solicitudes sin permisos reciban automáticamente permisos de administrador completos y activa el hallazgo CRÍTICO `gateway.trusted_proxy_device_auto_approve_admin` de la auditoría de seguridad, además de una advertencia al iniciar el Gateway.
</ParamField>

<Warning>
Habilite `allowLoopback` únicamente cuando el proxy inverso local sea el límite de confianza previsto. Cualquier proceso local que pueda conectarse al Gateway puede intentar enviar encabezados de identidad de proxy; por tanto, mantenga el acceso directo al Gateway restringido al host y exija encabezados controlados por el proxy, como `x-forwarded-proto`, o un encabezado de aserción firmado si el proxy lo admite.
</Warning>

## Aprobación automática de dispositivos

La autenticación mediante proxy de confianza puede usar opcionalmente la identidad del proxy como límite de aprobación para nuevos dispositivos de navegador:

```json5
{
  gateway: {
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
        allowUsers: ["operator@example.com"],
        deviceAutoApprove: {
          enabled: true,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

El valor predeterminado es `enabled: false`. Cuando se habilita, se aplican todas estas reglas:

1. El WebSocket debe haberse autenticado mediante el método `trusted-proxy` con una identidad de usuario no vacía que haya superado `allowUsers` cuando haya una lista de permitidos configurada. Las conexiones mediante token, contraseña, Tailscale y sin autenticar nunca usan esta política.
2. Solo se puede aprobar automáticamente un nuevo dispositivo de navegador de la interfaz de control o WebChat. Cualquier solicitud relativa a un dispositivo existente, incluida una ampliación de permisos, queda pendiente de aprobación manual con `openclaw devices approve <requestId>`.
3. El dispositivo se aprueba con el rol `operator`. Si la solicitud de conexión incluye permisos, la concesión es la intersección exacta de los permisos solicitados y `deviceAutoApprove.scopes`. Si la solicitud omite los permisos, se concede la lista configurada; cuando se omite esa lista, los valores predeterminados son `operator.read`, `operator.write` y `operator.approvals`. A continuación, la concesión resultante queda limitada adicionalmente por el encabezado de proxy [`x-openclaw-scopes`](#control-ui-pairing-behavior) de la conexión, si está presente, por lo que un proxy que restrinja los permisos de un usuario también limita la concesión **persistente** del dispositivo, no solo la sesión; un encabezado presente pero vacío no concede ningún permiso. Este límite se aplica incluso cuando el cliente omite su propia lista de permisos.
4. `operator.admin` solo se permite si figura explícitamente en `deviceAutoApprove.scopes`. Cuando figura, todos los usuarios autenticados por el proxy pueden solicitar y recibir automáticamente permisos de administrador completos en un nuevo dispositivo de navegador; las solicitudes sin permisos reciben automáticamente permisos de administrador completos. `openclaw security audit` informa del hallazgo CRÍTICO `gateway.trusted_proxy_device_auto_approve_admin` y el Gateway registra una advertencia una vez durante el inicio. Hasta que haya roles por identidad disponibles, es preferible aprobar manualmente los permisos de administrador con `openclaw devices approve` o `openclaw devices rotate`.

<Warning>
Al habilitar esta opción, el registro de nuevos dispositivos de navegador se delega por completo en la identidad del proxy inverso. Una cuenta del proxy comprometida puede registrar un dispositivo persistente con todos los permisos configurados. Incluir `operator.admin` convierte ese dispositivo en administrador completo sin aprobación manual. Mantenga el Gateway accesible únicamente mediante el proxy, exija una autenticación sólida en el proxy, sobrescriba los encabezados de identidad y utilice una lista `allowUsers` restringida.
</Warning>

## Comportamiento de vinculación de la interfaz de control

Cuando `gateway.auth.mode = "trusted-proxy"` está activo y la solicitud supera las comprobaciones del proxy de confianza, las sesiones WebSocket de la interfaz de control pueden conectarse sin una identidad de vinculación del dispositivo.

Implicaciones para los permisos:

- Las sesiones WebSocket de la interfaz de control sin dispositivo se conectan, pero no reciben permisos de operador de forma predeterminada. OpenClaw borra la lista de permisos solicitados y la establece en `[]`, de modo que una sesión no vinculada a un dispositivo o token vinculado y aprobado no pueda autodeclarar permisos.
- Si los métodos fallan con `missing scope` tras conectarse correctamente mediante WebSocket, utilice HTTPS para que el navegador pueda generar la identidad del dispositivo y completar la vinculación. Consulte [HTTP no seguro de la interfaz de control](/es/web/control-ui#insecure-http).
- Solo como medida de emergencia: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` conserva los permisos solicitados incluso sin identidad del dispositivo. Esto supone una grave reducción de la seguridad; reviértalo rápidamente. Consulte [HTTP no seguro de la interfaz de control](/es/web/control-ui#insecure-http).

Limitación de permisos mediante proxy inverso: si el proxy envía `x-openclaw-scopes` en la solicitud de actualización a WebSocket de la interfaz de control, OpenClaw limita los permisos de la sesión a la intersección de los permisos solicitados y los declarados. Este encabezado no concede permisos; solo restringe los que puede tener la sesión. Cuando `deviceAutoApprove.enabled` es true, el mismo límite también se aplica a la concesión persistente del dispositivo escrita mediante la [aprobación automática de dispositivos](#automatic-device-approval), por lo que un dispositivo aprobado automáticamente nunca tiene más permisos de los declarados por el proxy.

Implicaciones:

- La vinculación deja de ser el control principal para el acceso a la interfaz de control sin dispositivo. Cuando `deviceAutoApprove.enabled` es true, la identidad del proxy también se convierte en el control de aprobación para registrar nuevos dispositivos de navegador.
- La política de autenticación del proxy inverso y `allowUsers` se convierten en el control de acceso efectivo.
- Mantenga la entrada al Gateway restringida únicamente a las IP de los proxies de confianza (`gateway.trustedProxies` + cortafuegos).

Los clientes WebSocket personalizados no son sesiones de la interfaz de control. `gateway.controlUi.dangerouslyDisableDeviceAuth` no concede permisos a clientes `client.mode: "backend"` arbitrarios ni con formato de CLI. La automatización personalizada debe usar la identidad o vinculación del dispositivo, la ruta auxiliar reservada del backend local directo `client.id: "gateway-client"` o el [plugin RPC HTTP de administración](/es/plugins/admin-http-rpc) cuando una interfaz HTTP de solicitud y respuesta resulte más adecuada.

## Encabezado de permisos del operador

La autenticación mediante proxy de confianza es un modo HTTP **que incorpora identidad**, por lo que los llamadores pueden declarar opcionalmente ámbitos de operador con `x-openclaw-scopes` en las solicitudes a la API HTTP.

Nota: los ámbitos de WebSocket se determinan mediante el protocolo de enlace del Gateway y la vinculación de la identidad del dispositivo. En las solicitudes de actualización a WebSocket de la interfaz de control, `x-openclaw-scopes` solo limita los ámbitos negociados de la sesión, no los concede. Consulte el [comportamiento del emparejamiento de la interfaz de control](#control-ui-pairing-behavior).

Ejemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamiento:

- Cuando la cabecera está presente, OpenClaw respeta el conjunto de ámbitos declarado.
- Cuando la cabecera está presente pero vacía, la solicitud declara que no tiene **ningún** ámbito de operador.
- Cuando la cabecera está ausente, las API HTTP normales que incorporan identidad recurren al conjunto predeterminado estándar de ámbitos de operador (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Las **rutas HTTP de plugins** autenticadas por el Gateway son más restrictivas de forma predeterminada: cuando `x-openclaw-scopes` está ausente, su ámbito de ejecución se limita únicamente a `operator.write`.
- Las solicitudes HTTP originadas en el navegador deben seguir superando `gateway.controlUi.allowedOrigins` (o el modo alternativo deliberado basado en la cabecera Host), incluso después de que la autenticación mediante proxy de confianza se complete correctamente.

Regla práctica: envíe `x-openclaw-scopes` explícitamente cuando quiera que una solicitud mediante proxy de confianza sea más restrictiva que los valores predeterminados o cuando una ruta de plugin autenticada por el Gateway necesite algo más amplio que el ámbito de escritura.

## Terminación TLS y HSTS

Utilice un único punto de terminación TLS y aplique HSTS en él.

<Tabs>
  <Tab title="Terminación TLS en el proxy (recomendado)">
    Cuando el proxy inverso gestione HTTPS para `https://control.example.com`, configure `Strict-Transport-Security` en el proxy para ese dominio.

    - Adecuado para implementaciones expuestas a Internet.
    - Mantiene en un único lugar la política de certificados y refuerzo de HTTP.
    - OpenClaw puede permanecer en HTTP de bucle invertido detrás del proxy.

    Valor de cabecera de ejemplo:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminación TLS en el Gateway">
    Si OpenClaw proporciona HTTPS directamente (sin un proxy que termine TLS), configure:

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

    `strictTransportSecurity` acepta un valor de cabecera de cadena o `false` para deshabilitarla explícitamente.

  </Tab>
</Tabs>

### Orientación para el despliegue

- Comience primero con una duración máxima corta (por ejemplo, `max-age=300`) mientras valida el tráfico.
- Aumente a valores de larga duración (por ejemplo, `max-age=31536000`) solo cuando haya un alto grado de confianza.
- Añada `includeSubDomains` solo si todos los subdominios están preparados para HTTPS.
- Utilice la precarga solo si cumple deliberadamente los requisitos de precarga para todo el conjunto de dominios.
- El desarrollo local limitado al bucle invertido no se beneficia de HSTS.

## Ejemplos de configuración del proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium transmite la identidad en `x-pomerium-claim-email` (u otras cabeceras de notificaciones) y un JWT en `x-pomerium-jwt-assertion`.

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
    Caddy con el plugin `caddy-security` puede autenticar usuarios y transmitir cabeceras de identidad.

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

El inicio del Gateway rechaza la autenticación mediante proxy de confianza si también se configura un token compartido (`gateway.auth.token` o `OPENCLAW_GATEWAY_TOKEN`). Ambas opciones son mutuamente excluyentes porque un token compartido permitiría a los llamadores del mismo host autenticarse mediante una ruta completamente distinta de la identidad verificada por el proxy que este modo pretende imponer.

Si el inicio falla con un error como `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Elimine el token compartido cuando utilice el modo de proxy de confianza, o
- Cambie `gateway.auth.mode` a `"token"` si pretende utilizar autenticación basada en tokens.

Las cabeceras de identidad de proxy de confianza de bucle invertido también se cierran de forma segura ante errores: los llamadores del mismo host no se autentican silenciosamente como usuarios del proxy. Los llamadores internos de OpenClaw que omitan el proxy pueden autenticarse mediante `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. La alternativa mediante token sigue sin admitirse deliberadamente en el modo de proxy de confianza.

## Lista de comprobación de seguridad

Antes de habilitar la autenticación mediante proxy de confianza, compruebe lo siguiente:

- [ ] **El proxy es la única ruta**: el puerto del Gateway está protegido mediante cortafuegos frente a todo excepto el proxy.
- [ ] **trustedProxies es mínimo**: solo contiene las IP reales del proxy, no subredes completas.
- [ ] **El origen de proxy de bucle invertido es deliberado**: la autenticación mediante proxy de confianza se cierra de forma segura ante solicitudes cuyo origen es el bucle invertido, salvo que `gateway.auth.trustedProxy.allowLoopback` se habilite explícitamente para un proxy del mismo host.
- [ ] **El proxy elimina las cabeceras**: el proxy sobrescribe (no añade) las cabeceras `x-forwarded-*` procedentes de los clientes.
- [ ] **Terminación TLS**: el proxy gestiona TLS; los usuarios se conectan mediante HTTPS.
- [ ] **allowedOrigins es explícito**: la interfaz de control fuera del bucle invertido utiliza un valor explícito de `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers está configurado** (recomendado): restrinja el acceso a usuarios conocidos en lugar de permitirlo a cualquier usuario autenticado.
- [ ] **No hay una configuración mixta de tokens**: no configure simultáneamente `gateway.auth.token` y `gateway.auth.mode: "trusted-proxy"`.
- [ ] **La alternativa de contraseña local es privada**: si configura `gateway.auth.password` para llamadores internos directos, mantenga el puerto del Gateway protegido mediante cortafuegos para que los clientes remotos que no utilizan el proxy no puedan acceder a él directamente.
- [ ] **La aprobación automática de dispositivos es deliberada**: si `deviceAutoApprove.enabled` es verdadero, trate la seguridad de la cuenta del proxy inverso como el límite de inscripción de dispositivos y mantenga la lista de ámbitos concedidos sin privilegios de administración y reducida al mínimo.

## Auditoría de seguridad

`openclaw security audit` marca la autenticación mediante proxy de confianza con un hallazgo de gravedad **crítica**. Esto es intencionado; sirve como recordatorio de que se está delegando la seguridad en la configuración del proxy.

La auditoría comprueba lo siguiente:

- Advertencia o recordatorio crítico de base de `gateway.trusted_proxy_auth`.
- Falta la configuración de `trustedProxies`.
- Falta la configuración de `userHeader`.
- `allowUsers` está vacío (permite cualquier usuario autenticado).
- `allowLoopback` está habilitado para orígenes de proxy del mismo host.
- La aprobación automática de dispositivos del navegador está habilitada (delega el emparejamiento de dispositivos nuevos en la identidad del proxy).

También se aplican hallazgos independientes, no específicos del proxy de confianza, siempre que la interfaz de control esté expuesta: `gateway.controlUi.allowedOrigins` ausente o con un comodín, y la alternativa de origen basada en la cabecera Host.

## Solución de problemas

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La solicitud no procedía de una IP incluida en `gateway.trustedProxies`. Compruebe lo siguiente:

    - ¿Es correcta la IP del proxy? (Las IP de los contenedores Docker pueden cambiar).
    - ¿Hay un equilibrador de carga delante del proxy?
    - Utilice `docker inspect` o `kubectl get pods -o wide` para determinar las IP reales.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw rechazó una solicitud mediante proxy de confianza cuyo origen era el bucle invertido.

    Compruebe lo siguiente:

    - ¿Se conecta el proxy desde `127.0.0.1` / `::1`?
    - ¿Está intentando utilizar la autenticación mediante proxy de confianza con un proxy inverso de bucle invertido en el mismo host?

    Solución:

    - Utilice preferentemente autenticación mediante token o contraseña para los clientes internos del mismo host que no pasan por el proxy, o
    - Enrute el tráfico a través de una dirección de proxy de confianza que no sea de bucle invertido y mantenga esa IP en `gateway.trustedProxies`, o
    - Para un proxy inverso deliberado en el mismo host, configure `gateway.auth.trustedProxy.allowLoopback = true`, mantenga la dirección de bucle invertido en `gateway.trustedProxies` y asegúrese de que el proxy elimine o sobrescriba las cabeceras de identidad.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    La dirección IP de origen de la solicitud coincidió con una de las direcciones de interfaz de red que no son de bucle invertido del propio host del Gateway (no con la del proxy), como protección frente al tráfico falsificado del mismo host en tailnets o redes puente de Docker. `..._check_failed` significa que se produjo un error durante la detección de interfaces, por lo que OpenClaw se cierra de forma segura ante el error.

    Compruebe lo siguiente:

    - ¿Un proceso del propio host del Gateway está enviando directamente cabeceras de identidad y omitiendo el proxy?
    - ¿El proxy se ejecuta en el mismo espacio de nombres de red que el Gateway, con una IP que también aparece como interfaz local?

    Solución: enrute el tráfico del proxy mediante una dirección que tampoco esté vinculada localmente por el host del Gateway, o utilice `allowLoopback` únicamente para una configuración real de proxy en el mismo host.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    La cabecera de usuario estaba vacía o ausente. Compruebe lo siguiente:

    - ¿Está configurado el proxy para transmitir cabeceras de identidad?
    - ¿Es correcto el nombre de la cabecera? (No distingue entre mayúsculas y minúsculas, pero la ortografía es importante).
    - ¿El usuario está realmente autenticado en el proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Faltaba una cabecera obligatoria. Compruebe lo siguiente:

    - La configuración del proxy para esas cabeceras específicas.
    - Si las cabeceras se están eliminando en algún punto de la cadena.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    El usuario está autenticado, pero no está en `allowUsers`. Añádalo o elimine la lista de permitidos.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` es `"trusted-proxy"`, pero `gateway.trustedProxies` está vacío, o falta el propio `gateway.auth.trustedProxy`. Todas las solicitudes se rechazan hasta que ambos estén configurados.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    La autenticación mediante proxy de confianza se realizó correctamente, pero el encabezado `Origin` del navegador no superó las comprobaciones de origen de la interfaz de control.

    Compruebe lo siguiente:

    - `gateway.controlUi.allowedOrigins` incluye el origen exacto del navegador.
    - No se depende de orígenes comodín, salvo que se desee intencionadamente permitir todos los orígenes.
    - Si se utiliza intencionadamente el modo de reserva basado en el encabezado Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` está configurado deliberadamente.

  </Accordion>
  <Accordion title="La conexión se establece, pero los métodos indican que falta un ámbito">
    El WebSocket se conecta, pero `chat.history`, `sessions.list` o
    `models.list` falla con `missing scope: operator.read`.

    Causas habituales:

    - Sesión de la interfaz de control sin dispositivo: la autenticación mediante proxy de confianza puede admitir la conexión WebSocket sin una identidad de dispositivo, pero OpenClaw elimina deliberadamente los ámbitos de las sesiones sin dispositivo.
    - Cliente de backend personalizado: `gateway.controlUi.dangerouslyDisableDeviceAuth` está limitado a la interfaz de control y no concede ámbitos a clientes WebSocket arbitrarios de backend o con formato de CLI.
    - `x-openclaw-scopes` demasiado restrictivo: si el proxy inyecta este encabezado en la solicitud de actualización de WebSocket de la interfaz de control, los ámbitos de la sesión quedan limitados a ese conjunto. Un valor de encabezado vacío no proporciona ningún ámbito.

    Solución:

    - Para la interfaz de control, utilice HTTPS para que el navegador pueda generar una identidad de dispositivo y completar el emparejamiento.
    - Para automatizaciones personalizadas, utilice la identidad y el emparejamiento del dispositivo, la ruta reservada del asistente de backend local directo `gateway-client` o la [RPC HTTP de administración](/es/plugins/admin-http-rpc).
    - Utilice `gateway.controlUi.dangerouslyDisableDeviceAuth: true` únicamente como una vía temporal de acceso de emergencia a la interfaz de control.

  </Accordion>
  <Accordion title="WebSocket sigue fallando">
    Asegúrese de que el proxy:

    - Admite actualizaciones de WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Transmite los encabezados de identidad en las solicitudes de actualización de WebSocket (no solo en HTTP).
    - No tiene una ruta de autenticación independiente para las conexiones WebSocket.

  </Accordion>
</AccordionGroup>

## Migración desde la autenticación mediante token

<Steps>
  <Step title="Configurar el proxy">
    Configure el proxy para autenticar a los usuarios y transmitir los encabezados.
  </Step>
  <Step title="Probar el proxy de forma independiente">
    Pruebe la configuración del proxy de forma independiente (curl con encabezados).
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
  <Step title="Auditar">
    Ejecute `openclaw security audit` y revise los hallazgos.
  </Step>
</Steps>

## Contenido relacionado

- [Configuración](/es/gateway/configuration) — referencia de configuración
- [Ámbitos del operador](/es/gateway/operator-scopes) — roles, ámbitos y comprobaciones de aprobación
- [Acceso remoto](/es/gateway/remote) — otros patrones de acceso remoto
- [Seguridad](/es/gateway/security) — guía de seguridad completa
- [Tailscale](/es/gateway/tailscale) — alternativa más sencilla para el acceso exclusivo desde la tailnet
