---
read_when:
    - Compilar o depurar plugins nativos de OpenClaw
    - Comprender el modelo de capacidades de Plugin o los límites de propiedad
    - Trabajo en la canalización de carga de Plugin o el registro
    - Implementación de ganchos de ejecución de proveedores o plugins de canales
sidebarTitle: Internals
summary: 'Aspectos internos de Plugin: modelo de capacidades, propiedad, contratos, canalización de carga y ayudantes en tiempo de ejecución'
title: Aspectos internos del Plugin
x-i18n:
    generated_at: "2026-05-02T05:31:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

Esta es la **referencia de arquitectura profunda** para el sistema de plugins de OpenClaw. Para guías prácticas, empieza con una de las páginas enfocadas a continuación.

<CardGroup cols={2}>
  <Card title="Instalar y usar plugins" icon="plug" href="/es/tools/plugin">
    Guía de usuario final para agregar, habilitar y solucionar problemas de plugins.
  </Card>
  <Card title="Crear plugins" icon="rocket" href="/es/plugins/building-plugins">
    Tutorial del primer plugin con el manifiesto funcional más pequeño.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/es/plugins/sdk-channel-plugins">
    Crea un plugin de canal de mensajería.
  </Card>
  <Card title="Plugins de proveedor" icon="microchip" href="/es/plugins/sdk-provider-plugins">
    Crea un plugin de proveedor de modelos.
  </Card>
  <Card title="Descripción general del SDK" icon="book" href="/es/plugins/sdk-overview">
    Referencia del mapa de importación y la API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Las capacidades son el modelo público de **plugin nativo** dentro de OpenClaw. Cada plugin nativo de OpenClaw se registra con uno o más tipos de capacidad:

| Capacidad              | Método de registro                              | Plugins de ejemplo                   |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferencia de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferencia de CLI | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Voz                    | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Comprensión de medios  | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generación de música   | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Obtención web          | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensajería     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Descubrimiento de Gateway | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Un plugin que registra cero capacidades pero proporciona hooks, herramientas, servicios de descubrimiento o servicios en segundo plano es un plugin **heredado solo de hooks**. Ese patrón sigue siendo totalmente compatible.
</Note>

### Postura de compatibilidad externa

El modelo de capacidades está integrado en el núcleo y lo usan hoy los plugins agrupados/nativos, pero la compatibilidad de plugins externos aún necesita un estándar más estricto que “está exportado, por lo tanto está congelado”.

| Situación del plugin                            | Guía                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                      | Mantén funcionando las integraciones basadas en hooks; esta es la base de compatibilidad.        |
| Nuevos plugins agrupados/nativos                 | Prefiere el registro explícito de capacidades frente a accesos específicos de proveedor o nuevos diseños solo de hooks. |
| Plugins externos que adoptan el registro de capacidades | Permitido, pero trata las superficies auxiliares específicas de capacidad como en evolución salvo que la documentación las marque como estables. |

El registro de capacidades es la dirección prevista. Los hooks heredados siguen siendo la ruta más segura sin rupturas para los plugins externos durante la transición. No todos los subrutas auxiliares exportadas son iguales: prefiere contratos estrechos documentados antes que exportaciones auxiliares incidentales.

