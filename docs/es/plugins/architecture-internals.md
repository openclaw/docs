---
read_when:
    - Implementación de hooks de ejecución del proveedor, ciclo de vida del canal o paquetes empaquetados
    - Depuración del orden de carga del Plugin o del estado del registro
    - Agregar una nueva capacidad de Plugin o un Plugin de motor de contexto
summary: 'Aspectos internos de la arquitectura de Plugin: canalización de carga, registro, hooks de ejecución, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de Plugin
x-i18n:
    generated_at: "2026-04-24T08:58:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Para el modelo público de capacidades, las formas de los Plugin y los
contratos de propiedad/ejecución, consulta [Arquitectura de Plugin](/es/plugins/architecture). Esta página es la
referencia para la mecánica interna: canalización de carga, registro, hooks de ejecución,
rutas HTTP del Gateway, rutas de importación y tablas de esquemas.

## Canalización de carga

Al iniciar, OpenClaw hace aproximadamente lo siguiente:

1. descubre raíces candidatas de Plugin
2. lee manifiestos de paquetes nativos o compatibles y metadatos del paquete
3. rechaza candidatos inseguros
4. normaliza la configuración del Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga módulos nativos habilitados: los módulos integrados compilados usan un cargador nativo;
   los Plugin nativos no compilados usan jiti
7. llama a los hooks nativos `register(api)` y recopila los registros en el registro de Plugin
8. expone el registro a los comandos/superficies de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los Plugin integrados usan `register`; prefiere `register` para Plugin nuevos.
</Note>

Las compuertas de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean
cuando la entrada escapa de la raíz del Plugin, la ruta tiene escritura global o la
propiedad de la ruta parece sospechosa para Plugin no integrados.

### Comportamiento con prioridad del manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el Plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del paquete
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/marcadores de posición de la interfaz de Control
- mostrar metadatos de instalación/catálogo
- conservar descriptores baratos de activación y configuración sin cargar el tiempo de ejecución del Plugin

Para Plugin nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra
el comportamiento real, como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores solo de metadatos para la planificación de activación y el descubrimiento de configuración;
no reemplazan el registro en tiempo de ejecución, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan las sugerencias de comando, canal y proveedor del manifiesto
para limitar la carga de Plugin antes de una materialización más amplia del registro:

- La carga de la CLI se limita a los Plugin que poseen el comando principal solicitado
- la resolución de configuración del canal/Plugin se limita a los Plugin que poseen el
  id. de canal solicitado
- la resolución explícita de configuración/tiempo de ejecución del proveedor se limita a los Plugin que poseen el
  id. de proveedor solicitado

El planificador de activación expone tanto una API de solo id. para los llamadores existentes como una
API de plan para diagnósticos nuevos. Las entradas del plan informan por qué se seleccionó un Plugin,
separando las sugerencias explícitas del planificador `activation.*` de la alternativa de propiedad del manifiesto
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks. Esa separación de motivos es el límite de compatibilidad:
los metadatos existentes del Plugin siguen funcionando, mientras que el código nuevo puede detectar sugerencias amplias
o comportamiento alternativo sin cambiar la semántica de carga en tiempo de ejecución.

El descubrimiento de configuración ahora prefiere los id. propiedad del descriptor, como `setup.providers` y
`setup.cliBackends`, para limitar los Plugin candidatos antes de recurrir a
`setup-api` para Plugin que aún necesitan hooks de tiempo de ejecución durante la configuración. Si más de
un Plugin descubierto reclama el mismo id. normalizado de proveedor de configuración o backend de CLI,
la búsqueda de configuración rechaza al propietario ambiguo en lugar de depender del orden de descubrimiento.

### Qué almacena en caché el cargador

OpenClaw mantiene cachés breves en proceso para:

- resultados de descubrimiento
- datos del registro de manifiestos
- registros de Plugin cargados

Estas cachés reducen los picos de inicio y la sobrecarga de comandos repetidos. Es seguro
pensar en ellas como cachés de rendimiento de corta duración, no como persistencia.

Nota de rendimiento:

