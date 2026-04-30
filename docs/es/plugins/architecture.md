---
read_when:
    - Compilación o depuración de plugins nativos de OpenClaw
    - Comprender el modelo de capacidades del Plugin o los límites de propiedad
    - Trabajar en la canalización de carga del Plugin o el registro
    - Implementación de hooks de tiempo de ejecución del proveedor o plugins de canal
sidebarTitle: Internals
summary: 'Aspectos internos de Plugin: modelo de capacidades, propiedad, contratos, canalización de carga y ayudantes de tiempo de ejecución'
title: Aspectos internos del Plugin
x-i18n:
    generated_at: "2026-04-30T05:51:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

Esta es la **referencia de arquitectura profunda** para el sistema de plugins de OpenClaw. Para guías prácticas, empieza con una de las páginas enfocadas a continuación.

<CardGroup cols={2}>
  <Card title="Instalar y usar plugins" icon="plug" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo añadir, habilitar y solucionar problemas de plugins.
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
  <Card title="Resumen del SDK" icon="book" href="/es/plugins/sdk-overview">
    Referencia del mapa de importación y de la API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Las capacidades son el modelo público de **plugin nativo** dentro de OpenClaw. Cada plugin nativo de OpenClaw se registra con uno o más tipos de capacidad:

| Capacidad              | Método de registro                              | Plugins de ejemplo                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferencia de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferencia CLI | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Voz                    | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Comprensión multimedia | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generación musical     | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Obtención web          | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensajería     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Descubrimiento de Gateway | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Un plugin que registra cero capacidades pero proporciona hooks, herramientas, servicios de descubrimiento o servicios en segundo plano es un plugin **heredado solo de hooks**. Ese patrón sigue siendo totalmente compatible.
</Note>

### Postura de compatibilidad externa

El modelo de capacidades ya está integrado en el núcleo y lo usan hoy los plugins incluidos/nativos, pero la compatibilidad de plugins externos aún necesita un estándar más estricto que "está exportado, por lo tanto está congelado".

| Situación del plugin                           | Orientación                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                       | Mantén funcionando las integraciones basadas en hooks; esta es la base de compatibilidad.         |
| Nuevos plugins incluidos/nativos                  | Prefiere el registro explícito de capacidades antes que accesos internos específicos de proveedor o nuevos diseños solo de hooks. |
| Plugins externos que adoptan el registro de capacidades | Permitido, pero trata las superficies auxiliares específicas de capacidad como evolutivas salvo que la documentación las marque como estables. |

El registro de capacidades es la dirección prevista. Los hooks heredados siguen siendo la ruta más segura sin rupturas para plugins externos durante la transición. Las subrutas auxiliares exportadas no son todas equivalentes: prefiere contratos estrechos documentados antes que exportaciones auxiliares incidentales.

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
    Registra solo hooks (tipados o personalizados), sin capacidades, herramientas, comandos ni servicios.
  </Accordion>
  <Accordion title="non-capability">
    Registra herramientas, comandos, servicios o rutas, pero no capacidades.
  </Accordion>
</AccordionGroup>

