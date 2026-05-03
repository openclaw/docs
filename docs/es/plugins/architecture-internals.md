---
read_when:
    - Implementación de puntos de enlace en tiempo de ejecución de proveedores, ciclo de vida de canales o conjuntos de paquetes
    - Depuración del orden de carga del Plugin o del estado del registro
    - Añadir una nueva capacidad de Plugin o un Plugin de motor de contexto
summary: 'Componentes internos de la arquitectura de Plugin: canalización de carga, registro, puntos de enlace de tiempo de ejecución, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para el modelo público de capacidades, las formas de Plugin y los contratos de propiedad/ejecución,
consulta [Arquitectura de Plugin](/es/plugins/architecture). Esta página es la
referencia para la mecánica interna: canalización de carga, registro, hooks de runtime,
rutas HTTP de Gateway, rutas de importación y tablas de esquemas.

## Canalización de carga

Al iniciar, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de plugins
2. lee manifiestos de paquetes nativos o compatibles y metadatos del paquete
3. rechaza candidatos inseguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga módulos nativos habilitados: los módulos empaquetados compilados usan un cargador nativo;
   el código fuente TypeScript local de terceros usa la reserva de emergencia Jiti
7. llama a los hooks nativos `register(api)` y recopila registros en el registro de plugins
8. expone el registro a comandos/superficies de runtime

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins empaquetados usan `register`; prefiere `register` para plugins nuevos.
</Note>

Las puertas de seguridad ocurren **antes** de la ejecución de runtime. Los candidatos se bloquean
cuando la entrada escapa de la raíz del plugin, la ruta es escribible por todos, o la propiedad de la ruta
parece sospechosa para plugins no empaquetados.

Los candidatos bloqueados permanecen vinculados a su id de plugin para diagnóstico. Si la configuración
todavía referencia ese id, la validación reporta el plugin como presente pero bloqueado
y remite a la advertencia de seguridad de ruta en lugar de tratar la entrada de configuración
como obsoleta.

### Comportamiento con manifiesto primero

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/skills/esquema de configuración declarados o capacidades del paquete
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/marcadores de posición de la Control UI
- mostrar metadatos de instalación/catálogo
- conservar descriptores baratos de activación y configuración sin cargar el runtime del plugin

Para plugins nativos, el módulo de runtime es la parte del plano de datos. Registra
comportamiento real como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores solo de metadatos para la planificación de activación y el descubrimiento de configuración;
no reemplazan el registro de runtime, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan indicios de comandos, canales y proveedores del manifiesto
para acotar la carga de plugins antes de una materialización más amplia del registro:

- la carga de la CLI se acota a plugins que poseen el comando primario solicitado
- la configuración/resolución de plugins de canal se acota a plugins que poseen el
  id de canal solicitado
- la configuración/resolución de runtime de proveedor explícita se acota a plugins que poseen el
  id de proveedor solicitado
- la planificación de inicio de Gateway usa `activation.onStartup` para importaciones
  explícitas de inicio y exclusiones de inicio; los plugins sin metadatos de inicio cargan solo
  mediante desencadenadores de activación más acotados

Las precargas de runtime en tiempo de solicitud que piden el alcance amplio `all` aún derivan un
conjunto efectivo explícito de ids de plugin a partir de la configuración, la planificación de inicio, los
canales configurados, slots y reglas de habilitación automática. Si ese conjunto derivado está vacío, OpenClaw
carga un registro de runtime vacío en lugar de ampliarlo a todos los plugins detectables.

