---
read_when:
    - Mantienes un Plugin de OpenClaw
    - Ves una advertencia de compatibilidad del plugin
    - Estás planificando una migración del SDK de Plugin o del manifiesto
summary: Contratos de compatibilidad de Plugin, metadatos de obsolescencia y expectativas de migración
title: Compatibilidad de Plugin
x-i18n:
    generated_at: "2026-06-27T12:11:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantiene los contratos antiguos de plugins conectados mediante
adaptadores de compatibilidad con nombre antes de eliminarlos. Esto protege los
plugins incluidos y externos existentes mientras evolucionan los contratos del
SDK, el manifiesto, la configuración inicial, la configuración y el runtime del
agente.

## Registro de compatibilidad

Los contratos de compatibilidad de plugins se rastrean en el registro central en
`src/plugins/compat/registry.ts`.

Cada registro tiene:

- un código de compatibilidad estable
- estado: `active`, `deprecated`, `removal-pending` o `removed`
- propietario: SDK, configuración, configuración inicial, canal, proveedor,
  ejecución de Plugin, runtime de agente o núcleo
- fechas de introducción y obsolescencia cuando corresponda
- guía de reemplazo
- documentación, diagnósticos y pruebas que cubren el comportamiento antiguo y el
  nuevo

El registro es la fuente para la planificación de mantenedores y futuras
comprobaciones del inspector de plugins. Si cambia un comportamiento orientado a
plugins, agrega o actualiza el registro de compatibilidad en el mismo cambio que
agrega el adaptador.

La compatibilidad de reparación y migración de doctor se rastrea por separado en
`src/commands/doctor/shared/deprecation-compat.ts`. Esos registros cubren formas
antiguas de configuración, diseños de registro de instalación y shims de
reparación que quizá deban seguir disponibles después de eliminar la ruta de
compatibilidad del runtime.

Los barridos de lanzamiento deben revisar ambos registros. No elimines una
migración de doctor solo porque el registro de compatibilidad de runtime o
configuración correspondiente haya expirado; primero verifica que no haya una
ruta de actualización compatible que aún necesite la reparación. También
revalida cada anotación de reemplazo durante la planificación del lanzamiento,
porque la propiedad de plugins y la huella de configuración pueden cambiar a
medida que los proveedores y canales salen del núcleo.

## Paquete del inspector de plugins

El inspector de plugins debe vivir fuera del repositorio principal de OpenClaw
como un paquete/repositorio separado respaldado por los contratos versionados de
compatibilidad y manifiesto.

La CLI del primer día debe ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Debe emitir:

- validación de manifiesto/esquema
- la versión de compatibilidad de contrato que se está comprobando
- comprobaciones de metadatos de instalación/fuente
- comprobaciones de importación en ruta fría
- advertencias de obsolescencia y compatibilidad

Usa `--json` para una salida estable legible por máquinas en anotaciones de CI.
El núcleo de OpenClaw debe exponer contratos y fixtures que el inspector pueda
consumir, pero no debe publicar el binario del inspector desde el paquete
principal `openclaw`.

### Carril de aceptación para mantenedores

Usa Blacksmith Testbox respaldado por Crabbox para el carril de aceptación del
paquete instalable al validar el inspector externo contra paquetes de plugins de
OpenClaw. Ejecútalo desde un checkout limpio de OpenClaw después de compilar el
paquete:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Mantén este carril como opt-in para mantenedores porque instala un paquete npm
externo y puede inspeccionar paquetes de plugins clonados fuera del repositorio.
Las guardas del repositorio local cubren el mapa de exportación del SDK, los
metadatos del registro de compatibilidad, la reducción de importaciones
obsoletas del SDK y los límites de importación de extensiones incluidas; la
prueba del inspector en Testbox cubre el paquete como lo consumen los autores de
plugins externos.

## Política de obsolescencia

OpenClaw no debe eliminar un contrato documentado de Plugin en el mismo
lanzamiento que introduce su reemplazo.

La secuencia de migración es:

1. Agregar el contrato nuevo.
2. Mantener el comportamiento antiguo conectado mediante un adaptador de
   compatibilidad con nombre.
3. Emitir diagnósticos o advertencias cuando los autores de plugins puedan
   actuar.
4. Documentar el reemplazo y el cronograma.
5. Probar las rutas antigua y nueva.
6. Esperar durante la ventana de migración anunciada.
7. Eliminar solo con aprobación explícita de lanzamiento con cambios
   incompatibles.

Los registros obsoletos deben incluir una fecha de inicio de advertencia,
reemplazo, enlace de documentación y fecha final de eliminación no mayor a tres
meses después de que empiece la advertencia. No agregues una ruta de
compatibilidad obsoleta con una ventana de eliminación indefinida a menos que
los mantenedores decidan explícitamente que es compatibilidad permanente y la
marquen como `active`.

## Áreas de compatibilidad actuales

Los registros de compatibilidad actuales incluyen:

- importaciones amplias heredadas del SDK, como `openclaw/plugin-sdk/compat`
- formas heredadas de Plugin solo con hooks y `before_agent_start`
- nombres heredados del hook de limpieza `api.on("deactivate", ...)` mientras
  los plugins migran a `gateway_stop`
- entrypoints heredados de Plugin `activate(api)` mientras los plugins migran a
  `register(api)`
- alias heredados del SDK como `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, constructores de estado
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils`
  (reemplazado por subrutas de prueba enfocadas `openclaw/plugin-sdk/*`) y los
  alias de tipo `ClawdbotConfig` / `OpenClawSchemaType`
- comportamiento de allowlist y habilitación de plugins incluidos
- metadatos de manifiesto heredados de variables de entorno de proveedor/canal
- hooks y alias de tipo heredados de Plugin de proveedor mientras los
  proveedores pasan a hooks explícitos de catálogo, autenticación, razonamiento,
  reproducción y transporte
