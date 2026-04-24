---
read_when:
    - Implementando hooks de tiempo de ejecución de proveedores, ciclo de vida de canales o paquetes pack
    - Depurando el orden de carga de Plugins o el estado del registro
    - Añadiendo una nueva capacidad de Plugin o un Plugin de motor de contexto
summary: 'Aspectos internos de la arquitectura de Plugins: canalización de carga, registro, hooks de tiempo de ejecución, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de Plugins
x-i18n:
    generated_at: "2026-04-24T05:39:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01e258ab1666f7aff112fa3f897a40bf28dccaa8d06265fcf21e53479ee1ebda
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Para el modelo público de capacidades, las formas de Plugin y los contratos de
propiedad/ejecución, consulta [Arquitectura de Plugins](/es/plugins/architecture). Esta página es la
referencia para la mecánica interna: canalización de carga, registro, hooks de tiempo de ejecución,
rutas HTTP de Gateway, rutas de importación y tablas de esquema.

## Canalización de carga

Al inicio, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de Plugin
2. lee manifiestos nativos o de bundles compatibles y metadatos de paquetes
3. rechaza candidatos inseguros
4. normaliza la configuración de Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación para cada candidato
6. carga módulos nativos habilitados: los módulos incluidos ya compilados usan un cargador nativo;
   los Plugins nativos no compilados usan jiti
7. llama a hooks nativos `register(api)` y recopila registros en el registro de Plugins
8. expone el registro a las superficies de comandos/tiempo de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los Plugins incluidos usan `register`; prefiere `register` para Plugins nuevos.
</Note>

Las barreras de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean
cuando la entrada escapa de la raíz del Plugin, la ruta es escribible globalmente o la
propiedad de la ruta parece sospechosa para Plugins no incluidos.

### Comportamiento basado en manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el Plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del bundle
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/placeholders de Control UI
- mostrar metadatos de instalación/catálogo
- preservar descriptores baratos de activación y configuración sin cargar el tiempo de ejecución del Plugin

Para Plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra
el comportamiento real como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores solo de metadatos para planificación de activación y descubrimiento de configuración;
no sustituyen al registro en tiempo de ejecución, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan sugerencias de manifiesto de comandos, canales y proveedores
para restringir la carga de Plugins antes de una materialización más amplia del registro:

- La carga de CLI se restringe a Plugins que son dueños del comando principal solicitado
- La configuración de canal/resolución de Plugin se restringe a Plugins que son dueños del
  ID de canal solicitado
- La resolución explícita de configuración/tiempo de ejecución de proveedor se restringe a Plugins que son dueños del
  ID de proveedor solicitado

El planificador de activación expone tanto una API solo de ids para los llamadores existentes como una
API de plan para diagnósticos nuevos. Las entradas del plan informan por qué se seleccionó un Plugin,
separando sugerencias explícitas del planificador `activation.*` de la reserva de propiedad del manifiesto
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks. Esa separación de motivos es el límite de compatibilidad:
los metadatos existentes del Plugin siguen funcionando, mientras que el código nuevo puede detectar sugerencias amplias
o comportamiento de reserva sin cambiar la semántica de carga en tiempo de ejecución.

El descubrimiento de configuración ahora prefiere ids propiedad del descriptor como `setup.providers` y
`setup.cliBackends` para restringir los Plugins candidatos antes de recurrir a
`setup-api` para Plugins que aún necesitan hooks de tiempo de ejecución en tiempo de configuración. Si más de
un Plugin descubierto reclama el mismo id normalizado de proveedor de configuración o backend CLI,
la búsqueda de configuración rechaza al propietario ambiguo en lugar de basarse en el orden de descubrimiento.

### Qué almacena en caché el cargador

OpenClaw mantiene cachés cortas en proceso para:

- resultados de descubrimiento
- datos del registro de manifiestos
- registros de Plugins cargados

Estas cachés reducen los picos de inicio y la sobrecarga de comandos repetidos. Es seguro
pensar en ellas como cachés de rendimiento de vida corta, no como persistencia.

Nota de rendimiento:

- Establece `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desactivar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los Plugins cargados no mutan directamente globals aleatorios del core. Se registran en un
registro central de Plugins.

El registro rastrea:

- registros de Plugin (identidad, origen, procedencia, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- controladores RPC de Gateway
- rutas HTTP
- registradores CLI
- servicios en segundo plano
- comandos propiedad del Plugin

Luego las funciones del core leen desde ese registro en lugar de hablar con módulos de Plugin
directamente. Esto mantiene la carga en una sola dirección:

- módulo de Plugin -> registro en el registro
- tiempo de ejecución del core -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del core solo
necesitan un punto de integración: “leer el registro”, no “hacer casos especiales para cada módulo de Plugin”.

## Callbacks de enlace de conversación

Los Plugins que enlazan una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de enlace
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
- `binding`: el enlace resuelto para solicitudes aprobadas
- `request`: el resumen de la solicitud original, indicación de separación, id del remitente y
  metadatos de conversación

Este callback es solo de notificación. No cambia quién está autorizado a enlazar una
conversación y se ejecuta después de que finaliza la gestión central de aprobación.

## Hooks de tiempo de ejecución del proveedor

Los Plugins de proveedor tienen tres capas:

- **Metadatos de manifiesto** para búsqueda barata previa al tiempo de ejecución: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks de tiempo de configuración**: `catalog` (heredado `discovery`) más
  `applyConfigDefaults`.
- **Hooks de tiempo de ejecución**: más de 40 hooks opcionales que cubren autenticación, resolución de modelos,
  envoltura de streams, niveles de thinking, política de reproducción y endpoints de uso. Consulta
  la lista completa en [Orden y uso de hooks](#hook-order-and-usage).

OpenClaw sigue siendo dueño del bucle genérico del agente, la conmutación por error, la gestión de transcripciones y
la política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico del proveedor sin
necesitar un transporte de inferencia completamente personalizado.

Usa el `providerAuthEnvVars` del manifiesto cuando el proveedor tenga credenciales basadas en entorno
que las rutas genéricas de autenticación/estado/selector de modelos deban ver sin cargar el tiempo de ejecución del Plugin. Usa `providerAuthAliases` del manifiesto cuando un id de proveedor deba reutilizar
las variables de entorno, perfiles de autenticación, autenticación respaldada por configuración y opción de incorporación con clave API de otro id de proveedor. Usa `providerAuthChoices` del manifiesto cuando las superficies CLI de incorporación/elección de autenticación
deban conocer el id de opción del proveedor, las etiquetas de grupo y el cableado simple de autenticación con una sola bandera sin cargar el tiempo de ejecución del proveedor. Mantén `envVars` del tiempo de ejecución del proveedor para sugerencias orientadas al operador como etiquetas de incorporación o variables de configuración de client-id/client-secret de OAuth.

Usa `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración impulsada por entorno que las rutas genéricas de reserva a variables de entorno del shell, comprobaciones de configuración/estado o prompts de configuración deban ver sin cargar el tiempo de ejecución del canal.

### Orden y uso de hooks

Para Plugins de modelo/proveedor, OpenClaw llama a hooks aproximadamente en este orden.
La columna “Cuándo usar” es la guía rápida de decisión.

