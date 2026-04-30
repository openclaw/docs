---
read_when:
    - Implementación de ganchos de tiempo de ejecución de proveedores, ciclo de vida de canales o conjuntos de paquetes
    - Depuración del orden de carga de plugins o del estado del registro
    - Añadir una nueva capacidad de Plugin o un Plugin de motor de contexto
summary: 'Aspectos internos de la arquitectura de Plugin: canalización de carga, registro, hooks de runtime, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de Plugin
x-i18n:
    generated_at: "2026-04-30T05:51:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para el modelo público de capacidades, las formas de plugin y los contratos de propiedad/ejecución, consulta [Arquitectura de Plugin](/es/plugins/architecture). Esta página es la referencia para la mecánica interna: canalización de carga, registro, hooks de tiempo de ejecución, rutas HTTP del Gateway, rutas de importación y tablas de esquemas.

## Canalización de carga

Al iniciar, OpenClaw hace aproximadamente esto:

1. descubre raíces de plugins candidatas
2. lee manifiestos de paquetes nativos o compatibles y metadatos de paquete
3. rechaza candidatos no seguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga módulos nativos habilitados: los módulos incluidos compilados usan un cargador nativo;
   los plugins nativos sin compilar usan jiti
7. llama a los hooks nativos `register(api)` y recopila los registros en el registro de plugins
8. expone el registro a comandos/superficies de tiempo de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins incluidos usan `register`; prefiere `register` para nuevos plugins.
</Note>

Las barreras de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean cuando la entrada escapa de la raíz del plugin, la ruta es escribible por todo el mundo o la propiedad de la ruta parece sospechosa para plugins no incluidos.

### Comportamiento basado primero en el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del paquete
- validar `plugins.entries.<id>.config`
- aumentar etiquetas/marcadores de posición de la Control UI
- mostrar metadatos de instalación/catálogo
- conservar descriptores baratos de activación y configuración sin cargar el tiempo de ejecución del plugin

Para plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra comportamiento real como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control. Son descriptores solo de metadatos para la planificación de activación y el descubrimiento de configuración; no reemplazan el registro en tiempo de ejecución, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan indicios de comandos, canales y proveedores del manifiesto para acotar la carga de plugins antes de una materialización más amplia del registro:

- la carga de CLI se acota a los plugins que poseen el comando principal solicitado
- la resolución de configuración/plugin de canal se acota a los plugins que poseen el id de canal solicitado
- la resolución explícita de configuración/tiempo de ejecución de proveedor se acota a los plugins que poseen el id de proveedor solicitado
- la planificación de inicio del Gateway usa `activation.onStartup` para importaciones explícitas de inicio y exclusiones de inicio; cada plugin debería declararlo mientras OpenClaw se aleja de importaciones implícitas al inicio, mientras que los plugins sin metadatos estáticos de capacidad y sin `activation.onStartup` todavía usan la alternativa secundaria implícita de inicio obsoleta por compatibilidad

El planificador de activación expone tanto una API solo de ids para llamadores existentes como una API de plan para diagnósticos nuevos. Las entradas del plan informan por qué se seleccionó un plugin, separando indicios explícitos del planificador `activation.*` de la propiedad del manifiesto usada como alternativa, como `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` y hooks. Esa separación de motivos es el límite de compatibilidad: los metadatos existentes de plugins siguen funcionando, mientras que el código nuevo puede detectar indicios amplios o comportamiento alternativo sin cambiar la semántica de carga en tiempo de ejecución.

El descubrimiento de configuración ahora prefiere ids propiedad del descriptor como `setup.providers` y `setup.cliBackends` para acotar plugins candidatos antes de recurrir a `setup-api` para plugins que todavía necesitan hooks de tiempo de ejecución durante la configuración. Las listas de configuración de proveedores usan `providerAuthChoices` del manifiesto, opciones de configuración derivadas del descriptor y metadatos del catálogo de instalación sin cargar el tiempo de ejecución del proveedor. `setup.requiresRuntime: false` explícito es un corte solo de descriptor; `requiresRuntime` omitido mantiene la alternativa heredada `setup-api` por compatibilidad. Si más de un plugin descubierto reclama el mismo id normalizado de proveedor de configuración o backend de CLI, la búsqueda de configuración rechaza el propietario ambiguo en lugar de depender del orden de descubrimiento. Cuando el tiempo de ejecución de configuración sí se ejecuta, los diagnósticos del registro informan desviación entre `setup.providers` / `setup.cliBackends` y los proveedores o backends de CLI registrados por setup-api sin bloquear plugins heredados.

### Límite de caché de plugins

