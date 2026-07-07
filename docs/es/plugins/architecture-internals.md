---
read_when:
    - Implementación de hooks de tiempo de ejecución de proveedores, ciclo de vida del canal o packs de paquetes
    - Depuración del orden de carga de plugins o del estado del registro
    - Agregar una nueva capacidad de plugin o un plugin de motor de contexto
summary: 'Aspectos internos de la arquitectura de Plugin: canalización de carga, registro, hooks de runtime, rutas HTTP y tablas de referencia'
title: Aspectos internos de la arquitectura de Plugin
x-i18n:
    generated_at: "2026-07-06T21:48:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee2b2238b7d91570cc8ebfff958553b0e1d769129060b55a76eae2e1db4f0869
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para el modelo público de capacidades, las formas de los plugins y los contratos
de propiedad/ejecución, consulta [Arquitectura de Plugin](/es/plugins/architecture). Esta página cubre
la mecánica interna: canalización de carga, registro, hooks de tiempo de ejecución, rutas HTTP del Gateway,
rutas de importación y tablas de esquema.

## Canalización de carga

Al iniciar, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de plugins
2. lee manifiestos de bundles nativos o compatibles y metadatos de paquete
3. rechaza candidatos no seguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga módulos nativos habilitados: los módulos bundled compilados usan un cargador nativo;
   el código fuente TypeScript local de terceros usa el fallback de emergencia de Jiti
7. llama a los hooks nativos `register(api)` y recopila los registros en el registro de plugins
8. expone el registro a comandos/superficies de tiempo de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins bundled usan `register`; prefiere `register` para plugins nuevos.
</Note>

Las barreras de seguridad se ejecutan **antes** de la ejecución en tiempo de ejecución. El descubrimiento bloquea un candidato
cuando:

- su entrada resuelta escapa de la raíz del plugin
- su ruta (o su directorio raíz) permite escritura mundial
- para plugins no bundled, la propiedad de la ruta no coincide con el uid actual (o root)

Los directorios bundled con escritura mundial reciben primero un intento de reparación `chmod`
in situ (las instalaciones npm/globales pueden enviar directorios de paquete con `0777`) antes de que la barrera
vuelva a comprobarse; las comprobaciones de propiedad se omiten por completo para el origen bundled.

Los candidatos bloqueados aún llevan su id de plugin en el diagnóstico emitido cuando
se conoce uno (incluidos ids resueltos desde un manifiesto dentro de un directorio
rechazado de otro modo), por lo que la configuración que hace referencia a ese id ve un plugin
bloqueado vinculado a una advertencia de seguridad de ruta en lugar de un error no relacionado de "plugin desconocido".

### Comportamiento con prioridad del manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/skills/esquema de configuración declarados o capacidades del bundle
- validar `plugins.entries.<id>.config`
- aumentar etiquetas/placeholders de Control UI
- mostrar metadatos de instalación/catálogo
- preservar descriptores económicos de activación y configuración sin cargar el runtime del plugin

Para plugins nativos, el módulo de runtime es la parte del plano de datos. Registra
comportamiento real como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifiesto permanecen en el plano de control.
Son descriptores solo de metadatos para la planificación de activación y el descubrimiento de configuración;
no sustituyen el registro de runtime, `register(...)` ni `setupEntry`.
Los consumidores de activación en vivo usan pistas de comandos, canales y proveedores del manifiesto para
reducir la carga de plugins antes de una materialización más amplia del registro:

- la carga de CLI se limita a plugins que poseen el comando primario solicitado
- la resolución de configuración/plugin de canal se limita a plugins que poseen el
  id de canal solicitado
- la resolución explícita de configuración/runtime de proveedor se limita a plugins que poseen el
  id de proveedor solicitado
- la planificación de inicio del Gateway usa `activation.onStartup` para importaciones
  explícitas de inicio; los plugins sin metadatos de inicio cargan solo mediante
  disparadores de activación más específicos

El planificador de activación expone tanto una API solo de ids para llamadores existentes como una
API de plan para diagnósticos. Las entradas del plan informan por qué se seleccionó un plugin,
separando las pistas explícitas `activation.*` del fallback de propiedad del manifiesto:

| Motivo (de pistas `activation.*`)    | Motivo (de propiedad del manifiesto)                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                            |
| — (el disparador de hook no tiene variante de pista) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

Esa división de motivos es el límite de compatibilidad: los metadatos existentes de plugins
siguen funcionando, mientras que el código nuevo puede detectar pistas amplias o comportamiento de fallback
sin cambiar la semántica de carga en runtime.

Las precargas de runtime en tiempo de solicitud que piden el alcance amplio `all` aún derivan
un conjunto explícito efectivo de ids de plugins desde la configuración, la planificación de inicio, los canales
configurados, los slots y las reglas de habilitación automática
(`resolveEffectivePluginIds` en `src/plugins/effective-plugin-ids.ts`). Si ese
conjunto derivado está vacío, OpenClaw mantiene el alcance vacío en lugar de ampliarlo a
cada plugin detectable.

El descubrimiento de configuración prefiere ids propiedad de descriptores como `setup.providers` y
`setup.cliBackends` para reducir plugins candidatos antes de recurrir a
`setup-api` para plugins que todavía necesitan hooks de runtime durante la configuración. Las listas de configuración de proveedores
usan `providerAuthChoices` del manifiesto, opciones de configuración derivadas de descriptores
y metadatos del catálogo de instalación sin cargar el runtime del proveedor. El valor explícito
`setup.requiresRuntime: false` es un corte solo de descriptor; omitir
`requiresRuntime` mantiene el fallback heredado de setup-api por compatibilidad. Si
más de un plugin descubierto reclama el mismo proveedor de configuración normalizado o
id de backend de CLI, la búsqueda de configuración rechaza el propietario ambiguo en lugar de depender del
orden de descubrimiento. Cuando el runtime de configuración sí se ejecuta, los diagnósticos del registro informan
desviaciones entre `setup.providers` / `setup.cliBackends` y los proveedores o backends de CLI
registrados realmente por setup-api, sin bloquear plugins heredados.

