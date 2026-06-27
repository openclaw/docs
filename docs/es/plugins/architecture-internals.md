---
read_when:
    - Implementación de hooks de runtime de proveedores, ciclo de vida de canales o paquetes de paquetes
    - Depuración del orden de carga de plugins o del estado del registro
    - Agregar una nueva capacidad de plugin o plugin de motor de contexto
summary: 'Internos de la arquitectura de Plugin: canalización de carga, registro, hooks de runtime, rutas HTTP y tablas de referencia'
title: Internos de la arquitectura de Plugin
x-i18n:
    generated_at: "2026-06-27T12:05:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para el modelo público de capacidades, las formas de plugins y los contratos de
propiedad/ejecución, consulta [Arquitectura de Plugin](/es/plugins/architecture).
Esta página es la referencia para la mecánica interna: canalización de carga,
registro, hooks de runtime, rutas HTTP de Gateway, rutas de importación y tablas
de esquemas.

## Canalización de carga

Al iniciar, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de plugins
2. lee manifiestos de bundles nativos o compatibles y metadatos de paquetes
3. rechaza candidatos inseguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga los módulos nativos habilitados: los módulos bundled compilados usan un cargador nativo;
   el código fuente local TypeScript de terceros usa el fallback de emergencia Jiti
7. llama a los hooks nativos `register(api)` y recopila los registros en el registro de plugins
8. expone el registro a comandos/superficies de runtime

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins bundled usan `register`; prefiere `register` para plugins nuevos.
</Note>

Las compuertas de seguridad ocurren **antes** de la ejecución del runtime. Los
candidatos se bloquean cuando la entrada escapa de la raíz del plugin, la ruta
es escribible por todos, o la propiedad de la ruta parece sospechosa para
plugins no bundled.

Los candidatos bloqueados permanecen vinculados a su id de plugin para
diagnósticos. Si la configuración aún referencia ese id, la validación informa
que el plugin está presente pero bloqueado y remite a la advertencia de
seguridad de ruta en vez de tratar la entrada de configuración como obsoleta.

### Comportamiento centrado en el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades de bundle
- validar `plugins.entries.<id>.config`
- enriquecer etiquetas/placeholders de Control UI
- mostrar metadatos de instalación/catálogo
- conservar descriptores económicos de activación y configuración sin cargar el runtime del plugin

Para plugins nativos, el módulo de runtime es la parte del plano de datos. Registra
el comportamiento real, como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el
plano de control. Son descriptores solo de metadatos para la planificación de
activación y el descubrimiento de configuración; no reemplazan el registro de
runtime, `register(...)` ni `setupEntry`. Los primeros consumidores de activación
en vivo ahora usan pistas de comandos, canales y proveedores del manifiesto
para acotar la carga de plugins antes de una materialización más amplia del
registro:

- la carga de CLI se limita a los plugins que poseen el comando principal solicitado
- la resolución de configuración/plugin de canal se limita a los plugins que poseen el
  id de canal solicitado
- la resolución explícita de configuración/runtime de proveedor se limita a los plugins que poseen el
  id de proveedor solicitado
- la planificación de inicio de Gateway usa `activation.onStartup` para
  importaciones explícitas al inicio y exclusiones de inicio; los plugins sin
  metadatos de inicio se cargan solo mediante disparadores de activación más
  acotados

Las precargas de runtime en tiempo de solicitud que piden el alcance amplio
`all` aún derivan un conjunto explícito efectivo de ids de plugins a partir de la
configuración, la planificación de inicio, los canales configurados, slots y
reglas de auto-habilitación. Si ese conjunto derivado está vacío, OpenClaw carga
un registro de runtime vacío en vez de ampliarse a todos los plugins
descubribles.

El planificador de activación expone tanto una API solo de ids para llamadores
existentes como una API de plan para diagnósticos nuevos. Las entradas del plan
informan por qué se seleccionó un plugin, separando las pistas explícitas del
planificador `activation.*` de los fallback de propiedad del manifiesto, como
`providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`
y hooks. Esa división de razones es el límite de compatibilidad: los metadatos
existentes de plugins siguen funcionando, mientras que el código nuevo puede
detectar pistas amplias o comportamiento fallback sin cambiar la semántica de
carga del runtime.

El descubrimiento de configuración ahora prefiere ids propiedad del descriptor,
como `setup.providers` y `setup.cliBackends`, para acotar los plugins candidatos
antes de recurrir a `setup-api` para plugins que aún necesitan hooks de runtime
durante la configuración. Las listas de configuración de proveedores usan
`providerAuthChoices` del manifiesto, opciones de configuración derivadas del
descriptor y metadatos de catálogo de instalación sin cargar el runtime del
proveedor. `setup.requiresRuntime: false` explícito es un corte solo de
descriptor; omitir `requiresRuntime` mantiene el fallback heredado de setup-api
por compatibilidad. Si más de un plugin descubierto reclama el mismo proveedor
de configuración normalizado o id de backend de CLI, la búsqueda de
configuración rechaza el propietario ambiguo en vez de depender del orden de
descubrimiento. Cuando sí se ejecuta el runtime de configuración, los
diagnósticos del registro informan divergencia entre `setup.providers` /
`setup.cliBackends` y los proveedores o backends de CLI registrados por setup-api
sin bloquear plugins heredados.

