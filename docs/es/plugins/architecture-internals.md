---
read_when:
    - Implementación de hooks de runtime de proveedores, ciclo de vida de canales o paquetes de paquetes
    - Depuración del orden de carga de plugins o del estado del registro
    - Añadir una nueva capacidad de Plugin o un Plugin de motor de contexto
summary: 'Aspectos internos de la arquitectura de Plugins: canal de carga, registro, hooks de tiempo de ejecución, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de Plugin
x-i18n:
    generated_at: "2026-07-12T14:39:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para conocer el modelo público de capacidades, las formas de los plugins y los contratos de propiedad/ejecución, consulte [Arquitectura de plugins](/es/plugins/architecture). Esta página abarca la mecánica interna: canalización de carga, registro, hooks de tiempo de ejecución, rutas HTTP del Gateway, rutas de importación y tablas de esquemas.

## Canalización de carga

Al iniciarse, OpenClaw hace aproximadamente lo siguiente:

1. descubre las raíces de plugins candidatos
2. lee los manifiestos de paquetes nativos o compatibles y los metadatos de paquetes
3. rechaza los candidatos no seguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. determina la habilitación de cada candidato
6. carga los módulos nativos habilitados: los módulos integrados compilados utilizan un cargador nativo;
   el código fuente TypeScript local de terceros utiliza el mecanismo alternativo de emergencia Jiti
7. llama a los hooks nativos `register(api)` y recopila los registros en el registro de plugins
8. expone el registro a los comandos y las superficies de tiempo de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins integrados utilizan `register`; se recomienda `register` para los plugins nuevos.
</Note>

Las barreras de seguridad se ejecutan **antes** de la ejecución en tiempo de ejecución. El descubrimiento bloquea un candidato cuando:

- su punto de entrada resuelto queda fuera de la raíz del plugin
- su ruta (o su directorio raíz) permite escritura para cualquier usuario
- para plugins no integrados, la propiedad de la ruta no coincide con el uid actual (ni con root)

En los directorios integrados con escritura para cualquier usuario, primero se intenta una reparación `chmod` en el lugar (las instalaciones npm/globales pueden distribuir directorios de paquetes con permisos `0777`) antes de volver a comprobar la barrera; las comprobaciones de propiedad se omiten por completo para el origen integrado.

Los candidatos bloqueados siguen incluyendo su id de plugin en el diagnóstico emitido cuando se conoce (incluidos los ids resueltos desde un manifiesto dentro de un directorio que, por lo demás, se rechaza), de modo que una configuración que haga referencia a ese id vea un plugin bloqueado vinculado a una advertencia de seguridad de la ruta, en lugar de un error no relacionado de "plugin desconocido".

### Comportamiento basado primero en el manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo utiliza para:

- identificar el plugin
- descubrir los canales, las Skills, el esquema de configuración o las capacidades del paquete declarados
- validar `plugins.entries.<id>.config`
- complementar las etiquetas y los marcadores de posición de la interfaz de control
- mostrar los metadatos de instalación y catálogo
- conservar descriptores económicos de activación y configuración sin cargar el tiempo de ejecución del plugin

Para los plugins nativos, el módulo de tiempo de ejecución corresponde al plano de datos. Registra el comportamiento real, como hooks, herramientas, comandos o flujos de proveedores.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control. Son descriptores compuestos únicamente por metadatos para planificar la activación y descubrir la configuración; no sustituyen el registro en tiempo de ejecución, `register(...)` ni `setupEntry`. Los consumidores de activación en vivo utilizan indicios de comandos, canales y proveedores del manifiesto para restringir la carga de plugins antes de una materialización más amplia del registro:

- la carga de la CLI se restringe a los plugins propietarios del comando principal solicitado
- la configuración de canales y la resolución de plugins se restringen a los plugins propietarios del id de canal solicitado
- la configuración explícita de proveedores y la resolución en tiempo de ejecución se restringen a los plugins propietarios del id de proveedor solicitado
- la planificación del inicio del Gateway utiliza `activation.onStartup` para las importaciones explícitas de inicio; los plugins sin metadatos de inicio solo se cargan mediante desencadenadores de activación más específicos

El planificador de activación expone tanto una API que solo devuelve ids para los consumidores existentes como una API de planificación para diagnósticos. Las entradas del plan indican por qué se seleccionó un plugin y separan los indicios explícitos de `activation.*` del mecanismo alternativo basado en la propiedad del manifiesto:

| Motivo (de los indicios de `activation.*`) | Motivo (de la propiedad del manifiesto)                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`            | —                                                                                             |
| `activation-capability-hint`               | —                                                                                             |
| `activation-channel-hint`                  | `manifest-channel-owner` (`channels`)                                                         |
| `activation-command-hint`                  | `manifest-command-alias` (`commandAliases`)                                                   |
| `activation-provider-hint`                 | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`)  |
| `activation-route-hint`                    | —                                                                                             |
| — (el desencadenador de hook no tiene una variante de indicio) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`) |

Esa separación de motivos es el límite de compatibilidad: los metadatos existentes de plugins siguen funcionando, mientras que el código nuevo puede detectar indicios amplios o comportamientos alternativos sin cambiar la semántica de carga en tiempo de ejecución.

Las precargas en tiempo de ejecución realizadas durante una solicitud que piden el ámbito amplio `all` siguen derivando un conjunto explícito y efectivo de ids de plugins a partir de la configuración, la planificación de inicio, los canales configurados, las ranuras y las reglas de habilitación automática (`resolveEffectivePluginIds` en `src/plugins/effective-plugin-ids.ts`). Si ese conjunto derivado está vacío, OpenClaw mantiene el ámbito vacío en lugar de ampliarlo a todos los plugins detectables.

El descubrimiento de la configuración prefiere ids propiedad de descriptores, como `setup.providers` y `setup.cliBackends`, para restringir los plugins candidatos antes de recurrir a `setup-api` en el caso de plugins que aún necesitan hooks de tiempo de ejecución durante la configuración. Las listas de configuración de proveedores utilizan `providerAuthChoices` del manifiesto, las opciones de configuración derivadas de descriptores y los metadatos del catálogo de instalación sin cargar el tiempo de ejecución del proveedor. Un valor explícito `setup.requiresRuntime: false` establece un límite exclusivo de descriptores; si se omite `requiresRuntime`, se mantiene el mecanismo alternativo heredado de setup-api por compatibilidad. Si más de un plugin descubierto reclama el mismo id normalizado de proveedor de configuración o de backend de CLI, la búsqueda de configuración rechaza al propietario ambiguo en lugar de depender del orden de descubrimiento. Cuando se ejecuta el tiempo de ejecución de configuración, los diagnósticos del registro informan de las divergencias entre `setup.providers` / `setup.cliBackends` y los proveedores o backends de CLI registrados realmente por setup-api, sin bloquear los plugins heredados.

### Límite de caché de plugins

OpenClaw no almacena en caché los resultados del descubrimiento de plugins ni los datos directos del registro de manifiestos mediante ventanas temporales. Las instalaciones, las modificaciones de manifiestos y los cambios en las rutas de carga deben ser visibles en la siguiente lectura explícita de metadatos o reconstrucción de una instantánea. El analizador de archivos de manifiesto mantiene una caché limitada de firmas de archivos cuya clave se compone de la ruta del manifiesto abierto, el dispositivo/inodo, el tamaño y mtime/ctime; esa caché solo evita volver a analizar bytes sin cambios y no debe almacenar en caché respuestas de descubrimiento, registro, propiedad ni políticas.

La ruta rápida segura para los metadatos se basa en la propiedad explícita de objetos, no en una caché oculta. Las rutas críticas de inicio del Gateway deben pasar el `PluginMetadataSnapshot` actual, la `PluginLookUpTable` derivada o un registro de manifiestos explícito a través de la cadena de llamadas. La validación de la configuración, la habilitación automática al inicio, el arranque de plugins y la selección de proveedores pueden reutilizar esos objetos mientras representen la configuración y el inventario de plugins actuales. La búsqueda de configuración sigue reconstruyendo los metadatos del manifiesto a petición, salvo que la ruta de configuración específica reciba un registro de manifiestos explícito; se debe mantener como mecanismo alternativo para rutas no críticas en lugar de añadir cachés de búsqueda ocultas. Cuando cambie la entrada, se debe reconstruir y sustituir la instantánea en vez de modificarla o conservar copias históricas. Las vistas del registro de plugins activo y los auxiliares de arranque de canales integrados deben volver a calcularse a partir del registro o la raíz actuales. Los mapas de corta duración son aceptables dentro de una llamada para eliminar trabajo duplicado o impedir la reentrada; no deben convertirse en cachés de metadatos del proceso.

Para la carga de plugins, la capa de caché persistente corresponde a la carga en tiempo de ejecución. Puede reutilizar el estado del cargador cuando se cargan realmente código o artefactos instalados, por ejemplo:

- `PluginLoaderCacheState` y registros compatibles de tiempos de ejecución activos
- cachés de jiti/módulos y cachés de cargadores de superficies públicas utilizadas para evitar importar repetidamente la misma superficie de tiempo de ejecución
- cachés del sistema de archivos para artefactos de plugins instalados
- mapas por llamada de corta duración para normalizar rutas o resolver duplicados

Esas cachés son detalles de implementación del plano de datos. No deben responder preguntas del plano de control, como "¿qué plugin es propietario de este proveedor?", salvo que el consumidor haya solicitado deliberadamente la carga en tiempo de ejecución.

No añada cachés persistentes ni temporales para:

- resultados del descubrimiento
- registros directos de manifiestos
- registros de manifiestos reconstruidos a partir del índice de plugins instalados
- búsqueda del propietario de un proveedor, supresión de modelos, políticas de proveedores o metadatos de artefactos públicos
- cualquier otra respuesta derivada de manifiestos en la que un cambio en el manifiesto, el índice instalado o la ruta de carga deba ser visible en la siguiente lectura de metadatos

Los consumidores que reconstruyen los metadatos de los manifiestos a partir del índice persistente de plugins instalados reconstruyen ese registro a petición. El índice instalado es un estado duradero del plano de origen; no es una caché oculta de metadatos en el proceso.

## Modelo de registro

Los plugins cargados no modifican directamente variables globales arbitrarias del núcleo. Se registran en un registro central de plugins (`PluginRegistry` en `src/plugins/registry-types.ts`), que controla los registros de plugins (identidad, fuente, origen, estado y diagnósticos), además de matrices para cada capacidad: herramientas, hooks heredados y hooks tipados, canales, proveedores, controladores RPC del Gateway, rutas HTTP, registradores de CLI, servicios en segundo plano, comandos propiedad de plugins y muchas más familias tipadas de proveedores (voz, embeddings, generación de imágenes/vídeo/música, obtención/búsqueda web, arneses de agentes, acciones de sesión, etc.).

A continuación, las funciones del núcleo leen de ese registro en lugar de comunicarse directamente con los módulos de plugins. Esto mantiene la carga en una sola dirección:

- módulo de plugin -> registro en el registro
- tiempo de ejecución del núcleo -> consumo del registro

Esta separación es importante para el mantenimiento. Significa que la mayoría de las superficies del núcleo solo necesitan un punto de integración: "leer el registro", en lugar de "tratar de forma especial cada módulo de plugin".

## Callbacks de vinculación de conversaciones

Los plugins que vinculan una conversación pueden reaccionar cuando se resuelve una aprobación.

Utilice `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de vinculación se apruebe o rechace:

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

      // La solicitud se rechazó; borra cualquier estado local pendiente.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos de la carga útil del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: la vinculación resuelta para solicitudes aprobadas
- `request`: el resumen de la solicitud original, la indicación de desvinculación, el id del remitente y los metadatos de la conversación

Este callback solo sirve como notificación. No cambia quién puede vincular una conversación y se ejecuta después de que finalice la gestión de aprobación del núcleo.

## Hooks de tiempo de ejecución de proveedores

Los plugins de proveedores tienen tres capas:

- **Metadatos del manifiesto** para una búsqueda económica antes del tiempo de ejecución:
  `setup.providers[].envVars`, el campo de compatibilidad obsoleto `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks durante la configuración**: `catalog` (`discovery` heredado), además de
  `applyConfigDefaults`.
- **Hooks de tiempo de ejecución**: más de 40 hooks opcionales que abarcan autenticación, resolución de modelos,
  envoltura de flujos, niveles de razonamiento, políticas de reproducción y endpoints de uso. Consulte
  [Orden y uso de los hooks](#hook-order-and-usage).

OpenClaw sigue siendo responsable del bucle genérico del agente, la conmutación por error, la gestión de transcripciones y las políticas de herramientas. Estos hooks son la superficie de extensión para comportamientos específicos de proveedores sin necesidad de implementar un transporte de inferencia personalizado completo.

Use `setup.providers[].envVars` del manifiesto cuando el proveedor tenga
credenciales basadas en variables de entorno que las rutas genéricas de
autenticación/estado/selector de modelos deban ver sin cargar el runtime del
Plugin. El campo obsoleto `providerAuthEnvVars` aún es leído por el adaptador de
compatibilidad durante el período de desuso, y los plugins no incluidos que lo
usan reciben un diagnóstico del manifiesto. Use `providerAuthAliases` del
manifiesto cuando un id de proveedor deba reutilizar las variables de entorno,
los perfiles de autenticación, la autenticación respaldada por la configuración
y la opción de incorporación mediante clave de API de otro id de proveedor. Use
`providerAuthChoices` del manifiesto cuando las superficies de CLI para la
incorporación o la elección de autenticación deban conocer el id de opción del
proveedor, las etiquetas de grupo y la configuración sencilla de la
autenticación mediante una sola opción, sin cargar el runtime del proveedor.
Mantenga `envVars` del runtime del proveedor para indicaciones dirigidas al
operador, como las etiquetas de incorporación o las variables de configuración
del id y el secreto de cliente de OAuth.

Use `channelEnvVars` del manifiesto cuando un canal tenga autenticación o
configuración basada en variables de entorno que el mecanismo alternativo
genérico de variables de entorno del shell, las comprobaciones de
configuración/estado o las solicitudes de configuración deban ver sin cargar el
runtime del canal.

### Orden y uso de los hooks

Para los plugins de modelos/proveedores, OpenClaw llama a los hooks
aproximadamente en este orden. La columna "Cuándo usarlo" es la guía rápida para
tomar decisiones. Los campos de proveedor exclusivos de compatibilidad que
OpenClaw ya no llama, como `ProviderPlugin.capabilities` y
`suppressBuiltInModel`, se omiten aquí intencionadamente.

| Hook                              | Qué hace                                                                                                                        | Cuándo usarlo                                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`                            | El proveedor posee un catálogo o valores predeterminados de URL base                                                                                                       |
| `applyConfigDefaults`             | Aplica valores predeterminados de configuración global propios del proveedor durante la materialización de la configuración    | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de la familia de modelos del proveedor                                           |
| _(búsqueda de modelos integrada)_ | OpenClaw prueba primero la ruta normal del registro o catálogo                                                                  | _(no es un hook de Plugin)_                                                                                                                                                |
| `normalizeModelId`                | Normaliza alias heredados o preliminares de identificadores de modelo antes de la búsqueda                                      | El proveedor se encarga de depurar los alias antes de la resolución canónica del modelo                                                                                    |
| `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo                                | El proveedor se encarga de depurar el transporte para identificadores de proveedor personalizados de la misma familia de transporte                                        |
| `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución del entorno de ejecución o del proveedor                               | El proveedor necesita depurar la configuración en el plugin; los auxiliares incluidos de la familia de Google también respaldan las entradas de configuración compatibles |
| `applyNativeStreamingUsageCompat` | Aplica a los proveedores de configuración reescrituras de compatibilidad con el uso de streaming nativo                        | El proveedor necesita corregir metadatos de uso de streaming nativo determinados por el endpoint                                                                           |
| `resolveConfigApiKey`             | Resuelve la autenticación mediante marcadores de entorno para los proveedores de configuración antes de cargarla en ejecución  | Los proveedores exponen sus propios hooks de resolución de claves de API mediante marcadores de entorno                                                                    |
| `resolveSyntheticAuth`            | Expone autenticación local, autoalojada o respaldada por configuración sin conservar texto sin cifrar                           | El proveedor puede operar con un marcador de credencial sintética o local                                                                                                  |
| `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externos propios del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales de la CLI o de la aplicación | El proveedor reutiliza credenciales de autenticación externas sin conservar tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto   |
| `shouldDeferSyntheticProfileAuth` | Reduce la prioridad de los marcadores de posición de perfiles sintéticos almacenados frente a la autenticación respaldada por el entorno o la configuración | El proveedor almacena perfiles sintéticos de marcador de posición que no deben tener precedencia                                                                           |
| `resolveDynamicModel`             | Alternativa síncrona para identificadores de modelo propios del proveedor que aún no están en el registro local                 | El proveedor acepta identificadores arbitrarios de modelos del servicio ascendente                                                                                         |
| `prepareDynamicModel`             | Realiza una preparación asíncrona y luego vuelve a ejecutar `resolveDynamicModel`                                                | El proveedor necesita metadatos de red antes de resolver identificadores desconocidos                                                                                       |
| `normalizeResolvedModel`          | Realiza la reescritura final antes de que el ejecutor integrado use el modelo resuelto                                           | El proveedor necesita reescrituras de transporte, pero sigue usando un transporte del núcleo                                                                                |
| `normalizeToolSchemas`            | Normaliza los esquemas de herramientas antes de que el ejecutor integrado los reciba                                            | El proveedor necesita depurar los esquemas de la familia de transporte                                                                                                      |
| `inspectToolSchemas`              | Expone diagnósticos de esquemas propios del proveedor después de la normalización                                                | El proveedor quiere advertencias sobre palabras clave sin añadir reglas específicas del proveedor al núcleo                                                                |
| `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo o etiquetado                                                            | El proveedor necesita una salida final o de razonamiento etiquetada en lugar de campos nativos                                                                              |
| `prepareExtraParams`              | Normaliza los parámetros de solicitud antes de los envoltorios genéricos de opciones de streaming                              | El proveedor necesita parámetros de solicitud predeterminados o depuración de parámetros específica del proveedor                                                          |
| `createStreamFn`                  | Reemplaza por completo la ruta normal de streaming con un transporte personalizado                                              | El proveedor necesita un protocolo de transmisión personalizado, no solo un envoltorio                                                                                      |
| `wrapStreamFn`                    | Aplica un envoltorio de streaming después de los envoltorios genéricos                                                          | El proveedor necesita envoltorios de compatibilidad para encabezados, cuerpo o modelo de la solicitud sin un transporte personalizado                                       |
| `resolveTransportTurnState`       | Adjunta encabezados o metadatos de transporte nativos para cada turno                                                           | El proveedor quiere que los transportes genéricos envíen una identidad de turno nativa del proveedor                                                                        |
| `resolveWebSocketSessionPolicy`   | Adjunta encabezados WebSocket nativos o una política de espera de sesión                                                        | El proveedor quiere que los transportes WS genéricos ajusten los encabezados de sesión o la política de alternativa                                                         |
| `formatApiKey`                    | Formateador de perfiles de autenticación: el perfil almacenado se convierte en la cadena `apiKey` del entorno de ejecución      | El proveedor almacena metadatos de autenticación adicionales y necesita una forma de token personalizada durante la ejecución                                               |
| `refreshOAuth`                    | Sustituye la actualización de OAuth para endpoints de actualización personalizados o políticas ante errores de actualización   | El proveedor no se ajusta a los actualizadores compartidos de OpenClaw                                                                                                      |
| `buildAuthDoctorHint`             | Añade una sugerencia de reparación cuando falla la actualización de OAuth                                                       | El proveedor necesita orientación propia para reparar la autenticación después de un error de actualización                                                                 |
| `matchesContextOverflowError`     | Detector propio del proveedor para desbordamientos de la ventana de contexto                                                    | El proveedor genera errores de desbordamiento sin procesar que las heurísticas genéricas no detectarían                                                                     |
| `classifyFailoverReason`          | Clasifica el motivo de conmutación por error según el proveedor                                                                 | El proveedor puede asignar errores sin procesar de API o transporte a límites de frecuencia, sobrecarga, etc.                                                               |
| `isCacheTtlEligible`              | Política de caché de prompts para proveedores de proxy o red de retorno                                                         | El proveedor necesita aplicar restricciones de TTL de caché específicas del proxy                                                                                           |
| `buildMissingAuthMessage`         | Reemplaza el mensaje genérico de recuperación por falta de autenticación                                                        | El proveedor necesita una sugerencia de recuperación por falta de autenticación específica del proveedor                                                                   |
| `augmentModelCatalog`             | Añade filas sintéticas o finales al catálogo después de la detección (obsoleto; véase más adelante)                             | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y los selectores                                                                           |
| `resolveThinkingProfile`          | Define el conjunto de niveles de `/think`, las etiquetas visibles y el valor predeterminado específicos del modelo             | El proveedor expone una escala de pensamiento personalizada o una etiqueta binaria para los modelos seleccionados                                                           |
| `isBinaryThinking`                | Hook de compatibilidad para activar o desactivar el razonamiento                                                                | El proveedor solo permite activar o desactivar el pensamiento binario                                                                                                       |
| `supportsXHighThinking`           | Hook de compatibilidad con el razonamiento `xhigh`                                                                              | El proveedor quiere habilitar `xhigh` solo en un subconjunto de modelos                                                                                                      |
| `resolveDefaultThinkingLevel`     | Hook de compatibilidad con el nivel predeterminado de `/think`                                                                  | El proveedor define la política predeterminada de `/think` para una familia de modelos                                                                                       |
| `isModernModelRef`                | Detector de modelos modernos para filtros de perfiles activos y selección de pruebas de humo                                   | El proveedor define la coincidencia de modelos preferidos para pruebas activas o de humo                                                                                    |
| `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token o la clave reales de ejecución justo antes de la inferencia                 | El proveedor necesita un intercambio de tokens o una credencial de solicitud de corta duración                                                                              |
| `resolveUsageAuth`                | Resuelve las credenciales de uso o facturación para `/usage` y superficies de estado relacionadas                             | El proveedor necesita analizar de forma personalizada tokens de uso o cuota, o usar una credencial de uso diferente                                                         |
| `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas de uso o cuota específicas del proveedor después de resolver la autenticación                 | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de la carga útil                                                                          |
| `createEmbeddingProvider`         | Crear un adaptador de embeddings administrado por el proveedor para memoria/búsqueda                           | El comportamiento de los embeddings de memoria corresponde al Plugin del proveedor                                                            |
| `buildReplayPolicy`               | Devolver una política de reproducción que controle el tratamiento de la transcripción para el proveedor        | El proveedor necesita una política de transcripción personalizada (por ejemplo, eliminar bloques de razonamiento)                              |
| `sanitizeReplayHistory`           | Reescribir el historial de reproducción tras la limpieza genérica de la transcripción                          | El proveedor necesita reescrituras de reproducción específicas, además de los auxiliares compartidos de Compaction                             |
| `validateReplayTurns`             | Realizar la validación o reestructuración final de los turnos de reproducción antes del ejecutor integrado     | El transporte del proveedor necesita una validación de turnos más estricta después del saneamiento genérico                                    |
| `onModelSelected`                 | Ejecutar efectos secundarios posteriores a la selección administrados por el proveedor                         | El proveedor necesita telemetría o estado administrado por él cuando se activa un modelo                                                       |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` comprueban primero el
plugin de proveedor coincidente y luego continúan con otros plugins de proveedor
que admiten hooks hasta que alguno modifica realmente el id del modelo o el
transporte/la configuración. Esto permite que los adaptadores de
alias/compatibilidad de proveedores sigan funcionando sin exigir que el
invocador sepa qué plugin incluido es responsable de la reescritura. Si ningún
hook de proveedor reescribe una entrada de configuración compatible de la
familia Google, el normalizador incluido de configuración de Google sigue
aplicando esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de comunicación completamente
personalizado o un ejecutor de solicitudes personalizado, se trata de una clase
de extensión diferente. Estos hooks están destinados al comportamiento de
proveedores que sigue ejecutándose en el bucle de inferencia normal de OpenClaw.

`resolveUsageAuth` decide si OpenClaw debe llamar a `fetchUsageSnapshot` o
recurrir a la resolución genérica de credenciales para las superficies de
uso/estado. Devuelva `{ token, accountId?, subscriptionType?, rateLimitTier? }`
cuando el proveedor tenga una credencial de uso (los metadatos opcionales del
plan se transfieren a `fetchUsageSnapshot`), devuelva
`{ handled: true }` cuando la autenticación de uso gestionada por el proveedor
haya procesado la solicitud y deba impedir el mecanismo alternativo genérico de
clave de API/OAuth, y devuelva `null` o `undefined` cuando el proveedor no haya
gestionado la autenticación de uso.

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
de cada proveedor. El conjunto de hooks autoritativo reside con cada plugin en
`extensions/`; esta página ilustra las estructuras en lugar de reproducir la
lista.

<AccordionGroup>
  <Accordion title="Proveedores de catálogo de paso directo">
    OpenRouter, Kilocode, Z.AI y xAI registran `catalog` junto con
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer los ids de
    modelos ascendentes antes que el catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Proveedores de OAuth y endpoints de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi y z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para gestionar el intercambio de tokens y la
    integración con `/usage`.
  </Accordion>
  <Accordion title="Familias de reproducción y limpieza de transcripciones">
    Las familias compartidas con nombre (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los
    proveedores adopten la política de transcripciones mediante
    `buildReplayPolicy`, en lugar de que cada plugin vuelva a implementar la
    limpieza.
  </Accordion>
  <Accordion title="Proveedores solo de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` solo registran `catalog` y utilizan el bucle de inferencia
    compartido.
  </Accordion>
  <Accordion title="Auxiliares de flujo específicos de Anthropic">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` residen en el
    límite público `api.ts` / `contract-api.ts` del plugin de Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), en lugar de
    estar en el SDK genérico.
  </Accordion>
</AccordionGroup>

## Auxiliares de tiempo de ejecución

Los plugins pueden acceder a auxiliares seleccionados del núcleo mediante
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

- `textToSpeech` devuelve la carga útil normal de salida de TTS del núcleo para superficies de archivos/notas de voz.
- Utiliza la configuración `messages.tts` del núcleo y la selección de proveedor.
- Devuelve un búfer de audio PCM y la frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional para cada proveedor. Úselo para selectores de voz o flujos de configuración gestionados por el proveedor.
- El núcleo pasa una fecha límite de solicitud resuelta a los hooks `listVoices` del proveedor; la configuración de tiempo de espera específica del proveedor puede sustituirla.
- Las listas de voces pueden incluir metadatos más completos, como configuración regional, género y etiquetas de personalidad, para selectores adaptados al proveedor.
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

- Mantenga la política de TTS, el mecanismo alternativo y la entrega de respuestas en el núcleo.
- Utilice proveedores de voz para el comportamiento de síntesis gestionado por el proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido se orienta a la empresa: un plugin de proveedor puede gestionar proveedores de texto, voz, imagen y medios futuros a medida que OpenClaw incorpore esos contratos de capacidades.

Para la comprensión de imágenes/audio/vídeo, los plugins registran un proveedor
tipado de comprensión multimedia en lugar de una colección genérica de
clave/valor:

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

- Mantenga la orquestación, el mecanismo alternativo, la configuración y la conexión de canales en el núcleo.
- Mantenga el comportamiento del proveedor en su plugin.
- La ampliación aditiva debe seguir siendo tipada: nuevos métodos opcionales, nuevos campos de resultado opcionales y nuevas capacidades opcionales.
- La generación de vídeo ya sigue el mismo patrón:
  - el núcleo gestiona el contrato de capacidades y el auxiliar de tiempo de ejecución
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de funciones/canales consumen `api.runtime.videoGeneration.*`

Para los auxiliares de tiempo de ejecución de comprensión multimedia, los
plugins pueden llamar a:

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
ejecución de comprensión multimedia o el alias de STT anterior:

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
- `extractStructuredWithModel(...)` es el límite orientado a plugins para la
  extracción acotada gestionada por el proveedor y centrada primero en
  imágenes. Incluya al menos una entrada de imagen; las entradas de texto son
  contexto complementario. Los plugins de producto gestionan sus rutas y
  esquemas, mientras que OpenClaw gestiona el límite entre proveedor y tiempo
  de ejecución.
- Utiliza la configuración de audio de comprensión multimedia del núcleo (`tools.media.audio`) y el orden de mecanismos alternativos de proveedores.
- Devuelve `{ text: undefined }` cuando no se genera ninguna salida de transcripción (por ejemplo, si la entrada se omite o no es compatible).
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

- `provider` y `model` son sustituciones opcionales por ejecución, no cambios persistentes en la sesión.
- OpenClaw solo respeta esos campos de sustitución para invocadores de confianza.
- Para las ejecuciones con mecanismo alternativo gestionadas por plugins, los operadores deben habilitarlas explícitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilice `plugins.entries.<id>.subagent.allowedModels` para restringir los plugins de confianza a destinos canónicos `provider/model` específicos, o `"*"` para permitir explícitamente cualquier destino.
- Las ejecuciones de subagentes de plugins que no sean de confianza siguen funcionando, pero las solicitudes de sustitución se rechazan en lugar de recurrir silenciosamente al mecanismo alternativo.
- Las sesiones de subagentes creadas por plugins se etiquetan con el id del plugin creador. El mecanismo alternativo `api.runtime.subagent.deleteSession(...)` solo puede eliminar esas sesiones propias; la eliminación arbitraria de sesiones sigue requiriendo una solicitud al Gateway con ámbito de administrador.

Para la búsqueda web, los plugins pueden consumir el auxiliar compartido de
tiempo de ejecución en lugar de acceder directamente a la conexión de
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

- Mantenga la selección de proveedores, la resolución de credenciales y la semántica compartida de las solicitudes en el núcleo.
- Utilice proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
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
- `listProviders(...)`: muestra los proveedores disponibles de generación de imágenes y sus capacidades.

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
- `auth`: obligatorio, `"gateway"` o `"plugin"`. Use `"gateway"` para exigir la autenticación normal del Gateway, o `"plugin"` para la autenticación o verificación de webhooks gestionada por el plugin.
- `match`: opcional. `"exact"` (valor predeterminado) o `"prefix"`.
- `handleUpgrade`: controlador opcional para solicitudes de actualización de WebSocket en la misma ruta.
- `replaceExisting`: opcional. Permite que el mismo plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta haya gestionado la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error al cargar el plugin. Use `api.registerHttpRoute(...)` en su lugar.
- Las rutas de plugins deben declarar `auth` explícitamente.
- Los conflictos con la misma combinación de `path + match` se rechazan a menos que se establezca `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Las rutas superpuestas con diferentes niveles de `auth` se rechazan. Mantenga las cadenas de continuación `exact`/`prefix` únicamente en el mismo nivel de autenticación.
- Las rutas con `auth: "plugin"` **no** reciben automáticamente ámbitos de tiempo de ejecución del operador. Están destinadas a webhooks o a la verificación de firmas gestionados por el plugin, no a llamadas privilegiadas a funciones auxiliares del Gateway.
- Las rutas con `auth: "gateway"` se ejecutan dentro de un ámbito de tiempo de ejecución de solicitudes del Gateway. La superficie predeterminada (`gatewayRuntimeScopeSurface: "write-default"`) es deliberadamente conservadora:
  - la autenticación de portador con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) y cualquier método de autenticación que no sea de proxy de confianza reciben un único ámbito `operator.write`, incluso si el llamante envía `x-openclaw-scopes`
  - los llamantes de `trusted-proxy` sin una cabecera `x-openclaw-scopes` explícita también conservan la superficie heredada limitada a `operator.write`
  - los llamantes de `trusted-proxy` que sí envían `x-openclaw-scopes` reciben en su lugar los ámbitos declarados
  - una ruta puede optar por `gatewayRuntimeScopeSurface: "trusted-operator"` para respetar siempre `x-openclaw-scopes` en los modos de autenticación que incluyen identidad (y recurrir al conjunto completo de ámbitos predeterminado de la CLI cuando la cabecera no está presente)
