---
read_when:
    - Exponer la interfaz de control del Gateway fuera de localhost
    - Automatización del acceso al panel de control mediante tailnet o acceso público
summary: Tailscale Serve/Funnel integrado para el panel del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T14:31:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw puede configurar automáticamente **Serve** (tailnet) o **Funnel** (público) de Tailscale para el panel del Gateway y el puerto WebSocket. Esto mantiene el gateway vinculado a la interfaz de bucle invertido mientras Tailscale proporciona HTTPS, enrutamiento y, en el caso de Serve, encabezados de identidad.

## Modos

`gateway.tailscale.mode`:

| Modo            | Comportamiento                                                                      |
| --------------- | ----------------------------------------------------------------------------------- |
| `serve`         | Serve solo para la tailnet mediante `tailscale serve`. El gateway permanece en `127.0.0.1`. |
| `funnel`        | HTTPS público mediante `tailscale funnel`. Requiere una contraseña compartida.      |
| `off` (predeterminado) | Sin automatización de Tailscale.                                               |

La salida de estado y auditoría usa **exposición de Tailscale** para este modo Serve/Funnel de OpenClaw. `off` significa que OpenClaw no administra Serve ni Funnel; no significa que el daemon local de Tailscale esté detenido o haya cerrado sesión.

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

Abrir: `https://<magicdns>/` (o el valor configurado de `gateway.controlUi.basePath`)

Para exponer la interfaz de control mediante un servicio de Tailscale con nombre en lugar del nombre de host del dispositivo, establezca `gateway.tailscale.serviceName` en el nombre del servicio:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

A continuación, el inicio muestra la URL del servicio como `https://openclaw.<tailnet-name>.ts.net/` en lugar del nombre de host del dispositivo. Los servicios de Tailscale requieren que el host sea un nodo etiquetado aprobado en la tailnet: configure la etiqueta y apruebe el servicio en Tailscale antes de habilitar esta opción; de lo contrario, `tailscale serve --service=...` falla durante el inicio del gateway.

### Solo tailnet (vinculación a la IP de la tailnet)

Use esta opción para que el gateway escuche directamente en la IP de la tailnet, sin Serve/Funnel:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conéctese desde otro dispositivo de la tailnet:

- Interfaz de control: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Cuando hay una dirección IPv4 de la tailnet disponible para vinculación, el Gateway también requiere `http://127.0.0.1:18789` para los clientes autenticados del mismo host. Si no hay ninguna dirección de la tailnet disponible durante el inicio, recurre únicamente a la interfaz de bucle invertido; reinicie después de que Tailscale esté disponible para añadir acceso directo desde la tailnet. Ninguna de las dos rutas añade exposición a la LAN ni pública.
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

Es preferible usar `OPENCLAW_GATEWAY_PASSWORD` en lugar de guardar una contraseña en el disco.

## Ejemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Autenticación

`gateway.auth.mode` controla el protocolo de enlace:

| Modo                                                   | Caso de uso                                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | Solo entrada privada                                                                |
| `token` (predeterminado cuando se establece `OPENCLAW_GATEWAY_TOKEN`) | Token compartido                                                    |
| `password`                                             | Secreto compartido mediante `OPENCLAW_GATEWAY_PASSWORD` o la configuración          |
| `trusted-proxy`                                        | Proxy inverso con reconocimiento de identidad; consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth) |

### Encabezados de identidad de Tailscale (solo Serve)

Cuando `tailscale.mode: "serve"` y `gateway.auth.allowTailscale` es `true`, la autenticación de la interfaz de control/WebSocket puede usar los encabezados de identidad de Tailscale (`tailscale-user-login`) en lugar de un token o una contraseña. OpenClaw verifica el encabezado resolviendo la dirección `x-forwarded-for` de la solicitud mediante el daemon local de Tailscale (`tailscale whois`) y comparándola con el inicio de sesión del encabezado antes de aceptarla. Una solicitud solo cumple los requisitos para esta ruta cuando llega desde la interfaz de bucle invertido con los encabezados `x-forwarded-for`, `x-forwarded-proto` y `x-forwarded-host` de Tailscale.

