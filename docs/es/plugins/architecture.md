---
read_when:
    - Crear o depurar plugins nativos de OpenClaw
    - Comprender el modelo de capacidades de Plugin o los límites de propiedad
    - Trabajar en la canalización de carga del Plugin o en el registro
    - Implementar hooks de tiempo de ejecución de proveedor o plugins de canal
sidebarTitle: Internals
summary: 'Internos del Plugin: modelo de capacidades, propiedad, contratos, canalización de carga y helpers de runtime'
title: Aspectos internos de Plugin
x-i18n:
    generated_at: "2026-06-27T12:05:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

Esta es la **referencia de arquitectura profunda** para el sistema de plugins de OpenClaw. Para guías prácticas, empieza con una de las páginas enfocadas de abajo.

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo añadir, habilitar y solucionar problemas con plugins.
  </Card>
  <Card title="Building plugins" icon="rocket" href="/es/plugins/building-plugins">
    Tutorial para crear el primer plugin con el manifiesto funcional más pequeño.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/es/plugins/sdk-channel-plugins">
    Crea un plugin de canal de mensajería.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/es/plugins/sdk-provider-plugins">
    Crea un plugin de proveedor de modelos.
  </Card>
  <Card title="SDK overview" icon="book" href="/es/plugins/sdk-overview">
    Referencia del mapa de importación y la API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Las capacidades son el modelo público de **plugin nativo** dentro de OpenClaw. Cada plugin nativo de OpenClaw se registra con uno o más tipos de capacidad:

| Capacidad              | Método de registro                              | Plugins de ejemplo                   |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferencia de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferencia CLI | `api.registerCliBackend(...)`                 | `openai`, `anthropic`                |
| Embeddings             | `api.registerEmbeddingProvider(...)`             | Plugins vectoriales propiedad del proveedor |
| Voz                    | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                         |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Comprensión multimedia | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Fuente de transcripciones | `api.registerTranscriptSourceProvider(...)`   | `discord`                            |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generación de música   | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Obtención web          | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensajería     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Descubrimiento de Gateway | `api.registerGatewayDiscoveryService(...)`    | `bonjour`                            |

<Note>
Un plugin que registra cero capacidades pero proporciona ganchos, herramientas, servicios de descubrimiento o servicios en segundo plano es un plugin **heredado solo de ganchos**. Ese patrón sigue siendo totalmente compatible.
</Note>

### Postura de compatibilidad externa

El modelo de capacidades ya está integrado en el núcleo y lo usan hoy los plugins incluidos/nativos, pero la compatibilidad de plugins externos aún necesita un umbral más estricto que “está exportado, por lo tanto está congelado”.

| Situación del plugin                             | Guía                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                       | Mantén funcionando las integraciones basadas en ganchos; esta es la base de compatibilidad.      |
| Nuevos plugins incluidos/nativos                  | Prefiere el registro explícito de capacidades sobre accesos específicos de proveedor o nuevos diseños solo de ganchos. |
| Plugins externos que adoptan el registro de capacidades | Permitido, pero trata las superficies auxiliares específicas de capacidades como evolutivas salvo que la documentación las marque como estables. |

El registro de capacidades es la dirección prevista. Los ganchos heredados siguen siendo la ruta más segura sin rupturas para plugins externos durante la transición. Las subrutas auxiliares exportadas no son todas iguales: prefiere contratos estrechos y documentados sobre exportaciones auxiliares incidentales.

