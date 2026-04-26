---
read_when:
    - Crear o depurar Plugins nativos de OpenClaw
    - Entender el modelo de capacidades de Plugins o los límites de propiedad
    - Trabajar en la canalización de carga o el registro de Plugins
    - Implementar hooks de runtime de proveedores o Plugins de canal
sidebarTitle: Internals
summary: 'Internos de Plugins: modelo de capacidades, propiedad, contratos, canalización de carga y helpers de runtime'
title: Internos de Plugins
x-i18n:
    generated_at: "2026-04-26T11:33:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16664d284a8bfbfcb9914bb012d1f36dfdd60406636d6bf4b011f76e886cb518
    source_path: plugins/architecture.md
    workflow: 15
---

Esta es la **referencia profunda de arquitectura** del sistema de Plugins de OpenClaw. Para guías prácticas, empieza con una de las páginas específicas de abajo.

<CardGroup cols={2}>
  <Card title="Instalar y usar Plugins" icon="plug" href="/es/tools/plugin">
    Guía de usuario final para añadir, habilitar y solucionar problemas de Plugins.
  </Card>
  <Card title="Crear Plugins" icon="rocket" href="/es/plugins/building-plugins">
    Tutorial del primer Plugin con el manifiesto funcional más pequeño.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/es/plugins/sdk-channel-plugins">
    Crea un Plugin de canal de mensajería.
  </Card>
  <Card title="Plugins de proveedor" icon="microchip" href="/es/plugins/sdk-provider-plugins">
    Crea un Plugin de proveedor de modelos.
  </Card>
  <Card title="Resumen del SDK" icon="book" href="/es/plugins/sdk-overview">
    Mapa de importación y referencia de la API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Las capacidades son el modelo público de **Plugin nativo** dentro de OpenClaw. Cada Plugin nativo de OpenClaw se registra frente a uno o más tipos de capacidad:

| Capacidad             | Método de registro                              | Plugins de ejemplo                    |
| --------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferencia de texto   | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferencia CLI | `api.registerCliBackend(...)`                | `openai`, `anthropic`                |
| Voz                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                         |
| Voz en tiempo real    | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Comprensión de medios | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generación de música  | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generación de vídeo   | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web fetch             | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Búsqueda web          | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensajería    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Descubrimiento de Gateway | `api.registerGatewayDiscoveryService(...)`    | `bonjour`                            |

<Note>
Un Plugin que registra cero capacidades pero proporciona hooks, herramientas, servicios de descubrimiento o servicios en segundo plano es un Plugin **heredado solo con hooks**. Ese patrón sigue siendo totalmente compatible.
</Note>

### Postura de compatibilidad externa

El modelo de capacidades ya está integrado en el núcleo y hoy lo usan los Plugins incluidos/nativos, pero la compatibilidad con Plugins externos todavía necesita un criterio más estricto que “si se exporta, entonces está congelado”.

| Situación del Plugin                              | Guía                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                       | Mantén funcionando las integraciones basadas en hooks; esta es la base de compatibilidad.        |
| Plugins nuevos incluidos/nativos                  | Prefiere el registro explícito de capacidades sobre accesos específicos del proveedor o nuevos diseños solo con hooks. |
| Plugins externos que adoptan el registro por capacidades | Permitido, pero trata las superficies auxiliares específicas de capacidad como evolutivas salvo que la documentación las marque como estables. |

El registro por capacidades es la dirección prevista. Los hooks heredados siguen siendo la ruta más segura sin roturas para Plugins externos durante la transición. No todas las subrutas auxiliares exportadas son iguales: prefiere contratos documentados y limitados frente a exportaciones auxiliares incidentales.

### Formas de Plugin

