---
read_when:
    - Auditando por qué la refactorización de la entrada del canal añadió demasiado código
    - Mover la política de rutas, comandos, eventos, activación o grupos de acceso de los plugins incluidos al núcleo
    - Revisando si un ayudante de entrada de canal elimina realmente código de Plugin incluido
sidebarTitle: Ingress core deletion
summary: Plan que prioriza la eliminación para trasladar al núcleo la lógica de integración repetida de entrada de canales.
title: Plan de eliminación del núcleo de ingreso
x-i18n:
    generated_at: "2026-05-11T20:51:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Plan de eliminación del núcleo de ingreso

La refactorización de ingreso no está sana mientras añade miles de líneas netas. La centralización del núcleo solo cuenta cuando el código de producción de Plugins empaquetados se reduce y la compatibilidad antigua del SDK de terceros queda aislada en shims de SDK/núcleo.

Forma de ejecución deseada:

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

Los Plugins empaquetados no deben volver a traducir el ingreso a formas locales `AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` o `{ allowed, reasonCode }`, salvo que ese tipo sea API pública de Plugin.

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

La eliminación de solo comentarios no cuenta como limpieza. La pasada de presupuesto anterior fue demasiado generosa porque incluyó comentarios explicativos restaurados de QQBot; este documento rastrea únicamente el movimiento de código ejecutable, documentación y pruebas.

Vuelve a medir después de cada ola de limpieza:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnóstico

La primera pasada añadió el kernel de ingreso compartido, pero dejó demasiada autorización local de Plugin junto a él:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Eso duplica el modelo. La producción del núcleo creció unas 3.376 líneas, mientras que la producción de Plugins empaquetados es 1.240 líneas menor. Eso es mejor que la primera pasada, pero no está dentro del presupuesto mínimo. La solución sigue siendo eliminar primero:

- eliminar DTOs de Plugins que solo renombran campos de ingreso
- eliminar pruebas que solo afirman la forma del wrapper
- añadir helpers de núcleo solo cuando el mismo parche elimine código de Plugin empaquetado
- mantener la compatibilidad antigua del SDK solo en shims de SDK/núcleo
- reempaquetar el núcleo después de que la eliminación de wrappers exponga la forma estable

## Puntos críticos

Archivos positivos de producción empaquetada que aún deben reducirse:

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

La rama aún no está dentro del presupuesto mínimo. El trabajo restante relevante para revisión debe eliminar flujo de autorización repetido, andamiaje de turnos o pruebas de wrappers antes de añadir otra abstracción de núcleo.

## Lectura Actual Del Código

El seam sano del núcleo ya existe en `src/channels/message-access/runtime.ts`: posee adaptadores de identidad, allowlists efectivas, lecturas del almacén de emparejamiento, descriptores de ruta, presets de comando/evento, grupos de acceso y la proyección final resuelta `ResolvedChannelMessageIngress`.

El crecimiento restante es sobre todo pegamento de Plugin en capas encima de ese seam:

- `extensions/telegram/src/ingress.ts` envuelve decisiones del núcleo en helpers de comandos/eventos específicos de Telegram, y luego los sitios de llamada siguen pasando allowlists normalizadas y listas de propietarios precalculadas.
- `extensions/discord/src/monitor/dm-command-auth.ts`, `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts` y `extensions/matrix/src/matrix/monitor/access-state.ts` aún mantienen DTOs de políticas locales o nombres de decisión heredados junto al ingreso.
- `extensions/signal/src/monitor/access-policy.ts` conserva correctamente la normalización de identidad de Signal y las respuestas de emparejamiento locales, pero aún tiene un seam de wrapper que debería colapsar en consumo directo de ingreso.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`, `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` y `extensions/zalouser/src/monitor.ts` aún repiten el ensamblaje de ruta/sobre/turno que puede moverse a helpers de turno compartidos fuera del kernel de ingreso.

Conclusión: mover más código al núcleo solo es útil si elimina estas capas de wrapper de Plugin en el mismo parche. Añadir otra abstracción mientras se dejan los retornos de wrappers en su sitio repite el error.

## Límite

El núcleo posee la política genérica:

- normalización y coincidencia de allowlist
- expansión y diagnósticos de grupos de acceso
- lecturas de allowlist de DM del almacén de emparejamiento
- compuertas de ruta, remitente, comando, evento y activación
- mapeo de admisión: despachar, descartar, omitir, observar, emparejamiento
- estado redactado, decisiones, diagnósticos y proyecciones de compatibilidad del SDK
- descriptores genéricos reutilizables para identidad, ruta, comando, evento, activación y resultados

Los Plugins poseen hechos de transporte y efectos secundarios:

- autenticidad de webhook/socket/solicitud
- extracción de identidad de plataforma y consultas de API
- valores predeterminados de política específicos del canal
- entrega de desafíos de emparejamiento, respuestas, confirmaciones, reacciones, escritura, medios, historial, configuración, doctor, estado, logs y texto orientado al usuario

El núcleo debe seguir siendo agnóstico del canal: sin Discord, Slack, Telegram, Matrix, sala, gremio, espacio, cliente API ni valor predeterminado específico de Plugin en `src/channels/message-access`.

## Regla De Aceptación

Cada nuevo helper de núcleo debe eliminar inmediatamente código de producción de Plugin empaquetado.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Detente y rediseña si:

- aumentan las LOC de producción de Plugins
- las pruebas crecen más rápido de lo que se reduce la producción
- una ruta caliente empaquetada devuelve un DTO que solo renombra `ResolvedChannelMessageIngress`
- un helper de núcleo necesita un id de canal, objeto de plataforma, cliente API o valor predeterminado específico de canal

## Paquetes De Trabajo

1. Congelar el presupuesto.
   Poner LOC en el PR, mantener verde el lint de ingreso obsoleto e incluir LOC antes/después en los commits de limpieza.

2. Eliminar seams finos de DTO.
   Reemplazar retornos de wrappers locales de Plugin por `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`, `routeAccess` o `ingress` directamente. Empezar con QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage y Tlon. Eliminar pruebas de forma de wrapper; conservar pruebas de comportamiento.

3. Añadir clasificación de resultados solo con eliminaciones.
   Un clasificador genérico puede exponer `dispatch`, `pairing-required`, `skip-activation`, `drop-command`, `drop-route`, `drop-sender` y `drop-ingress`. Debe derivar del grafo de decisiones, no de cadenas de motivo, y migrar al menos tres Plugins en el mismo parche.

4. Añadir constructores de descriptores de ruta solo con eliminaciones.
   Los helpers genéricos de destino de ruta y remitente de ruta son aceptables solo si reducen inmediatamente Plugins con muchas rutas: Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo y Zalo Personal.

5. Añadir presets de comando/evento solo con eliminaciones.
   Centralizar formas de comando de texto, comando nativo, callback y origen-sujeto. Los consumidores de comandos deben usar no autorizado por defecto cuando no se ejecutó ninguna compuerta de comando; los eventos no deben iniciar emparejamiento.

6. Añadir presets de identidad solo donde eliminen boilerplate.
   Se permiten helpers de id estable, id estable más alias, teléfono/e164 y multiidentificador cuando los valores sin procesar entran solo en la entrada del adaptador y el estado redactado conserva ids/recuentos opacos.

7. Compartir ensamblaje de turnos autorizados.
   Fuera del kernel de ingreso, eliminar andamiaje repetido de ruta/sobre/contexto/respuesta de QA Channel, IRC, Nextcloud Talk, Zalo y Zalo Personal. El núcleo puede poseer la secuencia de ruta/sesión/sobre/despacho; los Plugins conservan la entrega y el contexto específico del canal.

8. Aislar la compatibilidad.
   Los helpers obsoletos del SDK siguen siendo compatibles a nivel de código fuente, pero las rutas calientes empaquetadas no deben importar fachadas obsoletas de ingreso o auth de comando. Las pruebas de compatibilidad deben usar Plugins falsos de terceros, no internos de Plugins empaquetados.

9. Reempaquetar el núcleo.
   Después de la eliminación de wrappers, colapsar módulos de un solo uso, eliminar exports no usados, mover la proyección de compatibilidad fuera de las rutas calientes y conservar pruebas enfocadas para identidad, ruta, comando/evento, activación, grupos de acceso y shims de compatibilidad.

## Olas De Eliminación

Ejecuta estas en orden. Cada ola debe reducir las LOC de producción empaquetada.

1. Colapso de wrappers, delta esperado de Plugin: -400 a -600.
   Reemplazar tipos de resultado locales de Plugin `resolveXAccess`, `resolveXCommandAccess` y `accessFromIngress` con lecturas directas de `ResolvedChannelMessageIngress`. Primeros objetivos: auth de comandos DM de Discord, política de Feishu, estado de acceso de Matrix, ingreso de Telegram, política de acceso de Signal, adaptador SDK de QQBot.

2. Helpers de resultados compartidos, delta esperado de Plugin: -200 a -350.
   Añadir un clasificador genérico solo si elimina escaleras repetidas de `shouldBlockControlCommand`, emparejamiento, omisión de activación, bloqueo de ruta y bloqueo de remitente en al menos tres Plugins.

3. Constructores de descriptores de ruta, delta esperado de Plugin: -200 a -350.
   Mover al núcleo helpers de ensamblaje repetido de descriptor de destino de ruta y remitente de ruta. Primeros objetivos: Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Compartición de ensamblaje de turnos, delta esperado de Plugin: -250 a -450.
   Usar secuencia común de ruta/sesión/sobre/despacho para Plugins de entrada simples. Primeros objetivos: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Reempaquetado del núcleo, delta esperado del núcleo: -300 a -700.
   Después de que los Plugins consuman proyecciones de runtime directamente, eliminar módulos de un solo uso, fusionar archivos pequeños de vuelta en `runtime.ts` o hermanos enfocados, y mantener los archivos de compatibilidad del SDK separados de las rutas calientes empaquetadas.

6. Poda de pruebas, delta esperado de pruebas: -300 a -600.
   Eliminar pruebas que solo afirman formas de wrapper eliminadas. Conservar pruebas de comportamiento para denegación de comandos, fallback de grupos, coincidencia origen-sujeto, omisión de activación, grupos de acceso, emparejamiento y redacción.

Forma mínima esperada para aterrizar después de estas olas:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## No Mover

No muevas los valores predeterminados de configuración de plataforma, la UX de configuración, el texto de doctor/fix, las búsquedas de API,
las comprobaciones de presencia de propietario de Slack, el manejo de alias/verificación de Matrix, el análisis de callbacks de Telegram,
el análisis de sintaxis de comandos, el registro de comandos nativos, el análisis de payloads de reacciones, las respuestas de emparejamiento, las respuestas de comandos, los acks, la escritura, los medios, el historial,
ni los logs.

## Verificación

Bucle local dirigido:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Usa Testbox para pruebas amplias de gates de cambios/suite completa una vez que la tendencia de LOC esté
dentro del presupuesto.

Cada paquete de trabajo registra:

- LOC antes/después por categoría
- wrappers de plugins eliminados
- LOC de nuevos helpers de core, si los hay
- pruebas dirigidas ejecutadas
- lista restante de hotspots

## Criterios de Salida

- las importaciones de producción incluidas no usan fachadas obsoletas de channel-access ni command-auth
- el código de compatibilidad está aislado en los puntos de integración de SDK/core
- los plugins incluidos consumen directamente proyecciones de ingreso o resultados genéricos
- el LOC de producción de plugins es al menos 1.500 neto negativo frente a `origin/main`
- el LOC de producción de core es <= +1.500, o cualquier exceso se compensa mientras el total se mantiene
  <= +2.000
- pruebas representativas cubren la redacción, la ruta, comando/evento, activación,
  grupo de acceso y comportamiento de fallback específico del canal
