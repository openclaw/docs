---
read_when:
    - Exponer el Gateway a través de LAN, tailnet, Tailscale Serve, Funnel o un proxy inverso
    - Revisar un despliegue antes de permitir usuarios reales de mensajería
    - Revertir una configuración riesgosa de acceso remoto o DM
sidebarTitle: Exposure runbook
summary: Lista de verificación previa y de reversión antes de exponer un Gateway de OpenClaw más allá de loopback
title: Runbook de exposición del Gateway
x-i18n:
    generated_at: "2026-06-27T11:36:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Expón el Gateway solo después de poder explicar quién puede alcanzarlo, cómo se
autentica, qué agentes puede activar y qué herramientas pueden usar esos agentes.
En caso de duda, vuelve al acceso solo por loopback y vuelve a ejecutar la auditoría.
</Warning>

Esta guía operativa convierte la orientación más amplia de [Seguridad](/es/gateway/security) en una
lista de verificación para operadores sobre acceso remoto y exposición de mensajería.

## Elige el patrón de exposición

Prefiere el patrón más restringido que satisfaga el flujo de trabajo.

| Patrón                    | Recomendado cuando                                | Controles requeridos                                                                                   |
| -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Loopback + túnel SSH      | Uso personal, acceso administrativo, depuración           | Mantén `gateway.bind: "loopback"` y tuneliza `127.0.0.1:18789`                                        |
| Loopback + Tailscale Serve | Acceso personal por tailnet a Control UI/WebSocket | Mantén el Gateway solo por loopback; confía en los encabezados de identidad de Tailscale solo para superficies admitidas          |
| Vinculación tailnet/LAN           | Red privada dedicada con dispositivos conocidos    | Autenticación del Gateway, lista de permitidos del firewall, sin reenvío de puertos público                                            |
| Proxy inverso de confianza      | SSO/OIDC de la organización delante del Gateway       | Autenticación `trusted-proxy`, `trustedProxies` estrictos, reglas de sobrescritura/eliminación de encabezados, usuarios permitidos explícitos |
| Internet pública            | Despliegues poco frecuentes y de alto riesgo                     | Proxy con conocimiento de identidad, TLS, límites de tasa, listas de permitidos estrictas, sesiones non-main aisladas              |

Evita el reenvío directo de puertos públicos al Gateway. Si necesitas acceso público,
coloca un proxy con conocimiento de identidad delante de él y haz que el proxy sea la única ruta de red
hacia el Gateway.

## Inventario previo

Registra esto antes de cambiar políticas de vinculación, proxy, Tailscale o canal:

- Host del Gateway, usuario del SO y directorio de estado.
- URL del Gateway y modo de vinculación.
- Modo de autenticación, origen del token/contraseña u origen de identidad del proxy de confianza.
- Todos los canales habilitados y si aceptan DM, grupos o Webhooks.
- Agentes alcanzables desde remitentes no locales.
- Perfil de herramientas, modo de sandbox y política de herramientas elevadas para cada agente alcanzable.
- Credenciales externas disponibles para esos agentes.
- Ubicación de la copia de seguridad de `~/.openclaw/openclaw.json` y credenciales.

Si más de una persona puede enviar mensajes al bot, trata esto como autoridad de herramienta
delegada compartida, no como aislamiento de host por usuario.

## Comprobaciones de referencia

Ejecuta esto antes de abrir el acceso:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Resuelve primero los hallazgos críticos. Las advertencias solo pueden ser aceptables cuando son
intencionadas y están documentadas para el despliegue.

Para la validación remota de la CLI, pasa las credenciales explícitamente:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

No supongas que las credenciales de la configuración local se aplican a una URL remota explícita.

## Referencia mínima segura

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

Luego amplía un control a la vez. Por ejemplo, agrega una lista de permitidos de canal específica
antes de habilitar herramientas con capacidad de escritura, o habilita un proxy inverso antes de aceptar
tráfico remoto de Control UI.

La referencia estricta `exec.security: "deny"` bloquea todas las llamadas exec, incluidos
diagnósticos benignos. Si se requieren diagnósticos o comandos de bajo riesgo, relaja esto
solo después de elegir los remitentes, agentes, comandos y modo de aprobación específicos
que coincidan con tu modelo de amenazas.

## Exposición de DM y grupos

