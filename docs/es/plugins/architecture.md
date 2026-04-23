---
read_when:
    - Creando o depurando plugins nativos de OpenClaw
    - Comprender el modelo de capacidades del Plugin o los límites de propiedad
    - Trabajando en la canalización de carga del Plugin o en el registro
    - Implementando hooks de tiempo de ejecución de proveedores o plugins de canales
sidebarTitle: Internals
summary: 'Aspectos internos del Plugin: modelo de capacidades, propiedad, contratos, canalización de carga y ayudantes de tiempo de ejecución'
title: Aspectos internos del Plugin
x-i18n:
    generated_at: "2026-04-23T14:04:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5a766c267b2618140c744cbebd28f2b206568f26ce50095b898520f4663e21d
    source_path: plugins/architecture.md
    workflow: 15
---

# Aspectos internos del Plugin

<Info>
  Esta es la **referencia profunda de arquitectura**. Para guías prácticas, consulta:
  - [Instalar y usar plugins](/es/tools/plugin) — guía para usuarios
  - [Primeros pasos](/es/plugins/building-plugins) — primer tutorial de Plugin
  - [Plugins de canal](/es/plugins/sdk-channel-plugins) — crea un canal de mensajería
  - [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crea un proveedor de modelos
  - [Resumen del SDK](/es/plugins/sdk-overview) — mapa de importación y API de registro
</Info>

Esta página cubre la arquitectura interna del sistema de plugins de OpenClaw.

## Modelo público de capacidades

Las capacidades son el modelo público de **Plugin nativo** dentro de OpenClaw. Cada
Plugin nativo de OpenClaw se registra en uno o más tipos de capacidad:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferencia de texto         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferencia de CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Voz                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voz en tiempo real         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Comprensión de medios    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generación de imágenes       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generación de música       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generación de video       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Obtención web              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Búsqueda web             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensajería    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Un Plugin que registra cero capacidades pero proporciona hooks, herramientas o
servicios es un Plugin **heredado solo de hooks**. Ese patrón sigue siendo totalmente compatible.

### Postura de compatibilidad externa

El modelo de capacidades ya está incorporado en el núcleo y lo usan los plugins integrados/nativos
actuales, pero la compatibilidad de plugins externos todavía necesita un criterio más estricto que "está
exportado, por lo tanto está congelado".

Guía actual:

- **plugins externos existentes:** mantén funcionando las integraciones basadas en hooks; trátalo
  como la base de compatibilidad
- **plugins integrados/nativos nuevos:** prefiere el registro explícito de capacidades sobre
  accesos específicos de proveedor o nuevos diseños solo de hooks
- **plugins externos que adopten el registro de capacidades:** permitido, pero trata las
  superficies auxiliares específicas de capacidades como algo evolutivo, salvo que la documentación marque
  explícitamente un contrato como estable

Regla práctica:

- las API de registro de capacidades son la dirección prevista
- los hooks heredados siguen siendo la ruta más segura sin roturas para plugins externos durante
  la transición
- no todas las subrutas auxiliares exportadas son iguales; prefiere el contrato
  estrecho y documentado, no exportaciones auxiliares incidentales

### Formas de Plugin

OpenClaw clasifica cada Plugin cargado en una forma según su comportamiento real
de registro (no solo metadatos estáticos):

- **plain-capability** -- registra exactamente un tipo de capacidad (por ejemplo, un
  Plugin solo de proveedor como `mistral`)
- **hybrid-capability** -- registra varios tipos de capacidad (por ejemplo,
  `openai` es dueño de inferencia de texto, voz, comprensión de medios y generación
  de imágenes)
- **hook-only** -- registra solo hooks (tipados o personalizados), sin capacidades,
  herramientas, comandos ni servicios
- **non-capability** -- registra herramientas, comandos, servicios o rutas, pero no
  capacidades

Usa `openclaw plugins inspect <id>` para ver la forma y el desglose de capacidades
de un Plugin. Consulta [referencia de CLI](/es/cli/plugins#inspect) para más detalles.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como ruta de compatibilidad para
plugins solo de hooks. Los plugins heredados del mundo real siguen dependiendo de él.

Dirección:

- mantenlo funcionando
- documéntalo como heredado
- prefiere `before_model_resolve` para trabajo de sobrescritura de modelo/proveedor
- prefiere `before_prompt_build` para trabajo de mutación de prompts
- elimínalo solo cuando el uso real baje y la cobertura de fixtures demuestre seguridad en la migración

### Señales de compatibilidad

Cuando ejecutas `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver
una de estas etiquetas:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configuración se analiza correctamente y los plugins se resuelven                       |
| **compatibility advisory** | El Plugin usa un patrón compatible pero antiguo (por ejemplo, `hook-only`) |
| **legacy warning**         | El Plugin usa `before_agent_start`, que está desaprobado        |
| **hard error**             | La configuración no es válida o el Plugin no pudo cargarse                   |

Ni `hook-only` ni `before_agent_start` romperán tu Plugin hoy:
`hook-only` es informativo, y `before_agent_start` solo activa una advertencia. Estas
señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Resumen de arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

1. **Manifiesto + descubrimiento**
   OpenClaw encuentra plugins candidatos desde rutas configuradas, raíces del espacio de trabajo,
   raíces globales de plugins y plugins integrados. El descubrimiento lee primero
   manifiestos nativos `openclaw.plugin.json` más manifiestos de paquetes compatibles.
2. **Habilitación + validación**
   El núcleo decide si un Plugin descubierto está habilitado, deshabilitado, bloqueado o
   seleccionado para una ranura exclusiva, como memoria.
3. **Carga en tiempo de ejecución**
   Los plugins nativos de OpenClaw se cargan en proceso mediante jiti y registran
   capacidades en un registro central. Los paquetes compatibles se normalizan en
   registros del registro sin importar código en tiempo de ejecución.
4. **Consumo de superficies**
   El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración
   de proveedores, hooks, rutas HTTP, comandos de CLI y servicios.

Específicamente para la CLI de plugins, el descubrimiento del comando raíz se divide en dos fases:

- los metadatos en tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo CLI real del Plugin puede permanecer diferido y registrarse en la primera invocación

Eso mantiene el código CLI propiedad del Plugin dentro del Plugin y aun así permite a OpenClaw
reservar nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- el descubrimiento + la validación de configuración deben funcionar a partir de **metadatos de manifiesto/esquema**
  sin ejecutar código del Plugin
- el comportamiento nativo en tiempo de ejecución proviene de la ruta `register(api)` del módulo del Plugin

Esa división permite a OpenClaw validar configuración, explicar plugins ausentes/deshabilitados y
construir sugerencias de UI/esquema antes de que el tiempo de ejecución completo esté activo.

### Plugins de canal y la herramienta compartida de mensajes

Los plugins de canal no necesitan registrar una herramienta separada de envío/edición/reacción para
acciones normales de chat. OpenClaw mantiene una única herramienta compartida `message` en el núcleo, y
los plugins de canal son dueños del descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el núcleo es dueño del host compartido de la herramienta `message`, del cableado del prompt, del
  registro de sesión/hilo y del despacho de ejecución
- los plugins de canal son dueños del descubrimiento de acciones con ámbito, del descubrimiento de capacidades y de cualquier
  fragmento de esquema específico del canal
- los plugins de canal son dueños de la gramática de conversación de sesión específica del proveedor, como
  cómo los id de conversación codifican id de hilo o heredan de conversaciones padre
- los plugins de canal ejecutan la acción final a través de su adaptador de acciones

Para plugins de canal, la superficie del SDK es
`ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada unificada de descubrimiento
permite que un Plugin devuelva sus acciones visibles, capacidades y contribuciones de esquema
juntas, para que esas piezas no se desincronicen.

Cuando un parámetro de la herramienta de mensajes específico del canal lleva una fuente de medios como una
ruta local o URL remota de medios, el Plugin también debe devolver
`mediaSourceParams` desde `describeMessageTool(...)`. El núcleo usa esa lista explícita
para aplicar normalización de rutas de sandbox y sugerencias de acceso saliente a medios
sin codificar nombres de parámetros propiedad del Plugin.
Prefiere mapas con ámbito de acción ahí, no una lista plana para todo el canal, de forma que
un parámetro de medios solo de perfil no se normalice en acciones no relacionadas como
`send`.

El núcleo pasa el ámbito de tiempo de ejecución a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante confiable

Eso importa para plugins sensibles al contexto. Un canal puede ocultar o exponer
acciones de mensajes según la cuenta activa, la sala/hilo/mensaje actual o la
identidad confiable del solicitante, sin codificar ramas específicas del canal en la
herramienta central `message`.

Por eso los cambios de enrutamiento del ejecutor incrustado siguen siendo trabajo del Plugin: el ejecutor es
responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del Plugin para que la
herramienta compartida `message` exponga la superficie correcta propiedad del canal para el turno actual.

Para ayudantes de ejecución propiedad del canal, los plugins integrados deben mantener el tiempo de ejecución de
ejecución dentro de sus propios módulos de extensión. El núcleo ya no es dueño de los tiempos de ejecución de acciones de mensajes
de Discord, Slack, Telegram o WhatsApp bajo `src/agents/tools`.
No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los plugins integrados
deben importar su propio código de tiempo de ejecución local directamente desde sus
módulos propiedad de la extensión.

El mismo límite se aplica a las costuras del SDK con nombre de proveedor en general: el núcleo no
debe importar barriles de conveniencia específicos de canal para extensiones de Slack, Discord, Signal,
WhatsApp o similares. Si el núcleo necesita un comportamiento, debe consumir el
propio barril `api.ts` / `runtime-api.ts` del Plugin integrado o promover la necesidad a una
capacidad genérica y estrecha en el SDK compartido.

Específicamente para encuestas, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para canales que encajan en el modelo común
  de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semánticas de encuestas específicas del canal o parámetros adicionales de encuesta

El núcleo ahora difiere el análisis compartido de encuestas hasta después de que el despacho de encuestas del Plugin rechace
la acción, de modo que los controladores de encuestas propiedad del Plugin puedan aceptar campos de encuesta
específicos del canal sin quedar bloqueados primero por el analizador genérico de encuestas.

Consulta [Canalización de carga](#load-pipeline) para la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata un Plugin nativo como el límite de propiedad para una **empresa** o una
**función**, no como una bolsa de integraciones no relacionadas.

Eso significa:

- un Plugin de empresa normalmente debería ser dueño de todas las superficies de OpenClaw
  de esa empresa
- un Plugin de función normalmente debería ser dueño de toda la superficie de la función que introduce
- los canales deben consumir capacidades compartidas del núcleo en lugar de reimplementar
  comportamiento de proveedor de forma ad hoc

Ejemplos:

- el Plugin integrado `openai` es dueño del comportamiento de proveedor de modelos de OpenAI y del comportamiento de voz + voz en tiempo real + comprensión de medios + generación de imágenes de OpenAI
- el Plugin integrado `elevenlabs` es dueño del comportamiento de voz de ElevenLabs
- el Plugin integrado `microsoft` es dueño del comportamiento de voz de Microsoft
- el Plugin integrado `google` es dueño del comportamiento de proveedor de modelos de Google además del comportamiento de comprensión de medios + generación de imágenes + búsqueda web de Google
- el Plugin integrado `firecrawl` es dueño del comportamiento de obtención web de Firecrawl
- los plugins integrados `minimax`, `mistral`, `moonshot` y `zai` son dueños de sus backends de comprensión de medios
- el Plugin integrado `qwen` es dueño del comportamiento de proveedor de texto de Qwen además del comportamiento de comprensión de medios y generación de video
- el Plugin `voice-call` es un Plugin de función: es dueño del transporte de llamadas, herramientas,
  CLI, rutas y del puente de flujo de medios de Twilio, pero consume capacidades compartidas de voz
  más transcripción en tiempo real y voz en tiempo real en lugar de importar plugins de proveedor directamente

El estado final previsto es:

- OpenAI vive en un solo Plugin aunque abarque modelos de texto, voz, imágenes y
  futuro video
- otro proveedor puede hacer lo mismo para su propia superficie
- los canales no se preocupan de qué Plugin de proveedor es dueño del proveedor; consumen el
  contrato de capacidad compartida expuesto por el núcleo

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capability** = contrato del núcleo que varios plugins pueden implementar o consumir

Así que si OpenClaw agrega un dominio nuevo como video, la primera pregunta no es
"¿qué proveedor debería codificar el manejo de video?" La primera pregunta es "¿cuál es
el contrato central de capacidad de video?" Una vez que ese contrato existe, los plugins de proveedores
pueden registrarse en él y los plugins de canal/función pueden consumirlo.

Si la capacidad todavía no existe, el movimiento correcto suele ser:

1. definir la capacidad faltante en el núcleo
2. exponerla a través de la API/tiempo de ejecución de plugins de manera tipada
3. conectar canales/funciones a esa capacidad
4. dejar que los plugins de proveedores registren implementaciones

Esto mantiene explícita la propiedad y evita al mismo tiempo un comportamiento del núcleo que dependa de un
solo proveedor o de una ruta de código puntual específica de un Plugin.

### Capas de capacidades

Usa este modelo mental al decidir dónde debe vivir el código:

- **capa de capacidades del núcleo**: orquestación compartida, política, respaldo, reglas de combinación
  de configuración, semántica de entrega y contratos tipados
- **capa de plugins de proveedores**: API específicas del proveedor, autenticación, catálogos de modelos, síntesis
  de voz, generación de imágenes, futuros backends de video, extremos de uso
- **capa de plugins de canal/función**: integración de Slack/Discord/voice-call/etc.
  que consume capacidades del núcleo y las presenta en una superficie

Por ejemplo, TTS sigue esta forma:

- el núcleo es dueño de la política de TTS al responder, el orden de respaldo, las preferencias y la entrega al canal
- `openai`, `elevenlabs` y `microsoft` son dueños de las implementaciones de síntesis
- `voice-call` consume el helper de tiempo de ejecución de TTS para telefonía

Ese mismo patrón debería preferirse para capacidades futuras.

### Ejemplo de Plugin de empresa con varias capacidades

Un Plugin de empresa debería sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos
para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios,
generación de imágenes, generación de video, obtención web y búsqueda web,
un proveedor puede ser dueño de todas sus superficies en un solo lugar:

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
      // hooks de autenticación/catálogo de modelos/tiempo de ejecución
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
        // lógica de credenciales + obtención
      }),
    );
  },
};

