---
read_when:
    - Implementación de hooks de runtime del proveedor, el ciclo de vida del canal o paquetes de paquetes
    - Depuración del orden de carga de plugins o del estado del registro
    - Añadir una nueva capacidad de Plugin o un Plugin de motor de contexto
summary: 'Aspectos internos de la arquitectura de Plugins: pipeline de carga, registro, hooks de runtime, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de plugins
x-i18n:
    generated_at: "2026-07-19T02:06:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 38041d0b6bfab4beebdc724561921dfc08ef2d0aa6d1c949c751098ab98c7d14
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para conocer el modelo público de capacidades, las formas de los plugins y los contratos
de propiedad/ejecución, consulte [Arquitectura de plugins](/es/plugins/architecture). Esta página cubre
los mecanismos internos: Pipeline de carga, registro, hooks de runtime, rutas HTTP del Gateway,
rutas de importación y tablas de esquemas.

## Pipeline de carga

Al iniciarse, OpenClaw hace aproximadamente lo siguiente:

1. descubre las raíces de plugins candidatas
2. lee los manifiestos de paquetes nativos o compatibles y los metadatos del paquete
3. rechaza los candidatos no seguros
4. normaliza la configuración de los plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga los módulos nativos habilitados: los módulos incluidos compilados utilizan un cargador nativo;
   el código fuente TypeScript local de terceros utiliza el mecanismo alternativo de emergencia Jiti
7. llama a los hooks `register(api)` nativos y recopila los registros en el registro de plugins
8. expone el registro a los comandos y las superficies de runtime

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins incluidos utilizan `register`; se recomienda `register` para los plugins nuevos.
</Note>

Las barreras de seguridad se ejecutan **antes** de la ejecución del runtime. El descubrimiento bloquea un candidato
cuando:

- su entrada resuelta escapa de la raíz del plugin
- su ruta (o su directorio raíz) permite la escritura a cualquier usuario
- en el caso de los plugins no incluidos, la propiedad de la ruta no coincide con el uid actual (o con root)

Primero se intenta reparar mediante `chmod` los directorios incluidos que permiten la escritura a cualquier usuario
(las instalaciones de npm/globales pueden distribuir directorios de paquetes con `0777`) antes de que la barrera
vuelva a comprobarlos; las comprobaciones de propiedad se omiten por completo para el origen incluido.

Los candidatos bloqueados siguen incluyendo su id de plugin en el diagnóstico emitido cuando
se conoce (incluidos los ids resueltos a partir de un manifiesto dentro de un directorio
rechazado por otros motivos), de modo que la configuración que hace referencia a ese id muestra un plugin
bloqueado asociado a una advertencia de seguridad de la ruta en lugar de un error
de «plugin desconocido» no relacionado.

### Comportamiento basado primero en el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo utiliza para:

- identificar el plugin
- descubrir los canales, Skills, esquemas de configuración o capacidades del paquete declarados
- validar `plugins.entries.<id>.config`
- ampliar las etiquetas y los textos de marcador de posición de la interfaz de control
- mostrar los metadatos de instalación y catálogo
- conservar descriptores ligeros de activación y configuración sin cargar el runtime del plugin

Para los plugins nativos, el módulo de runtime es la parte del plano de datos. Registra
el comportamiento real, como hooks, herramientas, comandos o flujos de proveedores.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores exclusivamente de metadatos para planificar la activación y descubrir la configuración;
no sustituyen el registro en runtime, `register(...)` ni `setupEntry`.
Los consumidores de activación en vivo utilizan indicios del manifiesto sobre comandos, canales y proveedores para
restringir la carga de plugins antes de una materialización más amplia del registro:

- la carga de la CLI se restringe a los plugins que poseen el comando principal solicitado
- la configuración del canal y la resolución de plugins se restringen a los plugins que poseen el id
  de canal solicitado
- la configuración explícita del proveedor y la resolución en runtime se restringen a los plugins que poseen el id
  de proveedor solicitado
- la planificación del inicio del Gateway utiliza `activation.onStartup` para las importaciones explícitas
  de inicio; los plugins sin metadatos de inicio solo se cargan mediante desencadenadores
  de activación más específicos

El planificador de activación expone tanto una API que solo contiene ids para los consumidores existentes como una
API de planes para los diagnósticos. Las entradas del plan indican por qué se seleccionó un plugin,
distinguiendo los indicios explícitos `activation.*` del mecanismo alternativo basado en la propiedad del manifiesto:

| Motivo (según los indicios `activation.*`)   | Motivo (según la propiedad del manifiesto)                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                            |
| — (el desencadenador del hook no tiene una variante de indicio) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

Esa separación de motivos es el límite de compatibilidad: los metadatos de plugins existentes
siguen funcionando, mientras que el código nuevo puede detectar indicios amplios o el comportamiento alternativo
sin cambiar la semántica de carga en runtime.

Las precargas de runtime durante las solicitudes que piden el ámbito amplio `all` siguen derivando
un conjunto explícito de ids efectivos de plugins a partir de la configuración, la planificación del inicio, los canales
configurados, los slots y las reglas de habilitación automática
(`resolveEffectivePluginIds` en `src/plugins/effective-plugin-ids.ts`). Si ese
conjunto derivado está vacío, OpenClaw mantiene vacío el ámbito en lugar de ampliarlo a
todos los plugins detectables.

El descubrimiento de configuración prefiere los ids propiedad de los descriptores, como `setup.providers` y
`setup.cliBackends`, para restringir los plugins candidatos antes de recurrir a
`setup-api` en el caso de plugins que aún necesitan hooks de runtime durante la configuración. Las listas de configuración
de proveedores utilizan `providerAuthChoices` del manifiesto, las opciones de configuración derivadas de descriptores
y los metadatos del catálogo de instalación sin cargar el runtime del proveedor. Un valor explícito
`setup.requiresRuntime: false` es un límite basado únicamente en descriptores; omitir
`requiresRuntime` mantiene el mecanismo alternativo heredado de la API de configuración por compatibilidad. Si
más de un plugin descubierto declara el mismo proveedor de configuración normalizado o
id de backend de CLI, la búsqueda de configuración rechaza al propietario ambiguo en lugar de depender del
orden de descubrimiento. Cuando se ejecuta el runtime de configuración, los diagnósticos del registro indican
las diferencias entre `setup.providers` / `setup.cliBackends` y los proveedores o backends de CLI
registrados realmente por la API de configuración, sin bloquear los plugins heredados.

### Límite de caché de plugins

