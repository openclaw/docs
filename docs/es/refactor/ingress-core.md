---
read_when:
    - Auditando por qué la refactorización de la entrada de canales añadió demasiado código
    - Mover políticas de ruta, comando, evento, activación o grupo de acceso desde plugins incluidos al núcleo
    - Revisando si un auxiliar de entrada de canal elimina realmente el código de Plugin incluido
sidebarTitle: Ingress core deletion
summary: Plan centrado en la eliminación para trasladar al núcleo el código de integración repetido de entrada de canales.
title: Plan de eliminación del núcleo de ingreso
x-i18n:
    generated_at: "2026-05-12T00:59:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Plan de eliminación del núcleo de ingreso

La refactorización de ingreso no está en buen estado mientras añade miles de líneas netas. La centralización del núcleo solo cuenta cuando el código de producción de plugins incluidos se vuelve más pequeño y la compatibilidad antigua del SDK de terceros queda en cuarentena en adaptadores de SDK/núcleo.

Forma de runtime deseada:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Los plugins incluidos no deberían traducir el ingreso de vuelta a formas locales `AccessResult`,
`GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` o
`{ allowed, reasonCode }`, salvo que ese tipo sea API pública del plugin.

## Presupuesto

Medido contra la base de fusión del PR con `origin/main`, incluidos los archivos sin seguimiento.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Limpieza mínima restante:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

La eliminación de solo comentarios no cuenta como limpieza. La pasada anterior de presupuesto fue demasiado generosa porque incluyó comentarios explicativos restaurados de QQBot; este documento rastrea solo el movimiento de código ejecutable, documentación y pruebas.

Vuelve a medir después de cada oleada de limpieza:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnóstico

La primera pasada añadió el núcleo de ingreso compartido y luego dejó demasiada autorización local de plugins a su lado:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Eso duplica el modelo. La producción del núcleo creció unas 3.376 líneas, mientras que la producción de plugins incluidos es 1.240 líneas más pequeña. Eso es mejor que la primera pasada, pero no está dentro del presupuesto mínimo. La corrección sigue siendo eliminar primero:

- eliminar DTOs de plugins que solo renombran campos de ingreso
- eliminar pruebas que solo verifican la forma del wrapper
- añadir helpers del núcleo solo cuando el mismo parche elimine código de plugins incluidos
- mantener la compatibilidad antigua del SDK solo en adaptadores de SDK/núcleo
- reempaquetar el núcleo después de que la eliminación de wrappers exponga la forma estable

## Puntos críticos

Archivos de producción incluida positivos que aún necesitan reducirse:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

La rama todavía no está dentro del presupuesto mínimo. El trabajo restante relevante para revisión debería eliminar flujo de autorización repetido, andamiaje de turnos o pruebas de wrappers antes de añadir otra abstracción del núcleo.

## Lectura del código actual

El límite saludable del núcleo ya existe en `src/channels/message-access/runtime.ts`:
posee adaptadores de identidad, allowlists efectivas, lecturas del almacén de emparejamiento, descriptores de ruta, presets de comando/evento, grupos de acceso y la proyección final resuelta `ResolvedChannelMessageIngress`.

El crecimiento restante es principalmente pegamento de plugins colocado encima de ese límite:

- `extensions/telegram/src/ingress.ts` envuelve decisiones del núcleo en helpers de comando/evento específicos de Telegram, y luego los sitios de llamada aún pasan allowlists normalizadas y listas de propietarios precalculadas.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  y `extensions/matrix/src/matrix/monitor/access-state.ts` todavía mantienen
  DTOs de política locales o nombres de decisión heredados junto al ingreso.