### Límite de caché de plugins

OpenClaw no almacena en caché resultados de descubrimiento de plugins ni datos directos del registro de manifiestos
detrás de ventanas de reloj de pared. Las instalaciones, ediciones de manifiestos y cambios de rutas de carga
deben hacerse visibles en la siguiente lectura explícita de metadatos o reconstrucción de snapshot.
El analizador de archivos de manifiesto mantiene una caché acotada de firmas de archivo con clave por la
ruta de manifiesto abierta más dispositivo/inode, tamaño y mtime/ctime; esa caché solo
evita volver a analizar bytes sin cambios y no debe almacenar en caché respuestas de descubrimiento, registro,
propietario ni política.

La ruta rápida segura de metadatos es la propiedad explícita de objetos, no una caché oculta.
Las rutas calientes de inicio del Gateway deben pasar el `PluginMetadataSnapshot` actual, la
`PluginLookUpTable` derivada o un registro explícito de manifiestos por la cadena de llamadas.
La validación de configuración, la habilitación automática de inicio, el arranque de plugins y la selección de proveedores
pueden reutilizar esos objetos mientras representen la configuración y el inventario de plugins actuales.
La búsqueda de configuración aún reconstruye metadatos de manifiesto bajo demanda
salvo que la ruta específica de configuración reciba un registro explícito de manifiestos; mantén
eso como fallback de ruta fría en lugar de añadir cachés ocultas de búsqueda. Cuando la
entrada cambia, reconstruye y sustituye el snapshot en lugar de mutarlo o
mantener copias históricas. Las vistas sobre el registro activo de plugins y los helpers de arranque de canales
bundled deben recalcularse desde el registro/raíz actual. Los mapas de vida corta son aceptables dentro de
una llamada para deduplicar trabajo o proteger reentradas; no deben convertirse en cachés de metadatos
del proceso.

Para la carga de plugins, la capa persistente de caché es la carga de runtime. Puede reutilizar
estado del cargador cuando el código o los artefactos instalados se cargan realmente, como:

- `PluginLoaderCacheState` y registros compatibles de runtime activo
- cachés de jiti/módulos y cachés de cargador de superficie pública usadas para evitar importar
  repetidamente la misma superficie de runtime
- cachés de sistema de archivos para artefactos de plugins instalados
- mapas por llamada de vida corta para normalización de rutas o resolución de duplicados

Esas cachés son detalles de implementación del plano de datos. No deben responder
preguntas del plano de control como "¿qué plugin posee este proveedor?" salvo que el
llamador haya pedido deliberadamente la carga de runtime.

No añadas cachés persistentes o de reloj de pared para:

- resultados de descubrimiento
- registros directos de manifiestos
- registros de manifiestos reconstruidos desde el índice de plugins instalados
- búsqueda de propietario de proveedor, supresión de modelos, política de proveedores o metadatos de artefactos públicos
- cualquier otra respuesta derivada del manifiesto donde un manifiesto cambiado, índice instalado
  o ruta de carga deba ser visible en la siguiente lectura de metadatos

Los llamadores que reconstruyen metadatos de manifiesto desde el índice persistido de plugins instalados
reconstruyen ese registro bajo demanda. El índice instalado es estado durable del plano fuente;
no es una caché oculta de metadatos en proceso.

## Modelo de registro

Los plugins cargados no mutan directamente globales aleatorios del core. Se registran en un
registro central de plugins (`PluginRegistry` en `src/plugins/registry-types.ts`),
que rastrea registros de plugins (identidad, fuente, origen, estado, diagnósticos)
más arrays para cada capacidad: herramientas, hooks heredados y hooks tipados,
canales, proveedores, manejadores RPC del Gateway, rutas HTTP, registradores de CLI,
servicios en segundo plano, comandos propiedad de plugins y docenas de familias tipadas de proveedores
(speech, embeddings, generación de imágenes/video/música, fetch/búsqueda web,
arneses de agente, acciones de sesión, etc.).

Las funciones del core luego leen de ese registro en lugar de hablar directamente con los módulos
de plugins. Esto mantiene la carga unidireccional:

- módulo de plugin -> registro en el registro
- runtime del core -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del core solo
necesitan un punto de integración: "leer el registro", no "especializar cada
módulo de plugin".

## Callbacks de vinculación de conversaciones

Los plugins que vinculan una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de vinculación
se apruebe o deniegue:

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
- `request`: el resumen de la solicitud original, la pista de desvinculación, el id del remitente y
  metadatos de la conversación

Este callback es solo de notificación. No cambia quién tiene permiso para vincular una
conversación, y se ejecuta después de que finaliza el manejo de aprobación del core.

## Hooks de runtime de proveedores

Los plugins de proveedor tienen tres capas:

- **Metadatos del manifiesto** para búsqueda económica previa al runtime:
  `setup.providers[].envVars`, compatibilidad obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` y `channelEnvVars`.
- **Hooks en tiempo de configuración**: `catalog` (`discovery` heredado) más
  `applyConfigDefaults`.
- **Hooks de runtime**: más de 40 hooks opcionales que cubren autenticación, resolución de modelos,
  envoltura de streams, niveles de thinking, política de replay y endpoints de uso. Consulta
  [Orden y uso de hooks](#hook-order-and-usage).

OpenClaw sigue siendo dueño del loop genérico de agentes, el failover, el manejo de transcripciones y la
política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico de proveedores
sin necesitar un transporte de inferencia completamente personalizado.

Usa el manifiesto `setup.providers[].envVars` cuando el proveedor tenga credenciales basadas en env que las rutas genéricas de autenticación/estado/selector de modelos deban ver sin cargar el runtime del plugin. El campo obsoleto `providerAuthEnvVars` todavía lo lee el adaptador de compatibilidad durante el periodo de obsolescencia, y los plugins no empaquetados que lo usan reciben un diagnóstico de manifiesto. Usa el manifiesto `providerAuthAliases` cuando un id de proveedor deba reutilizar las variables de entorno, los perfiles de autenticación, la autenticación respaldada por configuración y la opción de onboarding con clave de API de otro id de proveedor. Usa el manifiesto `providerAuthChoices` cuando las superficies de CLI de onboarding/elección de autenticación deban conocer el id de opción del proveedor, las etiquetas de grupo y el cableado de autenticación simple de una sola bandera sin cargar el runtime del proveedor. Mantén `envVars` del runtime del proveedor para indicaciones orientadas al operador, como etiquetas de onboarding o variables de configuración de client-id/client-secret de OAuth.

Usa el manifiesto `channelEnvVars` cuando un canal tenga autenticación o configuración impulsada por env que el fallback genérico de entorno de shell, las comprobaciones de configuración/estado o los prompts de configuración deban ver sin cargar el runtime del canal.

### Orden y uso de hooks

Para plugins de modelo/proveedor, OpenClaw llama a los hooks en este orden aproximado.
La columna "Cuándo usar" es la guía rápida de decisión.
Los campos de proveedor solo de compatibilidad que OpenClaw ya no llama, como `ProviderPlugin.capabilities` y `suppressBuiltInModel`, se omiten aquí intencionalmente.

| Hook                              | Qué hace                                                                                                                   | Cuándo usarlo                                                                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`                        | El proveedor posee un catálogo o valores predeterminados de URL base                                                                                          |
| `applyConfigDefaults`             | Aplica valores predeterminados de configuración global propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de familia de modelos del proveedor                                  |
| _(búsqueda de modelos integrada)_ | OpenClaw intenta primero la ruta normal de registro/catálogo                                                               | _(no es un hook de plugin)_                                                                                                                                   |
| `normalizeModelId`                | Normaliza alias de identificadores de modelo heredados o de vista previa antes de la búsqueda                              | El proveedor posee la limpieza de alias antes de la resolución canónica del modelo                                                                            |
| `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia de proveedores antes del ensamblaje genérico del modelo                          | El proveedor posee la limpieza de transporte para identificadores de proveedor personalizados en la misma familia de transporte                                |
| `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución de runtime/proveedor                                              | El proveedor necesita limpieza de configuración que debe residir con el plugin; los helpers integrados de la familia de Google también respaldan entradas de configuración de Google compatibles |
| `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a proveedores de configuración                            | El proveedor necesita correcciones de metadatos de uso de streaming nativo determinadas por el endpoint                                                       |
| `resolveConfigApiKey`             | Resuelve autenticación con marcador de entorno para proveedores de configuración antes de cargar la autenticación de runtime | Los proveedores exponen sus propios hooks de resolución de claves de API con marcador de entorno                                                              |
| `resolveSyntheticAuth`            | Expone autenticación local/autohospedada o respaldada por configuración sin persistir texto plano                          | El proveedor puede operar con un marcador de credencial sintética/local                                                                                       |
| `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externos propiedad del proveedor; el `persistence` predeterminado es `runtime-only` para credenciales propiedad de la CLI/app | El proveedor reutiliza credenciales de autenticación externas sin persistir tokens de actualización copiados; declara `contracts.externalAuthProviders` en el manifiesto |
| `shouldDeferSyntheticProfileAuth` | Reduce la precedencia de marcadores de posición de perfiles sintéticos almacenados frente a autenticación respaldada por entorno/configuración | El proveedor almacena perfiles de marcador de posición sintéticos que no deben ganar precedencia                                                              |
| `resolveDynamicModel`             | Sincroniza el fallback para identificadores de modelo propiedad del proveedor que aún no están en el registro local         | El proveedor acepta identificadores de modelo upstream arbitrarios                                                                                            |
| `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` se ejecuta de nuevo                                                   | El proveedor necesita metadatos de red antes de resolver identificadores desconocidos                                                                         |
| `normalizeResolvedModel`          | Reescritura final antes de que el runner integrado use el modelo resuelto                                                  | El proveedor necesita reescrituras de transporte pero sigue usando un transporte de core                                                                      |
| `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el runner integrado los vea                                                | El proveedor necesita limpieza de esquemas de familia de transporte                                                                                           |
| `inspectToolSchemas`              | Expone diagnósticos de esquema propiedad del proveedor después de la normalización                                          | El proveedor quiere advertencias de palabras clave sin enseñar reglas específicas del proveedor al core                                                       |
| `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo frente al etiquetado                                               | El proveedor necesita razonamiento/salida final etiquetados en lugar de campos nativos                                                                        |
| `prepareExtraParams`              | Normalización de parámetros de solicitud antes de wrappers genéricos de opciones de stream                                 | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                                          |
| `createStreamFn`                  | Reemplaza por completo la ruta normal de stream con un transporte personalizado                                            | El proveedor necesita un protocolo de cable personalizado, no solo un wrapper                                                                                 |
| `wrapStreamFn`                    | Wrapper de stream después de aplicar wrappers genéricos                                                                    | El proveedor necesita wrappers de compatibilidad de encabezados/cuerpo/modelo de solicitud sin un transporte personalizado                                    |
| `resolveTransportTurnState`       | Adjunta encabezados o metadatos de transporte nativos por turno                                                            | El proveedor quiere que los transportes genéricos envíen identidad de turno nativa del proveedor                                                             |
| `resolveWebSocketSessionPolicy`   | Adjunta encabezados WebSocket nativos o política de enfriamiento de sesión                                                 | El proveedor quiere que los transportes WS genéricos ajusten encabezados de sesión o política de fallback                                                     |
| `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` de runtime                 | El proveedor almacena metadatos de autenticación adicionales y necesita una forma de token de runtime personalizada                                           |
| `refreshOAuth`                    | Sobrescritura de actualización OAuth para endpoints de actualización personalizados o política de fallo de actualización   | El proveedor no encaja con los actualizadores compartidos de OpenClaw                                                                                         |
| `buildAuthDoctorHint`             | Sugerencia de reparación adjunta cuando falla la actualización OAuth                                                       | El proveedor necesita guía de reparación de autenticación propiedad del proveedor tras un fallo de actualización                                              |
| `matchesContextOverflowError`     | Coincidencia de desbordamiento de ventana de contexto propiedad del proveedor                                              | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas pasarían por alto                                                    |
| `classifyFailoverReason`          | Clasificación de motivo de failover propiedad del proveedor                                                                | El proveedor puede mapear errores sin procesar de API/transporte a límite de tasa/sobrecarga/etc.                                                            |
| `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                               | El proveedor necesita control de elegibilidad de TTL de caché específico de proxy                                                                             |
| `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por autenticación faltante                                                | El proveedor necesita una sugerencia de recuperación por autenticación faltante específica del proveedor                                                      |
| `augmentModelCatalog`             | Filas de catálogo sintéticas/finales añadidas después del descubrimiento (obsoleto, ver abajo)                            | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                                                |
| `resolveThinkingProfile`          | Conjunto de niveles `/think` específico del modelo, etiquetas de visualización y valor predeterminado                      | El proveedor expone una escala de thinking personalizada o una etiqueta binaria para modelos seleccionados                                                   |
| `isBinaryThinking`                | Hook de compatibilidad para alternar razonamiento activado/desactivado                                                     | El proveedor expone solo thinking binario activado/desactivado                                                                                                |
| `supportsXHighThinking`           | Hook de compatibilidad con razonamiento `xhigh`                                                                            | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                                                 |
| `resolveDefaultThinkingLevel`     | Hook de compatibilidad para el nivel `/think` predeterminado                                                               | El proveedor posee la política predeterminada de `/think` para una familia de modelos                                                                         |
| `isModernModelRef`                | Comparador de modelo moderno para filtros de perfiles en vivo y selección de smoke                                         | El proveedor posee la coincidencia de modelo preferido en vivo/smoke                                                                                         |
| `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de runtime justo antes de la inferencia                     | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                                                 |
| `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                               | El proveedor necesita análisis personalizado de token de uso/cuota o una credencial de uso diferente                                                         |
| `fetchUsageSnapshot`              | Obtiene y normaliza snapshots de uso/cuota específicos del proveedor después de resolver la autenticación                  | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de payload                                                                  |
| `createEmbeddingProvider`         | Crear un adaptador de embeddings propiedad del proveedor para memoria/búsqueda                                                     | El comportamiento de embeddings de memoria pertenece al plugin del proveedor                                                                                    |
| `buildReplayPolicy`               | Devolver una política de reproducción que controla el manejo de transcripciones para el proveedor                                        | El proveedor necesita una política de transcripciones personalizada (por ejemplo, eliminar bloques de pensamiento)                                                               |
| `sanitizeReplayHistory`           | Reescribir el historial de reproducción después de la limpieza genérica de transcripciones                                                        | El proveedor necesita reescrituras de reproducción específicas del proveedor más allá de los helpers compartidos de compactación                                                             |
| `validateReplayTurns`             | Validación final o reformulación de turnos de reproducción antes del ejecutor embebido                                           | El transporte del proveedor necesita una validación de turnos más estricta después de la sanitización genérica                                                                    |
| `onModelSelected`                 | Ejecutar efectos secundarios posteriores a la selección propiedad del proveedor                                                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo se activa                                                                  |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero revisan el
Plugin proveedor coincidente y luego continúan con otros Plugins proveedores con
capacidad de hooks hasta que uno cambie realmente el id del modelo o el
transporte/configuración. Eso mantiene funcionando los shims de proveedor para
alias/compatibilidad sin exigir que el llamador sepa qué Plugin incluido es
propietario de la reescritura. Si ningún hook de proveedor reescribe una entrada
de configuración admitida de la familia Google, el normalizador de configuración
de Google incluido aún aplica esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de comunicación completamente personalizado
o un ejecutor de solicitudes personalizado, eso es otra clase de extensión. Estos
hooks son para comportamiento de proveedor que aún se ejecuta en el bucle normal
de inferencia de OpenClaw.

