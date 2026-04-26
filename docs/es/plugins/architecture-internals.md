---
read_when:
    - Implementar hooks de runtime de providers, ciclo de vida de canales o paquetes packs
    - Depurar el orden de carga de plugins o el estado del registro
    - Añadir una nueva capacidad de plugin o un plugin de motor de contexto
summary: 'Arquitectura interna de plugins: canalización de carga, registro, hooks de runtime, rutas HTTP y tablas de referencia'
title: Arquitectura interna de plugins
x-i18n:
    generated_at: "2026-04-26T11:33:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Para el modelo público de capacidades, formas de plugins y contratos de
propiedad/ejecución, consulta [Arquitectura de plugins](/es/plugins/architecture). Esta página es la
referencia para la mecánica interna: canalización de carga, registro, hooks de runtime,
rutas HTTP del Gateway, rutas de importación y tablas de esquema.

## Canalización de carga

Al iniciar, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de plugins
2. lee manifiestos nativos o de paquetes compatibles y metadatos del paquete
3. rechaza candidatos no seguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación para cada candidato
6. carga módulos nativos habilitados: los módulos integrados compilados usan un cargador nativo;
   los plugins nativos no compilados usan jiti
7. llama a los hooks nativos `register(api)` y recopila los registros en el registro de plugins
8. expone el registro a las superficies de comandos/runtime

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins integrados usan `register`; para nuevos plugins, prefiere `register`.
</Note>

Las barreras de seguridad ocurren **antes** de la ejecución en runtime. Los candidatos se bloquean
cuando la entrada escapa de la raíz del plugin, la ruta es escribible por cualquiera, o la
propiedad de la ruta parece sospechosa para plugins no integrados.

### Comportamiento centrado en el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del paquete
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/placeholders de Control UI
- mostrar metadatos de instalación/catálogo
- conservar descriptores baratos de activación y configuración sin cargar el runtime del plugin

Para los plugins nativos, el módulo de runtime es la parte del plano de datos. Registra
el comportamiento real, como hooks, herramientas, comandos o flujos de provider.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores solo de metadatos para la planificación de activación y el descubrimiento de configuración;
no sustituyen el registro de runtime, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan sugerencias de comandos, canales y providers del manifiesto
para reducir la carga de plugins antes de una materialización más amplia del registro:

- La carga de CLI se reduce a plugins que son propietarios del comando principal solicitado
- La resolución de configuración/canal se reduce a plugins que son propietarios del
  id del canal solicitado
- La resolución explícita de configuración/runtime del provider se reduce a plugins que son propietarios del
  id del provider solicitado

El planificador de activación expone tanto una API solo de ids para los llamadores existentes como una
API de plan para nuevos diagnósticos. Las entradas del plan informan por qué se seleccionó un plugin,
separando las sugerencias explícitas del planificador `activation.*` del comportamiento de respaldo de propiedad del manifiesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks. Esa división de motivos es el límite de compatibilidad:
los metadatos existentes del plugin siguen funcionando, mientras que el código nuevo puede detectar sugerencias amplias
o comportamiento de respaldo sin cambiar la semántica de carga del runtime.

El descubrimiento de configuración ahora prefiere ids propiedad del descriptor, como `setup.providers` y
`setup.cliBackends`, para reducir los plugins candidatos antes de recurrir a
`setup-api` para plugins que todavía necesitan hooks de runtime en tiempo de configuración. Las listas de configuración de providers
usan `providerAuthChoices` del manifiesto, opciones de configuración derivadas del descriptor
y metadatos del catálogo de instalación sin cargar el runtime del provider. El valor explícito
`setup.requiresRuntime: false` es un corte solo de descriptor; si se omite
`requiresRuntime`, se conserva el respaldo heredado de setup-api por compatibilidad. Si más
de un plugin descubierto reclama el mismo id de provider de configuración o backend de CLI normalizado, la búsqueda de configuración rechaza el propietario ambiguo en lugar de depender del orden de descubrimiento. Cuando sí se ejecuta el runtime de configuración, los diagnósticos del registro informan de divergencias entre `setup.providers` / `setup.cliBackends` y los providers o backends de CLI
registrados por setup-api sin bloquear los plugins heredados.

### Qué almacena en caché el cargador

OpenClaw conserva cachés cortas en proceso para:

- resultados de descubrimiento
- datos del registro de manifiestos
- registros de plugins cargados

