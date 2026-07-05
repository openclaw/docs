---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen plugins nativos de Codex
    - Está migrando plugins de Codex seleccionados por OpenAI e instalados desde el código fuente
    - Estás solucionando problemas de codexPlugins, inventario de aplicaciones, acciones destructivas o diagnósticos de aplicaciones de Plugin
summary: Configura los plugins nativos de Codex migrados para agentes de OpenClaw en modo Codex
title: Plugins nativos de Codex
x-i18n:
    generated_at: "2026-07-05T11:33:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd3e810380b99bb3fffd07eeeeb7bb41583951d4acc4ee28b30c74d27f854148
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La compatibilidad nativa con plugins de Codex permite que un agente OpenClaw en modo Codex use las propias capacidades de aplicación y Plugin de Codex app-server dentro del mismo hilo de Codex que gestiona el turno de OpenClaw. Las llamadas a Plugin permanecen en la transcripción nativa de Codex; Codex app-server es propietario de la ejecución MCP respaldada por aplicaciones. OpenClaw no traduce los plugins de Codex a herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

Usa esta página después de que el [arnés de Codex](/es/plugins/codex-harness) base esté funcionando.

## Requisitos

- El runtime del agente debe ser el arnés nativo de Codex.
- `plugins.entries.codex.enabled` es `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` es `true`.
- El Codex app-server de destino puede ver el marketplace, el Plugin y el inventario de aplicaciones esperados.
- V1 admite solo plugins `openai-curated` que la migración observó como instalados desde origen en el inicio de Codex de origen.

`codexPlugins` no tiene efecto en ejecuciones con proveedor OpenClaw, vinculaciones de conversación ACP ni otros arneses, porque esas rutas nunca crean hilos de Codex app-server con configuración nativa de `apps`.

La cuenta de Codex del lado de OpenAI, la disponibilidad de aplicaciones y los controles de aplicaciones/plugins del espacio de trabajo provienen de la cuenta de Codex con sesión iniciada. Consulta [Usar Codex con tu plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) para el modelo de cuenta y administración de OpenAI.

## Inicio rápido

Previsualiza la migración desde el inicio de Codex de origen:

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

La migración escribe entradas explícitas de `codexPlugins` para los plugins elegibles y llama a `plugin/install` de Codex app-server para los plugins seleccionados. Una configuración migrada se ve así:

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

Después de un cambio de `codexPlugins`, las nuevas conversaciones de Codex adoptan automáticamente el conjunto de aplicaciones actualizado. Ejecuta `/new` o `/reset` para actualizar la conversación actual. No se requiere reiniciar el Gateway para los cambios de habilitación/deshabilitación de plugins.

## Administrar plugins desde el chat

