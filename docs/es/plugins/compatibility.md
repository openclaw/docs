---
read_when:
    - Mantienes un Plugin de OpenClaw
    - Ves una advertencia de compatibilidad de Plugin
    - Estás planificando una migración del SDK de Plugin o del manifiesto
summary: Contratos de compatibilidad de Plugin, metadatos de obsolescencia y expectativas de migración
title: Compatibilidad de Plugin
x-i18n:
    generated_at: "2026-04-30T05:52:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantiene conectados los contratos de Plugin antiguos mediante adaptadores de compatibilidad con nombre antes de eliminarlos. Esto protege los plugins empaquetados y externos existentes mientras evolucionan los contratos del SDK, manifiesto, configuración, configuración, y entorno de ejecución del agente.

## Registro de compatibilidad

Los contratos de compatibilidad de Plugin se rastrean en el registro central en `src/plugins/compat/registry.ts`.

Cada registro tiene:

- un código de compatibilidad estable
- estado: `active`, `deprecated`, `removal-pending` o `removed`
- propietario: SDK, configuración, configuración, canal, proveedor, ejecución de Plugin, entorno de ejecución del agente o núcleo
- fechas de introducción y desuso cuando corresponda
- guía de reemplazo
- documentación, diagnósticos y pruebas que cubren el comportamiento antiguo y el nuevo

El registro es la fuente para la planificación de mantenedores y futuras comprobaciones del inspector de plugins. Si cambia un comportamiento orientado a plugins, agrega o actualiza el registro de compatibilidad en el mismo cambio que agrega el adaptador.

La compatibilidad de reparación y migración de doctor se rastrea por separado en `src/commands/doctor/shared/deprecation-compat.ts`. Esos registros cubren formas de configuración antiguas, diseños de libro mayor de instalación y adaptadores de reparación que quizá deban seguir disponibles después de eliminar la ruta de compatibilidad del entorno de ejecución.

Las revisiones de lanzamiento deben comprobar ambos registros. No elimines una migración de doctor solo porque haya vencido el registro de compatibilidad de configuración o entorno de ejecución correspondiente; primero verifica que no haya una ruta de actualización compatible que todavía necesite la reparación. También vuelve a validar cada anotación de reemplazo durante la planificación del lanzamiento porque la propiedad de plugins y la huella de configuración pueden cambiar a medida que los proveedores y canales salen del núcleo.

## Paquete del inspector de plugins

El inspector de plugins debe vivir fuera del repositorio central de OpenClaw como un paquete/repositorio separado respaldado por los contratos versionados de compatibilidad y manifiesto.

La CLI del primer día debe ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Debe emitir:

- validación de manifiesto/esquema
- la versión de compatibilidad del contrato que se está comprobando
- comprobaciones de metadatos de instalación/origen
- comprobaciones de importación de ruta fría
- advertencias de desuso y compatibilidad

Usa `--json` para una salida estable legible por máquina en anotaciones de CI. El núcleo de OpenClaw debe exponer contratos y fixtures que el inspector pueda consumir, pero no debe publicar el binario del inspector desde el paquete principal `openclaw`.

### Carril de aceptación para mantenedores

Usa Blacksmith Testbox para el carril de aceptación de paquete instalable al validar el inspector externo contra paquetes de Plugin de OpenClaw. Ejecútalo desde un checkout limpio de OpenClaw después de compilar el paquete:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Mantén este carril como opt-in para mantenedores porque instala un paquete npm externo y puede inspeccionar paquetes de plugins clonados fuera del repositorio. Las protecciones del repositorio local cubren el mapa de exportación del SDK, los metadatos del registro de compatibilidad, la reducción de importaciones obsoletas del SDK y los límites de importación de extensiones empaquetadas; la prueba del inspector en Testbox cubre el paquete tal como lo consumen autores de plugins externos.

## Política de desuso

OpenClaw no debe eliminar un contrato de Plugin documentado en el mismo lanzamiento que introduce su reemplazo.

La secuencia de migración es:

