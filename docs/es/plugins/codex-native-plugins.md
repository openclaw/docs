---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen Plugins nativos de Codex
    - Estás migrando plugins Codex seleccionados por OpenAI instalados desde el código fuente
    - Estás solucionando problemas de codexPlugins, inventario de aplicaciones, acciones destructivas o diagnósticos de aplicaciones de Plugin
summary: Configura los plugins nativos de Codex migrados para agentes de OpenClaw en modo Codex
title: Plugins nativos de Codex
x-i18n:
    generated_at: "2026-06-27T12:10:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La compatibilidad nativa con Plugins de Codex permite que un agente de OpenClaw en modo Codex use las capacidades propias de apps y Plugins de app-server de Codex dentro del mismo hilo de Codex que gestiona el turno de OpenClaw.

OpenClaw no traduce los Plugins de Codex en herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw. Las llamadas de Plugins permanecen en la transcripción nativa de Codex, y app-server de Codex es propietario de la ejecución MCP respaldada por apps.

Usa esta página después de que el [harness de Codex](/es/plugins/codex-harness) base esté funcionando.

## Requisitos

- El runtime del agente de OpenClaw seleccionado debe ser el harness nativo de Codex.
- `plugins.entries.codex.enabled` debe ser true.
- `plugins.entries.codex.config.codexPlugins.enabled` debe ser true.
- V1 solo admite Plugins `openai-curated` que la migración observó como instalados desde el origen en el directorio home de Codex de origen.
- El app-server de Codex de destino debe poder ver el marketplace, el Plugin y el inventario de apps esperados.

`codexPlugins` no tiene efecto en ejecuciones de OpenClaw, ejecuciones normales del proveedor OpenAI, vinculaciones de conversación ACP ni otros harnesses porque esas rutas no crean hilos de app-server de Codex con configuración nativa de `apps`.

