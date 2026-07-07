---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen plugins nativos de Codex
    - Estás migrando plugins de Codex seleccionados por OpenAI instalados desde el código fuente
    - Estás solucionando problemas de codexPlugins, el inventario de apps, las acciones destructivas o los diagnósticos de apps de plugins
summary: Configura los plugins nativos migrados de Codex para agentes de OpenClaw en modo Codex
title: Plugins nativos de Codex
x-i18n:
    generated_at: "2026-07-06T21:50:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5155cef2ed71ce6f9d8a4a38b98abc36cb72383ec60e1978fb145dfc32cf322
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La compatibilidad nativa con plugins de Codex permite que un agente de OpenClaw en modo Codex use las capacidades de aplicaciones y plugins propias de Codex app-server dentro del mismo hilo de Codex que gestiona el turno de OpenClaw. Las llamadas a plugins permanecen en la transcripción nativa de Codex; Codex app-server es responsable de la ejecución MCP respaldada por aplicaciones. OpenClaw no traduce los plugins de Codex en herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

Usa esta página después de que el [arnés de Codex](/es/plugins/codex-harness) base esté funcionando.

## Requisitos

- El runtime del agente debe ser el arnés nativo de Codex.
- `plugins.entries.codex.enabled` es `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` es `true`.
- El Codex app-server de destino puede ver el marketplace, el plugin y el inventario de aplicaciones esperados.
- V1 solo admite plugins `openai-curated` que la migración observó como instalados desde origen en el home de Codex de origen.

`codexPlugins` no tiene efecto en ejecuciones con proveedor OpenClaw, enlaces de conversación ACP ni otros arneses, porque esas rutas nunca crean hilos de Codex app-server con configuración nativa de `apps`.

La cuenta de Codex del lado de OpenAI, la disponibilidad de aplicaciones y los controles de aplicaciones/plugins del espacio de trabajo provienen de la cuenta de Codex con sesión iniciada. Consulta [Usar Codex con tu plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) para el modelo de cuenta y administración de OpenAI.

## Inicio rápido

Previsualiza la migración desde el home de Codex de origen:

```bash
openclaw migrate codex --dry-run
```

Agrega `--verify-plugin-apps` para hacer que la migración llame a `app/list` de origen y requiera que cada aplicación propia esté presente, habilitada y accesible antes de planificar la activación nativa:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Aplica la migración cuando el plan se vea correcto:

```bash
openclaw migrate apply codex --yes
```

La migración escribe entradas explícitas de `codexPlugins` para plugins elegibles y llama a `plugin/install` de Codex app-server para los plugins seleccionados. Una configuración migrada se ve así:

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

Después de un cambio de `codexPlugins`, las nuevas conversaciones de Codex toman automáticamente el conjunto de aplicaciones actualizado. Ejecuta `/new` o `/reset` para actualizar la conversación actual. No se requiere reiniciar el Gateway para cambios de habilitación/deshabilitación de plugins.

## Gestionar plugins desde el chat

