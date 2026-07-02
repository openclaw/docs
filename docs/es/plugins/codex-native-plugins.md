---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen Plugins nativos de Codex
    - Estás migrando plugins de Codex seleccionados por OpenAI instalados desde el código fuente
    - Estás solucionando problemas de codexPlugins, inventario de apps, acciones destructivas o diagnósticos de apps de Plugin
summary: Configura plugins nativos de Codex migrados para agentes de OpenClaw en modo Codex
title: Plugins nativos de Codex
x-i18n:
    generated_at: "2026-07-02T00:44:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La compatibilidad nativa con plugins de Codex permite que un agente de OpenClaw en modo Codex use las capacidades propias de apps y plugins de Codex app-server dentro del mismo hilo de Codex que gestiona el turno de OpenClaw.

OpenClaw no traduce los plugins de Codex a herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw. Las llamadas a plugins permanecen en la transcripción nativa de Codex, y Codex app-server es responsable de la ejecución MCP respaldada por apps.

Usa esta página después de que el [arnés de Codex](/es/plugins/codex-harness) base esté funcionando.

## Requisitos

- El runtime del agente de OpenClaw seleccionado debe ser el arnés nativo de Codex.
- `plugins.entries.codex.enabled` debe ser true.
- `plugins.entries.codex.config.codexPlugins.enabled` debe ser true.
- V1 solo admite plugins `openai-curated` que la migración observó como instalados desde el origen en el directorio de inicio de Codex de origen.
- El Codex app-server de destino debe poder ver el marketplace, el plugin y el inventario de apps esperados.

`codexPlugins` no tiene efecto en ejecuciones de OpenClaw, ejecuciones normales del proveedor OpenAI, enlaces de conversación ACP u otros arneses porque esas rutas no crean hilos de Codex app-server con configuración nativa de `apps`.