OpenClaw no almacena en caché los resultados de descubrimiento de plugins ni los datos directos del registro
de manifiestos tras intervalos de tiempo. Las instalaciones, las ediciones de manifiestos y los cambios en las rutas
de carga deben hacerse visibles en la siguiente lectura explícita de metadatos o reconstrucción de instantánea.
El analizador de archivos de manifiesto mantiene una caché limitada de firmas de archivo cuya clave se compone de la
ruta del manifiesto abierto junto con el dispositivo/inodo, el tamaño y mtime/ctime; esa caché solo
evita volver a analizar bytes que no han cambiado y no debe almacenar en caché respuestas de descubrimiento, registro,
propiedad ni políticas.

La ruta rápida y segura para los metadatos es la propiedad explícita de objetos, no una caché oculta.
Las rutas críticas de inicio del Gateway deben pasar el `PluginMetadataSnapshot` actual, el
`PluginLookUpTable` derivado o un registro explícito de manifiestos a través de la cadena
de llamadas. La validación de configuración, la habilitación automática al inicio, el arranque de plugins y la selección
de proveedores pueden reutilizar esos objetos mientras representen la configuración y el inventario de plugins
actuales. La búsqueda de configuración sigue reconstruyendo los metadatos de manifiestos bajo demanda,
salvo que la ruta de configuración específica reciba un registro explícito de manifiestos; debe mantenerse
como un mecanismo alternativo de ruta no crítica en lugar de añadir cachés ocultas de búsqueda. Cuando cambie la
entrada, se debe reconstruir y sustituir la instantánea en lugar de modificarla o
conservar copias históricas. Las vistas del registro de plugins activo y los asistentes de arranque
de canales incluidos deben volver a calcularse a partir del registro o la raíz
actuales. Se permiten mapas de corta duración dentro de una llamada para deduplicar trabajo o
evitar la reentrada; no deben convertirse en cachés de metadatos del proceso.

Para cargar plugins, la capa de caché persistente es la carga en runtime. Puede reutilizar
el estado del cargador cuando el código o los artefactos instalados se cargan realmente, como:

- `PluginLoaderCacheState` y registros de runtime activos compatibles
- cachés de Jiti/módulos y cachés del cargador de superficies públicas utilizadas para evitar importar
  repetidamente la misma superficie de runtime
- cachés del sistema de archivos para artefactos de plugins instalados
- mapas de corta duración por llamada para normalizar rutas o resolver duplicados

Esas cachés son detalles de implementación del plano de datos. No deben responder
preguntas del plano de control como «¿qué plugin posee este proveedor?», salvo que el
consumidor haya solicitado deliberadamente la carga en runtime.

No se deben añadir cachés persistentes ni basadas en intervalos de tiempo para:

- resultados de descubrimiento
- registros directos de manifiestos
- registros de manifiestos reconstruidos a partir del índice de plugins instalados
- búsqueda del propietario del proveedor, supresión de modelos, políticas de proveedores o metadatos
  de artefactos públicos
- cualquier otra respuesta derivada del manifiesto para la que un manifiesto, índice instalado
  o ruta de carga modificados deban ser visibles en la siguiente lectura de metadatos

Los consumidores que reconstruyen los metadatos de manifiestos a partir del índice persistente de plugins
instalados reconstruyen ese registro bajo demanda. El índice instalado es un estado duradero
del plano de origen; no es una caché oculta de metadatos dentro del proceso.

## Modelo del registro

Los plugins cargados no modifican directamente variables globales arbitrarias del núcleo. Se registran en un
registro central de plugins (`PluginRegistry` en `src/plugins/registry-types.ts`),
que realiza el seguimiento de los registros de plugins (identidad, fuente, origen, estado y diagnósticos),
además de matrices para cada capacidad: herramientas, hooks heredados y hooks tipados,
canales, proveedores, controladores RPC del Gateway, rutas HTTP, registradores de CLI,
servicios en segundo plano, comandos propiedad de plugins y decenas de familias de proveedores
tipadas adicionales (voz, embeddings, generación de imágenes/vídeos/música,
obtención/búsqueda web, entornos de agentes, acciones de sesión, etc.).

Después, las funciones del núcleo leen ese registro en lugar de comunicarse directamente con los módulos
de plugins. Esto mantiene la carga unidireccional:

- módulo del plugin -> registro en el registro
- runtime del núcleo -> consumo del registro

Esta separación es importante para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo
necesitan un punto de integración: «leer el registro», no «tratar cada
módulo de plugin como un caso especial».

## Callbacks de vinculación de conversaciones

Los plugins que vinculan una conversación pueden reaccionar cuando se resuelve una aprobación.

Utilice `api.onConversationBindingResolved(...)` para recibir un callback después de que se apruebe o rechace una solicitud
de vinculación:

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

      // La solicitud se rechazó; borra cualquier estado pendiente local.
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

Este callback solo sirve como notificación. No cambia quién puede vincular una
conversación y se ejecuta después de que finalice el procesamiento de aprobación del núcleo.

## Hooks de runtime del proveedor

Los plugins de proveedores tienen tres capas:

- **Metadatos del manifiesto** para consultas económicas antes de la ejecución:
  `setup.providers[].envVars`, compatibilidad obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks durante la configuración**: `catalog` (anterior `discovery`) más
  `applyConfigDefaults`.
