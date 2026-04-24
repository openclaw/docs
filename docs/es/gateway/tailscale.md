---
read_when:
    - Exponer la interfaz de Control de Gateway fuera de localhost
    - Automatizar el acceso al panel por tailnet o público
summary: Tailscale Serve/Funnel integrado para el panel de Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T05:31:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (panel de Gateway)

OpenClaw puede configurar automáticamente Tailscale **Serve** (tailnet) o **Funnel** (público) para el
panel de Gateway y el puerto WebSocket. Esto mantiene el Gateway enlazado a loopback mientras
Tailscale proporciona HTTPS, enrutamiento y (para Serve) encabezados de identidad.

## Modos

- `serve`: Serve solo para tailnet mediante `tailscale serve`. El gateway permanece en `127.0.0.1`.
- `funnel`: HTTPS público mediante `tailscale funnel`. OpenClaw requiere una contraseña compartida.
- `off`: Predeterminado (sin automatización de Tailscale).

## Autenticación

Establece `gateway.auth.mode` para controlar el handshake:

- `none` (solo ingreso privado)
- `token` (predeterminado cuando `OPENCLAW_GATEWAY_TOKEN` está configurado)
- `password` (secreto compartido mediante `OPENCLAW_GATEWAY_PASSWORD` o configuración)
- `trusted-proxy` (proxy inverso con reconocimiento de identidad; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth))

Cuando `tailscale.mode = "serve"` y `gateway.auth.allowTailscale` es `true`,
la autenticación de Control UI/WebSocket puede usar encabezados de identidad de Tailscale
(`tailscale-user-login`) sin proporcionar token/contraseña. OpenClaw verifica
la identidad resolviendo la dirección `x-forwarded-for` mediante el daemon local de Tailscale
(`tailscale whois`) y comparándola con el encabezado antes de aceptarla.
OpenClaw solo trata una solicitud como Serve cuando llega desde loopback con
los encabezados `x-forwarded-for`, `x-forwarded-proto` y `x-forwarded-host` de Tailscale.
Los endpoints de la API HTTP (por ejemplo `/v1/*`, `/tools/invoke` y `/api/channels/*`)
**no** usan autenticación por encabezados de identidad de Tailscale. Siguen usando el
modo normal de autenticación HTTP del gateway: autenticación por secreto compartido de forma predeterminada, o una configuración intencional de `trusted-proxy` / ingreso privado `none`.
Este flujo sin token asume que el host del gateway es de confianza. Si puede ejecutarse código local no confiable
en el mismo host, deshabilita `gateway.auth.allowTailscale` y exige
autenticación por token/contraseña en su lugar.
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

### Solo tailnet (enlace a IP de Tailnet)

Usa esto cuando quieras que el Gateway escuche directamente en la IP de Tailnet (sin Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conecta desde otro dispositivo del Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
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

Prefiere `OPENCLAW_GATEWAY_PASSWORD` en lugar de guardar una contraseña en disco.

## Ejemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notas

- Tailscale Serve/Funnel requiere que la CLI `tailscale` esté instalada y con sesión iniciada.
- `tailscale.mode: "funnel"` se niega a iniciar a menos que el modo de autenticación sea `password` para evitar exposición pública.
- Establece `gateway.tailscale.resetOnExit` si quieres que OpenClaw deshaga la configuración de `tailscale serve`
  o `tailscale funnel` al apagarse.
- `gateway.bind: "tailnet"` es un enlace directo a Tailnet (sin HTTPS, sin Serve/Funnel).
- `gateway.bind: "auto"` prefiere loopback; usa `tailnet` si quieres solo Tailnet.
- Serve/Funnel solo exponen la **Control UI + WS del Gateway**. Los nodos se conectan a través
  del mismo endpoint WS del Gateway, por lo que Serve puede funcionar también para acceso de nodos.

## Control del navegador (Gateway remoto + navegador local)

Si ejecutas Gateway en una máquina pero quieres controlar un navegador en otra máquina,
ejecuta un **host de node** en la máquina del navegador y mantén ambas en el mismo tailnet.
Gateway enviará acciones de navegador al node; no se necesita un servidor de control separado ni una URL de Serve.

Evita Funnel para el control del navegador; trata el emparejamiento de nodos como acceso de operador.

## Requisitos previos + límites de Tailscale

- Serve requiere HTTPS habilitado para tu tailnet; la CLI lo solicita si falta.
- Serve inyecta encabezados de identidad de Tailscale; Funnel no.
- Funnel requiere Tailscale v1.38.3+, MagicDNS, HTTPS habilitado y un atributo de nodo funnel.
- Funnel solo admite los puertos `443`, `8443` y `10000` sobre TLS.
- Funnel en macOS requiere la variante de la app Tailscale de código abierto.

## Más información

- Descripción general de Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Descripción general de Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Discovery](/es/gateway/discovery)
- [Autenticación](/es/gateway/authentication)