`resolveUsageAuth` decide si OpenClaw debe llamar a `fetchUsageSnapshot` o
recurrir a la resolución genérica de credenciales para superficies de uso/estado.
Devuelve `{ token, accountId? }` cuando el proveedor tiene una credencial de uso,
devuelve `{ handled: true }` cuando la autenticación de uso propiedad del
proveedor ha manejado la solicitud y debe suprimir la alternativa genérica de
clave de API/OAuth, y devuelve `null` o `undefined` cuando el proveedor no manejó
la autenticación de uso.

Declara credenciales de organización o facturación en
`providerUsageAuthEnvVars` del manifiesto. Esto permite que las superficies
genéricas de descubrimiento y limpieza de secretos las reconozcan sin convertirlas
en candidatas de autenticación de inferencia.

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

Los Plugins proveedores incluidos combinan los hooks anteriores para adaptarse al
catálogo, la autenticación, el razonamiento, la reproducción y las necesidades de
uso de cada proveedor. El conjunto autoritativo de hooks vive con cada Plugin en
`extensions/`; esta página ilustra las formas en lugar de reflejar la lista.

<AccordionGroup>
  <Accordion title="Proveedores de catálogo de paso directo">
    OpenRouter, Kilocode, Z.AI, xAI registran `catalog` más
    `resolveDynamicModel` / `prepareDynamicModel` para poder exponer ids de
    modelo ascendentes antes del catálogo estático de OpenClaw.
  </Accordion>
  <Accordion title="Proveedores de OAuth y endpoints de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinan
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` para ser propietarios del intercambio de tokens y la
    integración de `/usage`.
  </Accordion>
  <Accordion title="Familias de reproducción y limpieza de transcripciones">
    Las familias compartidas con nombre (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permiten que los proveedores
    adopten una política de transcripción mediante `buildReplayPolicy` en lugar
    de que cada Plugin vuelva a implementar la limpieza.
  </Accordion>
  <Accordion title="Proveedores solo de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` y
    `volcengine` solo registran `catalog` y usan el bucle de inferencia
    compartido.
  </Accordion>
  <Accordion title="Helpers de flujo específicos de Anthropic">
    Los encabezados beta, `/fast` / `serviceTier` y `context1m` viven dentro de
    la superficie pública `api.ts` / `contract-api.ts` del Plugin de Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) en lugar de estar
    en el SDK genérico.
  </Accordion>