export default plugin;
```

Lo importante no son los nombres exactos de los helpers. Lo importante es la forma:

- un solo Plugin es dueño de la superficie del proveedor
- el núcleo sigue siendo dueño de los contratos de capacidades
- los canales y plugins de función consumen helpers `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden afirmar que el Plugin registró las capacidades que
  afirma poseer

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imagen/audio/video como una capacidad compartida.
Ahí se aplica el mismo modelo de propiedad:

1. el núcleo define el contrato de comprensión de medios
2. los plugins de proveedores registran `describeImage`, `transcribeAudio` y
   `describeVideo` según corresponda
3. los plugins de canal y función consumen el comportamiento compartido del núcleo en lugar de
   conectarse directamente al código del proveedor

Eso evita integrar en el núcleo las suposiciones de video de un proveedor. El Plugin es dueño de
la superficie del proveedor; el núcleo es dueño del contrato de capacidad y del comportamiento de respaldo.

La generación de video ya usa esa misma secuencia: el núcleo es dueño del contrato tipado
de capacidad y del helper de tiempo de ejecución, y los plugins de proveedores registran
implementaciones `api.registerVideoGenerationProvider(...)` contra él.

¿Necesitas una lista concreta de despliegue? Consulta
[Capability Cookbook](/es/plugins/architecture).

