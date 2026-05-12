---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen plugins nativos de Codex
    - Estás migrando plugins de Codex seleccionados por OpenAI e instalados desde el código fuente
    - Estás solucionando problemas de codexPlugins, inventario de aplicaciones, acciones destructivas o diagnósticos de aplicaciones de Plugin
summary: Configurar plugins nativos de Codex migrados para agentes de OpenClaw en modo Codex
title: Plugins nativos de Codex
x-i18n:
    generated_at: "2026-05-12T23:30:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La compatibilidad nativa con plugins de Codex permite que un agente de OpenClaw en modo Codex use las propias capacidades de apps y plugins de Codex app-server dentro del mismo hilo de Codex que gestiona el turno de OpenClaw.

OpenClaw no traduce los plugins de Codex a herramientas dinámicas sintéticas de OpenClaw `codex_plugin_*`. Las llamadas a Plugin permanecen en la transcripción nativa de Codex, y Codex app-server posee la ejecución MCP respaldada por apps.

Usa esta página después de que el [arnés de Codex](/es/plugins/codex-harness) base esté funcionando.

## Requisitos

- El runtime del agente de OpenClaw seleccionado debe ser el arnés nativo de Codex.
- `plugins.entries.codex.enabled` debe ser true.
- `plugins.entries.codex.config.codexPlugins.enabled` debe ser true.
- V1 solo admite plugins `openai-curated` que la migración observó como instalados desde origen en el home de Codex de origen.
- El Codex app-server de destino debe poder ver el marketplace, el Plugin y el inventario de apps esperados.

`codexPlugins` no tiene efecto en ejecuciones de Pi, ejecuciones normales del proveedor de OpenAI, enlaces de conversación ACP u otros arneses, porque esas rutas no crean hilos de Codex app-server con configuración nativa de `apps`.

## Inicio rápido

Previsualiza la migración desde el home de Codex de origen:

```bash
openclaw migrate codex --dry-run
```

Usa verificación estricta de apps de origen cuando quieras que la migración compruebe la accesibilidad de las apps de origen antes de planificar la activación nativa de plugins:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Aplica la migración cuando el plan se vea correcto:

```bash
openclaw migrate apply codex --yes
```

La migración escribe entradas `codexPlugins` explícitas para los plugins elegibles y llama a `plugin/install` de Codex app-server para los plugins seleccionados. Una configuración migrada típica se ve así:

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

Después de cambiar `codexPlugins`, usa `/new`, `/reset` o reinicia el Gateway para que las futuras sesiones del arnés de Codex comiencen con el conjunto de apps actualizado.

## Cómo funciona la configuración nativa de plugins

La integración tiene tres estados separados:

- Instalado: Codex tiene el paquete local del Plugin en el runtime de app-server de destino.
- Habilitado: la configuración de OpenClaw está dispuesta a poner el Plugin a disposición de los turnos del arnés de Codex.
- Accesible: Codex app-server confirma que las entradas de app del Plugin están disponibles para la cuenta activa y pueden asignarse a la identidad de Plugin migrada.

La migración es el paso duradero de instalación/elegibilidad. Durante la planificación, OpenClaw lee los detalles de `plugin/read` de Codex de origen y comprueba que la respuesta de la cuenta de Codex app-server de origen sea una cuenta de suscripción de ChatGPT. Las respuestas de cuenta que no sean de ChatGPT o que falten omiten los plugins respaldados por apps con `codex_subscription_required`. De forma predeterminada, la migración no llama a `app/list` de origen; los plugins de origen respaldados por apps que pasan la puerta de cuenta se planifican sin verificación de accesibilidad de apps de origen, y los fallos de transporte de búsqueda de cuenta se omiten con `codex_account_unavailable`. Con `--verify-plugin-apps`, la migración toma una instantánea nueva de `app/list` de origen y exige que cada app propia esté presente, habilitada y accesible antes de planificar la activación nativa. En ese modo, los fallos de transporte de búsqueda de cuenta pasan a la puerta de inventario de apps de origen. El inventario de apps en runtime es la comprobación de accesibilidad de la sesión de destino después de la migración. La configuración de sesión del arnés de Codex calcula entonces una configuración restrictiva de apps de hilo para las apps de Plugin habilitadas y accesibles.