- Establece `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desactivar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los Plugin cargados no mutan directamente variables globales arbitrarias del núcleo. Se registran en un
registro central de Plugin.

El registro rastrea:

- registros de Plugin (identidad, fuente, origen, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- controladores RPC del Gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad del Plugin

Las características del núcleo luego leen de ese registro en lugar de hablar con los módulos de Plugin
directamente. Esto mantiene la carga en una sola dirección:

- módulo de Plugin -> registro en el registro
- tiempo de ejecución del núcleo -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo
necesitan un punto de integración: “leer el registro”, no “hacer casos especiales para cada módulo de Plugin”.

## Callbacks de vinculación de conversaciones

Los Plugin que vinculan una conversación pueden reaccionar cuando se resuelve una aprobación.

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

      // La solicitud fue denegada; borra cualquier estado local pendiente.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos de la carga útil del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: la vinculación resuelta para solicitudes aprobadas
- `request`: el resumen de la solicitud original, sugerencia de desvinculación, id. del remitente y
  metadatos de la conversación

Este callback es solo de notificación. No cambia quién tiene permitido vincular una
conversación y se ejecuta después de que termina el manejo de aprobación del núcleo.

## Hooks de ejecución del proveedor

Los Plugin de proveedor tienen tres capas:

- **Metadatos del manifiesto** para búsquedas baratas previas al tiempo de ejecución: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks de tiempo de configuración**: `catalog` (heredado `discovery`) más
  `applyConfigDefaults`.
- **Hooks de tiempo de ejecución**: más de 40 hooks opcionales que cubren autenticación, resolución
  de modelos, envoltura de flujo, niveles de pensamiento, política de repetición y endpoints de uso. Consulta
  la lista completa en [Orden y uso de hooks](#hook-order-and-usage).

OpenClaw sigue siendo propietario del bucle genérico del agente, la conmutación por error, el manejo de transcripciones y
la política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico del proveedor
sin necesidad de un transporte de inferencia personalizado completo.

Usa el manifiesto `providerAuthEnvVars` cuando el proveedor tenga credenciales basadas en variables de entorno
que las rutas genéricas de autenticación/estado/selector de modelo deban ver sin cargar el tiempo de ejecución del Plugin.
Usa el manifiesto `providerAuthAliases` cuando un id. de proveedor deba reutilizar las
variables de entorno, perfiles de autenticación, autenticación respaldada por configuración y la opción de incorporación de clave de API de otro id. de proveedor.
Usa el manifiesto `providerAuthChoices` cuando las superficies de CLI de incorporación/selección de autenticación
deban conocer el id. de elección del proveedor, las etiquetas de grupo y el cableado simple de autenticación de una sola marca sin cargar el tiempo de ejecución del proveedor.
Mantén `envVars` del tiempo de ejecución del proveedor para sugerencias dirigidas al operador, como etiquetas de incorporación o variables de
configuración de client-id/client-secret de OAuth.

Usa el manifiesto `channelEnvVars` cuando un canal tenga autenticación o configuración impulsada por variables de entorno
que las rutas genéricas de alternativa de entorno de shell, comprobaciones de configuración/estado o prompts de configuración deban ver
sin cargar el tiempo de ejecución del canal.

### Orden y uso de hooks

Para los Plugin de modelo/proveedor, OpenClaw llama a los hooks en este orden aproximado.
La columna “Cuándo usar” es la guía rápida de decisión.

| #   | Hook                              | Qué hace                                                                                                       | Cuándo usar                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`          | El proveedor posee un catálogo o valores predeterminados de URL base                                                                          |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales de configuración propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, del entorno o de la semántica de la familia de modelos del proveedor         |
| --  | _(búsqueda integrada de modelos)_ | OpenClaw primero intenta la ruta normal de registro/catálogo                                                  | _(no es un hook de Plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de id. de modelo antes de la búsqueda                             | El proveedor posee la limpieza de alias antes de la resolución canónica del modelo                                                            |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblado genérico del modelo             | El proveedor posee la limpieza del transporte para id. de proveedor personalizados en la misma familia de transporte                          |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución de proveedor/tiempo de ejecución                     | El proveedor necesita una limpieza de configuración que debe vivir con el Plugin; los helpers integrados de la familia Google también respaldan entradas de configuración de Google compatibles |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a proveedores de configuración               | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por endpoints                                           |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación con marcador de entorno para proveedores de configuración antes de cargar la autenticación de tiempo de ejecución | El proveedor tiene una resolución de clave API con marcador de entorno propiedad del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcador de entorno AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/alojada en el propio sistema o respaldada por configuración sin conservar texto sin formato | El proveedor puede operar con un marcador de credencial sintético/local                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles externos de autenticación propiedad del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales propiedad de CLI/app | El proveedor reutiliza credenciales externas de autenticación sin conservar tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Reduce la prioridad de los marcadores sintéticos almacenados de perfil frente a la autenticación respaldada por entorno/configuración | El proveedor almacena perfiles de marcador sintético que no deberían tener precedencia                                                       |
| 11  | `resolveDynamicModel`             | Alternativa síncrona para id. de modelo propiedad del proveedor que aún no están en el registro local        | El proveedor acepta id. arbitrarios de modelos ascendentes                                                                                    |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` se ejecuta de nuevo                                      | El proveedor necesita metadatos de red antes de resolver id. desconocidos                                                                     |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor incrustado use el modelo resuelto                                  | El proveedor necesita reescrituras de transporte pero sigue usando un transporte del núcleo                                                   |
| 14  | `contributeResolvedModelCompat`   | Aporta indicadores de compatibilidad para modelos del proveedor detrás de otro transporte compatible          | El proveedor reconoce sus propios modelos en transportes proxy sin asumir el control del proveedor                                            |
| 15  | `capabilities`                    | Metadatos de transcripción/herramientas propiedad del proveedor usados por la lógica compartida del núcleo    | El proveedor necesita particularidades de transcripción/familia de proveedor                                                                  |
| 16  | `normalizeToolSchemas`            | Normaliza los esquemas de herramientas antes de que el ejecutor incrustado los vea                            | El proveedor necesita limpieza de esquemas de la familia de transporte                                                                        |
| 17  | `inspectToolSchemas`              | Expone diagnósticos de esquemas propiedad del proveedor después de la normalización                            | El proveedor quiere advertencias de palabras clave sin enseñar al núcleo reglas específicas del proveedor                                    |
| 18  | `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo frente al etiquetado                                   | El proveedor necesita razonamiento etiquetado/salida final en lugar de campos nativos                                                        |
| 19  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de envoltorios genéricos de opciones de flujo                  | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                          |
| 20  | `createStreamFn`                  | Reemplaza por completo la ruta normal de flujo con un transporte personalizado                                 | El proveedor necesita un protocolo de conexión personalizado, no solo un envoltorio                                                           |
| 21  | `wrapStreamFn`                    | Envoltorio de flujo después de aplicar los envoltorios genéricos                                               | El proveedor necesita envoltorios de compatibilidad de encabezados/cuerpo/modelo sin un transporte personalizado                             |
| 22  | `resolveTransportTurnState`       | Adjunta encabezados o metadatos nativos por turno del transporte                                               | El proveedor quiere que transportes genéricos envíen identidad de turno nativa del proveedor                                                  |
| 23  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados nativos de WebSocket o política de enfriamiento de sesión                                  | El proveedor quiere que transportes genéricos de WS ajusten encabezados de sesión o política alternativa                                      |
| 24  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` de tiempo de ejecución | El proveedor almacena metadatos adicionales de autenticación y necesita una forma de token personalizada en tiempo de ejecución              |
| 25  | `refreshOAuth`                    | Anulación de actualización de OAuth para endpoints de actualización personalizados o política de fallo de actualización | El proveedor no encaja en los actualizadores compartidos de `pi-ai`                                                                           |
| 26  | `buildAuthDoctorHint`             | Sugerencia de reparación añadida cuando falla la actualización de OAuth                                        | El proveedor necesita una guía de reparación de autenticación propiedad del proveedor tras un fallo de actualización                          |
| 27  | `matchesContextOverflowError`     | Comparador de desbordamiento de ventana de contexto propiedad del proveedor                                    | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas pasarían por alto                                     |
| 28  | `classifyFailoverReason`          | Clasificación del motivo de conmutación por error propiedad del proveedor                                      | El proveedor puede mapear errores sin procesar de API/transporte a límite de tasa/sobrecarga/etc.                                            |
| 29  | `isCacheTtlEligible`              | Política de caché de prompt para proveedores proxy/backhaul                                                    | El proveedor necesita control de TTL de caché específico de proxy                                                                             |
| 30  | `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por falta de autenticación                                    | El proveedor necesita una sugerencia de recuperación por falta de autenticación específica del proveedor                                      |
| 31  | `suppressBuiltInModel`            | Supresión de modelos ascendentes obsoletos con sugerencia de error opcional orientada al usuario              | El proveedor necesita ocultar filas ascendentes obsoletas o reemplazarlas con una sugerencia del proveedor                                   |
| 32  | `augmentModelCatalog`             | Filas de catálogo sintéticas/finales añadidas después del descubrimiento                                       | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                                |
| 33  | `resolveThinkingProfile`          | Conjunto de niveles de `/think`, etiquetas de visualización y valor predeterminado específicos del modelo     | El proveedor expone una escala personalizada de pensamiento o una etiqueta binaria para modelos seleccionados                                |
| 34  | `isBinaryThinking`                | Hook de compatibilidad para alternancia de razonamiento activado/desactivado                                   | El proveedor expone solo pensamiento binario activado/desactivado                                                                             |
| 35  | `supportsXHighThinking`           | Hook de compatibilidad para compatibilidad de razonamiento `xhigh`                                             | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                                 |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidad para el nivel predeterminado de `/think`                                                | El proveedor posee la política predeterminada de `/think` para una familia de modelos                                                        |
| 37  | `isModernModelRef`                | Comparador de modelos modernos para filtros de perfiles en vivo y selección de smoke                          | El proveedor posee la coincidencia de modelos preferidos para vivo/smoke                                                                      |
| 38  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de tiempo de ejecución justo antes de la inferencia | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                                 |
| 39  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                   | El proveedor necesita análisis personalizado de token de uso/cuota o una credencial de uso diferente                                         |
| 40  | `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación  | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de cargas útiles                                            |
| 41  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                             | El comportamiento de embeddings de memoria pertenece al Plugin del proveedor                                                                  |
| 42  | `buildReplayPolicy`               | Devuelve una política de repetición que controla el manejo de la transcripción para el proveedor              | El proveedor necesita una política de transcripción personalizada (por ejemplo, eliminación de bloques de pensamiento)                        |
| 43  | `sanitizeReplayHistory`           | Reescribe el historial de repetición después de la limpieza genérica de la transcripción                      | El proveedor necesita reescrituras de repetición específicas del proveedor más allá de los helpers compartidos de Compaction                 |
| 44  | `validateReplayTurns`             | Validación o remodelado final de turnos de repetición antes del ejecutor incrustado                           | El transporte del proveedor necesita una validación de turnos más estricta después del saneamiento genérico                                  |
| 45  | `onModelSelected`                 | Ejecuta efectos secundarios posteriores a la selección propiedad del proveedor                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo pasa a estar activo                                       |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
Plugin de proveedor coincidente y luego recorren otros Plugin de proveedor con capacidad de hook
hasta que uno realmente cambie el id. del modelo o el transporte/configuración. Eso mantiene
funcionando los shims de alias/compatibilidad de proveedor sin exigir que el llamador sepa qué
Plugin integrado posee la reescritura. Si ningún hook de proveedor reescribe una entrada de configuración
compatible de la familia Google, el normalizador integrado de configuración de Google sigue aplicando
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de conexión totalmente personalizado o un ejecutor de solicitudes personalizado,
esa es una clase distinta de extensión. Estos hooks son para comportamiento del proveedor
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

Los Plugin de proveedor integrados combinan los hooks anteriores para ajustarse a las necesidades de catálogo,
autenticación, pensamiento, repetición y uso de cada proveedor. El conjunto autoritativo de hooks vive con
cada Plugin bajo `extensions/`; esta página ilustra las formas en lugar de
reflejar la lista.

<AccordionGroup>
  <Accordion title="Proveedores de catálogo de paso a través">
    OpenRouter, Kilocode, Z.AI, xAI registran `catalog` más
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer id. de modelos ascendentes
    antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Proveedores de OAuth y endpoint de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para gestionar el intercambio de tokens y la integración de `/usage`.
  </Accordion>
  <Accordion title="Familias de limpieza de repetición y transcripción">
    Las familias con nombre compartido (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los proveedores opten por
    la política de transcripción mediante `buildReplayPolicy` en lugar de que cada Plugin
    vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Proveedores solo de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran solo `catalog` y usan el bucle de inferencia compartido.
  </Accordion>
  <Accordion title="Helpers de flujo específicos de Anthropic">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` viven dentro de la
    interfaz pública `api.ts` / `contract-api.ts` del Plugin de Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) y no en
    el SDK genérico.
  </Accordion>
