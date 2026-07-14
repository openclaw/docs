---
read_when:
    - Implementación de hooks de runtime del proveedor, ciclo de vida del canal o paquetes de paquetes
    - Depuración del orden de carga de los plugins o del estado del registro
    - Añadir una nueva capacidad de Plugin o un Plugin de motor de contexto
summary: 'Aspectos internos de la arquitectura de plugins: canalización de carga, registro, hooks de ejecución, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de Plugin
x-i18n:
    generated_at: "2026-07-14T13:54:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: e8adc7d631a5b53d25626c9b622dc01da38a2886b45fa81f72d0e67654e64349
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para conocer el modelo público de capacidades, las formas de los plugins y los contratos de propiedad/ejecución, consulte [Arquitectura de plugins](/es/plugins/architecture). Esta página abarca la mecánica interna: canalización de carga, registro, hooks de tiempo de ejecución, rutas HTTP del Gateway, rutas de importación y tablas de esquemas.

## Canalización de carga

Al iniciarse, OpenClaw hace aproximadamente lo siguiente:

1. descubre las raíces de plugins candidatas
2. lee los manifiestos de paquetes nativos o compatibles y los metadatos de los paquetes
3. rechaza candidatos no seguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga los módulos nativos habilitados: los módulos incluidos ya compilados usan un cargador nativo;
   el código fuente TypeScript local de terceros usa el mecanismo alternativo de emergencia Jiti
7. invoca los hooks nativos `register(api)` y recopila los registros en el registro de plugins
8. expone el registro a los comandos y las superficies de tiempo de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo invoca en el mismo punto. Todos los plugins incluidos usan `register`; se recomienda `register` para los plugins nuevos.
</Note>

Las comprobaciones de seguridad se ejecutan **antes** de la ejecución en tiempo de ejecución. El descubrimiento bloquea un candidato cuando:

- su punto de entrada resuelto queda fuera de la raíz del plugin
- su ruta (o su directorio raíz) permite escritura a cualquier usuario
- en el caso de plugins no incluidos, la propiedad de la ruta no coincide con el uid actual (o con root)

En los directorios incluidos que permiten escritura a cualquier usuario, primero se intenta realizar una reparación local mediante `chmod` (las instalaciones globales o mediante npm pueden distribuir directorios de paquetes con `0777`) antes de volver a ejecutar la comprobación; las comprobaciones de propiedad se omiten por completo para el origen incluido.

Los candidatos bloqueados siguen incluyendo el id de su plugin en el diagnóstico emitido cuando se conoce (incluidos los ids resueltos a partir de un manifiesto dentro de un directorio que se ha rechazado por otros motivos), por lo que una configuración que haga referencia a ese id muestra un plugin bloqueado vinculado a una advertencia de seguridad de la ruta, en lugar de un error no relacionado de «plugin desconocido».

### Comportamiento basado primero en el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir los canales, las Skills, el esquema de configuración o las capacidades del paquete declarados
- validar `plugins.entries.<id>.config`
- ampliar las etiquetas y los textos de marcador de posición de la interfaz de control
- mostrar los metadatos de instalación y del catálogo
- conservar descriptores económicos de activación y configuración sin cargar el tiempo de ejecución del plugin

Para los plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra el comportamiento real, como hooks, herramientas, comandos o flujos de proveedores.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control. Son descriptores que solo contienen metadatos para planificar la activación y descubrir la configuración; no sustituyen el registro en tiempo de ejecución, `register(...)` ni `setupEntry`. Los consumidores de activación en vivo usan indicios de comandos, canales y proveedores del manifiesto para limitar la carga de plugins antes de una materialización más amplia del registro:

- la carga de la CLI se limita a los plugins que poseen el comando principal solicitado
- la configuración y resolución de plugins de canal se limita a los plugins que poseen el
  id de canal solicitado
- la configuración explícita y resolución en tiempo de ejecución del proveedor se limita a los plugins que poseen el
  id de proveedor solicitado
- la planificación del inicio del Gateway usa `activation.onStartup` para las importaciones explícitas
  de inicio; los plugins sin metadatos de inicio solo se cargan mediante
  desencadenadores de activación más específicos

El planificador de activación expone tanto una API que solo contiene ids para los llamadores existentes como una API de planificación para diagnósticos. Las entradas del plan indican por qué se seleccionó un plugin y separan los indicios explícitos de `activation.*` del mecanismo alternativo basado en la propiedad del manifiesto:

| Motivo (según los indicios de `activation.*`)   | Motivo (según la propiedad del manifiesto)                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                            |
| — (el desencadenador de hook no tiene una variante de indicio) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

Esa separación de motivos constituye el límite de compatibilidad: los metadatos existentes de los plugins siguen funcionando, mientras que el código nuevo puede detectar indicios amplios o comportamientos alternativos sin cambiar la semántica de carga en tiempo de ejecución.

Las precargas en tiempo de ejecución realizadas al procesar una solicitud que piden el ámbito amplio `all` siguen derivando un conjunto explícito de ids efectivos de plugins a partir de la configuración, la planificación del inicio, los canales configurados, los slots y las reglas de habilitación automática (`resolveEffectivePluginIds` en `src/plugins/effective-plugin-ids.ts`). Si ese conjunto derivado está vacío, OpenClaw mantiene vacío el ámbito en lugar de ampliarlo a todos los plugins detectables.

El descubrimiento de la configuración da preferencia a los ids propiedad de los descriptores, como `setup.providers` y `setup.cliBackends`, para limitar los plugins candidatos antes de recurrir a `setup-api` para los plugins que aún necesitan hooks de tiempo de ejecución durante la configuración. Las listas de configuración de proveedores usan `providerAuthChoices` del manifiesto, las opciones de configuración derivadas de descriptores y los metadatos del catálogo de instalación sin cargar el tiempo de ejecución del proveedor. Un valor explícito de `setup.requiresRuntime: false` constituye un límite exclusivo del descriptor; si se omite `requiresRuntime`, se conserva el mecanismo alternativo heredado de la API de configuración por motivos de compatibilidad. Si más de un plugin descubierto declara el mismo id normalizado de proveedor de configuración o de backend de la CLI, la búsqueda de configuración rechaza al propietario ambiguo en lugar de depender del orden de descubrimiento. Cuando se ejecuta el tiempo de ejecución de configuración, los diagnósticos del registro informan de las divergencias entre `setup.providers` / `setup.cliBackends` y los proveedores o backends de la CLI que realmente registra la API de configuración, sin bloquear los plugins heredados.

