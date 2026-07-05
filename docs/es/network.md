---
read_when:
    - Necesitas la arquitectura de red + la descripción general de seguridad
    - Estás depurando el acceso local frente al de tailnet o el emparejamiento
    - Quieres la lista canónica de documentación de redes
summary: 'Centro de red: superficies de Gateway, emparejamiento, descubrimiento y seguridad'
title: Red
x-i18n:
    generated_at: "2026-07-05T11:27:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

Este centro enlaza la documentación principal sobre cómo OpenClaw conecta, empareja y protege
dispositivos en localhost, LAN y tailnet.

## Modelo principal

La mayoría de las operaciones fluyen a través del Gateway (`openclaw gateway`), un único proceso de larga duración que gestiona las conexiones de canales y el plano de control WebSocket.

- **Primero loopback**: el WS del Gateway usa de forma predeterminada `ws://127.0.0.1:18789`.
  Los enlaces que no son loopback se niegan a iniciar sin una ruta válida de autenticación del gateway:
  autenticación con token/contraseña de secreto compartido, o un despliegue
  `trusted-proxy` no loopback configurado correctamente.
- Se recomienda **un Gateway por host**. Para aislamiento, ejecuta varios gateways con perfiles y puertos aislados ([Varios Gateways](/es/gateway/multiple-gateways)).
- El **host de Canvas** se sirve en el mismo puerto que el Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protegido por la autenticación del Gateway cuando se enlaza más allá de loopback.
- El **acceso remoto** suele ser un túnel SSH o una VPN de Tailscale ([Acceso remoto](/es/gateway/remote)).

Referencias clave:

- [Arquitectura del Gateway](/es/concepts/architecture)
- [Protocolo del Gateway](/es/gateway/protocol)
- [Runbook del Gateway](/es/gateway)
- [Superficies web + modos de enlace](/es/web)

## Emparejamiento + identidad

- [Resumen de emparejamiento (DM + nodos)](/es/channels/pairing)
- [Emparejamiento de nodos gestionado por el Gateway](/es/gateway/pairing)
- [CLI de dispositivos (emparejamiento + rotación de tokens)](/es/cli/devices)
- [CLI de emparejamiento (aprobaciones por DM)](/es/cli/pairing)

Confianza local:

- Las conexiones directas de local loopback (sin encabezados reenviados/de proxy) pueden
  aprobarse automáticamente para el emparejamiento a fin de mantener fluida la UX en el mismo host.
- OpenClaw también tiene una ruta limitada de autoconexión local al backend/contenedor para
  flujos de asistentes de secreto compartido de confianza.
- Los clientes de tailnet y LAN, incluidos los enlaces de tailnet del mismo host, siguen requiriendo
  aprobación explícita de emparejamiento.

## Descubrimiento + transportes

- [Descubrimiento y transportes](/es/gateway/discovery)
- [Bonjour / mDNS](/es/gateway/bonjour)
- [Acceso remoto (SSH)](/es/gateway/remote)
- [Tailscale](/es/gateway/tailscale)

## Nodos + transportes

- [Resumen de nodos](/es/nodes)
- [Protocolo de puente (nodos heredados, histórico)](/es/gateway/bridge-protocol)
- [Runbook de nodos: iOS](/es/platforms/ios)
- [Runbook de nodos: Android](/es/platforms/android)

## Seguridad

- [Resumen de seguridad](/es/gateway/security)
- [Referencia de configuración del Gateway](/es/gateway/configuration)
- [Solución de problemas](/es/gateway/troubleshooting)
- [Doctor](/es/gateway/doctor)

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Acceso remoto](/es/gateway/remote)