</AccordionGroup>

## Helpers de ejecución

Los Plugin pueden acceder a helpers seleccionados del núcleo mediante `api.runtime`. Para TTS:

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

- `textToSpeech` devuelve la carga útil de salida TTS normal del núcleo para superficies de archivo/nota de voz.
- Usa la configuración del núcleo `messages.tts` y la selección del proveedor.
- Devuelve búfer de audio PCM + frecuencia de muestreo. Los Plugin deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos, como etiquetas de configuración regional, género y personalidad, para selectores conscientes del proveedor.
- OpenAI y ElevenLabs admiten telefonía hoy. Microsoft no.

Los Plugin también pueden registrar proveedores de voz mediante `api.registerSpeechProvider(...)`.

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

- Mantén en el núcleo la política de TTS, la alternativa y la entrega de respuestas.
- Usa proveedores de voz para el comportamiento de síntesis propiedad del proveedor.
- La entrada heredada de Microsoft `edge` se normaliza al id. de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a empresas: un Plugin de proveedor puede poseer
  texto, voz, imagen y futuros proveedores de medios a medida que OpenClaw añada esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los Plugin registran un único proveedor tipado
de comprensión de medios en lugar de una bolsa genérica de clave/valor:

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

- Mantén en el núcleo la orquestación, la alternativa, la configuración y el cableado del canal.
- Mantén el comportamiento del proveedor dentro del Plugin del proveedor.
- La expansión aditiva debe seguir siendo tipada: nuevos métodos opcionales, nuevos campos
  opcionales de resultado, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo posee el contrato de capacidad y el helper de ejecución
  - los Plugin de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los Plugin de característica/canal consumen `api.runtime.videoGeneration.*`