### Límite de la caché de plugins

OpenClaw no almacena en caché los resultados del descubrimiento de plugins ni los datos directos del registro de manifiestos mediante intervalos de tiempo real. Las instalaciones, las modificaciones de manifiestos y los cambios en las rutas de carga deben ser visibles en la siguiente lectura explícita de metadatos o reconstrucción de una instantánea. El analizador de archivos de manifiesto mantiene una caché acotada de firmas de archivos cuya clave se compone de la ruta del manifiesto abierto más el dispositivo/inodo, el tamaño y mtime/ctime; esa caché solo evita volver a analizar bytes sin cambios y no debe almacenar en caché respuestas de descubrimiento, registro, propietario ni políticas.

La vía rápida segura para los metadatos es la propiedad explícita de los objetos, no una caché oculta. Las rutas críticas de inicio del Gateway deben pasar el `PluginMetadataSnapshot` actual, el `PluginLookUpTable` derivado o un registro de manifiestos explícito a través de la cadena de llamadas. La validación de la configuración, la habilitación automática al inicio, la inicialización de plugins y la selección de proveedores pueden reutilizar esos objetos mientras representen la configuración y el inventario de plugins actuales. La búsqueda de configuración sigue reconstruyendo los metadatos de manifiestos bajo demanda, a menos que la ruta de configuración específica reciba un registro de manifiestos explícito; debe mantenerse como mecanismo alternativo para rutas no críticas en lugar de añadir cachés de búsqueda ocultas. Cuando cambie la entrada, se debe reconstruir y sustituir la instantánea en lugar de modificarla o conservar copias históricas. Las vistas del registro de plugins activo y los auxiliares de inicialización de canales incluidos deben volver a calcularse a partir del registro o la raíz actuales. Se permiten mapas de corta duración dentro de una sola llamada para eliminar trabajo duplicado o impedir la reentrada; no deben convertirse en cachés de metadatos del proceso.

Para la carga de plugins, la capa de caché persistente corresponde a la carga en tiempo de ejecución. Puede reutilizar el estado del cargador cuando el código o los artefactos instalados se cargan realmente, por ejemplo:

- `PluginLoaderCacheState` y registros de tiempo de ejecución activos compatibles
- cachés de jiti/módulos y cachés del cargador de superficies públicas usadas para evitar importar
  repetidamente la misma superficie de tiempo de ejecución
- cachés del sistema de archivos para artefactos de plugins instalados
- mapas de corta duración por llamada para la normalización de rutas o la resolución de duplicados

Estas cachés son detalles de implementación del plano de datos. No deben responder preguntas del plano de control, como «¿qué plugin posee este proveedor?», salvo que el llamador haya solicitado deliberadamente la carga en tiempo de ejecución.

No se deben añadir cachés persistentes ni basadas en el tiempo real para:

- resultados del descubrimiento
- registros directos de manifiestos
- registros de manifiestos reconstruidos a partir del índice de plugins instalados
- búsqueda del propietario del proveedor, supresión de modelos, políticas del proveedor o metadatos
  de artefactos públicos
- cualquier otra respuesta derivada de manifiestos en la que un cambio en el manifiesto, el índice instalado
  o la ruta de carga deba ser visible en la siguiente lectura de metadatos

Los llamadores que reconstruyen los metadatos de manifiestos a partir del índice persistente de plugins instalados reconstruyen ese registro bajo demanda. El índice instalado es un estado duradero del plano de origen; no es una caché oculta de metadatos en el proceso.

## Modelo del registro

Los plugins cargados no modifican directamente variables globales arbitrarias del núcleo. Se registran en un registro central de plugins (`PluginRegistry` en `src/plugins/registry-types.ts`), que mantiene registros de plugins (identidad, fuente, origen, estado y diagnósticos), además de matrices para cada capacidad: herramientas, hooks heredados y tipados, canales, proveedores, controladores RPC del Gateway, rutas HTTP, registradores de la CLI, servicios en segundo plano, comandos propiedad de plugins y muchas más familias tipadas de proveedores (voz, incrustaciones, generación de imágenes, vídeos y música, obtención y búsqueda web, entornos de agentes, acciones de sesión, etc.).

A continuación, las funciones del núcleo leen ese registro en lugar de comunicarse directamente con los módulos de plugins. Esto mantiene la carga unidireccional:

- módulo del plugin -> registro en el registro
- tiempo de ejecución del núcleo -> consumo del registro

Esta separación es importante para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo necesitan un punto de integración: «leer el registro», en lugar de «añadir un caso especial para cada módulo de plugin».

## Callbacks de vinculación de conversaciones

Los plugins que vinculan una conversación pueden reaccionar cuando se resuelve una aprobación.