La configuración de apps de hilo se calcula cuando OpenClaw establece una sesión del arnés de Codex o reemplaza un enlace de hilo de Codex obsoleto. No se recalcula en cada turno.

## Límite de compatibilidad de V1

V1 es intencionadamente estrecho:

- Solo los plugins `openai-curated` que ya estaban instalados en el inventario de Codex app-server de origen son elegibles para migración.
- Los plugins de origen respaldados por apps deben pasar la puerta de suscripción en tiempo de migración. `--verify-plugin-apps` agrega la puerta de inventario de apps de origen. Las cuentas bloqueadas por suscripción y, en modo de verificación, las apps de origen inaccesibles, deshabilitadas o faltantes, o los fallos de actualización del inventario de apps de origen, se informan como elementos manuales omitidos en lugar de entradas de configuración habilitadas. Los detalles de Plugin ilegibles se omiten antes de la puerta de inventario de apps de origen.
- La migración escribe identidades explícitas de Plugin con `marketplaceName` y `pluginName`; no escribe rutas de caché locales `marketplacePath`.
- `codexPlugins.enabled` es el interruptor global de habilitación.
- No hay comodín `plugins["*"]` ni clave de configuración que conceda autoridad de instalación arbitraria.
- Los marketplaces no compatibles, los paquetes de Plugin en caché, los hooks y los archivos de configuración de Codex se conservan en el informe de migración para revisión manual.

## Inventario y propiedad de apps

OpenClaw lee el inventario de apps de Codex mediante `app/list` de app-server, lo almacena en caché durante una hora y actualiza de forma asíncrona las entradas obsoletas o faltantes. La caché está solo en memoria; reiniciar la CLI o el Gateway la descarta, y OpenClaw la reconstruye a partir de la siguiente lectura de `app/list`.

La migración y el runtime usan claves de caché separadas:

- La verificación de migración de origen usa el home de Codex de origen y las opciones de inicio de app-server de origen. Esto se ejecuta solo cuando `--verify-plugin-apps` está definido, y fuerza un recorrido nuevo de `app/list` de origen para esa ejecución de planificación.
- La configuración del runtime de destino usa la identidad de Codex app-server del agente de destino cuando construye la configuración de apps del hilo de Codex. La activación de Plugin invalida esa clave de caché de destino y luego fuerza su actualización después de `plugin/install`.

Una app de Plugin se expone solo cuando OpenClaw puede asignarla de vuelta al Plugin migrado mediante propiedad estable:

- id exacto de app a partir de los detalles del Plugin
- nombre conocido del servidor MCP
- metadatos estables únicos

La propiedad basada solo en nombre para mostrar o ambigua queda excluida hasta que la siguiente actualización de inventario demuestre la propiedad.

## Configuración de apps de hilo

OpenClaw inyecta un parche restrictivo `config.apps` para el hilo de Codex: `_default` se deshabilita y solo se habilitan las apps propiedad de plugins migrados habilitados.

OpenClaw define `destructive_enabled` a nivel de app a partir de la política global o por Plugin efectiva de `allow_destructive_actions` y deja que Codex aplique los metadatos de herramientas destructivas desde sus anotaciones nativas de herramientas de app. La configuración de app `_default` se deshabilita con `open_world_enabled: false`. Las apps de Plugin habilitadas se emiten con `open_world_enabled: true`; OpenClaw no expone un control de política open-world separado para plugins ni mantiene listas de denegación de nombres de herramientas destructivas por Plugin.

