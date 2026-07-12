---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen plugins nativos de Codex
    - Estás migrando Plugins de Codex seleccionados por OpenAI e instalados desde el código fuente
    - Estás configurando un plugin de Codex existente en un directorio de espacio de trabajo
    - Estás solucionando problemas de codexPlugins, el inventario de aplicaciones, las acciones destructivas o los diagnósticos de aplicaciones de plugins
summary: Configura plugins nativos de Codex para agentes de OpenClaw en modo Codex
title: Plugins nativos de Codex
x-i18n:
    generated_at: "2026-07-11T23:18:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La compatibilidad nativa con Plugins de Codex permite que un agente de OpenClaw en modo Codex use las capacidades propias de aplicaciones y Plugins de Codex app-server dentro del mismo hilo de Codex que gestiona el turno de OpenClaw. Las llamadas a Plugins permanecen en la transcripción nativa de Codex; Codex app-server gestiona la ejecución de MCP respaldada por aplicaciones. OpenClaw no convierte los Plugins de Codex en herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

Use esta página después de que el [entorno de ejecución de Codex](/es/plugins/codex-harness) básico esté funcionando.

## Requisitos

- El entorno de ejecución del agente debe ser el entorno de ejecución nativo de Codex.
- `plugins.entries.codex.enabled` debe ser `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` debe ser `true`.
- El Codex app-server de destino debe poder ver el inventario esperado de marketplace, Plugins y aplicaciones.
- La migración solo admite Plugins de `openai-curated` que haya detectado como instalados desde el código fuente en el directorio principal de Codex de origen.
- Los Plugins de `workspace-directory` configurados manualmente requieren un Codex app-server cuyo `plugin/list` acepte `marketplaceKinds` y cuyos resúmenes del espacio de trabajo sin ruta incluyan `remotePluginId`. El Plugin ya debe estar instalado y habilitado, y sus aplicaciones asociadas deben estar accesibles en `app/list`.

`codexPlugins` no tiene efecto en las ejecuciones del proveedor de OpenClaw, las vinculaciones de conversaciones ACP ni otros entornos de ejecución, porque esas rutas nunca crean hilos de Codex app-server con una configuración nativa de `apps`.

La cuenta de Codex del lado de OpenAI, la disponibilidad de aplicaciones y los controles de aplicaciones y Plugins del espacio de trabajo proceden de la cuenta de Codex que ha iniciado sesión. Consulte [Uso de Codex con su plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) para conocer el modelo de cuenta y administración de OpenAI.

## Inicio rápido

Previsualice la migración desde el directorio principal de Codex de origen:

```bash
openclaw migrate codex --dry-run
```

Añada `--verify-plugin-apps` para que la migración llame a `app/list` en el origen y exija que todas las aplicaciones asociadas estén presentes, habilitadas y accesibles antes de planificar la activación nativa:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Aplique la migración cuando el plan sea correcto:

```bash
openclaw migrate apply codex --yes
```

La migración escribe entradas explícitas de `codexPlugins` para los Plugins aptos y llama a `plugin/install` de Codex app-server para los Plugins seleccionados. Una configuración migrada tiene este aspecto:

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

La migración sigue limitada a `openai-curated`. Para usar un Plugin existente de `workspace-directory`, añádalo manualmente con el `summary.id` exacto, calificado por el marketplace, que devuelve `plugin/list`. Por ejemplo, si Codex devuelve `example-plugin@workspace-directory`, configure ese valor completo en lugar de su nombre para mostrar:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw no llama a `plugin/install` ni inicia la autenticación de un Plugin de `workspace-directory`. Instálelo, habilítelo y autentíquelo en Codex antes de añadir o habilitar la política de OpenClaw. OpenClaw mantiene ocultas las aplicaciones cuando la respuesta omite el marketplace exacto, el ID del Plugin, el ID de los detalles o la evidencia de que la aplicación está lista. Si Codex rechaza la solicitud explícita de `plugin/list` para el espacio de trabajo, OpenClaw informa de `marketplace_missing` para cada Plugin habilitado del espacio de trabajo y mantiene disponibles los Plugins seleccionados descubiertos de forma independiente.

Después de un cambio en `codexPlugins`, las nuevas conversaciones de Codex incorporan automáticamente el conjunto actualizado de aplicaciones. Ejecute `/new` o `/reset` para actualizar la conversación actual. No es necesario reiniciar el Gateway para los cambios de habilitación o deshabilitación de Plugins.