## Contratos y cumplimiento

La superficie de la API de plugins es intencionalmente tipada y centralizada en
`OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y
los helpers de tiempo de ejecución en los que un Plugin puede basarse.

Por qué importa:

- los autores de plugins obtienen un estándar interno estable
- el núcleo puede rechazar propiedad duplicada, como dos plugins que registren el mismo
  id de proveedor
- el inicio puede mostrar diagnósticos accionables para registros con formato incorrecto
- las pruebas de contrato pueden aplicar la propiedad de plugins integrados y evitar derivas silenciosas

Hay dos capas de cumplimiento:

1. **cumplimiento de registro en tiempo de ejecución**
   El registro de plugins valida registros a medida que se cargan los plugins. Ejemplos:
   id de proveedores duplicados, id duplicados de proveedores de voz y registros con formato incorrecto
   producen diagnósticos del Plugin en lugar de comportamiento indefinido.
2. **pruebas de contrato**
   Los plugins integrados se capturan en registros de contrato durante las ejecuciones de prueba para que
   OpenClaw pueda afirmar la propiedad de forma explícita. Hoy esto se usa para
   proveedores de modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registro
   de plugins integrados.

El efecto práctico es que OpenClaw sabe, de antemano, qué Plugin es dueño de qué
superficie. Eso deja que el núcleo y los canales compongan sin fricción porque la propiedad está
declarada, tipada y es comprobable, en lugar de implícita.

### Qué pertenece a un contrato

Los buenos contratos de plugins son:

- tipados
- pequeños
- específicos de la capacidad
- propiedad del núcleo
- reutilizables por varios plugins
- consumibles por canales/funciones sin conocimiento del proveedor

Los malos contratos de plugins son:

- política específica del proveedor oculta en el núcleo
- salidas de emergencia puntuales de plugins que omiten el registro
- código de canal que accede directamente a una implementación de proveedor
- objetos de tiempo de ejecución ad hoc que no forman parte de `OpenClawPluginApi` ni de
  `api.runtime`

En caso de duda, eleva el nivel de abstracción: define primero la capacidad y luego
deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en proceso** con el Gateway. No están
aislados. Un Plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que
el código del núcleo.

Implicaciones:

- un Plugin nativo puede registrar herramientas, manejadores de red, hooks y servicios
- un fallo en un Plugin nativo puede bloquear o desestabilizar el Gateway
- un Plugin nativo malicioso equivale a ejecución arbitraria de código dentro del
  proceso de OpenClaw

Los paquetes compatibles son más seguros de forma predeterminada porque OpenClaw actualmente los trata
como paquetes de metadatos/contenido. En las versiones actuales, eso significa en su mayoría
Skills integradas.

Usa listas de permitidos y rutas explícitas de instalación/carga para plugins no integrados. Trata
los plugins del espacio de trabajo como código de tiempo de desarrollo, no como valores predeterminados de producción.

Para nombres de paquetes integrados del espacio de trabajo, mantén el id del Plugin anclado en el nombre npm:
`@openclaw/<id>` de forma predeterminada, o un sufijo tipado aprobado como
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando
el paquete expone intencionalmente un rol de Plugin más estrecho.

Nota importante de confianza:

- `plugins.allow` confía en **ids de plugins**, no en la procedencia del origen.
- Un Plugin del espacio de trabajo con el mismo id que un Plugin integrado sombrea intencionalmente
  la copia integrada cuando ese Plugin del espacio de trabajo está habilitado/en la lista de permitidos.
- Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes.
- La confianza del Plugin integrado se resuelve a partir de la instantánea del origen —el manifiesto y
  el código en disco en el momento de la carga— en lugar de a partir de metadatos de instalación. Un registro
  de instalación dañado o sustituido no puede ampliar silenciosamente la superficie de confianza
  de un Plugin integrado más allá de lo que afirma el origen real.

## Límite de exportación

OpenClaw exporta capacidades, no comodidad de implementación.

Mantén público el registro de capacidades. Recorta exportaciones auxiliares que no sean contrato:

- subrutas auxiliares específicas de plugins integrados
- subrutas de plomería de tiempo de ejecución no pensadas como API pública
- helpers de conveniencia específicos del proveedor
- helpers de configuración/incorporación que son detalles de implementación

Algunas subrutas auxiliares de plugins integrados aún permanecen en el mapa de exportación generado del SDK
por compatibilidad y mantenimiento de plugins integrados. Los ejemplos actuales incluyen
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y varias costuras `plugin-sdk/matrix*`. Trátalas como
exportaciones reservadas de detalle de implementación, no como el patrón recomendado del SDK para
plugins nuevos de terceros.

## Canalización de carga

Al iniciarse, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de plugins
2. lee manifiestos nativos o de paquetes compatibles y metadatos de paquetes
3. rechaza candidatos inseguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga módulos nativos habilitados: los módulos integrados compilados usan un cargador nativo;
   los plugins nativos sin compilar usan jiti
7. llama a los hooks nativos `register(api)` y recopila registros en el registro de plugins
8. expone el registro a superficies de comandos/tiempo de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins integrados usan `register`; prefiere `register` para plugins nuevos.
</Note>

Las puertas de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean
cuando la entrada escapa de la raíz del Plugin, la ruta se puede escribir por cualquiera o la
propiedad de la ruta parece sospechosa para plugins no integrados.

### Comportamiento basado primero en manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el Plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del paquete
- validar `plugins.entries.<id>.config`
- enriquecer etiquetas/marcadores de posición de Control UI
- mostrar metadatos de instalación/catálogo
- conservar descriptores baratos de activación y configuración sin cargar el tiempo de ejecución del Plugin

Para plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra
comportamientos reales como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores de solo metadatos para planificación de activación y descubrimiento de configuración;
no sustituyen el registro en tiempo de ejecución, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan sugerencias de comando, canal y proveedor del manifiesto
para acotar la carga de plugins antes de una materialización más amplia del registro:

- La carga de CLI se acota a los plugins que son dueños del comando principal solicitado
- la resolución de configuración/plugin de canal se acota a los plugins que son dueños del
  id de canal solicitado
- la resolución explícita de configuración/tiempo de ejecución de proveedor se acota a los plugins que son dueños del
  id de proveedor solicitado

El descubrimiento de configuración ahora prefiere ids propiedad del descriptor como `setup.providers` y
`setup.cliBackends` para acotar plugins candidatos antes de recurrir a
`setup-api` para plugins que todavía necesitan hooks de tiempo de ejecución en tiempo de configuración. Si más de
un Plugin descubierto reclama el mismo id normalizado de proveedor de configuración o backend de CLI,
la búsqueda de configuración rechaza el propietario ambiguo en lugar de depender del orden de descubrimiento.

### Qué almacena en caché el cargador

OpenClaw mantiene cachés breves en proceso para:

- resultados de descubrimiento
- datos del registro de manifiestos
- registros de plugins cargados

Estas cachés reducen inicios irregulares y la sobrecarga de comandos repetidos. Es seguro
pensar en ellas como cachés de rendimiento de corta duración, no como persistencia.

Nota de rendimiento:

- Establece `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desactivar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los plugins cargados no mutan directamente variables globales aleatorias del núcleo. Se registran en un
registro central de plugins.

