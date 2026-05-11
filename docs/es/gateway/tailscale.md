---
read_when:
    - Exponer la interfaz de control del Gateway fuera de localhost
    - Automatización del acceso al tailnet o al panel público
summary: Serve/Funnel de Tailscale integrado para el panel del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-11T20:37:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw puede configurar automáticamente Tailscale **Serve** (tailnet) o **Funnel** (público) para el
panel de Gateway y el puerto WebSocket. Esto mantiene el Gateway enlazado a loopback mientras
Tailscale proporciona HTTPS, enrutamiento y (para Serve) encabezados de identidad.

## Modos

- `serve`: Serve solo para tailnet mediante `tailscale serve`. El gateway permanece en `127.0.0.1`.
- `funnel`: HTTPS público mediante `tailscale funnel`. OpenClaw requiere una contraseña compartida.
- `off`: Predeterminado (sin automatización de Tailscale).

La salida de estado y auditoría usa **exposición de Tailscale** para este modo Serve/Funnel
de OpenClaw. `off` significa que OpenClaw no está gestionando Serve ni Funnel; no significa que el
daemon local de Tailscale esté detenido o haya cerrado sesión.

## Autenticación

Establece `gateway.auth.mode` para controlar el protocolo de enlace:

- `none` (solo ingreso privado)
- `token` (predeterminado cuando `OPENCLAW_GATEWAY_TOKEN` está establecido)
- `password` (secreto compartido mediante `OPENCLAW_GATEWAY_PASSWORD` o configuración)
- `trusted-proxy` (proxy inverso con identidad; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth))

Cuando `tailscale.mode = "serve"` y `gateway.auth.allowTailscale` es `true`,
la autenticación de IU de control/WebSocket puede usar encabezados de identidad de Tailscale
(`tailscale-user-login`) sin proporcionar un token/contraseña. OpenClaw verifica
la identidad resolviendo la dirección `x-forwarded-for` mediante el daemon local de Tailscale
(`tailscale whois`) y comparándola con el encabezado antes de aceptarla.
OpenClaw solo trata una solicitud como Serve cuando llega desde loopback con
los encabezados `x-forwarded-for`, `x-forwarded-proto` y `x-forwarded-host`
de Tailscale.
Para sesiones de operador de la IU de control que incluyen identidad de dispositivo del navegador, esta
ruta Serve verificada también omite el viaje de ida y vuelta de emparejamiento de dispositivos. No omite
la identidad de dispositivo del navegador: los clientes sin dispositivo se siguen rechazando, y las conexiones WebSocket
de rol de nodo o ajenas a la IU de control siguen pasando por el emparejamiento normal y las
comprobaciones de autenticación.
Los endpoints de API HTTP (por ejemplo `/v1/*`, `/tools/invoke` y `/api/channels/*`)
**no** usan autenticación por encabezados de identidad de Tailscale. Siguen usando el
modo normal de autenticación HTTP del gateway: autenticación con secreto compartido de forma predeterminada, o una configuración `none`
de proxy de confianza / ingreso privado configurada intencionalmente.
Este flujo sin token asume que el host del gateway es de confianza. Si código local no confiable
puede ejecutarse en el mismo host, desactiva `gateway.auth.allowTailscale` y exige
autenticación con token/contraseña en su lugar.
Para exigir credenciales explícitas de secreto compartido, establece `gateway.auth.allowTailscale: false`
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

Conectar desde otro dispositivo de Tailnet:

- IU de control: `http://<tailscale-ip>:18789/`
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
- Establece `gateway.tailscale.resetOnExit` si quieres que OpenClaw deshaga la configuración de `tailscale serve`
  o `tailscale funnel` al apagarse.
- Establece `gateway.tailscale.preserveFunnel: true` para mantener activa una ruta
  `tailscale funnel` configurada externamente entre reinicios del gateway. Cuando está activado y el
  gateway se ejecuta en `mode: "serve"`, OpenClaw comprueba `tailscale funnel status`
  antes de volver a aplicar Serve y lo omite cuando una ruta de Funnel ya cubre el
  puerto del gateway. La política de solo contraseña para Funnel gestionada por OpenClaw no cambia.
- `gateway.bind: "tailnet"` es un enlace directo a Tailnet (sin HTTPS, sin Serve/Funnel).
- `gateway.bind: "auto"` prefiere loopback; usa `tailnet` si quieres solo Tailnet.
- Serve/Funnel solo exponen la **IU de control de Gateway + WS**. Los nodos se conectan por el
  mismo endpoint WS de Gateway, por lo que Serve puede funcionar para el acceso de nodos.

## Control del navegador (Gateway remoto + navegador local)

Si ejecutas el Gateway en una máquina pero quieres controlar un navegador en otra máquina,
ejecuta un **host de nodo** en la máquina del navegador y mantén ambos en la misma tailnet.
El Gateway reenviará las acciones del navegador al nodo; no se necesita un servidor de control separado ni una URL de Serve.

Evita Funnel para el control del navegador; trata el emparejamiento de nodos como acceso de operador.

## Requisitos previos y límites de Tailscale

- Serve requiere HTTPS habilitado para tu tailnet; la CLI muestra un aviso si falta.
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
- [Detección](/es/gateway/discovery)
- [Autenticación](/es/gateway/authentication)