Use `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de vinculación se apruebe o rechace:

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

Este callback es únicamente una notificación. No cambia quién tiene permiso para vincular una conversación y se ejecuta una vez finalizado el procesamiento de aprobación del núcleo.

## Hooks de tiempo de ejecución del proveedor

Los plugins de proveedores tienen tres capas:

- **Metadatos del manifiesto** para búsquedas económicas previas a la ejecución:
  `setup.providers[].envVars`, compatibilidad obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks de configuración**: `catalog` (`discovery` heredado), además de
  `applyConfigDefaults`.
- **Hooks de ejecución**: más de 40 hooks opcionales que abarcan autenticación, resolución de modelos,
  encapsulado de flujos, niveles de razonamiento, política de reproducción y endpoints de uso. Consulte
  [Orden y uso de los hooks](#hook-order-and-usage).

OpenClaw sigue gestionando el bucle genérico del agente, la conmutación por error, el tratamiento de transcripciones y
la política de herramientas. Estos hooks constituyen la superficie de extensión para comportamientos
específicos del proveedor sin necesitar un transporte de inferencia personalizado completo.

Use `setup.providers[].envVars` del manifiesto cuando el proveedor tenga
credenciales basadas en variables de entorno que las rutas genéricas de autenticación, estado y selección de modelos deban detectar sin
cargar la ejecución del plugin. El elemento obsoleto `providerAuthEnvVars` todavía es leído por el
adaptador de compatibilidad durante el periodo de obsolescencia, y los plugins no incluidos
que lo usan reciben un diagnóstico del manifiesto. Use `providerAuthAliases`
del manifiesto cuando un identificador de proveedor deba reutilizar las variables de entorno, los perfiles de autenticación,
la autenticación basada en configuración y la opción de incorporación mediante clave de API de otro identificador de proveedor. Use
`providerAuthChoices` del manifiesto cuando las superficies de la CLI para la incorporación y la selección de autenticación deban conocer el
identificador de opción del proveedor, las etiquetas de grupo y la configuración sencilla de autenticación mediante una sola opción
sin cargar la ejecución del proveedor. Reserve
`envVars` de la ejecución del proveedor para indicaciones dirigidas al operador, como etiquetas de incorporación o variables de configuración
del identificador y el secreto de cliente de OAuth.

Use `channelEnvVars` del manifiesto cuando un canal tenga autenticación o configuración basada en variables de entorno que
el mecanismo genérico de reserva de variables de entorno del shell, las comprobaciones de configuración y estado o las solicitudes de configuración deban detectar
sin cargar la ejecución del canal.

### Orden y uso de los hooks

Para los plugins de modelos y proveedores, OpenClaw llama a los hooks aproximadamente en este orden.
La columna "Cuándo usarlo" es la guía de decisión rápida.
Los campos de proveedor exclusivos de compatibilidad que OpenClaw ya no utiliza, como
`ProviderPlugin.capabilities` y `suppressBuiltInModel`, no se incluyen aquí
intencionadamente.

| Hook                              | Qué hace                                                                                                   | Cuándo usarlo                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`                                | El proveedor posee un catálogo o valores predeterminados de URL base                                                                                                  |
| `applyConfigDefaults`             | Aplica valores predeterminados de configuración global propiedad del proveedor durante la materialización de la configuración                                      | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de la familia de modelos del proveedor                                                                         |
| _(búsqueda de modelos integrada)_         | OpenClaw prueba primero la ruta normal del registro/catálogo                                                          | _(no es un hook de Plugin)_                                                                                                                         |
| `normalizeModelId`                | Normaliza alias heredados o preliminares de identificadores de modelo antes de la búsqueda                                                     | El proveedor se encarga de depurar los alias antes de la resolución canónica del modelo                                                                                 |
| `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo                                      | El proveedor se encarga de depurar el transporte para identificadores de proveedor personalizados de la misma familia de transporte                                                          |
| `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución del entorno de ejecución/proveedor                                           | El proveedor necesita una depuración de la configuración que debe residir en el Plugin; los auxiliares integrados de la familia de Google también respaldan las entradas de configuración de Google compatibles   |
| `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad del uso de streaming nativo a los proveedores de configuración                                               | El proveedor necesita corregir los metadatos de uso de streaming nativo en función del endpoint                                                                          |
| `resolveConfigApiKey`             | Resuelve la autenticación mediante marcadores de entorno para los proveedores de configuración antes de cargar la autenticación del entorno de ejecución                                       | Los proveedores exponen sus propios hooks de resolución de claves de API mediante marcadores de entorno                                                                                |
| `resolveSyntheticAuth`            | Expone autenticación local, autoalojada o respaldada por configuración sin persistir texto sin formato                                   | El proveedor puede funcionar con un marcador de credencial sintética/local                                                                                 |
| `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externos propiedad del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales propiedad de la CLI/aplicación | El proveedor reutiliza credenciales de autenticación externas sin persistir los tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| `shouldDeferSyntheticProfileAuth` | Reduce la prioridad de los marcadores de posición de perfiles sintéticos almacenados frente a la autenticación respaldada por el entorno o la configuración                                      | El proveedor almacena perfiles de marcadores de posición sintéticos que no deben tener precedencia                                                                 |
| `resolveDynamicModel`             | Alternativa síncrona para identificadores de modelo propiedad del proveedor que aún no están en el registro local                                       | El proveedor acepta identificadores arbitrarios de modelos del servicio ascendente                                                                                                 |
| `prepareDynamicModel`             | Preparación asíncrona, tras la cual `resolveDynamicModel` se ejecuta de nuevo                                                           | El proveedor necesita metadatos de red antes de resolver identificadores desconocidos                                                                                  |
| `normalizeResolvedModel`          | Reescritura final antes de que el ejecutor integrado utilice el modelo resuelto                                               | El proveedor necesita reescrituras de transporte, pero sigue utilizando un transporte del núcleo                                                                             |
| `normalizeToolSchemas`            | Normaliza los esquemas de herramientas antes de que el ejecutor integrado los procese                                                    | El proveedor necesita depurar los esquemas de la familia de transporte                                                                                                |
| `inspectToolSchemas`              | Expone diagnósticos de esquema propiedad del proveedor después de la normalización                                                  | El proveedor desea advertencias sobre palabras clave sin incorporar reglas específicas del proveedor al núcleo                                                                 |
| `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo o etiquetado                                                              | El proveedor necesita una salida etiquetada de razonamiento/final en lugar de campos nativos                                                                         |
| `prepareExtraParams`              | Normaliza los parámetros de solicitud antes de los contenedores genéricos de opciones de streaming                                              | El proveedor necesita parámetros de solicitud predeterminados o depurar los parámetros específicos del proveedor                                                                           |
| `createStreamFn`                  | Sustituye por completo la ruta normal de streaming por un transporte personalizado                                                   | El proveedor necesita un protocolo de comunicación personalizado, no solo un contenedor                                                                                     |
| `wrapStreamFn`                    | Contenedor de streaming aplicado después de los contenedores genéricos                                                              | El proveedor necesita contenedores de compatibilidad para encabezados, cuerpo o modelo de la solicitud sin un transporte personalizado                                                          |
| `resolveTransportTurnState`       | Adjunta encabezados o metadatos de transporte nativos por turno                                                           | El proveedor desea que los transportes genéricos envíen la identidad de turno nativa del proveedor                                                                       |
| `resolveWebSocketSessionPolicy`   | Adjunta encabezados WebSocket nativos o una política de espera de la sesión                                                    | El proveedor desea que los transportes WS genéricos ajusten los encabezados de sesión o la política de alternativa                                                               |
| `formatApiKey`                    | Formateador de perfiles de autenticación: el perfil almacenado se convierte en la cadena `apiKey` del entorno de ejecución                                     | El proveedor almacena metadatos de autenticación adicionales y necesita un formato de token personalizado para el entorno de ejecución                                                                    |
| `refreshOAuth`                    | Anulación de la actualización de OAuth para endpoints de actualización personalizados o políticas ante fallos de actualización                                  | El proveedor no se ajusta a los mecanismos de actualización compartidos de OpenClaw                                                                                          |
| `buildAuthDoctorHint`             | Indicación de reparación añadida cuando falla la actualización de OAuth                                                                  | El proveedor necesita orientación propia para reparar la autenticación después de un fallo de actualización                                                                      |
| `matchesContextOverflowError`     | Detector de desbordamiento de la ventana de contexto propiedad del proveedor                                                                 | El proveedor genera errores de desbordamiento sin procesar que las heurísticas genéricas no detectarían                                                                                |
| `classifyFailoverReason`          | Clasificación de motivos de conmutación por error propiedad del proveedor                                                                  | El proveedor puede asignar errores sin procesar de la API o el transporte a límites de frecuencia, sobrecarga, etc.                                                                          |
| `isCacheTtlEligible`              | Política de caché de prompts para proveedores de proxy/backhaul                                                               | El proveedor necesita controlar el TTL de la caché específicamente para el proxy                                                                                                |
| `buildMissingAuthMessage`         | Sustituto del mensaje genérico de recuperación por falta de autenticación                                                      | El proveedor necesita una indicación específica para recuperarse de la falta de autenticación                                                                                 |
| `augmentModelCatalog`             | Filas sintéticas/finales del catálogo añadidas después de la detección (obsoleto, véase más adelante)                                  | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                                                     |
| `resolveThinkingProfile`          | Conjunto de niveles `/think` específico del modelo, etiquetas visibles y valor predeterminado                                                 | El proveedor expone una escala de pensamiento personalizada o una etiqueta binaria para los modelos seleccionados                                                                 |
| `isBinaryThinking`                | Hook de compatibilidad para activar o desactivar el razonamiento                                                                     | El proveedor solo expone la activación o desactivación binaria del pensamiento                                                                                                  |
| `supportsXHighThinking`           | Hook de compatibilidad con el razonamiento `xhigh`                                                                   | El proveedor desea `xhigh` solo en un subconjunto de modelos                                                                                             |
| `resolveDefaultThinkingLevel`     | Hook de compatibilidad del nivel `/think` predeterminado                                                                      | El proveedor controla la política `/think` predeterminada para una familia de modelos                                                                                      |
| `isModernModelRef`                | Detector de modelos modernos para filtros de perfiles activos y selección de pruebas de humo                                              | El proveedor controla la correspondencia de modelos preferidos para pruebas activas/de humo                                                                                             |
| `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token o la clave reales del entorno de ejecución justo antes de la inferencia                       | El proveedor necesita intercambiar un token u obtener una credencial de solicitud de corta duración                                                                             |
| `resolveUsageAuth`                | Resuelve las credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                                     | El proveedor necesita un análisis personalizado del token de uso/cuota o una credencial de uso diferente                                                               |
| `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación                             | El proveedor necesita un endpoint de uso específico o un analizador de carga útil específico                                                                           |
| `createEmbeddingProvider`         | Crear un adaptador de embeddings propiedad del proveedor para la memoria/búsqueda                                                     | El comportamiento de los embeddings de memoria corresponde al Plugin del proveedor                                                                                    |
| `buildReplayPolicy`               | Devolver una política de reproducción que controle la gestión de la transcripción para el proveedor                                        | El proveedor necesita una política de transcripción personalizada (por ejemplo, la eliminación de bloques de razonamiento)                                                               |
| `sanitizeReplayHistory`           | Reescribir el historial de reproducción después de la limpieza genérica de la transcripción                                                        | El proveedor necesita reescrituras de reproducción específicas del proveedor, además de los auxiliares compartidos de Compaction                                                             |
| `validateReplayTurns`             | Validar o reformatear el turno final de reproducción antes del ejecutor integrado                                           | El transporte del proveedor necesita una validación de turnos más estricta después del saneamiento genérico                                                                    |
| `onModelSelected`                 | Ejecutar efectos secundarios posteriores a la selección propiedad del proveedor                                                                 | El proveedor necesita telemetría o un estado propiedad del proveedor cuando se activa un modelo                                                                  |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` comprueban primero el
plugin del proveedor coincidente y, a continuación, continúan con los demás plugins
de proveedores compatibles con hooks hasta que uno modifica realmente el id. del
modelo o el transporte/la configuración. Esto permite que los adaptadores de
alias/compatibilidad de proveedores sigan funcionando sin que el llamador tenga
que saber qué plugin incluido controla la reescritura. Si ningún hook de proveedor
reescribe una entrada de configuración compatible de la familia Google, el
normalizador de configuración de Google incluido sigue aplicando esa limpieza de
compatibilidad.