Para los helpers de ejecución de comprensión de medios, los Plugin pueden llamar a:

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

Para la transcripción de audio, los Plugin pueden usar el tiempo de ejecución de comprensión de medios
o el alias antiguo de STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional cuando el tipo MIME no puede inferirse de forma fiable:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` es la superficie compartida preferida para
  comprensión de imagen/audio/video.
- Usa la configuración de audio de comprensión de medios del núcleo (`tools.media.audio`) y el orden de alternativas del proveedor.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` se mantiene como alias de compatibilidad.

Los Plugin también pueden lanzar ejecuciones de subagentes en segundo plano mediante `api.runtime.subagent`:

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
- Para ejecuciones alternativas propiedad del Plugin, los operadores deben habilitarlo con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir los Plugin de confianza a destinos canónicos específicos `provider/model`, o `"*"` para permitir explícitamente cualquier destino.
- Las ejecuciones de subagentes de Plugin no confiables siguen funcionando, pero las solicitudes de anulación se rechazan en lugar de recurrir silenciosamente a una alternativa.

Para búsqueda web, los Plugin pueden consumir el helper compartido de ejecución en lugar de
conectarse al cableado de herramientas del agente:

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

Los Plugin también pueden registrar proveedores de búsqueda web mediante
`api.registerWebSearchProvider(...)`.

