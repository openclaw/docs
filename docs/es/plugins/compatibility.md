---
read_when:
    - Mantienes un Plugin de OpenClaw
    - Ves una advertencia de compatibilidad de Plugin
    - Estás planificando una migración de SDK o manifiesto de Plugin
summary: Contratos de compatibilidad de Plugin, metadatos de deprecación y expectativas de migración
title: Compatibilidad de Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw mantiene los contratos antiguos de Plugin conectados mediante adaptadores de compatibilidad con nombre antes de eliminarlos. Esto protege los plugins existentes, tanto incluidos como externos, mientras evolucionan los contratos del SDK, manifiesto, setup, configuración y entorno de ejecución del agente.

## Registro de compatibilidad

Los contratos de compatibilidad de Plugin se rastrean en el registro central en
`src/plugins/compat/registry.ts`.

Cada registro tiene:

- un código de compatibilidad estable
- estado: `active`, `deprecated`, `removal-pending` o `removed`
- propietario: SDK, config, setup, channel, provider, ejecución de plugin, entorno de ejecución del agente o core
- fechas de introducción y desaprobación cuando corresponda
- guía de reemplazo
- docs, diagnósticos y pruebas que cubren el comportamiento antiguo y el nuevo

El registro es la fuente para la planificación de mantenimiento y futuras comprobaciones del inspector de plugins. Si cambia un comportamiento de cara al plugin, agrega o actualiza el registro de compatibilidad en el mismo cambio que añade el adaptador.

La compatibilidad de reparación y migración de Doctor se rastrea por separado en
`src/commands/doctor/shared/deprecation-compat.ts`. Esos registros cubren formas antiguas de configuración, diseños antiguos del registro de instalación y shims de reparación que quizá deban seguir disponibles después de que se elimine la ruta de compatibilidad en tiempo de ejecución.

Las revisiones de release deben comprobar ambos registros. No elimines una migración de Doctor solo porque haya caducado el registro de compatibilidad de runtime o configuración correspondiente; primero verifica que no exista una ruta de actualización compatible que todavía necesite la reparación. También vuelve a validar cada anotación de reemplazo durante la planificación de la release, porque la propiedad del plugin y la huella de configuración pueden cambiar a medida que providers y channels salen del core.

## Paquete del inspector de plugins

El inspector de plugins debe vivir fuera del repo core de OpenClaw como un paquete/repositorio separado respaldado por los contratos versionados de compatibilidad y manifiesto.

La CLI del día uno debería ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Debería emitir:

- validación de manifiesto/esquema
- la versión del contrato de compatibilidad que se está comprobando
- comprobaciones de metadatos de instalación/origen
- comprobaciones de importación de ruta fría
- advertencias de desaprobación y compatibilidad

Usa `--json` para una salida estable legible por máquina en anotaciones de CI. El
core de OpenClaw debe exponer contratos y fixtures que el inspector pueda consumir, pero no debe publicar el binario del inspector desde el paquete principal `openclaw`.

## Política de desaprobación

OpenClaw no debe eliminar un contrato de Plugin documentado en la misma release
en la que introduce su reemplazo.

La secuencia de migración es:

1. Añadir el contrato nuevo.
2. Mantener el comportamiento antiguo conectado mediante un adaptador de compatibilidad con nombre.
3. Emitir diagnósticos o advertencias cuando los autores de plugins puedan actuar.
4. Documentar el reemplazo y el calendario.
5. Probar tanto la ruta antigua como la nueva.
6. Esperar durante la ventana de migración anunciada.
7. Eliminar solo con aprobación explícita de release con cambios incompatibles.

Los registros desaprobados deben incluir una fecha de inicio de advertencia, reemplazo, enlace a docs y fecha final de eliminación no superior a tres meses desde el inicio de la advertencia. No añadas una ruta de compatibilidad desaprobada con una ventana de eliminación indefinida, a menos que los maintainers decidan explícitamente que es compatibilidad permanente y la marquen como `active`.

## Áreas actuales de compatibilidad

Los registros actuales de compatibilidad incluyen:

- importaciones heredadas amplias del SDK como `openclaw/plugin-sdk/compat`
- formas heredadas de plugins solo con hooks y `before_agent_start`
- puntos de entrada heredados `activate(api)` mientras los plugins migran a
  `register(api)`
- alias heredados del SDK como `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, constructores de estado de `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` y los alias de tipo `ClawdbotConfig` /
  `OpenClawSchemaType`
- comportamiento de lista de permitidos y habilitación de plugins incluidos
- metadatos heredados de manifiesto de variables de entorno de provider/channel
- hooks y alias de tipo heredados de plugins de provider mientras los providers pasan a
  hooks explícitos de catálogo, autenticación, Thinking, repetición y transporte
- alias heredados de runtime como `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession` y `api.runtime.stt`
- registro dividido heredado de memory-plugin mientras los plugins de memoria migran a
  `registerMemoryCapability`
- helpers heredados del SDK de channel para esquemas nativos de mensajes, compuerta de menciones,
  formateo de sobres entrantes y anidación de capacidades de aprobación
- pistas de activación que están siendo reemplazadas por propiedad de contribución del manifiesto
- respaldo de runtime `setup-api` mientras los descriptores de setup pasan a metadatos fríos
  `setup.requiresRuntime: false`
- hooks `discovery` de provider mientras los hooks de catálogo de provider pasan a
  `catalog.run(...)`
- metadatos `showConfigured` / `showInSetup` de channel mientras los paquetes channel pasan
  a `openclaw.channel.exposure`
- claves heredadas de configuración de política de runtime mientras Doctor migra a los operators hacia
  `agentRuntime`
- respaldo de metadatos de configuración de channel incluido generado mientras aterrizan
  los metadatos `channelConfigs` con prioridad de registro
- deshabilitación persistida del registro de plugins y flags de entorno de migración de instalación mientras
  los flujos de reparación migran a los operators hacia `openclaw plugins registry --refresh` y
  `openclaw doctor --fix`
- rutas heredadas de configuración propiedad del plugin para búsqueda web, recuperación web y x_search mientras
  Doctor las migra a `plugins.entries.<plugin>.config`
- configuración heredada escrita por `plugins.installs` y alias de ruta de carga de plugins incluidos mientras
  los metadatos de instalación se trasladan al libro mayor de plugins gestionado por estado

El código nuevo de plugins debe preferir el reemplazo indicado en el registro y en la
guía específica de migración. Los plugins existentes pueden seguir usando una ruta de compatibilidad
hasta que la documentación, los diagnósticos y las notas de la release anuncien una ventana de eliminación.

## Notas de la release

Las notas de la release deben incluir próximas desaprobaciones de plugins con fechas objetivo y
enlaces a la documentación de migración. Esa advertencia debe producirse antes de que una ruta de compatibilidad pase a `removal-pending` o `removed`.