El planificador de activación expone tanto una API de solo ids para llamadores existentes como una
API de plan para nuevos diagnósticos. Las entradas del plan informan por qué se seleccionó un plugin,
separando indicios explícitos del planificador `activation.*` de respaldo de propiedad del manifiesto
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` y hooks. Esa separación de razón es el límite de compatibilidad:
los metadatos de plugins existentes siguen funcionando, mientras que el código nuevo puede detectar indicios amplios
o comportamiento de respaldo sin cambiar la semántica de carga de runtime.

El descubrimiento de configuración ahora prefiere ids propiedad de descriptores como `setup.providers` y
`setup.cliBackends` para acotar plugins candidatos antes de recurrir a
`setup-api` para plugins que aún necesitan hooks de runtime en tiempo de configuración. Las listas de
configuración de proveedores usan `providerAuthChoices` del manifiesto, opciones de configuración derivadas de descriptores
y metadatos del catálogo de instalación sin cargar el runtime del proveedor. Un
`setup.requiresRuntime: false` explícito es un corte solo de descriptor; un
`requiresRuntime` omitido conserva la reserva heredada de setup-api por compatibilidad. Si más
de un plugin descubierto reclama el mismo id normalizado de proveedor de configuración o backend de CLI,
la búsqueda de configuración rechaza el propietario ambiguo en lugar de depender del
orden de descubrimiento. Cuando el runtime de configuración se ejecuta, los diagnósticos del registro informan
deriva entre `setup.providers` / `setup.cliBackends` y los proveedores o backends de CLI
registrados por setup-api sin bloquear plugins heredados.

### Límite de caché de plugins

OpenClaw no almacena en caché resultados de descubrimiento de plugins ni datos directos del registro de manifiestos
detrás de ventanas de reloj de pared. Las instalaciones, ediciones de manifiesto y cambios de rutas de carga
deben hacerse visibles en la siguiente lectura explícita de metadatos o reconstrucción de snapshot.
El analizador de archivos de manifiesto puede mantener una caché acotada de firma de archivo basada en la
ruta de manifiesto abierta, inode, tamaño y marcas de tiempo; esa caché solo evita
volver a analizar bytes sin cambios y no debe almacenar en caché respuestas de descubrimiento, registro, propietario ni
política.

La ruta rápida segura de metadatos es la propiedad explícita de objetos, no una caché oculta.
Las rutas críticas de inicio de Gateway deben pasar el `PluginMetadataSnapshot` actual, la
`PluginLookUpTable` derivada o un registro de manifiestos explícito por la cadena de llamadas.
La validación de configuración, la habilitación automática de inicio, el arranque de plugins y la selección de proveedores
pueden reutilizar esos objetos mientras representan la configuración y el inventario de plugins actuales.
La búsqueda de configuración todavía reconstruye metadatos de manifiesto bajo demanda
a menos que la ruta específica de configuración reciba un registro de manifiestos explícito; mantenlo
como reserva de ruta fría en lugar de agregar cachés ocultas de búsqueda. Cuando cambie la entrada,
reconstruye y reemplaza el snapshot en lugar de mutarlo o conservar copias
históricas.
Las vistas sobre el registro activo de plugins y los helpers de arranque de canales empaquetados
deben recalcularse a partir del registro/raíz actual. Los mapas de corta duración están bien
dentro de una llamada para deduplicar trabajo o proteger la reentrada; no deben convertirse en cachés de
metadatos de proceso.

Para la carga de plugins, la capa de caché persistente es la carga de runtime. Puede reutilizar
estado del cargador cuando el código o los artefactos instalados se cargan realmente, como:

- `PluginLoaderCacheState` y registros de runtime activos compatibles
- cachés de jiti/módulos y cachés de cargador de superficie pública usadas para evitar importar
  la misma superficie de runtime repetidamente
- cachés del sistema de archivos para artefactos de plugins instalados
- mapas de corta duración por llamada para normalización de rutas o resolución de duplicados

Esas cachés son detalles de implementación del plano de datos. No deben responder
preguntas del plano de control como "¿qué plugin posee este proveedor?" a menos que el
llamador haya pedido deliberadamente carga de runtime.

No agregues cachés persistentes ni de reloj de pared para:

- resultados de descubrimiento
- registros directos de manifiestos
- registros de manifiestos reconstruidos a partir del índice de plugins instalados
- búsqueda de propietario de proveedor, supresión de modelos, política de proveedor o metadatos de artefactos
  públicos
- cualquier otra respuesta derivada del manifiesto donde un manifiesto cambiado, índice instalado
  o ruta de carga deba ser visible en la siguiente lectura de metadatos

Los llamadores que reconstruyen metadatos de manifiesto a partir del índice persistido de plugins instalados
reconstruyen ese registro bajo demanda. El índice instalado es estado durable del plano fuente;
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
- manejadores RPC de gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad de plugins

Luego las funciones del núcleo leen de ese registro en lugar de hablar directamente con módulos de plugins.
Esto mantiene la carga en una sola dirección:

- módulo de plugin -> registro en el registro
- runtime del núcleo -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo
necesitan un punto de integración: "leer el registro", no "hacer casos especiales para cada módulo de plugin".

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
- `request`: el resumen de la solicitud original, indicio de desvinculación, id del remitente y
  metadatos de conversación

Este callback es solo de notificación. No cambia quién tiene permitido vincular una
conversación y se ejecuta después de que finalice el manejo de aprobación del núcleo.

## Hooks de runtime de proveedor

Los plugins de proveedor tienen tres capas:

- **Metadatos de manifiesto** para búsquedas baratas previas al runtime:
  `setup.providers[].envVars`, compatibilidad obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks en tiempo de configuración**: `catalog` (`discovery` heredado) más
  `applyConfigDefaults`.
- **Hooks de runtime**: más de 40 hooks opcionales que cubren autenticación, resolución de modelos,
  envoltura de streams, niveles de razonamiento, política de reproducción y endpoints de uso. Consulta
  la lista completa en [Orden y uso de hooks](#hook-order-and-usage).

OpenClaw sigue siendo dueño del bucle genérico del agente, failover, manejo de transcripciones y
política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico de proveedor
sin necesitar un transporte de inferencia completamente personalizado.

Usa `setup.providers[].envVars` del manifiesto cuando el proveedor tenga credenciales basadas en env
que las rutas genéricas de auth/estado/selector de modelos deban ver sin
cargar el runtime del plugin. El `providerAuthEnvVars` obsoleto todavía lo lee el
adaptador de compatibilidad durante la ventana de obsolescencia, y los plugins no empaquetados
que lo usan reciben un diagnóstico de manifiesto. Usa `providerAuthAliases` del manifiesto
cuando un id de proveedor deba reutilizar variables env, perfiles de auth,
auth respaldada por configuración y opción de onboarding de clave API de otro id de proveedor. Usa `providerAuthChoices` del manifiesto
cuando las superficies de CLI de onboarding/opción de auth deban conocer el
id de opción del proveedor, etiquetas de grupo y cableado de auth sencillo de una sola bandera sin
cargar el runtime del proveedor. Conserva
`envVars` de runtime del proveedor para indicios orientados al operador como etiquetas de onboarding o variables de configuración
de client-id/client-secret de OAuth.

Usa `channelEnvVars` del manifiesto cuando un canal tenga auth o configuración basada en env que
la reserva genérica de shell-env, las comprobaciones de configuración/estado o los prompts de configuración deban ver
sin cargar el runtime del canal.

### Orden y uso de hooks

Para plugins de modelo/proveedor, OpenClaw llama a los hooks en este orden aproximado.
La columna "Cuándo usar" es la guía rápida de decisión.
Los campos de proveedor solo de compatibilidad que OpenClaw ya no llama, como
`ProviderPlugin.capabilities` y `suppressBuiltInModel`, se omiten intencionadamente
aquí.

| #   | Hook                              | Qué hace                                                                                                      | Cuándo usarlo                                                                                                                                 |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`           | El proveedor posee un catálogo o valores predeterminados de URL base                                                                          |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales de configuración propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de la familia de modelos del proveedor              |
| --  | _(búsqueda de modelo integrada)_  | OpenClaw prueba primero la ruta normal de registro/catálogo                                                   | _(no es un hook de plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de id de modelo antes de la búsqueda                              | El proveedor posee la limpieza de alias antes de la resolución canónica del modelo                                                            |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia de proveedores antes del ensamblaje genérico del modelo             | El proveedor posee la limpieza de transporte para ids de proveedor personalizados en la misma familia de transporte                            |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución en tiempo de ejecución/proveedor                     | El proveedor necesita limpieza de configuración que debe vivir con el Plugin; los helpers incluidos de la familia Google también respaldan entradas de configuración de Google compatibles |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a proveedores de configuración               | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por el endpoint                                         |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación con marcador de entorno para proveedores de configuración antes de cargar la autenticación en tiempo de ejecución | El proveedor tiene resolución de clave API con marcador de entorno propiedad del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcadores de entorno de AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/autohospedada o respaldada por configuración sin persistir texto plano             | El proveedor puede operar con un marcador de credencial sintético/local                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externos propiedad del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales propiedad de la CLI/app | El proveedor reutiliza credenciales de autenticación externas sin persistir tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Baja la prioridad de marcadores de posición de perfil sintéticos almacenados frente a autenticación respaldada por entorno/configuración | El proveedor almacena perfiles de marcador de posición sintéticos que no deberían ganar precedencia                                           |
| 11  | `resolveDynamicModel`             | Respaldo síncrono para ids de modelo propiedad del proveedor que aún no están en el registro local            | El proveedor acepta ids de modelo ascendentes arbitrarios                                                                                     |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` vuelve a ejecutarse                                      | El proveedor necesita metadatos de red antes de resolver ids desconocidos                                                                     |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor integrado use el modelo resuelto                                   | El proveedor necesita reescrituras de transporte, pero aún usa un transporte del núcleo                                                       |
| 14  | `contributeResolvedModelCompat`   | Aporta marcas de compatibilidad para modelos de proveedor detrás de otro transporte compatible                | El proveedor reconoce sus propios modelos en transportes proxy sin tomar control del proveedor                                                |
| 15  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el ejecutor integrado los vea                                 | El proveedor necesita limpieza de esquemas de la familia de transporte                                                                        |
| 16  | `inspectToolSchemas`              | Expone diagnósticos de esquema propiedad del proveedor después de la normalización                             | El proveedor quiere advertencias de palabras clave sin enseñar al núcleo reglas específicas del proveedor                                     |
| 17  | `resolveReasoningOutputMode`      | Selecciona contrato de salida de razonamiento nativo frente a etiquetado                                      | El proveedor necesita razonamiento/salida final etiquetados en lugar de campos nativos                                                        |
| 18  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de envoltorios genéricos de opciones de stream                 | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                          |
| 19  | `createStreamFn`                  | Reemplaza por completo la ruta normal de stream con un transporte personalizado                               | El proveedor necesita un protocolo de cable personalizado, no solo un envoltorio                                                              |
| 20  | `wrapStreamFn`                    | Envoltorio de stream después de aplicar los envoltorios genéricos                                             | El proveedor necesita envoltorios de compatibilidad de encabezados/cuerpo/modelo de solicitud sin un transporte personalizado                 |
| 21  | `resolveTransportTurnState`       | Adjunta encabezados o metadatos nativos de transporte por turno                                               | El proveedor quiere que los transportes genéricos envíen identidad de turno nativa del proveedor                                              |
| 22  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados nativos de WebSocket o una política de enfriamiento de sesión                             | El proveedor quiere que los transportes WS genéricos ajusten encabezados de sesión o política de respaldo                                     |
| 23  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` en tiempo de ejecución | El proveedor almacena metadatos de autenticación adicionales y necesita una forma personalizada de token en tiempo de ejecución               |
| 24  | `refreshOAuth`                    | Anulación de actualización OAuth para endpoints de actualización personalizados o política de fallo de actualización | El proveedor no encaja con los actualizadores compartidos de `pi-ai`                                                                          |
| 25  | `buildAuthDoctorHint`             | Sugerencia de reparación añadida cuando falla la actualización OAuth                                          | El proveedor necesita orientación de reparación de autenticación propiedad del proveedor después de un fallo de actualización                  |
| 26  | `matchesContextOverflowError`     | Coincidencia de desbordamiento de ventana de contexto propiedad del proveedor                                 | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas pasarían por alto                                     |
| 27  | `classifyFailoverReason`          | Clasificación de motivo de conmutación por error propiedad del proveedor                                      | El proveedor puede asignar errores sin procesar de API/transporte a límite de tasa/sobrecarga/etc.                                           |
| 28  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                  | El proveedor necesita control de TTL de caché específico de proxy                                                                             |
| 29  | `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por autenticación faltante                                   | El proveedor necesita una sugerencia de recuperación de autenticación faltante específica del proveedor                                       |
| 30  | `augmentModelCatalog`             | Filas sintéticas/finales de catálogo añadidas después del descubrimiento                                      | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                                |
| 31  | `resolveThinkingProfile`          | Conjunto de niveles `/think` específico del modelo, etiquetas de visualización y valor predeterminado         | El proveedor expone una escala de pensamiento personalizada o una etiqueta binaria para modelos seleccionados                                 |
| 32  | `isBinaryThinking`                | Hook de compatibilidad de alternancia de razonamiento activado/desactivado                                    | El proveedor expone solo pensamiento binario activado/desactivado                                                                            |
| 33  | `supportsXHighThinking`           | Hook de compatibilidad de soporte de razonamiento `xhigh`                                                     | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                                 |
| 34  | `resolveDefaultThinkingLevel`     | Hook de compatibilidad de nivel `/think` predeterminado                                                       | El proveedor posee la política `/think` predeterminada para una familia de modelos                                                            |
| 35  | `isModernModelRef`                | Coincidencia de modelo moderno para filtros de perfil en vivo y selección de smoke                            | El proveedor posee la coincidencia de modelo preferido en vivo/smoke                                                                          |
| 36  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real en tiempo de ejecución justo antes de la inferencia | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                                 |
| 37  | `resolveUsageAuth`                | Resolver las credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                                     | El proveedor necesita análisis personalizado del token de uso/cuota o una credencial de uso diferente                                                               |
| 38  | `fetchUsageSnapshot`              | Obtener y normalizar instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación                             | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de carga útil                                                                           |
| 39  | `createEmbeddingProvider`         | Crear un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                                                     | El comportamiento de embeddings de memoria pertenece al Plugin del proveedor                                                                                    |
| 40  | `buildReplayPolicy`               | Devolver una política de reproducción que controle el manejo de transcripciones para el proveedor                                        | El proveedor necesita una política de transcripción personalizada (por ejemplo, eliminación de bloques de razonamiento)                                                               |
| 41  | `sanitizeReplayHistory`           | Reescribir el historial de reproducción después de la limpieza genérica de transcripciones                                                        | El proveedor necesita reescrituras de reproducción específicas del proveedor más allá de los ayudantes compartidos de Compaction                                                             |
| 42  | `validateReplayTurns`             | Validación final de turnos de reproducción o reformulación antes del ejecutor embebido                                           | El transporte del proveedor necesita una validación de turnos más estricta después del saneamiento genérico                                                                    |
| 43  | `onModelSelected`                 | Ejecutar efectos secundarios posteriores a la selección propiedad del proveedor                                                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo se vuelve activo                                                                  |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
Plugin proveedor coincidente y luego continúan con otros Plugins proveedores con
capacidad de hooks hasta que alguno cambia realmente el id del modelo o el
transporte/configuración. Eso mantiene funcionando los shims de proveedor de
alias/compatibilidad sin exigir que el llamador sepa qué Plugin incluido posee
la reescritura. Si ningún hook de proveedor reescribe una entrada de configuración
compatible de la familia Google, el normalizador de configuración de Google
incluido sigue aplicando esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de red totalmente personalizado o un
ejecutor de solicitudes personalizado, eso pertenece a otra clase de extensión.
Estos hooks son para comportamiento de proveedor que todavía se ejecuta en el
bucle de inferencia normal de OpenClaw.

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

Los Plugins proveedores incluidos combinan los hooks anteriores para ajustarse al
catálogo, autenticación, pensamiento, reproducción y necesidades de uso de cada
proveedor. El conjunto de hooks autoritativo vive con cada Plugin bajo
`extensions/`; esta página ilustra las formas en lugar de reflejar la lista.

<AccordionGroup>
  <Accordion title="Proveedores con catálogo de paso directo">
    OpenRouter, Kilocode, Z.AI, xAI registran `catalog` además de
    `resolveDynamicModel` / `prepareDynamicModel` para que puedan exponer ids de
    modelos ascendentes antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Proveedores de OAuth y endpoints de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para encargarse del intercambio de tokens y la integración
    con `/usage`.
  </Accordion>
  <Accordion title="Familias de reproducción y limpieza de transcripciones">
    Las familias compartidas con nombre (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los proveedores
    adopten la política de transcripción mediante `buildReplayPolicy` en lugar de
    que cada Plugin vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Proveedores solo de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran solo `catalog` y usan el bucle de inferencia compartido.
  </Accordion>
  <Accordion title="Helpers de streaming específicos de Anthropic">
    Las cabeceras beta, `/fast` / `serviceTier` y `context1m` viven dentro de la
    frontera pública `api.ts` / `contract-api.ts` del Plugin de Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) en lugar de estar en
    el SDK genérico.
  </Accordion>
</AccordionGroup>

## Helpers de runtime

Los Plugins pueden acceder a helpers de núcleo seleccionados mediante `api.runtime`. Para TTS:

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
- Devuelve un búfer de audio PCM + frecuencia de muestreo. Los Plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úselo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos, como configuración regional, género y etiquetas de personalidad para selectores conscientes del proveedor.
- OpenAI y ElevenLabs admiten telefonía actualmente. Microsoft no.

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

- Mantenga la política de TTS, el fallback y la entrega de respuestas en el núcleo.
- Use proveedores de voz para el comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a empresas: un Plugin de proveedor puede poseer proveedores de texto, voz, imagen y medios futuros a medida que OpenClaw agrega esos contratos de capacidad.

Para comprensión de imágenes/audio/video, los Plugins registran un proveedor tipado
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

- Mantenga la orquestación, el fallback, la configuración y el cableado de canales en el núcleo.
- Mantenga el comportamiento del proveedor en el Plugin proveedor.
- La expansión aditiva debe permanecer tipada: nuevos métodos opcionales, nuevos campos de resultado opcionales, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo posee el contrato de capacidad y el helper de runtime
  - los Plugins proveedores registran `api.registerVideoGenerationProvider(...)`
  - los Plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para helpers de runtime de comprensión de medios, los Plugins pueden llamar a:

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

Para transcripción de audio, los Plugins pueden usar el runtime de comprensión de
medios o el alias STT anterior:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` es la superficie compartida preferida para la comprensión de imágenes/audio/video.
- Usa la configuración central de audio de comprensión de medios (`tools.media.audio`) y el orden de fallback de proveedores.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidad.

Los Plugins también pueden lanzar ejecuciones de subagentes en segundo plano mediante `api.runtime.subagent`:

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
- Para ejecuciones de fallback propiedad de Plugins, los operadores deben aceptarlas con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir Plugins de confianza a objetivos canónicos `provider/model` específicos, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagentes de Plugins no confiables siguen funcionando, pero las solicitudes de sobrescritura se rechazan en lugar de volver silenciosamente al valor predeterminado.
- Las sesiones de subagente creadas por Plugins se etiquetan con el id del Plugin creador. El fallback `api.runtime.subagent.deleteSession(...)` puede eliminar solo esas sesiones propias; la eliminación arbitraria de sesiones aún requiere una solicitud de Gateway con alcance de administrador.

Para búsqueda web, los Plugins pueden consumir el helper de runtime compartido en
lugar de acceder al cableado de herramientas del agente:

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

- Mantenga la selección de proveedor, la resolución de credenciales y la semántica compartida de solicitudes en el núcleo.
- Use proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para Plugins de función/canal que necesitan comportamiento de búsqueda sin depender del wrapper de herramienta del agente.

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
- `listProviders(...)`: enumera los proveedores de generación de imágenes disponibles y sus capacidades.

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

- `path`: ruta bajo el servidor HTTP de Gateway.
- `auth`: obligatorio. Use `"gateway"` para exigir la autenticación normal de Gateway, o `"plugin"` para autenticación/verificación de Webhook gestionada por el Plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo Plugin reemplace su propio registro de ruta existente.
- `handler`: devuelva `true` cuando la ruta haya gestionado la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error de carga de plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de Plugin deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Las rutas solapadas con niveles de `auth` distintos se rechazan. Mantén las cadenas de continuación `exact`/`prefix` solo en el mismo nivel de auth.
- Las rutas `auth: "plugin"` **no** reciben automáticamente ámbitos de runtime del operador. Son para webhooks gestionados por plugins/verificación de firmas, no para llamadas privilegiadas a helpers del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un ámbito de runtime de solicitud del Gateway, pero ese ámbito es intencionalmente conservador:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los ámbitos de runtime de rutas de plugin fijados en `operator.write`, incluso si quien llama envía `x-openclaw-scopes`
  - los modos HTTP confiables que llevan identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingreso privado) respetan `x-openclaw-scopes` solo cuando el encabezado está explícitamente presente
  - si `x-openclaw-scopes` está ausente en esas solicitudes de rutas de plugin que llevan identidad, el ámbito de runtime vuelve a `operator.write`
