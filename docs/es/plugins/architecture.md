---
read_when:
    - Compilar o depurar plugins nativos de OpenClaw
    - Comprender el modelo de capacidades del plugin o los límites de propiedad
    - Trabajar en la canalización de carga de plugins o en el registro
    - Implementar hooks de tiempo de ejecución del proveedor o plugins de canal
sidebarTitle: Internals
summary: 'Aspectos internos del Plugin: modelo de capacidades, propiedad, contratos, canalización de carga y utilidades de tiempo de ejecución'
title: Aspectos internos del Plugin
x-i18n:
    generated_at: "2026-04-21T13:36:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b1fb42e659d4419033b317e88563a59b3ddbfad0523f32225c868c8e828fd16
    source_path: plugins/architecture.md
    workflow: 15
---

# Aspectos internos del Plugin

<Info>
  Esta es la **referencia profunda de arquitectura**. Para guías prácticas, consulta:
  - [Instalar y usar plugins](/es/tools/plugin) — guía del usuario
  - [Primeros pasos](/es/plugins/building-plugins) — primer tutorial de plugins
  - [Plugins de canal](/es/plugins/sdk-channel-plugins) — crea un canal de mensajería
  - [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crea un proveedor de modelos
  - [Descripción general del SDK](/es/plugins/sdk-overview) — mapa de importación y API de registro
</Info>

Esta página cubre la arquitectura interna del sistema de plugins de OpenClaw.

## Modelo de capacidades públicas

Las capacidades son el modelo público de **plugin nativo** dentro de OpenClaw. Cada
plugin nativo de OpenClaw se registra en uno o más tipos de capacidad:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferencia de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferencia CLI | `api.registerCliBackend(...)`                 | `openai`, `anthropic`                |
| Voz                    | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Comprensión de medios  | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generación de música   | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Recuperación web       | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensajería     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Un plugin que registra cero capacidades pero proporciona hooks, herramientas o
servicios es un plugin **heredado solo de hooks**. Ese patrón sigue estando totalmente soportado.

### Postura de compatibilidad externa

El modelo de capacidades ya está incorporado en el core y lo usan hoy los plugins
nativos/incluidos, pero la compatibilidad para plugins externos todavía necesita un estándar
más estricto que "está exportado, por lo tanto está congelado".

Guía actual:

- **plugins externos existentes:** mantén funcionando las integraciones basadas en hooks; trata
  esto como la base de compatibilidad
- **nuevos plugins nativos/incluidos:** prefiere el registro explícito de capacidades antes que
  accesos específicos de proveedor o nuevos diseños solo con hooks
- **plugins externos que adopten el registro de capacidades:** permitido, pero trata las
  superficies auxiliares específicas de capacidad como evolutivas a menos que la documentación marque explícitamente un contrato como estable

Regla práctica:

- las API de registro de capacidades son la dirección prevista
- los hooks heredados siguen siendo la ruta más segura y sin rupturas para plugins externos durante
  la transición
- no todas las subrutas auxiliares exportadas son iguales; prefiere el contrato documentado y estrecho,
  no exportaciones auxiliares incidentales

### Formas de plugins

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real
de registro, no solo por metadatos estáticos:

- **plain-capability** -- registra exactamente un tipo de capacidad (por ejemplo, un
  plugin solo de proveedor como `mistral`)
- **hybrid-capability** -- registra múltiples tipos de capacidad (por ejemplo,
  `openai` gestiona inferencia de texto, voz, comprensión de medios y generación
  de imágenes)
- **hook-only** -- registra solo hooks, tipados o personalizados, sin capacidades,
  herramientas, comandos ni servicios
- **non-capability** -- registra herramientas, comandos, servicios o rutas, pero no
  capacidades

Usa `openclaw plugins inspect <id>` para ver la forma y el desglose de capacidades de un plugin. Consulta la [referencia de CLI](/cli/plugins#inspect) para más detalles.

### Hooks heredados

El hook `before_agent_start` sigue estando soportado como ruta de compatibilidad para
plugins solo de hooks. Los plugins heredados del mundo real todavía dependen de él.

Dirección:

- mantenerlo funcional
- documentarlo como heredado
- preferir `before_model_resolve` para trabajo de sobrescritura de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación de prompts
- eliminarlo solo después de que baje el uso real y la cobertura de fixtures demuestre seguridad de migración

### Señales de compatibilidad

Cuando ejecutas `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver
una de estas etiquetas:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **configuración válida**   | La configuración se analiza correctamente y los plugins se resuelven |
| **aviso de compatibilidad** | El plugin usa un patrón soportado pero antiguo (p. ej. `hook-only`) |
| **advertencia heredada**   | El plugin usa `before_agent_start`, que está obsoleto        |
| **error grave**            | La configuración no es válida o el plugin no se pudo cargar  |

Ni `hook-only` ni `before_agent_start` romperán tu plugin hoy --
`hook-only` es informativo, y `before_agent_start` solo activa una advertencia. Estas
señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Descripción general de la arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

1. **Manifiesto + descubrimiento**
   OpenClaw encuentra plugins candidatos desde rutas configuradas, raíces de workspace,
   raíces globales de extensiones y extensiones incluidas. El descubrimiento lee primero
   manifiestos nativos `openclaw.plugin.json` junto con los manifiestos de bundle soportados.
2. **Habilitación + validación**
   El core decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o
   seleccionado para una ranura exclusiva, como memoria.
3. **Carga en tiempo de ejecución**
   Los plugins nativos de OpenClaw se cargan en proceso mediante jiti y registran
   capacidades en un registro central. Los bundles compatibles se normalizan en
   registros del registro sin importar código de tiempo de ejecución.
4. **Consumo de superficies**
   El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración
   de proveedores, hooks, rutas HTTP, comandos CLI y servicios.

Para la CLI de plugins específicamente, el descubrimiento del comando raíz se divide en dos fases:

- los metadatos en tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo CLI real del plugin puede seguir siendo perezoso y registrarse en la primera invocación

Eso mantiene el código CLI propiedad del plugin dentro del plugin mientras sigue permitiendo
que OpenClaw reserve nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- el descubrimiento + la validación de configuración deberían funcionar a partir de **metadatos de manifiesto/esquema**
  sin ejecutar código del plugin
- el comportamiento nativo en tiempo de ejecución proviene de la ruta `register(api)` del módulo del plugin

Esa división permite que OpenClaw valide configuración, explique plugins faltantes/deshabilitados y
construya sugerencias de UI/esquema antes de que el tiempo de ejecución completo esté activo.

### Plugins de canal y la herramienta compartida de mensajes

Los plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para
acciones normales de chat. OpenClaw mantiene una herramienta `message` compartida en el core, y
los plugins de canal gestionan detrás de ella el descubrimiento y la ejecución específicos del canal.

El límite actual es:

- el core gestiona el host de la herramienta compartida `message`, la conexión con prompts, el
  seguimiento de sesión/hilo y el despacho de ejecución
- los plugins de canal gestionan el descubrimiento de acciones con alcance, el descubrimiento de capacidades y cualquier
  fragmento de esquema específico del canal
- los plugins de canal gestionan la gramática de conversación de sesión específica del proveedor, como
  cómo los id de conversación codifican los id de hilo o heredan de conversaciones principales
- los plugins de canal ejecutan la acción final a través de su adaptador de acciones

Para plugins de canal, la superficie del SDK es
`ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada unificada de descubrimiento
permite que un plugin devuelva sus acciones visibles, capacidades y contribuciones al esquema
juntas para que esas piezas no diverjan.

Cuando un parámetro de herramienta de mensajes específico del canal lleva una fuente multimedia como una
ruta local o una URL de medios remotos, el plugin también debe devolver
`mediaSourceParams` desde `describeMessageTool(...)`. El core usa esa lista explícita
para aplicar normalización de rutas del sandbox y sugerencias de acceso saliente a medios
sin codificar nombres de parámetros propiedad del plugin.
Ahí, prefiere mapas con alcance por acción, no una lista plana a nivel de canal, para que un
parámetro multimedia exclusivo de perfil no se normalice en acciones no relacionadas como
`send`.

El core pasa el alcance en tiempo de ejecución a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Esto importa para plugins sensibles al contexto. Un canal puede ocultar o exponer
acciones de mensajes según la cuenta activa, la sala/hilo/mensaje actual o la
identidad confiable del solicitante, sin codificar ramas específicas del canal en la
herramienta `message` del core.

Por eso los cambios de enrutamiento del embedded-runner siguen siendo trabajo del plugin: el runner es
responsable de reenviar la identidad actual del chat/sesión al límite de descubrimiento del plugin para que la herramienta compartida `message` exponga la superficie correcta
propiedad del canal para el turno actual.

Para utilidades de ejecución propiedad del canal, los plugins incluidos deben mantener el tiempo de ejecución
de ejecución dentro de sus propios módulos de extensión. El core ya no gestiona los tiempos de ejecución de acciones de mensajes de Discord,
Slack, Telegram o WhatsApp bajo `src/agents/tools`.
No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los
plugins incluidos deben importar directamente su propio código local de tiempo de ejecución desde sus
módulos propiedad de la extensión.

El mismo límite se aplica en general a las costuras del SDK con nombre de proveedor: el core
no debe importar barriles auxiliares específicos de canales para Slack, Discord, Signal,
WhatsApp o extensiones similares. Si el core necesita un comportamiento, debe consumir
el propio barril `api.ts` / `runtime-api.ts` del plugin incluido o promover la necesidad a una
capacidad genérica y estrecha en el SDK compartido.

Para las encuestas específicamente, hay dos rutas de ejecución:

- `outbound.sendPoll` es la línea base compartida para canales que encajan en el modelo
  común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semántica de encuestas específica del canal o parámetros adicionales de encuesta

El core ahora difiere el análisis compartido de encuestas hasta después de que el despacho de encuestas del plugin rechace
la acción, de modo que los controladores de encuestas propiedad del plugin puedan aceptar campos de encuestas específicos del canal
sin quedar bloqueados primero por el analizador genérico de encuestas.

Consulta [Canalización de carga](#load-pipeline) para ver la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata un plugin nativo como el límite de propiedad para una **empresa** o una
**función**, no como una bolsa de integraciones no relacionadas.

Eso significa:

- un plugin de empresa normalmente debería gestionar todas las superficies de OpenClaw de esa empresa
- un plugin de función normalmente debería gestionar toda la superficie de la función que introduce
- los canales deberían consumir capacidades compartidas del core en lugar de reimplementar
  comportamiento de proveedores de manera ad hoc

Ejemplos:

- el plugin incluido `openai` gestiona el comportamiento del proveedor de modelos de OpenAI y el comportamiento de
  voz + voz en tiempo real + comprensión de medios + generación de imágenes de OpenAI
- el plugin incluido `elevenlabs` gestiona el comportamiento de voz de ElevenLabs
- el plugin incluido `microsoft` gestiona el comportamiento de voz de Microsoft
- el plugin incluido `google` gestiona el comportamiento del proveedor de modelos de Google más el comportamiento de
  comprensión de medios + generación de imágenes + búsqueda web de Google
- el plugin incluido `firecrawl` gestiona el comportamiento de recuperación web de Firecrawl
- los plugins incluidos `minimax`, `mistral`, `moonshot` y `zai` gestionan sus
  backends de comprensión de medios
- el plugin incluido `qwen` gestiona el comportamiento del proveedor de texto de Qwen más
  el comportamiento de comprensión de medios y generación de video
- el plugin `voice-call` es un plugin de función: gestiona transporte de llamadas, herramientas,
  CLI, rutas y el puente de flujo de medios de Twilio, pero consume las capacidades compartidas de voz
  más transcripción en tiempo real y voz en tiempo real en lugar de
  importar plugins de proveedor directamente

El estado final previsto es:

- OpenAI vive en un solo plugin aunque abarque modelos de texto, voz, imágenes y
  futuro video
- otro proveedor puede hacer lo mismo para su propia superficie
- a los canales no les importa qué plugin de proveedor gestiona el proveedor; consumen el
  contrato de capacidad compartida expuesto por el core

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capability** = contrato del core que varios plugins pueden implementar o consumir

Así que si OpenClaw agrega un nuevo dominio como video, la primera pregunta no es
"¿qué proveedor debería codificar el manejo de video?" La primera pregunta es "¿cuál es
el contrato de capacidad de video del core?" Una vez que ese contrato exista, los plugins de proveedor
pueden registrarse en él y los plugins de canal/función pueden consumirlo.

Si la capacidad todavía no existe, normalmente el movimiento correcto es:

1. definir la capacidad faltante en el core
2. exponerla mediante la API/el tiempo de ejecución del plugin de forma tipada
3. conectar canales/funciones con esa capacidad
4. dejar que los plugins de proveedor registren implementaciones

Esto mantiene explícita la propiedad y al mismo tiempo evita comportamiento del core que dependa de un
único proveedor o de una ruta de código específica de un plugin puntual.

### Capas de capacidades

Usa este modelo mental al decidir dónde debe ir el código:

- **capa de capacidades del core**: orquestación compartida, política, respaldo, reglas de
  fusión de configuración, semántica de entrega y contratos tipados
- **capa de plugin de proveedor**: API específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz,
  generación de imágenes, futuros backends de video, endpoints de uso
- **capa de plugin de canal/función**: integración de Slack/Discord/voice-call/etc.
  que consume capacidades del core y las presenta en una superficie

Por ejemplo, TTS sigue esta forma:

- el core gestiona la política de TTS en tiempo de respuesta, el orden de respaldo, las preferencias y la entrega por canal
- `openai`, `elevenlabs` y `microsoft` gestionan las implementaciones de síntesis
- `voice-call` consume la utilidad de tiempo de ejecución de TTS para telefonía

Ese mismo patrón debería preferirse para capacidades futuras.

### Ejemplo de plugin de empresa con múltiples capacidades

Un plugin de empresa debería sentirse coherente desde fuera. Si OpenClaw tiene contratos
compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios,
generación de imágenes, generación de video, recuperación web y búsqueda web,
un proveedor puede gestionar todas sus superficies en un solo lugar:

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

Lo importante no son los nombres exactos de las utilidades. Lo importante es la forma:

- un solo plugin gestiona la superficie del proveedor
- el core sigue gestionando los contratos de capacidad
- los plugins de canal y de función consumen utilidades `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden afirmar que el plugin registró las capacidades que
  dice gestionar

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imagen/audio/video como una sola
capacidad compartida. Ahí se aplica el mismo modelo de propiedad:

1. el core define el contrato de comprensión de medios
2. los plugins de proveedor registran `describeImage`, `transcribeAudio` y
   `describeVideo` según corresponda
3. los plugins de canal y de función consumen el comportamiento compartido del core en lugar de
   conectarse directamente al código del proveedor

Eso evita incorporar en el core los supuestos de video de un proveedor. El plugin gestiona
la superficie del proveedor; el core gestiona el contrato de capacidad y el comportamiento de respaldo.

La generación de video ya usa esa misma secuencia: el core gestiona el contrato tipado de
capacidad y la utilidad de tiempo de ejecución, y los plugins de proveedor registran
implementaciones `api.registerVideoGenerationProvider(...)` en ella.

¿Necesitas una lista concreta de pasos para el despliegue? Consulta
[Capability Cookbook](/es/plugins/architecture).

## Contratos y cumplimiento

La superficie de la API de plugins es intencionadamente tipada y está centralizada en
`OpenClawPluginApi`. Ese contrato define los puntos de registro soportados y
las utilidades de tiempo de ejecución en las que un plugin puede confiar.

Por qué importa esto:

- los autores de plugins obtienen un único estándar interno estable
- el core puede rechazar propiedad duplicada, como dos plugins que registran el mismo
  id de proveedor
- el arranque puede mostrar diagnósticos accionables para registros malformados
- las pruebas de contrato pueden hacer cumplir la propiedad de plugins incluidos y evitar desvíos silenciosos

Hay dos capas de cumplimiento:

1. **cumplimiento del registro en tiempo de ejecución**
   El registro de plugins valida los registros a medida que se cargan los plugins. Ejemplos:
   id de proveedor duplicados, id de proveedor de voz duplicados y registros
   malformados producen diagnósticos de plugin en lugar de comportamiento indefinido.
2. **pruebas de contrato**
   Los plugins incluidos se capturan en registros de contrato durante las ejecuciones de prueba para que
   OpenClaw pueda afirmar explícitamente la propiedad. Hoy esto se usa para
   proveedores de modelos, proveedores de voz, proveedores de búsqueda web y propiedad del registro incluido.

El efecto práctico es que OpenClaw sabe, desde el principio, qué plugin gestiona qué
superficie. Eso permite que el core y los canales compongan sin fricción porque la propiedad está
declarada, tipada y es comprobable, en lugar de implícita.

### Qué pertenece a un contrato

Los buenos contratos de plugins son:

- tipados
- pequeños
- específicos de una capacidad
- gestionados por el core
- reutilizables por varios plugins
- consumibles por canales/funciones sin conocimiento del proveedor

Los malos contratos de plugins son:

- política específica del proveedor oculta en el core
- válvulas de escape puntuales de plugins que evitan el registro
- código de canal que entra directamente en una implementación de proveedor
- objetos ad hoc de tiempo de ejecución que no forman parte de `OpenClawPluginApi` ni de
  `api.runtime`

En caso de duda, sube el nivel de abstracción: define primero la capacidad y luego
deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en proceso** con el Gateway. No están
aislados. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que
el código del core.

Implicaciones:

- un plugin nativo puede registrar herramientas, controladores de red, hooks y servicios
- un error en un plugin nativo puede hacer caer o desestabilizar el gateway
- un plugin nativo malicioso equivale a ejecución arbitraria de código dentro del
  proceso de OpenClaw

Los bundles compatibles son más seguros por defecto porque OpenClaw actualmente los trata
como paquetes de metadatos/contenido. En las versiones actuales, eso significa sobre todo
Skills incluidas.

Usa listas de permitidos y rutas explícitas de instalación/carga para plugins no incluidos.
Trata los plugins de workspace como código de tiempo de desarrollo, no como valores predeterminados de producción.

Para nombres de paquetes de workspace incluidos, mantén el id del plugin anclado en el nombre de npm:
`@openclaw/<id>` por defecto, o un sufijo tipado aprobado como
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando
el paquete expone intencionalmente un rol de plugin más restringido.

Nota importante sobre confianza:

- `plugins.allow` confía en los **id de plugin**, no en la procedencia de la fuente.
- Un plugin de workspace con el mismo id que un plugin incluido ensombrece intencionalmente
  la copia incluida cuando ese plugin de workspace está habilitado/en la lista de permitidos.
- Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes.

## Límite de exportación

OpenClaw exporta capacidades, no comodidad de implementación.

Mantén público el registro de capacidades. Recorta las exportaciones auxiliares que no sean contrato:

- subrutas auxiliares específicas de plugins incluidos
- subrutas de infraestructura de tiempo de ejecución no destinadas a API pública
- utilidades de comodidad específicas del proveedor
- utilidades de configuración/onboarding que son detalles de implementación

Algunas subrutas auxiliares de plugins incluidos todavía permanecen en el mapa de exportación
generado del SDK por compatibilidad y mantenimiento de plugins incluidos. Ejemplos actuales incluyen
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y varias costuras `plugin-sdk/matrix*`. Trátalas como
exportaciones reservadas de detalle de implementación, no como el patrón de SDK recomendado para
nuevos plugins de terceros.

## Canalización de carga

Al arrancar, OpenClaw hace aproximadamente esto:

1. descubre raíces de plugins candidatas
2. lee manifiestos nativos o de bundles compatibles y metadatos de paquete
3. rechaza candidatos no seguros
4. normaliza la configuración del plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga módulos nativos habilitados mediante jiti
7. llama a los hooks nativos `register(api)` (o `activate(api)` — un alias heredado) y recopila los registros en el registro de plugins
8. expone el registro a comandos/superficies de tiempo de ejecución

<Note>
`activate` es un alias heredado de `register` — el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins incluidos usan `register`; prefiere `register` para plugins nuevos.
</Note>

Las compuertas de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean
cuando la entrada escapa de la raíz del plugin, la ruta es escribible por cualquiera, o la propiedad de la ruta parece sospechosa para plugins no incluidos.

### Comportamiento con manifiesto primero

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del bundle
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/placeholders de la UI de control
- mostrar metadatos de instalación/catálogo
- conservar descriptores baratos de activación y configuración sin cargar el tiempo de ejecución del plugin

Para plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra
comportamiento real como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores solo de metadatos para planificación de activación y descubrimiento de configuración;
no reemplazan el registro en tiempo de ejecución, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan sugerencias de comando, canal y proveedor del manifiesto
para restringir la carga de plugins antes de una materialización más amplia del registro:

- la carga de CLI se restringe a plugins que gestionan el comando primario solicitado
- la configuración de canal/resolución de plugins se restringe a plugins que gestionan el
  id de canal solicitado
- la configuración/resolución explícita de proveedor en tiempo de ejecución se restringe a plugins que gestionan el
  id de proveedor solicitado

El descubrimiento de configuración ahora prefiere id propiedad de descriptores como `setup.providers` y
`setup.cliBackends` para restringir plugins candidatos antes de recurrir a
`setup-api` para plugins que todavía necesitan hooks de tiempo de ejecución en configuración. Si más de
un plugin descubierto reclama el mismo id normalizado de proveedor de configuración o backend de CLI,
la búsqueda de configuración rechaza el propietario ambiguo en lugar de depender del orden
de descubrimiento.

### Qué almacena en caché el cargador

OpenClaw mantiene cachés breves en proceso para:

- resultados de descubrimiento
- datos de registro de manifiestos
- registros de plugins cargados

Estas cachés reducen el arranque ráfaga y la sobrecarga de comandos repetidos. Es seguro
pensar en ellas como cachés de rendimiento de corta duración, no como persistencia.

Nota de rendimiento:

- Establece `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para deshabilitar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los plugins cargados no mutan directamente variables globales aleatorias del core. Se registran en un
registro central de plugins.

El registro rastrea:

- registros de plugins (identidad, fuente, origen, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- controladores RPC del Gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad del plugin

Las funciones del core luego leen de ese registro en lugar de hablar directamente con los módulos del plugin. Esto mantiene la carga en un solo sentido:

- módulo del plugin -> registro en el registro
- tiempo de ejecución del core -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del core solo
necesitan un punto de integración: "leer el registro", no "hacer casos especiales para cada módulo de plugin".

## Callbacks de asociación de conversación

Los plugins que asocian una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de asociación sea aprobada o rechazada:

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

Campos de la carga del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: la asociación resuelta para solicitudes aprobadas
- `request`: el resumen de la solicitud original, la sugerencia de desvinculación, el id del remitente y
  los metadatos de la conversación

Este callback es solo de notificación. No cambia quién puede asociar una
conversación, y se ejecuta después de que termina el manejo de aprobación del core.

## Hooks de tiempo de ejecución del proveedor

Los plugins de proveedor ahora tienen dos capas:

- metadatos de manifiesto: `providerAuthEnvVars` para búsqueda barata de autenticación de proveedor por variables de entorno
  antes de la carga en tiempo de ejecución, `providerAuthAliases` para variantes de proveedor que comparten
  autenticación, `channelEnvVars` para búsqueda barata de variables de entorno/configuración de canal antes de la carga en tiempo de ejecución,
  más `providerAuthChoices` para etiquetas baratas de onboarding/elección de autenticación y
  metadatos de flags de CLI antes de la carga en tiempo de ejecución
- hooks en tiempo de configuración: `catalog` / heredado `discovery` más `applyConfigDefaults`
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw sigue gestionando el bucle genérico del agente, la conmutación por error, el manejo de transcripciones y la
política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico del proveedor sin
necesitar un transporte de inferencia completamente personalizado.

Usa `providerAuthEnvVars` del manifiesto cuando el proveedor tenga credenciales basadas en variables de entorno
que las rutas genéricas de autenticación/estado/selector de modelo deban ver sin cargar el tiempo de ejecución del plugin. Usa `providerAuthAliases` del manifiesto cuando un id de proveedor deba reutilizar
las variables de entorno, perfiles de autenticación, autenticación respaldada por configuración y la opción de onboarding de clave API de otro id de proveedor. Usa `providerAuthChoices` del manifiesto cuando las
superficies de CLI de onboarding/elección de autenticación deban conocer el id de elección del proveedor, las etiquetas de grupo y la conexión simple de autenticación de un solo flag sin cargar el tiempo de ejecución del proveedor. Mantén `envVars` del tiempo de ejecución del proveedor para sugerencias orientadas al operador, como etiquetas de onboarding o variables de configuración de id/secret de cliente OAuth.

Usa `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración impulsada por variables de entorno que la reserva genérica de entorno de shell, las comprobaciones de configuración/estado o los prompts de configuración deban ver sin cargar el tiempo de ejecución del canal.

### Orden de hooks y uso

Para plugins de modelo/proveedor, OpenClaw llama a los hooks aproximadamente en este orden.
La columna "Cuándo usar" es la guía rápida de decisión.

| #   | Hook                              | Qué hace                                                                                                       | Cuándo usarlo                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`           | El proveedor gestiona un catálogo o valores predeterminados de URL base                                                                     |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales de configuración propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, del entorno o de la semántica de la familia de modelos del proveedor       |
| --  | _(built-in model lookup)_         | OpenClaw intenta primero la ruta normal de registro/catálogo                                                   | _(no es un hook de plugin)_                                                                                                                 |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de id de modelo antes de la búsqueda                               | El proveedor gestiona la limpieza de alias antes de la resolución del modelo canónico                                                      |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblado genérico del modelo              | El proveedor gestiona la limpieza del transporte para id de proveedor personalizados de la misma familia de transporte                      |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución de proveedor/tiempo de ejecución                      | El proveedor necesita limpieza de configuración que deba vivir con el plugin; las utilidades incluidas de la familia Google también respaldan entradas de configuración de Google compatibles |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a proveedores de configuración                | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por endpoints                                        |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación de marcador de entorno para proveedores de configuración antes de cargar la autenticación de tiempo de ejecución | El proveedor tiene resolución de claves API con marcador de entorno propiedad del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcadores de entorno de AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/alojada por uno mismo o respaldada por configuración sin persistir texto sin formato | El proveedor puede operar con un marcador de credencial sintético/local                                                                     |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externos propiedad del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales propiedad de CLI/app | El proveedor reutiliza credenciales externas de autenticación sin persistir tokens de actualización copiados                               |
| 10  | `shouldDeferSyntheticProfileAuth` | Reduce la prioridad de marcadores sintéticos almacenados de perfiles frente a autenticación respaldada por entorno/configuración | El proveedor almacena perfiles de marcador sintético que no deberían ganar precedencia                                                     |
| 11  | `resolveDynamicModel`             | Respaldo de sincronización para id de modelo propiedad del proveedor que todavía no están en el registro local | El proveedor acepta id arbitrarios de modelos upstream                                                                                      |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` se ejecuta otra vez                                       | El proveedor necesita metadatos de red antes de resolver id desconocidos                                                                    |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el embedded runner use el modelo resuelto                                       | El proveedor necesita reescrituras de transporte pero sigue usando un transporte del core                                                  |
| 14  | `contributeResolvedModelCompat`   | Aporta flags de compatibilidad para modelos del proveedor detrás de otro transporte compatible                 | El proveedor reconoce sus propios modelos en transportes proxy sin asumir el control del proveedor                                         |
| 15  | `capabilities`                    | Metadatos de transcripción/herramientas propiedad del proveedor usados por la lógica compartida del core       | El proveedor necesita particularidades de transcripción/familia de proveedor                                                                |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el embedded runner los vea                                     | El proveedor necesita limpieza de esquemas de la familia de transporte                                                                      |
| 17  | `inspectToolSchemas`              | Muestra diagnósticos de esquemas propiedad del proveedor después de la normalización                           | El proveedor quiere advertencias de palabras clave sin enseñar al core reglas específicas del proveedor                                    |
| 18  | `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo frente a etiquetado                                    | El proveedor necesita salida etiquetada de razonamiento/final en lugar de campos nativos                                                   |
| 19  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los wrappers genéricos de opciones de stream                 | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                        |
| 20  | `createStreamFn`                  | Reemplaza por completo la ruta normal de stream con un transporte personalizado                                | El proveedor necesita un protocolo de cable personalizado, no solo un wrapper                                                              |
| 21  | `wrapStreamFn`                    | Wrapper de stream después de aplicar wrappers genéricos                                                        | El proveedor necesita wrappers de compatibilidad de encabezados/cuerpo/modelo de solicitud sin un transporte personalizado                 |
| 22  | `resolveTransportTurnState`       | Adjunta encabezados nativos por turno o metadatos de transporte                                                | El proveedor quiere que transportes genéricos envíen identidad de turno nativa del proveedor                                               |
| 23  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados nativos de WebSocket o política de enfriamiento de sesión                                  | El proveedor quiere que transportes genéricos de WS ajusten encabezados de sesión o política de respaldo                                   |
| 24  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` de tiempo de ejecución | El proveedor almacena metadatos adicionales de autenticación y necesita una forma personalizada del token en tiempo de ejecución           |
| 25  | `refreshOAuth`                    | Sobrescritura de actualización de OAuth para endpoints personalizados de actualización o política de fallo de actualización | El proveedor no encaja en los actualizadores compartidos `pi-ai`                                                                            |
| 26  | `buildAuthDoctorHint`             | Sugerencia de reparación agregada cuando falla la actualización de OAuth                                       | El proveedor necesita una guía de reparación de autenticación propiedad del proveedor después de un fallo de actualización                  |
| 27  | `matchesContextOverflowError`     | Comparador de desbordamiento de ventana de contexto propiedad del proveedor                                    | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas pasarían por alto                                  |
| 28  | `classifyFailoverReason`          | Clasificación de motivo de conmutación por error propiedad del proveedor                                       | El proveedor puede mapear errores sin procesar de API/transporte a límite de tasa/sobrecarga/etc.                                          |
| 29  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                   | El proveedor necesita control de TTL de caché específico de proxy                                                                           |
| 30  | `buildMissingAuthMessage`         | Reemplazo del mensaje genérico de recuperación por autenticación faltante                                      | El proveedor necesita una sugerencia de recuperación específica del proveedor para autenticación faltante                                   |
| 31  | `suppressBuiltInModel`            | Supresión de modelos upstream obsoletos más sugerencia opcional de error visible para el usuario               | El proveedor necesita ocultar filas upstream obsoletas o reemplazarlas por una sugerencia del proveedor                                    |
| 32  | `augmentModelCatalog`             | Filas sintéticas/finales de catálogo añadidas después del descubrimiento                                       | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y en selectores                                           |
| 33  | `resolveThinkingProfile`          | Conjunto de nivel `/think`, etiquetas de visualización y valor predeterminado específicos del modelo           | El proveedor expone una escala personalizada de razonamiento o una etiqueta binaria para modelos seleccionados                             |
| 34  | `isBinaryThinking`                | Hook de compatibilidad para alternancia de razonamiento on/off                                                 | El proveedor expone solo razonamiento binario activado/desactivado                                                                          |
| 35  | `supportsXHighThinking`           | Hook de compatibilidad para soporte de razonamiento `xhigh`                                                    | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                               |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidad para el nivel `/think` predeterminado                                                   | El proveedor gestiona la política predeterminada de `/think` para una familia de modelos                                                   |
| 37  | `isModernModelRef`                | Comparador de modelo moderno para filtros de perfil en vivo y selección de smoke                               | El proveedor gestiona la coincidencia de modelos preferidos para uso en vivo/smoke                                                         |
| 38  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de tiempo de ejecución justo antes de la inferencia | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                               |
| 39  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies relacionadas de estado                   | El proveedor necesita análisis personalizado de token de uso/cuota o una credencial de uso diferente                                       |
| 40  | `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas específicas del proveedor de uso/cuota después de resolver la autenticación   | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de payload                                                |
| 41  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                             | El comportamiento de embeddings para memoria pertenece al plugin del proveedor                                                              |
| 42  | `buildReplayPolicy`               | Devuelve una política de reproducción que controla el manejo de transcripciones para el proveedor              | El proveedor necesita una política personalizada de transcripción, por ejemplo, eliminación de bloques de razonamiento                     |
| 43  | `sanitizeReplayHistory`           | Reescribe el historial de reproducción después de la limpieza genérica de transcripciones                      | El proveedor necesita reescrituras de reproducción específicas del proveedor más allá de las utilidades compartidas de Compaction          |
| 44  | `validateReplayTurns`             | Validación o remodelado final de turnos de reproducción antes del embedded runner                              | El transporte del proveedor necesita validación más estricta de turnos después del saneamiento genérico                                    |
| 45  | `onModelSelected`                 | Ejecuta efectos secundarios posteriores a la selección propiedad del proveedor                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo se vuelve activo                                         |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
plugin de proveedor coincidente y luego recorren otros plugins de proveedor con capacidad de hook
hasta que uno realmente cambie el id del modelo o el transporte/configuración. Eso mantiene
funcionando los shims de alias/compatibilidad de proveedor sin requerir que el llamador sepa qué
plugin incluido gestiona la reescritura. Si ningún hook de proveedor reescribe una entrada de configuración compatible de la familia Google, el normalizador de configuración incluido de Google sigue aplicando esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable completamente personalizado o un ejecutor de solicitudes personalizado,
eso es una clase diferente de extensión. Estos hooks son para comportamiento del proveedor
que todavía se ejecuta en el bucle normal de inferencia de OpenClaw.

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
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  y `wrapStreamFn` porque gestiona la compatibilidad futura de Claude 4.6,
  sugerencias de familia de proveedor, orientación para reparar autenticación, integración de
  endpoints de uso, elegibilidad de caché de prompts, valores predeterminados de configuración conscientes de la autenticación, política de razonamiento
  predeterminada/adaptativa de Claude y la conformación de stream específica de Anthropic para
  encabezados beta, `/fast` / `serviceTier` y `context1m`.
- Las utilidades de stream específicas de Claude de Anthropic permanecen por ahora en la propia
  costura pública `api.ts` / `contract-api.ts` del plugin incluido. Esa superficie del paquete
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los constructores de wrappers de Anthropic
  de más bajo nivel en lugar de ampliar el SDK genérico en torno a las reglas de encabezados beta de un solo
  proveedor.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` y
  `capabilities` además de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` e `isModernModelRef`
  porque gestiona la compatibilidad futura de GPT-5.4, la normalización directa de OpenAI
  `openai-completions` -> `openai-responses`, sugerencias de autenticación conscientes de Codex,
  la supresión de Spark, filas sintéticas de lista de OpenAI y la política de razonamiento /
  modelos en vivo de GPT-5; la familia de stream `openai-responses-defaults` gestiona los
  wrappers nativos compartidos de OpenAI Responses para encabezados de atribución,
  `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex,
  conformación de payload de compatibilidad de razonamiento y gestión de contexto de Responses.
- OpenRouter usa `catalog` además de `resolveDynamicModel` y
  `prepareDynamicModel` porque el proveedor es de paso y puede exponer nuevos
  id de modelos antes de que se actualice el catálogo estático de OpenClaw; también usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para mantener
  fuera del core los encabezados de solicitud específicos del proveedor, metadatos de enrutamiento, parches de razonamiento y
  la política de caché de prompts. Su política de reproducción proviene de la
  familia `passthrough-gemini`, mientras que la familia de stream `openrouter-thinking`
  gestiona la inyección de razonamiento proxy y las omisiones de modelos no soportados / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` y
  `capabilities` además de `prepareRuntimeAuth` y `fetchUsageSnapshot` porque
  necesita inicio de sesión de dispositivo propiedad del proveedor, comportamiento de reserva de modelo, peculiaridades de transcripción de Claude,
  un intercambio de token de GitHub -> token de Copilot y un endpoint de uso propiedad del proveedor.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` y `augmentModelCatalog` además de
  `prepareExtraParams`, `resolveUsageAuth` y `fetchUsageSnapshot` porque
  todavía se ejecuta sobre transportes core de OpenAI pero gestiona su normalización de
  transporte/URL base, la política de respaldo de actualización de OAuth, la elección predeterminada de transporte,
  filas sintéticas de catálogo de Codex y la integración con el endpoint de uso de ChatGPT; comparte la misma familia de stream `openai-responses-defaults` que OpenAI directo.
- Google AI Studio y Gemini CLI OAuth usan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque la
  familia de reproducción `google-gemini` gestiona la reserva de compatibilidad futura de Gemini 3.1,
  la validación nativa de reproducción de Gemini, el saneamiento de reproducción de arranque, el modo
  etiquetado de salida de razonamiento y la coincidencia de modelos modernos, mientras que la
  familia de stream `google-thinking` gestiona la normalización de payload de razonamiento de Gemini;
  Gemini CLI OAuth también usa `formatApiKey`, `resolveUsageAuth` y
  `fetchUsageSnapshot` para el formato de tokens, análisis de tokens y conexión con el endpoint de cuota.
- Anthropic Vertex usa `buildReplayPolicy` a través de la
  familia de reproducción `anthropic-by-model` para que la limpieza de reproducción específica de Claude quede
  acotada a id de Claude en lugar de a cada transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` y `resolveThinkingProfile` porque gestiona la clasificación
  específica de Bedrock de errores de limitación/no listo/desbordamiento de contexto
  para tráfico Anthropic-on-Bedrock; su política de reproducción todavía comparte la misma
  protección `anthropic-by-model` solo para Claude.
- OpenRouter, Kilocode, Opencode y Opencode Go usan `buildReplayPolicy`
  mediante la familia de reproducción `passthrough-gemini` porque hacen proxy de modelos Gemini
  a través de transportes compatibles con OpenAI y necesitan
  saneamiento de firmas de pensamiento de Gemini sin validación nativa de reproducción de Gemini ni
  reescrituras de arranque.
- MiniMax usa `buildReplayPolicy` mediante la
  familia de reproducción `hybrid-anthropic-openai` porque un solo proveedor gestiona
  tanto semántica de mensajes Anthropic como compatibilidad con OpenAI; mantiene el descarte de
  bloques de razonamiento solo de Claude en el lado Anthropic mientras sobrescribe el modo de salida de razonamiento de vuelta a nativo, y la familia de stream `minimax-fast-mode` gestiona
  las reescrituras de modelos de modo rápido en la ruta de stream compartida.
- Moonshot usa `catalog`, `resolveThinkingProfile` y `wrapStreamFn` porque todavía usa el
  transporte compartido de OpenAI pero necesita normalización de payload de razonamiento propiedad del proveedor; la
  familia de stream `moonshot-thinking` mapea la configuración más el estado `/think` a su
  payload nativo binario de razonamiento.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque necesita encabezados de solicitud propiedad del proveedor,
  normalización de payload de razonamiento, sugerencias de transcripción de Gemini y control de TTL de caché de Anthropic; la familia de stream `kilocode-thinking` mantiene la inyección de razonamiento de Kilo
  en la ruta compartida de stream proxy mientras omite `kilo/auto` y
  otros id de modelos proxy que no admiten payloads explícitos de razonamiento.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` y `fetchUsageSnapshot` porque gestiona la reserva de GLM-5,
  los valores predeterminados de `tool_stream`, la UX de razonamiento binario, la coincidencia de modelos modernos y tanto
  la autenticación de uso como la obtención de cuota; la familia de stream `tool-stream-default-on` mantiene
  fuera del pegamento manuscrito por proveedor el wrapper `tool_stream` activado por defecto.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque gestiona la normalización nativa del transporte de xAI Responses, las reescrituras de alias del modo rápido de Grok, el valor predeterminado `tool_stream`, la limpieza estricta de herramientas / payload de razonamiento,
  la reutilización de autenticación de respaldo para herramientas propiedad del plugin, la resolución de modelos Grok con compatibilidad futura y parches de compatibilidad propiedad del proveedor, como el perfil de esquema de herramientas de xAI,
  palabras clave de esquema no soportadas, `web_search` nativo y decodificación de argumentos de llamadas a herramientas con entidades HTML.
- Mistral, OpenCode Zen y OpenCode Go usan solo `capabilities` para mantener
  fuera del core las peculiaridades de transcripciones/herramientas.
- Los proveedores incluidos solo de catálogo como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` y `volcengine` usan
  solo `catalog`.
- Qwen usa `catalog` para su proveedor de texto más registros compartidos de comprensión de medios y
  generación de video para sus superficies multimodales.
- MiniMax y Xiaomi usan `catalog` más hooks de uso porque su comportamiento de `/usage`
  es propiedad del plugin aunque la inferencia siga ejecutándose mediante transportes compartidos.

## Utilidades de tiempo de ejecución

Los plugins pueden acceder a utilidades seleccionadas del core mediante `api.runtime`. Para TTS:

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
- Devuelve búfer de audio PCM + frecuencia de muestreo. Los plugins deben remuestrear/codificar para proveedores.
- `listVoices` es opcional según el proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos como locale, gender y etiquetas de personalidad para selectores conscientes del proveedor.
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

- Mantén en el core la política de TTS, el respaldo y la entrega de respuestas.
- Usa proveedores de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un solo plugin de proveedor puede gestionar
  proveedores de texto, voz, imágenes y medios futuros a medida que OpenClaw agregue esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los plugins registran un proveedor tipado de
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

- Mantén la orquestación, el respaldo, la configuración y la conexión con canales en el core.
- Mantén el comportamiento del proveedor en el plugin del proveedor.
- La expansión aditiva debe seguir siendo tipada: nuevos métodos opcionales, nuevos
  campos opcionales de resultado, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el core gestiona el contrato de capacidad y la utilidad de tiempo de ejecución
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para las utilidades de tiempo de ejecución de comprensión de medios, los plugins pueden llamar a:

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
o el alias heredado de STT:

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
  comprensión de imagen/audio/video.
- Usa la configuración de audio de comprensión de medios del core (`tools.media.audio`) y el orden de respaldo del proveedor.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción, por ejemplo, con entrada omitida o no compatible.
- `api.runtime.stt.transcribeAudioFile(...)` se mantiene como alias de compatibilidad.

Los plugins también pueden lanzar ejecuciones de subagentes en segundo plano mediante `api.runtime.subagent`:

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

- `provider` y `model` son sobrescrituras opcionales por ejecución, no cambios persistentes de sesión.
- OpenClaw solo respeta esos campos de sobrescritura para llamadores de confianza.
- Para ejecuciones de respaldo propiedad del plugin, los operadores deben habilitarlo explícitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir los plugins de confianza a objetivos canónicos específicos `provider/model`, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagentes de plugins no confiables siguen funcionando, pero las solicitudes de sobrescritura se rechazan en lugar de caer silenciosamente en un respaldo.

Para búsqueda web, los plugins pueden consumir la utilidad compartida de tiempo de ejecución en lugar de
entrar en la conexión de herramientas del agente:

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

- Mantén la selección de proveedor, la resolución de credenciales y la semántica compartida de solicitudes en el core.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de función/canal que necesitan comportamiento de búsqueda sin depender del wrapper de herramientas del agente.

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
- `auth`: obligatorio. Usa `"gateway"` para requerir la autenticación normal del gateway, o `"plugin"` para autenticación/validación de Webhook gestionada por el plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta gestionó la solicitud.

Notas:

- `api.registerHttpHandler(...)` fue eliminado y provocará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan a menos que `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Las rutas superpuestas con diferentes niveles de `auth` se rechazan. Mantén las cadenas de paso `exact`/`prefix` solo dentro del mismo nivel de autenticación.
- Las rutas con `auth: "plugin"` **no** reciben automáticamente alcances de tiempo de ejecución del operador. Son para Webhooks gestionados por el plugin/verificación de firmas, no para llamadas privilegiadas a utilidades del Gateway.
- Las rutas con `auth: "gateway"` se ejecutan dentro de un alcance de tiempo de ejecución de solicitud del Gateway, pero ese alcance es intencionadamente conservador:
  - la autenticación bearer de secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los alcances de tiempo de ejecución de rutas de plugins fijados en `operator.write`, incluso si el llamador envía `x-openclaw-scopes`
  - los modos HTTP confiables con identidad (por ejemplo, `trusted-proxy` o `gateway.auth.mode = "none"` en una entrada privada) respetan `x-openclaw-scopes` solo cuando el encabezado está presente explícitamente
  - si `x-openclaw-scopes` está ausente en esas solicitudes de ruta de plugin con identidad, el alcance de tiempo de ejecución vuelve a `operator.write`
- Regla práctica: no asumas que una ruta de plugin autenticada por gateway es una superficie de administración implícita. Si tu ruta necesita comportamiento solo de administrador, exige un modo de autenticación con identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

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
  `openclaw/plugin-sdk/webhook-ingress` para la conexión compartida de configuración/autenticación/respuesta/Webhook.
  `channel-inbound` es el hogar compartido para debounce, coincidencia de menciones,
  utilidades de política de menciones entrantes, formato de envolturas y utilidades de contexto
  de envolturas entrantes.
  `channel-setup` es la costura restringida de configuración para instalación opcional.
  `setup-runtime` es la superficie segura en tiempo de ejecución de configuración usada por `setupEntry` /
  arranque diferido, incluidos los adaptadores de parche de configuración seguros para importación.
  `setup-adapter-runtime` es la costura del adaptador de configuración de cuenta consciente del entorno.
  `setup-tools` es la costura pequeña de utilidades de CLI/archivo/docs (`formatCliCommand`,
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
  `openclaw/plugin-sdk/directory-runtime` para utilidades compartidas de tiempo de ejecución/configuración.
  `telegram-command-config` es la costura pública restringida para normalización/validación de comandos personalizados de Telegram y sigue disponible aunque la superficie de contrato incluida de Telegram no esté disponible temporalmente.
  `text-runtime` es la costura compartida de texto/markdown/registro, incluidos
  el filtrado de texto visible para el asistente, utilidades de renderizado/fragmentación de markdown, utilidades de redacción,
  utilidades de etiquetas de directiva y utilidades de texto seguro.
- Las costuras de canal específicas de aprobación deberían preferir un único contrato `approvalCapability` en el plugin. El core entonces lee autenticación, entrega, renderizado,
  enrutamiento nativo y comportamiento perezoso de controladores nativos de aprobación mediante esa única capacidad
  en lugar de mezclar el comportamiento de aprobación en campos no relacionados del plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto y se mantiene solo como
  shim de compatibilidad para plugins antiguos. El código nuevo debería importar en su lugar las primitivas genéricas más restringidas, y el código del repositorio no debería agregar nuevas importaciones del
  shim.
- Los aspectos internos de extensiones incluidas permanecen privados. Los plugins externos deberían usar solo subrutas `openclaw/plugin-sdk/*`. El código core/de pruebas de OpenClaw puede usar los
  puntos de entrada públicos del repositorio bajo una raíz de paquete de plugin como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` y archivos de alcance restringido como
  `login-qr-api.js`. Nunca importes `src/*` de un paquete de plugin desde el core o desde
  otra extensión.
- División de puntos de entrada del repositorio:
  `<plugin-package-root>/api.js` es el barril de utilidades/tipos,
  `<plugin-package-root>/runtime-api.js` es el barril solo de tiempo de ejecución,
  `<plugin-package-root>/index.js` es la entrada del plugin incluido,
  y `<plugin-package-root>/setup-entry.js` es la entrada del plugin de configuración.
- Ejemplos actuales de proveedores incluidos:
  - Anthropic usa `api.js` / `contract-api.js` para utilidades de stream de Claude como
    `wrapAnthropicProviderStream`, utilidades de encabezados beta y análisis de `service_tier`.
  - OpenAI usa `api.js` para constructores de proveedores, utilidades de modelo predeterminado y
    constructores de proveedores en tiempo real.
  - OpenRouter usa `api.js` para su constructor de proveedor más utilidades de onboarding/configuración,
    mientras que `register.runtime.js` aún puede reexportar utilidades genéricas
    `plugin-sdk/provider-stream` para uso local en el repositorio.
- Los puntos de entrada públicos cargados mediante fachada prefieren la instantánea de configuración activa en tiempo de ejecución
  cuando existe una, y luego vuelven a la configuración resuelta en disco cuando
  OpenClaw todavía no sirve una instantánea de tiempo de ejecución.
- Las primitivas genéricas compartidas siguen siendo el contrato público preferido del SDK. Aún existe un pequeño
  conjunto reservado de compatibilidad de costuras auxiliares de canal con marca de incluidos. Trátalas como costuras de mantenimiento/compatibilidad de incluidos, no como nuevos objetivos de importación de terceros; los nuevos contratos entre canales deberían seguir incorporándose a subrutas genéricas `plugin-sdk/*` o a los barriles locales del plugin `api.js` /
  `runtime-api.js`.

Nota de compatibilidad:

- Evita el barril raíz `openclaw/plugin-sdk` en código nuevo.
- Prefiere primero las primitivas estables restringidas. Las subrutas más nuevas de setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool son el contrato previsto para trabajo nuevo
  de plugins incluidos y externos.
  El análisis/coincidencia de destinos pertenece a `openclaw/plugin-sdk/channel-targets`.
  Las compuertas de acciones de mensajes y las utilidades de id de mensaje de reacciones pertenecen a
  `openclaw/plugin-sdk/channel-actions`.
- Los barriles auxiliares específicos de extensiones incluidas no son estables por defecto. Si una
  utilidad solo la necesita una extensión incluida, mantenla detrás de la costura
  local `api.js` o `runtime-api.js` de la extensión en lugar de promoverla a
  `openclaw/plugin-sdk/<extension>`.
- Las nuevas costuras compartidas de utilidades deberían ser genéricas, no con marca de canal. El análisis de destinos compartido
  pertenece a `openclaw/plugin-sdk/channel-targets`; los aspectos internos específicos del canal
  permanecen detrás de la costura local `api.js` o `runtime-api.js` del plugin propietario.
- Las subrutas específicas de capacidad como `image-generation`,
  `media-understanding` y `speech` existen porque los plugins nativos/incluidos las usan
  hoy. Su presencia no significa por sí sola que toda utilidad exportada sea un contrato externo congelado a largo plazo.

## Esquemas de la herramienta de mensajes

Los plugins deben gestionar las contribuciones de esquema específicas del canal en `describeMessageTool(...)`.
Mantén los campos específicos del proveedor en el plugin, no en el core compartido.

Para fragmentos compartidos y portables de esquema, reutiliza las utilidades genéricas exportadas mediante
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para payloads tipo cuadrícula de botones
- `createMessageToolCardSchema()` para payloads de tarjetas estructuradas

Si una forma de esquema solo tiene sentido para un proveedor, defínela en la propia
fuente de ese plugin en lugar de promoverla al SDK compartido.

## Resolución de destinos de canal

Los plugins de canal deben gestionar la semántica específica de destinos del canal. Mantén genérico el
host compartido saliente y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al core si una
  entrada debe pasar directamente a resolución tipo id en lugar de búsqueda en directorio.
- `messaging.targetResolver.resolveTarget(...)` es el respaldo del plugin cuando
  el core necesita una resolución final propiedad del proveedor después de la normalización o tras un
  fallo de búsqueda en directorio.
- `messaging.resolveOutboundSessionRoute(...)` gestiona la construcción específica del proveedor de la
  ruta de sesión una vez resuelto un destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deberían ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de "tratar esto como un id de destino explícito/nativo".
- Usa `resolveTarget` como respaldo de normalización específico del proveedor, no para
  búsqueda amplia en directorio.
- Mantén los id nativos del proveedor, como id de chat, id de hilo, JID, handles e id de sala,
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio a partir de configuración deben mantener esa lógica en el
plugin y reutilizar las utilidades compartidas de
`openclaw/plugin-sdk/directory-runtime`.

Usa esto cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares DM impulsados por allowlist
- mapas configurados de canal/grupo
- respaldos estáticos de directorio con alcance por cuenta

Las utilidades compartidas en `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- utilidades de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas y la normalización de id específicas del canal deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para múltiples entradas de proveedor

Usa `catalog` cuando el plugin gestione id de modelos específicos del proveedor, valores predeterminados de URL base o metadatos de modelos protegidos por autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un plugin con respecto a los proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples impulsados por clave API o entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan múltiples entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en colisión de claves, así que los plugins pueden sobrescribir intencionalmente una entrada integrada de proveedor con el mismo id de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran ambos, `catalog` y `discovery`, OpenClaw usa `catalog`

## Inspección de canal de solo lectura

Si tu plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de tiempo de ejecución. Puede asumir que las credenciales
  están completamente materializadas y puede fallar rápido cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y flujos de reparación de doctor/configuración
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
- No necesitas devolver valores sin procesar de tokens solo para informar disponibilidad
  de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen correspondiente)
  es suficiente para comandos tipo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen "configurado pero no disponible en esta ruta de comando" en lugar de fallar o informar incorrectamente que la cuenta no está configurada.

## Package packs

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

Cada entrada se convierte en un plugin. Si el pack enumera múltiples extensiones, el id del plugin
pasa a ser `name/<fileBase>`.

Si tu plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Barandilla de seguridad: cada entrada `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de resolver symlinks. Las entradas que escapan del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias del plugin con
`npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida ni dependencias de desarrollo en tiempo de ejecución). Mantén los árboles de dependencias del plugin como "pure JS/TS" y evita paquetes que requieran compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún no configurado, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto mantiene más ligero el arranque y la configuración
cuando tu entrada principal del plugin también conecta herramientas, hooks u otro código
solo de tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un plugin de canal opte por la misma ruta `setupEntry` durante la fase
de arranque previa a escucha del gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra completamente la superficie de arranque que debe existir
antes de que el gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar toda capacidad propiedad del canal de la que dependa el arranque, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway empiece a escuchar
- cualquier método, herramienta o servicio del gateway que deba existir durante esa misma ventana

Si tu entrada completa todavía gestiona alguna capacidad de arranque requerida, no habilites
este flag. Mantén el plugin con el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el arranque.

Los canales incluidos también pueden publicar utilidades de superficie de contrato solo de configuración que el core
puede consultar antes de que se cargue el tiempo de ejecución completo del canal. La superficie actual de promoción
de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El core usa esa superficie cuando necesita promover una configuración heredada de canal de cuenta única
a `channels.<id>.accounts.*` sin cargar la entrada completa del plugin.
Matrix es el ejemplo incluido actual: mueve solo claves de autenticación/arranque a una
cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede conservar una
clave configurada de cuenta predeterminada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parche de configuración mantienen perezoso el descubrimiento de superficie de contrato incluida. El tiempo
de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de
volver a entrar al arranque del canal incluido en la importación del módulo.

Cuando esas superficies de arranque incluyen métodos RPC del gateway, mantenlas en un
prefijo específico del plugin. Los espacios de nombres de administración del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven
a `operator.admin`, incluso si un plugin solicita un alcance más restringido.

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

### Metadatos de catálogo de canales

Los plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
sugerencias de instalación mediante `openclaw.install`. Esto mantiene al core libre de datos de catálogo.

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

Campos útiles de `openclaw.channel` más allá del ejemplo mínimo:

- `detailLabel`: etiqueta secundaria para superficies más ricas de catálogo/estado
- `docsLabel`: sobrescribe el texto del enlace para el enlace a documentación
- `preferOver`: id de plugin/canal de menor prioridad a los que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto de la superficie de selección
- `markdownCapable`: marca el canal como capaz de usar markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados que aún se aceptan por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: hace que el canal participe en el flujo estándar de quickstart `allowFrom`
- `forceAccountBinding`: requiere asociación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere búsqueda de sesión al resolver destinos de anuncio

OpenClaw también puede fusionar **catálogos externos de canales** (por ejemplo, una exportación
de registro MPM). Coloca un archivo JSON en una de estas ubicaciones:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o más archivos JSON (delimitados por comas/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados para la clave `"entries"`.

## Plugins de motor de contexto

Los plugins de motor de contexto gestionan la orquestación del contexto de sesión para ingestión, ensamblaje
y Compaction. Regístralos desde tu plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Usa esto cuando tu plugin necesite reemplazar o ampliar la canalización de contexto predeterminada
en lugar de solo agregar búsqueda en memoria o hooks.

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

Si tu motor **no** gestiona el algoritmo de Compaction, mantén `compact()`
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

## Agregar una nueva capacidad

Cuando un plugin necesita un comportamiento que no encaja en la API actual, no evites
el sistema de plugins con un acceso privado. Agrega la capacidad que falta.

Secuencia recomendada:

1. define el contrato del core
   Decide qué comportamiento compartido debe gestionar el core: política, respaldo, fusión de configuración,
   ciclo de vida, semántica orientada a canales y forma de la utilidad de tiempo de ejecución.
2. agrega superficies tipadas de registro/tiempo de ejecución del plugin
   Amplía `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada de capacidad más pequeña y útil.
3. conecta consumidores del core + canal/función
   Los canales y plugins de función deben consumir la nueva capacidad a través del core,
   no importando directamente una implementación del proveedor.
4. registra implementaciones del proveedor
   Los plugins de proveedor registran entonces sus backends contra la capacidad.
5. agrega cobertura de contrato
   Agrega pruebas para que la propiedad y la forma del registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw sigue siendo opinado sin quedar codificado de forma rígida según la visión del mundo de un
solo proveedor. Consulta el [Capability Cookbook](/es/plugins/architecture)
para ver una lista concreta de archivos y un ejemplo trabajado.

### Lista de verificación de capacidad

Cuando agregas una nueva capacidad, la implementación normalmente debería tocar estas
superficies juntas:

- tipos de contrato del core en `src/<capability>/types.ts`
- helper de runner/tiempo de ejecución del core en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- conexión del registro de plugins en `src/plugins/registry.ts`
- exposición del tiempo de ejecución del plugin en `src/plugins/runtime/*` cuando los plugins de función/canal
  necesiten consumirla
- utilidades de captura/prueba en `src/test-utils/plugin-registration.ts`
- afirmaciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores/plugins en `docs/`

Si falta una de esas superficies, normalmente es una señal de que la capacidad
todavía no está completamente integrada.

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

Eso mantiene simple la regla:

- el core gestiona el contrato de capacidad + la orquestación
- los plugins de proveedor gestionan implementaciones de proveedor
- los plugins de función/canal consumen utilidades de tiempo de ejecución
- las pruebas de contrato mantienen explícita la propiedad