El acceso a Codex del lado de OpenAI, la disponibilidad de apps y los controles de apps/plugins del espacio de trabajo provienen de la cuenta de Codex con sesión iniciada. Para la cuenta de OpenAI y el modelo de administración, consulta [Usar Codex con tu plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Inicio rápido

Previsualiza la migración desde el directorio de inicio de Codex de origen:

```bash
openclaw migrate codex --dry-run
```

Usa verificación estricta de apps de origen cuando quieras que la migración compruebe la accesibilidad de las apps de origen antes de planificar la activación nativa de plugins:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Aplica la migración cuando el plan parezca correcto:

```bash
openclaw migrate apply codex --yes
```

La migración escribe entradas explícitas de `codexPlugins` para plugins elegibles y llama a `plugin/install` de Codex app-server para los plugins seleccionados. Una configuración migrada típica se ve así:

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

Después de cambiar `codexPlugins`, las nuevas conversaciones de Codex adoptan automáticamente el conjunto actualizado de apps. Usa `/new` o `/reset` para actualizar la conversación actual. No se requiere reiniciar el gateway para cambios de habilitación o deshabilitación de plugins.

## Gestionar plugins desde el chat

Usa `/codex plugins` cuando quieras inspeccionar o cambiar plugins nativos de Codex configurados desde el mismo chat donde operas el arnés de Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` es un alias de `/codex plugins list`. La salida de la lista muestra las claves de plugins configuradas, el estado activado/desactivado, el nombre del plugin de Codex y el marketplace desde `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` y `disable` escriben solo en la configuración de OpenClaw en `~/.openclaw/openclaw.json`; no editan `~/.codex/config.toml` ni instalan nuevos plugins de Codex. Solo el propietario o un cliente de gateway con el alcance `operator.admin` puede cambiar el estado de un plugin.

Habilitar un plugin configurado también activa el interruptor global `codexPlugins.enabled`. Si el plugin se escribió como deshabilitado porque la migración devolvió `auth_required`, vuelve a autorizar la app en Codex antes de habilitarla en OpenClaw.

## Cómo funciona la configuración nativa de plugins

La integración tiene tres estados separados:

- Instalado: Codex tiene el paquete local del plugin en el runtime del app-server de destino.
- Habilitado: la configuración de OpenClaw está dispuesta a poner el plugin a disposición de los turnos del arnés de Codex.
- Accesible: Codex app-server confirma que las entradas de app del plugin están disponibles para la cuenta activa y pueden mapearse a la identidad de plugin migrada.

La migración es el paso durable de instalación/elegibilidad. Durante la planificación, OpenClaw lee detalles de `plugin/read` de Codex de origen y comprueba que la respuesta de la cuenta del Codex app-server de origen sea una cuenta de suscripción de ChatGPT. Las respuestas de cuenta que no sean de ChatGPT o que falten omiten los plugins respaldados por apps con `codex_subscription_required`. De forma predeterminada, la migración no llama a `app/list` de origen; los plugins de origen respaldados por apps que pasan la puerta de cuenta se planifican sin verificación de accesibilidad de apps de origen, y los fallos de transporte de consulta de cuenta se omiten con `codex_account_unavailable`. Con `--verify-plugin-apps`, la migración toma una instantánea nueva de `app/list` de origen y exige que cada app poseída esté presente, habilitada y accesible antes de planificar la activación nativa. En ese modo, los fallos de transporte de consulta de cuenta pasan a la puerta de inventario de apps de origen. El inventario de apps en runtime es la comprobación de accesibilidad de la sesión de destino después de la migración. Luego, la configuración de sesión del arnés de Codex calcula una configuración restrictiva de apps de hilo para las apps de plugins habilitadas y accesibles.

La configuración de apps de hilo se calcula cuando OpenClaw establece una sesión del arnés de Codex o reemplaza un enlace obsoleto de hilo de Codex. No se recalcula en cada turno, por lo que `/codex plugins enable` y `/codex plugins disable` afectan a las nuevas conversaciones de Codex. Usa `/new` o `/reset` cuando la conversación actual deba adoptar el conjunto actualizado de apps.

## Límite de compatibilidad de V1

V1 es intencionalmente limitada:

- Solo los plugins `openai-curated` que ya estaban instalados en el inventario de Codex app-server de origen son elegibles para migración.
- Los plugins de origen respaldados por apps deben pasar la puerta de suscripción en el momento de la migración. `--verify-plugin-apps` añade la puerta de inventario de apps de origen. Las cuentas bloqueadas por suscripción y, en modo de verificación, las apps de origen inaccesibles, deshabilitadas, ausentes o los fallos de actualización del inventario de apps de origen se informan como elementos manuales omitidos en lugar de entradas de configuración habilitadas. Los detalles de plugin ilegibles se omiten antes de la puerta de inventario de apps de origen.
- La migración escribe identidades explícitas de plugins con `marketplaceName` y `pluginName`; no escribe rutas de caché locales `marketplacePath`.
- `codexPlugins.enabled` es el interruptor global de habilitación.
- No hay comodín `plugins["*"]` ni clave de configuración que otorgue autoridad de instalación arbitraria.
- Los marketplaces no admitidos, paquetes de plugins en caché, hooks y archivos de configuración de Codex se conservan en el informe de migración para revisión manual.

## Inventario de apps y propiedad

OpenClaw lee el inventario de apps de Codex mediante `app/list` de app-server, lo almacena en caché durante una hora y actualiza las entradas obsoletas o ausentes de forma asíncrona. La caché solo está en memoria; reiniciar la CLI o el gateway la descarta, y OpenClaw la reconstruye desde la siguiente lectura de `app/list`.

La migración y el runtime usan claves de caché separadas:

- La verificación de migración de origen usa el directorio de inicio de Codex de origen y las opciones de inicio de app-server de origen. Esto se ejecuta solo cuando se establece `--verify-plugin-apps`, y fuerza un recorrido nuevo de `app/list` de origen para esa ejecución de planificación.
- La configuración del runtime de destino usa la identidad de Codex app-server del agente de destino cuando construye la configuración de apps del hilo de Codex. La activación de plugins invalida esa clave de caché de destino y luego fuerza su actualización después de `plugin/install`.

Una app de plugin se expone solo cuando OpenClaw puede mapearla de vuelta al plugin migrado mediante propiedad estable:

- id exacto de app desde el detalle del plugin
- nombre conocido de servidor MCP
- metadatos estables únicos

La propiedad solo por nombre visible o ambigua se excluye hasta que la siguiente actualización de inventario demuestre la propiedad.

## Configuración de apps de hilo

OpenClaw inyecta un parche restrictivo de `config.apps` para el hilo de Codex: `_default` está deshabilitado y solo se habilitan las apps poseídas por plugins migrados habilitados.

OpenClaw establece `destructive_enabled` en el nivel de app desde la política efectiva global o por plugin de `allow_destructive_actions` y deja que Codex aplique los metadatos de herramientas destructivas desde sus anotaciones nativas de herramientas de app. `true`, `"auto"` y `"ask"` establecen `destructive_enabled: true`; `false` lo establece en false. La configuración de app `_default` está deshabilitada con `open_world_enabled: false`. Las apps de plugins habilitadas se emiten con `open_world_enabled: true`; OpenClaw no expone un control de política de mundo abierto separado para plugins ni mantiene listas de denegación de nombres de herramientas destructivas por plugin.

El modo de aprobación de herramientas es automático de forma predeterminada para apps de plugins, de modo que las herramientas de lectura no destructivas puedan ejecutarse sin una interfaz de aprobación en el mismo hilo. Las herramientas destructivas siguen controladas por la política `destructive_enabled` de cada app.

## Política de acciones destructivas

Las elicitaciones destructivas de plugins están permitidas de forma predeterminada para plugins de Codex migrados, mientras que los esquemas inseguros y la propiedad ambigua siguen fallando de forma cerrada:

- `allow_destructive_actions` global tiene `true` como valor predeterminado.
- `allow_destructive_actions` por plugin sobrescribe la política global para ese plugin.
- Cuando la política es `false`, OpenClaw devuelve un rechazo determinista.
- Cuando la política es `true`, OpenClaw acepta automáticamente solo esquemas seguros que pueda mapear a una respuesta de aprobación, como un campo booleano de aprobación.
- Cuando la política es `"auto"`, OpenClaw expone acciones destructivas de plugins a Codex, pero convierte las elicitaciones de aprobación MCP con propiedad comprobada en aprobaciones de plugins de OpenClaw antes de devolver la respuesta de aprobación de Codex.
- Cuando la política es `"ask"`, OpenClaw usa la misma puerta de escritura/destructiva de Codex que `"auto"`, borra las anulaciones durables de aprobación por herramienta de Codex para la app antes de que inicie el hilo, y solo ofrece aprobación o denegación de un solo uso para que las aprobaciones durables no puedan suprimir solicitudes posteriores de acciones de escritura.
- Para cada app admitida que use `"ask"`, OpenClaw selecciona el revisor de aprobaciones humanas de Codex para esa app, de modo que Codex envíe sus elicitaciones de aprobación a OpenClaw. Otras apps y aprobaciones de hilo que no son de app mantienen su revisor y política configurados.
- La identidad de plugin ausente, la propiedad ambigua, un id de turno ausente, un id de turno incorrecto o un esquema de elicitación inseguro se rechazan en lugar de solicitar confirmación.

## Solución de problemas

**`auth_required`:** la migración instaló el plugin, pero una de sus apps aún necesita autenticación. La entrada explícita del plugin se escribe deshabilitada hasta que vuelvas a autorizarlo y habilitarlo.

**`app_inaccessible`, `app_disabled` o `app_missing`:**
la migración no instaló el plugin porque el inventario de apps de Codex de origen no mostró todas las apps poseídas como presentes, habilitadas y accesibles mientras `--verify-plugin-apps` estaba establecido. Vuelve a autorizar o habilita la app en Codex y luego vuelve a ejecutar la migración con `--verify-plugin-apps`.

**`app_inventory_unavailable`:** la migración no instaló el plugin porque se solicitó verificación estricta de apps de origen y falló la actualización del inventario de apps de Codex de origen. Corrige el acceso al Codex app-server de origen o reintenta sin `--verify-plugin-apps` si aceptas el plan más rápido con puerta de cuenta.

**`codex_subscription_required`:** la migración no instaló el plugin respaldado por apps porque la cuenta del Codex app-server de origen no tenía una sesión iniciada con una cuenta de suscripción de ChatGPT. Inicia sesión en la app de Codex con autenticación de suscripción y luego vuelve a ejecutar la migración.

**`codex_account_unavailable`:** la migración no instaló el plugin respaldado por apps porque no se pudo leer la cuenta del Codex app-server de origen. Corrige la autenticación del Codex app-server de origen o vuelve a ejecutar con `--verify-plugin-apps` si quieres que el inventario de apps de origen decida la elegibilidad cuando falle la consulta de cuenta.

**`marketplace_missing` o `plugin_missing`:** el Codex app-server de destino no puede ver el marketplace o plugin `openai-curated` esperado. Vuelve a ejecutar la migración contra el runtime de destino o inspecciona el estado de plugins de Codex app-server.

**`app_inventory_missing` o `app_inventory_stale`:** la preparación de apps provino de una caché vacía u obsoleta. OpenClaw programa una actualización asíncrona y excluye las apps de plugins hasta que se conozcan la propiedad y la preparación.

**`app_ownership_ambiguous`:** el inventario de apps solo coincidió por nombre visible, por lo que la app no se expone al hilo de Codex.

**La configuración cambió, pero el agente no puede ver el Plugin:** usa `/codex plugins
list` para confirmar el estado configurado y luego usa `/new` o `/reset`. Las vinculaciones
de hilos de Codex existentes conservan la configuración de la app con la que comenzaron hasta que OpenClaw
establece una nueva sesión de arnés o reemplaza una vinculación obsoleta.

**Se rechaza la acción destructiva:** revisa los valores globales y por Plugin de
`allow_destructive_actions`. Incluso cuando la política es true, `"auto"` o
`"ask"`, los esquemas de solicitud no seguros y la identidad ambigua del Plugin siguen
fallando de forma cerrada.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Referencia de configuración](/es/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrar CLI](/es/cli/migrate)
