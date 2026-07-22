---
read_when:
    - Implementación de hooks de runtime de proveedores, ciclo de vida de canales o paquetes de paquetes
    - Depuración del orden de carga de los plugins o del estado del registro
    - Añadir una nueva capacidad de Plugin o un Plugin de motor de contexto
summary: 'Aspectos internos de la arquitectura de Plugins: pipeline de carga, registro, hooks de tiempo de ejecución, rutas HTTP y tablas de referencia'
title: Detalles internos de la arquitectura de Plugins
x-i18n:
    generated_at: "2026-07-22T10:42:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 278ac23a9454ab69407c59fa197e75756fa0dc5880fcae6c3eecc15bd4733a09
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para el modelo público de capacidades, las estructuras de los plugins y los contratos de propiedad/ejecución, consulte [Arquitectura de plugins](/es/plugins/architecture). Esta página trata la mecánica interna: el pipeline de carga, el registro, los hooks de tiempo de ejecución, las rutas HTTP del Gateway, las rutas de importación y las tablas de esquemas.

## Pipeline de carga

Al iniciarse, OpenClaw hace aproximadamente lo siguiente:

1. descubre las raíces de plugins candidatas
2. lee los manifiestos de paquetes nativos o compatibles y los metadatos de los paquetes
3. rechaza los candidatos no seguros
4. normaliza la configuración de los plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. determina la habilitación de cada candidato
6. carga los módulos nativos habilitados: los módulos incluidos ya compilados usan un cargador nativo;
   el código fuente TypeScript local de terceros usa la alternativa de emergencia Jiti
7. invoca los hooks nativos `register(api)` y recopila los registros en el registro de plugins
8. expone el registro a los comandos y las superficies de tiempo de ejecución

Las barreras de seguridad se ejecutan **antes** de la ejecución en tiempo de ejecución. El descubrimiento bloquea un candidato cuando:

- su punto de entrada resuelto sale de la raíz del plugin
- su ruta (o su directorio raíz) permite escritura a cualquier usuario
- en el caso de plugins no incluidos, la propiedad de la ruta no coincide con el uid actual (o con root)

En los directorios incluidos que permiten escritura a cualquier usuario, primero se intenta una reparación local mediante `chmod` (las instalaciones globales o mediante npm pueden distribuir directorios de paquetes con `0777`) antes de volver a comprobar la barrera; las comprobaciones de propiedad se omiten por completo para el origen incluido.

Los candidatos bloqueados siguen incluyendo su id de plugin en el diagnóstico emitido cuando se conoce (incluidos los ids resueltos a partir de un manifiesto dentro de un directorio rechazado por otros motivos), de modo que una configuración que haga referencia a ese id vea un plugin bloqueado vinculado a una advertencia de seguridad de la ruta, en lugar de un error no relacionado de «plugin desconocido».

### Comportamiento basado primero en el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo utiliza para:

- identificar el plugin
- descubrir los canales, las Skills, el esquema de configuración o las capacidades del paquete declarados
- validar `plugins.entries.<id>.config`
- ampliar las etiquetas y los marcadores de posición de la interfaz de control
- mostrar los metadatos de instalación y catálogo
- conservar descriptores económicos de activación y configuración sin cargar el tiempo de ejecución del plugin

En los plugins nativos, el módulo de tiempo de ejecución constituye la parte del plano de datos. Registra el comportamiento real, como hooks, herramientas, comandos o flujos de proveedores.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control. Son descriptores que contienen únicamente metadatos para planificar la activación y descubrir la configuración; no sustituyen el registro en tiempo de ejecución, `register(...)` ni `setupEntry`. Los consumidores de activación en vivo utilizan las indicaciones de comandos, canales y proveedores del manifiesto para limitar la carga de plugins antes de una materialización más amplia del registro:

- la carga de la CLI se limita a los plugins propietarios del comando principal solicitado
- la configuración del canal y la resolución del plugin se limitan a los plugins propietarios del
  id de canal solicitado
- la configuración explícita del proveedor y la resolución en tiempo de ejecución se limitan a los plugins propietarios del
  id de proveedor solicitado
- la planificación del inicio del Gateway utiliza `activation.onStartup` para las importaciones explícitas
  de inicio; los plugins sin metadatos de inicio solo se cargan mediante
  desencadenadores de activación más específicos

El planificador de activación expone tanto una API que solo contiene ids para los consumidores existentes como una API de planificación para los diagnósticos. Las entradas del plan indican por qué se seleccionó un plugin y separan las indicaciones explícitas `activation.*` del mecanismo alternativo basado en la propiedad del manifiesto:

| Motivo (de las indicaciones `activation.*`)   | Motivo (de la propiedad del manifiesto)                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                            |
| — (el desencadenador del hook no tiene una variante de indicación) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

Esta separación de motivos es el límite de compatibilidad: los metadatos de plugins existentes siguen funcionando, mientras que el código nuevo puede detectar indicaciones amplias o comportamientos alternativos sin cambiar la semántica de carga en tiempo de ejecución.

Las precargas de tiempo de ejecución realizadas al procesar solicitudes que piden el ámbito amplio `all` siguen derivando de la configuración, la planificación del inicio, los canales configurados, los espacios y las reglas de habilitación automática un conjunto explícito de ids de plugins efectivos (`resolveEffectivePluginIds` en `src/plugins/effective-plugin-ids.ts`). Si ese conjunto derivado está vacío, OpenClaw mantiene vacío el ámbito en lugar de ampliarlo a todos los plugins detectables.

El descubrimiento de la configuración prioriza ids propiedad de los descriptores, como `setup.providers` y `setup.cliBackends`, para limitar los plugins candidatos antes de recurrir a `setup-api` para los plugins que aún necesitan hooks de tiempo de ejecución durante la configuración. Las listas de configuración de proveedores utilizan `providerAuthChoices` del manifiesto, las opciones de configuración derivadas de descriptores y los metadatos del catálogo de instalación sin cargar el tiempo de ejecución del proveedor. Un valor explícito de `setup.requiresRuntime: false` es un punto de corte que solo utiliza descriptores; si se omite `requiresRuntime`, se conserva por compatibilidad el mecanismo alternativo de la API de configuración heredada. Si más de un plugin descubierto reclama el mismo id normalizado de proveedor de configuración o backend de la CLI, la búsqueda de configuración rechaza al propietario ambiguo en lugar de depender del orden de descubrimiento. Cuando se ejecuta el tiempo de ejecución de configuración, los diagnósticos del registro informan de las discrepancias entre `setup.providers` / `setup.cliBackends` y los proveedores o backends de la CLI registrados realmente por la API de configuración, sin bloquear los plugins heredados.

### Límite de la caché de plugins