### Formas de Plugin

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real de registro (no solo los metadatos estáticos):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra exactamente un tipo de capacidad (por ejemplo, un plugin solo de proveedor como `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra varios tipos de capacidad (por ejemplo, `openai` posee inferencia de texto, voz, comprensión de medios y generación de imágenes).
  </Accordion>
  <Accordion title="hook-only">
    Registra solo hooks (tipados o personalizados), sin capacidades, herramientas, comandos ni servicios.
  </Accordion>
  <Accordion title="non-capability">
    Registra herramientas, comandos, servicios o rutas, pero ninguna capacidad.
  </Accordion>
</AccordionGroup>

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin y el desglose de capacidades. Consulta la [referencia de CLI](/es/cli/plugins#inspect) para obtener detalles.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como ruta de compatibilidad para plugins solo de hooks. Los plugins heredados del mundo real aún dependen de él.

Dirección:

- mantenerlo funcionando
- documentarlo como heredado
- preferir `before_model_resolve` para trabajo de anulación de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación de prompts
- eliminarlo solo después de que el uso real baje y la cobertura de fixtures demuestre la seguridad de la migración

### Señales de compatibilidad

Cuando ejecutas `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver una de estas etiquetas:

| Señal                     | Significado                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configuración se analiza correctamente y los plugins se resuelven |
| **compatibility advisory** | El plugin usa un patrón compatible pero más antiguo (por ejemplo, `hook-only`) |
| **legacy warning**         | El plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**             | La configuración no es válida o el plugin no se pudo cargar  |

Ni `hook-only` ni `before_agent_start` romperán tu plugin hoy: `hook-only` es informativo, y `before_agent_start` solo activa una advertencia. Estas señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Descripción general de la arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

<Steps>
  <Step title="Manifiesto + descubrimiento">
    OpenClaw encuentra plugins candidatos a partir de rutas configuradas, raíces de workspace, raíces globales de plugins y plugins agrupados. El descubrimiento lee primero los manifiestos nativos `openclaw.plugin.json` más los manifiestos de paquetes compatibles.
  </Step>
  <Step title="Habilitación + validación">
    El núcleo decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o seleccionado para un espacio exclusivo como memoria.
  </Step>
  <Step title="Carga en tiempo de ejecución">
    Los plugins nativos de OpenClaw se cargan dentro del proceso y registran capacidades en un registro central. El JavaScript empaquetado se carga mediante `require` nativo; el TypeScript de código fuente local de terceros es el fallback de emergencia con Jiti. Los paquetes compatibles se normalizan en registros de registro sin importar código de tiempo de ejecución.
  </Step>
  <Step title="Consumo de superficies">
    El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración de proveedores, hooks, rutas HTTP, comandos de CLI y servicios.
  </Step>
</Steps>

Para la CLI de plugins específicamente, el descubrimiento de comandos raíz se divide en dos fases:

- los metadatos de tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo real de CLI del plugin puede permanecer diferido y registrarse en la primera invocación

Eso mantiene el código de CLI propiedad del plugin dentro del plugin, mientras permite que OpenClaw reserve nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- la validación de manifiesto/configuración debe funcionar desde **metadatos de manifiesto/esquema** sin ejecutar código del plugin
- el descubrimiento de capacidades nativas puede cargar código de entrada de plugins de confianza para construir una instantánea de registro no activadora
- el comportamiento nativo en tiempo de ejecución proviene de la ruta `register(api)` del módulo del plugin con `api.registrationMode === "full"`

Esa separación permite que OpenClaw valide la configuración, explique plugins faltantes/deshabilitados y construya sugerencias de UI/esquema antes de que el tiempo de ejecución completo esté activo.

### Instantánea de metadatos de plugins y tabla de búsqueda

El arranque de Gateway crea un `PluginMetadataSnapshot` para la instantánea de configuración actual. La instantánea solo contiene metadatos: almacena el índice de plugins instalados, el registro de manifiestos, diagnósticos de manifiestos, mapas de propietarios, un normalizador de ids de plugins y registros de manifiestos. No contiene módulos de plugins cargados, SDKs de proveedores, contenido de paquetes ni exportaciones de tiempo de ejecución.

La validación de configuración consciente de plugins, la habilitación automática al inicio y el arranque de plugins de Gateway consumen esa instantánea en lugar de reconstruir metadatos de manifiesto/índice de forma independiente. `PluginLookUpTable` se deriva de la misma instantánea y agrega el plan de plugins de inicio para la configuración de tiempo de ejecución actual.

Después del inicio, Gateway conserva la instantánea de metadatos actual como un producto de tiempo de ejecución reemplazable. El descubrimiento repetido de proveedores en tiempo de ejecución puede tomar prestada esa instantánea en lugar de reconstruir el índice instalado y el registro de manifiestos para cada pasada del catálogo de proveedores. La instantánea se borra o reemplaza al apagar Gateway, ante cambios de configuración/inventario de plugins y escrituras del índice instalado; los llamadores vuelven a la ruta fría de manifiesto/índice cuando no existe una instantánea actual compatible. Las comprobaciones de compatibilidad deben incluir raíces de descubrimiento de plugins como `plugins.load.paths` y el workspace predeterminado del agente, porque los plugins de workspace forman parte del alcance de metadatos.

La instantánea y la tabla de búsqueda mantienen las decisiones repetidas de inicio en la ruta rápida:

- propiedad de canales
- inicio diferido de canales
- ids de plugins de inicio
- propiedad de proveedores y backends de CLI
- propiedad de proveedor de configuración, alias de comando, proveedor de catálogo de modelos y contrato de manifiesto
- validación de esquema de configuración de plugin y esquema de configuración de canal
- decisiones de habilitación automática al inicio

El límite de seguridad es el reemplazo de instantáneas, no la mutación. Reconstruye la instantánea cuando cambien la configuración, el inventario de plugins, los registros de instalación o la política de índice persistido. No la trates como un registro global mutable amplio, y no conserves instantáneas históricas sin límite. La carga de plugins en tiempo de ejecución permanece separada de las instantáneas de metadatos para que el estado obsoleto de tiempo de ejecución no pueda ocultarse detrás de una caché de metadatos.

La regla de caché está documentada en [Internos de la arquitectura de plugins](/es/plugins/architecture-internals#plugin-cache-boundary): los metadatos de manifiesto y descubrimiento son recientes salvo que un llamador mantenga una instantánea, tabla de búsqueda o registro de manifiestos explícitos para el flujo actual. Las cachés de metadatos ocultas y los TTL basados en reloj no forman parte de la carga de plugins. Solo las cachés del cargador de tiempo de ejecución, módulos y artefactos de dependencias pueden persistir después de que el código o los artefactos instalados se carguen realmente.

Algunos llamadores de ruta fría aún reconstruyen registros de manifiestos directamente desde el índice persistido de plugins instalados en lugar de recibir una `PluginLookUpTable` de Gateway. Esa ruta ahora reconstruye el registro bajo demanda; prefiere pasar la tabla de búsqueda actual o un registro de manifiestos explícito a través de los flujos de tiempo de ejecución cuando un llamador ya tenga uno.

### Planificación de activación

La planificación de activación forma parte del plano de control. Los llamadores pueden preguntar qué plugins son relevantes para un comando, proveedor, canal, ruta, arnés de agente o capacidad concretos antes de cargar registros de tiempo de ejecución más amplios.

El planificador mantiene compatible el comportamiento actual del manifiesto:

- los campos `activation.*` son sugerencias explícitas para el planificador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y los hooks siguen siendo fallback de propiedad del manifiesto
- la API de planificador solo con ids sigue disponible para llamadores existentes
- la API de plan informa etiquetas de motivo para que los diagnósticos puedan distinguir sugerencias explícitas del fallback de propiedad

<Warning>
No trates `activation` como un hook de ciclo de vida ni como un reemplazo de `register(...)`. Es metadata usada para restringir la carga. Prefiere los campos de propiedad cuando ya describen la relación; usa `activation` solo para sugerencias adicionales del planificador.
</Warning>

### Plugins de canal y la herramienta de mensajes compartida

Los plugins de canal no necesitan registrar una herramienta separada para enviar/editar/reaccionar en acciones normales de chat. OpenClaw mantiene una herramienta `message` compartida en core, y los plugins de canal poseen el descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- core posee el host de la herramienta `message` compartida, el cableado de prompts, la contabilidad de sesiones/hilos y el despacho de ejecución
- los plugins de canal poseen el descubrimiento de acciones con alcance, el descubrimiento de capacidades y cualquier fragmento de schema específico del canal
- los plugins de canal poseen la gramática de conversación de sesión específica del proveedor, como la forma en que los ids de conversación codifican ids de hilo o heredan de conversaciones padre
- los plugins de canal ejecutan la acción final mediante su adaptador de acciones

Para los plugins de canal, la superficie del SDK es `ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada unificada de descubrimiento permite que un plugin devuelva sus acciones visibles, capacidades y contribuciones de schema en conjunto para que esas piezas no diverjan.

Cuando un parámetro de la herramienta de mensajes específico de un canal lleva una fuente multimedia, como una ruta local o una URL multimedia remota, el plugin también debería devolver `mediaSourceParams` desde `describeMessageTool(...)`. Core usa esa lista explícita para aplicar normalización de rutas del sandbox y sugerencias de acceso multimedia saliente sin codificar de forma rígida nombres de parámetros propiedad del plugin. Prefiere mapas con alcance de acción allí, no una lista plana para todo el canal, para que un parámetro multimedia solo de perfil no se normalice en acciones no relacionadas como `send`.

Core pasa el alcance de runtime a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Eso importa para plugins sensibles al contexto. Un canal puede ocultar o exponer acciones de mensaje según la cuenta activa, la sala/hilo/mensaje actual o la identidad confiable del solicitante sin codificar de forma rígida ramas específicas del canal en la herramienta `message` de core.

Por eso los cambios de enrutamiento del runner embebido siguen siendo trabajo del plugin: el runner es responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del plugin para que la herramienta `message` compartida exponga la superficie correcta propiedad del canal para el turno actual.

Para helpers de ejecución propiedad del canal, los plugins incluidos deben mantener el runtime de ejecución dentro de sus propios módulos de extensión. Core ya no posee los runtimes de acciones de mensaje de Discord, Slack, Telegram o WhatsApp bajo `src/agents/tools`. No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los plugins incluidos deberían importar su propio código de runtime local directamente desde sus módulos propiedad de la extensión.

El mismo límite aplica a las costuras del SDK con nombre de proveedor en general: core no debería importar barrels de conveniencia específicos del canal para Slack, Discord, Signal, WhatsApp o extensiones similares. Si core necesita un comportamiento, debe consumir el barrel `api.ts` / `runtime-api.ts` propio del plugin incluido o promover la necesidad a una capacidad genérica estrecha en el SDK compartido.

Los plugins incluidos siguen la misma regla. El `runtime-api.ts` de un plugin incluido no debería reexportar su propia fachada marcada `openclaw/plugin-sdk/<plugin-id>`. Esas fachadas marcadas siguen siendo shims de compatibilidad para plugins externos y consumidores antiguos, pero los plugins incluidos deberían usar exports locales más subrutas genéricas estrechas del SDK como `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` u `openclaw/plugin-sdk/webhook-ingress`. El código nuevo no debería añadir fachadas del SDK específicas de id de plugin salvo que lo requiera el límite de compatibilidad de un ecosistema externo existente.

Para encuestas específicamente, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para canales que encajan en el modelo común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semántica de encuestas específica del canal o parámetros adicionales de encuesta

Core ahora aplaza el análisis compartido de encuestas hasta después de que el despacho de encuestas del plugin rechace la acción, de modo que los handlers de encuestas propiedad del plugin puedan aceptar campos de encuesta específicos del canal sin que el parser genérico de encuestas los bloquee primero.

Consulta [Internos de arquitectura de Plugin](/es/plugins/architecture-internals) para ver la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata un plugin nativo como el límite de propiedad de una **empresa** o una **funcionalidad**, no como una mezcla de integraciones no relacionadas.

Eso significa que:

- un plugin de empresa normalmente debería poseer todas las superficies de esa empresa orientadas a OpenClaw
- un plugin de funcionalidad normalmente debería poseer toda la superficie de funcionalidad que introduce
- los canales deberían consumir capacidades compartidas de core en lugar de reimplementar comportamiento de proveedor ad hoc

<AccordionGroup>
  <Accordion title="Proveedor con múltiples capacidades">
    `openai` posee inferencia de texto, voz, voz en tiempo real, comprensión multimedia y generación de imágenes. `google` posee inferencia de texto más comprensión multimedia, generación de imágenes y búsqueda web. `qwen` posee inferencia de texto más comprensión multimedia y generación de video.
  </Accordion>
  <Accordion title="Proveedor de una sola capacidad">
    `elevenlabs` y `microsoft` poseen voz; `firecrawl` posee web-fetch; `minimax` / `mistral` / `moonshot` / `zai` poseen backends de comprensión multimedia.
  </Accordion>
  <Accordion title="Plugin de funcionalidad">
    `voice-call` posee transporte de llamadas, herramientas, CLI, rutas y puenteo de media streams de Twilio, pero consume capacidades compartidas de voz, transcripción en tiempo real y voz en tiempo real en lugar de importar plugins de proveedor directamente.
  </Accordion>
</AccordionGroup>

El estado final previsto es:

- OpenAI vive en un solo plugin aunque abarque modelos de texto, voz, imágenes y video futuro
- otro proveedor puede hacer lo mismo para su propia superficie
- a los canales no les importa qué plugin de proveedor posee el proveedor; consumen el contrato de capacidad compartido expuesto por core

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capability** = contrato de core que varios plugins pueden implementar o consumir

Así que si OpenClaw añade un nuevo dominio como video, la primera pregunta no es "¿qué proveedor debería codificar de forma rígida el manejo de video?". La primera pregunta es "¿cuál es el contrato de capacidad de video de core?". Una vez que exista ese contrato, los plugins de proveedor pueden registrarse contra él y los plugins de canal/funcionalidad pueden consumirlo.

Si la capacidad aún no existe, la acción correcta normalmente es:

<Steps>
  <Step title="Definir la capacidad">
    Define la capacidad faltante en core.
  </Step>
  <Step title="Exponer mediante el SDK">
    Exponla mediante la API/runtime del plugin de forma tipada.
  </Step>
  <Step title="Conectar consumidores">
    Conecta canales/funcionalidades contra esa capacidad.
  </Step>
  <Step title="Implementaciones de proveedores">
    Deja que los plugins de proveedor registren implementaciones.
  </Step>
</Steps>

Esto mantiene la propiedad explícita y evita comportamiento de core que dependa de un solo proveedor o de una ruta de código específica de un plugin puntual.

### Capas de capacidades

Usa este modelo mental al decidir dónde pertenece el código:

<Tabs>
  <Tab title="Capa de capacidad de core">
    Orquestación compartida, política, fallback, reglas de combinación de configuración, semántica de entrega y contratos tipados.
  </Tab>
  <Tab title="Capa de plugin de proveedor">
    APIs específicas del proveedor, auth, catálogos de modelos, síntesis de voz, generación de imágenes, futuros backends de video, endpoints de uso.
  </Tab>
  <Tab title="Capa de plugin de canal/funcionalidad">
    Integración de Slack/Discord/voice-call/etc. que consume capacidades de core y las presenta en una superficie.
  </Tab>
</Tabs>

Por ejemplo, TTS sigue esta forma:

- core posee la política de TTS en tiempo de respuesta, el orden de fallback, las prefs y la entrega por canal
- `openai`, `elevenlabs` y `microsoft` poseen implementaciones de síntesis
- `voice-call` consume el helper de runtime de TTS de telefonía

Ese mismo patrón debería preferirse para capacidades futuras.

### Ejemplo de plugin de empresa con múltiples capacidades

Un plugin de empresa debería sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión multimedia, generación de imágenes, generación de video, web fetch y búsqueda web, un proveedor puede poseer todas sus superficies en un solo lugar:

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

- un plugin posee la superficie del proveedor
- core sigue poseyendo los contratos de capacidad
- los canales y plugins de funcionalidad consumen helpers `api.runtime.*`, no código de proveedor
- las pruebas de contrato pueden afirmar que el plugin registró las capacidades que afirma poseer

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imagen/audio/video como una sola capacidad compartida. El mismo modelo de propiedad aplica allí:

<Steps>
  <Step title="Core define el contrato">
    Core define el contrato de comprensión multimedia.
  </Step>
  <Step title="Los plugins de proveedor se registran">
    Los plugins de proveedor registran `describeImage`, `transcribeAudio` y `describeVideo` según corresponda.
  </Step>
  <Step title="Los consumidores usan el comportamiento compartido">
    Los canales y plugins de funcionalidad consumen el comportamiento compartido de core en lugar de conectarse directamente al código del proveedor.
  </Step>
</Steps>

Eso evita incrustar en core los supuestos de video de un proveedor. El plugin posee la superficie del proveedor; core posee el contrato de capacidad y el comportamiento de fallback.

La generación de video ya usa esa misma secuencia: core posee el contrato de capacidad tipado y el helper de runtime, y los plugins de proveedor registran implementaciones `api.registerVideoGenerationProvider(...)` contra él.

¿Necesitas una checklist concreta de despliegue? Consulta [Recetario de capacidades](/es/plugins/architecture).

## Contratos y aplicación

La superficie de la API de plugins está tipada y centralizada intencionalmente en `OpenClawPluginApi`. Ese contrato define los puntos de registro admitidos y los helpers de runtime en los que un plugin puede basarse.

Por qué esto importa:

- los autores de plugins obtienen un estándar interno estable
- core puede rechazar propiedad duplicada, como dos plugins registrando el mismo id de proveedor
- el inicio puede mostrar diagnósticos accionables para registros mal formados
- las pruebas de contrato pueden aplicar la propiedad de plugins incluidos y evitar divergencia silenciosa

Hay dos capas de aplicación:

<AccordionGroup>
  <Accordion title="Aplicación del registro en tiempo de ejecución">
    El registro de plugins valida los registros a medida que se cargan los plugins. Ejemplos: identificadores de proveedores duplicados, identificadores de proveedores de voz duplicados y registros mal formados producen diagnósticos de plugins en lugar de comportamiento indefinido.
  </Accordion>
  <Accordion title="Pruebas de contrato">
    Los plugins incluidos se capturan en registros de contrato durante las ejecuciones de pruebas para que OpenClaw pueda afirmar la propiedad explícitamente. Hoy esto se usa para proveedores de modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registros incluidos.
  </Accordion>
</AccordionGroup>

El efecto práctico es que OpenClaw sabe, desde el principio, qué plugin posee cada superficie. Eso permite que el núcleo y los canales se compongan sin fricciones porque la propiedad se declara, está tipada y es comprobable, en lugar de ser implícita.

### Qué pertenece a un contrato

<Tabs>
  <Tab title="Buenos contratos">
    - tipados
    - pequeños
    - específicos de una capacidad
    - propiedad del núcleo
    - reutilizables por múltiples plugins
    - consumibles por canales/funcionalidades sin conocimiento del proveedor

  </Tab>
  <Tab title="Malos contratos">
    - política específica del proveedor oculta en el núcleo
    - vías de escape puntuales de plugins que omiten el registro
    - código de canal que accede directamente a una implementación de proveedor
    - objetos ad hoc en tiempo de ejecución que no forman parte de `OpenClawPluginApi` ni de `api.runtime`

  </Tab>
</Tabs>

En caso de duda, eleva el nivel de abstracción: define primero la capacidad y luego permite que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en proceso** con el Gateway. No están aislados en un sandbox. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que el código del núcleo.

<Warning>
Implicaciones de los plugins nativos: un plugin puede registrar herramientas, manejadores de red, hooks y servicios; un error de plugin puede bloquear o desestabilizar el gateway; y un plugin nativo malicioso equivale a la ejecución de código arbitrario dentro del proceso de OpenClaw.
</Warning>

Los paquetes compatibles son más seguros de forma predeterminada porque OpenClaw actualmente los trata como paquetes de metadatos/contenido. En las versiones actuales, eso significa principalmente Skills incluidos.

Usa listas de permitidos y rutas explícitas de instalación/carga para plugins no incluidos. Trata los plugins del espacio de trabajo como código de tiempo de desarrollo, no como valores predeterminados de producción.

Para los nombres de paquetes de espacio de trabajo incluidos, mantén el id del plugin anclado en el nombre npm: `@openclaw/<id>` de forma predeterminada, o un sufijo tipado aprobado como `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando el paquete exponga intencionalmente un rol de plugin más específico.

<Note>
**Nota de confianza:** `plugins.allow` confía en **ids de plugins**, no en la procedencia de la fuente. Un plugin de espacio de trabajo con el mismo id que un plugin incluido sustituye intencionalmente a la copia incluida cuando ese plugin de espacio de trabajo está habilitado/en la lista de permitidos. Esto es normal y útil para el desarrollo local, pruebas de parches y hotfixes. La confianza de plugins incluidos se resuelve desde la instantánea de la fuente —el manifiesto y el código en disco en el momento de carga— en lugar de desde los metadatos de instalación. Un registro de instalación dañado o sustituido no puede ampliar silenciosamente la superficie de confianza de un plugin incluido más allá de lo que declara la fuente real.
</Note>

## Límite de exportación

OpenClaw exporta capacidades, no conveniencia de implementación.

Mantén público el registro de capacidades. Recorta las exportaciones auxiliares que no formen parte del contrato:

- subrutas auxiliares específicas de plugins incluidos
- subrutas de plomería de tiempo de ejecución que no estén destinadas a ser API pública
- auxiliares de conveniencia específicos del proveedor
- auxiliares de configuración/onboarding que son detalles de implementación

Las subrutas auxiliares reservadas de plugins incluidos se han retirado del mapa de exportación del SDK generado. Mantén los auxiliares específicos del propietario dentro del paquete del plugin propietario; promueve solo el comportamiento reutilizable del host a contratos genéricos del SDK como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

## Internos y referencia

Para la canalización de carga, el modelo de registro, los hooks de tiempo de ejecución de proveedores, las rutas HTTP del Gateway, los esquemas de herramientas de mensajes, la resolución de destinos de canal, los catálogos de proveedores, los plugins del motor de contexto y la guía para agregar una nueva capacidad, consulta [Internos de la arquitectura de Plugin](/es/plugins/architecture-internals).

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins)
- [Manifiesto de Plugin](/es/plugins/manifest)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
