---
read_when:
    - Quieres una visión concisa del modelo de red del Gateway
summary: Cómo se conectan el Gateway, los nodos y el host de canvas.
title: Modelo de red
x-i18n:
    generated_at: "2026-04-24T05:29:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> Este contenido se ha integrado en [Red](/es/network#core-model). Consulta esa página para ver la guía actual.

La mayoría de las operaciones pasan por el Gateway (`openclaw gateway`), un único proceso de larga duración
que posee las conexiones de canal y el plano de control WebSocket.

## Reglas principales

- Se recomienda un Gateway por host. Es el único proceso autorizado para poseer la sesión de WhatsApp Web. Para bots de rescate o aislamiento estricto, ejecuta varios gateways con perfiles y puertos aislados. Consulta [Varios gateways](/es/gateway/multiple-gateways).
- Loopback primero: el Gateway WS usa por defecto `ws://127.0.0.1:18789`. El asistente crea autenticación con secreto compartido de forma predeterminada y normalmente genera un token, incluso para loopback. Para acceso que no sea loopback, usa una ruta válida de autenticación del gateway: autenticación con token/contraseña de secreto compartido, o un despliegue `trusted-proxy` no loopback configurado correctamente. Las configuraciones de tailnet/móvil suelen funcionar mejor mediante Tailscale Serve u otro endpoint `wss://` en lugar de `ws://` tailnet sin procesar.
- Los nodos se conectan al Gateway WS por LAN, tailnet o SSH según sea necesario. El
  puente TCP heredado se ha eliminado.
- El host de canvas lo sirve el servidor HTTP del Gateway en el **mismo puerto** que el Gateway (predeterminado `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Cuando `gateway.auth` está configurado y el Gateway se vincula más allá de loopback, estas rutas quedan protegidas por la autenticación del Gateway. Los clientes de nodo usan URL de capacidad con alcance de nodo vinculadas a su sesión WS activa. Consulta [Configuración del Gateway](/es/gateway/configuration) (`canvasHost`, `gateway`).
- El uso remoto suele hacerse mediante túnel SSH o VPN tailnet. Consulta [Acceso remoto](/es/gateway/remote) y [Descubrimiento](/es/gateway/discovery).

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Autenticación de trusted proxy](/es/gateway/trusted-proxy-auth)
- [Protocolo del Gateway](/es/gateway/protocol)
