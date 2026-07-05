---
read_when:
    - Mantienes un Plugin de OpenClaw
    - Aparece una advertencia de compatibilidad de Plugin
    - Estás planificando una migración del SDK de Plugin o del manifiesto
summary: Contratos de compatibilidad de Plugin, metadatos de desuso y expectativas de migración
title: Compatibilidad de Plugin
x-i18n:
    generated_at: "2026-07-05T11:29:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantiene los contratos antiguos de plugins conectados mediante adaptadores de compatibilidad con nombre antes de eliminarlos. Esto protege los plugins incluidos y externos existentes mientras evolucionan los contratos del SDK, el manifiesto, la configuración inicial, la configuración y el runtime de agentes.

## Registro de compatibilidad

Los contratos de compatibilidad de plugins se rastrean en el registro central en
`src/plugins/compat/registry.ts`. Cada registro tiene:

- un código de compatibilidad estable
- estado: `active`, `deprecated`, `removal-pending` o `removed`
- propietario: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime` o `core`
- fechas de introducción y desuso cuando corresponda
- orientación de reemplazo
- documentación, diagnósticos y pruebas que cubren el comportamiento antiguo y el nuevo

El registro es la fuente para la planificación de mantenedores y futuras comprobaciones del inspector de plugins. Si cambia un comportamiento orientado a plugins, agrega o actualiza el registro de compatibilidad en el mismo cambio que agrega el adaptador.

La compatibilidad de reparaciones y migraciones de doctor se rastrea por separado en
`src/commands/doctor/shared/deprecation-compat.ts`. Esos registros cubren formas antiguas de configuración, diseños del registro de instalaciones y shims de reparación que quizá deban permanecer disponibles después de que se elimine la ruta de compatibilidad del runtime.

Los barridos de release deben comprobar ambos registros. No elimines una migración de doctor solo porque haya expirado el registro de compatibilidad de runtime o de configuración correspondiente; primero verifica que no haya una ruta de actualización compatible que todavía necesite la reparación. Vuelve a validar también cada anotación de reemplazo durante la planificación de release, ya que la propiedad de plugins y la huella de configuración pueden cambiar a medida que los proveedores y canales salen del core.

## Política de desuso

OpenClaw no debe eliminar un contrato de plugin documentado en el mismo release que introduce su reemplazo. Secuencia de migración:

1. Agrega el contrato nuevo.
2. Mantén el comportamiento antiguo conectado mediante un adaptador de compatibilidad con nombre.
3. Emite diagnósticos o advertencias cuando los autores de plugins puedan actuar.
4. Documenta el reemplazo y el calendario.
5. Prueba las rutas antigua y nueva.
6. Espera durante la ventana de migración anunciada.
7. Elimina solo con aprobación explícita de release con cambios incompatibles.

Los registros obsoletos deben incluir una fecha de inicio de advertencia, reemplazo, enlace de documentación y una fecha final de eliminación no mayor a tres meses después de que comiencen las advertencias. No agregues una ruta de compatibilidad obsoleta con una ventana de eliminación abierta a menos que los mantenedores decidan explícitamente que es compatibilidad permanente y la marquen como `active` en su lugar.

## Áreas de compatibilidad actuales

Actualmente, el registro rastrea alrededor de 70 códigos de compatibilidad en estas áreas. El código nuevo de plugins debe usar el reemplazo de cada área y de la guía de migración específica; los plugins existentes pueden seguir usando una ruta de compatibilidad hasta que la documentación, los diagnósticos y las notas de release anuncien una ventana de eliminación.

- importaciones amplias heredadas del SDK, como `openclaw/plugin-sdk/compat`
- formas heredadas de plugins solo con hooks y `before_agent_start`
- nombres heredados de hooks de limpieza `api.on("deactivate", ...)` mientras los plugins migran a `gateway_stop`
- puntos de entrada heredados de plugins `activate(api)` mientras los plugins migran a
  `register(api)`
- alias heredados del SDK como `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, constructores de estado
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (reemplazado por subrutas de prueba enfocadas
  `openclaw/plugin-sdk/*`) y los alias de tipo `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist de plugins incluidos y comportamiento de habilitación
- metadatos heredados de manifiesto de variables de entorno de proveedores/canales
- hooks heredados de plugins de proveedor y alias de tipo mientras los proveedores migran a hooks explícitos de catálogo, autenticación, razonamiento, replay y transporte
- alias heredados de runtime como `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` y los obsoletos
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- campos planos de callback de WhatsApp `WebInboundMessage` (ver abajo)
- campos de admisión de nivel superior de WhatsApp `WebInboundMessage` (ver abajo)
- registro dividido heredado de plugins de memoria mientras los plugins de memoria migran a
  `registerMemoryCapability`
- registro heredado específico de memoria de proveedores de embeddings mientras los proveedores de embeddings migran a `api.registerEmbeddingProvider(...)` y
  `contracts.embeddingProviders`
- helpers heredados del SDK de canales para esquemas de mensajes nativos, control de menciones, formato de sobres entrantes y anidamiento de capacidades de aprobación
- alias heredados de helpers de clave de ruta de canal y objetivo comparable mientras los plugins migran a `openclaw/plugin-sdk/channel-route`
- sugerencias de activación que se reemplazan por propiedad de contribuciones del manifiesto
- fallback de runtime de `setup-api` mientras los descriptores de configuración inicial migran a metadatos fríos `setup.requiresRuntime: false`
- hooks `discovery` de proveedores mientras los hooks de catálogo de proveedores migran a
  `catalog.run(...)`
- metadatos `showConfigured` / `showInSetup` de canales mientras los paquetes de canales migran a `openclaw.channel.exposure`
- claves heredadas de configuración de políticas de runtime mientras doctor migra operadores a
  `agentRuntime`
- fallback de metadatos generados de configuración de canales incluidos mientras llegan los metadatos `channelConfigs` con registro primero
- flags de entorno heredados de deshabilitación del registro persistido de plugins y migración de instalaciones mientras los flujos de reparación migran operadores a `openclaw plugins registry --refresh`
  y `openclaw doctor --fix`
- rutas heredadas de configuración de búsqueda web, obtención web y x_search propiedad de plugins mientras doctor las migra a `plugins.entries.<plugin>.config`
- configuración heredada creada con `plugins.installs` y alias de rutas de carga de plugins incluidos mientras los metadatos de instalación se mueven al ledger de plugins administrado por estado

### Alias planos de callbacks entrantes de WhatsApp

Los callbacks del runtime de WhatsApp entregan `WebInboundMessage`: los contextos canónicos anidados `event`, `payload`, `quote`, `group` y `platform`, además de alias planos obsoletos para los campos de callback enviados. El código nuevo de callbacks debe leer los contextos anidados. El código que construye mensajes de callback anidados limpios puede usar `WebInboundCallbackMessage`; los listeners de compatibilidad que todavía inyectan mensajes antiguos planos de prueba o de plugins deben usar
`LegacyFlatWebInboundMessage` o `WebInboundMessageInput`.

Los alias planos permanecen disponibles hasta el **2026-08-30**; esa ventana se aplica solo al acceso mediante alias planos, no a la forma anidada, que es el contrato canónico del runtime. La anotación TypeScript `@deprecated` de cada alias plano nombra su reemplazo anidado exacto. Ejemplos comunes:

- `id`, `timestamp` e `isBatched` se mueven bajo `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`,
  y `untrustedStructuredContext` se mueven bajo `payload`.
- `to`, `chatId`, campos de remitente/propio, `sendComposing`, `reply(...)` y
  `sendMedia(...)` se mueven bajo `platform`.
- Los campos `replyTo*` se mueven bajo `quote`; los campos de asunto/participante/mención de grupo se mueven bajo `group`.

`payload.untrustedStructuredContext` se extrae de payloads de proveedores entrantes. Los plugins deben inspeccionar `label`, `source` y `type` antes de tratar su `payload` como autoritativo.

### Campos de admisión entrante de WhatsApp

Los mensajes de callback aceptados de WhatsApp llevan `admission`, un sobre público seguro para la decisión de control de acceso que admitió el mensaje. El código nuevo de callbacks debe leer los datos de admisión desde `msg.admission` en lugar de los campos de admisión de nivel superior más antiguos.

Los campos de nivel superior permanecen disponibles hasta el **2026-08-30**. La anotación TypeScript `@deprecated` de cada campo nombra su reemplazo:

- `from` y `conversationId` se mueven a `admission.conversation.id`.
- `accountId` se mueve a `admission.accountId`.
- `accessControlPassed` es una vista de compatibilidad derivada de
  `admission.ingress.decision === "allow"`; en mensajes que ya llevan
  `admission`, escribir el booleano heredado no reescribe el grafo de ingreso.
- `chatType` se mueve a `admission.conversation.kind`.

## Paquete inspector de plugins

El inspector de plugins debe vivir fuera del repositorio core de OpenClaw como un paquete/repositorio separado respaldado por los contratos versionados de compatibilidad y manifiesto. La CLI inicial debe ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Debe emitir validación de manifiesto/esquema, la versión de compatibilidad de contrato que se está comprobando, comprobaciones de metadatos de instalación/fuente, comprobaciones de importación de ruta fría y advertencias de desuso/compatibilidad. Usa `--json` para salida estable legible por máquina en anotaciones de CI. El core de OpenClaw debe exponer contratos y fixtures que el inspector pueda consumir, pero no debe publicar el binario del inspector desde el paquete principal `openclaw`.

### Carril de aceptación para mantenedores

Usa Blacksmith Testbox respaldado por Crabbox para el carril de aceptación de paquete instalable al validar el inspector externo contra paquetes de plugins de OpenClaw. Ejecútalo desde un checkout limpio de OpenClaw después de construir el paquete:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Mantén este carril como opt-in para mantenedores, ya que instala un paquete npm externo y puede inspeccionar paquetes de plugins clonados fuera del repositorio. Las protecciones locales del repositorio cubren el mapa de exportaciones del SDK, los metadatos del registro de compatibilidad, la reducción de importaciones obsoletas del SDK y los límites de importación de extensiones incluidas; la prueba del inspector en Testbox cubre el paquete tal como lo consumen los autores externos de plugins.

## Notas de release

Las notas de release deben incluir los próximos desusos de plugins con fechas objetivo y enlaces a documentación de migración, antes de que una ruta de compatibilidad pase a
`removal-pending` o `removed`.
