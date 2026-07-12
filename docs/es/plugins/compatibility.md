---
read_when:
    - Mantienes un plugin de OpenClaw
    - Ves una advertencia de compatibilidad del plugin
    - Estás planificando una migración del SDK de Plugin o del manifiesto
summary: Contratos de compatibilidad de Plugins, metadatos de obsolescencia y expectativas de migración
title: Compatibilidad de plugins
x-i18n:
    generated_at: "2026-07-11T23:19:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantiene conectados los contratos de Plugin antiguos mediante adaptadores de compatibilidad con nombre antes de eliminarlos. Esto protege los plugins incluidos y externos existentes mientras evolucionan los contratos del SDK, el manifiesto, la configuración inicial, la configuración y el entorno de ejecución del agente.

## Registro de compatibilidad

Los contratos de compatibilidad de plugins se registran en el registro del núcleo ubicado en `src/plugins/compat/registry.ts`. Cada registro incluye:

- un código de compatibilidad estable
- estado: `active`, `deprecated`, `removal-pending` o `removed`
- propietario: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`, `agent-runtime` o `core`
- fechas de introducción y obsolescencia cuando corresponda
- instrucciones para la sustitución
- documentación, diagnósticos y pruebas que cubren el comportamiento antiguo y el nuevo

El registro es la fuente para la planificación de los mantenedores y las futuras comprobaciones del inspector de plugins. Si cambia un comportamiento orientado a plugins, añade o actualiza el registro de compatibilidad en el mismo cambio que añade el adaptador.

La compatibilidad de las reparaciones y migraciones de Doctor se registra por separado en `src/commands/doctor/shared/deprecation-compat.ts`. Esos registros cubren formas antiguas de configuración, estructuras del libro de instalaciones y adaptadores de reparación que quizá deban seguir disponibles después de eliminar la ruta de compatibilidad del entorno de ejecución.

Las revisiones de cada versión deben comprobar ambos registros. No elimines una migración de Doctor solo porque haya caducado el registro correspondiente de compatibilidad del entorno de ejecución o de la configuración; comprueba primero que no exista ninguna ruta de actualización compatible que aún necesite la reparación. Vuelve a validar también cada anotación de sustitución durante la planificación de la versión, ya que la propiedad de los plugins y el alcance de la configuración pueden cambiar a medida que los proveedores y canales salen del núcleo.

## Política de obsolescencia

OpenClaw no debe eliminar un contrato de Plugin documentado en la misma versión que introduce su sustituto. Secuencia de migración:

1. Añade el nuevo contrato.
2. Mantén conectado el comportamiento antiguo mediante un adaptador de compatibilidad con nombre.
3. Emite diagnósticos o advertencias cuando los autores de plugins puedan actuar.
4. Documenta la sustitución y el calendario.
5. Prueba tanto la ruta antigua como la nueva.
6. Espera hasta que finalice el período de migración anunciado.
7. Elimina el contrato únicamente con aprobación explícita para una versión con cambios incompatibles.

Los registros obsoletos deben incluir una fecha de inicio de las advertencias, el sustituto, un enlace a la documentación y una fecha final de eliminación no superior a tres meses desde el inicio de las advertencias. No añadas una ruta de compatibilidad obsoleta con un período de eliminación indefinido, salvo que los mantenedores decidan explícitamente que es compatibilidad permanente y la marquen como `active` en su lugar.

## Áreas de compatibilidad actuales

Actualmente, el registro contiene alrededor de 70 códigos de compatibilidad en estas áreas. El código nuevo de plugins debe utilizar el sustituto de cada área y de la guía de migración específica; los plugins existentes pueden seguir utilizando una ruta de compatibilidad hasta que la documentación, los diagnósticos y las notas de la versión anuncien un período de eliminación.

- importaciones generales antiguas del SDK, como `openclaw/plugin-sdk/compat`
- formas antiguas de plugins que solo admiten hooks y `before_agent_start`
- nombres antiguos de hooks de limpieza `api.on("deactivate", ...)` mientras los plugins migran a `gateway_stop`
- puntos de entrada antiguos de plugins `activate(api)` mientras los plugins migran a `register(api)`
- alias antiguos del SDK, como `openclaw/extension-api`, los generadores de estado de `openclaw/plugin-sdk/channel-runtime` y `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (sustituido por subrutas de prueba específicas de `openclaw/plugin-sdk/*`) y los alias de tipo `ClawdbotConfig` / `OpenClawSchemaType`
- lista de permitidos y comportamiento de habilitación de los plugins incluidos
- metadatos antiguos del manifiesto para variables de entorno de proveedores y canales
- hooks y alias de tipo antiguos de plugins de proveedores mientras los proveedores migran a hooks explícitos de catálogo, autenticación, razonamiento, reproducción y transporte
- alias antiguos del entorno de ejecución, como `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt` y los obsoletos `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- campos planos de devolución de llamada de WhatsApp `WebInboundMessage` (consulta más adelante)
- campos de admisión de nivel superior de WhatsApp `WebInboundMessage` (consulta más adelante)
- registro dividido antiguo de plugins de memoria mientras estos migran a `registerMemoryCapability`
- registro antiguo de proveedores de incrustaciones específico de la memoria mientras los proveedores de incrustaciones migran a `api.registerEmbeddingProvider(...)` y `contracts.embeddingProviders`
- utilidades antiguas del SDK de canales para esquemas de mensajes nativos, control de menciones, formato de envoltorios de entrada y anidamiento de capacidades de aprobación
- alias antiguos de claves de rutas de canales y utilidades para objetivos comparables mientras los plugins migran a `openclaw/plugin-sdk/channel-route`
- indicaciones de activación que se sustituyen por la propiedad de contribuciones del manifiesto
- alternativa del entorno de ejecución `setup-api` mientras los descriptores de configuración inicial migran a los metadatos en frío `setup.requiresRuntime: false`
- hooks `discovery` de proveedores mientras los hooks del catálogo de proveedores migran a `catalog.run(...)`
- metadatos de canales `showConfigured` / `showInSetup` mientras los paquetes de canales migran a `openclaw.channel.exposure`
- claves antiguas de configuración de políticas del entorno de ejecución mientras Doctor migra a los operadores a `agentRuntime`
- alternativa de metadatos generados de configuración de canales incluidos mientras se incorporan los metadatos `channelConfigs`, con prioridad para el registro
- variables de entorno persistentes para deshabilitar el registro de plugins y migrar instalaciones mientras los flujos de reparación migran a los operadores a `openclaw plugins registry --refresh` y `openclaw doctor --fix`
- rutas antiguas de configuración de búsqueda web, obtención web y x_search propiedad de plugins mientras Doctor las migra a `plugins.entries.<plugin>.config`
- configuración creada mediante el antiguo `plugins.installs` y alias de rutas de carga de plugins incluidos mientras los metadatos de instalación se trasladan al libro de plugins administrado por el estado

### Alias planos de devoluciones de llamada entrantes de WhatsApp

Las devoluciones de llamada del entorno de ejecución de WhatsApp entregan `WebInboundMessage`: los contextos anidados canónicos `event`, `payload`, `quote`, `group` y `platform`, además de alias planos obsoletos para los campos de devolución de llamada publicados. El código nuevo de devoluciones de llamada debe leer los contextos anidados. El código que construya mensajes limpios y anidados de devoluciones de llamada puede utilizar `WebInboundCallbackMessage`; los escuchadores de compatibilidad que aún inserten mensajes antiguos planos de pruebas o plugins deben utilizar `LegacyFlatWebInboundMessage` o `WebInboundMessageInput`.

Los alias planos seguirán disponibles hasta el **2026-08-30**; este período solo se aplica al acceso mediante alias planos, no a la forma anidada, que es el contrato canónico del entorno de ejecución. La anotación `@deprecated` de TypeScript de cada alias plano indica su sustituto anidado exacto. Ejemplos habituales:

- `id`, `timestamp` e `isBatched` se trasladan a `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` y `untrustedStructuredContext` se trasladan a `payload`.
- `to`, `chatId`, los campos del remitente y propios, `sendComposing`, `reply(...)` y `sendMedia(...)` se trasladan a `platform`.
- Los campos `replyTo*` se trasladan a `quote`; los campos de asunto, participante y mención del grupo se trasladan a `group`.

`payload.untrustedStructuredContext` se extrae de las cargas útiles entrantes del proveedor. Los plugins deben inspeccionar `label`, `source` y `type` antes de tratar su `payload` como fuente autorizada.

### Campos de admisión entrantes de WhatsApp

Los mensajes aceptados de devoluciones de llamada de WhatsApp incluyen `admission`, un envoltorio seguro para exposición pública de la decisión de control de acceso que admitió el mensaje. El código nuevo de devoluciones de llamada debe leer los datos de admisión de `msg.admission` en lugar de los antiguos campos de admisión de nivel superior.

Los campos de nivel superior seguirán disponibles hasta el **2026-08-30**. La anotación `@deprecated` de TypeScript de cada campo indica su sustituto:

- `from` y `conversationId` se trasladan a `admission.conversation.id`.
- `accountId` se traslada a `admission.accountId`.
- `accessControlPassed` es una vista de compatibilidad derivada de `admission.ingress.decision === "allow"`; en los mensajes que ya incluyen `admission`, escribir el booleano antiguo no modifica el grafo de entrada.
- `chatType` se traslada a `admission.conversation.kind`.

## Paquete del inspector de plugins

El inspector de plugins debe residir fuera del repositorio principal de OpenClaw como un paquete o repositorio independiente respaldado por los contratos versionados de compatibilidad y manifiesto. La CLI inicial debe ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Debe emitir la validación del manifiesto y del esquema, la versión de compatibilidad del contrato que se está comprobando, comprobaciones de los metadatos de instalación y origen, comprobaciones de importación de rutas en frío y advertencias de obsolescencia y compatibilidad. Utiliza `--json` para obtener una salida estable y legible por máquinas en las anotaciones de CI. El núcleo de OpenClaw debe exponer los contratos y datos de prueba que pueda consumir el inspector, pero no debe publicar el binario del inspector desde el paquete principal `openclaw`.

### Ruta de aceptación para mantenedores

Utiliza Blacksmith Testbox respaldado por Crabbox para la ruta de aceptación de paquetes instalables al validar el inspector externo con paquetes de plugins de OpenClaw. Ejecútalo desde una copia de trabajo limpia de OpenClaw después de compilar el paquete:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Mantén esta ruta como opcional para los mantenedores, ya que instala un paquete externo de npm y puede inspeccionar paquetes de plugins clonados fuera del repositorio. Las protecciones del repositorio local cubren el mapa de exportaciones del SDK, los metadatos del registro de compatibilidad, la reducción progresiva de importaciones obsoletas del SDK y los límites de importación de las extensiones incluidas; la prueba del inspector en Testbox cubre el paquete tal como lo consumen los autores de plugins externos.

## Notas de la versión

Las notas de la versión deben incluir las próximas obsolescencias de plugins con sus fechas previstas y enlaces a la documentación de migración antes de que una ruta de compatibilidad pase a `removal-pending` o `removed`.