- Regla práctica: no suponga que una ruta de plugin autenticada mediante el Gateway es una superficie de administración implícita. Si la ruta necesita un comportamiento exclusivo para administradores, opte por la superficie de ámbitos `trusted-operator`, exija un modo de autenticación que incluya identidad y documente el contrato explícito de la cabecera `x-openclaw-scopes`.
- Después de hacer coincidir la ruta y autenticar, los controladores ordinarios participan en la admisión de trabajo raíz del Gateway. Un Gateway preparado o reiniciándose devuelve `503` antes de invocar al controlador. La única excepción limitada es una ruta con `auth: "gateway"` autorizada por el manifiesto que también opte por la superficie `trusted-operator` específica de la ruta; permanece accesible para que el envío del control de suspensión no quede bloqueado, mientras que las rutas hermanas ordinarias del mismo plugin permanecen detrás del límite de admisión. La propiedad de `handleUpgrade` de WebSocket usa el mismo límite de admisión atómico; una vez que el controlador acepta un socket, el ciclo de vida posterior de este queda bajo la responsabilidad del plugin y este límite no lo supervisa.

## Rutas de importación del SDK de plugins

Use subrutas específicas del SDK en lugar del barrel raíz monolítico `openclaw/plugin-sdk`
al crear plugins nuevos. Subrutas principales:

| Subruta                             | Propósito                                           |
| ----------------------------------- | --------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de plugins                   |
| `openclaw/plugin-sdk/channel-core`  | Funciones auxiliares de entrada/compilación de canales |
| `openclaw/plugin-sdk/core`          | Funciones auxiliares genéricas compartidas y contrato general |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los plugins de canal eligen entre una familia de interfaces específicas: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un único contrato `approvalCapability`, en lugar de combinar varios
campos de plugin no relacionados. Consulte [Plugins de canal](/es/plugins/sdk-channel-plugins).

Las funciones auxiliares de tiempo de ejecución y configuración se encuentran en las subrutas específicas `*-runtime`
correspondientes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefiera `config-contracts`,
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

- `index.js` — punto de entrada del plugin incluido
- `api.js` — barrel de funciones auxiliares/tipos
- `runtime-api.js` — barrel exclusivo de tiempo de ejecución
- `setup-entry.js` — punto de entrada del plugin de configuración

Los plugins externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importe `src/*` del paquete de otro plugin desde el núcleo ni desde otro plugin.
Los puntos de entrada cargados mediante fachada prefieren la instantánea activa de la configuración de tiempo de ejecución cuando
existe; de lo contrario, recurren al archivo de configuración resuelto en el disco.

Existen subrutas específicas de capacidades, como `image-generation`, `media-understanding`
y `speech`, porque los plugins incluidos las usan actualmente. No son
automáticamente contratos externos inmutables a largo plazo; consulte la página de referencia del SDK
correspondiente cuando dependa de ellas.