El registro rastrea:

- registros de plugins (identidad, origen, procedencia, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- manejadores RPC del Gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad del Plugin

Las funciones del núcleo luego leen desde ese registro en lugar de hablar directamente con los módulos
de plugins. Esto mantiene la carga en una sola dirección:

- módulo del Plugin -> registro en el registro
- tiempo de ejecución del núcleo -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo
necesitan un punto de integración: "leer el registro", no "tratar como caso especial cada módulo
de Plugin".

## Callbacks de vinculación de conversación

Los plugins que vinculan una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de vinculación
sea aprobada o denegada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Ahora existe una vinculación para este plugin + conversación.
        console.log(event.binding?.conversationId);
        return;
      }

      // La solicitud fue denegada; limpia cualquier estado pendiente local.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos de la carga útil del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: la vinculación resuelta para solicitudes aprobadas
- `request`: el resumen de la solicitud original, indicación de desvinculación, id del remitente y
  metadatos de conversación

Este callback es solo de notificación. No cambia quién tiene permiso para vincular una
conversación, y se ejecuta después de que termina el manejo de aprobación del núcleo.

## Hooks de tiempo de ejecución de proveedores

Los plugins de proveedores ahora tienen dos capas:

- metadatos del manifiesto: `providerAuthEnvVars` para búsqueda barata de autenticación
  del proveedor mediante variables de entorno antes de la carga en tiempo de ejecución, `providerAuthAliases` para variantes de
  proveedor que comparten autenticación, `channelEnvVars` para búsqueda barata de entorno/configuración del canal antes de la
  carga en tiempo de ejecución, además de `providerAuthChoices` para etiquetas baratas de incorporación/opción de autenticación y
  metadatos de banderas de CLI antes de la carga en tiempo de ejecución
- hooks en tiempo de configuración: `catalog` / `discovery` heredado más `applyConfigDefaults`
- hooks en tiempo de ejecución: `normalizeModelId`, `normalizeTransport`,
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

OpenClaw sigue siendo dueño del bucle genérico del agente, el failover, el manejo de transcripciones y la
política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico del proveedor sin
necesitar un transporte de inferencia completamente personalizado.

Usa el manifiesto `providerAuthEnvVars` cuando el proveedor tenga credenciales basadas en variables de entorno
que las rutas genéricas de autenticación/estado/selector de modelos deban ver sin cargar el tiempo de ejecución
del Plugin. Usa el manifiesto `providerAuthAliases` cuando un id de proveedor deba reutilizar
las variables de entorno, perfiles de autenticación, autenticación respaldada por configuración y opción de incorporación
de clave API de otro id de proveedor. Usa el manifiesto `providerAuthChoices` cuando las
superficies de CLI de incorporación/opción de autenticación deban conocer el id de opción del proveedor, las etiquetas de grupo y una conexión sencilla
de autenticación con una sola bandera sin cargar el tiempo de ejecución del proveedor. Mantén en el tiempo de ejecución del proveedor
`envVars` para indicaciones orientadas al operador, como etiquetas de incorporación o variables de configuración
de client-id/client-secret de OAuth.

