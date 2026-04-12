---
read_when:
    - Creación o depuración de plugins nativos de OpenClaw
    - Comprender el modelo de capacidades del plugin o los límites de propiedad
    - Trabajar en la canalización de carga o el registro del plugin
    - Implementar hooks del entorno de ejecución del proveedor o plugins de canal
sidebarTitle: Internals
summary: 'Detalles internos del Plugin: modelo de capacidades, propiedad, contratos, canalización de carga y utilidades de entorno de ejecución'
title: Detalles internos del Plugin
x-i18n:
    generated_at: "2026-04-12T23:28:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37361c1e9d2da57c77358396f19dfc7f749708b66ff68f1bf737d051b5d7675d
    source_path: plugins/architecture.md
    workflow: 15
---

# Detalles internos del Plugin

<Info>
  Esta es la **referencia profunda de arquitectura**. Para guías prácticas, consulta:
  - [Instalar y usar plugins](/es/tools/plugin) — guía de usuario
  - [Primeros pasos](/es/plugins/building-plugins) — primer tutorial de plugins
  - [Plugins de canal](/es/plugins/sdk-channel-plugins) — crea un canal de mensajería
  - [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crea un proveedor de modelos
  - [Descripción general del SDK](/es/plugins/sdk-overview) — mapa de importaciones y API de registro
</Info>

Esta página cubre la arquitectura interna del sistema de plugins de OpenClaw.

## Modelo público de capacidades

Las capacidades son el modelo público de **plugin nativo** dentro de OpenClaw. Cada
plugin nativo de OpenClaw se registra en uno o más tipos de capacidad:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferencia de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferencia CLI | `api.registerCliBackend(...)`                 | `openai`, `anthropic`                |
| Voz                    | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                      |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Comprensión de medios  | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generación de música   | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Obtención web          | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensajería     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Un plugin que registra cero capacidades pero proporciona hooks, herramientas o
servicios es un plugin **legacy solo con hooks**. Ese patrón sigue siendo totalmente compatible.

### Postura de compatibilidad externa

El modelo de capacidades ya está integrado en el núcleo y hoy lo usan plugins
nativos/incluidos, pero la compatibilidad para plugins externos todavía necesita un estándar más estricto que “está exportado, por lo tanto está congelado”.

Guía actual:

- **plugins externos existentes:** mantener funcionando las integraciones basadas en hooks; tratar esto como la base de compatibilidad
- **nuevos plugins nativos/incluidos:** preferir el registro explícito de capacidades en lugar de accesos específicos por proveedor o nuevos diseños solo con hooks
- **plugins externos que adopten registro de capacidades:** permitido, pero tratar las superficies auxiliares específicas de capacidad como evolutivas salvo que la documentación marque explícitamente un contrato como estable

Regla práctica:

- las API de registro de capacidades son la dirección prevista
- los hooks legacy siguen siendo la ruta más segura para evitar roturas en plugins externos durante la transición
- no todas las subrutas auxiliares exportadas son iguales; prefiere el contrato estrecho documentado, no exportaciones auxiliares incidentales

### Formas de los plugins

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real
de registro (no solo por metadatos estáticos):

- **plain-capability** -- registra exactamente un tipo de capacidad (por ejemplo, un plugin solo de proveedor como `mistral`)
- **hybrid-capability** -- registra varios tipos de capacidad (por ejemplo,
  `openai` es propietario de inferencia de texto, voz, comprensión de medios y generación de imágenes)
- **hook-only** -- registra solo hooks (tipados o personalizados), sin capacidades,
  herramientas, comandos ni servicios
- **non-capability** -- registra herramientas, comandos, servicios o rutas, pero no capacidades

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin y el desglose
de capacidades. Consulta [referencia de CLI](/cli/plugins#inspect) para más detalles.

### Hooks legacy

El hook `before_agent_start` sigue siendo compatible como ruta de compatibilidad para
plugins solo con hooks. Plugins legacy del mundo real todavía dependen de él.

Dirección:

- mantenerlo funcionando
- documentarlo como legacy
- preferir `before_model_resolve` para trabajo de sustitución de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación del prompt
- eliminarlo solo cuando baje el uso real y la cobertura de fixtures demuestre seguridad de migración

### Señales de compatibilidad

Cuando ejecutes `openclaw doctor` o `openclaw plugins inspect <id>`, es posible que veas
una de estas etiquetas:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configuración se analiza correctamente y los plugins se resuelven |
| **compatibility advisory** | El plugin usa un patrón compatible pero más antiguo (p. ej. `hook-only`) |
| **legacy warning**         | El plugin usa `before_agent_start`, que está en desuso       |
| **hard error**             | La configuración no es válida o el plugin no se pudo cargar  |

Ni `hook-only` ni `before_agent_start` romperán tu plugin hoy --
`hook-only` es solo informativo, y `before_agent_start` solo activa una advertencia. Estas
señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Descripción general de la arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

1. **Manifest + descubrimiento**
   OpenClaw encuentra plugins candidatos a partir de rutas configuradas, raíces del espacio de trabajo,
   raíces globales de extensiones y extensiones incluidas. El descubrimiento lee primero
   los manifiestos nativos `openclaw.plugin.json` junto con los manifiestos de bundles compatibles.
2. **Habilitación + validación**
   El núcleo decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o
   seleccionado para un slot exclusivo, como memory.
3. **Carga en tiempo de ejecución**
   Los plugins nativos de OpenClaw se cargan en proceso mediante jiti y registran
   capacidades en un registro central. Los bundles compatibles se normalizan en
   registros del registro sin importar código de entorno de ejecución.
4. **Consumo de superficie**
   El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración
   de proveedores, hooks, rutas HTTP, comandos CLI y servicios.

En el caso específico de la CLI de plugins, el descubrimiento del comando raíz se divide en dos fases:

- los metadatos en tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo real de CLI del plugin puede seguir siendo lazy y registrarse en la primera invocación

Eso mantiene el código de CLI propiedad del plugin dentro del plugin, a la vez que permite a OpenClaw
reservar nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- el descubrimiento y la validación de configuración deben funcionar a partir de **metadatos de manifiesto/esquema**
  sin ejecutar código del plugin
- el comportamiento nativo en tiempo de ejecución proviene de la ruta `register(api)` del módulo del plugin

Esa separación permite a OpenClaw validar configuración, explicar plugins faltantes o deshabilitados, y
crear sugerencias de UI/esquema antes de que el entorno de ejecución completo esté activo.

### Plugins de canal y la herramienta compartida de mensajes

Los plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para
acciones normales de chat. OpenClaw mantiene una sola herramienta `message` compartida en el núcleo, y
los plugins de canal son propietarios del descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el núcleo es propietario del host de la herramienta `message` compartida, del cableado del prompt, del
  mantenimiento de sesiones/hilos y del despacho de ejecución
- los plugins de canal son propietarios del descubrimiento de acciones acotadas, del descubrimiento de
  capacidades y de cualquier fragmento de esquema específico del canal
- los plugins de canal son propietarios de la gramática de conversación de sesión específica del proveedor, como
  cómo los ids de conversación codifican ids de hilos o se heredan de conversaciones padre
- los plugins de canal ejecutan la acción final mediante su adaptador de acciones

Para plugins de canal, la superficie del SDK es
`ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada de descubrimiento unificada
permite que un plugin devuelva sus acciones visibles, capacidades y contribuciones al esquema
juntas, para que esas piezas no se desalineen.

El núcleo pasa el ámbito de entorno de ejecución a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Eso importa para plugins sensibles al contexto. Un canal puede ocultar o exponer
acciones de mensajes según la cuenta activa, la sala/hilo/mensaje actual o la identidad confiable
del solicitante, sin codificar ramas específicas del canal en la herramienta `message` del núcleo.

Por eso los cambios de routing del embedded-runner siguen siendo trabajo del plugin: el runner es
responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del plugin para que la
herramienta `message` compartida exponga la superficie correcta propiedad del canal en el turno actual.

Para utilidades de ejecución propiedad del canal, los plugins incluidos deben mantener el entorno de ejecución
de ejecución dentro de sus propios módulos de extensión. El núcleo ya no es propietario de los entornos de ejecución
de acciones de mensajes de Discord, Slack, Telegram o WhatsApp en `src/agents/tools`.
No publicamos subrutas `plugin-sdk/*-action-runtime` separadas, y los
plugins incluidos deben importar directamente su propio código de entorno de ejecución local desde sus
módulos de extensión de su propiedad.

El mismo límite se aplica a las uniones del SDK con nombre de proveedor en general: el núcleo no
debe importar barriles de conveniencia específicos de canal para extensiones como Slack, Discord, Signal,
WhatsApp o similares. Si el núcleo necesita un comportamiento, debe consumir el
barril `api.ts` / `runtime-api.ts` propio del plugin incluido o promover la necesidad
a una capacidad genérica y estrecha en el SDK compartido.

En el caso específico de las encuestas, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para canales que encajan en el modelo común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semánticas de encuestas específicas del canal o parámetros adicionales de encuestas

El núcleo ahora difiere el análisis compartido de encuestas hasta después de que el despacho de encuestas del plugin
rechace la acción, para que los controladores de encuestas propiedad del plugin puedan aceptar
campos de encuesta específicos del canal sin quedar bloqueados primero por el analizador genérico de encuestas.

Consulta [Canalización de carga](#load-pipeline) para la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata a un plugin nativo como el límite de propiedad de una **empresa** o de una
**función**, no como una bolsa de integraciones no relacionadas.

Eso significa:

- un plugin de empresa normalmente debe ser propietario de todas las
  superficies de OpenClaw orientadas a esa empresa
- un plugin de función normalmente debe ser propietario de toda la superficie de la función que introduce
- los canales deben consumir capacidades compartidas del núcleo en lugar de volver a implementar
  comportamiento de proveedores de forma ad hoc

Ejemplos:

- el plugin incluido `openai` es propietario del comportamiento de proveedor de modelos de OpenAI y del
  comportamiento de OpenAI de voz + voz en tiempo real + comprensión de medios + generación de imágenes
- el plugin incluido `elevenlabs` es propietario del comportamiento de voz de ElevenLabs
- el plugin incluido `microsoft` es propietario del comportamiento de voz de Microsoft
- el plugin incluido `google` es propietario del comportamiento de proveedor de modelos de Google además del comportamiento de Google de
  comprensión de medios + generación de imágenes + búsqueda web
- el plugin incluido `firecrawl` es propietario del comportamiento de obtención web de Firecrawl
- los plugins incluidos `minimax`, `mistral`, `moonshot` y `zai` son propietarios de sus
  backends de comprensión de medios
- el plugin incluido `qwen` es propietario del comportamiento de proveedor de texto de Qwen además del
  comportamiento de comprensión de medios y generación de video
- el plugin `voice-call` es un plugin de función: es propietario de transporte de llamadas, herramientas,
  CLI, rutas y el puente de flujo de medios de Twilio, pero consume capacidades compartidas de voz
  además de transcripción en tiempo real y voz en tiempo real en lugar de importar directamente plugins de proveedor

El estado final previsto es:

- OpenAI reside en un solo plugin aunque abarque modelos de texto, voz, imágenes y
  video futuro
- otro proveedor puede hacer lo mismo para su propia área de superficie
- los canales no se preocupan por qué plugin del proveedor es propietario del proveedor; consumen el
  contrato de capacidad compartido expuesto por el núcleo

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capability** = contrato del núcleo que múltiples plugins pueden implementar o consumir

Así que si OpenClaw agrega un nuevo dominio como video, la primera pregunta no es
“¿qué proveedor debería codificar de forma rígida el manejo de video?”. La primera pregunta es “¿cuál es
el contrato de capacidad de video del núcleo?”. Una vez que ese contrato existe, los plugins de proveedor
pueden registrarse en él y los plugins de canal/función pueden consumirlo.

Si la capacidad aún no existe, lo correcto normalmente es:

1. definir la capacidad faltante en el núcleo
2. exponerla mediante la API/el entorno de ejecución del plugin de forma tipada
3. conectar canales/funciones a esa capacidad
4. dejar que los plugins de proveedor registren implementaciones

Esto mantiene la propiedad explícita y evita un comportamiento del núcleo que dependa de un
único proveedor o de una ruta de código específica de un plugin aislado.

### Estratificación de capacidades

Usa este modelo mental al decidir dónde debe ir el código:

- **capa de capacidad del núcleo**: orquestación compartida, política, fallback, reglas de
  combinación de configuración, semántica de entrega y contratos tipados
- **capa de plugin de proveedor**: API específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz,
  generación de imágenes, futuros backends de video, endpoints de uso
- **capa de plugin de canal/función**: integración con Slack/Discord/voice-call/etc.
  que consume capacidades del núcleo y las presenta en una superficie

Por ejemplo, TTS sigue esta forma:

- el núcleo es propietario de la política de TTS en tiempo de respuesta, el orden de fallback, las preferencias y la entrega por canal
- `openai`, `elevenlabs` y `microsoft` son propietarios de las implementaciones de síntesis
- `voice-call` consume la utilidad de entorno de ejecución de TTS para telefonía

Ese mismo patrón debería preferirse para capacidades futuras.

### Ejemplo de plugin de empresa con múltiples capacidades

Un plugin de empresa debería sentirse coherente desde fuera. Si OpenClaw tiene contratos compartidos
para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios,
generación de imágenes, generación de video, obtención web y búsqueda web,
un proveedor puede ser propietario de todas sus superficies en un solo lugar:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // hooks de autenticación/catálogo de modelos/entorno de ejecución
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configuración de voz del proveedor — implementa directamente la interfaz SpeechProviderPlugin
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // lógica de credenciales + obtención
      }),
    );
  },
};

export default plugin;
```

Lo importante no son los nombres exactos de las utilidades. Lo importante es la forma:

- un solo plugin es propietario de la superficie del proveedor
- el núcleo sigue siendo propietario de los contratos de capacidad
- los canales y plugins de función consumen utilidades `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden comprobar que el plugin registró las capacidades de las que
  afirma ser propietario

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imágenes/audio/video como una sola
capacidad compartida. El mismo modelo de propiedad se aplica aquí:

1. el núcleo define el contrato de comprensión de medios
2. los plugins de proveedor registran `describeImage`, `transcribeAudio` y
   `describeVideo` según corresponda
3. los canales y plugins de función consumen el comportamiento compartido del núcleo en lugar de
   conectarse directamente al código del proveedor

Eso evita incorporar en el núcleo las suposiciones de video de un solo proveedor. El plugin es propietario
de la superficie del proveedor; el núcleo es propietario del contrato de capacidad y del comportamiento de fallback.

La generación de video ya usa esa misma secuencia: el núcleo es propietario del contrato de
capacidad tipado y de la utilidad de entorno de ejecución, y los plugins de proveedor registran
implementaciones `api.registerVideoGenerationProvider(...)` en función de él.

¿Necesitas una lista de verificación concreta para el despliegue? Consulta
[Capability Cookbook](/es/plugins/architecture).

## Contratos y aplicación

La superficie de la API de plugins es intencionadamente tipada y centralizada en
`OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y
las utilidades de entorno de ejecución en las que un plugin puede basarse.

Por qué esto importa:

- los autores de plugins obtienen un estándar interno estable
- el núcleo puede rechazar propiedad duplicada, como dos plugins que registren el mismo
  id de proveedor
- el inicio puede mostrar diagnósticos procesables para registros mal formados
- las pruebas de contrato pueden aplicar la propiedad de plugins incluidos y evitar desvíos silenciosos

Hay dos capas de aplicación:

1. **aplicación del registro en tiempo de ejecución**
   El registro de plugins valida los registros mientras se cargan los plugins. Ejemplos:
   ids de proveedor duplicados, ids de proveedor de voz duplicados y registros
   mal formados producen diagnósticos de plugin en lugar de comportamiento indefinido.
2. **pruebas de contrato**
   Los plugins incluidos se capturan en registros de contrato durante las ejecuciones de prueba para que
   OpenClaw pueda afirmar explícitamente la propiedad. Hoy esto se usa para proveedores
   de modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registro incluida.

El efecto práctico es que OpenClaw sabe, por adelantado, qué plugin es propietario de qué
superficie. Eso permite que el núcleo y los canales se compongan sin problemas porque la
propiedad está declarada, tipada y es comprobable, en lugar de implícita.

### Qué pertenece a un contrato

Los buenos contratos de plugins son:

- tipados
- pequeños
- específicos de capacidad
- propiedad del núcleo
- reutilizables por varios plugins
- consumibles por canales/funciones sin conocimiento del proveedor

Los malos contratos de plugins son:

- política específica del proveedor oculta en el núcleo
- vías de escape puntuales de plugins que eluden el registro
- código de canal que accede directamente a una implementación de proveedor
- objetos de entorno de ejecución ad hoc que no forman parte de `OpenClawPluginApi` ni de
  `api.runtime`

Si tienes dudas, eleva el nivel de abstracción: define primero la capacidad y luego
deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en proceso** con el Gateway. No están
aislados. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que
el código del núcleo.

Implicaciones:

- un plugin nativo puede registrar herramientas, controladores de red, hooks y servicios
- un error en un plugin nativo puede bloquear o desestabilizar el gateway
- un plugin nativo malicioso equivale a ejecución arbitraria de código dentro del
  proceso de OpenClaw

Los bundles compatibles son más seguros por defecto porque OpenClaw actualmente los trata
como paquetes de metadatos/contenido. En las versiones actuales, eso significa sobre todo
Skills incluidas.

Usa allowlists y rutas explícitas de instalación/carga para plugins no incluidos. Trata
los plugins del espacio de trabajo como código de tiempo de desarrollo, no como valores predeterminados de producción.

Para nombres de paquetes incluidos del espacio de trabajo, mantén el id del plugin anclado en el nombre npm:
`@openclaw/<id>` por defecto, o un sufijo tipado aprobado como
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando
el paquete expone intencionadamente un rol de plugin más acotado.

Nota importante de confianza:

- `plugins.allow` confía en **ids de plugins**, no en la procedencia del origen.
- Un plugin del espacio de trabajo con el mismo id que un plugin incluido sustituye intencionadamente
  la copia incluida cuando ese plugin del espacio de trabajo está habilitado/en la allowlist.
- Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes.

## Límite de exportación

OpenClaw exporta capacidades, no conveniencias de implementación.

Mantén público el registro de capacidades. Recorta las exportaciones auxiliares que no sean contratos:

- subrutas auxiliares específicas de plugins incluidos
- subrutas de infraestructura de entorno de ejecución que no estén destinadas a ser API pública
- utilidades de conveniencia específicas del proveedor
- utilidades de configuración/onboarding que sean detalles de implementación

Algunas subrutas auxiliares de plugins incluidos siguen permaneciendo en el mapa de exportaciones del SDK generado
por compatibilidad y mantenimiento de plugins incluidos. Ejemplos actuales incluyen
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y varias uniones `plugin-sdk/matrix*`. Trata esas como
exportaciones reservadas de detalle de implementación, no como el patrón de SDK recomendado para
nuevos plugins de terceros.

## Canalización de carga

Al inicio, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de plugins
2. lee manifiestos nativos o de bundles compatibles y metadatos de paquetes
3. rechaza candidatos no seguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga módulos nativos habilitados mediante jiti
7. llama a los hooks nativos `register(api)` (o `activate(api)` — un alias legacy) y recopila los registros en el registro de plugins
8. expone el registro a comandos/superficies de entorno de ejecución

<Note>
`activate` es un alias legacy de `register` — el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins incluidos usan `register`; para plugins nuevos, prefiere `register`.
</Note>

Las compuertas de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean
cuando la entrada sale de la raíz del plugin, la ruta es escribible por cualquiera o la propiedad de la ruta parece sospechosa para plugins no incluidos.

### Comportamiento orientado al manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del bundle
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/placeholders de la UI de Control
- mostrar metadatos de instalación/catálogo
- conservar descriptores baratos de activación y configuración sin cargar el entorno de ejecución del plugin

Para plugins nativos, el módulo de entorno de ejecución es la parte del plano de datos. Registra el
comportamiento real, como hooks, herramientas, comandos o flujos de proveedores.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores solo de metadatos para la planificación de activación y el descubrimiento de configuración;
no sustituyen el registro en tiempo de ejecución, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan sugerencias de manifiesto para comandos, canales y proveedores
para acotar la carga de plugins antes de una materialización más amplia del registro:

- la carga de CLI se limita a plugins que sean propietarios del comando primario solicitado
- la configuración de canal/resolución de plugins se limita a plugins que sean propietarios del
  id de canal solicitado
- la configuración explícita del proveedor/resolución del entorno de ejecución se limita a plugins que sean propietarios del
  id de proveedor solicitado

El descubrimiento de configuración ahora prefiere ids propiedad del descriptor como `setup.providers` y
`setup.cliBackends` para acotar plugins candidatos antes de recurrir a
`setup-api` para plugins que aún necesitan hooks de entorno de ejecución en tiempo de configuración. Si más de
un plugin descubierto afirma el mismo id normalizado de proveedor de configuración o backend de CLI, la búsqueda de configuración rechaza al propietario ambiguo en lugar de depender del orden de descubrimiento.

### Qué almacena en caché el cargador

OpenClaw mantiene cachés breves en proceso para:

- resultados de descubrimiento
- datos del registro de manifiestos
- registros de plugins cargados

Estas cachés reducen el arranque brusco y la sobrecarga de comandos repetidos. Es seguro
pensar en ellas como cachés de rendimiento de corta duración, no como persistencia.

Nota de rendimiento:

- Establece `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desactivar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los plugins cargados no mutan directamente variables globales aleatorias del núcleo. Se registran en un
registro central de plugins.

El registro rastrea:

- registros de plugins (identidad, origen, procedencia, estado, diagnósticos)
- herramientas
- hooks legacy y hooks tipados
- canales
- proveedores
- controladores RPC del Gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad del plugin

Luego, las funciones del núcleo leen de ese registro en lugar de hablar directamente
con los módulos de plugins. Esto mantiene la carga en una sola dirección:

- módulo del plugin -> registro en el registro
- entorno de ejecución del núcleo -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo
necesitan un punto de integración: “leer el registro”, no “hacer casos especiales para cada módulo de plugin”.

## Callbacks de enlace de conversación

Los plugins que enlazan una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de enlace sea aprobada o denegada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Ahora existe un enlace para este plugin + conversación.
        console.log(event.binding?.conversationId);
        return;
      }

      // La solicitud fue denegada; limpia cualquier estado pendiente local.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos de la carga útil del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: el enlace resuelto para solicitudes aprobadas
- `request`: el resumen de la solicitud original, la pista de desvinculación, el id del remitente y
  los metadatos de la conversación

Este callback es solo de notificación. No cambia quién tiene permitido enlazar una
conversación, y se ejecuta después de que termine el manejo de aprobación del núcleo.

## Hooks del entorno de ejecución del proveedor

Los plugins de proveedor ahora tienen dos capas:

- metadatos del manifiesto: `providerAuthEnvVars` para una búsqueda barata de autenticación del proveedor mediante variables de entorno
  antes de cargar el entorno de ejecución, `providerAuthAliases` para variantes de proveedor que comparten
  autenticación, `channelEnvVars` para una búsqueda barata de configuración/autenticación de canal mediante variables de entorno antes de la carga del entorno de ejecución,
  además de `providerAuthChoices` para etiquetas baratas de onboarding/elección de autenticación y
  metadatos de flags de CLI antes de cargar el entorno de ejecución
- hooks en tiempo de configuración: `catalog` / `discovery` legacy más `applyConfigDefaults`
- hooks en tiempo de ejecución: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw sigue siendo propietario del bucle genérico del agente, el failover, el manejo de transcripciones y la
política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico del proveedor sin
necesitar un transporte de inferencia completamente personalizado.

Usa `providerAuthEnvVars` del manifiesto cuando el proveedor tenga credenciales basadas en variables de entorno
que las rutas genéricas de autenticación/estado/selector de modelos deban ver sin cargar el entorno de ejecución del plugin.
Usa `providerAuthAliases` del manifiesto cuando un id de proveedor deba reutilizar
las variables de entorno, perfiles de autenticación, autenticación basada en configuración y la opción de onboarding de clave API de otro id de proveedor.
Usa `providerAuthChoices` del manifiesto cuando las
superficies CLI de onboarding/elección de autenticación deban conocer el id de elección del proveedor, las etiquetas de grupo y el cableado simple de autenticación con una sola flag sin cargar el entorno de ejecución del proveedor. Mantén `envVars` del entorno de ejecución del proveedor para sugerencias orientadas al operador, como etiquetas de onboarding o variables de configuración de client-id/client-secret de OAuth.

Usa `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración controlada por variables de entorno que
las rutas genéricas de fallback de variables de entorno del shell, las comprobaciones de configuración/estado o los prompts de configuración deban ver
sin cargar el entorno de ejecución del canal.

### Orden y uso de hooks

Para plugins de modelo/proveedor, OpenClaw llama a los hooks aproximadamente en este orden.
La columna “Cuándo usar” es la guía rápida de decisión.

| #   | Hook                              | Qué hace                                                                                                       | Cuándo usarlo                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`           | El proveedor es propietario de un catálogo o de valores predeterminados de URL base                                                        |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales de configuración propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, del entorno o de la semántica de la familia de modelos del proveedor       |
| --  | _(built-in model lookup)_         | OpenClaw intenta primero la ruta normal de registro/catálogo                                                   | _(no es un hook de plugin)_                                                                                                                 |
| 3   | `normalizeModelId`                | Normaliza alias legacy o de vista previa de ids de modelo antes de la búsqueda                                | El proveedor es propietario de la limpieza de alias antes de la resolución canónica del modelo                                             |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo              | El proveedor es propietario de la limpieza del transporte para ids de proveedor personalizados en la misma familia de transporte           |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución del entorno de ejecución/proveedor                   | El proveedor necesita limpieza de configuración que debería vivir con el plugin; las utilidades incluidas de la familia Google también respaldan entradas de configuración de Google compatibles |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a proveedores de configuración               | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por el endpoint                                      |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación con marcador de entorno para proveedores de configuración antes de cargar la autenticación del entorno de ejecución | El proveedor tiene resolución de clave API con marcador de entorno propiedad del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcador de entorno de AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/alojada por uno mismo o basada en configuración sin persistir texto plano          | El proveedor puede operar con un marcador de credencial sintética/local                                                                     |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externos propiedad del proveedor; la `persistence` predeterminada es `runtime-only` para credenciales propiedad de CLI/app | El proveedor reutiliza credenciales de autenticación externas sin persistir tokens de actualización copiados                               |
| 10  | `shouldDeferSyntheticProfileAuth` | Baja la prioridad de placeholders de perfiles sintéticos almacenados frente a la autenticación basada en entorno/configuración | El proveedor almacena perfiles placeholder sintéticos que no deberían tener precedencia                                                    |
| 11  | `resolveDynamicModel`             | Fallback síncrono para ids de modelo propiedad del proveedor que aún no están en el registro local            | El proveedor acepta ids de modelos arbitrarios del upstream                                                                                 |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` vuelve a ejecutarse                                      | El proveedor necesita metadatos de red antes de resolver ids desconocidos                                                                   |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el embedded runner use el modelo resuelto                                      | El proveedor necesita reescrituras de transporte, pero sigue usando un transporte del núcleo                                               |
| 14  | `contributeResolvedModelCompat`   | Aporta flags de compatibilidad para modelos del proveedor detrás de otro transporte compatible                | El proveedor reconoce sus propios modelos en transportes proxy sin asumir el control del proveedor                                         |
| 15  | `capabilities`                    | Metadatos de transcripción/herramientas propiedad del proveedor usados por la lógica compartida del núcleo    | El proveedor necesita peculiaridades de transcripción/familia de proveedor                                                                  |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que los vea el embedded runner                                    | El proveedor necesita limpieza de esquemas de la familia de transporte                                                                      |
| 17  | `inspectToolSchemas`              | Expone diagnósticos de esquemas propiedad del proveedor después de la normalización                           | El proveedor quiere advertencias de palabras clave sin enseñar al núcleo reglas específicas del proveedor                                  |
| 18  | `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo frente al etiquetado                                  | El proveedor necesita salida final/de razonamiento etiquetada en lugar de campos nativos                                                   |
| 19  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los wrappers genéricos de opciones de streaming             | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                       |
| 20  | `createStreamFn`                  | Sustituye por completo la ruta normal de streaming con un transporte personalizado                            | El proveedor necesita un protocolo de cable personalizado, no solo un wrapper                                                              |
| 21  | `wrapStreamFn`                    | Wrapper de streaming después de aplicar los wrappers genéricos                                                | El proveedor necesita wrappers de compatibilidad de encabezados/cuerpo/modelo de la solicitud sin un transporte personalizado              |
| 22  | `resolveTransportTurnState`       | Adjunta encabezados o metadatos nativos por turno del transporte                                              | El proveedor quiere que los transportes genéricos envíen la identidad de turno nativa del proveedor                                        |
| 23  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados nativos de WebSocket o una política de enfriamiento de sesión                             | El proveedor quiere que los transportes WS genéricos ajusten encabezados de sesión o la política de fallback                              |
| 24  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` de entorno de ejecución | El proveedor almacena metadatos extra de autenticación y necesita una forma personalizada de token en tiempo de ejecución                  |
| 25  | `refreshOAuth`                    | Sustitución de actualización de OAuth para endpoints personalizados de actualización o política de fallo de actualización | El proveedor no encaja en los actualizadores compartidos de `pi-ai`                                                                        |
| 26  | `buildAuthDoctorHint`             | Sugerencia de reparación añadida cuando falla la actualización de OAuth                                       | El proveedor necesita una guía de reparación de autenticación propiedad del proveedor tras un fallo de actualización                       |
| 27  | `matchesContextOverflowError`     | Comparador de desbordamiento de ventana de contexto propiedad del proveedor                                   | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas no detectarían                                     |
| 28  | `classifyFailoverReason`          | Clasificación de motivo de failover propiedad del proveedor                                                   | El proveedor puede mapear errores brutos de API/transporte a límite de tasa/sobrecarga/etc.                                               |
| 29  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                  | El proveedor necesita compuertas de TTL de caché específicas del proxy                                                                      |
| 30  | `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por autenticación faltante                                   | El proveedor necesita una sugerencia específica del proveedor para recuperar autenticación faltante                                         |
| 31  | `suppressBuiltInModel`            | Supresión de modelos upstream obsoletos más una sugerencia opcional de error orientada al usuario            | El proveedor necesita ocultar filas upstream obsoletas o reemplazarlas por una sugerencia del proveedor                                    |
| 32  | `augmentModelCatalog`             | Filas sintéticas/finales de catálogo añadidas después del descubrimiento                                      | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                              |
| 33  | `isBinaryThinking`                | Alternancia de razonamiento activado/desactivado para proveedores de pensamiento binario                      | El proveedor solo expone pensamiento binario activado/desactivado                                                                           |
| 34  | `supportsXHighThinking`           | Compatibilidad con razonamiento `xhigh` para modelos seleccionados                                            | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                              |
| 35  | `resolveDefaultThinkingLevel`     | Nivel predeterminado de `/think` para una familia de modelos específica                                       | El proveedor es propietario de la política predeterminada de `/think` para una familia de modelos                                          |
| 36  | `isModernModelRef`                | Comparador de modelos modernos para filtros de perfiles en vivo y selección de smoke                          | El proveedor es propietario de la coincidencia de modelos preferidos para live/smoke                                                       |
| 37  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de entorno de ejecución justo antes de la inferencia | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                              |
| 38  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                   | El proveedor necesita análisis personalizado de tokens de uso/cuota o una credencial de uso diferente                                      |
| 39  | `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación  | El proveedor necesita un endpoint de uso o un analizador de carga útil específico del proveedor                                             |
| 40  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del proveedor para memory/search                                | El comportamiento de embeddings de memory debe pertenecer al plugin del proveedor                                                           |
| 41  | `buildReplayPolicy`               | Devuelve una política de repetición que controla el manejo de transcripciones para el proveedor               | El proveedor necesita una política de transcripción personalizada (por ejemplo, eliminación de bloques de pensamiento)                     |
| 42  | `sanitizeReplayHistory`           | Reescribe el historial de repetición después de la limpieza genérica de transcripciones                      | El proveedor necesita reescrituras específicas del proveedor para repetición más allá de las utilidades compartidas de Compaction          |
| 43  | `validateReplayTurns`             | Validación o remodelado final de turnos de repetición antes del embedded runner                               | El transporte del proveedor necesita una validación de turnos más estricta después del saneamiento genérico                                |
| 44  | `onModelSelected`                 | Ejecuta efectos secundarios posteriores a la selección propiedad del proveedor                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo pasa a estar activo                                      |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
plugin de proveedor coincidente, y luego pasan por otros plugins de proveedor con capacidad de hook
hasta que uno realmente cambie el id del modelo o el transporte/configuración. Eso mantiene
funcionando los shims de alias/proveedor compatible sin exigir que el llamador sepa qué
plugin incluido es propietario de la reescritura. Si ningún hook de proveedor reescribe una entrada de
configuración compatible de la familia Google, el normalizador de configuración de Google incluido aún aplica
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable totalmente personalizado o un ejecutor de solicitudes personalizado,
eso pertenece a otra clase de extensión. Estos hooks son para comportamiento del proveedor
que sigue ejecutándose en el bucle normal de inferencia de OpenClaw.

### Ejemplo de proveedor

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Ejemplos integrados

- Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  y `wrapStreamFn` porque es propietario de la compatibilidad futura de Claude 4.6,
  las sugerencias de familia de proveedor, la guía de reparación de autenticación, la integración del endpoint de uso,
  la elegibilidad de caché de prompt, los valores predeterminados de configuración conscientes de autenticación, la política
  predeterminada/adaptativa de pensamiento de Claude, y el modelado de stream específico de Anthropic para
  encabezados beta, `/fast` / `serviceTier` y `context1m`.
- Las utilidades de stream específicas de Claude de Anthropic permanecen por ahora en la
  unión pública `api.ts` / `contract-api.ts` del propio plugin incluido. Esa superficie del paquete
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los constructores de wrappers
  de nivel inferior de Anthropic, en lugar de ampliar el SDK genérico en torno a las reglas de encabezados beta de un solo
  proveedor.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` y
  `capabilities` además de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  porque es propietario de la compatibilidad futura de GPT-5.4, de la normalización directa de OpenAI
  `openai-completions` -> `openai-responses`, de sugerencias de autenticación conscientes de Codex,
  de la supresión de Spark, de filas sintéticas de lista de OpenAI y de la política de pensamiento /
  modelo en vivo de GPT-5; la familia de streams `openai-responses-defaults` es propietaria de los
  wrappers nativos compartidos de OpenAI Responses para encabezados de atribución,
  `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex,
  modelado de carga útil de compatibilidad de razonamiento y gestión de contexto de Responses.
- OpenRouter usa `catalog` además de `resolveDynamicModel` y
  `prepareDynamicModel` porque el proveedor es pass-through y puede exponer nuevos
  ids de modelo antes de que se actualice el catálogo estático de OpenClaw; también usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para mantener
  fuera del núcleo los encabezados de solicitud, los metadatos de routing, los parches de razonamiento y la
  política de caché de prompt específicos del proveedor. Su política de repetición proviene de la
  familia `passthrough-gemini`, mientras que la familia de streams `openrouter-thinking`
  es propietaria de la inyección de razonamiento proxy y de las omisiones de modelos no compatibles / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` y
  `capabilities` además de `prepareRuntimeAuth` y `fetchUsageSnapshot` porque
  necesita inicio de sesión por dispositivo propiedad del proveedor, comportamiento de fallback de modelos, peculiaridades de transcripción de Claude,
  un intercambio de token de GitHub -> token de Copilot y un endpoint de uso propiedad del proveedor.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` y `augmentModelCatalog` además de
  `prepareExtraParams`, `resolveUsageAuth` y `fetchUsageSnapshot` porque
  sigue ejecutándose en los transportes OpenAI del núcleo, pero es propietario de su
  normalización de transporte/URL base, de la política de fallback de actualización de OAuth, de la elección de transporte predeterminada,
  de filas sintéticas de catálogo de Codex y de la integración del endpoint de uso de ChatGPT; comparte
  la misma familia de streams `openai-responses-defaults` que OpenAI directo.
- Google AI Studio y Gemini CLI OAuth usan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque la
  familia de repetición `google-gemini` es propietaria del fallback de compatibilidad futura de Gemini 3.1,
  la validación nativa de repetición de Gemini, el saneamiento de repetición de bootstrap, el modo
  de salida de razonamiento etiquetado y la coincidencia de modelos modernos, mientras que la
  familia de streams `google-thinking` es propietaria de la normalización de la carga útil de pensamiento de Gemini;
  Gemini CLI OAuth también usa `formatApiKey`, `resolveUsageAuth` y
  `fetchUsageSnapshot` para formato de token, análisis de token y
  cableado del endpoint de cuota.
- Anthropic Vertex usa `buildReplayPolicy` mediante la
  familia de repetición `anthropic-by-model`, para que la limpieza de repetición específica de Claude permanezca
  limitada a ids de Claude en lugar de a todo transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` y `resolveDefaultThinkingLevel` porque es propietario
  de la clasificación de errores específicos de Bedrock de limitación/no listo/desbordamiento de contexto
  para tráfico Anthropic-en-Bedrock; su política de repetición sigue compartiendo la misma
  protección `anthropic-by-model` solo para Claude.
- OpenRouter, Kilocode, Opencode y Opencode Go usan `buildReplayPolicy`
  mediante la familia de repetición `passthrough-gemini` porque hacen proxy de modelos Gemini
  a través de transportes compatibles con OpenAI y necesitan
  saneamiento de firmas de pensamiento de Gemini sin validación nativa de repetición de Gemini ni
  reescrituras de bootstrap.
- MiniMax usa `buildReplayPolicy` mediante la
  familia de repetición `hybrid-anthropic-openai` porque un proveedor es propietario tanto de
  semántica de mensajes Anthropic como de OpenAI-compatible; mantiene la eliminación de
  bloques de pensamiento solo para Claude en el lado Anthropic mientras reemplaza el modo de salida de razonamiento de vuelta al nativo, y la familia de streams `minimax-fast-mode`
  es propietaria de las reescrituras de modelos fast-mode en la ruta de stream compartida.
- Moonshot usa `catalog` además de `wrapStreamFn` porque sigue usando el
  transporte OpenAI compartido pero necesita normalización de carga útil de pensamiento propiedad del proveedor; la
  familia de streams `moonshot-thinking` mapea la configuración más el estado de `/think` a su
  carga útil nativa de pensamiento binario.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque necesita encabezados de solicitud propiedad del proveedor,
  normalización de carga útil de razonamiento, sugerencias de transcripción Gemini y compuertas de TTL de caché de Anthropic; la familia de streams `kilocode-thinking` mantiene la inyección de pensamiento de Kilo
  en la ruta compartida de stream proxy mientras omite `kilo/auto` y
  otros ids de modelo proxy que no admiten cargas útiles explícitas de razonamiento.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` y `fetchUsageSnapshot` porque es propietario del fallback de GLM-5,
  de los valores predeterminados de `tool_stream`, de la UX de pensamiento binario, de la coincidencia de modelos modernos y tanto de
  la autenticación de uso como de la obtención de cuota; la familia de streams `tool-stream-default-on` mantiene el wrapper predeterminado activado de `tool_stream` fuera del pegamento escrito a mano por proveedor.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque es propietario de la normalización nativa de transporte xAI Responses, de las reescrituras de alias fast-mode de Grok, del valor predeterminado de `tool_stream`, de la limpieza estricta de herramientas / carga útil de razonamiento,
  de la reutilización de autenticación de fallback para herramientas propiedad del plugin, de la resolución de modelos Grok con compatibilidad futura y de parches de compatibilidad propiedad del proveedor, como el perfil de esquema de herramientas de xAI,
  palabras clave de esquema no compatibles, `web_search` nativo y decodificación de argumentos de llamada de herramientas con entidades HTML.
- Mistral, OpenCode Zen y OpenCode Go usan solo `capabilities` para mantener
  fuera del núcleo las peculiaridades de transcripción/herramientas.
- Los proveedores incluidos solo de catálogo como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` y `volcengine` usan
  solo `catalog`.
- Qwen usa `catalog` para su proveedor de texto además de registros compartidos de comprensión de medios y generación de video para sus superficies multimodales.
- MiniMax y Xiaomi usan `catalog` además de hooks de uso porque su comportamiento de `/usage`
  es propiedad del plugin aunque la inferencia siga ejecutándose mediante los transportes compartidos.

## Utilidades de entorno de ejecución

Los plugins pueden acceder a utilidades seleccionadas del núcleo mediante `api.runtime`. Para TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Notas:

- `textToSpeech` devuelve la carga útil normal de salida TTS del núcleo para superficies de archivo/nota de voz.
- Usa la configuración `messages.tts` del núcleo y la selección de proveedor.
- Devuelve búfer de audio PCM + frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional según el proveedor. Úsala para selectores de voz o flujos de configuración propiedad del proveedor.
- Las listas de voces pueden incluir metadatos más ricos como locale, gender y etiquetas de personalidad para selectores conscientes del proveedor.
- OpenAI y ElevenLabs admiten telefonía hoy. Microsoft no.

Los plugins también pueden registrar proveedores de voz mediante `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Notas:

- Mantén la política TTS, el fallback y la entrega de respuestas en el núcleo.
- Usa proveedores de voz para el comportamiento de síntesis propiedad del proveedor.
- La entrada legacy `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un proveedor puede ser propietario
  de texto, voz, imagen y futuros proveedores de medios conforme OpenClaw agregue esos
  contratos de capacidad.

Para comprensión de imágenes/audio/video, los plugins registran un proveedor tipado
de comprensión de medios en lugar de una bolsa genérica clave/valor:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Notas:

- Mantén la orquestación, el fallback, la configuración y el cableado de canales en el núcleo.
- Mantén el comportamiento del proveedor en el plugin del proveedor.
- La expansión aditiva debe seguir siendo tipada: nuevos métodos opcionales, nuevos campos de resultado opcionales, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo es propietario del contrato de capacidad y de la utilidad de entorno de ejecución
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para las utilidades de entorno de ejecución de comprensión de medios, los plugins pueden llamar a:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Para transcripción de audio, los plugins pueden usar tanto el entorno de ejecución de comprensión de medios
como el alias STT más antiguo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional cuando el MIME no puede inferirse con fiabilidad:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` es la superficie compartida preferida para
  comprensión de imágenes/audio/video.
- Usa la configuración de audio de comprensión de medios del núcleo (`tools.media.audio`) y el orden de fallback del proveedor.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidad.

Los plugins también pueden lanzar ejecuciones de subagentes en segundo plano mediante `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Notas:

- `provider` y `model` son sustituciones opcionales por ejecución, no cambios persistentes de sesión.
- OpenClaw solo respeta esos campos de sustitución para llamadores de confianza.
- Para ejecuciones de fallback propiedad del plugin, los operadores deben habilitarlo explícitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir plugins de confianza a objetivos canónicos específicos `provider/model`, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagentes de plugins no confiables siguen funcionando, pero las solicitudes de sustitución se rechazan en lugar de hacer fallback silenciosamente.

Para búsqueda web, los plugins pueden consumir la utilidad de entorno de ejecución compartida en lugar de
acceder al cableado de herramientas del agente:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Los plugins también pueden registrar proveedores de búsqueda web mediante
`api.registerWebSearchProvider(...)`.

Notas:

- Mantén en el núcleo la selección del proveedor, la resolución de credenciales y la semántica compartida de solicitudes.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de función/canal que necesiten comportamiento de búsqueda sin depender del wrapper de herramientas del agente.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: genera una imagen usando la cadena configurada de proveedores de generación de imágenes.
- `listProviders(...)`: enumera los proveedores de generación de imágenes disponibles y sus capacidades.

## Rutas HTTP del Gateway

Los plugins pueden exponer endpoints HTTP con `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Campos de la ruta:

- `path`: ruta bajo el servidor HTTP del Gateway.
- `auth`: obligatorio. Usa `"gateway"` para requerir autenticación normal del Gateway, o `"plugin"` para autenticación/verificación de Webhook gestionada por el plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta gestionó la solicitud.

Notas:

- `api.registerHttpHandler(...)` fue eliminado y provocará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Se rechazan las rutas superpuestas con distintos niveles de `auth`. Mantén las cadenas de fallback `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas con `auth: "plugin"` **no** reciben automáticamente ámbitos de entorno de ejecución del operador. Son para Webhooks/verificación de firmas gestionados por el plugin, no para llamadas auxiliares privilegiadas del Gateway.
- Las rutas con `auth: "gateway"` se ejecutan dentro de un ámbito de entorno de ejecución de solicitud del Gateway, pero ese ámbito es intencionadamente conservador:
  - la autenticación bearer de secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los ámbitos de entorno de ejecución de rutas de plugins fijados en `operator.write`, incluso si el llamador envía `x-openclaw-scopes`
  - los modos HTTP confiables con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingreso privado) respetan `x-openclaw-scopes` solo cuando el encabezado está presente explícitamente
  - si `x-openclaw-scopes` está ausente en esas solicitudes de rutas de plugins con identidad, el ámbito de entorno de ejecución vuelve a `operator.write`
- Regla práctica: no asumas que una ruta de plugin autenticada por Gateway es una superficie de administración implícita. Si tu ruta necesita comportamiento exclusivo de administración, exige un modo de autenticación con identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del Plugin SDK

Usa subrutas del SDK en lugar de la importación monolítica `openclaw/plugin-sdk` al
crear plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de plugins.
- `openclaw/plugin-sdk/core` para el contrato genérico compartido orientado a plugins.
- `openclaw/plugin-sdk/config-schema` para la exportación del esquema Zod raíz de `openclaw.json`
  (`OpenClawSchema`).
- Primitivas estables de canal como `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` y
  `openclaw/plugin-sdk/webhook-ingress` para el cableado compartido de
  configuración/autenticación/respuesta/Webhook. `channel-inbound` es el hogar compartido para debounce, coincidencia de menciones,
  utilidades de política de menciones entrantes, formato de envolturas entrantes y utilidades de contexto
  de envolturas entrantes.
  `channel-setup` es la unión estrecha de configuración para instalación opcional.
  `setup-runtime` es la superficie de configuración segura para el entorno de ejecución usada por `setupEntry` /
  inicio diferido, incluidos los adaptadores de parches de configuración seguros para importación.
  `setup-adapter-runtime` es la unión de adaptadores de configuración de cuentas consciente del entorno.
  `setup-tools` es la pequeña unión auxiliar de CLI/archivos/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subrutas de dominio como `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` y
  `openclaw/plugin-sdk/directory-runtime` para utilidades compartidas de entorno de ejecución/configuración.
  `telegram-command-config` es la unión pública estrecha para normalización/validación de comandos personalizados de Telegram y permanece disponible incluso si la superficie del contrato incluido de Telegram no está disponible temporalmente.
  `text-runtime` es la unión compartida de texto/markdown/logging, incluida
  la eliminación de texto visible para el asistente, utilidades de renderizado/fragmentación de markdown, utilidades de redacción,
  utilidades de etiquetas de directivas y utilidades de texto seguro.
- Las uniones de canal específicas de aprobación deben preferir un único contrato `approvalCapability` en el plugin. El núcleo luego lee la autenticación, entrega, renderizado,
  routing nativo y comportamiento lazy del controlador nativo a través de esa única capacidad
  en lugar de mezclar el comportamiento de aprobación en campos no relacionados del plugin.
- `openclaw/plugin-sdk/channel-runtime` está en desuso y permanece solo como una
  capa de compatibilidad para plugins antiguos. El código nuevo debe importar las primitivas genéricas más estrechas en su lugar, y el código del repositorio no debe añadir nuevas importaciones de esta capa.
- Los detalles internos de las extensiones incluidas siguen siendo privados. Los plugins externos solo deben usar subrutas `openclaw/plugin-sdk/*`. El código del núcleo/pruebas de OpenClaw puede usar los
  puntos de entrada públicos del repositorio bajo la raíz de un paquete de plugin, como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` y archivos de alcance estrecho como
  `login-qr-api.js`. Nunca importes `src/*` de un paquete de plugin desde el núcleo ni desde
  otra extensión.
- División del punto de entrada del repositorio:
  `<plugin-package-root>/api.js` es el barril de utilidades/tipos,
  `<plugin-package-root>/runtime-api.js` es el barril solo de entorno de ejecución,
  `<plugin-package-root>/index.js` es la entrada del plugin incluido
  y `<plugin-package-root>/setup-entry.js` es la entrada del plugin de configuración.
- Ejemplos actuales de proveedores incluidos:
  - Anthropic usa `api.js` / `contract-api.js` para utilidades de stream de Claude como
    `wrapAnthropicProviderStream`, utilidades de encabezados beta y análisis de `service_tier`.
  - OpenAI usa `api.js` para constructores de proveedores, utilidades de modelos predeterminados y
    constructores de proveedores en tiempo real.
  - OpenRouter usa `api.js` para su constructor de proveedor además de utilidades de onboarding/configuración,
    mientras que `register.runtime.js` todavía puede reexportar utilidades genéricas
    `plugin-sdk/provider-stream` para uso local del repositorio.
- Los puntos de entrada públicos cargados por fachada prefieren la instantánea activa de configuración del entorno de ejecución
  cuando existe, y luego hacen fallback al archivo de configuración resuelto en disco cuando
  OpenClaw aún no está sirviendo una instantánea de entorno de ejecución.
- Las primitivas genéricas compartidas siguen siendo el contrato público preferido del SDK. Aún existe un pequeño conjunto reservado
  de uniones auxiliares de compatibilidad con marca de canal incluidas. Trátalas como
  uniones de mantenimiento/compatibilidad para paquetes incluidos, no como nuevos objetivos de importación para terceros; los nuevos contratos entre canales deben seguir llegando a subrutas genéricas `plugin-sdk/*` o a los barriles locales del plugin `api.js` /
  `runtime-api.js`.

Nota de compatibilidad:

- Evita el barril raíz `openclaw/plugin-sdk` en código nuevo.
- Prefiere primero las primitivas estables y estrechas. Las subrutas más nuevas de setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool son el contrato previsto para nuevo trabajo de plugins
  incluidos y externos.
  El análisis/coincidencia de objetivos debe ir en `openclaw/plugin-sdk/channel-targets`.
  Las compuertas de acciones de mensaje y las utilidades de id de mensaje de reacciones deben ir en
  `openclaw/plugin-sdk/channel-actions`.
- Los barriles auxiliares específicos de extensiones incluidas no son estables por defecto. Si una
  utilidad solo la necesita una extensión incluida, mantenla detrás de la
  unión local `api.js` o `runtime-api.js` de la extensión en lugar de promoverla a
  `openclaw/plugin-sdk/<extension>`.
- Las nuevas uniones de utilidades compartidas deben ser genéricas, no con marca de canal. El análisis compartido de objetivos
  debe ir en `openclaw/plugin-sdk/channel-targets`; los detalles internos específicos de canal
  permanecen detrás de la unión local `api.js` o `runtime-api.js` del plugin propietario.
- Existen subrutas específicas de capacidad como `image-generation`,
  `media-understanding` y `speech` porque los plugins nativos/incluidos las usan
  hoy. Su presencia no significa por sí sola que toda utilidad exportada sea un
  contrato externo congelado a largo plazo.

## Esquemas de la herramienta de mensajes

Los plugins deben ser propietarios de las contribuciones de esquema
específicas del canal en `describeMessageTool(...)`. Mantén los campos específicos del proveedor en el plugin, no en el núcleo compartido.

Para fragmentos de esquema portátiles compartidos, reutiliza las utilidades genéricas exportadas mediante
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para cargas útiles con estilo de cuadrícula de botones
- `createMessageToolCardSchema()` para cargas útiles de tarjetas estructuradas

Si una forma de esquema solo tiene sentido para un proveedor, defínela en el
código fuente de ese plugin en lugar de promoverla al SDK compartido.

## Resolución de objetivos de canal

Los plugins de canal deben ser propietarios de la semántica específica del canal para objetivos. Mantén
genérico el host compartido de salida y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un objetivo normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` le indica al núcleo si una
  entrada debe ir directamente a resolución de tipo id en lugar de a búsqueda en directorio.
- `messaging.targetResolver.resolveTarget(...)` es el fallback del plugin cuando el
  núcleo necesita una resolución final propiedad del proveedor después de la normalización o tras no encontrar nada
  en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` es propietario de la construcción de rutas de sesión
  específicas del proveedor una vez que se ha resuelto un objetivo.

Separación recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deben ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de “tratar esto como un id de objetivo explícito/nativo”.
- Usa `resolveTarget` para fallback de normalización específico del proveedor, no para
  búsquedas amplias en directorio.
- Mantén ids nativos del proveedor como chat ids, thread ids, JIDs, handles e ids de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio a partir de la configuración deben mantener esa lógica en el
plugin y reutilizar las utilidades compartidas de
`openclaw/plugin-sdk/directory-runtime`.

Úsalo cuando un canal necesite pares/grupos respaldados por configuración como:

- pares de DM guiados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de directorio con alcance por cuenta

Las utilidades compartidas en `directory-runtime` solo manejan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- utilidades de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas y la normalización de ids específicas del canal deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el plugin sea propietario de ids de modelos específicos del proveedor, valores predeterminados de URL base o metadatos de modelos condicionados por autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un plugin con respecto a los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples con API key o basados en variables de entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en colisiones de claves, así que los plugins pueden anular intencionadamente una entrada de proveedor integrada con el mismo id de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias legacy
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`

## Inspección de canales de solo lectura

Si tu plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de entorno de ejecución. Puede asumir que las credenciales
  están completamente materializadas y puede fallar rápido cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de doctor/reparación de configuración
  no deberían necesitar materializar credenciales de entorno de ejecución solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye campos de fuente/estado de credenciales cuando sea relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores brutos de tokens solo para informar disponibilidad
  de solo lectura. Devolver `tokenStatus: "available"` (y el campo de fuente correspondiente)
  es suficiente para comandos de tipo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen “configurado pero no disponible en esta ruta de comando” en lugar de fallar o informar incorrectamente que la cuenta no está configurada.

## Paquetes pack

Un directorio de plugin puede incluir un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entrada se convierte en un plugin. Si el pack enumera varias extensiones, el id del plugin
pasa a ser `name/<fileBase>`.

Si tu plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Compuerta de seguridad: cada entrada de `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de resolver enlaces simbólicos. Las entradas que escapen del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias de plugins con
`npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida, sin dependencias de desarrollo en tiempo de ejecución). Mantén los árboles de dependencias de plugins como “JS/TS puros” y evita paquetes que requieran compilaciones en `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero todavía no configurado, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto hace más ligeros el inicio y la configuración
cuando la entrada principal del plugin también conecta herramientas, hooks u otro código solo de entorno de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un plugin de canal opte por usar la misma ruta `setupEntry` durante la
fase de inicio previa a la escucha del Gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el Gateway comience a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar toda capacidad propiedad del canal de la que dependa el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el Gateway comience a escuchar
- cualquier método del gateway, herramienta o servicio que deba existir durante esa misma ventana

Si tu entrada completa sigue siendo propietaria de alguna capacidad requerida al inicio, no habilites
este flag. Mantén el comportamiento predeterminado del plugin y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar utilidades de superficie de contrato solo de configuración que el núcleo
puede consultar antes de que se cargue el entorno de ejecución completo del canal. La superficie actual
de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración legacy de canal de cuenta única a
`channels.<id>.accounts.*` sin cargar la entrada completa del plugin.
Matrix es el ejemplo incluido actual: mueve solo claves de autenticación/bootstrap a una
cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede conservar una
clave configurada de cuenta predeterminada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parches de configuración mantienen lazy el descubrimiento de superficies de contrato incluidas. El tiempo
de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de
reingresar en el inicio del canal incluido al importar el módulo.

Cuando esas superficies de inicio incluyen métodos RPC del gateway, mantenlos con un
prefijo específico del plugin. Los espacios de nombres de administración del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen estando reservados y siempre se resuelven
a `operator.admin`, aunque un plugin solicite un ámbito más estrecho.

Ejemplo:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadatos del catálogo de canales

Los plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
pistas de instalación mediante `openclaw.install`. Esto mantiene el núcleo libre de datos de catálogo.

Ejemplo:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat autoalojado mediante bots de Webhook de Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Campos útiles de `openclaw.channel` más allá del ejemplo mínimo:

- `detailLabel`: etiqueta secundaria para superficies más ricas de catálogo/estado
- `docsLabel`: anula el texto del enlace a la documentación
- `preferOver`: ids de plugin/canal de menor prioridad a los que esta entrada del catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto para la superficie de selección
- `markdownCapable`: marca el canal como compatible con markdown para decisiones de formato de salida
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias legacy que siguen aceptándose por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: hace que el canal participe en el flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: requiere enlace explícito de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere búsqueda de sesión al resolver objetivos de anuncio

OpenClaw también puede fusionar **catálogos de canales externos** (por ejemplo, una
exportación de registro MPM). Coloca un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O haz que `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) apunte a
uno o más archivos JSON (delimitados por comas/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias legacy de la clave `"entries"`.

## Plugins de motor de contexto

Los plugins de motor de contexto son propietarios de la orquestación del contexto de sesión para ingestión, ensamblaje
y compaction. Regístralos desde tu plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Úsalo cuando tu plugin necesite reemplazar o ampliar la canalización de contexto predeterminada
en lugar de solo agregar búsqueda en memory o hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Si tu motor **no** es propietario del algoritmo de compactación, mantén `compact()`
implementado y delega explícitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Agregar una nueva capacidad

Cuando un plugin necesita un comportamiento que no encaja en la API actual, no eludas
el sistema de plugins con un acceso privado. Agrega la capacidad que falta.

Secuencia recomendada:

1. define el contrato del núcleo
   Decide qué comportamiento compartido debe ser propiedad del núcleo: política, fallback, combinación de configuración,
   ciclo de vida, semántica orientada a canales y forma de la utilidad de entorno de ejecución.
2. agrega superficies tipadas de registro/entorno de ejecución del plugin
   Amplía `OpenClawPluginApi` y/o `api.runtime` con la superficie de capacidad tipada más pequeña que sea útil.
3. conecta consumidores del núcleo + canal/función
   Los canales y plugins de función deben consumir la nueva capacidad a través del núcleo,
   no importando directamente una implementación de proveedor.
4. registra implementaciones de proveedores
   Los plugins de proveedor registran entonces sus backends en función de la capacidad.
5. agrega cobertura de contrato
   Agrega pruebas para que la propiedad y la forma del registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw se mantiene con opiniones definidas sin quedar codificado rígidamente a la
visión del mundo de un solo proveedor. Consulta el [Capability Cookbook](/es/plugins/architecture)
para ver una lista concreta de archivos y un ejemplo trabajado.

### Lista de verificación de capacidades

Cuando agregas una nueva capacidad, la implementación normalmente debe tocar estas
superficies en conjunto:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- runner/utilidad de entorno de ejecución del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- cableado del registro de plugins en `src/plugins/registry.ts`
- exposición del entorno de ejecución del plugin en `src/plugins/runtime/*` cuando los plugins de función/canal
  necesitan consumirla
- captura/utilidades de prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores/plugins en `docs/`

Si falta una de esas superficies, normalmente es una señal de que la capacidad
todavía no está completamente integrada.

### Plantilla de capacidad

Patrón mínimo:

```ts
// contrato del núcleo
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API del plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// utilidad compartida de entorno de ejecución para plugins de función/canal
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Patrón de prueba de contrato:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Eso mantiene la regla simple:

- el núcleo es propietario del contrato de capacidad + la orquestación
- los plugins de proveedor son propietarios de las implementaciones del proveedor
- los plugins de función/canal consumen utilidades de entorno de ejecución
- las pruebas de contrato mantienen explícita la propiedad