Estas cachés reducen los picos de arranque y la sobrecarga de comandos repetidos. Es seguro
pensar en ellas como cachés de rendimiento de corta duración, no como persistencia.

Nota de rendimiento:

- Establece `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desactivar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los plugins cargados no mutan directamente globals arbitrarios del núcleo. Se registran en un
registro central de plugins.

El registro hace seguimiento de:

- registros de plugins (identidad, fuente, origen, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- providers
- manejadores RPC del gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad de plugins

Las funciones del núcleo luego leen de ese registro en lugar de hablar directamente con los módulos de plugin.
Eso mantiene la carga en una sola dirección:

- módulo de plugin -> registro en el registro
- runtime del núcleo -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo
necesitan un punto de integración: “leer el registro”, no “hacer casos especiales para cada módulo de plugin”.

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

      // La solicitud fue denegada; limpia cualquier estado local pendiente.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos de la carga del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: la vinculación resuelta para solicitudes aprobadas
- `request`: el resumen de la solicitud original, la sugerencia de desacoplamiento, el id del remitente y
  los metadatos de la conversación

Este callback es solo de notificación. No cambia quién puede vincular una
conversación, y se ejecuta después de que finaliza el manejo de aprobación del núcleo.

## Hooks de runtime de provider

Los plugins de provider tienen tres capas:

- **Metadatos del manifiesto** para búsquedas baratas antes del runtime:
  `setup.providers[].envVars`, compatibilidad obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks en tiempo de configuración**: `catalog` (heredado `discovery`) más
  `applyConfigDefaults`.
- **Hooks de runtime**: más de 40 hooks opcionales que cubren autenticación, resolución de modelos,
  envoltura de streams, niveles de thinking, política de repetición y endpoints de uso. Consulta
  la lista completa en [Orden y uso de hooks](#hook-order-and-usage).

OpenClaw sigue siendo propietario del bucle genérico del agente, failover, manejo de transcripciones y
política de herramientas. Estos hooks son la superficie de extensión para el comportamiento específico del provider
sin necesitar todo un transporte de inferencia personalizado.

Usa `setup.providers[].envVars` del manifiesto cuando el provider tiene credenciales basadas en entorno
que las rutas genéricas de autenticación/estado/selector de modelo deben ver sin
cargar el runtime del plugin. El obsoleto `providerAuthEnvVars` sigue siendo leído por el
adaptador de compatibilidad durante la ventana de deprecación, y los plugins no integrados que lo usan reciben un diagnóstico del manifiesto. Usa `providerAuthAliases` del manifiesto
cuando un id de provider deba reutilizar las variables de entorno, perfiles de autenticación,
autenticación respaldada por configuración y elección de incorporación de clave de API de otro id de provider. Usa
`providerAuthChoices` del manifiesto cuando las superficies de incorporación/autenticación de CLI deban conocer el id de elección del provider, las etiquetas de grupo y el cableado simple de autenticación con un indicador sin
cargar el runtime del provider. Conserva `envVars` del runtime del provider
para sugerencias orientadas al operador, como etiquetas de incorporación o variables de configuración
de client-id/client-secret de OAuth.

Usa `channelEnvVars` del manifiesto cuando un canal tiene autenticación o configuración guiada por entorno que el respaldo genérico de env del shell, las comprobaciones de config/estado o los avisos de configuración deban ver
sin cargar el runtime del canal.

### Orden y uso de hooks

Para plugins de modelo/provider, OpenClaw llama a los hooks en este orden aproximado.
La columna “Cuándo usarlo” es la guía rápida de decisión.

| #   | Hook                              | Qué hace                                                                                                       | Cuándo usarlo                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del provider en `models.providers` durante la generación de `models.json`            | El provider es propietario de un catálogo o de valores predeterminados de base URL                                                           |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales propiedad del provider durante la materialización de configuración     | Los valores predeterminados dependen del modo de autenticación, env o la semántica de la familia de modelos del provider                     |
| --  | _(búsqueda de modelo integrada)_  | OpenClaw prueba primero la ruta normal de registro/catálogo                                                   | _(no es un hook de plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de id de modelo antes de la búsqueda                              | El provider es propietario de la limpieza de alias antes de la resolución canónica del modelo                                                |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del provider antes del ensamblado genérico del modelo               | El provider es propietario de la limpieza del transporte para ids de provider personalizados en la misma familia de transporte               |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución de runtime/provider                                  | El provider necesita limpieza de configuración que debería vivir con el plugin; los helpers integrados de la familia Google también respaldan entradas de configuración de Google compatibles |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a providers de configuración                  | El provider necesita correcciones de metadatos de uso de streaming nativo impulsadas por endpoint                                            |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación con marcador de entorno para providers de configuración antes de cargar la autenticación de runtime | El provider tiene resolución de clave de API con marcador de entorno propiedad del provider; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcadores de entorno de AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/autoalojada o respaldada por configuración sin persistir texto sin formato         | El provider puede operar con un marcador de credencial sintética/local                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externos propiedad del provider; la `persistence` predeterminada es `runtime-only` para credenciales propiedad de CLI/app | El provider reutiliza credenciales de autenticación externas sin persistir tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Relega los marcadores de perfil sintético almacenados detrás de la autenticación respaldada por env/config    | El provider almacena perfiles sintéticos de marcador de posición que no deberían ganar precedencia                                           |
| 11  | `resolveDynamicModel`             | Respaldo síncrono para ids de modelo propiedad del provider que aún no están en el registro local             | El provider acepta ids arbitrarios de modelos upstream                                                                                       |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` se ejecuta de nuevo                                      | El provider necesita metadatos de red antes de resolver ids desconocidos                                                                     |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor integrado use el modelo resuelto                                   | El provider necesita reescrituras de transporte pero sigue usando un transporte del núcleo                                                   |
| 14  | `contributeResolvedModelCompat`   | Aporta indicadores de compatibilidad para modelos de proveedor detrás de otro transporte compatible           | El provider reconoce sus propios modelos en transportes proxy sin asumir el control del provider                                             |
| 15  | `capabilities`                    | Metadatos de transcripción/herramientas propiedad del provider usados por la lógica compartida del núcleo     | El provider necesita particularidades de transcripción/familia de provider                                                                   |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el ejecutor integrado los vea                                 | El provider necesita limpieza de esquema para la familia de transporte                                                                       |
| 17  | `inspectToolSchemas`              | Expone diagnósticos de esquema propiedad del provider después de la normalización                             | El provider quiere advertencias de palabras clave sin enseñar al núcleo reglas específicas del provider                                      |
| 18  | `resolveReasoningOutputMode`      | Selecciona contrato de salida de razonamiento nativo o etiquetado                                             | El provider necesita razonamiento/salida final etiquetados en lugar de campos nativos                                                       |
| 19  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los envoltorios genéricos de opciones de stream            | El provider necesita parámetros de solicitud predeterminados o limpieza de parámetros por provider                                           |
| 20  | `createStreamFn`                  | Reemplaza por completo la ruta normal de stream con un transporte personalizado                               | El provider necesita un protocolo de red personalizado, no solo un envoltorio                                                                |
| 21  | `wrapStreamFn`                    | Envoltorio de stream después de aplicar los envoltorios genéricos                                             | El provider necesita envoltorios de compatibilidad de encabezados/cuerpo/modelo sin un transporte personalizado                             |
| 22  | `resolveTransportTurnState`       | Adjunta encabezados o metadatos nativos por turno de transporte                                               | El provider quiere que los transportes genéricos envíen identidad de turno nativa del provider                                               |
| 23  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados WebSocket nativos o política de enfriamiento de sesión                                    | El provider quiere que los transportes WS genéricos ajusten encabezados de sesión o política de respaldo                                    |
| 24  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` de runtime   | El provider almacena metadatos de autenticación adicionales y necesita una forma personalizada de token en runtime                          |
| 25  | `refreshOAuth`                    | Anulación de actualización OAuth para endpoints de actualización personalizados o política de fallo de actualización | El provider no encaja en los actualizadores compartidos de `pi-ai`                                                                           |
| 26  | `buildAuthDoctorHint`             | Sugerencia de reparación añadida cuando falla la actualización de OAuth                                       | El provider necesita orientación propia de reparación de autenticación tras un fallo de actualización                                        |
| 27  | `matchesContextOverflowError`     | Comparador de desbordamiento de ventana de contexto propiedad del provider                                    | El provider tiene errores raw de desbordamiento que las heurísticas genéricas pasarían por alto                                              |
| 28  | `classifyFailoverReason`          | Clasificación de motivo de failover propiedad del provider                                                    | El provider puede mapear errores raw de API/transporte a límite de velocidad/sobrecarga/etc.                                                |
| 29  | `isCacheTtlEligible`              | Política de caché de prompts para providers proxy/backhaul                                                    | El provider necesita restricción de TTL de caché específica del proxy                                                                        |
| 30  | `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por falta de autenticación                                   | El provider necesita una sugerencia específica del provider para recuperarse de falta de autenticación                                       |
| 31  | `suppressBuiltInModel`            | Supresión de modelos upstream obsoletos más sugerencia opcional de error visible para el usuario             | El provider necesita ocultar filas upstream obsoletas o reemplazarlas con una sugerencia del proveedor                                      |
| 32  | `augmentModelCatalog`             | Filas sintéticas/finales del catálogo añadidas después del descubrimiento                                     | El provider necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                                |
| 33  | `resolveThinkingProfile`          | Conjunto de nivel `/think`, etiquetas de visualización y valor predeterminado específicos del modelo         | El provider expone una escalera personalizada de thinking o una etiqueta binaria para modelos seleccionados                                 |
| 34  | `isBinaryThinking`                | Hook de compatibilidad para alternar razonamiento encendido/apagado                                           | El provider expone solo thinking binario encendido/apagado                                                                                   |
| 35  | `supportsXHighThinking`           | Hook de compatibilidad para compatibilidad de razonamiento `xhigh`                                            | El provider quiere `xhigh` solo en un subconjunto de modelos                                                                                 |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidad del nivel `/think` predeterminado                                                      | El provider es propietario de la política predeterminada de `/think` para una familia de modelos                                            |
| 37  | `isModernModelRef`                | Comparador de modelo moderno para filtros de perfil en vivo y selección de smoke                              | El provider es propietario de la coincidencia de modelo preferido en vivo/smoke                                                              |
| 38  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de runtime justo antes de la inferencia       | El provider necesita un intercambio de token o una credencial de solicitud de corta duración                                                 |
| 39  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                   | El provider necesita análisis personalizado de token de uso/cuota o una credencial de uso diferente                                          |
| 40  | `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas específicas del provider de uso/cuota después de resolver la autenticación   | El provider necesita un endpoint de uso específico del provider o un analizador de carga                                                     |
| 41  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del provider para memoria/búsqueda                              | El comportamiento de embeddings de memoria pertenece al plugin del provider                                                                   |
| 42  | `buildReplayPolicy`               | Devuelve una política de repetición que controla el manejo de transcripciones para el provider                 | El provider necesita una política de transcripción personalizada (por ejemplo, eliminación de bloques de thinking)                           |
| 43  | `sanitizeReplayHistory`           | Reescribe el historial de repetición después de la limpieza genérica de transcripciones                       | El provider necesita reescrituras de repetición específicas del provider más allá de los helpers compartidos de Compaction                   |
| 44  | `validateReplayTurns`             | Validación o remodelado final de turnos de repetición antes del ejecutor integrado                            | El transporte del provider necesita una validación de turnos más estricta después del saneamiento genérico                                   |
| 45  | `onModelSelected`                 | Ejecuta efectos secundarios posteriores a la selección propiedad del provider                                  | El provider necesita telemetría o estado propio del provider cuando un modelo pasa a estar activo                                            |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
plugin de provider coincidente y luego recorren otros plugins de provider con capacidad de hook
hasta que uno realmente cambie el id del modelo o el transporte/configuración. Eso mantiene
funcionando los shims de alias/compatibilidad de provider sin exigir que el llamador sepa qué
plugin integrado es propietario de la reescritura. Si ningún hook de provider reescribe una entrada
de configuración compatible de la familia Google, el normalizador integrado de configuración de Google
sigue aplicando esa limpieza de compatibilidad.

Si el provider necesita un protocolo de red completamente personalizado o un ejecutor de solicitudes también personalizado,
eso es una clase distinta de extensión. Estos hooks son para comportamiento del provider
que sigue ejecutándose en el bucle normal de inferencia de OpenClaw.

### Ejemplo de provider

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

Los plugins integrados de provider combinan los hooks anteriores para ajustarse a las necesidades
de catálogo, autenticación, thinking, repetición y uso de cada proveedor. El conjunto autoritativo de hooks vive con
cada plugin bajo `extensions/`; esta página ilustra las formas en lugar de
reflejar la lista.

<AccordionGroup>
  <Accordion title="Providers de catálogo de paso directo">
    OpenRouter, Kilocode, Z.AI, xAI registran `catalog` más
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer ids de modelos upstream
    antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Providers de OAuth y endpoint de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para controlar el intercambio de tokens y la integración de `/usage`.
  </Accordion>
  <Accordion title="Familias de limpieza de repetición y transcripción">
    Las familias con nombre compartido (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los providers se adhieran a la
    política de transcripción mediante `buildReplayPolicy` en lugar de que cada plugin
    vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Providers solo de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran solo `catalog` y aprovechan el bucle compartido de inferencia.
  </Accordion>
  <Accordion title="Helpers de stream específicos de Anthropic">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` viven dentro de la
    interfaz pública `api.ts` / `contract-api.ts` del plugin de Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) en lugar de estar en
    el SDK genérico.
  </Accordion>
