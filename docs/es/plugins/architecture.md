---
read_when:
    - Creación o depuración de plugins nativos de OpenClaw
    - Comprender el modelo de capacidades de los plugins o los límites de propiedad
    - Trabajo en el pipeline de carga o el registro de plugins
    - Implementación de hooks de runtime de proveedores o plugins de canal
sidebarTitle: Internals
summary: 'Aspectos internos de los plugins: modelo de capacidades, propiedad, contratos, pipeline de carga y auxiliares de runtime'
title: Aspectos internos del Plugin
x-i18n:
    generated_at: "2026-07-20T00:53:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 28910ea251a40dd0840726f9f6f6aa65d3bf33b385b0cc61748f14b5ce4c0ee9
    source_path: plugins/architecture.md
    workflow: 16
---

Esta es la **referencia detallada de la arquitectura** del sistema de plugins de OpenClaw. Para consultar guías prácticas, comience por una de las páginas específicas que aparecen a continuación.

<CardGroup cols={2}>
  <Card title="Instalar y usar plugins" icon="plug" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo añadir, habilitar y solucionar problemas de plugins.
  </Card>
  <Card title="Crear plugins" icon="rocket" href="/es/plugins/building-plugins">
    Tutorial para crear el primer plugin con el manifiesto funcional más pequeño.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/es/plugins/sdk-channel-plugins">
    Cree un plugin de canal de mensajería.
  </Card>
  <Card title="Plugins de proveedor" icon="microchip" href="/es/plugins/sdk-provider-plugins">
    Cree un plugin de proveedor de modelos.
  </Card>
  <Card title="Descripción general del SDK" icon="book" href="/es/plugins/sdk-overview">
    Referencia del mapa de importaciones y de la API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Las capacidades son el modelo público de **plugins nativos** dentro de OpenClaw. Cada plugin nativo de OpenClaw se registra con uno o varios tipos de capacidad:

