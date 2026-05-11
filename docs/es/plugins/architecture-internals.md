---
read_when:
    - Implementación de puntos de enlace de tiempo de ejecución de proveedores, ciclo de vida de canales o paquetes de paquetes
    - Depuración del orden de carga de Plugins o del estado del registro
    - Agregar una nueva capacidad de Plugin o un Plugin de motor de contexto
summary: 'Aspectos internos de la arquitectura de Plugin: canalización de carga, registro, puntos de extensión de tiempo de ejecución, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de Plugin
x-i18n:
    generated_at: "2026-05-11T20:42:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para el modelo público de capacidades, las formas de Plugin y los contratos de
propiedad/ejecución, consulta [arquitectura de Plugin](/es/plugins/architecture). Esta página es la
referencia para la mecánica interna: canalización de carga, registro, hooks de runtime,
rutas HTTP del Gateway, rutas de importación y tablas de esquema.

## Canalización de carga

Al iniciar, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de Plugin
2. lee manifiestos de bundles nativos o compatibles y metadatos del paquete
3. rechaza candidatos no seguros
4. normaliza la configuración de Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga módulos nativos habilitados: los módulos integrados construidos usan un cargador nativo;
   el código fuente local TypeScript de terceros usa el fallback de emergencia Jiti
7. llama a los hooks nativos `register(api)` y recopila los registros en el registro de Plugin
8. expone el registro a comandos/superficies de runtime

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins integrados usan `register`; prefiere `register` para plugins nuevos.
</Note>

Las puertas de seguridad ocurren **antes** de la ejecución de runtime. Los candidatos se bloquean
cuando la entrada escapa de la raíz del Plugin, la ruta es escribible por todo el mundo o la
propiedad de la ruta parece sospechosa para plugins no integrados.

Los candidatos bloqueados permanecen vinculados a su id de Plugin para diagnósticos. Si la configuración
todavía hace referencia a ese id, la validación informa que el Plugin está presente pero bloqueado
y apunta de nuevo a la advertencia de seguridad de ruta en lugar de tratar la entrada de configuración
como obsoleta.

### Comportamiento centrado en el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el Plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del bundle
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/marcadores de posición de la interfaz de control
- mostrar metadatos de instalación/catálogo
- conservar descriptores baratos de activación y configuración sin cargar el runtime del Plugin

Para plugins nativos, el módulo de runtime es la parte del plano de datos. Registra
comportamiento real, como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores de solo metadatos para la planificación de activación y el descubrimiento de configuración;
no sustituyen el registro de runtime, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan indicios de comandos, canales y proveedores del manifiesto
para acotar la carga de Plugin antes de una materialización más amplia del registro:

- la carga de la CLI se acota a los plugins que poseen el comando principal solicitado
- la resolución de configuración/Plugin de canal se acota a los plugins que poseen el id de canal
  solicitado
- la resolución explícita de configuración/runtime de proveedor se acota a los plugins que poseen el
  id de proveedor solicitado
- la planificación de inicio del Gateway usa `activation.onStartup` para importaciones explícitas de inicio
  y exclusiones de inicio; los plugins sin metadatos de inicio se cargan solo
  mediante disparadores de activación más acotados

Las precargas de runtime en tiempo de solicitud que piden el ámbito amplio `all` siguen derivando un
conjunto explícito efectivo de ids de Plugin a partir de la configuración, la planificación de inicio, los
canales configurados, los slots y las reglas de habilitación automática. Si ese conjunto derivado está vacío, OpenClaw
carga un registro de runtime vacío en lugar de ampliarse a todos los plugins descubribles.

El planificador de activación expone tanto una API solo de ids para llamadores existentes como una
API de plan para diagnósticos nuevos. Las entradas del plan informan por qué se seleccionó un Plugin,
separando los indicios explícitos del planificador `activation.*` de la propiedad de manifiesto
de fallback, como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks. Esa separación de motivos es el límite de compatibilidad:
los metadatos existentes de Plugin siguen funcionando, mientras que el código nuevo puede detectar indicios amplios
o comportamiento de fallback sin cambiar la semántica de carga de runtime.

El descubrimiento de configuración ahora prefiere ids propiedad del descriptor, como `setup.providers` y
`setup.cliBackends`, para acotar plugins candidatos antes de recurrir a
`setup-api` para plugins que todavía necesitan hooks de runtime en tiempo de configuración. Las listas de
configuración de proveedores usan `providerAuthChoices` del manifiesto, opciones de configuración derivadas de descriptores
y metadatos de catálogo de instalación sin cargar el runtime del proveedor. `setup.requiresRuntime: false`
explícito es un corte solo de descriptor; omitir
`requiresRuntime` mantiene el fallback heredado de setup-api por compatibilidad. Si más
de un Plugin descubierto reclama el mismo id normalizado de proveedor de configuración o backend de CLI,
la búsqueda de configuración rechaza el propietario ambiguo en lugar de depender del
orden de descubrimiento. Cuando sí se ejecuta el runtime de configuración, los diagnósticos del registro informan
desviaciones entre `setup.providers` / `setup.cliBackends` y los proveedores o backends de CLI
registrados por setup-api sin bloquear plugins heredados.

