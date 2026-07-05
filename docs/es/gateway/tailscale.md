---
read_when:
    - Exponer la interfaz de control del Gateway fuera de localhost
    - Automatización del acceso a tailnet o al panel público
summary: Tailscale Serve/Funnel integrado para el panel del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-05T11:22:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e9622024cd94f6fc45cf14a9ecc3e4bb2fc8c43b23d8c0210c3a512e0cdf6ef
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw puede configurar automáticamente Tailscale **Serve** (tailnet) o **Funnel** (público) para el panel del Gateway y el puerto WebSocket. Esto mantiene el gateway enlazado a loopback mientras Tailscale proporciona HTTPS, enrutamiento y, en el caso de Serve, encabezados de identidad.

## Modos

`gateway.tailscale.mode`:

| Modo            | Comportamiento                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | Serve solo para tailnet mediante `tailscale serve`. El gateway permanece en `127.0.0.1`. |
| `funnel`        | HTTPS público mediante `tailscale funnel`. Requiere una contraseña compartida.            |
| `off` (predeterminado) | Sin automatización de Tailscale.                                                    |

La salida de estado y auditoría usa **exposición de Tailscale** para este modo Serve/Funnel de OpenClaw. `off` significa que OpenClaw no está gestionando Serve ni Funnel; no significa que el demonio local de Tailscale esté detenido o haya cerrado sesión.

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

Para exponer la interfaz de control a través de un Service de Tailscale con nombre en lugar del nombre de host del dispositivo, establece `gateway.tailscale.serviceName` en el nombre del Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

El inicio informa entonces la URL del Service como `https://openclaw.<tailnet-name>.ts.net/` en lugar del nombre de host del dispositivo. Los Services de Tailscale requieren que el host sea un nodo etiquetado aprobado en tu tailnet: configura la etiqueta y aprueba el Service en Tailscale antes de habilitar esto; de lo contrario, `tailscale serve --service=...` falla durante el inicio del gateway.

### Solo tailnet (enlazar a la IP de Tailnet)

Usa esto para que el gateway escuche directamente en la IP de Tailnet, sin Serve/Funnel:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conéctate desde otro dispositivo Tailnet:

- Interfaz de control: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) **no** funcionará en este modo.
</Note>

### Internet pública (Funnel + contraseña compartida)

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

## Autenticación

`gateway.auth.mode` controla el handshake:

| Modo                                                   | Caso de uso                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | Solo ingreso privado                                                                |
| `token` (predeterminado cuando `OPENCLAW_GATEWAY_TOKEN` está definido) | Token compartido                                                                        |
| `password`                                             | Secreto compartido mediante `OPENCLAW_GATEWAY_PASSWORD` o configuración                             |
| `trusted-proxy`                                        | Proxy inverso con identidad; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth) |

### Encabezados de identidad de Tailscale (solo Serve)

Cuando `tailscale.mode: "serve"` y `gateway.auth.allowTailscale` es `true`, la autenticación de la interfaz de control/WebSocket puede usar encabezados de identidad de Tailscale (`tailscale-user-login`) en lugar de un token/contraseña. OpenClaw verifica el encabezado resolviendo la dirección `x-forwarded-for` de la solicitud mediante el demonio local de Tailscale (`tailscale whois`) y comparándola con el login del encabezado antes de aceptarla. Una solicitud solo califica para esta ruta cuando llega desde loopback con los encabezados `x-forwarded-for`, `x-forwarded-proto` y `x-forwarded-host` de Tailscale.

Este flujo sin token asume que el host del gateway es de confianza. Si puede ejecutarse código local no confiable en el mismo host, establece `gateway.auth.allowTailscale: false` y exige autenticación con token/contraseña en su lugar.

Alcance de la omisión:

- Se aplica solo a la superficie de autenticación WebSocket de la interfaz de control. Los endpoints de API HTTP (`/v1/*`, `/tools/invoke`, `/api/channels/*`, etc.) nunca usan autenticación por encabezado de identidad de Tailscale; siempre siguen el modo normal de autenticación HTTP del gateway.
- Para sesiones de operador de la interfaz de control que ya llevan identidad de dispositivo del navegador, una identidad de Tailscale verificada omite el viaje de ida y vuelta de emparejamiento con token de arranque/QR.
- No omite la identidad del dispositivo en sí: los clientes sin dispositivo siguen siendo rechazados, y las conexiones con rol de nodo siguen pasando por el emparejamiento y las comprobaciones de autenticación normales.

## Notas

- Tailscale Serve/Funnel requiere que la CLI `tailscale` esté instalada y con sesión iniciada.
- `tailscale.mode: "funnel"` se niega a iniciar a menos que el modo de autenticación sea `password`, para evitar la exposición pública.
- `gateway.tailscale.serviceName` se aplica solo al modo Serve y se pasa a `tailscale serve --service=<name>`. El valor debe usar el formato `svc:<dns-label>` de Tailscale, por ejemplo `svc:openclaw`. Tailscale requiere que los hosts de Service sean nodos etiquetados, y el Service puede necesitar aprobación en la consola de administración antes de que Serve pueda publicarlo.
- `gateway.tailscale.resetOnExit` revierte la configuración de `tailscale serve`/`tailscale funnel` al apagar.
- `gateway.tailscale.preserveFunnel: true` mantiene activa una ruta `tailscale funnel` configurada externamente entre reinicios del gateway. Con `mode: "serve"`, OpenClaw comprueba `tailscale funnel status` antes de volver a aplicar Serve y lo omite cuando una ruta Funnel ya cubre el puerto del gateway. La política de Funnel gestionada por OpenClaw de solo contraseña no cambia.
- `gateway.bind: "tailnet"` es un enlace directo a Tailnet (sin HTTPS, sin Serve/Funnel).
- `gateway.bind: "auto"` prefiere loopback; usa `tailnet` para enlazar solo a Tailnet.
- Serve/Funnel solo exponen la **interfaz de control del Gateway + WS**. Los nodos se conectan mediante el mismo endpoint WS del Gateway, por lo que Serve también funciona para el acceso de nodos.

### Requisitos previos y límites de Tailscale

- Serve requiere HTTPS habilitado para tu tailnet; la CLI lo solicita si falta.
- Serve inyecta encabezados de identidad de Tailscale; Funnel no.
- Funnel requiere Tailscale v1.38.3+, MagicDNS, HTTPS habilitado y un atributo de nodo funnel.
- Funnel solo admite los puertos `443`, `8443` y `10000` sobre TLS.
- Funnel en macOS requiere la variante de código abierto de la app de Tailscale.

## Control del navegador (Gateway remoto + navegador local)

Para ejecutar el Gateway en una máquina pero controlar un navegador en otra, ejecuta un **host de nodo** en la máquina del navegador y mantén ambos en la misma tailnet. El Gateway proxifica las acciones del navegador al nodo; no se necesita un servidor de control separado ni una URL de Serve.

Evita Funnel para el control del navegador; trata el emparejamiento de nodos como acceso de operador.

## Más información

- Descripción general de Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Descripción general de Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Descubrimiento](/es/gateway/discovery)
- [Autenticación](/es/gateway/authentication)
