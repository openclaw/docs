---
read_when:
    - Mantienes un plugin de OpenClaw
    - Aparece una advertencia de compatibilidad de Plugin
    - Estás planificando una migración del SDK de Plugin o del manifiesto
summary: Contratos de compatibilidad de Plugin, metadatos de obsolescencia y expectativas de migración
title: Compatibilidad de Plugin
x-i18n:
    generated_at: "2026-05-02T05:31:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantiene los contratos de plugins antiguos conectados mediante adaptadores de compatibilidad con nombre antes de eliminarlos. Esto protege los plugins integrados y externos existentes mientras evolucionan los contratos del SDK, manifiesto, configuración inicial, configuración y entorno de ejecución del agente.

## Registro de compatibilidad

Los contratos de compatibilidad de Plugin se rastrean en el registro principal en `src/plugins/compat/registry.ts`.

Cada registro tiene:

- un código de compatibilidad estable
- estado: `active`, `deprecated`, `removal-pending` o `removed`
- propietario: SDK, configuración, configuración inicial, canal, proveedor, ejecución de Plugin, entorno de ejecución del agente o núcleo
- fechas de introducción y obsolescencia cuando correspondan
- guía de reemplazo
- documentación, diagnósticos y pruebas que cubren el comportamiento antiguo y el nuevo

El registro es la fuente para la planificación de mantenedores y futuras comprobaciones del inspector de plugins. Si cambia un comportamiento orientado a plugins, añade o actualiza el registro de compatibilidad en el mismo cambio que añade el adaptador.

La compatibilidad de reparación y migración de doctor se rastrea por separado en `src/commands/doctor/shared/deprecation-compat.ts`. Esos registros cubren formas antiguas de configuración, diseños del registro de instalación y shims de reparación que quizá deban seguir disponibles después de que se elimine la ruta de compatibilidad del entorno de ejecución.

Las revisiones de lanzamiento deben comprobar ambos registros. No elimines una migración de doctor solo porque el registro de compatibilidad de entorno de ejecución o configuración correspondiente haya expirado; primero verifica que no haya una ruta de actualización compatible que todavía necesite la reparación. También vuelve a validar cada anotación de reemplazo durante la planificación del lanzamiento, porque la propiedad de los plugins y la huella de configuración pueden cambiar a medida que proveedores y canales salen del núcleo.

## Paquete del inspector de plugins

El inspector de plugins debe vivir fuera del repositorio principal de OpenClaw como un paquete/repositorio separado respaldado por los contratos versionados de compatibilidad y manifiesto.

La CLI del primer día debe ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Debe emitir:

- validación de manifiesto/esquema
- la versión de compatibilidad del contrato que se está comprobando
- comprobaciones de metadatos de instalación/origen
- comprobaciones de importación de ruta fría
- advertencias de obsolescencia y compatibilidad

Usa `--json` para una salida estable legible por máquinas en anotaciones de CI. El núcleo de OpenClaw debe exponer contratos y fixtures que el inspector pueda consumir, pero no debe publicar el binario del inspector desde el paquete principal `openclaw`.

### Carril de aceptación para mantenedores

Usa Blacksmith Testbox para el carril de aceptación de paquete instalable al validar el inspector externo frente a paquetes de Plugin de OpenClaw. Ejecútalo desde un checkout limpio de OpenClaw después de compilar el paquete:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Mantén este carril como opcional para mantenedores porque instala un paquete npm externo y puede inspeccionar paquetes de plugins clonados fuera del repositorio. Las protecciones del repositorio local cubren el mapa de exportación del SDK, los metadatos del registro de compatibilidad, la reducción de importaciones obsoletas del SDK y los límites de importación de extensiones integradas; la prueba del inspector en Testbox cubre el paquete tal como lo consumen los autores de plugins externos.

## Política de obsolescencia

OpenClaw no debe eliminar un contrato de Plugin documentado en el mismo lanzamiento que introduce su reemplazo.

La secuencia de migración es:

1. Añadir el nuevo contrato.
2. Mantener el comportamiento antiguo conectado mediante un adaptador de compatibilidad con nombre.
3. Emitir diagnósticos o advertencias cuando los autores de plugins puedan actuar.
4. Documentar el reemplazo y el calendario.
5. Probar las rutas antigua y nueva.
6. Esperar durante la ventana de migración anunciada.
7. Eliminar solo con aprobación explícita de lanzamiento con cambios incompatibles.

Los registros obsoletos deben incluir una fecha de inicio de advertencia, reemplazo, enlace a documentación y fecha final de eliminación no más de tres meses después de que empiece la advertencia. No añadas una ruta de compatibilidad obsoleta con una ventana de eliminación abierta salvo que los mantenedores decidan explícitamente que es compatibilidad permanente y la marquen como `active` en su lugar.

## Áreas de compatibilidad actuales

Los registros de compatibilidad actuales incluyen:

- importaciones amplias heredadas del SDK como `openclaw/plugin-sdk/compat`
- formas heredadas de plugins solo con hooks y `before_agent_start`
- puntos de entrada heredados de Plugin `activate(api)` mientras los plugins migran a `register(api)`
- alias heredados del SDK como `openclaw/extension-api`, `openclaw/plugin-sdk/channel-runtime`, constructores de estado `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (reemplazado por subrutas de prueba enfocadas `openclaw/plugin-sdk/*`) y los alias de tipo `ClawdbotConfig` / `OpenClawSchemaType`
- comportamiento de lista de permitidos y habilitación de plugins integrados
- metadatos heredados de manifiesto de variables de entorno de proveedores/canales
- hooks heredados de Plugin de proveedor y alias de tipo mientras los proveedores pasan a hooks explícitos de catálogo, autenticación, pensamiento, repetición y transporte
- alias heredados de entorno de ejecución como `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt` y `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` obsoletos
- registro dividido heredado de Plugin de memoria mientras los plugins de memoria pasan a `registerMemoryCapability`
- helpers heredados del SDK de canal para esquemas de mensajes nativos, control de menciones, formato de envoltorio entrante y anidamiento de capacidad de aprobación
- clave de ruta de canal heredada y alias de helper de objetivo comparable mientras los plugins pasan a `openclaw/plugin-sdk/channel-route`
- sugerencias de activación que se están reemplazando por propiedad de contribución de manifiesto
- fallback de entorno de ejecución `setup-api` mientras los descriptores de configuración inicial pasan a metadatos fríos `setup.requiresRuntime: false`
- hooks `discovery` de proveedor mientras los hooks de catálogo de proveedor pasan a `catalog.run(...)`
- metadatos `showConfigured` / `showInSetup` de canal mientras los paquetes de canal pasan a `openclaw.channel.exposure`
- claves heredadas de configuración de política de entorno de ejecución mientras doctor migra a los operadores a `agentRuntime`
- fallback de metadatos generados de configuración de canales integrados mientras llegan los metadatos `channelConfigs` con prioridad de registro
- indicadores de entorno persistidos de deshabilitación del registro de plugins y migración de instalación mientras los flujos de reparación migran a los operadores a `openclaw plugins registry --refresh` y `openclaw doctor --fix`
- rutas de configuración heredadas propiedad de Plugin para búsqueda web, obtención web y x_search mientras doctor las migra a `plugins.entries.<plugin>.config`
- configuración creada heredada `plugins.installs` y alias de ruta de carga de plugins integrados mientras los metadatos de instalación pasan al registro de Plugin gestionado por estado

El código nuevo de Plugin debe preferir el reemplazo indicado en el registro y en la guía de migración específica. Los plugins existentes pueden seguir usando una ruta de compatibilidad hasta que la documentación, los diagnósticos y las notas de lanzamiento anuncien una ventana de eliminación.

## Notas de lanzamiento

Las notas de lanzamiento deben incluir las próximas obsolescencias de Plugin con fechas objetivo y enlaces a la documentación de migración. Esa advertencia debe ocurrir antes de que una ruta de compatibilidad pase a `removal-pending` o `removed`.
