---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen plugins nativos de Codex
    - Estás migrando plugins de Codex seleccionados por OpenAI e instalados desde el código fuente
    - Está configurando un plugin de Codex existente en un directorio de espacio de trabajo
    - Está solucionando problemas de codexPlugins, del inventario de aplicaciones, de acciones destructivas o del diagnóstico de aplicaciones de plugins
summary: Configura plugins nativos de Codex para agentes de OpenClaw en modo Codex
title: Plugins nativos de Codex
x-i18n:
    generated_at: "2026-07-12T14:37:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La compatibilidad nativa con plugins de Codex permite que un agente de OpenClaw en modo Codex use las capacidades de aplicaciones y plugins propias de Codex
app-server dentro del mismo hilo de Codex que gestiona el turno de OpenClaw. Las llamadas a plugins permanecen en la transcripción nativa de Codex;
Codex app-server controla la ejecución de MCP respaldada por aplicaciones. OpenClaw no traduce
los plugins de Codex en herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

Use esta página después de que el [entorno de ejecución de Codex](/es/plugins/codex-harness) básico esté
funcionando.

## Requisitos

- El entorno de ejecución del agente debe ser el entorno de ejecución nativo de Codex.
- `plugins.entries.codex.enabled` debe ser `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` debe ser `true`.
- El Codex app-server de destino debe poder ver el inventario esperado de marketplaces, plugins y
  aplicaciones.
- La migración solo admite plugins de `openai-curated` que haya detectado como
  instalados desde el código fuente en el directorio principal de Codex de origen.
- Los plugins de `workspace-directory` configurados manualmente requieren un Codex app-server
  cuyo `plugin/list` acepte `marketplaceKinds` y cuyos resúmenes de espacios de trabajo
  sin ruta incluyan `remotePluginId`. El plugin ya debe estar instalado y
  habilitado, y debe ser posible acceder a sus aplicaciones propias mediante `app/list`.

`codexPlugins` no afecta a las ejecuciones del proveedor de OpenClaw, a las vinculaciones de
conversaciones ACP ni a otros entornos de ejecución, porque esas rutas nunca crean hilos de Codex
app-server con una configuración nativa de `apps`.