| Capacidad                   | Método de registro                              | Plugins de ejemplo                         |
| --------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Inferencia de texto         | `api.registerProvider(...)`                              | `anthropic`, `openai`     |
| Backend de inferencia de CLI | `api.registerCliBackend(...)`                             | `anthropic`, `openai`     |
| Embeddings                  | `api.registerEmbeddingProvider(...)`                              | Plugins vectoriales propiedad del proveedor |
| Voz                         | `api.registerSpeechProvider(...)`                              | `elevenlabs`, `microsoft`     |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)`                             | `openai`                         |
| Voz en tiempo real          | `api.registerRealtimeVoiceProvider(...)`                              | `google`, `openai`     |
| Comprensión multimedia      | `api.registerMediaUnderstandingProvider(...)`                              | `google`, `openai`     |
| Fuente de transcripciones   | `api.registerTranscriptSourceProvider(...)`                              | `discord`                         |
| Generación de imágenes      | `api.registerImageGenerationProvider(...)`                              | `fal`, `google`, `openai` |
| Generación de música        | `api.registerMusicGenerationProvider(...)`                              | `fal`, `google`, `minimax` |
| Generación de vídeo         | `api.registerVideoGenerationProvider(...)`                              | `fal`, `google`, `qwen` |
| Obtención de contenido web  | `api.registerWebFetchProvider(...)`                              | `firecrawl`                         |
| Búsqueda web                | `api.registerWebSearchProvider(...)`                              | `brave`, `firecrawl`, `google` |
| Canal / mensajería          | `api.registerChannel(...)`                              | `matrix`, `msteams`     |
| Descubrimiento del Gateway  | `api.registerGatewayDiscoveryService(...)`                              | `bonjour`                         |

<Note>
Un plugin que registra cero capacidades, pero proporciona hooks, herramientas, servicios de descubrimiento o servicios en segundo plano, es un plugin **heredado solo con hooks**. Este patrón sigue siendo totalmente compatible.
</Note>

### Postura sobre la compatibilidad externa

El modelo de capacidades ya está incorporado en el núcleo y actualmente lo utilizan los plugins incluidos y nativos, pero la compatibilidad con plugins externos todavía exige un criterio más estricto que «se exporta, por lo tanto está congelado».

| Situación del plugin                              | Orientación                                                                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Plugins externos existentes                       | Mantenga operativas las integraciones basadas en hooks; esta es la base de compatibilidad.                       |
| Nuevos plugins incluidos o nativos                | Prefiera el registro explícito de capacidades frente a accesos específicos del proveedor o nuevos diseños solo con hooks. |
| Plugins externos que adopten el registro de capacidades | Está permitido, pero considere que las superficies auxiliares específicas de cada capacidad están en evolución, salvo que la documentación las marque como estables. |

El registro de capacidades es la dirección prevista. Los hooks heredados siguen siendo la vía más segura para evitar incompatibilidades en plugins externos durante la transición. No todas las subrutas auxiliares exportadas son equivalentes: prefiera contratos específicos y documentados frente a exportaciones auxiliares incidentales.

### Formas de los plugins

OpenClaw clasifica cada plugin cargado según una forma determinada por su comportamiento real de registro, no solo por sus metadatos estáticos:

<AccordionGroup>
  <Accordion title="capacidad-simple">
    Registra exactamente un tipo de capacidad (por ejemplo, un plugin exclusivo de proveedor como `arcee` o `chutes`).
  </Accordion>
  <Accordion title="capacidad-híbrida">
    Registra varios tipos de capacidades (por ejemplo, `openai` controla la inferencia de texto, la voz, la comprensión multimedia y la generación de imágenes).
  </Accordion>
  <Accordion title="solo-hooks">
    Registra únicamente hooks (tipados o personalizados), sin capacidades, herramientas, comandos ni servicios.
  </Accordion>
  <Accordion title="sin-capacidades">
    Registra herramientas, comandos, servicios o rutas, pero ninguna capacidad.
  </Accordion>
</AccordionGroup>

Utilice `openclaw plugins inspect <id>` para consultar la forma y el desglose de capacidades de un plugin. Consulte la [referencia de la CLI](/es/cli/plugins#inspect) para obtener más detalles.

### Señales de compatibilidad

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` y `openclaw plugins doctor` muestran estos avisos de compatibilidad:

| Señal                                             | Significado                                                                                                           |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **configuración válida**                          | La configuración se analiza correctamente y los plugins se resuelven                                                 |
| **solo con hooks** (información)                  | El plugin registra únicamente hooks; es una vía compatible, pero todavía no se ha migrado al registro de capacidades |
| **API de embeddings de memoria obsoleta** (advertencia) | Un plugin no incluido utiliza la API antigua del proveedor de embeddings específica de memoria en lugar de `registerEmbeddingProvider` |
| **error grave**                                   | La configuración no es válida o el plugin no pudo cargarse                                                           |

Ninguna de las señales informativas o de advertencia interrumpe actualmente el funcionamiento del plugin. Estas señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Descripción general de la arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

<Steps>
  <Step title="Manifiesto y descubrimiento">
    OpenClaw busca plugins candidatos en las rutas configuradas, las raíces de los espacios de trabajo, las raíces globales de plugins y los plugins incluidos. El descubrimiento lee primero los manifiestos nativos `openclaw.plugin.json` y los manifiestos de paquetes compatibles.
  </Step>
  <Step title="Habilitación y validación">
    El núcleo determina si un plugin descubierto está habilitado, deshabilitado, bloqueado o seleccionado para una ranura exclusiva, como la memoria.
  </Step>
  <Step title="Carga en tiempo de ejecución">
    Los plugins nativos de OpenClaw se cargan en el mismo proceso y registran capacidades en un registro central. El JavaScript empaquetado se carga mediante el mecanismo nativo `require`; el código fuente TypeScript local de terceros utiliza Jiti como mecanismo alternativo de emergencia. Los paquetes compatibles se normalizan como registros del registro sin importar código de tiempo de ejecución.
  </Step>
  <Step title="Consumo de superficies">
    El resto de OpenClaw consulta el registro para exponer herramientas, canales, configuración de proveedores, hooks, rutas HTTP, comandos de la CLI y servicios.
  </Step>
