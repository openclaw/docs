---
read_when:
    - Creación o depuración de plugins nativos de OpenClaw
    - Comprender el modelo de capacidades de los plugins o los límites de responsabilidad
    - Trabajo en el proceso de carga o el registro de plugins
    - Implementación de hooks de tiempo de ejecución de proveedores o plugins de canal
sidebarTitle: Internals
summary: 'Aspectos internos de los Plugin: modelo de capacidades, propiedad, contratos, canalización de carga y utilidades de tiempo de ejecución'
title: Aspectos internos del Plugin
x-i18n:
    generated_at: "2026-07-11T23:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Esta es la **referencia detallada de la arquitectura** del sistema de plugins de OpenClaw. Para consultar guías prácticas, comienza con una de las páginas específicas que aparecen a continuación.

<CardGroup cols={2}>
  <Card title="Instalar y usar plugins" icon="plug" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo añadir, habilitar y solucionar problemas de plugins.
  </Card>
  <Card title="Crear plugins" icon="rocket" href="/es/plugins/building-plugins">
    Tutorial para crear el primer plugin con el manifiesto funcional más sencillo.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/es/plugins/sdk-channel-plugins">
    Crea un plugin de canal de mensajería.
  </Card>
  <Card title="Plugins de proveedor" icon="microchip" href="/es/plugins/sdk-provider-plugins">
    Crea un plugin de proveedor de modelos.
  </Card>
  <Card title="Descripción general del SDK" icon="book" href="/es/plugins/sdk-overview">
    Referencia del mapa de importaciones y la API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Las capacidades constituyen el modelo público de **plugins nativos** dentro de OpenClaw. Cada plugin nativo de OpenClaw se registra con uno o varios tipos de capacidades:

| Capacidad                 | Método de registro                               | Plugins de ejemplo                  |
| ------------------------- | ------------------------------------------------ | ----------------------------------- |
| Inferencia de texto       | `api.registerProvider(...)`                      | `anthropic`, `openai`               |
| Backend de inferencia CLI | `api.registerCliBackend(...)`                    | `anthropic`, `openai`               |
| Incrustaciones            | `api.registerEmbeddingProvider(...)`             | Plugins vectoriales del proveedor   |
| Voz                       | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`           |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                         |
| Voz en tiempo real        | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`                  |
| Comprensión multimedia    | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`                  |
| Fuente de transcripciones | `api.registerTranscriptSourceProvider(...)`      | `discord`                           |
| Generación de imágenes    | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`           |
| Generación de música      | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`          |
| Generación de vídeo       | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`             |
| Obtención de contenido web | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Búsqueda web              | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google`      |
| Canal / mensajería        | `api.registerChannel(...)`                       | `matrix`, `msteams`                 |
| Detección del Gateway     | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                           |

<Note>
Un plugin que registra cero capacidades, pero proporciona hooks, herramientas, servicios de detección o servicios en segundo plano, es un plugin **heredado basado únicamente en hooks**. Este patrón sigue siendo totalmente compatible.
</Note>

### Postura sobre la compatibilidad externa

El modelo de capacidades ya está integrado en el núcleo y actualmente lo utilizan los plugins incluidos y nativos, pero la compatibilidad de los plugins externos sigue exigiendo un criterio más estricto que «se exporta, por lo tanto está congelado».

| Situación del plugin                               | Orientación                                                                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Plugins externos existentes                        | Mantén operativas las integraciones basadas en hooks; esta es la referencia de compatibilidad.                          |
| Nuevos plugins incluidos o nativos                 | Prefiere el registro explícito de capacidades frente al acceso específico de proveedores o nuevos diseños solo con hooks. |
| Plugins externos que adoptan el registro de capacidades | Está permitido, pero considera que las superficies auxiliares específicas de capacidades están en evolución, salvo que la documentación las marque como estables. |

El registro de capacidades es la dirección prevista. Los hooks heredados siguen siendo la vía más segura para evitar incompatibilidades en los plugins externos durante la transición. No todas las subrutas de auxiliares exportadas son equivalentes: prefiere contratos específicos y documentados frente a exportaciones auxiliares accidentales.

### Formas de los plugins

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real de registro, no solo según sus metadatos estáticos:

<AccordionGroup>
  <Accordion title="capacidad simple">
    Registra exactamente un tipo de capacidad; por ejemplo, un plugin exclusivo de proveedor como `arcee` o `chutes`.
  </Accordion>
  <Accordion title="capacidad híbrida">
    Registra varios tipos de capacidades; por ejemplo, `openai` gestiona la inferencia de texto, la voz, la comprensión multimedia y la generación de imágenes.
  </Accordion>
  <Accordion title="solo hooks">
    Registra únicamente hooks, tipados o personalizados, sin capacidades, herramientas, comandos ni servicios.
  </Accordion>
  <Accordion title="sin capacidades">
    Registra herramientas, comandos, servicios o rutas, pero ninguna capacidad.
  </Accordion>
</AccordionGroup>

Usa `openclaw plugins inspect <id>` para consultar la forma de un plugin y el desglose de sus capacidades. Consulta la [referencia de la CLI](/es/cli/plugins#inspect) para obtener más información.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como vía de compatibilidad para los plugins que solo usan hooks. Los plugins heredados utilizados en entornos reales todavía dependen de él.

Dirección:

- mantenerlo operativo
- documentarlo como heredado
- preferir `before_model_resolve` para las modificaciones del modelo o proveedor
- preferir `before_prompt_build` para las modificaciones del prompt
- eliminarlo únicamente cuando disminuya su uso real y la cobertura de los datos de prueba demuestre que la migración es segura

### Señales de compatibilidad

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` y `openclaw plugins doctor` muestran estos avisos de compatibilidad:

| Señal                                          | Significado                                                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **configuración válida**                       | La configuración se analiza correctamente y los plugins se resuelven                                                              |
| **solo hooks** (información)                   | El plugin registra únicamente hooks; es una vía compatible, pero aún no se ha migrado al registro de capacidades                  |
| **`before_agent_start` heredado** (advertencia) | El plugin usa el hook obsoleto `before_agent_start` en lugar de `before_model_resolve`/`before_prompt_build`                       |
| **API obsoleta de incrustaciones de memoria** (advertencia) | Un plugin no incluido usa la antigua API de proveedores de incrustaciones específica de memoria en lugar de `registerEmbeddingProvider` |
| **error grave**                                | La configuración no es válida o no se pudo cargar el plugin                                                                       |

Ninguna de las señales informativas o de advertencia impide actualmente el funcionamiento de tu plugin. Estas señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Descripción general de la arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

<Steps>
  <Step title="Manifiesto y detección">
    OpenClaw busca plugins candidatos en las rutas configuradas, las raíces del espacio de trabajo, las raíces globales de plugins y los plugins incluidos. La detección lee primero los manifiestos nativos `openclaw.plugin.json` y los manifiestos de paquetes compatibles.
  </Step>
  <Step title="Habilitación y validación">
    El núcleo determina si un plugin detectado está habilitado, deshabilitado, bloqueado o seleccionado para una ranura exclusiva, como la memoria.
  </Step>
  <Step title="Carga en tiempo de ejecución">
    Los plugins nativos de OpenClaw se cargan dentro del proceso y registran capacidades en un registro central. El JavaScript empaquetado se carga mediante el `require` nativo; el código fuente TypeScript local de terceros usa Jiti como mecanismo de emergencia. Los paquetes compatibles se normalizan en registros del registro sin importar código de ejecución.
  </Step>
  <Step title="Consumo de superficies">
    El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración de proveedores, hooks, rutas HTTP, comandos de la CLI y servicios.
  </Step>
</Steps>

Específicamente para la CLI de plugins, la detección de comandos raíz se divide en dos fases:

- los metadatos del tiempo de análisis proceden de `registerCli(..., { descriptors: [...] })`
- el módulo real de la CLI del plugin puede permanecer en carga diferida y registrarse en la primera invocación

Esto mantiene el código de la CLI que pertenece al plugin dentro del propio plugin, al tiempo que permite a OpenClaw reservar los nombres de los comandos raíz antes del análisis.

El límite de diseño importante:

- la validación del manifiesto y de la configuración debe funcionar a partir de los **metadatos del manifiesto y del esquema** sin ejecutar código del plugin
- la detección de capacidades nativas puede cargar código de entrada de plugins de confianza para crear una instantánea del registro que no active nada
- el comportamiento nativo en tiempo de ejecución procede de la ruta `register(api)` del módulo del plugin con `api.registrationMode === "full"`

Esta separación permite a OpenClaw validar la configuración, explicar los plugins ausentes o deshabilitados y crear indicaciones para la interfaz y los esquemas antes de que se active el entorno de ejecución completo.

