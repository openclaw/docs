---
read_when:
    - Creación o depuración de plugins nativos de OpenClaw
    - Comprender el modelo de capacidades del Plugin o los límites de propiedad
    - Trabajar en el flujo de carga o el registro del Plugin
    - Implementar hooks de tiempo de ejecución del proveedor o plugins de canal
sidebarTitle: Internals
summary: 'Internos del Plugin: modelo de capacidades, propiedad, contratos, flujo de carga y ayudantes de tiempo de ejecución'
title: Internos del Plugin
x-i18n:
    generated_at: "2026-04-24T08:59:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

Esta es la **referencia de arquitectura profunda** del sistema de plugins de OpenClaw. Para guías prácticas, empieza con una de las páginas especializadas a continuación.

<CardGroup cols={2}>
  <Card title="Instalar y usar plugins" icon="plug" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo añadir, habilitar y solucionar problemas de plugins.
  </Card>
  <Card title="Crear plugins" icon="rocket" href="/es/plugins/building-plugins">
    Tutorial del primer plugin con el manifiesto funcional más pequeño.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/es/plugins/sdk-channel-plugins">
    Crea un Plugin de canal de mensajería.
  </Card>
  <Card title="Plugins de proveedor" icon="microchip" href="/es/plugins/sdk-provider-plugins">
    Crea un Plugin de proveedor de modelos.
  </Card>
  <Card title="Resumen del SDK" icon="book" href="/es/plugins/sdk-overview">
    Referencia del mapa de importación y la API de registro.
  </Card>
</CardGroup>

## Modelo de capacidades públicas

Las capacidades son el modelo público de **plugin nativo** dentro de OpenClaw. Todo plugin nativo de OpenClaw se registra en uno o más tipos de capacidad:

| Capacidad               | Método de registro                               | Plugins de ejemplo                     |
| ----------------------- | ------------------------------------------------ | -------------------------------------- |
| Inferencia de texto     | `api.registerProvider(...)`                      | `openai`, `anthropic`                  |
| Backend de inferencia de CLI | `api.registerCliBackend(...)`               | `openai`, `anthropic`                  |
| Voz                     | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`              |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Voz en tiempo real      | `api.registerRealtimeVoiceProvider(...)`         | `openai`                               |
| Comprensión de medios   | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                     |
| Generación de imágenes  | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax`   |
| Generación de música    | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                    |
| Generación de video     | `api.registerVideoGenerationProvider(...)`       | `qwen`                                 |
| Obtención web           | `api.registerWebFetchProvider(...)`              | `firecrawl`                            |
| Búsqueda web            | `api.registerWebSearchProvider(...)`             | `google`                               |
| Canal / mensajería      | `api.registerChannel(...)`                       | `msteams`, `matrix`                    |
| Descubrimiento de Gateway | `api.registerGatewayDiscoveryService(...)`     | `bonjour`                              |

Un plugin que registra cero capacidades pero proporciona hooks, herramientas, servicios de descubrimiento o servicios en segundo plano es un plugin **legacy solo de hooks**. Ese patrón sigue siendo totalmente compatible.

### Postura de compatibilidad externa

El modelo de capacidades ya está integrado en el núcleo y se usa hoy en plugins nativos/incluidos, pero la compatibilidad con plugins externos todavía necesita un criterio más estricto que “está exportado, por lo tanto está congelado”.

| Situación del plugin                            | Guía                                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                     | Mantén funcionando las integraciones basadas en hooks; esta es la base de compatibilidad.        |
| Nuevos plugins nativos/incluidos                | Prefiere el registro explícito de capacidades en lugar de accesos específicos de proveedor o nuevos diseños solo con hooks. |
| Plugins externos que adoptan el registro de capacidades | Permitido, pero trata las superficies auxiliares específicas de capacidad como evolutivas, salvo que la documentación las marque como estables. |

El registro de capacidades es la dirección prevista. Los hooks heredados siguen siendo la ruta más segura sin rupturas para plugins externos durante la transición. No todas las subrutas auxiliares exportadas son iguales: prefiere contratos estrechos y documentados frente a exportaciones auxiliares incidentales.

### Formas de plugin

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real de registro (no solo por metadatos estáticos):