### Límite de caché de plugins

OpenClaw no cachea resultados de descubrimiento de plugins ni datos directos
del registro de manifiestos detrás de ventanas de reloj. Las instalaciones,
ediciones de manifiestos y cambios de rutas de carga deben ser visibles en la
siguiente lectura explícita de metadatos o reconstrucción de snapshot. El parser
del archivo de manifiesto puede mantener una caché acotada de firmas de archivo
indexada por la ruta abierta del manifiesto, inode, tamaño y marcas de tiempo;
esa caché solo evita volver a parsear bytes sin cambios y no debe cachear
respuestas de descubrimiento, registro, propietario o política.

La ruta rápida segura de metadatos es la propiedad explícita de objetos, no una
caché oculta. Las rutas críticas de inicio de Gateway deben pasar el
`PluginMetadataSnapshot` actual, la `PluginLookUpTable` derivada o un registro
explícito de manifiestos a través de la cadena de llamadas. La validación de
configuración, la auto-habilitación al inicio, el bootstrap de plugins y la
selección de proveedores pueden reutilizar esos objetos mientras representen la
configuración y el inventario de plugins actuales. La búsqueda de configuración
aún reconstruye los metadatos del manifiesto bajo demanda, salvo que la ruta
específica de configuración reciba un registro explícito de manifiestos;
mantenlo como un fallback de ruta fría en vez de agregar cachés ocultas de
búsqueda. Cuando cambie la entrada, reconstruye y reemplaza el snapshot en vez
de mutarlo o conservar copias históricas.
Las vistas sobre el registro activo de plugins y los helpers de bootstrap de
canales bundled deben recalcularse desde el registro/raíz actual. Los mapas de
corta vida están bien dentro de una llamada para desduplicar trabajo o proteger
contra reentradas; no deben convertirse en cachés de metadatos de proceso.

Para la carga de plugins, la capa de caché persistente es la carga de runtime.
Puede reutilizar estado del cargador cuando el código o los artefactos
instalados se cargan realmente, por ejemplo:

- `PluginLoaderCacheState` y registros compatibles de runtime activo
- cachés de jiti/módulos y cachés de cargadores de superficies públicas usadas para evitar importar
  la misma superficie de runtime repetidamente
- cachés de sistema de archivos para artefactos de plugins instalados
- mapas de corta vida por llamada para normalización de rutas o resolución de duplicados

Esas cachés son detalles de implementación del plano de datos. No deben
responder preguntas del plano de control como "¿qué plugin posee este proveedor?"
salvo que el llamador haya pedido deliberadamente carga de runtime.

No agregues cachés persistentes ni basadas en reloj para:

- resultados de descubrimiento
- registros directos de manifiestos
- registros de manifiestos reconstruidos desde el índice de plugins instalados
- búsqueda de propietario de proveedor, supresión de modelos, política de
  proveedor o metadatos de artefactos públicos
- cualquier otra respuesta derivada del manifiesto donde un manifiesto cambiado,
  índice instalado o ruta de carga debería ser visible en la siguiente lectura de metadatos

Los llamadores que reconstruyen metadatos de manifiestos desde el índice
persistido de plugins instalados reconstruyen ese registro bajo demanda. El
índice instalado es estado durable del plano de origen; no es una caché oculta
de metadatos en proceso.

## Modelo de registro

Los plugins cargados no mutan directamente globals aleatorios del núcleo. Se
registran en un registro central de plugins.

El registro rastrea:

