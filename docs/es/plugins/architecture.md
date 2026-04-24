---
read_when:
    - Construir o depurar Plugins nativos de OpenClaw
    - Entender el modelo de capacidades de Plugins o los límites de propiedad
    - Trabajar en la canalización de carga o en el registro de Plugins
    - Implementar Hooks de runtime de proveedor o Plugins de canal
sidebarTitle: Internals
summary: 'Aspectos internos de Plugins: modelo de capacidades, propiedad, contratos, canalización de carga y ayudantes de runtime'
title: Aspectos internos de Plugins
x-i18n:
    generated_at: "2026-04-24T05:39:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 344c02f9f0bb19780d262929e665fcaf8093ac08cda30b61af56857368b0b07a
    source_path: plugins/architecture.md
    workflow: 15
---

Esta es la **referencia profunda de arquitectura** del sistema de Plugins de OpenClaw. Para
guías prácticas, empieza por una de las páginas específicas que aparecen abajo.

<CardGroup cols={2}>
  <Card title="Instalar y usar Plugins" icon="plug" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo agregar, habilitar y solucionar problemas de Plugins.
  </Card>
  <Card title="Crear Plugins" icon="rocket" href="/es/plugins/building-plugins">
    Tutorial de primer Plugin con el manifiesto funcional más pequeño.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/es/plugins/sdk-channel-plugins">
    Construye un Plugin de canal de mensajería.
  </Card>
  <Card title="Plugins de proveedor" icon="microchip" href="/es/plugins/sdk-provider-plugins">
    Construye un Plugin de proveedor de modelos.
  </Card>
  <Card title="Resumen del SDK" icon="book" href="/es/plugins/sdk-overview">
    Referencia del mapa de importación y de la API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Las capacidades son el modelo público de **Plugins nativos** dentro de OpenClaw. Cada
Plugin nativo de OpenClaw se registra contra uno o más tipos de capacidades:

| Capacidad             | Método de registro                              | Plugins de ejemplo                    |
| --------------------- | ----------------------------------------------- | ------------------------------------- |
| Inferencia de texto   | `api.registerProvider(...)`                     | `openai`, `anthropic`                 |
| Backend CLI de inferencia | `api.registerCliBackend(...)`                | `openai`, `anthropic`                 |
| Voz                   | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`             |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Voz en tiempo real    | `api.registerRealtimeVoiceProvider(...)`        | `openai`                              |
| Comprensión de medios | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                    |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax`  |
| Generación de música  | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                   |
| Generación de video   | `api.registerVideoGenerationProvider(...)`      | `qwen`                                |
| Web fetch             | `api.registerWebFetchProvider(...)`             | `firecrawl`                           |
| Búsqueda web          | `api.registerWebSearchProvider(...)`            | `google`                              |
| Canal / mensajería    | `api.registerChannel(...)`                      | `msteams`, `matrix`                   |

Un Plugin que registra cero capacidades pero proporciona Hooks, herramientas o
servicios es un Plugin **hook-only heredado**. Ese patrón sigue siendo totalmente compatible.

### Postura de compatibilidad externa

El modelo de capacidades ya está implementado en el núcleo y hoy lo usan los Plugins nativos/incluidos,
pero la compatibilidad para Plugins externos sigue necesitando un criterio más estricto que «está exportado, por tanto está congelado».

| Situación del Plugin                             | Guía                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                      | Mantén funcionando las integraciones basadas en Hooks; esta es la línea base de compatibilidad. |
| Plugins nuevos incluidos/nativos                 | Prefiere el registro explícito de capacidades frente a accesos específicos de proveedor o nuevos diseños solo con Hooks. |
| Plugins externos que adoptan registro de capacidades | Permitido, pero trata las superficies de ayuda específicas de capacidad como evolutivas salvo que la documentación las marque como estables. |

El registro de capacidades es la dirección prevista. Los Hooks heredados siguen siendo
la vía más segura sin rupturas para Plugins externos durante la transición. No todas las subrutas de ayuda exportadas son iguales: prefiere contratos documentados y estrechos frente a exportaciones auxiliares incidentales.

### Formas de Plugins

OpenClaw clasifica cada Plugin cargado en una forma según su comportamiento real
de registro (no solo por metadatos estáticos):

- **plain-capability**: registra exactamente un tipo de capacidad (por ejemplo, un
  Plugin solo de proveedor como `mistral`).
- **hybrid-capability**: registra varios tipos de capacidades (por ejemplo
  `openai` controla inferencia de texto, voz, comprensión de medios y
  generación de imágenes).