- **plain-capability**: registra exactamente un tipo de capacidad (por ejemplo, un plugin solo de proveedor como `mistral`).
- **hybrid-capability**: registra varios tipos de capacidad (por ejemplo, `openai` controla la inferencia de texto, voz, comprensión de medios y generación de imágenes).
- **hook-only**: registra solo hooks (tipados o personalizados), sin capacidades, herramientas, comandos ni servicios.
- **non-capability**: registra herramientas, comandos, servicios o rutas, pero no capacidades.

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin y el desglose de capacidades. Consulta la [referencia de CLI](/es/cli/plugins#inspect) para más detalles.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como ruta de compatibilidad para plugins solo con hooks. Plugins heredados del mundo real siguen dependiendo de él.

Dirección:

- mantenerlo funcionando
- documentarlo como heredado
- preferir `before_model_resolve` para trabajo de anulación de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación de prompts
- eliminarlo solo cuando el uso real disminuya y la cobertura con fixtures demuestre que la migración es segura

### Señales de compatibilidad

Cuando ejecutas `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver una de estas etiquetas:

| Señal                     | Significado                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configuración se analiza correctamente y los plugins se resuelven |
| **compatibility advisory** | El plugin usa un patrón compatible pero más antiguo (p. ej. `hook-only`) |
| **legacy warning**        | El plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**            | La configuración no es válida o el plugin no se pudo cargar  |

Ni `hook-only` ni `before_agent_start` romperán tu plugin hoy: `hook-only` es un aviso, y `before_agent_start` solo genera una advertencia. Estas señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Resumen de la arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

1. **Manifiesto + descubrimiento**
   OpenClaw encuentra plugins candidatos a partir de rutas configuradas, raíces de workspace, raíces globales de plugins y plugins incluidos. El descubrimiento lee primero los manifiestos nativos `openclaw.plugin.json` y los manifiestos de bundles compatibles.
2. **Habilitación + validación**
   El núcleo decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o seleccionado para una ranura exclusiva, como memoria.
3. **Carga en tiempo de ejecución**
   Los plugins nativos de OpenClaw se cargan en proceso mediante jiti y registran capacidades en un registro central. Los bundles compatibles se normalizan en registros del registro sin importar código de tiempo de ejecución.
4. **Consumo de superficie**
   El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración de proveedores, hooks, rutas HTTP, comandos de CLI y servicios.

En el caso específico del CLI de plugins, el descubrimiento del comando raíz se divide en dos fases:

- los metadatos en tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo real de CLI del plugin puede seguir siendo lazy y registrarse en la primera invocación

Eso mantiene el código de CLI controlado por el plugin dentro del plugin, al tiempo que permite a OpenClaw reservar nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- el descubrimiento y la validación de configuración deben funcionar a partir de metadatos de **manifiesto/esquema** sin ejecutar código del plugin
- el comportamiento nativo en tiempo de ejecución proviene de la ruta `register(api)` del módulo del plugin

Esta separación permite a OpenClaw validar la configuración, explicar plugins faltantes/deshabilitados y construir pistas de UI/esquema antes de que el tiempo de ejecución completo esté activo.

### Planificación de activación

La planificación de activación forma parte del plano de control. Los llamadores pueden preguntar qué plugins son relevantes para un comando, proveedor, canal, ruta, arnés de agente o capacidad concretos antes de cargar registros más amplios del tiempo de ejecución.

El planificador mantiene el comportamiento actual del manifiesto compatible:

- los campos `activation.*` son pistas explícitas para el planificador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y los hooks siguen siendo fallback de propiedad del manifiesto
- la API del planificador solo de ids sigue disponible para los llamadores existentes
- la API de plan informa etiquetas de motivo para que los diagnósticos puedan distinguir entre pistas explícitas y fallback de propiedad

No trates `activation` como un hook del ciclo de vida ni como sustituto de `register(...)`. Es metadato usado para acotar la carga. Prefiere los campos de propiedad cuando ya describen la relación; usa `activation` solo para pistas adicionales del planificador.

### Plugins de canal y la herramienta compartida de mensajes

Los plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para acciones normales de chat. OpenClaw mantiene una única herramienta compartida `message` en el núcleo, y los plugins de canal controlan el descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el núcleo controla el host de la herramienta compartida `message`, el cableado de prompts, la contabilidad de sesión/hilo y el despacho de ejecución
- los plugins de canal controlan el descubrimiento de acciones con ámbito, el descubrimiento de capacidades y cualquier fragmento de esquema específico del canal
- los plugins de canal controlan la gramática de conversación de sesión específica del proveedor, como la forma en que los ids de conversación codifican ids de hilo o heredan de conversaciones padre
- los plugins de canal ejecutan la acción final mediante su adaptador de acciones

Para plugins de canal, la superficie del SDK es `ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada unificada de descubrimiento permite que un plugin devuelva sus acciones visibles, capacidades y contribuciones de esquema juntas para que esas piezas no diverjan.

Cuando un parámetro de la herramienta de mensajes específico del canal transporta una fuente de medios, como una ruta local o una URL de medios remota, el plugin también debe devolver `mediaSourceParams` desde `describeMessageTool(...)`. El núcleo usa esa lista explícita para aplicar la normalización de rutas del sandbox y pistas de acceso a medios salientes sin codificar de forma rígida nombres de parámetros controlados por el plugin.
Prefiere mapas con ámbito por acción ahí, no una única lista plana para todo el canal, de modo que un parámetro de medios solo de perfil no se normalice en acciones no relacionadas como `send`.

El núcleo pasa el ámbito de tiempo de ejecución a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Esto es importante para los plugins sensibles al contexto. Un canal puede ocultar o exponer acciones de mensajes según la cuenta activa, la sala/hilo/mensaje actual o la identidad confiable del solicitante, sin codificar ramas específicas del canal en la herramienta central `message`.

Por eso los cambios de enrutamiento del ejecutor embebido siguen siendo trabajo del plugin: el ejecutor es responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del plugin para que la herramienta compartida `message` exponga la superficie correcta controlada por el canal para el turno actual.

Para los ayudantes de ejecución controlados por canal, los plugins incluidos deben mantener el tiempo de ejecución de ejecución dentro de sus propios módulos de extensión. El núcleo ya no controla los tiempos de ejecución de acciones de mensajes de Discord, Slack, Telegram o WhatsApp en `src/agents/tools`.
No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los plugins incluidos deben importar directamente su propio código local de tiempo de ejecución desde sus módulos controlados por la extensión.

El mismo límite se aplica a las costuras del SDK nombradas por proveedor en general: el núcleo no debe importar barrels de conveniencia específicos de canal para Slack, Discord, Signal, WhatsApp u otras extensiones similares. Si el núcleo necesita un comportamiento, debe consumir el propio barrel `api.ts` / `runtime-api.ts` del plugin incluido o promover la necesidad a una capacidad genérica y estrecha en el SDK compartido.

En el caso específico de las encuestas, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para canales que encajan en el modelo común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semánticas de encuesta específicas del canal o parámetros de encuesta adicionales

Ahora el núcleo aplaza el análisis compartido de encuestas hasta después de que el despacho de encuestas del plugin rechace la acción, de modo que los controladores de encuestas controlados por el plugin puedan aceptar campos de encuesta específicos del canal sin quedar bloqueados primero por el analizador genérico de encuestas.

Consulta [Internos de la arquitectura de plugins](/es/plugins/architecture-internals) para ver la secuencia completa de arranque.

## Modelo de propiedad de capacidades

OpenClaw trata un plugin nativo como el límite de propiedad de una **empresa** o una **funcionalidad**, no como una bolsa de integraciones no relacionadas.

Eso significa que:

- un plugin de empresa normalmente debería controlar todas las superficies de OpenClaw de esa empresa
- un plugin de funcionalidad normalmente debería controlar toda la superficie de la funcionalidad que introduce
- los canales deberían consumir capacidades compartidas del núcleo en lugar de reimplementar el comportamiento del proveedor de forma ad hoc

<Accordion title="Ejemplos de patrones de propiedad en los plugins incluidos">
  - **Proveedor con múltiples capacidades**: `openai` controla inferencia de texto, voz, voz en tiempo real, comprensión de medios y generación de imágenes. `google` controla inferencia de texto además de comprensión de medios, generación de imágenes y búsqueda web. `qwen` controla inferencia de texto además de comprensión de medios y generación de video.
  - **Proveedor con una sola capacidad**: `elevenlabs` y `microsoft` controlan voz; `firecrawl` controla obtención web; `minimax` / `mistral` / `moonshot` / `zai` controlan backends de comprensión de medios.
  - **Plugin de funcionalidad**: `voice-call` controla transporte de llamadas, herramientas, CLI, rutas y el puente de flujo de medios de Twilio, pero consume capacidades compartidas de voz, transcripción en tiempo real y voz en tiempo real en lugar de importar directamente plugins de proveedor.
</Accordion>

El estado final previsto es:

- OpenAI vive en un solo plugin aunque abarque modelos de texto, voz, imágenes y futuro video
- otro proveedor puede hacer lo mismo para su propia área de superficie
- los canales no se preocupan por qué plugin de proveedor controla el proveedor; consumen el contrato de capacidad compartido que expone el núcleo

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capacidad** = contrato del núcleo que varios plugins pueden implementar o consumir

Así que, si OpenClaw añade un nuevo dominio como video, la primera pregunta no es “¿qué proveedor debería codificar rígidamente el manejo de video?”. La primera pregunta es “¿cuál es el contrato de capacidad central para video?”. Una vez que ese contrato existe, los plugins de proveedor pueden registrarse contra él y los plugins de canal/funcionalidad pueden consumirlo.

Si la capacidad todavía no existe, el movimiento correcto suele ser:

1. definir la capacidad faltante en el núcleo
2. exponerla a través de la API/tiempo de ejecución del plugin de forma tipada
3. conectar canales/funcionalidades contra esa capacidad
4. dejar que los plugins de proveedor registren implementaciones

Esto mantiene explícita la propiedad y evita al mismo tiempo un comportamiento del núcleo que dependa de un único proveedor o de una ruta de código específica de un solo plugin.

### Capas de capacidad

Usa este modelo mental al decidir dónde debe ir el código:

- **capa de capacidades del núcleo**: orquestación compartida, política, fallback, reglas de combinación de configuración, semántica de entrega y contratos tipados
- **capa de plugins de proveedor**: APIs específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz, generación de imágenes, futuros backends de video, endpoints de uso
- **capa de plugins de canal/funcionalidad**: integración de Slack/Discord/voice-call/etc. que consume capacidades del núcleo y las presenta en una superficie

Por ejemplo, TTS sigue esta forma:

- el núcleo controla la política de TTS en tiempo de respuesta, el orden de fallback, las preferencias y la entrega al canal
- `openai`, `elevenlabs` y `microsoft` controlan las implementaciones de síntesis
- `voice-call` consume el ayudante de tiempo de ejecución de TTS para telefonía

Ese mismo patrón debería preferirse para capacidades futuras.

### Ejemplo de plugin de empresa con múltiples capacidades

Un plugin de empresa debería sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de video, obtención web y búsqueda web, un proveedor puede controlar todas sus superficies en un solo lugar:

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
      // hooks de auth/catálogo de modelos/tiempo de ejecución
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
        // lógica de credenciales + fetch
      }),
    );
  },
};

