---
read_when:
    - Crear o depurar plugins nativos de OpenClaw
    - Comprender el modelo de capacidades de Plugin o los límites de propiedad
    - Trabajar en la canalización de carga de Plugin o en el registro
    - Implementar hooks de runtime de proveedor o plugins de canal
sidebarTitle: Internals
summary: 'Aspectos internos de Plugin: modelo de capacidades, propiedad, contratos, canalización de carga y ayudas de tiempo de ejecución'
title: Internos de Plugin
x-i18n:
    generated_at: "2026-07-05T11:33:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Esta es la **referencia de arquitectura profunda** para el sistema de plugins de OpenClaw. Para guías prácticas, empieza con una de las páginas enfocadas a continuación.

<CardGroup cols={2}>
  <Card title="Instalar y usar plugins" icon="plug" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo agregar, habilitar y solucionar problemas de plugins.
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
    Mapa de importación y referencia de la API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Las capacidades son el modelo público de **plugin nativo** dentro de OpenClaw. Cada plugin nativo de OpenClaw se registra contra uno o más tipos de capacidad:

| Capacidad              | Método de registro                              | Plugins de ejemplo             |
| ---------------------- | ------------------------------------------------ | ------------------------------ |
| Inferencia de texto    | `api.registerProvider(...)`                      | `anthropic`, `openai`          |
| Backend de inferencia CLI | `api.registerCliBackend(...)`                 | `anthropic`, `openai`          |
| Embeddings             | `api.registerEmbeddingProvider(...)`             | Plugins vectoriales propiedad del proveedor |
| Voz                    | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`      |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                  |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`             |
| Comprensión de medios  | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`             |
| Fuente de transcripciones | `api.registerTranscriptSourceProvider(...)`   | `discord`                      |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`      |
| Generación de música   | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`     |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`        |
| Obtención web          | `api.registerWebFetchProvider(...)`              | `firecrawl`                    |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google` |
| Canal / mensajería     | `api.registerChannel(...)`                       | `matrix`, `msteams`            |
| Descubrimiento de Gateway | `api.registerGatewayDiscoveryService(...)`    | `bonjour`                      |

<Note>
Un plugin que registra cero capacidades pero proporciona hooks, herramientas, servicios de descubrimiento o servicios en segundo plano es un plugin **legacy solo de hooks**. Ese patrón sigue siendo totalmente compatible.
</Note>

### Postura de compatibilidad externa

El modelo de capacidades ya está incorporado en core y hoy lo usan los plugins incluidos/nativos, pero la compatibilidad de plugins externos todavía necesita un criterio más estricto que "está exportado, por lo tanto está congelado".

| Situación del plugin                            | Guía                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                       | Mantén funcionando las integraciones basadas en hooks; esta es la base de compatibilidad.        |
| Nuevos plugins incluidos/nativos                  | Prefiere el registro explícito de capacidades antes que accesos específicos de proveedor o nuevos diseños solo de hooks. |
| Plugins externos que adoptan registro de capacidades | Permitido, pero trata las superficies auxiliares específicas de capacidades como evolutivas salvo que la documentación las marque como estables. |

El registro de capacidades es la dirección prevista. Los hooks legacy siguen siendo la ruta más segura sin rupturas para plugins externos durante la transición. Las subrutas auxiliares exportadas no son todas iguales: prefiere contratos estrechos documentados frente a exportaciones auxiliares incidentales.

### Formas de plugin

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real de registro (no solo metadatos estáticos):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra exactamente un tipo de capacidad (por ejemplo, un plugin solo de proveedor como `arcee` o `chutes`).
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

### Hooks legacy

El hook `before_agent_start` sigue siendo compatible como ruta de compatibilidad para plugins solo de hooks. Plugins legacy reales todavía dependen de él.

Dirección:

- mantenerlo funcionando
- documentarlo como legacy
- preferir `before_model_resolve` para trabajo de anulación de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación de prompts
- eliminarlo solo después de que el uso real baje y la cobertura de fixtures demuestre que la migración es segura

### Señales de compatibilidad

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` y `openclaw plugins doctor` muestran estos avisos de compatibilidad:

| Señal                                      | Significado                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **config válida**                          | La config se analiza correctamente y los plugins se resuelven                                                  |
| **hook-only** (info)                       | El plugin registra solo hooks; es una ruta compatible, pero aún no se migró al registro de capacidades         |
| **legacy `before_agent_start`** (warn)     | El plugin usa el hook obsoleto `before_agent_start` en lugar de `before_model_resolve`/`before_prompt_build`  |
| **API de embedding de memoria obsoleta** (warn) | Un plugin no incluido usa la antigua API de proveedor de embeddings específica de memoria en lugar de `registerEmbeddingProvider` |
| **error grave**                            | La config no es válida o el plugin no se pudo cargar                                                          |

Ninguna de las señales informativas/de advertencia rompe tu plugin hoy. Estas señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Resumen de arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

<Steps>
  <Step title="Manifiesto + descubrimiento">
    OpenClaw encuentra plugins candidatos desde rutas configuradas, raíces de workspace, raíces globales de plugins y plugins incluidos. El descubrimiento lee primero manifiestos nativos `openclaw.plugin.json` y manifiestos de paquete compatibles.
  </Step>
  <Step title="Habilitación + validación">
    Core decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o seleccionado para un slot exclusivo como memoria.
  </Step>
  <Step title="Carga en runtime">
    Los plugins nativos de OpenClaw se cargan dentro del proceso y registran capacidades en un registro central. JavaScript empaquetado se carga mediante `require` nativo; TypeScript de fuente local de terceros es el fallback de emergencia con Jiti. Los paquetes compatibles se normalizan en registros de registry sin importar código de runtime.
  </Step>
  <Step title="Consumo de superficies">
    El resto de OpenClaw lee el registry para exponer herramientas, canales, configuración de proveedores, hooks, rutas HTTP, comandos CLI y servicios.
  </Step>
</Steps>

Para la CLI de plugins específicamente, el descubrimiento de comandos raíz se divide en dos fases:

- los metadatos en tiempo de parseo vienen de `registerCli(..., { descriptors: [...] })`
- el módulo CLI real del plugin puede permanecer lazy y registrarse en la primera invocación

Eso mantiene el código CLI propiedad del plugin dentro del plugin, mientras sigue permitiendo que OpenClaw reserve nombres de comandos raíz antes del parseo.

El límite de diseño importante:

- la validación de manifiesto/config debe funcionar desde **metadatos de manifiesto/esquema** sin ejecutar código del plugin
- el descubrimiento de capacidades nativas puede cargar código de entrada de plugins confiables para construir una instantánea de registry que no activa nada
- el comportamiento nativo de runtime viene de la ruta `register(api)` del módulo del plugin con `api.registrationMode === "full"`

Esa separación permite a OpenClaw validar config, explicar plugins faltantes/deshabilitados y construir sugerencias de UI/esquema antes de que el runtime completo esté activo.

### Instantánea de metadatos de plugins y tabla de búsqueda

El arranque de Gateway construye un `PluginMetadataSnapshot` para la instantánea de config actual. La instantánea solo contiene metadatos: almacena el índice de plugins instalados, el registry de manifiestos, diagnósticos de manifiestos, mapas de propietarios, un normalizador de id de plugin y registros de manifiesto. No contiene módulos de plugins cargados, SDKs de proveedores, contenidos de paquetes ni exportaciones de runtime.

La validación de config consciente de plugins, la habilitación automática en el arranque y el bootstrap de plugins de Gateway consumen esa instantánea en lugar de reconstruir metadatos de manifiesto/índice de forma independiente. `PluginLookUpTable` se deriva de la misma instantánea y agrega el plan de plugins de arranque para la config de runtime actual.

Después del arranque, Gateway mantiene la instantánea de metadatos actual como un producto de runtime reemplazable. El descubrimiento repetido de proveedores en runtime puede tomar prestada esa instantánea en lugar de reconstruir el índice instalado y el registry de manifiestos para cada pasada del catálogo de proveedores. La instantánea se borra o reemplaza al apagar Gateway, ante cambios de config/inventario de plugins y ante escrituras del índice instalado; los llamadores vuelven a la ruta fría de manifiesto/índice cuando no existe una instantánea actual compatible. Las comprobaciones de compatibilidad deben incluir raíces de descubrimiento de plugins como `plugins.load.paths` y el workspace de agente predeterminado, porque los plugins de workspace forman parte del alcance de metadatos.

La instantánea y la tabla de búsqueda mantienen las decisiones repetidas de arranque en la ruta rápida:

- propiedad de canales
- arranque diferido de canales
- ids de plugins de arranque
- propiedad de proveedor y backend CLI
- propiedad de proveedor de configuración, alias de comando, proveedor de catálogo de modelos y contrato de manifiesto
- validación de esquema de config de plugin y esquema de config de canal
- decisiones de habilitación automática en el arranque

El límite de seguridad es el reemplazo de instantáneas, no la mutación. Reconstruye la instantánea cuando cambien la config, el inventario de plugins, los registros de instalación o la política de índice persistida. No la trates como un registry global mutable amplio, y no conserves instantáneas históricas sin límite. La carga de plugins de runtime permanece separada de las instantáneas de metadatos para que el estado de runtime obsoleto no pueda ocultarse detrás de una caché de metadatos.

La regla de caché está documentada en [Internos de la arquitectura de plugins](/es/plugins/architecture-internals#plugin-cache-boundary): los metadatos de manifiesto y descubrimiento son frescos salvo que un llamador tenga una instantánea, tabla de búsqueda o registry de manifiestos explícito para el flujo actual. Las cachés ocultas de metadatos y los TTL de reloj de pared no forman parte de la carga de plugins. Solo las cachés del cargador de runtime, módulos y artefactos de dependencias pueden persistir después de que el código o los artefactos instalados se hayan cargado realmente.

Algunos llamadores de ruta fría todavía reconstruyen registries de manifiestos directamente desde el índice persistido de plugins instalados en lugar de recibir una `PluginLookUpTable` de Gateway. Esa ruta ahora reconstruye el registry bajo demanda; prefiere pasar la tabla de búsqueda actual o un registry de manifiestos explícito por los flujos de runtime cuando un llamador ya tenga uno.

### Planificación de activación

La planificación de activación forma parte del plano de control. Los llamadores pueden preguntar qué plugins son relevantes para un comando, proveedor, canal, ruta, arnés de agente o capacidad concretos antes de cargar registros de runtime más amplios.

El planificador mantiene compatible el comportamiento actual del manifiesto:

- los campos `activation.*` son indicios explícitos para el planificador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y los hooks siguen siendo el fallback de propiedad del manifiesto
- la API del planificador de solo ids sigue disponible para los llamadores existentes
- la API de plan informa etiquetas de motivo para que los diagnósticos puedan distinguir los indicios explícitos del fallback de propiedad

<Warning>
No trates `activation` como un hook de ciclo de vida ni como un reemplazo de `register(...)`. Es metadata usada para acotar la carga. Prefiere los campos de propiedad cuando ya describen la relación; usa `activation` solo para indicios adicionales del planificador.
</Warning>

### Plugins de canal y la herramienta de mensajes compartida

Los plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para acciones normales de chat. OpenClaw mantiene una única herramienta `message` compartida en core, y los plugins de canal son propietarios del descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- core es propietario del host de la herramienta `message` compartida, el cableado de prompts, la contabilidad de sesiones/hilos y el despacho de ejecución
- los plugins de canal son propietarios del descubrimiento de acciones con alcance, el descubrimiento de capacidades y cualquier fragmento de esquema específico del canal
- los plugins de canal son propietarios de la gramática de conversación de sesión específica del proveedor, como la forma en que los ids de conversación codifican ids de hilo o heredan de conversaciones padre
- los plugins de canal ejecutan la acción final mediante su adaptador de acciones

Para los plugins de canal, la superficie del SDK es `ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada de descubrimiento unificada permite que un plugin devuelva sus acciones visibles, capacidades y contribuciones de esquema juntas para que esas piezas no se desvíen entre sí.

Cuando un parámetro de la herramienta de mensajes específico del canal contiene una fuente multimedia, como una ruta local o una URL de medios remotos, el plugin también debería devolver `mediaSourceParams` desde `describeMessageTool(...)`. Core usa esa lista explícita para aplicar normalización de rutas de sandbox e indicios de acceso a medios salientes sin codificar nombres de parámetros que son propiedad del plugin. Prefiere allí mapas con alcance de acción, no una lista plana para todo el canal, para que un parámetro multimedia solo de perfil no se normalice en acciones no relacionadas como `send`.

Core pasa el alcance de runtime a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Eso importa para plugins sensibles al contexto. Un canal puede ocultar o exponer acciones de mensaje según la cuenta activa, la sala/hilo/mensaje actual o la identidad confiable del solicitante sin codificar ramas específicas del canal en la herramienta `message` de core.

Por eso los cambios de enrutamiento del runner integrado siguen siendo trabajo del plugin: el runner es responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del plugin para que la herramienta `message` compartida exponga la superficie correcta propiedad del canal para el turno actual.

Para los helpers de ejecución propiedad del canal, los plugins incluidos deberían mantener el runtime de ejecución dentro de sus propios módulos de plugin. Core ya no es propietario de los runtimes de acciones de mensaje de Discord, Slack, Telegram o WhatsApp bajo `src/agents/tools`. No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los plugins incluidos deberían importar su propio código de runtime local directamente desde sus módulos propiedad del plugin.

El mismo límite se aplica en general a las uniones del SDK con nombre de proveedor: core no debería importar barrels de conveniencia específicos del canal para Discord, Signal, Slack, WhatsApp o plugins similares. Si core necesita un comportamiento, debe consumir el barrel `api.ts` / `runtime-api.ts` propio del plugin incluido o promover la necesidad a una capacidad genérica estrecha en el SDK compartido.

Los plugins incluidos siguen la misma regla. El `runtime-api.ts` de un plugin incluido no debería reexportar su propia fachada marcada `openclaw/plugin-sdk/<plugin-id>`. Esas fachadas marcadas siguen siendo shims de compatibilidad para plugins externos y consumidores antiguos, pero los plugins incluidos deberían usar exportaciones locales más subrutas genéricas estrechas del SDK, como `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` u `openclaw/plugin-sdk/webhook-ingress`. El código nuevo no debería añadir fachadas de SDK específicas de id de plugin salvo que el límite de compatibilidad de un ecosistema externo existente lo requiera.

Para encuestas específicamente, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para canales que encajan en el modelo común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semánticas de encuestas específicas del canal o parámetros adicionales de encuesta

Core ahora difiere el parseo compartido de encuestas hasta después de que el despacho de encuestas del plugin rechace la acción, por lo que los manejadores de encuestas propiedad del plugin pueden aceptar campos de encuesta específicos del canal sin que el parser genérico de encuestas los bloquee primero.

Consulta [Internos de la arquitectura de Plugin](/es/plugins/architecture-internals) para ver la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata un plugin nativo como el límite de propiedad para una **empresa** o una **función**, no como una colección de integraciones no relacionadas.

Eso significa:

- un plugin de empresa normalmente debería ser propietario de todas las superficies de esa empresa orientadas a OpenClaw
- un plugin de función normalmente debería ser propietario de toda la superficie de la función que introduce
- los canales deberían consumir capacidades compartidas de core en lugar de reimplementar comportamiento de proveedor ad hoc

<AccordionGroup>
  <Accordion title="Multiples capacidades de proveedor">
    `google` es propietario de inferencia de texto, backend de CLI, embeddings, voz, voz en tiempo real, comprensión de medios, generación de imagen/música/video y búsqueda web. `openai` es propietario de inferencia de texto, embeddings, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imagen/video. `minimax` es propietario de inferencia de texto más comprensión de medios, voz, generación de imagen/música/video y búsqueda web.
  </Accordion>
  <Accordion title="Capacidad única de proveedor">
    `arcee` y `chutes` son propietarios solo de inferencia de texto; `microsoft` es propietario solo de voz. Un plugin de proveedor puede mantenerse así de estrecho hasta que necesite cubrir más superficie de ese proveedor.
  </Accordion>
  <Accordion title="Plugin de función">
    `voice-call` es propietario del transporte de llamadas, herramientas, CLI, rutas y puenteo de media streams de Twilio, pero consume capacidades compartidas de voz, transcripción en tiempo real y voz en tiempo real en lugar de importar plugins de proveedor directamente.
  </Accordion>
</AccordionGroup>

El estado final previsto es:

- la superficie orientada a OpenClaw de un proveedor vive en un plugin aunque abarque modelos de texto, voz, imágenes y video
- otros proveedores pueden hacer lo mismo para su propia área de superficie
- a los canales no les importa qué plugin de proveedor es propietario del proveedor; consumen el contrato de capacidad compartido expuesto por core

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capacidad** = contrato de core que múltiples plugins pueden implementar o consumir

Así que si OpenClaw añade un nuevo dominio como video, la primera pregunta no es "¿qué proveedor debería codificar el manejo de video?" La primera pregunta es "¿cuál es el contrato de capacidad de video de core?" Una vez que exista ese contrato, los plugins de proveedor pueden registrarse contra él y los plugins de canal/función pueden consumirlo.

Si la capacidad aún no existe, el movimiento correcto suele ser:

<Steps>
  <Step title="Definir la capacidad">
    Define la capacidad faltante en core.
  </Step>
  <Step title="Exponer mediante el SDK">
    Exponla mediante la API/runtime del plugin de forma tipada.
  </Step>
  <Step title="Cablear consumidores">
    Cablea canales/funciones contra esa capacidad.
  </Step>
  <Step title="Implementaciones de proveedor">
    Permite que los plugins de proveedor registren implementaciones.
  </Step>
</Steps>

Esto mantiene explícita la propiedad mientras evita comportamiento de core que dependa de un único proveedor o de una ruta de código puntual específica de un plugin.

### Capas de capacidades

Usa este modelo mental al decidir dónde pertenece el código:

<Tabs>
  <Tab title="Capa de capacidades de core">
    Orquestación compartida, política, fallback, reglas de combinación de configuración, semántica de entrega y contratos tipados.
  </Tab>
  <Tab title="Capa de plugin de proveedor">
    API específicas del proveedor, auth, catálogos de modelos, síntesis de voz, generación de imágenes, backends de video, endpoints de uso.
  </Tab>
  <Tab title="Capa de plugin de canal/función">
    Integración de Discord/Slack/voice-call/etc. que consume capacidades de core y las presenta en una superficie.
  </Tab>
</Tabs>

Por ejemplo, TTS sigue esta forma:

- core es propietario de la política de TTS en tiempo de respuesta, el orden de fallback, las preferencias y la entrega por canal
- `elevenlabs`, `google`, `microsoft` y `openai` son propietarios de implementaciones de síntesis
- `voice-call` consume el helper de runtime de TTS de telefonía

Ese mismo patrón debería preferirse para capacidades futuras.

### Ejemplo de plugin de empresa con múltiples capacidades

Un plugin de empresa debería sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de video, web fetch y búsqueda web, un proveedor puede ser propietario de todas sus superficies en un solo lugar:

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

Lo que importa no son los nombres exactos de los helpers. Importa la forma:

- un plugin es propietario de la superficie del proveedor
- core sigue siendo propietario de los contratos de capacidad
- los canales y plugins de función consumen helpers `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden afirmar que el plugin registró las capacidades que declara poseer

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imagen/audio/video como una única capacidad compartida. Allí se aplica el mismo modelo de propiedad:

<Steps>
  <Step title="Core define el contrato">
    Core define el contrato de comprensión de medios.
  </Step>
  <Step title="Los plugins de proveedor se registran">
    Los plugins de proveedor registran `describeImage`, `transcribeAudio` y `describeVideo` según corresponda.
  </Step>
  <Step title="Los consumidores usan el comportamiento compartido">
    Los canales y plugins de función consumen el comportamiento compartido de core en lugar de cablearse directamente al código del proveedor.
  </Step>
</Steps>

Eso evita incrustar en core las suposiciones de video de un proveedor. El plugin es propietario de la superficie del proveedor; core es propietario del contrato de capacidad y del comportamiento de fallback.

La generación de video ya usa esa misma secuencia: core es propietario del contrato de capacidad tipado y del helper de runtime, y los plugins de proveedor registran implementaciones `api.registerVideoGenerationProvider(...)` contra él.

¿Necesitas una checklist de despliegue concreta? Consulta [Recetario de capacidades](/es/plugins/adding-capabilities).

## Contratos y aplicación

La superficie de la API del plugin está tipada y centralizada intencionalmente en `OpenClawPluginApi`. Ese contrato define los puntos de registro admitidos y los helpers de runtime en los que puede apoyarse un plugin.

Por qué esto importa:

- los autores de plugins obtienen un estándar interno estable
- core puede rechazar propiedad duplicada, como dos plugins que registran el mismo id de proveedor
- el inicio puede mostrar diagnósticos accionables para registros malformados
- las pruebas de contrato pueden aplicar la propiedad de plugins incluidos y evitar desviaciones silenciosas

Hay dos capas de aplicación:

<AccordionGroup>
  <Accordion title="Aplicación del registro en runtime">
    El registro de plugins valida los registros a medida que se cargan los plugins. Ejemplos: ids de proveedor duplicados, ids de proveedor de voz duplicados y registros malformados producen diagnósticos de plugin en lugar de comportamiento indefinido.
  </Accordion>
  <Accordion title="Pruebas de contrato">
    Los plugins incluidos se capturan en registros de contrato durante las ejecuciones de pruebas para que OpenClaw pueda afirmar la propiedad de forma explícita. Hoy esto se usa para proveedores de modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registro incluida.
  </Accordion>
</AccordionGroup>

El efecto práctico es que OpenClaw sabe, desde el principio, qué plugin posee qué superficie. Eso permite que core y los canales se compongan sin fricción porque la propiedad está declarada, tipada y es comprobable en lugar de implícita.

### Qué pertenece a un contrato

<Tabs>
  <Tab title="Buenos contratos">
    - tipados
    - pequeños
    - específicos de una capacidad
    - propiedad de core
    - reutilizables por múltiples plugins
    - consumibles por canales/funcionalidades sin conocimiento del proveedor

  </Tab>
  <Tab title="Malos contratos">
    - política específica del proveedor oculta en core
    - vías de escape puntuales de plugins que omiten el registro
    - código de canal que accede directamente a una implementación de proveedor
    - objetos de runtime ad hoc que no forman parte de `OpenClawPluginApi` ni de `api.runtime`

  </Tab>
</Tabs>

En caso de duda, eleva el nivel de abstracción: define primero la capacidad y luego deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en proceso** con el Gateway. No están aislados en sandbox. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que el código de core.

<Warning>
Implicaciones de los plugins nativos: un plugin puede registrar herramientas, manejadores de red, hooks y servicios; un bug de plugin puede bloquear o desestabilizar el gateway; y un plugin nativo malicioso equivale a ejecución arbitraria de código dentro del proceso de OpenClaw.
</Warning>

Los bundles compatibles son más seguros por defecto porque OpenClaw actualmente los trata como paquetes de metadatos/contenido. En las versiones actuales, eso significa principalmente Skills incluidas.

Usa listas de permitidos y rutas explícitas de instalación/carga para plugins no incluidos. Trata los plugins de workspace como código de tiempo de desarrollo, no como valores predeterminados de producción.

Para nombres de paquetes de workspace incluidos, mantén el id del plugin anclado en el nombre npm: `@openclaw/<id>` por defecto, o un sufijo tipado aprobado como `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando el paquete expone intencionalmente un rol de plugin más estrecho.

<Note>
**Nota de confianza:** `plugins.allow` confía en **ids de plugin**, no en la procedencia del código fuente. Un plugin de workspace con el mismo id que un plugin incluido oculta intencionalmente la copia incluida cuando ese plugin de workspace está habilitado/en la lista de permitidos. Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes. La confianza en plugins incluidos se resuelve a partir de la instantánea de código fuente — el manifiesto y el código en disco en el momento de carga — en lugar de a partir de metadatos de instalación. Un registro de instalación dañado o sustituido no puede ampliar silenciosamente la superficie de confianza de un plugin incluido más allá de lo que declara el código fuente real.
</Note>

## Límite de exportación

OpenClaw exporta capacidades, no conveniencia de implementación.

Mantén público el registro de capacidades. Recorta las exportaciones de helpers que no forman parte del contrato:

- subrutas de helpers específicas de plugins incluidos
- subrutas de plomería de runtime no previstas como API pública
- helpers de conveniencia específicos de proveedores
- helpers de configuración/onboarding que son detalles de implementación

Las subrutas de helpers reservadas para plugins incluidos se han retirado del mapa de exportación generado del SDK. Mantén los helpers específicos del propietario dentro del paquete del plugin propietario; promociona solo el comportamiento reutilizable del host a contratos genéricos del SDK como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` y `plugin-sdk/plugin-config-runtime`.

## Internos y referencia

Para la canalización de carga, el modelo de registro, los hooks de runtime de proveedores, las rutas HTTP de Gateway, los esquemas de herramientas de mensaje, la resolución de destinos de canal, los catálogos de proveedores, los plugins del motor de contexto y la guía para añadir una nueva capacidad, consulta [Internos de la arquitectura de plugins](/es/plugins/architecture-internals).

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [Manifiesto de plugin](/es/plugins/manifest)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