- **Hooks de ejecución**: más de 40 hooks opcionales que abarcan la autenticación, la resolución de modelos,
  el encapsulado de flujos, los niveles de razonamiento, la política de reproducción y los endpoints de uso. Consulte
  [Orden y uso de los hooks](#hook-order-and-usage).

OpenClaw sigue gestionando el bucle genérico del agente, la conmutación por error, el manejo de transcripciones y
la política de herramientas. Estos hooks son la superficie de extensión para el comportamiento
específico de cada proveedor sin necesitar un transporte de inferencia personalizado completo.

Use `setup.providers[].envVars` del manifiesto cuando el proveedor tenga
credenciales basadas en variables de entorno que las rutas genéricas de autenticación, estado o selección de modelos deban detectar sin
cargar la ejecución del plugin. El elemento obsoleto `providerAuthEnvVars` se sigue leyendo mediante el
adaptador de compatibilidad durante el período de obsolescencia, y los plugins no incluidos
que lo utilizan reciben un diagnóstico del manifiesto. Use `providerAuthAliases`
del manifiesto cuando un id de proveedor deba reutilizar las variables de entorno, los perfiles de autenticación,
la autenticación respaldada por configuración y la opción de incorporación con clave de API de otro id de proveedor. Use
`providerAuthChoices` del manifiesto cuando las superficies de la CLI para la incorporación o la elección de autenticación deban conocer el
id de la opción del proveedor, las etiquetas de grupo y la configuración sencilla de autenticación mediante una sola marca sin
cargar la ejecución del proveedor. Reserve
`envVars` de la ejecución del proveedor para indicaciones dirigidas al operador, como etiquetas de incorporación o variables
de configuración del id y el secreto de cliente de OAuth.

Use `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración basada en variables de entorno que
el mecanismo genérico de reserva del entorno del shell, las comprobaciones de configuración o estado, o las solicitudes de configuración deban detectar
sin cargar la ejecución del canal.

### Orden y uso de los hooks

Para los plugins de modelos o proveedores, OpenClaw llama a los hooks aproximadamente en este orden.
La columna «Cuándo usarlo» es la guía rápida para tomar decisiones.
Los campos de proveedor exclusivos para compatibilidad que OpenClaw ya no invoca, como
`ProviderPlugin.capabilities` y `suppressBuiltInModel`, no se incluyen aquí
intencionadamente.

| Hook                              | Qué hace                                                                                                   | Cuándo usarlo                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publicar la configuración del proveedor en `models.providers` durante la generación de `models.json`                                | El proveedor posee un catálogo o valores predeterminados de URL base                                                                                                  |
| `applyConfigDefaults`             | Aplicar valores predeterminados de configuración global propiedad del proveedor durante la materialización de la configuración                                      | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de la familia de modelos del proveedor                                                                         |
| _(búsqueda de modelos integrada)_         | OpenClaw prueba primero la ruta normal del registro/catálogo                                                          | _(no es un hook de Plugin)_                                                                                                                         |
| `normalizeModelId`                | Normalizar alias heredados o preliminares de identificadores de modelo antes de la búsqueda                                                     | El proveedor se encarga de depurar los alias antes de la resolución canónica del modelo                                                                                 |
| `normalizeTransport`              | Normalizar `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo                                      | El proveedor se encarga de depurar el transporte para identificadores de proveedor personalizados de la misma familia de transporte                                                          |
| `normalizeConfig`                 | Normalizar `models.providers.<id>` antes de la resolución del entorno de ejecución/proveedor                                           | El proveedor necesita una depuración de la configuración que debe residir en el plugin; los asistentes integrados de la familia de Google también respaldan las entradas de configuración de Google compatibles   |
| `applyNativeStreamingUsageCompat` | Aplicar reescrituras de compatibilidad del uso de streaming nativo a los proveedores de configuración                                               | El proveedor necesita correcciones de metadatos de uso de streaming nativo determinadas por el endpoint                                                                          |
| `resolveConfigApiKey`             | Resolver la autenticación mediante marcadores de entorno para los proveedores de configuración antes de cargar la autenticación del entorno de ejecución                                       | Los proveedores exponen sus propios hooks de resolución de claves de API mediante marcadores de entorno                                                                                |
| `resolveSyntheticAuth`            | Exponer autenticación local, autoalojada o respaldada por configuración sin almacenar texto sin formato                                   | El proveedor puede funcionar con un marcador de credencial sintético/local                                                                                 |
| `resolveExternalAuthProfiles`     | Superponer perfiles de autenticación externos propiedad del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales propiedad de la CLI/aplicación | El proveedor reutiliza credenciales de autenticación externas sin almacenar tokens de actualización copiados; declarar `contracts.externalAuthProviders` en el manifiesto |
| `shouldDeferSyntheticProfileAuth` | Reducir la prioridad de los marcadores de posición de perfiles sintéticos almacenados frente a la autenticación respaldada por entorno/configuración                                      | El proveedor almacena perfiles de marcadores de posición sintéticos que no deben tener prioridad                                                                 |
| `resolveDynamicModel`             | Alternativa síncrona para identificadores de modelo propiedad del proveedor que aún no están en el registro local                                       | El proveedor acepta identificadores de modelo ascendentes arbitrarios                                                                                                 |
| `prepareDynamicModel`             | Preparación asíncrona, tras la cual `resolveDynamicModel` vuelve a ejecutarse                                                           | El proveedor necesita metadatos de red antes de resolver identificadores desconocidos                                                                                  |
| `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor integrado use el modelo resuelto                                               | El proveedor necesita reescrituras de transporte, pero sigue usando un transporte del núcleo                                                                             |
| `normalizeToolSchemas`            | Normalizar los esquemas de herramientas antes de que el ejecutor integrado los procese                                                    | El proveedor necesita depurar esquemas de la familia de transporte                                                                                                |
| `inspectToolSchemas`              | Exponer diagnósticos de esquemas propiedad del proveedor después de la normalización                                                  | El proveedor quiere advertencias de palabras clave sin incorporar al núcleo reglas específicas del proveedor                                                                 |
| `resolveReasoningOutputMode`      | Seleccionar el contrato de salida de razonamiento nativo o etiquetado                                                              | El proveedor necesita una salida etiquetada de razonamiento/final en lugar de campos nativos                                                                         |
| `prepareExtraParams`              | Normalizar los parámetros de solicitud antes de los envoltorios genéricos de opciones de streaming                                              | El proveedor necesita parámetros de solicitud predeterminados o una depuración de parámetros específica del proveedor                                                                           |
| `createStreamFn`                  | Sustituir por completo la ruta normal de streaming por un transporte personalizado                                                   | El proveedor necesita un protocolo de comunicación personalizado, no solo un envoltorio                                                                                     |
| `wrapStreamFn`                    | Envoltorio de streaming después de aplicar los envoltorios genéricos                                                              | El proveedor necesita envoltorios de compatibilidad para encabezados/cuerpo/modelo de la solicitud sin un transporte personalizado                                                          |
| `resolveTransportTurnState`       | Adjuntar encabezados o metadatos de transporte nativos por turno                                                           | El proveedor quiere que los transportes genéricos envíen la identidad de turno nativa del proveedor                                                                       |
| `resolveWebSocketSessionPolicy`   | Adjuntar encabezados nativos de WebSocket o una política de enfriamiento de sesión                                                    | El proveedor quiere que los transportes WS genéricos ajusten los encabezados de sesión o la política de alternativa                                                               |
| `formatApiKey`                    | Formateador de perfiles de autenticación: el perfil almacenado se convierte en la cadena `apiKey` del entorno de ejecución                                     | El proveedor almacena metadatos de autenticación adicionales y necesita un formato personalizado del token del entorno de ejecución                                                                    |
| `refreshOAuth`                    | Sustitución de la actualización de OAuth para endpoints de actualización personalizados o una política ante fallos de actualización                                  | El proveedor no se adapta a los actualizadores compartidos de OpenClaw                                                                                          |
| `buildAuthDoctorHint`             | Sugerencia de reparación añadida cuando falla la actualización de OAuth                                                                  | El proveedor necesita instrucciones de reparación de autenticación propias tras un fallo de actualización                                                                      |
| `matchesContextOverflowError`     | Detector de desbordamiento de la ventana de contexto propiedad del proveedor                                                                 | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas no detectarían                                                                                |
| `classifyFailoverReason`          | Clasificación de motivos de conmutación por error propiedad del proveedor                                                                  | El proveedor puede asignar errores sin procesar de API/transporte a límite de tasa, sobrecarga, etc.                                                                          |
| `isCacheTtlEligible`              | Política de caché de prompts para proveedores de proxy/backhaul                                                               | El proveedor necesita restricciones de TTL de caché específicas del proxy                                                                                                |
| `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por falta de autenticación                                                      | El proveedor necesita una sugerencia específica de recuperación por falta de autenticación                                                                                 |
| `augmentModelCatalog`             | Filas sintéticas/finales del catálogo añadidas después del descubrimiento (obsoleto, véase más adelante)                                  | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y los selectores                                                                     |
| `resolveThinkingProfile`          | Conjunto de niveles `/think` específicos del modelo, etiquetas visibles y valor predeterminado                                                 | El proveedor expone una escala de pensamiento personalizada o una etiqueta binaria para los modelos seleccionados                                                                 |
| `isBinaryThinking`                | Hook de compatibilidad para activar/desactivar el razonamiento                                                                     | El proveedor solo expone la activación/desactivación binaria del pensamiento                                                                                                  |
| `supportsXHighThinking`           | Hook de compatibilidad con el razonamiento `xhigh`                                                                   | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                                             |
| `resolveDefaultThinkingLevel`     | Hook de compatibilidad con el nivel `/think` predeterminado                                                                      | El proveedor posee la política `/think` predeterminada para una familia de modelos                                                                                      |
| `isModernModelRef`                | Detector de modelos modernos para filtros de perfiles en vivo y selección de pruebas rápidas                                              | El proveedor se encarga de la coincidencia de modelos preferidos para pruebas en vivo/rápidas                                                                                             |
| `prepareRuntimeAuth`              | Intercambiar una credencial configurada por el token/clave real del entorno de ejecución justo antes de la inferencia                       | El proveedor necesita un intercambio de tokens o una credencial de solicitud de corta duración                                                                             |
| `resolveUsageAuth`                | Resolver credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                                     | El proveedor necesita un análisis personalizado del token de uso/cuota o una credencial de uso distinta                                                               |
| `fetchUsageSnapshot`              | Obtener y normalizar instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación                             | El proveedor necesita un endpoint de uso o un analizador de carga útil específicos del proveedor                                                                           |
| `createEmbeddingProvider`         | Crear un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                                 | El comportamiento de los embeddings de memoria corresponde al plugin del proveedor                                                            |
| `buildReplayPolicy`               | Devolver una política de reproducción que controle el manejo de la transcripción para el proveedor             | El proveedor necesita una política de transcripción personalizada (por ejemplo, la eliminación de bloques de razonamiento)                     |
| `sanitizeReplayHistory`           | Reescribir el historial de reproducción después de la limpieza genérica de la transcripción                    | El proveedor necesita reescrituras de reproducción específicas más allá de los asistentes compartidos de Compaction                           |
| `validateReplayTurns`             | Realizar la validación o reformulación final del turno de reproducción antes del ejecutor integrado             | El transporte del proveedor necesita una validación de turnos más estricta después de la depuración genérica                                   |
| `onModelSelected`                 | Ejecutar efectos secundarios posteriores a la selección que sean propiedad del proveedor                       | El proveedor necesita telemetría o un estado propio cuando se activa un modelo                                                                 |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` comprueban primero el
plugin del proveedor coincidente y, después, prueban los demás plugins de proveedor compatibles con hooks
hasta que uno cambia realmente el id del modelo o el transporte/la configuración. Esto permite que
los adaptadores de alias/compatibilidad de proveedores sigan funcionando sin exigir que el llamador sepa qué
plugin incluido es responsable de la reescritura. Si ningún hook de proveedor reescribe una entrada de
configuración compatible de la familia Google, el normalizador de configuración de Google incluido sigue aplicando
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de conexión completamente personalizado o un ejecutor de solicitudes personalizado,
se trata de una clase de extensión diferente. Estos hooks están destinados al comportamiento del proveedor
que sigue ejecutándose en el bucle de inferencia normal de OpenClaw.

`resolveUsageAuth` decide si OpenClaw debe llamar a `fetchUsageSnapshot` o
recurrir a la resolución genérica de credenciales para las superficies de uso/estado. Devuelva
`{ token, accountId?, subscriptionType?, rateLimitTier? }` cuando el proveedor
tenga una credencial de uso (los metadatos opcionales del plan se transfieren a
`fetchUsageSnapshot`), devuelva
`{ handled: true }` cuando la autenticación de uso propiedad del proveedor haya gestionado la solicitud y
deba impedir el mecanismo alternativo genérico de clave de API/OAuth, y devuelva `null` o `undefined`
cuando el proveedor no haya gestionado la autenticación de uso.

Declare las credenciales de organización o facturación en el manifiesto
`providerUsageAuthEnvVars`. Esto permite que las superficies genéricas de descubrimiento y eliminación de secretos
las reconozcan sin convertirlas en candidatas de autenticación para inferencia.

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

Los plugins de proveedor incluidos combinan los hooks anteriores para adaptarse a las necesidades de catálogo,
autenticación, razonamiento, reproducción y uso de cada proveedor. El conjunto de hooks oficial se encuentra en
cada plugin bajo `extensions/`; esta página ilustra las estructuras en lugar de
reproducir la lista.

<AccordionGroup>
  <Accordion title="Proveedores de catálogo de paso directo">
    OpenRouter, Kilocode, Z.AI y xAI registran `catalog` junto con
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer los
    id de modelo ascendentes antes que el catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Proveedores de endpoints de OAuth y uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi y z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para gestionar el intercambio de tokens y la integración de `/usage`.
  </Accordion>
  <Accordion title="Familias de limpieza de reproducciones y transcripciones">
    Las familias compartidas con nombre (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los proveedores adopten
    la política de transcripción mediante `buildReplayPolicy`, en lugar de que cada plugin
    vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Proveedores solo de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran únicamente `catalog` y utilizan el bucle de inferencia compartido.
  </Accordion>
  <Accordion title="Ayudantes de flujo específicos de Anthropic">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` se encuentran dentro de la
    interfaz pública `api.ts` / `contract-api.ts` del plugin de Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), en lugar de estar en
    el SDK genérico.
  </Accordion>