OpenClaw no almacena en caché resultados de descubrimiento de plugins ni datos directos del registro de manifiestos tras ventanas de reloj. Las instalaciones, ediciones de manifiestos y cambios de rutas de carga deben hacerse visibles en la siguiente lectura explícita de metadatos o reconstrucción de instantánea. El analizador de archivos de manifiesto puede mantener una caché acotada de firmas de archivo indexada por la ruta de manifiesto abierta, inode, tamaño y marcas de tiempo; esa caché solo evita volver a analizar bytes sin cambios y no debe almacenar en caché respuestas de descubrimiento, registro, propietario o política.

La ruta rápida segura de metadatos es la propiedad explícita de objetos, no una caché oculta. Las rutas críticas de inicio del Gateway deberían pasar el `PluginMetadataSnapshot` actual, la `PluginLookUpTable` derivada o un registro de manifiestos explícito a través de la cadena de llamadas. La validación de configuración, la habilitación automática al inicio, el arranque de plugins y la selección de proveedores pueden reutilizar esos objetos mientras representen la configuración y el inventario de plugins actuales. La búsqueda de configuración todavía reconstruye metadatos de manifiesto bajo demanda salvo que la ruta de configuración específica reciba un registro de manifiestos explícito; mantenlo como alternativa de ruta fría en lugar de añadir cachés ocultas de búsqueda. Cuando la entrada cambie, reconstruye y reemplaza la instantánea en lugar de mutarla o conservar copias históricas.
Las vistas sobre el registro activo de plugins y los helpers de arranque de canales incluidos deberían recalcularse desde el registro/raíz actuales. Los mapas de corta vida están bien dentro de una llamada para deduplicar trabajo o proteger reentradas; no deben convertirse en cachés de metadatos de proceso.

Para la carga de plugins, la capa persistente de caché es la carga en tiempo de ejecución. Puede reutilizar estado del cargador cuando el código o los artefactos instalados realmente se cargan, como:

- `PluginLoaderCacheState` y registros activos de tiempo de ejecución compatibles
- cachés de jiti/módulos y cachés de cargadores de superficies públicas usadas para evitar importar repetidamente la misma superficie de tiempo de ejecución
- espejos de dependencias de tiempo de ejecución y cachés del sistema de archivos para artefactos de plugins instalados
- mapas por llamada de corta vida para normalización de rutas o resolución de duplicados

Esas cachés son detalles de implementación del plano de datos. No deben responder preguntas del plano de control como "¿qué plugin posee este proveedor?" salvo que el llamador haya solicitado deliberadamente la carga en tiempo de ejecución.

No añadas cachés persistentes ni basadas en reloj para:

- resultados de descubrimiento
- registros directos de manifiestos
- registros de manifiestos reconstruidos desde el índice de plugins instalados
- búsqueda de propietario de proveedor, supresión de modelos, política de proveedor o metadatos de artefactos públicos
- cualquier otra respuesta derivada del manifiesto donde un manifiesto cambiado, índice instalado o ruta de carga debería ser visible en la siguiente lectura de metadatos

Los llamadores que reconstruyen metadatos de manifiesto desde el índice persistido de plugins instalados reconstruyen ese registro bajo demanda. El índice instalado es estado durable del plano fuente; no es una caché oculta de metadatos dentro del proceso.

## Modelo de registro

Los plugins cargados no mutan directamente globals aleatorios del núcleo. Se registran en un registro central de plugins.

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

Luego, las funcionalidades del núcleo leen desde ese registro en lugar de hablar directamente con módulos de plugins. Esto mantiene la carga en una sola dirección:

- módulo de plugin -> registro en el registro
- tiempo de ejecución del núcleo -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de superficies del núcleo solo necesitan un punto de integración: "leer el registro", no "tratar de forma especial cada módulo de plugin".

## Callbacks de vinculación de conversación

Los plugins que vinculan una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de vinculación sea aprobada o denegada:

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
- `binding`: la vinculación resuelta para solicitudes aprobadas
- `request`: el resumen de la solicitud original, indicio de desvinculación, id del remitente y metadatos de conversación

Este callback es solo de notificación. No cambia quién tiene permitido vincular una conversación y se ejecuta después de que termina el manejo de aprobación del núcleo.

## Hooks de tiempo de ejecución de proveedores

Los plugins de proveedor tienen tres capas:

- **Metadatos de manifiesto** para búsqueda barata previa al tiempo de ejecución:
  `setup.providers[].envVars`, compatibilidad obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks en tiempo de configuración**: `catalog` (`discovery` heredado) más
  `applyConfigDefaults`.
