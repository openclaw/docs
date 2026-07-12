---
read_when:
    - Exponer el Gateway mediante la LAN, la red Tailscale, Tailscale Serve, Funnel o un proxy inverso
    - Revisar una implementación antes de permitir el acceso a usuarios reales de mensajería
    - Revertir una configuración arriesgada de acceso remoto o mensajes directos
sidebarTitle: Exposure runbook
summary: Lista de comprobación previa y de reversión antes de exponer un Gateway de OpenClaw más allá de local loopback
title: Guía operativa para la exposición del Gateway
x-i18n:
    generated_at: "2026-07-11T23:08:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Exponga el Gateway solo después de poder explicar quién puede acceder a él, cómo se
autentica, qué agentes puede activar y qué herramientas pueden usar esos agentes.
En caso de duda, vuelva al acceso exclusivo mediante local loopback y ejecute de nuevo la auditoría.
</Warning>

Este procedimiento convierte las directrices generales de [seguridad](/es/gateway/security) en una
lista de comprobación operativa para la exposición del acceso remoto y la mensajería.

## Elegir el patrón de exposición

Prefiera el patrón más restrictivo que satisfaga el flujo de trabajo.

| Patrón                     | Recomendado cuando                                        | Controles obligatorios                                                                                                                                       |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local loopback + túnel SSH | Uso personal, acceso administrativo, depuración           | Mantenga `gateway.bind: "loopback"` y cree un túnel hacia `127.0.0.1:18789`                                                                                   |
| Local loopback + Tailscale Serve | Acceso desde la tailnet personal a la interfaz de control/WebSocket | Mantenga el Gateway exclusivamente en local loopback; los encabezados de identidad de Tailscale solo autentican la superficie WebSocket de la interfaz de control, no otras rutas de autenticación |
| Enlace a tailnet/LAN       | Red privada dedicada con dispositivos conocidos          | Autenticación del Gateway, lista de permitidos del cortafuegos y ningún reenvío público de puertos                                                            |
| Proxy inverso de confianza | SSO/OIDC de la organización delante del Gateway           | Autenticación `trusted-proxy`, `trustedProxies` estrictos, reglas para sobrescribir/eliminar encabezados y usuarios permitidos explícitos                      |
| Internet público           | Despliegues poco frecuentes y de alto riesgo              | Proxy basado en identidad, TLS, límites de frecuencia, listas de permitidos estrictas y sesiones secundarias aisladas                                         |

Evite el reenvío público directo de puertos al Gateway. Si se requiere acceso
público, coloque delante un proxy basado en identidad y haga que el proxy sea la
única ruta de red hacia el Gateway.

## Inventario previo

Registre lo siguiente antes de cambiar las políticas de enlace, proxy, Tailscale o canales:

- El host del Gateway, el usuario del sistema operativo y el directorio de estado (valor predeterminado: `~/.openclaw`).
- La URL y el modo de enlace del Gateway (`gateway.bind`; puerto predeterminado: `18789`).
- El modo de autenticación, el origen del token o la contraseña, o el origen de identidad del proxy de confianza.
- Todos los canales habilitados y si aceptan mensajes directos, grupos o webhooks.
- Los agentes accesibles para remitentes no locales.
- El perfil de herramientas, el modo de aislamiento y la política de herramientas con privilegios elevados de cada agente accesible.
- Las credenciales externas disponibles para esos agentes.
- La ubicación de la copia de seguridad de `~/.openclaw/openclaw.json` y de las credenciales.

Si más de una persona puede enviar mensajes al bot, considérelo una autoridad
delegada y compartida sobre las herramientas, no un aislamiento del host por usuario.

## Comprobaciones de referencia

Ejecute lo siguiente antes de habilitar el acceso:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Resuelva primero los hallazgos críticos. Acepte advertencias únicamente cuando sean
intencionadas y estén documentadas para el despliegue. Consulte las
[comprobaciones de la auditoría de seguridad](/es/gateway/security/audit-checks) para saber
qué significa cada `checkId` y cuál es su clave de corrección.

Para validar la CLI de forma remota, proporcione las credenciales explícitamente:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

No dé por sentado que las credenciales de la configuración local se aplican a una URL remota explícita.

## Configuración mínima segura de referencia

Use esta estructura como punto de partida para los despliegues expuestos:

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

Amplíe un control cada vez: añada una lista de permitidos específica para un canal antes de habilitar
herramientas con capacidad de escritura, o habilite un proxy inverso antes de aceptar tráfico remoto de la
interfaz de control.

`tools.exec.security: "deny"` bloquea todas las llamadas de ejecución, incluidos los
diagnósticos inofensivos. Si se requieren diagnósticos o comandos de bajo riesgo, relaje esta opción
solo después de elegir los remitentes, agentes, comandos y el modo de aprobación específicos que
correspondan a su modelo de amenazas.

## Exposición de mensajes directos y grupos