## Esquemas de la herramienta de mensajes

Los plugins deben ser responsables de las contribuciones específicas del canal al esquema
`describeMessageTool(...)` para primitivas distintas de los mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envíos debe usar el contrato genérico `MessagePresentation`
en lugar de campos de botones, componentes, bloques o tarjetas nativos del proveedor.
Consulte [Presentación de mensajes](/es/plugins/message-presentation) para conocer el contrato,
las reglas de degradación, la asignación de proveedores y la lista de comprobación para autores de plugins.

Los plugins con capacidad de envío declaran qué pueden representar mediante las capacidades de mensajes:

- `presentation` para bloques de presentación semánticos (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El núcleo decide si representa la presentación de forma nativa o la degrada a texto.
No exponga mecanismos de escape de la interfaz de usuario nativa del proveedor desde la herramienta genérica de mensajes.
Las funciones auxiliares obsoletas del SDK para esquemas nativos heredados siguen exportándose para los plugins
de terceros existentes, pero los plugins nuevos no deben usarlas.

## Resolución de destinos de canal

Los plugins de canal deben ser responsables de la semántica de destinos específica del canal. Mantenga genérico el
host de salida compartido y use la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al núcleo si una
  entrada debe pasar directamente a la resolución similar a un identificador en lugar de buscar en el directorio.
- `messaging.targetResolver.reservedLiterals` enumera palabras sin formato que son
  referencias de canal/sesión para ese proveedor. La resolución conserva las entradas
  configuradas del directorio antes de rechazar los literales reservados y, después, se cierra de forma segura si
  no hay coincidencias en el directorio.
- `messaging.targetResolver.resolveTarget(...)` es el mecanismo alternativo del plugin cuando
  el núcleo necesita una resolución final gestionada por el proveedor después de la normalización o de
  no encontrar coincidencias en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` es responsable de construir la ruta de sesión
  específica del proveedor una vez resuelto el destino.

División recomendada:

- Use `inferTargetChatType` para decisiones de categoría que deban tomarse antes de
  buscar pares/grupos.
- Use `looksLikeId` para comprobaciones del tipo «tratar esto como un identificador de destino explícito/nativo».
- Use `resolveTarget` como mecanismo alternativo de normalización específico del proveedor, no para
  búsquedas generales en el directorio.
- Mantenga los identificadores nativos del proveedor, como identificadores de chat, identificadores de hilos, JID, identificadores de usuario e identificadores de salas,
  dentro de los valores `target` o de los parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por la configuración

Los plugins que obtienen entradas del directorio a partir de la configuración deben mantener esa lógica en el
plugin y reutilizar las funciones auxiliares compartidas de
`openclaw/plugin-sdk/directory-runtime`.

Úselo cuando un canal necesite pares/grupos respaldados por la configuración, como:

- pares de mensajes directos controlados por una lista de permitidos
- mapas de canales/grupos configurados
- mecanismos alternativos de directorio estático limitados a una cuenta

Las funciones auxiliares compartidas de `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- funciones auxiliares de desduplicación/normalización
- creación de `ChannelDirectoryEntry[]`

La inspección de cuentas y la normalización de identificadores específicas del canal deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedores pueden definir catálogos de modelos para inferencia mediante
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma estructura que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedores

Use `catalog` cuando el plugin sea responsable de identificadores de modelos específicos del proveedor, valores predeterminados de URL base
o metadatos de modelos restringidos por autenticación.

`catalog.order` controla cuándo se combina el catálogo de un plugin con relación a los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores sencillos basados en claves de API o variables de entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedores relacionadas
- `late`: última pasada, después de los demás proveedores implícitos

Los proveedores posteriores prevalecen si hay una colisión de claves, por lo que los plugins pueden sustituir intencionadamente una
entrada de proveedor integrada con el mismo identificador de proveedor.

Los plugins también pueden publicar filas de modelos de solo lectura mediante
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Esta es la vía recomendada para las superficies de lista/ayuda/selector y admite
filas `text`, `voice`, `image_generation`, `video_generation` y `music_generation`.
Los plugins de proveedores siguen siendo responsables de las llamadas en vivo a puntos de conexión, el intercambio de tokens y la
asignación de respuestas del proveedor; el núcleo es responsable de la estructura común de las filas, las etiquetas de origen y el
formato de la ayuda de herramientas multimedia. Los registros de proveedores de generación multimedia sintetizan
automáticamente filas de catálogo estáticas a partir de `defaultModel`, `models` y
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

- `resolveAccount(...)` es la ruta de tiempo de ejecución. Puede suponer que las credenciales
  están completamente materializadas y puede fallar de inmediato cuando faltan secretos obligatorios.
- Las rutas de comandos de solo lectura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, y los flujos de reparación de doctor/configuración
  no deberían necesitar materializar credenciales de tiempo de ejecución solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve únicamente el estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye los campos de origen/estado de las credenciales cuando corresponda, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No es necesario devolver los valores sin procesar de los tokens solo para informar de la
  disponibilidad de solo lectura. Devolver `tokenStatus: "available"` (y el campo
  de origen correspondiente) es suficiente para los comandos de estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef,
  pero no esté disponible en la ruta del comando actual.

Esto permite que los comandos de solo lectura indiquen «configurada, pero no disponible en esta
ruta de comando» en lugar de fallar o informar erróneamente que la cuenta no está configurada.

## Paquetes de paquetes

Un directorio de Plugin puede incluir un archivo `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entrada se convierte en un Plugin. Si el paquete enumera varias extensiones, el id.
del Plugin pasa a ser `<manifestOrPackageName>/<fileBase>` (el id. del manifiesto prevalece cuando
está presente; de lo contrario, se usa el nombre sin ámbito de `package.json`).

Si el Plugin importa dependencias de npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Medida de seguridad: cada entrada de `openclaw.extensions` debe permanecer dentro del directorio
del Plugin después de resolver los enlaces simbólicos. Se rechazan las entradas que salen del directorio del paquete.

Nota de seguridad: `openclaw plugins install` instala las dependencias del Plugin con una
ejecución de `npm install --omit=dev --ignore-scripts` local al proyecto (sin scripts de ciclo de vida
ni dependencias de desarrollo en tiempo de ejecución), ignorando la configuración global heredada de instalación de npm.
Mantén los árboles de dependencias del Plugin como «JS/TS puro» y evita paquetes que requieran
compilaciones mediante `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero exclusivo para la configuración.
Cuando OpenClaw necesita superficies de configuración para un Plugin de canal deshabilitado, o
cuando un Plugin de canal está habilitado pero aún no está configurado, carga `setupEntry`
en lugar de la entrada completa del Plugin. Esto aligera el inicio y la configuración
cuando la entrada principal del Plugin también conecta herramientas, hooks u otro código
exclusivo del tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
permite que un Plugin de canal utilice la misma ruta de `setupEntry` durante la fase de inicio
del Gateway anterior a la escucha, incluso cuando el canal ya está configurado.

Usa esta opción únicamente cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que el Gateway comience a escuchar. En la práctica, esto significa que la entrada de configuración
debe registrar todas las capacidades propiedad del canal de las que depende el inicio, como:

- el propio registro del canal
- todas las rutas HTTP que deban estar disponibles antes de que el Gateway comience a escuchar
- todos los métodos, herramientas o servicios del Gateway que deban existir durante ese mismo intervalo

Si la entrada completa sigue siendo propietaria de alguna capacidad de inicio necesaria, no habilites
esta marca. Mantén el comportamiento predeterminado del Plugin y permite que OpenClaw cargue la
entrada completa durante el inicio.

Los canales incluidos también pueden publicar auxiliares de superficie de contrato exclusivos para la configuración que el núcleo
puede consultar antes de cargar el entorno de ejecución completo del canal. La superficie actual
de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover la configuración heredada de un canal de una sola cuenta
a `channels.<id>.accounts.*` sin cargar la entrada completa del Plugin.
Matrix es el ejemplo incluido actual: solo mueve las claves de autenticación/inicialización a una
cuenta promocionada con nombre cuando ya existen cuentas con nombre, y puede conservar una
clave configurada no canónica de la cuenta predeterminada en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parches de configuración mantienen diferido el descubrimiento de la superficie de contrato incluida. El tiempo
de importación se mantiene ligero; la superficie de promoción solo se carga con el primer uso, en lugar de
volver a entrar en el inicio del canal incluido al importar el módulo.

Cuando esas superficies de inicio incluyan métodos RPC del Gateway, mantenlos bajo un
prefijo específico del Plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven
como `operator.admin`, incluso si un Plugin solicita un ámbito más limitado.

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

Campos útiles de `openclaw.channel`, además del ejemplo mínimo:

- `detailLabel`: etiqueta secundaria para superficies de catálogo/estado más completas
- `docsLabel`: reemplaza el texto del enlace a la documentación
- `preferOver`: id. de Plugins/canales de menor prioridad a los que esta entrada del catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles del texto de la superficie de selección
- `markdownCapable`: marca el canal como compatible con Markdown para las decisiones de formato de salida
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para las superficies de navegación de la documentación
- `showConfigured` / `showInSetup`: alias heredados que aún se aceptan por compatibilidad; se prefiere `exposure`
- `quickstartAllowFrom`: incorpora el canal al flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: exige la vinculación explícita de la cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prioriza la búsqueda de sesión al resolver los destinos de anuncios

OpenClaw también puede combinar **catálogos externos de canales** (por ejemplo, una exportación
del registro de MPM). Coloca un archivo JSON en una de estas ubicaciones:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

También puedes hacer que `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) apunte a
uno o varios archivos JSON (delimitados por comas, puntos y coma o `PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados de la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de instalación de proveedores exponen
datos normalizados del origen de instalación junto al bloque `openclaw.install` sin procesar. Los
datos normalizados identifican si la especificación de npm es una versión exacta o un
selector flotante, si están presentes los metadatos de integridad esperados y si también
hay disponible una ruta de origen local. Cuando se conoce la identidad del catálogo/paquete, los
datos normalizados advierten si el nombre del paquete npm analizado difiere de esa identidad.
También advierten cuando `defaultChoice` no es válido o apunta a un origen que
no está disponible, y cuando hay metadatos de integridad de npm sin un origen de npm
válido. Los consumidores deben tratar `installSource` como un campo opcional aditivo para que
las entradas creadas manualmente y los adaptadores de catálogo no tengan que sintetizarlo.
Esto permite que la incorporación y los diagnósticos expliquen el estado del plano de origen sin
importar el entorno de ejecución del Plugin.

Las entradas npm externas oficiales deben preferir un `npmSpec` exacto junto con
`expectedIntegrity`. Los nombres simples de paquetes y las etiquetas de distribución siguen funcionando por
compatibilidad, pero muestran advertencias del plano de origen para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas mediante integridad sin romper los Plugins existentes.
Cuando la incorporación instala desde una ruta de catálogo local, registra una entrada administrada
del índice de Plugins con `source: "path"` y un `sourcePath` relativo al espacio de trabajo
cuando es posible. La ruta operativa absoluta de carga permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas de estaciones de trabajo locales
en la configuración persistente. Esto mantiene visibles las instalaciones de desarrollo local para
los diagnósticos del plano de origen sin añadir una segunda superficie de divulgación de rutas sin procesar
del sistema de archivos. La tabla SQLite persistente `installed_plugin_index` es la fuente
de verdad de la instalación y puede actualizarse sin cargar los módulos del entorno de ejecución del Plugin.
Su mapa `installRecords` es persistente incluso cuando falta un manifiesto de Plugin o
no es válido; su carga `plugins` es una vista reconstruible del manifiesto.

## Plugins del motor de contexto

Los Plugins del motor de contexto poseen la orquestación del contexto de sesión para la ingesta, el ensamblaje
y la Compaction. Regístralos desde el Plugin con
`api.registerContextEngine(id, factory)` y selecciona después el motor activo con
`plugins.slots.contextEngine`.

Úsalo cuando el Plugin necesite sustituir o ampliar la canalización de contexto predeterminada
en lugar de limitarse a añadir búsqueda en memoria o hooks.

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
para la inicialización en el momento de la construcción.

`assemble()` puede devolver `contextProjection` cuando el arnés activo tenga un
hilo de backend persistente. Omítelo para la proyección heredada por turno. Devuelve
`{ mode: "thread_bootstrap", epoch }` cuando el contexto ensamblado deba
inyectarse una vez en un hilo de backend y reutilizarse hasta que cambie la época. Cambia
la época después de que cambie el contexto semántico del motor, por ejemplo tras una
pasada de Compaction propiedad del motor. Los hosts pueden conservar los metadatos de llamadas
a herramientas, la forma de entrada y los resultados de herramientas censurados en una proyección
de arranque del hilo para que los hilos de backend nuevos mantengan la continuidad de las herramientas
sin copiar cargas sin procesar que contengan secretos.

Si el motor **no** es propietario del algoritmo de Compaction, mantén `compact()`
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
el sistema de plugins accediendo de forma privada a sus componentes internos. Añada la capacidad que falta.

Secuencia recomendada:

1. **Defina el contrato del núcleo.** Decida qué comportamiento compartido debe corresponder al núcleo:
   políticas, mecanismos alternativos, combinación de configuración, ciclo de vida, semántica de cara a los canales y
   estructura de los auxiliares del entorno de ejecución.
2. **Añada superficies tipadas de registro y ejecución de plugins.** Amplíe
   `OpenClawPluginApi` o `api.runtime`, o ambos, con la superficie tipada de
   capacidad útil más pequeña.
3. **Conecte el núcleo y los consumidores de canales o funcionalidades.** Los canales y los plugins de funcionalidades
   deben consumir la nueva capacidad mediante el núcleo, no importando directamente una
   implementación de un proveedor.
4. **Registre las implementaciones de proveedores.** A continuación, los plugins de proveedores registran sus
   backends para la capacidad.
5. **Añada cobertura del contrato.** Añada pruebas para que la propiedad y la estructura de registro
   sigan siendo explícitas con el tiempo.

Así es como OpenClaw mantiene un enfoque definido sin quedar codificado específicamente según la
visión de un único proveedor. Consulte el [Recetario de capacidades](/es/plugins/adding-capabilities)
para ver una lista de comprobación concreta de archivos y un ejemplo desarrollado.

### Lista de comprobación de capacidades

Cuando añada una nueva capacidad, la implementación normalmente debe abarcar conjuntamente estas
superficies:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- ejecutor o auxiliar del entorno de ejecución del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- conexión del registro de plugins en `src/plugins/registry.ts`
- exposición del entorno de ejecución de plugins en `src/plugins/runtime/*` cuando los plugins de funcionalidades o canales
  necesiten consumirla
- auxiliares de captura y pruebas en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad y contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores y plugins en `docs/`

Si falta una de esas superficies, normalmente indica que la capacidad
aún no está totalmente integrada.

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

Patrón de prueba del contrato (`src/plugins/contracts/registry.ts` expone consultas de propiedad,
como `providerContractPluginIds`; las pruebas verifican que la lista
`contracts.videoGenerationProviders` de un plugin coincida con lo que realmente registra):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Esto mantiene la regla simple:

- el núcleo posee el contrato de capacidad y la orquestación
- los plugins de proveedores poseen las implementaciones de cada proveedor
- los plugins de funcionalidades y canales consumen auxiliares del entorno de ejecución
- las pruebas de contrato mantienen explícita la propiedad

## Temas relacionados

- [Arquitectura de plugins](/es/plugins/architecture) — modelo y estructuras públicas de capacidades
- [Subrutas del SDK de plugins](/es/plugins/sdk-subpaths)
- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