Este flujo sin token presupone que el host del gateway es de confianza. Si puede ejecutarse código local que no sea de confianza en el mismo host, establezca `gateway.auth.allowTailscale: false` y exija en su lugar autenticación mediante token o contraseña.

Alcance de la omisión:

- Se aplica únicamente a la superficie de autenticación WebSocket de la interfaz de control. Los endpoints de la API HTTP (`/v1/*`, `/tools/invoke`, `/api/channels/*`, etc.) nunca usan autenticación mediante encabezados de identidad de Tailscale; siempre siguen el modo normal de autenticación HTTP del gateway.
- En las sesiones de operador de la interfaz de control que ya incluyen la identidad del dispositivo del navegador, una identidad de Tailscale verificada omite el recorrido de ida y vuelta del emparejamiento mediante token de arranque/QR.
- No omite la propia identidad del dispositivo: los clientes sin dispositivo siguen siendo rechazados y las conexiones con rol de nodo siguen pasando por las comprobaciones normales de emparejamiento y autenticación.

## Notas

- Tailscale Serve/Funnel requiere que la CLI `tailscale` esté instalada y con una sesión iniciada.
- `tailscale.mode: "funnel"` se niega a iniciarse salvo que el modo de autenticación sea `password`, para evitar la exposición pública.
- `gateway.tailscale.serviceName` solo se aplica al modo Serve y se pasa a `tailscale serve --service=<name>`. El valor debe usar el formato `svc:<dns-label>` de Tailscale, por ejemplo, `svc:openclaw`. Tailscale requiere que los hosts del servicio sean nodos etiquetados y puede ser necesario aprobar el servicio en la consola de administración antes de que Serve pueda publicarlo.
- `gateway.tailscale.resetOnExit` revierte la configuración de `tailscale serve`/`tailscale funnel` al apagar.
- `gateway.tailscale.preserveFunnel: true` mantiene activa una ruta `tailscale funnel` configurada externamente durante los reinicios del gateway. Con `mode: "serve"`, OpenClaw comprueba `tailscale funnel status` antes de volver a aplicar Serve y omite este paso cuando una ruta de Funnel ya cubre el puerto del gateway. La política de Funnel administrada por OpenClaw que exige únicamente contraseña no cambia.
- `gateway.bind: "tailnet"` usa una vinculación directa a la tailnet (sin HTTPS ni Serve/Funnel), además de la dirección local obligatoria `127.0.0.1` cuando hay una dirección IPv4 de la tailnet disponible; de lo contrario, recurre únicamente a la interfaz de bucle invertido.
- `gateway.bind: "auto"` prefiere la interfaz de bucle invertido; use `tailnet` para limitar la exposición de red a la tailnet y conservar a la vez el acceso mediante bucle invertido desde el mismo host.
- Serve/Funnel solo expone la **interfaz de control del Gateway + WS**. Los nodos se conectan mediante el mismo endpoint WS del Gateway, por lo que Serve también funciona para el acceso de los nodos.

### Requisitos previos y límites de Tailscale

- Serve requiere que HTTPS esté habilitado para la tailnet; la CLI solicita habilitarlo si falta.
- Serve inserta encabezados de identidad de Tailscale; Funnel no.
- Funnel requiere Tailscale v1.38.3+, MagicDNS, HTTPS habilitado y un atributo de nodo de Funnel.
- Funnel solo admite los puertos `443`, `8443` y `10000` mediante TLS.
- Funnel en macOS requiere la variante de código abierto de la aplicación Tailscale.

## Control del navegador (Gateway remoto + navegador local)

Para ejecutar el Gateway en una máquina y controlar un navegador en otra, ejecute un **host de nodo** en la máquina del navegador y mantenga ambas en la misma tailnet. El Gateway envía las acciones del navegador al nodo mediante proxy; no se necesita un servidor de control independiente ni una URL de Serve.

Evite Funnel para el control del navegador; trate el emparejamiento de nodos como acceso de operador.

## Más información

- Descripción general de Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Descripción general de Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Detección](/es/gateway/discovery)
- [Autenticación](/es/gateway/authentication)