</AccordionGroup>

## Ayudantes del entorno de ejecución

Los plugins pueden acceder a determinados ayudantes del núcleo mediante `api.runtime`. Para TTS:

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

- `textToSpeech` devuelve la carga útil normal de salida TTS del núcleo para superficies de archivos/notas de voz.
- Utiliza la configuración `messages.tts` y la selección de proveedor del núcleo.
- Devuelve un búfer de audio PCM y la frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional para cada proveedor. Se utiliza para selectores de voz o flujos de configuración gestionados por el proveedor.
- El núcleo proporciona una fecha límite resuelta para la solicitud a los hooks `listVoices` del proveedor; la configuración de tiempo de espera específica del proveedor puede sustituirla.
- Las listas de voces pueden incluir metadatos más detallados, como configuración regional, género y etiquetas de personalidad, para selectores que tengan en cuenta al proveedor.
- OpenAI y ElevenLabs admiten actualmente telefonía. Microsoft no.

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

- Mantenga en el núcleo la política de TTS, el mecanismo alternativo y la entrega de respuestas.
- Utilice proveedores de voz para el comportamiento de síntesis gestionado por el proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido se orienta a la empresa: un plugin de proveedor puede gestionar
  proveedores de texto, voz, imágenes y futuros medios a medida que OpenClaw añada esos
  contratos de capacidades.