### Instantánea de metadatos de plugins y tabla de búsqueda

Al iniciarse, el Gateway crea una única `PluginMetadataSnapshot` para la instantánea actual de la configuración. La instantánea contiene únicamente metadatos: almacena el índice de plugins instalados, el registro de manifiestos, los diagnósticos de manifiestos, los mapas de propietarios, un normalizador de identificadores de plugins y los registros de manifiestos. No contiene módulos de plugins cargados, SDK de proveedores, contenido de paquetes ni exportaciones de ejecución.

La validación de la configuración que tiene en cuenta los plugins, la habilitación automática durante el inicio y la inicialización de plugins del Gateway consumen esa instantánea en lugar de reconstruir de forma independiente los metadatos del manifiesto y del índice. `PluginLookUpTable` se deriva de la misma instantánea y añade el plan de plugins de inicio correspondiente a la configuración de ejecución actual.

Después del inicio, el Gateway conserva la instantánea de metadatos actual como un producto de ejecución reemplazable. La detección repetida de proveedores durante la ejecución puede reutilizar esa instantánea en lugar de reconstruir el índice instalado y el registro de manifiestos en cada pasada por el catálogo de proveedores. La instantánea se borra o se reemplaza cuando se cierra el Gateway, cambia la configuración o el inventario de plugins y se escribe el índice instalado; los componentes que la consumen recurren a la ruta en frío del manifiesto y del índice cuando no existe una instantánea actual compatible. Las comprobaciones de compatibilidad deben incluir las raíces de detección de plugins, como `plugins.load.paths`, y el espacio de trabajo predeterminado del agente, ya que los plugins del espacio de trabajo forman parte del ámbito de los metadatos.

La instantánea y la tabla de búsqueda mantienen las decisiones repetidas del inicio en la ruta rápida:

- propiedad de los canales
- inicio diferido de canales
- identificadores de los plugins de inicio
- propiedad de los proveedores y los backends de la CLI
- propiedad del proveedor de configuración, los alias de comandos, el proveedor del catálogo de modelos y los contratos de manifiesto
- validación del esquema de configuración de plugins y del esquema de configuración de canales
- decisiones de habilitación automática durante el inicio

El límite de seguridad es el reemplazo de la instantánea, no su modificación. Reconstruye la instantánea cuando cambien la configuración, el inventario de plugins, los registros de instalación o la política del índice persistente. No la trates como un registro global mutable de propósito general ni conserves un historial ilimitado de instantáneas. La carga de plugins en tiempo de ejecución permanece separada de las instantáneas de metadatos para evitar que un estado de ejecución obsoleto quede oculto tras una caché de metadatos.