Usa el manifiesto `channelEnvVars` cuando un canal tenga autenticación o configuración impulsada por variables de entorno que
las rutas genéricas de respaldo de entorno de shell, comprobaciones de configuración/estado o prompts de configuración deban ver
sin cargar el tiempo de ejecución del canal.

### Orden de hooks y uso

Para plugins de modelo/proveedor, OpenClaw llama a los hooks en este orden aproximado.
La columna "Cuándo usar" es la guía rápida de decisión.

| #   | Hook                              | Qué hace                                                                                                   | Cuándo usar                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`                                | El proveedor es dueño de un catálogo o de valores predeterminados de URL base                                                                                                  |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales propiedad del proveedor durante la materialización de la configuración                                      | Los valores predeterminados dependen del modo de autenticación, del entorno o de la semántica de la familia de modelos del proveedor                                                                         |
| --  | _(búsqueda integrada de modelos)_         | OpenClaw prueba primero la ruta normal de registro/catálogo                                                          | _(no es un hook de Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de `model-id` antes de la búsqueda                                                     | El proveedor es dueño de la limpieza de alias antes de la resolución canónica del modelo                                                                                 |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblado genérico del modelo                                      | El proveedor es dueño de la limpieza del transporte para ids de proveedor personalizados en la misma familia de transporte                                                          |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución en tiempo de ejecución/del proveedor                                           | El proveedor necesita limpieza de configuración que debería vivir con el Plugin; los helpers integrados de la familia Google también respaldan entradas compatibles de configuración de Google   |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a los proveedores de configuración                                               | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por el extremo                                                                          |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación de marcador de entorno para proveedores de configuración antes de la carga de autenticación en tiempo de ejecución                                       | El proveedor tiene resolución de clave API de marcador de entorno propiedad del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcador de entorno de AWS                  |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/autohospedada o respaldada por configuración sin persistir texto plano                                   | El proveedor puede operar con un marcador de credencial sintética/local                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles externos de autenticación propiedad del proveedor; `persistence` predeterminado es `runtime-only` para credenciales propiedad de CLI/aplicación | El proveedor reutiliza credenciales externas de autenticación sin persistir tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Coloca marcadores almacenados de perfiles sintéticos por detrás de autenticación respaldada por entorno/configuración                                      | El proveedor almacena perfiles sintéticos de marcador de posición que no deberían tener prioridad                                                                 |
| 11  | `resolveDynamicModel`             | Respaldo síncrono para ids de modelo propiedad del proveedor que aún no están en el registro local                                       | El proveedor acepta ids arbitrarios de modelos ascendentes                                                                                                 |
| 12  | `prepareDynamicModel`             | Precalentamiento asíncrono; luego `resolveDynamicModel` vuelve a ejecutarse                                                           | El proveedor necesita metadatos de red antes de resolver ids desconocidos                                                                                  |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor incrustado use el modelo resuelto                                               | El proveedor necesita reescrituras de transporte pero sigue usando un transporte del núcleo                                                                             |
| 14  | `contributeResolvedModelCompat`   | Aporta banderas de compatibilidad para modelos del proveedor detrás de otro transporte compatible                                  | El proveedor reconoce sus propios modelos en transportes proxy sin asumir el control del proveedor                                                       |
| 15  | `capabilities`                    | Metadatos de transcripción/herramientas propiedad del proveedor usados por la lógica compartida del núcleo                                           | El proveedor necesita peculiaridades de transcripción/familia de proveedor                                                                                              |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el ejecutor incrustado los vea                                                    | El proveedor necesita limpieza de esquemas de la familia de transporte                                                                                                |
| 17  | `inspectToolSchemas`              | Expone diagnósticos de esquemas propiedad del proveedor después de la normalización                                                  | El proveedor quiere advertencias de palabras clave sin enseñar al núcleo reglas específicas del proveedor                                                                 |
| 18  | `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo frente al etiquetado                                                              | El proveedor necesita razonamiento etiquetado/salida final en lugar de campos nativos                                                                         |
| 19  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los envoltorios genéricos de opciones de flujo                                              | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                                                           |
| 20  | `createStreamFn`                  | Sustituye por completo la ruta normal de flujo con un transporte personalizado                                                   | El proveedor necesita un protocolo de conexión personalizado, no solo un envoltorio                                                                                     |
| 21  | `wrapStreamFn`                    | Envoltorio de flujo después de aplicar los envoltorios genéricos                                                              | El proveedor necesita envoltorios de compatibilidad de encabezados/cuerpo/modelo de solicitud sin un transporte personalizado                                                          |
| 22  | `resolveTransportTurnState`       | Adjunta encabezados o metadatos nativos por turno de transporte                                                           | El proveedor quiere que los transportes genéricos envíen identidad de turno nativa del proveedor                                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados WebSocket nativos o política de enfriamiento de sesión                                                    | El proveedor quiere que los transportes WS genéricos ajusten encabezados de sesión o política de respaldo                                                               |
| 24  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` de tiempo de ejecución                                     | El proveedor almacena metadatos extra de autenticación y necesita una forma personalizada de token en tiempo de ejecución                                                                    |
| 25  | `refreshOAuth`                    | Sobrescritura de actualización OAuth para extremos de actualización personalizados o política de fallo de actualización                                  | El proveedor no encaja en los actualizadores compartidos de `pi-ai`                                                                                           |
| 26  | `buildAuthDoctorHint`             | Indicación de reparación añadida cuando falla la actualización OAuth                                                                  | El proveedor necesita una guía de reparación de autenticación propiedad del proveedor tras el fallo de actualización                                                                      |
| 27  | `matchesContextOverflowError`     | Comparador propiedad del proveedor para desbordamiento de ventana de contexto                                                                 | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas pasarían por alto                                                                                |
| 28  | `classifyFailoverReason`          | Clasificación propiedad del proveedor de motivos de failover                                                                  | El proveedor puede asignar errores sin procesar de API/transporte a límite de tasa/sobrecarga/etc.                                                                          |
| 29  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                               | El proveedor necesita restricción específica de TTL de caché para proxies                                                                                                |
| 30  | `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por autenticación faltante                                                      | El proveedor necesita una indicación de recuperación por autenticación faltante específica del proveedor                                                                                 |
| 31  | `suppressBuiltInModel`            | Supresión de modelos ascendentes obsoletos más indicación opcional de error orientada al usuario                                          | El proveedor necesita ocultar filas ascendentes obsoletas o reemplazarlas con una indicación del proveedor                                                                 |
| 32  | `augmentModelCatalog`             | Filas sintéticas/finales de catálogo añadidas después del descubrimiento                                                          | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                                                     |
| 33  | `resolveThinkingProfile`          | Conjunto de niveles `/think` específicos del modelo, etiquetas de visualización y valor predeterminado                                                 | El proveedor expone una escala personalizada de pensamiento o una etiqueta binaria para modelos seleccionados                                                                 |
| 34  | `isBinaryThinking`                | Hook de compatibilidad para alternar razonamiento activado/desactivado                                                                     | El proveedor expone solo pensamiento binario activado/desactivado                                                                                                  |
| 35  | `supportsXHighThinking`           | Hook de compatibilidad para soporte de razonamiento `xhigh`                                                                   | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidad para el nivel predeterminado de `/think`                                                                      | El proveedor es dueño de la política predeterminada de `/think` para una familia de modelos                                                                                      |
| 37  | `isModernModelRef`                | Comparador de modelo moderno para filtros de perfiles en vivo y selección de humo                                              | El proveedor es dueño de la coincidencia de modelo preferido para vivo/humo                                                                                             |
| 38  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de tiempo de ejecución justo antes de la inferencia                       | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                                                             |
| 39  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                                     | El proveedor necesita análisis personalizado de token de uso/cuota o una credencial de uso diferente                                                               |
| 40  | `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación                             | El proveedor necesita un extremo de uso específico del proveedor o un analizador de carga útil                                                                           |
| 41  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                                                     | El comportamiento de embeddings de memoria pertenece al Plugin del proveedor                                                                                    |
| 42  | `buildReplayPolicy`               | Devuelve una política de repetición que controla el manejo de transcripciones para el proveedor                                        | El proveedor necesita una política personalizada de transcripciones (por ejemplo, eliminación de bloques de pensamiento)                                                               |
| 43  | `sanitizeReplayHistory`           | Reescribe el historial de repetición después de la limpieza genérica de transcripciones                                                        | El proveedor necesita reescrituras de repetición específicas del proveedor más allá de los helpers compartidos de Compaction                                                             |
| 44  | `validateReplayTurns`             | Validación o remodelado final de turnos de repetición antes del ejecutor incrustado                                           | El transporte del proveedor necesita validación más estricta de turnos después de la limpieza genérica                                                                    |
| 45  | `onModelSelected`                 | Ejecuta efectos secundarios posteriores a la selección propiedad del proveedor                                                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo pasa a estar activo                                                                  |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
Plugin de proveedor coincidente y luego pasan por otros plugins de proveedor con capacidad de hooks
hasta que uno realmente cambie el id del modelo o el transporte/configuración. Eso mantiene
funcionando los shims de alias/proveedor compatible sin exigir que el llamador sepa qué
Plugin integrado es dueño de la reescritura. Si ningún hook de proveedor reescribe una entrada compatible
de configuración de la familia Google, el normalizador integrado de configuración de Google sigue aplicando
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de conexión completamente personalizado o un ejecutor de solicitudes
personalizado, esa es una clase distinta de extensión. Estos hooks son para comportamiento de proveedor
que sigue ejecutándose en el bucle normal de inferencia de OpenClaw.

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

Los plugins integrados de proveedores usan los hooks anteriores en combinaciones adaptadas a las
necesidades de catálogo, autenticación, pensamiento, repetición y seguimiento de uso de cada
proveedor. El conjunto exacto de hooks por proveedor vive junto al código fuente del Plugin en `extensions/`;
trátalo como la lista autorizada en lugar de reflejarla aquí.

Patrones ilustrativos:

- **Proveedores de catálogo passthrough** (OpenRouter, Kilocode, Z.AI, xAI) registran
  `catalog` más `resolveDynamicModel`/`prepareDynamicModel` para poder exponer
  ids de modelos ascendentes antes del catálogo estático de OpenClaw.
- **Proveedores con OAuth + extremo de uso** (GitHub Copilot, Gemini CLI, ChatGPT
  Codex, MiniMax, Xiaomi, z.ai) emparejan `prepareRuntimeAuth` o `formatApiKey`
  con `resolveUsageAuth` + `fetchUsageSnapshot` para ser dueños del intercambio de tokens y de la
  integración de `/usage`.
- **La limpieza de repetición / transcripciones** se comparte mediante familias con nombre:
  `google-gemini`, `passthrough-gemini`, `anthropic-by-model`,
  `hybrid-anthropic-openai`. Los proveedores optan por ella mediante `buildReplayPolicy`
  en lugar de que cada uno implemente la limpieza de transcripciones.
- **Proveedores integrados solo de catálogo** (`byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`,
  `venice`, `vercel-ai-gateway`, `volcengine`) registran solo `catalog` y usan
  el bucle compartido de inferencia.
- **Helpers de flujo específicos de Anthropic** (encabezados beta, `/fast`/`serviceTier`,
  `context1m`) viven dentro de la costura pública `api.ts` /
  `contract-api.ts` del Plugin integrado de Anthropic (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) en lugar de en el
  SDK genérico.

## Ayudantes de tiempo de ejecución

Los plugins pueden acceder a ayudantes seleccionados del núcleo mediante `api.runtime`. Para TTS:

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

- `textToSpeech` devuelve la carga útil normal del núcleo de TTS para superficies de archivo/nota de voz.
- Usa la configuración central `messages.tts` y la selección de proveedor.
- Devuelve un búfer de audio PCM + frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos, como etiquetas de configuración regional, género y personalidad para selectores conscientes del proveedor.
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

- Mantén la política de TTS, el respaldo y la entrega de respuestas en el núcleo.
- Usa proveedores de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un solo Plugin de proveedor puede ser dueño de
  proveedores de texto, voz, imagen y futuros medios a medida que OpenClaw agregue esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los plugins registran un proveedor tipado de
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

- Mantén la orquestación, el respaldo, la configuración y el cableado de canales en el núcleo.
- Mantén el comportamiento del proveedor en el Plugin del proveedor.
- La expansión aditiva debe seguir siendo tipada: nuevos métodos opcionales, nuevos campos opcionales
  de resultado, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo es dueño del contrato de capacidad y del helper de tiempo de ejecución
  - los plugins de proveedores registran `api.registerVideoGenerationProvider(...)`
  - los plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para ayudantes de tiempo de ejecución de comprensión de medios, los plugins pueden llamar a:

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

Para transcripción de audio, los plugins pueden usar el tiempo de ejecución de comprensión de medios
o el alias STT más antiguo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional cuando el MIME no puede inferirse de forma fiable:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` es la superficie compartida preferida para
  comprensión de imagen/audio/video.
- Usa la configuración central de audio de comprensión de medios (`tools.media.audio`) y el orden de respaldo del proveedor.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` sigue existiendo como alias de compatibilidad.

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
- OpenClaw solo respeta esos campos de sobrescritura para llamadores confiables.
- Para ejecuciones de respaldo propiedad del Plugin, los operadores deben optar por ello con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiables a destinos canónicos específicos `provider/model`, o `"*"` para permitir explícitamente cualquier destino.
- Las ejecuciones de subagentes de plugins no confiables siguen funcionando, pero las solicitudes de sobrescritura se rechazan en lugar de recurrir silenciosamente a un respaldo.

Para búsqueda web, los plugins pueden consumir el helper compartido de tiempo de ejecución en lugar de
alcanzar el cableado de herramientas del agente:

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

- Mantén en el núcleo la selección de proveedores, la resolución de credenciales y la semántica compartida de solicitudes.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de función/canal que necesiten comportamiento de búsqueda sin depender del envoltorio de herramientas del agente.

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

Los plugins pueden exponer extremos HTTP con `api.registerHttpRoute(...)`.

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
- `auth`: obligatorio. Usa `"gateway"` para requerir autenticación normal del Gateway, o `"plugin"` para autenticación administrada por el Plugin/verificación de Webhook.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo Plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta gestionó la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error de carga del Plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan a menos que `replaceExisting: true`, y un Plugin no puede reemplazar la ruta de otro Plugin.
- Las rutas superpuestas con distintos niveles de `auth` se rechazan. Mantén las cadenas de caída `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente ámbitos de tiempo de ejecución del operador. Son para verificación de firmas/Webhooks administrados por plugins, no para llamadas privilegiadas a helpers del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un ámbito de tiempo de ejecución de solicitud del Gateway, pero ese ámbito es intencionalmente conservador:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los ámbitos de tiempo de ejecución de rutas de plugins fijados en `operator.write`, incluso si el llamador envía `x-openclaw-scopes`
  - los modos HTTP confiables con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en una entrada privada) respetan `x-openclaw-scopes` solo cuando el encabezado está explícitamente presente
  - si `x-openclaw-scopes` está ausente en esas solicitudes de ruta de Plugin con identidad, el ámbito de tiempo de ejecución recurre a `operator.write`
- Regla práctica: no supongas que una ruta de Plugin con autenticación de Gateway es implícitamente una superficie de administración. Si tu ruta necesita comportamiento solo de administración, exige un modo de autenticación con identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del SDK de plugins

Usa subrutas estrechas del SDK en lugar del barril raíz monolítico `openclaw/plugin-sdk`
al crear plugins nuevos. Subrutas del núcleo:

| Subpath                             | Propósito                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de plugins                     |
| `openclaw/plugin-sdk/channel-core`  | Ayudantes de entrada/construcción de canales                        |
| `openclaw/plugin-sdk/core`          | Ayudantes compartidos genéricos y contrato paraguas       |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los plugins de canal eligen de una familia de costuras estrechas: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un único contrato `approvalCapability` en lugar de mezclarse entre campos no relacionados
del Plugin. Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).

Los ayudantes de tiempo de ejecución y configuración viven bajo subrutas `*-runtime`
correspondientes (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` está desaprobado: es un shim de compatibilidad para
plugins antiguos. El código nuevo debe importar primitivas genéricas más estrechas en su lugar.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de cada Plugin integrado):