| #   | Hook                              | What it does                                                                                                   | When to use                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`          | El proveedor es dueño de un catálogo o de valores predeterminados de `baseUrl`                                                              |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales propiedad del proveedor durante la materialización de configuración   | Los valores predeterminados dependen del modo de autenticación, del entorno o de la semántica de la familia de modelos del proveedor         |
| --  | _(built-in model lookup)_         | OpenClaw intenta primero la ruta normal de registro/catálogo                                                   | _(no es un hook de Plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de id de modelo antes de la búsqueda                              | El proveedor es dueño de la limpieza de alias antes de la resolución canónica del modelo                                                     |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo             | El proveedor es dueño de la limpieza del transporte para id de proveedor personalizados dentro de la misma familia de transporte             |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución de proveedor/tiempo de ejecución                     | El proveedor necesita limpieza de configuración que debería vivir con el Plugin; los helpers incluidos de la familia Google también respaldan entradas compatibles de configuración Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a proveedores configurados                   | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por endpoint                                           |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación de marcador de entorno para proveedores configurados antes de cargar la autenticación en tiempo de ejecución | El proveedor tiene resolución de clave API de marcador de entorno propiedad del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcador de entorno AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/autoalojada o respaldada por configuración sin persistir texto sin formato         | El proveedor puede operar con un marcador de credencial sintética/local                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externos propiedad del proveedor; el `persistence` predeterminado es `runtime-only` para credenciales propiedad de CLI/app | El proveedor reutiliza credenciales de autenticación externas sin persistir tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Relega marcadores sintéticos almacenados de perfil detrás de autenticación respaldada por entorno/configuración | El proveedor almacena perfiles sintéticos de marcador de posición que no deberían ganar por precedencia                                      |
| 11  | `resolveDynamicModel`             | Reserva síncrona para id de modelo propiedad del proveedor que aún no están en el registro local              | El proveedor acepta id arbitrarios de modelos ascendentes                                                                                    |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono, luego `resolveDynamicModel` vuelve a ejecutarse                                      | El proveedor necesita metadatos de red antes de resolver id desconocidos                                                                    |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor incrustado use el modelo resuelto                                  | El proveedor necesita reescrituras de transporte pero sigue usando un transporte del core                                                    |
| 14  | `contributeResolvedModelCompat`   | Aporta banderas de compatibilidad para modelos del proveedor detrás de otro transporte compatible              | El proveedor reconoce sus propios modelos en transportes proxy sin asumir el control del proveedor                                           |
| 15  | `capabilities`                    | Metadatos de transcripción/herramientas propiedad del proveedor usados por la lógica compartida del core      | El proveedor necesita particularidades de transcripción/familia de proveedor                                                                 |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el ejecutor incrustado los vea                                | El proveedor necesita limpieza de esquemas de familia de transporte                                                                          |
| 17  | `inspectToolSchemas`              | Expone diagnósticos de esquemas propiedad del proveedor después de la normalización                            | El proveedor quiere advertencias de palabras clave sin enseñar al core reglas específicas del proveedor                                      |
| 18  | `resolveReasoningOutputMode`      | Selecciona contrato de salida de razonamiento nativo frente a etiquetado                                       | El proveedor necesita razonamiento etiquetado/salida final en lugar de campos nativos                                                       |
| 19  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los wrappers genéricos de opciones de stream                 | El proveedor necesita parámetros de solicitud predeterminados o limpieza por proveedor                                                       |
| 20  | `createStreamFn`                  | Sustituye por completo la ruta normal de stream por un transporte personalizado                                | El proveedor necesita un protocolo de transporte personalizado, no solo un wrapper                                                           |
| 21  | `wrapStreamFn`                    | Wrapper de stream después de aplicar wrappers genéricos                                                        | El proveedor necesita wrappers de compatibilidad para encabezados/cuerpo/modelo sin un transporte personalizado                              |
| 22  | `resolveTransportTurnState`       | Adjunta encabezados nativos por turno o metadatos                                                              | El proveedor quiere que los transportes genéricos envíen identidad de turno nativa del proveedor                                             |
| 23  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados nativos de WebSocket o política de enfriamiento de sesión                                  | El proveedor quiere que los transportes WS genéricos ajusten encabezados de sesión o política de reserva                                     |
| 24  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` en tiempo de ejecución | El proveedor almacena metadatos de autenticación adicionales y necesita una forma personalizada de token en tiempo de ejecución              |
| 25  | `refreshOAuth`                    | Anulación de actualización OAuth para endpoints personalizados de actualización o política de fallo de actualización | El proveedor no encaja en los actualizadores compartidos de `pi-ai`                                                                          |
| 26  | `buildAuthDoctorHint`             | Sugerencia de reparación añadida cuando falla la actualización OAuth                                           | El proveedor necesita orientación propia de reparación de autenticación tras un fallo de actualización                                       |
| 27  | `matchesContextOverflowError`     | Comparador de desbordamiento de ventana de contexto propiedad del proveedor                                     | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas no detectarían                                      |
| 28  | `classifyFailoverReason`          | Clasificación de motivo de conmutación por error propiedad del proveedor                                       | El proveedor puede mapear errores sin procesar de API/transporte a rate-limit/overload/etc.                                                 |
| 29  | `isCacheTtlEligible`              | Política de caché de prompt para proveedores proxy/backhaul                                                    | El proveedor necesita control de TTL de caché específico de proxy                                                                            |
| 30  | `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por falta de autenticación                                    | El proveedor necesita una sugerencia específica de recuperación por falta de autenticación                                                    |
| 31  | `suppressBuiltInModel`            | Supresión de modelos ascendentes obsoletos más sugerencia opcional de error visible para el usuario           | El proveedor necesita ocultar filas ascendentes obsoletas o sustituirlas por una sugerencia del proveedor                                   |
| 32  | `augmentModelCatalog`             | Filas sintéticas/finales de catálogo añadidas después del descubrimiento                                       | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                               |
| 33  | `resolveThinkingProfile`          | Conjunto de niveles `/think` específico del modelo, etiquetas visibles y valor predeterminado                 | El proveedor expone una escala de thinking personalizada o una etiqueta binaria para modelos seleccionados                                   |
| 34  | `isBinaryThinking`                | Hook de compatibilidad para alternancia de razonamiento on/off                                                 | El proveedor expone solo thinking binario on/off                                                                                             |
| 35  | `supportsXHighThinking`           | Hook de compatibilidad para soporte de razonamiento `xhigh`                                                    | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                                |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidad para nivel `/think` predeterminado                                                      | El proveedor es dueño de la política predeterminada `/think` para una familia de modelos                                                     |
| 37  | `isModernModelRef`                | Comparador de modelo moderno para filtros de perfil en vivo y selección smoke                                  | El proveedor es dueño de la coincidencia de modelo preferido en vivo/smoke                                                                   |
| 38  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de tiempo de ejecución justo antes de la inferencia | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                                |
| 39  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                   | El proveedor necesita análisis personalizado de token de uso/cuota o una credencial de uso diferente                                         |
| 40  | `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas específicas del proveedor de uso/cuota después de resolver la autenticación   | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de carga útil                                              |
| 41  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                             | El comportamiento de embeddings de memoria pertenece al Plugin del proveedor                                                                  |
| 42  | `buildReplayPolicy`               | Devuelve una política de reproducción que controla la gestión de transcripciones para el proveedor             | El proveedor necesita una política personalizada de transcripción (por ejemplo, eliminación de bloques de thinking)                          |
| 43  | `sanitizeReplayHistory`           | Reescribe el historial de reproducción después de la limpieza genérica de la transcripción                    | El proveedor necesita reescrituras específicas del proveedor en la reproducción más allá de los helpers compartidos de Compaction           |
| 44  | `validateReplayTurns`             | Validación final o remodelado de turnos de reproducción antes del ejecutor incrustado                         | El transporte del proveedor necesita una validación más estricta de turnos tras la sanitización genérica                                     |
| 45  | `onModelSelected`                 | Ejecuta efectos secundarios posteriores a la selección propiedad del proveedor                                  | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo pasa a estar activo                                       |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` comprueban primero el
Plugin de proveedor coincidente y luego recorren otros Plugins de proveedor con capacidad de hook
hasta que uno realmente cambia el id del modelo o el transporte/configuración. Eso mantiene funcionando
los shims de alias/proveedor compatible sin exigir que quien llama sepa qué
Plugin incluido es dueño de la reescritura. Si ningún hook de proveedor reescribe una entrada de
configuración compatible de la familia Google, el normalizador de configuración Google incluido sigue aplicando
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de transporte totalmente personalizado o un ejecutor de solicitudes personalizado,
eso es una clase distinta de extensión. Estos hooks son para comportamiento de proveedor
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

Los Plugins de proveedor incluidos combinan los hooks anteriores para ajustarse a las necesidades de catálogo,
autenticación, thinking, reproducción y uso de cada proveedor. El conjunto de hooks autorizado vive con
cada Plugin bajo `extensions/`; esta página ilustra las formas en lugar de
reflejar la lista.

<AccordionGroup>
  <Accordion title="Proveedores de catálogo de paso directo">
    OpenRouter, Kilocode, Z.AI, xAI registran `catalog` más
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer id de modelos ascendentes antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Proveedores de OAuth y endpoint de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para ser dueños del intercambio de tokens y de la integración con `/usage`.
  </Accordion>
  <Accordion title="Familias de reproducción y limpieza de transcripciones">
    Las familias nombradas compartidas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten a los proveedores optar por
    la política de transcripción mediante `buildReplayPolicy` en lugar de que cada Plugin
    reimplemente la limpieza.
  </Accordion>
  <Accordion title="Proveedores solo de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran solo `catalog` y aprovechan el bucle de inferencia compartido.
  </Accordion>
  <Accordion title="Helpers de stream específicos de Anthropic">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` viven dentro de la
    superficie pública `api.ts` / `contract-api.ts` del Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) en lugar de en
    el SDK genérico.
  </Accordion>
</AccordionGroup>

## Helpers de tiempo de ejecución

Los Plugins pueden acceder a helpers seleccionados del core mediante `api.runtime`. Para TTS:

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

- `textToSpeech` devuelve la carga útil normal de salida TTS del core para superficies de archivo/nota de voz.
- Usa la configuración del core `messages.tts` y la selección de proveedor.
- Devuelve búfer de audio PCM + frecuencia de muestreo. Los Plugins deben remuestrear/codificar para proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos como configuración regional, género y etiquetas de personalidad para selectores conscientes del proveedor.
- Hoy son compatibles OpenAI y ElevenLabs para telefonía. Microsoft no.

Los Plugins también pueden registrar proveedores de voz mediante `api.registerSpeechProvider(...)`.

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

- Mantén la política TTS, la reserva y la entrega de respuestas en el core.
- Usa proveedores de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada Microsoft `edge` se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a empresas: un Plugin de proveedor puede ser dueño
  de proveedores de texto, voz, imagen y futuros medios a medida que OpenClaw añada esos
  contratos de capacidad.

Para comprensión de imagen/audio/vídeo, los Plugins registran un único
proveedor tipado de comprensión de medios en lugar de una bolsa genérica clave/valor:

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

- Mantén en el core la orquestación, la reserva, la configuración y el cableado de canales.
- Mantén el comportamiento del proveedor en el Plugin del proveedor.
- La expansión aditiva debe seguir siendo tipada: métodos opcionales nuevos, campos opcionales nuevos de resultado, capacidades opcionales nuevas.
- La generación de vídeo ya sigue el mismo patrón:
  - el core es dueño del contrato de capacidad y del helper de tiempo de ejecución
  - los Plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los Plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para helpers de tiempo de ejecución de comprensión de medios, los Plugins pueden llamar a:

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

Para transcripción de audio, los Plugins pueden usar el tiempo de ejecución de comprensión de medios
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
  comprensión de imagen/audio/vídeo.
- Usa la configuración de audio del core para comprensión de medios (`tools.media.audio`) y el orden de reserva de proveedor.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` se mantiene como alias de compatibilidad.

Los Plugins también pueden lanzar ejecuciones de subagente en segundo plano mediante `api.runtime.subagent`:

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
- Para ejecuciones de reserva propiedad del Plugin, los operadores deben habilitarlo explícitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir Plugins de confianza a objetivos canónicos concretos `provider/model`, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagente de Plugins no confiables siguen funcionando, pero las solicitudes de anulación se rechazan en lugar de recurrir silenciosamente a otra cosa.

Para búsqueda web, los Plugins pueden consumir el helper compartido de tiempo de ejecución en lugar de
entrar en el cableado de herramientas del agente:

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

Los Plugins también pueden registrar proveedores de búsqueda web mediante
`api.registerWebSearchProvider(...)`.

Notas:

- Mantén en el core la selección de proveedor, la resolución de credenciales y la semántica compartida de solicitudes.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para Plugins de función/canal que necesitan comportamiento de búsqueda sin depender del wrapper de herramientas del agente.

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

Los Plugins pueden exponer endpoints HTTP con `api.registerHttpRoute(...)`.

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

- `path`: ruta del endpoint bajo el servidor HTTP de gateway.
- `auth`: obligatorio. Usa `"gateway"` para requerir autenticación normal del gateway, o `"plugin"` para autenticación/verificación de webhook gestionada por el Plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite al mismo Plugin reemplazar su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta gestionó la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y causará un error de carga del Plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de Plugin deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un Plugin no puede reemplazar la ruta de otro Plugin.
- Las rutas solapadas con distintos niveles de `auth` se rechazan. Mantén las cadenas de caída `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente alcances de tiempo de ejecución de operador. Son para webhooks/verificación de firmas gestionados por el Plugin, no para llamadas privilegiadas a helpers de Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un alcance de tiempo de ejecución de solicitud de Gateway, pero ese alcance es intencionadamente conservador:
  - la autenticación bearer por secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los alcances de tiempo de ejecución de ruta de Plugin fijados a `operator.write`, incluso si quien llama envía `x-openclaw-scopes`
  - los modos HTTP de identidad confiable (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingress privado) respetan `x-openclaw-scopes` solo cuando la cabecera está explícitamente presente
  - si `x-openclaw-scopes` está ausente en esas solicitudes de ruta de Plugin con identidad, el alcance de tiempo de ejecución recurre a `operator.write`
- Regla práctica: no asumas que una ruta de Plugin con autenticación de gateway es implícitamente una superficie de administrador. Si tu ruta necesita comportamiento solo de administrador, exige un modo de autenticación con identidad y documenta el contrato explícito de la cabecera `x-openclaw-scopes`.

## Rutas de importación del SDK de Plugin

Usa subrutas estrechas del SDK en lugar del barrel raíz monolítico `openclaw/plugin-sdk`
al crear Plugins nuevos. Subrutas principales:

| Subpath                             | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/construcción de canal           |
| `openclaw/plugin-sdk/core`          | Helpers compartidos genéricos y contrato paraguas  |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los Plugins de canal eligen de una familia de seams estrechos — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debería consolidarse
en un único contrato `approvalCapability` en lugar de mezclarse entre campos
de Plugin no relacionados. Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).

Los helpers de tiempo de ejecución y configuración viven bajo subrutas `*-runtime`
correspondientes (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` está obsoleto — es un shim de compatibilidad para
Plugins antiguos. El código nuevo debería importar primitivas genéricas más estrechas.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de Plugin incluido):

