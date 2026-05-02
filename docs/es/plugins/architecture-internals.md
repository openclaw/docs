---
read_when:
    - Implementación de hooks de tiempo de ejecución de proveedores, del ciclo de vida de canales o de packs de paquetes
    - Depuración del orden de carga de Plugin o del estado del registro
    - Añadir una nueva capacidad de Plugin o un Plugin de motor de contexto
summary: 'Aspectos internos de la arquitectura de Plugin: canalización de carga, registro, puntos de enganche de tiempo de ejecución, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de Plugin
x-i18n:
    generated_at: "2026-05-02T05:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para el modelo público de capacidades, las formas de plugins y los contratos de
propiedad/ejecución, consulta [Arquitectura de Plugin](/es/plugins/architecture). Esta página es la
referencia para los mecanismos internos: canalización de carga, registro, hooks de tiempo de ejecución,
rutas HTTP del Gateway, rutas de importación y tablas de esquema.

## Canalización de carga

Al iniciar, OpenClaw hace aproximadamente esto:

1. descubre raíces de plugins candidatas
2. lee manifiestos de paquetes nativos o compatibles y metadatos de paquete
3. rechaza candidatos no seguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga los módulos nativos habilitados: los módulos agrupados compilados usan un cargador nativo;
   el código fuente local TypeScript de terceros usa el recurso de emergencia Jiti
7. llama a los hooks nativos `register(api)` y recopila los registros en el registro de plugins
8. expone el registro a comandos/superficies de tiempo de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins agrupados usan `register`; prefiere `register` para plugins nuevos.
</Note>

Las barreras de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean
cuando la entrada escapa de la raíz del plugin, la ruta permite escritura global o la propiedad de la ruta
parece sospechosa para plugins no agrupados.

### Comportamiento basado primero en el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/skills/esquema de configuración declarados o capacidades del paquete
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/marcadores de posición de Control UI
- mostrar metadatos de instalación/catálogo
- conservar descriptores económicos de activación y configuración sin cargar el tiempo de ejecución del plugin

Para plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra
comportamiento real, como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores solo de metadatos para la planificación de activación y el descubrimiento de configuración;
no reemplazan el registro de tiempo de ejecución, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan pistas de comandos, canales y proveedores del manifiesto
para acotar la carga de plugins antes de una materialización más amplia del registro:

- la carga de CLI se acota a los plugins que poseen el comando primario solicitado
- la configuración/resolución de plugin de canal se acota a los plugins que poseen el
  id de canal solicitado
- la configuración/resolución explícita de proveedor en tiempo de ejecución se acota a los plugins que poseen el
  id de proveedor solicitado
- la planificación de inicio del Gateway usa `activation.onStartup` para importaciones explícitas de inicio
  y exclusiones de inicio; los plugins sin metadatos de inicio se cargan solo
  mediante disparadores de activación más acotados

El planificador de activación expone tanto una API solo de ids para llamadores existentes como una
API de plan para nuevos diagnósticos. Las entradas del plan informan por qué se seleccionó un plugin,
separando las pistas explícitas del planificador `activation.*` de la reserva de propiedad del manifiesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks. Esa separación de motivos es el límite de compatibilidad:
los metadatos de plugins existentes siguen funcionando, mientras que el código nuevo puede detectar pistas amplias
o comportamiento de reserva sin cambiar la semántica de carga en tiempo de ejecución.

El descubrimiento de configuración ahora prefiere ids propiedad de descriptores, como `setup.providers` y
`setup.cliBackends`, para acotar plugins candidatos antes de recurrir a
`setup-api` para plugins que aún necesitan hooks de tiempo de ejecución durante la configuración. Las listas de
configuración de proveedores usan `providerAuthChoices` del manifiesto, opciones de configuración derivadas de descriptores
y metadatos del catálogo de instalación sin cargar el tiempo de ejecución del proveedor. El valor explícito
`setup.requiresRuntime: false` es un corte solo de descriptor; si se omite
`requiresRuntime`, se mantiene el respaldo heredado de setup-api por compatibilidad. Si más
de un plugin descubierto declara el mismo proveedor de configuración normalizado o id de backend de CLI,
la búsqueda de configuración rechaza el propietario ambiguo en lugar de depender del
orden de descubrimiento. Cuando el tiempo de ejecución de configuración sí se ejecuta, los diagnósticos del registro informan
desviaciones entre `setup.providers` / `setup.cliBackends` y los proveedores o backends de CLI
registrados por setup-api sin bloquear plugins heredados.

### Límite de caché de plugins

