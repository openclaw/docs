---
read_when:
    - Exponer la UI de control del Gateway fuera de localhost
    - Automatizar el acceso al panel por tailnet o público
summary: Tailscale Serve/Funnel integrado para el panel del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T11:30:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw puede configurar automáticamente Tailscale **Serve** (tailnet) o **Funnel** (público) para el panel del Gateway y el puerto WebSocket. Esto mantiene el Gateway enlazado a loopback mientras Tailscale proporciona HTTPS, enrutamiento y (para Serve) cabeceras de identidad.

## Modos

- `serve`: Serve solo para tailnet mediante `tailscale serve`. El gateway permanece en `127.0.0.1`.
- `funnel`: HTTPS público mediante `tailscale funnel`. OpenClaw requiere una contraseña compartida.
- `off`: Predeterminado (sin automatización de Tailscale).

La salida de estado y auditoría usa **exposición de Tailscale** para este modo Serve/Funnel de OpenClaw. `off` significa que OpenClaw no está gestionando Serve o Funnel; no significa que el daemon local de Tailscale esté detenido o haya cerrado sesión.

## Autenticación

Establece `gateway.auth.mode` para controlar el handshake:

- `none` (solo ingreso privado)
- `token` (predeterminado cuando `OPENCLAW_GATEWAY_TOKEN` está configurado)
- `password` (secreto compartido mediante `OPENCLAW_GATEWAY_PASSWORD` o configuración)
- `trusted-proxy` (proxy inverso con reconocimiento de identidad; consulta [Autenticación trusted-proxy](/es/gateway/trusted-proxy-auth))

Cuando `tailscale.mode = "serve"` y `gateway.auth.allowTailscale` es `true`,
la autenticación de la UI de control/WebSocket puede usar cabeceras de identidad de Tailscale
(`tailscale-user-login`) sin proporcionar token/contraseña. OpenClaw verifica
la identidad resolviendo la dirección `x-forwarded-for` mediante el daemon local de Tailscale
(`tailscale whois`) y comparándola con la cabecera antes de aceptarla.
OpenClaw solo trata una solicitud como Serve cuando llega desde loopback con
las cabeceras `x-forwarded-for`, `x-forwarded-proto` y `x-forwarded-host` de Tailscale.
Para sesiones de operator de la UI de control que incluyen identidad de dispositivo del navegador, esta
ruta Serve verificada también omite el viaje de ida y vuelta del emparejamiento de dispositivos. No omite
la identidad del dispositivo del navegador: los clientes sin dispositivo siguen siendo rechazados, y las conexiones WebSocket con rol Node o que no sean de la UI de control siguen el emparejamiento y las comprobaciones de autenticación normales.
Los endpoints de API HTTP (por ejemplo `/v1/*`, `/tools/invoke` y `/api/channels/*`)
**no** usan autenticación por cabeceras de identidad de Tailscale. Siguen el
modo normal de autenticación HTTP del gateway: autenticación por secreto compartido por defecto, o una configuración intencional de trusted-proxy / ingreso privado `none`.
Este flujo sin token asume que el host del gateway es de confianza. Si puede ejecutarse código local no confiable
en el mismo host, deshabilita `gateway.auth.allowTailscale` y exige autenticación por token/contraseña.
Para requerir credenciales explícitas de secreto compartido, establece `gateway.auth.allowTailscale: false`
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

### Solo tailnet (bind a IP de tailnet)

Usa esto cuando quieras que el Gateway escuche directamente en la IP de la tailnet (sin Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conecta desde otro dispositivo de la tailnet:

- UI de control: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Nota: loopback (`http://127.0.0.1:18789`) **no** funcionará en este modo.

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

Prefiere `OPENCLAW_GATEWAY_PASSWORD` en lugar de confirmar una contraseña en disco.

## Ejemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notas

- Tailscale Serve/Funnel requiere que la CLI `tailscale` esté instalada y con sesión iniciada.
- `tailscale.mode: "funnel"` se niega a iniciarse a menos que el modo de autenticación sea `password` para evitar exposición pública.
- Establece `gateway.tailscale.resetOnExit` si quieres que OpenClaw deshaga la configuración de `tailscale serve`
  o `tailscale funnel` al apagarse.
- `gateway.bind: "tailnet"` es un bind directo a tailnet (sin HTTPS, sin Serve/Funnel).
- `gateway.bind: "auto"` prefiere loopback; usa `tailnet` si quieres solo tailnet.
- Serve/Funnel solo exponen la **UI de control del Gateway + WS**. Los Node se conectan por
  el mismo endpoint WS del Gateway, así que Serve puede funcionar para acceso de Node.

## Control del navegador (Gateway remoto + navegador local)

Si ejecutas el Gateway en una máquina pero quieres controlar un navegador en otra máquina,
ejecuta un **host Node** en la máquina del navegador y mantén ambos en la misma tailnet.
El Gateway enviará por proxy las acciones del navegador al nodo; no se necesita un servidor de control separado ni una URL de Serve.

Evita Funnel para control del navegador; trata el emparejamiento de Node como acceso de operator.

## Requisitos previos + límites de Tailscale

- Serve requiere que HTTPS esté habilitado para tu tailnet; la CLI lo solicita si falta.
- Serve inyecta cabeceras de identidad de Tailscale; Funnel no.
- Funnel requiere Tailscale v1.38.3+, MagicDNS, HTTPS habilitado y un atributo de nodo funnel.
- Funnel solo admite puertos `443`, `8443` y `10000` sobre TLS.
- Funnel en macOS requiere la variante de la app Tailscale de código abierto.

## Más información

- Resumen de Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Resumen de Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Descubrimiento](/es/gateway/discovery)
- [Autenticación](/es/gateway/authentication)