- **Hooks de tiempo de ejecución**: más de 40 hooks opcionales que cubren autenticación, resolución de modelos,
  envoltura de stream, niveles de pensamiento, política de replay y endpoints de uso. Consulta
  la lista completa en [Orden y uso de hooks](#hook-order-and-usage).

OpenClaw sigue siendo dueño del bucle genérico de agente, la conmutación por error, el manejo de transcripciones y la política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico de proveedor sin necesitar un transporte de inferencia completamente personalizado.

Usa `setup.providers[].envVars` del manifiesto cuando el proveedor tenga credenciales basadas en env que las rutas genéricas de autenticación/estado/selector de modelos deberían ver sin cargar el tiempo de ejecución del plugin. `providerAuthEnvVars` obsoleto todavía lo lee el adaptador de compatibilidad durante la ventana de obsolescencia, y los plugins no incluidos que lo usan reciben un diagnóstico de manifiesto. Usa `providerAuthAliases` del manifiesto cuando un id de proveedor debería reutilizar las variables de entorno, perfiles de autenticación, autenticación respaldada por configuración y opción de incorporación de clave de API de otro id de proveedor. Usa `providerAuthChoices` del manifiesto cuando las superficies de CLI de incorporación/elección de autenticación deberían conocer el id de elección del proveedor, las etiquetas de grupo y el cableado simple de autenticación con una sola bandera sin cargar el tiempo de ejecución del proveedor. Conserva `envVars` de tiempo de ejecución de proveedor para indicios orientados al operador, como etiquetas de incorporación o variables de configuración de OAuth client-id/client-secret.

Usa `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración impulsada por env que la alternativa genérica de shell-env, las comprobaciones de configuración/estado o los prompts de configuración deberían ver sin cargar el tiempo de ejecución del canal.

### Orden y uso de hooks

Para plugins de modelo/proveedor, OpenClaw llama a los hooks en este orden aproximado.
La columna "Cuándo usar" es la guía rápida de decisión.
Los campos de proveedor solo de compatibilidad que OpenClaw ya no llama, como `ProviderPlugin.capabilities` y `suppressBuiltInModel`, intencionalmente no se enumeran aquí.

| #   | Punto de extensión                | Qué hace                                                                                                      | Cuándo usarlo                                                                                                                                 |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`           | El proveedor posee un catálogo o valores predeterminados de URL base                                                                          |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados de configuración global propios del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de familia de modelos del proveedor                  |
| --  | _(búsqueda de modelos integrada)_ | OpenClaw prueba primero la ruta normal de registro/catálogo                                                   | _(no es un punto de extensión de Plugin)_                                                                                                     |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de id. de modelo antes de la búsqueda                             | El proveedor posee la limpieza de alias antes de la resolución canónica del modelo                                                            |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo              | El proveedor posee la limpieza de transporte para ids. de proveedores personalizados en la misma familia de transporte                         |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución de entorno de ejecución/proveedor                    | El proveedor necesita limpieza de configuración que debe vivir con el Plugin; los ayudantes agrupados de la familia Google también respaldan entradas de configuración de Google admitidas |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a proveedores de configuración               | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por endpoint                                            |
| 7   | `resolveConfigApiKey`             | Resuelve la autenticación con marcador de entorno para proveedores de configuración antes de cargar la autenticación de entorno de ejecución | El proveedor tiene resolución de clave API con marcador de entorno propia del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcadores de entorno de AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/autohospedada o respaldada por configuración sin persistir texto sin formato       | El proveedor puede operar con un marcador de credencial sintética/local                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externa propios del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales propiedad de la CLI/app | El proveedor reutiliza credenciales de autenticación externa sin persistir tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Reduce la precedencia de los marcadores de posición de perfiles sintéticos almacenados frente a la autenticación respaldada por entorno/configuración | El proveedor almacena perfiles de marcador de posición sintéticos que no deben ganar precedencia                                             |
| 11  | `resolveDynamicModel`             | Respaldo síncrono para ids. de modelo propios del proveedor que aún no están en el registro local             | El proveedor acepta ids. arbitrarios de modelos upstream                                                                                      |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` se ejecuta otra vez                                      | El proveedor necesita metadatos de red antes de resolver ids. desconocidos                                                                    |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor incrustado use el modelo resuelto                                  | El proveedor necesita reescrituras de transporte, pero aún usa un transporte central                                                          |
| 14  | `contributeResolvedModelCompat`   | Aporta flags de compatibilidad para modelos de proveedor detrás de otro transporte compatible                 | El proveedor reconoce sus propios modelos en transportes proxy sin asumir el control del proveedor                                            |
| 15  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el ejecutor incrustado los vea                                | El proveedor necesita limpieza de esquemas de familia de transporte                                                                           |
| 16  | `inspectToolSchemas`              | Expone diagnósticos de esquemas propios del proveedor después de la normalización                             | El proveedor quiere advertencias de palabras clave sin enseñar al núcleo reglas específicas del proveedor                                     |
| 17  | `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo frente al etiquetado                                  | El proveedor necesita razonamiento/salida final etiquetados en lugar de campos nativos                                                        |
| 18  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de envoltorios genéricos de opciones de stream                 | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                          |
| 19  | `createStreamFn`                  | Reemplaza por completo la ruta normal de stream con un transporte personalizado                               | El proveedor necesita un protocolo de cable personalizado, no solo un envoltorio                                                              |
| 20  | `wrapStreamFn`                    | Envoltorio de stream después de aplicar los envoltorios genéricos                                             | El proveedor necesita envoltorios de compatibilidad para encabezados/cuerpo/modelo de solicitud sin un transporte personalizado               |
| 21  | `resolveTransportTurnState`       | Adjunta encabezados o metadatos de transporte nativos por turno                                               | El proveedor quiere que los transportes genéricos envíen identidad de turno nativa del proveedor                                              |
| 22  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados WebSocket nativos o política de enfriamiento de sesión                                    | El proveedor quiere que los transportes WS genéricos ajusten encabezados de sesión o política de respaldo                                     |
| 23  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` de entorno de ejecución | El proveedor almacena metadatos de autenticación adicionales y necesita una forma de token de entorno de ejecución personalizada              |
| 24  | `refreshOAuth`                    | Sustitución de actualización OAuth para endpoints de actualización personalizados o política de fallo de actualización | El proveedor no encaja con los actualizadores compartidos de `pi-ai`                                                                          |
| 25  | `buildAuthDoctorHint`             | Sugerencia de reparación anexada cuando falla la actualización OAuth                                          | El proveedor necesita orientación de reparación de autenticación propia del proveedor después de un fallo de actualización                    |
| 26  | `matchesContextOverflowError`     | Coincidente de desbordamiento de ventana de contexto propio del proveedor                                     | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas pasarían por alto                                     |
| 27  | `classifyFailoverReason`          | Clasificación de motivo de conmutación por error propia del proveedor                                         | El proveedor puede asignar errores sin procesar de API/transporte a límite de tasa/sobrecarga/etc.                                           |
| 28  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                  | El proveedor necesita control de TTL de caché específico de proxy                                                                             |
| 29  | `buildMissingAuthMessage`         | Reemplazo para el mensaje genérico de recuperación de autenticación faltante                                  | El proveedor necesita una sugerencia de recuperación de autenticación faltante específica del proveedor                                       |
| 30  | `augmentModelCatalog`             | Filas de catálogo sintéticas/finales anexadas después del descubrimiento                                      | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                                |
| 31  | `resolveThinkingProfile`          | Conjunto de niveles `/think` específico del modelo, etiquetas de visualización y valor predeterminado         | El proveedor expone una escala de pensamiento personalizada o una etiqueta binaria para modelos seleccionados                                 |
| 32  | `isBinaryThinking`                | Punto de extensión de compatibilidad de conmutador de razonamiento activado/desactivado                       | El proveedor expone solo pensamiento binario activado/desactivado                                                                             |
| 33  | `supportsXHighThinking`           | Punto de extensión de compatibilidad de soporte de razonamiento `xhigh`                                       | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                                 |
| 34  | `resolveDefaultThinkingLevel`     | Punto de extensión de compatibilidad de nivel `/think` predeterminado                                         | El proveedor posee la política predeterminada de `/think` para una familia de modelos                                                         |
| 35  | `isModernModelRef`                | Coincidente de modelo moderno para filtros de perfil en vivo y selección de smoke                             | El proveedor posee la coincidencia de modelo preferido en vivo/smoke                                                                          |
| 36  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave de entorno de ejecución real justo antes de la inferencia | El proveedor necesita un intercambio de tokens o una credencial de solicitud de corta duración                                                |
| 37  | `resolveUsageAuth`                | Resolver credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                                     | El proveedor necesita análisis personalizado de tokens de uso/cuota o una credencial de uso diferente                                                               |
| 38  | `fetchUsageSnapshot`              | Obtener y normalizar instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación                             | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de carga útil                                                                           |
| 39  | `createEmbeddingProvider`         | Construir un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                                                     | El comportamiento de embeddings de memoria pertenece al Plugin del proveedor                                                                                    |
| 40  | `buildReplayPolicy`               | Devolver una política de reproducción que controla el manejo de la transcripción para el proveedor                                        | El proveedor necesita una política de transcripción personalizada (por ejemplo, eliminación de bloques de pensamiento)                                                               |
| 41  | `sanitizeReplayHistory`           | Reescribir el historial de reproducción después de la limpieza genérica de la transcripción                                                        | El proveedor necesita reescrituras de reproducción específicas del proveedor más allá de los ayudantes de Compaction compartidos                                                             |
| 42  | `validateReplayTurns`             | Validación final de turnos de reproducción o reformateo antes del ejecutor integrado                                           | El transporte del proveedor necesita una validación de turnos más estricta después del saneamiento genérico                                                                    |
| 43  | `onModelSelected`                 | Ejecutar efectos secundarios posteriores a la selección propiedad del proveedor                                                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo se activa                                                                  |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero revisan el
plugin de proveedor coincidente, luego pasan por otros plugins de proveedor con
hooks disponibles hasta que uno realmente cambie el id del modelo o el transporte/configuración. Eso mantiene
funcionando los shims de proveedor de alias/compatibilidad sin exigir que el llamador sepa qué
plugin incluido posee la reescritura. Si ningún hook de proveedor reescribe una entrada de configuración
compatible de la familia Google, el normalizador de configuración de Google incluido aún aplica
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable completamente personalizado o un ejecutor de solicitudes personalizado,
esa es una clase de extensión diferente. Estos hooks son para comportamiento de proveedor
que aún se ejecuta en el ciclo normal de inferencia de OpenClaw.

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
la autenticación, el razonamiento, la reproducción y las necesidades de uso de cada proveedor. El conjunto autorizado de hooks vive con
cada plugin bajo `extensions/`; esta página ilustra las formas en lugar de
reflejar la lista.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI registran `catalog` junto con
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer los ids de modelos
    ascendentes antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para encargarse del intercambio de tokens y la integración con `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Las familias con nombre compartidas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los proveedores adopten
    la política de transcripción mediante `buildReplayPolicy` en lugar de que cada plugin
    vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran solo `catalog` y usan el ciclo de inferencia compartido.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` viven dentro de la
    frontera pública `api.ts` / `contract-api.ts` del plugin de Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) en lugar de en
    el SDK genérico.
  </Accordion>
</AccordionGroup>

## Ayudantes de tiempo de ejecución

Los plugins pueden acceder a ayudantes de núcleo seleccionados mediante `api.runtime`. Para TTS:

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
- Usa la configuración central `messages.tts` y la selección de proveedor.
- Devuelve búfer de audio PCM + frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más completos, como configuración regional, género y etiquetas de personalidad para selectores conscientes del proveedor.
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

- Mantén la política de TTS, la reserva y la entrega de respuestas en el núcleo.
- Usa proveedores de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un plugin de proveedor puede poseer
  proveedores de texto, voz, imagen y medios futuros a medida que OpenClaw agregue esos
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

- Mantén la orquestación, la reserva, la configuración y el cableado de canales en el núcleo.
- Mantén el comportamiento del proveedor en el plugin de proveedor.
- La expansión aditiva debe permanecer tipada: nuevos métodos opcionales, nuevos
  campos de resultado opcionales, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo posee el contrato de capacidad y el ayudante de tiempo de ejecución
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para ayudantes de tiempo de ejecución de comprensión de medios, los plugins pueden llamar:

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
- Usa la configuración de audio de comprensión de medios del núcleo (`tools.media.audio`) y el orden de reserva de proveedores.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidad.

Los plugins también pueden lanzar ejecuciones de subagente en segundo plano mediante `api.runtime.subagent`:

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
- Para ejecuciones de reserva propiedad de plugins, los operadores deben optar explícitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir plugins de confianza a objetivos canónicos `provider/model` específicos, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagente de plugins no confiables aún funcionan, pero las solicitudes de anulación se rechazan en lugar de volver silenciosamente al valor de reserva.
- Las sesiones de subagente creadas por plugins se etiquetan con el id del plugin creador. La reserva `api.runtime.subagent.deleteSession(...)` puede eliminar solo esas sesiones propias; la eliminación arbitraria de sesiones aún requiere una solicitud Gateway con alcance de administrador.

Para búsqueda web, los plugins pueden consumir el ayudante de tiempo de ejecución compartido en lugar de
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

Los plugins también pueden registrar proveedores de búsqueda web mediante
`api.registerWebSearchProvider(...)`.

Notas:

- Mantén la selección de proveedor, la resolución de credenciales y la semántica de solicitudes compartidas en el núcleo.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de función/canal que necesitan comportamiento de búsqueda sin depender del contenedor de herramientas del agente.

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

- `path`: ruta bajo el servidor HTTP de Gateway.
- `auth`: obligatorio. Usa `"gateway"` para requerir autenticación normal de gateway, o `"plugin"` para verificación de webhook/autenticación gestionada por el plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta gestionó la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y causará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de Plugin deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Las rutas solapadas con niveles de `auth` diferentes se rechazan. Mantén las cadenas de caída `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente alcances de runtime del operador. Son para webhooks/verificación de firmas gestionados por el plugin, no para llamadas privilegiadas a helpers del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un alcance de runtime de solicitud del Gateway, pero ese alcance es intencionadamente conservador:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los alcances de runtime de rutas de plugin fijados a `operator.write`, incluso si el llamador envía `x-openclaw-scopes`
  - los modos HTTP confiables con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingress privado) respetan `x-openclaw-scopes` solo cuando el encabezado está presente explícitamente
  - si `x-openclaw-scopes` está ausente en esas solicitudes de rutas de plugin con identidad, el alcance de runtime vuelve a `operator.write`
