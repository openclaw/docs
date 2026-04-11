---
read_when:
    - Compilar o depurar plugins nativos de OpenClaw
    - Comprender el modelo de capacidades de plugins o los límites de propiedad
    - Trabajar en la canalización de carga de plugins o el registro
    - Implementar hooks de tiempo de ejecución del proveedor o plugins de canal
sidebarTitle: Internals
summary: 'Detalles internos de plugins: modelo de capacidades, propiedad, contratos, canalización de carga y asistentes de tiempo de ejecución'
title: Detalles internos de plugins
x-i18n:
    generated_at: "2026-04-11T15:15:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7cac67984d0d729c0905bcf5c18372fb0d9b02bbd3a531580b7e2ef483ef40a6
    source_path: plugins/architecture.md
    workflow: 15
---

# Detalles internos de plugins

<Info>
  Esta es la **referencia de arquitectura profunda**. Para guías prácticas, consulta:
  - [Instalar y usar plugins](/es/tools/plugin) — guía del usuario
  - [Primeros pasos](/es/plugins/building-plugins) — primer tutorial de plugins
  - [Plugins de canal](/es/plugins/sdk-channel-plugins) — compilar un canal de mensajería
  - [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — compilar un proveedor de modelos
  - [Información general del SDK](/es/plugins/sdk-overview) — mapa de importaciones y API de registro
</Info>

Esta página cubre la arquitectura interna del sistema de plugins de OpenClaw.

## Modelo público de capacidades

Las capacidades son el modelo público de **plugins nativos** dentro de OpenClaw. Cada
plugin nativo de OpenClaw se registra en uno o más tipos de capacidad:

| Capacidad              | Método de registro                              | Plugins de ejemplo                   |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferencia de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferencia de CLI | `api.registerCliBackend(...)`              | `openai`, `anthropic`                |
| Voz                    | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                     |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Comprensión de medios  | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generación de música   | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Obtención web          | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensajería     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Un plugin que registra cero capacidades pero proporciona hooks, herramientas o
servicios es un plugin **heredado solo con hooks**. Ese patrón sigue siendo totalmente compatible.

### Postura de compatibilidad externa

El modelo de capacidades ya está implementado en el núcleo y hoy lo usan los plugins
nativos/integrados, pero la compatibilidad de plugins externos aún necesita un estándar
más estricto que “está exportado, por lo tanto está congelado”.

Guía actual:

- **plugins externos existentes:** mantén funcionando las integraciones basadas en hooks; trátalas
  como la línea base de compatibilidad
- **nuevos plugins nativos/integrados:** prefiere el registro explícito de capacidades en lugar de
  accesos específicos del proveedor o nuevos diseños solo con hooks
- **plugins externos que adoptan registro de capacidades:** permitido, pero trata las
  superficies auxiliares específicas de capacidades como evolutivas a menos que la documentación marque
  explícitamente un contrato como estable

Regla práctica:

- las API de registro de capacidades son la dirección prevista
- los hooks heredados siguen siendo la vía más segura para no romper plugins externos durante
  la transición
- no todas las subrutas auxiliares exportadas son equivalentes; prefiere el contrato
  documentado y limitado, no exportaciones auxiliares incidentales

### Formas de plugins

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real
de registro (no solo según metadatos estáticos):

- **plain-capability** -- registra exactamente un tipo de capacidad (por ejemplo, un
  plugin solo de proveedor como `mistral`)
- **hybrid-capability** -- registra varios tipos de capacidad (por ejemplo,
  `openai` posee inferencia de texto, voz, comprensión de medios y generación
  de imágenes)
- **hook-only** -- registra solo hooks (tipados o personalizados), sin capacidades,
  herramientas, comandos ni servicios
- **non-capability** -- registra herramientas, comandos, servicios o rutas, pero no
  capacidades

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin y el desglose
de sus capacidades. Consulta la [referencia de CLI](/cli/plugins#inspect) para más detalles.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como vía de compatibilidad para
plugins solo con hooks. Plugins heredados del mundo real todavía dependen de él.

Dirección:

- mantenerlo funcionando
- documentarlo como heredado
- preferir `before_model_resolve` para trabajo de sustitución de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación del prompt
- eliminarlo solo cuando baje el uso real y la cobertura de fixtures demuestre que la migración es segura

### Señales de compatibilidad

Cuando ejecutas `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver
una de estas etiquetas:

| Señal                     | Significado                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configuración se analiza correctamente y los plugins se resuelven |
| **compatibility advisory** | El plugin usa un patrón compatible pero antiguo (por ejemplo, `hook-only`) |
| **legacy warning**        | El plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**            | La configuración no es válida o el plugin no pudo cargarse   |

Ni `hook-only` ni `before_agent_start` romperán tu plugin hoy --
`hook-only` es solo informativo, y `before_agent_start` solo activa una advertencia. Estas
señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Información general de la arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

1. **Manifiesto + descubrimiento**
   OpenClaw encuentra plugins candidatos desde rutas configuradas, raíces de workspace,
   raíces globales de extensiones y extensiones integradas. El descubrimiento lee primero los
   manifiestos nativos `openclaw.plugin.json` junto con los manifiestos de paquetes compatibles.
2. **Habilitación + validación**
   El núcleo decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o
   seleccionado para un espacio exclusivo como la memoria.
3. **Carga en tiempo de ejecución**
   Los plugins nativos de OpenClaw se cargan dentro del proceso mediante jiti y registran
   capacidades en un registro central. Los paquetes compatibles se normalizan en
   registros del registro sin importar código de tiempo de ejecución.
4. **Consumo de superficies**
   El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración
   del proveedor, hooks, rutas HTTP, comandos de CLI y servicios.

En el caso específico del CLI de plugins, el descubrimiento del comando raíz se divide en dos fases:

- los metadatos en tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo real de CLI del plugin puede seguir siendo diferido y registrarse en la primera invocación

Eso mantiene el código de CLI propiedad del plugin dentro del plugin, al tiempo que permite a OpenClaw
reservar nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- el descubrimiento y la validación de configuración deben funcionar a partir de **metadatos de manifiesto/esquema**
  sin ejecutar código del plugin
- el comportamiento nativo en tiempo de ejecución proviene de la ruta `register(api)` del módulo del plugin

Esa separación permite que OpenClaw valide la configuración, explique plugins faltantes o deshabilitados y
construya sugerencias de UI/esquema antes de que el tiempo de ejecución completo esté activo.

### Plugins de canal y la herramienta compartida de mensajes

Los plugins de canal no necesitan registrar una herramienta independiente de enviar/editar/reaccionar para
acciones normales de chat. OpenClaw mantiene una sola herramienta compartida `message` en el núcleo, y
los plugins de canal se encargan del descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el núcleo posee el host de la herramienta compartida `message`, el cableado del prompt, el
  mantenimiento de sesiones/hilos y el despacho de ejecución
- los plugins de canal poseen el descubrimiento de acciones con alcance, el descubrimiento de
  capacidades y cualquier fragmento de esquema específico del canal
- los plugins de canal poseen la gramática de conversación de sesión específica del proveedor, como
  la forma en que los ID de conversación codifican los ID de hilo o heredan de conversaciones padre
- los plugins de canal ejecutan la acción final a través de su adaptador de acciones

Para los plugins de canal, la superficie del SDK es
`ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada unificada de descubrimiento
permite que un plugin devuelva juntas sus acciones visibles, capacidades y contribuciones
al esquema para que esas piezas no se desalineen entre sí.

El núcleo pasa el alcance de tiempo de ejecución a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` de entrada confiable

Esto importa para los plugins sensibles al contexto. Un canal puede ocultar o exponer
acciones de mensaje según la cuenta activa, la sala/hilo/mensaje actual o la
identidad confiable del solicitante, sin codificar ramas específicas del canal en la
herramienta central `message`.

Por eso los cambios de enrutamiento del embedded-runner siguen siendo trabajo de plugins: el runner es
responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del plugin
para que la herramienta compartida `message` exponga la superficie correcta, propiedad del canal,
para el turno actual.

Para los asistentes de ejecución propiedad del canal, los plugins integrados deben mantener el tiempo de ejecución
de ejecución dentro de sus propios módulos de extensión. El núcleo ya no posee los
tiempos de ejecución de acciones de mensaje de Discord, Slack, Telegram o WhatsApp en `src/agents/tools`.
No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los plugins integrados
deben importar directamente su propio código local de tiempo de ejecución desde sus
módulos propiedad de la extensión.

El mismo límite se aplica a las uniones del SDK con nombre de proveedor en general: el núcleo no debe
importar barriles de conveniencia específicos del canal para extensiones como Slack, Discord, Signal,
WhatsApp o similares. Si el núcleo necesita un comportamiento, debe consumir el propio barril
`api.ts` / `runtime-api.ts` del plugin integrado o elevar la necesidad a una capacidad
genérica y limitada del SDK compartido.

En el caso específico de las encuestas, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para canales que encajan en el modelo
  común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semánticas de encuesta específicas del canal
  o parámetros de encuesta adicionales

Ahora el núcleo difiere el análisis compartido de encuestas hasta después de que el despacho de encuestas del plugin
rechace la acción, de modo que los controladores de encuestas propiedad del plugin puedan aceptar
campos de encuesta específicos del canal sin quedar bloqueados primero por el analizador
genérico de encuestas.

Consulta [Canalización de carga](#load-pipeline) para ver la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata un plugin nativo como el límite de propiedad para una **empresa** o una
**función**, no como una mezcla de integraciones no relacionadas.

Eso significa:

- un plugin de empresa normalmente debe poseer todas las superficies de OpenClaw
  orientadas a esa empresa
- un plugin de función normalmente debe poseer la superficie completa de la función que introduce
- los canales deben consumir capacidades compartidas del núcleo en lugar de volver a implementar
  comportamiento de proveedores de forma ad hoc

Ejemplos:

- el plugin integrado `openai` posee el comportamiento de proveedor de modelos de OpenAI y el comportamiento de OpenAI
  para voz + voz en tiempo real + comprensión de medios + generación de imágenes
- el plugin integrado `elevenlabs` posee el comportamiento de voz de ElevenLabs
- el plugin integrado `microsoft` posee el comportamiento de voz de Microsoft
- el plugin integrado `google` posee el comportamiento de proveedor de modelos de Google más el comportamiento de Google para
  comprensión de medios + generación de imágenes + búsqueda web
- el plugin integrado `firecrawl` posee el comportamiento de obtención web de Firecrawl
- los plugins integrados `minimax`, `mistral`, `moonshot` y `zai` poseen sus
  backends de comprensión de medios
- el plugin integrado `qwen` posee el comportamiento de proveedor de texto de Qwen más
  el comportamiento de comprensión de medios y generación de video
- el plugin `voice-call` es un plugin de función: posee transporte de llamadas, herramientas,
  CLI, rutas y puenteado de flujo multimedia de Twilio, pero consume capacidades compartidas de voz
  más transcripción en tiempo real y voz en tiempo real en lugar de importar plugins de proveedor directamente

El estado final previsto es:

- OpenAI vive en un solo plugin aunque abarque modelos de texto, voz, imágenes y
  video futuro
- otro proveedor puede hacer lo mismo para su propia área funcional
- los canales no se preocupan por qué plugin del proveedor posee el proveedor; consumen el
  contrato de capacidad compartida expuesto por el núcleo

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capacidad** = contrato del núcleo que varios plugins pueden implementar o consumir

Así que si OpenClaw agrega un nuevo dominio como video, la primera pregunta no es
“¿qué proveedor debería codificar de forma rígida el manejo de video?”. La primera pregunta es “¿cuál es
el contrato central de capacidad de video?”. Una vez que ese contrato existe, los plugins de proveedor
pueden registrarse en él y los plugins de canal/función pueden consumirlo.

Si la capacidad todavía no existe, el movimiento correcto suele ser:

1. definir la capacidad faltante en el núcleo
2. exponerla a través de la API/tiempo de ejecución del plugin de forma tipada
3. conectar canales/funciones a esa capacidad
4. dejar que los plugins de proveedor registren implementaciones

Esto mantiene la propiedad explícita y evita al mismo tiempo un comportamiento del núcleo que dependa de un
único proveedor o de una ruta de código específica de un plugin puntual.

### Capas de capacidades

Usa este modelo mental al decidir dónde pertenece el código:

- **capa de capacidades del núcleo**: orquestación compartida, política, fallback, reglas de
  combinación de configuración, semántica de entrega y contratos tipados
- **capa de plugin del proveedor**: API específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz,
  generación de imágenes, backends futuros de video, endpoints de uso
- **capa de plugin de canal/función**: integración con Slack/Discord/voice-call/etc.
  que consume capacidades del núcleo y las presenta en una superficie

Por ejemplo, TTS sigue esta forma:

- el núcleo posee la política de TTS en tiempo de respuesta, el orden de fallback, las preferencias y la entrega por canal
- `openai`, `elevenlabs` y `microsoft` poseen las implementaciones de síntesis
- `voice-call` consume el asistente de tiempo de ejecución de TTS para telefonía

Ese mismo patrón debe preferirse para capacidades futuras.

### Ejemplo de plugin de empresa con múltiples capacidades

Un plugin de empresa debe sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos
para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios,
generación de imágenes, generación de video, obtención web y búsqueda web,
un proveedor puede poseer todas sus superficies en un solo lugar:

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

Lo que importa no son los nombres exactos de los asistentes. Importa la forma:

- un solo plugin posee la superficie del proveedor
- el núcleo sigue poseyendo los contratos de capacidad
- los plugins de canal y de función consumen asistentes `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden afirmar que el plugin registró las capacidades que
  afirma poseer

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imagen/audio/video como una sola
capacidad compartida. El mismo modelo de propiedad se aplica allí:

1. el núcleo define el contrato de comprensión de medios
2. los plugins de proveedor registran `describeImage`, `transcribeAudio` y
   `describeVideo`, según corresponda
3. los plugins de canal y de función consumen el comportamiento compartido del núcleo en lugar de
   conectarse directamente al código del proveedor

Eso evita incorporar las suposiciones de video de un proveedor dentro del núcleo. El plugin posee
la superficie del proveedor; el núcleo posee el contrato de capacidad y el comportamiento de fallback.

La generación de video ya usa esa misma secuencia: el núcleo posee el contrato tipado de
capacidad y el asistente de tiempo de ejecución, y los plugins de proveedor registran
implementaciones `api.registerVideoGenerationProvider(...)` en relación con él.

¿Necesitas una lista concreta de despliegue? Consulta
[Recetario de capacidades](/es/plugins/architecture).

## Contratos y cumplimiento

La superficie de la API de plugins está intencionalmente tipada y centralizada en
`OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y
los asistentes de tiempo de ejecución en los que un plugin puede apoyarse.

Por qué esto importa:

- los autores de plugins obtienen un único estándar interno estable
- el núcleo puede rechazar propiedad duplicada, como dos plugins que registren el mismo
  ID de proveedor
- el inicio puede mostrar diagnósticos accionables para registros con formato incorrecto
- las pruebas de contrato pueden hacer cumplir la propiedad de los plugins integrados y evitar desviaciones silenciosas

Hay dos capas de cumplimiento:

1. **cumplimiento del registro en tiempo de ejecución**
   El registro de plugins valida los registros a medida que se cargan los plugins. Ejemplos:
   ID de proveedor duplicados, ID de proveedor de voz duplicados y
   registros mal formados producen diagnósticos del plugin en lugar de comportamiento indefinido.
2. **pruebas de contrato**
   Los plugins integrados se capturan en registros de contrato durante las ejecuciones de prueba para que
   OpenClaw pueda afirmar la propiedad de forma explícita. Hoy esto se usa para proveedores de modelos,
   proveedores de voz, proveedores de búsqueda web y propiedad del registro integrado.

El efecto práctico es que OpenClaw sabe, de antemano, qué plugin posee qué
superficie. Eso permite que el núcleo y los canales se compongan sin problemas porque la propiedad está
declarada, tipada y es comprobable, en lugar de implícita.

### Qué pertenece a un contrato

Los buenos contratos de plugins son:

- tipados
- pequeños
- específicos de una capacidad
- propiedad del núcleo
- reutilizables por varios plugins
- consumibles por canales/funciones sin conocimiento del proveedor

Los malos contratos de plugins son:

- política específica del proveedor oculta en el núcleo
- vías de escape puntuales de plugins que eluden el registro
- código de canal que accede directamente a una implementación del proveedor
- objetos de tiempo de ejecución ad hoc que no forman parte de `OpenClawPluginApi` ni de
  `api.runtime`

En caso de duda, eleva el nivel de abstracción: define primero la capacidad y luego
deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **dentro del proceso** con el Gateway. No están
aislados en sandbox. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que
el código del núcleo.

Implicaciones:

- un plugin nativo puede registrar herramientas, manejadores de red, hooks y servicios
- un error en un plugin nativo puede bloquear o desestabilizar el gateway
- un plugin nativo malicioso equivale a ejecución arbitraria de código dentro del proceso de OpenClaw

Los paquetes compatibles son más seguros por defecto porque OpenClaw actualmente los trata
como paquetes de metadatos/contenido. En las versiones actuales, eso significa sobre todo
Skills integradas.

Usa listas de permitidos y rutas explícitas de instalación/carga para plugins no integrados. Trata
los plugins de workspace como código para tiempo de desarrollo, no como valores predeterminados de producción.

Para los nombres de paquetes integrados del workspace, mantén el ID del plugin anclado en el nombre npm:
`@openclaw/<id>` de forma predeterminada, o con un sufijo tipado aprobado como
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando
el paquete expone intencionalmente un rol de plugin más limitado.

Nota importante sobre confianza:

- `plugins.allow` confía en **ID de plugin**, no en la procedencia de la fuente.
- Un plugin de workspace con el mismo ID que un plugin integrado intencionalmente sombrea
  la copia integrada cuando ese plugin de workspace está habilitado/en la lista de permitidos.
- Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes.

## Límite de exportación

OpenClaw exporta capacidades, no conveniencias de implementación.

Mantén público el registro de capacidades. Recorta las exportaciones auxiliares que no sean contratos:

- subrutas específicas de asistentes de plugins integrados
- subrutas de infraestructura de tiempo de ejecución que no estén pensadas como API pública
- asistentes de conveniencia específicos del proveedor
- asistentes de configuración/incorporación que sean detalles de implementación

Algunas subrutas auxiliares de plugins integrados todavía permanecen en el mapa generado de exportaciones del SDK
por compatibilidad y mantenimiento de plugins integrados. Ejemplos actuales incluyen
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y varias uniones `plugin-sdk/matrix*`. Trátalas como
exportaciones reservadas de detalle de implementación, no como el patrón de SDK recomendado para
nuevos plugins externos.

## Canalización de carga

Al inicio, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de plugins
2. lee manifiestos nativos o de paquetes compatibles y metadatos del paquete
3. rechaza candidatos no seguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga los módulos nativos habilitados mediante jiti
7. llama a los hooks nativos `register(api)` (o `activate(api)` — un alias heredado) y recopila los registros en el registro de plugins
8. expone el registro a las superficies de comandos/tiempo de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins integrados usan `register`; para plugins nuevos, prefiere `register`.
</Note>

Las compuertas de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean
cuando la entrada escapa de la raíz del plugin, la ruta es escribible por cualquiera o la propiedad de la ruta
parece sospechosa para plugins no integrados.

### Comportamiento basado primero en el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del paquete
- validar `plugins.entries.<id>.config`
- complementar etiquetas/placeholders de la UI de control
- mostrar metadatos de instalación/catálogo
- preservar descriptores económicos de activación y configuración sin cargar el tiempo de ejecución del plugin

Para plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra el
comportamiento real, como hooks, herramientas, comandos o flujos del proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores solo de metadatos para la planificación de activación y el descubrimiento de configuración;
no reemplazan el registro en tiempo de ejecución, `register(...)` ni `setupEntry`.

### Qué almacena en caché el cargador

OpenClaw mantiene cachés breves dentro del proceso para:

- resultados de descubrimiento
- datos del registro de manifiestos
- registros de plugins cargados

Estas cachés reducen picos de inicio y la sobrecarga de comandos repetidos. Es seguro
pensar en ellas como cachés de rendimiento de corta duración, no como persistencia.

Nota de rendimiento:

- Establece `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desactivar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los plugins cargados no mutan directamente variables globales aleatorias del núcleo. Se registran en un
registro central de plugins.

El registro realiza seguimiento de:

- registros de plugins (identidad, origen, procedencia, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- manejadores RPC del gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad del plugin

Luego, las funciones del núcleo leen de ese registro en lugar de hablar con módulos de plugins
directamente. Esto mantiene la carga en una sola dirección:

- módulo del plugin -> registro en el registro
- tiempo de ejecución del núcleo -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo
necesitan un punto de integración: “leer el registro”, no “hacer casos especiales para cada módulo
de plugin”.

## Callbacks de vinculación de conversaciones

Los plugins que vinculan una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de vinculación
sea aprobada o denegada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos de la carga útil del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: la vinculación resuelta para solicitudes aprobadas
- `request`: el resumen de la solicitud original, sugerencia de desvinculación, ID del remitente y
  metadatos de la conversación

Este callback es solo de notificación. No cambia quién tiene permiso para vincular una
conversación y se ejecuta después de que finaliza el manejo de aprobación del núcleo.

## Hooks de tiempo de ejecución del proveedor

Los plugins de proveedor ahora tienen dos capas:

- metadatos del manifiesto: `providerAuthEnvVars` para una búsqueda ligera de autenticación del proveedor por entorno
  antes de cargar el tiempo de ejecución, `providerAuthAliases` para variantes del proveedor que comparten
  autenticación, `channelEnvVars` para una búsqueda ligera de entorno/configuración del canal antes de cargar el tiempo de ejecución,
  además de `providerAuthChoices` para etiquetas ligeras de incorporación/elección de autenticación y
  metadatos de flags de CLI antes de cargar el tiempo de ejecución
- hooks en tiempo de configuración: `catalog` / `discovery` heredado más `applyConfigDefaults`
- hooks de tiempo de ejecución: `normalizeModelId`, `normalizeTransport`,
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

OpenClaw sigue poseyendo el bucle genérico del agente, el failover, el manejo de transcripciones y la
política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico del proveedor sin
necesitar un transporte de inferencia completamente personalizado.

Usa el `providerAuthEnvVars` del manifiesto cuando el proveedor tenga credenciales basadas en entorno
que las rutas genéricas de autenticación/estado/selector de modelo deban ver sin cargar el tiempo de ejecución del plugin.
Usa `providerAuthAliases` del manifiesto cuando un ID de proveedor deba reutilizar
las variables de entorno, perfiles de autenticación, autenticación respaldada por configuración y
la opción de incorporación de clave API de otro ID de proveedor. Usa `providerAuthChoices` del manifiesto cuando las
superficies de CLI de incorporación/elección de autenticación deban conocer el ID de elección del proveedor, las etiquetas de grupo
y la configuración simple de autenticación con un solo flag sin cargar el tiempo de ejecución del proveedor. Mantén `envVars` del tiempo de ejecución del proveedor para sugerencias orientadas al operador, como etiquetas de incorporación o variables
de configuración de client-id/client-secret de OAuth.

Usa `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración basada en entorno que
los prompts genéricos de fallback de entorno del shell, comprobaciones de configuración/estado o configuración deban ver
sin cargar el tiempo de ejecución del canal.

### Orden de hooks y uso

Para los plugins de modelo/proveedor, OpenClaw llama a los hooks aproximadamente en este orden.
La columna “Cuándo usar” es la guía rápida de decisión.

| #   | Hook                              | Qué hace                                                                                                       | Cuándo usar                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`           | El proveedor posee un catálogo o valores predeterminados de URL base                                                                       |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, del entorno o de la semántica de la familia de modelos del proveedor      |
| --  | _(built-in model lookup)_         | OpenClaw prueba primero la ruta normal de registro/catálogo                                                    | _(no es un hook de plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de ID de modelo antes de la búsqueda                               | El proveedor posee la limpieza de alias antes de la resolución del modelo canónico                                                         |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblado genérico del modelo              | El proveedor posee la limpieza del transporte para ID de proveedor personalizados en la misma familia de transporte                       |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución en tiempo de ejecución/del proveedor                  | El proveedor necesita limpieza de configuración que debe vivir con el plugin; los asistentes integrados de la familia Google también respaldan entradas de configuración de Google compatibles |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a proveedores de configuración                | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por endpoints                                       |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación con marcador de entorno para proveedores de configuración antes de cargar la autenticación de tiempo de ejecución | El proveedor tiene resolución de clave API con marcador de entorno propiedad del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcador de entorno AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/alojada por uno mismo o respaldada por configuración sin persistir texto sin formato | El proveedor puede operar con un marcador de credencial sintética/local                                                                    |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externa propiedad del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales propiedad de CLI/app | El proveedor reutiliza credenciales de autenticación externa sin persistir tokens de actualización copiados                               |
| 10  | `shouldDeferSyntheticProfileAuth` | Relega marcadores de posición sintéticos almacenados detrás de autenticación respaldada por entorno/configuración | El proveedor almacena perfiles sintéticos de marcador de posición que no deben ganar prioridad                                            |
| 11  | `resolveDynamicModel`             | Fallback síncrono para ID de modelo propiedad del proveedor que aún no están en el registro local             | El proveedor acepta ID de modelo arbitrarios del upstream                                                                                  |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` vuelve a ejecutarse                                      | El proveedor necesita metadatos de red antes de resolver ID desconocidos                                                                   |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el embedded runner use el modelo resuelto                                      | El proveedor necesita reescrituras de transporte pero sigue usando un transporte del núcleo                                               |
| 14  | `contributeResolvedModelCompat`   | Aporta flags de compatibilidad para modelos del proveedor detrás de otro transporte compatible                 | El proveedor reconoce sus propios modelos en transportes proxy sin asumir el control del proveedor                                        |
| 15  | `capabilities`                    | Metadatos de transcripción/herramientas propiedad del proveedor usados por la lógica compartida del núcleo    | El proveedor necesita particularidades de la transcripción o de la familia del proveedor                                                  |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el embedded runner los vea                                    | El proveedor necesita limpieza de esquemas de la familia de transporte                                                                     |
| 17  | `inspectToolSchemas`              | Expone diagnósticos de esquema propiedad del proveedor después de la normalización                             | El proveedor quiere advertencias de palabras clave sin enseñar al núcleo reglas específicas del proveedor                                 |
| 18  | `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo frente al etiquetado                                  | El proveedor necesita razonamiento etiquetado/salida final en lugar de campos nativos                                                     |
| 19  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los envoltorios genéricos de opciones de stream             | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                       |
| 20  | `createStreamFn`                  | Reemplaza por completo la ruta normal de stream con un transporte personalizado                               | El proveedor necesita un protocolo de cable personalizado, no solo un envoltorio                                                          |
| 21  | `wrapStreamFn`                    | Envoltorio del stream después de aplicar los envoltorios genéricos                                            | El proveedor necesita envoltorios de compatibilidad de encabezados/cuerpo/modelo de la solicitud sin un transporte personalizado         |
| 22  | `resolveTransportTurnState`       | Adjunta encabezados o metadatos nativos por turno al transporte                                               | El proveedor quiere que transportes genéricos envíen identidad de turno nativa del proveedor                                              |
| 23  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados nativos de WebSocket o política de enfriamiento de sesión                                 | El proveedor quiere que transportes WS genéricos ajusten encabezados de sesión o la política de fallback                                  |
| 24  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` de tiempo de ejecución | El proveedor almacena metadatos adicionales de autenticación y necesita una forma de token de tiempo de ejecución personalizada          |
| 25  | `refreshOAuth`                    | Sustitución de actualización de OAuth para endpoints de actualización personalizados o política de fallo de actualización | El proveedor no encaja con los refrescadores compartidos `pi-ai`                                                                           |
| 26  | `buildAuthDoctorHint`             | Sugerencia de reparación anexada cuando falla la actualización de OAuth                                       | El proveedor necesita orientación de reparación de autenticación propiedad del proveedor después de un fallo de actualización             |
| 27  | `matchesContextOverflowError`     | Comparador propiedad del proveedor para desbordamiento de ventana de contexto                                  | El proveedor tiene errores de desbordamiento sin procesar que la heurística genérica no detectaría                                       |
| 28  | `classifyFailoverReason`          | Clasificación de motivo de failover propiedad del proveedor                                                   | El proveedor puede mapear errores sin procesar de API/transporte a límite de tasa/sobrecarga/etc.                                         |
| 29  | `isCacheTtlEligible`              | Política de caché de prompt para proveedores proxy/backhaul                                                   | El proveedor necesita control específico del proxy para TTL de caché                                                                       |
| 30  | `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por autenticación faltante                                   | El proveedor necesita una sugerencia específica del proveedor para recuperar autenticación faltante                                        |
| 31  | `suppressBuiltInModel`            | Supresión de modelos upstream obsoletos más una sugerencia opcional de error orientada al usuario            | El proveedor necesita ocultar filas upstream obsoletas o reemplazarlas por una sugerencia del proveedor                                   |
| 32  | `augmentModelCatalog`             | Filas de catálogo sintéticas/finales agregadas después del descubrimiento                                     | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                             |
| 33  | `isBinaryThinking`                | Alternancia de razonamiento activado/desactivado para proveedores de pensamiento binario                      | El proveedor expone solo pensamiento binario activado/desactivado                                                                          |
| 34  | `supportsXHighThinking`           | Compatibilidad con razonamiento `xhigh` para modelos seleccionados                                            | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                             |
| 35  | `resolveDefaultThinkingLevel`     | Nivel `/think` predeterminado para una familia de modelos específica                                          | El proveedor posee la política predeterminada de `/think` para una familia de modelos                                                     |
| 36  | `isModernModelRef`                | Comparador de modelos modernos para filtros de perfiles activos y selección de smoke                          | El proveedor posee la coincidencia de modelos preferidos para live/smoke                                                                   |
| 37  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de tiempo de ejecución justo antes de la inferencia | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                             |
| 38  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies relacionadas de estado                   | El proveedor necesita análisis personalizado de tokens de uso/cuota o una credencial de uso diferente                                      |
| 39  | `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación  | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de carga útil                                            |
| 40  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                             | El comportamiento de embeddings para memoria pertenece al plugin del proveedor                                                              |
| 41  | `buildReplayPolicy`               | Devuelve una política de replay que controla el manejo de transcripciones para el proveedor                    | El proveedor necesita una política personalizada de transcripciones (por ejemplo, eliminación de bloques de razonamiento)                  |
| 42  | `sanitizeReplayHistory`           | Reescribe el historial de replay después de la limpieza genérica de transcripciones                            | El proveedor necesita reescrituras de replay específicas del proveedor además de los asistentes compartidos de compactación                |
| 43  | `validateReplayTurns`             | Validación final o remodelado de turnos de replay antes del embedded runner                                    | El transporte del proveedor necesita una validación de turnos más estricta después de la sanitización genérica                            |
| 44  | `onModelSelected`                 | Ejecuta efectos secundarios posteriores a la selección propiedad del proveedor                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo pasa a estar activo                                     |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
plugin de proveedor coincidente y luego continúan con otros plugins de proveedor con capacidad de hook
hasta que uno cambie realmente el ID del modelo o el transporte/la configuración. Eso mantiene funcionando
los shims de alias/compatibilidad del proveedor sin exigir que quien llama sepa qué
plugin integrado posee la reescritura. Si ningún hook de proveedor reescribe una entrada de configuración compatible
de la familia Google, el normalizador de configuración integrado de Google sigue aplicando
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable completamente personalizado o un ejecutor de solicitudes personalizado,
esa es otra clase de extensión. Estos hooks son para comportamiento del proveedor que
sigue ejecutándose en el bucle normal de inferencia de OpenClaw.

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
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  y `wrapStreamFn` porque posee la compatibilidad futura de Claude 4.6,
  sugerencias de familia del proveedor, orientación para reparación de autenticación, integración de endpoint de uso,
  elegibilidad de caché de prompt, valores predeterminados de configuración conscientes de la autenticación, política predeterminada/adaptativa de pensamiento de Claude y modelado de stream específico de Anthropic para
  encabezados beta, `/fast` / `serviceTier` y `context1m`.
- Los asistentes de stream específicos de Claude de Anthropic permanecen por ahora en la propia unión pública
  `api.ts` / `contract-api.ts` del plugin integrado. Esa superficie del paquete
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los constructores de envoltorios de Anthropic de nivel inferior, en lugar de ampliar el SDK genérico en torno a las reglas de encabezados beta de un único
  proveedor.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` y
  `capabilities` además de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  porque posee la compatibilidad futura de GPT-5.4, la normalización directa de OpenAI
  `openai-completions` -> `openai-responses`, sugerencias de autenticación compatibles con Codex,
  la supresión de Spark, filas sintéticas de lista OpenAI y la política de pensamiento/modelo activo de GPT-5; la familia de stream `openai-responses-defaults` posee los envoltorios nativos compartidos de OpenAI Responses para
  encabezados de atribución,
  `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex,
  modelado de carga útil de compatibilidad de razonamiento y gestión de contexto de Responses.
- OpenRouter usa `catalog` además de `resolveDynamicModel` y
  `prepareDynamicModel` porque el proveedor es de paso y puede exponer nuevos
  ID de modelo antes de que se actualice el catálogo estático de OpenClaw; también usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para mantener
  fuera del núcleo los encabezados de solicitud específicos del proveedor, metadatos de enrutamiento, parches de razonamiento y la política de caché de prompt. Su política de replay proviene de la
  familia `passthrough-gemini`, mientras que la familia de stream `openrouter-thinking`
  posee la inyección de razonamiento de proxy y los saltos de modelo no compatible / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` y
  `capabilities` además de `prepareRuntimeAuth` y `fetchUsageSnapshot` porque
  necesita inicio de sesión de dispositivo propiedad del proveedor, comportamiento de fallback de modelo, particularidades de transcripción de Claude, un intercambio de token de GitHub -> token de Copilot y un endpoint de uso propiedad del proveedor.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` y `augmentModelCatalog` además de
  `prepareExtraParams`, `resolveUsageAuth` y `fetchUsageSnapshot` porque
  sigue ejecutándose en transportes OpenAI del núcleo, pero posee su normalización de transporte/URL base,
  política de fallback de actualización OAuth, elección de transporte predeterminada,
  filas sintéticas de catálogo de Codex e integración del endpoint de uso de ChatGPT; comparte la misma familia de stream `openai-responses-defaults` que OpenAI directo.
- Google AI Studio y Gemini CLI OAuth usan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque la
  familia de replay `google-gemini` posee el fallback de compatibilidad futura de Gemini 3.1,
  validación nativa de replay de Gemini, saneamiento de replay de arranque, modo de
  salida de razonamiento etiquetado y coincidencia de modelos modernos, mientras que la
  familia de stream `google-thinking` posee la normalización de carga útil de pensamiento de Gemini;
  Gemini CLI OAuth también usa `formatApiKey`, `resolveUsageAuth` y
  `fetchUsageSnapshot` para formateo de tokens, análisis de tokens y conexión del endpoint de cuota.
- Anthropic Vertex usa `buildReplayPolicy` mediante la
  familia de replay `anthropic-by-model` para que la limpieza de replay específica de Claude permanezca
  limitada a los ID de Claude en lugar de a todo transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` y `resolveDefaultThinkingLevel` porque posee la clasificación específica de Bedrock para errores de limitación/no listo/desbordamiento de contexto
  en tráfico Anthropic sobre Bedrock; su política de replay sigue compartiendo la misma protección
  solo para Claude de `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode y Opencode Go usan `buildReplayPolicy`
  mediante la familia de replay `passthrough-gemini` porque proxifican modelos Gemini
  a través de transportes compatibles con OpenAI y necesitan saneamiento de
  firma de pensamiento de Gemini sin validación nativa de replay de Gemini ni reescrituras de arranque.
- MiniMax usa `buildReplayPolicy` mediante la
  familia de replay `hybrid-anthropic-openai` porque un proveedor posee tanto semántica
  de mensajes Anthropic como semántica compatible con OpenAI; mantiene
  la eliminación de bloques de pensamiento solo de Claude en el lado Anthropic mientras sustituye el modo de
  salida de razonamiento de vuelta a nativo, y la familia de stream `minimax-fast-mode` posee reescrituras de modelo en modo rápido en la ruta de stream compartida.
- Moonshot usa `catalog` además de `wrapStreamFn` porque sigue usando el
  transporte compartido de OpenAI, pero necesita normalización de carga útil de pensamiento propiedad del proveedor; la familia de stream `moonshot-thinking` mapea configuración más estado de `/think` en su carga útil nativa de pensamiento binario.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque necesita encabezados de solicitud propiedad del proveedor,
  normalización de carga útil de razonamiento, sugerencias de transcripción de Gemini y control de TTL de caché de Anthropic; la familia de stream `kilocode-thinking` mantiene la inyección del pensamiento Kilo en la ruta de stream proxy compartida mientras omite `kilo/auto` y
  otros ID de modelo proxy que no admiten cargas útiles explícitas de razonamiento.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` y `fetchUsageSnapshot` porque posee el fallback de GLM-5,
  los valores predeterminados de `tool_stream`, la UX de pensamiento binario, la coincidencia de modelos modernos y tanto la autenticación de uso como la obtención de cuota; la familia de stream `tool-stream-default-on` mantiene el envoltorio predeterminado activado de `tool_stream` fuera del código manual por proveedor.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque posee la normalización nativa del transporte xAI Responses, reescrituras de alias de modo rápido de Grok, `tool_stream` predeterminado, limpieza estricta de herramientas / carga útil de razonamiento, reutilización de autenticación fallback para herramientas propiedad del plugin, resolución de modelos Grok con compatibilidad futura y parches de compatibilidad propiedad del proveedor como el perfil de esquema de herramientas de xAI,
  palabras clave de esquema no compatibles, `web_search` nativo y decodificación de argumentos de llamadas de herramientas con entidades HTML.
- Mistral, OpenCode Zen y OpenCode Go usan solo `capabilities` para mantener las particularidades de transcripción/herramientas fuera del núcleo.
- Los proveedores integrados solo de catálogo como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` y `volcengine` usan
  solo `catalog`.
- Qwen usa `catalog` para su proveedor de texto además de registros compartidos de comprensión de medios y generación de video para sus superficies multimodales.
- MiniMax y Xiaomi usan `catalog` además de hooks de uso porque su comportamiento de `/usage`
  es propiedad del plugin aunque la inferencia siga ejecutándose mediante transportes compartidos.

## Asistentes de tiempo de ejecución

Los plugins pueden acceder a asistentes seleccionados del núcleo mediante `api.runtime`. Para TTS:

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
- Usa la configuración central `messages.tts` y la selección del proveedor.
- Devuelve un búfer de audio PCM + frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos, como configuraciones regionales, género y etiquetas de personalidad para selectores conscientes del proveedor.
- OpenAI y ElevenLabs son compatibles con telefonía hoy. Microsoft no.

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

- Mantén la política de TTS, el fallback y la entrega de respuestas en el núcleo.
- Usa proveedores de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al ID de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un proveedor puede poseer
  proveedores de texto, voz, imágenes y medios futuros a medida que OpenClaw agrega esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los plugins registran un único proveedor tipado de
comprensión de medios en lugar de una bolsa genérica de clave/valor:

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

- Mantén la orquestación, el fallback, la configuración y la conexión de canales en el núcleo.
- Mantén el comportamiento del proveedor en el plugin del proveedor.
- La expansión aditiva debe seguir siendo tipada: nuevos métodos opcionales, nuevos campos
  opcionales de resultado, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo posee el contrato de capacidad y el asistente de tiempo de ejecución
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para los asistentes de tiempo de ejecución de comprensión de medios, los plugins pueden llamar a:

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

Para la transcripción de audio, los plugins pueden usar el tiempo de ejecución de comprensión de medios
o el alias STT anterior:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional cuando no se puede inferir el MIME de forma fiable:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` es la superficie compartida preferida para
  comprensión de imagen/audio/video.
- Usa la configuración central de audio de comprensión de medios (`tools.media.audio`) y el orden de fallback del proveedor.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida o no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidad.

Los plugins también pueden iniciar ejecuciones de subagentes en segundo plano mediante `api.runtime.subagent`:

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
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir plugins de confianza a objetivos canónicos `provider/model` específicos, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagentes de plugins no confiables siguen funcionando, pero las solicitudes de sustitución se rechazan en lugar de aplicar un fallback silencioso.

Para búsqueda web, los plugins pueden consumir el asistente compartido de tiempo de ejecución en lugar de
acceder directamente a la conexión de herramientas del agente:

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

- Mantén en el núcleo la selección de proveedor, resolución de credenciales y semántica compartida de solicitudes.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de función/canal que necesitan comportamiento de búsqueda sin depender del envoltorio de herramientas del agente.

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
- `listProviders(...)`: enumera los proveedores disponibles de generación de imágenes y sus capacidades.

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

- `path`: ruta bajo el servidor HTTP del gateway.
- `auth`: obligatorio. Usa `"gateway"` para requerir autenticación normal del gateway, o `"plugin"` para autenticación administrada por el plugin/verificación de webhook.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta haya manejado la solicitud.

Notas:

- `api.registerHttpHandler(...)` fue eliminado y provocará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de plugins deben declarar `auth` de forma explícita.
- Los conflictos exactos de `path + match` se rechazan a menos que `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Las rutas superpuestas con distintos niveles de `auth` se rechazan. Mantén las cadenas de caída `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas con `auth: "plugin"` **no** reciben automáticamente ámbitos de tiempo de ejecución del operador. Son para webhooks/verificación de firmas administrados por el plugin, no para llamadas privilegiadas a asistentes del Gateway.
- Las rutas con `auth: "gateway"` se ejecutan dentro de un ámbito de tiempo de ejecución de solicitud del Gateway, pero ese ámbito es intencionalmente conservador:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los ámbitos de tiempo de ejecución de las rutas del plugin fijados en `operator.write`, incluso si quien llama envía `x-openclaw-scopes`
  - los modos HTTP confiables con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingreso privado) respetan `x-openclaw-scopes` solo cuando el encabezado está presente explícitamente
  - si `x-openclaw-scopes` no está presente en esas solicitudes de rutas de plugin con identidad, el ámbito de tiempo de ejecución vuelve a `operator.write`
- Regla práctica: no asumas que una ruta de plugin autenticada por gateway es una superficie implícita de administración. Si tu ruta necesita comportamiento exclusivo de administrador, exige un modo de autenticación con identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

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
  `openclaw/plugin-sdk/webhook-ingress` para la conexión compartida de
  configuración/autenticación/respuesta/webhook.
  `channel-inbound` es el hogar compartido para debounce, coincidencia de menciones,
  asistentes de política de menciones entrantes, formato de envolturas y asistentes de contexto
  de envolturas entrantes.
  `channel-setup` es la unión limitada de configuración de instalación opcional.
  `setup-runtime` es la superficie de configuración segura para tiempo de ejecución usada por `setupEntry` /
  inicio diferido, incluidos los adaptadores de parche de configuración seguros para importación.
  `setup-adapter-runtime` es la unión del adaptador de configuración de cuentas consciente del entorno.
  `setup-tools` es la unión pequeña de asistentes para CLI/archivos/documentación (`formatCliCommand`,
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
  `openclaw/plugin-sdk/directory-runtime` para asistentes compartidos de tiempo de ejecución/configuración.
  `telegram-command-config` es la unión pública limitada para normalización/validación de comandos personalizados de Telegram y sigue estando disponible incluso si la superficie de contrato integrada de Telegram no está disponible temporalmente.
  `text-runtime` es la unión compartida de texto/Markdown/logging, incluida la eliminación de texto visible para el asistente, asistentes de renderizado/fragmentación de Markdown, asistentes de redacción, asistentes de etiquetas de directiva y utilidades de texto seguro.
- Las uniones de canal específicas de aprobación deben preferir un solo contrato
  `approvalCapability` en el plugin. Luego el núcleo lee autenticación, entrega, renderizado,
  enrutamiento nativo y comportamiento diferido del manejador nativo a través de esa única capacidad
  en lugar de mezclar comportamiento de aprobación en campos no relacionados del plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto y permanece solo como una
  unión de compatibilidad para plugins antiguos. El código nuevo debe importar las primitivas genéricas más limitadas, y el código del repositorio no debe agregar nuevas importaciones de esta unión.
- Los elementos internos de extensiones integradas siguen siendo privados. Los plugins externos deben usar solo subrutas `openclaw/plugin-sdk/*`. El código principal/de pruebas de OpenClaw puede usar los
  puntos de entrada públicos del repositorio bajo la raíz de un paquete de plugin como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` y archivos de alcance limitado como
  `login-qr-api.js`. Nunca importes `src/*` de un paquete de plugin desde el núcleo ni desde
  otra extensión.
- División de puntos de entrada del repositorio:
  `<plugin-package-root>/api.js` es el barril de asistentes/tipos,
  `<plugin-package-root>/runtime-api.js` es el barril solo de tiempo de ejecución,
  `<plugin-package-root>/index.js` es el punto de entrada del plugin integrado
  y `<plugin-package-root>/setup-entry.js` es el punto de entrada del plugin de configuración.
- Ejemplos actuales de proveedores integrados:
  - Anthropic usa `api.js` / `contract-api.js` para asistentes de stream de Claude como
    `wrapAnthropicProviderStream`, asistentes de encabezados beta y análisis de `service_tier`.
  - OpenAI usa `api.js` para constructores de proveedores, asistentes de modelo predeterminado y
    constructores de proveedores en tiempo real.
  - OpenRouter usa `api.js` para su constructor de proveedor más asistentes de incorporación/configuración,
    mientras que `register.runtime.js` todavía puede reexportar asistentes genéricos
    `plugin-sdk/provider-stream` para uso local del repositorio.
- Los puntos de entrada públicos cargados mediante fachada prefieren la instantánea de configuración activa del tiempo de ejecución
  cuando existe y luego recurren al archivo de configuración resuelto en disco cuando
  OpenClaw aún no está sirviendo una instantánea de tiempo de ejecución.
- Las primitivas genéricas compartidas siguen siendo el contrato público preferido del SDK. Todavía existe un pequeño conjunto reservado
  de compatibilidad de uniones auxiliares con marca de canal integrado. Trátalas como
  uniones de mantenimiento/compatibilidad integradas, no como nuevos objetivos de importación de terceros; los nuevos contratos entre canales deben seguir aterrizando en subrutas genéricas `plugin-sdk/*` o en los barriles locales del plugin `api.js` /
  `runtime-api.js`.

Nota de compatibilidad:

- Evita el barril raíz `openclaw/plugin-sdk` en código nuevo.
- Prefiere primero las primitivas estables y limitadas. Las subrutas más nuevas de configuración/emparejamiento/respuesta/
  feedback/contrato/entrada/threading/comando/secret-input/webhook/infra/
  allowlist/status/message-tool son el contrato previsto para trabajo nuevo
  de plugins integrados y externos.
  El análisis/coincidencia de objetivos pertenece a `openclaw/plugin-sdk/channel-targets`.
  Las compuertas de acciones de mensaje y los asistentes de ID de mensaje de reacciones pertenecen a
  `openclaw/plugin-sdk/channel-actions`.
- Los barriles de asistentes específicos de extensiones integradas no son estables de forma predeterminada. Si un
  asistente solo es necesario para una extensión integrada, mantenlo detrás de la
  unión local `api.js` o `runtime-api.js` de la extensión en lugar de promoverlo a
  `openclaw/plugin-sdk/<extension>`.
- Las nuevas uniones de asistentes compartidos deben ser genéricas, no con marca de canal. El análisis de objetivos compartidos
  pertenece a `openclaw/plugin-sdk/channel-targets`; los elementos internos específicos del canal permanecen detrás de la unión local `api.js` o `runtime-api.js`
  del plugin propietario.
- Existen subrutas específicas de capacidad como `image-generation`,
  `media-understanding` y `speech` porque los plugins nativos/integrados
  las usan hoy. Su presencia no significa por sí sola que cada asistente exportado sea un contrato externo congelado a largo plazo.

## Esquemas de la herramienta de mensajes

Los plugins deben poseer contribuciones al esquema específico del canal en `describeMessageTool(...)`.
Mantén los campos específicos del proveedor en el plugin, no en el núcleo compartido.

Para fragmentos de esquema portátiles compartidos, reutiliza los asistentes genéricos exportados a través de
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para cargas útiles de estilo cuadrícula de botones
- `createMessageToolCardSchema()` para cargas útiles estructuradas de tarjetas

Si una forma de esquema solo tiene sentido para un proveedor, defínela en el
propio código fuente de ese plugin en lugar de promoverla al SDK compartido.

## Resolución de objetivos de canal

Los plugins de canal deben poseer la semántica específica del canal para objetivos. Mantén genérico el
host compartido de salida y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un objetivo normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` le indica al núcleo si una
  entrada debe saltar directamente a resolución tipo ID en lugar de búsqueda en directorio.
- `messaging.targetResolver.resolveTarget(...)` es el fallback del plugin cuando
  el núcleo necesita una resolución final propiedad del proveedor después de la normalización o
  después de un fallo de búsqueda en directorio.
- `messaging.resolveOutboundSessionRoute(...)` posee la construcción específica del proveedor de la
  ruta de sesión de salida una vez resuelto un objetivo.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deban ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de “tratar esto como un ID de objetivo explícito/nativo”.
- Usa `resolveTarget` para fallback de normalización específico del proveedor, no para
  búsqueda amplia en directorio.
- Mantén ID nativos del proveedor como ID de chat, ID de hilo, JID, handles e ID de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio a partir de la configuración deben mantener esa lógica en el
plugin y reutilizar los asistentes compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Úsalo cuando un canal necesite pares/grupos respaldados por configuración como:

- pares DM controlados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de directorio con alcance por cuenta

Los asistentes compartidos en `directory-runtime` solo manejan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- asistentes de desduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas específica del canal y la normalización de ID deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el plugin posea ID de modelo específicos del proveedor, valores predeterminados de URL base o metadatos de modelo protegidos por autenticación.

`catalog.order` controla cuándo se combina el catálogo de un plugin con respecto a los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples impulsados por clave API o entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en caso de colisión de clave, por lo que los plugins pueden sobrescribir intencionalmente una entrada integrada de proveedor con el mismo ID de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`

## Inspección de canal de solo lectura

Si tu plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de tiempo de ejecución. Puede asumir que las credenciales
  están completamente materializadas y puede fallar rápido cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de reparación de doctor/configuración
  no deberían necesitar materializar credenciales de tiempo de ejecución solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo el estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando sea relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores sin procesar del token solo para informar disponibilidad de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen correspondiente) es suficiente para comandos de estilo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen “configurado pero no disponible en esta ruta de comando” en lugar de fallar o informar incorrectamente que la cuenta no está configurada.

## Paquetes agrupados

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

Cada entrada se convierte en un plugin. Si el paquete enumera varias extensiones, el ID del plugin
pasa a ser `name/<fileBase>`.

Si tu plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Compuerta de seguridad: cada entrada de `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de la resolución de symlinks. Las entradas que escapen del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias de plugins con
`npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida y sin dependencias de desarrollo en tiempo de ejecución). Mantén los árboles de dependencias de plugins como “pure JS/TS” y evita paquetes que requieran compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún no configurado, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto mantiene el inicio y la configuración más ligeros
cuando la entrada principal del plugin también conecta herramientas, hooks u otro código exclusivo de tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede incorporar un plugin de canal a la misma ruta `setupEntry` durante la fase de
inicio previa a escucha del gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra completamente la superficie de inicio que debe existir
antes de que el gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar cada capacidad propiedad del canal de la que dependa el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway empiece a escuchar
- cualquier método del gateway, herramienta o servicio que deba existir durante esa misma ventana

Si tu entrada completa sigue poseyendo alguna capacidad de inicio requerida, no habilites
este flag. Mantén el comportamiento predeterminado del plugin y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales integrados también pueden publicar asistentes de superficie de contrato solo de configuración que el núcleo
puede consultar antes de que se cargue el tiempo de ejecución completo del canal. La superficie actual
de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración heredada de canal de cuenta única
a `channels.<id>.accounts.*` sin cargar la entrada completa del plugin.
Matrix es el ejemplo integrado actual: mueve solo claves de autenticación/arranque a una
cuenta promocionada con nombre cuando ya existen cuentas con nombre, y puede preservar una
clave configurada de cuenta predeterminada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parche de configuración mantienen diferido el descubrimiento de superficies de contrato integradas. El tiempo
de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de reingresar al inicio del canal integrado durante la importación del módulo.

Cuando esas superficies de inicio incluyen métodos RPC del gateway, mantenlos en un
prefijo específico del plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen reservados y siempre se resuelven
a `operator.admin`, incluso si un plugin solicita un ámbito más limitado.

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

### Metadatos de catálogo de canal

Los plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
sugerencias de instalación mediante `openclaw.install`. Esto mantiene el núcleo sin datos de catálogo.

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
      "blurb": "Chat autoalojado mediante bots de webhook de Nextcloud Talk.",
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

Campos útiles de `openclaw.channel` además del ejemplo mínimo:

- `detailLabel`: etiqueta secundaria para superficies más ricas de catálogo/estado
- `docsLabel`: reemplaza el texto del enlace de documentación
- `preferOver`: ID de plugin/canal de menor prioridad que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto para superficies de selección
- `markdownCapable`: marca el canal como compatible con Markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados todavía aceptados por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: incorpora el canal al flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver objetivos de anuncio

OpenClaw también puede combinar **catálogos de canales externos** (por ejemplo, una exportación de registro MPM).
Coloca un archivo JSON en una de estas ubicaciones:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o más archivos JSON (delimitados por coma/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados para la clave `"entries"`.

## Plugins del motor de contexto

Los plugins del motor de contexto poseen la orquestación del contexto de sesión para ingesta, ensamblaje
y compactación. Regístralos desde tu plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Usa esto cuando tu plugin necesite reemplazar o extender la canalización de contexto predeterminada
en lugar de solo agregar búsqueda de memoria o hooks.

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

Si tu motor **no** posee el algoritmo de compactación, mantén `compact()`
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
el sistema de plugins con un acceso privado. Agrega la capacidad faltante.

Secuencia recomendada:

1. definir el contrato del núcleo
   Decide qué comportamiento compartido debe poseer el núcleo: política, fallback, combinación de configuración,
   ciclo de vida, semántica orientada a canales y forma del asistente de tiempo de ejecución.
2. agregar superficies tipadas de registro/tiempo de ejecución para plugins
   Extiende `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada de capacidad
   más pequeña que sea útil.
3. conectar consumidores del núcleo + canal/función
   Los canales y plugins de función deben consumir la nueva capacidad a través del núcleo,
   no importando directamente una implementación de proveedor.
4. registrar implementaciones de proveedor
   Los plugins de proveedor registran luego sus backends contra la capacidad.
5. agregar cobertura de contrato
   Agrega pruebas para que la forma de propiedad y registro siga siendo explícita con el tiempo.

Así es como OpenClaw sigue siendo opinado sin quedar codificado rígidamente a la
visión del mundo de un solo proveedor. Consulta el [Recetario de capacidades](/es/plugins/architecture)
para ver una lista concreta de archivos y un ejemplo desarrollado.

### Lista de comprobación de capacidades

Cuando agregas una nueva capacidad, la implementación normalmente debe tocar estas
superficies de forma conjunta:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- asistente de runner/tiempo de ejecución del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- conexión del registro de plugins en `src/plugins/registry.ts`
- exposición del tiempo de ejecución del plugin en `src/plugins/runtime/*` cuando los
  plugins de función/canal necesitan consumirla
- asistentes de captura/prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores/plugins en `docs/`

Si falta una de esas superficies, normalmente es una señal de que la capacidad
aún no está completamente integrada.

### Plantilla de capacidad

Patrón mínimo:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
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

- el núcleo posee el contrato de capacidad + la orquestación
- los plugins de proveedor poseen las implementaciones del proveedor
- los plugins de función/canal consumen asistentes de tiempo de ejecución
- las pruebas de contrato mantienen explícita la propiedad
