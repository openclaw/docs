---
read_when:
    - Compilar o depurar plugins nativos de OpenClaw
    - Comprender el modelo de capacidades del plugin o los límites de propiedad
    - Trabajar en la canalización de carga o el registro del plugin
    - Implementar hooks de tiempo de ejecución del proveedor o plugins de canal
sidebarTitle: Internals
summary: 'Internos del Plugin: modelo de capacidades, propiedad, contratos, canalización de carga y auxiliares de tiempo de ejecución'
title: Internos del Plugin
x-i18n:
    generated_at: "2026-04-15T05:11:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86798b5d2b0ad82d2397a52a6c21ed37fe6eee1dd3d124a9e4150c4f630b841
    source_path: plugins/architecture.md
    workflow: 15
---

# Internos del Plugin

<Info>
  Esta es la **referencia profunda de arquitectura**. Para guías prácticas, consulta:
  - [Instalar y usar plugins](/es/tools/plugin) — guía de usuario
  - [Primeros pasos](/es/plugins/building-plugins) — primer tutorial de plugins
  - [Plugins de canal](/es/plugins/sdk-channel-plugins) — crea un canal de mensajería
  - [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crea un proveedor de modelos
  - [Descripción general del SDK](/es/plugins/sdk-overview) — mapa de importación y API de registro
</Info>

Esta página cubre la arquitectura interna del sistema de plugins de OpenClaw.

## Modelo público de capacidades

Las capacidades son el modelo público de **plugin nativo** dentro de OpenClaw. Cada
plugin nativo de OpenClaw se registra en uno o más tipos de capacidad:

| Capacidad             | Método de registro                              | Plugins de ejemplo                   |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferencia de texto   | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend de inferencia de CLI | `api.registerCliBackend(...)`           | `openai`, `anthropic`                |
| Voz                   | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                      |
| Voz en tiempo real    | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Comprensión de medios | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Generación de música  | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Generación de video   | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Obtención web         | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Búsqueda web          | `api.registerWebSearchProvider(...)`            | `google`                             |
| Canal / mensajería    | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Un plugin que registra cero capacidades pero proporciona hooks, herramientas o
servicios es un plugin **heredado solo de hooks**. Ese patrón sigue siendo totalmente compatible.

### Postura de compatibilidad externa

El modelo de capacidades ya está integrado en el core y lo usan los plugins
nativos/incluidos hoy, pero la compatibilidad con plugins externos todavía
necesita un criterio más estricto que “si está exportado, entonces está congelado”.

Guía actual:

- **plugins externos existentes:** mantén funcionando las integraciones basadas en hooks; trata
  esto como la base de compatibilidad
- **nuevos plugins nativos/incluidos:** prefiere el registro explícito de capacidades antes que
  accesos específicos de proveedor o nuevos diseños solo de hooks
- **plugins externos que adopten registro de capacidades:** permitido, pero trata las
  superficies auxiliares específicas de capacidad como algo en evolución, salvo que la documentación marque
  explícitamente un contrato como estable

Regla práctica:

- las APIs de registro de capacidades son la dirección prevista
- los hooks heredados siguen siendo la ruta más segura para evitar rupturas en plugins externos durante
  la transición
- no todas las subrutas auxiliares exportadas son equivalentes; prefiere el contrato
  estrecho y documentado, no las exportaciones auxiliares incidentales

### Formas de plugin

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real
de registro (no solo por metadatos estáticos):

- **plain-capability** -- registra exactamente un tipo de capacidad (por ejemplo, un
  plugin solo de proveedor como `mistral`)
- **hybrid-capability** -- registra varios tipos de capacidad (por ejemplo,
  `openai` posee inferencia de texto, voz, comprensión de medios y generación
  de imágenes)
- **hook-only** -- registra solo hooks (tipados o personalizados), sin capacidades,
  herramientas, comandos ni servicios
- **non-capability** -- registra herramientas, comandos, servicios o rutas, pero no
  capacidades

Usa `openclaw plugins inspect <id>` para ver la forma y el desglose de capacidades
de un plugin. Consulta la [referencia de CLI](/cli/plugins#inspect) para más detalles.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como ruta de compatibilidad para
plugins solo de hooks. Los plugins heredados del mundo real todavía dependen de él.

Dirección:

- mantenerlo funcionando
- documentarlo como heredado
- preferir `before_model_resolve` para trabajo de sustitución de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación de prompts
- eliminarlo solo cuando el uso real disminuya y la cobertura de fixtures demuestre que la migración es segura

### Señales de compatibilidad

Cuando ejecutes `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver
una de estas etiquetas:

| Señal                     | Significado                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configuración se analiza correctamente y los plugins se resuelven |
| **compatibility advisory** | El plugin usa un patrón compatible pero más antiguo (p. ej. `hook-only`) |
| **legacy warning**        | El plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**            | La configuración es inválida o el plugin no se pudo cargar   |

Ni `hook-only` ni `before_agent_start` romperán tu plugin hoy --
`hook-only` es una recomendación, y `before_agent_start` solo activa una advertencia. Estas
señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Descripción general de la arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

1. **Manifiesto + descubrimiento**
   OpenClaw encuentra plugins candidatos desde rutas configuradas, raíces del espacio de trabajo,
   raíces globales de extensiones y extensiones incluidas. El descubrimiento lee primero
   los manifiestos nativos `openclaw.plugin.json` además de los manifiestos de bundles compatibles.
2. **Habilitación + validación**
   El core decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o
   seleccionado para una ranura exclusiva como memory.
3. **Carga en tiempo de ejecución**
   Los plugins nativos de OpenClaw se cargan en proceso mediante jiti y registran
   capacidades en un registro central. Los bundles compatibles se normalizan en
   registros del registro sin importar código de tiempo de ejecución.
4. **Consumo de superficies**
   El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración
   de proveedores, hooks, rutas HTTP, comandos de CLI y servicios.

En el caso específico del CLI de plugins, el descubrimiento del comando raíz se divide en dos fases:

- los metadatos en tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo real de CLI del plugin puede permanecer diferido y registrarse en la primera invocación

Eso mantiene el código de CLI propiedad del plugin dentro del plugin, a la vez que permite a OpenClaw
reservar nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- el descubrimiento + la validación de configuración deben funcionar a partir de **metadatos de manifiesto/esquema**
  sin ejecutar código del plugin
- el comportamiento nativo en tiempo de ejecución proviene de la ruta `register(api)` del módulo del plugin

Esa separación permite a OpenClaw validar la configuración, explicar plugins faltantes o deshabilitados y
construir pistas de UI/esquema antes de que el tiempo de ejecución completo esté activo.

### Plugins de canal y la herramienta compartida de mensajes

Los plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para
acciones normales de chat. OpenClaw mantiene una única herramienta compartida `message` en el core, y
los plugins de canal son propietarios del descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el core es propietario del host de la herramienta compartida `message`, del cableado de prompts, del
  mantenimiento de sesiones/hilos y del despacho de ejecución
- los plugins de canal son propietarios del descubrimiento de acciones acotadas, del descubrimiento de capacidades
  y de cualquier fragmento de esquema específico del canal
- los plugins de canal son propietarios de la gramática de conversación de sesión específica del proveedor, como
  la forma en que los id de conversación codifican id de hilos o heredan de conversaciones padre
- los plugins de canal ejecutan la acción final a través de su adaptador de acciones

Para los plugins de canal, la superficie del SDK es
`ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada unificada de descubrimiento
permite que un plugin devuelva sus acciones visibles, capacidades y contribuciones al esquema
juntas, para que esas piezas no se desincronicen.

Cuando un parámetro específico del canal de la herramienta de mensajes lleva una fuente de medios, como una
ruta local o una URL de medios remotos, el plugin también debe devolver
`mediaSourceParams` desde `describeMessageTool(...)`. El core usa esa lista explícita
para aplicar normalización de rutas del sandbox y pistas de acceso a medios salientes
sin codificar nombres de parámetros propiedad del plugin.
Prefiere mapas acotados por acción allí, no una lista plana para todo el canal, para que un
parámetro de medios solo de perfil no se normalice en acciones no relacionadas como
`send`.

El core pasa el alcance de tiempo de ejecución a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` de entrada confiable

Esto importa para plugins sensibles al contexto. Un canal puede ocultar o exponer
acciones de mensajes en función de la cuenta activa, la sala/hilo/mensaje actual o la
identidad confiable del solicitante sin codificar ramas específicas del canal en la
herramienta `message` del core.

Por eso los cambios de enrutamiento del ejecutor incrustado siguen siendo trabajo del plugin: el ejecutor es
responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del plugin para que la
herramienta compartida `message` exponga la superficie correcta propiedad del canal para el turno actual.

Para los auxiliares de ejecución propiedad del canal, los plugins incluidos deben mantener el tiempo de ejecución de
ejecución dentro de sus propios módulos de extensión. El core ya no es propietario de los
tiempos de ejecución de acciones de mensajes de Discord, Slack, Telegram o WhatsApp en `src/agents/tools`.
No publicamos subrutas `plugin-sdk/*-action-runtime` separadas, y los plugins incluidos
deben importar su propio código local de tiempo de ejecución directamente desde sus
módulos propiedad de la extensión.

El mismo límite se aplica a las costuras del SDK con nombre de proveedor en general: el core no
debe importar barriles de conveniencia específicos de canal para las extensiones de Slack, Discord, Signal,
WhatsApp o similares. Si el core necesita un comportamiento, debe consumir el propio barril
`api.ts` / `runtime-api.ts` del plugin incluido, o promover esa necesidad a una capacidad genérica
estrecha en el SDK compartido.

En el caso específico de las encuestas, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para canales que encajan en el modelo común
  de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semánticas de encuesta específicas del canal
  o parámetros de encuesta adicionales

El core ahora difiere el análisis compartido de encuestas hasta después de que el despacho de encuestas del plugin rechace
la acción, de modo que los controladores de encuestas propiedad del plugin puedan aceptar campos de encuesta
específicos del canal sin quedar bloqueados primero por el analizador genérico de encuestas.

Consulta [Canalización de carga](#load-pipeline) para la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata un plugin nativo como el límite de propiedad de una **empresa** o una
**función**, no como una bolsa de integraciones no relacionadas.

Eso significa:

- un plugin de empresa normalmente debe ser propietario de todas las superficies de OpenClaw
  de esa empresa
- un plugin de función normalmente debe ser propietario de la superficie completa de la función que introduce
- los canales deben consumir capacidades compartidas del core en lugar de volver a implementar
  de forma ad hoc el comportamiento del proveedor

Ejemplos:

- el Plugin incluido `openai` es propietario del comportamiento del proveedor de modelos de OpenAI y del comportamiento de OpenAI para
  voz + voz en tiempo real + comprensión de medios + generación de imágenes
- el Plugin incluido `elevenlabs` es propietario del comportamiento de voz de ElevenLabs
- el Plugin incluido `microsoft` es propietario del comportamiento de voz de Microsoft
- el Plugin incluido `google` es propietario del comportamiento del proveedor de modelos de Google además del comportamiento de Google para
  comprensión de medios + generación de imágenes + búsqueda web
- el Plugin incluido `firecrawl` es propietario del comportamiento de obtención web de Firecrawl
- los Plugins incluidos `minimax`, `mistral`, `moonshot` y `zai` son propietarios de sus
  backends de comprensión de medios
- el Plugin incluido `qwen` es propietario del comportamiento del proveedor de texto de Qwen además del
  comportamiento de comprensión de medios y generación de video
- el Plugin `voice-call` es un plugin de función: es propietario del transporte de llamadas, herramientas,
  CLI, rutas y el puente de flujo de medios de Twilio, pero consume capacidades compartidas de voz
  además de transcripción en tiempo real y voz en tiempo real, en lugar de
  importar directamente plugins de proveedor

El estado final previsto es:

- OpenAI vive en un solo Plugin incluso si abarca modelos de texto, voz, imágenes y
  video futuro
- otro proveedor puede hacer lo mismo para su propia superficie
- los canales no se preocupan por qué Plugin de proveedor es propietario del proveedor; consumen el
  contrato de capacidad compartida expuesto por el core

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capability** = contrato del core que varios plugins pueden implementar o consumir

Así que si OpenClaw añade un nuevo dominio como video, la primera pregunta no es
“¿qué proveedor debería codificar de forma fija el manejo de video?” La primera pregunta es “¿cuál es
el contrato de capacidad de video del core?” Una vez que ese contrato existe, los plugins de proveedor
pueden registrarse en él y los plugins de canal/función pueden consumirlo.

Si la capacidad todavía no existe, el movimiento correcto suele ser:

1. definir la capacidad faltante en el core
2. exponerla mediante la API/tiempo de ejecución del plugin de forma tipada
3. conectar canales/funciones con esa capacidad
4. dejar que los plugins de proveedor registren implementaciones

Esto mantiene explícita la propiedad y evita al mismo tiempo un comportamiento del core que dependa de un
solo proveedor o de una ruta de código específica de un plugin puntual.

### Capas de capacidades

Usa este modelo mental al decidir dónde debe ir el código:

- **capa de capacidades del core**: orquestación compartida, política, fallback, reglas
  de combinación de configuración, semántica de entrega y contratos tipados
- **capa de plugins de proveedor**: APIs específicas del proveedor, autenticación, catálogos de modelos, síntesis
  de voz, generación de imágenes, futuros backends de video, endpoints de uso
- **capa de plugins de canal/función**: integración de Slack/Discord/voice-call/etc.
  que consume capacidades del core y las presenta en una superficie

Por ejemplo, TTS sigue esta forma:

- el core es propietario de la política de TTS en tiempo de respuesta, el orden de fallback, las preferencias y la entrega por canal
- `openai`, `elevenlabs` y `microsoft` son propietarios de las implementaciones de síntesis
- `voice-call` consume el auxiliar de tiempo de ejecución de TTS para telefonía

Ese mismo patrón debe preferirse para capacidades futuras.

### Ejemplo de plugin de empresa con varias capacidades

Un plugin de empresa debe sentirse cohesivo desde fuera. Si OpenClaw tiene
contratos compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios,
generación de imágenes, generación de video, obtención web y búsqueda web,
un proveedor puede ser propietario de todas sus superficies en un solo lugar:

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

Lo importante no son los nombres exactos de los auxiliares. Lo que importa es la forma:

- un plugin es propietario de la superficie del proveedor
- el core sigue siendo propietario de los contratos de capacidad
- los plugins de canal y de función consumen auxiliares `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden verificar que el plugin registró las capacidades que
  afirma poseer

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imágenes/audio/video como una
capacidad compartida. El mismo modelo de propiedad se aplica allí:

1. el core define el contrato de comprensión de medios
2. los plugins de proveedor registran `describeImage`, `transcribeAudio` y
   `describeVideo` según corresponda
3. los plugins de canal y de función consumen el comportamiento compartido del core en lugar de
   conectarse directamente al código del proveedor

Eso evita incorporar en el core las suposiciones de video de un proveedor. El plugin es propietario de
la superficie del proveedor; el core es propietario del contrato de capacidad y del comportamiento de fallback.

La generación de video ya usa esa misma secuencia: el core es propietario del contrato tipado de
capacidad y del auxiliar de tiempo de ejecución, y los plugins de proveedor registran
implementaciones de `api.registerVideoGenerationProvider(...)` en él.

¿Necesitas una lista concreta de despliegue? Consulta
[Recetario de capacidades](/es/plugins/architecture).

## Contratos y aplicación

La superficie de la API de plugins es intencionalmente tipada y está centralizada en
`OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y
los auxiliares de tiempo de ejecución en los que un plugin puede confiar.

Por qué esto importa:

- los autores de plugins obtienen un estándar interno estable
- el core puede rechazar propiedad duplicada, como dos plugins que registran el mismo
  id de proveedor
- el inicio puede mostrar diagnósticos accionables para registros malformados
- las pruebas de contrato pueden aplicar la propiedad de plugins incluidos y evitar desajustes silenciosos

Hay dos capas de aplicación:

1. **aplicación del registro en tiempo de ejecución**
   El registro de plugins valida los registros a medida que se cargan los plugins. Ejemplos:
   ids de proveedor duplicados, ids de proveedor de voz duplicados y registros
   malformados producen diagnósticos de plugin en lugar de comportamiento indefinido.
2. **pruebas de contrato**
   Los plugins incluidos se capturan en registros de contrato durante las ejecuciones de prueba para que
   OpenClaw pueda verificar la propiedad explícitamente. Hoy esto se usa para
   proveedores de modelos, proveedores de voz, proveedores de búsqueda web y la propiedad del registro incluido.

El efecto práctico es que OpenClaw sabe, de antemano, qué plugin es propietario de qué
superficie. Eso permite que el core y los canales se compongan sin problemas porque la propiedad está
declarada, tipada y se puede probar, en lugar de ser implícita.

### Qué debe pertenecer a un contrato

Los buenos contratos de plugins son:

- tipados
- pequeños
- específicos de capacidad
- propiedad del core
- reutilizables por varios plugins
- consumibles por canales/funciones sin conocer al proveedor

Los malos contratos de plugins son:

- política específica de proveedor oculta en el core
- vías de escape puntuales de plugins que omiten el registro
- código de canal que accede directamente a una implementación de proveedor
- objetos ad hoc de tiempo de ejecución que no forman parte de `OpenClawPluginApi` ni de
  `api.runtime`

En caso de duda, eleva el nivel de abstracción: define primero la capacidad y luego
deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en proceso** con el Gateway. No están
aislados en sandbox. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que
el código del core.

Implicaciones:

- un plugin nativo puede registrar herramientas, controladores de red, hooks y servicios
- un error de un plugin nativo puede hacer fallar o desestabilizar el gateway
- un plugin nativo malicioso equivale a ejecución arbitraria de código dentro del
  proceso de OpenClaw

Los bundles compatibles son más seguros de forma predeterminada porque OpenClaw actualmente los trata
como paquetes de metadatos/contenido. En las versiones actuales, eso en su mayor parte significa
Skills incluidas.

Usa listas permitidas y rutas explícitas de instalación/carga para plugins no incluidos.
Trata los plugins del espacio de trabajo como código de desarrollo, no como valores predeterminados de producción.

Para los nombres de paquetes del espacio de trabajo incluidos, mantén el id del plugin anclado en el
nombre de npm: `@openclaw/<id>` de forma predeterminada, o con un sufijo tipado aprobado como
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando
el paquete expone intencionalmente un rol de plugin más estrecho.

Nota importante sobre confianza:

- `plugins.allow` confía en **ids de plugin**, no en la procedencia de la fuente.
- Un plugin del espacio de trabajo con el mismo id que un plugin incluido sombrea intencionalmente
  la copia incluida cuando ese plugin del espacio de trabajo está habilitado/en la lista permitida.
- Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes.

## Límite de exportación

OpenClaw exporta capacidades, no comodidad de implementación.

Mantén público el registro de capacidades. Recorta las exportaciones auxiliares que no sean contratos:

- subrutas auxiliares específicas de plugins incluidos
- subrutas de infraestructura de tiempo de ejecución no pensadas como API pública
- auxiliares de conveniencia específicos del proveedor
- auxiliares de configuración/incorporación que sean detalles de implementación

Algunas subrutas auxiliares de plugins incluidos todavía permanecen en el mapa de exportación del SDK generado
por compatibilidad y mantenimiento de plugins incluidos. Algunos ejemplos actuales incluyen
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y varias costuras `plugin-sdk/matrix*`. Trátalas como
exportaciones reservadas de detalle de implementación, no como el patrón de SDK recomendado para
nuevos plugins de terceros.

## Canalización de carga

Al inicio, OpenClaw hace aproximadamente esto:

1. descubre raíces de plugins candidatas
2. lee manifiestos nativos o compatibles de bundles y metadatos de paquetes
3. rechaza candidatos inseguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga módulos nativos habilitados mediante jiti
7. llama a los hooks nativos `register(api)` (o `activate(api)` — un alias heredado) y recopila registros en el registro de plugins
8. expone el registro a las superficies de comandos/tiempo de ejecución

<Note>
`activate` es un alias heredado de `register` — el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins incluidos usan `register`; prefiere `register` para plugins nuevos.
</Note>

Las compuertas de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean
cuando la entrada escapa de la raíz del plugin, la ruta permite escritura global o la propiedad de la ruta
parece sospechosa para plugins no incluidos.

### Comportamiento con manifiesto primero

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del bundle
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/placeholders de la UI de Control
- mostrar metadatos de instalación/catálogo
- conservar descriptores baratos de activación y configuración sin cargar el tiempo de ejecución del plugin

Para plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra
comportamiento real, como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores solo de metadatos para la planificación de activación y el descubrimiento de configuración;
no reemplazan el registro en tiempo de ejecución, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan sugerencias del manifiesto para comando, canal y proveedor
para acotar la carga de plugins antes de una materialización más amplia del registro:

- la carga de CLI se limita a plugins que son propietarios del comando primario solicitado
- la resolución de configuración/canal del plugin se limita a plugins que son propietarios del
  id de canal solicitado
- la resolución explícita de configuración/tiempo de ejecución del proveedor se limita a plugins que son propietarios del
  id de proveedor solicitado

El descubrimiento de configuración ahora prefiere ids propiedad del descriptor como `setup.providers` y
`setup.cliBackends` para acotar los plugins candidatos antes de recurrir a
`setup-api` para plugins que todavía necesitan hooks de tiempo de ejecución en la configuración. Si más de
un plugin descubierto afirma el mismo id normalizado de proveedor de configuración o backend de CLI,
la búsqueda de configuración rechaza al propietario ambiguo en lugar de depender del orden de descubrimiento.

### Qué almacena en caché el cargador

OpenClaw mantiene cachés breves en proceso para:

- resultados de descubrimiento
- datos del registro de manifiestos
- registros de plugins cargados

Estas cachés reducen los picos de inicio y la sobrecarga de comandos repetidos. Es seguro
pensar en ellas como cachés de rendimiento de corta duración, no como persistencia.

Nota de rendimiento:

- Establece `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desactivar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los plugins cargados no mutan directamente globals aleatorios del core. Se registran en un
registro central de plugins.

El registro rastrea:

- registros de plugins (identidad, origen, procedencia, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- controladores RPC de Gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad del plugin

Las funciones del core luego leen de ese registro en lugar de hablar directamente con los módulos del plugin.
Esto mantiene la carga en una sola dirección:

- módulo del plugin -> registro en el registro
- tiempo de ejecución del core -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del core solo
necesitan un punto de integración: “leer el registro”, no “hacer un caso especial para cada módulo de plugin”.

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

Campos del payload del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: la vinculación resuelta para solicitudes aprobadas
- `request`: el resumen de la solicitud original, sugerencia de desvinculación, id del remitente y
  metadatos de la conversación

Este callback es solo de notificación. No cambia quién tiene permitido vincular una
conversación y se ejecuta después de que termine el manejo de aprobación del core.

## Hooks de tiempo de ejecución del proveedor

Los plugins de proveedor ahora tienen dos capas:

- metadatos del manifiesto: `providerAuthEnvVars` para búsqueda barata de autenticación del proveedor mediante variables de entorno
  antes de cargar el tiempo de ejecución, `providerAuthAliases` para variantes de proveedor que comparten
  autenticación, `channelEnvVars` para búsqueda barata de entorno/configuración de canal antes de la carga del tiempo de ejecución,
  además de `providerAuthChoices` para etiquetas baratas de incorporación/elección de autenticación y
  metadatos de flags de CLI antes de la carga del tiempo de ejecución
- hooks en tiempo de configuración: `catalog` / heredado `discovery` además de `applyConfigDefaults`
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

OpenClaw sigue siendo propietario del bucle genérico del agente, failover, manejo de transcripciones y
política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico del proveedor sin
necesitar un transporte de inferencia completamente personalizado.

Usa `providerAuthEnvVars` del manifiesto cuando el proveedor tenga credenciales basadas en entorno
que las rutas genéricas de autenticación/estado/selector de modelo deban ver sin cargar el tiempo de ejecución del plugin.
Usa `providerAuthAliases` del manifiesto cuando un id de proveedor deba reutilizar
las variables de entorno, perfiles de autenticación, autenticación respaldada por configuración y la opción de incorporación de clave API
de otro id de proveedor. Usa `providerAuthChoices` del manifiesto cuando las superficies de CLI
de incorporación/elección de autenticación deban conocer el id de elección del proveedor, las etiquetas de grupo y una conexión simple
de autenticación con un solo flag sin cargar el tiempo de ejecución del proveedor. Mantén `envVars` del tiempo de ejecución del proveedor
para pistas orientadas al operador, como etiquetas de incorporación o variables de configuración de
client-id/client-secret de OAuth.

Usa `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración impulsada por entorno que
las rutas genéricas de fallback del entorno del shell, comprobaciones de configuración/estado o prompts de configuración deban ver
sin cargar el tiempo de ejecución del canal.

### Orden y uso de hooks

Para plugins de modelo/proveedor, OpenClaw llama a los hooks en este orden aproximado.
La columna “Cuándo usar” es la guía rápida de decisión.

| #   | Hook                              | Qué hace                                                                                                       | Cuándo usarlo                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`           | El proveedor es propietario de un catálogo o de valores predeterminados de URL base                                                         |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales de configuración propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de la familia de modelos del proveedor          |
| --  | _(built-in model lookup)_         | OpenClaw prueba primero la ruta normal de registro/catálogo                                                    | _(no es un hook de plugin)_                                                                                                                 |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa del id del modelo antes de la búsqueda                             | El proveedor es propietario de la limpieza de alias antes de la resolución canónica del modelo                                             |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo              | El proveedor es propietario de la limpieza del transporte para ids de proveedor personalizados de la misma familia de transporte           |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución del proveedor/tiempo de ejecución                     | El proveedor necesita una limpieza de configuración que deba vivir con el plugin; los auxiliares incluidos de la familia Google también respaldan las entradas compatibles de configuración de Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a los proveedores de configuración            | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por endpoints                                        |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación con marcador de entorno para proveedores de configuración antes de cargar la autenticación en tiempo de ejecución | El proveedor tiene una resolución propiedad del proveedor para claves API con marcador de entorno; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcador de entorno de AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/autohospedada o respaldada por configuración sin persistir texto sin formato        | El proveedor puede operar con un marcador de credencial sintético/local                                                                    |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles externos de autenticación propiedad del proveedor; `persistence` predeterminado es `runtime-only` para credenciales propiedad de CLI/app | El proveedor reutiliza credenciales externas de autenticación sin persistir tokens de actualización copiados                              |
| 10  | `shouldDeferSyntheticProfileAuth` | Reduce la prioridad de placeholders almacenados de perfiles sintéticos frente a autenticación respaldada por entorno/configuración | El proveedor almacena perfiles placeholder sintéticos que no deberían tener precedencia                                                    |
| 11  | `resolveDynamicModel`             | Fallback síncrono para ids de modelo propiedad del proveedor que aún no están en el registro local             | El proveedor acepta ids arbitrarios de modelos upstream                                                                                    |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono; después, `resolveDynamicModel` se ejecuta de nuevo                                    | El proveedor necesita metadatos de red antes de resolver ids desconocidos                                                                  |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor incrustado use el modelo resuelto                                   | El proveedor necesita reescrituras de transporte pero sigue usando un transporte del core                                                  |
| 14  | `contributeResolvedModelCompat`   | Aporta flags de compatibilidad para modelos del proveedor detrás de otro transporte compatible                 | El proveedor reconoce sus propios modelos en transportes proxy sin asumir el control del proveedor                                        |
| 15  | `capabilities`                    | Metadatos de transcripción/herramientas propiedad del proveedor usados por la lógica compartida del core       | El proveedor necesita particularidades de transcripción/familia de proveedor                                                               |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que los vea el ejecutor incrustado                                 | El proveedor necesita limpieza de esquemas para una familia de transporte                                                                  |
| 17  | `inspectToolSchemas`              | Expone diagnósticos de esquema propiedad del proveedor después de la normalización                              | El proveedor quiere advertencias de palabras clave sin enseñar al core reglas específicas del proveedor                                   |
| 18  | `resolveReasoningOutputMode`      | Selecciona contrato de salida de razonamiento nativo frente a etiquetado                                       | El proveedor necesita razonamiento etiquetado/salida final en lugar de campos nativos                                                     |
| 19  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los envoltorios genéricos de opciones de stream              | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                      |
| 20  | `createStreamFn`                  | Sustituye por completo la ruta normal de stream con un transporte personalizado                                | El proveedor necesita un protocolo de cable personalizado, no solo un envoltorio                                                          |
| 21  | `wrapStreamFn`                    | Envoltorio de stream después de aplicar los envoltorios genéricos                                              | El proveedor necesita envoltorios de compatibilidad para headers/cuerpo/modelo de solicitud sin un transporte personalizado              |
| 22  | `resolveTransportTurnState`       | Adjunta headers o metadatos nativos por turno del transporte                                                   | El proveedor quiere que los transportes genéricos envíen identidad de turno nativa del proveedor                                          |
| 23  | `resolveWebSocketSessionPolicy`   | Adjunta headers nativos de WebSocket o política de enfriamiento de sesión                                      | El proveedor quiere que los transportes genéricos de WS ajusten headers de sesión o política de fallback                                  |
| 24  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` del tiempo de ejecución | El proveedor almacena metadatos de autenticación adicionales y necesita una forma de token de tiempo de ejecución personalizada          |
| 25  | `refreshOAuth`                    | Sustitución de actualización OAuth para endpoints de actualización personalizados o política ante fallo de actualización | El proveedor no encaja en los actualizadores compartidos de `pi-ai`                                                                        |
| 26  | `buildAuthDoctorHint`             | Sugerencia de reparación añadida cuando falla la actualización OAuth                                            | El proveedor necesita una guía de reparación de autenticación propiedad del proveedor tras un fallo de actualización                      |
| 27  | `matchesContextOverflowError`     | Comparador propiedad del proveedor para desbordamiento de ventana de contexto                                   | El proveedor tiene errores sin procesar de desbordamiento que las heurísticas genéricas no detectarían                                    |
| 28  | `classifyFailoverReason`          | Clasificación de razón de failover propiedad del proveedor                                                      | El proveedor puede mapear errores sin procesar de API/transporte a límite de tasa/sobrecarga/etc.                                         |
| 29  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                   | El proveedor necesita control específico de proxy para TTL de caché                                                                        |
| 30  | `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por autenticación faltante                                     | El proveedor necesita una sugerencia específica del proveedor para recuperar autenticación faltante                                        |
| 31  | `suppressBuiltInModel`            | Supresión de modelos upstream obsoletos más una sugerencia de error opcional de cara al usuario               | El proveedor necesita ocultar filas upstream obsoletas o reemplazarlas por una sugerencia del proveedor                                   |
| 32  | `augmentModelCatalog`             | Filas de catálogo sintéticas/finales añadidas después del descubrimiento                                        | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                             |
| 33  | `isBinaryThinking`                | Alternancia de razonamiento activado/desactivado para proveedores con razonamiento binario                     | El proveedor solo expone razonamiento binario activado/desactivado                                                                         |
| 34  | `supportsXHighThinking`           | Compatibilidad con razonamiento `xhigh` para modelos seleccionados                                              | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                              |
| 35  | `resolveDefaultThinkingLevel`     | Nivel predeterminado de `/think` para una familia de modelos específica                                         | El proveedor es propietario de la política predeterminada de `/think` para una familia de modelos                                         |
| 36  | `isModernModelRef`                | Comparador de modelos modernos para filtros de perfiles en vivo y selección de smoke                           | El proveedor es propietario de la coincidencia de modelos preferidos para live/smoke                                                      |
| 37  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de tiempo de ejecución justo antes de la inferencia | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                             |
| 38  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                   | El proveedor necesita análisis personalizado de tokens de uso/cuota o una credencial de uso diferente                                      |
| 39  | `fetchUsageSnapshot`              | Obtiene y normaliza snapshots de uso/cuota específicos del proveedor después de resolver la autenticación      | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de payload                                               |
| 40  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del proveedor para memory/search                                | El comportamiento de embeddings de memory debe pertenecer al Plugin del proveedor                                                          |
| 41  | `buildReplayPolicy`               | Devuelve una política de repetición que controla el manejo de transcripciones para el proveedor                | El proveedor necesita una política personalizada de transcripciones (por ejemplo, eliminar bloques de razonamiento)                       |
| 42  | `sanitizeReplayHistory`           | Reescribe el historial de repetición después de la limpieza genérica de transcripciones                        | El proveedor necesita reescrituras de repetición específicas del proveedor más allá de los auxiliares compartidos de Compaction           |
| 43  | `validateReplayTurns`             | Validación o remodelado final de turnos de repetición antes del ejecutor incrustado                            | El transporte del proveedor necesita una validación de turnos más estricta después del saneamiento genérico                               |
| 44  | `onModelSelected`                 | Ejecuta efectos secundarios posteriores a la selección propiedad del proveedor                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo se activa                                               |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
Plugin de proveedor coincidente y luego pasan a otros plugins de proveedor capaces de usar hooks
hasta que uno realmente cambie el id del modelo o el transporte/configuración. Eso mantiene
funcionando los shims de alias/proveedor compatible sin exigir que la persona que llama sepa qué
Plugin incluido es propietario de la reescritura. Si ningún hook de proveedor reescribe una entrada compatible
de configuración de la familia Google, el normalizador incluido de configuración de Google sigue aplicando
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable completamente personalizado o un ejecutor de solicitudes personalizado,
esa es una clase distinta de extensión. Estos hooks son para comportamiento del proveedor
que aún se ejecuta en el bucle normal de inferencia de OpenClaw.

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
  y `wrapStreamFn` porque es propietario de la compatibilidad futura de Claude 4.6,
  sugerencias de familia de proveedor, guía de reparación de autenticación, integración con
  endpoints de uso, elegibilidad de caché de prompts, valores predeterminados de configuración conscientes de autenticación, política
  predeterminada/adaptativa de razonamiento de Claude y modelado de stream específico de Anthropic para
  headers beta, `/fast` / `serviceTier` y `context1m`.
- Los auxiliares de stream específicos de Claude de Anthropic permanecen por ahora en la
  costura pública `api.ts` / `contract-api.ts` del propio Plugin incluido. Esa superficie del paquete
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los constructores
  de envoltorios de Anthropic de nivel inferior en lugar de ampliar el SDK genérico en torno a
  las reglas de headers beta de un único proveedor.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` y
  `capabilities` además de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  porque es propietario de la compatibilidad futura de GPT-5.4, la normalización directa de OpenAI
  `openai-completions` -> `openai-responses`, sugerencias de autenticación conscientes de Codex,
  la supresión de Spark, filas sintéticas de lista de OpenAI y la política de modelos en vivo /
  razonamiento de GPT-5; la familia de stream `openai-responses-defaults` es propietaria de
  los envoltorios compartidos nativos de OpenAI Responses para headers de atribución,
  `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex,
  modelado de payload para compatibilidad de razonamiento y gestión de contexto de Responses.
- OpenRouter usa `catalog` además de `resolveDynamicModel` y
  `prepareDynamicModel` porque el proveedor es de paso y puede exponer nuevos
  ids de modelo antes de que se actualice el catálogo estático de OpenClaw; también usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para mantener
  fuera del core los headers de solicitud específicos del proveedor, los metadatos de enrutamiento, los parches de razonamiento y la
  política de caché de prompts. Su política de repetición proviene de la
  familia `passthrough-gemini`, mientras que la familia de stream `openrouter-thinking`
  es propietaria de la inyección de razonamiento del proxy y de los saltos de modelos no compatibles / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` y
  `capabilities` además de `prepareRuntimeAuth` y `fetchUsageSnapshot` porque
  necesita inicio de sesión de dispositivo propiedad del proveedor, comportamiento de fallback de modelo, particularidades
  de transcripción de Claude, un intercambio de token de GitHub -> token de Copilot y un endpoint de uso
  propiedad del proveedor.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` y `augmentModelCatalog` además de
  `prepareExtraParams`, `resolveUsageAuth` y `fetchUsageSnapshot` porque
  todavía se ejecuta en los transportes OpenAI del core pero es propietario de su normalización
  de transporte/URL base, política de fallback de actualización OAuth, elección de transporte predeterminada,
  filas sintéticas del catálogo de Codex e integración con el endpoint de uso de ChatGPT; comparte
  la misma familia de stream `openai-responses-defaults` que OpenAI directo.
- Google AI Studio y Gemini CLI OAuth usan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque la
  familia de repetición `google-gemini` es propietaria del fallback de compatibilidad futura de Gemini 3.1,
  la validación nativa de repetición de Gemini, el saneamiento inicial de la repetición, el modo
  de salida de razonamiento etiquetado y la coincidencia de modelos modernos, mientras que la
  familia de stream `google-thinking` es propietaria de la normalización del payload de razonamiento de Gemini;
  Gemini CLI OAuth también usa `formatApiKey`, `resolveUsageAuth` y
  `fetchUsageSnapshot` para formato de token, análisis de token y conexión del endpoint
  de cuota.
- Anthropic Vertex usa `buildReplayPolicy` mediante la
  familia de repetición `anthropic-by-model` para que la limpieza de repetición específica de Claude quede
  acotada a ids de Claude en lugar de a cada transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` y `resolveDefaultThinkingLevel` porque es propietario de la clasificación
  específica de Bedrock para errores de limitación/no listo/desbordamiento de contexto
  en tráfico de Anthropic-en-Bedrock; su política de repetición sigue compartiendo la misma protección
  exclusiva de Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode y Opencode Go usan `buildReplayPolicy`
  mediante la familia de repetición `passthrough-gemini` porque proxyfican modelos Gemini
  mediante transportes compatibles con OpenAI y necesitan saneamiento de firmas de pensamiento de Gemini
  sin validación nativa de repetición de Gemini ni reescrituras iniciales.
- MiniMax usa `buildReplayPolicy` mediante la
  familia de repetición `hybrid-anthropic-openai` porque un proveedor es propietario tanto de
  semánticas de mensajes Anthropic como compatibles con OpenAI; mantiene la eliminación
  de bloques de pensamiento exclusivos de Claude en el lado Anthropic mientras anula el modo de salida de razonamiento
  de vuelta a nativo, y la familia de stream `minimax-fast-mode` es propietaria de las reescrituras
  de modelos fast-mode en la ruta de stream compartida.
- Moonshot usa `catalog` además de `wrapStreamFn` porque todavía usa el
  transporte OpenAI compartido pero necesita normalización del payload de razonamiento propiedad del proveedor; la
  familia de stream `moonshot-thinking` asigna la configuración además del estado `/think` a su
  payload nativo de razonamiento binario.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque necesita headers de solicitud propiedad del proveedor,
  normalización del payload de razonamiento, sugerencias de transcripción de Gemini y control
  de TTL de caché de Anthropic; la familia de stream `kilocode-thinking` mantiene la inyección
  de razonamiento de Kilo en la ruta de stream proxy compartida mientras omite `kilo/auto` y
  otros ids de modelo proxy que no admiten payloads de razonamiento explícitos.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` y `fetchUsageSnapshot` porque es propietario del fallback de GLM-5,
  valores predeterminados de `tool_stream`, UX de razonamiento binario, coincidencia de modelos modernos y tanto
  autenticación de uso como obtención de cuota; la familia de stream `tool-stream-default-on` mantiene
  el envoltorio de `tool_stream` activado por defecto fuera del código manual por proveedor.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque es propietario de la normalización nativa del transporte xAI Responses, reescrituras
  de alias fast-mode de Grok, `tool_stream` predeterminado, limpieza estricta de herramientas / payload de razonamiento,
  reutilización de autenticación de fallback para herramientas propiedad del plugin, resolución de modelos Grok
  con compatibilidad futura y parches de compatibilidad propiedad del proveedor como el perfil de esquema de herramientas de xAI,
  palabras clave de esquema no compatibles, `web_search` nativo y decodificación de argumentos de llamadas a herramientas con entidades HTML.
- Mistral, OpenCode Zen y OpenCode Go usan solo `capabilities`
  para mantener las particularidades de transcripción/herramientas fuera del core.
- Los proveedores incluidos solo de catálogo como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` y `volcengine` usan
  solo `catalog`.
- Qwen usa `catalog` para su proveedor de texto además de registros compartidos de comprensión de medios y
  generación de video para sus superficies multimodales.
- MiniMax y Xiaomi usan `catalog` además de hooks de uso porque su comportamiento de `/usage`
  es propiedad del plugin aunque la inferencia siga ejecutándose mediante los transportes compartidos.

## Auxiliares de tiempo de ejecución

Los plugins pueden acceder a ciertos auxiliares seleccionados del core mediante `api.runtime`. Para TTS:

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

- `textToSpeech` devuelve el payload normal de salida TTS del core para superficies de archivo/nota de voz.
- Usa la configuración `messages.tts` del core y la selección de proveedor.
- Devuelve búfer de audio PCM + frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Las listas de voces pueden incluir metadatos más ricos como configuración regional, género y etiquetas de personalidad para selectores conscientes del proveedor.
- OpenAI y ElevenLabs admiten telefonía hoy. Microsoft no.

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

- Mantén la política de TTS, el fallback y la entrega de respuestas en el core.
- Usa proveedores de voz para el comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un único plugin de proveedor puede poseer
  texto, voz, imagen y futuros proveedores de medios a medida que OpenClaw añada esos
  contratos de capacidad.

Para comprensión de imágenes/audio/video, los plugins registran un único proveedor tipado de
comprensión de medios en lugar de una bolsa genérica clave/valor:

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

- Mantén la orquestación, el fallback, la configuración y el cableado de canales en el core.
- Mantén el comportamiento del proveedor en el Plugin del proveedor.
- La expansión aditiva debe seguir siendo tipada: nuevos métodos opcionales, nuevos campos
  de resultado opcionales, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el core es propietario del contrato de capacidad y del auxiliar de tiempo de ejecución
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para los auxiliares de tiempo de ejecución de comprensión de medios, los plugins pueden llamar a:

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
o el alias STT más antiguo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` es la superficie compartida preferida para
  comprensión de imágenes/audio/video.
- Usa la configuración de audio de comprensión de medios del core (`tools.media.audio`) y el orden de fallback del proveedor.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
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

- `provider` y `model` son anulaciones opcionales por ejecución, no cambios persistentes de sesión.
- OpenClaw solo respeta esos campos de anulación para llamadores de confianza.
- Para ejecuciones de fallback propiedad del plugin, los operadores deben activar explícitamente `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir los plugins de confianza a objetivos canónicos específicos `provider/model`, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagente de plugins no confiables siguen funcionando, pero las solicitudes de anulación se rechazan en lugar de recurrir silenciosamente al fallback.

Para la búsqueda web, los plugins pueden consumir el auxiliar compartido de tiempo de ejecución en lugar de
acceder al cableado de herramientas del agente:

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

- Mantén en el core la selección del proveedor, la resolución de credenciales y la semántica compartida de solicitudes.
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
- `listProviders(...)`: lista los proveedores disponibles de generación de imágenes y sus capacidades.

## Rutas HTTP de Gateway

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

- `path`: ruta bajo el servidor HTTP del Gateway.
- `auth`: obligatorio. Usa `"gateway"` para exigir autenticación normal del gateway, o `"plugin"` para autenticación/validación de Webhook administrada por el plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta manejó la solicitud.

Notas:

- `api.registerHttpHandler(...)` fue eliminado y provocará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Las rutas superpuestas con distintos niveles de `auth` se rechazan. Mantén las cadenas de fallback `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente alcances de tiempo de ejecución del operador. Son para webhooks/validación de firmas administrados por el plugin, no para llamadas privilegiadas a auxiliares de Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un alcance de tiempo de ejecución de solicitud de Gateway, pero ese alcance es intencionalmente conservador:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los alcances de tiempo de ejecución de rutas de plugin fijados en `operator.write`, incluso si la persona que llama envía `x-openclaw-scopes`
  - los modos HTTP confiables con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en una entrada privada) respetan `x-openclaw-scopes` solo cuando el header está presente explícitamente
  - si `x-openclaw-scopes` no está presente en esas solicitudes de ruta de plugin con identidad, el alcance de tiempo de ejecución vuelve a `operator.write`
- Regla práctica: no asumas que una ruta de plugin autenticada por gateway es una superficie implícita de administrador. Si tu ruta necesita comportamiento solo de administrador, exige un modo de autenticación con identidad y documenta el contrato explícito del header `x-openclaw-scopes`.

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
  `openclaw/plugin-sdk/webhook-ingress` para el cableado compartido de
  configuración/autenticación/respuesta/Webhook. `channel-inbound` es el hogar compartido para debounce, coincidencia de menciones,
  auxiliares de política de menciones entrantes, formato de sobres y auxiliares de contexto
  de sobres entrantes.
  `channel-setup` es la costura estrecha de configuración con instalación opcional.
  `setup-runtime` es la superficie de configuración segura para tiempo de ejecución usada por `setupEntry` /
  inicio diferido, incluidos los adaptadores de parches de configuración seguros para importación.
  `setup-adapter-runtime` es la costura del adaptador de configuración de cuentas consciente del entorno.
  `setup-tools` es la pequeña costura auxiliar de CLI/archivo/docs (`formatCliCommand`,
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
  `openclaw/plugin-sdk/directory-runtime` para auxiliares compartidos de tiempo de ejecución/configuración.
  `telegram-command-config` es la costura pública estrecha para la
  normalización/validación de comandos personalizados de Telegram y sigue disponible incluso si la
  superficie del contrato incluido de Telegram no está disponible temporalmente.
  `text-runtime` es la costura compartida de texto/markdown/logging, incluyendo
  eliminación de texto visible para el asistente, auxiliares de renderizado/fragmentación de markdown, auxiliares de redacción,
  auxiliares de etiquetas de directivas y utilidades de texto seguro.
- Las costuras de canal específicas de aprobación deben preferir un único contrato
  `approvalCapability` en el plugin. Luego el core lee autenticación, entrega, renderizado,
  enrutamiento nativo y comportamiento diferido del controlador nativo de aprobación a través de esa única capacidad
  en lugar de mezclar comportamiento de aprobación en campos no relacionados del plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto y permanece solo como
  shim de compatibilidad para plugins antiguos. El código nuevo debe importar en su lugar
  las primitivas genéricas más estrechas, y el código del repositorio no debe añadir nuevas importaciones del
  shim.
- Los internos de extensiones incluidas siguen siendo privados. Los plugins externos deben usar solo
  subrutas `openclaw/plugin-sdk/*`. El código de core/pruebas de OpenClaw puede usar los
  puntos de entrada públicos del repositorio bajo la raíz de un paquete de plugin como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` y archivos de alcance estrecho como
  `login-qr-api.js`. Nunca importes `src/*` de un paquete de plugin desde el core ni desde
  otra extensión.
- División de puntos de entrada del repositorio:
  `<plugin-package-root>/api.js` es el barrel de auxiliares/tipos,
  `<plugin-package-root>/runtime-api.js` es el barrel solo de tiempo de ejecución,
  `<plugin-package-root>/index.js` es el punto de entrada del plugin incluido,
  y `<plugin-package-root>/setup-entry.js` es el punto de entrada del plugin de configuración.
- Ejemplos actuales de proveedores incluidos:
  - Anthropic usa `api.js` / `contract-api.js` para auxiliares de stream de Claude como
    `wrapAnthropicProviderStream`, auxiliares de headers beta y análisis de `service_tier`.
  - OpenAI usa `api.js` para constructores de proveedores, auxiliares de modelo predeterminado y
    constructores de proveedores en tiempo real.
  - OpenRouter usa `api.js` para su constructor de proveedor además de auxiliares de incorporación/configuración,
    mientras que `register.runtime.js` todavía puede reexportar auxiliares genéricos de
    `plugin-sdk/provider-stream` para uso local del repositorio.
- Los puntos de entrada públicos cargados mediante fachada prefieren la instantánea activa de configuración de tiempo de ejecución
  cuando existe una, y en caso contrario recurren al archivo de configuración resuelto en disco cuando
  OpenClaw todavía no está sirviendo una instantánea de tiempo de ejecución.
- Las primitivas genéricas compartidas siguen siendo el contrato público preferido del SDK. Aún existe
  un pequeño conjunto reservado de compatibilidad de costuras auxiliares con marca de canal incluidas. Trátalas como
  costuras de mantenimiento/compatibilidad de plugins incluidos, no como nuevos objetivos de importación de terceros;
  los nuevos contratos transversales entre canales deben seguir llegando a subrutas genéricas `plugin-sdk/*` o a los barrels locales del plugin `api.js` /
  `runtime-api.js`.

Nota de compatibilidad:

- Evita el barrel raíz `openclaw/plugin-sdk` en código nuevo.
- Prefiere primero las primitivas estables y estrechas. Las subrutas más recientes de setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool son el contrato previsto para nuevo trabajo de
  plugins incluidos y externos.
  El análisis/coincidencia de destinos pertenece a `openclaw/plugin-sdk/channel-targets`.
  Las compuertas de acciones de mensajes y los auxiliares de id de mensaje de reacciones pertenecen a
  `openclaw/plugin-sdk/channel-actions`.
- Los barrels auxiliares específicos de extensiones incluidas no son estables de forma predeterminada. Si un
  auxiliar solo lo necesita una extensión incluida, mantenlo detrás de la costura local
  `api.js` o `runtime-api.js` de la extensión en lugar de promoverlo a
  `openclaw/plugin-sdk/<extension>`.
- Las nuevas costuras auxiliares compartidas deben ser genéricas, no con marca de canal. El análisis compartido de destinos
  pertenece a `openclaw/plugin-sdk/channel-targets`; los internos específicos del canal
  permanecen detrás de la costura local `api.js` o `runtime-api.js` del plugin propietario.
- Existen subrutas específicas de capacidad como `image-generation`,
  `media-understanding` y `speech` porque los plugins nativos/incluidos las usan
  hoy. Su presencia no significa por sí sola que cada auxiliar exportado sea un
  contrato externo congelado a largo plazo.

## Esquemas de la herramienta de mensajes

Los plugins deben ser propietarios de las contribuciones al esquema específicas del canal en
`describeMessageTool(...)`. Mantén los campos específicos del proveedor en el plugin, no en el core compartido.

Para fragmentos portables de esquema compartido, reutiliza los auxiliares genéricos exportados mediante
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para payloads de estilo cuadrícula de botones
- `createMessageToolCardSchema()` para payloads estructurados de tarjetas

Si una forma de esquema solo tiene sentido para un proveedor, defínela en el propio
código fuente de ese plugin en lugar de promoverla al SDK compartido.

## Resolución de destinos de canal

Los plugins de canal deben ser propietarios de la semántica de destino específica del canal. Mantén
genérico el host compartido de salida y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al core si una
  entrada debe saltar directamente a resolución similar a id en lugar de búsqueda en el directorio.
- `messaging.targetResolver.resolveTarget(...)` es el fallback del plugin cuando
  el core necesita una resolución final propiedad del proveedor después de la normalización o después de un
  fallo en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` es propietario de la construcción de la ruta de sesión
  específica del proveedor una vez que se resuelve un destino.

Separación recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deben ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de “tratar esto como un id de destino explícito/nativo”.
- Usa `resolveTarget` para fallback de normalización específico del proveedor, no para
  búsqueda amplia en el directorio.
- Mantén ids nativos del proveedor como ids de chat, ids de hilo, JID, handles e ids de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio a partir de la configuración deben mantener esa lógica en el
plugin y reutilizar los auxiliares compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Úsalo cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares de DM controlados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de directorio con alcance por cuenta

Los auxiliares compartidos de `directory-runtime` solo manejan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- auxiliares de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas específica del canal y la normalización de ids deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el plugin sea propietario de ids de modelo específicos del proveedor, valores predeterminados de URL base
o metadatos de modelos protegidos por autenticación.

`catalog.order` controla cuándo se combina el catálogo de un plugin en relación con los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores sencillos impulsados por clave API o entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en colisión de claves, así que los plugins pueden
anular intencionalmente una entrada integrada de proveedor con el mismo id de proveedor.

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
  `openclaw channels status`, `openclaw channels resolve` y los flujos de
  doctor/reparación de configuración no deberían necesitar materializar credenciales de tiempo de ejecución solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando sea relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores sin procesar de tokens solo para informar disponibilidad
  de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen correspondiente)
  es suficiente para comandos de estilo status.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen “configurado pero no disponible en esta ruta de comando”
en lugar de fallar o informar erróneamente que la cuenta no está configurada.

## Paquetes pack

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

Cada entrada se convierte en un plugin. Si el pack lista varias extensiones, el id del plugin
pasa a ser `name/<fileBase>`.

Si tu plugin importa dependencias de npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Barandilla de seguridad: cada entrada de `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de resolver symlinks. Las entradas que escapan del directorio del paquete son
rechazadas.

Nota de seguridad: `openclaw plugins install` instala dependencias del plugin con
`npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida, sin dependencias de desarrollo en tiempo de ejecución). Mantén los árboles de dependencias del plugin en “JS/TS puro” y evita paquetes que requieran compilaciones en `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún no configurado, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto mantiene más ligeros el inicio y la configuración
cuando la entrada principal del plugin también conecta herramientas, hooks u otro código
solo de tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un plugin de canal use la misma ruta `setupEntry` durante la fase
de inicio previa a listen del gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar cada capacidad propiedad del canal de la que dependa el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway comience a escuchar
- cualquier método, herramienta o servicio de gateway que deba existir durante esa misma ventana

Si tu entrada completa sigue siendo propietaria de alguna capacidad de inicio requerida, no habilites
esta flag. Mantén el plugin con el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar auxiliares de superficie de contrato solo de configuración que el core
puede consultar antes de que se cargue el tiempo de ejecución completo del canal. La superficie actual
de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El core usa esa superficie cuando necesita promover una configuración heredada de canal de cuenta única a
`channels.<id>.accounts.*` sin cargar la entrada completa del plugin.
Matrix es el ejemplo incluido actual: mueve solo claves de autenticación/inicio al bootstrap a una cuenta promocionada con nombre cuando ya existen cuentas con nombre, y puede conservar una
clave configurada de cuenta predeterminada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parche de configuración mantienen diferido el descubrimiento de la superficie del contrato incluido. El tiempo
de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de
volver a entrar al inicio del canal incluido durante la importación del módulo.

Cuando esas superficies de inicio incluyan métodos RPC de gateway, mantenlos en un
prefijo específico del plugin. Los espacios de nombres de administración del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen estando reservados y siempre se resuelven
a `operator.admin`, incluso si un plugin solicita un alcance más estrecho.

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

### Metadatos del catálogo de canales

Los plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
pistas de instalación mediante `openclaw.install`. Esto mantiene al core libre de datos de catálogo.

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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

- `detailLabel`: etiqueta secundaria para superficies de catálogo/status más ricas
- `docsLabel`: anula el texto del enlace para el enlace de documentación
- `preferOver`: ids de canal/plugin de menor prioridad que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de copia de la superficie de selección
- `markdownCapable`: marca el canal como compatible con markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados todavía aceptados por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: hace que el canal participe en el flujo estándar `allowFrom` de inicio rápido
- `forceAccountBinding`: requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver destinos de anuncios

OpenClaw también puede combinar **catálogos externos de canales** (por ejemplo, una exportación
del registro MPM). Coloca un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O haz que `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) apunte a
uno o más archivos JSON (delimitados por coma/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados para la clave `"entries"`.

## Plugins de motor de contexto

Los plugins de motor de contexto son propietarios de la orquestación del contexto de sesión para ingesta, ensamblaje
y Compaction. Regístralos desde tu plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Usa esto cuando tu plugin necesite reemplazar o ampliar la canalización de contexto predeterminada
en lugar de solo añadir búsqueda de memory o hooks.

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

Si tu motor **no** es propietario del algoritmo de Compaction, mantén `compact()`
implementado y delégalo explícitamente:

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

## Añadir una nueva capacidad

Cuando un plugin necesite un comportamiento que no encaje en la API actual, no omitas
el sistema de plugins con un acceso privado interno. Añade la capacidad que falta.

Secuencia recomendada:

1. define el contrato del core
   Decide qué comportamiento compartido debe ser propiedad del core: política, fallback, combinación de configuración,
   ciclo de vida, semántica orientada a canales y forma del auxiliar de tiempo de ejecución.
2. añade superficies tipadas de registro/tiempo de ejecución para plugins
   Amplía `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada de capacidad más pequeña y útil.
3. conecta consumidores del core + de canal/función
   Los canales y plugins de función deben consumir la nueva capacidad a través del core,
   no importando directamente una implementación del proveedor.
4. registra implementaciones de proveedor
   Luego los plugins de proveedor registran sus backends en la capacidad.
5. añade cobertura de contrato
   Añade pruebas para que la forma de propiedad y registro siga siendo explícita con el tiempo.

Así es como OpenClaw sigue siendo opinado sin quedar codificado de forma fija a la
visión del mundo de un solo proveedor. Consulta el [Recetario de capacidades](/es/plugins/architecture)
para ver una lista concreta de archivos y un ejemplo práctico.

### Lista de verificación de capacidades

Cuando añadas una nueva capacidad, la implementación normalmente debe tocar estas
superficies a la vez:

- tipos de contrato del core en `src/<capability>/types.ts`
- ejecutor del core/auxiliar de tiempo de ejecución en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- cableado del registro de plugins en `src/plugins/registry.ts`
- exposición del tiempo de ejecución del plugin en `src/plugins/runtime/*` cuando los plugins
  de función/canal necesiten consumirla
- auxiliares de captura/pruebas en `src/test-utils/plugin-registration.ts`
- verificaciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores/plugins en `docs/`

Si falta una de esas superficies, normalmente es una señal de que la capacidad
todavía no está totalmente integrada.

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

- el core es propietario del contrato de capacidad + orquestación
- los plugins de proveedor son propietarios de implementaciones del proveedor
- los plugins de función/canal consumen auxiliares de tiempo de ejecución
- las pruebas de contrato mantienen explícita la propiedad