`/codex plugins` inspecciona o cambia los plugins nativos de Codex configurados desde el mismo chat donde operas el arnés de Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` es un alias de `/codex plugins list`. La lista muestra la clave de cada plugin configurado, su estado activado/desactivado, el nombre del plugin de Codex y el marketplace de `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` escriben solo en `~/.openclaw/openclaw.json`; nunca editan `~/.codex/config.toml` ni instalan nuevos plugins de Codex. Solo el propietario o un cliente de Gateway con el alcance `operator.admin` puede ejecutarlos.

Habilitar un plugin configurado también activa el interruptor global `codexPlugins.enabled`. Si el plugin se escribió como deshabilitado porque la migración devolvió `auth_required`, vuelve a autorizar la aplicación en Codex antes de habilitarla en OpenClaw.

## Cómo funciona la configuración nativa de plugins

La integración rastrea tres estados:

| Estado     | Significado                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Instalado  | Codex tiene el paquete local del plugin en el runtime del app-server de destino.                                                 |
| Habilitado | La configuración de OpenClaw permite el plugin para turnos del arnés de Codex.                                                   |
| Accesible  | Codex app-server confirma que las entradas de aplicación del plugin están disponibles para la cuenta activa y se asignan a la identidad de plugin migrada. |

La migración es el paso duradero de instalación/elegibilidad:

- Durante la planificación, OpenClaw lee los detalles `plugin/read` de Codex de origen y comprueba que la cuenta de Codex app-server de origen sea una cuenta de suscripción de ChatGPT. Una respuesta de cuenta no ChatGPT o ausente omite los plugins respaldados por aplicaciones con `codex_subscription_required`.
- De forma predeterminada, la migración omite la llamada `app/list` de origen: los plugins de origen respaldados por aplicaciones que superan la puerta de cuenta se planifican sin verificación de accesibilidad de aplicaciones de origen, y los fallos de transporte de búsqueda de cuenta se omiten con `codex_account_unavailable`.
- Con `--verify-plugin-apps`, la migración toma una instantánea nueva de `app/list` de origen y requiere que cada aplicación propia esté presente, habilitada y accesible antes de planificar la activación nativa. Los fallos de transporte de búsqueda de cuenta pasan entonces a la puerta de inventario de aplicaciones de origen en lugar de omitirse directamente.

El inventario de aplicaciones en runtime es la comprobación de accesibilidad de la sesión de destino que se ejecuta después de la migración. La configuración de sesión del arnés de Codex calcula una configuración restrictiva de aplicaciones de hilo a partir de las aplicaciones de plugin habilitadas y accesibles; no se recalcula en cada turno, por lo que `/codex plugins enable`/`disable` solo afectan a nuevas conversaciones de Codex. Usa `/new` o `/reset` para aplicar el cambio en la conversación actual.

## Límite de compatibilidad de V1

- Solo los plugins `openai-curated` ya instalados en el inventario de Codex app-server de origen son elegibles para migración.
- Los plugins de origen respaldados por aplicaciones deben superar la puerta de suscripción en tiempo de migración. `--verify-plugin-apps` agrega la puerta de inventario de aplicaciones de origen. Las cuentas restringidas por suscripción y, en modo de verificación, las aplicaciones de origen inaccesibles/deshabilitadas/ausentes o los fallos de actualización del inventario de aplicaciones se reportan como elementos manuales omitidos en lugar de entradas de configuración habilitadas. Los detalles de plugin ilegibles se omiten antes de la puerta de inventario de aplicaciones.
- La migración escribe identidades explícitas de plugin (`marketplaceName` y `pluginName`); no escribe rutas de caché locales `marketplacePath`.
- `codexPlugins.enabled` es el único interruptor de habilitación global; no hay comodín `plugins["*"]` ni clave de configuración que conceda autoridad de instalación arbitraria.
- Los marketplaces no compatibles, paquetes de plugins en caché, hooks y archivos de configuración de Codex se conservan en el informe de migración para revisión manual, no se activan automáticamente.

## Inventario de aplicaciones y propiedad

OpenClaw lee el inventario de aplicaciones de Codex mediante `app/list` de app-server, lo almacena en caché en memoria durante una hora y actualiza entradas obsoletas o ausentes de forma asíncrona. La caché es local al proceso; reiniciar la CLI o el Gateway la descarta, y OpenClaw la reconstruye a partir de la siguiente lectura de `app/list`.

La migración y el runtime usan claves de caché separadas:

- La verificación de migración de origen usa el home de Codex de origen y las opciones de inicio. Se ejecuta solo con `--verify-plugin-apps` y fuerza un recorrido nuevo de `app/list` de origen para esa ejecución de planificación.
- La configuración de runtime de destino usa la identidad de Codex app-server del agente de destino al construir la configuración de aplicaciones del hilo. La activación de plugins invalida esa clave de caché de destino y luego fuerza su actualización después de `plugin/install`.

Una aplicación de plugin se expone solo cuando OpenClaw puede asignarla de vuelta al plugin migrado mediante propiedad estable: un id exacto de aplicación desde el detalle del plugin, un nombre de servidor MCP conocido o metadatos estables únicos. La propiedad basada solo en nombre visible o ambigua se excluye hasta que la siguiente actualización de inventario demuestre la propiedad.

## Aplicaciones de cuenta conectadas

Los agentes operados por el propietario pueden optar por incluir todas las aplicaciones ya conectadas a su cuenta de Codex sin requerir un paquete de plugin coincidente:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true` toma una instantánea completa de `app/list` cuando se establece un nuevo hilo nativo de Codex y admite solo aplicaciones marcadas como accesibles para esa cuenta. No instala, autentica ni habilita aplicaciones globalmente. Los hilos existentes mantienen su conjunto de aplicaciones persistido; usa `/new`, `/reset` o reinicia el Gateway para incorporar aplicaciones recién conectadas o revocadas.

Las aplicaciones de cuenta heredan el valor global `codexPlugins.allow_destructive_actions`, que acepta `true`, `false`, `"auto"` o `"ask"`. La política explícita por plugin anula la política global para ids de aplicación superpuestos. Los fallos de inventario fallan de forma cerrada en lugar de recurrir a un valor predeterminado sin restricciones.

## Configuración de aplicaciones de hilo

OpenClaw inyecta un parche restrictivo `config.apps` para el hilo de Codex: `_default` está deshabilitado y solo se habilitan las aplicaciones propiedad de plugins migrados habilitados o aplicaciones de cuenta accesibles admitidas por `allow_all_plugins`.

`destructive_enabled` en cada aplicación proviene de la política efectiva global o por plugin `allow_destructive_actions`; `true`, `"auto"` y `"ask"` establecen `destructive_enabled: true`, y `false` lo establece en `false`. Codex sigue aplicando los metadatos de herramientas destructivas desde sus anotaciones nativas de herramientas de aplicación. `_default` se deshabilita con `open_world_enabled: false`; las aplicaciones de plugins habilitadas reciben `open_world_enabled: true`. OpenClaw no expone un control separado de política de mundo abierto a nivel de plugin ni mantiene listas de denegación de nombres de herramientas destructivas por plugin.