- `index.js` — entrada del Plugin incluido
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel solo de tiempo de ejecución
- `setup-entry.js` — entrada del Plugin de configuración

Los Plugins externos solo deberían importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes `src/*` del paquete de otro Plugin desde el core o desde otro Plugin.
Los puntos de entrada cargados por façade prefieren la instantánea activa de configuración del entorno de ejecución cuando existe y, en caso contrario, recurren al archivo de configuración resuelto en disco.

Existen subrutas específicas de capacidad como `image-generation`, `media-understanding`
y `speech` porque los Plugins incluidos las usan hoy. No son
automáticamente contratos externos congelados a largo plazo: consulta la página de referencia
del SDK correspondiente cuando dependas de ellas.

## Esquemas de herramientas de mensajes

Los Plugins deberían ser dueños de las contribuciones al esquema `describeMessageTool(...)` específicas del canal
para primitivas no relacionadas con mensajes como reacciones, lecturas y encuestas.
La presentación compartida de envío debería usar el contrato genérico `MessagePresentation`
en lugar de campos nativos de proveedor para botones, componentes, bloques o tarjetas.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para el contrato,
las reglas de reserva, el mapeo por proveedor y la lista de comprobación para autores de Plugins.

Los Plugins con capacidad de envío declaran lo que pueden renderizar mediante capacidades de mensajes:

- `presentation` para bloques de presentación semántica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El core decide si renderizar la presentación de forma nativa o degradarla a texto.
No expongas escotillas de salida de UI nativas del proveedor desde la herramienta genérica de mensajes.
Los helpers obsoletos del SDK para esquemas nativos heredados siguen exportados para Plugins
de terceros ya existentes, pero los Plugins nuevos no deberían usarlos.

## Resolución de destinos de canal

Los Plugins de canal deberían ser dueños de la semántica de destino específica del canal. Mantén
genérico el host saliente compartido y usa la superficie del adaptador de mensajería para reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al core si una
  entrada debe pasar directamente a resolución tipo id en lugar de búsqueda en directorio.
- `messaging.targetResolver.resolveTarget(...)` es la reserva del Plugin cuando
  el core necesita una resolución final propiedad del proveedor después de la normalización o tras
  un fallo de búsqueda en directorio.
- `messaging.resolveOutboundSessionRoute(...)` es dueño de la construcción específica del proveedor
  de la ruta de sesión una vez resuelto un destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deban ocurrir antes de
  buscar interlocutores/grupos.
- Usa `looksLikeId` para comprobaciones del tipo “tratar esto como un id de destino explícito/nativo”.
- Usa `resolveTarget` para la reserva de normalización específica del proveedor, no para
  búsquedas amplias en directorio.
