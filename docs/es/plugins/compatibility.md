---
read_when:
    - Mantienes un Plugin de OpenClaw
    - Ves una advertencia de compatibilidad de plugins
    - Está planificando una migración del SDK de Plugin o del manifiesto
summary: Contratos de compatibilidad de Plugin, metadatos de obsolescencia y expectativas de migración
title: Compatibilidad de Plugin
x-i18n:
    generated_at: "2026-05-11T20:43:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantiene los contratos antiguos de plugins conectados mediante adaptadores de compatibilidad con nombre antes de eliminarlos. Esto protege los plugins integrados y externos existentes mientras evolucionan los contratos del SDK, el manifiesto, la configuración inicial, la configuración y el runtime de agentes.

## Registro de compatibilidad

Los contratos de compatibilidad de plugins se rastrean en el registro central en
`src/plugins/compat/registry.ts`.

Cada registro tiene:

- un código de compatibilidad estable
- estado: `active`, `deprecated`, `removal-pending` o `removed`
- propietario: SDK, configuración, configuración inicial, canal, proveedor, ejecución de plugins, runtime de agentes
  o núcleo
- fechas de introducción y obsolescencia cuando corresponda
- guía de reemplazo
- documentación, diagnósticos y pruebas que cubren el comportamiento antiguo y el nuevo

El registro es la fuente para la planificación de mantenedores y futuras comprobaciones del inspector de plugins. Si cambia un comportamiento orientado a plugins, agrega o actualiza el registro de compatibilidad en el mismo cambio que agrega el adaptador.

La compatibilidad de reparación y migración de Doctor se rastrea por separado en
`src/commands/doctor/shared/deprecation-compat.ts`. Esos registros cubren formas antiguas de configuración, diseños del libro mayor de instalaciones y adaptadores de reparación que quizá deban seguir disponibles después de que se elimine la ruta de compatibilidad del runtime.

Los barridos de release deben revisar ambos registros. No elimines una migración de doctor solo porque haya expirado el registro de compatibilidad de runtime o configuración correspondiente; primero verifica que no haya una ruta de actualización compatible que todavía necesite la reparación. También vuelve a validar cada anotación de reemplazo durante la planificación de release, porque la propiedad de plugins y la huella de configuración pueden cambiar a medida que proveedores y canales salen del núcleo.

## Paquete del inspector de plugins

El inspector de plugins debe vivir fuera del repositorio central de OpenClaw como un paquete/repositorio separado respaldado por los contratos versionados de compatibilidad y manifiesto.

El CLI del primer día debe ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Debe emitir:

- validación de manifiesto/esquema
- la versión de compatibilidad del contrato que se está comprobando
- comprobaciones de metadatos de instalación/origen
- comprobaciones de importación de rutas frías
- advertencias de obsolescencia y compatibilidad

Usa `--json` para una salida estable legible por máquinas en anotaciones de CI. El núcleo de OpenClaw debe exponer contratos y fixtures que el inspector pueda consumir, pero no debe publicar el binario del inspector desde el paquete principal `openclaw`.

### Carril de aceptación para mantenedores

Usa Blacksmith Testbox respaldado por Crabbox para el carril de aceptación de paquetes instalables al validar el inspector externo contra paquetes de plugins de OpenClaw. Ejecútalo desde un checkout limpio de OpenClaw después de compilar el paquete:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Mantén este carril como opt-in para mantenedores porque instala un paquete npm externo y puede inspeccionar paquetes de plugins clonados fuera del repositorio. Las protecciones del repositorio local cubren el mapa de exportación del SDK, los metadatos del registro de compatibilidad, la reducción de importaciones obsoletas del SDK y los límites de importación de las extensiones integradas; la prueba del inspector en Testbox cubre el paquete tal como lo consumen los autores de plugins externos.

## Política de obsolescencia

OpenClaw no debe eliminar un contrato de plugin documentado en la misma release que introduce su reemplazo.