### Formas de plugin

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real de registro (no solo metadatos estáticos):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra exactamente un tipo de capacidad (por ejemplo, un plugin solo de proveedor como `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra varios tipos de capacidad (por ejemplo, `openai` posee inferencia de texto, voz, comprensión multimedia y generación de imágenes).
  </Accordion>
  <Accordion title="hook-only">
    Registra solo ganchos (tipados o personalizados), sin capacidades, herramientas, comandos ni servicios.
  </Accordion>
  <Accordion title="non-capability">
    Registra herramientas, comandos, servicios o rutas, pero no capacidades.
  </Accordion>
</AccordionGroup>

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin y el desglose de capacidades. Consulta la [referencia de CLI](/es/cli/plugins#inspect) para más detalles.

### Ganchos heredados

El gancho `before_agent_start` sigue siendo compatible como ruta de compatibilidad para plugins solo de ganchos. Los plugins heredados del mundo real todavía dependen de él.

Dirección:

- mantenerlo funcionando
- documentarlo como heredado
- preferir `before_model_resolve` para trabajos de anulación de modelo/proveedor
- preferir `before_prompt_build` para trabajos de mutación de prompts
- eliminarlo solo después de que el uso real disminuya y la cobertura de fixtures demuestre que la migración es segura

### Señales de compatibilidad

Cuando ejecutes `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver una de estas etiquetas:

| Señal                      | Significado                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **config válida**          | La configuración se analiza correctamente y los plugins se resuelven |
| **aviso de compatibilidad** | El plugin usa un patrón compatible pero más antiguo (p. ej., `hook-only`) |
| **advertencia heredada**   | El plugin usa `before_agent_start`, que está obsoleto        |
| **error grave**            | La configuración no es válida o el plugin no se pudo cargar  |

Ni `hook-only` ni `before_agent_start` romperán tu plugin hoy: `hook-only` es informativo, y `before_agent_start` solo activa una advertencia. Estas señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Resumen de arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw encuentra plugins candidatos desde rutas configuradas, raíces de espacios de trabajo, raíces globales de plugins y plugins incluidos. El descubrimiento lee primero manifiestos nativos `openclaw.plugin.json` más manifiestos de paquetes compatibles.
  </Step>
  <Step title="Enablement + validation">
    El núcleo decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o seleccionado para un espacio exclusivo como memoria.
  </Step>
  <Step title="Runtime loading">
    Los plugins nativos de OpenClaw se cargan dentro del proceso y registran capacidades en un registro central. JavaScript empaquetado se carga mediante `require` nativo; TypeScript de código fuente local de terceros es el recurso de emergencia con Jiti. Los paquetes compatibles se normalizan en registros de registro sin importar código en tiempo de ejecución.
  </Step>
  <Step title="Surface consumption">
    El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración de proveedores, ganchos, rutas HTTP, comandos CLI y servicios.
  </Step>
</Steps>

Para la CLI de plugins específicamente, el descubrimiento de comandos raíz se divide en dos fases:

- los metadatos en tiempo de análisis vienen de `registerCli(..., { descriptors: [...] })`
- el módulo CLI real del plugin puede permanecer diferido y registrarse en la primera invocación

Eso mantiene el código CLI propiedad del plugin dentro del plugin, mientras permite que OpenClaw reserve nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- la validación de manifiesto/configuración debe funcionar desde **metadatos de manifiesto/esquema** sin ejecutar código del plugin
- el descubrimiento de capacidades nativas puede cargar código de entrada de plugins confiables para construir una instantánea de registro que no activa nada
- el comportamiento nativo en tiempo de ejecución viene de la ruta `register(api)` del módulo del plugin con `api.registrationMode === "full"`

Esa separación permite a OpenClaw validar la configuración, explicar plugins faltantes/deshabilitados y construir sugerencias de UI/esquema antes de que el tiempo de ejecución completo esté activo.

### Instantánea de metadatos de plugin y tabla de búsqueda

El arranque de Gateway construye una `PluginMetadataSnapshot` para la instantánea de configuración actual. La instantánea es solo de metadatos: almacena el índice de plugins instalados, el registro de manifiestos, diagnósticos de manifiestos, mapas de propietarios, un normalizador de id de plugin y registros de manifiesto. No contiene módulos de plugins cargados, SDKs de proveedores, contenidos de paquetes ni exportaciones en tiempo de ejecución.

La validación de configuración consciente de plugins, la habilitación automática al arranque y el arranque de plugins de Gateway consumen esa instantánea en lugar de reconstruir metadatos de manifiesto/índice de forma independiente. `PluginLookUpTable` se deriva de la misma instantánea y añade el plan de plugins de arranque para la configuración actual en tiempo de ejecución.

Después del arranque, Gateway mantiene la instantánea de metadatos actual como un producto reemplazable en tiempo de ejecución. El descubrimiento repetido de proveedores en tiempo de ejecución puede tomar prestada esa instantánea en lugar de reconstruir el índice instalado y el registro de manifiestos para cada pasada del catálogo de proveedores. La instantánea se borra o reemplaza al cerrar Gateway, ante cambios de configuración/inventario de plugins y escrituras del índice instalado; los llamadores recurren a la ruta fría de manifiesto/índice cuando no existe una instantánea actual compatible. Las comprobaciones de compatibilidad deben incluir raíces de descubrimiento de plugins como `plugins.load.paths` y el espacio de trabajo de agente predeterminado, porque los plugins de espacio de trabajo forman parte del alcance de metadatos.

La instantánea y la tabla de búsqueda mantienen las decisiones repetidas de arranque en la ruta rápida:

- propiedad de canales
- arranque diferido de canales
- ids de plugins de arranque
- propiedad de proveedores y backends CLI
- proveedor de configuración, alias de comando, proveedor de catálogo de modelos y propiedad de contrato de manifiesto
- validación de esquema de configuración de plugin y esquema de configuración de canal
- decisiones de habilitación automática al arranque

El límite de seguridad es el reemplazo de instantáneas, no la mutación. Reconstruye la instantánea cuando cambien la configuración, el inventario de plugins, los registros de instalación o la política persistida del índice. No la trates como un registro global mutable amplio, y no conserves instantáneas históricas sin límite. La carga de plugins en tiempo de ejecución permanece separada de las instantáneas de metadatos para que el estado obsoleto en tiempo de ejecución no pueda ocultarse detrás de una caché de metadatos.

La regla de caché está documentada en [Arquitectura interna de plugins](/es/plugins/architecture-internals#plugin-cache-boundary): los metadatos de manifiesto y descubrimiento están frescos salvo que un llamador tenga una instantánea explícita, una tabla de búsqueda o un registro de manifiestos para el flujo actual. Las cachés ocultas de metadatos y los TTL basados en reloj de pared no forman parte de la carga de plugins. Solo las cachés del cargador en tiempo de ejecución, módulos y artefactos de dependencias pueden persistir después de que el código o los artefactos instalados se carguen realmente.

Algunos llamadores de ruta fría todavía reconstruyen registros de manifiestos directamente desde el índice persistido de plugins instalados en lugar de recibir una `PluginLookUpTable` de Gateway. Esa ruta ahora reconstruye el registro bajo demanda; prefiere pasar la tabla de búsqueda actual o un registro de manifiestos explícito a través de los flujos en tiempo de ejecución cuando un llamador ya tenga uno.

### Planificación de activación

La planificación de activación forma parte del plano de control. Los llamadores pueden preguntar qué plugins son relevantes para un comando, proveedor, canal, ruta, arnés de agente o capacidad concretos antes de cargar registros más amplios en tiempo de ejecución.

El planificador mantiene compatible el comportamiento actual del manifiesto:

- los campos `activation.*` son indicaciones explícitas para el planificador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y los hooks siguen siendo la alternativa de propiedad del manifiesto
- la API del planificador de solo identificadores sigue disponible para los llamadores existentes
- la API de planificación informa etiquetas de motivo para que los diagnósticos puedan distinguir las indicaciones explícitas de la alternativa de propiedad

<Warning>
No trates `activation` como un hook de ciclo de vida ni como un reemplazo de `register(...)`. Es metadata usada para acotar la carga. Prefiere los campos de propiedad cuando ya describen la relación; usa `activation` solo para indicaciones adicionales del planificador.
</Warning>

### Plugins de canal y la herramienta de mensajes compartida

Los Plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para acciones normales de chat. OpenClaw mantiene una única herramienta `message` compartida en el núcleo, y los Plugins de canal son dueños del descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el núcleo es dueño del host de la herramienta `message` compartida, el cableado de prompts, el registro de sesiones/hilos y el despacho de ejecución
- los Plugins de canal son dueños del descubrimiento de acciones con alcance, el descubrimiento de capacidades y cualquier fragmento de esquema específico del canal
- los Plugins de canal son dueños de la gramática de conversación de sesión específica del proveedor, como la forma en que los identificadores de conversación codifican identificadores de hilo o heredan de conversaciones padre
- los Plugins de canal ejecutan la acción final mediante su adaptador de acciones

Para los Plugins de canal, la superficie del SDK es `ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada de descubrimiento unificada permite que un Plugin devuelva sus acciones visibles, capacidades y contribuciones de esquema juntas para que esas piezas no se desincronicen.

Cuando un parámetro específico de canal de la herramienta de mensajes contiene una fuente multimedia como una ruta local o una URL multimedia remota, el Plugin también debería devolver `mediaSourceParams` desde `describeMessageTool(...)`. El núcleo usa esa lista explícita para aplicar la normalización de rutas del sandbox e indicaciones de acceso multimedia saliente sin codificar de forma rígida nombres de parámetros propiedad del Plugin. Prefiere ahí mapas con alcance de acción, no una única lista plana para todo el canal, para que un parámetro multimedia exclusivo de perfil no se normalice en acciones no relacionadas como `send`.

El núcleo pasa el alcance de runtime a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Eso importa para Plugins sensibles al contexto. Un canal puede ocultar o exponer acciones de mensajes según la cuenta activa, la sala/hilo/mensaje actual o la identidad confiable del solicitante sin codificar ramas específicas del canal en la herramienta `message` del núcleo.

Por eso los cambios de enrutamiento del ejecutor embebido siguen siendo trabajo del Plugin: el ejecutor es responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del Plugin para que la herramienta `message` compartida exponga la superficie correcta propiedad del canal para el turno actual.

Para helpers de ejecución propiedad del canal, los Plugins incluidos deben mantener el runtime de ejecución dentro de sus propios módulos de extensión. El núcleo ya no posee los runtimes de acciones de mensaje de Discord, Slack, Telegram o WhatsApp bajo `src/agents/tools`. No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los Plugins incluidos deberían importar su propio código de runtime local directamente desde sus módulos propiedad de la extensión.

El mismo límite se aplica a las uniones del SDK con nombre de proveedor en general: el núcleo no debería importar barrels de conveniencia específicos de canal para Slack, Discord, Signal, WhatsApp o extensiones similares. Si el núcleo necesita un comportamiento, debe consumir el propio barrel `api.ts` / `runtime-api.ts` del Plugin incluido o promover la necesidad a una capacidad genérica y acotada en el SDK compartido.

Los Plugins incluidos siguen la misma regla. El `runtime-api.ts` de un Plugin incluido no debería reexportar su propia fachada de marca `openclaw/plugin-sdk/<plugin-id>`. Esas fachadas de marca siguen siendo shims de compatibilidad para Plugins externos y consumidores antiguos, pero los Plugins incluidos deberían usar exports locales junto con subrutas genéricas y acotadas del SDK, como `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` u `openclaw/plugin-sdk/webhook-ingress`. El código nuevo no debería agregar fachadas del SDK específicas de identificador de Plugin salvo que el límite de compatibilidad de un ecosistema externo existente lo requiera.

Para encuestas específicamente, hay dos rutas de ejecución:

- `outbound.sendPoll` es la línea base compartida para canales que encajan en el modelo común de encuesta
- `actions.handleAction("poll")` es la ruta preferida para semánticas de encuesta específicas del canal o parámetros adicionales de encuesta

El núcleo ahora difiere el análisis compartido de encuestas hasta después de que el despacho de encuestas del Plugin rechace la acción, de modo que los manejadores de encuestas propiedad del Plugin puedan aceptar campos de encuesta específicos del canal sin que el analizador genérico de encuestas los bloquee primero.

Consulta [Aspectos internos de la arquitectura de Plugin](/es/plugins/architecture-internals) para ver la secuencia completa de arranque.

## Modelo de propiedad de capacidades

OpenClaw trata un Plugin nativo como el límite de propiedad de una **empresa** o una **función**, no como una colección de integraciones sin relación.

Eso significa:

- un Plugin de empresa normalmente debería poseer todas las superficies de esa empresa orientadas a OpenClaw
- un Plugin de función normalmente debería poseer toda la superficie de la función que introduce
- los canales deberían consumir capacidades compartidas del núcleo en lugar de volver a implementar comportamiento de proveedor ad hoc

<AccordionGroup>
  <Accordion title="Múltiples capacidades de proveedor">
    `openai` posee inferencia de texto, voz, voz en tiempo real, comprensión multimedia y generación de imágenes. `google` posee inferencia de texto además de comprensión multimedia, generación de imágenes y búsqueda web. `qwen` posee inferencia de texto además de comprensión multimedia y generación de video.
  </Accordion>
  <Accordion title="Capacidad única de proveedor">
    `elevenlabs` y `microsoft` poseen voz; `firecrawl` posee web-fetch; `minimax` / `mistral` / `moonshot` / `zai` poseen backends de comprensión multimedia.
  </Accordion>
  <Accordion title="Plugin de función">
    `voice-call` posee transporte de llamadas, herramientas, CLI, rutas y puente de media-stream de Twilio, pero consume capacidades compartidas de voz, transcripción en tiempo real y voz en tiempo real en lugar de importar Plugins de proveedor directamente.
  </Accordion>
</AccordionGroup>

El estado final previsto es:

- OpenAI vive en un solo Plugin aunque abarque modelos de texto, voz, imágenes y video futuro
- otro proveedor puede hacer lo mismo para su propia superficie
- a los canales no les importa qué Plugin de proveedor posee el proveedor; consumen el contrato de capacidad compartida expuesto por el núcleo

Esta es la distinción clave:

- **Plugin** = límite de propiedad
- **capacidad** = contrato del núcleo que varios Plugins pueden implementar o consumir

Así que si OpenClaw agrega un dominio nuevo como video, la primera pregunta no es "¿qué proveedor debería codificar de forma rígida el manejo de video?" La primera pregunta es "¿cuál es el contrato de capacidad de video del núcleo?" Una vez que ese contrato existe, los Plugins de proveedor pueden registrarse contra él y los Plugins de canal/función pueden consumirlo.

Si la capacidad aún no existe, lo correcto suele ser:

<Steps>
  <Step title="Definir la capacidad">
    Define la capacidad faltante en el núcleo.
  </Step>
  <Step title="Exponer mediante el SDK">
    Exponla mediante la API/runtime de Plugins de forma tipada.
  </Step>
  <Step title="Conectar consumidores">
    Conecta canales/funciones contra esa capacidad.
  </Step>
  <Step title="Implementaciones de proveedores">
    Permite que los Plugins de proveedor registren implementaciones.
  </Step>
</Steps>

Esto mantiene explícita la propiedad y evita a la vez comportamiento del núcleo que dependa de un único proveedor o de una ruta de código puntual específica de Plugin.

### Capas de capacidad

Usa este modelo mental al decidir dónde pertenece el código:

<Tabs>
  <Tab title="Capa de capacidad del núcleo">
    Orquestación compartida, política, alternativa, reglas de fusión de configuración, semántica de entrega y contratos tipados.
  </Tab>
  <Tab title="Capa de Plugin de proveedor">
    API específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz, generación de imágenes, backends de video futuros, endpoints de uso.
  </Tab>
  <Tab title="Capa de Plugin de canal/función">
    Integración Slack/Discord/voice-call/etc. que consume capacidades del núcleo y las presenta en una superficie.
  </Tab>
</Tabs>

Por ejemplo, TTS sigue esta forma:

- el núcleo posee la política de TTS en tiempo de respuesta, el orden de alternativa, las preferencias y la entrega por canal
- `openai`, `elevenlabs` y `microsoft` poseen las implementaciones de síntesis
- `voice-call` consume el helper de runtime de TTS de telefonía

Ese mismo patrón debería preferirse para capacidades futuras.

### Ejemplo de Plugin de empresa con múltiples capacidades

Un Plugin de empresa debería sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión multimedia, generación de imágenes, generación de video, obtención web y búsqueda web, un proveedor puede poseer todas sus superficies en un solo lugar:

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
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
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
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Lo que importa no son los nombres exactos de los helpers. Importa la forma:

- un Plugin posee la superficie del proveedor
- el núcleo sigue poseyendo los contratos de capacidad
- los canales y Plugins de función consumen helpers `api.runtime.*`, no código de proveedor
- las pruebas de contrato pueden afirmar que el Plugin registró las capacidades que dice poseer

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imágenes/audio/video como una capacidad compartida. El mismo modelo de propiedad se aplica ahí:

<Steps>
  <Step title="El núcleo define el contrato">
    El núcleo define el contrato de comprensión multimedia.
  </Step>
  <Step title="Los Plugins de proveedor se registran">
    Los Plugins de proveedor registran `describeImage`, `transcribeAudio` y `describeVideo` según corresponda.
  </Step>
  <Step title="Los consumidores usan el comportamiento compartido">
    Los canales y Plugins de función consumen el comportamiento compartido del núcleo en lugar de conectarse directamente a código de proveedor.
  </Step>
</Steps>

Eso evita incorporar los supuestos de video de un proveedor en el núcleo. El Plugin posee la superficie del proveedor; el núcleo posee el contrato de capacidad y el comportamiento alternativo.

La generación de video ya usa esa misma secuencia: el núcleo posee el contrato de capacidad tipado y el helper de runtime, y los Plugins de proveedor registran implementaciones `api.registerVideoGenerationProvider(...)` contra él.

¿Necesitas una lista de verificación concreta de despliegue? Consulta [Recetario de capacidades](/es/plugins/adding-capabilities).

## Contratos y cumplimiento

La superficie de la API de Plugins está tipada y centralizada intencionalmente en `OpenClawPluginApi`. Ese contrato define los puntos de registro admitidos y los helpers de runtime en los que un Plugin puede apoyarse.

Por qué importa esto:

- los autores de Plugins obtienen un estándar interno estable único
- el núcleo puede rechazar propiedad duplicada, como dos Plugins que registran el mismo identificador de proveedor
- el arranque puede mostrar diagnósticos accionables para registros malformados
- las pruebas de contrato pueden hacer cumplir la propiedad de Plugins incluidos y evitar deriva silenciosa

Hay dos capas de cumplimiento:

<AccordionGroup>
  <Accordion title="Aplicación del registro en tiempo de ejecución">
    El registro de plugins valida los registros a medida que se cargan los plugins. Ejemplos: los id de proveedores duplicados, los id de proveedores de voz duplicados y los registros mal formados producen diagnósticos de plugin en lugar de comportamiento indefinido.
  </Accordion>
  <Accordion title="Pruebas de contrato">
    Los plugins incluidos se capturan en registros de contrato durante las ejecuciones de pruebas para que OpenClaw pueda afirmar la propiedad explícitamente. Hoy esto se usa para proveedores de modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registros incluidos.
  </Accordion>
</AccordionGroup>

El efecto práctico es que OpenClaw sabe, por adelantado, qué plugin posee cada superficie. Eso permite que el núcleo y los canales se compongan sin fricción porque la propiedad se declara, se tipa y se puede probar, en lugar de ser implícita.

### Qué pertenece en un contrato

<Tabs>
  <Tab title="Buenos contratos">
    - tipados
    - pequeños
    - específicos de la capacidad
    - propiedad del núcleo
    - reutilizables por varios plugins
    - consumibles por canales/funcionalidades sin conocimiento del proveedor

  </Tab>
  <Tab title="Malos contratos">
    - política específica del proveedor oculta en el núcleo
    - vías de escape de plugin puntuales que omiten el registro
    - código de canal que accede directamente a una implementación de proveedor
    - objetos de tiempo de ejecución ad hoc que no forman parte de `OpenClawPluginApi` ni de `api.runtime`

  </Tab>
</Tabs>

En caso de duda, eleva el nivel de abstracción: define primero la capacidad y luego deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en el proceso** con el Gateway. No están aislados en sandbox. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que el código del núcleo.

<Warning>
Implicaciones de los plugins nativos: un plugin puede registrar herramientas, manejadores de red, hooks y servicios; un error de plugin puede bloquear o desestabilizar el gateway; y un plugin nativo malicioso equivale a la ejecución de código arbitrario dentro del proceso de OpenClaw.
</Warning>

Los paquetes compatibles son más seguros de forma predeterminada porque OpenClaw actualmente los trata como paquetes de metadatos/contenido. En las versiones actuales, eso significa principalmente Skills incluidas.

Usa listas de permitidos y rutas explícitas de instalación/carga para plugins no incluidos. Trata los plugins del espacio de trabajo como código de desarrollo, no como valores predeterminados de producción.

Para los nombres de paquetes de espacio de trabajo incluidos, mantén el id del plugin anclado en el nombre de npm: `@openclaw/<id>` de forma predeterminada, o un sufijo tipado aprobado como `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando el paquete expone intencionalmente un rol de plugin más específico.

<Note>
**Nota de confianza:** `plugins.allow` confía en **id de plugins**, no en la procedencia del origen. Un plugin de espacio de trabajo con el mismo id que un plugin incluido sombrea intencionalmente la copia incluida cuando ese plugin de espacio de trabajo está habilitado/en la lista de permitidos. Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes. La confianza de los plugins incluidos se resuelve a partir de la instantánea de origen —el manifiesto y el código en disco en el momento de carga— en lugar de a partir de los metadatos de instalación. Un registro de instalación dañado o sustituido no puede ampliar silenciosamente la superficie de confianza de un plugin incluido más allá de lo que afirma el origen real.
</Note>

## Límite de exportación

OpenClaw exporta capacidades, no conveniencia de implementación.

Mantén público el registro de capacidades. Recorta las exportaciones auxiliares que no sean de contrato:

- subrutas auxiliares específicas de plugins incluidos
- subrutas de plomería de tiempo de ejecución que no están pensadas como API pública
- auxiliares de conveniencia específicos del proveedor
- auxiliares de configuración/onboarding que son detalles de implementación

Las subrutas auxiliares reservadas para plugins incluidos se han retirado del mapa de exportaciones generado del SDK. Mantén los auxiliares específicos del propietario dentro del paquete del plugin propietario; promueve solo el comportamiento de host reutilizable a contratos genéricos del SDK como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

## Internos y referencia

Para la canalización de carga, el modelo de registro, los hooks de tiempo de ejecución de proveedores, las rutas HTTP del Gateway, los esquemas de herramientas de mensajes, la resolución de destinos de canal, los catálogos de proveedores, los plugins del motor de contexto y la guía para agregar una nueva capacidad, consulta [Internos de la arquitectura de plugins](/es/plugins/architecture-internals).

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [Manifiesto de plugin](/es/plugins/manifest)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