- registros de plugins (identidad, fuente, origen, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- manejadores RPC de Gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad de plugins

Luego las funciones del núcleo leen desde ese registro en vez de comunicarse
directamente con módulos de plugins. Esto mantiene la carga en una sola
dirección:

- módulo de plugin -> registro en el registro
- runtime del núcleo -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las
superficies del núcleo solo necesitan un punto de integración: "leer el
registro", no "especializar cada módulo de plugin".

## Callbacks de vinculación de conversaciones

Los plugins que vinculan una conversación pueden reaccionar cuando se resuelve
una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después
de que una solicitud de vinculación se apruebe o deniegue:

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
- `request`: el resumen de la solicitud original, pista de desvinculación, id del remitente y
  metadatos de conversación

Este callback es solo de notificación. No cambia quién tiene permiso para
vincular una conversación y se ejecuta después de que termina el manejo de
aprobación del núcleo.

## Hooks de runtime de proveedores

Los plugins de proveedores tienen tres capas:

- **Metadatos de manifiesto** para búsqueda económica antes del runtime:
  `setup.providers[].envVars`, compatibilidad obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks de tiempo de configuración**: `catalog` (heredado `discovery`) más
  `applyConfigDefaults`.
- **Hooks de runtime**: más de 40 hooks opcionales que cubren autenticación, resolución de modelos,
  envoltura de streams, niveles de pensamiento, política de replay y endpoints de uso. Consulta
  la lista completa en [Orden y uso de hooks](#hook-order-and-usage).

OpenClaw aún posee el bucle genérico del agente, failover, manejo de
transcripciones y política de herramientas. Estos hooks son la superficie de
extensión para comportamiento específico del proveedor sin necesitar un
transporte de inferencia personalizado completo.

Usa `setup.providers[].envVars` del manifiesto cuando el proveedor tenga
credenciales basadas en env que las rutas genéricas de autenticación/estado/
selector de modelos deban ver sin cargar el runtime del plugin. El
`providerAuthEnvVars` obsoleto aún lo lee el adaptador de compatibilidad durante
la ventana de deprecación, y los plugins no bundled que lo usan reciben un
diagnóstico de manifiesto. Usa `providerAuthAliases` del manifiesto cuando un id
de proveedor deba reutilizar las variables de entorno, perfiles de
autenticación, autenticación respaldada por configuración y opción de onboarding
con clave de API de otro id de proveedor. Usa `providerAuthChoices` del
manifiesto cuando las superficies de CLI de onboarding/elección de
autenticación deban conocer el id de opción del proveedor, etiquetas de grupo y
cableado simple de autenticación de una sola flag sin cargar el runtime del
proveedor. Mantén `envVars` del runtime del proveedor para pistas orientadas al
operador, como etiquetas de onboarding o variables de configuración de
client-id/client-secret de OAuth.

Usa `channelEnvVars` del manifiesto cuando un canal tenga autenticación o
configuración impulsada por env que el fallback genérico de entorno de shell,
las comprobaciones de configuración/estado o los prompts de configuración deban
ver sin cargar el runtime del canal.

### Orden y uso de hooks

Para plugins de modelo/proveedor, OpenClaw llama a los hooks en este orden
aproximado. La columna "Cuándo usar" es la guía rápida de decisión. Los campos
de proveedor solo de compatibilidad que OpenClaw ya no llama, como
`ProviderPlugin.capabilities` y `suppressBuiltInModel`, se omiten
intencionalmente aquí.

| #   | Hook                              | Qué hace                                                                                                       | Cuándo usarlo                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`            | El proveedor posee un catálogo o valores predeterminados de URL base                                                                          |
| 2   | `applyConfigDefaults`             | Aplica los valores predeterminados de configuración global propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de familia de modelos del proveedor                 |
| --  | _(búsqueda de modelos integrada)_ | OpenClaw prueba primero la ruta normal de registro/catálogo                                                    | _(no es un hook de Plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de id de modelo antes de la búsqueda                               | El proveedor posee la limpieza de alias antes de la resolución del modelo canónico                                                            |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de familia de proveedor antes del ensamblaje genérico del modelo                   | El proveedor posee la limpieza de transporte para ids de proveedor personalizados en la misma familia de transporte                           |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución de runtime/proveedor                                  | El proveedor necesita limpieza de configuración que debe residir con el Plugin; los helpers incluidos de la familia Google también respaldan las entradas de configuración de Google admitidas |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a proveedores de configuración                | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por endpoint                                           |
| 7   | `resolveConfigApiKey`             | Resuelve la autenticación con marcador de entorno para proveedores de configuración antes de cargar la autenticación del runtime | Los proveedores exponen sus propios hooks de resolución de claves de API con marcador de entorno                                              |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/autohospedada o respaldada por configuración sin persistir texto plano              | El proveedor puede operar con un marcador de credencial sintético/local                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externos propiedad del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales propiedad de la CLI/app | El proveedor reutiliza credenciales de autenticación externas sin persistir tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Relega marcadores de posición de perfiles sintéticos almacenados detrás de autenticación respaldada por entorno/configuración | El proveedor almacena perfiles sintéticos de marcador de posición que no deben tener precedencia                                             |
| 11  | `resolveDynamicModel`             | Fallback síncrono para ids de modelo propiedad del proveedor que aún no están en el registro local             | El proveedor acepta ids arbitrarios de modelos upstream                                                                                       |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono, luego `resolveDynamicModel` se ejecuta de nuevo                                      | El proveedor necesita metadatos de red antes de resolver ids desconocidos                                                                     |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el runner integrado use el modelo resuelto                                     | El proveedor necesita reescrituras de transporte, pero sigue usando un transporte core                                                        |
| 14  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el runner integrado los vea                                   | El proveedor necesita limpieza de esquemas de familia de transporte                                                                          |
| 15  | `inspectToolSchemas`              | Expone diagnósticos de esquema propiedad del proveedor después de la normalización                            | El proveedor quiere advertencias de palabras clave sin enseñar reglas específicas de proveedor al core                                        |
| 16  | `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo frente al etiquetado                                  | El proveedor necesita salida final/de razonamiento etiquetada en lugar de campos nativos                                                      |
| 17  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los wrappers genéricos de opciones de stream                | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                          |
| 18  | `createStreamFn`                  | Sustituye por completo la ruta normal de stream por un transporte personalizado                               | El proveedor necesita un protocolo de cable personalizado, no solo un wrapper                                                                 |
| 20  | `wrapStreamFn`                    | Wrapper de stream después de aplicar los wrappers genéricos                                                   | El proveedor necesita wrappers de compatibilidad de encabezados/cuerpo/modelo de solicitud sin un transporte personalizado                    |
| 21  | `resolveTransportTurnState`       | Adjunta encabezados o metadatos de transporte nativos por turno                                               | El proveedor quiere que los transportes genéricos envíen identidad de turno nativa del proveedor                                             |
| 22  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados nativos de WebSocket o política de enfriamiento de sesión                                 | El proveedor quiere que los transportes WS genéricos ajusten encabezados de sesión o política de fallback                                    |
| 23  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` del runtime   | El proveedor almacena metadatos de autenticación adicionales y necesita una forma de token de runtime personalizada                           |
| 24  | `refreshOAuth`                    | Sustitución de actualización OAuth para endpoints de actualización personalizados o política de fallo de actualización | El proveedor no encaja con los actualizadores compartidos de OpenClaw                                                                         |
| 25  | `buildAuthDoctorHint`             | Sugerencia de reparación añadida cuando falla la actualización OAuth                                          | El proveedor necesita orientación de reparación de autenticación propia del proveedor después de un fallo de actualización                    |
| 26  | `matchesContextOverflowError`     | Coincidencia de desbordamiento de ventana de contexto propiedad del proveedor                                 | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas pasarían por alto                                    |
| 27  | `classifyFailoverReason`          | Clasificación de motivo de failover propiedad del proveedor                                                   | El proveedor puede mapear errores sin procesar de API/transporte a límite de tasa/sobrecarga/etc.                                            |
| 28  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                  | El proveedor necesita control de TTL de caché específico de proxy                                                                             |
| 29  | `buildMissingAuthMessage`         | Reemplazo del mensaje genérico de recuperación de autenticación faltante                                      | El proveedor necesita una sugerencia de recuperación de autenticación faltante específica del proveedor                                       |
| 30  | `augmentModelCatalog`             | Filas sintéticas/finales de catálogo añadidas después del descubrimiento                                      | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                                |
| 31  | `resolveThinkingProfile`          | Conjunto de niveles `/think` específico del modelo, etiquetas de visualización y valor predeterminado         | El proveedor expone una escala de razonamiento personalizada o una etiqueta binaria para modelos seleccionados                               |
| 32  | `isBinaryThinking`                | Hook de compatibilidad para alternar razonamiento activado/desactivado                                        | El proveedor expone solo razonamiento binario activado/desactivado                                                                           |
| 33  | `supportsXHighThinking`           | Hook de compatibilidad de soporte de razonamiento `xhigh`                                                     | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                                 |
| 34  | `resolveDefaultThinkingLevel`     | Hook de compatibilidad de nivel `/think` predeterminado                                                       | El proveedor posee la política `/think` predeterminada para una familia de modelos                                                            |
| 35  | `isModernModelRef`                | Coincidencia de modelo moderno para filtros de perfiles live y selección de smoke                             | El proveedor posee la coincidencia de modelos preferidos live/smoke                                                                          |
| 36  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de runtime justo antes de la inferencia        | El proveedor necesita un intercambio de tokens o una credencial de solicitud de corta duración                                                |
| 37  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                   | El proveedor necesita análisis personalizado de token de uso/cuota o una credencial de uso diferente                                         |
| 38  | `fetchUsageSnapshot`              | Obtener y normalizar instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación                             | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de payload                                                                           |
| 39  | `createEmbeddingProvider`         | Crear un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                                                     | El comportamiento de embeddings de memoria pertenece al plugin del proveedor                                                                                    |
| 40  | `buildReplayPolicy`               | Devolver una política de reproducción que controle el manejo de transcripciones para el proveedor                                        | El proveedor necesita una política de transcripción personalizada (por ejemplo, eliminar bloques de razonamiento)                                                               |
| 41  | `sanitizeReplayHistory`           | Reescribir el historial de reproducción después de la limpieza genérica de transcripciones                                                        | El proveedor necesita reescrituras de reproducción específicas del proveedor más allá de los helpers compartidos de Compaction                                                             |
| 42  | `validateReplayTurns`             | Validación o remodelado final de turnos de reproducción antes del runner embebido                                           | El transporte del proveedor necesita una validación de turnos más estricta después del saneamiento genérico                                                                    |
| 43  | `onModelSelected`                 | Ejecutar efectos secundarios posteriores a la selección propiedad del proveedor                                                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo se activa                                                                  |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero revisan el
plugin de proveedor coincidente, luego continúan con otros plugins de proveedor
con hooks hasta que uno realmente cambie el id de modelo o el transporte/configuración. Eso mantiene
funcionando los shims de alias/compatibilidad de proveedores sin exigir que el llamador sepa qué
plugin incluido es dueño de la reescritura. Si ningún hook de proveedor reescribe una entrada de
configuración compatible de la familia Google, el normalizador de configuración de Google incluido aún aplica
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable completamente personalizado o un ejecutor de solicitudes personalizado,
esa es una clase distinta de extensión. Estos hooks son para comportamiento de proveedor
que aún se ejecuta en el bucle normal de inferencia de OpenClaw.

`resolveUsageAuth` decide si OpenClaw debe llamar a `fetchUsageSnapshot` o
recurrir a la resolución genérica de credenciales para superficies de uso/estado. Devuelve
`{ token, accountId? }` cuando el proveedor tiene una credencial de uso, devuelve
`{ handled: true }` cuando la autenticación de uso propiedad del proveedor ha gestionado la solicitud y
debe suprimir el fallback genérico de clave de API/OAuth, y devuelve `null` o `undefined`
cuando el proveedor no gestionó la autenticación de uso.

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

Los plugins de proveedor incluidos combinan los hooks anteriores para adaptarse al catálogo,
la autenticación, el razonamiento, la reproducción y las necesidades de uso de cada proveedor. El conjunto autoritativo de hooks reside con
cada plugin en `extensions/`; esta página ilustra las formas en lugar de
reflejar la lista.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI registran `catalog` más
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer los ids de modelos upstream
    antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para encargarse del intercambio de tokens y la integración con `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Las familias compartidas con nombre (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los proveedores opten por una
    política de transcripción mediante `buildReplayPolicy` en lugar de que cada plugin
    vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran solo `catalog` y usan el bucle de inferencia compartido.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` viven dentro de la
    costura pública `api.ts` / `contract-api.ts` del plugin de Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) en lugar de en
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

- `textToSpeech` devuelve el payload normal de salida TTS del núcleo para superficies de archivo/nota de voz.
- Usa la configuración central `messages.tts` y la selección de proveedor.
- Devuelve búfer de audio PCM + frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz propiedad del proveedor o flujos de configuración.
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

- Mantén la política de TTS, el fallback y la entrega de respuestas en el núcleo.
- Usa proveedores de voz para el comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un plugin de proveedor puede ser dueño de
  proveedores de texto, voz, imagen y medios futuros a medida que OpenClaw añade esos
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

- Mantén la orquestación, el fallback, la configuración y el cableado de canales en el núcleo.
- Mantén el comportamiento del proveedor en el plugin de proveedor.
- La expansión aditiva debe seguir tipada: nuevos métodos opcionales, nuevos campos de resultado opcionales, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo es dueño del contrato de capacidad y del helper de runtime
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para los helpers de runtime de comprensión de medios, los plugins pueden llamar:

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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

Para la transcripción de audio, los plugins pueden usar el runtime de comprensión de medios
o el alias STT anterior:

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
- `extractStructuredWithModel(...)` es la costura orientada a plugins para extracción delimitada
  priorizada en imágenes y propiedad del proveedor. Incluye al menos una entrada de imagen;
  las entradas de texto son contexto suplementario.
  los plugins de producto son dueños de sus rutas y esquemas mientras OpenClaw posee el
  límite proveedor/runtime.
- Usa la configuración central de audio de comprensión de medios (`tools.media.audio`) y el orden de fallback de proveedores.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidad.

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
- Para ejecuciones de fallback propiedad del plugin, los operadores deben optar por habilitarlas con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir plugins de confianza a objetivos canónicos específicos `provider/model`, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagentes de plugins no confiables siguen funcionando, pero las solicitudes de sobrescritura se rechazan en lugar de recurrir silenciosamente al fallback.
- Las sesiones de subagente creadas por plugins se etiquetan con el id del plugin creador. El fallback `api.runtime.subagent.deleteSession(...)` puede eliminar solo esas sesiones propias; la eliminación arbitraria de sesiones aún requiere una solicitud de Gateway con alcance de administrador.

Para búsqueda web, los plugins pueden consumir el helper de runtime compartido en lugar de
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

- Mantén la selección de proveedor, la resolución de credenciales y la semántica de solicitudes compartidas en el núcleo.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de función/canal que necesitan comportamiento de búsqueda sin depender del wrapper de herramienta del agente.

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
- `listProviders(...)`: lista los proveedores de generación de imágenes disponibles y sus capacidades.

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

Campos de ruta:

- `path`: ruta bajo el servidor HTTP del Gateway.
- `auth`: obligatorio. Usa `"gateway"` para exigir la autenticación normal del Gateway, o `"plugin"` para la autenticación/verificación de Webhook gestionada por el Plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo Plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta haya gestionado la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y causará un error de carga del Plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de Plugin deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un Plugin no puede reemplazar la ruta de otro Plugin.
- Las rutas superpuestas con niveles de `auth` diferentes se rechazan. Mantén las cadenas de continuación `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente ámbitos de runtime de operador. Son para webhooks/verificación de firmas gestionados por el Plugin, no para llamadas privilegiadas de ayuda del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un ámbito de runtime de solicitud del Gateway, pero ese ámbito es intencionalmente conservador:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los ámbitos de runtime de rutas de Plugin fijados a `operator.write`, incluso si el llamador envía `x-openclaw-scopes`
  - los modos HTTP confiables que portan identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en una entrada privada) respetan `x-openclaw-scopes` solo cuando el encabezado está presente explícitamente
  - si `x-openclaw-scopes` está ausente en esas solicitudes de rutas de Plugin que portan identidad, el ámbito de runtime vuelve a `operator.write`
- Regla práctica: no asumas que una ruta de Plugin autenticada por el Gateway es una superficie de administración implícita. Si tu ruta necesita comportamiento exclusivo de administración, exige un modo de autenticación que porte identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del SDK de Plugin

Usa subrutas estrechas del SDK en lugar del barrel raíz monolítico `openclaw/plugin-sdk`
al crear Plugins nuevos. Subrutas principales:

| Subruta                             | Propósito                                          |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Ayudantes de entrada/compilación de canal          |
| `openclaw/plugin-sdk/core`          | Ayudantes compartidos genéricos y contrato paraguas |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los Plugins de canal eligen entre una familia de límites estrechos: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un contrato `approvalCapability` único en lugar de mezclarse entre campos
de Plugin no relacionados. Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).

Los ayudantes de runtime y configuración viven bajo subrutas `*-runtime` enfocadas
correspondientes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefiere `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation`
en lugar del amplio barrel de compatibilidad `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
las pequeñas fachadas de ayudantes de canal, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
y `openclaw/plugin-sdk/infra-runtime` son shims de compatibilidad obsoletos para
Plugins antiguos. El código nuevo debe importar primitivas genéricas más estrechas.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de Plugin incluido):

- `index.js` — entrada de Plugin incluido
- `api.js` — barrel de ayudantes/tipos
- `runtime-api.js` — barrel solo de runtime
- `setup-entry.js` — entrada de Plugin de configuración

Los Plugins externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes `src/*` del paquete de otro Plugin desde el núcleo ni desde otro Plugin.
Los puntos de entrada cargados por fachada prefieren la instantánea de configuración
de runtime activa cuando existe, y luego recurren al archivo de configuración resuelto
en disco.

Las subrutas específicas de capacidad como `image-generation`, `media-understanding`
y `speech` existen porque los Plugins incluidos las usan hoy. No son contratos
externos congelados automáticamente a largo plazo: consulta la página de referencia
del SDK correspondiente cuando dependas de ellas.

## Esquemas de herramientas de mensaje

Los Plugins deben poseer las contribuciones de esquema `describeMessageTool(...)`
específicas del canal para primitivas que no sean de mensaje, como reacciones, lecturas y encuestas.
La presentación compartida de envío debe usar el contrato genérico `MessagePresentation`
en lugar de campos de botón, componente, bloque o tarjeta nativos del proveedor.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para ver el contrato,
las reglas de fallback, la asignación de proveedores y la lista de verificación del autor de Plugin.

Los Plugins capaces de enviar declaran lo que pueden renderizar mediante capacidades de mensaje:

- `presentation` para bloques de presentación semántica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El núcleo decide si renderizar la presentación de forma nativa o degradarla a texto.
No expongas vías de escape de interfaz nativa del proveedor desde la herramienta de mensaje genérica.
Los ayudantes obsoletos del SDK para esquemas nativos heredados siguen exportándose para Plugins
de terceros existentes, pero los Plugins nuevos no deben usarlos.

## Resolución de destino de canal

Los Plugins de canal deben poseer la semántica de destinos específica del canal. Mantén genérico
el host de salida compartido y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al núcleo si una
  entrada debe pasar directamente a resolución de tipo id en lugar de búsqueda en directorio.
- `messaging.targetResolver.reservedLiterals` lista palabras sueltas que son
  referencias de canal/sesión para ese proveedor. La resolución conserva las entradas
  de directorio configuradas antes de rechazar literales reservados, y luego falla de forma cerrada ante
  un fallo de directorio.
- `messaging.targetResolver.resolveTarget(...)` es el fallback del Plugin cuando
  el núcleo necesita una resolución final propiedad del proveedor después de la normalización o después de un
  fallo de directorio.
- `messaging.resolveOutboundSessionRoute(...)` posee la construcción de ruta de sesión
  específica del proveedor una vez resuelto un destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deben ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de "tratar esto como un id de destino explícito/nativo".
- Usa `resolveTarget` para fallback de normalización específico del proveedor, no para
  búsqueda amplia en directorio.
- Mantén ids nativos del proveedor como ids de chat, ids de hilos, JID, identificadores e ids de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los Plugins que derivan entradas de directorio desde la configuración deben mantener esa lógica en el
Plugin y reutilizar los ayudantes compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Usa esto cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares de DM controlados por lista de permitidos
- mapas configurados de canal/grupo
- fallbacks de directorio estático con ámbito de cuenta

Los ayudantes compartidos en `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- ayudantes de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas específica del canal y la normalización de ids deben permanecer en la
implementación del Plugin.

## Catálogos de proveedores

Los Plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el Plugin posea ids de modelo específicos del proveedor, valores
predeterminados de URL base o metadatos de modelos restringidos por autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un Plugin en relación con los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples impulsados por clave API o env
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en colisión de claves, por lo que los Plugins pueden sobrescribir
intencionalmente una entrada de proveedor integrada con el mismo id de proveedor.

Los Plugins también pueden publicar filas de modelo de solo lectura mediante
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Esta es la ruta futura para superficies de lista/ayuda/selector y admite filas
`text`, `image_generation`, `video_generation` y `music_generation`.
Los Plugins de proveedor siguen poseyendo las llamadas de endpoint en vivo, el intercambio de tokens y la
asignación de respuestas de proveedores; el núcleo posee la forma común de fila, las etiquetas de origen y el
formato de ayuda de herramientas multimedia. Los registros de proveedores de generación multimedia sintetizan filas
de catálogo estático automáticamente a partir de `defaultModel`, `models` y `capabilities`.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado, pero emite una advertencia de obsolescencia
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`
- `augmentModelCatalog` está obsoleto; los proveedores incluidos deben publicar
  filas suplementarias mediante `registerModelCatalogProvider`

## Inspección de canal de solo lectura

Si tu Plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de runtime. Puede asumir que las credenciales
  están completamente materializadas y fallar rápido cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de reparación
  de doctor/config no deberían necesitar materializar credenciales de runtime solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando sea relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores de token sin procesar solo para informar disponibilidad
  de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen correspondiente)
  es suficiente para comandos de estilo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen "configurado pero no disponible en esta ruta