`/codex plugins` inspecciona o cambia plugins nativos de Codex configurados desde el mismo chat donde operas el arnés de Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` es un alias de `/codex plugins list`. La lista muestra la clave, el estado activado/desactivado, el nombre del Plugin de Codex y el marketplace de cada Plugin configurado desde `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` escriben solo en `~/.openclaw/openclaw.json`; nunca editan `~/.codex/config.toml` ni instalan nuevos plugins de Codex. Solo el propietario o un cliente de Gateway con el alcance `operator.admin` puede ejecutarlos.

Habilitar un Plugin configurado también activa el interruptor global `codexPlugins.enabled`. Si el Plugin se escribió como deshabilitado porque la migración devolvió `auth_required`, vuelve a autorizar la aplicación en Codex antes de habilitarla en OpenClaw.

## Cómo funciona la configuración nativa de Plugin

La integración rastrea tres estados:

| Estado     | Significado                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Instalado  | Codex tiene el paquete local del Plugin en el runtime del app-server de destino.                                                  |
| Habilitado | La configuración de OpenClaw permite el Plugin para turnos del arnés de Codex.                                                    |
| Accesible  | Codex app-server confirma que las entradas de aplicación del Plugin están disponibles para la cuenta activa y se asignan a la identidad del Plugin migrada. |

La migración es el paso duradero de instalación/elegibilidad:

- Durante la planificación, OpenClaw lee los detalles `plugin/read` de Codex de origen y comprueba que la cuenta del Codex app-server de origen sea una cuenta con suscripción a ChatGPT. Una respuesta de cuenta que no sea de ChatGPT o ausente omite los plugins respaldados por aplicaciones con `codex_subscription_required`.
- De forma predeterminada, la migración omite la llamada `app/list` de origen: los plugins de origen respaldados por aplicaciones que pasan la puerta de cuenta se planifican sin verificación de accesibilidad de la aplicación de origen, y los fallos de transporte en la búsqueda de cuenta se omiten con `codex_account_unavailable`.
- Con `--verify-plugin-apps`, la migración toma una instantánea nueva de `app/list` de origen y requiere que cada aplicación propia esté presente, habilitada y accesible antes de planificar la activación nativa. Los fallos de transporte en la búsqueda de cuenta pasan entonces a la puerta de inventario de aplicaciones de origen en lugar de omitirse directamente.

El inventario de aplicaciones en runtime es la comprobación de accesibilidad de la sesión de destino que se ejecuta después de la migración. La configuración de sesión del arnés de Codex calcula una configuración restrictiva de aplicaciones del hilo a partir de las aplicaciones de Plugin habilitadas y accesibles; no se recalcula en cada turno, por lo que `/codex plugins enable`/`disable` solo afectan a nuevas conversaciones de Codex. Usa `/new` o `/reset` para adoptar el cambio en la conversación actual.

## Límite de compatibilidad de V1

- Solo los plugins `openai-curated` ya instalados en el inventario de Codex app-server de origen son elegibles para migración.
- Los plugins de origen respaldados por aplicaciones deben pasar la puerta de suscripción en tiempo de migración. `--verify-plugin-apps` agrega la puerta de inventario de aplicaciones de origen. Las cuentas bloqueadas por suscripción y, en modo de verificación, las aplicaciones de origen inaccesibles/deshabilitadas/ausentes o los fallos de actualización del inventario de aplicaciones se informan como elementos manuales omitidos en lugar de entradas de configuración habilitadas. Los detalles de Plugin ilegibles se omiten antes de la puerta de inventario de aplicaciones.
- La migración escribe identidades explícitas de Plugin (`marketplaceName` y `pluginName`); no escribe rutas locales de caché `marketplacePath`.
- `codexPlugins.enabled` es el único interruptor de habilitación global; no hay comodín `plugins["*"]` ni clave de configuración que conceda autoridad de instalación arbitraria.
- Los marketplaces no admitidos, paquetes de Plugin en caché, hooks y archivos de configuración de Codex se conservan en el informe de migración para revisión manual, no se activan automáticamente.

## Inventario de aplicaciones y propiedad

OpenClaw lee el inventario de aplicaciones de Codex mediante `app/list` de app-server, lo almacena en caché en memoria durante una hora y actualiza las entradas obsoletas o ausentes de forma asíncrona. La caché es local del proceso; reiniciar la CLI o el Gateway la descarta, y OpenClaw la reconstruye a partir de la siguiente lectura de `app/list`.

La migración y el runtime usan claves de caché separadas:

- La verificación de migración de origen usa el inicio de Codex de origen y las opciones de inicio. Se ejecuta solo con `--verify-plugin-apps` y fuerza un recorrido nuevo de `app/list` de origen para esa ejecución de planificación.
- La configuración de runtime de destino usa la identidad de Codex app-server del agente de destino al construir la configuración de aplicaciones del hilo. La activación de Plugin invalida esa clave de caché de destino y luego fuerza su actualización después de `plugin/install`.

Una aplicación de Plugin se expone solo cuando OpenClaw puede asignarla de vuelta al Plugin migrado mediante propiedad estable: un id de aplicación exacto de los detalles del Plugin, un nombre de servidor MCP conocido o metadatos estables únicos. La propiedad basada solo en nombre para mostrar o ambigua se excluye hasta que la siguiente actualización de inventario demuestre la propiedad.

## Configuración de aplicaciones del hilo

OpenClaw inyecta un parche restrictivo de `config.apps` para el hilo de Codex: `_default` está deshabilitado y solo se habilitan las aplicaciones propiedad de plugins migrados habilitados.

`destructive_enabled` en cada aplicación proviene de la política efectiva global o por Plugin `allow_destructive_actions`; `true`, `"auto"` y `"ask"` establecen `destructive_enabled: true`, y `false` lo establece en `false`. Codex todavía aplica los metadatos de herramientas destructivas desde sus anotaciones nativas de herramientas de aplicación. `_default` está deshabilitado con `open_world_enabled: false`; las aplicaciones de Plugin habilitadas reciben `open_world_enabled: true`. OpenClaw no expone un control separado de política de mundo abierto a nivel de Plugin ni mantiene listas de denegación de nombres de herramientas destructivas por Plugin.

El modo de aprobación de herramientas usa automático de forma predeterminada para las aplicaciones de Plugin, por lo que las herramientas de lectura no destructivas se ejecutan sin una solicitud de aprobación en el mismo hilo. Las herramientas destructivas siguen controladas por la política `destructive_enabled` de cada aplicación.

## Política de acciones destructivas

Las elicitaciones destructivas de Plugin se permiten de forma predeterminada para plugins de Codex migrados, mientras que los esquemas inseguros y la propiedad ambigua fallan de forma cerrada:

- `allow_destructive_actions` global tiene el valor predeterminado `true`.
- `allow_destructive_actions` por Plugin anula la política global para ese Plugin.
- `false`: OpenClaw devuelve un rechazo determinista.
- `true`: OpenClaw acepta automáticamente solo esquemas seguros que puede asignar a una respuesta de aprobación, como un campo booleano de aprobación.
- `"auto"`: OpenClaw expone acciones destructivas de Plugin a Codex y luego convierte las elicitaciones de aprobación MCP con propiedad demostrada en aprobaciones de Plugin de OpenClaw antes de devolver la respuesta de aprobación de Codex.
- `"ask"`: OpenClaw usa la misma protección de escritura/destructiva de Codex que `"auto"`, borra las anulaciones duraderas de aprobación por herramienta de Codex para la aplicación antes de que el hilo comience y ofrece solo aprobación o denegación de un solo uso para que las aprobaciones duraderas no puedan suprimir solicitudes posteriores de acciones de escritura. Para cada aplicación admitida que usa `"ask"`, OpenClaw selecciona el revisor de aprobaciones humanas de Codex para esa aplicación, de modo que Codex envíe sus elicitaciones de aprobación a OpenClaw; otras aplicaciones y aprobaciones de hilo que no son de aplicación conservan su revisor y política configurados.
- La identidad de Plugin ausente, la propiedad ambigua, un id de turno ausente o no coincidente, o un esquema de elicitación inseguro rechaza en lugar de solicitar.

## Solución de problemas

| Código                                            | Significado                                                                                                                           | Solución                                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | La migración instaló el plugin, pero una de sus apps aún necesita autenticación. La entrada se escribe deshabilitada hasta que vuelvas a autorizarla. | Vuelve a autorizar la app en Codex y luego habilita el plugin en OpenClaw.                                                    |
| `app_inaccessible`, `app_disabled`, `app_missing` | Con `--verify-plugin-apps`, el inventario de apps de Codex de origen no mostró todas las apps propias como presentes, habilitadas y accesibles. | Vuelve a autorizar o habilitar la app en Codex y luego vuelve a ejecutar la migración con `--verify-plugin-apps`.             |
| `app_inventory_unavailable`                       | Se solicitó una verificación estricta de apps de origen, pero falló la actualización del inventario de apps de Codex de origen.       | Corrige el acceso al servidor de apps de Codex de origen, o vuelve a intentarlo sin `--verify-plugin-apps` para aceptar el plan más rápido restringido por cuenta. |
| `codex_subscription_required`                     | La cuenta del servidor de apps de Codex de origen no era una cuenta con suscripción de ChatGPT.                                      | Inicia sesión en la app de Codex con autenticación de suscripción y luego vuelve a ejecutar la migración.                    |
| `codex_account_unavailable`                       | No se pudo leer la cuenta del servidor de apps de Codex de origen.                                                                    | Corrige la autenticación del servidor de apps de Codex de origen, o vuelve a ejecutar con `--verify-plugin-apps` para que el inventario de apps de origen decida la elegibilidad. |
| `marketplace_missing`, `plugin_missing`           | El servidor de apps de Codex de destino no puede ver el marketplace o plugin `openai-curated` esperado.                              | Vuelve a ejecutar la migración contra el runtime de destino, o inspecciona el estado del plugin del servidor de apps de Codex. |
| `app_inventory_missing`, `app_inventory_stale`    | La preparación de la app provino de una caché vacía u obsoleta.                                                                      | OpenClaw programa automáticamente una actualización asíncrona; las apps de plugin permanecen excluidas hasta que se conozcan la propiedad y la preparación. |
| `app_ownership_ambiguous`                         | El inventario de apps solo coincidió por nombre para mostrar.                                                                         | La app permanece oculta en el hilo de Codex hasta que una actualización posterior pruebe la propiedad.                       |

**La configuración cambió, pero el agente no puede ver el plugin:** ejecuta `/codex plugins
list` para confirmar el estado configurado y luego `/new` o `/reset`. Las vinculaciones de hilos de
Codex existentes conservan la configuración de la app con la que comenzaron hasta que OpenClaw
establece una nueva sesión de arnés o reemplaza una vinculación obsoleta.

**Se rechaza la acción destructiva:** comprueba los valores globales y por plugin de
`allow_destructive_actions`. Incluso con `true`, `"auto"` o `"ask"`,
los esquemas de solicitud inseguros y la identidad ambigua del plugin siguen fallando de forma cerrada.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Referencia de configuración](/es/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migración](/es/cli/migrate)