</AccordionGroup>

## Helpers de tiempo de ejecución

Los Plugins pueden acceder a helpers seleccionados del núcleo mediante `api.runtime`. Para TTS:

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

- `textToSpeech` devuelve la carga de salida normal de TTS del núcleo para superficies de archivo/nota de voz.
- Usa la configuración central `messages.tts` y la selección de proveedor.
- Devuelve búfer de audio PCM + frecuencia de muestreo. Los Plugins deben remuestrear/codificar para proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz propiedad del proveedor o flujos de configuración.
- Las listas de voces pueden incluir metadatos más ricos, como configuración regional, género y etiquetas de personalidad para selectores conscientes del proveedor.
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

- Mantén la política de TTS, la alternativa y la entrega de respuestas en el núcleo.
- Usa proveedores de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada de Microsoft `edge` se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a empresas: un Plugin de proveedor puede poseer
  proveedores de texto, voz, imagen y futuros medios a medida que OpenClaw agrega esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los Plugins registran un proveedor tipado
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

- Mantén la orquestación, la alternativa, la configuración y el cableado de canales en el núcleo.
- Mantén el comportamiento del proveedor en el Plugin proveedor.
- La expansión aditiva debe seguir tipada: nuevos métodos opcionales, nuevos campos de
  resultado opcionales, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo posee el contrato de capacidad y el helper de tiempo de ejecución
  - los Plugins de proveedores registran `api.registerVideoGenerationProvider(...)`
  - los Plugins de funcionalidad/canal consumen `api.runtime.videoGeneration.*`

Para helpers de tiempo de ejecución de comprensión de medios, los Plugins pueden llamar:

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

Para transcripción de audio, los Plugins pueden usar el tiempo de ejecución de
comprensión de medios o el alias STT anterior:

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
- `extractStructuredWithModel(...)` es la superficie orientada a Plugins para extracción acotada
  propiedad del proveedor y centrada en imágenes. Incluye al menos una entrada de imagen;
  las entradas de texto son contexto suplementario. Los Plugins de producto poseen sus rutas y
  esquemas, mientras OpenClaw posee el límite de proveedor/tiempo de ejecución.
- Usa la configuración central de audio de comprensión de medios (`tools.media.audio`) y el orden de alternativas de proveedor.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no admitida).
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

- `provider` y `model` son anulaciones opcionales por ejecución, no cambios de sesión persistentes.
- OpenClaw solo respeta esos campos de anulación para llamadores de confianza.
- Para ejecuciones alternativas propiedad de Plugins, los operadores deben optar por ellas con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir Plugins de confianza a destinos canónicos `provider/model` específicos, o `"*"` para permitir explícitamente cualquier destino.
- Las ejecuciones de subagente de Plugins no confiables siguen funcionando, pero las solicitudes de anulación se rechazan en lugar de recurrir silenciosamente a la alternativa.
- Las sesiones de subagente creadas por Plugins se etiquetan con el id del Plugin creador. La alternativa `api.runtime.subagent.deleteSession(...)` puede eliminar solo esas sesiones propias; la eliminación arbitraria de sesiones aún requiere una solicitud de Gateway con alcance de administrador.

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

- Mantén la selección de proveedor, la resolución de credenciales y la semántica de solicitudes compartida en el núcleo.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para Plugins de funcionalidad/canal que necesitan comportamiento de búsqueda sin depender del envoltorio de herramienta del agente.

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