- `index.js` — entrada del Plugin integrado
- `api.js` — barril de helpers/tipos
- `runtime-api.js` — barril solo de tiempo de ejecución
- `setup-entry.js` — entrada de configuración del Plugin

Los plugins externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes `src/*` del paquete de otro Plugin desde el núcleo o desde otro Plugin.
Los puntos de entrada cargados por fachada prefieren la instantánea activa de configuración de tiempo de ejecución cuando existe, y si no recurren al archivo de configuración resuelto en disco.

Las subrutas específicas de capacidades, como `image-generation`, `media-understanding`
y `speech`, existen porque los plugins integrados las usan hoy. No son
automáticamente contratos externos congelados a largo plazo; consulta la página de referencia
del SDK correspondiente cuando dependas de ellas.

## Esquemas de la herramienta de mensajes

Los plugins deben ser dueños de las contribuciones de esquema de `describeMessageTool(...)`
específicas del canal para primitivas no relacionadas con mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envíos debe usar el contrato genérico `MessagePresentation`
en lugar de campos nativos del proveedor para botones, componentes, bloques o tarjetas.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para ver el contrato,
las reglas de respaldo, el mapeo de proveedores y la lista de verificación para autores de plugins.

Los plugins con capacidad de envío declaran lo que pueden representar mediante capacidades de mensajes:

- `presentation` para bloques semánticos de presentación (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El núcleo decide si representa la presentación de forma nativa o si la degrada a texto.
No expongas salidas de emergencia de UI nativa del proveedor desde la herramienta genérica de mensajes.
Los helpers SDK desaprobados para esquemas nativos heredados siguen exportados para plugins
existentes de terceros, pero los plugins nuevos no deben usarlos.

## Resolución de destinos de canal

Los plugins de canal deben ser dueños de la semántica de destino específica del canal. Mantén
genérico el host compartido de salida y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al núcleo si una
  entrada debe saltar directamente a una resolución tipo id en lugar de una búsqueda en directorio.
- `messaging.targetResolver.resolveTarget(...)` es el respaldo del Plugin cuando
  el núcleo necesita una resolución final propiedad del proveedor tras la normalización o tras un fallo
  de directorio.
- `messaging.resolveOutboundSessionRoute(...)` es dueño de la construcción de rutas de sesión específicas
  del proveedor una vez resuelto un destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deban ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones del tipo "trata esto como un id de destino explícito/nativo".
- Usa `resolveTarget` como respaldo de normalización específico del proveedor, no para
  búsquedas amplias de directorio.
- Mantén ids nativos del proveedor como ids de chat, ids de hilo, JID, identificadores y ids de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio a partir de configuración deben mantener esa lógica en el
Plugin y reutilizar los helpers compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Úsalo cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares de MD controlados por lista de permitidos
- mapas configurados de canales/grupos
- respaldos estáticos de directorio con ámbito por cuenta

Los helpers compartidos en `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- helpers de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas específica del canal y la normalización de ids deben permanecer en la
implementación del Plugin.

## Catálogos de proveedores

Los plugins de proveedores pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el Plugin sea dueño de ids de modelos específicos del proveedor, valores predeterminados
de URL base o metadatos de modelos controlados por autenticación.

`catalog.order` controla cuándo se combina el catálogo de un Plugin en relación con los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores sencillos impulsados por clave API o variables de entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas relacionadas de proveedor
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en caso de colisión de clave, por lo que los plugins pueden sobrescribir
intencionalmente una entrada integrada de proveedor con el mismo id de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`

## Inspección de canal de solo lectura

Si tu Plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de tiempo de ejecución. Puede asumir que las credenciales
  están totalmente materializadas y puede fallar rápido cuando faltan secretos obligatorios.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de doctor/reparación de configuración
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
- No necesitas devolver valores sin procesar de tokens solo para informar de disponibilidad
  de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen correspondiente)
  es suficiente para comandos de estilo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef, pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen "configurado pero no disponible en esta ruta