La cuenta de Codex del lado de OpenAI, la disponibilidad de aplicaciones y los controles de aplicaciones y plugins del espacio de trabajo
proceden de la cuenta de Codex con la sesión iniciada. Consulte
[Usar Codex con su plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para conocer el modelo de cuenta y administración de OpenAI.

## Inicio rápido

Previsualice la migración desde el directorio principal de Codex de origen:

```bash
openclaw migrate codex --dry-run
```

Añada `--verify-plugin-apps` para hacer que la migración llame a `app/list` en el origen y
exija que cada aplicación propia esté presente, habilitada y accesible antes de
planificar la activación nativa:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Aplique la migración cuando el plan sea correcto:

```bash
openclaw migrate apply codex --yes
```

La migración escribe entradas explícitas de `codexPlugins` para los plugins aptos y
llama a `plugin/install` de Codex app-server para los plugins seleccionados. Una
configuración migrada tiene este aspecto:

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

La migración sigue limitada a `openai-curated`. Para usar un plugin existente de
`workspace-directory`, añádalo manualmente con el `summary.id` exacto
calificado por el marketplace que devuelva `plugin/list`. Por ejemplo, si
Codex devuelve `example-plugin@workspace-directory`, configure ese valor
completo en lugar de su nombre para mostrar:

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

OpenClaw no llama a `plugin/install` ni inicia la autenticación para un
plugin de `workspace-directory`. Instálelo, habilítelo y autentíquelo en Codex
antes de añadir o habilitar la política de OpenClaw. OpenClaw mantiene ocultas las aplicaciones cuando
la respuesta omite el marketplace exacto, el ID del plugin, el ID de detalle o las pruebas de
disponibilidad de la aplicación. Si Codex rechaza la solicitud explícita de `plugin/list` del espacio de trabajo,
OpenClaw informa de `marketplace_missing` para cada plugin habilitado del espacio de trabajo y
mantiene disponibles los plugins seleccionados descubiertos de forma independiente.

Tras cambiar `codexPlugins`, las nuevas conversaciones de Codex adoptan automáticamente el conjunto de
aplicaciones actualizado. Ejecute `/new` o `/reset` para actualizar la conversación
actual. No es necesario reiniciar el Gateway para los cambios de activación o desactivación de
plugins.

## Gestionar plugins desde el chat

`/codex plugins` inspecciona o modifica los plugins nativos de Codex configurados desde el
mismo chat donde se utiliza el entorno de ejecución de Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` es un alias de `/codex plugins list`. La lista muestra la
clave de cada plugin configurado, su estado activado/desactivado, el nombre del plugin de Codex y el marketplace
de `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` solo escriben en `~/.openclaw/openclaw.json`; nunca modifican
`~/.codex/config.toml` ni instalan nuevos plugins de Codex. Solo pueden ejecutarlos el propietario o un
cliente del Gateway con el ámbito `operator.admin`.

Al habilitar un plugin configurado, también se activa el conmutador global
`codexPlugins.enabled`. Si un plugin seleccionado se escribió como deshabilitado porque la migración devolvió
`auth_required`, vuelva a autorizar la aplicación en Codex antes de habilitarla en OpenClaw.
Para una entrada de `workspace-directory`, habilitarla aquí solo cambia la política de OpenClaw;
el plugin y la aplicación ya deben estar activos en Codex.

## Cómo funciona la configuración nativa de plugins

La integración realiza el seguimiento de tres estados:

| Estado     | Significado                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Instalado  | Codex tiene el paquete del plugin en el entorno de ejecución del app-server de destino.                                             |
| Habilitado | Codex informa que el plugin está habilitado y la configuración de OpenClaw lo permite para los turnos del entorno de ejecución de Codex. |
| Accesible  | Codex app-server confirma que las entradas de aplicaciones del plugin están disponibles para la cuenta activa y corresponden a la identidad configurada del plugin. |

Para los plugins de `openai-curated`, la migración es el paso duradero de instalación y
determinación de aptitud:

- Durante la planificación, OpenClaw lee los detalles de `plugin/read` de Codex de origen y
  comprueba que la cuenta del Codex app-server de origen sea una cuenta con suscripción a ChatGPT.
  Una respuesta de cuenta que no sea de ChatGPT o que falte omite los plugins respaldados por
  aplicaciones con `codex_subscription_required`.
- De forma predeterminada, la migración omite la llamada a `app/list` del origen: los plugins de origen
  respaldados por aplicaciones que superan la comprobación de cuenta se planifican sin verificar la
  accesibilidad de las aplicaciones de origen, y los fallos de transporte de la consulta de cuenta hacen que se
  omitan con `codex_account_unavailable`.
- Con `--verify-plugin-apps`, la migración toma una instantánea nueva de `app/list` del origen
  y exige que cada aplicación propia esté presente, habilitada y
  accesible antes de planificar la activación nativa. Los fallos de transporte de la consulta de
  cuenta pasan entonces a la comprobación del inventario de aplicaciones de origen en lugar de
  provocar una omisión directa.

Para los plugins de `workspace-directory`, la configuración se realiza fuera de OpenClaw. OpenClaw
consulta ese marketplace solo cuando se configura al menos una entrada habilitada del espacio de trabajo,
resuelve cada plugin mediante su `summary.id` exacto y reutiliza las comprobaciones existentes
de propiedad de `plugin/read` y de disponibilidad de `app/list`. Un plugin no instalado,
deshabilitado, inaccesible o no autenticado no expone ninguna aplicación; OpenClaw
no intenta instalarlo ni autenticarlo.

El inventario de aplicaciones en tiempo de ejecución es la comprobación de accesibilidad de la sesión de destino tanto para
los plugins seleccionados migrados como para los plugins del espacio de trabajo configurados manualmente. La
configuración de sesión del entorno de ejecución de Codex calcula una configuración restrictiva de aplicaciones del hilo a partir de las aplicaciones
de plugins habilitadas y accesibles; no se vuelve a calcular en cada turno, por lo que
`/codex plugins enable`/`disable` solo afecta a las
nuevas conversaciones de Codex. Use `/new` o `/reset` para aplicar el cambio en la
conversación actual.

## Límite de compatibilidad de V1

- Solo los plugins de `openai-curated` ya instalados en el inventario del Codex
  app-server de origen pueden migrarse.
- El tiempo de ejecución también admite entradas explícitas de `workspace-directory` en compilaciones del app-server
  cuyo `plugin/list` implemente `marketplaceKinds` y devuelva
  `remotePluginId` para resúmenes del espacio de trabajo sin ruta. Estas entradas deben usar
  su `summary.id` exacto calificado por el marketplace y ya deben estar instaladas,
  habilitadas y tener sus aplicaciones accesibles. Una solicitud rechazada de la lista del espacio de trabajo produce el
  diagnóstico existente `marketplace_missing` por plugin; si faltan pruebas del marketplace,
  del plugin, del detalle o de la aplicación, no se expone ninguna aplicación del espacio de trabajo. El inventario seleccionado
  de la solicitud de lista predeterminada sigue siendo utilizable.
- Los plugins de origen respaldados por aplicaciones deben superar la comprobación de suscripción durante la migración.
  `--verify-plugin-apps` añade la comprobación del inventario de aplicaciones de origen. Las cuentas
  bloqueadas por la comprobación de suscripción y, en el modo de verificación, las aplicaciones de origen inaccesibles,
  deshabilitadas o ausentes, o los fallos de actualización del inventario de aplicaciones, se notifican como elementos manuales
  omitidos en lugar de entradas de configuración habilitadas. Los detalles ilegibles de plugins se
  omiten antes de la comprobación del inventario de aplicaciones.
- La migración escribe identidades explícitas de plugins (`marketplaceName` y
  `pluginName`); no escribe rutas locales de caché `marketplacePath`.
- `codexPlugins.enabled` es el único conmutador global de habilitación; no hay ningún
  comodín `plugins["*"]` ni clave de configuración que conceda autoridad de instalación
  arbitraria.
- Los marketplaces no seleccionados, los paquetes de plugins almacenados en caché, los hooks y los archivos de configuración de
  Codex se conservan en el informe de migración para su revisión manual, pero no se activan
  automáticamente. El tiempo de ejecución acepta entradas de `workspace-directory` configuradas manualmente;
  los demás marketplaces siguen sin ser compatibles.

## Inventario y propiedad de aplicaciones

OpenClaw lee el inventario de aplicaciones de Codex mediante `app/list`, lo almacena
en memoria durante una hora y actualiza las entradas obsoletas o ausentes
de forma asíncrona. La caché es local al proceso; al reiniciar la CLI o el Gateway
se descarta, y OpenClaw la reconstruye a partir de la siguiente lectura de `app/list`.

La migración y el tiempo de ejecución usan claves de caché distintas:

- La verificación de la migración de origen usa el directorio principal y las opciones de inicio de Codex
  de origen. Solo se ejecuta con `--verify-plugin-apps` y fuerza un recorrido nuevo
  de `app/list` del origen para esa ejecución de planificación.
- La configuración del tiempo de ejecución de destino usa la identidad del Codex app-server del agente de destino al
  crear la configuración de aplicaciones del hilo. La activación de un plugin seleccionado invalida esa
  clave de caché de destino y, después de `plugin/install`, fuerza su actualización.
  La configuración de `workspace-directory` nunca ejecuta esta ruta de activación.

Una aplicación de plugin solo se expone cuando OpenClaw puede asociarla con el plugin configurado
mediante una propiedad estable: un ID de aplicación exacto de los detalles del plugin, un nombre
de servidor MCP conocido o metadatos estables únicos. La propiedad basada solo en el nombre
para mostrar o que resulte ambigua se excluye hasta que la siguiente actualización del inventario demuestre la propiedad.

## Aplicaciones de cuentas conectadas

Los agentes operados por el propietario pueden habilitar todas las aplicaciones ya conectadas a su cuenta de Codex
sin necesitar un paquete de plugin correspondiente:

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

`allow_all_plugins: true` toma una instantánea completa de `app/list` cuando se establece un nuevo hilo
nativo de Codex y admite únicamente las aplicaciones marcadas como accesibles para esa
cuenta. No instala, autentica ni habilita aplicaciones globalmente. Los hilos
existentes conservan su conjunto persistente de aplicaciones; use `/new`, `/reset` o reinicie el
Gateway para aplicar las aplicaciones recién conectadas o revocadas.

Las aplicaciones de la cuenta heredan el valor global `codexPlugins.allow_destructive_actions`,
que acepta `true`, `false`, `"auto"` o `"ask"`. La política explícita por plugin
anula la política global para los ID de aplicaciones coincidentes. Los fallos del inventario se cierran
de forma segura en lugar de recurrir a un valor predeterminado sin restricciones.

## Configuración de aplicaciones del hilo

OpenClaw inyecta un parche restrictivo de `config.apps` para el hilo de Codex:
`_default` está deshabilitado y solo se habilitan las aplicaciones pertenecientes a plugins configurados y habilitados o
las aplicaciones accesibles de la cuenta admitidas por `allow_all_plugins`.

El valor de `destructive_enabled` de cada aplicación proviene de la política efectiva global o
por plugin `allow_destructive_actions`; `true`, `"auto"` y `"ask"`
establecen `destructive_enabled: true`, mientras que `false` lo establece en `false`. Codex sigue
aplicando los metadatos de herramientas destructivas de sus anotaciones nativas de herramientas de aplicaciones.
`_default` está deshabilitado con `open_world_enabled: false`; las aplicaciones de plugins habilitados
reciben `open_world_enabled: true`. OpenClaw no expone un control de política de mundo abierto
independiente a nivel de plugin ni mantiene listas de denegación por plugin
basadas en nombres de herramientas destructivas.

El modo de aprobación de herramientas es automático de forma predeterminada para las aplicaciones admitidas, por lo que las herramientas de lectura
no destructivas se ejecutan sin solicitar aprobación en el mismo hilo. Las herramientas destructivas siguen
controladas por la política `destructive_enabled` de cada aplicación.

## Política de acciones destructivas

Las solicitudes de interacción destructivas de los plugins se permiten de forma predeterminada para los plugins de Codex
configurados, mientras que los esquemas inseguros y la propiedad ambigua se rechazan de forma segura:

- El valor predeterminado de `allow_destructive_actions` global es `true`.
- El valor de `allow_destructive_actions` por plugin anula la política global para
  ese plugin.
- `false`: OpenClaw devuelve un rechazo determinista.
- `true`: OpenClaw acepta automáticamente solo los esquemas seguros que puede asignar a una respuesta de
  aprobación, como un campo booleano de aprobación.
- `"auto"`: OpenClaw expone las acciones destructivas de plugins a Codex y, a continuación,
  convierte las solicitudes de aprobación de MCP cuya propiedad está demostrada en aprobaciones de plugins de
  OpenClaw antes de devolver la respuesta de aprobación de Codex.
- `"ask"`: OpenClaw usa el mismo control de escritura y acciones destructivas de Codex que
  `"auto"`, elimina las anulaciones duraderas de aprobación por herramienta de Codex para la aplicación
  antes de que se inicie el hilo y solo ofrece aprobación o denegación para una única ocasión, de modo que
  las aprobaciones duraderas no puedan suprimir solicitudes posteriores de acciones de escritura. Para cada
  aplicación admitida que use `"ask"`, OpenClaw selecciona el revisor de aprobaciones humanas
  de Codex para esa aplicación, de modo que Codex envíe sus solicitudes de aprobación a
  OpenClaw; las demás aplicaciones y las aprobaciones del hilo que no correspondan a aplicaciones conservan su revisor
  y su política configurados.
- Si falta la identidad del plugin, la propiedad es ambigua, falta el identificador
  del turno o no coincide, o el esquema de solicitud de interacción es inseguro, se rechaza la acción en lugar de solicitar confirmación.

## Solución de problemas

| Código                                            | Significado                                                                                                                                            | Solución                                                                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | La migración instaló el plugin, pero una de sus aplicaciones aún necesita autenticación. La entrada se escribe deshabilitada hasta que vuelva a autorizarla. | Vuelva a autorizar la aplicación en Codex y, a continuación, habilite el plugin en OpenClaw.                                                       |
| `app_inaccessible`, `app_disabled`, `app_missing` | Con `--verify-plugin-apps`, el inventario de aplicaciones de Codex de origen no mostró todas las aplicaciones pertenecientes al plugin como presentes, habilitadas y accesibles. | Vuelva a autorizar o habilite la aplicación en Codex y, a continuación, vuelva a ejecutar la migración con `--verify-plugin-apps`.                 |
| `app_inventory_unavailable`                       | Se solicitó una verificación estricta de las aplicaciones de origen, pero falló la actualización del inventario de aplicaciones de Codex de origen.    | Corrija el acceso al servidor de aplicaciones de Codex de origen o vuelva a intentarlo sin `--verify-plugin-apps` para aceptar el plan más rápido limitado por la cuenta. |
| `codex_subscription_required`                     | La cuenta del servidor de aplicaciones de Codex de origen no era una cuenta con suscripción a ChatGPT.                                                 | Inicie sesión en la aplicación Codex mediante autenticación de suscripción y, a continuación, vuelva a ejecutar la migración.                     |
| `codex_account_unavailable`                       | No se pudo leer la cuenta del servidor de aplicaciones de Codex de origen.                                                                             | Corrija la autenticación del servidor de aplicaciones de Codex de origen o vuelva a ejecutar con `--verify-plugin-apps` para que el inventario de aplicaciones de origen determine la elegibilidad. |
| `marketplace_missing`, `plugin_missing`           | El marketplace o el plugin exacto no están disponibles; es posible que se haya rechazado la solicitud explícita del catálogo del espacio de trabajo; las aplicaciones del espacio de trabajo se rechazan de forma segura. | Verifique el contrato compatible del servidor de aplicaciones y el ID exacto descrito a continuación.                                             |
| `plugin_detail_unavailable`                       | OpenClaw no pudo leer los detalles de propiedad del plugin.                                                                                            | Inspeccione las respuestas `plugin/list` y `plugin/read` del servidor de aplicaciones de destino.                                                 |
| `plugin_disabled`                                 | Codex indica que el plugin está instalado, pero deshabilitado.                                                                                         | La activación seleccionada puede repararlo; habilite un plugin del espacio de trabajo en Codex antes de volver a intentarlo.                       |
| `plugin_activation_failed`                        | La activación del plugin no se completó.                                                                                                               | Use el diagnóstico adjunto para distinguir entre fallos del marketplace, de autenticación, de actualización o de preparación del espacio de trabajo. |
| `app_inventory_missing`, `app_inventory_stale`    | El estado de preparación de la aplicación provino de una caché vacía u obsoleta.                                                                       | OpenClaw programa automáticamente una actualización asíncrona; las aplicaciones de plugins permanecen excluidas hasta que se conozcan la propiedad y el estado de preparación. |
| `app_ownership_ambiguous`                         | El inventario de aplicaciones solo encontró coincidencia por el nombre mostrado.                                                                       | La aplicación permanece oculta para el hilo de Codex hasta que una actualización posterior demuestre la propiedad.                               |

**El plugin del espacio de trabajo está instalado, pero no está visible:** confirme que el resultado
`plugin/list` del espacio de trabajo indique que el ID configurado exacto está instalado y habilitado;
a continuación, confirme que `app/list` indique que todas las aplicaciones pertenecientes al plugin son accesibles para la misma cuenta de
Codex. OpenClaw puede habilitar una aplicación accesible para el hilo incluso cuando el
inventario de la cuenta indique actualmente que está deshabilitada. Si cambió ese estado después de que el gateway almacenara en caché el inventario de
aplicaciones, espere a la actualización de la caché que se realiza cada hora o reinicie el gateway y, a continuación, use
`/new` o `/reset`. OpenClaw no repara ni autentica plugins del espacio de trabajo.
Si se rechaza la solicitud explícita de la lista del espacio de trabajo, cada entrada habilitada del espacio de trabajo
indica `marketplace_missing`; las entradas seleccionadas no relacionadas siguen procesándose
a partir de la respuesta predeterminada de la lista.

Para `plugin_detail_unavailable`, un resumen del espacio de trabajo sin ruta debe incluir
`remotePluginId`; OpenClaw mantiene ocultas las aplicaciones pertenecientes al plugin cuando ese selector o el
resultado posterior de `plugin/read` no están disponibles. Para
`plugin_activation_failed`, los plugins seleccionados pueden indicar un fallo del marketplace, de autenticación o
de actualización posterior a la instalación. Un plugin del espacio de trabajo indica este código cuando
aún no está activo; instálelo, habilítelo y autentíquelo fuera de OpenClaw.

**La configuración cambió, pero el agente no puede ver el plugin:** ejecute `/codex plugins
list` para confirmar el estado configurado y, a continuación, `/new` o `/reset`. Las vinculaciones existentes de
hilos de Codex conservan la configuración de aplicaciones con la que se iniciaron hasta que OpenClaw
establezca una nueva sesión del entorno de ejecución o sustituya una vinculación obsoleta.

**La acción destructiva se rechaza:** compruebe los valores globales y por plugin de
`allow_destructive_actions`. Incluso con `true`, `"auto"` o `"ask"`,
los esquemas de solicitud de interacción inseguros y una identidad de plugin ambigua se siguen rechazando de forma segura.

## Contenido relacionado

- [Entorno de ejecución de Codex](/es/plugins/codex-harness)
- [Referencia del entorno de ejecución de Codex](/es/plugins/codex-harness-reference)
- [Entorno de ejecución en tiempo de ejecución de Codex](/es/plugins/codex-harness-runtime)
- [Referencia de configuración](/es/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migración](/es/cli/migrate)