Notas:

- Mantén en el núcleo la selección de proveedor, la resolución de credenciales y la semántica compartida de solicitudes.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para Plugin de característica/canal que necesiten comportamiento de búsqueda sin depender del envoltorio de herramientas del agente.

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

Los Plugin pueden exponer endpoints HTTP con `api.registerHttpRoute(...)`.

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
- `auth`: obligatorio. Usa `"gateway"` para requerir la autenticación normal del Gateway, o `"plugin"` para autenticación/verificación de Webhook gestionada por el Plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo Plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta gestionó la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error de carga del Plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de Plugin deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un Plugin no puede reemplazar la ruta de otro Plugin.
- Las rutas superpuestas con distintos niveles de `auth` se rechazan. Mantén las cadenas de continuidad `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente ámbitos de ejecución del operador. Son para webhooks/verificación de firma gestionados por el Plugin, no para llamadas privilegiadas a helpers del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un ámbito de ejecución de solicitud del Gateway, pero ese ámbito es intencionalmente conservador:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los ámbitos de ejecución de la ruta del Plugin fijados en `operator.write`, incluso si el llamador envía `x-openclaw-scopes`
  - los modos HTTP de confianza con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingreso privado) respetan `x-openclaw-scopes` solo cuando el encabezado está presente explícitamente
  - si `x-openclaw-scopes` está ausente en esas solicitudes de ruta de Plugin con identidad, el ámbito de ejecución vuelve a `operator.write`
- Regla práctica: no asumas que una ruta de Plugin autenticada por gateway es implícitamente una superficie de administración. Si tu ruta necesita comportamiento solo de administrador, exige un modo de autenticación con identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del SDK de Plugin

Usa subrutas estrechas del SDK en lugar del barrel monolítico raíz `openclaw/plugin-sdk`
al crear Plugin nuevos. Subrutas principales del núcleo:

| Subruta                            | Propósito                                          |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core` | Helpers de entrada/construcción de canal           |
| `openclaw/plugin-sdk/core`         | Helpers compartidos genéricos y contrato paraguas  |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los Plugin de canal eligen entre una familia de interfaces estrechas: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un único contrato `approvalCapability` en lugar de mezclarse entre campos no relacionados del
Plugin. Consulta [Plugin de canal](/es/plugins/sdk-channel-plugins).