- Mantén los id nativos del proveedor como chat ids, thread ids, JID, handles e ids de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los Plugins que derivan entradas de directorio a partir de la configuración deberían mantener esa lógica en el
Plugin y reutilizar los helpers compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Úsalo cuando un canal necesite interlocutores/grupos respaldados por configuración, como:

- interlocutores DM basados en listas de permitidos
- mapas configurados de canal/grupo
- reservas estáticas de directorio con alcance por cuenta

Los helpers compartidos en `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- helpers de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuenta específica del canal y la normalización de id deberían permanecer en la
implementación del Plugin.

## Catálogos de proveedor

Los Plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el Plugin sea dueño de id de modelos específicos del proveedor, valores predeterminados de `baseUrl` o metadatos de modelos limitados por autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un Plugin con respecto a los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples impulsados por clave API o entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedores relacionados
- `late`: último paso, después de otros proveedores implícitos

Los proveedores posteriores ganan en colisión de claves, así que los Plugins pueden
anular intencionadamente una entrada de proveedor integrada con el mismo id de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`

## Inspección de canal de solo lectura

Si tu Plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto a `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de tiempo de ejecución. Puede asumir que las credenciales
  están completamente materializadas y puede fallar rápidamente cuando faltan secretos requeridos.
- Las rutas de comando de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de
  reparación de doctor/configuración no deberían necesitar materializar credenciales de tiempo de ejecución solo
  para describir la configuración.

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
  es suficiente para comandos de estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen “configurado pero no disponible en esta
ruta de comando” en lugar de fallar o informar incorrectamente que la cuenta no está configurada.

## Paquetes pack

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

Cada entrada se convierte en un Plugin. Si el pack lista varias extensiones, el id del Plugin
pasa a ser `name/<fileBase>`.

Si tu Plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Barrera de seguridad: cada entrada de `openclaw.extensions` debe permanecer dentro del directorio del Plugin
después de resolver symlinks. Las entradas que escapan del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias de Plugin con
`npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida, sin dependencias de desarrollo en tiempo de ejecución). Mantén los árboles de dependencias del Plugin como "pure JS/TS" y evita paquetes que requieran compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un Plugin de canal deshabilitado, o
cuando un Plugin de canal está habilitado pero aún no está configurado, carga `setupEntry`
en lugar de la entrada completa del Plugin. Esto mantiene más ligeros el inicio y la configuración
cuando la entrada principal del Plugin también conecta herramientas, hooks u otro código
solo de tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un Plugin de canal use la misma ruta `setupEntry` durante la fase
de inicio previa a listen del gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar toda capacidad propiedad del canal de la que dependa el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway empiece a escuchar
- cualquier método de gateway, herramienta o servicio que deba existir durante esa misma ventana

