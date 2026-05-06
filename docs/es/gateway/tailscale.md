---
read_when:
    - Exponer la interfaz de control del Gateway fuera de localhost
    - Automatización del acceso a tailnet o al panel público
summary: Serve/Funnel de Tailscale integrado para el panel de control del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:56:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw puede configurar automáticamente Tailscale **Serve** (tailnet) o **Funnel** (público) para el panel del Gateway y el puerto WebSocket. Esto mantiene el Gateway vinculado al bucle local mientras Tailscale proporciona HTTPS, enrutamiento y, en el caso de Serve, encabezados de identidad.

## Modos

- `serve`: Serve solo para tailnet mediante `tailscale serve`. El gateway permanece en `127.0.0.1`.
- `funnel`: HTTPS público mediante `tailscale funnel`. OpenClaw requiere una contraseña compartida.
- `off`: Predeterminado (sin automatización de Tailscale).

La salida de estado y auditoría usa **exposición de Tailscale** para este modo Serve/Funnel de OpenClaw. `off` significa que OpenClaw no está administrando Serve ni Funnel; no significa que el daemon local de Tailscale esté detenido o que la sesión esté cerrada.

## Autenticación

Establece `gateway.auth.mode` para controlar el handshake:

- `none` (solo entrada privada)
- `token` (predeterminado cuando `OPENCLAW_GATEWAY_TOKEN` está establecido)
- `password` (secreto compartido mediante `OPENCLAW_GATEWAY_PASSWORD` o configuración)
- `trusted-proxy` (proxy inverso consciente de identidad; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth))

Cuando `tailscale.mode = "serve"` y `gateway.auth.allowTailscale` es `true`, la autenticación de la UI de control/WebSocket puede usar encabezados de identidad de Tailscale (`tailscale-user-login`) sin proporcionar un token/contraseña. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` mediante el daemon local de Tailscale (`tailscale whois`) y comparándola con el encabezado antes de aceptarla. OpenClaw solo trata una solicitud como Serve cuando llega desde el bucle local con los encabezados `x-forwarded-for`, `x-forwarded-proto` y `x-forwarded-host` de Tailscale.
En las sesiones de operador de la UI de control que incluyen identidad de dispositivo del navegador, esta ruta Serve verificada también omite el recorrido de emparejamiento del dispositivo. No omite la identidad de dispositivo del navegador: los clientes sin dispositivo se siguen rechazando, y las conexiones WebSocket con rol de nodo o que no son de la UI de control siguen las comprobaciones normales de emparejamiento y autenticación.
Los endpoints de la API HTTP (por ejemplo, `/v1/*`, `/tools/invoke` y `/api/channels/*`) **no** usan autenticación con encabezados de identidad de Tailscale. Siguen usando el modo de autenticación HTTP normal del gateway: autenticación de secreto compartido de forma predeterminada, o una configuración `none` de proxy de confianza / entrada privada configurada intencionalmente.
Este flujo sin token asume que el host del gateway es de confianza. Si puede ejecutarse código local no confiable en el mismo host, desactiva `gateway.auth.allowTailscale` y exige autenticación con token/contraseña en su lugar.
Para exigir credenciales explícitas de secreto compartido, establece `gateway.auth.allowTailscale: false` y usa `gateway.auth.mode: "token"` o `"password"`.

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

### Solo tailnet (vincular a la IP de Tailnet)

Usa esto cuando quieras que el Gateway escuche directamente en la IP de Tailnet (sin Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conéctate desde otro dispositivo Tailnet:

- UI de control: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
El bucle local (`http://127.0.0.1:18789`) **no** funcionará en este modo.
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
- `tailscale.mode: "funnel"` se niega a iniciar a menos que el modo de autenticación sea `password`, para evitar la exposición pública.
- Establece `gateway.tailscale.resetOnExit` si quieres que OpenClaw deshaga la configuración de `tailscale serve` o `tailscale funnel` al apagarse.
- `gateway.bind: "tailnet"` es una vinculación directa a Tailnet (sin HTTPS, sin Serve/Funnel).
- `gateway.bind: "auto"` prefiere el bucle local; usa `tailnet` si quieres solo Tailnet.
- Serve/Funnel solo exponen la **UI de control del Gateway + WS**. Los nodos se conectan mediante el mismo endpoint WS del Gateway, por lo que Serve puede funcionar para el acceso de nodos.

## Control del navegador (Gateway remoto + navegador local)

Si ejecutas el Gateway en una máquina pero quieres controlar un navegador en otra máquina, ejecuta un **host de nodo** en la máquina del navegador y mantén ambos en la misma tailnet.
El Gateway enviará las acciones del navegador al nodo mediante proxy; no se necesita un servidor de control separado ni una URL de Serve.

Evita Funnel para el control del navegador; trata el emparejamiento de nodos como acceso de operador.

## Requisitos previos y límites de Tailscale

- Serve requiere HTTPS habilitado para tu tailnet; la CLI lo solicita si falta.
- Serve inyecta encabezados de identidad de Tailscale; Funnel no.
- Funnel requiere Tailscale v1.38.3+, MagicDNS, HTTPS habilitado y un atributo de nodo funnel.
- Funnel solo admite los puertos `443`, `8443` y `10000` sobre TLS.
- Funnel en macOS requiere la variante de código abierto de la app de Tailscale.

## Más información

- Resumen de Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Resumen de Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Descubrimiento](/es/gateway/discovery)
- [Autenticación](/es/gateway/authentication)