- Regla práctica: no asumas que una ruta de plugin con autenticación de gateway es una superficie de administración implícita. Si tu ruta necesita comportamiento solo de administrador, exige un modo de autenticación con identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del SDK de Plugin

Usa subrutas estrechas del SDK en lugar del barrel raíz monolítico `openclaw/plugin-sdk`
al crear nuevos plugins. Subrutas principales:

| Subruta                             | Propósito                                          |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/compilación de canal            |
| `openclaw/plugin-sdk/core`          | Helpers compartidos genéricos y contrato paraguas  |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los plugins de canal eligen de una familia de seams estrechos: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un único contrato `approvalCapability` en lugar de mezclarse entre campos de
plugin no relacionados. Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).

Los helpers de runtime y configuración viven bajo subrutas enfocadas `*-runtime`
correspondientes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefiere `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation`
en lugar del amplio barrel de compatibilidad `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
y `openclaw/plugin-sdk/infra-runtime` son shims de compatibilidad obsoletos para
plugins antiguos. El código nuevo debe importar primitivas genéricas más estrechas en su lugar.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de plugin incluido):

- `index.js` — entrada de plugin incluido
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel solo de runtime
- `setup-entry.js` — entrada de plugin de configuración

Los plugins externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes el `src/*` de otro paquete de plugin desde core ni desde otro plugin.
Los puntos de entrada cargados por fachada prefieren la instantánea activa de configuración de runtime cuando
existe, y luego recurren al archivo de configuración resuelto en disco.

Existen subrutas específicas de capacidad como `image-generation`, `media-understanding`,
y `speech` porque los plugins incluidos las usan hoy. No son automáticamente
contratos externos congelados a largo plazo; consulta la página de referencia del SDK
pertinente cuando dependas de ellas.

## Esquemas de herramientas de mensajes

Los plugins deben poseer contribuciones de esquema `describeMessageTool(...)`
específicas de canal para primitivas que no son mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envío debe usar el contrato genérico `MessagePresentation`
en lugar de campos nativos del proveedor para botones, componentes, bloques o tarjetas.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para ver el contrato,
las reglas de fallback, el mapeo de proveedores y la lista de verificación para autores de plugins.

Los plugins con capacidad de envío declaran lo que pueden renderizar mediante capacidades de mensaje:

- `presentation` para bloques de presentación semántica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

Core decide si renderiza la presentación de forma nativa o la degrada a texto.
No expongas vías de escape de UI nativas del proveedor desde la herramienta de mensajes genérica.
Los helpers del SDK obsoletos para esquemas nativos heredados siguen exportándose para plugins
de terceros existentes, pero los plugins nuevos no deben usarlos.

## Resolución de destinos de canal

Los plugins de canal deben poseer la semántica de destinos específica de canal. Mantén el host
saliente compartido genérico y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica a core si una
  entrada debe saltar directamente a la resolución tipo id en lugar de buscar en el directorio.
- `messaging.targetResolver.resolveTarget(...)` es el fallback del plugin cuando
  core necesita una resolución final propiedad del proveedor tras la normalización o después de un
  fallo en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` posee la construcción de rutas de sesión
  específica del proveedor una vez resuelto un destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deben ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de "tratar esto como un id de destino explícito/nativo".
- Usa `resolveTarget` para el fallback de normalización específico del proveedor, no para
  una búsqueda amplia en el directorio.
- Mantén ids nativos del proveedor como ids de chat, ids de hilos, JID, identificadores y ids de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio desde la configuración deben mantener esa lógica en el
plugin y reutilizar los helpers compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Usa esto cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares de DM impulsados por allowlist
- mapas configurados de canales/grupos
- fallbacks de directorio estático con alcance de cuenta

Los helpers compartidos en `directory-runtime` solo manejan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- helpers de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas y la normalización de ids específicas de canal deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el plugin posea ids de modelo específicos del proveedor, valores predeterminados
de URL base o metadatos de modelo protegidos por autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un plugin en relación con los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples basados en clave de API o env
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en caso de colisión de claves, así que los plugins pueden reemplazar
intencionadamente una entrada de proveedor integrada con el mismo id de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`

## Inspección de canales de solo lectura

Si tu plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Motivo:

- `resolveAccount(...)` es la ruta de runtime. Puede asumir que las credenciales
  están completamente materializadas y puede fallar rápido cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de reparación
  de doctor/config no deberían necesitar materializar credenciales de runtime solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando sean pertinentes, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores de token sin procesar solo para informar disponibilidad
  de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen correspondiente)
  basta para comandos de estilo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comandos actual.

Esto permite que los comandos de solo lectura informen "configurado pero no disponible en esta ruta
de comandos" en lugar de fallar o reportar incorrectamente la cuenta como no configurada.

## Packs de paquetes

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
se convierte en `name/<fileBase>`.

Si tu plugin importa deps de npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Límite de seguridad: cada entrada `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de resolver symlinks. Las entradas que escapan del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias de plugin con un
`npm install --omit=dev --ignore-scripts` local del proyecto (sin scripts de ciclo de vida,
sin dependencias de desarrollo en runtime), ignorando ajustes globales heredados de instalación de npm.
Mantén los árboles de dependencias de plugins como "JS/TS puro" y evita paquetes que requieran
compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún sin configurar, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto mantiene el arranque y la configuración más ligeros
cuando la entrada principal de tu plugin también cablea herramientas, hooks u otro código
solo de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede optar un plugin de canal por la misma ruta `setupEntry` durante la fase de arranque
previa a escuchar del gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra completamente la superficie de arranque que debe existir
antes de que el gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar cada capacidad propiedad del canal de la que depende el arranque, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway empiece a escuchar
- cualquier método, herramienta o servicio del gateway que deba existir durante esa misma ventana

Si tu entrada completa todavía posee alguna capacidad de arranque requerida, no habilites
esta bandera. Mantén el plugin en el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el arranque.

Los canales incluidos también pueden publicar helpers de superficie de contrato solo de configuración que core
puede consultar antes de que se cargue el runtime completo del canal. La superficie actual de
promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración de canal
heredada de cuenta única a `channels.<id>.accounts.*` sin cargar la entrada
completa del plugin. Matrix es el ejemplo incluido actual: mueve solo las claves
de autenticación/arranque a una cuenta promovida con nombre cuando ya existen
cuentas con nombre, y puede conservar una clave de cuenta predeterminada no
canónica configurada en lugar de crear siempre `accounts.default`.

Esos adaptadores de parches de configuración mantienen diferido el descubrimiento
de la superficie de contrato incluida. El tiempo de importación se mantiene
ligero; la superficie de promoción se carga solo en el primer uso en lugar de
volver a entrar en el arranque del canal incluido al importar el módulo.

Cuando esas superficies de arranque incluyan métodos RPC del Gateway,
manténgalos en un prefijo específico del plugin. Los espacios de nombres
administrativos del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) permanecen reservados y siempre se resuelven a `operator.admin`,
incluso si un plugin solicita un alcance más estrecho.

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

Los plugins de canal pueden anunciar metadatos de configuración/descubrimiento
mediante `openclaw.channel` y pistas de instalación mediante `openclaw.install`.
Esto mantiene el catálogo del núcleo libre de datos.

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
- `docsLabel`: anula el texto del enlace para el enlace de documentación
- `preferOver`: ids de plugin/canal de menor prioridad que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto para la superficie de selección
- `markdownCapable`: marca el canal como compatible con markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de la documentación
- `showConfigured` / `showInSetup`: alias heredados que aún se aceptan por compatibilidad; prefiera `exposure`
- `quickstartAllowFrom`: incorpora el canal al flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver destinos de anuncio

OpenClaw también puede fusionar **catálogos de canales externos** (por ejemplo,
una exportación de registro MPM). Coloque un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunte `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a uno
o más archivos JSON (delimitados por comas/punto y coma/`PATH`). Cada archivo
debe contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados para la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de
instalación de proveedores exponen datos normalizados de origen de instalación
junto al bloque `openclaw.install` sin procesar. Los datos normalizados
identifican si la especificación npm es una versión exacta o un selector
flotante, si los metadatos de integridad esperados están presentes y si también
hay disponible una ruta de origen local. Cuando se conoce la identidad del
catálogo/paquete, los datos normalizados advierten si el nombre del paquete npm
analizado se desvía de esa identidad. También advierten cuando `defaultChoice`
no es válido o apunta a un origen que no está disponible, y cuando los metadatos
de integridad npm están presentes sin un origen npm válido. Los consumidores
deben tratar `installSource` como un campo opcional aditivo para que las
entradas creadas a mano y los adaptadores de catálogo no tengan que sintetizarlo.
Esto permite que la incorporación y los diagnósticos expliquen el estado del
plano de origen sin importar el runtime del plugin.

Las entradas npm externas oficiales deben preferir un `npmSpec` exacto más
`expectedIntegrity`. Los nombres de paquete simples y las dist-tags siguen
funcionando por compatibilidad, pero muestran advertencias del plano de origen
para que el catálogo pueda avanzar hacia instalaciones fijadas y verificadas por
integridad sin romper plugins existentes. Cuando la incorporación instala desde
una ruta de catálogo local, registra una entrada administrada del índice de
plugins con `source: "path"` y un `sourcePath` relativo al espacio de trabajo
cuando es posible. La ruta absoluta de carga operativa permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas locales de
la estación de trabajo en la configuración de larga duración. Esto mantiene las
instalaciones de desarrollo local visibles para los diagnósticos del plano de
origen sin añadir una segunda superficie de divulgación de rutas del sistema de
archivos sin procesar. El índice de plugins persistido en `plugins/installs.json`
es la fuente de verdad de instalación y se puede actualizar sin cargar módulos
del runtime del plugin. Su mapa `installRecords` es duradero incluso cuando falta
un manifiesto de plugin o no es válido; su arreglo `plugins` es una vista de
manifiesto reconstruible.

## Plugins del motor de contexto

Los plugins del motor de contexto poseen la orquestación del contexto de sesión
para ingesta, ensamblaje y Compaction. Regístrelos desde su plugin con
`api.registerContextEngine(id, factory)` y luego seleccione el motor activo con
`plugins.slots.contextEngine`.

Use esto cuando su plugin necesite reemplazar o ampliar la canalización de
contexto predeterminada en lugar de solo agregar búsqueda de memoria o hooks.

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

Si su motor **no** posee el algoritmo de Compaction, mantenga `compact()`
implementado y deléguelo explícitamente:

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

Cuando un plugin necesite comportamiento que no encaje en la API actual, no
eluda el sistema de plugins con un acceso privado. Añada la capacidad faltante.

Secuencia recomendada:

1. defina el contrato del núcleo
   Decida qué comportamiento compartido debe poseer el núcleo: política, fallback, fusión de configuración,
   ciclo de vida, semántica orientada al canal y forma del helper de runtime.
2. añada superficies tipadas de registro/runtime de plugin
   Amplíe `OpenClawPluginApi` y/o `api.runtime` con la superficie de capacidad
   tipada útil más pequeña.
3. conecte los consumidores del núcleo + canal/funcionalidad
   Los canales y plugins de funcionalidad deben consumir la nueva capacidad a través del núcleo,
   no importando directamente una implementación de proveedor.
4. registre implementaciones de proveedor
   Luego los plugins de proveedor registran sus backends contra la capacidad.
5. añada cobertura de contrato
   Añada pruebas para que la propiedad y la forma de registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw se mantiene opinado sin quedar codificado de forma rígida
a la visión de un único proveedor. Consulte el [Cookbook de capacidades](/es/plugins/architecture)
para ver una lista de comprobación de archivos concreta y un ejemplo desarrollado.

### Lista de comprobación de capacidades

Cuando añada una nueva capacidad, la implementación normalmente debe tocar estas
superficies en conjunto:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- helper de ejecutor/runtime del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de API de plugin en `src/plugins/types.ts`
- cableado del registro de plugins en `src/plugins/registry.ts`
- exposición del runtime de plugin en `src/plugins/runtime/*` cuando los plugins de funcionalidad/canal
  necesiten consumirla
- helpers de captura/prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación de operador/plugin en `docs/`

Si falta una de esas superficies, normalmente es señal de que la capacidad aún
no está completamente integrada.

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
- los plugins de funcionalidad/canal consumen helpers de runtime
- las pruebas de contrato mantienen explícita la propiedad

## Relacionado

- [Arquitectura de plugins](/es/plugins/architecture) — modelo y formas públicas de capacidades
- [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