Si el proveedor necesita un protocolo de conexión completamente personalizado o
un ejecutor de solicitudes personalizado, se trata de otra clase de extensión.
Estos hooks son para comportamientos de proveedores que siguen ejecutándose en el
bucle de inferencia normal de OpenClaw.

`resolveUsageAuth` determina si OpenClaw debe llamar a `fetchUsageSnapshot` o
recurrir a la resolución genérica de credenciales para las superficies de
uso/estado. Devuelva `{ token, accountId?, subscriptionType?, rateLimitTier? }` cuando el proveedor
tenga una credencial de uso (los metadatos opcionales del plan pasan a
`fetchUsageSnapshot`), devuelva
`{ handled: true }` cuando la autenticación de uso controlada por el proveedor haya
gestionado la solicitud y deba impedir la alternativa genérica de clave de
API/OAuth, y devuelva `null` o `undefined`
cuando el proveedor no haya gestionado la autenticación de uso.

Declare las credenciales de organización o facturación en el manifiesto
`providerUsageAuthEnvVars`. Esto permite que las superficies genéricas de
detección y eliminación de secretos las reconozcan sin convertirlas en candidatas
a autenticación de inferencia.

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

Los plugins de proveedores incluidos combinan los hooks anteriores para adaptarse
a las necesidades de catálogo, autenticación, razonamiento, reproducción y uso de
cada proveedor. El conjunto de hooks autoritativo reside con cada plugin en
`extensions/`; esta página ilustra las estructuras en lugar de reproducir la
lista.