El modo de aprobación de herramientas es automático de forma predeterminada para las apps de Plugin, de modo que las herramientas de lectura no destructivas puedan ejecutarse sin una interfaz de aprobación en el mismo hilo. Las herramientas destructivas siguen controladas por la política `destructive_enabled` de cada app.

## Política de acciones destructivas

Las elicitaciones destructivas de Plugin se permiten de forma predeterminada para los plugins de Codex migrados, mientras que los esquemas inseguros y la propiedad ambigua siguen fallando de forma cerrada:

- `allow_destructive_actions` global tiene como valor predeterminado `true`.
- `allow_destructive_actions` por Plugin anula la política global para ese Plugin.
- Cuando la política es `false`, OpenClaw devuelve una negativa determinista.
- Cuando la política es `true`, OpenClaw acepta automáticamente solo esquemas seguros que puede asignar a una respuesta de aprobación, como un campo booleano de aprobación.
- La identidad de Plugin faltante, la propiedad ambigua, un id de turno faltante, un id de turno incorrecto o un esquema de elicitación inseguro rechazan en lugar de solicitar confirmación.

## Solución de problemas

**`auth_required`:** la migración instaló el Plugin, pero una de sus apps todavía necesita autenticación. La entrada explícita del Plugin se escribe deshabilitada hasta que vuelvas a autorizar y la habilites.

**`app_inaccessible`, `app_disabled` o `app_missing`:**
la migración no instaló el Plugin porque el inventario de apps de Codex de origen no mostró todas las apps propias como presentes, habilitadas y accesibles mientras `--verify-plugin-apps` estaba definido. Vuelve a autorizar o habilita la app en Codex y luego vuelve a ejecutar la migración con `--verify-plugin-apps`.

**`app_inventory_unavailable`:** la migración no instaló el Plugin porque se solicitó verificación estricta de apps de origen y falló la actualización del inventario de apps de Codex de origen. Corrige el acceso a Codex app-server de origen o vuelve a intentarlo sin `--verify-plugin-apps` si aceptas el plan más rápido bloqueado por cuenta.

**`codex_subscription_required`:** la migración no instaló el Plugin respaldado por apps porque la cuenta de Codex app-server de origen no tenía sesión iniciada con una cuenta de suscripción de ChatGPT. Inicia sesión en la app de Codex con autenticación de suscripción y luego vuelve a ejecutar la migración.

**`codex_account_unavailable`:** la migración no instaló el Plugin respaldado por apps porque la cuenta de Codex app-server de origen no se pudo leer. Corrige la autenticación de Codex app-server de origen o vuelve a ejecutar con `--verify-plugin-apps` si quieres que el inventario de apps de origen decida la elegibilidad cuando falle la búsqueda de cuenta.

**`marketplace_missing` o `plugin_missing`:** el Codex app-server de destino no puede ver el marketplace o Plugin `openai-curated` esperado. Vuelve a ejecutar la migración contra el runtime de destino o inspecciona el estado de Plugin de Codex app-server.

**`app_inventory_missing` o `app_inventory_stale`:** la preparación de apps provino de una caché vacía u obsoleta. OpenClaw programa una actualización asíncrona y excluye las apps de Plugin hasta que se conozcan la propiedad y la preparación.

**`app_ownership_ambiguous`:** el inventario de apps solo coincidió por nombre para mostrar, por lo que la app no se expone al hilo de Codex.

**La configuración cambió, pero el agente no puede ver el Plugin:** usa `/new`, `/reset` o reinicia el Gateway. Los enlaces de hilo de Codex existentes conservan la configuración de apps con la que comenzaron hasta que OpenClaw establece una nueva sesión de arnés o reemplaza un enlace obsoleto.

**La acción destructiva se rechaza:** comprueba los valores globales y por Plugin de `allow_destructive_actions`. Incluso cuando la política es true, los esquemas de elicitación inseguros y la identidad de Plugin ambigua siguen fallando de forma cerrada.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Referencia de configuración](/es/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migración](/es/cli/migrate)