1. Agrega el contrato nuevo.
2. Mantén el comportamiento antiguo conectado mediante un adaptador de compatibilidad con nombre.
3. Emite diagnósticos o advertencias cuando los autores de plugins puedan actuar.
4. Documenta el reemplazo y el cronograma.
5. Prueba las rutas antigua y nueva.
6. Espera durante la ventana de migración anunciada.
7. Elimina solo con aprobación explícita de lanzamiento con cambios incompatibles.

Los registros obsoletos deben incluir una fecha de inicio de advertencia, reemplazo, enlace a documentación y fecha final de eliminación no mayor a tres meses después de que comiencen las advertencias. No agregues una ruta de compatibilidad obsoleta con una ventana de eliminación indefinida a menos que los mantenedores decidan explícitamente que es compatibilidad permanente y la marquen como `active` en su lugar.

## Áreas de compatibilidad actuales

Los registros de compatibilidad actuales incluyen:

- importaciones amplias heredadas del SDK como `openclaw/plugin-sdk/compat`
- formas de Plugin heredadas solo con hooks y `before_agent_start`
- puntos de entrada de Plugin heredados `activate(api)` mientras los plugins migran a `register(api)`
- alias heredados del SDK como `openclaw/extension-api`, `openclaw/plugin-sdk/channel-runtime`, constructores de estado `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (reemplazado por subrutas de prueba enfocadas `openclaw/plugin-sdk/*`) y los alias de tipo `ClawdbotConfig` / `OpenClawSchemaType`
- comportamiento de lista de permitidos y habilitación de plugins empaquetados
- metadatos de manifiesto heredados de variables de entorno de proveedores/canales
- hooks y alias de tipo de Plugin de proveedor heredados mientras los proveedores pasan a hooks explícitos de catálogo, autenticación, pensamiento, reproducción y transporte
- alias heredados del entorno de ejecución como `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt` y `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` obsoletos
- registro dividido heredado de plugins de memoria mientras los plugins de memoria migran a `registerMemoryCapability`
- helpers heredados del SDK de canales para esquemas de mensajes nativos, control de menciones, formato de envoltorios entrantes y anidamiento de capacidad de aprobación
- alias heredados de clave de ruta de canal y helpers de destino comparable mientras los plugins migran a `openclaw/plugin-sdk/channel-route`
- sugerencias de activación que se están reemplazando por la propiedad de contribución del manifiesto
- carga implícita obsoleta de sidecars al inicio para plugins que no han declarado `activation.onStartup`; los mantenedores pueden probar el comportamiento futuro más estricto con `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`
- fallback del entorno de ejecución de `setup-api` mientras los descriptores de configuración migran a metadatos fríos `setup.requiresRuntime: false`
- hooks `discovery` de proveedor mientras los hooks de catálogo de proveedores migran a `catalog.run(...)`
- metadatos `showConfigured` / `showInSetup` de canal mientras los paquetes de canal migran a `openclaw.channel.exposure`
- claves heredadas de configuración de política de entorno de ejecución mientras doctor migra operadores a `agentRuntime`
- fallback de metadatos generados de configuración de canal empaquetado mientras llegan los metadatos `channelConfigs` con registro como prioridad
- flags de entorno de deshabilitación del registro de plugins persistido y migración de instalación mientras los flujos de reparación migran operadores a `openclaw plugins registry --refresh` y `openclaw doctor --fix`
- rutas de configuración heredadas de búsqueda web, recuperación web y x_search propiedad de plugins mientras doctor las migra a `plugins.entries.<plugin>.config`
- configuración heredada escrita por el autor `plugins.installs` y alias de ruta de carga de Plugin empaquetado mientras los metadatos de instalación pasan al libro mayor de plugins administrado por estado

El código nuevo de Plugin debe preferir el reemplazo listado en el registro y en la guía de migración específica. Los plugins existentes pueden seguir usando una ruta de compatibilidad hasta que la documentación, los diagnósticos y las notas de lanzamiento anuncien una ventana de eliminación.

## Notas de lanzamiento

Las notas de lanzamiento deben incluir próximos desusos de plugins con fechas objetivo y enlaces a la documentación de migración. Esa advertencia debe ocurrir antes de que una ruta de compatibilidad pase a `removal-pending` o `removed`.