### Límite de caché de Plugin

OpenClaw no almacena en caché los resultados de descubrimiento de Plugin ni datos directos del registro de manifiestos
detrás de ventanas de reloj de pared. Las instalaciones, ediciones de manifiestos y cambios de rutas de carga
deben volverse visibles en la siguiente lectura explícita de metadatos o reconstrucción de snapshot.
El analizador de archivos de manifiesto puede mantener una caché acotada de firma de archivo, indexada por la
ruta de manifiesto abierta, inode, tamaño y marcas de tiempo; esa caché solo evita
volver a analizar bytes sin cambios y no debe almacenar en caché respuestas de descubrimiento, registro, propietario o
política.

La ruta rápida segura de metadatos es la propiedad explícita de objetos, no una caché oculta.
Las rutas críticas de inicio del Gateway deben pasar el `PluginMetadataSnapshot` actual, la
`PluginLookUpTable` derivada o un registro explícito de manifiestos por la cadena de llamadas.
La validación de configuración, la habilitación automática de inicio, el arranque de Plugin y la selección de proveedor
pueden reutilizar esos objetos mientras representen la configuración y el inventario de Plugin actuales.
La búsqueda de configuración todavía reconstruye metadatos de manifiesto bajo demanda
salvo que la ruta específica de configuración reciba un registro explícito de manifiestos; mantén eso
como fallback de ruta fría en lugar de añadir cachés ocultas de búsqueda. Cuando la entrada
cambie, reconstruye y reemplaza el snapshot en lugar de mutarlo o conservar
copias históricas.
Las vistas sobre el registro activo de Plugin y los helpers de arranque de canales integrados
deben recomputarse a partir del registro/raíz actual. Los mapas de vida corta están bien
dentro de una llamada para deduplicar trabajo o proteger la reentrada; no deben convertirse en cachés de metadatos
de proceso.

Para la carga de Plugin, la capa de caché persistente es la carga de runtime. Puede reutilizar
estado del cargador cuando el código o los artefactos instalados se cargan realmente, como:

- `PluginLoaderCacheState` y registros activos de runtime compatibles
- cachés de jiti/módulos y cachés de cargador de superficie pública usadas para evitar importar
  la misma superficie de runtime repetidamente
- cachés de sistema de archivos para artefactos instalados de Plugin
- mapas por llamada de vida corta para normalización de rutas o resolución de duplicados

Esas cachés son detalles de implementación del plano de datos. No deben responder
preguntas del plano de control como "¿qué Plugin posee este proveedor?" salvo que el
llamador haya pedido deliberadamente carga de runtime.

No añadas cachés persistentes ni de reloj de pared para:

- resultados de descubrimiento
- registros directos de manifiestos
- registros de manifiestos reconstruidos a partir del índice de plugins instalados
- búsqueda de propietario de proveedor, supresión de modelos, política de proveedor o metadatos de artefacto
  público
- cualquier otra respuesta derivada de manifiesto donde un manifiesto, índice instalado
  o ruta de carga cambiados deban ser visibles en la siguiente lectura de metadatos

Los llamadores que reconstruyen metadatos de manifiesto a partir del índice persistido de plugins instalados
reconstruyen ese registro bajo demanda. El índice instalado es estado durable
del plano fuente; no es una caché oculta de metadatos en proceso.

## Modelo de registro

Los plugins cargados no mutan directamente globals aleatorios del core. Se registran en un
registro central de Plugin.

El registro rastrea:

- registros de Plugin (identidad, fuente, origen, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- manejadores RPC del Gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad de Plugin

Luego, las funcionalidades del core leen de ese registro en lugar de comunicarse directamente con módulos de Plugin.
Esto mantiene la carga en una sola dirección:

- módulo de Plugin -> registro en el registro
- runtime del core -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del core solo
necesitan un punto de integración: "leer el registro", no "especializar cada módulo de Plugin".

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
- `request`: el resumen de la solicitud original, indicio de desvinculación, id del remitente y
  metadatos de conversación

Este callback es solo de notificación. No cambia quién tiene permitido vincular una
conversación y se ejecuta después de que termina el manejo de aprobación del core.

## Hooks de runtime de proveedor

Los plugins de proveedor tienen tres capas:

- **Metadatos de manifiesto** para búsqueda barata previa al runtime:
  `setup.providers[].envVars`, compatibilidad obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks en tiempo de configuración**: `catalog` (`discovery` heredado) más
  `applyConfigDefaults`.
- **Hooks de runtime**: más de 40 hooks opcionales que cubren autenticación, resolución de modelos,
  envoltura de streams, niveles de razonamiento, política de reproducción y endpoints de uso. Consulta
  la lista completa en [orden y uso de hooks](#hook-order-and-usage).

OpenClaw sigue siendo propietario del bucle genérico de agente, failover, manejo de transcript y
política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico de proveedor
sin necesitar un transporte de inferencia totalmente personalizado.

Usa `setup.providers[].envVars` del manifiesto cuando el proveedor tenga credenciales basadas en env
que las rutas genéricas de autenticación/estado/selector de modelos deban ver sin
cargar el runtime del Plugin. `providerAuthEnvVars` obsoleto todavía es leído por el
adaptador de compatibilidad durante la ventana de deprecación, y los plugins no integrados
que lo usan reciben un diagnóstico de manifiesto. Usa `providerAuthAliases` del manifiesto
cuando un id de proveedor deba reutilizar las env vars de otro id de proveedor, perfiles de autenticación,
autenticación respaldada por configuración y opción de onboarding con clave de API. Usa
`providerAuthChoices` del manifiesto cuando las superficies de CLI de onboarding/elección de autenticación deban conocer el
id de opción del proveedor, etiquetas de grupo y cableado de autenticación simple de una bandera sin
cargar el runtime del proveedor. Mantén `envVars` de runtime del proveedor para indicios orientados al operador,
como etiquetas de onboarding o vars de configuración de client-id/client-secret de OAuth.

Usa `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración impulsada por env que
el fallback genérico de env de shell, las comprobaciones de configuración/estado o los prompts de configuración deban ver
sin cargar el runtime del canal.

### Orden y uso de hooks

Para plugins de modelo/proveedor, OpenClaw llama hooks en este orden aproximado.
La columna "Cuándo usar" es la guía rápida de decisión.
Los campos de proveedor solo de compatibilidad que OpenClaw ya no llama, como
`ProviderPlugin.capabilities` y `suppressBuiltInModel`, no se enumeran
intencionalmente aquí.

| #   | Hook                              | Qué hace                                                                                                      | Cuándo usarlo                                                                                                                                               |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`           | El proveedor es propietario de un catálogo o de valores predeterminados de URL base                                                                          |
| 2   | `applyConfigDefaults`             | Aplica los valores predeterminados de configuración global propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de la familia de modelos del proveedor                            |
| --  | _(búsqueda de modelos integrada)_ | OpenClaw intenta primero la ruta normal de registro/catálogo                                                  | _(no es un hook de Plugin)_                                                                                                                                  |
| 3   | `normalizeModelId`                | Normaliza alias de ids de modelo heredados o de vista previa antes de la búsqueda                             | El proveedor es propietario de la limpieza de alias antes de la resolución canónica del modelo                                                               |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblado genérico del modelo              | El proveedor es propietario de la limpieza de transporte para ids de proveedor personalizados en la misma familia de transporte                              |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución de tiempo de ejecución/proveedor                     | El proveedor necesita una limpieza de configuración que debería vivir con el Plugin; los helpers incluidos de la familia Google también respaldan entradas de configuración Google compatibles |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a los proveedores de configuración           | El proveedor necesita correcciones de metadatos de uso de streaming nativo controladas por el endpoint                                                       |
| 7   | `resolveConfigApiKey`             | Resuelve la autenticación con marcador de entorno para proveedores de configuración antes de cargar la autenticación de tiempo de ejecución | El proveedor tiene resolución de clave API con marcador de entorno propiedad del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcadores de entorno de AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/autohospedada o respaldada por configuración sin persistir texto plano             | El proveedor puede operar con un marcador de credencial sintético/local                                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externa propiedad del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales propiedad de CLI/aplicación | El proveedor reutiliza credenciales de autenticación externa sin persistir tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Reduce la precedencia de los marcadores de posición de perfiles sintéticos almacenados frente a autenticación respaldada por entorno/configuración | El proveedor almacena perfiles de marcador de posición sintéticos que no deberían ganar precedencia                                                          |
| 11  | `resolveDynamicModel`             | Sincroniza una alternativa para ids de modelo propiedad del proveedor que aún no están en el registro local    | El proveedor acepta ids de modelo ascendentes arbitrarios                                                                                                    |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono, luego `resolveDynamicModel` se ejecuta de nuevo                                      | El proveedor necesita metadatos de red antes de resolver ids desconocidos                                                                                    |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor integrado use el modelo resuelto                                   | El proveedor necesita reescrituras de transporte, pero sigue usando un transporte del núcleo                                                                 |
| 14  | `contributeResolvedModelCompat`   | Aporta marcas de compatibilidad para modelos de proveedor detrás de otro transporte compatible                | El proveedor reconoce sus propios modelos en transportes proxy sin tomar el control del proveedor                                                            |
| 15  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el ejecutor integrado los vea                                 | El proveedor necesita limpieza de esquemas de la familia de transporte                                                                                       |
| 16  | `inspectToolSchemas`              | Expone diagnósticos de esquemas propiedad del proveedor después de la normalización                            | El proveedor quiere advertencias de palabras clave sin enseñar al núcleo reglas específicas del proveedor                                                    |
| 17  | `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo frente al etiquetado                                  | El proveedor necesita razonamiento/salida final etiquetados en lugar de campos nativos                                                                       |
| 18  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los contenedores genéricos de opciones de streaming         | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                                         |
| 19  | `createStreamFn`                  | Reemplaza por completo la ruta de streaming normal con un transporte personalizado                            | El proveedor necesita un protocolo de cable personalizado, no solo un contenedor                                                                             |
| 20  | `wrapStreamFn`                    | Contenedor de streaming después de aplicar los contenedores genéricos                                         | El proveedor necesita contenedores de compatibilidad de encabezados/cuerpo/modelo de solicitud sin un transporte personalizado                               |
| 21  | `resolveTransportTurnState`       | Adjunta encabezados o metadatos de transporte nativos por turno                                               | El proveedor quiere que los transportes genéricos envíen identidad de turno nativa del proveedor                                                             |
| 22  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados WebSocket nativos o una política de enfriamiento de sesión                                | El proveedor quiere que los transportes WS genéricos ajusten encabezados de sesión o la política de alternativa                                              |
| 23  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` de tiempo de ejecución | El proveedor almacena metadatos de autenticación adicionales y necesita una forma de token de tiempo de ejecución personalizada                              |
| 24  | `refreshOAuth`                    | Sobrescritura de actualización OAuth para endpoints de actualización personalizados o política de error de actualización | El proveedor no encaja con los actualizadores compartidos de `pi-ai`                                                                                         |
| 25  | `buildAuthDoctorHint`             | Sugerencia de reparación añadida cuando falla la actualización OAuth                                          | El proveedor necesita orientación de reparación de autenticación propiedad del proveedor después de un fallo de actualización                                 |
| 26  | `matchesContextOverflowError`     | Coincidencia de desbordamiento de ventana de contexto propiedad del proveedor                                  | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas pasarían por alto                                                    |
| 27  | `classifyFailoverReason`          | Clasificación de razones de conmutación por error propiedad del proveedor                                     | El proveedor puede asignar errores sin procesar de API/transporte a límite de tasa/sobrecarga/etc.                                                           |
| 28  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                  | El proveedor necesita control de TTL de caché específico de proxy                                                                                            |
| 29  | `buildMissingAuthMessage`         | Reemplazo del mensaje genérico de recuperación por autenticación faltante                                     | El proveedor necesita una sugerencia de recuperación por autenticación faltante específica del proveedor                                                      |
| 30  | `augmentModelCatalog`             | Filas de catálogo sintéticas/finales añadidas después del descubrimiento                                      | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                                                |
| 31  | `resolveThinkingProfile`          | Conjunto de niveles `/think` específicos del modelo, etiquetas de visualización y valor predeterminado        | El proveedor expone una escala de pensamiento personalizada o una etiqueta binaria para modelos seleccionados                                                |
| 32  | `isBinaryThinking`                | Hook de compatibilidad del interruptor de razonamiento activado/desactivado                                   | El proveedor expone solo pensamiento binario activado/desactivado                                                                                            |
| 33  | `supportsXHighThinking`           | Hook de compatibilidad de razonamiento `xhigh`                                                                | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                                                |
| 34  | `resolveDefaultThinkingLevel`     | Hook de compatibilidad del nivel `/think` predeterminado                                                      | El proveedor es propietario de la política `/think` predeterminada para una familia de modelos                                                               |
| 35  | `isModernModelRef`                | Coincidencia de modelo moderno para filtros de perfiles en vivo y selección de smoke                          | El proveedor es propietario de la coincidencia de modelos preferidos para vivo/smoke                                                                         |
| 36  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave de tiempo de ejecución real justo antes de la inferencia | El proveedor necesita un intercambio de tokens o una credencial de solicitud de corta duración                                                               |
| 37  | `resolveUsageAuth`                | Resolver las credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                                     | El proveedor necesita análisis personalizado de tokens de uso/cuota o una credencial de uso diferente                                                               |
| 38  | `fetchUsageSnapshot`              | Obtener y normalizar snapshots de uso/cuota específicos del proveedor después de resolver la autenticación                             | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de payload                                                                           |
| 39  | `createEmbeddingProvider`         | Crear un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                                                     | El comportamiento de embeddings de memoria pertenece al Plugin del proveedor                                                                                    |
| 40  | `buildReplayPolicy`               | Devolver una política de reproducción que controle el manejo de transcripciones para el proveedor                                        | El proveedor necesita una política de transcripción personalizada (por ejemplo, eliminación de bloques de razonamiento)                                                               |
| 41  | `sanitizeReplayHistory`           | Reescribir el historial de reproducción después de la limpieza genérica de transcripciones                                                        | El proveedor necesita reescrituras de reproducción específicas del proveedor más allá de los ayudantes de compaction compartidos                                                             |
| 42  | `validateReplayTurns`             | Validación final de turnos de reproducción o reformateo antes del runner integrado                                           | El transporte del proveedor necesita una validación de turnos más estricta después del saneamiento genérico                                                                    |
| 43  | `onModelSelected`                 | Ejecutar efectos secundarios posteriores a la selección propiedad del proveedor                                                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo se vuelve activo                                                                  |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` comprueban primero el
plugin de proveedor coincidente y luego pasan a otros plugins de proveedor con
hooks hasta que uno cambia realmente el id de modelo o el transporte/configuración. Eso mantiene
funcionando los shims de proveedor de alias/compatibilidad sin exigir que el llamador sepa qué
plugin incluido es dueño de la reescritura. Si ningún hook de proveedor reescribe una entrada de
configuración compatible de la familia Google, el normalizador de configuración de Google incluido
sigue aplicando esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable totalmente personalizado o un ejecutor de solicitudes personalizado,
eso es una clase distinta de extensión. Estos hooks son para comportamiento de proveedor
que todavía se ejecuta en el bucle de inferencia normal de OpenClaw.

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
la autenticación, el razonamiento, la reproducción y las necesidades de uso de cada proveedor. El conjunto de hooks autoritativo reside con
cada plugin bajo `extensions/`; esta página ilustra las formas en lugar de
reflejar la lista.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI y xAI registran `catalog` junto con
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer ids de modelos
    upstream antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai emparejan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para hacerse cargo del intercambio de tokens y la integración con `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Las familias compartidas con nombre (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los proveedores adopten
    la política de transcripción mediante `buildReplayPolicy` en lugar de que cada plugin
    vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran solo `catalog` y usan el bucle de inferencia compartido.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` viven dentro de la
    interfaz pública `api.ts` / `contract-api.ts` del plugin de Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) en lugar de en
    el SDK genérico.
  </Accordion>
</AccordionGroup>

## Ayudantes de tiempo de ejecución

Los plugins pueden acceder a ayudantes centrales seleccionados mediante `api.runtime`. Para TTS:

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
- Usa la configuración central `messages.tts` y la selección de proveedor.
- Devuelve búfer de audio PCM + frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos, como configuración regional, género y etiquetas de personalidad para selectores conscientes del proveedor.
- OpenAI y ElevenLabs admiten telefonía actualmente. Microsoft no.

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
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un plugin de proveedor puede ser dueño de
  proveedores de texto, voz, imagen y medios futuros a medida que OpenClaw agrega esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los plugins registran un proveedor
tipado de comprensión de medios en lugar de una bolsa genérica de clave/valor:

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
- Mantén el comportamiento de proveedor en el plugin de proveedor.
- La expansión aditiva debe seguir tipada: nuevos métodos opcionales, nuevos
  campos de resultado opcionales, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo posee el contrato de capacidad y el ayudante de tiempo de ejecución
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de característica/canal consumen `api.runtime.videoGeneration.*`

Para los ayudantes de tiempo de ejecución de comprensión de medios, los plugins pueden llamar:

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
- `extractStructuredWithModel(...)` es la interfaz orientada a plugins para extracción acotada
  propiedad del proveedor y centrada primero en imágenes. Incluye al menos una entrada de imagen;
  las entradas de texto son contexto suplementario.
  los plugins de producto son dueños de sus rutas y esquemas mientras OpenClaw posee el
  límite de proveedor/tiempo de ejecución.
- Usa la configuración de audio de comprensión de medios del núcleo (`tools.media.audio`) y el orden de fallback de proveedores.
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

- `provider` y `model` son sobrescrituras opcionales por ejecución, no cambios de sesión persistentes.
- OpenClaw solo respeta esos campos de sobrescritura para llamadores de confianza.
- Para ejecuciones de fallback propiedad del plugin, los operadores deben optar por habilitarlas con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir plugins de confianza a objetivos canónicos `provider/model` específicos, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagente de plugins no confiables siguen funcionando, pero las solicitudes de sobrescritura se rechazan en lugar de hacer fallback silenciosamente.
- Las sesiones de subagente creadas por plugins se etiquetan con el id del plugin creador. El fallback `api.runtime.subagent.deleteSession(...)` puede eliminar solo esas sesiones propias; la eliminación arbitraria de sesiones sigue requiriendo una solicitud de Gateway con alcance de administrador.

Para búsqueda web, los plugins pueden consumir el ayudante de tiempo de ejecución compartido en lugar de
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

- Mantén la selección de proveedores, la resolución de credenciales y la semántica de solicitud compartida en el núcleo.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos de proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de característica/canal que necesitan comportamiento de búsqueda sin depender del wrapper de herramienta del agente.

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

Campos de ruta:

- `path`: ruta bajo el servidor HTTP del Gateway.
- `auth`: requerido. Usa `"gateway"` para requerir la autenticación normal del gateway, o `"plugin"` para autenticación/verificación de webhook gestionada por el plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo plugin sustituya su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta gestionó la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de Plugin deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Las rutas solapadas con distintos niveles de `auth` se rechazan. Mantén las cadenas de continuación `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente ámbitos de runtime del operador. Están destinadas a webhooks/verificación de firmas gestionados por el plugin, no a llamadas privilegiadas de ayuda del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un ámbito de runtime de solicitud del Gateway, pero ese ámbito es intencionadamente conservador:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los ámbitos de runtime de rutas de plugin fijados a `operator.write`, incluso si el llamador envía `x-openclaw-scopes`
  - los modos HTTP confiables que transportan identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingreso privado) respetan `x-openclaw-scopes` solo cuando el encabezado está presente explícitamente
  - si `x-openclaw-scopes` está ausente en esas solicitudes de rutas de plugin que transportan identidad, el ámbito de runtime vuelve a `operator.write`
- Regla práctica: no asumas que una ruta de plugin con autenticación de gateway es una superficie de administración implícita. Si tu ruta necesita comportamiento exclusivo de administrador, exige un modo de autenticación que transporte identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del SDK de Plugin

Usa subrutas estrechas del SDK en lugar del barrel raíz monolítico `openclaw/plugin-sdk`
al crear plugins nuevos. Subrutas principales:

| Subruta                             | Propósito                                          |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Ayudantes de entrada/compilación de canal          |
| `openclaw/plugin-sdk/core`          | Ayudantes compartidos genéricos y contrato paraguas |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los plugins de canal eligen entre una familia de puntos de integración estrechos: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un único contrato `approvalCapability` en lugar de mezclarse entre campos de plugin no relacionados.
Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).

Los ayudantes de runtime y configuración viven bajo subrutas enfocadas `*-runtime` correspondientes
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefiere `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation`
en lugar del barrel amplio de compatibilidad `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
y `openclaw/plugin-sdk/infra-runtime` son shims de compatibilidad obsoletos para
plugins antiguos. El código nuevo debe importar primitivas genéricas más estrechas.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de plugin incluido):

- `index.js` — entrada de plugin incluido
- `api.js` — barrel de ayudantes/tipos
- `runtime-api.js` — barrel solo de runtime
- `setup-entry.js` — entrada de plugin de configuración

Los plugins externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes el `src/*` de otro paquete de plugin desde el núcleo ni desde otro plugin.
Los puntos de entrada cargados por fachada prefieren la instantánea activa de configuración de runtime cuando
existe una, y luego recurren al archivo de configuración resuelto en disco.

Existen subrutas específicas de capacidad como `image-generation`, `media-understanding`
y `speech` porque los plugins incluidos las usan hoy. No son
contratos externos congelados automáticamente a largo plazo: consulta la página de referencia del SDK
correspondiente cuando dependas de ellas.

## Esquemas de herramientas de mensajes

Los plugins deben poseer contribuciones de esquema `describeMessageTool(...)` específicas del canal
para primitivas que no sean mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envío debe usar el contrato genérico `MessagePresentation`
en lugar de campos nativos del proveedor para botones, componentes, bloques o tarjetas.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para el contrato,
las reglas de fallback, el mapeo de proveedores y la lista de verificación para autores de plugins.

Los plugins con capacidad de envío declaran qué pueden renderizar mediante capacidades de mensaje:

- `presentation` para bloques de presentación semántica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El núcleo decide si renderiza la presentación de forma nativa o la degrada a texto.
No expongas vías de escape de IU nativas del proveedor desde la herramienta genérica de mensajes.
Los ayudantes obsoletos del SDK para esquemas nativos heredados siguen exportándose para plugins
de terceros existentes, pero los plugins nuevos no deben usarlos.

## Resolución de destinos de canal

Los plugins de canal deben poseer la semántica de destino específica del canal. Mantén genérico
el host de salida compartido y usa la superficie del adaptador de mensajería para reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al núcleo si una
  entrada debe saltar directamente a una resolución similar a id en lugar de buscar en el directorio.
- `messaging.targetResolver.resolveTarget(...)` es el fallback del plugin cuando
  el núcleo necesita una resolución final propiedad del proveedor después de la normalización o tras un
  fallo en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` posee la construcción de rutas de sesión
  específica del proveedor una vez resuelto un destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deben ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de “tratar esto como un id de destino explícito/nativo”.
- Usa `resolveTarget` para el fallback de normalización específico del proveedor, no para
  búsquedas amplias en el directorio.
- Mantén ids nativos del proveedor como ids de chat, ids de hilo, JID, identificadores y ids de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio desde la configuración deben mantener esa lógica en el
plugin y reutilizar los ayudantes compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Usa esto cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares de DM impulsados por allowlist
- mapas de canal/grupo configurados
- fallbacks de directorio estático con ámbito de cuenta

Los ayudantes compartidos en `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- ayudantes de desduplicación/normalización
- creación de `ChannelDirectoryEntry[]`

La inspección de cuentas específica del canal y la normalización de ids deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el plugin posea ids de modelo específicos del proveedor, valores predeterminados de URL base
o metadatos de modelo restringidos por autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un plugin respecto a los proveedores implícitos
integrados de OpenClaw:

- `simple`: proveedores simples impulsados por clave de API o entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en colisiones de clave, por lo que los plugins pueden sobrescribir intencionadamente una
entrada de proveedor integrada con el mismo id de proveedor.

Los plugins también pueden publicar filas de modelo de solo lectura mediante
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Esta es la ruta futura para superficies de lista/ayuda/selector y admite
filas `text`, `image_generation`, `video_generation` y `music_generation`.
Los plugins de proveedor siguen siendo propietarios de las llamadas a endpoints en vivo, el intercambio de tokens y el mapeo de
respuestas del proveedor; el núcleo posee la forma de fila común, las etiquetas de origen y el formato de ayuda de herramientas
multimedia. Los registros de proveedores de generación multimedia sintetizan filas de catálogo estático
automáticamente desde `defaultModel`, `models` y `capabilities`.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado, pero emite una advertencia de obsolescencia
- si se registran `catalog` y `discovery`, OpenClaw usa `catalog`
- `augmentModelCatalog` está obsoleto; los proveedores incluidos deben publicar
  filas suplementarias mediante `registerModelCatalogProvider`

## Inspección de canal de solo lectura

Si tu plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Motivo:

- `resolveAccount(...)` es la ruta de runtime. Puede asumir que las credenciales
  están materializadas por completo y fallar rápido cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de reparación de doctor/config
  no deberían necesitar materializar credenciales de runtime solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo estado descriptivo de la cuenta.
- Preserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando corresponda, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores de token sin procesar solo para informar disponibilidad
  de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen correspondiente)
  es suficiente para comandos de estilo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen “configurado pero no disponible en esta ruta de comando”
en lugar de bloquearse o informar incorrectamente que la cuenta no está configurada.

## Paquetes de paquetes

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

Cada entrada se convierte en un plugin. Si el paquete enumera varias extensions, el id del plugin
se convierte en `name/<fileBase>`.

Si tu plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Medida de seguridad: toda entrada `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de la resolución de symlinks. Las entradas que escapan del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias de plugins con un
`npm install --omit=dev --ignore-scripts` local al proyecto (sin scripts de ciclo de vida,
sin dependencias de desarrollo en runtime), ignorando la configuración global heredada de instalación de npm.
Mantén los árboles de dependencias de plugins como “JS/TS puro” y evita paquetes que requieran
compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún sin configurar, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto hace que el arranque y la configuración sean más ligeros
cuando la entrada principal de tu plugin también conecta herramientas, hooks u otro código
solo de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede inscribir a un plugin de canal en la misma ruta `setupEntry` durante la fase de arranque
previa a la escucha del gateway, incluso cuando el canal ya está configurado.

Use esto solo cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el Gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar todas las capacidades propiedad del canal de las que depende el inicio, como:

- el registro del canal en sí
- cualquier ruta HTTP que deba estar disponible antes de que el Gateway empiece a escuchar
- cualquier método, herramienta o servicio del Gateway que deba existir durante esa misma ventana

Si tu entrada completa todavía posee alguna capacidad de inicio requerida, no habilites
esta bandera. Mantén el Plugin con el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar ayudantes de superficie de contrato solo de configuración que el núcleo
puede consultar antes de que se cargue el runtime completo del canal. La superficie actual de
promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración heredada de canal de cuenta única
a `channels.<id>.accounts.*` sin cargar la entrada completa del Plugin.
Matrix es el ejemplo incluido actual: mueve solo claves de autenticación/arranque a una
cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede conservar una
clave de cuenta predeterminada no canónica configurada en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parches de configuración mantienen diferido el descubrimiento de la superficie de contrato incluida. El tiempo
de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de
volver a entrar en el inicio del canal incluido al importar el módulo.

Cuando esas superficies de inicio incluyan métodos RPC del Gateway, mantenlos en un
prefijo específico del Plugin. Los espacios de nombres de administración del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven
como `operator.admin`, incluso si un Plugin solicita un alcance más restringido.

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

Los Plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
pistas de instalación mediante `openclaw.install`. Esto mantiene el catálogo del núcleo sin datos.

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
- `preferOver`: ids de Plugin/canal de menor prioridad que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto de la superficie de selección
- `markdownCapable`: marca el canal como compatible con markdown para decisiones de formato de salida
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para las superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados que todavía se aceptan por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: incluye el canal en el flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: exige vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver destinos de anuncio

OpenClaw también puede fusionar **catálogos de canales externos** (por ejemplo, una exportación de registro
MPM). Coloca un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o más archivos JSON (delimitados por coma/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados de la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de instalación de proveedores exponen
hechos normalizados de origen de instalación junto al bloque bruto `openclaw.install`. Los
hechos normalizados identifican si la especificación npm es una versión exacta o un
selector flotante, si están presentes los metadatos de integridad esperados y si también
hay disponible una ruta de origen local. Cuando se conoce la identidad de catálogo/paquete, los
hechos normalizados advierten si el nombre del paquete npm analizado se desvía de esa identidad.
También advierten cuando `defaultChoice` no es válido o apunta a un origen que
no está disponible, y cuando hay metadatos de integridad npm sin un origen npm válido.
Los consumidores deben tratar `installSource` como un campo opcional aditivo para que
las entradas creadas manualmente y los adaptadores de catálogo no tengan que sintetizarlo.
Esto permite que la incorporación y los diagnósticos expliquen el estado del plano de origen sin
importar el runtime del Plugin.

Las entradas npm externas oficiales deben preferir un `npmSpec` exacto más
`expectedIntegrity`. Los nombres de paquete simples y las etiquetas de distribución siguen funcionando por
compatibilidad, pero muestran advertencias del plano de origen para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas por integridad sin romper Plugins existentes.
Cuando la incorporación instala desde una ruta de catálogo local, registra una entrada de índice de Plugin
gestionado con `source: "path"` y un `sourcePath` relativo al espacio de trabajo
cuando sea posible. La ruta absoluta de carga operacional permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas de estaciones de trabajo locales
en la configuración duradera. Esto mantiene las instalaciones de desarrollo local visibles para los
diagnósticos del plano de origen sin añadir una segunda superficie bruta de divulgación de rutas del sistema de archivos.
El índice persistido de Plugins `plugins/installs.json` es la fuente de verdad de instalación
y puede actualizarse sin cargar módulos de runtime del Plugin.
Su mapa `installRecords` es duradero incluso cuando falta un manifiesto de Plugin o
no es válido; su matriz `plugins` es una vista de manifiesto reconstruible.

## Plugins de motor de contexto

Los Plugins de motor de contexto poseen la orquestación del contexto de sesión para ingesta, ensamblaje
y Compaction. Regístralos desde tu Plugin con
`api.registerContextEngine(id, factory)`, luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Usa esto cuando tu Plugin necesite reemplazar o ampliar la canalización de contexto
predeterminada en lugar de solo añadir búsqueda de memoria o hooks.

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

## Añadir una nueva capacidad

Cuando un Plugin necesite comportamiento que no encaje en la API actual, no eludas
el sistema de Plugins con un acceso privado. Añade la capacidad que falta.

Secuencia recomendada:

1. define el contrato del núcleo
   Decide qué comportamiento compartido debe poseer el núcleo: política, fallback, fusión de configuración,
   ciclo de vida, semántica de cara al canal y forma del ayudante de runtime.
2. añade superficies tipadas de registro/runtime de Plugin
   Extiende `OpenClawPluginApi` y/o `api.runtime` con la superficie de capacidad tipada
   útil más pequeña.
3. conecta el núcleo + consumidores de canal/funcionalidad
   Los canales y Plugins de funcionalidad deben consumir la nueva capacidad a través del núcleo,
   no importando directamente una implementación de proveedor.
4. registra implementaciones de proveedores
   Los Plugins de proveedor registran entonces sus backends contra la capacidad.
5. añade cobertura de contrato
   Añade pruebas para que la propiedad y la forma de registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw se mantiene con criterio sin quedar codificado rígidamente según la visión
de un solo proveedor. Consulta el [Recetario de capacidades](/es/plugins/adding-capabilities)
para ver una lista de comprobación concreta de archivos y un ejemplo desarrollado.

### Lista de comprobación de capacidades

Cuando añadas una nueva capacidad, la implementación normalmente debería tocar estas
superficies juntas:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- ejecutor/ayudante de runtime del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de la API del Plugin en `src/plugins/types.ts`
- cableado del registro de Plugins en `src/plugins/registry.ts`
- exposición del runtime del Plugin en `src/plugins/runtime/*` cuando los Plugins de funcionalidad/canal
  necesiten consumirlo
- ayudantes de captura/prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación de operador/Plugin en `docs/`

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

Patrón de prueba de contrato:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Eso mantiene la regla simple:

- el núcleo posee el contrato de capacidad + la orquestación
- los Plugins de proveedor poseen las implementaciones de proveedor
- los Plugins de funcionalidad/canal consumen ayudantes de runtime
- las pruebas de contrato mantienen explícita la propiedad

## Relacionado

- [Arquitectura de Plugins](/es/plugins/architecture) — modelo público de capacidades y formas
- [Subrutas del SDK de Plugins](/es/plugins/sdk-subpaths)
- [Configuración del SDK de Plugins](/es/plugins/sdk-setup)
- [Crear Plugins](/es/plugins/building-plugins)
