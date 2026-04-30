---
read_when:
    - Exponer la IU de control del Gateway fuera de localhost
    - Automatización del acceso a tailnet o al panel público
summary: Tailscale Serve/Funnel integrado para el panel de Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T05:44:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw puede configurar automáticamente Tailscale **Serve** (tailnet) o **Funnel** (público) para el
panel del Gateway y el puerto WebSocket. Esto mantiene el Gateway vinculado a loopback mientras
Tailscale proporciona HTTPS, enrutamiento y (para Serve) encabezados de identidad.

## Modos

- `serve`: Serve solo para tailnet mediante `tailscale serve`. El gateway permanece en `127.0.0.1`.
- `funnel`: HTTPS público mediante `tailscale funnel`. OpenClaw requiere una contraseña compartida.
- `off`: Valor predeterminado (sin automatización de Tailscale).

La salida de estado y auditoría usa **exposición de Tailscale** para este modo Serve/Funnel de OpenClaw.
`off` significa que OpenClaw no está administrando Serve ni Funnel; no significa que el
daemon local de Tailscale esté detenido o haya cerrado sesión.

## Autenticación

Define `gateway.auth.mode` para controlar el handshake:

- `none` (solo ingreso privado)
- `token` (valor predeterminado cuando `OPENCLAW_GATEWAY_TOKEN` está definido)
- `password` (secreto compartido mediante `OPENCLAW_GATEWAY_PASSWORD` o configuración)
- `trusted-proxy` (proxy inverso con identidad; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth))

Cuando `tailscale.mode = "serve"` y `gateway.auth.allowTailscale` es `true`,
la autenticación de la interfaz de control/WebSocket puede usar encabezados de identidad de Tailscale
(`tailscale-user-login`) sin proporcionar un token/contraseña. OpenClaw verifica
la identidad resolviendo la dirección `x-forwarded-for` mediante el daemon local de Tailscale
(`tailscale whois`) y comparándola con el encabezado antes de aceptarla.
OpenClaw solo trata una solicitud como Serve cuando llega desde loopback con los
encabezados `x-forwarded-for`, `x-forwarded-proto` y `x-forwarded-host` de Tailscale.
Para las sesiones de operador de la interfaz de control que incluyen identidad de dispositivo del navegador, esta
ruta Serve verificada también omite el recorrido de emparejamiento de dispositivos. No omite
la identidad de dispositivo del navegador: los clientes sin dispositivo siguen siendo rechazados, y las conexiones WebSocket
con rol de nodo o ajenas a la interfaz de control siguen las comprobaciones normales de emparejamiento y
autenticación.
Los endpoints de API HTTP (por ejemplo `/v1/*`, `/tools/invoke` y `/api/channels/*`)
**no** usan autenticación por encabezado de identidad de Tailscale. Siguen usando el modo normal
de autenticación HTTP del gateway: autenticación con secreto compartido de forma predeterminada, o una configuración
intencional de proxy de confianza / ingreso privado `none`.
Este flujo sin token presupone que el host del gateway es de confianza. Si es posible que se ejecute código local
no confiable en el mismo host, desactiva `gateway.auth.allowTailscale` y exige
autenticación con token/contraseña en su lugar.
Para exigir credenciales explícitas de secreto compartido, define `gateway.auth.allowTailscale: false`
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

### Solo tailnet (vincular a la IP de tailnet)

Usa esto cuando quieras que el Gateway escuche directamente en la IP de tailnet (sin Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conéctate desde otro dispositivo de tailnet:

- Interfaz de control: `http://<tailscale-ip>:18789/`
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

Prefiere `OPENCLAW_GATEWAY_PASSWORD` en lugar de guardar una contraseña en disco.

## Ejemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notas

- Tailscale Serve/Funnel requiere que la CLI `tailscale` esté instalada y con sesión iniciada.
- `tailscale.mode: "funnel"` se niega a iniciar a menos que el modo de autenticación sea `password` para evitar la exposición pública.
- Define `gateway.tailscale.resetOnExit` si quieres que OpenClaw deshaga la configuración de `tailscale serve`
  o `tailscale funnel` al apagarse.
- `gateway.bind: "tailnet"` es una vinculación directa a tailnet (sin HTTPS, sin Serve/Funnel).
- `gateway.bind: "auto"` prefiere loopback; usa `tailnet` si quieres solo tailnet.
- Serve/Funnel solo exponen la **interfaz de control del Gateway + WS**. Los nodos se conectan por
  el mismo endpoint WS del Gateway, por lo que Serve puede funcionar para acceso de nodos.

## Control del navegador (Gateway remoto + navegador local)

Si ejecutas el Gateway en una máquina pero quieres controlar un navegador en otra máquina,
ejecuta un **host de nodo** en la máquina del navegador y mantén ambos en la misma tailnet.
El Gateway enviará las acciones del navegador al nodo mediante proxy; no se necesita un servidor de control separado ni una URL de Serve.

Evita Funnel para el control del navegador; trata el emparejamiento de nodos como acceso de operador.

## Requisitos previos y límites de Tailscale

- Serve requiere HTTPS habilitado para tu tailnet; la CLI lo solicita si falta.
- Serve inyecta encabezados de identidad de Tailscale; Funnel no.
- Funnel requiere Tailscale v1.38.3+, MagicDNS, HTTPS habilitado y un atributo de nodo de funnel.
- Funnel solo admite los puertos `443`, `8443` y `10000` sobre TLS.
- Funnel en macOS requiere la variante de código abierto de la app de Tailscale.

## Más información

- Descripción general de Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Descripción general de Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Descubrimiento](/es/gateway/discovery)
- [Autenticación](/es/gateway/authentication)