Usa `openclaw plugins inspect <id>` para ver la forma y el desglose de capacidades de un plugin. Consulta la [referencia de CLI](/es/cli/plugins#inspect) para más detalles.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como ruta de compatibilidad para plugins solo de hooks. Los plugins heredados del mundo real aún dependen de él.

Dirección:

- mantenerlo funcionando
- documentarlo como heredado
- preferir `before_model_resolve` para trabajo de sobrescritura de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación del prompt
- eliminarlo solo después de que el uso real disminuya y la cobertura de fixtures demuestre que la migración es segura

### Señales de compatibilidad

Cuando ejecutas `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver una de estas etiquetas:

| Señal                     | Significado                                                   |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configuración se analiza correctamente y los plugins se resuelven |
| **compatibility advisory** | El plugin usa un patrón compatible pero antiguo (p. ej. `hook-only`) |
| **legacy warning**         | El plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**             | La configuración no es válida o el plugin no se pudo cargar  |

Ni `hook-only` ni `before_agent_start` romperán tu plugin hoy: `hook-only` es informativo, y `before_agent_start` solo activa una advertencia. Estas señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Resumen de arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

<Steps>
  <Step title="Manifiesto + descubrimiento">
    OpenClaw encuentra plugins candidatos desde rutas configuradas, raíces de espacios de trabajo, raíces globales de plugins y plugins incluidos. El descubrimiento lee primero los manifiestos nativos `openclaw.plugin.json` más los manifiestos de paquete compatibles.
  </Step>
  <Step title="Habilitación + validación">
    El núcleo decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o seleccionado para una ranura exclusiva como la memoria.
  </Step>
  <Step title="Carga en runtime">
    Los plugins nativos de OpenClaw se cargan en proceso mediante jiti y registran capacidades en un registro central. Los paquetes compatibles se normalizan en registros sin importar código de runtime.
  </Step>
  <Step title="Consumo de superficies">
    El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración de proveedores, hooks, rutas HTTP, comandos CLI y servicios.
  </Step>
</Steps>

Para la CLI de plugins específicamente, el descubrimiento de comandos raíz se divide en dos fases:

- los metadatos de tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo CLI real del plugin puede permanecer diferido y registrarse en la primera invocación

Eso mantiene el código CLI propiedad del plugin dentro del plugin y, aun así, permite que OpenClaw reserve nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- la validación de manifiesto/configuración debe funcionar a partir de **metadatos de manifiesto/esquema** sin ejecutar código del plugin
- el descubrimiento de capacidades nativas puede cargar código de entrada de plugins de confianza para construir una instantánea de registro no activadora
- el comportamiento nativo en runtime proviene de la ruta `register(api)` del módulo del plugin con `api.registrationMode === "full"`

Esa separación permite que OpenClaw valide la configuración, explique plugins faltantes/deshabilitados y cree sugerencias de UI/esquema antes de que el runtime completo esté activo.

### Instantánea de metadatos de plugin y tabla de búsqueda

El arranque de Gateway construye un `PluginMetadataSnapshot` para la instantánea de configuración actual. La instantánea contiene solo metadatos: almacena el índice de plugins instalados, el registro de manifiestos, diagnósticos de manifiestos, mapas de propietarios, un normalizador de id de plugin y registros de manifiesto. No contiene módulos de plugin cargados, SDK de proveedores, contenido de paquetes ni exportaciones de runtime.

La validación de configuración consciente de plugins, la habilitación automática al inicio y el arranque de plugins de Gateway consumen esa instantánea en lugar de reconstruir metadatos de manifiesto/índice de forma independiente. `PluginLookUpTable` se deriva de la misma instantánea y añade el plan de plugins de inicio para la configuración de runtime actual.

Después del arranque, Gateway mantiene la instantánea de metadatos actual como un producto de runtime reemplazable. El descubrimiento repetido de proveedores en runtime puede tomar prestada esa instantánea en lugar de reconstruir el índice instalado y el registro de manifiestos para cada pasada del catálogo de proveedores. La instantánea se borra o reemplaza al apagar Gateway, ante cambios de configuración/inventario de plugins y escrituras del índice instalado; los llamadores vuelven a la ruta fría de manifiesto/índice cuando no existe una instantánea actual compatible. Las comprobaciones de compatibilidad deben incluir raíces de descubrimiento de plugins como `plugins.load.paths` y el espacio de trabajo predeterminado del agente, porque los plugins del espacio de trabajo forman parte del alcance de metadatos.

La instantánea y la tabla de búsqueda mantienen las decisiones repetidas de arranque en la ruta rápida:

- propiedad de canales
- inicio diferido de canales
- ids de plugins de inicio
- propiedad de proveedores y backends CLI
- propiedad de configuración de proveedores, alias de comandos, proveedor de catálogo de modelos y contrato de manifiesto
- validación del esquema de configuración de plugins y del esquema de configuración de canales
- decisiones de habilitación automática al inicio

El límite de seguridad es el reemplazo de instantáneas, no la mutación. Reconstruye la instantánea cuando cambien la configuración, el inventario de plugins, los registros de instalación o la política de índice persistida. No la trates como un registro global mutable amplio, y no conserves instantáneas históricas sin límite. La carga de plugins en runtime sigue separada de las instantáneas de metadatos para que el estado obsoleto de runtime no pueda quedar oculto detrás de una caché de metadatos.

La regla de caché está documentada en [Internos de la arquitectura de plugins](/es/plugins/architecture-internals#plugin-cache-boundary): los metadatos de manifiesto y descubrimiento están frescos salvo que un llamador mantenga una instantánea explícita, una tabla de búsqueda o un registro de manifiestos para el flujo actual. Las cachés ocultas de metadatos y los TTL basados en reloj de pared no forman parte de la carga de plugins. Solo las cachés del cargador de runtime, de módulos y de artefactos de dependencias pueden persistir después de que el código o los artefactos instalados se hayan cargado realmente.

Algunos llamadores de ruta fría todavía reconstruyen registros de manifiestos directamente desde el índice persistido de plugins instalados en lugar de recibir una `PluginLookUpTable` de Gateway. Esa ruta ahora reconstruye el registro bajo demanda; prefiere pasar la tabla de búsqueda actual o un registro de manifiestos explícito por los flujos de runtime cuando un llamador ya tenga uno.

### Planificación de activación

La planificación de activación forma parte del plano de control. Los llamadores pueden preguntar qué plugins son relevantes para un comando, proveedor, canal, ruta, arnés de agente o capacidad concretos antes de cargar registros de runtime más amplios.

El planificador mantiene compatible el comportamiento actual del manifiesto:

- los campos `activation.*` son sugerencias explícitas para el planificador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y hooks siguen siendo el fallback de propiedad del manifiesto
- la API del planificador solo de ids sigue disponible para llamadores existentes
- la API de plan informa etiquetas de motivo para que los diagnósticos puedan distinguir las sugerencias explícitas del fallback de propiedad

<Warning>
No trates `activation` como un hook del ciclo de vida ni como un reemplazo de `register(...)`. Es metadato usado para acotar la carga. Prefiere los campos de propiedad cuando ya describen la relación; usa `activation` solo para pistas adicionales del planificador.
</Warning>

### Plugins de canal y la herramienta de mensajes compartida

Los plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para acciones de chat normales. OpenClaw mantiene una herramienta `message` compartida en el core, y los plugins de canal son propietarios del descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el core es propietario del host de la herramienta `message` compartida, el cableado del prompt, la contabilidad de sesión/hilo y el despacho de ejecución
- los plugins de canal son propietarios del descubrimiento de acciones con alcance, el descubrimiento de capacidades y cualquier fragmento de esquema específico del canal
- los plugins de canal son propietarios de la gramática de conversación de sesión específica del proveedor, como la forma en que los identificadores de conversación codifican identificadores de hilo o heredan de conversaciones padre
- los plugins de canal ejecutan la acción final mediante su adaptador de acciones

Para los plugins de canal, la superficie del SDK es `ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada de descubrimiento unificada permite que un plugin devuelva sus acciones visibles, capacidades y contribuciones de esquema juntas para que esas piezas no se desvíen entre sí.

Cuando un parámetro de herramienta de mensajes específico del canal lleva una fuente multimedia como una ruta local o una URL multimedia remota, el plugin también debe devolver `mediaSourceParams` desde `describeMessageTool(...)`. El core usa esa lista explícita para aplicar normalización de rutas de sandbox y pistas de acceso a medios salientes sin codificar de forma fija nombres de parámetros propiedad del plugin. Prefiere mapas con alcance de acción allí, no una lista plana para todo el canal, para que un parámetro multimedia solo de perfil no se normalice en acciones no relacionadas como `send`.

El core pasa el alcance de runtime a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Eso importa para plugins sensibles al contexto. Un canal puede ocultar o exponer acciones de mensaje según la cuenta activa, la sala/hilo/mensaje actual o la identidad de solicitante de confianza sin codificar de forma fija ramas específicas del canal en la herramienta `message` del core.

Por eso los cambios de enrutamiento del ejecutor incrustado siguen siendo trabajo del plugin: el ejecutor es responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del plugin para que la herramienta `message` compartida exponga la superficie correcta propiedad del canal para el turno actual.

Para los helpers de ejecución propiedad del canal, los plugins incluidos deben mantener el runtime de ejecución dentro de sus propios módulos de extensión. El core ya no es propietario de los runtimes de acciones de mensaje de Discord, Slack, Telegram o WhatsApp bajo `src/agents/tools`. No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los plugins incluidos deben importar su propio código de runtime local directamente desde sus módulos propiedad de la extensión.

El mismo límite se aplica a las costuras del SDK con nombre de proveedor en general: el core no debe importar barriles de conveniencia específicos del canal para Slack, Discord, Signal, WhatsApp o extensiones similares. Si el core necesita un comportamiento, debe consumir el barril `api.ts` / `runtime-api.ts` propio del plugin incluido o promover la necesidad a una capacidad genérica estrecha en el SDK compartido.

Los plugins incluidos siguen la misma regla. El `runtime-api.ts` de un plugin incluido no debe reexportar su propia fachada de marca `openclaw/plugin-sdk/<plugin-id>`. Esas fachadas de marca siguen siendo shims de compatibilidad para plugins externos y consumidores antiguos, pero los plugins incluidos deben usar exportaciones locales más subrutas genéricas estrechas del SDK como `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` u `openclaw/plugin-sdk/webhook-ingress`. El código nuevo no debe añadir fachadas del SDK específicas de id de plugin salvo que el límite de compatibilidad para un ecosistema externo existente lo requiera.

Para encuestas específicamente, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para canales que encajan en el modelo común de encuesta
- `actions.handleAction("poll")` es la ruta preferida para semánticas de encuesta específicas del canal o parámetros adicionales de encuesta

Ahora el core pospone el análisis compartido de encuestas hasta después de que el despacho de encuestas del plugin rechace la acción, para que los manejadores de encuestas propiedad del plugin puedan aceptar campos de encuesta específicos del canal sin que el analizador genérico de encuestas los bloquee primero.

Consulta [Arquitectura interna de Plugin](/es/plugins/architecture-internals) para ver la secuencia completa de arranque.

## Modelo de propiedad de capacidades

OpenClaw trata un plugin nativo como el límite de propiedad de una **empresa** o una **función**, no como una colección de integraciones no relacionadas.

Eso significa:

- un plugin de empresa normalmente debe ser propietario de todas las superficies de esa empresa orientadas a OpenClaw
- un plugin de función normalmente debe ser propietario de toda la superficie de función que introduce
- los canales deben consumir capacidades compartidas del core en lugar de volver a implementar comportamiento de proveedor de forma ad hoc

<AccordionGroup>
  <Accordion title="Varias capacidades de proveedor">
    `openai` es propietario de inferencia de texto, voz, voz en tiempo real, comprensión de medios y generación de imágenes. `google` es propietario de inferencia de texto además de comprensión de medios, generación de imágenes y búsqueda web. `qwen` es propietario de inferencia de texto además de comprensión de medios y generación de video.
  </Accordion>
  <Accordion title="Capacidad única de proveedor">
    `elevenlabs` y `microsoft` son propietarios de voz; `firecrawl` es propietario de web-fetch; `minimax` / `mistral` / `moonshot` / `zai` son propietarios de backends de comprensión de medios.
  </Accordion>
  <Accordion title="Plugin de función">
    `voice-call` es propietario del transporte de llamadas, herramientas, CLI, rutas y puenteo de media-stream de Twilio, pero consume capacidades compartidas de voz, transcripción en tiempo real y voz en tiempo real en lugar de importar plugins de proveedor directamente.
  </Accordion>
</AccordionGroup>

El estado final previsto es:

- OpenAI vive en un plugin aunque abarque modelos de texto, voz, imágenes y video futuro
- otro proveedor puede hacer lo mismo para su propia área de superficie
- a los canales no les importa qué plugin de proveedor sea propietario del proveedor; consumen el contrato de capacidad compartido expuesto por el core

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capacidad** = contrato del core que varios plugins pueden implementar o consumir

Así que, si OpenClaw añade un nuevo dominio como video, la primera pregunta no es "¿qué proveedor debería codificar de forma fija el manejo de video?". La primera pregunta es "¿cuál es el contrato de capacidad de video del core?". Una vez que existe ese contrato, los plugins de proveedor pueden registrarse contra él y los plugins de canal/función pueden consumirlo.

Si la capacidad aún no existe, el movimiento correcto normalmente es:

<Steps>
  <Step title="Definir la capacidad">
    Define la capacidad faltante en el core.
  </Step>
  <Step title="Exponer mediante el SDK">
    Expónla mediante la API/runtime del plugin de forma tipada.
  </Step>
  <Step title="Cablear consumidores">
    Cablea canales/funciones contra esa capacidad.
  </Step>
  <Step title="Implementaciones de proveedor">
    Permite que los plugins de proveedor registren implementaciones.
  </Step>
</Steps>

Esto mantiene la propiedad explícita y evita comportamiento del core que dependa de un solo proveedor o de una ruta de código puntual específica de un plugin.

### Capas de capacidades

Usa este modelo mental al decidir dónde pertenece el código:

<Tabs>
  <Tab title="Capa de capacidad del core">
    Orquestación compartida, política, fallback, reglas de fusión de configuración, semántica de entrega y contratos tipados.
  </Tab>
  <Tab title="Capa de plugin de proveedor">
    APIs específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz, generación de imágenes, futuros backends de video, endpoints de uso.
  </Tab>
  <Tab title="Capa de plugin de canal/función">
    Integración de Slack/Discord/voice-call/etc. que consume capacidades del core y las presenta en una superficie.
  </Tab>
</Tabs>

Por ejemplo, TTS sigue esta forma:

- el core es propietario de la política de TTS en tiempo de respuesta, el orden de fallback, las preferencias y la entrega por canal
- `openai`, `elevenlabs` y `microsoft` son propietarios de las implementaciones de síntesis
- `voice-call` consume el helper de runtime de TTS de telefonía

Ese mismo patrón debe preferirse para capacidades futuras.

### Ejemplo de plugin de empresa con varias capacidades

Un plugin de empresa debe sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de video, recuperación web y búsqueda web, un proveedor puede ser propietario de todas sus superficies en un solo lugar:

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

Lo que importa no son los nombres exactos de los helpers. Lo que importa es la forma:

- un plugin es propietario de la superficie del proveedor
- el core sigue siendo propietario de los contratos de capacidad
- los canales y plugins de función consumen helpers `api.runtime.*`, no código de proveedor
- las pruebas de contrato pueden afirmar que el plugin registró las capacidades de las que afirma ser propietario

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imagen/audio/video como una capacidad compartida. El mismo modelo de propiedad se aplica allí:

<Steps>
  <Step title="El core define el contrato">
    El core define el contrato de comprensión de medios.
  </Step>
  <Step title="Los plugins de proveedor se registran">
    Los plugins de proveedor registran `describeImage`, `transcribeAudio` y `describeVideo` según corresponda.
  </Step>
  <Step title="Los consumidores usan el comportamiento compartido">
    Los canales y plugins de función consumen el comportamiento compartido del core en lugar de cablearse directamente al código del proveedor.
  </Step>
</Steps>

Eso evita incorporar las suposiciones de video de un proveedor en el core. El plugin es propietario de la superficie del proveedor; el core es propietario del contrato de capacidad y del comportamiento de fallback.

La generación de video ya usa esa misma secuencia: el core es propietario del contrato de capacidad tipado y del helper de runtime, y los plugins de proveedor registran implementaciones `api.registerVideoGenerationProvider(...)` contra él.

¿Necesitas una checklist de despliegue concreta? Consulta [Recetario de capacidades](/es/plugins/architecture).

## Contratos y cumplimiento

La superficie de la API de plugins está intencionalmente tipada y centralizada en `OpenClawPluginApi`. Ese contrato define los puntos de registro admitidos y los helpers de runtime de los que un plugin puede depender.

Por qué importa esto:

- los autores de plugins obtienen un estándar interno estable
- el core puede rechazar propiedad duplicada, como dos plugins que registran el mismo id de proveedor
- el arranque puede mostrar diagnósticos accionables para registros mal formados
- las pruebas de contrato pueden hacer cumplir la propiedad de plugins incluidos y evitar desviaciones silenciosas

Hay dos capas de cumplimiento:

<AccordionGroup>
  <Accordion title="Aplicación del registro en tiempo de ejecución">
    El registro de plugins valida los registros a medida que se cargan los plugins. Ejemplos: ids de proveedor duplicados, ids de proveedor de voz duplicados y registros mal formados producen diagnósticos de plugin en lugar de comportamiento indefinido.
  </Accordion>
  <Accordion title="Pruebas de contrato">
    Los plugins incluidos se capturan en registros de contrato durante las ejecuciones de prueba para que OpenClaw pueda afirmar la propiedad explícitamente. Hoy esto se usa para proveedores de modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registros incluidos.
  </Accordion>
</AccordionGroup>

El efecto práctico es que OpenClaw sabe, desde el principio, qué plugin posee cada superficie. Eso permite que el núcleo y los canales se compongan sin fricción porque la propiedad está declarada, tipada y es comprobable en lugar de implícita.

### Qué pertenece a un contrato

<Tabs>
  <Tab title="Buenos contratos">
    - tipados
    - pequeños
    - específicos de capacidad
    - propiedad del núcleo
    - reutilizables por múltiples plugins
    - consumibles por canales/funciones sin conocimiento del proveedor

  </Tab>
  <Tab title="Malos contratos">
    - política específica del proveedor oculta en el núcleo
    - vías de escape puntuales para plugins que omiten el registro
    - código de canal que accede directamente a una implementación de proveedor
    - objetos de tiempo de ejecución ad hoc que no forman parte de `OpenClawPluginApi` ni de `api.runtime`

  </Tab>
</Tabs>

Ante la duda, eleva el nivel de abstracción: define primero la capacidad y luego deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en proceso** con el Gateway. No están aislados en un sandbox. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que el código del núcleo.

<Warning>
Implicaciones de los plugins nativos: un plugin puede registrar herramientas, manejadores de red, hooks y servicios; un error en un plugin puede bloquear o desestabilizar el gateway; y un plugin nativo malicioso equivale a la ejecución de código arbitrario dentro del proceso de OpenClaw.
</Warning>

Los paquetes compatibles son más seguros de forma predeterminada porque OpenClaw los trata actualmente como paquetes de metadatos/contenido. En las versiones actuales, eso significa principalmente Skills incluidas.

Usa listas de permitidos y rutas explícitas de instalación/carga para plugins no incluidos. Trata los plugins del workspace como código de desarrollo, no como valores predeterminados de producción.

Para los nombres de paquetes de workspace incluidos, mantén el id del plugin anclado en el nombre npm: `@openclaw/<id>` de forma predeterminada, o un sufijo tipado aprobado como `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando el paquete expone intencionalmente un rol de plugin más estrecho.

<Note>
**Nota de confianza:** `plugins.allow` confía en **ids de plugin**, no en la procedencia de origen. Un plugin de workspace con el mismo id que un plugin incluido reemplaza intencionalmente la copia incluida cuando ese plugin de workspace está habilitado/en la lista de permitidos. Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes. La confianza de los plugins incluidos se resuelve a partir de la instantánea de origen —el manifiesto y el código en disco en el momento de carga— en lugar de los metadatos de instalación. Un registro de instalación corrupto o sustituido no puede ampliar silenciosamente la superficie de confianza de un plugin incluido más allá de lo que declara la fuente real.
</Note>

## Límite de exportación

OpenClaw exporta capacidades, no conveniencia de implementación.

Mantén público el registro de capacidades. Recorta las exportaciones auxiliares que no sean de contrato:

- subrutas auxiliares específicas de plugins incluidos
- subrutas de cableado de tiempo de ejecución no pensadas como API pública
- auxiliares de conveniencia específicos del proveedor
- auxiliares de configuración/incorporación que son detalles de implementación

Las subrutas auxiliares reservadas de plugins incluidos se han retirado del mapa de exportación generado del SDK. Mantén los auxiliares específicos del propietario dentro del paquete de plugin propietario; promueve solo el comportamiento reutilizable del host a contratos genéricos del SDK como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

## Internos y referencia

Para la canalización de carga, el modelo de registro, los hooks de tiempo de ejecución de proveedores, las rutas HTTP del Gateway, los esquemas de herramientas de mensajes, la resolución de destino de canales, los catálogos de proveedores, los plugins del motor de contexto y la guía para añadir una nueva capacidad, consulta [Internos de la arquitectura de plugins](/es/plugins/architecture-internals).

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [Manifiesto de plugin](/es/plugins/manifest)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