Los canales de mensajería son superficies de entrada que no son de confianza. Antes de permitir mensajes directos o
grupos:

- Prefiera `dmPolicy: "pairing"` o una lista `allowFrom` estricta en lugar de `dmPolicy: "open"`.
- No combine listas de permitidos `"*"` con un acceso amplio a las herramientas.
- Exija menciones en los grupos, salvo que la sala esté estrictamente controlada.
- Configure `session.dmScope: "per-channel-peer"` (o `"per-account-channel-peer"` para
  canales con varias cuentas) cuando varias personas puedan enviar mensajes directos al bot, para que las sesiones
  de mensajes directos no compartan contexto.
- Dirija los canales compartidos a agentes con un conjunto mínimo de herramientas y sin credenciales
  personales.

El emparejamiento autoriza al remitente a activar el bot. No convierte a ese remitente en un
límite de seguridad del host independiente.

## Comprobaciones del proxy inverso

Para proxies basados en identidad:

- El proxy debe autenticar a los usuarios antes de reenviar las solicitudes al Gateway.
- El cortafuegos o la política de red deben bloquear el acceso directo al puerto del Gateway.
- `gateway.trustedProxies` debe incluir únicamente las IP de origen del proxy.
- El proxy debe eliminar o sobrescribir los encabezados de identidad y reenvío
  proporcionados por el cliente.
- Configure `gateway.auth.trustedProxy.allowUsers` cuando el proxy atienda a más de
  un grupo de usuarios.
- Use `gateway.auth.trustedProxy.allowLoopback` solo para un proxy en el mismo host
  cuando los procesos locales sean de confianza y el proxy controle los encabezados de identidad.

Ejecute `openclaw security audit --deep` después de realizar cambios en el proxy. Los
hallazgos relacionados con proxies de confianza son especialmente relevantes porque el proxy se convierte en el límite de
autenticación.

## Revisión de herramientas y aislamiento

Antes de exponer un agente a remitentes remotos:

- Confirme qué sesiones se ejecutan en el host y cuáles en el entorno aislado.
- Deniegue la ejecución en el host o exija aprobación para ella.
- Mantenga deshabilitadas las herramientas con privilegios elevados, salvo que las necesite un remitente específico y de confianza.
- Evite las herramientas de navegador, lienzo, Node, Cron, Gateway y creación de sesiones en superficies de mensajería
  abiertas o semiabiertas.
- Mantenga restringidos los montajes enlazados; evite rutas de credenciales, del directorio personal, del socket de Docker y del
  sistema.
- Use gateways, usuarios del sistema operativo o hosts distintos para límites de confianza
  sustancialmente diferentes.

Si no se confía plenamente en los usuarios remotos, el aislamiento debe provenir de despliegues
separados, no solo de instrucciones o etiquetas de sesión.

## Validación posterior a los cambios

Después de cada cambio de exposición:

1. Ejecute de nuevo `openclaw security audit --deep`.
2. Confirme que una conexión autorizada se establece correctamente.
3. Confirme que se rechaza a un remitente o una sesión de navegador no autorizados.
4. Confirme que los registros ocultan los secretos.
5. Confirme que el enrutamiento de mensajes directos y grupos llega únicamente al agente previsto.
6. Confirme que las herramientas de gran impacto solicitan aprobación o son denegadas.
7. Documente las advertencias residuales aceptadas.

No continúe con el siguiente cambio de exposición hasta comprender el actual.

## Plan de reversión

Si el Gateway puede estar demasiado expuesto:

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

A continuación:

1. Detenga el reenvío público, Tailscale Funnel o las rutas del proxy inverso.
2. Rote los tokens o contraseñas del Gateway y las credenciales de integración afectadas.
3. Elimine `"*"` y los remitentes inesperados de las listas de permitidos.
4. Revise los registros de auditoría recientes, el historial de ejecuciones, las llamadas a herramientas y los cambios de configuración.
5. Ejecute de nuevo `openclaw security audit --deep`.
6. Vuelva a habilitar el acceso con el patrón más restrictivo que satisfaga el flujo de trabajo.

## Lista de comprobación para la revisión

- El Gateway permanece exclusivamente en local loopback, salvo que exista un motivo documentado.
- El acceso que no sea mediante local loopback dispone de autenticación y cortafuegos, y no tiene ninguna ruta pública directa.
- Los despliegues con proxy de confianza tienen direcciones IP de proxy estrictas y controles de encabezados.
- Los mensajes directos usan emparejamiento o listas de permitidos, no acceso abierto de forma predeterminada.
- Los grupos requieren menciones o listas de permitidos explícitas.
- Los canales compartidos no pueden acceder a credenciales personales.
- Las sesiones secundarias se ejecutan en modo de aislamiento.
- La ejecución en el host y las herramientas con privilegios elevados se deniegan o requieren aprobación.
- Los registros ocultan los secretos.
- Los hallazgos críticos de la auditoría están resueltos.
- Los pasos de reversión están probados y documentados.