Si tu entrada completa sigue siendo dueña de alguna capacidad requerida al inicio, no habilites
esta bandera. Mantén el Plugin con el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar helpers solo de superficie contractual de configuración que el core
pueda consultar antes de cargar el tiempo de ejecución completo del canal. La superficie actual de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El core usa esa superficie cuando necesita promocionar una configuración heredada de canal de una sola cuenta
a `channels.<id>.accounts.*` sin cargar la entrada completa del Plugin.
Matrix es el ejemplo incluido actual: mueve solo claves de autenticación/bootstrap a una
cuenta promocionada con nombre cuando ya existen cuentas con nombre, y puede preservar una
clave predeterminada configurada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parche de configuración mantienen perezoso el descubrimiento de superficie contractual incluida. El tiempo
de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de
volver a entrar en el inicio del canal incluido al importar el módulo.

Cuando esas superficies de inicio incluyen métodos RPC de gateway, mantenlas en un
prefijo específico del Plugin. Los espacios de nombres de administración del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen reservados y siempre se resuelven
a `operator.admin`, incluso si un Plugin solicita un alcance más estrecho.

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

Los Plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
sugerencias de instalación mediante `openclaw.install`. Esto mantiene al core libre de datos del catálogo.

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
      "blurb": "Chat autoalojado mediante bots webhook de Nextcloud Talk.",
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
- `docsLabel`: anula el texto del enlace a la documentación
- `preferOver`: ids de Plugin/canal de menor prioridad que esta entrada de catálogo debería superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto de la superficie de selección
- `markdownCapable`: marca el canal como compatible con Markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal en superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal en selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados aún aceptados por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: hace que el canal participe en el flujo estándar de quickstart `allowFrom`
- `forceAccountBinding`: requiere enlace explícito de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere búsqueda por sesión al resolver destinos de anuncio

