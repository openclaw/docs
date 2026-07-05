---
read_when:
    - Exponer el Gateway mediante LAN, tailnet, Tailscale Serve, Funnel o un proxy inverso
    - Revisar una implementación antes de permitir usuarios reales de mensajería
    - Revertir una configuración riesgosa de acceso remoto o DM
sidebarTitle: Exposure runbook
summary: Lista de comprobación previa y de reversión antes de exponer un Gateway de OpenClaw más allá de loopback
title: Manual de exposición del Gateway
x-i18n:
    generated_at: "2026-07-05T11:22:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Expón el Gateway solo después de poder explicar quién puede acceder a él, cómo se
autentica, qué agentes puede activar y qué herramientas pueden usar esos agentes.
En caso de duda, vuelve al acceso solo por loopback y ejecuta de nuevo la auditoría.
</Warning>

Este runbook convierte la guía más amplia de [Seguridad](/es/gateway/security) en una
lista de comprobación operativa para acceso remoto y exposición de mensajería.

## Elige el patrón de exposición

Prefiere el patrón más limitado que satisfaga el flujo de trabajo.

| Patrón                     | Recomendado cuando                              | Controles requeridos                                                                                                            |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Loopback + túnel SSH       | Uso personal, acceso de administración, depuración | Mantén `gateway.bind: "loopback"` y crea un túnel a `127.0.0.1:18789`                                                          |
| Loopback + Tailscale Serve | Acceso de tailnet personal a Control UI/WebSocket | Mantén el Gateway solo en loopback; las cabeceras de identidad de Tailscale solo autentican la superficie WebSocket de Control UI, no otras rutas de autenticación |
| Enlace Tailnet/LAN         | Red privada dedicada con dispositivos conocidos | Autenticación del Gateway, lista de permitidos del firewall, sin redirección de puerto pública                                  |
| Proxy inverso de confianza | SSO/OIDC de la organización delante del Gateway | Autenticación `trusted-proxy`, `trustedProxies` estrictos, reglas para sobrescribir/eliminar cabeceras, usuarios permitidos explícitos |
| Internet pública           | Despliegues raros y de alto riesgo              | Proxy con identidad, TLS, límites de tasa, listas de permitidos estrictas, sesiones no principales aisladas                     |

Evita redirigir puertos públicos directamente al Gateway. Si se requiere acceso
público, coloca delante un proxy con identidad y haz que el proxy sea la única
ruta de red hacia el Gateway.

## Inventario previo

Registra esto antes de cambiar la política de bind, proxy, Tailscale o canal:

- Host del Gateway, usuario del sistema operativo y directorio de estado (predeterminado `~/.openclaw`).
- URL del Gateway y modo de bind (`gateway.bind`; puerto predeterminado `18789`).
- Modo de autenticación, origen de token/contraseña u origen de identidad del proxy de confianza.
- Cada canal habilitado y si acepta mensajes directos, grupos o webhooks.
- Agentes accesibles desde remitentes no locales.
- Perfil de herramientas, modo de sandbox y política de herramientas elevadas para cada agente accesible.
- Credenciales externas disponibles para esos agentes.
- Ubicación de copia de seguridad de `~/.openclaw/openclaw.json` y credenciales.

Si más de una persona puede enviar mensajes al bot, trátalo como autoridad
delegada compartida sobre herramientas, no como aislamiento de host por usuario.

## Comprobaciones de referencia

Ejecuta esto antes de abrir el acceso:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Resuelve primero los hallazgos críticos. Acepta advertencias solo cuando sean
intencionales y estén documentadas para el despliegue. Consulta [Comprobaciones de auditoría de seguridad](/es/gateway/security/audit-checks)
para saber qué significa cada `checkId` y su clave de corrección.

Para la validación remota de CLI, pasa las credenciales explícitamente:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

No asumas que las credenciales de la configuración local se aplican a una URL
remota explícita.

## Base mínima segura

Usa esta forma como punto de partida para despliegues expuestos:

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Amplía un control a la vez: añade una lista de permitidos específica de canal
antes de habilitar herramientas con capacidad de escritura, o habilita un proxy
inverso antes de aceptar tráfico remoto de Control UI.

`tools.exec.security: "deny"` bloquea todas las llamadas exec, incluidos
diagnósticos benignos. Si se requieren diagnósticos o comandos de bajo riesgo,
relaja esto solo después de elegir los remitentes, agentes, comandos y modo de
aprobación específicos que coincidan con tu modelo de amenazas.

## Exposición de mensajes directos y grupos

Los canales de mensajería son superficies de entrada no confiables. Antes de
permitir mensajes directos o grupos:

- Prefiere `dmPolicy: "pairing"` o una lista estricta `allowFrom` en lugar de `dmPolicy: "open"`.
- No combines listas de permitidos `"*"` con acceso amplio a herramientas.
- Requiere menciones en grupos salvo que la sala esté estrictamente controlada.
- Configura `session.dmScope: "per-channel-peer"` (o `"per-account-channel-peer"` para
  canales con varias cuentas) cuando varias personas puedan enviar mensajes directos al bot, para que las sesiones de mensajes directos
  no compartan contexto.
- Enruta los canales compartidos a agentes con herramientas mínimas y sin
  credenciales personales.

El emparejamiento aprueba al remitente para activar el bot. No convierte a ese
remitente en un límite de seguridad de host separado.

## Comprobaciones de proxy inverso

Para proxies con identidad:

- El proxy debe autenticar a los usuarios antes de reenviar al Gateway.
- El firewall o la política de red debe bloquear el acceso directo al puerto del Gateway.
- `gateway.trustedProxies` debe listar solo las IP de origen del proxy.
- El proxy debe eliminar o sobrescribir las cabeceras de identidad y reenvío
  proporcionadas por el cliente.
- Configura `gateway.auth.trustedProxy.allowUsers` cuando el proxy atienda a más de
  una audiencia.
- Usa `gateway.auth.trustedProxy.allowLoopback` solo para un proxy en el mismo host
  donde los procesos locales sean confiables y el proxy controle las cabeceras de identidad.

Ejecuta `openclaw security audit --deep` después de cambios de proxy. Los
hallazgos de proxy de confianza son de alta señal porque el proxy se convierte
en el límite de autenticación.

## Revisión de herramientas y sandbox

Antes de exponer un agente a remitentes remotos:

- Confirma qué sesiones se ejecutan en el host y cuáles en sandbox.
- Deniega o exige aprobación para exec en el host.
- Mantén deshabilitadas las herramientas elevadas salvo que un remitente específico y confiable las necesite.
- Evita herramientas de navegador, canvas, node, cron, gateway y generación de sesiones para superficies de mensajería abiertas
  o semiabiertas.
- Mantén limitados los montajes bind; evita credenciales, directorios personales, socket de Docker y rutas del sistema.
- Usa gateways, usuarios del sistema operativo u hosts separados para límites de confianza materialmente distintos.

Si los usuarios remotos no son plenamente confiables, el aislamiento debe venir
de despliegues separados, no solo de prompts o etiquetas de sesión.

## Validación posterior al cambio

Después de cada cambio de exposición:

1. Ejecuta de nuevo `openclaw security audit --deep`.
2. Confirma que una conexión autorizada correcta tenga éxito.
3. Confirma que se deniegue un remitente o una sesión de navegador no autorizados.
4. Confirma que los registros oculten los secretos.
5. Confirma que el enrutamiento de mensajes directos/grupos llegue solo al agente previsto.
6. Confirma que las herramientas de alto impacto pidan aprobación o sean denegadas.
7. Documenta las advertencias residuales aceptadas.

No pases al siguiente cambio de exposición hasta que el actual se entienda.

## Plan de reversión

Si el Gateway puede estar sobreexpuesto:

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Luego:

1. Detén el reenvío público, Tailscale Funnel o las rutas de proxy inverso.
2. Rota los tokens/contraseñas del Gateway y las credenciales de integración afectadas.
3. Elimina `"*"` y remitentes inesperados de las listas de permitidos.
4. Revisa los registros de auditoría recientes, el historial de ejecuciones, las llamadas de herramientas y los cambios de configuración.
5. Ejecuta de nuevo `openclaw security audit --deep`.
6. Vuelve a habilitar el acceso con el patrón más limitado que satisfaga el flujo de trabajo.

## Lista de comprobación de revisión

- El Gateway permanece solo en loopback salvo que haya una razón documentada.
- El acceso no loopback tiene autenticación, firewall y ninguna ruta pública directa.
- Los despliegues con proxy de confianza tienen IP de proxy estrictas y controles de cabeceras.
- Los mensajes directos usan emparejamiento o listas de permitidos, no acceso abierto de forma predeterminada.
- Los grupos requieren menciones o listas de permitidos explícitas.
- Los canales compartidos no llegan a credenciales personales.
- Las sesiones no principales se ejecutan en modo sandbox.
- El exec en host y las herramientas elevadas están denegados o protegidos por aprobación.
- Los registros ocultan secretos.
- Los hallazgos críticos de auditoría están resueltos.
- Los pasos de reversión están probados y documentados.