Para la comprensión de imágenes/audio/vídeo, los plugins registran un proveedor tipado
de comprensión de medios en lugar de un contenedor genérico de clave/valor:

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

- Mantenga en el núcleo la orquestación, el mecanismo alternativo, la configuración y la conexión con los canales.
- Mantenga el comportamiento del proveedor en el plugin del proveedor.
- La ampliación aditiva debe mantener el tipado: nuevos métodos opcionales, nuevos
  campos de resultado opcionales y nuevas capacidades opcionales.
- La generación de vídeo ya sigue el mismo patrón:
  - el núcleo gestiona el contrato de capacidades y el ayudante del entorno de ejecución
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de funciones/canales utilizan `api.runtime.videoGeneration.*`

Para los ayudantes del entorno de ejecución de comprensión de medios, los plugins pueden llamar a:

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

Para la transcripción de audio, los plugins pueden utilizar el entorno de ejecución de comprensión de medios
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
  la comprensión de imágenes/audio/vídeo.
- `extractStructuredWithModel(...)` es la interfaz orientada a plugins para la extracción acotada,
  centrada en imágenes y gestionada por el proveedor. Incluya al menos una entrada de imagen;
  las entradas de texto son contexto complementario. Los plugins de producto gestionan sus rutas y
  esquemas, mientras que OpenClaw gestiona el límite entre el proveedor y el entorno de ejecución.
- Utiliza la configuración de audio de comprensión de medios del núcleo (`tools.media.audio`) y el orden de mecanismos alternativos de proveedores.
- Devuelve `{ text: undefined }` cuando no se genera ninguna salida de transcripción (por ejemplo, una entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` se mantiene como alias de compatibilidad.

Los plugins también pueden iniciar ejecuciones de subagentes en segundo plano mediante `api.runtime.subagent`:

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
- `toolsAlsoAllow` acepta nombres de herramientas exactos y de propiedad inequívoca registrados por el plugin llamador. Se rechazan los nombres del núcleo y los ambiguos. Se añade al perfil normal, pero las listas de permitidos y las denegaciones del operador siguen teniendo autoridad.
- OpenClaw solo respeta esos campos de sustitución para llamadores de confianza.
- Para las ejecuciones alternativas gestionadas por plugins, los operadores deben habilitarlas expresamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilice `plugins.entries.<id>.subagent.allowedModels` para restringir los plugins de confianza a objetivos canónicos `provider/model` específicos, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagentes de plugins que no son de confianza siguen funcionando, pero las solicitudes de sustitución se rechazan en lugar de recurrir silenciosamente al mecanismo alternativo.
- Las sesiones de subagentes creadas por plugins se etiquetan con el id del plugin creador. El mecanismo alternativo `api.runtime.subagent.deleteSession(...)` solo puede eliminar esas sesiones propias; la eliminación arbitraria de sesiones sigue requiriendo una solicitud al Gateway con ámbito de administrador.

Para la búsqueda web, los plugins pueden utilizar el ayudante compartido del entorno de ejecución en lugar de
acceder directamente a la conexión de herramientas del agente:

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

- Mantén en el núcleo la selección de proveedores, la resolución de credenciales y la semántica compartida de las solicitudes.
- Usa proveedores de búsqueda web para los transportes de búsqueda específicos de cada proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para los plugins de funcionalidades/canales que necesitan funciones de búsqueda sin depender del contenedor de herramientas del agente.

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
- `auth`: obligatorio, `"gateway"` o `"plugin"`. Usa `"gateway"` para exigir la autenticación normal del Gateway, o `"plugin"` para la autenticación/verificación de Webhooks gestionada por el plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `handleUpgrade`: controlador opcional para solicitudes de actualización a WebSocket en la misma ruta.
- `replaceExisting`: opcional. Permite que el mismo plugin sustituya su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta haya procesado la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que se use `replaceExisting: true`, y un plugin no puede sustituir la ruta de otro plugin.
- Las rutas superpuestas con niveles de `auth` diferentes se rechazan. Mantén las cadenas de continuación `exact`/`prefix` únicamente en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente ámbitos de ejecución del operador. Están destinadas a la verificación de Webhooks/firmas gestionada por el plugin, no a llamadas privilegiadas a auxiliares del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro del ámbito de ejecución de una solicitud del Gateway. La superficie predeterminada (`gatewayRuntimeScopeSurface: "write-default"`) es deliberadamente conservadora:
  - la autenticación de portador mediante secreto compartido (`gateway.auth.mode = "token"` / `"password"`) y cualquier método de autenticación que no sea de proxy de confianza reciben un único ámbito `operator.write`, incluso si el llamante envía `x-openclaw-scopes`
  - los llamantes `trusted-proxy` sin una cabecera `x-openclaw-scopes` explícita también conservan la superficie heredada exclusiva de `operator.write`
  - los llamantes `trusted-proxy` que sí envían `x-openclaw-scopes` reciben en su lugar los ámbitos declarados
  - una ruta puede habilitar `gatewayRuntimeScopeSurface: "trusted-operator"` para respetar siempre `x-openclaw-scopes` en los modos de autenticación que incluyen identidad (recurriendo al conjunto completo de ámbitos predeterminados de la CLI cuando la cabecera no está presente)
- Las pestañas externas de la interfaz de control en entorno aislado respaldadas por rutas `auth: "gateway"` usan una concesión de cookie firmada de corta duración, emitida únicamente mediante un arranque autenticado; las pestañas con autenticación de plugin mantienen su ruta directa de iframe. Antes del montaje, el elemento padre ejecuta una comprobación propiedad de la ruta dentro del mismo entorno aislado opaco y adopta un cierre seguro cuando la política de privacidad del navegador bloquea la cookie. La concesión está vinculada al plugin propietario, a la raíz de la ruta coincidente y a la generación de autenticación actual; su nombre de cookie aleatorio para cada proceso impide que distintos Gateways de confianza en el mismo host se sobrescriban entre sí, pero las cookies nunca aíslan puertos TCP. Por tanto, el nombre de host del Gateway constituye un único límite de credenciales: no alojes conjuntamente servicios que no confíen mutuamente en ese nombre de host, incluidos otros puertos. El enrutamiento rechaza reutilizar la concesión en una ruta anidada propiedad de otro plugin. Dado que los descendientes del entorno aislado se consideran de sitios cruzados a efectos de las cookies, la concesión solo acepta `GET` y `HEAD` con `operator.read`; las mutaciones y las actualizaciones a WebSocket permanecen en superficies con autenticación explícita del Gateway. La cookie no puede usar CHIPS de forma deliberada: los navegadores actuales incluyen un bit de ancestro de sitio cruzado en la clave de partición, por lo que los marcos anidados de entornos aislados opacos perderían el acceso a los recursos de la misma ruta. La cookie requiere un contexto seguro y el permiso del navegador para cookies de sitios cruzados, por lo que las pestañas externas con autenticación del Gateway no están disponibles en orígenes LAN con HTTP sin cifrar ni cuando existe un bloqueo total de cookies de terceros; usa HTTPS/Tailscale Serve o un bucle invertido de confianza para el navegador con una política de cookies compatible.
- La concesión evita la divulgación del token de portador del Gateway y la reutilización accidental de rutas/ámbitos; no crea un límite de seguridad entre plugins nativos. El código del plugin nativo y el contenido de la interfaz que proporciona siguen formando parte del mismo límite de confianza del plugin dentro del proceso.
- Regla práctica: no des por sentado que una ruta de plugin con autenticación del Gateway es una superficie de administración implícita. Si la ruta necesita funciones exclusivas de administración, habilita la superficie de ámbito `trusted-operator`, exige un modo de autenticación que incluya identidad y documenta el contrato explícito de la cabecera `x-openclaw-scopes`.
- Tras la coincidencia de ruta y la autenticación, los controladores ordinarios participan en la admisión de trabajo raíz del Gateway. Un Gateway preparado o reiniciándose devuelve `503` antes de invocar al controlador. La única excepción limitada es una ruta `auth: "gateway"` habilitada por el manifiesto que también habilita la superficie específica de la ruta `trusted-operator`; permanece accesible para que el enrutamiento del control de suspensión no quede bloqueado, mientras que las rutas hermanas ordinarias del mismo plugin permanecen tras el límite de admisión. La propiedad de `handleUpgrade` de WebSocket usa el mismo límite de admisión atómico; cuando el controlador acepta un socket, el plugin pasa a ser responsable de su ciclo de vida posterior y este límite deja de realizar su seguimiento.

## Rutas de importación del SDK de plugins

Usa rutas secundarias específicas del SDK en lugar del barrel raíz monolítico
`openclaw/plugin-sdk` al crear plugins nuevos. Rutas secundarias del núcleo:

| Ruta secundaria                     | Propósito                                          |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de plugins                  |
| `openclaw/plugin-sdk/channel-core`  | Auxiliares de entrada/compilación de canales       |
| `openclaw/plugin-sdk/core`          | Auxiliares genéricos compartidos y contrato general |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz `openclaw.json` (`OpenClawSchema`) |

Los plugins de canales eligen entre una familia de interfaces específicas: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un único contrato `approvalCapability` en lugar de mezclarse entre campos de
plugins no relacionados. Consulta [Plugins de canales](/es/plugins/sdk-channel-plugins).

Los auxiliares de ejecución y configuración se encuentran en rutas secundarias específicas de `*-runtime`
correspondientes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Da preferencia a `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation`
en lugar del barrel de compatibilidad general `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
las pequeñas fachadas auxiliares de canales, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
y `openclaw/plugin-sdk/infra-runtime` son adaptadores de compatibilidad obsoletos para
plugins antiguos. El código nuevo debe importar primitivas genéricas más específicas.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de plugin incluido):

