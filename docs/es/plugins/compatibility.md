---
read_when:
    - Mantienes un Plugin de OpenClaw
    - Ves una advertencia de compatibilidad de Plugin
    - Estás planificando una migración del SDK de Plugin o del manifiesto
summary: Contratos de compatibilidad de Plugin, metadatos de deprecación y expectativas de migración
title: Compatibilidad de Plugin
x-i18n:
    generated_at: "2026-04-25T18:19:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 511bd12cff1e72a93091cbb1ac7d75377b0b9d2f016b55f4cdc77293f6172a00
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw mantiene los contratos antiguos de Plugin conectados mediante adaptadores
de compatibilidad con nombre antes de eliminarlos. Esto protege a los
plugins existentes, tanto integrados como externos, mientras evolucionan los contratos del SDK, del manifiesto, de configuración, de la config y del tiempo de ejecución del agente.

## Registro de compatibilidad

Los contratos de compatibilidad de Plugin se registran en el registro central en
`src/plugins/compat/registry.ts`.

Cada registro tiene:

- un código de compatibilidad estable
- estado: `active`, `deprecated`, `removal-pending` o `removed`
- responsable: SDK, config, setup, canal, proveedor, ejecución de Plugin, tiempo de ejecución del agente
  o núcleo
- fechas de introducción y deprecación cuando corresponda
- guía de reemplazo
- documentación, diagnósticos y pruebas que cubren el comportamiento antiguo y el nuevo

El registro es la fuente para la planificación de mantenedores y futuras comprobaciones
del inspector de plugins. Si cambia un comportamiento orientado a plugins, añade o actualiza el
registro de compatibilidad en el mismo cambio que añada el adaptador.

## Paquete del inspector de plugins

El inspector de plugins debe vivir fuera del repositorio central de OpenClaw como un
paquete/repositorio independiente respaldado por los contratos versionados de compatibilidad y manifiesto.

La CLI del primer día debe ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Debe emitir:

- validación de manifiesto/esquema
- la versión de compatibilidad del contrato que se está comprobando
- comprobaciones de metadatos de instalación/origen
- comprobaciones de importación en ruta fría
- advertencias de deprecación y compatibilidad

Usa `--json` para una salida estable legible por máquina en anotaciones de CI. El núcleo de OpenClaw
debe exponer contratos y fixtures que el inspector pueda consumir, pero no debe
publicar el binario del inspector desde el paquete principal `openclaw`.

## Política de deprecación

OpenClaw no debe eliminar un contrato de Plugin documentado en la misma versión
en la que introduce su reemplazo.

La secuencia de migración es:

1. Añadir el nuevo contrato.
2. Mantener el comportamiento anterior conectado mediante un adaptador de compatibilidad con nombre.
3. Emitir diagnósticos o advertencias cuando los autores de plugins puedan actuar.
4. Documentar el reemplazo y el cronograma.
5. Probar tanto la ruta antigua como la nueva.
6. Esperar durante la ventana de migración anunciada.
7. Eliminar solo con aprobación explícita de versión con ruptura.

Los registros deprecados deben incluir una fecha de inicio de advertencia, reemplazo, enlace a documentación
y fecha objetivo de eliminación cuando se conozca.

## Áreas actuales de compatibilidad

Los registros actuales de compatibilidad incluyen:

- importaciones antiguas amplias del SDK como `openclaw/plugin-sdk/compat`
- formas antiguas de Plugin solo con hooks y `before_agent_start`
- comportamiento de allowlist y habilitación de plugins integrados
- metadatos antiguos del manifiesto de variables de entorno de proveedor/canal
- sugerencias de activación que están siendo reemplazadas por la propiedad de contribución del manifiesto
- alias de nombres `embeddedHarness` y `agent-harness` mientras la nomenclatura pública avanza
  hacia `agentRuntime`
- respaldo de metadatos generados de configuración de canal integrado mientras llegan
  metadatos `channelConfigs` con prioridad de registro
- la variable de entorno persistida para deshabilitar el registro de plugins mientras los flujos de reparación migran a los operadores
  hacia `openclaw plugins registry --refresh` y `openclaw doctor --fix`

El nuevo código de Plugin debe preferir el reemplazo listado en el registro y en la
guía de migración específica. Los plugins existentes pueden seguir usando una ruta de compatibilidad
hasta que la documentación, los diagnósticos y las notas de la versión anuncien una ventana de eliminación.

## Notas de la versión

Las notas de la versión deben incluir las próximas deprecaciones de Plugin con fechas objetivo y
enlaces a la documentación de migración. Esa advertencia debe producirse antes de que una
ruta de compatibilidad pase a `removal-pending` o `removed`.