- `extensions/signal/src/monitor/access-policy.ts` mantiene correctamente la normalización de identidad de Signal y las respuestas de emparejamiento en local, pero aún tiene un límite de wrapper que debería colapsar en consumo directo de ingreso.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` y
  `extensions/zalouser/src/monitor.ts` todavía repiten el ensamblaje de ruta/sobre/turno que puede moverse a helpers de turno compartidos fuera del núcleo de ingreso.

Conclusión: mover más código al núcleo solo es útil si elimina estas capas de wrapper de plugins en el mismo parche. Añadir otra abstracción mientras se dejan retornos de wrapper en su lugar repite el error.

## Límite

El núcleo posee la política genérica:

- normalización y coincidencia de allowlists
- expansión y diagnósticos de grupos de acceso
- lecturas de allowlist de DM del almacén de emparejamiento
- puertas de ruta, remitente, comando, evento y activación
- mapeo de admisión: despachar, descartar, omitir, observar, emparejamiento
- estado redactado, decisiones, diagnósticos y proyecciones de compatibilidad del SDK
- descriptores genéricos reutilizables para identidad, ruta, comando, evento, activación y resultados

Los plugins poseen los datos de transporte y efectos secundarios:

- autenticidad de webhook/socket/solicitud
- extracción de identidad de plataforma y búsquedas de API
- valores predeterminados de política específicos del canal
- entrega de desafíos de emparejamiento, respuestas, confirmaciones, reacciones, escritura, medios, historial,
  configuración, doctor, estado, registros y texto visible para el usuario

El núcleo debe permanecer agnóstico del canal: sin Discord, Slack, Telegram, Matrix, sala, servidor, espacio, cliente de API ni valor predeterminado específico de plugin en
`src/channels/message-access`.

## Regla de aceptación

Cada nuevo helper del núcleo debe eliminar código de producción de plugins incluidos inmediatamente.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Detente y rediseña si:

- las LOC de producción de plugins aumentan
- las pruebas crecen más rápido de lo que se reduce la producción
- una ruta caliente incluida devuelve un DTO que solo renombra `ResolvedChannelMessageIngress`
- un helper del núcleo necesita un id de canal, objeto de plataforma, cliente de API o valor predeterminado específico de canal

## Paquetes de trabajo

1. Congelar el presupuesto.
   Pon las LOC en el PR, mantén verde el lint de ingreso obsoleto e incluye LOC antes/después en los commits de limpieza.

2. Eliminar límites DTO delgados.
   Reemplaza retornos de wrappers locales de plugins por `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess` o `ingress` directamente. Empieza con QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage y Tlon. Elimina pruebas de forma de wrapper; conserva pruebas de comportamiento.

3. Añadir clasificación de resultados solo con eliminaciones.
   Un clasificador genérico puede exponer `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` y
   `drop-ingress`. Debe derivar del grafo de decisiones, no de cadenas de motivo, y migrar al menos tres plugins en el mismo parche.

4. Añadir constructores de descriptores de ruta solo con eliminaciones.
   Los helpers genéricos de destino de ruta y remitente de ruta son aceptables solo si reducen inmediatamente plugins con muchas rutas: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo y Zalo Personal.

5. Añadir presets de comando/evento solo con eliminaciones.
   Centraliza formas de comando de texto, comando nativo, callback y origen-sujeto.
   Los consumidores de comandos deben usar no autorizado por defecto cuando no se ejecutó ninguna puerta de comando; los eventos no deben iniciar emparejamiento.

6. Añadir presets de identidad solo donde eliminen código repetitivo.
   Se permiten helpers de id estable, id estable más alias, teléfono/e164 y multiidentificador cuando los valores sin procesar entran solo en la entrada del adaptador y el estado redactado conserva ids/recuentos opacos.

7. Compartir ensamblaje de turnos autorizados.
   Fuera del núcleo de ingreso, elimina andamiaje repetido de ruta/sesión/sobre/contexto/respuesta de QA Channel, IRC, Nextcloud Talk, Zalo y Zalo Personal.
   El núcleo puede poseer la secuenciación de ruta/sesión/sobre/despacho; los plugins conservan la entrega y el contexto específico del canal.

8. Poner la compatibilidad en cuarentena.
   Los helpers obsoletos del SDK mantienen compatibilidad de código fuente, pero las rutas calientes incluidas no deben importar fachadas obsoletas de ingreso o autorización de comandos. Las pruebas de compatibilidad deberían usar plugins falsos de terceros, no internos de plugins incluidos.

9. Reempaquetar el núcleo.
   Después de la eliminación de wrappers, colapsa módulos de un solo uso, elimina exports sin usar, mueve la proyección de compatibilidad fuera de las rutas calientes y conserva pruebas enfocadas para identidad, ruta, comando/evento, activación, grupos de acceso y adaptadores de compatibilidad.

## Oleadas de eliminación

Ejecútalas en orden. Cada oleada debe reducir las LOC de producción incluida.

1. Colapso de wrappers, delta de plugin esperado: -400 a -600.
   Reemplaza tipos de resultado locales de plugins `resolveXAccess`, `resolveXCommandAccess` y
   `accessFromIngress` con lecturas directas de
   `ResolvedChannelMessageIngress`. Primeros objetivos: autorización de comando DM de Discord,
   política de Feishu, estado de acceso de Matrix, ingreso de Telegram, política de acceso de Signal,
   adaptador SDK de QQBot.

2. Helpers de resultados compartidos, delta de plugin esperado: -200 a -350.
   Añade un clasificador genérico solo si elimina escaleras repetidas de
   `shouldBlockControlCommand`, emparejamiento, omisión de activación, bloqueo de ruta y bloqueo de remitente en al menos tres plugins.

3. Constructores de descriptores de ruta, delta de plugin esperado: -200 a -350.
   Mueve el ensamblaje repetido de descriptores de destino de ruta y remitente de ruta a helpers del núcleo. Primeros objetivos: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal.

4. Uso compartido del ensamblaje de turnos, delta de plugin esperado: -250 a -450.
   Usa secuenciación común de ruta/sesión/sobre/despacho para plugins de entrada simples. Primeros objetivos: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Reempaquetado del núcleo, delta del núcleo esperado: -300 a -700.
   Después de que los plugins consuman proyecciones de runtime directamente, elimina módulos de un solo uso,
   fusiona archivos pequeños de vuelta en `runtime.ts` o hermanos enfocados, y mantén los archivos de compatibilidad del SDK separados de las rutas calientes incluidas.

6. Poda de pruebas, delta de pruebas esperado: -300 a -600.
   Elimina pruebas que solo verifican formas de wrapper eliminadas. Conserva pruebas de comportamiento para
   denegación de comandos, fallback de grupo, coincidencia de origen-sujeto, omisión de activación,
   grupos de acceso, emparejamiento y redacción.

Forma mínima esperada para aterrizaje después de estas oleadas:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## No mover

No muevas los valores predeterminados de configuración de plataforma, la UX de configuración, el texto de doctor/fix, las búsquedas de API,
las comprobaciones de presencia del propietario en Slack, el manejo de alias/verificación de Matrix, el análisis de callbacks de Telegram, el análisis de sintaxis de comandos, el registro de comandos nativos, el análisis de payloads de reacciones, las respuestas de emparejamiento, las respuestas de comandos, las confirmaciones, la escritura, los medios, el historial,
ni los registros.

## Verificación

Bucle local específico:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Usa Testbox para las comprobaciones amplias de cambios y la prueba de suite completa una vez que la tendencia de LOC esté
dentro del presupuesto.

Cada paquete de trabajo registra:

- LOC antes/después por categoría
- wrappers de plugins eliminados
- nuevos LOC de helpers del núcleo, si los hay
- pruebas específicas ejecutadas
- lista restante de hotspots

## Criterios de salida

- las importaciones de producción incluidas no usan fachadas obsoletas de channel-access ni de command-auth
- el código de compatibilidad está aislado en las costuras de SDK/núcleo
- los plugins incluidos consumen directamente proyecciones de ingreso o resultados genéricos
- los LOC de producción de plugins son al menos 1.500 netos negativos frente a `origin/main`
- los LOC de producción del núcleo son `<= +1,500`, o cualquier exceso se compensa mientras el total
  se mantiene `<= +2,000`
- pruebas representativas cubren redacción, ruta, comando/evento, activación,
  access-group y comportamiento de fallback específico del canal