OpenClaw clasifica cada Plugin cargado en una forma según su comportamiento real de registro (no solo por metadatos estáticos):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra exactamente un tipo de capacidad (por ejemplo, un Plugin solo de proveedor como `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra varios tipos de capacidad (por ejemplo, `openai` controla inferencia de texto, voz, comprensión de medios y generación de imágenes).
  </Accordion>
  <Accordion title="hook-only">
    Registra solo hooks (tipados o personalizados), sin capacidades, herramientas, comandos ni servicios.
  </Accordion>
  <Accordion title="non-capability">
    Registra herramientas, comandos, servicios o rutas pero ninguna capacidad.
  </Accordion>
</AccordionGroup>

Usa `openclaw plugins inspect <id>` para ver la forma de un Plugin y el desglose de capacidades. Consulta [Referencia de la CLI](/es/cli/plugins#inspect) para más detalles.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como ruta de compatibilidad para Plugins solo con hooks. Plugins heredados reales todavía dependen de él.

Dirección:

- mantenerlo funcionando
- documentarlo como heredado
- preferir `before_model_resolve` para trabajo de sustitución de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación de prompt
- eliminarlo solo después de que baje el uso real y la cobertura de fixtures demuestre seguridad de migración

### Señales de compatibilidad

Cuando ejecutas `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver una de estas etiquetas:

| Señal                     | Significado                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configuración se analiza correctamente y los Plugins se resuelven |
| **compatibility advisory** | El Plugin usa un patrón compatible pero más antiguo (p. ej. `hook-only`) |
| **legacy warning**         | El Plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**             | La configuración es inválida o el Plugin no se pudo cargar   |

Ni `hook-only` ni `before_agent_start` romperán tu Plugin hoy: `hook-only` es solo informativo, y `before_agent_start` solo activa una advertencia. Estas señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Descripción general de la arquitectura

El sistema de Plugins de OpenClaw tiene cuatro capas:

<Steps>
  <Step title="Manifiesto + descubrimiento">
    OpenClaw encuentra Plugins candidatos a partir de rutas configuradas, raíces del workspace, raíces globales de Plugins y Plugins incluidos. El descubrimiento lee primero manifiestos nativos `openclaw.plugin.json` y manifiestos de bundle compatibles.
  </Step>
  <Step title="Habilitación + validación">
    El núcleo decide si un Plugin descubierto está habilitado, deshabilitado, bloqueado o seleccionado para un slot exclusivo como memoria.
  </Step>
  <Step title="Carga en runtime">
    Los Plugins nativos de OpenClaw se cargan en proceso mediante jiti y registran capacidades en un registro central. Los bundles compatibles se normalizan en registros del registro sin importar código de runtime.
  </Step>
  <Step title="Consumo de superficie">
    El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración de proveedor, hooks, rutas HTTP, comandos CLI y servicios.
  </Step>
</Steps>

Específicamente para la CLI de Plugin, el descubrimiento de comandos raíz se divide en dos fases:

- los metadatos en tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo CLI real del Plugin puede permanecer lazy y registrarse en la primera invocación

Eso mantiene el código CLI propiedad del Plugin dentro del Plugin y al mismo tiempo permite que OpenClaw reserve nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- la validación de manifiesto/configuración debe funcionar a partir de **metadatos de manifiesto/esquema** sin ejecutar código del Plugin
- el descubrimiento nativo de capacidades puede cargar código de entrada del Plugin de confianza para construir una instantánea del registro que no activa nada
- el comportamiento nativo en runtime proviene de la ruta `register(api)` del módulo del Plugin con `api.registrationMode === "full"`

Esa separación permite que OpenClaw valide configuración, explique Plugins ausentes/deshabilitados y construya sugerencias de UI/esquema antes de que el runtime completo esté activo.

### Planificación de activación

La planificación de activación forma parte del plano de control. Los llamantes pueden preguntar qué Plugins son relevantes para un comando, proveedor, canal, ruta, arnés de agente o capacidad concretos antes de cargar registros de runtime más amplios.

El planificador mantiene compatible el comportamiento actual del manifiesto:

- los campos `activation.*` son sugerencias explícitas del planificador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y los hooks siguen siendo la alternativa de propiedad del manifiesto
- la API del planificador solo de ids sigue disponible para los llamantes existentes
- la API de plan informa etiquetas de motivo para que los diagnósticos puedan distinguir las sugerencias explícitas de la alternativa de propiedad

<Warning>
No trates `activation` como un hook de ciclo de vida ni como un sustituto de `register(...)`. Son metadatos usados para acotar la carga. Prefiere los campos de propiedad cuando ya describen la relación; usa `activation` solo para sugerencias adicionales del planificador.
</Warning>

### Plugins de canal y la herramienta compartida de mensajes

Los Plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para acciones normales de chat. OpenClaw mantiene una única herramienta compartida `message` en el núcleo, y los Plugins de canal controlan el descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el núcleo controla el host compartido de la herramienta `message`, la conexión al prompt, la contabilidad de sesión/hilo y el despacho de ejecución
- los Plugins de canal controlan el descubrimiento de acciones delimitadas, el descubrimiento de capacidades y cualquier fragmento de esquema específico del canal
- los Plugins de canal controlan la gramática de conversación de sesión específica del proveedor, como cómo los ids de conversación codifican ids de hilo o heredan de conversaciones padre
- los Plugins de canal ejecutan la acción final mediante su adaptador de acciones

Para Plugins de canal, la superficie del SDK es `ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada unificada de descubrimiento permite que un Plugin devuelva juntas sus acciones visibles, capacidades y contribuciones al esquema, para que esas piezas no se separen.

Cuando un parámetro específico del canal en la herramienta de mensajes transporta una fuente de medios como una ruta local o una URL remota de medios, el Plugin también debería devolver `mediaSourceParams` desde `describeMessageTool(...)`. El núcleo usa esa lista explícita para aplicar normalización de rutas del sandbox y sugerencias de acceso a medios salientes sin codificar nombres de parámetros propiedad del Plugin. Prefiere mapas delimitados por acción ahí, no una lista plana para todo el canal, para que un parámetro de medios solo de perfil no se normalice en acciones no relacionadas como `send`.

El núcleo pasa el alcance de runtime a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Esto importa para los Plugins sensibles al contexto. Un canal puede ocultar o exponer acciones de mensajes según la cuenta activa, la sala/hilo/mensaje actual o la identidad de confianza del solicitante, sin codificar ramas específicas del canal en la herramienta central `message`.

Por eso los cambios de enrutamiento del runner embebido siguen siendo trabajo del Plugin: el runner es responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del Plugin para que la herramienta compartida `message` exponga la superficie correcta propiedad del canal para el turno actual.

Para helpers de ejecución propiedad del canal, los Plugins incluidos deberían mantener el runtime de ejecución dentro de sus propios módulos de extensión. El núcleo ya no controla los runtimes de acciones de mensajes de Discord, Slack, Telegram o WhatsApp en `src/agents/tools`. No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los Plugins incluidos deberían importar directamente su propio código de runtime local desde sus módulos propiedad de la extensión.

El mismo límite se aplica en general a las costuras del SDK con nombre de proveedor: el núcleo no debería importar barriles de conveniencia específicos de canal para extensiones como Slack, Discord, Signal, WhatsApp o similares. Si el núcleo necesita un comportamiento, debe consumir el barril `api.ts` / `runtime-api.ts` del propio Plugin incluido o promover esa necesidad a una capacidad genérica y limitada en el SDK compartido.

En el caso específico de las encuestas, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para canales que encajan en el modelo común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semánticas de encuesta específicas del canal o parámetros adicionales de encuesta

Ahora el núcleo difiere el análisis compartido de encuestas hasta después de que el despacho de encuestas del Plugin rechace la acción, para que los controladores de encuestas propiedad del Plugin puedan aceptar campos de encuesta específicos del canal sin quedar bloqueados primero por el analizador genérico de encuestas.

Consulta [Internos de la arquitectura de Plugins](/es/plugins/architecture-internals) para ver la secuencia completa de arranque.

## Modelo de propiedad de capacidades

OpenClaw trata un Plugin nativo como el límite de propiedad de una **empresa** o de una **función**, no como una bolsa de integraciones no relacionadas.

Eso significa:

- un Plugin de empresa normalmente debería controlar todas las superficies de OpenClaw de esa empresa
- un Plugin de función normalmente debería controlar toda la superficie de la función que introduce
- los canales deberían consumir capacidades compartidas del núcleo en lugar de reimplementar comportamiento de proveedor de forma ad hoc

<AccordionGroup>
  <Accordion title="Proveedor con varias capacidades">
    `openai` controla inferencia de texto, voz, voz en tiempo real, comprensión de medios y generación de imágenes. `google` controla inferencia de texto además de comprensión de medios, generación de imágenes y búsqueda web. `qwen` controla inferencia de texto además de comprensión de medios y generación de vídeo.
  </Accordion>
  <Accordion title="Proveedor de una sola capacidad">
    `elevenlabs` y `microsoft` controlan voz; `firecrawl` controla web-fetch; `minimax` / `mistral` / `moonshot` / `zai` controlan backends de comprensión de medios.
  </Accordion>
  <Accordion title="Plugin de función">
    `voice-call` controla transporte de llamadas, herramientas, CLI, rutas y puenteo de flujo de medios de Twilio, pero consume capacidades compartidas de voz, transcripción en tiempo real y voz en tiempo real en lugar de importar directamente Plugins de proveedor.
  </Accordion>
</AccordionGroup>

El estado final previsto es:

- OpenAI vive en un solo Plugin aunque abarque modelos de texto, voz, imágenes y futuro vídeo
- otro proveedor puede hacer lo mismo con su propia área de superficie
- a los canales no les importa qué Plugin de proveedor controla el proveedor; consumen el contrato de capacidad compartido expuesto por el núcleo

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capacidad** = contrato del núcleo que varios Plugins pueden implementar o consumir

Así que, si OpenClaw añade un dominio nuevo como vídeo, la primera pregunta no es “¿qué proveedor debería codificar el manejo de vídeo?”. La primera pregunta es “¿cuál es el contrato central de capacidad de vídeo?”. Una vez que ese contrato existe, los Plugins de proveedor pueden registrarse en él y los Plugins de canal/función pueden consumirlo.

Si la capacidad aún no existe, el movimiento correcto suele ser:

<Steps>
  <Step title="Define la capacidad">
    Define la capacidad que falta en el núcleo.
  </Step>
  <Step title="Expónla mediante el SDK">
    Expónla de forma tipada a través de la API/runtime del Plugin.
  </Step>
  <Step title="Conecta los consumidores">
    Conecta canales/funciones frente a esa capacidad.
  </Step>
  <Step title="Implementaciones del proveedor">
    Deja que los Plugins de proveedor registren implementaciones.
  </Step>
</Steps>

Esto mantiene explícita la propiedad y al mismo tiempo evita comportamientos del núcleo que dependan de un único proveedor o de una ruta de código específica de un solo Plugin.

### Estratificación de capacidades

Usa este modelo mental al decidir dónde debe vivir el código:

<Tabs>
  <Tab title="Capa central de capacidad">
    Orquestación compartida, política, alternativa, reglas de combinación de configuración, semántica de entrega y contratos tipados.
  </Tab>
  <Tab title="Capa de Plugin de proveedor">
    APIs específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz, generación de imágenes, futuros backends de vídeo, endpoints de uso.
  </Tab>
  <Tab title="Capa de Plugin de canal/función">
    Integración de Slack/Discord/voice-call/etc. que consume capacidades del núcleo y las presenta en una superficie.
  </Tab>
</Tabs>

Por ejemplo, TTS sigue esta forma:

- el núcleo controla política de TTS en tiempo de respuesta, orden de alternativa, preferencias y entrega por canal
- `openai`, `elevenlabs` y `microsoft` controlan implementaciones de síntesis
- `voice-call` consume el helper de runtime TTS de telefonía

Ese mismo patrón debería preferirse para futuras capacidades.

### Ejemplo de Plugin de empresa con varias capacidades

Un Plugin de empresa debería sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de vídeo, web fetch y búsqueda web, un proveedor puede controlar todas sus superficies en un solo lugar:

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

Lo importante no son los nombres exactos de los helpers. Lo importante es la forma:

- un solo Plugin controla la superficie del proveedor
- el núcleo sigue controlando los contratos de capacidad
- los Plugins de canal y de función consumen helpers `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden afirmar que el Plugin registró las capacidades que dice controlar

### Ejemplo de capacidad: comprensión de vídeo

OpenClaw ya trata la comprensión de imagen/audio/vídeo como una capacidad compartida. El mismo modelo de propiedad se aplica ahí:

<Steps>
  <Step title="El núcleo define el contrato">
    El núcleo define el contrato de comprensión de medios.
  </Step>
  <Step title="Los Plugins de proveedor se registran">
    Los Plugins de proveedor registran `describeImage`, `transcribeAudio` y `describeVideo` según corresponda.
  </Step>
  <Step title="Los consumidores usan el comportamiento compartido">
    Los Plugins de canal y de función consumen el comportamiento compartido del núcleo en lugar de conectarse directamente al código del proveedor.
  </Step>
</Steps>

Eso evita incrustar en el núcleo las suposiciones de vídeo de un único proveedor. El Plugin controla la superficie del proveedor; el núcleo controla el contrato de capacidad y el comportamiento de alternativa.

La generación de vídeo ya usa esa misma secuencia: el núcleo controla el contrato tipado de capacidad y el helper de runtime, y los Plugins de proveedor registran implementaciones `api.registerVideoGenerationProvider(...)` frente a él.

¿Necesitas una lista concreta de despliegue? Consulta [Capability Cookbook](/es/plugins/architecture).

## Contratos y aplicación

La superficie de la API de Plugin es intencionadamente tipada y centralizada en `OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y los helpers de runtime de los que puede depender un Plugin.

Por qué importa:

- los autores de Plugins obtienen un único estándar interno estable
- el núcleo puede rechazar propiedad duplicada, como dos Plugins que registran el mismo id de proveedor
- el arranque puede mostrar diagnósticos accionables para registros mal formados
- las pruebas de contrato pueden aplicar la propiedad de Plugins incluidos y evitar una deriva silenciosa

Hay dos capas de aplicación:

<AccordionGroup>
  <Accordion title="Aplicación del registro en runtime">
    El registro de Plugins valida los registros a medida que se cargan los Plugins. Ejemplos: ids de proveedor duplicados, ids de proveedor de voz duplicados y registros mal formados producen diagnósticos del Plugin en lugar de comportamiento indefinido.
  </Accordion>
  <Accordion title="Pruebas de contrato">
    Los Plugins incluidos se capturan en registros de contratos durante las ejecuciones de prueba para que OpenClaw pueda afirmar explícitamente la propiedad. Hoy se usa para proveedores de modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registro incluida.
  </Accordion>
</AccordionGroup>

El efecto práctico es que OpenClaw sabe, por adelantado, qué Plugin controla qué superficie. Eso permite que el núcleo y los canales compongan sin fricciones porque la propiedad está declarada, tipada y es comprobable, en lugar de implícita.

### Qué debe ir en un contrato

<Tabs>
  <Tab title="Buenos contratos">
    - tipados
    - pequeños
    - específicos de capacidad
    - controlados por el núcleo
    - reutilizables por varios Plugins
    - consumibles por canales/funciones sin conocimiento del proveedor
  </Tab>
  <Tab title="Malos contratos">
    - política específica de proveedor oculta en el núcleo
    - vías de escape ad hoc de un solo Plugin que omiten el registro
    - código de canal que entra directamente en una implementación de proveedor
    - objetos de runtime ad hoc que no forman parte de `OpenClawPluginApi` ni de `api.runtime`
  </Tab>
</Tabs>

En caso de duda, eleva el nivel de abstracción: define primero la capacidad y luego deja que los Plugins se conecten a ella.

## Modelo de ejecución

Los Plugins nativos de OpenClaw se ejecutan **en proceso** con el Gateway. No están aislados. Un Plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que el código del núcleo.

<Warning>
Implicaciones:

- un Plugin nativo puede registrar herramientas, controladores de red, hooks y servicios
- un fallo de un Plugin nativo puede hacer caer o desestabilizar el gateway
- un Plugin nativo malicioso equivale a ejecución arbitraria de código dentro del proceso de OpenClaw
  </Warning>

Los bundles compatibles son más seguros por defecto porque OpenClaw actualmente los trata como paquetes de metadatos/contenido. En las versiones actuales, eso significa sobre todo Skills incluidas.

Usa allowlists y rutas explícitas de instalación/carga para Plugins no incluidos. Trata los Plugins del workspace como código de desarrollo, no como valores predeterminados de producción.

Para nombres de paquetes incluidos del workspace, mantén el id del Plugin anclado en el nombre npm: `@openclaw/<id>` por defecto, o un sufijo tipado aprobado como `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando el paquete expone intencionadamente un rol de Plugin más delimitado.

<Note>
**Nota de confianza:**

- `plugins.allow` confía en **ids de Plugin**, no en la procedencia de la fuente.
- Un Plugin del workspace con el mismo id que un Plugin incluido sombrea intencionadamente la copia incluida cuando ese Plugin del workspace está habilitado/en allowlist.
- Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes.
- La confianza de Plugin incluido se resuelve a partir de la instantánea de la fuente —el manifiesto y el código en disco en el momento de la carga— y no a partir de metadatos de instalación. Un registro de instalación corrupto o sustituido no puede ampliar silenciosamente la superficie de confianza de un Plugin incluido más allá de lo que afirma la fuente real.
  </Note>

## Límite de exportación

OpenClaw exporta capacidades, no conveniencias de implementación.

Mantén público el registro de capacidades. Recorta exportaciones auxiliares fuera de contrato:

- subrutas auxiliares específicas de Plugins incluidos
- subrutas de plomería de runtime no pensadas como API pública
- helpers de conveniencia específicos del proveedor
- helpers de configuración/onboarding que son detalles de implementación

Algunas subrutas auxiliares de Plugins incluidos siguen presentes en el mapa de exportación SDK generado por compatibilidad y mantenimiento de Plugins incluidos. Ejemplos actuales incluyen `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` y varias costuras `plugin-sdk/matrix*`. Trátalas como exportaciones reservadas de detalle de implementación, no como el patrón SDK recomendado para nuevos Plugins de terceros.

## Internos y referencia

Para la canalización de carga, el modelo de registro, los hooks de runtime de proveedores, las rutas HTTP del Gateway, los esquemas de la herramienta de mensajes, la resolución de destinos de canal, los catálogos de proveedores, los Plugins de motor de contexto y la guía para añadir una nueva capacidad, consulta [Internos de la arquitectura de Plugins](/es/plugins/architecture-internals).

## Relacionado

- [Crear Plugins](/es/plugins/building-plugins)
- [Manifiesto de Plugin](/es/plugins/manifest)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