OpenClaw también puede fusionar **catálogos externos de canales** (por ejemplo, una exportación de registro MPM
). Coloca un archivo JSON en una de estas ubicaciones:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o más archivos JSON (delimitados por comas/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados de la clave `"entries"`.

## Plugins de motor de contexto

Los Plugins de motor de contexto son dueños de la orquestación del contexto de sesión para ingesta, ensamblaje
y Compaction. Regístralos desde tu Plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Úsalo cuando tu Plugin necesite reemplazar o ampliar la canalización predeterminada de contexto
en lugar de limitarse a añadir búsqueda en memoria o hooks.

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

## Añadir una nueva capacidad

Cuando un Plugin necesita un comportamiento que no encaja en la API actual, no omitas
el sistema de Plugins con un acceso privado interno. Añade la capacidad que falta.

Secuencia recomendada:

1. definir el contrato del core
   Decide qué comportamiento compartido debería ser propiedad del core: política, reserva, fusión de configuración,
   ciclo de vida, semántica orientada al canal y forma del helper de tiempo de ejecución.
2. añadir superficies tipadas de registro/tiempo de ejecución de Plugin
   Amplía `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada de capacidad más pequeña y útil.
3. conectar el core + consumidores de canal/función
   Los canales y Plugins de funciones deberían consumir la nueva capacidad a través del core,
   no importando directamente una implementación de proveedor.
4. registrar implementaciones del proveedor
   Los Plugins de proveedor registran entonces sus backends para esa capacidad.
5. añadir cobertura contractual
   Añade pruebas para que la propiedad y la forma de registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw sigue siendo opinionado sin quedar codificado rígidamente a la visión
del mundo de un solo proveedor. Consulta el [Capability Cookbook](/es/plugins/architecture)
para ver una lista concreta de archivos y un ejemplo completo.

### Lista de comprobación de capacidad

Cuando añadas una nueva capacidad, la implementación normalmente debería tocar juntas
estas superficies:

- tipos de contrato del core en `src/<capability>/types.ts`
- ejecutor/helper de tiempo de ejecución del core en `src/<capability>/runtime.ts`
- superficie de registro de API de Plugin en `src/plugins/types.ts`
- cableado del registro de Plugins en `src/plugins/registry.ts`
- exposición en tiempo de ejecución del Plugin en `src/plugins/runtime/*` cuando los Plugins de función/canal
  necesiten consumirla
- helpers de captura/prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores/Plugins en `docs/`

Si falta una de esas superficies, normalmente es señal de que la capacidad
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

Patrón de prueba contractual:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Eso mantiene la regla simple:

- el core es dueño del contrato de capacidad + orquestación
- los Plugins de proveedor son dueños de las implementaciones del proveedor
- los Plugins de función/canal consumen helpers de tiempo de ejecución
- las pruebas contractuales mantienen explícita la propiedad

## Relacionado

- [Arquitectura de Plugins](/es/plugins/architecture) — modelo público de capacidades y formas
- [Subrutas del SDK de Plugin](/es/plugins/sdk-subpaths)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Construcción de Plugins](/es/plugins/building-plugins)