La regla de caché se documenta en [Detalles internos de la arquitectura de plugins](/es/plugins/architecture-internals#plugin-cache-boundary): los metadatos del manifiesto y de detección están actualizados, salvo cuando un componente conserva una instantánea explícita, una tabla de búsqueda o un registro de manifiestos para el flujo actual. Las cachés ocultas de metadatos y los TTL basados en el reloj no forman parte de la carga de plugins. Solo las cachés del cargador de ejecución, de módulos y de artefactos de dependencias pueden persistir después de que el código o los artefactos instalados se hayan cargado realmente.

Algunos componentes de rutas en frío todavía reconstruyen los registros de manifiestos directamente a partir del índice persistente de plugins instalados, en lugar de recibir una `PluginLookUpTable` del Gateway. Ahora esa ruta reconstruye el registro bajo demanda; cuando un componente ya disponga de una tabla de búsqueda actual o de un registro de manifiestos explícito, es preferible pasarlos a través de los flujos de ejecución.

### Planificación de la activación

La planificación de la activación forma parte del plano de control. Los invocadores pueden consultar qué plugins son relevantes para un comando, proveedor, canal, ruta, arnés de agente o capacidad concretos antes de cargar registros de entorno de ejecución más amplios.

El planificador mantiene la compatibilidad con el comportamiento actual del manifiesto:

- los campos `activation.*` son indicaciones explícitas para el planificador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y los hooks siguen siendo el mecanismo alternativo basado en la propiedad del manifiesto
- la API del planificador que solo devuelve identificadores continúa disponible para los invocadores existentes
- la API de planificación informa etiquetas de motivo para que los diagnósticos puedan distinguir las indicaciones explícitas del mecanismo alternativo basado en la propiedad

<Warning>
No trate `activation` como un hook del ciclo de vida ni como sustituto de `register(...)`. Son metadatos que se usan para limitar la carga. Prefiera los campos de propiedad cuando ya describan la relación; use `activation` solo para indicaciones adicionales del planificador.
</Warning>

### Plugins de canal y la herramienta de mensajes compartida

Los plugins de canal no necesitan registrar una herramienta independiente para enviar, editar o reaccionar en las acciones normales de chat. OpenClaw mantiene una única herramienta `message` compartida en el núcleo, y los plugins de canal controlan tras ella el descubrimiento y la ejecución específicos del canal.

El límite actual es el siguiente:

- el núcleo controla el host de la herramienta `message` compartida, la integración con el prompt, el registro de sesiones e hilos y el despacho de la ejecución
- los plugins de canal controlan el descubrimiento de acciones delimitado, el descubrimiento de capacidades y cualquier fragmento de esquema específico del canal
- los plugins de canal controlan la gramática de conversación de sesión específica del proveedor, como la forma en que los identificadores de conversación codifican identificadores de hilo o se heredan de conversaciones principales
- los plugins de canal ejecutan la acción final mediante su adaptador de acciones

Para los plugins de canal, la superficie del SDK es `ChannelMessageActionAdapter.describeMessageTool(...)`. Esta llamada unificada de descubrimiento permite que un plugin devuelva conjuntamente sus acciones visibles, capacidades y aportaciones al esquema para evitar que esas partes diverjan.

Cuando un parámetro específico del canal de la herramienta de mensajes contiene una fuente multimedia, como una ruta local o una URL remota de contenido multimedia, el plugin también debe devolver `mediaSourceParams` desde `describeMessageTool(...)`. El núcleo usa esa lista explícita para aplicar la normalización de rutas del entorno aislado y las indicaciones de acceso a contenido multimedia saliente sin codificar de forma fija los nombres de parámetros que pertenecen al plugin. En este caso, prefiera mapas delimitados por acción, no una única lista plana para todo el canal, de modo que un parámetro multimedia exclusivo del perfil no se normalice en acciones no relacionadas como `send`.

El núcleo pasa el ámbito del entorno de ejecución a ese paso de descubrimiento. Entre los campos importantes se incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Esto es importante para los plugins sensibles al contexto. Un canal puede ocultar o mostrar acciones de mensajes en función de la cuenta activa, la sala, el hilo o el mensaje actuales, o la identidad de confianza del solicitante, sin codificar de forma fija ramas específicas del canal en la herramienta `message` del núcleo.

Por eso, los cambios de enrutamiento del ejecutor integrado siguen siendo trabajo del plugin: el ejecutor es responsable de reenviar la identidad actual del chat o de la sesión al límite de descubrimiento del plugin para que la herramienta `message` compartida exponga la superficie correcta, controlada por el canal, durante el turno actual.

En el caso de los asistentes de ejecución controlados por el canal, los plugins incluidos deben mantener el entorno de ejecución dentro de sus propios módulos de plugin. El núcleo ya no controla los entornos de ejecución de acciones de mensajes de Discord, Slack, Telegram o WhatsApp en `src/agents/tools`. No publicamos subrutas independientes `plugin-sdk/*-action-runtime`, y los plugins incluidos deben importar directamente su propio código de entorno de ejecución local desde los módulos que controlan.

El mismo límite se aplica en general a las interfaces del SDK que llevan el nombre de un proveedor: el núcleo no debe importar módulos de conveniencia específicos de canal para Discord, Signal, Slack, WhatsApp ni plugins similares. Si el núcleo necesita un comportamiento, debe consumir el módulo `api.ts` / `runtime-api.ts` del propio plugin incluido o convertir la necesidad en una capacidad genérica y limitada del SDK compartido.

Los plugins incluidos siguen la misma regla. El archivo `runtime-api.ts` de un plugin incluido no debe reexportar su propia fachada identificada por marca `openclaw/plugin-sdk/<plugin-id>`. Esas fachadas identificadas por marca siguen siendo adaptadores de compatibilidad para plugins externos y consumidores antiguos, pero los plugins incluidos deben usar exportaciones locales junto con subrutas genéricas y limitadas del SDK, como `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` u `openclaw/plugin-sdk/webhook-ingress`. El código nuevo no debe añadir fachadas del SDK específicas de un identificador de plugin, salvo que lo requiera el límite de compatibilidad de un ecosistema externo existente.

En el caso específico de las encuestas, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para los canales que se ajustan al modelo común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para la semántica de encuestas específica de un canal o para parámetros adicionales de las encuestas

Ahora el núcleo aplaza el análisis compartido de encuestas hasta después de que el despacho de encuestas del plugin rechace la acción, de modo que los controladores de encuestas que pertenecen al plugin puedan aceptar campos específicos del canal sin que el analizador genérico de encuestas los bloquee primero.

Consulte [Detalles internos de la arquitectura de plugins](/es/plugins/architecture-internals) para conocer la secuencia de inicio completa.

## Modelo de propiedad de capacidades

OpenClaw considera un plugin nativo como el límite de propiedad de una **empresa** o una **funcionalidad**, no como una colección indiscriminada de integraciones sin relación entre sí.

Esto significa que:

- un plugin de empresa normalmente debe controlar todas las superficies de esa empresa orientadas a OpenClaw
- un plugin de funcionalidad normalmente debe controlar toda la superficie de la funcionalidad que introduce
- los canales deben consumir capacidades compartidas del núcleo en lugar de volver a implementar el comportamiento del proveedor de forma puntual

<AccordionGroup>
  <Accordion title="Proveedor con múltiples capacidades">
    `google` controla la inferencia de texto, el backend de la CLI, los embeddings, la voz, la voz en tiempo real, la comprensión multimedia, la generación de imágenes, música y vídeo, y la búsqueda web. `openai` controla la inferencia de texto, los embeddings, la voz, la transcripción en tiempo real, la voz en tiempo real, la comprensión multimedia y la generación de imágenes y vídeo. `minimax` controla la inferencia de texto, además de la comprensión multimedia, la voz, la generación de imágenes, música y vídeo, y la búsqueda web.
  </Accordion>
  <Accordion title="Proveedor con una sola capacidad">
    `arcee` y `chutes` solo controlan la inferencia de texto; `microsoft` solo controla la voz. Un plugin de proveedor puede mantener este alcance limitado hasta que necesite abarcar una parte mayor de la superficie de dicho proveedor.
  </Accordion>
  <Accordion title="Plugin de funcionalidad">
    `voice-call` controla el transporte de llamadas, las herramientas, la CLI, las rutas y el puente de flujos multimedia de Twilio, pero consume las capacidades compartidas de voz, transcripción en tiempo real y voz en tiempo real en lugar de importar directamente plugins de proveedores.
  </Accordion>
</AccordionGroup>

El estado final previsto es el siguiente:

- la superficie de un proveedor orientada a OpenClaw reside en un único plugin, aunque abarque modelos de texto, voz, imágenes y vídeo
- otros proveedores pueden hacer lo mismo con su propia superficie
- a los canales no les importa qué plugin de proveedor controla el proveedor; consumen el contrato de capacidad compartido que expone el núcleo

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capacidad** = contrato del núcleo que varios plugins pueden implementar o consumir

Por tanto, si OpenClaw añade un dominio nuevo, como el vídeo, la primera pregunta no es «¿qué proveedor debe codificar de forma fija la gestión del vídeo?». La primera pregunta es «¿cuál es el contrato de capacidad de vídeo del núcleo?». Una vez que exista ese contrato, los plugins de proveedores podrán registrarse con él y los plugins de canal o de funcionalidad podrán consumirlo.

Si la capacidad aún no existe, el procedimiento correcto suele ser:

<Steps>
  <Step title="Definir la capacidad">
    Defina en el núcleo la capacidad que falta.
  </Step>
  <Step title="Exponerla mediante el SDK">
    Expóngala de forma tipada mediante la API o el entorno de ejecución de plugins.
  </Step>
  <Step title="Conectar los consumidores">
    Conecte los canales y las funcionalidades a esa capacidad.
  </Step>
  <Step title="Implementaciones de proveedores">
    Permita que los plugins de proveedores registren implementaciones.
  </Step>
</Steps>

Esto mantiene explícita la propiedad y evita al mismo tiempo que el comportamiento del núcleo dependa de un único proveedor o de una ruta de código puntual y específica de un plugin.

### Capas de capacidades

Use este modelo mental para decidir dónde debe residir el código:

<Tabs>
  <Tab title="Capa de capacidades del núcleo">
    Orquestación compartida, políticas, mecanismos alternativos, reglas de combinación de configuración, semántica de entrega y contratos tipados.
  </Tab>
  <Tab title="Capa de plugins de proveedores">
    API específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz, generación de imágenes, backends de vídeo y endpoints de uso.
  </Tab>
  <Tab title="Capa de plugins de canal o funcionalidad">
    Integración con Discord, Slack, `voice-call`, etc., que consume capacidades del núcleo y las presenta en una superficie.
  </Tab>
</Tabs>

Por ejemplo, la conversión de texto a voz sigue esta estructura:

- el núcleo controla la política de conversión de texto a voz al responder, el orden de los mecanismos alternativos, las preferencias y la entrega al canal
- `elevenlabs`, `google`, `microsoft` y `openai` controlan las implementaciones de síntesis
- `voice-call` consume el asistente del entorno de ejecución de conversión de texto a voz para telefonía

Debe preferirse este mismo patrón para las capacidades futuras.

### Ejemplo de plugin de empresa con múltiples capacidades

Un plugin de empresa debe percibirse como una unidad coherente desde el exterior. Si OpenClaw dispone de contratos compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión multimedia, generación de imágenes, generación de vídeo, obtención de contenido web y búsqueda web, un proveedor puede controlar todas sus superficies en un único lugar:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

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
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
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

Lo importante no son los nombres exactos de los asistentes. Lo importante es la estructura:

- un único plugin controla la superficie del proveedor
- el núcleo sigue controlando los contratos de capacidades
- los canales y los plugins de funcionalidades consumen los asistentes `api.runtime.*`, no el código del proveedor
- las pruebas de contratos pueden comprobar que el plugin haya registrado las capacidades que afirma controlar

### Ejemplo de capacidad: comprensión de vídeo

OpenClaw ya considera la comprensión de imágenes, audio y vídeo como una única capacidad compartida. El mismo modelo de propiedad se aplica en este caso:

<Steps>
  <Step title="El núcleo define el contrato">
    El núcleo define el contrato de comprensión multimedia.
  </Step>
  <Step title="Los plugins de proveedores se registran">
    Los plugins de proveedores registran `describeImage`, `transcribeAudio` y `describeVideo` según corresponda.
  </Step>
  <Step title="Los consumidores usan el comportamiento compartido">
    Los canales y los plugins de funcionalidades consumen el comportamiento compartido del núcleo en lugar de conectarse directamente al código del proveedor.
  </Step>
</Steps>

Esto evita incorporar en el núcleo las suposiciones sobre vídeo de un único proveedor. El plugin controla la superficie del proveedor; el núcleo controla el contrato de capacidad y el comportamiento alternativo.

La generación de vídeo ya usa esa misma secuencia: el núcleo controla el contrato de capacidad tipado y el asistente del entorno de ejecución, y los plugins de proveedores registran implementaciones de `api.registerVideoGenerationProvider(...)` con ese contrato.

¿Necesita una lista de comprobación concreta para el despliegue? Consulte [Recetario de capacidades](/es/plugins/adding-capabilities).

## Contratos y aplicación

La superficie de la API de plugins está tipada y centralizada intencionadamente en `OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y los auxiliares de entorno de ejecución en los que puede confiar un plugin.

Por qué es importante:

- los autores de plugins disponen de un único estándar interno estable
- el núcleo puede rechazar la propiedad duplicada, como cuando dos plugins registran el mismo id de proveedor
- el inicio puede mostrar diagnósticos prácticos para registros con formato incorrecto
- las pruebas de contrato pueden garantizar la propiedad de los plugins incluidos y evitar desviaciones silenciosas

Existen dos niveles de aplicación:

<AccordionGroup>
  <Accordion title="Aplicación del registro en tiempo de ejecución">
    El registro de plugins valida los registros a medida que se cargan los plugins. Por ejemplo, los ids de proveedor duplicados, los ids de proveedor de voz duplicados y los registros con formato incorrecto generan diagnósticos del plugin en lugar de un comportamiento indefinido.
  </Accordion>
  <Accordion title="Pruebas de contrato">
    Los plugins incluidos se capturan en registros de contrato durante las ejecuciones de pruebas para que OpenClaw pueda verificar explícitamente la propiedad. Actualmente, esto se utiliza para proveedores de modelos, proveedores de voz, proveedores de búsqueda web y la propiedad de los registros incluidos.
  </Accordion>
</AccordionGroup>

El efecto práctico es que OpenClaw sabe de antemano qué plugin posee cada superficie. Esto permite que el núcleo y los canales se integren sin problemas, ya que la propiedad se declara, está tipada y se puede probar, en lugar de ser implícita.

### Qué debe incluir un contrato

<Tabs>
  <Tab title="Contratos adecuados">
    - tipados
    - pequeños
    - específicos de una capacidad
    - propiedad del núcleo
    - reutilizables por varios plugins
    - utilizables por canales y funcionalidades sin conocer al proveedor

  </Tab>
  <Tab title="Contratos inadecuados">
    - política específica de un proveedor oculta en el núcleo
    - mecanismos de escape puntuales para plugins que eluden el registro
    - código de canal que accede directamente a la implementación de un proveedor
    - objetos de entorno de ejecución improvisados que no forman parte de `OpenClawPluginApi` ni de `api.runtime`

  </Tab>
</Tabs>

En caso de duda, eleve el nivel de abstracción: defina primero la capacidad y, después, permita que los plugins se integren en ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **dentro del proceso** junto con el Gateway. No están aislados. Un plugin nativo cargado comparte el mismo límite de confianza a nivel de proceso que el código del núcleo.

<Warning>
Implicaciones de los plugins nativos: un plugin puede registrar herramientas, controladores de red, enlaces y servicios; un error en un plugin puede bloquear o desestabilizar el Gateway; y un plugin nativo malicioso equivale a la ejecución de código arbitrario dentro del proceso de OpenClaw.
</Warning>

Los paquetes compatibles son más seguros de forma predeterminada porque OpenClaw los trata actualmente como paquetes de metadatos o contenido. En las versiones actuales, esto se refiere principalmente a Skills incluidas.

Utilice listas de permitidos y rutas explícitas de instalación y carga para los plugins no incluidos. Trate los plugins del espacio de trabajo como código para la fase de desarrollo, no como valores predeterminados de producción.

Para los nombres de paquetes incluidos en el espacio de trabajo, mantenga el id del plugin vinculado al nombre de npm: `@openclaw/<id>` de forma predeterminada, o un sufijo tipado aprobado, como `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding`, cuando el paquete exponga intencionadamente una función de plugin más específica.

<Note>
**Nota de confianza:** `plugins.allow` confía en los **ids de plugins**, no en la procedencia del código fuente. Un plugin del espacio de trabajo con el mismo id que un plugin incluido sustituye intencionadamente la copia incluida cuando dicho plugin del espacio de trabajo está habilitado o incluido en la lista de permitidos. Esto es normal y útil para el desarrollo local, las pruebas de parches y las correcciones urgentes. La confianza en los plugins incluidos se determina a partir de la instantánea del código fuente —el manifiesto y el código presentes en el disco en el momento de la carga—, en lugar de los metadatos de instalación. Un registro de instalación dañado o sustituido no puede ampliar silenciosamente la superficie de confianza de un plugin incluido más allá de lo que declara el código fuente real.
</Note>

## Límite de exportación

OpenClaw exporta capacidades, no comodidades de implementación.

Mantenga público el registro de capacidades. Reduzca las exportaciones auxiliares que no formen parte del contrato:

- subrutas auxiliares específicas de plugins incluidos
- subrutas de infraestructura del entorno de ejecución no destinadas a ser una API pública
- auxiliares de conveniencia específicos de proveedores
- auxiliares de configuración e incorporación que sean detalles de implementación

Las subrutas auxiliares reservadas para plugins incluidos se han retirado del mapa de exportación generado del SDK. Mantenga los auxiliares específicos de cada propietario dentro del paquete del plugin correspondiente; promueva únicamente el comportamiento reutilizable del host a contratos genéricos del SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

## Aspectos internos y referencia

Para consultar el proceso de carga, el modelo de registro, los enlaces del entorno de ejecución de proveedores, las rutas HTTP del Gateway, los esquemas de herramientas de mensajería, la resolución de destinos de canales, los catálogos de proveedores, los plugins del motor de contexto y la guía para añadir una capacidad nueva, consulte [Aspectos internos de la arquitectura de plugins](/es/plugins/architecture-internals).

## Contenido relacionado

- [Creación de plugins](/es/plugins/building-plugins)
- [Manifiesto de plugins](/es/plugins/manifest)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