- **hook-only**: registra solo Hooks (tipados o personalizados), sin
  capacidades, herramientas, comandos ni servicios.
- **non-capability**: registra herramientas, comandos, servicios o rutas pero no
  capacidades.

Usa `openclaw plugins inspect <id>` para ver la forma de un Plugin y el desglose
de capacidades. Consulta [Referencia de CLI](/es/cli/plugins#inspect) para más detalles.

### Hooks heredados

El Hook `before_agent_start` sigue siendo compatible como vía de compatibilidad para
Plugins hook-only. Plugins heredados reales siguen dependiendo de él.

Dirección:

- mantenerlo funcionando
- documentarlo como heredado
- preferir `before_model_resolve` para trabajo de sobrescritura de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación de prompts
- eliminarlo solo después de que el uso real baje y la cobertura de fixtures demuestre seguridad en la migración

### Señales de compatibilidad

Cuando ejecutes `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver
una de estas etiquetas:

| Señal                     | Significado                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configuración se analiza bien y los Plugins se resuelven  |
| **compatibility advisory** | El Plugin usa un patrón compatible pero más antiguo (por ejemplo `hook-only`) |
| **legacy warning**        | El Plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**            | La configuración no es válida o el Plugin no se pudo cargar  |

Ni `hook-only` ni `before_agent_start` romperán tu Plugin hoy:
`hook-only` es solo informativo, y `before_agent_start` solo genera una advertencia. Estas
señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Resumen de la arquitectura

El sistema de Plugins de OpenClaw tiene cuatro capas:

1. **Manifiesto + descubrimiento**
   OpenClaw encuentra Plugins candidatos desde rutas configuradas, raíces del espacio de trabajo,
   raíces globales de Plugins y Plugins incluidos. El descubrimiento lee primero los
   manifiestos nativos `openclaw.plugin.json` más los manifiestos de paquetes compatibles.
2. **Habilitación + validación**
   El núcleo decide si un Plugin descubierto está habilitado, deshabilitado, bloqueado o
   seleccionado para un slot exclusivo como memoria.
3. **Carga en runtime**
   Los Plugins nativos de OpenClaw se cargan en proceso mediante jiti y registran
   capacidades en un registro central. Los paquetes compatibles se normalizan en
   registros del registro sin importar código de runtime.
4. **Consumo de superficies**
   El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración
   de proveedores, Hooks, rutas HTTP, comandos CLI y servicios.

En el caso concreto de la CLI de Plugins, el descubrimiento del comando raíz se divide en dos fases:

- los metadatos de tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo CLI real del Plugin puede permanecer en carga diferida y registrarse en la primera invocación

Eso mantiene el código CLI controlado por el Plugin dentro del propio Plugin y, al mismo tiempo, permite a OpenClaw reservar nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- el descubrimiento + la validación de configuración deberían funcionar a partir de **metadatos de manifiesto/esquema**
  sin ejecutar código del Plugin
- el comportamiento nativo en runtime proviene de la ruta `register(api)` del módulo del Plugin

Esa división permite a OpenClaw validar configuración, explicar Plugins faltantes/deshabilitados y
construir sugerencias de UI/esquema antes de que el runtime completo esté activo.

### Planificación de activación

La planificación de activación forma parte del plano de control. Los llamadores pueden preguntar qué Plugins son relevantes para un comando, proveedor, canal, ruta, arnés de agente o capacidad concretos antes de cargar registros más amplios del runtime.

El planificador mantiene compatible el comportamiento actual del manifiesto:

- los campos `activation.*` son sugerencias explícitas del planificador
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` y Hooks siguen siendo el fallback de propiedad del manifiesto
- la API del planificador solo de ids sigue disponible para llamadores existentes
- la API del plan informa etiquetas de razón para que los diagnósticos puedan distinguir sugerencias explícitas de fallback de propiedad

No trates `activation` como un Hook de ciclo de vida ni como un sustituto de
`register(...)`. Son metadatos usados para acotar la carga. Prefiere campos de propiedad
cuando ya describen la relación; usa `activation` solo para sugerencias adicionales del planificador.

### Plugins de canal y la herramienta compartida de mensajes

Los Plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para acciones normales de chat. OpenClaw mantiene una única herramienta compartida `message` en el núcleo, y los Plugins de canal controlan el descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el núcleo controla el host compartido de la herramienta `message`, el cableado del prompt, la gestión de sesiones/hilos y el despacho de ejecución
- los Plugins de canal controlan el descubrimiento de acciones acotadas, el descubrimiento de capacidades y cualquier fragmento de esquema específico del canal
- los Plugins de canal controlan la gramática de conversación de sesión específica del proveedor, como la forma en que los ids de conversación codifican ids de hilo o heredan de conversaciones padre
- los Plugins de canal ejecutan la acción final a través de su adaptador de acciones

Para Plugins de canal, la superficie del SDK es
`ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada unificada de descubrimiento permite que un Plugin devuelva sus acciones visibles, capacidades y contribuciones de esquema juntas, para que esas piezas no diverjan.

Cuando un parámetro de la herramienta de mensajes específico del canal transporta una fuente de medios como una ruta local o URL de medios remota, el Plugin también debería devolver
`mediaSourceParams` desde `describeMessageTool(...)`. El núcleo usa esa lista explícita para aplicar normalización de rutas del sandbox e indicaciones de acceso a medios salientes sin codificar rígidamente nombres de parámetros controlados por Plugins.
Prefiere allí mapas con alcance por acción, no una lista plana para todo el canal, de modo que un parámetro de medios solo para perfil no se normalice en acciones no relacionadas como
`send`.

El núcleo pasa el alcance de runtime a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Esto importa para Plugins sensibles al contexto. Un canal puede ocultar o exponer
acciones de mensajes según la cuenta activa, la sala/hilo/mensaje actual o la identidad
de confianza del solicitante, sin codificar ramas específicas del canal en la herramienta central `message`.

Por eso los cambios de enrutamiento del embedded runner siguen siendo trabajo del Plugin: el runner es responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del Plugin para que la herramienta compartida `message` exponga la superficie correcta controlada por el canal en el turno actual.

En cuanto a los ayudantes de ejecución controlados por el canal, los Plugins incluidos deberían mantener el runtime de ejecución dentro de sus propios módulos de extensión. El núcleo ya no controla los runtimes de acciones de mensajes de Discord, Slack, Telegram o WhatsApp bajo `src/agents/tools`.
No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los Plugins incluidos deberían importar directamente su propio código de runtime local desde sus módulos controlados por la extensión.

Ese mismo límite se aplica en general a las costuras del SDK con nombre de proveedor: el núcleo no debería importar barrels de conveniencia específicos de canales para extensiones como Slack, Discord, Signal, WhatsApp o similares. Si el núcleo necesita un comportamiento, debería consumir el propio barrel `api.ts` / `runtime-api.ts` del Plugin incluido o promover la necesidad a una capacidad genérica y estrecha en el SDK compartido.

En el caso específico de las encuestas, hay dos rutas de ejecución:

- `outbound.sendPoll` es la línea base compartida para canales que encajan en el modelo común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semánticas de encuesta específicas del canal o parámetros extra de encuesta

El núcleo ahora difiere el análisis compartido de encuestas hasta después de que el despacho de encuestas del Plugin rechace
la acción, para que los controladores de encuestas controlados por el Plugin puedan aceptar campos
de encuesta específicos del canal sin quedar bloqueados primero por el analizador genérico de encuestas.

Consulta [Aspectos internos de la arquitectura de Plugins](/es/plugins/architecture-internals) para ver la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata un Plugin nativo como el límite de propiedad de una **empresa** o una
**función**, no como un cajón de integraciones no relacionadas.

Eso significa:

- un Plugin de empresa normalmente debería controlar todas las superficies de OpenClaw
  orientadas a esa empresa
- un Plugin de función normalmente debería controlar toda la superficie de la función que introduce
- los canales deberían consumir capacidades compartidas del núcleo en lugar de reimplementar
  comportamiento de proveedor de forma ad hoc

<Accordion title="Ejemplos de patrones de propiedad en Plugins incluidos">
  - **Proveedor con múltiples capacidades**: `openai` controla inferencia de texto, voz, voz en tiempo real,
    comprensión de medios y generación de imágenes. `google` controla inferencia de texto
    además de comprensión de medios, generación de imágenes y búsqueda web.
    `qwen` controla inferencia de texto además de comprensión de medios y generación de video.
  - **Proveedor con capacidad única**: `elevenlabs` y `microsoft` controlan voz;
    `firecrawl` controla web-fetch; `minimax` / `mistral` / `moonshot` / `zai` controlan
    backends de comprensión de medios.
  - **Plugin de función**: `voice-call` controla transporte de llamadas, herramientas, CLI, rutas
    y puente de streams de medios de Twilio, pero consume capacidades compartidas de voz, transcripción en tiempo real y voz en tiempo real en lugar de importar directamente Plugins de proveedor.
</Accordion>

El estado final deseado es:

- OpenAI vive en un solo Plugin aunque abarque modelos de texto, voz, imágenes y
  video futuro
- otro proveedor puede hacer lo mismo con su propia superficie
- los canales no se preocupan por qué Plugin de proveedor controla el proveedor; consumen el contrato de capacidad compartida expuesto por el núcleo

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capability** = contrato del núcleo que varios Plugins pueden implementar o consumir

Así, si OpenClaw agrega un nuevo dominio como video, la primera pregunta no es
«¿qué proveedor debería codificar rígidamente el manejo de video?». La primera pregunta es «¿cuál es
el contrato central de capacidad de video?». Una vez que existe ese contrato, los Plugins de proveedor
pueden registrarse contra él y los Plugins de canal/función pueden consumirlo.

Si la capacidad aún no existe, el movimiento correcto suele ser:

1. definir la capacidad que falta en el núcleo
2. exponerla mediante la API/runtime de Plugins de forma tipada
3. conectar canales/funciones contra esa capacidad
4. dejar que los Plugins de proveedor registren implementaciones

Esto mantiene explícita la propiedad y evita al mismo tiempo comportamiento del núcleo que dependa de un
solo proveedor o de una ruta específica de Plugin puntual.

### Capas de capacidades

Usa este modelo mental para decidir dónde pertenece el código:

- **capa de capacidades del núcleo**: orquestación compartida, política, fallback, reglas de fusión de configuración, semántica de entrega y contratos tipados
- **capa de Plugin de proveedor**: API específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz, generación de imágenes, backends futuros de video, endpoints de uso
- **capa de Plugin de canal/función**: integración de Slack/Discord/voice-call/etc. que consume capacidades del núcleo y las presenta en una superficie

Por ejemplo, TTS sigue esta forma:

- el núcleo controla la política de TTS en tiempo de respuesta, el orden de fallback, preferencias y entrega de canal
- `openai`, `elevenlabs` y `microsoft` controlan las implementaciones de síntesis
- `voice-call` consume el ayudante de runtime TTS de telefonía

Ese mismo patrón debería preferirse para capacidades futuras.

### Ejemplo de Plugin de empresa con múltiples capacidades

Un Plugin de empresa debería sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de video, web fetch y búsqueda web, un proveedor puede controlar todas sus superficies en un solo lugar:

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

Lo importante no son los nombres exactos de los helpers. Lo que importa es la forma:

- un solo Plugin controla la superficie del proveedor
- el núcleo sigue controlando los contratos de capacidades
- los canales y Plugins de función consumen ayudantes `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden afirmar que el Plugin registró las capacidades que
  afirma controlar

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imagen/audio/video como una única
capacidad compartida. El mismo modelo de propiedad se aplica aquí:

1. el núcleo define el contrato de comprensión de medios
2. los Plugins de proveedor registran `describeImage`, `transcribeAudio` y
   `describeVideo` según corresponda
3. los Plugins de canal y de función consumen el comportamiento compartido del núcleo en lugar de
   conectarse directamente al código del proveedor

Eso evita incorporar suposiciones de video de un solo proveedor en el núcleo. El Plugin controla
la superficie del proveedor; el núcleo controla el contrato de capacidad y el comportamiento de fallback.

La generación de video ya usa esa misma secuencia: el núcleo controla el contrato tipado
de capacidad y el helper de runtime, y los Plugins de proveedor registran
implementaciones `api.registerVideoGenerationProvider(...)` contra él.

¿Necesitas una lista concreta de pasos de despliegue? Consulta
[Capability Cookbook](/es/plugins/architecture).

## Contratos e imposición

La superficie de la API de Plugins está intencionalmente tipada y centralizada en
`OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y
los helpers de runtime en los que un Plugin puede confiar.

Por qué importa esto:

- los autores de Plugins obtienen un único estándar interno estable
- el núcleo puede rechazar propiedades duplicadas, como dos Plugins registrando el mismo
  id de proveedor
- el inicio puede mostrar diagnósticos accionables para registros mal formados
- las pruebas de contrato pueden imponer la propiedad de Plugins incluidos y evitar derivas silenciosas

Hay dos capas de imposición:

1. **imposición del registro en runtime**
   El registro de Plugins valida los registros conforme se cargan los Plugins. Ejemplos:
   ids duplicados de proveedor, ids duplicados de proveedor de voz y registros mal formados
   producen diagnósticos del Plugin en lugar de comportamiento indefinido.
2. **pruebas de contrato**
   Los Plugins incluidos se capturan en registros de contrato durante las ejecuciones de prueba para que
   OpenClaw pueda afirmar la propiedad explícitamente. Hoy esto se usa para
   proveedores de modelos, proveedores de voz, proveedores de búsqueda web y propiedad
   de registro de Plugins incluidos.

El efecto práctico es que OpenClaw sabe, desde el principio, qué Plugin controla qué
superficie. Eso permite que el núcleo y los canales compongan sin fricción porque la
propiedad está declarada, tipada y comprobable, en lugar de ser implícita.

### Qué pertenece a un contrato

Los buenos contratos de Plugins son:

- tipados
- pequeños
- específicos de capacidad
- controlados por el núcleo
- reutilizables por varios Plugins
- consumibles por canales/funciones sin conocimiento del proveedor

Los malos contratos de Plugins son:

- política específica de proveedor oculta en el núcleo
- escape hatches puntuales de Plugin que omiten el registro
- código de canal que accede directamente a una implementación de proveedor
- objetos de runtime ad hoc que no forman parte de `OpenClawPluginApi` ni de
  `api.runtime`

Ante la duda, eleva el nivel de abstracción: define primero la capacidad y después
deja que los Plugins se conecten a ella.

## Modelo de ejecución

Los Plugins nativos de OpenClaw se ejecutan **en proceso** con el Gateway. No están
aislados en sandbox. Un Plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que el código del núcleo.

Implicaciones:

- un Plugin nativo puede registrar herramientas, manejadores de red, Hooks y servicios
- un error en un Plugin nativo puede bloquear o desestabilizar el gateway
- un Plugin nativo malicioso equivale a ejecución arbitraria de código dentro
  del proceso de OpenClaw

Los paquetes compatibles son más seguros por defecto porque OpenClaw actualmente los trata
como paquetes de metadatos/contenido. En las versiones actuales, eso significa sobre todo
Skills incluidos.

Usa listas de permitidos y rutas explícitas de instalación/carga para Plugins que no estén incluidos.
Trata los Plugins del espacio de trabajo como código de tiempo de desarrollo, no como valores predeterminados de producción.

Para nombres de paquetes incluidos del espacio de trabajo, mantén el id del Plugin anclado en el
nombre npm: `@openclaw/<id>` de forma predeterminada, o un sufijo tipado aprobado como
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando
el paquete exponga intencionalmente un rol de Plugin más estrecho.

Nota importante sobre confianza:

- `plugins.allow` confía en **ids de Plugin**, no en la procedencia de la fuente.
- Un Plugin del espacio de trabajo con el mismo id que un Plugin incluido sombrea intencionalmente
  la copia incluida cuando ese Plugin del espacio de trabajo está habilitado/en la lista de permitidos.
- Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes.
- La confianza en Plugins incluidos se resuelve desde la instantánea de la fuente —el manifiesto y
  el código en disco en el momento de la carga— y no desde metadatos de instalación. Un registro
  de instalación corrupto o sustituido no puede ampliar silenciosamente la superficie de confianza de un Plugin incluido más allá de lo que la fuente real declara.

## Límite de exportación

OpenClaw exporta capacidades, no conveniencias de implementación.

Mantén público el registro de capacidades. Reduce exportaciones auxiliares que no sean contratos:

- subrutas auxiliares específicas de Plugins incluidos
- subrutas de plumbing de runtime no pensadas como API pública
- helpers de conveniencia específicos del proveedor
- helpers de configuración/onboarding que son detalles de implementación

Algunas subrutas auxiliares de Plugins incluidos siguen presentes en el mapa generado de exportación del SDK por compatibilidad y mantenimiento de Plugins incluidos. Ejemplos actuales incluyen
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y varias costuras `plugin-sdk/matrix*`. Trátalas como
exportaciones reservadas de detalle de implementación, no como el patrón de SDK recomendado para
nuevos Plugins de terceros.

## Internos y referencia

Para la canalización de carga, el modelo de registro, Hooks de runtime de proveedor, rutas HTTP del Gateway, esquemas de la herramienta de mensajes, resolución de destinos de canal, catálogos de proveedores,
Plugins de motor de contexto y la guía para añadir una nueva capacidad, consulta
[Aspectos internos de la arquitectura de Plugins](/es/plugins/architecture-internals).

## Relacionado

- [Crear Plugins](/es/plugins/building-plugins)
- [Configuración del SDK de Plugins](/es/plugins/sdk-setup)
- [Manifiesto de Plugin](/es/plugins/manifest)