OpenClaw no almacena en caché resultados de descubrimiento de plugins ni datos directos del registro de manifiestos
detrás de ventanas de reloj. Las instalaciones, ediciones de manifiestos y cambios de rutas de carga
deben hacerse visibles en la siguiente lectura explícita de metadatos o reconstrucción de instantánea.
El analizador del archivo de manifiesto puede mantener una caché acotada de firma de archivo basada en la
ruta del manifiesto abierto, inode, tamaño y marcas de tiempo; esa caché solo evita
volver a analizar bytes sin cambios y no debe almacenar en caché respuestas de descubrimiento, registro, propietario o
política.

La ruta rápida segura de metadatos es la propiedad explícita de objetos, no una caché oculta.
Las rutas críticas de inicio del Gateway deben pasar el `PluginMetadataSnapshot` actual, la
`PluginLookUpTable` derivada o un registro de manifiesto explícito a través de la cadena de llamadas.
La validación de configuración, la habilitación automática al inicio, el arranque de plugins y la selección de proveedores
pueden reutilizar esos objetos mientras representen la configuración y el inventario de plugins actuales.
La búsqueda de configuración aún reconstruye los metadatos del manifiesto bajo demanda
salvo que la ruta de configuración específica reciba un registro de manifiesto explícito; mantén eso
como una reserva de ruta fría en lugar de añadir cachés ocultas de búsqueda. Cuando la entrada
cambie, reconstruye y reemplaza la instantánea en lugar de mutarla o conservar
copias históricas.
Las vistas sobre el registro de plugins activo y los ayudantes de arranque de canales agrupados
deben recalcularse desde el registro/raíz actuales. Los mapas de corta duración son aceptables
dentro de una llamada para deduplicar trabajo o proteger la reentrada; no deben convertirse en cachés
de metadatos de proceso.

Para la carga de plugins, la capa de caché persistente es la carga en tiempo de ejecución. Puede reutilizar
estado del cargador cuando el código o los artefactos instalados se cargan realmente, como:

- `PluginLoaderCacheState` y registros de tiempo de ejecución activos compatibles
- cachés de jiti/módulos y cachés de cargador de superficie pública usadas para evitar importar
  la misma superficie de tiempo de ejecución repetidamente
- cachés del sistema de archivos para artefactos de plugins instalados
- mapas de corta duración por llamada para normalización de rutas o resolución de duplicados

Esas cachés son detalles de implementación del plano de datos. No deben responder
preguntas del plano de control como "¿qué plugin posee este proveedor?" salvo que el
llamador haya pedido deliberadamente carga en tiempo de ejecución.

No añadas cachés persistentes o de reloj para:

- resultados de descubrimiento
- registros directos de manifiestos
- registros de manifiestos reconstruidos desde el índice de plugins instalados
- búsqueda de propietario de proveedor, supresión de modelos, política de proveedor o metadatos de artefactos
  públicos
- cualquier otra respuesta derivada del manifiesto donde un manifiesto, índice instalado
  o ruta de carga modificados deban ser visibles en la siguiente lectura de metadatos

Los llamadores que reconstruyen metadatos de manifiesto desde el índice persistente de plugins instalados
reconstruyen ese registro bajo demanda. El índice instalado es estado durable del plano de origen;
no es una caché oculta de metadatos en proceso.

## Modelo de registro

Los plugins cargados no mutan directamente variables globales aleatorias del núcleo. Se registran en un
registro central de plugins.

El registro rastrea:

- registros de plugins (identidad, fuente, origen, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- manejadores RPC del Gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad de plugins

Luego, las funciones del núcleo leen desde ese registro en lugar de hablar con los módulos de plugin
directamente. Esto mantiene la carga unidireccional:

- módulo de plugin -> registro en el registro
- tiempo de ejecución del núcleo -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo
necesitan un punto de integración: "leer el registro", no "tratar de forma especial cada módulo de plugin".

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
- `request`: el resumen de la solicitud original, pista de desvinculación, id del remitente y
  metadatos de conversación

Este callback es solo de notificación. No cambia quién tiene permitido vincular una
conversación, y se ejecuta después de que termina el manejo de aprobación del núcleo.

## Hooks de tiempo de ejecución de proveedores

Los plugins de proveedor tienen tres capas:

- **Metadatos de manifiesto** para búsqueda económica previa al tiempo de ejecución:
  `setup.providers[].envVars`, compatibilidad obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks en tiempo de configuración**: `catalog` (`discovery` heredado) más
  `applyConfigDefaults`.
- **Hooks de tiempo de ejecución**: más de 40 hooks opcionales que cubren autenticación, resolución de modelos,
  envoltura de streams, niveles de pensamiento, política de reproducción y endpoints de uso. Consulta
  la lista completa en [Orden y uso de hooks](#hook-order-and-usage).

OpenClaw aún posee el bucle genérico del agente, la conmutación por error, el manejo de transcripciones y
la política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico de proveedor
sin necesitar un transporte de inferencia completamente personalizado.

Usa `setup.providers[].envVars` del manifiesto cuando el proveedor tenga credenciales basadas en env
que las rutas genéricas de autenticación/estado/selector de modelos deban ver sin
cargar el tiempo de ejecución del plugin. `providerAuthEnvVars`, obsoleto, todavía lo lee el
adaptador de compatibilidad durante la ventana de obsolescencia, y los plugins no agrupados
que lo usan reciben un diagnóstico de manifiesto. Usa `providerAuthAliases` del manifiesto
cuando un id de proveedor deba reutilizar las variables env, perfiles de autenticación,
autenticación respaldada por configuración y opción de incorporación con clave API de otro id de proveedor. Usa
`providerAuthChoices` del manifiesto cuando las superficies de CLI de incorporación/elección de autenticación deban conocer el
id de elección del proveedor, etiquetas de grupo y cableado simple de autenticación de una sola bandera sin
cargar el tiempo de ejecución del proveedor. Mantén
`envVars` del tiempo de ejecución del proveedor para pistas orientadas al operador, como etiquetas de incorporación o variables
de configuración de client-id/client-secret de OAuth.

Usa `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración basada en env que
el respaldo genérico de shell-env, las comprobaciones de configuración/estado o los prompts de configuración deban ver
sin cargar el tiempo de ejecución del canal.

### Orden y uso de hooks

Para plugins de modelo/proveedor, OpenClaw llama a los hooks en este orden aproximado.
La columna "Cuándo usarlo" es la guía rápida de decisión.
Los campos de proveedor solo de compatibilidad que OpenClaw ya no llama, como
`ProviderPlugin.capabilities` y `suppressBuiltInModel`, intencionalmente no se
listan aquí.

| #   | Hook                              | Qué hace                                                                                                       | Cuándo usarlo                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`             | El proveedor posee un catálogo o valores predeterminados de URL base                                                                          |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados de configuración global propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de familia de modelos del proveedor                 |
| --  | _(búsqueda de modelo integrada)_  | OpenClaw prueba primero la ruta normal del registro/catálogo                                                    | _(no es un hook de Plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de id de modelo antes de la búsqueda                                | El proveedor posee la limpieza de alias antes de la resolución canónica del modelo                                                            |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo                | El proveedor posee la limpieza de transporte para ids de proveedor personalizados en la misma familia de transporte                           |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución de runtime/proveedor                                   | El proveedor necesita limpieza de configuración que debe vivir con el Plugin; los helpers agrupados de la familia Google también respaldan entradas de configuración de Google compatibles |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a los proveedores de configuración             | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por endpoint                                            |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación con marcador de entorno para proveedores de configuración antes de cargar la autenticación de runtime | El proveedor tiene resolución de clave API con marcador de entorno propiedad del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcador de entorno AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/autohospedada o respaldada por configuración sin persistir texto plano               | El proveedor puede operar con un marcador de credencial sintético/local                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externa propiedad del proveedor; el `persistence` predeterminado es `runtime-only` para credenciales propiedad de la CLI/app | El proveedor reutiliza credenciales de autenticación externa sin persistir tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Reduce la precedencia de marcadores de posición de perfiles sintéticos almacenados por debajo de autenticación respaldada por entorno/configuración | El proveedor almacena perfiles sintéticos de marcador de posición que no deben ganar precedencia                                             |
| 11  | `resolveDynamicModel`             | Respaldo síncrono para ids de modelo propiedad del proveedor que aún no están en el registro local              | El proveedor acepta ids de modelo ascendentes arbitrarios                                                                                     |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono, luego `resolveDynamicModel` se ejecuta de nuevo                                        | El proveedor necesita metadatos de red antes de resolver ids desconocidos                                                                     |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el runner integrado use el modelo resuelto                                       | El proveedor necesita reescrituras de transporte, pero sigue usando un transporte del core                                                     |
| 14  | `contributeResolvedModelCompat`   | Aporta flags de compatibilidad para modelos de proveedor detrás de otro transporte compatible                   | El proveedor reconoce sus propios modelos en transportes proxy sin tomar control del proveedor                                                |
| 15  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el runner integrado los vea                                     | El proveedor necesita limpieza de esquemas de familia de transporte                                                                           |
| 16  | `inspectToolSchemas`              | Expone diagnósticos de esquemas propiedad del proveedor después de la normalización                             | El proveedor quiere advertencias de palabras clave sin enseñar al core reglas específicas del proveedor                                       |
| 17  | `resolveReasoningOutputMode`      | Selecciona contrato de salida de razonamiento nativo frente a etiquetado                                        | El proveedor necesita razonamiento/salida final etiquetados en lugar de campos nativos                                                        |
| 18  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los wrappers genéricos de opciones de stream                  | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                          |
| 19  | `createStreamFn`                  | Reemplaza por completo la ruta normal de stream con un transporte personalizado                                 | El proveedor necesita un protocolo de cable personalizado, no solo un wrapper                                                                 |
| 20  | `wrapStreamFn`                    | Wrapper de stream después de aplicar wrappers genéricos                                                         | El proveedor necesita wrappers de compatibilidad de headers/cuerpo/modelo de solicitud sin un transporte personalizado                        |
| 21  | `resolveTransportTurnState`       | Adjunta headers o metadatos de transporte nativos por turno                                                     | El proveedor quiere que los transportes genéricos envíen identidad de turno nativa del proveedor                                             |
| 22  | `resolveWebSocketSessionPolicy`   | Adjunta headers nativos de WebSocket o política de enfriamiento de sesión                                       | El proveedor quiere que los transportes WS genéricos ajusten headers de sesión o política de fallback                                        |
| 23  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` de runtime      | El proveedor almacena metadatos de autenticación extra y necesita una forma personalizada de token de runtime                                 |
| 24  | `refreshOAuth`                    | Override de actualización OAuth para endpoints de actualización personalizados o política de fallos de actualización | El proveedor no encaja con los actualizadores compartidos de `pi-ai`                                                                          |
| 25  | `buildAuthDoctorHint`             | Sugerencia de reparación añadida cuando falla la actualización OAuth                                            | El proveedor necesita guía de reparación de autenticación propiedad del proveedor después de un fallo de actualización                        |
| 26  | `matchesContextOverflowError`     | Matcher de desbordamiento de ventana de contexto propiedad del proveedor                                        | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas no detectarían                                        |
| 27  | `classifyFailoverReason`          | Clasificación de motivo de failover propiedad del proveedor                                                     | El proveedor puede mapear errores sin procesar de API/transporte a límite de tasa/sobrecarga/etc.                                            |
| 28  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                    | El proveedor necesita compuertas de TTL de caché específicas de proxy                                                                         |
| 29  | `buildMissingAuthMessage`         | Reemplazo del mensaje genérico de recuperación por autenticación faltante                                       | El proveedor necesita una sugerencia de recuperación por autenticación faltante específica del proveedor                                      |
| 30  | `augmentModelCatalog`             | Filas sintéticas/finales de catálogo añadidas después del descubrimiento                                        | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                                |
| 31  | `resolveThinkingProfile`          | Conjunto de niveles `/think` específicos del modelo, etiquetas de visualización y valor predeterminado          | El proveedor expone una escala de pensamiento personalizada o etiqueta binaria para modelos seleccionados                                     |
| 32  | `isBinaryThinking`                | Hook de compatibilidad de alternancia de razonamiento activado/desactivado                                      | El proveedor expone solo pensamiento binario activado/desactivado                                                                             |
| 33  | `supportsXHighThinking`           | Hook de compatibilidad de soporte de razonamiento `xhigh`                                                       | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                                  |
| 34  | `resolveDefaultThinkingLevel`     | Hook de compatibilidad del nivel `/think` predeterminado                                                        | El proveedor posee la política predeterminada de `/think` para una familia de modelos                                                         |
| 35  | `isModernModelRef`                | Matcher de modelo moderno para filtros de perfil en vivo y selección de smoke                                  | El proveedor posee el matching de modelo preferido en vivo/smoke                                                                              |
| 36  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave de runtime real justo antes de la inferencia          | El proveedor necesita un intercambio de token o credencial de solicitud de corta duración                                                     |
| 37  | `resolveUsageAuth`                | Resolver credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                                     | El proveedor necesita análisis personalizado de tokens de uso/cuota o una credencial de uso diferente                                                               |
| 38  | `fetchUsageSnapshot`              | Obtener y normalizar instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación                             | El proveedor necesita un punto de conexión de uso específico del proveedor o un analizador de carga útil                                                                           |
| 39  | `createEmbeddingProvider`         | Crear un adaptador de incrustaciones propiedad del proveedor para memoria/búsqueda                                                     | El comportamiento de incrustación de memoria pertenece al Plugin del proveedor                                                                                    |
| 40  | `buildReplayPolicy`               | Devolver una política de reproducción que controle el manejo de transcripciones para el proveedor                                        | El proveedor necesita una política de transcripción personalizada (por ejemplo, eliminación de bloques de pensamiento)                                                               |
| 41  | `sanitizeReplayHistory`           | Reescribir el historial de reproducción después de la limpieza genérica de transcripciones                                                        | El proveedor necesita reescrituras de reproducción específicas del proveedor más allá de los asistentes de compaction compartidos                                                             |
| 42  | `validateReplayTurns`             | Validación final de turnos de reproducción o reestructuración antes del ejecutor integrado                                           | El transporte del proveedor necesita una validación de turnos más estricta después de la depuración genérica                                                                    |
| 43  | `onModelSelected`                 | Ejecutar efectos secundarios posteriores a la selección propiedad del proveedor                                                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo se activa                                                                  |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
Plugin proveedor coincidente y luego pasan por otros Plugins proveedores con
capacidad de hooks hasta que uno cambie realmente el id de modelo o el transporte/configuración. Eso mantiene
funcionando los shims de alias/compatibilidad de proveedores sin exigir que el llamador sepa qué
Plugin incluido posee la reescritura. Si ningún hook de proveedor reescribe una entrada
de configuración compatible de la familia Google, el normalizador de configuración de Google incluido sigue aplicando
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable completamente personalizado o un ejecutor de solicitudes personalizado,
eso es una clase diferente de extensión. Estos hooks son para comportamiento de proveedor
que aún se ejecuta en el bucle de inferencia normal de OpenClaw.

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

Los Plugins proveedores incluidos combinan los hooks anteriores para ajustarse al catálogo,
la autenticación, el razonamiento, la reproducción y las necesidades de uso de cada proveedor. El conjunto de hooks autoritativo vive con
cada Plugin en `extensions/`; esta página ilustra las formas en lugar de
reflejar la lista.

<AccordionGroup>
  <Accordion title="Proveedores de catálogo de paso directo">
    OpenRouter, Kilocode, Z.AI, xAI registran `catalog` más
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer ids de modelos
    ascendentes antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Proveedores de OAuth y endpoint de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para encargarse del intercambio de tokens y la integración con `/usage`.
  </Accordion>
  <Accordion title="Familias de reproducción y limpieza de transcripciones">
    Las familias nombradas compartidas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los proveedores opten por una
    política de transcripción mediante `buildReplayPolicy` en lugar de que cada Plugin
    vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Proveedores solo de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran solo `catalog` y usan el bucle de inferencia compartido.
  </Accordion>
  <Accordion title="Helpers de streaming específicos de Anthropic">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` viven dentro del
    seam público `api.ts` / `contract-api.ts` del Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) en lugar de en
    el SDK genérico.
  </Accordion>
</AccordionGroup>

## Helpers de tiempo de ejecución

Los Plugins pueden acceder a helpers centrales seleccionados mediante `api.runtime`. Para TTS:

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

- `textToSpeech` devuelve la carga útil de salida TTS central normal para superficies de archivo/nota de voz.
- Usa la configuración central `messages.tts` y la selección de proveedor.
- Devuelve búfer de audio PCM + tasa de muestreo. Los Plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos, como configuración regional, género y etiquetas de personalidad para selectores conscientes del proveedor.
- OpenAI y ElevenLabs admiten telefonía hoy. Microsoft no.

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

- Mantén la política de TTS, el respaldo y la entrega de respuestas en el núcleo.
- Usa proveedores de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada de Microsoft `edge` se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un Plugin de proveedor puede poseer
  proveedores de texto, voz, imagen y medios futuros a medida que OpenClaw añada esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los Plugins registran un proveedor
de comprensión de medios tipado en lugar de una bolsa genérica clave/valor:

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
- Mantén el comportamiento del proveedor en el Plugin proveedor.
- La expansión aditiva debe permanecer tipada: nuevos métodos opcionales, nuevos campos
  de resultado opcionales, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo posee el contrato de capacidad y el helper de tiempo de ejecución
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
- Usa la configuración central de audio de comprensión de medios (`tools.media.audio`) y el orden de respaldo de proveedores.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidad.

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
- Para ejecuciones de respaldo propiedad del Plugin, los operadores deben optar explícitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir Plugins de confianza a objetivos canónicos `provider/model` específicos, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagente de Plugins no confiables siguen funcionando, pero las solicitudes de anulación se rechazan en lugar de recurrir silenciosamente al respaldo.
- Las sesiones de subagente creadas por Plugins se etiquetan con el id del Plugin creador. El respaldo `api.runtime.subagent.deleteSession(...)` solo puede eliminar esas sesiones poseídas; la eliminación arbitraria de sesiones aún requiere una solicitud de Gateway con alcance de administrador.

Para búsqueda web, los Plugins pueden consumir el helper de tiempo de ejecución compartido en lugar de
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

- Mantén la selección de proveedor, la resolución de credenciales y la semántica compartida de solicitudes en el núcleo.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para Plugins de función/canal que necesitan comportamiento de búsqueda sin depender del wrapper de herramienta de agente.

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

- `generate(...)`: genera una imagen usando la cadena de proveedores de generación de imágenes configurada.
- `listProviders(...)`: lista los proveedores de generación de imágenes disponibles y sus capacidades.

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

Campos de ruta:

- `path`: ruta bajo el servidor HTTP del gateway.
- `auth`: obligatorio. Usa `"gateway"` para requerir autenticación normal de gateway, o `"plugin"` para autenticación/verificación de webhook gestionada por el Plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo Plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta gestionó la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y causará un error de carga de Plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de Plugin deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un Plugin no puede reemplazar la ruta de otro Plugin.
- Las rutas superpuestas con niveles de `auth` diferentes se rechazan. Mantén las cadenas de paso `exact`/`prefix` únicamente en el mismo nivel de auth.
- Las rutas `auth: "plugin"` **no** reciben automáticamente alcances de runtime del operador. Están pensadas para webhooks/verificación de firma gestionados por Plugin, no para llamadas privilegiadas a helpers de Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un alcance de runtime de solicitud de Gateway, pero ese alcance es intencionalmente conservador:
  - la auth de bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los alcances de runtime de rutas de Plugin fijados en `operator.write`, incluso si el llamador envía `x-openclaw-scopes`
  - los modos HTTP confiables con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingreso privado) respetan `x-openclaw-scopes` solo cuando el encabezado está explícitamente presente
  - si `x-openclaw-scopes` no está presente en esas solicitudes de rutas de Plugin con identidad, el alcance de runtime vuelve a `operator.write`
- Regla práctica: no asumas que una ruta de Plugin con auth de Gateway es una superficie de administración implícita. Si tu ruta necesita comportamiento solo de administrador, exige un modo de auth con identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del SDK de Plugin

Usa subrutas estrechas del SDK en lugar del barrel raíz monolítico `openclaw/plugin-sdk`
al crear nuevos Plugins. Subrutas principales:

| Subruta                             | Propósito                                          |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/compilación de canal            |
| `openclaw/plugin-sdk/core`          | Helpers compartidos genéricos y contrato paraguas  |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los Plugins de canal eligen entre una familia de contratos estrechos — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un único contrato `approvalCapability` en lugar de mezclarse entre campos de
Plugin no relacionados. Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).