export default plugin;
```

Lo importante no son los nombres exactos de los ayudantes. Lo importante es la forma:

- un plugin controla la superficie del proveedor
- el núcleo sigue controlando los contratos de capacidad
- los canales y plugins de funcionalidad consumen ayudantes `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden verificar que el plugin registró las capacidades que afirma controlar

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imagen/audio/video como una sola capacidad compartida. El mismo modelo de propiedad se aplica ahí:

1. el núcleo define el contrato de comprensión de medios
2. los plugins de proveedor registran `describeImage`, `transcribeAudio` y `describeVideo` según corresponda
3. los canales y plugins de funcionalidad consumen el comportamiento compartido del núcleo en lugar de conectarse directamente al código del proveedor

Eso evita incrustar en el núcleo las suposiciones de video de un proveedor. El plugin controla la superficie del proveedor; el núcleo controla el contrato de capacidad y el comportamiento de fallback.

La generación de video ya usa esa misma secuencia: el núcleo controla el contrato de capacidad tipado y el ayudante de tiempo de ejecución, y los plugins de proveedor registran implementaciones `api.registerVideoGenerationProvider(...)` contra él.

¿Necesitas una lista de verificación concreta de despliegue? Consulta [Recetario de capacidades](/es/plugins/architecture).

## Contratos y aplicación