</AccordionGroup>

## Helpers de runtime

Los plugins pueden acceder a helpers seleccionados del núcleo mediante `api.runtime`. Para TTS:

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

- `textToSpeech` devuelve la carga normal del núcleo de TTS para superficies de archivo/nota de voz.
- Usa la configuración central `messages.tts` y la selección de provider.
- Devuelve buffer de audio PCM + frecuencia de muestreo. Los plugins deben remuestrear/codificar para los providers.
- `listVoices` es opcional por provider. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos, como etiquetas de configuración regional, género y personalidad para selectores conscientes del proveedor.
- OpenAI y ElevenLabs admiten telefonía actualmente. Microsoft no.

Los plugins también pueden registrar providers de voz mediante `api.registerSpeechProvider(...)`.

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
- Usa providers de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada de Microsoft `edge` se normaliza al id de provider `microsoft`.
- El modelo de propiedad preferido está orientado por empresa: un plugin de proveedor puede ser propietario de
  providers de texto, voz, imagen y futuros medios a medida que OpenClaw añade esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los plugins registran un único
provider tipado de comprensión multimedia en lugar de una bolsa genérica de clave/valor:

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
- Mantén el comportamiento del proveedor en el plugin del provider.
- La expansión aditiva debe seguir siendo tipada: nuevos métodos opcionales, nuevos campos opcionales
  de resultado, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo es propietario del contrato de capacidad y del helper de runtime
  - los plugins del proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de funciones/canales consumen `api.runtime.videoGeneration.*`

