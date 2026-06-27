---
read_when:
    - Exponer la interfaz de control del Gateway fuera de localhost
    - Automatizar el acceso al panel de control tailnet o público
summary: Tailscale Serve/Funnel integrado para el panel del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T11:38:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw puede configurar automáticamente Tailscale **Serve** (tailnet) o **Funnel** (público) para el
panel del Gateway y el puerto WebSocket. Esto mantiene el Gateway enlazado a loopback mientras
Tailscale proporciona HTTPS, enrutamiento y (para Serve) encabezados de identidad.

## Modos

- `serve`: Serve solo para tailnet mediante `tailscale serve`. El Gateway permanece en `127.0.0.1`.
- `funnel`: HTTPS público mediante `tailscale funnel`. OpenClaw requiere una contraseña compartida.
- `off`: Predeterminado (sin automatización de Tailscale).

La salida de estado y auditoría usa **exposición de Tailscale** para este modo
Serve/Funnel de OpenClaw. `off` significa que OpenClaw no está gestionando Serve ni Funnel; no significa que el
daemon local de Tailscale esté detenido o que se haya cerrado la sesión.

## Autenticación

Configura `gateway.auth.mode` para controlar el protocolo de enlace:

- `none` (solo entrada privada)
- `token` (predeterminado cuando `OPENCLAW_GATEWAY_TOKEN` está configurado)
- `password` (secreto compartido mediante `OPENCLAW_GATEWAY_PASSWORD` o configuración)
- `trusted-proxy` (proxy inverso con identidad; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth))

Cuando `tailscale.mode = "serve"` y `gateway.auth.allowTailscale` es `true`,
la autenticación de Control UI/WebSocket puede usar encabezados de identidad de Tailscale
(`tailscale-user-login`) sin proporcionar un token/contraseña. OpenClaw verifica
la identidad resolviendo la dirección `x-forwarded-for` mediante el daemon local de Tailscale
(`tailscale whois`) y comparándola con el encabezado antes de aceptarla.
OpenClaw solo trata una solicitud como Serve cuando llega desde loopback con los
encabezados `x-forwarded-for`, `x-forwarded-proto` y `x-forwarded-host` de
Tailscale.
Para las sesiones de operador de Control UI que incluyen identidad de dispositivo del navegador, esta
ruta Serve verificada también omite el viaje de ida y vuelta de emparejamiento del dispositivo. No omite
la identidad de dispositivo del navegador: los clientes sin dispositivo se siguen rechazando, y las conexiones WebSocket
con rol de nodo o que no son de Control UI siguen las comprobaciones normales de emparejamiento y
autenticación.
Los endpoints de API HTTP (por ejemplo `/v1/*`, `/tools/invoke` y `/api/channels/*`)
**no** usan autenticación con encabezados de identidad de Tailscale. Siguen usando el
modo normal de autenticación HTTP del Gateway: autenticación con secreto compartido de forma predeterminada, o una configuración
`none` de proxy de confianza / entrada privada configurada intencionalmente.
Este flujo sin token asume que el host del Gateway es de confianza. Si puede ejecutarse código local
no confiable en el mismo host, desactiva `gateway.auth.allowTailscale` y exige
autenticación con token/contraseña en su lugar.
Para exigir credenciales explícitas de secreto compartido, configura `gateway.auth.allowTailscale: false`
y usa `gateway.auth.mode: "token"` o `"password"`.

## Ejemplos de configuración

### Solo tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Abrir: `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

Para exponer Control UI mediante un Tailscale Service con nombre en lugar del
nombre de host del dispositivo, configura `gateway.tailscale.serviceName` con el nombre del Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Con el ejemplo anterior, el inicio informa la URL del Service como
`https://openclaw.<tailnet-name>.ts.net/` en lugar del nombre de host del dispositivo.
Tailscale Services requiere que el host sea un nodo etiquetado aprobado en tu
tailnet. Configura la etiqueta y aprueba el Service en Tailscale antes de habilitar
esta opción; de lo contrario, `tailscale serve --service=...` fallará durante el inicio del
Gateway.

### Solo tailnet (enlazar a la IP de Tailnet)

Usa esto cuando quieras que el Gateway escuche directamente en la IP de Tailnet (sin Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conéctate desde otro dispositivo de Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) **no** funcionará en este modo.
</Note>

### Internet público (Funnel + contraseña compartida)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Prefiere `OPENCLAW_GATEWAY_PASSWORD` antes que confirmar una contraseña en disco.

## Ejemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notas

- Tailscale Serve/Funnel requiere que la CLI `tailscale` esté instalada y con sesión iniciada.
- `tailscale.mode: "funnel"` se niega a iniciar a menos que el modo de autenticación sea `password` para evitar la exposición pública.
- `gateway.tailscale.serviceName` se aplica solo al modo Serve y se pasa a
  `tailscale serve --service=<name>`. El valor debe usar el formato de nombre de Service de Tailscale
  `svc:<dns-label>`, por ejemplo `svc:openclaw`.
  Tailscale requiere que los hosts de Service sean nodos etiquetados, y puede que el Service necesite
  aprobación en la consola de administración antes de que Serve pueda publicarlo.
- Configura `gateway.tailscale.resetOnExit` si quieres que OpenClaw deshaga la configuración de `tailscale serve`
  o `tailscale funnel` al apagarse.
- Configura `gateway.tailscale.preserveFunnel: true` para mantener activa una ruta
  `tailscale funnel` configurada externamente entre reinicios del Gateway. Cuando está habilitado y el
  Gateway se ejecuta en `mode: "serve"`, OpenClaw comprueba `tailscale funnel status`
  antes de volver a aplicar Serve y lo omite cuando una ruta Funnel ya cubre el
  puerto del Gateway. La política de solo contraseña de Funnel gestionada por OpenClaw no cambia.
- `gateway.bind: "tailnet"` es un enlace directo a Tailnet (sin HTTPS, sin Serve/Funnel).
- `gateway.bind: "auto"` prefiere loopback; usa `tailnet` si quieres solo Tailnet.
- Serve/Funnel solo exponen **la interfaz de control del Gateway + WS**. Los nodos se conectan mediante
  el mismo endpoint WS del Gateway, por lo que Serve puede funcionar para el acceso de nodos.

## Control del navegador (Gateway remoto + navegador local)

Si ejecutas el Gateway en una máquina pero quieres controlar un navegador en otra máquina,
ejecuta un **host de nodo** en la máquina del navegador y mantén ambos en la misma tailnet.
El Gateway enviará mediante proxy las acciones del navegador al nodo; no hace falta un servidor de control separado ni una URL de Serve.

Evita Funnel para el control del navegador; trata el emparejamiento de nodos como acceso de operador.

## Requisitos previos y límites de Tailscale

- Serve requiere HTTPS habilitado para tu tailnet; la CLI lo solicita si falta.
- Serve inyecta encabezados de identidad de Tailscale; Funnel no.
- Funnel requiere Tailscale v1.38.3+, MagicDNS, HTTPS habilitado y un atributo de nodo funnel.
- Funnel solo admite los puertos `443`, `8443` y `10000` sobre TLS.
- Funnel en macOS requiere la variante de código abierto de la aplicación Tailscale.

## Más información

- Resumen de Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Resumen de Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Descubrimiento](/es/gateway/discovery)
- [Autenticación](/es/gateway/authentication)
