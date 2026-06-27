---
read_when:
    - Necesitas la descripción general de arquitectura de red y seguridad
    - Estás depurando el acceso local frente al de tailnet o el emparejamiento
    - Quieres la lista canónica de la documentación sobre redes
summary: 'Centro de red: superficies de Gateway, emparejamiento, descubrimiento y seguridad'
title: Red
x-i18n:
    generated_at: "2026-05-06T05:40:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Este centro enlaza la documentación principal sobre cómo OpenClaw conecta, empareja y protege
dispositivos en localhost, LAN y tailnet.

## Modelo principal

La mayoría de las operaciones pasan por el Gateway (`openclaw gateway`), un único proceso de larga ejecución que gestiona las conexiones de canales y el plano de control WebSocket.

- **Loopback primero**: el WS del Gateway usa `ws://127.0.0.1:18789` de forma predeterminada.
  Los enlaces que no son loopback requieren una ruta de autenticación de Gateway válida: autenticación con
  token/contraseña de secreto compartido, o un despliegue `trusted-proxy`
  no loopback configurado correctamente.
- Se recomienda **un Gateway por host**. Para aislamiento, ejecuta varios gateways con perfiles y puertos aislados ([Varios Gateways](/es/gateway/multiple-gateways)).
- **Canvas host** se sirve en el mismo puerto que el Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protegido por la autenticación de Gateway cuando se enlaza más allá de loopback.
- **Acceso remoto** suele ser un túnel SSH o una VPN Tailscale ([Acceso remoto](/es/gateway/remote)).

Referencias clave:

- [Arquitectura de Gateway](/es/concepts/architecture)
- [Protocolo de Gateway](/es/gateway/protocol)
- [Runbook de Gateway](/es/gateway)
- [Superficies web + modos de enlace](/es/web)

## Emparejamiento + identidad

- [Resumen de emparejamiento (mensajes directos + nodos)](/es/channels/pairing)
- [Emparejamiento de nodos gestionado por Gateway](/es/gateway/pairing)
- [CLI de dispositivos (emparejamiento + rotación de tokens)](/es/cli/devices)
- [CLI de emparejamiento (aprobaciones por mensaje directo)](/es/cli/pairing)

Confianza local:

- Las conexiones directas por local loopback pueden aprobarse automáticamente para el emparejamiento con el fin de mantener
  fluida la experiencia en el mismo host.
- OpenClaw también tiene una ruta limitada de autoconexión local al backend/contenedor para
  flujos auxiliares de secreto compartido de confianza.
- Los clientes de tailnet y LAN, incluidos los enlaces de tailnet en el mismo host, siguen requiriendo
  aprobación explícita de emparejamiento.

## Detección + transportes

- [Detección y transportes](/es/gateway/discovery)
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
- [Referencia de configuración de Gateway](/es/gateway/configuration)
- [Solución de problemas](/es/gateway/troubleshooting)
- [Doctor](/es/gateway/doctor)

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Acceso remoto](/es/gateway/remote)