El acceso a Codex del lado de OpenAI, la disponibilidad de apps y los controles de apps/Plugins del espacio de trabajo provienen de la cuenta de Codex con sesión iniciada. Para el modelo de cuenta y administración de OpenAI, consulta [Usar Codex con tu plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Inicio rápido

Previsualiza la migración desde el directorio home de Codex de origen:

```bash
openclaw migrate codex --dry-run
```

Usa verificación estricta de apps de origen cuando quieras que la migración compruebe la accesibilidad de las apps de origen antes de planificar la activación nativa de Plugins:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Aplica la migración cuando el plan se vea correcto:

```bash
openclaw migrate apply codex --yes
```

La migración escribe entradas explícitas de `codexPlugins` para Plugins elegibles y llama a `plugin/install` de app-server de Codex para los Plugins seleccionados. Una configuración migrada típica se ve así:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Después de cambiar `codexPlugins`, las nuevas conversaciones de Codex toman automáticamente el conjunto de apps actualizado. Usa `/new` o `/reset` para actualizar la conversación actual. No se requiere reiniciar el Gateway para cambios de activación o desactivación de Plugins.

## Administrar Plugins desde el chat

Usa `/codex plugins` cuando quieras inspeccionar o cambiar Plugins nativos de Codex configurados desde el mismo chat donde operas el harness de Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` es un alias de `/codex plugins list`. La salida de la lista muestra las claves de Plugin configuradas, el estado activado/desactivado, el nombre del Plugin de Codex y el marketplace de `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` y `disable` solo escriben en la configuración de OpenClaw en `~/.openclaw/openclaw.json`; no editan `~/.codex/config.toml` ni instalan nuevos Plugins de Codex. Solo el propietario o un cliente de Gateway con el alcance `operator.admin` puede cambiar el estado del Plugin.

Activar un Plugin configurado también activa el interruptor global `codexPlugins.enabled`. Si el Plugin se escribió como desactivado porque la migración devolvió `auth_required`, vuelve a autorizar la app en Codex antes de activarlo en OpenClaw.

## Cómo funciona la configuración nativa de Plugins

La integración tiene tres estados separados:

- Instalado: Codex tiene el paquete local del Plugin en el runtime del app-server de destino.
- Activado: la configuración de OpenClaw está dispuesta a hacer que el Plugin esté disponible para turnos del harness de Codex.
- Accesible: app-server de Codex confirma que las entradas de app del Plugin están disponibles para la cuenta activa y pueden asignarse a la identidad de Plugin migrada.

La migración es el paso duradero de instalación/elegibilidad. Durante la planificación, OpenClaw lee los detalles de `plugin/read` de Codex de origen y comprueba que la respuesta de la cuenta de app-server de Codex de origen sea una cuenta con suscripción a ChatGPT. Las respuestas de cuenta que no son de ChatGPT o que faltan omiten los Plugins respaldados por apps con `codex_subscription_required`. De forma predeterminada, la migración no llama a `app/list` de origen; los Plugins de origen respaldados por apps que superan la puerta de cuenta se planifican sin verificación de accesibilidad de apps de origen, y los fallos de transporte de búsqueda de cuenta se omiten con `codex_account_unavailable`. Con `--verify-plugin-apps`, la migración toma una instantánea nueva de `app/list` de origen y requiere que cada app propia esté presente, activada y accesible antes de planificar la activación nativa. En ese modo, los fallos de transporte de búsqueda de cuenta pasan a la puerta de inventario de apps de origen. El inventario de apps en runtime es la comprobación de accesibilidad de la sesión de destino después de la migración. La configuración de sesión del harness de Codex calcula entonces una configuración restrictiva de apps de hilo para las apps de Plugin activadas y accesibles.

La configuración de apps de hilo se calcula cuando OpenClaw establece una sesión del harness de Codex o reemplaza una vinculación de hilo de Codex obsoleta. No se recalcula en cada turno, por lo que `/codex plugins enable` y `/codex plugins disable` afectan a nuevas conversaciones de Codex. Usa `/new` o `/reset` cuando la conversación actual deba tomar el conjunto de apps actualizado.

## Límite de compatibilidad de V1

V1 es intencionalmente estrecho:

- Solo son elegibles para migración los Plugins `openai-curated` que ya estaban instalados en el inventario de app-server de Codex de origen.
- Los Plugins de origen respaldados por apps deben superar la puerta de suscripción en tiempo de migración. `--verify-plugin-apps` añade la puerta de inventario de apps de origen. Las cuentas bloqueadas por suscripción y, en modo de verificación, las apps de origen inaccesibles, desactivadas o faltantes, o los fallos de actualización del inventario de apps de origen, se informan como elementos manuales omitidos en lugar de entradas de configuración activadas. Los detalles de Plugin ilegibles se omiten antes de la puerta de inventario de apps de origen.
- La migración escribe identidades de Plugin explícitas con `marketplaceName` y `pluginName`; no escribe rutas de caché locales `marketplacePath`.
- `codexPlugins.enabled` es el interruptor global de activación.
- No hay comodín `plugins["*"]` ni clave de configuración que conceda autoridad arbitraria de instalación.
- Los marketplaces no compatibles, paquetes de Plugin en caché, hooks y archivos de configuración de Codex se conservan en el informe de migración para revisión manual.

## Inventario de apps y propiedad

OpenClaw lee el inventario de apps de Codex mediante `app/list` de app-server, lo almacena en caché durante una hora y actualiza de forma asíncrona las entradas obsoletas o faltantes. La caché está solo en memoria; reiniciar la CLI o el Gateway la descarta, y OpenClaw la reconstruye a partir de la siguiente lectura de `app/list`.

La migración y el runtime usan claves de caché separadas:

- La verificación de migración de origen usa el directorio home de Codex de origen y las opciones de inicio de app-server de origen. Esto se ejecuta solo cuando `--verify-plugin-apps` está configurado, y fuerza un recorrido nuevo de `app/list` de origen para esa ejecución de planificación.
- La configuración de runtime de destino usa la identidad de app-server de Codex del agente de destino cuando construye la configuración de apps de hilo de Codex. La activación de un Plugin invalida esa clave de caché de destino y luego fuerza su actualización después de `plugin/install`.

Una app de Plugin se expone solo cuando OpenClaw puede asignarla de vuelta al Plugin migrado mediante propiedad estable:

- id exacto de app del detalle del Plugin
- nombre conocido del servidor MCP
- metadatos estables únicos

La propiedad basada solo en nombre visible o ambigua se excluye hasta que la siguiente actualización de inventario demuestre la propiedad.

## Configuración de apps de hilo

OpenClaw inyecta un parche restrictivo de `config.apps` para el hilo de Codex: `_default` está desactivado y solo las apps propiedad de Plugins migrados activados están activadas.

OpenClaw establece `destructive_enabled` a nivel de app desde la política efectiva global o por Plugin `allow_destructive_actions` y permite que Codex aplique los metadatos de herramientas destructivas desde sus anotaciones nativas de herramientas de app. `true`, `"auto"` y `"always"` establecen `destructive_enabled: true`; `false` lo establece en false. La configuración de app `_default` se desactiva con `open_world_enabled: false`. Las apps de Plugin activadas se emiten con `open_world_enabled: true`; OpenClaw no expone una perilla separada de política open-world de Plugin ni mantiene listas de denegación por nombre de herramienta destructiva por Plugin.

El modo de aprobación de herramientas es automático de forma predeterminada para apps de Plugin, de modo que las herramientas de lectura no destructivas puedan ejecutarse sin una UI de aprobación en el mismo hilo. Las herramientas destructivas siguen controladas por la política `destructive_enabled` de cada app.

## Política de acciones destructivas

Las elicitaciones destructivas de Plugins se permiten de forma predeterminada para Plugins de Codex migrados, mientras que los esquemas inseguros y la propiedad ambigua siguen fallando de forma cerrada:

- `allow_destructive_actions` global tiene como valor predeterminado `true`.
- `allow_destructive_actions` por Plugin anula la política global para ese Plugin.
- Cuando la política es `false`, OpenClaw devuelve un rechazo determinista.
- Cuando la política es `true`, OpenClaw acepta automáticamente solo esquemas seguros que puede asignar a una respuesta de aprobación, como un campo booleano de aprobación.
- Cuando la política es `"auto"`, OpenClaw expone acciones destructivas de Plugin a Codex, pero convierte las elicitaciones de aprobación MCP con propiedad demostrada en aprobaciones de Plugin de OpenClaw antes de devolver la respuesta de aprobación de Codex.
- Cuando la política es `"always"`, OpenClaw usa la misma puerta de escritura/destructiva de Codex que `"auto"`, borra las anulaciones duraderas de aprobación por herramienta de Codex para la app antes de que el hilo comience, y solo ofrece aprobación o denegación de un solo uso para que las aprobaciones duraderas no puedan suprimir solicitudes posteriores de acciones de escritura.
- La identidad de Plugin faltante, la propiedad ambigua, un id de turno faltante, un id de turno incorrecto o un esquema de elicitación inseguro rechazan en lugar de solicitar.

## Solución de problemas

**`auth_required`:** la migración instaló el Plugin, pero una de sus apps todavía necesita autenticación. La entrada explícita del Plugin se escribe desactivada hasta que vuelvas a autorizarlo y lo actives.

**`app_inaccessible`, `app_disabled` o `app_missing`:**
la migración no instaló el Plugin porque el inventario de apps de Codex de origen no mostraba todas las apps propias como presentes, activadas y accesibles mientras `--verify-plugin-apps` estaba configurado. Vuelve a autorizar o activa la app en Codex y luego vuelve a ejecutar la migración con `--verify-plugin-apps`.

**`app_inventory_unavailable`:** la migración no instaló el Plugin porque se solicitó verificación estricta de apps de origen y falló la actualización del inventario de apps de Codex de origen. Corrige el acceso a app-server de Codex de origen o reintenta sin `--verify-plugin-apps` si aceptas el plan más rápido con puerta de cuenta.

**`codex_subscription_required`:** la migración no instaló el Plugin respaldado por app porque la cuenta de app-server de Codex de origen no tenía sesión iniciada con una cuenta con suscripción a ChatGPT. Inicia sesión en la app de Codex con autenticación de suscripción y luego vuelve a ejecutar la migración.

**`codex_account_unavailable`:** la migración no instaló el Plugin respaldado por app porque no se pudo leer la cuenta de app-server de Codex de origen. Corrige la autenticación de app-server de Codex de origen o vuelve a ejecutar con `--verify-plugin-apps` si quieres que el inventario de apps de origen decida la elegibilidad cuando falle la búsqueda de cuenta.

**`marketplace_missing` o `plugin_missing`:** el app-server de Codex de destino no puede ver el marketplace o Plugin `openai-curated` esperado. Vuelve a ejecutar la migración contra el runtime de destino o inspecciona el estado de Plugins de app-server de Codex.

**`app_inventory_missing` o `app_inventory_stale`:** la preparación de apps provino de una caché vacía u obsoleta. OpenClaw programa una actualización asíncrona y excluye apps de Plugin hasta que se conozcan la propiedad y la preparación.

**`app_ownership_ambiguous`:** el inventario de apps solo coincidió por nombre visible, por lo que la app no se expone al hilo de Codex.

**La configuración cambió, pero el agente no puede ver el Plugin:** usa `/codex plugins list` para confirmar el estado configurado y luego usa `/new` o `/reset`. Las vinculaciones de hilos de Codex existentes conservan la configuración de apps con la que iniciaron hasta que OpenClaw establece una nueva sesión de harness o reemplaza una vinculación obsoleta.

**Se rechaza la acción destructiva:** comprueba los valores globales y por Plugin de
`allow_destructive_actions`. Incluso cuando la política es true, `"auto"` o
`"always"`, los esquemas de solicitud inseguros y la identidad ambigua del Plugin siguen fallando
en modo cerrado.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Tiempo de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Referencia de configuración](/es/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrar CLI](/es/cli/migrate)