## Gestionar Plugins desde el chat

`/codex plugins` inspecciona o cambia los Plugins nativos de Codex configurados desde el mismo chat en el que utiliza el entorno de ejecución de Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` es un alias de `/codex plugins list`. La lista muestra la clave de cada Plugin configurado, su estado activado o desactivado, el nombre del Plugin de Codex y el marketplace de `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` solo escriben en `~/.openclaw/openclaw.json`; nunca editan `~/.codex/config.toml` ni instalan nuevos Plugins de Codex. Solo puede ejecutarlos el propietario o un cliente del Gateway con el ámbito `operator.admin`.

Al habilitar un Plugin configurado también se activa el interruptor global `codexPlugins.enabled`. Si un Plugin seleccionado se escribió como deshabilitado porque la migración devolvió `auth_required`, vuelva a autorizar la aplicación en Codex antes de habilitarla en OpenClaw. Para una entrada de `workspace-directory`, habilitarla aquí solo cambia la política de OpenClaw; el Plugin y la aplicación ya deben estar activos en Codex.

## Cómo funciona la configuración nativa de Plugins

La integración controla tres estados:

| Estado     | Significado                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalado  | Codex tiene el paquete del Plugin en el entorno de ejecución del app-server de destino.                                                                         |
| Habilitado | Codex informa que el Plugin está habilitado y la configuración de OpenClaw lo permite para los turnos del entorno de ejecución de Codex.                        |
| Accesible  | Codex app-server confirma que las entradas de aplicaciones del Plugin están disponibles para la cuenta activa y se corresponden con la identidad configurada. |

Para los Plugins de `openai-curated`, la migración es el paso duradero de instalación y determinación de aptitud:

- Durante la planificación, OpenClaw lee los detalles de `plugin/read` del Codex de origen y comprueba que la cuenta del Codex app-server de origen sea una cuenta con suscripción a ChatGPT. Si la cuenta no es de ChatGPT o no se recibe una respuesta de cuenta, se omiten los Plugins respaldados por aplicaciones con `codex_subscription_required`.
- De forma predeterminada, la migración omite la llamada a `app/list` del origen: los Plugins de origen respaldados por aplicaciones que superan la comprobación de la cuenta se planifican sin verificar la accesibilidad de las aplicaciones en el origen, y los fallos de transporte de la consulta de la cuenta hacen que se omitan con `codex_account_unavailable`.
- Con `--verify-plugin-apps`, la migración obtiene una instantánea nueva de `app/list` del origen y exige que todas las aplicaciones asociadas estén presentes, habilitadas y accesibles antes de planificar la activación nativa. En ese caso, los fallos de transporte de la consulta de la cuenta pasan a la comprobación del inventario de aplicaciones de origen en lugar de provocar una omisión inmediata.

Para los Plugins de `workspace-directory`, la configuración se realiza fuera de OpenClaw. OpenClaw solo consulta ese marketplace cuando se configura al menos una entrada habilitada del espacio de trabajo, resuelve cada Plugin mediante su `summary.id` exacto y reutiliza las comprobaciones existentes de propiedad mediante `plugin/read` y de disponibilidad mediante `app/list`. Un Plugin no instalado, deshabilitado, inaccesible o no autenticado no expone ninguna aplicación; OpenClaw no intenta instalarlo ni autenticarlo.

El inventario de aplicaciones en tiempo de ejecución es la comprobación de accesibilidad de la sesión de destino tanto para los Plugins seleccionados migrados como para los Plugins del espacio de trabajo configurados manualmente. La configuración de la sesión del entorno de ejecución de Codex calcula una configuración restrictiva de aplicaciones del hilo a partir de las aplicaciones de Plugins habilitadas y accesibles; no se vuelve a calcular en cada turno, por lo que `/codex plugins enable`/`disable` solo afecta a las nuevas conversaciones de Codex. Use `/new` o `/reset` para aplicar el cambio en la conversación actual.

## Límites de compatibilidad de V1

- Solo pueden migrarse los Plugins de `openai-curated` que ya estén instalados en el inventario del Codex app-server de origen.
- El entorno de ejecución también admite entradas explícitas de `workspace-directory` en versiones de app-server cuyo `plugin/list` implemente `marketplaceKinds` y devuelva `remotePluginId` para los resúmenes del espacio de trabajo sin ruta. Estas entradas deben usar su `summary.id` exacto, calificado por el marketplace, y ya deben estar instaladas, habilitadas y accesibles para las aplicaciones. Una solicitud rechazada de la lista del espacio de trabajo produce el diagnóstico existente `marketplace_missing` por Plugin; si falta evidencia del marketplace, el Plugin, los detalles o la aplicación, no se expone ninguna aplicación del espacio de trabajo. El inventario seleccionado de la solicitud de lista predeterminada sigue siendo utilizable.
- Los Plugins de origen respaldados por aplicaciones deben superar la comprobación de suscripción durante la migración. `--verify-plugin-apps` añade la comprobación del inventario de aplicaciones de origen. Las cuentas bloqueadas por la comprobación de suscripción y, en el modo de verificación, las aplicaciones de origen inaccesibles, deshabilitadas o ausentes, así como los fallos de actualización del inventario de aplicaciones, se notifican como elementos manuales omitidos en lugar de entradas de configuración habilitadas. Los detalles ilegibles de los Plugins se omiten antes de la comprobación del inventario de aplicaciones.
- La migración escribe identidades explícitas de Plugins (`marketplaceName` y `pluginName`); no escribe rutas locales de caché `marketplacePath`.
- `codexPlugins.enabled` es el único interruptor global de habilitación; no hay ningún comodín `plugins["*"]` ni clave de configuración que conceda autoridad arbitraria para instalar.
- Los marketplaces no seleccionados, los paquetes de Plugins almacenados en caché, los hooks y los archivos de configuración de Codex se conservan en el informe de migración para su revisión manual; no se activan automáticamente. El entorno de ejecución acepta entradas de `workspace-directory` configuradas manualmente; los demás marketplaces siguen sin ser compatibles.

## Inventario y propiedad de aplicaciones

OpenClaw lee el inventario de aplicaciones de Codex mediante `app/list` de app-server, lo almacena en memoria durante una hora y actualiza de forma asíncrona las entradas obsoletas o ausentes. La caché es local al proceso; al reiniciar la CLI o el Gateway se descarta, y OpenClaw la reconstruye a partir de la siguiente lectura de `app/list`.

La migración y el entorno de ejecución usan claves de caché diferentes:

- La verificación de la migración de origen usa el directorio principal y las opciones de inicio de Codex de origen. Solo se ejecuta con `--verify-plugin-apps` y fuerza un recorrido nuevo de `app/list` del origen para esa ejecución de planificación.
- La configuración del entorno de ejecución de destino usa la identidad del Codex app-server del agente de destino al crear la configuración de aplicaciones del hilo. La activación de Plugins seleccionados invalida esa clave de caché de destino y después fuerza su actualización tras `plugin/install`. La configuración de `workspace-directory` nunca ejecuta esta ruta de activación.

Una aplicación de un Plugin solo se expone cuando OpenClaw puede asociarla de nuevo con el Plugin configurado mediante una propiedad estable: un ID exacto de aplicación procedente de los detalles del Plugin, un nombre conocido de servidor MCP o metadatos estables y únicos. La propiedad basada únicamente en el nombre para mostrar o que resulte ambigua se excluye hasta que la siguiente actualización del inventario demuestre la propiedad.

## Aplicaciones de cuentas conectadas

Los agentes gestionados por el propietario pueden incluir todas las aplicaciones que ya estén conectadas a su cuenta de Codex sin requerir un paquete de Plugin correspondiente:

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

`allow_all_plugins: true` obtiene una instantánea completa de `app/list` cuando se establece un nuevo hilo nativo de Codex y solo admite las aplicaciones marcadas como accesibles para esa cuenta. No instala, autentica ni habilita aplicaciones globalmente. Los hilos existentes conservan su conjunto persistente de aplicaciones; use `/new`, `/reset` o reinicie el Gateway para incorporar las aplicaciones conectadas o revocadas recientemente.

Las aplicaciones de la cuenta heredan el valor global `codexPlugins.allow_destructive_actions`, que acepta `true`, `false`, `"auto"` o `"ask"`. La política explícita por Plugin prevalece sobre la política global para los ID de aplicaciones coincidentes. Los fallos del inventario producen un cierre seguro en lugar de recurrir a un valor predeterminado sin restricciones.

## Configuración de aplicaciones del hilo

OpenClaw inyecta un parche restrictivo de `config.apps` para el hilo de Codex:
`_default` está deshabilitado y solo se habilitan las aplicaciones pertenecientes a plugins configurados y habilitados o las aplicaciones de la cuenta accesibles admitidas por `allow_all_plugins`.

El valor de `destructive_enabled` de cada aplicación procede de la política efectiva global o por plugin `allow_destructive_actions`; `true`, `"auto"` y `"ask"` establecen `destructive_enabled: true`, mientras que `false` lo establece en `false`. Codex sigue aplicando los metadatos de herramientas destructivas de las anotaciones de herramientas de aplicaciones nativas.
`_default` está deshabilitado con `open_world_enabled: false`; las aplicaciones de plugins habilitados reciben `open_world_enabled: true`. OpenClaw no expone un control de política de mundo abierto independiente a nivel de plugin ni mantiene listas de denegación por plugin basadas en nombres de herramientas destructivas.

El modo de aprobación de herramientas es automático de forma predeterminada para las aplicaciones admitidas, por lo que las herramientas de lectura no destructivas se ejecutan sin una solicitud de aprobación en el mismo hilo. Las herramientas destructivas siguen estando controladas por la política `destructive_enabled` de cada aplicación.

## Política de acciones destructivas

Las solicitudes de confirmación destructivas de plugins se permiten de forma predeterminada para los plugins de Codex configurados, mientras que los esquemas inseguros y la propiedad ambigua se rechazan de forma segura:

- El valor predeterminado global de `allow_destructive_actions` es `true`.
- El valor de `allow_destructive_actions` por plugin sustituye la política global para ese plugin.
- `false`: OpenClaw devuelve un rechazo determinista.
- `true`: OpenClaw acepta automáticamente solo los esquemas seguros que puede asignar a una respuesta de aprobación, como un campo booleano de aprobación.
- `"auto"`: OpenClaw expone las acciones destructivas de plugins a Codex y, a continuación, convierte las solicitudes de confirmación de aprobación de MCP cuya propiedad esté demostrada en aprobaciones de plugins de OpenClaw antes de devolver la respuesta de aprobación de Codex.
- `"ask"`: OpenClaw utiliza el mismo control de escritura y acciones destructivas de Codex que `"auto"`, borra las anulaciones persistentes de aprobación por herramienta de Codex para la aplicación antes de que se inicie el hilo y ofrece únicamente aprobación o denegación para una sola ocasión, de modo que las aprobaciones persistentes no puedan suprimir posteriores solicitudes de acciones de escritura. Para cada aplicación admitida que utilice `"ask"`, OpenClaw selecciona el revisor de aprobaciones humanas de Codex para esa aplicación, de modo que Codex envíe sus solicitudes de confirmación de aprobación a OpenClaw; las demás aplicaciones y las aprobaciones del hilo que no correspondan a aplicaciones conservan el revisor y la política configurados.
- Si falta la identidad del plugin, la propiedad es ambigua, falta el identificador del turno o no coincide, o el esquema de solicitud de confirmación no es seguro, se rechaza la operación en lugar de solicitar confirmación.

## Solución de problemas

| Código                                            | Significado                                                                                                                                                         | Solución                                                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | La migración instaló el plugin, pero una de sus aplicaciones aún requiere autenticación. La entrada se escribe deshabilitada hasta que se vuelva a autorizar.       | Vuelva a autorizar la aplicación en Codex y, a continuación, habilite el plugin en OpenClaw.                                                 |
| `app_inaccessible`, `app_disabled`, `app_missing` | Con `--verify-plugin-apps`, el inventario de aplicaciones de Codex de origen no mostró todas las aplicaciones pertenecientes como presentes, habilitadas y accesibles. | Vuelva a autorizar o habilite la aplicación en Codex y, a continuación, vuelva a ejecutar la migración con `--verify-plugin-apps`.            |
| `app_inventory_unavailable`                       | Se solicitó una verificación estricta de las aplicaciones de origen, pero falló la actualización del inventario de aplicaciones de Codex de origen.                 | Corrija el acceso al servidor de aplicaciones de Codex de origen o vuelva a intentarlo sin `--verify-plugin-apps` para aceptar el plan más rápido restringido por cuenta. |
| `codex_subscription_required`                     | La cuenta del servidor de aplicaciones de Codex de origen no era una cuenta con suscripción a ChatGPT.                                                              | Inicie sesión en la aplicación Codex mediante autenticación de suscripción y vuelva a ejecutar la migración.                                 |
| `codex_account_unavailable`                       | No se pudo leer la cuenta del servidor de aplicaciones de Codex de origen.                                                                                          | Corrija la autenticación del servidor de aplicaciones de Codex de origen o vuelva a ejecutar con `--verify-plugin-apps` para que el inventario de aplicaciones de origen determine la elegibilidad. |
| `marketplace_missing`, `plugin_missing`           | El marketplace o el plugin exacto no están disponibles; puede que se haya rechazado la solicitud explícita del catálogo del espacio de trabajo; las aplicaciones del espacio de trabajo se rechazan de forma segura. | Verifique el contrato compatible del servidor de aplicaciones y el identificador exacto descritos a continuación.                            |
| `plugin_detail_unavailable`                       | OpenClaw no pudo leer los detalles de propiedad del plugin.                                                                                                        | Inspeccione las respuestas `plugin/list` y `plugin/read` del servidor de aplicaciones de destino.                                            |
| `plugin_disabled`                                 | Codex informa que el plugin está instalado, pero deshabilitado.                                                                                                    | La activación seleccionada puede repararlo; habilite un plugin del espacio de trabajo en Codex antes de volver a intentarlo.                  |
| `plugin_activation_failed`                        | La activación del plugin no se completó.                                                                                                                            | Utilice el diagnóstico adjunto para distinguir entre fallos del marketplace, de autenticación, de actualización o de preparación del espacio de trabajo. |
| `app_inventory_missing`, `app_inventory_stale`    | La disponibilidad de las aplicaciones procedía de una caché vacía u obsoleta.                                                                                      | OpenClaw programa automáticamente una actualización asíncrona; las aplicaciones de plugins permanecen excluidas hasta que se conozcan su propiedad y disponibilidad. |
| `app_ownership_ambiguous`                         | El inventario de aplicaciones solo encontró una coincidencia por nombre para mostrar.                                                                               | La aplicación permanece oculta para el hilo de Codex hasta que una actualización posterior demuestre su propiedad.                           |

**El plugin del espacio de trabajo está instalado, pero no es visible:** confirme que el resultado `plugin/list` del espacio de trabajo indique que el identificador exacto configurado está instalado y habilitado; después, confirme que `app/list` indique que todas las aplicaciones pertenecientes son accesibles para la misma cuenta de Codex. OpenClaw puede habilitar una aplicación accesible para el hilo incluso cuando el inventario de la cuenta indique actualmente que esa aplicación está deshabilitada. Si cambió ese estado después de que el Gateway almacenara en caché el inventario de aplicaciones, espere a la actualización de la caché que se produce cada hora o reinicie el Gateway y, a continuación, utilice `/new` o `/reset`. OpenClaw no repara ni autentica plugins del espacio de trabajo.
Si se rechaza la solicitud explícita de la lista del espacio de trabajo, cada entrada habilitada del espacio de trabajo informa de `marketplace_missing`; las entradas seleccionadas no relacionadas continúan a partir de la respuesta predeterminada de la lista.

Para `plugin_detail_unavailable`, un resumen del espacio de trabajo sin ruta debe incluir `remotePluginId`; OpenClaw mantiene ocultas las aplicaciones pertenecientes cuando ese selector o el resultado posterior de `plugin/read` no están disponibles. Para `plugin_activation_failed`, los plugins seleccionados pueden informar de un fallo del marketplace, de autenticación o de actualización posterior a la instalación. Un plugin del espacio de trabajo informa de este código cuando aún no está activo; instálelo, habilítelo y autentíquelo fuera de OpenClaw.

**La configuración cambió, pero el agente no puede ver el plugin:** ejecute `/codex plugins
list` para confirmar el estado configurado y, a continuación, `/new` o `/reset`. Las vinculaciones existentes de hilos de Codex conservan la configuración de aplicaciones con la que se iniciaron hasta que OpenClaw establece una nueva sesión del entorno de ejecución o sustituye una vinculación obsoleta.

**La acción destructiva se rechaza:** compruebe los valores globales y por plugin de `allow_destructive_actions`. Incluso con `true`, `"auto"` o `"ask"`, los esquemas de solicitud de confirmación inseguros y la identidad ambigua del plugin se siguen rechazando de forma segura.

## Contenido relacionado

- [Entorno de ejecución de Codex](/es/plugins/codex-harness)
- [Referencia del entorno de ejecución de Codex](/es/plugins/codex-harness-reference)
- [Runtime del entorno de ejecución de Codex](/es/plugins/codex-harness-runtime)
- [Referencia de configuración](/es/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migración](/es/cli/migrate)