</Steps>

En el caso específico de la CLI de plugins, el descubrimiento de comandos raíz se divide en dos fases:

- los metadatos del momento del análisis proceden de `registerCli(..., { descriptors: [...] })`
- el módulo real de la CLI del plugin puede permanecer en carga diferida y registrarse con la primera invocación

Esto mantiene el código de la CLI propiedad del plugin dentro del propio plugin y, al mismo tiempo, permite que OpenClaw reserve los nombres de los comandos raíz antes del análisis.

El límite de diseño importante es el siguiente:

- la validación del manifiesto y la configuración debe funcionar a partir de **metadatos del manifiesto y del esquema** sin ejecutar el código del plugin
- el descubrimiento de capacidades nativas puede cargar el código de entrada de plugins de confianza para crear una instantánea del registro que no active nada
- el comportamiento nativo en tiempo de ejecución procede de la ruta `register(api)` del módulo del plugin con `api.registrationMode === "full"`

Esta separación permite que OpenClaw valide la configuración, explique los plugins ausentes o deshabilitados y genere sugerencias para la interfaz y el esquema antes de que se active el entorno de ejecución completo.

### Instantánea de metadatos de plugins y tabla de consulta

Durante el inicio, el Gateway crea una instancia de `PluginMetadataSnapshot` para la instantánea de configuración actual. La instantánea contiene únicamente metadatos: almacena el índice de plugins instalados, el registro de manifiestos, los diagnósticos de manifiestos, los mapas de propietarios, un normalizador de identificadores de plugins y los registros de manifiestos. No contiene módulos de plugins cargados, SDK de proveedores, contenido de paquetes ni exportaciones de tiempo de ejecución.

La validación de configuración que tiene en cuenta los plugins, la habilitación automática durante el inicio y la inicialización de plugins del Gateway consumen esta instantánea en lugar de reconstruir de forma independiente los metadatos del manifiesto y del índice. `PluginLookUpTable` se deriva de la misma instantánea y añade el plan de plugins de inicio para la configuración actual del entorno de ejecución.

Después del inicio, el Gateway conserva la instantánea de metadatos actual como un producto reemplazable del entorno de ejecución. El descubrimiento repetido de proveedores en tiempo de ejecución puede reutilizar esa instantánea en lugar de reconstruir el índice de instalaciones y el registro de manifiestos en cada pasada del catálogo de proveedores. La instantánea se borra o reemplaza al apagar el Gateway, cuando cambia la configuración o el inventario de plugins y cuando se escribe el índice de instalaciones; los consumidores recurren a la ruta en frío del manifiesto y el índice cuando no existe una instantánea actual compatible. Las comprobaciones de compatibilidad deben incluir las raíces de descubrimiento de plugins, como `plugins.load.paths`, y el espacio de trabajo predeterminado del agente, porque los plugins del espacio de trabajo forman parte del alcance de los metadatos.

La instantánea y la tabla de consulta mantienen las decisiones repetidas de inicio en la ruta rápida:

- propiedad de los canales
- inicio diferido de canales
- identificadores de plugins de inicio
- propiedad de los proveedores y los backends de la CLI
- propiedad de proveedores de configuración, alias de comandos, proveedores del catálogo de modelos y contratos de manifiestos
- validación del esquema de configuración de plugins y del esquema de configuración de canales
- decisiones de habilitación automática durante el inicio

El límite de seguridad es el reemplazo de la instantánea, no su mutación. Reconstruya la instantánea cuando cambien la configuración, el inventario de plugins, los registros de instalación o la política persistente del índice. No debe tratarse como un registro global mutable de propósito general ni deben conservarse instantáneas históricas sin límite. La carga de plugins en tiempo de ejecución permanece separada de las instantáneas de metadatos para impedir que un estado obsoleto del entorno de ejecución quede oculto tras una caché de metadatos.