La secuencia de migración es:

1. Agregar el nuevo contrato.
2. Mantener el comportamiento antiguo conectado mediante un adaptador de compatibilidad con nombre.
3. Emitir diagnósticos o advertencias cuando los autores de plugins puedan actuar.
4. Documentar el reemplazo y el cronograma.
5. Probar tanto las rutas antiguas como las nuevas.
6. Esperar durante la ventana de migración anunciada.
7. Eliminar solo con aprobación explícita de release con cambios incompatibles.

Los registros obsoletos deben incluir una fecha de inicio de advertencia, reemplazo, enlace de documentación y fecha de eliminación final no más de tres meses después del inicio de la advertencia. No agregues una ruta de compatibilidad obsoleta con una ventana de eliminación indefinida a menos que los mantenedores decidan explícitamente que es compatibilidad permanente y la marquen como `active` en su lugar.

## Áreas de compatibilidad actuales

Los registros de compatibilidad actuales incluyen:

- importaciones amplias heredadas del SDK como `openclaw/plugin-sdk/compat`
- formas heredadas de plugins solo con hooks y `before_agent_start`
- entrypoints heredados de plugins `activate(api)` mientras los plugins migran a
  `register(api)`
- alias heredados del SDK como `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, constructores de estado de `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (reemplazado por subrutas de prueba enfocadas
  `openclaw/plugin-sdk/*`) y los alias de tipo `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist y comportamiento de habilitación de plugins integrados
- metadatos heredados de manifiesto de env-var de proveedores/canales
- hooks heredados de plugins de proveedor y alias de tipo mientras los proveedores pasan a hooks explícitos de catálogo, autenticación, pensamiento, replay y transporte
- alias heredados de runtime como `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` y los obsoletos
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- registro dividido heredado de plugins de memoria mientras los plugins de memoria pasan a
  `registerMemoryCapability`
- helpers heredados del SDK de canales para esquemas de mensajes nativos, control de menciones, formato de sobres entrantes y anidamiento de capacidades de aprobación
- clave de ruta de canal heredada y alias de helpers de destino comparable mientras los plugins pasan a `openclaw/plugin-sdk/channel-route`
- indicios de activación que están siendo reemplazados por propiedad de contribuciones del manifiesto
- fallback de runtime `setup-api` mientras los descriptores de configuración inicial pasan a metadatos fríos
  `setup.requiresRuntime: false`
- hooks `discovery` de proveedor mientras los hooks de catálogo de proveedor pasan a
  `catalog.run(...)`
- metadatos `showConfigured` / `showInSetup` de canal mientras los paquetes de canal pasan a
  `openclaw.channel.exposure`
- claves heredadas de configuración de políticas de runtime mientras doctor migra a los operadores a
  `agentRuntime`
- fallback de metadatos generados de configuración de canales integrados mientras aterrizan metadatos `channelConfigs` con registro primero
- flags de entorno heredados de deshabilitación del registro de plugins persistido y migración de instalaciones mientras los flujos de reparación migran a los operadores a `openclaw plugins registry --refresh` y
  `openclaw doctor --fix`
- rutas heredadas de configuración de búsqueda web, fetch web y x_search propiedad de plugins mientras doctor las migra a `plugins.entries.<plugin>.config`
- configuración creada heredada `plugins.installs` y alias de ruta de carga de plugins integrados mientras los metadatos de instalación pasan al libro mayor de plugins gestionado por estado

El nuevo código de plugins debe preferir el reemplazo listado en el registro y en la guía de migración específica. Los plugins existentes pueden seguir usando una ruta de compatibilidad hasta que la documentación, los diagnósticos y las notas de release anuncien una ventana de eliminación.

## Notas de release

Las notas de release deben incluir próximas obsolescencias de plugins con fechas objetivo y enlaces a la documentación de migración. Esa advertencia debe ocurrir antes de que una ruta de compatibilidad pase a `removal-pending` o `removed`.