- alias heredados de runtime como `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` y
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  obsoletos
- campos planos de callback `WebInboundMessage` de WhatsApp, como `body`,
  `chatId`, `reply(...)` y `mediaPath`, mientras los consumidores de callbacks
  migran a los contextos anidados `event`, `payload`, `quote`, `group` y
  `platform` de `WebInboundCallbackMessage`
- campos de admisión de nivel superior `WebInboundMessage` de WhatsApp, como
  `from`, `conversationId`, `accountId`, `accessControlPassed` y `chatType`,
  mientras los consumidores de callbacks migran al sobre `admission`
- registro dividido heredado de Plugin de memoria mientras los plugins de
  memoria pasan a `registerMemoryCapability`
- registro heredado de proveedor de embeddings específico de memoria mientras
  los proveedores de embeddings pasan a `api.registerEmbeddingProvider(...)` y
  `contracts.embeddingProviders`
- helpers heredados del SDK de canal para esquemas de mensajes nativos, control
  de menciones, formato de sobres entrantes y anidamiento de capacidad de
  aprobación
- alias heredados de clave de ruta de canal y helper de destino comparable
  mientras los plugins pasan a `openclaw/plugin-sdk/channel-route`
- sugerencias de activación que están siendo reemplazadas por propiedad de
  contribuciones de manifiesto
- fallback de runtime `setup-api` mientras los descriptores de configuración
  inicial pasan a metadatos fríos `setup.requiresRuntime: false`
- hooks `discovery` de proveedor mientras los hooks de catálogo de proveedores
  pasan a `catalog.run(...)`
- metadatos `showConfigured` / `showInSetup` de canal mientras los paquetes de
  canal pasan a `openclaw.channel.exposure`
- claves heredadas de configuración de política de runtime mientras doctor migra
  a los operadores a `agentRuntime`
- fallback generado de metadatos de configuración de canal incluido mientras
  aterrizan los metadatos `channelConfigs` con prioridad de registro
- flags de entorno persistidos de deshabilitación de registro de plugins y
  migración de instalación mientras los flujos de reparación migran a los
  operadores a `openclaw plugins registry --refresh` y `openclaw doctor --fix`
- rutas heredadas de configuración de búsqueda web, obtención web y x_search
  propiedad de plugins mientras doctor las migra a
  `plugins.entries.<plugin>.config`
- configuración creada heredada `plugins.installs` y alias de ruta de carga de
  Plugin incluido mientras los metadatos de instalación pasan al registro de
  plugins gestionado por estado

El código nuevo de plugins debe preferir el reemplazo listado en el registro y
en la guía de migración específica. Los plugins existentes pueden seguir usando
una ruta de compatibilidad hasta que la documentación, los diagnósticos y las
notas de lanzamiento anuncien una ventana de eliminación.

### Alias Planos de Callback Entrante de WhatsApp

Los callbacks de runtime de WhatsApp entregan `WebInboundMessage`: los contextos
anidados canónicos `event`, `payload`, `quote`, `group` y `platform`, además de
alias planos obsoletos para los campos de callback entregados. El código nuevo
de callback debe leer los contextos anidados. El código que construye mensajes
de callback anidados limpios puede usar `WebInboundCallbackMessage`; los
listeners de compatibilidad que todavía inyectan mensajes planos antiguos de
prueba o Plugin deben usar `LegacyFlatWebInboundMessage` o
`WebInboundMessageInput`.

Los alias planos siguen disponibles hasta **2026-08-30**. Esa ventana de
eliminación solo aplica al acceso mediante alias planos; la forma anidada de
callback es el contrato canónico de runtime. Las anotaciones `@deprecated` de
TypeScript en cada alias plano nombran su reemplazo anidado exacto. Ejemplos
comunes:

- `id`, `timestamp` e `isBatched` pasan a estar bajo `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` y
  `untrustedStructuredContext` pasan a estar bajo `payload`.
- `to`, `chatId`, campos de remitente/propio, `sendComposing`, `reply(...)` y
  `sendMedia(...)` pasan a estar bajo `platform`.
- Los campos `replyTo*` pasan a estar bajo `quote`, y los campos de asunto de
  grupo/participante/mención pasan a estar bajo `group`.

`payload.untrustedStructuredContext` se extrae de los payloads entrantes del
proveedor. Los plugins deben inspeccionar `label`, `source` y `type` antes de
tratar su `payload` como autoritativo.

### Campos de Admisión Entrante de WhatsApp

Los mensajes de callback aceptados de WhatsApp ahora llevan `admission`, un
sobre seguro para público para la decisión de control de acceso que admitió el
mensaje. El código nuevo de callback debe leer los hechos de admisión desde
`msg.admission` en lugar de los campos de admisión de nivel superior más
antiguos.

Los campos de nivel superior siguen disponibles hasta **2026-08-30**. Las
anotaciones `@deprecated` de TypeScript nombran cada reemplazo:

- `from` y `conversationId` pasan a `admission.conversation.id`.
- `accountId` pasa a `admission.accountId`.
- `accessControlPassed` es una vista de compatibilidad derivada de
  `admission.ingress.decision === "allow"`; en mensajes que ya llevan
  `admission`, escribir el booleano heredado no reescribe el grafo de ingress.
- `chatType` pasa a `admission.conversation.kind`.

## Notas de lanzamiento

Las notas de lanzamiento deben incluir próximas obsolescencias de plugins con
fechas objetivo y enlaces a la documentación de migración. Esa advertencia debe
ocurrir antes de que una ruta de compatibilidad pase a `removal-pending` o
`removed`.