La superficie de la API de plugins es intencionalmente tipada y centralizada en `OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y los ayudantes de tiempo de ejecución en los que un plugin puede apoyarse.

Por qué importa esto:

- los autores de plugins obtienen un único estándar interno estable
- el núcleo puede rechazar propiedad duplicada, como dos plugins que registran el mismo id de proveedor
- el arranque puede mostrar diagnósticos accionables para registros mal formados
- las pruebas de contrato pueden aplicar la propiedad de plugins incluidos y evitar desviaciones silenciosas

Hay dos capas de aplicación:

1. **aplicación del registro en tiempo de ejecución**
   El registro de plugins valida los registros a medida que se cargan los plugins. Ejemplos: ids de proveedor duplicados, ids de proveedor de voz duplicados y registros mal formados producen diagnósticos de plugin en lugar de comportamiento indefinido.
2. **pruebas de contrato**
   Los plugins incluidos se capturan en registros de contrato durante las ejecuciones de prueba para que OpenClaw pueda verificar la propiedad de forma explícita. Hoy esto se usa para proveedores de modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registro de plugins incluidos.

El efecto práctico es que OpenClaw sabe, de antemano, qué plugin controla qué superficie. Eso permite que el núcleo y los canales se compongan sin fricción porque la propiedad está declarada, tipada y es comprobable, en lugar de implícita.

### Qué debe pertenecer a un contrato

Los buenos contratos de plugin son:

- tipados
- pequeños
- específicos de la capacidad
- controlados por el núcleo
- reutilizables por varios plugins
- consumibles por canales/funcionalidades sin conocimiento del proveedor

Los malos contratos de plugin son:

- política específica del proveedor oculta en el núcleo
- vías de escape puntuales de plugins que eluden el registro
- código de canal que accede directamente a una implementación de proveedor
- objetos de tiempo de ejecución ad hoc que no forman parte de `OpenClawPluginApi` ni de `api.runtime`

En caso de duda, eleva el nivel de abstracción: primero define la capacidad y luego deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en proceso** con el Gateway. No están aislados. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que el código del núcleo.

Implicaciones:

- un plugin nativo puede registrar herramientas, controladores de red, hooks y servicios
- un error en un plugin nativo puede bloquear o desestabilizar el gateway
- un plugin nativo malicioso equivale a ejecución arbitraria de código dentro del proceso de OpenClaw

Los bundles compatibles son más seguros por defecto porque OpenClaw actualmente los trata como paquetes de metadatos/contenido. En las versiones actuales, eso significa principalmente Skills incluidos.

Usa listas de permitidos y rutas explícitas de instalación/carga para plugins no incluidos. Trata los plugins de workspace como código de tiempo de desarrollo, no como valores predeterminados de producción.

Para nombres de paquetes de workspace incluidos, mantén el id del plugin anclado al nombre npm: `@openclaw/<id>` por defecto, o un sufijo tipado aprobado como `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando el paquete expone intencionalmente un rol de plugin más estrecho.

