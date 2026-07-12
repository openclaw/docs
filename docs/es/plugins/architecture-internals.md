---
read_when:
    - Implementación de hooks de ejecución del proveedor, el ciclo de vida del canal o paquetes de paquetes
    - Depuración del orden de carga de plugins o del estado del registro
    - Añadir una nueva capacidad de Plugin o un Plugin de motor de contexto
summary: 'Detalles internos de la arquitectura de plugins: canalización de carga, registro, hooks de ejecución, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de Plugins
x-i18n:
    generated_at: "2026-07-11T23:16:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para conocer el modelo público de capacidades, las estructuras de los plugins y los contratos de propiedad/ejecución, consulta [Arquitectura de plugins](/es/plugins/architecture). Esta página trata la mecánica interna: canalización de carga, registro, hooks de tiempo de ejecución, rutas HTTP del Gateway, rutas de importación y tablas de esquemas.

## Canalización de carga

Al iniciarse, OpenClaw hace aproximadamente lo siguiente:

1. descubre las raíces de plugins candidatos
2. lee los manifiestos de paquetes nativos o compatibles y los metadatos de los paquetes
3. rechaza los candidatos no seguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`, `slots`, `load.paths`)
5. decide si se habilita cada candidato
6. carga los módulos nativos habilitados: los módulos integrados compilados usan un cargador nativo; el código fuente TypeScript local de terceros usa el mecanismo alternativo de emergencia Jiti
7. llama a los hooks nativos `register(api)` y recopila los registros en el registro de plugins
8. expone el registro a los comandos y las superficies de tiempo de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins integrados usan `register`; usa preferentemente `register` para plugins nuevos.
</Note>

Las barreras de seguridad se ejecutan **antes** de la ejecución en tiempo de ejecución. El descubrimiento bloquea un candidato cuando:

- su punto de entrada resuelto sale de la raíz del plugin
- su ruta (o su directorio raíz) permite escritura a todos los usuarios
- en plugins no integrados, la propiedad de la ruta no coincide con el uid actual (ni con root)

Primero se intenta reparar in situ mediante `chmod` los directorios integrados que permiten escritura a todos los usuarios (las instalaciones de npm/globales pueden distribuir directorios de paquetes con permisos `0777`) antes de volver a comprobar la barrera; las comprobaciones de propiedad se omiten por completo para el origen integrado.

Los candidatos bloqueados siguen incluyendo su id de plugin en el diagnóstico emitido cuando se conoce (incluidos los ids resueltos desde un manifiesto dentro de un directorio rechazado por otros motivos), de modo que una configuración que haga referencia a ese id vea un plugin bloqueado asociado a una advertencia de seguridad de la ruta, en lugar de un error no relacionado de «plugin desconocido».

### Comportamiento con prioridad para el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo utiliza para:

- identificar el plugin
- descubrir los canales/Skills/esquemas de configuración o capacidades del paquete declarados
- validar `plugins.entries.<id>.config`
- ampliar las etiquetas y los textos de marcador de posición de la interfaz de control
- mostrar metadatos de instalación/catálogo
- conservar descriptores ligeros de activación y configuración sin cargar el tiempo de ejecución del plugin

Para los plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra el comportamiento real, como hooks, herramientas, comandos o flujos de proveedores.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control. Son descriptores exclusivamente de metadatos para planificar la activación y descubrir la configuración; no sustituyen el registro en tiempo de ejecución, `register(...)` ni `setupEntry`. Los consumidores de activación en vivo utilizan las indicaciones del manifiesto sobre comandos, canales y proveedores para restringir la carga de plugins antes de una materialización más amplia del registro:

- la carga de la CLI se restringe a los plugins propietarios del comando principal solicitado
- la resolución de configuración/plugin del canal se restringe a los plugins propietarios del id de canal solicitado
- la resolución explícita de configuración/tiempo de ejecución del proveedor se restringe a los plugins propietarios del id de proveedor solicitado
- la planificación del inicio del Gateway utiliza `activation.onStartup` para las importaciones explícitas al inicio; los plugins sin metadatos de inicio solo se cargan mediante activadores de activación más específicos

El planificador de activación expone tanto una API exclusivamente de ids para los consumidores existentes como una API de plan para los diagnósticos. Las entradas del plan indican por qué se seleccionó un plugin y separan las indicaciones explícitas de `activation.*` del mecanismo alternativo basado en la propiedad del manifiesto:

| Motivo (de las indicaciones de `activation.*`) | Motivo (de la propiedad del manifiesto)                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`                | —                                                                                              |
| `activation-capability-hint`                   | —                                                                                              |
| `activation-channel-hint`                      | `manifest-channel-owner` (`channels`)                                                          |
| `activation-command-hint`                      | `manifest-command-alias` (`commandAliases`)                                                    |
| `activation-provider-hint`                     | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`)   |
| `activation-route-hint`                        | —                                                                                              |
| — (el activador del hook no tiene una variante de indicación) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)        |

Esa separación de motivos es el límite de compatibilidad: los metadatos existentes de los plugins siguen funcionando, mientras que el código nuevo puede detectar indicaciones amplias o el comportamiento alternativo sin cambiar la semántica de carga en tiempo de ejecución.

Las precargas en tiempo de ejecución durante una solicitud que piden el ámbito amplio `all` siguen derivando de la configuración, la planificación del inicio, los canales configurados, los slots y las reglas de habilitación automática un conjunto explícito de ids de plugins efectivos (`resolveEffectivePluginIds` en `src/plugins/effective-plugin-ids.ts`). Si el conjunto derivado está vacío, OpenClaw mantiene el ámbito vacío en lugar de ampliarlo a todos los plugins detectables.

El descubrimiento de configuración prioriza los ids propiedad de los descriptores, como `setup.providers` y `setup.cliBackends`, para restringir los plugins candidatos antes de recurrir a `setup-api` en el caso de los plugins que todavía necesitan hooks de tiempo de ejecución durante la configuración. Las listas de configuración de proveedores usan `providerAuthChoices` del manifiesto, opciones de configuración derivadas de descriptores y metadatos del catálogo de instalación sin cargar el tiempo de ejecución del proveedor. La declaración explícita `setup.requiresRuntime: false` establece un límite exclusivamente de descriptor; si se omite `requiresRuntime`, se conserva el mecanismo alternativo heredado de setup-api por compatibilidad. Si más de un plugin descubierto reclama el mismo id normalizado de proveedor de configuración o backend de CLI, la búsqueda de configuración rechaza al propietario ambiguo en lugar de depender del orden de descubrimiento. Cuando se ejecuta el tiempo de ejecución de configuración, los diagnósticos del registro informan de las divergencias entre `setup.providers` / `setup.cliBackends` y los proveedores o backends de CLI registrados realmente por setup-api, sin bloquear los plugins heredados.

### Límite de la caché de plugins

OpenClaw no almacena en caché los resultados del descubrimiento de plugins ni los datos directos del registro de manifiestos mediante intervalos de tiempo de reloj. Las instalaciones, las modificaciones de manifiestos y los cambios en las rutas de carga deben hacerse visibles en la siguiente lectura explícita de metadatos o reconstrucción de la instantánea. El analizador de archivos de manifiesto mantiene una caché limitada de firmas de archivo cuya clave combina la ruta del manifiesto abierto con el dispositivo/inodo, tamaño y mtime/ctime; esa caché solo evita volver a analizar bytes sin cambios y no debe almacenar en caché respuestas de descubrimiento, registro, propiedad ni políticas.

La ruta rápida y segura para los metadatos es la propiedad explícita de los objetos, no una caché oculta. Las rutas críticas de inicio del Gateway deben pasar el `PluginMetadataSnapshot` actual, la `PluginLookUpTable` derivada o un registro explícito de manifiestos a través de la cadena de llamadas. La validación de la configuración, la habilitación automática al inicio, el arranque de plugins y la selección de proveedores pueden reutilizar esos objetos mientras representen la configuración y el inventario de plugins actuales. La búsqueda de configuración sigue reconstruyendo los metadatos del manifiesto bajo demanda, salvo que la ruta de configuración específica reciba un registro explícito de manifiestos; debe mantenerse como mecanismo alternativo para rutas poco frecuentes en lugar de añadir cachés ocultas de búsqueda. Cuando cambie la entrada, reconstruye y sustituye la instantánea en lugar de modificarla o conservar copias históricas. Las vistas del registro de plugins activo y los ayudantes de arranque de canales integrados deben volver a calcularse a partir del registro/raíz actuales. Los mapas de corta duración son aceptables dentro de una llamada para evitar trabajo duplicado o proteger frente a la reentrada; no deben convertirse en cachés de metadatos del proceso.

Para la carga de plugins, la capa de caché persistente corresponde a la carga en tiempo de ejecución. Puede reutilizar el estado del cargador cuando se cargan realmente el código o los artefactos instalados, como:

- `PluginLoaderCacheState` y registros compatibles de tiempo de ejecución activo
- cachés de jiti/módulos y cachés del cargador de superficies públicas usadas para evitar importar repetidamente la misma superficie de tiempo de ejecución
- cachés del sistema de archivos para los artefactos de plugins instalados
- mapas por llamada de corta duración para normalizar rutas o resolver duplicados

Esas cachés son detalles de implementación del plano de datos. No deben responder preguntas del plano de control como «¿qué plugin es propietario de este proveedor?», salvo que el consumidor haya solicitado deliberadamente la carga en tiempo de ejecución.

No añadas cachés persistentes ni basadas en el reloj para:

- resultados de descubrimiento
- registros directos de manifiestos
- registros de manifiestos reconstruidos a partir del índice de plugins instalados
- búsqueda del propietario de un proveedor, supresión de modelos, política de proveedores o metadatos de artefactos públicos
- cualquier otra respuesta derivada del manifiesto en la que un cambio en el manifiesto, el índice instalado o la ruta de carga deba ser visible en la siguiente lectura de metadatos

Los consumidores que reconstruyen los metadatos del manifiesto a partir del índice persistente de plugins instalados reconstruyen ese registro bajo demanda. El índice instalado es un estado duradero del plano de origen; no es una caché oculta de metadatos dentro del proceso.

## Modelo del registro

Los plugins cargados no modifican directamente variables globales arbitrarias del núcleo. Se registran en un registro central de plugins (`PluginRegistry` en `src/plugins/registry-types.ts`), que mantiene los registros de plugins (identidad, fuente, origen, estado y diagnósticos), además de matrices para cada capacidad: herramientas, hooks heredados y hooks tipados, canales, proveedores, controladores RPC del Gateway, rutas HTTP, registradores de CLI, servicios en segundo plano, comandos propiedad de plugins y decenas de familias adicionales de proveedores tipados (voz, embeddings, generación de imágenes/vídeos/música, obtención/búsqueda web, entornos de agentes, acciones de sesión, etc.).

Después, las funciones del núcleo leen ese registro en lugar de comunicarse directamente con los módulos de los plugins. Esto mantiene la carga unidireccional:

- módulo del plugin -> registro en el registro
- tiempo de ejecución del núcleo -> consumo del registro

Esa separación es importante para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo necesitan un punto de integración: «leer el registro», no «tratar de forma especial cada módulo de plugin».

## Callbacks de vinculación de conversaciones

Los plugins que vinculan una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que se apruebe o deniegue una solicitud de vinculación:

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
- `binding`: la vinculación resuelta para las solicitudes aprobadas
- `request`: el resumen de la solicitud original, la indicación de desvinculación, el id del remitente y los metadatos de la conversación

Este callback sirve únicamente como notificación. No cambia quién tiene permiso para vincular una conversación y se ejecuta después de que finalice la gestión de la aprobación por parte del núcleo.

## Hooks de tiempo de ejecución de proveedores

Los plugins de proveedores tienen tres capas:

- **Metadatos del manifiesto** para una búsqueda ligera previa al tiempo de ejecución: `setup.providers[].envVars`, el elemento de compatibilidad obsoleto `providerAuthEnvVars`, `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks durante la configuración**: `catalog` (el nombre heredado `discovery`) junto con `applyConfigDefaults`.
- **Hooks de tiempo de ejecución**: más de 40 hooks opcionales que abarcan autenticación, resolución de modelos, envoltura de flujos, niveles de razonamiento, política de repetición y endpoints de uso. Consulta [Orden y uso de los hooks](#hook-order-and-usage).

OpenClaw sigue siendo responsable del bucle genérico del agente, la conmutación por error, la gestión de transcripciones y la política de herramientas. Estos hooks son la superficie de extensión para comportamientos específicos de proveedores sin necesitar un transporte de inferencia personalizado completo.

Use `setup.providers[].envVars` del manifiesto cuando el proveedor tenga
credenciales basadas en variables de entorno que las rutas genéricas de autenticación, estado y selección de modelos deban detectar sin
cargar el entorno de ejecución del Plugin. El adaptador de
compatibilidad sigue leyendo el obsoleto `providerAuthEnvVars` durante el
período de desuso, y los plugins no incluidos que lo usan reciben un diagnóstico del manifiesto. Use `providerAuthAliases`
del manifiesto cuando un identificador de proveedor deba reutilizar las variables de entorno, los perfiles de autenticación,
la autenticación respaldada por la configuración y la opción de incorporación mediante clave de API de otro identificador de proveedor. Use
`providerAuthChoices` del manifiesto cuando las superficies de incorporación y selección de autenticación de la CLI deban conocer el
identificador de opción del proveedor, las etiquetas de grupo y la configuración sencilla de autenticación mediante una sola marca sin
cargar el entorno de ejecución del proveedor. Mantenga `envVars` del entorno de ejecución del proveedor
para indicaciones dirigidas al operador, como etiquetas de incorporación o variables de configuración
del identificador y secreto de cliente de OAuth.

Use `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración controlada por variables de entorno que
la alternativa genérica basada en variables de entorno del shell, las comprobaciones de configuración y estado o las solicitudes de configuración deban detectar
sin cargar el entorno de ejecución del canal.

### Orden y uso de los hooks

Para los plugins de modelos y proveedores, OpenClaw llama a los hooks aproximadamente en este orden.
La columna «Cuándo usarlo» es la guía rápida para tomar decisiones.
Los campos de proveedor exclusivos para compatibilidad que OpenClaw ya no invoca, como
`ProviderPlugin.capabilities` y `suppressBuiltInModel`, no se incluyen aquí
intencionadamente.

| Hook                              | Qué hace                                                                                                                           | Cuándo usarlo                                                                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`                               | El proveedor posee un catálogo o valores predeterminados de URL base                                                                                                                         |
| `applyConfigDefaults`             | Aplica valores predeterminados de configuración global propiedad del proveedor durante la materialización de la configuración      | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de la familia de modelos del proveedor                                                             |
| _(búsqueda de modelos integrada)_ | OpenClaw prueba primero la ruta normal del registro/catálogo                                                                        | _(no es un Hook de Plugin)_                                                                                                                                                                  |
| `normalizeModelId`                | Normaliza alias heredados o preliminares de identificadores de modelo antes de la búsqueda                                         | El proveedor se encarga de depurar los alias antes de la resolución canónica del modelo                                                                                                      |
| `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblado genérico del modelo                                   | El proveedor se encarga de depurar el transporte para identificadores de proveedor personalizados de la misma familia de transporte                                                          |
| `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución del entorno de ejecución/proveedor                                        | El proveedor necesita depurar la configuración dentro del Plugin; los auxiliares integrados de la familia de Google también respaldan las entradas de configuración de Google compatibles    |
| `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a los proveedores de configuración                               | El proveedor necesita correcciones de metadatos de uso de streaming nativo determinadas por el endpoint                                                                                     |
| `resolveConfigApiKey`             | Resuelve la autenticación mediante marcadores de entorno para los proveedores de configuración antes de cargarla en ejecución      | Los proveedores exponen sus propios Hooks de resolución de claves de API mediante marcadores de entorno                                                                                      |
| `resolveSyntheticAuth`            | Expone autenticación local, autoalojada o respaldada por configuración sin conservar texto sin cifrar                             | El proveedor puede funcionar con un marcador de credencial sintético/local                                                                                                                   |
| `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externos propiedad del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales gestionadas por la CLI o la aplicación | El proveedor reutiliza credenciales de autenticación externas sin conservar los tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto                 |
| `shouldDeferSyntheticProfileAuth` | Reduce la prioridad de los marcadores de posición de perfiles sintéticos almacenados frente a la autenticación respaldada por el entorno o la configuración | El proveedor almacena perfiles de marcador de posición sintéticos que no deben prevalecer                                                                                                    |
| `resolveDynamicModel`             | Alternativa síncrona para identificadores de modelos propiedad del proveedor que aún no están en el registro local                 | El proveedor acepta identificadores arbitrarios de modelos del servicio de origen                                                                                                            |
| `prepareDynamicModel`             | Realiza una preparación asíncrona y luego vuelve a ejecutar `resolveDynamicModel`                                                  | El proveedor necesita metadatos de red antes de resolver identificadores desconocidos                                                                                                        |
| `normalizeResolvedModel`          | Realiza la reescritura final antes de que el ejecutor integrado use el modelo resuelto                                             | El proveedor necesita reescrituras de transporte, pero sigue usando un transporte del núcleo                                                                                                 |
| `normalizeToolSchemas`            | Normaliza los esquemas de herramientas antes de que el ejecutor integrado los procese                                              | El proveedor necesita depurar los esquemas de la familia de transporte                                                                                                                       |
| `inspectToolSchemas`              | Expone diagnósticos de esquemas propiedad del proveedor después de la normalización                                                | El proveedor quiere advertencias sobre palabras clave sin incorporar reglas específicas del proveedor al núcleo                                                                             |
| `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo o etiquetado                                                               | El proveedor necesita una salida final y de razonamiento etiquetada en lugar de campos nativos                                                                                               |
| `prepareExtraParams`              | Normaliza los parámetros de solicitud antes de los envoltorios genéricos de opciones de streaming                                 | El proveedor necesita parámetros de solicitud predeterminados o una depuración de parámetros específica                                                                                     |
| `createStreamFn`                  | Sustituye por completo la ruta normal de streaming por un transporte personalizado                                                | El proveedor necesita un protocolo de comunicación personalizado, no solo un envoltorio                                                                                                      |
| `wrapStreamFn`                    | Aplica un envoltorio de streaming después de los envoltorios genéricos                                                            | El proveedor necesita envoltorios de compatibilidad para las cabeceras, el cuerpo o el modelo de la solicitud, sin un transporte personalizado                                               |
| `resolveTransportTurnState`       | Adjunta cabeceras o metadatos de transporte nativos por turno                                                                      | El proveedor quiere que los transportes genéricos envíen una identidad de turno nativa del proveedor                                                                                        |
| `resolveWebSocketSessionPolicy`   | Adjunta cabeceras nativas de WebSocket o una política de espera de sesión                                                          | El proveedor quiere que los transportes WS genéricos ajusten las cabeceras de sesión o la política alternativa                                                                               |
| `formatApiKey`                    | Formateador de perfiles de autenticación: el perfil almacenado se convierte en la cadena `apiKey` del entorno de ejecución         | El proveedor almacena metadatos de autenticación adicionales y necesita un formato personalizado para el token de ejecución                                                                 |
| `refreshOAuth`                    | Sustituye la actualización de OAuth para endpoints de actualización personalizados o políticas ante fallos de actualización       | El proveedor no se adapta a los mecanismos de actualización compartidos de OpenClaw                                                                                                          |
| `buildAuthDoctorHint`             | Indicación de reparación que se añade cuando falla la actualización de OAuth                                                      | El proveedor necesita orientación propia para reparar la autenticación tras un fallo de actualización                                                                                        |
| `matchesContextOverflowError`     | Detector de desbordamiento de la ventana de contexto propiedad del proveedor                                                      | El proveedor presenta errores de desbordamiento sin procesar que las heurísticas genéricas no detectarían                                                                                    |
| `classifyFailoverReason`          | Clasifica el motivo de la conmutación por error según el proveedor                                                                 | El proveedor puede asignar errores sin procesar de la API o del transporte a límites de frecuencia, sobrecarga, etc.                                                                         |
| `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy o de conexión de retorno                                                      | El proveedor necesita restricciones de TTL de caché específicas del proxy                                                                                                                    |
| `buildMissingAuthMessage`         | Sustituye el mensaje genérico de recuperación por falta de autenticación                                                           | El proveedor necesita una indicación específica para recuperarse de la falta de autenticación                                                                                                |
| `augmentModelCatalog`             | Añade filas sintéticas/finales al catálogo después de la detección (obsoleto; véase más abajo)                                     | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y los selectores                                                                                            |
| `resolveThinkingProfile`          | Define el conjunto de niveles de `/think`, las etiquetas mostradas y el valor predeterminado para cada modelo                     | El proveedor expone una escala de pensamiento personalizada o una etiqueta binaria para modelos seleccionados                                                                                |
| `isBinaryThinking`                | Hook de compatibilidad para activar o desactivar el razonamiento                                                                  | El proveedor solo expone el pensamiento binario activado/desactivado                                                                                                                          |
| `supportsXHighThinking`           | Hook de compatibilidad con el razonamiento `xhigh`                                                                                 | El proveedor quiere ofrecer `xhigh` solo en un subconjunto de modelos                                                                                                                        |
| `resolveDefaultThinkingLevel`     | Hook de compatibilidad para el nivel predeterminado de `/think`                                                                   | El proveedor controla la política predeterminada de `/think` para una familia de modelos                                                                                                     |
| `isModernModelRef`                | Detector de modelos modernos para filtros de perfiles activos y selección de pruebas de humo                                      | El proveedor controla la selección preferida de modelos para perfiles activos y pruebas de humo                                                                                             |
| `prepareRuntimeAuth`              | Canjea una credencial configurada por el token o la clave real de ejecución justo antes de la inferencia                          | El proveedor necesita un intercambio de tokens o una credencial de solicitud de corta duración                                                                                              |
| `resolveUsageAuth`                | Resuelve las credenciales de uso/facturación para `/usage` y las superficies de estado relacionadas                              | El proveedor necesita un análisis personalizado del token de uso/cuota o una credencial de uso diferente                                                                                    |
| `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación                      | El proveedor necesita un endpoint de uso o un analizador de carga útil específico                                                                                                            |
| `createEmbeddingProvider`         | Crear un adaptador de incrustaciones propiedad del proveedor para memoria/búsqueda                              | El comportamiento de las incrustaciones de memoria pertenece al Plugin del proveedor                                                          |
| `buildReplayPolicy`               | Devolver una política de reproducción que controle el manejo de la transcripción para el proveedor             | El proveedor necesita una política de transcripción personalizada (por ejemplo, eliminar bloques de razonamiento)                             |
| `sanitizeReplayHistory`           | Reescribir el historial de reproducción tras la limpieza genérica de la transcripción                          | El proveedor necesita reescrituras de reproducción específicas más allá de los auxiliares compartidos de Compaction                           |
| `validateReplayTurns`             | Realizar la validación o reestructuración final de los turnos de reproducción antes del ejecutor integrado      | El transporte del proveedor necesita una validación de turnos más estricta tras la depuración genérica                                        |
| `onModelSelected`                 | Ejecutar efectos secundarios posteriores a la selección propiedad del proveedor                               | El proveedor necesita telemetría o estado propio cuando se activa un modelo                                                                   |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` comprueban primero el
plugin del proveedor coincidente y, a continuación, recorren los demás plugins
de proveedor compatibles con hooks hasta que uno modifica realmente el id del
modelo o el transporte/la configuración. Esto mantiene operativos los adaptadores
de alias/compatibilidad de proveedores sin exigir que el llamador sepa qué
plugin incluido es responsable de la reescritura. Si ningún hook de proveedor
reescribe una entrada de configuración compatible de la familia Google, el
normalizador de configuración de Google incluido sigue aplicando esa limpieza
de compatibilidad.

Si el proveedor necesita un protocolo de comunicación completamente personalizado
o un ejecutor de solicitudes personalizado, se trata de una clase de extensión
diferente. Estos hooks son para comportamientos del proveedor que siguen
ejecutándose en el bucle de inferencia normal de OpenClaw.

`resolveUsageAuth` decide si OpenClaw debe llamar a `fetchUsageSnapshot` o
recurrir a la resolución genérica de credenciales para las superficies de
uso/estado. Devuelva `{ token, accountId?, subscriptionType?, rateLimitTier? }`
cuando el proveedor tenga una credencial de uso (los metadatos opcionales del
plan se transfieren a `fetchUsageSnapshot`), devuelva
`{ handled: true }` cuando la autenticación de uso propiedad del proveedor haya
gestionado la solicitud y deba impedir la alternativa genérica de clave de
API/OAuth, y devuelva `null` o `undefined` cuando el proveedor no haya gestionado
la autenticación de uso.

Declare las credenciales de organización o facturación en
`providerUsageAuthEnvVars` del manifiesto. Esto permite que las superficies
genéricas de detección y eliminación de secretos las reconozcan sin convertirlas
en candidatas para la autenticación de inferencia.

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

Los plugins de proveedor incluidos combinan los hooks anteriores para adaptarse
a las necesidades de catálogo, autenticación, razonamiento, reproducción y uso
de cada proveedor. El conjunto de hooks de referencia reside con cada plugin
en `extensions/`; esta página ilustra sus formas en lugar de reproducir la lista.

<AccordionGroup>
  <Accordion title="Proveedores de catálogo de paso directo">
    OpenRouter, Kilocode, Z.AI y xAI registran `catalog` junto con
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer los ids de
    modelos ascendentes antes que el catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Proveedores de OAuth y de endpoints de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi y z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para controlar el intercambio de tokens y la
    integración con `/usage`.
  </Accordion>
  <Accordion title="Familias de reproducción y limpieza de transcripciones">
    Las familias compartidas con nombre (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los proveedores
    adopten la política de transcripciones mediante `buildReplayPolicy`, en vez
    de que cada plugin vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Proveedores solo de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran únicamente `catalog` y utilizan el bucle de inferencia
    compartido.
  </Accordion>
  <Accordion title="Ayudantes de flujo específicos de Anthropic">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` residen dentro
    de la interfaz pública `api.ts` / `contract-api.ts` del plugin de Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), en lugar de
    estar en el SDK genérico.
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

- `textToSpeech` devuelve la carga útil normal de salida TTS del núcleo para superficies de archivos/notas de voz.
- Utiliza la configuración `messages.tts` y la selección de proveedor del núcleo.
- Devuelve un búfer de audio PCM y la frecuencia de muestreo. Los plugins deben volver a muestrear/codificar para los proveedores.
- `listVoices` es opcional para cada proveedor. Úselo para selectores de voz o flujos de configuración propiedad del proveedor.
- El núcleo pasa un plazo de solicitud resuelto a los hooks `listVoices` del proveedor; la configuración de tiempo de espera específica del proveedor puede sustituirlo.
- Las listas de voces pueden incluir metadatos más detallados, como configuración regional, género y etiquetas de personalidad, para selectores adaptados al proveedor.
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
- Use proveedores de voz para el comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido se orienta a la empresa: un plugin de proveedor puede controlar proveedores de texto, voz, imágenes y futuros medios a medida que OpenClaw incorpore esos contratos de capacidades.

Para comprender imágenes/audio/vídeo, los plugins registran un proveedor tipado
de comprensión de medios en lugar de una colección genérica de clave/valor:

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

- Mantenga en el núcleo la orquestación, las alternativas, la configuración y la conexión con los canales.
- Mantenga el comportamiento del proveedor en el plugin del proveedor.
- La expansión aditiva debe seguir estando tipada: nuevos métodos opcionales, nuevos campos de resultados opcionales y nuevas capacidades opcionales.
- La generación de vídeo ya sigue el mismo patrón:
  - el núcleo controla el contrato de capacidades y el ayudante de tiempo de ejecución
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
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

Para la transcripción de audio, los plugins pueden usar tanto el tiempo de
ejecución de comprensión de medios como el alias STT anterior:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` es la superficie compartida preferida para la comprensión de imágenes/audio/vídeo.
- `extractStructuredWithModel(...)` es la interfaz orientada a plugins para la extracción acotada, propiedad del proveedor y centrada en imágenes. Incluya al menos una entrada de imagen; las entradas de texto constituyen contexto complementario. Los plugins de producto controlan sus rutas y esquemas, mientras que OpenClaw controla el límite entre proveedor y tiempo de ejecución.
- Utiliza la configuración de audio de comprensión de medios del núcleo (`tools.media.audio`) y el orden de alternativas de proveedores.
- Devuelve `{ text: undefined }` cuando no se produce ninguna transcripción (por ejemplo, una entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` se mantiene como alias de compatibilidad.

Los plugins también pueden iniciar ejecuciones de subagentes en segundo plano
mediante `api.runtime.subagent`:

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

- `provider` y `model` son sustituciones opcionales por ejecución, no cambios persistentes de la sesión.
- OpenClaw solo respeta esos campos de sustitución para llamadores de confianza.
- Para ejecuciones alternativas propiedad de plugins, los operadores deben habilitarlas con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir los plugins de confianza a destinos canónicos `provider/model` específicos, o `"*"` para permitir explícitamente cualquier destino.
- Las ejecuciones de subagentes de plugins que no sean de confianza siguen funcionando, pero las solicitudes de sustitución se rechazan en lugar de recurrir silenciosamente a una alternativa.
- Las sesiones de subagentes creadas por plugins se etiquetan con el id del plugin creador. La alternativa `api.runtime.subagent.deleteSession(...)` solo puede eliminar esas sesiones propias; la eliminación arbitraria de sesiones sigue requiriendo una solicitud al Gateway con ámbito de administrador.

Para la búsqueda web, los plugins pueden consumir el ayudante compartido del
tiempo de ejecución en lugar de acceder a la conexión de herramientas del agente:

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
- Use proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de funciones/canales que necesiten funciones de búsqueda sin depender del contenedor de herramientas del agente.

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
- `listProviders(...)`: enumera los proveedores disponibles de generación de imágenes y sus capacidades.

## Rutas HTTP del Gateway

Los plugins pueden exponer endpoints HTTP mediante `api.registerHttpRoute(...)`.

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
- `auth`: obligatorio, `"gateway"` o `"plugin"`. Usa `"gateway"` para exigir la autenticación normal del Gateway o `"plugin"` para la autenticación o verificación de Webhooks gestionada por el plugin.
- `match`: opcional. `"exact"` (valor predeterminado) o `"prefix"`.
- `handleUpgrade`: controlador opcional para solicitudes de actualización a WebSocket en la misma ruta.
- `replaceExisting`: opcional. Permite que el mismo plugin sustituya su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta haya gestionado la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de los plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que se especifique `replaceExisting: true`, y un plugin no puede sustituir la ruta de otro plugin.
- Las rutas superpuestas con distintos niveles de `auth` se rechazan. Mantén las cadenas de continuación `exact`/`prefix` únicamente en el mismo nivel de autenticación.
- Las rutas con `auth: "plugin"` **no** reciben automáticamente ámbitos de ejecución de operador. Están destinadas a Webhooks gestionados por plugins o a la verificación de firmas, no a llamadas privilegiadas a funciones auxiliares del Gateway.
- Las rutas con `auth: "gateway"` se ejecutan dentro de un ámbito de ejecución de solicitudes del Gateway. La superficie predeterminada (`gatewayRuntimeScopeSurface: "write-default"`) es deliberadamente conservadora:
  - la autenticación mediante secreto compartido con portador (`gateway.auth.mode = "token"` / `"password"`) y cualquier método de autenticación que no sea de proxy de confianza obtienen un único ámbito `operator.write`, aunque el solicitante envíe `x-openclaw-scopes`
  - los solicitantes de `trusted-proxy` sin un encabezado `x-openclaw-scopes` explícito también conservan la superficie heredada limitada a `operator.write`
  - los solicitantes de `trusted-proxy` que sí envían `x-openclaw-scopes` obtienen en su lugar los ámbitos declarados
  - una ruta puede optar por `gatewayRuntimeScopeSurface: "trusted-operator"` para respetar siempre `x-openclaw-scopes` en los modos de autenticación asociados a una identidad (y usar como alternativa el conjunto completo de ámbitos predeterminados de la CLI cuando el encabezado esté ausente)
- Regla práctica: no des por supuesto que una ruta de plugin autenticada por el Gateway sea una superficie de administración implícita. Si tu ruta necesita un comportamiento exclusivo para administradores, opta por la superficie de ámbitos `trusted-operator`, exige un modo de autenticación asociado a una identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.
- Tras resolver la ruta y autenticar la solicitud, los controladores normales participan en la admisión de trabajo raíz del Gateway. Un Gateway preparado o en proceso de reinicio devuelve `503` antes de invocar el controlador. La única excepción limitada es una ruta con `auth: "gateway"` autorizada por el manifiesto que también opte por la superficie específica de la ruta `trusted-operator`; esta permanece accesible para que el envío de controles de suspensión no quede bloqueado, mientras que las rutas hermanas normales del mismo plugin permanecen detrás del límite de admisión. La asignación de `handleUpgrade` de WebSocket utiliza el mismo límite de admisión atómico; una vez que el controlador acepta un socket, el ciclo de vida posterior del socket queda bajo responsabilidad del plugin y este límite no lo supervisa.

## Rutas de importación del SDK de plugins

Al crear plugins nuevos, usa subrutas específicas del SDK en lugar del punto de exportación raíz monolítico `openclaw/plugin-sdk`.
Subrutas principales:

| Subruta                             | Propósito                                                   |
| ----------------------------------- | ----------------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de plugins                           |
| `openclaw/plugin-sdk/channel-core`  | Funciones auxiliares de entrada y construcción de canales   |
| `openclaw/plugin-sdk/core`          | Funciones auxiliares genéricas compartidas y contrato global |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`)       |

Los plugins de canal eligen entre una familia de interfaces específicas: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un único contrato `approvalCapability`, en lugar de mezclarlo entre campos
de plugin no relacionados. Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).

Las funciones auxiliares de ejecución y configuración se encuentran en subrutas específicas
`*-runtime` correspondientes (`approval-runtime`, `agent-runtime`, `lazy-runtime`,
`directory-runtime`, `text-runtime`, `runtime-store`, `system-event-runtime`,
`heartbeat-runtime`, `channel-activity-runtime`, etc.). Prefiere `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation`
en lugar del punto de exportación amplio de compatibilidad `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
las pequeñas fachadas auxiliares de canales, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
y `openclaw/plugin-sdk/infra-runtime` son adaptadores de compatibilidad obsoletos para
plugins antiguos. El código nuevo debe importar primitivas genéricas más específicas.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de plugin incluido):

- `index.js` — entrada del plugin incluido
- `api.js` — punto de exportación de funciones auxiliares y tipos
- `runtime-api.js` — punto de exportación exclusivo de ejecución
- `setup-entry.js` — entrada del plugin de configuración

Los plugins externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes `src/*` del paquete de otro plugin desde el núcleo ni desde otro plugin.
Los puntos de entrada cargados mediante fachada prefieren la instantánea activa de la
configuración de ejecución cuando existe y, de lo contrario, recurren al archivo de
configuración resuelto en el disco.

Existen subrutas específicas de capacidades, como `image-generation`, `media-understanding`
y `speech`, porque los plugins incluidos las utilizan actualmente. No son
automáticamente contratos externos inmutables a largo plazo; consulta la página de
referencia pertinente del SDK si dependes de ellas.

## Esquemas de herramientas de mensajes

Los plugins deben ser responsables de las contribuciones específicas de cada canal al
esquema `describeMessageTool(...)` para primitivas distintas de los mensajes, como
reacciones, lecturas y encuestas. La presentación compartida de envíos debe utilizar el
contrato genérico `MessagePresentation` en lugar de campos de botones, componentes,
bloques o tarjetas nativos del proveedor.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para conocer el contrato,
las reglas de degradación, la correspondencia con proveedores y la lista de comprobación
para autores de plugins.

Los plugins capaces de enviar declaran qué pueden representar mediante las capacidades de mensajes:

- `presentation` para bloques de presentación semánticos (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El núcleo decide si representa la presentación de forma nativa o la degrada a texto.
No expongas mecanismos de escape de interfaz nativos del proveedor desde la herramienta
genérica de mensajes. Las funciones auxiliares obsoletas del SDK para esquemas nativos
heredados siguen exportándose para los plugins de terceros existentes, pero los plugins
nuevos no deben utilizarlas.

## Resolución de destinos de canal

Los plugins de canal deben ser responsables de la semántica de destinos específica del canal.
Mantén genérico el host de salida compartido y utiliza la superficie del adaptador de
mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado debe tratarse
  como `direct`, `group` o `channel` antes de consultar el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al núcleo si una
  entrada debe pasar directamente a una resolución similar a un identificador en lugar
  de realizar una búsqueda en el directorio.
- `messaging.targetResolver.reservedLiterals` enumera palabras sin calificar que son
  referencias a canales o sesiones para ese proveedor. La resolución conserva las entradas
  configuradas del directorio antes de rechazar los literales reservados y, posteriormente,
  falla de forma segura si no encuentra una coincidencia en el directorio.
- `messaging.targetResolver.resolveTarget(...)` es la alternativa del plugin cuando
  el núcleo necesita una resolución final bajo responsabilidad del proveedor después de la
  normalización o de no encontrar una coincidencia en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` es responsable de construir la ruta de sesión
  específica del proveedor una vez resuelto el destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deban tomarse antes de
  buscar pares o grupos.
- Usa `looksLikeId` para comprobar si debe «tratarse como un identificador de destino
  explícito o nativo».
- Usa `resolveTarget` como alternativa de normalización específica del proveedor, no
  para búsquedas amplias en el directorio.
- Mantén los identificadores nativos del proveedor, como identificadores de chats,
  identificadores de hilos, JID, nombres de usuario e identificadores de salas, dentro de
  los valores `target` o de parámetros específicos del proveedor, no en campos genéricos
  del SDK.

## Directorios respaldados por la configuración

Los plugins que derivan entradas de directorio de la configuración deben mantener esa
lógica en el plugin y reutilizar las funciones auxiliares compartidas de
`openclaw/plugin-sdk/directory-runtime`.

Úsalo cuando un canal necesite pares o grupos respaldados por la configuración, como:

- pares de mensajes directos controlados por una lista de permitidos
- mapas de canales o grupos configurados
- alternativas de directorio estático limitadas a una cuenta

Las funciones auxiliares compartidas de `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- funciones auxiliares de deduplicación y normalización
- creación de `ChannelDirectoryEntry[]`

La inspección de cuentas y la normalización de identificadores específicas del canal deben
permanecer en la implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedores pueden definir catálogos de modelos para inferencia mediante
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma estructura que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedores

Usa `catalog` cuando el plugin sea responsable de los identificadores de modelos específicos
del proveedor, los valores predeterminados de la URL base o los metadatos de modelos
condicionados por la autenticación.

`catalog.order` controla cuándo se combina el catálogo de un plugin en relación con los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores controlados mediante una clave de API simple o variables de entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedores relacionadas
- `late`: última pasada, después de los demás proveedores implícitos

Los proveedores posteriores prevalecen cuando hay una colisión de claves, por lo que los
plugins pueden sustituir deliberadamente una entrada de proveedor integrada que tenga el
mismo identificador de proveedor.

Los plugins también pueden publicar filas de modelos de solo lectura mediante
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Esta es la vía futura para las superficies de lista, ayuda y selección, y admite
filas `text`, `voice`, `image_generation`, `video_generation` y `music_generation`.
Los plugins de proveedores siguen siendo responsables de las llamadas a puntos de conexión
en directo, el intercambio de tokens y la correspondencia de respuestas del proveedor; el
núcleo es responsable de la estructura común de las filas, las etiquetas de origen y el
formato de la ayuda de herramientas multimedia. Los registros de proveedores de generación
multimedia sintetizan automáticamente filas de catálogo estáticas a partir de
`defaultModel`, `models` y `capabilities`.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado, pero emite una advertencia de obsolescencia
- si se registran tanto `catalog` como `discovery`, OpenClaw utiliza `catalog`
  y emite una advertencia
- `augmentModelCatalog` está obsoleto; los proveedores incluidos deben publicar
  filas complementarias mediante `registerModelCatalogProvider`

## Inspección de canales de solo lectura

Si tu plugin registra un canal, es preferible implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Motivos:

- `resolveAccount(...)` es la ruta de ejecución. Puede presuponer que las credenciales
  se han materializado por completo y fallar inmediatamente cuando faltan secretos obligatorios.
- Las rutas de comandos de solo lectura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, y los flujos de reparación
  del doctor o de la configuración no deberían necesitar materializar credenciales de
  ejecución únicamente para describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve únicamente un estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye los campos de origen/estado de las credenciales cuando corresponda, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No es necesario devolver los valores sin procesar de los tokens solo para informar de su
  disponibilidad en modo de solo lectura. Devolver `tokenStatus: "available"` (y el campo de
  origen correspondiente) es suficiente para los comandos de estado.
- Usa `configured_unavailable` cuando una credencial está configurada mediante SecretRef, pero
  no está disponible en la ruta de ejecución del comando actual.

Esto permite que los comandos de solo lectura indiquen «configurada, pero no disponible en esta
ruta de ejecución del comando» en lugar de fallar o informar erróneamente de que la cuenta no está configurada.

## Paquetes de plugins

Un directorio de plugins puede incluir un archivo `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entrada se convierte en un plugin. Si el paquete enumera varias extensiones, el id del plugin
pasa a ser `<manifestOrPackageName>/<fileBase>` (el id del manifiesto tiene prioridad cuando
está presente; de lo contrario, se usa el nombre sin ámbito de `package.json`).

Si tu plugin importa dependencias de npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Medida de seguridad: cada entrada de `openclaw.extensions` debe permanecer dentro del directorio
del plugin después de resolver los enlaces simbólicos. Se rechazan las entradas que salgan del directorio del paquete.

Nota de seguridad: `openclaw plugins install` instala las dependencias del plugin con una
ejecución local al proyecto de `npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida
ni dependencias de desarrollo durante la ejecución), ignorando la configuración global heredada de instalación de npm.
Mantén los árboles de dependencias de los plugins en «JS/TS puro» y evita paquetes que requieran
compilaciones mediante `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero usado solo durante la configuración.
Cuando OpenClaw necesita las superficies de configuración de un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún no está configurado, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto aligera el inicio y la configuración
cuando la entrada principal del plugin también conecta herramientas, hooks u otro
código exclusivo de la ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un plugin de canal utilice la misma ruta de `setupEntry` durante la
fase de inicio del Gateway anterior a la escucha, incluso cuando el canal ya está configurado.

Usa esto únicamente cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el Gateway comience a escuchar. En la práctica, esto significa que la entrada de configuración
debe registrar todas las capacidades pertenecientes al canal de las que depende el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el Gateway comience a escuchar
- cualquier método, herramienta o servicio del Gateway que deba existir durante ese mismo período

Si la entrada completa sigue siendo responsable de alguna capacidad de inicio necesaria, no habilites
esta opción. Mantén el comportamiento predeterminado del plugin y permite que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar funciones auxiliares de superficies contractuales exclusivas de la configuración que el núcleo
puede consultar antes de que se cargue el entorno de ejecución completo del canal. La superficie actual
de promoción durante la configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración antigua de canal con una sola cuenta
a `channels.<id>.accounts.*` sin cargar la entrada completa del plugin.
Matrix es el ejemplo incluido actual: mueve únicamente las claves de autenticación/inicialización a una
cuenta con nombre promovida cuando ya existen cuentas con nombre, y puede conservar una
clave de cuenta predeterminada configurada que no sea canónica, en lugar de crear siempre
`accounts.default`.

Estos adaptadores de parches de configuración mantienen diferido el descubrimiento de las superficies contractuales incluidas. El tiempo
de importación sigue siendo reducido; la superficie de promoción solo se carga al usarse por primera vez, en lugar de
volver a ejecutar el inicio de los canales incluidos durante la importación del módulo.

Cuando esas superficies de inicio incluyan métodos RPC del Gateway, mantenlos bajo un
prefijo específico del plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen reservados y siempre se resuelven
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

Los plugins de canal pueden anunciar metadatos de configuración/detección mediante `openclaw.channel` y
sugerencias de instalación mediante `openclaw.install`. Esto evita que el catálogo del núcleo contenga datos específicos.

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

Otros campos útiles de `openclaw.channel`, además de los del ejemplo mínimo:

- `detailLabel`: etiqueta secundaria para superficies de catálogo/estado con más detalles
- `docsLabel`: reemplaza el texto del enlace a la documentación
- `preferOver`: ids de plugins/canales de menor prioridad a los que esta entrada del catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles del texto de la superficie de selección
- `markdownCapable`: marca el canal como compatible con Markdown para tomar decisiones sobre el formato de salida
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado en las superficies de navegación de la documentación
- `showConfigured` / `showInSetup`: alias antiguos que siguen aceptándose por compatibilidad; se recomienda `exposure`
- `quickstartAllowFrom`: incorpora el canal al flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: exige una vinculación explícita de la cuenta incluso cuando solo existe una
- `preferSessionLookupForAnnounceTarget`: da prioridad a la búsqueda de sesiones al resolver los destinos de anuncios

OpenClaw también puede combinar **catálogos externos de canales** (por ejemplo, una exportación
del registro MPM). Coloca un archivo JSON en una de estas ubicaciones:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O haz que `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) apunte a
uno o más archivos JSON (delimitados por comas, punto y coma o `PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias antiguos de la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de instalación de proveedores exponen
datos normalizados sobre el origen de instalación junto al bloque sin procesar `openclaw.install`. Los
datos normalizados identifican si la especificación npm es una versión exacta o un
selector flotante, si están presentes los metadatos de integridad esperados y si también
está disponible una ruta de origen local. Cuando se conoce la identidad del catálogo/paquete, los
datos normalizados advierten si el nombre del paquete npm analizado difiere de esa identidad.
También advierten cuando `defaultChoice` no es válido o apunta a un origen que
no está disponible, y cuando existen metadatos de integridad de npm sin un origen npm
válido. Los consumidores deben tratar `installSource` como un campo opcional adicional para que
las entradas creadas manualmente y los adaptadores de catálogo no tengan que sintetizarlo.
Esto permite que la incorporación y los diagnósticos expliquen el estado del plano de orígenes sin
importar el entorno de ejecución del plugin.

Las entradas npm externas oficiales deben preferir un `npmSpec` exacto junto con
`expectedIntegrity`. Los nombres simples de paquetes y las etiquetas de distribución siguen funcionando por
compatibilidad, pero muestran advertencias del plano de orígenes para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas mediante integridad sin romper los plugins existentes.
Cuando la incorporación instala desde una ruta de catálogo local, registra una entrada del índice
de plugins administrados con `source: "path"` y un `sourcePath` relativo al espacio de trabajo
cuando sea posible. La ruta operativa absoluta de carga permanece en
`plugins.load.paths`; el registro de instalación evita duplicar las rutas de las estaciones de trabajo locales
en la configuración de larga duración. Esto mantiene visibles las instalaciones de desarrollo local para
los diagnósticos del plano de orígenes sin añadir una segunda superficie de divulgación de rutas sin procesar
del sistema de archivos. La tabla SQLite persistente `installed_plugin_index` es la fuente
de referencia de las instalaciones y puede actualizarse sin cargar los módulos del entorno de ejecución de los plugins.
Su mapa `installRecords` es persistente incluso si falta el manifiesto de un plugin o
no es válido; su contenido `plugins` es una vista reconstruible de los manifiestos.

## Plugins de motor de contexto

Los plugins de motor de contexto son responsables de la organización del contexto de sesión para la ingesta, el ensamblado
y la Compaction. Regístralos desde tu plugin con
`api.registerContextEngine(id, factory)` y, después, selecciona el motor activo mediante
`plugins.slots.contextEngine`.

Usa esto cuando tu plugin necesite reemplazar o ampliar la canalización de contexto
predeterminada, en lugar de limitarse a añadir búsquedas de memoria o hooks.

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

El objeto `ctx` de la factoría expone valores opcionales `config`, `agentDir` y `workspaceDir`
para la inicialización durante la creación.

`assemble()` puede devolver `contextProjection` cuando el entorno activo dispone de un
hilo de backend persistente. Omítelo para la proyección antigua por turno. Devuelve
`{ mode: "thread_bootstrap", epoch }` cuando el contexto ensamblado deba
inyectarse una vez en un hilo de backend y reutilizarse hasta que cambie la época. Cambia
la época después de que cambie el contexto semántico del motor, como tras una
pasada de Compaction gestionada por el motor. Los hosts pueden conservar los metadatos de llamadas a herramientas, la forma
de la entrada y los resultados censurados de las herramientas en una proyección de inicialización del hilo para que los
hilos nuevos de backend mantengan la continuidad de las herramientas sin copiar cargas sin procesar
que contengan secretos.

Si tu motor **no** es responsable del algoritmo de Compaction, mantén `compact()`
implementado y delégalo explícitamente:

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
el sistema de plugins mediante un acceso interno privado. Añada la capacidad que falta.

Secuencia recomendada:

1. **Defina el contrato del núcleo.** Decida qué comportamiento compartido debe gestionar el núcleo:
   políticas, mecanismos alternativos, combinación de configuración, ciclo de vida, semántica
   orientada a los canales y estructura de los auxiliares de tiempo de ejecución.
2. **Añada superficies tipadas de registro y tiempo de ejecución para plugins.** Amplíe
   `OpenClawPluginApi` o `api.runtime` con la superficie tipada de capacidad útil
   más pequeña posible.
3. **Conecte el núcleo y los consumidores de canales o funciones.** Los canales y plugins
   de funciones deben consumir la nueva capacidad a través del núcleo, no importando
   directamente una implementación de un proveedor.
4. **Registre las implementaciones de los proveedores.** Los plugins de proveedores registran
   entonces sus backends para la capacidad.
5. **Añada cobertura del contrato.** Añada pruebas para que la propiedad y la estructura
   de registro permanezcan explícitas con el tiempo.

Así es como OpenClaw mantiene criterios definidos sin quedar codificado de forma rígida según
la visión de un único proveedor. Consulte el [Recetario de capacidades](/es/plugins/adding-capabilities)
para ver una lista de comprobación concreta de archivos y un ejemplo desarrollado.

### Lista de comprobación de capacidades

Al añadir una nueva capacidad, la implementación normalmente debe abarcar en conjunto
estas superficies:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- ejecutor del núcleo o auxiliar de tiempo de ejecución en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- conexión del registro de plugins en `src/plugins/registry.ts`
- exposición del tiempo de ejecución de plugins en `src/plugins/runtime/*` cuando los plugins
  de funciones o canales necesiten consumirla
- auxiliares de captura y pruebas en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad y contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores y plugins en `docs/`

Si falta alguna de esas superficies, normalmente es señal de que la capacidad aún
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

Patrón de prueba del contrato (`src/plugins/contracts/registry.ts` expone consultas
de propiedad como `providerContractPluginIds`; las pruebas comprueban que la lista
`contracts.videoGenerationProviders` de un plugin coincida con lo que realmente registra):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Esto mantiene la regla simple:

- el núcleo gestiona el contrato y la orquestación de la capacidad
- los plugins de proveedores gestionan las implementaciones de cada proveedor
- los plugins de funciones y canales consumen los auxiliares de tiempo de ejecución
- las pruebas de contrato mantienen explícita la propiedad

## Relacionado

- [Arquitectura de plugins](/es/plugins/architecture) — modelo público y estructuras de capacidades
- [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