<AccordionGroup>
  <Accordion title="Proveedores de catálogo de transferencia directa">
    OpenRouter, Kilocode, Z.AI y xAI registran `catalog` junto con
    `resolveDynamicModel` / `prepareDynamicModel` para poder mostrar los id. de
    modelos de nivel superior antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Proveedores de OAuth y endpoints de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi y z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para controlar el intercambio de tokens y la integración
    de `/usage`.
  </Accordion>
  <Accordion title="Familias de reproducción y limpieza de transcripciones">
    Las familias compartidas con nombre (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los proveedores adopten
    la política de transcripciones mediante `buildReplayPolicy`, en lugar de que
    cada plugin vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Proveedores solo de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` registran únicamente `catalog` y utilizan el bucle de inferencia compartido.
  </Accordion>
  <Accordion title="Ayudantes de flujo específicos de Anthropic">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` residen dentro de
    la interfaz pública `api.ts` / `contract-api.ts` del plugin de
    Anthropic (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), en lugar de en
    el SDK genérico.
  </Accordion>
</AccordionGroup>

## Ayudantes del entorno de ejecución

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
- Utiliza la configuración `messages.tts` y la selección de proveedor del núcleo.
- Devuelve un búfer de audio PCM y la frecuencia de muestreo. Los plugins deben volver a muestrear/codificar para los proveedores.
- `listVoices` es opcional para cada proveedor. Utilícelo para selectores de voz o flujos de configuración controlados por el proveedor.
- El núcleo pasa una fecha límite de solicitud resuelta a los hooks `listVoices` del proveedor; la configuración de tiempo de espera específica del proveedor puede sustituirla.
- Las listas de voces pueden incluir metadatos más completos, como etiquetas de configuración regional, género y personalidad, para selectores que tengan en cuenta al proveedor.
- OpenAI y ElevenLabs admiten telefonía actualmente. Microsoft no.

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

- Mantenga en el núcleo la política de TTS, la alternativa y la entrega de respuestas.
- Utilice proveedores de voz para el comportamiento de síntesis controlado por el proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id. de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un plugin de proveedor puede controlar
  los proveedores de texto, voz, imágenes y futuros medios a medida que OpenClaw añada esos
  contratos de capacidades.

Para la comprensión de imágenes/audio/vídeo, los plugins registran un proveedor
tipado de comprensión de medios en lugar de un contenedor genérico de clave/valor:

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

- Mantenga en el núcleo la orquestación, la alternativa, la configuración y la conexión de canales.
- Mantenga el comportamiento del proveedor en el plugin del proveedor.
- La ampliación aditiva debe conservar los tipos: nuevos métodos opcionales, nuevos campos
  de resultado opcionales y nuevas capacidades opcionales.
- La generación de vídeo ya sigue el mismo patrón:
  - el núcleo controla el contrato de capacidades y el ayudante del entorno de ejecución
  - los plugins de proveedores registran `api.registerVideoGenerationProvider(...)`
  - los plugins de funciones/canales consumen `api.runtime.videoGeneration.*`

Para los ayudantes del entorno de ejecución de comprensión de medios, los plugins
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

Para la transcripción de audio, los plugins pueden utilizar el entorno de
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
- `extractStructuredWithModel(...)` es la interfaz orientada a plugins para la extracción acotada,
  controlada por el proveedor y centrada en imágenes. Incluya al menos una entrada de imagen;
  las entradas de texto son contexto complementario. Los plugins de producto controlan sus rutas y
  esquemas, mientras que OpenClaw controla el límite del proveedor/entorno de ejecución.
- Utiliza la configuración de audio de comprensión de medios del núcleo (`tools.media.audio`) y el orden de proveedores alternativos.
- Devuelve `{ text: undefined }` cuando no se produce ninguna salida de transcripción (por ejemplo, una entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` se mantiene como alias de compatibilidad.

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
- `toolsAlsoAllow` acepta nombres de herramientas exactos y de propiedad inequívoca registrados por el plugin que realiza la llamada. Los nombres del núcleo y los ambiguos se rechazan. Se añade al perfil normal, pero las listas de permitidos y las denegaciones del operador siguen siendo autoritativas.
- OpenClaw solo respeta esos campos de sustitución para llamadores de confianza.
- Para las ejecuciones alternativas controladas por plugins, los operadores deben habilitarlas expresamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilice `plugins.entries.<id>.subagent.allowedModels` para restringir los plugins de confianza a destinos `provider/model` canónicos específicos, o `"*"` para permitir explícitamente cualquier destino.
- Las ejecuciones de subagentes de plugins que no son de confianza siguen funcionando, pero las solicitudes de sustitución se rechazan en lugar de recurrir silenciosamente a la alternativa.
- Las sesiones de subagentes creadas por plugins se etiquetan con el id. del plugin creador. La alternativa `api.runtime.subagent.deleteSession(...)` solo puede eliminar esas sesiones propias; la eliminación arbitraria de sesiones sigue requiriendo una solicitud al Gateway con ámbito de administrador.

Para las búsquedas web, los plugins pueden utilizar el ayudante compartido del
entorno de ejecución en lugar de acceder directamente a la conexión de
herramientas del agente:

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
- Utilice proveedores de búsqueda web para los transportes de búsqueda específicos de cada proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para los plugins de funciones/canales que necesitan funciones de búsqueda sin depender del contenedor de herramientas del agente.

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

Campos de ruta:

- `path`: ruta dentro del servidor HTTP del Gateway.
- `auth`: obligatorio, `"gateway"` o `"plugin"`. Utilice `"gateway"` para exigir la autenticación normal del Gateway o `"plugin"` para la autenticación/verificación de Webhooks gestionada por el plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `handleUpgrade`: controlador opcional para solicitudes de actualización de WebSocket en la misma ruta.
- `replaceExisting`: opcional. Permite que el mismo plugin sustituya su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta haya gestionado la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error al cargar el plugin. Utilice `api.registerHttpRoute(...)` en su lugar.
- Las rutas de los plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que se use `replaceExisting: true`, y un plugin no puede sustituir la ruta de otro plugin.
- Se rechazan las rutas superpuestas con distintos niveles de `auth`. Mantenga las cadenas de paso a la siguiente opción `exact`/`prefix` únicamente en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente ámbitos de tiempo de ejecución del operador. Están destinadas a Webhooks/verificación de firmas gestionados por plugins, no a llamadas privilegiadas a los asistentes del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un ámbito de tiempo de ejecución de solicitudes del Gateway. La superficie predeterminada (`gatewayRuntimeScopeSurface: "write-default"`) es deliberadamente conservadora:
  - la autenticación de portador mediante secreto compartido (`gateway.auth.mode = "token"` / `"password"`) y cualquier método de autenticación que no sea de proxy de confianza obtienen un único ámbito `operator.write`, incluso si el llamante envía `x-openclaw-scopes`
  - los llamantes `trusted-proxy` sin un encabezado `x-openclaw-scopes` explícito también conservan la superficie heredada limitada a `operator.write`
  - los llamantes `trusted-proxy` que sí envían `x-openclaw-scopes` obtienen en su lugar los ámbitos declarados
  - una ruta puede optar por `gatewayRuntimeScopeSurface: "trusted-operator"` para respetar siempre `x-openclaw-scopes` en los modos de autenticación con identidad (y recurrir al conjunto completo de ámbitos predeterminados de la CLI cuando el encabezado esté ausente)
- Regla práctica: no se debe suponer que una ruta de plugin autenticada por el Gateway sea una superficie de administración implícita. Si la ruta necesita un comportamiento exclusivo de administración, opte por la superficie de ámbitos `trusted-operator`, exija un modo de autenticación con identidad y documente el contrato explícito del encabezado `x-openclaw-scopes`.
- Tras hacer coincidir la ruta y completar la autenticación, los controladores normales participan en la admisión del trabajo raíz del Gateway. Un Gateway preparado o reiniciándose devuelve `503` antes de invocar el controlador. La excepción restringida es una ruta `auth: "gateway"` autorizada por el manifiesto que también opte por la superficie específica de la ruta `trusted-operator`; permanece accesible para que el envío de controles de suspensión no quede bloqueado, mientras que las rutas hermanas normales del mismo plugin permanecen tras el límite de admisión. La propiedad de la `handleUpgrade` de WebSocket utiliza el mismo límite de admisión atómico; una vez que el controlador acepta un socket, el ciclo de vida posterior del socket pertenece al plugin y este límite no lo supervisa.

## Rutas de importación del SDK de plugins

Utilice subrutas específicas del SDK en lugar del barrel raíz monolítico `openclaw/plugin-sdk`
al crear plugins nuevos. Subrutas principales:

| Subruta                             | Finalidad                                          |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de plugins                  |
| `openclaw/plugin-sdk/channel-core`  | Asistentes para entradas/compilación de canales    |
| `openclaw/plugin-sdk/core`          | Asistentes genéricos compartidos y contrato general |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz `openclaw.json` (`OpenClawSchema`) |

Los plugins de canales eligen entre una familia de interfaces específicas: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un solo contrato `approvalCapability`, en lugar de combinarse entre campos
de plugins no relacionados. Consulte [Plugins de canales](/es/plugins/sdk-channel-plugins).

Los asistentes de tiempo de ejecución y configuración se encuentran en subrutas específicas coincidentes de `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefiera `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation`
en lugar del amplio barrel de compatibilidad `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
las pequeñas fachadas de asistentes de canales, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
y `openclaw/plugin-sdk/infra-runtime` son adaptadores de compatibilidad obsoletos para
plugins anteriores. El código nuevo debe importar en su lugar primitivas genéricas más específicas.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de plugin incluido):

- `index.js` — entrada del plugin incluido
- `api.js` — barrel de asistentes/tipos
- `runtime-api.js` — barrel exclusivo de tiempo de ejecución
- `setup-entry.js` — entrada del plugin de configuración

Los plugins externos solo deben importar subrutas de `openclaw/plugin-sdk/*`. Nunca
importe el `src/*` del paquete de otro plugin desde el núcleo ni desde otro plugin.
Los puntos de entrada cargados mediante fachadas prefieren la instantánea activa de configuración de tiempo de ejecución cuando
existe y, en caso contrario, recurren al archivo de configuración resuelto en el disco.

Existen subrutas específicas de capacidades, como `image-generation`, `media-understanding`
y `speech`, porque los plugins incluidos las utilizan actualmente. No son
automáticamente contratos externos inmutables a largo plazo; consulte la página de referencia
del SDK pertinente cuando dependa de ellas.

## Esquemas de herramientas de mensajes

Los plugins deben controlar las contribuciones de esquemas `describeMessageTool(...)`
específicas de cada canal para primitivas ajenas a los mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envíos debe utilizar el contrato genérico `MessagePresentation`
en lugar de campos de botones, componentes, bloques o tarjetas nativos del proveedor.
Consulte [Presentación de mensajes](/es/plugins/message-presentation) para conocer el contrato,
las reglas de reserva, la asignación de proveedores y la lista de comprobación para autores de plugins.

Los plugins con capacidad de envío declaran lo que pueden representar mediante las capacidades de mensajes:

- `presentation` para bloques de presentación semántica (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El núcleo decide si representa la presentación de forma nativa o la degrada a texto.
No exponga vías de escape de interfaz de usuario nativas del proveedor desde la herramienta genérica de mensajes.
Los asistentes obsoletos del SDK para esquemas nativos heredados siguen exportándose para los
plugins de terceros existentes, pero los plugins nuevos no deben utilizarlos.

## Resolución de destinos de canales

Los plugins de canales deben controlar la semántica de destinos específica de cada canal. Mantenga genérico
el host de salida compartido y utilice la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de buscar en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al núcleo si una
  entrada debe pasar directamente a una resolución similar a un identificador en lugar de buscar en el directorio.
- `messaging.targetResolver.reservedLiterals` enumera las palabras simples que son
  referencias de canales/sesiones para ese proveedor. La resolución conserva las entradas
  configuradas del directorio antes de rechazar los literales reservados y, después, se cierra de forma segura
  si no hay coincidencias en el directorio.
- `messaging.targetResolver.resolveTarget(...)` es la alternativa del plugin cuando
  el núcleo necesita una resolución final controlada por el proveedor tras la normalización o
  después de no encontrar coincidencias en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` controla la construcción de rutas de sesión
  específicas del proveedor una vez resuelto un destino.

División recomendada:

- Utilice `inferTargetChatType` para decisiones de categoría que deban tomarse antes de
  buscar pares/grupos.
- Utilice `looksLikeId` para comprobaciones del tipo «tratar esto como un identificador de destino explícito/nativo».
- Utilice `resolveTarget` como alternativa de normalización específica del proveedor, no para
  búsquedas amplias en el directorio.
- Mantenga los identificadores nativos del proveedor, como identificadores de chats, identificadores de hilos, JID, identificadores de usuario e
  identificadores de salas, dentro de los valores `target` o de parámetros específicos del proveedor, no en campos
  genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que deriven entradas de directorio de la configuración deben mantener esa lógica en el
plugin y reutilizar los asistentes compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Utilice esto cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares de mensajes directos determinados por listas de permitidos
- mapas configurados de canales/grupos
- alternativas de directorio estático circunscritas a una cuenta

Los asistentes compartidos de `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- asistentes de desduplicación/normalización
- creación de `ChannelDirectoryEntry[]`

La inspección de cuentas y la normalización de identificadores específicas de cada canal deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedores pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma estructura que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedores

Utilice `catalog` cuando el plugin controle identificadores de modelos específicos del proveedor, valores predeterminados
de URL base o metadatos de modelos condicionados por la autenticación.

`catalog.order` controla cuándo se combina el catálogo de un plugin respecto de los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples basados en claves de API o variables de entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedores relacionadas
- `late`: última pasada, después de los demás proveedores implícitos

Los proveedores posteriores prevalecen en caso de colisión de claves, por lo que los plugins pueden sustituir
deliberadamente una entrada de proveedor integrada que tenga el mismo identificador de proveedor.

Los plugins también pueden publicar filas de modelos de solo lectura mediante
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Esta es la vía prevista para las superficies de lista/ayuda/selector y admite
filas `text`, `voice`, `image_generation`, `video_generation` y `music_generation`.
Los plugins de proveedores siguen siendo responsables de las llamadas a endpoints en vivo, el intercambio de tokens y
la asignación de respuestas del proveedor; el núcleo es responsable de la forma común de las filas, las etiquetas de origen y
el formato de la ayuda de las herramientas multimedia. Los registros de proveedores de generación multimedia sintetizan
automáticamente filas de catálogo estáticas a partir de `defaultModel`, `models` y
`capabilities`.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado, pero emite una advertencia de obsolescencia
- si se registran tanto `catalog` como `discovery`, OpenClaw utiliza `catalog`
  y emite una advertencia
- `augmentModelCatalog` está obsoleto; los proveedores incluidos deben publicar
  filas complementarias mediante `registerModelCatalogProvider`

## Inspección de canales de solo lectura

Si el plugin registra un canal, se recomienda implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Motivos:

- `resolveAccount(...)` es la ruta de ejecución. Puede suponer que las credenciales
  están totalmente materializadas y fallar de inmediato cuando falten secretos obligatorios.
- Las rutas de comandos de solo lectura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, y los flujos de reparación de
  doctor/configuración no deberían tener que materializar credenciales de ejecución solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve únicamente el estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye campos de origen/estado de las credenciales cuando corresponda, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No es necesario devolver los valores sin procesar de los tokens solo para informar de la
  disponibilidad de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen
  correspondiente) es suficiente para los comandos de estado.
- Utiliza `configured_unavailable` cuando una credencial está configurada mediante SecretRef, pero
  no está disponible en la ruta de comandos actual.

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

Cada entrada se convierte en un plugin. Si el paquete enumera varias extensiones, el id del plugin
se convierte en `<manifestOrPackageName>/<fileBase>` (el id del manifiesto tiene prioridad cuando
está presente; de lo contrario, se usa el nombre `package.json` sin ámbito).

Si el plugin importa dependencias de npm, deben instalarse en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Medida de seguridad: cada entrada `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de resolver los enlaces simbólicos. Se rechazan las entradas que escapen del directorio del paquete.

Nota de seguridad: `openclaw plugins install` instala las dependencias del plugin con un
`npm install --omit=dev --ignore-scripts` local del proyecto (sin scripts de ciclo de vida
ni dependencias de desarrollo durante la ejecución), ignorando la configuración global heredada de instalación de npm.
Se deben mantener los árboles de dependencias del plugin como «JS/TS puro» y evitar los paquetes que requieran
compilaciones de `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero exclusivo para la configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún no está configurado, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto aligera el inicio y la configuración
cuando la entrada principal del plugin también conecta herramientas, hooks u otro código
exclusivo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede incluir un plugin de canal en la misma ruta `setupEntry` durante la fase de inicio
anterior a la escucha del Gateway, incluso cuando el canal ya está configurado.

Debe utilizarse únicamente cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el Gateway comience a escuchar. En la práctica, esto significa que la entrada de configuración
debe registrar todas las capacidades pertenecientes al canal de las que dependa el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el Gateway comience a escuchar
- cualquier método, herramienta o servicio del Gateway que deba existir durante ese mismo intervalo

Si la entrada completa sigue siendo responsable de alguna capacidad de inicio obligatoria, no debe habilitarse
esta marca. Se debe mantener el comportamiento predeterminado del plugin y permitir que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar auxiliares de superficie de contrato exclusivos para la configuración que el núcleo
puede consultar antes de que se cargue la ejecución completa del canal. La superficie actual de
promoción de la configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo utiliza esa superficie cuando necesita promover una configuración heredada de canal de una sola cuenta
a `channels.<id>.accounts.*` sin cargar la entrada completa del plugin.
Matrix es el ejemplo incluido actual: mueve únicamente las claves de autenticación/inicialización a una
cuenta promovida con nombre cuando ya existen cuentas con nombre y puede conservar una clave
configurada de cuenta predeterminada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parches de configuración mantienen diferido el descubrimiento de la superficie de contrato incluida. El tiempo
de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de
volver a iniciar el canal incluido durante la importación del módulo.

Cuando esas superficies de inicio incluyan métodos RPC del Gateway, deben mantenerse bajo un
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

Los plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
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
- `preferOver`: ids de plugins/canales de menor prioridad a los que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto de la superficie de selección
- `markdownCapable`: marca el canal como compatible con Markdown para las decisiones de formato de salida
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para las superficies de navegación de la documentación
- `showConfigured` / `showInSetup`: aliases heredados que aún se aceptan por compatibilidad; se recomienda `exposure`
- `quickstartAllowFrom`: incluye el canal en el flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: exige la vinculación explícita de la cuenta incluso cuando solo existe una
- `preferSessionLookupForAnnounceTarget`: prioriza la búsqueda de sesiones al resolver destinos de anuncios

OpenClaw también puede combinar **catálogos de canales externos** (por ejemplo, una exportación de
registro MPM). Coloque un archivo JSON en una de estas ubicaciones:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

También se puede hacer que `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) apunte a
uno o varios archivos JSON (delimitados por comas, punto y coma o `PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como aliases heredados para la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de instalación de proveedores exponen
datos normalizados sobre el origen de instalación junto al bloque `openclaw.install` sin procesar. Los
datos normalizados identifican si la especificación de npm es una versión exacta o un
selector flotante, si están presentes los metadatos de integridad esperados y si también
hay disponible una ruta de origen local. Cuando se conoce la identidad del catálogo/paquete, los
datos normalizados advierten si el nombre analizado del paquete npm difiere de esa identidad.
También advierten cuando `defaultChoice` no es válido o apunta a un origen que no está
disponible, y cuando existen metadatos de integridad de npm sin un origen npm válido.
Los consumidores deben tratar `installSource` como un campo opcional aditivo para que
las entradas creadas manualmente y los adaptadores de catálogo no tengan que sintetizarlo.
Esto permite que la incorporación y los diagnósticos expliquen el estado del plano de origen sin
importar la ejecución del plugin.

Las entradas npm externas oficiales deberían priorizar un `npmSpec` exacto junto con
`expectedIntegrity`. Los nombres de paquetes sin versión y las etiquetas de distribución siguen funcionando por
compatibilidad, pero muestran advertencias del plano de origen para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas mediante integridad sin romper los plugins existentes.
Cuando la incorporación realiza la instalación desde una ruta de catálogo local, registra una entrada administrada
del índice de plugins con `source: "path"` y un
`sourcePath` relativo al espacio de trabajo cuando es posible. La ruta operativa absoluta de carga permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas de estaciones de trabajo locales
en la configuración de larga duración. Esto mantiene visibles las instalaciones de desarrollo local para
los diagnósticos del plano de origen sin añadir una segunda superficie de exposición de rutas sin procesar
del sistema de archivos. La tabla SQLite persistida `installed_plugin_index` es la fuente
de verdad de las instalaciones y puede actualizarse sin cargar los módulos de ejecución del plugin.
Su mapa `installRecords` es duradero incluso cuando falta un manifiesto del plugin o
no es válido; su carga útil `plugins` es una vista reconstruible del manifiesto.

## Plugins de motor de contexto

Los plugins de motor de contexto son responsables de la orquestación del contexto de sesión para la ingesta, el ensamblaje
y la Compaction. Se registran desde el plugin mediante
`api.registerContextEngine(id, factory)` y, a continuación, se selecciona el motor activo con
`plugins.slots.contextEngine`.

Se utiliza cuando el plugin necesita sustituir o ampliar la canalización de contexto
predeterminada en lugar de limitarse a añadir búsquedas en la memoria o hooks.

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

La fábrica `ctx` expone valores opcionales `config`, `agentDir` y `workspaceDir`
para la inicialización durante la construcción.

`assemble()` puede devolver `contextProjection` cuando el entorno activo tiene un
hilo persistente en el backend. Omítalo para la proyección heredada por turno. Devuelva
`{ mode: "thread_bootstrap", epoch }` cuando el contexto ensamblado deba
inyectarse una vez en un hilo del backend y reutilizarse hasta que cambie la época. Cambie
la época después de que cambie el contexto semántico del motor, por ejemplo, tras una
pasada de Compaction gestionada por el motor. Los hosts pueden conservar los metadatos de llamadas a herramientas, la forma
de la entrada y los resultados redactados de las herramientas en una proyección de arranque del hilo para que los nuevos
hilos del backend mantengan la continuidad de las herramientas sin copiar cargas útiles sin procesar
que contengan secretos.

Si su motor **no** controla el algoritmo de Compaction, mantenga `compact()`
implementado y deléguelo explícitamente:

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

1. **Defina el contrato del núcleo.** Decida qué comportamiento compartido debe controlar el núcleo:
   políticas, mecanismo alternativo, combinación de configuración, ciclo de vida, semántica orientada a canales y
   forma del auxiliar de tiempo de ejecución.
2. **Añada superficies tipadas de registro y tiempo de ejecución para plugins.** Amplíe
   `OpenClawPluginApi` o `api.runtime`, o ambos, con la superficie tipada de
   capacidad útil más pequeña.
3. **Conecte el núcleo y los consumidores de canales o funcionalidades.** Los canales y los plugins de funcionalidades
   deben consumir la nueva capacidad a través del núcleo, no importando directamente una implementación
   de un proveedor.
4. **Registre las implementaciones de los proveedores.** A continuación, los plugins de proveedores registran sus
   backends para la capacidad.
5. **Añada cobertura del contrato.** Añada pruebas para que la forma de la propiedad y del registro
   siga siendo explícita con el tiempo.

Así es como OpenClaw mantiene criterios definidos sin quedar codificado específicamente según la
visión del mundo de un único proveedor. Consulte el [recetario de capacidades](/es/plugins/adding-capabilities)
para ver una lista de comprobación concreta de archivos y un ejemplo desarrollado.

### Lista de comprobación de capacidades

Cuando añada una nueva capacidad, la implementación normalmente debe abarcar conjuntamente estas
superficies:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- ejecutor o auxiliar de tiempo de ejecución del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- conexión del registro de plugins en `src/plugins/registry.ts`
- exposición del tiempo de ejecución del plugin en `src/plugins/runtime/*` cuando los plugins de funcionalidades o canales
  necesiten consumirla
- auxiliares de captura y pruebas en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad y contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores y plugins en `docs/`

Si falta alguna de esas superficies, normalmente es una señal de que la capacidad
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

Patrón de prueba del contrato (`src/plugins/contracts/registry.ts` expone consultas de
propiedad como `providerContractPluginIds`; las pruebas verifican que la lista
`contracts.videoGenerationProviders` de un plugin coincida con lo que realmente registra):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Esto mantiene la regla simple:

- el núcleo controla el contrato y la orquestación de la capacidad
- los plugins de proveedores controlan las implementaciones de cada proveedor
- los plugins de funcionalidades o canales consumen los auxiliares de tiempo de ejecución
- las pruebas del contrato mantienen explícita la propiedad

## Contenido relacionado

- [Arquitectura de plugins](/es/plugins/architecture) — modelo y estructuras públicas de capacidades
- [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