- `path`: ruta bajo el servidor HTTP del gateway.
- `auth`: obligatorio, `"gateway"` o `"plugin"`. Usa `"gateway"` para requerir la autenticación normal del gateway, o `"plugin"` para la autenticación/verificación de webhook gestionada por el plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `handleUpgrade`: manejador opcional para solicitudes de actualización WebSocket en la misma ruta.
- `replaceExisting`: opcional. Permite que el mismo plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta haya gestionado la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de Plugin deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Las rutas solapadas con distintos niveles de `auth` se rechazan. Mantén las cadenas de reserva `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas con `auth: "plugin"` **no** reciben ámbitos de ejecución de operador automáticamente. Son para webhooks/verificación de firmas gestionados por el plugin, no para llamadas privilegiadas a helpers del Gateway.
- Las rutas con `auth: "gateway"` se ejecutan dentro de un ámbito de ejecución de solicitud del Gateway. La superficie predeterminada (`gatewayRuntimeScopeSurface: "write-default"`) es intencionadamente conservadora:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) y cualquier método de autenticación que no sea de proxy de confianza reciben un único ámbito `operator.write`, incluso si el llamador envía `x-openclaw-scopes`
  - los llamadores `trusted-proxy` sin una cabecera `x-openclaw-scopes` explícita también conservan la superficie heredada limitada a `operator.write`
  - los llamadores `trusted-proxy` que sí envían `x-openclaw-scopes` reciben los ámbitos declarados en su lugar
  - una ruta puede optar por `gatewayRuntimeScopeSurface: "trusted-operator"` para respetar siempre `x-openclaw-scopes` en modos de autenticación con identidad (recurriendo al conjunto completo de ámbitos predeterminados de la CLI cuando la cabecera no está presente)
- Regla práctica: no asumas que una ruta de plugin autenticada por gateway es una superficie de administración implícita. Si tu ruta necesita comportamiento exclusivo de administrador, opta por la superficie de ámbito `trusted-operator`, requiere un modo de autenticación con identidad y documenta el contrato explícito de la cabecera `x-openclaw-scopes`.

## Rutas de importación del SDK de Plugin

Usa subrutas estrechas del SDK en lugar del barrel raíz monolítico `openclaw/plugin-sdk`
al crear plugins nuevos. Subrutas principales:

| Subruta                             | Propósito                                          |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/compilación de canal            |
| `openclaw/plugin-sdk/core`          | Helpers compartidos genéricos y contrato paraguas  |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |

Los plugins de canal eligen entre una familia de puntos de integración estrechos: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` y `channel-actions`. El comportamiento de aprobación debe consolidarse
en un contrato `approvalCapability` en lugar de mezclarse entre campos de plugin no relacionados.
Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).