OpenClaw no almacena en caché los resultados del descubrimiento de plugins ni los datos directos del registro de manifiestos mediante intervalos de tiempo de reloj. Las instalaciones, las modificaciones de manifiestos y los cambios en las rutas de carga deben hacerse visibles en la siguiente lectura explícita de metadatos o reconstrucción de una instantánea. El analizador de archivos de manifiesto mantiene una caché limitada de firmas de archivos cuya clave se compone de la ruta del manifiesto abierto, el dispositivo/inodo, el tamaño y mtime/ctime; esa caché solo evita volver a analizar bytes sin cambios y no debe almacenar en caché respuestas de descubrimiento, registro, propietario ni política.

La vía rápida segura para los metadatos es la propiedad explícita de los objetos, no una caché oculta. Las rutas críticas de inicio del Gateway deben transmitir por la cadena de llamadas el `PluginMetadataSnapshot` actual, el `PluginLookUpTable` derivado o un registro de manifiestos explícito. La validación de la configuración, la habilitación automática al inicio, el arranque de los plugins y la selección de proveedores pueden reutilizar esos objetos mientras representen la configuración y el inventario de plugins actuales. La búsqueda de configuración sigue reconstruyendo los metadatos de los manifiestos bajo demanda, salvo que la ruta de configuración específica reciba un registro de manifiestos explícito; esto debe mantenerse como mecanismo alternativo para rutas no críticas en lugar de añadir cachés de búsqueda ocultas. Cuando cambien los datos de entrada, se debe reconstruir y sustituir la instantánea en lugar de modificarla o conservar copias históricas. Las vistas del registro de plugins activo y los auxiliares de arranque de canales incluidos deben volver a calcularse a partir del registro o la raíz actuales. Se pueden usar mapas de corta duración dentro de una sola llamada para deduplicar trabajo o evitar la reentrada; no deben convertirse en cachés de metadatos del proceso.

Para la carga de plugins, la capa de caché persistente corresponde a la carga del tiempo de ejecución. Puede reutilizar el estado del cargador cuando se carguen realmente el código o los artefactos instalados, por ejemplo:

- `PluginLoaderCacheState` y registros de tiempo de ejecución activos compatibles
- cachés de Jiti/módulos y cachés del cargador de superficies públicas utilizadas para evitar importar
  repetidamente la misma superficie de tiempo de ejecución
- cachés del sistema de archivos para artefactos de plugins instalados
- mapas por llamada de corta duración para normalizar rutas o resolver duplicados

Esas cachés son detalles de implementación del plano de datos. No deben responder preguntas del plano de control como «¿qué plugin es propietario de este proveedor?», salvo que el consumidor haya solicitado deliberadamente la carga del tiempo de ejecución.

No se deben añadir cachés persistentes ni basadas en intervalos de tiempo de reloj para:

- resultados del descubrimiento
- registros directos de manifiestos
- registros de manifiestos reconstruidos a partir del índice de plugins instalados
- la búsqueda del propietario de un proveedor, la supresión de modelos, la política de proveedores o los metadatos de artefactos
  públicos
- cualquier otra respuesta derivada de manifiestos para la que un manifiesto, índice de instalaciones
  o ruta de carga modificados deban hacerse visibles en la siguiente lectura de metadatos

Los consumidores que reconstruyen los metadatos de los manifiestos a partir del índice persistente de plugins instalados reconstruyen ese registro bajo demanda. El índice instalado es un estado duradero del plano de origen; no es una caché oculta de metadatos en proceso.

## Modelo de registro

Los plugins cargados no modifican directamente variables globales arbitrarias del núcleo. Se registran en un registro central de plugins (`PluginRegistry` en `src/plugins/registry-types.ts`), que lleva un seguimiento de los registros de plugins (identidad, fuente, origen, estado y diagnósticos), además de matrices para cada capacidad: herramientas, hooks heredados y tipados, canales, proveedores, controladores RPC del Gateway, rutas HTTP, registradores de la CLI, servicios en segundo plano, comandos propiedad de plugins y muchas más familias de proveedores tipadas (voz, embeddings, generación de imágenes, vídeos y música, obtención y búsqueda web, entornos de agentes, acciones de sesión, etc.).

A continuación, las funciones del núcleo leen ese registro en lugar de comunicarse directamente con los módulos de los plugins. Esto mantiene la carga en una sola dirección:

- módulo del plugin -> registro en el registro
- tiempo de ejecución del núcleo -> consumo del registro

Esta separación es importante para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo necesitan un punto de integración: «leer el registro», no «aplicar un caso especial a cada módulo de plugin».

## Callbacks de vinculación de conversaciones

Los plugins que vinculan una conversación pueden reaccionar cuando se resuelve una aprobación.

Utilice `api.onConversationBindingResolved(...)` para recibir un callback después de que se apruebe o deniegue una solicitud de vinculación:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Ahora existe una vinculación para este plugin y esta conversación.
        console.log(event.binding?.conversationId);
        return;
      }

      // La solicitud se denegó; se borra cualquier estado local pendiente.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos de la carga útil del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: la vinculación resuelta para las solicitudes aprobadas
- `request`: el resumen de la solicitud original, la indicación de desvinculación, el id del remitente y
  los metadatos de la conversación

Este callback solo sirve como notificación. No modifica quién tiene permiso para vincular una conversación y se ejecuta después de que finalice el procesamiento de la aprobación por parte del núcleo.

## Hooks de tiempo de ejecución de proveedores

Los plugins de proveedores tienen tres capas:

- **Metadatos del manifiesto** para una búsqueda económica antes del tiempo de ejecución:
  `setup.providers[].envVars`, `providerAuthAliases`, `providerAuthChoices`
  y `channelConfigs`.