El modo de aprobación de herramientas se configura de forma predeterminada como automático para aplicaciones admitidas, por lo que las herramientas de lectura no destructivas se ejecutan sin una solicitud de aprobación en el mismo hilo. Las herramientas destructivas permanecen controladas por la política `destructive_enabled` de cada aplicación.

## Política de acciones destructivas

Las solicitudes destructivas de plugins están permitidas de forma predeterminada para plugins de Codex migrados, mientras que los esquemas no seguros y la propiedad ambigua fallan de forma cerrada:

- `allow_destructive_actions` global se configura de forma predeterminada como `true`.
- `allow_destructive_actions` por plugin anula la política global para ese plugin.
- `false`: OpenClaw devuelve un rechazo determinista.
- `true`: OpenClaw acepta automáticamente solo esquemas seguros que puede asignar a una respuesta de aprobación, como un campo booleano de aprobación.
- `"auto"`: OpenClaw expone acciones destructivas de plugin a Codex y luego convierte las solicitudes de aprobación MCP con propiedad demostrada en aprobaciones de plugin de OpenClaw antes de devolver la respuesta de aprobación de Codex.
- `"ask"`: OpenClaw usa la misma compuerta de escritura/destructiva de Codex que `"auto"`, borra las anulaciones duraderas de aprobación por herramienta de Codex para la aplicación antes de que comience el hilo y ofrece solo aprobación o denegación de un solo uso para que las aprobaciones duraderas no puedan suprimir solicitudes posteriores de acciones de escritura. Para cada aplicación admitida que use `"ask"`, OpenClaw selecciona el revisor de aprobaciones humanas de Codex para esa aplicación, de modo que Codex envíe sus solicitudes de aprobación a OpenClaw; otras aplicaciones y aprobaciones de hilo que no son de aplicación conservan su revisor y política configurados.
- La identidad de plugin ausente, la propiedad ambigua, un id de turno ausente o no coincidente, o un esquema de solicitud no seguro se rechazan en lugar de solicitar confirmación.

## Solución de problemas

| Código                                            | Significado                                                                                                                               | Corrección                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | La migración instaló el plugin, pero una de sus apps todavía necesita autenticación. La entrada se escribe deshabilitada hasta que vuelvas a autorizarla. | Vuelve a autorizar la app en Codex y luego habilita el plugin en OpenClaw.                                           |
| `app_inaccessible`, `app_disabled`, `app_missing` | Con `--verify-plugin-apps`, el inventario de apps de origen de Codex no mostró todas las apps propias como presentes, habilitadas y accesibles. | Vuelve a autorizar o habilita la app en Codex y luego vuelve a ejecutar la migración con `--verify-plugin-apps`.     |
| `app_inventory_unavailable`                       | Se solicitó verificación estricta de las apps de origen, pero falló la actualización del inventario de apps de origen de Codex.            | Corrige el acceso al servidor de apps de origen de Codex, o reintenta sin `--verify-plugin-apps` para aceptar el plan más rápido limitado por cuenta. |
| `codex_subscription_required`                     | La cuenta del servidor de apps de origen de Codex no era una cuenta con suscripción a ChatGPT.                                             | Inicia sesión en la app de Codex con autenticación de suscripción y luego vuelve a ejecutar la migración.             |
| `codex_account_unavailable`                       | No se pudo leer la cuenta del servidor de apps de origen de Codex.                                                                         | Corrige la autenticación del servidor de apps de origen de Codex, o vuelve a ejecutar con `--verify-plugin-apps` para dejar que el inventario de apps de origen decida la elegibilidad. |
| `marketplace_missing`, `plugin_missing`           | El servidor de apps de Codex de destino no puede ver el marketplace o plugin `openai-curated` esperado.                                    | Vuelve a ejecutar la migración contra el runtime de destino, o inspecciona el estado del plugin en el servidor de apps de Codex. |
| `app_inventory_missing`, `app_inventory_stale`    | La preparación de las apps provino de una caché vacía u obsoleta.                                                                          | OpenClaw programa automáticamente una actualización asíncrona; las apps del plugin permanecen excluidas hasta que se conozcan la propiedad y la preparación. |
| `app_ownership_ambiguous`                         | El inventario de apps solo coincidió por nombre para mostrar.                                                                              | La app permanece oculta en el hilo de Codex hasta que una actualización posterior demuestre la propiedad.             |

**La configuración cambió, pero el agente no puede ver el plugin:** ejecuta `/codex plugins
list` para confirmar el estado configurado y luego `/new` o `/reset`. Los enlaces de hilos
existentes de Codex conservan la configuración de la app con la que comenzaron hasta que OpenClaw
establece una nueva sesión de arnés o reemplaza un enlace obsoleto.

**La acción destructiva se rechaza:** revisa los valores globales y por plugin de
`allow_destructive_actions`. Incluso con `true`, `"auto"` o `"ask"`,
los esquemas de elicitación no seguros y la identidad ambigua del plugin siguen fallando en modo cerrado.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Referencia de configuración](/es/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migración](/es/cli/migrate)