La regla de caché se documenta en [Aspectos internos de la arquitectura de plugins](/es/plugins/architecture-internals#plugin-cache-boundary): los metadatos de manifiestos y descubrimiento están actualizados, salvo que un consumidor conserve una instantánea, una tabla de consulta o un registro de manifiestos explícitos para el flujo actual. Las cachés ocultas de metadatos y los TTL basados en el tiempo de reloj no forman parte de la carga de plugins. Solo las cachés del cargador del entorno de ejecución, de módulos y de artefactos de dependencias pueden persistir después de que se hayan cargado realmente el código o los artefactos instalados.

Algunos consumidores de rutas en frío todavía reconstruyen directamente los registros de manifiestos a partir del índice persistente de plugins instalados, en lugar de recibir una instancia de `PluginLookUpTable` del Gateway. Esa ruta ahora reconstruye el registro bajo demanda; cuando un consumidor ya disponga de una tabla de consulta actual o de un registro de manifiestos explícito, es preferible pasarlos a través de los flujos de tiempo de ejecución.

### Planificación de la activación

La planificación de la activación forma parte del plano de control. Los consumidores pueden consultar qué plugins son pertinentes para un comando, proveedor, canal, ruta, arnés de agente o capacidad concretos antes de cargar registros de tiempo de ejecución más amplios.

El planificador mantiene la compatibilidad con el comportamiento actual de los manifiestos:

- los campos `activation.*` son indicaciones explícitas para el planificador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y los hooks siguen siendo el mecanismo alternativo de propiedad del manifiesto
- la API del planificador que solo usa identificadores sigue disponible para los consumidores existentes
- la API del plan informa etiquetas de motivo para que los diagnósticos puedan distinguir las indicaciones explícitas del mecanismo alternativo de propiedad

<Warning>
No se debe tratar `activation` como un hook de ciclo de vida ni como sustituto de `register(...)`. Son metadatos utilizados para limitar la carga. Se deben preferir los campos de propiedad cuando ya describan la relación; se debe usar `activation` únicamente para indicaciones adicionales del planificador.
</Warning>

### Plugins de canal y la herramienta de mensajes compartida

Los plugins de canal no necesitan registrar una herramienta independiente para enviar, editar o reaccionar en las acciones normales del chat. OpenClaw mantiene una única herramienta `message` compartida en el núcleo, y los plugins de canal controlan el descubrimiento y la ejecución específicos del canal que hay detrás.

El límite actual es:

- el núcleo controla el host de la herramienta `message` compartida, la conexión con el prompt, el registro de sesiones e hilos y el despacho de la ejecución
- los plugins de canal controlan el descubrimiento de acciones con ámbito, el descubrimiento de capacidades y cualquier fragmento de esquema específico del canal
- los plugins de canal controlan la gramática de conversación de sesión específica del proveedor, como la forma en que los identificadores de conversación codifican los identificadores de hilo o se heredan de conversaciones principales
- los plugins de canal ejecutan la acción final mediante su adaptador de acciones

Para los plugins de canal, la superficie del SDK es `ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada de descubrimiento unificada permite que un plugin devuelva conjuntamente sus acciones visibles, capacidades y contribuciones al esquema para evitar que esas piezas diverjan.

Los nombres de las acciones de mensajes utilizan deliberadamente un vocabulario cerrado y controlado por el núcleo para que todos los transportes puedan representar todas las acciones. Los plugins añaden nombres de acciones mediante un PR del núcleo; el registro en tiempo de ejecución no se admite de forma intencionada.

Cuando un parámetro de la herramienta de mensajes específico de un canal contiene una fuente multimedia, como una ruta local o una URL multimedia remota, el plugin también debe devolver `mediaSourceParams` desde `describeMessageTool(...)`. El núcleo usa esa lista explícita para aplicar la normalización de rutas del entorno aislado y las indicaciones de acceso a medios salientes sin codificar de forma rígida nombres de parámetros controlados por el plugin. En ese punto se deben preferir mapas con ámbito de acción, no una única lista plana para todo el canal, de modo que un parámetro multimedia exclusivo del perfil no se normalice en acciones no relacionadas como `send`.

El núcleo pasa el ámbito de ejecución a ese paso de descubrimiento. Entre los campos importantes se incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Esto es importante para los plugins sensibles al contexto. Un canal puede ocultar o mostrar acciones de mensajes según la cuenta activa, la sala, el hilo o el mensaje actuales, o la identidad de confianza del solicitante, sin codificar de forma rígida ramas específicas del canal en la herramienta `message` del núcleo.

Por este motivo, los cambios de enrutamiento del ejecutor integrado siguen siendo trabajo del plugin: el ejecutor debe reenviar la identidad actual del chat o la sesión al límite de descubrimiento del plugin para que la herramienta `message` compartida muestre la superficie correcta controlada por el canal durante el turno actual.

En el caso de los asistentes de ejecución controlados por el canal, los plugins incluidos deben mantener el entorno de ejecución dentro de sus propios módulos. El núcleo ya no controla los entornos de ejecución de acciones de mensajes de Discord, Slack, Telegram o WhatsApp en `src/agents/tools`. No se publican subrutas `plugin-sdk/*-action-runtime` independientes, y los plugins incluidos deben importar directamente su propio código de ejecución local desde los módulos controlados por el plugin.

El mismo límite se aplica en general a las interfaces del SDK que llevan el nombre de un proveedor: el núcleo no debe importar barrels prácticos específicos de canales para Discord, Signal, Slack, WhatsApp o plugins similares. Si el núcleo necesita un comportamiento, debe consumir el barrel `api.ts` / `runtime-api.ts` propio del plugin incluido o convertir la necesidad en una capacidad genérica y limitada del SDK compartido.

Los plugins incluidos siguen la misma regla. El `runtime-api.ts` de un plugin incluido no debe reexportar su propia fachada `openclaw/plugin-sdk/<plugin-id>` de marca. Esas fachadas de marca se mantienen como capas de compatibilidad para plugins externos y consumidores antiguos, pero los plugins incluidos deben usar exportaciones locales y subrutas genéricas limitadas del SDK, como `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` o `openclaw/plugin-sdk/webhook-ingress`. El código nuevo no debe añadir fachadas del SDK específicas del identificador de un plugin, salvo que lo exija el límite de compatibilidad de un ecosistema externo existente.

En concreto, para las encuestas existen dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para los canales compatibles con el modelo común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semánticas de encuesta específicas del canal o parámetros de encuesta adicionales

Ahora, el núcleo pospone el análisis compartido de las encuestas hasta después de que el despacho de encuestas del plugin rechace la acción, de modo que los controladores de encuestas del plugin puedan aceptar campos específicos del canal sin que el analizador genérico de encuestas los bloquee primero.

Consulte [Detalles internos de la arquitectura de plugins](/es/plugins/architecture-internals) para conocer la secuencia de inicio completa.

## Modelo de propiedad de capacidades

OpenClaw considera un plugin nativo como el límite de propiedad de una **empresa** o una **función**, no como una colección arbitraria de integraciones sin relación.

Esto significa:

- un plugin de empresa normalmente debe controlar todas las superficies de esa empresa orientadas a OpenClaw
- un plugin de función normalmente debe controlar toda la superficie de la función que introduce
- los canales deben consumir capacidades compartidas del núcleo en lugar de volver a implementar de forma improvisada el comportamiento del proveedor

<AccordionGroup>
  <Accordion title="Proveedor con múltiples capacidades">
    `google` controla la inferencia de texto, el backend de la CLI, las incrustaciones, la voz, la voz en tiempo real, la comprensión multimedia, la generación de imágenes, música y vídeo, y la búsqueda web. `openai` controla la inferencia de texto, las incrustaciones, la voz, la transcripción en tiempo real, la voz en tiempo real, la comprensión multimedia y la generación de imágenes y vídeo. `minimax` controla la inferencia de texto, además de la comprensión multimedia, la voz, la generación de imágenes, música y vídeo, y la búsqueda web.
  </Accordion>
  <Accordion title="Proveedor con una sola capacidad">
    `arcee` y `chutes` controlan únicamente la inferencia de texto; `microsoft` controla únicamente la voz. Un plugin de proveedor puede mantener este alcance limitado hasta que necesite cubrir una parte mayor de la superficie del proveedor.
  </Accordion>
  <Accordion title="Plugin de función">
    `voice-call` controla el transporte de llamadas, las herramientas, la CLI, las rutas y la conexión de flujos multimedia de Twilio, pero consume las capacidades compartidas de voz, transcripción en tiempo real y voz en tiempo real en lugar de importar directamente plugins de proveedores.
  </Accordion>
</AccordionGroup>

El estado final previsto es:

- la superficie de un proveedor orientada a OpenClaw reside en un único plugin, aunque abarque modelos de texto, voz, imágenes y vídeo
- otros proveedores pueden hacer lo mismo con su propia superficie
- a los canales no les importa qué plugin de proveedor controla el proveedor; consumen el contrato de capacidad compartido expuesto por el núcleo

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capacidad** = contrato del núcleo que varios plugins pueden implementar o consumir

Por tanto, si OpenClaw añade un dominio nuevo, como el vídeo, la primera pregunta no es «¿qué proveedor debe codificar de forma rígida el procesamiento de vídeo?». La primera pregunta es «¿cuál es el contrato de capacidad de vídeo del núcleo?». Una vez que exista ese contrato, los plugins de proveedores podrán registrarse en él y los plugins de canal o función podrán consumirlo.

Si la capacidad aún no existe, la medida adecuada suele ser:

<Steps>
  <Step title="Definir la capacidad">
    Definir en el núcleo la capacidad que falta.
  </Step>
  <Step title="Exponer mediante el SDK">
    Exponerla de forma tipada mediante la API o el entorno de ejecución del plugin.
  </Step>
  <Step title="Conectar los consumidores">
    Conectar los canales y las funciones con esa capacidad.
  </Step>
  <Step title="Implementaciones de proveedores">
    Permitir que los plugins de proveedores registren implementaciones.
  </Step>
</Steps>

Esto mantiene explícita la propiedad y evita que el comportamiento del núcleo dependa de un único proveedor o de una ruta de código puntual específica de un plugin.

### Capas de capacidades

Se debe usar este modelo mental para decidir dónde corresponde el código:

<Tabs>
  <Tab title="Capa de capacidades del núcleo">
    Orquestación compartida, políticas, mecanismos alternativos, reglas de combinación de configuración, semántica de entrega y contratos tipados.
  </Tab>
  <Tab title="Capa de plugins de proveedores">
    API específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz, generación de imágenes, backends de vídeo y puntos de conexión de uso.
  </Tab>
  <Tab title="Capa de plugins de canal o función">
    Integración con Discord, Slack, llamadas de voz, etc., que consume capacidades del núcleo y las presenta en una superficie.
  </Tab>
</Tabs>

Por ejemplo, TTS sigue esta estructura:

- el núcleo controla la política de TTS en el momento de responder, el orden de los mecanismos alternativos, las preferencias y la entrega del canal
- `elevenlabs`, `google`, `microsoft` y `openai` controlan las implementaciones de síntesis
- `voice-call` consume el asistente del entorno de ejecución de TTS para telefonía

Se debe preferir ese mismo patrón para las capacidades futuras.

### Ejemplo de plugin de empresa con múltiples capacidades

Un plugin de empresa debe percibirse como un conjunto coherente desde el exterior. Si OpenClaw dispone de contratos compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión multimedia, generación de imágenes, generación de vídeo, obtención web y búsqueda web, un proveedor puede controlar todas sus superficies en un mismo lugar:

```ts
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { exampleAiMedia } from "./exampleai-media.js";

export default definePluginEntry({
  id: "exampleai",
  name: "ExampleAI",
  description: "Modelos y capacidades multimedia de ExampleAI.",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // hooks de autenticación, catálogo de modelos y entorno de ejecución
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configuración de voz del proveedor — implementar directamente la interfaz SpeechProviderPlugin
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      describeImage: (req) => exampleAiMedia.describeImage(req),
      transcribeAudio: (req) => exampleAiMedia.transcribeAudio(req),
      describeVideo: (req) => exampleAiMedia.describeVideo(req),
    });

    api.registerWebSearchProvider({
      id: "exampleai-search",
      createTool() {
        // Devolver la herramienta de búsqueda web controlada por el proveedor.
      },
    });
  },
});
```

Lo importante no son los nombres exactos de los asistentes. Lo importante es la estructura:

- un plugin controla la superficie del proveedor
- el núcleo sigue controlando los contratos de capacidades
- la traducción de solicitudes del proveedor y los asistentes HTTP permanecen en el plugin del proveedor
- los canales y los plugins de funciones consumen asistentes `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden verificar que el plugin haya registrado las capacidades que afirma controlar

### Ejemplo de capacidad: comprensión de vídeo

OpenClaw ya trata la comprensión de imágenes, audio y vídeo como una única capacidad compartida. Allí se aplica el mismo modelo de propiedad:

<Steps>
  <Step title="El núcleo define el contrato">
    El núcleo define el contrato de comprensión multimedia.
  </Step>
  <Step title="Los plugins de proveedores se registran">
    Los plugins de proveedores registran `describeImage`, `transcribeAudio` y `describeVideo`, según corresponda.
  </Step>
  <Step title="Los consumidores usan el comportamiento compartido">
    Los canales y los plugins de funciones consumen el comportamiento compartido del núcleo en lugar de conectarse directamente al código del proveedor.
  </Step>
</Steps>

Esto evita incorporar al núcleo las suposiciones sobre vídeo de un proveedor concreto. El plugin controla la superficie del proveedor; el núcleo controla el contrato de capacidad y el comportamiento alternativo.

La generación de vídeo ya utiliza esa misma secuencia: el núcleo posee el contrato de capacidad tipado y el asistente de tiempo de ejecución, y los plugins de proveedores registran implementaciones de `api.registerVideoGenerationProvider(...)` en él.

¿Se necesita una lista de comprobación concreta para el despliegue? Consulte el [Recetario de capacidades](/es/plugins/adding-capabilities).

## Contratos y aplicación

La superficie de la API de plugins está tipada y centralizada intencionadamente en `OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y los asistentes de tiempo de ejecución de los que puede depender un plugin.

Por qué es importante:

- los autores de plugins disponen de un único estándar interno estable
- el núcleo puede rechazar la propiedad duplicada, como cuando dos plugins registran el mismo id de proveedor
- el inicio puede mostrar diagnósticos procesables para registros mal formados
- las pruebas de contrato pueden aplicar la propiedad de los plugins incluidos y evitar desviaciones silenciosas

Existen dos niveles de aplicación:

<AccordionGroup>
  <Accordion title="Aplicación del registro en tiempo de ejecución">
    El registro de plugins valida los registros a medida que se cargan los plugins. Por ejemplo, los ids de proveedor duplicados, los ids de proveedor de voz duplicados y los registros mal formados producen diagnósticos de plugins en lugar de un comportamiento indefinido.
  </Accordion>
  <Accordion title="Pruebas de contrato">
    Los plugins incluidos se capturan en registros de contratos durante las ejecuciones de pruebas para que OpenClaw pueda verificar explícitamente la propiedad. Actualmente, esto se utiliza para proveedores de modelos, proveedores de voz, proveedores de búsqueda web y la propiedad de los registros incluidos.
  </Accordion>
</AccordionGroup>

El efecto práctico es que OpenClaw sabe de antemano qué plugin posee cada superficie. Esto permite que el núcleo y los canales se integren sin problemas, ya que la propiedad se declara, se tipa y se puede probar, en lugar de ser implícita.

### Qué debe incluirse en un contrato

<Tabs>
  <Tab title="Contratos adecuados">
    - tipados
    - pequeños
    - específicos de cada capacidad
    - propiedad del núcleo
    - reutilizables por varios plugins
    - utilizables por canales y funcionalidades sin conocer al proveedor

  </Tab>
  <Tab title="Contratos inadecuados">
    - política específica del proveedor oculta en el núcleo
    - vías de escape puntuales para plugins que omiten el registro
    - código del canal que accede directamente a la implementación de un proveedor
    - objetos de tiempo de ejecución ad hoc que no forman parte de `OpenClawPluginApi` ni de `api.runtime`

  </Tab>
</Tabs>

En caso de duda, eleve el nivel de abstracción: defina primero la capacidad y después permita que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en el mismo proceso** que el Gateway. No están aislados. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que el código del núcleo.

<Warning>
Implicaciones de los plugins nativos: un plugin puede registrar herramientas, controladores de red, hooks y servicios; un error de un plugin puede bloquear o desestabilizar el Gateway; y un plugin nativo malicioso equivale a la ejecución de código arbitrario dentro del proceso de OpenClaw.
</Warning>

Los paquetes compatibles son más seguros de forma predeterminada porque OpenClaw los trata actualmente como paquetes de metadatos o contenido. En las versiones actuales, esto se refiere principalmente a Skills incluidas.

Utilice listas de permitidos y rutas explícitas de instalación y carga para los plugins no incluidos. Trate los plugins del espacio de trabajo como código para la fase de desarrollo, no como valores predeterminados de producción.

Para los nombres de paquetes incluidos del espacio de trabajo, mantenga el id del plugin vinculado al nombre de npm: `@openclaw/<id>` de forma predeterminada, o un sufijo tipado aprobado, como `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding`, cuando el paquete exponga intencionadamente una función de plugin más limitada.

<Note>
**Nota sobre la confianza:** `plugins.allow` confía en los **ids de plugins**, no en la procedencia del código fuente. Un plugin del espacio de trabajo con el mismo id que un plugin incluido reemplaza intencionadamente la copia incluida cuando dicho plugin del espacio de trabajo está habilitado o incluido en la lista de permitidos. Esto es normal y útil para el desarrollo local, las pruebas de parches y las correcciones urgentes. La confianza en los plugins incluidos se determina a partir de la instantánea del código fuente —el manifiesto y el código presentes en el disco en el momento de la carga—, no de los metadatos de instalación. Un registro de instalación dañado o sustituido no puede ampliar silenciosamente la superficie de confianza de un plugin incluido más allá de lo que declara el código fuente real.
</Note>

## Límite de exportación

OpenClaw exporta capacidades, no facilidades de implementación.

Mantenga público el registro de capacidades. Elimine las exportaciones de asistentes que no formen parte del contrato:

- subrutas de asistentes específicas de plugins incluidos
- subrutas de infraestructura de tiempo de ejecución no concebidas como API pública
- asistentes de conveniencia específicos de proveedores
- asistentes de configuración e incorporación que sean detalles de implementación

Las subrutas reservadas de asistentes para plugins incluidos se han retirado del mapa de exportaciones generado del SDK. Mantenga los asistentes específicos de cada propietario dentro del paquete del plugin correspondiente; promueva únicamente el comportamiento reutilizable del host a contratos genéricos del SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y las capacidades inyectadas de la API de plugins.

## Aspectos internos y referencia

Para consultar el pipeline de carga, el modelo de registro, los hooks de tiempo de ejecución de proveedores, las rutas HTTP del Gateway, los esquemas de herramientas de mensajes, la resolución de destinos de canales, los catálogos de proveedores, los plugins del motor de contexto y la guía para añadir una nueva capacidad, consulte los [aspectos internos de la arquitectura de plugins](/es/plugins/architecture-internals).

## Contenido relacionado

- [Creación de plugins](/es/plugins/building-plugins)
- [Manifiesto de plugins](/es/plugins/manifest)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