- **Hooks durante la configuración**: `catalog` más `applyConfigDefaults`.
- **Hooks de tiempo de ejecución**: más de 40 hooks opcionales que abarcan la autenticación, la resolución de modelos,
  el encapsulado de flujos, los niveles de razonamiento, la política de repetición y los endpoints de uso. Consulte
  [Orden y uso de los hooks](#hook-order-and-usage).

OpenClaw sigue siendo responsable del bucle genérico del agente, la conmutación por error, la gestión de transcripciones y la
política de herramientas. Estos hooks constituyen la superficie de extensión para el comportamiento específico
del proveedor sin necesidad de un transporte de inferencia totalmente personalizado.

Use `setup.providers[].envVars` del manifiesto cuando el proveedor tenga
credenciales basadas en variables de entorno que las rutas genéricas de autenticación, estado y selector de modelos deban detectar sin
cargar el runtime del plugin. Use `providerAuthAliases`
del manifiesto cuando un id de proveedor deba reutilizar las variables de entorno, los perfiles de autenticación,
la autenticación respaldada por configuración y la opción de incorporación mediante clave de API de otro id de proveedor. Use
`providerAuthChoices` del manifiesto cuando las superficies de CLI para la incorporación y la elección de autenticación deban conocer el
id de opción del proveedor, las etiquetas de grupo y la configuración sencilla de autenticación mediante una sola opción
sin cargar el runtime del proveedor. Reserve
`envVars` del runtime del proveedor para indicaciones dirigidas al operador, como etiquetas de incorporación o variables
de configuración de id de cliente/secreto de cliente de OAuth.

Describa la configuración y la autenticación de canales basadas en variables de entorno mediante los descriptores
`channelConfigs.<id>.schema` y de configuración correspondientes.

### Orden y uso de los hooks

Para los plugins de modelos/proveedores, OpenClaw llama a los hooks aproximadamente en este orden.
La columna «Cuándo usarlo» es la guía rápida para tomar decisiones.
Los campos de proveedor exclusivos de compatibilidad que OpenClaw ya no invoca, como
`ProviderPlugin.capabilities` y `suppressBuiltInModel`, no se
incluyen aquí intencionadamente.

| Hook                              | Qué hace                                                                                                   | Cuándo usarlo                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`                                | El proveedor posee un catálogo o los valores predeterminados de la URL base                                                                                                  |
| `applyConfigDefaults`             | Aplica los valores predeterminados de configuración global propiedad del proveedor durante la materialización de la configuración                                      | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de la familia de modelos del proveedor                                                                         |
| _(búsqueda de modelos integrada)_         | OpenClaw prueba primero la ruta normal del registro o catálogo                                                          | _(no es un hook de Plugin)_                                                                                                                         |
| `normalizeModelId`                | Normaliza los alias heredados o preliminares de identificadores de modelos antes de la búsqueda                                                     | El proveedor se encarga de depurar los alias antes de la resolución canónica del modelo                                                                                 |
| `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo                                      | El proveedor se encarga de depurar el transporte para identificadores de proveedor personalizados de la misma familia de transporte                                                          |
| `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución del entorno de ejecución o proveedor                                           | El proveedor necesita una depuración de configuración que debe residir en el Plugin; los auxiliares integrados de la familia de Google también respaldan las entradas de configuración de Google compatibles   |
| `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad del uso de streaming nativo a los proveedores de configuración                                               | El proveedor necesita correcciones de los metadatos de uso de streaming nativo determinadas por el endpoint                                                                          |
| `resolveConfigApiKey`             | Resuelve la autenticación mediante marcadores de entorno para los proveedores de configuración antes de cargar la autenticación del entorno de ejecución                                       | Los proveedores exponen sus propios hooks de resolución de claves de API mediante marcadores de entorno                                                                                |
| `resolveSyntheticAuth`            | Expone la autenticación local, autoalojada o respaldada por configuración sin persistir texto sin formato                                   | El proveedor puede funcionar con un marcador de credencial sintético o local                                                                                 |
| `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externos propiedad del proveedor; el `persistence` predeterminado es `runtime-only` para las credenciales propiedad de la CLI o la aplicación | El proveedor reutiliza credenciales de autenticación externas sin persistir tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| `shouldDeferSyntheticProfileAuth` | Reduce la prioridad de los marcadores de posición de perfiles sintéticos almacenados frente a la autenticación respaldada por el entorno o la configuración                                      | El proveedor almacena perfiles de marcador de posición sintéticos que no deben tener precedencia                                                                 |
| `resolveDynamicModel`             | Alternativa síncrona para identificadores de modelos propiedad del proveedor que aún no están en el registro local                                       | El proveedor acepta identificadores de modelos ascendentes arbitrarios                                                                                                 |
| `prepareDynamicModel`             | Calentamiento asíncrono; después se ejecuta `resolveDynamicModel` de nuevo                                                           | El proveedor necesita metadatos de red antes de resolver identificadores desconocidos                                                                                  |
| `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor integrado utilice el modelo resuelto                                               | El proveedor necesita reescrituras de transporte, pero sigue utilizando un transporte del núcleo                                                                             |
| `normalizeToolSchemas`            | Normaliza los esquemas de herramientas antes de que el ejecutor integrado los procese                                                    | El proveedor necesita depurar el esquema de la familia de transporte                                                                                                |
| `inspectToolSchemas`              | Expone diagnósticos de esquema propiedad del proveedor después de la normalización                                                  | El proveedor desea advertencias sobre palabras clave sin incorporar reglas específicas del proveedor al núcleo                                                                 |
| `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo o etiquetado                                                              | El proveedor necesita una salida etiquetada de razonamiento o final en lugar de campos nativos                                                                         |
| `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los envoltorios genéricos de opciones de streaming                                              | El proveedor necesita parámetros de solicitud predeterminados o una depuración de parámetros específica para cada proveedor                                                                           |
| `createStreamFn`                  | Sustituye por completo la ruta normal de streaming por un transporte personalizado                                                   | El proveedor necesita un protocolo de comunicación personalizado, no solo un envoltorio                                                                                     |
| `wrapStreamFn`                    | Envoltorio de streaming después de aplicar los envoltorios genéricos                                                              | El proveedor necesita envoltorios de compatibilidad para encabezados, cuerpo o modelo de la solicitud sin un transporte personalizado                                                          |
| `resolveTransportTurnState`       | Adjunta encabezados o metadatos de transporte nativos por turno                                                           | El proveedor desea que los transportes genéricos envíen la identidad de turno nativa del proveedor                                                                       |
| `resolveWebSocketSessionPolicy`   | Adjunta encabezados nativos de WebSocket o una política de tiempo de espera de la sesión                                                    | El proveedor desea que los transportes WS genéricos ajusten los encabezados de sesión o la política de alternativa                                                               |
| `formatApiKey`                    | Formateador de perfiles de autenticación: el perfil almacenado se convierte en la cadena `apiKey` del entorno de ejecución                                     | El proveedor almacena metadatos de autenticación adicionales y necesita un formato personalizado del token del entorno de ejecución                                                                    |
| `refreshOAuth`                    | Sustitución de la actualización OAuth para endpoints de actualización personalizados o una política de errores de actualización                                  | El proveedor no se ajusta a los actualizadores compartidos de OpenClaw                                                                                          |
| `buildAuthDoctorHint`             | Indicación de reparación añadida cuando falla la actualización OAuth                                                                  | El proveedor necesita orientación de reparación de autenticación propia después de un error de actualización                                                                      |
| `matchesContextOverflowError`     | Detector de desbordamiento de la ventana de contexto propiedad del proveedor                                                                 | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas no detectarían                                                                                |
| `classifyFailoverReason`          | Clasificación de motivos de conmutación por error propiedad del proveedor                                                                  | El proveedor puede asignar errores sin procesar de la API o del transporte a límites de velocidad, sobrecarga, etc.                                                                          |
| `isCacheTtlEligible`              | Política de caché de prompts para proveedores de proxy o red de retorno                                                               | El proveedor necesita restricciones de TTL de caché específicas del proxy                                                                                                |
| `buildMissingAuthMessage`         | Sustituye el mensaje genérico de recuperación por ausencia de autenticación                                                      | El proveedor necesita una indicación de recuperación específica cuando falta la autenticación                                                                                 |
| `augmentModelCatalog`             | Filas sintéticas o finales del catálogo añadidas después del descubrimiento (obsoleto; véase más adelante)                                  | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y en los selectores                                                                     |
| `resolveThinkingProfile`          | Conjunto, etiquetas de visualización y valor predeterminado del nivel `/think` específico del modelo                                                 | El proveedor expone una escala de pensamiento personalizada o una etiqueta binaria para los modelos seleccionados                                                                 |
| `isBinaryThinking`                | Hook de compatibilidad para activar o desactivar el razonamiento                                                                     | El proveedor solo expone la activación o desactivación binaria del pensamiento                                                                                                  |
| `supportsXHighThinking`           | Hook de compatibilidad con el razonamiento `xhigh`                                                                   | El proveedor desea `xhigh` solo en un subconjunto de modelos                                                                                             |
| `resolveDefaultThinkingLevel`     | Hook de compatibilidad del nivel `/think` predeterminado                                                                      | El proveedor posee la política `/think` predeterminada para una familia de modelos                                                                                      |
| `isModernModelRef`                | Detector de modelos modernos para filtros de perfiles activos y selección de pruebas de humo                                              | El proveedor se encarga de la coincidencia de modelos preferidos para perfiles activos y pruebas de humo                                                                                             |
| `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token o la clave real del entorno de ejecución justo antes de la inferencia                       | El proveedor necesita un intercambio de tokens o una credencial de solicitud de corta duración                                                                             |
| `resolveUsageAuth`                | Resuelve las credenciales de uso o facturación para `/usage` y las superficies de estado relacionadas                                     | El proveedor necesita un análisis personalizado de tokens de uso o cuota, o una credencial de uso diferente                                                               |
| `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas de uso o cuota específicas del proveedor después de resolver la autenticación                             | El proveedor necesita un endpoint de uso específico o un analizador de carga útil específico                                                                           |
| `createEmbeddingProvider`         | Crear un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                                                     | El comportamiento de los embeddings de memoria corresponde al plugin del proveedor                                                                                    |
| `buildReplayPolicy`               | Devolver una política de reproducción que controle el manejo de la transcripción para el proveedor                                        | El proveedor necesita una política de transcripción personalizada (por ejemplo, la eliminación de bloques de razonamiento)                                                               |
| `sanitizeReplayHistory`           | Reescribir el historial de reproducción tras la limpieza genérica de la transcripción                                                        | El proveedor necesita reescrituras de reproducción específicas del proveedor, además de los asistentes compartidos de Compaction                                                             |
| `validateReplayTurns`             | Realizar la validación o reformulación final del turno de reproducción antes del ejecutor integrado                                           | El transporte del proveedor necesita una validación de turnos más estricta tras la depuración genérica                                                                    |
| `onModelSelected`                 | Ejecutar efectos secundarios posteriores a la selección propiedad del proveedor                                                                 | El proveedor necesita telemetría o un estado propiedad del proveedor cuando se activa un modelo                                                                  |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` comprueban primero el
plugin del proveedor coincidente y, después, continúan con otros plugins de
proveedores compatibles con hooks hasta que uno cambia realmente el id del
modelo o el transporte o la configuración. Esto permite que los adaptadores de
alias/compatibilidad de proveedores sigan funcionando sin exigir que el
llamador sepa qué plugin incluido controla la reescritura. Si ningún hook de
proveedor reescribe una entrada de configuración compatible de la familia
Google, el normalizador de configuración de Google incluido sigue aplicando
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de comunicación totalmente personalizado
o un ejecutor de solicitudes personalizado, se trata de una clase de extensión
diferente. Estos hooks están destinados al comportamiento de proveedores que
sigue ejecutándose en el bucle de inferencia normal de OpenClaw.

`resolveUsageAuth` decide si OpenClaw debe llamar a `fetchUsageSnapshot` o
recurrir a la resolución genérica de credenciales para las superficies de
uso/estado. Devuelva `{ token, accountId?, subscriptionType?, rateLimitTier? }` cuando el proveedor
tenga una credencial de uso (los metadatos opcionales del plan se transmiten a
`fetchUsageSnapshot`), devuelva
`{ handled: true }` cuando la autenticación de uso controlada por el proveedor
haya gestionado la solicitud y deba impedir la alternativa genérica de clave de
API/OAuth, y devuelva `null` o `undefined`
cuando el proveedor no haya gestionado la autenticación de uso.

Declare las credenciales de organización o facturación en
`providerUsageAuthEnvVars`. Esto permite que las superficies genéricas de
detección y eliminación de secretos las reconozcan sin convertirlas en
candidatas de autenticación para la inferencia.

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

Los plugins de proveedores incluidos combinan los hooks anteriores para
adaptarse a las necesidades de catálogo, autenticación, razonamiento,
reproducción y uso de cada proveedor. El conjunto de hooks autoritativo reside
con cada plugin en `extensions/`; esta página ilustra las formas en lugar de
reproducir la lista.

<AccordionGroup>
  <Accordion title="Proveedores de catálogo de transferencia directa">
    OpenRouter, Kilocode, Z.AI y xAI registran `catalog` junto con
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer los ids de
    modelos del origen antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Proveedores de OAuth y endpoints de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi y z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para controlar el intercambio de tokens y la integración
    de `/usage`.
  </Accordion>
  <Accordion title="Familias de limpieza de reproducciones y transcripciones">
    Las familias con nombre compartidas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los proveedores
    adopten la política de transcripciones mediante `buildReplayPolicy`, en lugar
    de que cada plugin vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Proveedores exclusivamente de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` solo registran `catalog` y utilizan el bucle de inferencia compartido.
  </Accordion>
  <Accordion title="Ayudantes de flujo específicos de Anthropic">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` residen en la
    interfaz pública `api.ts` / `contract-api.ts` del plugin de
    Anthropic (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), en lugar de
    hacerlo en el SDK genérico.
  </Accordion>
</AccordionGroup>

## Ayudantes de tiempo de ejecución

Los plugins pueden acceder a determinados ayudantes del núcleo mediante
`api.runtime`. Para TTS:

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

- `textToSpeech` devuelve la carga útil de salida TTS normal del núcleo para superficies de archivos/notas de voz.
- Utiliza la configuración `tts` y la selección de proveedor del núcleo.
- Devuelve un búfer de audio PCM y la frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional para cada proveedor. Se utiliza para selectores de voz o flujos de configuración controlados por el proveedor.
- El núcleo transmite un plazo de solicitud resuelto a los hooks `listVoices` del proveedor; la configuración de tiempo de espera específica del proveedor puede sustituirlo.
- Las listas de voces pueden incluir metadatos más detallados, como configuración regional, género y etiquetas de personalidad, para selectores que conozcan el proveedor.
- OpenAI y ElevenLabs admiten actualmente la telefonía. Microsoft no.

Los plugins también pueden registrar proveedores de voz mediante
`api.registerSpeechProvider(...)`.

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

- Mantenga en el núcleo la política de TTS, las alternativas y la entrega de respuestas.
- Utilice proveedores de voz para el comportamiento de síntesis controlado por el proveedor.
- La entrada heredada de Microsoft `edge` se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido se orienta a la empresa: un plugin de proveedor puede controlar
  proveedores de texto, voz, imágenes y medios futuros a medida que OpenClaw
  añada esos contratos de capacidades.

Para la comprensión de imágenes/audio/vídeo, los plugins registran un proveedor
tipado de comprensión de medios en lugar de un conjunto genérico de
claves/valores:

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

- Mantenga en el núcleo la orquestación, las alternativas, la configuración y el cableado de canales.
- Mantenga el comportamiento del proveedor en el plugin del proveedor.
- La ampliación aditiva debe seguir estando tipada: métodos opcionales nuevos, campos de resultado opcionales nuevos y capacidades opcionales nuevas.
- La generación de vídeo ya sigue el mismo patrón:
  - el núcleo controla el contrato de capacidades y el ayudante de tiempo de ejecución
  - los plugins de proveedores registran `api.registerVideoGenerationProvider(...)`
  - los plugins de funciones/canales consumen `api.runtime.videoGeneration.*`

Para los ayudantes de tiempo de ejecución de comprensión de medios, los plugins
pueden llamar a:

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
  model: "gpt-5.6-sol",
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

Para la transcripción de audio, los plugins pueden utilizar el tiempo de
ejecución de comprensión de medios o el alias STT anterior:

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
  la comprensión de imágenes/audio/vídeo.
- `extractStructuredWithModel(...)` es la interfaz orientada a plugins para la
  extracción acotada, centrada en imágenes y controlada por el proveedor.
  Incluya al menos una entrada de imagen; las entradas de texto son contexto
  complementario. Los plugins de producto controlan sus rutas y esquemas,
  mientras OpenClaw controla el límite entre el proveedor y el tiempo de
  ejecución.
- Utiliza la configuración de audio de comprensión de medios del núcleo (`tools.media.audio`) y el orden de alternativas de proveedores.
- Devuelve `{ text: undefined }` cuando no se produce ninguna salida de transcripción (por ejemplo, una entrada omitida/no compatible).

Los plugins también pueden iniciar ejecuciones de subagentes en segundo plano
mediante `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  toolsAlsoAllow: ["my_plugin_progress"],
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Notas:

- `provider` y `model` son sustituciones opcionales por ejecución, no cambios persistentes de sesión.
- `toolsAlsoAllow` acepta nombres exactos y de propiedad inequívoca de herramientas registradas por el plugin llamador. Se rechazan los nombres del núcleo y los ambiguos. Se añade al perfil normal, pero las listas de elementos permitidos y las denegaciones del operador siguen siendo autoritativas.
- OpenClaw solo respeta esos campos de sustitución para llamadores de confianza.
- Para las ejecuciones alternativas controladas por plugins, los operadores deben habilitarlas mediante `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilice `plugins.entries.<id>.subagent.allowedModels` para restringir los plugins de confianza a destinos canónicos `provider/model` específicos, o `"*"` para permitir explícitamente cualquier destino.
- Las ejecuciones de subagentes de plugins que no son de confianza siguen funcionando, pero las solicitudes de sustitución se rechazan en lugar de recurrir silenciosamente a la alternativa.
- Las sesiones de subagentes creadas por plugins se etiquetan con el id del plugin que las crea. La alternativa `api.runtime.subagent.deleteSession(...)` solo puede eliminar esas sesiones propias; la eliminación arbitraria de sesiones sigue requiriendo una solicitud al Gateway con ámbito de administrador.

Para búsquedas web, los plugins pueden utilizar el ayudante compartido del
tiempo de ejecución en lugar de acceder al cableado de herramientas del agente:

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

- Mantenga en el núcleo la selección de proveedores, la resolución de credenciales y la semántica compartida de las solicitudes.
- Utilice proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de funciones/canales que necesitan funciones de búsqueda sin depender del contenedor de herramientas del agente.

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

- `generate(...)`: genera una imagen mediante la cadena configurada de proveedores de generación de imágenes.
- `listProviders(...)`: enumera los proveedores de generación de imágenes disponibles y sus capacidades.

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

- `path`: ruta dentro del servidor HTTP del Gateway.
- `auth`: obligatorio, `"gateway"` o `"plugin"`. Use `"gateway"` para exigir la autenticación normal del Gateway, o `"plugin"` para la autenticación o verificación de Webhooks gestionada por el plugin.
- `match`: opcional. `"exact"` (valor predeterminado) o `"prefix"`.
- `handleUpgrade`: controlador opcional para solicitudes de actualización a WebSocket en la misma ruta.
- `replaceExisting`: opcional. Permite que el mismo plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta haya gestionado la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error de carga del plugin. Use `api.registerHttpRoute(...)` en su lugar.
- Las rutas de los plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que se use `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Las rutas superpuestas con distintos niveles de `auth` se rechazan. Mantenga las cadenas de continuación `exact`/`prefix` únicamente en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente ámbitos de ejecución del operador. Están destinadas a Webhooks y verificación de firmas gestionados por plugins, no a llamadas privilegiadas a los asistentes del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un ámbito de ejecución de solicitudes del Gateway. La superficie predeterminada (`gatewayRuntimeScopeSurface: "write-default"`) es deliberadamente conservadora:
  - la autenticación con secreto compartido mediante token de portador (`gateway.auth.mode = "token"` / `"password"`) y cualquier método de autenticación que no utilice un proxy de confianza reciben un único ámbito `operator.write`, incluso si el autor de la llamada envía `x-openclaw-scopes`
  - los autores de llamadas `trusted-proxy` sin una cabecera `x-openclaw-scopes` explícita también conservan la superficie heredada limitada a `operator.write`
  - los autores de llamadas `trusted-proxy` que sí envíen `x-openclaw-scopes` reciben en su lugar los ámbitos declarados
  - una ruta puede habilitar `gatewayRuntimeScopeSurface: "trusted-operator"` para respetar siempre `x-openclaw-scopes` en los modos de autenticación que incluyen identidad (recurriendo al conjunto completo de ámbitos predeterminados de la CLI cuando no haya cabecera)
- Las pestañas externas aisladas de la interfaz de control respaldadas por rutas `auth: "gateway"` utilizan una concesión mediante cookie firmada de corta duración, emitida únicamente durante un arranque autenticado; las pestañas con autenticación del plugin conservan su ruta directa de iframe. Antes del montaje, el elemento principal ejecuta una sonda propiedad de la ruta dentro del mismo entorno aislado opaco y deniega el acceso cuando la política de privacidad del navegador bloquea la cookie. La concesión está vinculada al plugin propietario, a la raíz de la ruta coincidente y a la generación de autenticación actual; el nombre aleatorio por proceso de su cookie impide que varios Gateways de confianza alojados en el mismo host se sobrescriban entre sí, pero las cookies nunca aíslan los puertos TCP. Por tanto, el nombre de host del Gateway constituye un único límite de credenciales: no aloje en ese nombre de host servicios que no confíen mutuamente, incluidos los que utilicen otros puertos. El despacho de rutas rechaza la reutilización en una ruta anidada propiedad de otro plugin. Como los descendientes del entorno aislado son de origen cruzado a efectos de las cookies, la concesión solo acepta `GET` y `HEAD` con `operator.read`; las mutaciones y las actualizaciones a WebSocket permanecen en superficies autenticadas explícitamente por el Gateway. La cookie no puede utilizar CHIPS de forma intencionada: los navegadores actuales incluyen un bit de ancestro de origen cruzado en la clave de partición, por lo que los marcos aislados opacos anidados perderían el acceso a los recursos de la misma ruta. La cookie requiere un contexto seguro y permiso del navegador para cookies de origen cruzado, por lo que las pestañas externas con autenticación del Gateway no están disponibles en orígenes LAN con HTTP sin cifrar ni cuando las cookies de terceros están totalmente bloqueadas; use HTTPS/Tailscale Serve o un bucle local de confianza para el navegador con una política de cookies compatible.
- La concesión evita la divulgación del token de portador del Gateway y la reutilización accidental de rutas o ámbitos; no crea un límite de seguridad entre plugins nativos. El código del plugin nativo y el contenido de la interfaz que sirve siguen formando parte del mismo límite de confianza del plugin dentro del proceso.
- Regla práctica: no dé por sentado que una ruta de plugin con autenticación del Gateway es una superficie de administración implícita. Si la ruta necesita comportamiento exclusivo para administradores, habilite la superficie de ámbito `trusted-operator`, exija un modo de autenticación que incluya identidad y documente el contrato explícito de la cabecera `x-openclaw-scopes`.
- Después de determinar la ruta y autenticar la solicitud, los controladores ordinarios participan en la admisión de trabajo raíz del Gateway. Un Gateway preparado o que se esté reiniciando devuelve `503` antes de invocar el controlador. La única excepción limitada es una ruta `auth: "gateway"` autorizada por el manifiesto que también habilite la superficie específica de la ruta `trusted-operator`; permanece accesible para que el despacho de control de suspensión no quede bloqueado, mientras que las rutas hermanas ordinarias del mismo plugin permanecen tras el límite de admisión. La propiedad de `handleUpgrade` de WebSocket utiliza el mismo límite de admisión atómico; una vez que el controlador acepta un socket, el ciclo de vida posterior del socket pertenece al plugin y este límite no lo supervisa.

## Rutas de importación del SDK de plugins

Use subrutas específicas del SDK en lugar del barrel raíz monolítico
`openclaw/plugin-sdk` al crear plugins nuevos. Subrutas principales:

| Subruta                            | Propósito                                      |
| ---------------------------------- | -------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Primitivas de registro de plugins               |
| `openclaw/plugin-sdk/channel-core` | Asistentes de entrada y compilación de canales                  |
| `openclaw/plugin-sdk/core`         | Asistentes genéricos compartidos y contrato general |

Los plugins de canales eligen entre una familia de interfaces específicas: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un único contrato `approvalCapability`, en lugar de mezclarse entre campos
de plugins no relacionados. Consulte [Plugins de canales](/es/plugins/sdk-channel-plugins).

Los asistentes de ejecución y configuración se encuentran en las subrutas específicas correspondientes de `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefiera `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation`
en lugar del amplio barrel de compatibilidad `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-lifecycle`, las pequeñas fachadas de asistentes de canales,
`openclaw/plugin-sdk/config-runtime` y `openclaw/plugin-sdk/infra-runtime`
son adaptadores de compatibilidad obsoletos para plugins antiguos. El código nuevo debe importar
primitivas genéricas más específicas.
</Info>

Puntos de entrada internos del repositorio (por raíz del paquete del plugin incluido):

- `index.js` — entrada del plugin incluido
- `api.js` — barrel de asistentes y tipos
- `runtime-api.js` — barrel exclusivo de ejecución
- `setup-entry.js` — entrada de configuración del plugin

Los plugins externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importe el `src/*` del paquete de otro plugin desde el núcleo ni desde otro plugin.
Los puntos de entrada cargados mediante fachadas prefieren la instantánea activa de la configuración de ejecución cuando
existe; de lo contrario, recurren al archivo de configuración resuelto en el disco.

Existen subrutas específicas de capacidades, como `image-generation`, `media-understanding`
y `speech`, porque los plugins incluidos las utilizan actualmente. No son
automáticamente contratos externos inmutables a largo plazo; consulte la página de referencia
correspondiente del SDK cuando dependa de ellas.

## Esquemas de herramientas de mensajes

Los plugins deben ser propietarios de las contribuciones al esquema `describeMessageTool(...)`
específicas del canal para primitivas ajenas a los mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envíos debe utilizar el contrato genérico `MessagePresentation`
en lugar de campos nativos del proveedor para botones, componentes, bloques o tarjetas.
Consulte [Presentación de mensajes](/es/plugins/message-presentation) para conocer el contrato,
las reglas de comportamiento alternativo, la correspondencia con proveedores y la lista de comprobación para autores de plugins.

Los plugins con capacidad de envío declaran qué pueden representar mediante las capacidades de mensajes:

- `presentation` para bloques de presentación semánticos (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El núcleo decide si representa la presentación de forma nativa o la degrada a texto.
No exponga mecanismos de escape de interfaz nativos del proveedor desde la herramienta genérica de mensajes.
Los asistentes obsoletos del SDK para esquemas nativos heredados siguen exportándose para los plugins
de terceros existentes, pero los plugins nuevos no deben utilizarlos.

## Resolución de destinos de canales

Los plugins de canales deben ser propietarios de la semántica de destinos específica del canal. Mantenga genérico
el host de salida compartido y utilice la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de consultar el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al núcleo si una
  entrada debe pasar directamente a una resolución similar a un identificador en lugar de buscar en el directorio.
- `messaging.targetResolver.reservedLiterals` enumera las palabras simples que son
  referencias de canal o sesión para ese proveedor. La resolución conserva las entradas
  configuradas del directorio antes de rechazar los literales reservados y, después, deniega
  el acceso si no se encuentra una coincidencia en el directorio.
- `messaging.targetResolver.resolveTarget(...)` es el mecanismo alternativo del plugin cuando
  el núcleo necesita una resolución final propiedad del proveedor después de la normalización o tras
  no encontrar una coincidencia en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` controla la construcción de rutas de sesión
  específicas del proveedor una vez resuelto un destino.

División recomendada:

- Use `inferTargetChatType` para decisiones de categoría que deban tomarse antes de
  buscar pares o grupos.
- Use `looksLikeId` para comprobaciones de «tratar esto como un identificador de destino explícito o nativo».
- Use `resolveTarget` como mecanismo alternativo de normalización específico del proveedor, no para
  búsquedas amplias en el directorio.
- Mantenga los identificadores nativos del proveedor, como identificadores de chats, identificadores de hilos, JID, identificadores de usuario e identificadores
  de salas, dentro de valores `target` o parámetros específicos del proveedor, no en campos
  genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que obtengan entradas de directorio a partir de la configuración deben mantener esa lógica en el
plugin y reutilizar los asistentes compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Utilice esto cuando un canal necesite pares o grupos respaldados por configuración, como:

- pares de mensajes directos determinados por listas de permitidos
- mapas configurados de canales o grupos
- mecanismos alternativos de directorio estático limitados a una cuenta

Los asistentes compartidos de `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- asistentes de deduplicación y normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas y la normalización de identificadores específicas del canal deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedores pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma estructura que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Use `catalog` cuando el plugin sea propietario de identificadores de modelos específicos del proveedor, valores predeterminados de la URL base
o metadatos de modelos sujetos a autenticación.

`catalog.order` controla cuándo se combina el catálogo de un plugin con respecto a los proveedores implícitos
integrados de OpenClaw:

- `simple`: proveedores simples basados en clave de API o variables de entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de los demás proveedores implícitos

Los proveedores posteriores prevalecen en caso de colisión de claves, por lo que los plugins pueden sustituir intencionadamente una
entrada de proveedor integrada que tenga el mismo identificador de proveedor.

Los plugins también pueden publicar filas de modelos de solo lectura mediante
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Esta es la vía futura para las superficies de listas, ayuda y selectores, y admite
filas `text`, `voice`, `image_generation`, `video_generation` y `music_generation`.
Los plugins de proveedores siguen siendo propietarios de las llamadas a endpoints en vivo, el intercambio de tokens y
la correspondencia de respuestas del proveedor; el núcleo es propietario de la forma común de las filas, las etiquetas de origen y
el formato de la ayuda de herramientas multimedia. Los registros de proveedores de generación multimedia sintetizan
automáticamente filas estáticas del catálogo a partir de `defaultModel`, `models` y
`capabilities`.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado, pero emite una advertencia de obsolescencia
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`
  y emite una advertencia
- `augmentModelCatalog` está obsoleto; los proveedores incluidos deben publicar
  filas complementarias mediante `registerModelCatalogProvider`

## Inspección de canales de solo lectura

Si el plugin registra un canal, se recomienda implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Motivos:

- `resolveAccount(...)` es la ruta de ejecución. Puede asumir que las credenciales
  están completamente materializadas y fallar de inmediato cuando falten secretos obligatorios.
- Las rutas de comandos de solo lectura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de reparación
  de doctor/configuración, no deberían tener que materializar credenciales de ejecución solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelva únicamente el estado descriptivo de la cuenta.
- Conserve `enabled` y `configured`.
- Incluya los campos de origen/estado de las credenciales cuando corresponda, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No es necesario devolver los valores brutos de los tokens solo para informar de la
  disponibilidad de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen
  correspondiente) es suficiente para los comandos de estado.
- Use `configured_unavailable` cuando una credencial esté configurada mediante SecretRef, pero
  no esté disponible en la ruta de comandos actual.

Esto permite que los comandos de solo lectura indiquen «configurada, pero no disponible en esta ruta de
comandos» en lugar de bloquearse o informar erróneamente de que la cuenta no está configurada.

## Paquetes de plugins

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

Cada entrada se convierte en un plugin. Si el paquete enumera varias extensiones, el identificador del plugin
se convierte en `<manifestOrPackageName>/<fileBase>` (el identificador del manifiesto prevalece cuando
está presente; de lo contrario, se usa el nombre `package.json` sin ámbito).

Si el plugin importa dependencias de npm, instálelas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Medida de seguridad: cada entrada `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de resolver los enlaces simbólicos. Se rechazan las entradas que escapen del directorio del paquete.

Nota de seguridad: `openclaw plugins install` instala las dependencias del plugin con un
`npm install --omit=dev --ignore-scripts` local al proyecto (sin scripts de ciclo de vida
ni dependencias de desarrollo durante la ejecución), ignorando la configuración global heredada de instalación de npm.
Mantenga los árboles de dependencias de los plugins como «JS/TS puro» y evite paquetes que requieran
compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero exclusivo para la configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún no está configurado, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto aligera el inicio y la configuración
cuando la entrada principal del plugin también conecta herramientas, hooks u otro código exclusivo
de la ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede incorporar un plugin de canal a la misma ruta `setupEntry` durante la fase de inicio
previa a la escucha del gateway, incluso cuando el canal ya está configurado.

Use esta opción únicamente cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el gateway comience a escuchar. En la práctica, esto significa que la entrada de configuración
debe registrar todas las capacidades propiedad del canal de las que depende el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway comience a escuchar
- cualquier método, herramienta o servicio del gateway que deba existir durante ese mismo intervalo

Si la entrada completa sigue siendo propietaria de alguna capacidad de inicio obligatoria, no habilite
esta opción. Mantenga el comportamiento predeterminado del plugin y permita que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar ayudantes de superficie contractual exclusivos para la configuración que el núcleo
puede consultar antes de que se cargue la ejecución completa del canal. La superficie actual de
promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración heredada de canal de una sola cuenta
a `channels.<id>.accounts.*` sin cargar la entrada completa del plugin.
Matrix es el ejemplo incluido actual: mueve únicamente las claves de autenticación/inicialización a una
cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede conservar una
clave configurada no canónica de cuenta predeterminada en lugar de crear siempre
`accounts.default`.

Estos adaptadores de parches de configuración mantienen diferido el descubrimiento de superficies contractuales incluidas. El tiempo
de importación se mantiene ligero; la superficie de promoción solo se carga en el primer uso, en lugar de
volver a iniciar el canal incluido durante la importación del módulo.

Cuando estas superficies de inicio incluyan métodos RPC del gateway, manténgalos bajo un
prefijo específico del plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven
como `operator.admin`, incluso si un plugin solicita un ámbito más restringido.

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

Los plugins de canales pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
sugerencias de instalación mediante `openclaw.install`. Esto evita que el catálogo del núcleo contenga datos.

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
      "blurb": "Chat autoalojado mediante bots de webhook de Nextcloud Talk.",
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

Campos útiles de `openclaw.channel` además de los del ejemplo mínimo:

- `detailLabel`: etiqueta secundaria para superficies de catálogo/estado más completas
- `docsLabel`: sustituye el texto del enlace a la documentación
- `preferOver`: identificadores de plugins/canales de menor prioridad que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto de la superficie de selección
- `markdownCapable`: marca el canal como compatible con Markdown para las decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para las superficies de navegación de la documentación
- `quickstartAllowFrom`: incorpora el canal al flujo estándar `allowFrom` de inicio rápido
- `forceAccountBinding`: exige la vinculación explícita de la cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: da preferencia a la búsqueda de sesiones al resolver destinos de anuncios

OpenClaw también puede combinar **catálogos de canales externos** (por ejemplo, una exportación del
registro MPM). Coloque un archivo JSON en una de estas ubicaciones:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

También puede hacer que `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) apunte a
uno o varios archivos JSON (delimitados por comas, punto y coma o `PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados de la clave `"entries"`.

Las entradas generadas del catálogo de canales y del catálogo de instalación de proveedores exponen
datos normalizados del origen de instalación junto al bloque `openclaw.install` sin procesar. Los
datos normalizados identifican si la especificación npm es una versión exacta o un
selector flotante, si están presentes los metadatos de integridad esperados y si también
hay disponible una ruta de origen local. Cuando se conoce la identidad del catálogo/paquete, los
datos normalizados advierten si el nombre del paquete npm analizado difiere de esa identidad.
También advierten cuando `defaultChoice` no es válido o apunta a un origen que no está
disponible, y cuando existen metadatos de integridad de npm sin un origen npm
válido. Los consumidores deben tratar `installSource` como un campo opcional adicional para que
las entradas creadas manualmente y los adaptadores de catálogo no tengan que sintetizarlo.
Esto permite que la incorporación y los diagnósticos expliquen el estado del plano de origen sin
importar la ejecución del plugin.

Las entradas npm externas oficiales deberían preferir un `npmSpec` exacto junto con
`expectedIntegrity`. Los nombres de paquetes sin versión y las etiquetas de distribución siguen funcionando por
compatibilidad, pero muestran advertencias del plano de origen para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas mediante integridad sin romper los plugins existentes.
Cuando la incorporación instala desde una ruta de catálogo local, registra una entrada administrada
del índice de plugins con `source: "path"` y un
`sourcePath` relativo al espacio de trabajo cuando sea posible. La ruta de carga operativa absoluta permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas de estaciones de trabajo locales
en la configuración de larga duración. Esto mantiene visibles las instalaciones de desarrollo local para
los diagnósticos del plano de origen sin añadir una segunda superficie de divulgación de rutas sin procesar
del sistema de archivos. La tabla SQLite persistente `installed_plugin_index` es la fuente de verdad
de la instalación y puede actualizarse sin cargar módulos de ejecución de plugins.
Su mapa `installRecords` se conserva incluso cuando falta el manifiesto de un plugin o
no es válido; su carga útil `plugins` es una vista reconstruible del manifiesto.

## Plugins del motor de contexto

Los plugins del motor de contexto son responsables de la orquestación del contexto de sesión para la ingesta, el ensamblaje
y la Compaction. Regístrelos desde el plugin con
`api.registerContextEngine(id, factory)` y, a continuación, seleccione el motor activo con
`plugins.slots.contextEngine`.

Use esta opción cuando el plugin necesite sustituir o ampliar el pipeline de contexto
predeterminado, en lugar de limitarse a añadir búsquedas en memoria o hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentSessionKey: sessionKey,
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
para la inicialización durante la construcción.

El host completa la preparación asíncrona registrada del prompt de memoria antes de llamar a
`assemble()` de un motor no heredado. `buildMemorySystemPromptAddition(...)` permanece
síncrono y lee esa instantánea inmutable de la ejecución mientras `assemble()` está activo.
Pase sin cambios el contexto proporcionado de herramientas y citas para que la instantánea
no pueda atravesar los límites de la ejecución.

`assemble()` puede devolver `contextProjection` cuando el arnés activo tiene un
hilo de backend persistente. Omítalo para la proyección heredada por turno. Devuelva
`{ mode: "thread_bootstrap", epoch }` cuando el contexto ensamblado deba
inyectarse una vez en un hilo de backend y reutilizarse hasta que cambie la época. Cambie
la época después de que cambie el contexto semántico del motor, como después de una
pasada de Compaction propiedad del motor. Los hosts pueden conservar los metadatos de llamadas a herramientas, la forma
de entrada y los resultados redactados de herramientas en una proyección de arranque del hilo para que los nuevos
hilos de backend mantengan la continuidad de las herramientas sin copiar cargas útiles sin procesar
que contengan secretos.

Si su motor **no** es propietario del algoritmo de Compaction, mantenga `compact()`
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
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentSessionKey: sessionKey,
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

Cuando un plugin necesita un comportamiento que no encaja en la API actual, no eluda
el sistema de plugins mediante un acceso interno privado. Añada la capacidad que falta.

Secuencia recomendada:

1. **Defina el contrato del núcleo.** Decida qué comportamiento compartido debe controlar el núcleo:
   política, alternativa, combinación de configuración, ciclo de vida, semántica orientada al canal y
   forma del asistente de tiempo de ejecución.
2. **Añada superficies tipadas de registro y tiempo de ejecución del plugin.** Amplíe
   `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada de
   capacidad útil más pequeña.
3. **Conecte el núcleo y los consumidores de canales o funcionalidades.** Los canales y los plugins de funcionalidades
   deben consumir la nueva capacidad mediante el núcleo, no importando directamente una
   implementación de un proveedor.
4. **Registre las implementaciones de los proveedores.** A continuación, los plugins de proveedores registran sus
   backends para la capacidad.
5. **Añada cobertura del contrato.** Añada pruebas para que la propiedad y la forma del registro
   permanezcan explícitas a lo largo del tiempo.

Así es como OpenClaw mantiene criterios definidos sin quedar codificado de forma rígida según la
visión del mundo de un solo proveedor. Consulte el [Recetario de capacidades](/es/plugins/adding-capabilities)
para ver una lista de comprobación concreta de archivos y un ejemplo desarrollado.

### Lista de comprobación de capacidades

Al añadir una nueva capacidad, la implementación normalmente debe abarcar conjuntamente estas
superficies:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- ejecutor o asistente de tiempo de ejecución del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de la API del plugin en `src/plugins/types.ts`
- conexión del registro de plugins en `src/plugins/registry.ts`
- exposición del tiempo de ejecución del plugin en `src/plugins/runtime/*` cuando los plugins de funcionalidades o canales
  necesiten consumirla
- asistentes de captura y pruebas en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad y contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores y plugins en `docs/`

Si falta alguna de esas superficies, normalmente es una señal de que la capacidad
aún no está plenamente integrada.

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

Patrón de prueba de contrato (`src/plugins/contracts/registry.ts` expone consultas de
propiedad como `providerContractPluginIds`; las pruebas verifican que la lista
`contracts.videoGenerationProviders` de un plugin coincida con lo que realmente registra):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Esto mantiene una regla sencilla:

- el núcleo controla el contrato de capacidad y la orquestación
- los plugins de proveedores controlan las implementaciones de los proveedores
- los plugins de funcionalidades o canales consumen asistentes de tiempo de ejecución
- las pruebas de contrato mantienen explícita la propiedad

## Contenido relacionado

- [Arquitectura de plugins](/es/plugins/architecture) — modelo público de capacidades y formas
- [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