Los canales de mensajería son superficies de entrada no confiables. Antes de permitir DM o grupos:

- Prefiere `dmPolicy: "pairing"` o listas `allowFrom` estrictas.
- Evita `dmPolicy: "open"` salvo que todos los remitentes sean de confianza.
- No combines listas de permitidos `"*"` con acceso amplio a herramientas.
- Exige menciones en grupos salvo que la sala esté estrictamente controlada.
- Usa `session.dmScope: "per-channel-peer"` cuando varias personas puedan enviar DM al bot.
- Enruta los canales compartidos a agentes con herramientas mínimas y sin credenciales personales.

El emparejamiento aprueba que el remitente active el bot. No convierte a ese remitente en un
límite de seguridad de host independiente.

## Comprobaciones de proxy inverso

Para proxies con conocimiento de identidad:

- El proxy debe autenticar a los usuarios antes de reenviar al Gateway.
- El acceso directo al puerto del Gateway debe estar bloqueado por firewall o política de red.
- `gateway.trustedProxies` debe contener solo las IP de origen del proxy.
- El proxy debe eliminar o sobrescribir los encabezados de identidad y reenvío proporcionados por el cliente.
- `gateway.auth.trustedProxy.allowUsers` debe enumerar los usuarios esperados cuando el proxy sirve a más de una audiencia.
- El modo de proxy por loopback en el mismo host debe usar `allowLoopback` solo cuando los procesos locales sean de confianza y el proxy controle los encabezados de identidad.

Ejecuta `openclaw security audit --deep` después de cambios de proxy. Los hallazgos de trusted-proxy
son deliberadamente de alta señal porque el proxy se convierte en el límite de autenticación.

## Revisión de herramientas y sandbox

Antes de exponer un agente a remitentes remotos:

- Confirma qué sesiones se ejecutan en el host frente al sandbox.
- Deniega o exige aprobación para exec en el host.
- Mantén las herramientas elevadas deshabilitadas salvo que un remitente específico y de confianza las necesite.
- Evita herramientas de navegador, canvas, node, cron, gateway y session-spawn para superficies de mensajería abiertas o semiabiertas.
- Mantén los montajes bind restringidos y evita rutas de credenciales, home, socket de Docker y del sistema.
- Usa gateways, usuarios del SO u hosts separados para límites de confianza materialmente distintos.

Si los usuarios remotos no son plenamente confiables, el aislamiento debe venir de despliegues
separados, no solo de prompts o etiquetas de sesión.

## Validación posterior al cambio

Después de cada cambio de exposición:

1. Vuelve a ejecutar `openclaw security audit --deep`.
2. Prueba una conexión autorizada correcta.
3. Prueba que se deniegue un remitente o una sesión de navegador no autorizados.
4. Confirma que los registros redacten secretos.
5. Confirma que el enrutamiento de DM/grupo alcance solo al agente previsto.
6. Confirma que las herramientas de alto impacto pidan aprobación o se denieguen.
7. Documenta las advertencias residuales aceptadas.

No continúes con el siguiente cambio de exposición hasta entender el actual.

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
2. Rota tokens/contraseñas del Gateway y credenciales de integración afectadas.
3. Elimina `"*"` y remitentes inesperados de las listas de permitidos.
4. Revisa registros de auditoría recientes, historial de ejecuciones, llamadas de herramientas y cambios de configuración.
5. Vuelve a ejecutar `openclaw security audit --deep`.
6. Vuelve a habilitar el acceso con el patrón más restringido que satisfaga el flujo de trabajo.

## Lista de verificación de revisión

- El Gateway sigue siendo solo por loopback salvo que haya un motivo documentado.
- El acceso que no sea por loopback tiene autenticación, firewall y ninguna ruta directa pública.
- Los despliegues trusted-proxy tienen IP de proxy y controles de encabezados estrictos.
- Los DM usan emparejamiento o listas de permitidos, no acceso abierto de forma predeterminada.
- Los grupos requieren menciones o listas de permitidos explícitas.
- Los canales compartidos no alcanzan credenciales personales.
- Las sesiones non-main se ejecutan en modo sandbox.
- Exec en el host y las herramientas elevadas se deniegan o están protegidas por aprobación.
- Los registros redactan secretos.
- Los hallazgos críticos de auditoría están resueltos.
- Los pasos de reversión están probados y documentados.