- Regla práctica: no asumas que una ruta de plugin con auth de gateway es una superficie de administración implícita. Si tu ruta necesita comportamiento exclusivo de administrador, exige un modo de autenticación que lleve identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del SDK de Plugin

Usa subrutas estrechas del SDK en lugar del barrel raíz monolítico `openclaw/plugin-sdk`
al crear nuevos plugins. Subrutas principales:

| Subruta                             | Propósito                                          |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/compilación de canal            |
| `openclaw/plugin-sdk/core`          | Helpers compartidos genéricos y contrato paraguas  |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los plugins de canal eligen entre una familia de uniones estrechas: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un contrato `approvalCapability` en lugar de mezclarse entre campos de plugin no relacionados.
Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).

Los helpers de runtime y configuración viven bajo subrutas enfocadas `*-runtime`
coincidentes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefiere `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation`
en lugar del amplio barrel de compatibilidad `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
y `openclaw/plugin-sdk/infra-runtime` son shims de compatibilidad obsoletos para
plugins antiguos. El código nuevo debe importar primitivas genéricas más estrechas en su lugar.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de plugin incluido):

- `index.js` — entrada del plugin incluido
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel solo de runtime
- `setup-entry.js` — entrada del plugin de configuración

Los plugins externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes `src/*` de otro paquete de plugin desde el core ni desde otro plugin.
Los puntos de entrada cargados por fachada prefieren la instantánea activa de configuración de runtime cuando existe,
y luego recurren al archivo de configuración resuelto en disco.

Existen subrutas específicas de capacidad como `image-generation`, `media-understanding`
y `speech` porque los plugins incluidos las usan hoy. No son contratos externos
automáticamente congelados a largo plazo; revisa la página de referencia del SDK
correspondiente cuando dependas de ellas.

## Esquemas de herramientas de mensajes

Los plugins deben poseer las contribuciones de esquema `describeMessageTool(...)`
específicas del canal para primitivas no relacionadas con mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envío debe usar el contrato genérico `MessagePresentation`
en lugar de campos de botones, componentes, bloques o tarjetas nativos del proveedor.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para el contrato,
las reglas de fallback, el mapeo de proveedores y la lista de verificación para autores de plugins.

Los plugins capaces de enviar declaran lo que pueden renderizar mediante capacidades de mensaje:

- `presentation` para bloques de presentación semántica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El core decide si renderiza la presentación de forma nativa o la degrada a texto.
No expongas vías de escape de UI nativas del proveedor desde la herramienta genérica de mensajes.
Los helpers obsoletos del SDK para esquemas nativos heredados siguen exportándose para plugins
de terceros existentes, pero los plugins nuevos no deben usarlos.

## Resolución de destinos de canal

Los plugins de canal deben poseer la semántica de destinos específica del canal. Mantén el host
de salida compartido genérico y usa la superficie del adaptador de mensajería para reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de buscar en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al core si una
  entrada debe saltar directamente a una resolución similar a id en lugar de buscar en el directorio.
- `messaging.targetResolver.resolveTarget(...)` es el fallback del plugin cuando
  el core necesita una resolución final propiedad del proveedor después de la normalización o tras una
  ausencia en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` posee la construcción de rutas de sesión
  específica del proveedor una vez resuelto un destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deban ocurrir antes
  de buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de "tratar esto como un id de destino explícito/nativo".
- Usa `resolveTarget` para fallback de normalización específico del proveedor, no para
  búsqueda amplia en el directorio.
- Mantén ids nativos del proveedor, como ids de chat, ids de hilo, JIDs, handles e ids de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio desde la configuración deben mantener esa lógica en el
plugin y reutilizar los helpers compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Usa esto cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares de DM impulsados por lista de permitidos
- mapas de canales/grupos configurados
- fallbacks de directorio estático con ámbito de cuenta

Los helpers compartidos en `directory-runtime` solo manejan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- helpers de deduplicación/normalización
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
o metadatos de modelo protegidos por auth.

`catalog.order` controla cuándo se fusiona el catálogo de un plugin en relación con los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples impulsados por clave de API o env
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en colisiones de clave, por lo que los plugins pueden sobrescribir intencionalmente una
entrada de proveedor integrada con el mismo id de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`

## Inspección de canal de solo lectura

Si tu plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de runtime. Puede asumir que las credenciales
  están completamente materializadas y puede fallar rápido cuando falten secretos requeridos.
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
- No necesitas devolver valores de token sin procesar solo para informar
  disponibilidad de solo lectura. Devolver `tokenStatus: "available"` (y el campo
  de origen correspondiente) es suficiente para comandos de estilo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen "configurado pero no disponible en esta ruta
de comando" en lugar de fallar o informar incorrectamente que la cuenta no está configurada.

## Packs de paquete

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

Cada entrada se convierte en un plugin. Si el pack enumera varias extensiones, el id del plugin
pasa a ser `name/<fileBase>`.

Si tu plugin importa dependencias de npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Barandilla de seguridad: cada entrada `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de resolver enlaces simbólicos. Las entradas que escapan del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala las dependencias del plugin con un
`npm install --omit=dev --ignore-scripts` local al proyecto (sin scripts de ciclo de vida,
sin dependencias de desarrollo en runtime), ignorando la configuración global heredada de instalación de npm.
Mantén los árboles de dependencias de plugins como "JS/TS puro" y evita paquetes que requieran
compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún sin configurar, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto mantiene más ligeros el inicio y la configuración
cuando tu entrada principal de plugin también conecta herramientas, hooks u otro código solo de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un plugin de canal opte por la misma ruta `setupEntry` durante la fase
de inicio previa a la escucha del gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar todas las capacidades propiedad del canal de las que depende el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway empiece a escuchar
- cualquier método, herramienta o servicio del gateway que deba existir durante esa misma ventana

Si tu entrada completa aún posee alguna capacidad de inicio requerida, no habilites
esta marca. Mantén el plugin en el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar helpers de superficie de contrato solo de configuración que el core
puede consultar antes de que se cargue el runtime completo del canal. La superficie actual de
promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core usa esa superficie cuando necesita promover una configuración de canal heredada de una sola cuenta a `channels.<id>.accounts.*` sin cargar la entrada completa del Plugin. Matrix es el ejemplo empaquetado actual: mueve solo claves de autenticación/bootstrap a una cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede conservar una clave de cuenta predeterminada no canónica configurada en vez de crear siempre `accounts.default`.

Esos adaptadores de parches de configuración mantienen diferido el descubrimiento de la superficie de contrato empaquetada. El tiempo de importación permanece ligero; la superficie de promoción se carga solo en el primer uso en lugar de volver a entrar en el arranque del canal empaquetado durante la importación del módulo.

Cuando esas superficies de arranque incluyan métodos RPC de Gateway, mantenlos en un prefijo específico del Plugin. Los espacios de nombres administrativos de core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven como `operator.admin`, incluso si un Plugin solicita un alcance más limitado.

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

Los plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y sugerencias de instalación mediante `openclaw.install`. Esto mantiene el catálogo de core libre de datos.

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
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto para la superficie de selección
- `markdownCapable`: marca el canal como compatible con Markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de la documentación
- `showConfigured` / `showInSetup`: alias heredados aún aceptados por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: incorpora el canal al flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: exige vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver destinos de anuncio

OpenClaw también puede fusionar **catálogos de canales externos** (por ejemplo, una exportación de registro MPM). Coloca un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a uno o más archivos JSON (delimitados por comas, punto y coma o `PATH`). Cada archivo debe contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados para la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de instalación de proveedores exponen datos normalizados de origen de instalación junto al bloque `openclaw.install` sin procesar. Los datos normalizados identifican si la especificación npm es una versión exacta o un selector flotante, si están presentes los metadatos de integridad esperados y si también está disponible una ruta de origen local. Cuando se conoce la identidad de catálogo/paquete, los datos normalizados advierten si el nombre del paquete npm analizado diverge de esa identidad. También advierten cuando `defaultChoice` no es válido o apunta a una fuente no disponible, y cuando hay metadatos de integridad npm sin una fuente npm válida. Los consumidores deben tratar `installSource` como un campo opcional aditivo para que las entradas creadas manualmente y los adaptadores de catálogo no tengan que sintetizarlo. Esto permite que el onboarding y los diagnósticos expliquen el estado del plano de origen sin importar el runtime del Plugin.

Las entradas npm externas oficiales deben preferir un `npmSpec` exacto más `expectedIntegrity`. Los nombres de paquete simples y las etiquetas de distribución siguen funcionando por compatibilidad, pero muestran advertencias del plano de origen para que el catálogo pueda avanzar hacia instalaciones fijadas y verificadas por integridad sin romper los plugins existentes. Cuando el onboarding instala desde una ruta de catálogo local, registra una entrada administrada del índice de plugins con `source: "path"` y un `sourcePath` relativo al workspace cuando sea posible. La ruta de carga operativa absoluta permanece en `plugins.load.paths`; el registro de instalación evita duplicar rutas de estaciones de trabajo locales en la configuración de larga duración. Esto mantiene las instalaciones de desarrollo local visibles para los diagnósticos del plano de origen sin agregar una segunda superficie sin procesar de divulgación de rutas del sistema de archivos. El índice de plugins persistido `plugins/installs.json` es la fuente de verdad de instalación y puede actualizarse sin cargar módulos del runtime del Plugin. Su mapa `installRecords` es duradero incluso cuando falta un manifiesto de Plugin o no es válido; su arreglo `plugins` es una vista de manifiesto reconstruible.

## Plugins de motor de contexto

Los plugins de motor de contexto son dueños de la orquestación del contexto de sesión para ingesta, ensamblaje y Compaction. Regístralos desde tu Plugin con `api.registerContextEngine(id, factory)` y luego selecciona el motor activo con `plugins.slots.contextEngine`.

Usa esto cuando tu Plugin necesite reemplazar o extender la canalización de contexto predeterminada, no solo agregar búsqueda de memoria o hooks.

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

El `ctx` de fábrica expone valores opcionales `config`, `agentDir` y `workspaceDir` para inicialización en tiempo de construcción.

Si tu motor **no** es dueño del algoritmo de Compaction, mantén `compact()` implementado y delégalo explícitamente:

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

Cuando un Plugin necesita comportamiento que no encaja en la API actual, no eludas el sistema de plugins con un acceso privado. Agrega la capacidad faltante.

Secuencia recomendada:

1. define el contrato de core
   Decide qué comportamiento compartido debe poseer core: política, fallback, fusión de configuración, ciclo de vida, semántica de cara al canal y forma de los helpers de runtime.
2. agrega superficies tipadas de registro/runtime de Plugin
   Extiende `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada útil más pequeña de capacidad.
3. conecta core + consumidores de canal/funcionalidad
   Los canales y los plugins de funcionalidad deben consumir la nueva capacidad a través de core, no importando directamente una implementación de proveedor.
4. registra implementaciones de proveedores
   Los plugins de proveedor luego registran sus backends contra la capacidad.
5. agrega cobertura de contrato
   Agrega pruebas para que la propiedad y la forma de registro permanezcan explícitas con el tiempo.

Así es como OpenClaw se mantiene con opinión propia sin quedar codificado rígidamente a la visión del mundo de un único proveedor. Consulta el [recetario de capacidades](/es/plugins/architecture) para una lista concreta de archivos y un ejemplo trabajado.

### Lista de comprobación de capacidad

Cuando agregues una nueva capacidad, la implementación normalmente debería tocar estas superficies juntas:

- tipos de contrato de core en `src/<capability>/types.ts`
- helper de runner/runtime de core en `src/<capability>/runtime.ts`
- superficie de registro de API de Plugin en `src/plugins/types.ts`
- cableado del registro de plugins en `src/plugins/registry.ts`
- exposición del runtime de Plugin en `src/plugins/runtime/*` cuando los plugins de funcionalidad/canal necesitan consumirla
- helpers de captura/prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación de operador/Plugin en `docs/`

Si falta una de esas superficies, suele ser una señal de que la capacidad aún no está completamente integrada.

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

- core posee el contrato de capacidad + orquestación
- los plugins de proveedor poseen las implementaciones de proveedor
- los plugins de funcionalidad/canal consumen helpers de runtime
- las pruebas de contrato mantienen la propiedad explícita

## Relacionado

- [Arquitectura de Plugin](/es/plugins/architecture) — modelo y formas públicas de capacidad
- [Subrutas del SDK de Plugin](/es/plugins/sdk-subpaths)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