- `index.js` — entrada del plugin incluido
- `api.js` — barrel de auxiliares/tipos
- `runtime-api.js` — barrel exclusivo para la ejecución
- `setup-entry.js` — entrada del plugin de configuración

Los plugins externos solo deben importar rutas secundarias de `openclaw/plugin-sdk/*`. Nunca
importes el `src/*` del paquete de otro plugin desde el núcleo ni desde otro plugin.
Los puntos de entrada cargados mediante fachadas dan preferencia a la instantánea de configuración activa de la ejecución cuando
existe y, de lo contrario, recurren al archivo de configuración resuelto en el disco.

Existen rutas secundarias específicas de capacidades, como `image-generation`, `media-understanding`
y `speech`, porque los plugins incluidos las utilizan actualmente. No son
automáticamente contratos externos inmutables a largo plazo; consulta la página de referencia
correspondiente del SDK cuando dependas de ellas.

## Esquemas de la herramienta de mensajes

Los plugins deben ser responsables de las contribuciones al esquema `describeMessageTool(...)`
específicas del canal para primitivas distintas de los mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envíos debe usar el contrato genérico `MessagePresentation`
en lugar de campos de botones, componentes, bloques o tarjetas nativos del proveedor.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para conocer el contrato,
las reglas de reserva, la asignación de proveedores y la lista de comprobación para autores de plugins.

Los plugins capaces de enviar declaran lo que pueden representar mediante las capacidades de mensajes:

- `presentation` para bloques de presentación semánticos (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El núcleo decide si representa la presentación de forma nativa o la degrada a texto.
No expongas vías de escape de interfaz nativas del proveedor desde la herramienta genérica de mensajes.
Los auxiliares obsoletos del SDK para esquemas nativos heredados siguen exportándose para los
plugins de terceros existentes, pero los plugins nuevos no deben usarlos.

## Resolución de destinos de canales

Los plugins de canales deben ser responsables de la semántica de destinos específica del canal. Mantén genérico el
host de salida compartido y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de buscarlo en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al núcleo si una
  entrada debe pasar directamente a una resolución similar a la de un identificador en lugar de buscar en el directorio.
- `messaging.targetResolver.reservedLiterals` enumera las palabras simples que son
  referencias a canales/sesiones para ese proveedor. La resolución conserva las entradas
  configuradas del directorio antes de rechazar los literales reservados y, después, adopta
  un cierre seguro si no hay ninguna coincidencia en el directorio.
- `messaging.targetResolver.resolveTarget(...)` es el mecanismo de reserva del plugin cuando
  el núcleo necesita una resolución final gestionada por el proveedor después de la normalización o de una
  búsqueda sin resultados en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` gestiona la construcción de rutas de sesión
  específicas del proveedor una vez resuelto un destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deban tomarse antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de «tratar esto como un identificador de destino explícito/nativo».
- Usa `resolveTarget` como mecanismo de reserva de normalización específico del proveedor, no para
  búsquedas generales en el directorio.
- Mantén los identificadores nativos del proveedor, como identificadores de chat, de hilos, JID, nombres de usuario e identificadores
  de salas, dentro de los valores `target` o de parámetros específicos del proveedor, no en campos
  genéricos del SDK.

## Directorios respaldados por la configuración

Los plugins que deriven entradas de directorio de la configuración deben mantener esa lógica en el
plugin y reutilizar los auxiliares compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Usa esto cuando un canal necesite pares/grupos respaldados por la configuración, como:

- pares de MD controlados por lista de permitidos
- mapas de canales/grupos configurados
- alternativas de directorio estático con ámbito de cuenta

Los auxiliares compartidos en `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- auxiliares de deduplicación/normalización
- creación de `ChannelDirectoryEntry[]`

La inspección de cuentas y la normalización de identificadores específicas del canal deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedores pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma estructura que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedores

Use `catalog` cuando el plugin sea propietario de identificadores de modelos específicos del proveedor, valores
predeterminados de la URL base o metadatos de modelos condicionados por la autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un plugin con respecto a los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples basados en claves de API o variables de entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedores relacionados
- `late`: última pasada, después de los demás proveedores implícitos

Los proveedores posteriores prevalecen en caso de colisión de claves, por lo que los plugins pueden sobrescribir intencionadamente una
entrada de proveedor integrada con el mismo identificador de proveedor.

Los plugins también pueden publicar filas de modelos de solo lectura mediante
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Esta es la vía futura para las superficies de lista/ayuda/selector y admite
filas `text`, `voice`, `image_generation`, `video_generation` y `music_generation`.
Los plugins de proveedores siguen siendo responsables de las llamadas a puntos de conexión en vivo, el intercambio de tokens y
la asignación de respuestas del proveedor; el núcleo es responsable de la estructura común de las filas, las etiquetas de origen y
el formato de la ayuda de herramientas multimedia. Los registros de proveedores de generación multimedia sintetizan
automáticamente filas de catálogo estáticas a partir de `defaultModel`, `models` y
`capabilities`.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado, pero emite una advertencia de obsolescencia
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`
  y emite una advertencia
- `augmentModelCatalog` está obsoleto; los proveedores incluidos deben publicar
  filas complementarias mediante `registerModelCatalogProvider`

## Inspección de canales de solo lectura

Si el plugin registra un canal, es preferible implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Motivos:

- `resolveAccount(...)` es la ruta de ejecución. Puede presuponer que las credenciales
  están completamente materializadas y fallar de inmediato cuando falten secretos obligatorios.
- Las rutas de comandos de solo lectura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, y los flujos de reparación de
  doctor/configuración no deberían tener que materializar credenciales de ejecución solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelva únicamente el estado descriptivo de la cuenta.
- Conserve `enabled` y `configured`.
- Incluya campos de origen/estado de las credenciales cuando corresponda, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No es necesario devolver valores de tokens sin procesar únicamente para informar sobre la
  disponibilidad de solo lectura. Devolver `tokenStatus: "available"` (y el campo de
  origen correspondiente) es suficiente para los comandos de estado.
- Use `configured_unavailable` cuando una credencial esté configurada mediante SecretRef, pero
  no esté disponible en la ruta de comandos actual.

Esto permite que los comandos de solo lectura indiquen «configurada, pero no disponible en esta ruta de
comandos» en lugar de bloquearse o informar erróneamente de que la cuenta no está configurada.

## Paquetes agrupados

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

Cada entrada se convierte en un plugin. Si el paquete agrupado enumera varias extensiones, el identificador del plugin
se convierte en `<manifestOrPackageName>/<fileBase>` (prevalece el identificador del manifiesto cuando
está presente; de lo contrario, se usa el nombre `package.json` sin ámbito).

Si el plugin importa dependencias de npm, instálelas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Medida de seguridad: cada entrada `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de resolver los enlaces simbólicos. Se rechazan las entradas que escapen del directorio del paquete.

Nota de seguridad: `openclaw plugins install` instala las dependencias del plugin con un
`npm install --omit=dev --ignore-scripts` local al proyecto (sin scripts de ciclo de vida
ni dependencias de desarrollo durante la ejecución), ignorando la configuración global heredada de instalación de npm.
Mantenga los árboles de dependencias del plugin como «JS/TS puro» y evite los paquetes que requieran
compilaciones `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero exclusivo para la configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún no está configurado, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto reduce el peso del inicio y la configuración
cuando la entrada principal del plugin también conecta herramientas, enlaces u otro código
exclusivo de la ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede incorporar un plugin de canal a la misma ruta `setupEntry` durante la fase de inicio
previa a la escucha del Gateway, incluso cuando el canal ya está configurado.

Use esta opción solo cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el Gateway comience a escuchar. En la práctica, esto significa que la entrada de configuración
debe registrar todas las capacidades propiedad del canal de las que dependa el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el Gateway comience a escuchar
- cualquier método, herramienta o servicio del Gateway que deba existir durante ese mismo intervalo

Si la entrada completa aún es responsable de alguna capacidad de inicio obligatoria, no habilite
esta marca. Mantenga el comportamiento predeterminado del plugin y permita que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar auxiliares de superficie de contrato exclusivos para la configuración que el núcleo
puede consultar antes de cargar la ejecución completa del canal. La superficie actual de
promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración heredada de canal de una sola cuenta
a `channels.<id>.accounts.*` sin cargar la entrada completa del plugin.
Matrix es el ejemplo incluido actual: mueve únicamente las claves de autenticación/inicialización a una
cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede conservar una
clave de cuenta predeterminada configurada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parches de configuración mantienen diferido el descubrimiento de la superficie del contrato incluido. El tiempo de
importación sigue siendo reducido; la superficie de promoción solo se carga en el primer uso, en lugar de
volver a ejecutar el inicio del canal incluido al importar el módulo.

Cuando esas superficies de inicio incluyan métodos RPC del Gateway, manténgalos bajo un
prefijo específico del plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven
como `operator.admin`, incluso si un plugin solicita un ámbito más limitado.

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
sugerencias de instalación mediante `openclaw.install`. Esto mantiene el catálogo del núcleo sin datos.

Ejemplo:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (alojamiento propio)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat con alojamiento propio mediante bots de webhook de Nextcloud Talk.",
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

- `detailLabel`: etiqueta secundaria para superficies de catálogo/estado más completas
- `docsLabel`: sustituye el texto del enlace a la documentación
- `preferOver`: identificadores de plugins/canales de menor prioridad que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto de la superficie de selección
- `markdownCapable`: marca el canal como compatible con Markdown para las decisiones de formato de salida
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para las superficies de navegación de la documentación
- `showConfigured` / `showInSetup`: alias heredados que aún se aceptan por compatibilidad; se prefiere `exposure`
- `quickstartAllowFrom`: incorpora el canal al flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: exige una vinculación explícita de la cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: da preferencia a la búsqueda de sesiones al resolver destinos de anuncios

OpenClaw también puede fusionar **catálogos de canales externos** (por ejemplo, una exportación de
registro MPM). Coloque un archivo JSON en una de estas ubicaciones:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O haga que `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) apunte a
uno o varios archivos JSON (delimitados por comas/puntos y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados de la clave `"entries"`.

Las entradas generadas del catálogo de canales y del catálogo de instalación de proveedores exponen
datos normalizados sobre el origen de instalación junto al bloque `openclaw.install` sin procesar. Los
datos normalizados identifican si la especificación de npm es una versión exacta o un
selector variable, si están presentes los metadatos de integridad esperados y si también hay disponible una
ruta de origen local. Cuando se conoce la identidad del catálogo/paquete, los
datos normalizados advierten si el nombre del paquete npm analizado difiere de esa identidad.
También advierten cuando `defaultChoice` no es válido o apunta a un origen que
no está disponible, y cuando hay metadatos de integridad de npm sin un origen de npm
válido. Los consumidores deben tratar `installSource` como un campo opcional aditivo para que
las entradas creadas manualmente y los adaptadores de catálogos no tengan que sintetizarlo.
Esto permite que la incorporación y los diagnósticos expliquen el estado del plano de origen sin
importar la ejecución del plugin.

Las entradas npm externas oficiales deberían preferir un `npmSpec` exacto junto con
`expectedIntegrity`. Los nombres de paquetes sin más y las etiquetas de distribución siguen funcionando por
compatibilidad, pero generan advertencias del plano de origen para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas mediante integridad sin romper los plugins existentes.
Cuando el proceso de incorporación instala desde una ruta de catálogo local, registra una entrada
administrada del índice de plugins con `source: "path"` y un
`sourcePath` relativo al espacio de trabajo cuando es posible. La ruta de carga operativa absoluta permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas de estaciones de trabajo locales
en la configuración de larga duración. Esto mantiene las instalaciones de desarrollo local visibles para
los diagnósticos del plano de origen sin añadir una segunda superficie de divulgación de rutas directas
del sistema de archivos. La tabla SQLite `installed_plugin_index` persistida es la fuente de verdad
de las instalaciones y puede actualizarse sin cargar los módulos de tiempo de ejecución de los plugins.
Su mapa `installRecords` es duradero incluso cuando falta el manifiesto de un plugin o
no es válido; su carga útil `plugins` es una vista reconstruible del manifiesto.

## Plugins de motores de contexto

Los plugins de motores de contexto se encargan de orquestar el contexto de sesión para la ingesta, el ensamblaje
y la Compaction. Regístrelos desde el plugin con
`api.registerContextEngine(id, factory)` y, a continuación, seleccione el motor activo con
`plugins.slots.contextEngine`.

Utilice esta opción cuando el plugin necesite sustituir o ampliar el pipeline de contexto
predeterminado, en lugar de limitarse a añadir búsqueda en memoria o hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

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
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
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

La factoría `ctx` expone valores opcionales `config`, `agentDir` y `workspaceDir`
para la inicialización durante la construcción.

El host completa la preparación asíncrona registrada del prompt de memoria antes de llamar a
`assemble()` de un motor no heredado. `buildMemorySystemPromptAddition(...)` permanece
síncrono y lee esa instantánea inmutable de la ejecución mientras `assemble()` está activo.
Transmita sin cambios el contexto proporcionado de herramientas y citas para que la instantánea
no pueda cruzar los límites de la ejecución.

`assemble()` puede devolver `contextProjection` cuando el arnés activo tiene un
hilo de backend persistente. Omítalo para la proyección heredada por turno. Devuelva
`{ mode: "thread_bootstrap", epoch }` cuando el contexto ensamblado deba
inyectarse una vez en un hilo de backend y reutilizarse hasta que cambie la época. Cambie
la época después de que cambie el contexto semántico del motor, por ejemplo, tras una
pasada de Compaction gestionada por el motor. Los hosts pueden conservar los metadatos de llamadas a herramientas, la forma
de la entrada y los resultados censurados de herramientas en una proyección de arranque del hilo para que los
hilos de backend nuevos mantengan la continuidad de las herramientas sin copiar cargas útiles directas
que contengan secretos.

Si el motor **no** se encarga del algoritmo de Compaction, mantenga implementado `compact()`
y deléguelo explícitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

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
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
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
el sistema de plugins accediendo de forma privada a sus componentes internos. Añada la capacidad que falta.

Secuencia recomendada:

1. **Defina el contrato del núcleo.** Decida qué comportamiento compartido debe gestionar el núcleo:
   política, fallback, combinación de configuración, ciclo de vida, semántica orientada a canales y
   forma del asistente de tiempo de ejecución.
2. **Añada superficies tipadas de registro y tiempo de ejecución para plugins.** Amplíe
   `OpenClawPluginApi` o `api.runtime`, o ambos, con la superficie tipada de capacidad
   útil más pequeña.
3. **Conecte el núcleo y los consumidores de canales o funcionalidades.** Los canales y los plugins de funcionalidades
   deben consumir la nueva capacidad a través del núcleo, no importando directamente una
   implementación de un proveedor.
4. **Registre las implementaciones de proveedores.** Después, los plugins de proveedores registran sus
   backends para la capacidad.
5. **Añada cobertura del contrato.** Añada pruebas para que la propiedad y la forma del registro
   permanezcan explícitas con el tiempo.

Así es como OpenClaw mantiene criterios definidos sin quedar codificado de forma rígida según la
visión del mundo de un único proveedor. Consulte el [Recetario de capacidades](/es/plugins/adding-capabilities)
para obtener una lista de comprobación concreta de archivos y un ejemplo desarrollado.

### Lista de comprobación de capacidades

Al añadir una nueva capacidad, la implementación normalmente debe abarcar conjuntamente estas
superficies:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- ejecutor o asistente de tiempo de ejecución del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- conexión del registro de plugins en `src/plugins/registry.ts`
- exposición del tiempo de ejecución de plugins en `src/plugins/runtime/*` cuando los plugins de funcionalidades o canales
  necesiten consumirla
- asistentes de captura y pruebas en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad y contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores y plugins en `docs/`

Si falta una de esas superficies, normalmente indica que la capacidad aún
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

Patrón de prueba del contrato (`src/plugins/contracts/registry.ts` expone consultas de propiedad
como `providerContractPluginIds`; las pruebas verifican que la lista
`contracts.videoGenerationProviders` de un plugin coincida con lo que realmente registra):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Esto mantiene la regla sencilla:

- el núcleo gestiona el contrato y la orquestación de la capacidad
- los plugins de proveedores gestionan sus implementaciones
- los plugins de funcionalidades o canales consumen los asistentes de tiempo de ejecución
- las pruebas de contrato mantienen explícita la propiedad

## Contenido relacionado

- [Arquitectura de plugins](/es/plugins/architecture) — modelo público de capacidades y formas
- [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