Los helpers de runtime y configuración viven bajo subrutas enfocadas `*-runtime`
correspondientes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefiere `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` y `config-mutation`
en lugar del barrel de compatibilidad amplio `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
las pequeñas fachadas helper de canal, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
y `openclaw/plugin-sdk/infra-runtime` son shims de compatibilidad obsoletos para
plugins antiguos. El código nuevo debe importar primitivas genéricas más estrechas.
</Info>

Puntos de entrada internos del repositorio (por raíz de paquete de plugin incluido):

- `index.js` — entrada de plugin incluido
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel solo de runtime
- `setup-entry.js` — entrada de plugin de configuración

Los plugins externos solo deben importar subrutas `openclaw/plugin-sdk/*`. Nunca
importes `src/*` de otro paquete de plugin desde core ni desde otro plugin.
Los puntos de entrada cargados por fachada prefieren la instantánea activa de configuración de runtime cuando
existe, y luego recurren al archivo de configuración resuelto en disco.

Las subrutas específicas de capacidades como `image-generation`, `media-understanding`
y `speech` existen porque los plugins incluidos las usan hoy. No son
automáticamente contratos externos congelados a largo plazo: revisa la página de
referencia del SDK correspondiente cuando dependas de ellas.

## Esquemas de herramientas de mensajes

Los plugins deben ser propietarios de las contribuciones de esquema `describeMessageTool(...)`
específicas del canal para primitivas que no sean mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envío debe usar el contrato genérico `MessagePresentation`
en lugar de campos nativos del proveedor para botones, componentes, bloques o tarjetas.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para el contrato,
las reglas de reserva, el mapeo de proveedores y la lista de verificación para autores de plugins.

Los plugins con capacidad de envío declaran lo que pueden renderizar mediante capacidades de mensaje:

- `presentation` para bloques de presentación semántica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

Core decide si renderiza la presentación de forma nativa o la degrada a texto.
No expongas vías de escape de UI nativas del proveedor desde la herramienta genérica de mensajes.
Los helpers obsoletos del SDK para esquemas nativos heredados siguen exportándose para plugins
de terceros existentes, pero los plugins nuevos no deben usarlos.

## Resolución de destinos de canal

Los plugins de canal deben ser propietarios de la semántica de destinos específica del canal. Mantén el host
de salida compartido genérico y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` le indica a core si una
  entrada debe saltar directamente a una resolución tipo id en lugar de una búsqueda en el directorio.
- `messaging.targetResolver.reservedLiterals` enumera palabras simples que son
  referencias de canal/sesión para ese proveedor. La resolución preserva las entradas de
  directorio configuradas antes de rechazar literales reservados, y luego falla de forma cerrada ante una
  ausencia en el directorio.
- `messaging.targetResolver.resolveTarget(...)` es la reserva del plugin cuando
  core necesita una resolución final propiedad del proveedor después de la normalización o tras una
  ausencia en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` es propietario de la construcción de rutas de sesión
  específica del proveedor una vez resuelto un destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deben ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de "tratar esto como un id de destino explícito/nativo".
- Usa `resolveTarget` para la reserva de normalización específica del proveedor, no para
  búsquedas amplias en directorios.
- Mantén los ids nativos del proveedor, como ids de chat, ids de hilo, JIDs, handles e ids de sala,
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio desde la configuración deben mantener esa lógica en el
plugin y reutilizar los helpers compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Usa esto cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares de DM controlados por allowlist
- mapas configurados de canales/grupos
- reservas de directorio estático con ámbito de cuenta

Los helpers compartidos de `directory-runtime` solo gestionan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- helpers de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas específica del canal y la normalización de ids deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el plugin posea ids de modelo específicos del proveedor, valores
predeterminados de URL base o metadatos de modelos sujetos a autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un plugin respecto de los
proveedores implícitos incorporados de OpenClaw:

- `simple`: proveedores simples basados en clave de API o entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en colisiones de clave, por lo que los plugins pueden anular intencionadamente una
entrada de proveedor incorporada con el mismo id de proveedor.

Los plugins también pueden publicar filas de modelo de solo lectura mediante
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Este es el camino futuro para superficies de lista/ayuda/selector y admite filas
`text`, `voice`, `image_generation`, `video_generation` y `music_generation`.
Los plugins de proveedor siguen siendo propietarios de las llamadas a endpoints en vivo, el intercambio de tokens y el
mapeo de respuestas del proveedor; core posee la forma común de fila, las etiquetas de origen y el
formato de ayuda para herramientas multimedia. Los registros de proveedores de generación multimedia sintetizan
filas de catálogo estáticas automáticamente a partir de `defaultModel`, `models` y
`capabilities`.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado, pero emite una advertencia de obsolescencia
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`
  y emite una advertencia
- `augmentModelCatalog` está obsoleto; los proveedores incluidos deben publicar
  filas suplementarias mediante `registerModelCatalogProvider`

## Inspección de canal de solo lectura

Si tu plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de runtime. Puede asumir que las credenciales
  están completamente materializadas y puede fallar rápido cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de reparación
  de doctor/configuración no deberían necesitar materializar credenciales de runtime solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo estado descriptivo de la cuenta.
- Preserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando sean relevantes, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores de token sin procesar solo para informar disponibilidad
  de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen
  correspondiente) es suficiente para comandos de estilo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen "configurado pero no disponible en esta ruta de comando"
en lugar de fallar o informar erróneamente que la cuenta no está configurada.

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

Cada entrada se convierte en un plugin. Si el paquete enumera varias extensiones, el id del plugin
se convierte en `<manifestOrPackageName>/<fileBase>` (el id del manifiesto tiene prioridad cuando
está presente; de lo contrario, el nombre sin ámbito de `package.json`).

Si tu plugin importa dependencias de npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Límite de seguridad: cada entrada de `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de la resolución de enlaces simbólicos. Se rechazan las entradas que escapan del directorio del paquete.

Nota de seguridad: `openclaw plugins install` instala las dependencias del plugin con un
`npm install --omit=dev --ignore-scripts` local al proyecto (sin scripts de ciclo de vida,
sin dependencias de desarrollo en tiempo de ejecución), ignorando la configuración global heredada de instalación de npm.
Mantén los árboles de dependencias del plugin como "JS/TS puro" y evita paquetes que requieran
compilaciones de `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún sin configurar, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto mantiene el arranque y la configuración más ligeros
cuando la entrada principal de tu plugin también conecta herramientas, hooks u otro código
solo de tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un plugin de canal opte por la misma ruta de `setupEntry` durante la fase de arranque
previa a la escucha del Gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra por completo la superficie de arranque que debe existir
antes de que el Gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar cada capacidad propiedad del canal de la que depende el arranque, como:

- el registro del canal en sí
- cualquier ruta HTTP que deba estar disponible antes de que el Gateway empiece a escuchar
- cualquier método, herramienta o servicio del Gateway que deba existir durante esa misma ventana

Si tu entrada completa aún es propietaria de alguna capacidad de arranque requerida, no habilites
esta marca. Mantén el plugin en el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el arranque.

Los canales incluidos también pueden publicar helpers de superficie de contrato solo de configuración que core
puede consultar antes de que se cargue el runtime completo del canal. La superficie actual
de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core usa esa superficie cuando necesita promover una configuración heredada de canal de una sola cuenta
a `channels.<id>.accounts.*` sin cargar la entrada completa del plugin.
Matrix es el ejemplo incluido actual: mueve solo claves de auth/bootstrap a una
cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede preservar una
clave configurada de cuenta predeterminada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parche de configuración mantienen diferido el descubrimiento de la superficie de contrato incluida. El tiempo
de importación se mantiene ligero; la superficie de promoción se carga solo en el primer uso en lugar de
volver a entrar en el arranque del canal incluido al importar el módulo.

Cuando esas superficies de arranque incluyen métodos RPC del Gateway, mantenlos con un
prefijo específico del plugin. Los espacios de nombres de administración de core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen reservados y siempre se resuelven
a `operator.admin`, incluso si un plugin solicita un alcance más estrecho.

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
sugerencias de instalación mediante `openclaw.install`. Esto mantiene el catálogo de core sin datos.

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
- `docsLabel`: sobrescribir el texto del enlace para el enlace de la documentación
- `preferOver`: ids de plugin/canal de menor prioridad que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto de la superficie de selección
- `markdownCapable`: marca el canal como compatible con markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de la documentación
- `showConfigured` / `showInSetup`: alias heredados que aún se aceptan por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: hace que el canal opte por el flujo estándar de inicio rápido `allowFrom`
- `forceAccountBinding`: requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver destinos de anuncio

OpenClaw también puede fusionar **catálogos de canales externos** (por ejemplo, una exportación de registro
MPM). Coloca un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o más archivos JSON (delimitados por comas/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados para la clave `"entries"`.

Las entradas generadas del catálogo de canales y las entradas del catálogo de instalación de proveedores exponen
datos normalizados de origen de instalación junto al bloque sin procesar `openclaw.install`. Los
datos normalizados identifican si la especificación npm es una versión exacta o un selector
flotante, si están presentes los metadatos de integridad esperados, y si también está disponible una ruta
de origen local. Cuando se conoce la identidad del catálogo/paquete, los
datos normalizados advierten si el nombre del paquete npm analizado se desvía de esa identidad.
También advierten cuando `defaultChoice` no es válido o apunta a un origen que
no está disponible, y cuando los metadatos de integridad de npm están presentes sin un origen npm
válido. Los consumidores deben tratar `installSource` como un campo opcional aditivo para que
las entradas hechas a mano y los shims de catálogo no tengan que sintetizarlo.
Esto permite que onboarding y los diagnósticos expliquen el estado del plano de origen sin
importar el runtime del plugin.

Las entradas npm externas oficiales deben preferir un `npmSpec` exacto más
`expectedIntegrity`. Los nombres de paquete simples y dist-tags siguen funcionando por
compatibilidad, pero muestran advertencias del plano de origen para que el catálogo pueda avanzar
hacia instalaciones fijadas y verificadas por integridad sin romper plugins existentes.
Cuando onboarding instala desde una ruta de catálogo local, registra una entrada administrada del índice de
plugins con `source: "path"` y un `sourcePath` relativo al workspace
cuando es posible. La ruta absoluta de carga operativa permanece en
`plugins.load.paths`; el registro de instalación evita duplicar rutas locales de estaciones de trabajo
en la configuración de larga duración. Esto mantiene las instalaciones de desarrollo local visibles para
los diagnósticos del plano de origen sin añadir una segunda superficie sin procesar de divulgación de rutas del sistema de archivos.
La tabla SQLite persistida `installed_plugin_index` es la fuente de verdad de instalación
y puede actualizarse sin cargar módulos del runtime del plugin.
Su mapa `installRecords` es duradero incluso cuando falta el manifiesto de un plugin o
no es válido; su payload `plugins` es una vista de manifiesto reconstruible.

## Plugins de motor de contexto

Los plugins de motor de contexto son propietarios de la orquestación del contexto de sesión para ingesta, ensamblaje
y Compaction. Regístralos desde tu plugin con
`api.registerContextEngine(id, factory)`, luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Usa esto cuando tu plugin necesite reemplazar o extender el pipeline de contexto predeterminado
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

La factory `ctx` expone valores opcionales `config`, `agentDir` y `workspaceDir`
para la inicialización en tiempo de construcción.

`assemble()` puede devolver `contextProjection` cuando el harness activo tiene un
hilo de backend persistente. Omítelo para la proyección heredada por turno. Devuelve
`{ mode: "thread_bootstrap", epoch }` cuando el contexto ensamblado deba
inyectarse una vez en un hilo de backend y reutilizarse hasta que cambie la época. Cambia
la época después de que cambie el contexto semántico del motor, como después de una
pasada de Compaction propiedad del motor. Los hosts pueden preservar metadatos de llamadas a herramientas, forma de entrada
y resultados de herramientas redactados en una proyección thread-bootstrap para que los hilos de backend
nuevos mantengan continuidad de herramientas sin copiar payloads sin procesar que contengan secretos.

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

Cuando un plugin necesita comportamiento que no encaja en la API actual, no eludas
el sistema de plugins con un acceso privado. Añade la capacidad que falta.

Secuencia recomendada:

1. **Define el contrato de core.** Decide qué comportamiento compartido debe poseer core:
   política, fallback, fusión de configuración, ciclo de vida, semántica orientada a canales y
   forma de helper de runtime.
2. **Añade superficies tipadas de registro/runtime de plugins.** Extiende
   `OpenClawPluginApi` o `api.runtime` con la superficie de capacidad tipada
   útil más pequeña.
3. **Conecta core + consumidores de canal/funcionalidad.** Los canales y plugins de funcionalidad
   deben consumir la nueva capacidad a través de core, no importando directamente una
   implementación de proveedor.
4. **Registra implementaciones de proveedor.** Luego los plugins de proveedor registran sus
   backends contra la capacidad.
5. **Añade cobertura de contrato.** Añade pruebas para que la propiedad y la forma de registro
   permanezcan explícitas con el tiempo.

Así es como OpenClaw se mantiene opinado sin quedar hardcodeado a la visión del mundo de un
proveedor. Consulta el [Capability Cookbook](/es/plugins/adding-capabilities)
para una checklist concreta de archivos y un ejemplo desarrollado.

### Checklist de capacidad

Cuando añades una nueva capacidad, la implementación normalmente debe tocar estas
superficies juntas:

- tipos de contrato del núcleo en `src/<capability>/types.ts`
- helper de runner/runtime del núcleo en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- cableado del registro de plugins en `src/plugins/registry.ts`
- exposición del runtime de plugins en `src/plugins/runtime/*` cuando los plugins de funciones/canales
  necesitan consumirla
- helpers de captura/prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación de operador/plugin en `docs/`

Si falta una de esas superficies, normalmente es señal de que la capacidad
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

Patrón de prueba de contrato (`src/plugins/contracts/registry.ts` expone búsquedas
de propiedad como `providerContractPluginIds`; las pruebas afirman que la lista
`contracts.videoGenerationProviders` de un plugin coincide con lo que realmente registra):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Eso mantiene la regla simple:

- el núcleo posee el contrato de capacidad + la orquestación
- los plugins de proveedores poseen las implementaciones de proveedores
- los plugins de funciones/canales consumen helpers de runtime
- las pruebas de contrato mantienen la propiedad explícita

## Relacionado

- [Arquitectura de plugins](/es/plugins/architecture) — modelo público de capacidades y formas
- [Subrutas del Plugin SDK](/es/plugins/sdk-subpaths)
- [Configuración del Plugin SDK](/es/plugins/sdk-setup)
- [Creación de plugins](/es/plugins/building-plugins)