Para los helpers de runtime de comprensión multimedia, los plugins pueden llamar a:

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

Para transcripción de audio, los plugins pueden usar el runtime de comprensión multimedia
o el alias STT más antiguo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional cuando no se puede inferir MIME de forma fiable:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` es la superficie compartida preferida para
  comprensión de imagen/audio/video.
- Usa la configuración central de audio de comprensión multimedia (`tools.media.audio`) y el orden de respaldo de providers.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
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

- `provider` y `model` son anulaciones opcionales por ejecución, no cambios persistentes de sesión.
- OpenClaw solo respeta esos campos de anulación para llamadores de confianza.
- Para ejecuciones de respaldo propiedad del plugin, los operadores deben activarlo explícitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir los plugins de confianza a objetivos canónicos específicos `provider/model`, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagentes de plugins no confiables siguen funcionando, pero las solicitudes de anulación se rechazan en lugar de recurrir silenciosamente a un respaldo.

Para búsqueda web, los plugins pueden consumir el helper compartido de runtime en lugar de
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

Los plugins también pueden registrar providers de búsqueda web mediante
`api.registerWebSearchProvider(...)`.

Notas:

- Mantén la selección de provider, la resolución de credenciales y la semántica compartida de solicitudes en el núcleo.
- Usa providers de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de funciones/canales que necesitan comportamiento de búsqueda sin depender del envoltorio de herramientas del agente.

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

- `generate(...)`: genera una imagen usando la cadena configurada de providers de generación de imágenes.
- `listProviders(...)`: lista los providers disponibles de generación de imágenes y sus capacidades.

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
- `auth`: obligatorio. Usa `"gateway"` para requerir la autenticación normal del gateway, o `"plugin"` para autenticación/verificación de Webhook gestionada por el plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta gestionó la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y causará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan a menos que `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Las rutas superpuestas con diferentes niveles de `auth` se rechazan. Mantén las cadenas de paso `exact`/`prefix` en el mismo nivel de autenticación únicamente.
- Las rutas `auth: "plugin"` **no** reciben automáticamente alcances de runtime de operador. Son para webhooks/verificación de firmas gestionados por plugins, no para llamadas privilegiadas a helpers del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un ámbito de runtime de solicitud del Gateway, pero ese ámbito es intencionadamente conservador:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los alcances de runtime de la ruta del plugin fijados en `operator.write`, incluso si el llamador envía `x-openclaw-scopes`
  - los modos HTTP de confianza con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingreso privado) respetan `x-openclaw-scopes` solo cuando el encabezado está explícitamente presente
  - si `x-openclaw-scopes` no está presente en esas solicitudes de ruta de plugin con identidad, el alcance de runtime recurre a `operator.write`