Los helpers de runtime y configuración viven bajo subrutas enfocadas `*-runtime`
correspondientes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefiere `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation`
en lugar del barrel amplio de compatibilidad `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
y `openclaw/plugin-sdk/infra-runtime` son shims de compatibilidad obsoletos para
Plugins antiguos. El código nuevo debe importar primitivas genéricas más estrechas.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de Plugin incluido):

- `index.js` — entrada de Plugin incluido
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel solo de runtime
- `setup-entry.js` — entrada de Plugin de configuración

Los Plugins externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes `src/*` del paquete de otro Plugin desde core ni desde otro Plugin.
Los puntos de entrada cargados mediante fachada prefieren la instantánea activa
de configuración de runtime cuando existe, y luego vuelven al archivo de
configuración resuelto en disco.

Existen subrutas específicas de capacidad como `image-generation`, `media-understanding`
y `speech` porque los Plugins incluidos las usan hoy. No son contratos externos
congelados automáticamente a largo plazo: consulta la página de referencia del SDK
correspondiente cuando dependas de ellas.

## Esquemas de herramientas de mensajes

Los Plugins deben ser dueños de las contribuciones de esquema `describeMessageTool(...)`
específicas del canal para primitivas que no son mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envío debe usar el contrato genérico `MessagePresentation`
en lugar de campos nativos del proveedor para botones, componentes, bloques o tarjetas.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para el contrato,
las reglas de fallback, el mapeo de proveedores y la lista de verificación para autores de Plugin.

Los Plugins capaces de enviar declaran qué pueden renderizar mediante capacidades de mensaje:

- `presentation` para bloques de presentación semántica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

Core decide si renderizar la presentación de forma nativa o degradarla a texto.
No expongas escapes de UI nativos del proveedor desde la herramienta de mensajes genérica.
Los helpers del SDK obsoletos para esquemas nativos heredados siguen exportándose para
Plugins de terceros existentes, pero los Plugins nuevos no deben usarlos.

## Resolución de destinos de canal

Los Plugins de canal deben ser dueños de la semántica de destinos específica del canal. Mantén el host
saliente compartido como genérico y usa la superficie del adaptador de mensajería para reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica a core si una
  entrada debe saltar directamente a resolución similar a id en lugar de búsqueda en directorio.
- `messaging.targetResolver.resolveTarget(...)` es el fallback del Plugin cuando
  core necesita una resolución final propiedad del proveedor después de la normalización o después de un
  fallo de directorio.
- `messaging.resolveOutboundSessionRoute(...)` es dueño de la construcción de rutas
  de sesión específica del proveedor una vez resuelto un destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deben ocurrir antes de
  buscar peers/grupos.
- Usa `looksLikeId` para comprobaciones de "tratar esto como un id de destino explícito/nativo".
- Usa `resolveTarget` para fallback de normalización específico del proveedor, no para
  búsqueda amplia en directorio.
- Mantén ids nativos del proveedor como ids de chat, ids de hilo, JIDs, handles e ids de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los Plugins que derivan entradas de directorio desde la configuración deben mantener esa lógica en el
Plugin y reutilizar los helpers compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Usa esto cuando un canal necesite peers/grupos respaldados por configuración, como:

- peers de DM controlados por lista de permitidos
- mapas de canales/grupos configurados
- fallbacks de directorio estático con alcance de cuenta

Los helpers compartidos en `directory-runtime` solo manejan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- helpers de deduplicación/normalización
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

Usa `catalog` cuando el Plugin sea dueño de ids de modelo específicos del proveedor, valores
predeterminados de URL base o metadatos de modelo protegidos por auth.

`catalog.order` controla cuándo se fusiona el catálogo de un Plugin en relación con los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples basados en clave de API o env
- `profile`: proveedores que aparecen cuando existen perfiles de auth
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en colisiones de clave, por lo que los Plugins pueden sobrescribir
intencionalmente una entrada de proveedor integrada con el mismo id de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`

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

- Devuelve solo estado descriptivo de cuenta.
- Preserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando sea relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores de token sin procesar solo para informar disponibilidad
  de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen
  correspondiente) es suficiente para comandos de tipo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen "configurado pero no disponible en esta ruta
de comando" en lugar de fallar o informar erróneamente que la cuenta no está configurada.

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

Si tu Plugin importa deps de npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Límite de seguridad: cada entrada de `openclaw.extensions` debe permanecer dentro del directorio
del Plugin después de la resolución de symlinks. Las entradas que escapan del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias de Plugin con un
`npm install --omit=dev --ignore-scripts` local del proyecto (sin scripts de ciclo de vida,
sin dependencias de desarrollo en runtime), ignorando ajustes globales heredados de instalación de npm.
Mantén los árboles de dependencias de Plugin como "JS/TS puro" y evita paquetes que requieran
compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un Plugin de canal deshabilitado, o
cuando un Plugin de canal está habilitado pero aún sin configurar, carga `setupEntry`
en lugar de la entrada completa del Plugin. Esto hace que el inicio y la configuración sean más ligeros
cuando la entrada principal de tu Plugin también conecta herramientas, hooks u otro código
solo de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede optar a que un Plugin de canal use la misma ruta `setupEntry` durante la fase
de inicio previa a escuchar del gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar cada capacidad propiedad del canal de la que depende el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway empiece a escuchar
- cualquier método, herramienta o servicio de gateway que deba existir durante esa misma ventana

Si tu entrada completa todavía es dueña de alguna capacidad de inicio requerida, no habilites
esta marca. Mantén el Plugin en el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar helpers de superficie de contrato solo de configuración que core
puede consultar antes de que se cargue el runtime completo del canal. La superficie actual de promoción
de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración de canal
heredada de una sola cuenta a `channels.<id>.accounts.*` sin cargar la entrada
completa del plugin. Matrix es el ejemplo incluido actual: mueve solo claves de
autenticación/arranque a una cuenta promovida con nombre cuando ya existen
cuentas con nombre, y puede conservar una clave de cuenta predeterminada
configurada no canónica en lugar de crear siempre `accounts.default`.

Esos adaptadores de parches de configuración mantienen diferido el
descubrimiento de la superficie de contrato incluida. El tiempo de importación
se mantiene ligero; la superficie de promoción se carga solo en el primer uso en
lugar de volver a entrar en el inicio del canal incluido al importar el módulo.

Cuando esas superficies de inicio incluyan métodos RPC de Gateway, mantenlos en
un prefijo específico del plugin. Los espacios de nombres administrativos del
núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecen
reservados y siempre se resuelven como `operator.admin`, incluso si un plugin
solicita un ámbito más estrecho.

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

Los plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` e
indicaciones de instalación mediante `openclaw.install`. Esto mantiene el catálogo del núcleo libre de datos.

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
- `docsLabel`: sobrescribe el texto del enlace de documentación
- `preferOver`: ids de plugins/canales de menor prioridad que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto de la superficie de selección
- `markdownCapable`: marca el canal como compatible con markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal en superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal en selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados que aún se aceptan por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: incorpora el canal al flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver destinos de anuncio

OpenClaw también puede fusionar **catálogos de canales externos** (por ejemplo, una exportación de registro MPM). Coloca un archivo JSON en uno de estos lugares:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o más archivos JSON (delimitados por coma/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados de la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de instalación de proveedores exponen
datos normalizados de origen de instalación junto al bloque `openclaw.install` sin procesar. Los
datos normalizados identifican si la especificación npm es una versión exacta o un selector
flotante, si los metadatos de integridad esperados están presentes y si también hay disponible una ruta de
origen local. Cuando se conoce la identidad del catálogo/paquete, los datos
normalizados advierten si el nombre del paquete npm analizado se desvía de esa identidad.
También advierten cuando `defaultChoice` no es válido o apunta a un origen que
no está disponible, y cuando los metadatos de integridad de npm están presentes sin un origen npm
válido. Los consumidores deben tratar `installSource` como un campo opcional aditivo para que
las entradas creadas manualmente y los adaptadores de catálogo no tengan que sintetizarlo.
Esto permite que la incorporación y los diagnósticos expliquen el estado del plano de origen sin
importar el runtime del plugin.

Las entradas npm externas oficiales deben preferir un `npmSpec` exacto más
`expectedIntegrity`. Los nombres de paquete simples y las dist-tags siguen funcionando por
compatibilidad, pero muestran advertencias del plano de origen para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas por integridad sin romper plugins existentes.
Cuando la incorporación instala desde una ruta de catálogo local, registra una entrada administrada de índice de
plugins con `source: "path"` y un `sourcePath` relativo al espacio de trabajo
cuando sea posible. La ruta absoluta de carga operativa permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas de estaciones de trabajo locales
en la configuración de larga duración. Esto mantiene visibles las instalaciones de desarrollo local para
diagnósticos del plano de origen sin agregar una segunda superficie de divulgación de rutas del sistema de archivos
sin procesar. El índice de plugins persistido `plugins/installs.json` es la fuente de verdad de instalación
y se puede actualizar sin cargar módulos de runtime de plugins.
Su mapa `installRecords` es duradero incluso cuando falta un manifiesto de plugin o
no es válido; su arreglo `plugins` es una vista reconstruible de manifiestos.

## Plugins de motor de contexto

Los plugins de motor de contexto poseen la orquestación del contexto de sesión para ingesta, ensamblado
y Compaction. Regístralos desde tu plugin con
`api.registerContextEngine(id, factory)`, luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Usa esto cuando tu plugin necesite reemplazar o extender la canalización de contexto
predeterminada en lugar de solo agregar búsqueda de memoria o hooks.

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

El `ctx` de fábrica expone valores opcionales `config`, `agentDir` y `workspaceDir`
para la inicialización en tiempo de construcción.

Si tu motor **no** posee el algoritmo de Compaction, mantén `compact()`
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

## Agregar una nueva capacidad

Cuando un plugin necesite un comportamiento que no encaja en la API actual, no eludas
el sistema de plugins con un acceso privado interno. Agrega la capacidad faltante.

Secuencia recomendada:

1. define el contrato del núcleo
   Decide qué comportamiento compartido debe poseer el núcleo: política, respaldo, fusión de configuración,
   ciclo de vida, semántica orientada a canales y forma del helper de runtime.
2. agrega superficies tipadas de registro/runtime de plugins
   Extiende `OpenClawPluginApi` o `api.runtime` con la superficie de capacidad tipada
   más pequeña que resulte útil.
3. conecta consumidores del núcleo + canal/función
   Los canales y plugins de función deben consumir la nueva capacidad a través del núcleo,
   no importando directamente una implementación de proveedor.
4. registra implementaciones de proveedores
   Luego los plugins de proveedor registran sus backends contra la capacidad.
5. agrega cobertura de contrato
   Agrega pruebas para que la propiedad y la forma de registro se mantengan explícitas con el tiempo.

Así es como OpenClaw se mantiene opinado sin quedar codificado de forma rígida a la visión del mundo de un
proveedor. Consulta el [recetario de capacidades](/es/plugins/architecture)
para una lista de verificación concreta de archivos y un ejemplo desarrollado.

### Lista de verificación de capacidades

Cuando agregas una nueva capacidad, la implementación normalmente debería tocar estas
superficies juntas:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- helper de ejecutor/runtime del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de API de plugins en `src/plugins/types.ts`
- conexión del registro de plugins en `src/plugins/registry.ts`
- exposición de runtime de plugins en `src/plugins/runtime/*` cuando los plugins de función/canal
  necesiten consumirla
- helpers de captura/prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación de operador/plugin en `docs/`

Si falta una de esas superficies, eso suele ser señal de que la capacidad
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

- el núcleo posee el contrato de capacidad + la orquestación
- los plugins de proveedor poseen las implementaciones de proveedor
- los plugins de función/canal consumen helpers de runtime
- las pruebas de contrato mantienen la propiedad explícita

## Relacionado

- [Arquitectura de plugins](/es/plugins/architecture) — modelo y formas públicas de capacidades
- [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