Los helpers de tiempo de ejecución y configuración viven bajo subrutas `*-runtime`
correspondientes (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` está obsoleto: es un shim de compatibilidad para
Plugin antiguos. El código nuevo debe importar primitivas genéricas más estrechas en su lugar.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de Plugin integrado):

- `index.js` — entrada del Plugin integrado
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel solo de tiempo de ejecución
- `setup-entry.js` — entrada del Plugin de configuración

Los Plugin externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes `src/*` de otro paquete de Plugin desde el núcleo ni desde otro Plugin.
Los puntos de entrada cargados por fachada prefieren la instantánea activa de configuración de tiempo de ejecución cuando existe,
y en caso contrario recurren al archivo de configuración resuelto en disco.

Las subrutas específicas de capacidades, como `image-generation`, `media-understanding`
y `speech`, existen porque los Plugin integrados las usan hoy. No son
automáticamente contratos externos congelados a largo plazo: consulta la página
de referencia del SDK correspondiente cuando dependas de ellas.

## Esquemas de herramientas de mensajes

Los Plugin deben poseer las contribuciones de esquema `describeMessageTool(...)`
específicas del canal para primitivas que no sean mensajes, como reacciones, lecturas y encuestas.
La presentación compartida del envío debe usar el contrato genérico `MessagePresentation`
en lugar de campos nativos del proveedor para botones, componentes, bloques o tarjetas.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para ver el contrato,
las reglas de alternativa, el mapeo del proveedor y la lista de comprobación para autores de Plugin.

Los Plugin con capacidad de envío declaran lo que pueden representar mediante capacidades de mensajes:

- `presentation` para bloques de presentación semántica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El núcleo decide si representar la presentación de forma nativa o degradarla a texto.
No expongas vías de escape de interfaz de usuario nativas del proveedor desde la herramienta genérica de mensajes.
Los helpers del SDK obsoletos para esquemas nativos heredados siguen exportándose para
Plugin externos existentes de terceros, pero los Plugin nuevos no deben usarlos.

## Resolución de objetivos de canal

Los Plugin de canal deben poseer la semántica de objetivos específica del canal. Mantén el host
saliente compartido como genérico y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un objetivo normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al núcleo si una
  entrada debe pasar directamente a la resolución tipo id. en lugar de a la búsqueda en directorio.
- `messaging.targetResolver.resolveTarget(...)` es la alternativa del Plugin cuando
  el núcleo necesita una resolución final propiedad del proveedor después de la normalización o tras un
  fallo de búsqueda en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` posee la construcción de la ruta
  de sesión específica del proveedor una vez resuelto un objetivo.

Separación recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deben ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de “tratar esto como un id. de objetivo explícito/nativo”.
- Usa `resolveTarget` para la alternativa de normalización específica del proveedor, no para
  una búsqueda amplia en el directorio.
- Mantén id. nativos del proveedor, como id. de chat, id. de hilo, JID, identificadores y
  id. de sala, dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los Plugin que derivan entradas de directorio a partir de la configuración deben mantener esa lógica en el
Plugin y reutilizar los helpers compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Úsalo cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares de mensajes directos impulsados por lista de permitidos
- mapas configurados de canal/grupo
- alternativas de directorio estático con ámbito de cuenta

Los helpers compartidos en `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- helpers de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas específica del canal y la normalización de id. deben permanecer en la
implementación del Plugin.

## Catálogos de proveedores

Los Plugin de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el Plugin posea id. de modelo específicos del proveedor, valores predeterminados
de URL base o metadatos de modelos condicionados por autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un Plugin con respecto a los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores sencillos impulsados por clave de API o entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas relacionadas de proveedor
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en caso de colisión de claves, por lo que los Plugin pueden
anular intencionadamente una entrada integrada de proveedor con el mismo id. de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`

## Inspección de canal de solo lectura

Si tu Plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de tiempo de ejecución. Puede asumir que las credenciales
  están completamente materializadas y puede fallar rápidamente cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de doctor/reparación
  de configuración no deberían necesitar materializar credenciales de tiempo de ejecución solo para
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
  es suficiente para comandos de tipo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen “configurado pero no disponible en esta ruta de comando” en lugar de fallar o informar erróneamente que la cuenta no está configurada.

## Paquetes empaquetados

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

Cada entrada se convierte en un Plugin. Si el paquete enumera varias extensiones, el id. del Plugin
pasa a ser `name/<fileBase>`.

Si tu Plugin importa dependencias de npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Barreras de seguridad: cada entrada `openclaw.extensions` debe permanecer dentro del directorio del Plugin
después de resolver enlaces simbólicos. Las entradas que escapan del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias del Plugin con
`npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida ni dependencias de desarrollo en tiempo de ejecución). Mantén los árboles de dependencias del Plugin como “JS/TS puro” y evita paquetes que requieran compilaciones de `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un Plugin de canal deshabilitado, o
cuando un Plugin de canal está habilitado pero aún sin configurar, carga `setupEntry`
en lugar de la entrada completa del Plugin. Esto hace que el inicio y la configuración sean más ligeros
cuando la entrada principal del Plugin también conecta herramientas, hooks u otro código
solo de tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un Plugin de canal opte por la misma ruta `setupEntry` durante la
fase de inicio previa a la escucha del Gateway, incluso cuando el canal ya está configurado.

Úsalo solo cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el Gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar todas las capacidades propiedad del canal de las que depende el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el Gateway empiece a escuchar
- cualquier método, herramienta o servicio del Gateway que deba existir durante esa misma ventana

Si tu entrada completa sigue siendo propietaria de alguna capacidad de inicio requerida, no habilites
esta marca. Mantén el Plugin en el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales integrados también pueden publicar helpers de superficie de contrato solo de configuración que el núcleo
puede consultar antes de que se cargue el tiempo de ejecución completo del canal. La superficie actual
de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promocionar una configuración heredada de canal de cuenta única
a `channels.<id>.accounts.*` sin cargar la entrada completa del Plugin.
Matrix es el ejemplo integrado actual: mueve solo claves de autenticación/inicialización a una
cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede preservar una
clave de cuenta predeterminada configurada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parche de configuración mantienen perezoso el descubrimiento de la superficie de contrato integrada. El tiempo
de importación sigue siendo ligero; la superficie de promoción se carga solo al primer uso en lugar de
volver a entrar en el inicio del canal integrado durante la importación del módulo.

Cuando esas superficies de inicio incluyan métodos RPC del Gateway, mantenlos en un
prefijo específico del Plugin. Los espacios de nombres de administración del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven
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

Los Plugin de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
sugerencias de instalación mediante `openclaw.install`. Esto mantiene los datos fuera del núcleo.

Ejemplo:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (alojado por cuenta propia)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat alojado por cuenta propia mediante bots de Webhook de Nextcloud Talk.",
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

- `detailLabel`: etiqueta secundaria para superficies de catálogo/estado más ricas
- `docsLabel`: anula el texto del enlace para el enlace a la documentación
- `preferOver`: id. de Plugin/canal de menor prioridad a los que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto para la superficie de selección
- `markdownCapable`: marca el canal como compatible con Markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración/cuadro de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para las superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados que siguen aceptándose por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: hace que el canal participe en el flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver objetivos de anuncio

OpenClaw también puede fusionar **catálogos de canales externos** (por ejemplo, una
exportación de registro MPM). Coloca un archivo JSON en una de estas ubicaciones:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o más archivos JSON (delimitados por coma, punto y coma o `PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados de la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de instalación de proveedores exponen
hechos normalizados de origen de instalación junto al bloque sin procesar `openclaw.install`. Los
hechos normalizados identifican si la especificación npm es una versión exacta o un selector flotante,
si existen metadatos de integridad esperados y si también hay disponible una ruta de origen local. Los
consumidores deben tratar `installSource` como un campo opcional aditivo para que las entradas
antiguas construidas manualmente y los shims de compatibilidad no tengan que sintetizarlo. Esto permite que la incorporación y los diagnósticos expliquen el estado del plano de origen sin importar el tiempo de ejecución del Plugin.

Las entradas oficiales externas de npm deben preferir un `npmSpec` exacto más
`expectedIntegrity`. Los nombres de paquete sin versión y las dist-tags siguen funcionando por
compatibilidad, pero muestran advertencias del plano de origen para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas por integridad sin romper los Plugin existentes.
Cuando la incorporación instala desde una ruta de catálogo local, registra una
entrada `plugins.installs` con `source: "path"` y una `sourcePath` relativa al espacio de trabajo
cuando es posible. La ruta operativa absoluta de carga permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas locales de estación de trabajo
en una configuración duradera. Esto mantiene visibles las instalaciones de desarrollo local para los
diagnósticos del plano de origen sin añadir una segunda superficie sin procesar de divulgación de rutas del sistema de archivos.

## Plugin de motor de contexto

Los Plugin de motor de contexto son propietarios de la orquestación del contexto de sesión para la ingesta, el ensamblado
y Compaction. Regístralos desde tu Plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Úsalo cuando tu Plugin necesite reemplazar o ampliar la canalización de contexto predeterminada
en lugar de solo añadir búsqueda de memoria o hooks.

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

Cuando un Plugin necesite un comportamiento que no encaje en la API actual, no evites
el sistema de Plugin con un acceso privado interno. Agrega la capacidad que falta.

Secuencia recomendada:

1. define el contrato del núcleo
   Decide qué comportamiento compartido debe poseer el núcleo: política, alternativa, combinación de configuración,
   ciclo de vida, semántica orientada al canal y forma del helper de tiempo de ejecución.
2. añade superficies tipadas de registro/tiempo de ejecución de Plugin
   Amplía `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada de capacidad útil más pequeña.
3. conecta consumidores del núcleo y de canal/característica
   Los canales y los Plugin de características deben consumir la nueva capacidad a través del núcleo,
   no importando directamente una implementación del proveedor.
4. registra implementaciones del proveedor
   Los Plugin del proveedor registran entonces sus backends contra la capacidad.
5. añade cobertura de contrato
   Añade pruebas para que la propiedad y la forma del registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw se mantiene opinado sin quedar codificado rígidamente a la
visión del mundo de un solo proveedor. Consulta el [Recetario de capacidades](/es/plugins/architecture)
para ver una lista concreta de archivos y un ejemplo desarrollado.

### Lista de comprobación de capacidades

Cuando agregas una nueva capacidad, la implementación normalmente debe tocar estas
superficies a la vez:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- ejecutor/helper de tiempo de ejecución del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de API de Plugin en `src/plugins/types.ts`
- cableado del registro de Plugin en `src/plugins/registry.ts`
- exposición del tiempo de ejecución del Plugin en `src/plugins/runtime/*` cuando los Plugin
  de característica/canal necesiten consumirla
- helpers de captura/prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores/Plugin en `docs/`

Si falta una de esas superficies, normalmente es señal de que la capacidad
todavía no está totalmente integrada.

### Plantilla de capacidad

Patrón mínimo:

```ts
// contrato del núcleo
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API de Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper compartido de tiempo de ejecución para Plugin de característica/canal
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Patrón de prueba de contrato:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Eso mantiene la regla sencilla:

- el núcleo posee el contrato de capacidad + la orquestación
- los Plugin del proveedor poseen las implementaciones del proveedor
- los Plugin de característica/canal consumen helpers de tiempo de ejecución
- las pruebas de contrato mantienen explícita la propiedad

## Relacionado

- [Arquitectura de Plugin](/es/plugins/architecture) — modelo público de capacidades y formas
- [Subrutas del SDK de Plugin](/es/plugins/sdk-subpaths)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Creación de Plugin](/es/plugins/building-plugins)