de comando" en lugar de bloquearse o informar incorrectamente que la cuenta no está configurada.

## Package packs

Un directorio de Plugin puede incluir un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entrada se convierte en un Plugin. Si el paquete enumera varias extensiones, el id del Plugin
pasa a ser `name/<fileBase>`.

Si tu Plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Medida de seguridad: cada entrada de `openclaw.extensions` debe permanecer dentro del
directorio del Plugin tras la resolución de symlinks. Las entradas que escapen del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias de plugins con
`npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida, sin dependencias de desarrollo en tiempo de ejecución). Mantén los árboles de dependencias del Plugin en "JS/TS puro" y evita paquetes que requieran compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un Plugin de canal deshabilitado, o
cuando un Plugin de canal está habilitado pero todavía no configurado, carga `setupEntry`
en lugar de la entrada completa del Plugin. Esto mantiene el inicio y la configuración más ligeros
cuando la entrada principal del Plugin también conecta herramientas, hooks u otro código
solo de tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un Plugin de canal opte por la misma ruta `setupEntry` durante la fase de
inicio previo a listen del Gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el Gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar cada capacidad propiedad del canal de la que dependa el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el Gateway empiece a escuchar
- cualquier método, herramienta o servicio del Gateway que deba existir durante esa misma ventana

Si tu entrada completa sigue siendo dueña de alguna capacidad de inicio obligatoria, no habilites
esta bandera. Mantén el comportamiento predeterminado del Plugin y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales integrados también pueden publicar helpers de superficie de contrato solo de configuración que el núcleo
pueda consultar antes de que se cargue el tiempo de ejecución completo del canal. La superficie actual
de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración heredada de canal de cuenta única
a `channels.<id>.accounts.*` sin cargar la entrada completa del Plugin.
Matrix es el ejemplo integrado actual: mueve solo claves de autenticación/arranque a una
cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede conservar una
clave configurada de cuenta predeterminada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parche de configuración mantienen diferido el descubrimiento de superficies de contrato de paquetes integrados. El tiempo
de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de
volver a entrar en el inicio del canal integrado durante la importación del módulo.

Cuando esas superficies de inicio incluyan métodos RPC del Gateway, mantenlas bajo un
prefijo específico del Plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen estando reservados y siempre se resuelven
a `operator.admin`, incluso si un Plugin solicita un ámbito más estrecho.

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
sugerencias de instalación mediante `openclaw.install`. Esto mantiene el catálogo central libre de datos.

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
      "blurb": "Chat autohospedado mediante bots Webhook de Nextcloud Talk.",
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
- `docsLabel`: sobrescribe el texto del enlace para el enlace de la documentación
- `preferOver`: ids de Plugin/canal de menor prioridad a los que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto para la superficie de selección
- `markdownCapable`: marca el canal como compatible con Markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados aún aceptados por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: hace que el canal participe en el flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver destinos de anuncio

OpenClaw también puede combinar **catálogos externos de canales** (por ejemplo, una exportación del
registro MPM). Coloca un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o varios archivos JSON (delimitados por coma/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados de la clave `"entries"`.

## Plugins de motor de contexto

Los plugins de motor de contexto son dueños de la orquestación del contexto de sesión para ingestión, ensamblado
y Compaction. Regístralos desde tu Plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Usa esto cuando tu Plugin necesite sustituir o ampliar la canalización predeterminada de contexto
en lugar de limitarse a agregar búsqueda en memoria o hooks.

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

Si tu motor **no** es dueño del algoritmo de Compaction, mantén `compact()`
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

Cuando un Plugin necesite un comportamiento que no encaje en la API actual, no omitas
el sistema de plugins con un acceso privado. Agrega la capacidad que falta.

Secuencia recomendada:

1. define el contrato del núcleo
   Decide qué comportamiento compartido debe poseer el núcleo: política, respaldo, combinación de configuración,
   ciclo de vida, semántica de cara al canal y forma del helper de tiempo de ejecución.
2. agrega superficies tipadas de registro/tiempo de ejecución del Plugin
   Amplía `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada más pequeña
   y útil de la capacidad.
3. conecta los consumidores del núcleo + canal/función
   Los canales y plugins de función deben consumir la nueva capacidad a través del núcleo,
   no importando directamente una implementación de proveedor.
4. registra implementaciones de proveedores
   Los plugins de proveedores registran entonces sus backends contra la capacidad.
5. agrega cobertura de contrato
   Agrega pruebas para que la propiedad y la forma del registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw mantiene una postura definida sin quedar codificado
a la visión del mundo de un único proveedor. Consulta [Capability Cookbook](/es/plugins/architecture)
para una lista concreta de archivos y un ejemplo resuelto.

### Lista de verificación de capacidad

Cuando agregas una nueva capacidad, la implementación normalmente debe tocar estas
superficies juntas:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- ejecutor/helper de tiempo de ejecución del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- cableado del registro de plugins en `src/plugins/registry.ts`
- exposición del tiempo de ejecución del Plugin en `src/plugins/runtime/*` cuando los plugins
  de función/canal necesiten consumirla
- helpers de captura/prueba en `src/test-utils/plugin-registration.ts`
- afirmaciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores/plugins en `docs/`

Si falta una de esas superficies, normalmente es señal de que la capacidad
todavía no está completamente integrada.

### Plantilla de capacidad

Patrón mínimo:

```ts
// contrato del núcleo
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API de plugins
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper compartido de tiempo de ejecución para plugins de función/canal
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

- el núcleo es dueño del contrato de capacidad + orquestación
- los plugins de proveedores son dueños de las implementaciones del proveedor
- los plugins de función/canal consumen helpers de tiempo de ejecución
- las pruebas de contrato mantienen explícita la propiedad