- Regla práctica: no asumas que una ruta de plugin autenticada por gateway es una superficie admin implícita. Si tu ruta necesita comportamiento exclusivo de admin, exige un modo de autenticación con identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del SDK de Plugin

Usa subrutas estrechas del SDK en lugar del barrel raíz monolítico `openclaw/plugin-sdk`
al crear nuevos plugins. Subrutas principales:

| Subruta                            | Propósito                                          |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Primitivas de registro de plugins                  |
| `openclaw/plugin-sdk/channel-core` | Helpers de entrada/construcción de canales         |
| `openclaw/plugin-sdk/core`         | Helpers compartidos genéricos y contrato paraguas  |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los plugins de canal eligen de una familia de interfaces estrechas: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un único contrato `approvalCapability` en lugar de mezclarse entre campos no relacionados
del plugin. Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).

Los helpers de runtime y configuración viven bajo subrutas `*-runtime`
correspondientes (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` está obsoleto: es un shim de compatibilidad para
plugins antiguos. El código nuevo debería importar primitivas genéricas más estrechas.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de plugin integrado):

- `index.js` — entrada del plugin integrado
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel solo de runtime
- `setup-entry.js` — entrada del plugin de configuración

Los plugins externos solo deberían importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes `src/*` de otro paquete de plugin desde el núcleo o desde otro plugin.
Los puntos de entrada cargados por fachada prefieren la instantánea activa de configuración del runtime cuando existe,
y luego recurren al archivo de configuración resuelto en disco.

Las subrutas específicas de capacidad, como `image-generation`, `media-understanding`
y `speech`, existen porque los plugins integrados las usan hoy. No son
automáticamente contratos externos congelados a largo plazo; consulta la página de referencia del SDK correspondiente
cuando dependas de ellas.

## Esquemas de herramientas de mensajes

Los plugins deben ser propietarios de las contribuciones al esquema
`describeMessageTool(...)` específicas del canal para primitivas que no sean mensajes, como
reacciones, lecturas y encuestas. La presentación compartida de envío debe usar el contrato genérico `MessagePresentation`
en lugar de campos nativos del proveedor como botones, componentes, bloques o tarjetas.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para el contrato,
las reglas de respaldo, el mapeo por proveedor y la lista de comprobación para autores de plugins.

Los plugins con capacidad de envío declaran lo que pueden renderizar mediante capacidades de mensaje:

- `presentation` para bloques de presentación semántica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El núcleo decide si renderiza la presentación de forma nativa o si la degrada a texto.
No expongas rutas de escape de UI nativas del proveedor desde la herramienta genérica de mensajes.
Los helpers obsoletos del SDK para esquemas nativos heredados siguen exportándose para
plugins de terceros existentes, pero los plugins nuevos no deberían usarlos.

## Resolución de destinos de canal

Los plugins de canal deben ser propietarios de la semántica de destino específica del canal. Mantén genérico el
host compartido de salida y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` le dice al núcleo si una
  entrada debe ir directamente a una resolución similar a id en lugar de buscar en el directorio.
- `messaging.targetResolver.resolveTarget(...)` es el respaldo del plugin cuando el
  núcleo necesita una resolución final propiedad del proveedor después de la normalización o tras un
  fallo de búsqueda en directorio.
- `messaging.resolveOutboundSessionRoute(...)` es propietario de la construcción de rutas
  de sesión específicas del proveedor una vez que se resuelve un destino.

Separación recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deberían ocurrir antes de
  buscar peers/groups.
- Usa `looksLikeId` para comprobaciones del tipo “trata esto como un id de destino explícito/nativo”.
- Usa `resolveTarget` para respaldo de normalización específico del proveedor, no para
  una búsqueda amplia en directorios.
- Mantén ids nativos del proveedor como ids de chat, ids de hilo, JIDs, handles e ids de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio a partir de la configuración deben mantener esa lógica en el
plugin y reutilizar los helpers compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Úsalo cuando un canal necesite peers/groups respaldados por configuración como:

- peers de DM guiados por lista de permitidos
- mapas configurados de canales/grupos
- respaldos estáticos de directorio con alcance por cuenta

Los helpers compartidos en `directory-runtime` solo manejan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- helpers de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas y la normalización de ids específicas del canal deben permanecer en la
implementación del plugin.

## Catálogos de providers

Los plugins de provider pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de provider
- `{ providers }` para varias entradas de provider

Usa `catalog` cuando el plugin sea propietario de ids de modelos específicos del provider, valores
predeterminados de base URL o metadatos de modelo condicionados por autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un plugin respecto a los
providers implícitos integrados de OpenClaw:

- `simple`: providers simples impulsados por clave de API o entorno
- `profile`: providers que aparecen cuando existen perfiles de autenticación
- `paired`: providers que sintetizan varias entradas de providers relacionados
- `late`: última pasada, después de otros providers implícitos

Los providers posteriores ganan en colisión de claves, por lo que los plugins pueden sobrescribir intencionadamente una entrada integrada de provider con el mismo id de provider.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`

## Inspección de canales de solo lectura

Si tu plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de runtime. Puede asumir que las credenciales
  están completamente materializadas y puede fallar rápido cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de doctor/reparación de configuración
  no deberían necesitar materializar credenciales de runtime solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo el estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando sea relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores raw de tokens solo para informar disponibilidad
  de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen correspondiente)
  es suficiente para comandos de tipo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen “configurado pero no disponible en esta ruta de comando” en lugar de fallar o informar incorrectamente que la cuenta no está configurada.

## Paquetes packs

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

Si tu plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Barandilla de seguridad: cada entrada `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de la resolución de symlink. Las entradas que salgan del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias del plugin con un
`npm install --omit=dev --ignore-scripts` local del proyecto (sin scripts de ciclo de vida,
sin dependencias de desarrollo en runtime), ignorando la configuración heredada de instalación global de npm.
Mantén los árboles de dependencias del plugin como “JS/TS puro” y evita paquetes que requieran
compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún no está configurado, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto mantiene más ligeros el arranque y la configuración
cuando la entrada principal del plugin también conecta herramientas, hooks u otro código
solo de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un plugin de canal use la misma ruta `setupEntry` durante la fase
de arranque previa a la escucha del gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra por completo la superficie de arranque que debe existir
antes de que el gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar cada capacidad propiedad del canal de la que dependa el arranque, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway comience a escuchar
- cualquier método, herramienta o servicio del gateway que deba existir durante esa misma ventana

Si tu entrada completa sigue siendo propietaria de alguna capacidad requerida de arranque, no habilites
este indicador. Mantén el plugin con el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el arranque.

Los canales integrados también pueden publicar helpers de superficie de contrato solo de configuración que el núcleo
puede consultar antes de que se cargue el runtime completo del canal. La superficie actual
de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración heredada de canal de una sola cuenta
a `channels.<id>.accounts.*` sin cargar la entrada completa del plugin.
Matrix es el ejemplo integrado actual: mueve solo claves de autenticación/bootstrap a una
cuenta promocionada con nombre cuando ya existen cuentas con nombre, y puede conservar una
clave configurada de cuenta predeterminada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parche de configuración mantienen perezoso el descubrimiento integrado de la superficie de contrato. El tiempo de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de volver a entrar en el arranque del canal integrado al importar el módulo.

Cuando esas superficies de arranque incluyan métodos RPC del gateway, mantenlas en un
prefijo específico del plugin. Los espacios de nombres admin del núcleo (`config.*`,
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

### Metadatos de catálogo de canal

Los plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
pistas de instalación mediante `openclaw.install`. Esto mantiene el núcleo sin datos de catálogo.

Ejemplo:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (autoalojado)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat autoalojado mediante bots de Webhook de Nextcloud Talk.",
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
- `docsLabel`: anula el texto del enlace de la documentación
- `preferOver`: ids de plugin/canal de menor prioridad a los que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto para superficies de selección
- `markdownCapable`: marca el canal como compatible con Markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración/configure cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados aún aceptados por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: activa el canal para el flujo estándar rápido de `allowFrom`
- `forceAccountBinding`: requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere búsqueda en sesión al resolver destinos de anuncios

OpenClaw también puede fusionar **catálogos externos de canales** (por ejemplo, una exportación
de registro MPM). Deja un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o más archivos JSON (delimitados por coma/punto y coma/`PATH`). Cada archivo debería
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados de la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de instalación de providers exponen
datos normalizados de fuente de instalación junto al bloque raw `openclaw.install`. Los
datos normalizados identifican si la especificación npm es una versión exacta o un selector flotante,
si hay metadatos de integridad esperados presentes y si también hay disponible una ruta de origen local.
Cuando se conoce la identidad del catálogo/paquete, los datos normalizados advierten si el nombre
del paquete npm analizado diverge de esa identidad. También advierten cuando `defaultChoice` no es válido o apunta a una fuente que
no está disponible, y cuando hay metadatos de integridad npm presentes sin una fuente npm
válida. Los consumidores deberían tratar `installSource` como un campo opcional aditivo para que
las entradas construidas a mano y los shims de catálogo no tengan que sintetizarlo.
Esto permite que la incorporación y los diagnósticos expliquen el estado del plano de fuentes sin
importar el runtime del plugin.

Las entradas oficiales externas de npm deberían preferir un `npmSpec` exacto más
`expectedIntegrity`. Los nombres de paquete simples y los dist-tags siguen funcionando por
compatibilidad, pero muestran advertencias del plano de fuentes para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas por integridad sin romper los plugins existentes.
Cuando la incorporación instala desde una ruta local de catálogo, registra una entrada de índice de plugin gestionado con `source: "path"` y un `sourcePath`
relativo al espacio de trabajo cuando es posible. La ruta absoluta operativa de carga permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas locales de estación de trabajo en una configuración de larga duración. Esto mantiene visibles las instalaciones locales de desarrollo para los diagnósticos del plano de fuentes sin añadir una segunda superficie raw de divulgación de rutas del sistema de archivos. El índice persistido de plugins `plugins/installs.json` es la fuente de verdad de instalación y puede actualizarse sin cargar módulos de runtime de plugins.
Su mapa `installRecords` es duradero incluso cuando falta un manifiesto de plugin o
no es válido; su arreglo `plugins` es una vista reconstruible de manifiesto/caché.

## Plugins de motor de contexto

Los plugins de motor de contexto son propietarios de la orquestación del contexto de sesión para ingestión, ensamblaje
y Compaction. Regístralos desde tu plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Úsalo cuando tu plugin necesite reemplazar o ampliar la canalización predeterminada de contexto
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

## Añadir una nueva capacidad

Cuando un plugin necesite un comportamiento que no encaje en la API actual, no omitas
el sistema de plugins con un acceso privado directo. Añade la capacidad que falta.

Secuencia recomendada:

1. define el contrato del núcleo
   Decide qué comportamiento compartido debe ser propiedad del núcleo: política, respaldo, fusión de configuración,
   ciclo de vida, semántica orientada a canal y forma del helper de runtime.
2. añade superficies tipadas de registro/runtime de plugins
   Amplía `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada de capacidad más pequeña y útil.
3. conecta los consumidores del núcleo + canal/función
   Los canales y plugins de funciones deberían consumir la nueva capacidad a través del núcleo,
   no importando directamente una implementación del proveedor.
4. registra implementaciones del proveedor
   Los plugins del proveedor registran entonces sus backends contra la capacidad.
5. añade cobertura de contrato
   Añade pruebas para que la propiedad y la forma de registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw se mantiene con criterio sin quedar codificado a la
visión del mundo de un solo provider. Consulta el [Libro de recetas de capacidades](/es/plugins/architecture)
para una lista concreta de archivos y un ejemplo trabajado.

### Lista de comprobación de capacidad

Cuando añadas una nueva capacidad, la implementación normalmente debería tocar estas
superficies juntas:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- ejecutor principal/helper de runtime en `src/<capability>/runtime.ts`
- superficie de registro de API de plugin en `src/plugins/types.ts`
- cableado del registro de plugins en `src/plugins/registry.ts`
- exposición del runtime de plugins en `src/plugins/runtime/*` cuando los plugins de funciones/canales
  necesiten consumirlo
- helpers de captura/prueba en `src/test-utils/plugin-registration.ts`
- afirmaciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operador/plugin en `docs/`

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

// API del plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper compartido de runtime para plugins de funciones/canales
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

- el núcleo es propietario del contrato de capacidad + orquestación
- los plugins del proveedor son propietarios de las implementaciones del proveedor
- los plugins de funciones/canales consumen helpers de runtime
- las pruebas de contrato mantienen explícita la propiedad

## Relacionado

- [Arquitectura de plugins](/es/plugins/architecture) — modelo público de capacidad y formas
- [Subrutas del SDK de Plugin](/es/plugins/sdk-subpaths)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Construcción de plugins](/es/plugins/building-plugins)
