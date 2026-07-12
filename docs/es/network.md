---
read_when:
    - Necesitas la descripción general de la arquitectura de red y la seguridad.
    - Estás depurando el acceso local frente al acceso mediante tailnet o el emparejamiento
    - Quieres la lista canónica de la documentación de redes
summary: 'Centro de red: superficies del Gateway, emparejamiento, detección y seguridad'
title: Red
x-i18n:
    generated_at: "2026-07-11T23:14:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

Este centro enlaza la documentación principal sobre cómo OpenClaw conecta, empareja y protege
dispositivos en localhost, LAN y tailnet.

## Modelo principal

La mayoría de las operaciones pasan por el Gateway (`openclaw gateway`), un único proceso de larga duración que gestiona las conexiones de los canales y el plano de control WebSocket.

- **Primero local loopback**: el WS del Gateway utiliza `ws://127.0.0.1:18789` de forma predeterminada.
  Los enlaces que no son local loopback se niegan a iniciarse sin una ruta válida de autenticación del Gateway:
  autenticación mediante token de secreto compartido o contraseña, o un despliegue
  `trusted-proxy` correctamente configurado que no sea local loopback.
- Se recomienda **un Gateway por host**. Para el aislamiento, ejecuta varios gateways con perfiles y puertos aislados ([Varios Gateways](/es/gateway/multiple-gateways)).
- El **host de Canvas** se sirve en el mismo puerto que el Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) y está protegido mediante la autenticación del Gateway cuando se enlaza fuera de local loopback.
- El **acceso remoto** suele realizarse mediante un túnel SSH o una VPN Tailscale ([Acceso remoto](/es/gateway/remote)).

Referencias clave:

- [Arquitectura del Gateway](/es/concepts/architecture)
- [Protocolo del Gateway](/es/gateway/protocol)
- [Guía operativa del Gateway](/es/gateway)
- [Superficies web y modos de enlace](/es/web)

## Emparejamiento e identidad

- [Descripción general del emparejamiento (MD + nodos)](/es/channels/pairing)
- [Emparejamiento de nodos gestionado por el Gateway](/es/gateway/pairing)
- [CLI de dispositivos (emparejamiento y rotación de tokens)](/es/cli/devices)
- [CLI de emparejamiento (aprobaciones de MD)](/es/cli/pairing)

Confianza local:

- Las conexiones directas mediante local loopback (sin encabezados reenviados ni de proxy) pueden
  aprobarse automáticamente para el emparejamiento con el fin de mantener una experiencia fluida en el mismo host.
- OpenClaw también dispone de una ruta limitada de conexión consigo mismo local al backend o contenedor para
  flujos de auxiliares de confianza con secretos compartidos.
- Los clientes de tailnet y LAN, incluidos los enlaces de tailnet en el mismo host, siguen requiriendo
  la aprobación explícita del emparejamiento.

## Detección y transportes

- [Detección y transportes](/es/gateway/discovery)
- [Bonjour / mDNS](/es/gateway/bonjour)
- [Acceso remoto (SSH)](/es/gateway/remote)
- [Tailscale](/es/gateway/tailscale)

## Nodos y transportes

- [Descripción general de los nodos](/es/nodes)
- [Protocolo puente (nodos heredados, histórico)](/es/gateway/bridge-protocol)
- [Guía operativa del Node: iOS](/es/platforms/ios)
- [Guía operativa del Node: Android](/es/platforms/android)

## Seguridad

- [Descripción general de la seguridad](/es/gateway/security)
- [Referencia de configuración del Gateway](/es/gateway/configuration)
- [Solución de problemas](/es/gateway/troubleshooting)
- [Diagnóstico](/es/gateway/doctor)

## Relacionado

- [Guía operativa del Gateway](/es/gateway)
- [Acceso remoto](/es/gateway/remote)