Nota importante sobre confianza:

- `plugins.allow` confía en **ids de plugin**, no en la procedencia del origen.
- Un plugin de workspace con el mismo id que un plugin incluido oculta intencionalmente la copia incluida cuando ese plugin de workspace está habilitado/en la lista de permitidos.
- Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes.
- La confianza en plugins incluidos se resuelve a partir de la instantánea del origen —el manifiesto y el código en disco en el momento de la carga— en lugar de a partir de metadatos de instalación. Un registro de instalación dañado o sustituido no puede ampliar silenciosamente la superficie de confianza de un plugin incluido más allá de lo que el origen real declara.

## Límite de exportación

OpenClaw exporta capacidades, no conveniencias de implementación.

Mantén público el registro de capacidades. Reduce las exportaciones auxiliares que no sean contratos:

- subrutas auxiliares específicas de plugins incluidos
- subrutas de infraestructura de tiempo de ejecución no pensadas como API pública
- ayudantes de conveniencia específicos de proveedor
- ayudantes de configuración/incorporación que son detalles de implementación

Algunas subrutas auxiliares de plugins incluidos siguen presentes en el mapa de exportación generado del SDK por compatibilidad y mantenimiento de plugins incluidos. Ejemplos actuales incluyen `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` y varias costuras `plugin-sdk/matrix*`. Trátalas como exportaciones reservadas de detalle de implementación, no como el patrón recomendado del SDK para nuevos plugins de terceros.

## Internos y referencia

Para el flujo de carga, el modelo de registro, los hooks de tiempo de ejecución del proveedor, las rutas HTTP del Gateway, los esquemas de la herramienta de mensajes, la resolución de objetivos de canal, los catálogos de proveedores, los plugins del motor de contexto y la guía para añadir una nueva capacidad, consulta [Internos de la arquitectura de plugins](/es/plugins/architecture-internals).

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Manifiesto del Plugin](/es/plugins/manifest)