de comando" en lugar de fallar o informar incorrectamente que la cuenta no está configurada.

## Paquetes de paquetes

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

Cada entrada se convierte en un Plugin. Si el paquete lista varias extensiones, el id del Plugin
pasa a ser `name/<fileBase>`.

Si tu Plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Barandilla de seguridad: cada entrada `openclaw.extensions` debe permanecer dentro del directorio del Plugin
después de la resolución de symlinks. Las entradas que escapan del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala las dependencias de Plugin con un
`npm install --omit=dev --ignore-scripts` local del proyecto (sin scripts de ciclo de vida,
sin dependencias de desarrollo en tiempo de ejecución), ignorando la configuración global heredada de instalación de npm.
Mantén los árboles de dependencias de Plugin como "JS/TS puro" y evita paquetes que requieran
compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un Plugin de canal deshabilitado, o
cuando un Plugin de canal está habilitado pero aún no está configurado, carga `setupEntry`
en lugar de la entrada completa del Plugin. Esto hace que el inicio y la configuración sean más ligeros
cuando la entrada principal de tu Plugin también conecta herramientas, hooks u otro código
solo de tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un Plugin de canal use la misma ruta de `setupEntry` durante la fase de inicio
previa a la escucha del Gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el Gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar todas las capacidades propiedad del canal de las que depende el inicio, como:

- el registro del canal en sí
- cualquier ruta HTTP que deba estar disponible antes de que el Gateway empiece a escuchar
- cualquier método, herramienta o servicio del Gateway que deba existir durante esa misma ventana

Si la entrada completa aún es propietaria de alguna capacidad de inicio requerida, no habilites
esta marca. Mantén el Plugin con el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar helpers de superficie de contrato solo de configuración que el núcleo
puede consultar antes de que se cargue el tiempo de ejecución completo del canal. La superficie de promoción de configuración
actual es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración de canal heredada de cuenta única
a `channels.<id>.accounts.*` sin cargar la entrada completa del Plugin.
Matrix es el ejemplo incluido actual: mueve solo claves de autenticación/bootstrap a una
cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede conservar una
clave de cuenta predeterminada no canónica configurada en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parche de configuración mantienen diferido el descubrimiento de la superficie de contrato incluida. El tiempo
de importación se mantiene ligero; la superficie de promoción se carga solo en el primer uso en lugar de
volver a entrar en el inicio del canal incluido al importar el módulo.

Cuando esas superficies de inicio incluyan métodos RPC del Gateway, mantenlos en un
prefijo específico del Plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven
a `operator.admin`, incluso si un Plugin solicita un alcance más restringido.

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

Los Plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` e
indicaciones de instalación mediante `openclaw.install`. Esto mantiene los datos del catálogo del núcleo vacíos.

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

- `detailLabel`: etiqueta secundaria para superficies de catálogo/estado más completas
- `docsLabel`: sobrescribe el texto del enlace de la documentación
- `preferOver`: ids de Plugin/canal de menor prioridad que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto de la superficie de selección
- `markdownCapable`: marca el canal como compatible con markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para las superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados que aún se aceptan por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: habilita el canal para el flujo estándar de quickstart `allowFrom`
- `forceAccountBinding`: requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver destinos de anuncio

OpenClaw también puede fusionar **catálogos de canales externos** (por ejemplo, una exportación de registro MPM).
Coloca un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o más archivos JSON (delimitados por comas/puntos y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados para la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de instalación de proveedores exponen
datos normalizados del origen de instalación junto al bloque `openclaw.install` sin procesar. Los
datos normalizados identifican si la especificación npm es una versión exacta o un
selector flotante, si los metadatos de integridad esperados están presentes y si también hay
una ruta de origen local disponible. Cuando se conoce la identidad del catálogo/paquete, los
datos normalizados advierten si el nombre del paquete npm analizado se desvía de esa identidad.
También advierten cuando `defaultChoice` no es válido o apunta a un origen que
no está disponible, y cuando hay metadatos de integridad npm presentes sin un origen npm
válido. Los consumidores deben tratar `installSource` como un campo opcional aditivo para que
las entradas hechas a mano y los shims de catálogo no tengan que sintetizarlo.
Esto permite que la incorporación y los diagnósticos expliquen el estado del plano de origen sin
importar el runtime del plugin.

Las entradas npm externas oficiales deben preferir un `npmSpec` exacto más
`expectedIntegrity`. Los nombres de paquete sin versión y los dist-tags siguen funcionando por
compatibilidad, pero muestran advertencias del plano de origen para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas por integridad sin romper los plugins existentes.
Cuando la incorporación instala desde una ruta de catálogo local, registra una entrada administrada del índice de
plugins con `source: "path"` y un `sourcePath` relativo al espacio de trabajo
cuando es posible. La ruta de carga operativa absoluta permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas de estaciones de trabajo locales
en la configuración de larga duración. Esto mantiene las instalaciones de desarrollo local visibles para
los diagnósticos del plano de origen sin añadir una segunda superficie de divulgación de rutas de sistema de archivos
sin procesar. La fila SQLite persistida `installed_plugin_index` es la fuente de verdad del origen de instalación
y se puede actualizar sin cargar módulos del runtime del plugin.
Su mapa `installRecords` es duradero incluso cuando falta el manifiesto de un plugin o
no es válido; su carga `plugins` es una vista de manifiesto reconstruible.

## Plugins de motor de contexto

Los plugins de motor de contexto son propietarios de la orquestación del contexto de sesión para ingesta, ensamblaje
y Compaction. Regístralos desde tu plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Usa esto cuando tu plugin necesite reemplazar o ampliar el pipeline de contexto predeterminado,
en lugar de solo añadir búsqueda de memoria o hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
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

La fábrica `ctx` expone valores opcionales `config`, `agentDir` y `workspaceDir`
para la inicialización en tiempo de construcción.

`assemble()` puede devolver `contextProjection` cuando el arnés activo tiene un
hilo de backend persistente. Omítelo para la proyección heredada por turno. Devuelve
`{ mode: "thread_bootstrap", epoch }` cuando el contexto ensamblado deba
inyectarse una vez en un hilo de backend y reutilizarse hasta que cambie la época. Cambia
la época después de que cambie el contexto semántico del motor, por ejemplo después de una
pasada de Compaction propiedad del motor. Los hosts pueden conservar metadatos de llamadas a herramientas, la
forma de entrada y resultados de herramientas redactados en una proyección de arranque de hilo para que los
hilos de backend nuevos conserven la continuidad de herramientas sin copiar cargas sin procesar
que contienen secretos.

Si tu motor **no** es propietario del algoritmo de Compaction, mantén `compact()`
implementado y delégalo explícitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
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

Cuando un plugin necesita un comportamiento que no encaja en la API actual, no eludas
el sistema de plugins con un acceso privado. Añade la capacidad que falta.

Secuencia recomendada:

1. define el contrato del núcleo
   Decide qué comportamiento compartido debe poseer el núcleo: política, fallback, fusión de configuración,
   ciclo de vida, semántica orientada a canales y forma del helper de runtime.
2. añade superficies tipadas de registro/runtime de plugins
   Amplía `OpenClawPluginApi` o `api.runtime` con la superficie tipada de
   capacidad útil más pequeña.
3. conecta el núcleo y los consumidores de canales/funcionalidades
   Los canales y los plugins de funcionalidades deben consumir la nueva capacidad a través del núcleo,
   no importando directamente una implementación de proveedor.
4. registra implementaciones de proveedores
   Luego, los plugins de proveedores registran sus backends contra la capacidad.
5. añade cobertura del contrato
   Añade pruebas para que la propiedad y la forma de registro se mantengan explícitas con el tiempo.

Así es como OpenClaw se mantiene opinado sin quedar codificado rígidamente según la visión del mundo de un
proveedor. Consulta el [Recetario de capacidades](/es/plugins/adding-capabilities)
para ver una lista de comprobación concreta de archivos y un ejemplo desarrollado.

### Lista de comprobación de capacidades

Cuando añades una nueva capacidad, la implementación normalmente debe tocar estas
superficies en conjunto:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- helper runner/runtime del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- cableado del registro de plugins en `src/plugins/registry.ts`
- exposición del runtime de plugins en `src/plugins/runtime/*` cuando los plugins de funcionalidades/canales
  necesitan consumirla
- helpers de captura/prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación de operadores/plugins en `docs/`

Si falta una de esas superficies, normalmente es señal de que la capacidad
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

- core posee el contrato de capacidad + la orquestación
- los plugins de proveedor poseen las implementaciones de proveedor
- los plugins de función/canal consumen helpers de runtime
- las pruebas de contrato mantienen la propiedad explícita

## Relacionado

- [Arquitectura de Plugin](/es/plugins/architecture) — modelo y formas públicas de capacidad
- [Subrutas del Plugin SDK](/es/plugins/sdk-subpaths)
- [Configuración del Plugin SDK](/es/plugins/sdk-setup)
- [Construcción de plugins](/es/plugins/building-plugins)
