---
read_when:
    - Necesitas el resumen de la arquitectura de red y seguridad
    - Estás depurando acceso local frente a tailnet o Pairing
    - Quieres la lista canónica de documentación de red
summary: 'Centro de red: superficies del gateway, Pairing, descubrimiento y seguridad'
title: Red
x-i18n:
    generated_at: "2026-04-24T05:36:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# Centro de red

Este centro enlaza la documentación principal sobre cómo OpenClaw conecta, empareja y protege
dispositivos a través de localhost, LAN y tailnet.

## Modelo principal

La mayoría de las operaciones fluyen a través del Gateway (`openclaw gateway`), un único proceso de larga duración que es propietario de las conexiones de canales y del plano de control WebSocket.

- **Loopback primero**: el WS del Gateway usa por defecto `ws://127.0.0.1:18789`.
  Los binds sin loopback requieren una ruta válida de autenticación del gateway: autenticación
  con token/contraseña de secreto compartido, o un despliegue `trusted-proxy`
  sin loopback configurado correctamente.
- **Se recomienda un Gateway por host**. Para aislamiento, ejecuta múltiples gateways con perfiles y puertos aislados ([Múltiples Gateways](/es/gateway/multiple-gateways)).
- **Canvas host** se sirve en el mismo puerto que el Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protegido por autenticación del Gateway cuando se enlaza más allá de loopback.
- **El acceso remoto** suele hacerse mediante túnel SSH o Tailscale VPN ([Acceso remoto](/es/gateway/remote)).

Referencias clave:

- [Arquitectura del Gateway](/es/concepts/architecture)
- [Protocolo del Gateway](/es/gateway/protocol)
- [Guía operativa del Gateway](/es/gateway)
- [Superficies web + modos de bind](/es/web)

## Pairing + identidad

- [Resumen de Pairing (DM + Nodes)](/es/channels/pairing)
- [Pairing de Nodes gestionado por Gateway](/es/gateway/pairing)
- [CLI de Devices (Pairing + rotación de token)](/es/cli/devices)
- [CLI de Pairing (aprobaciones de DM)](/es/cli/pairing)

Confianza local:

- Las conexiones directas de loopback local pueden autoaprobarse para Pairing y así mantener una UX fluida en el mismo host.
- OpenClaw también tiene una ruta estrecha de autoconexión local de backend/contenedor para flujos auxiliares de confianza con secreto compartido.
- Los clientes de tailnet y LAN, incluidas las vinculaciones tailnet en el mismo host, siguen requiriendo aprobación explícita de Pairing.

## Descubrimiento + transportes

- [Descubrimiento y transportes](/es/gateway/discovery)
- [Bonjour / mDNS](/es/gateway/bonjour)
- [Acceso remoto (SSH)](/es/gateway/remote)
- [Tailscale](/es/gateway/tailscale)

## Nodes + transportes

- [Resumen de Nodes](/es/nodes)
- [Protocolo Bridge (Nodes heredados, histórico)](/es/gateway/bridge-protocol)
- [Guía operativa de Node: iOS](/es/platforms/ios)
- [Guía operativa de Node: Android](/es/platforms/android)

## Seguridad

- [Resumen de seguridad](/es/gateway/security)
- [Referencia de configuración del Gateway](/es/gateway/configuration)
- [Solución de problemas](/es/gateway/troubleshooting)
- [Doctor](/es/gateway/doctor)

## Relacionado

- [Modelo de red del Gateway](/es/gateway/network-model)
- [Acceso remoto](/es/gateway/remote)
