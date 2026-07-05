---
read_when:
    - Está instalando, configurando o auditando el Plugin de políticas
summary: Agrega comprobaciones de doctor respaldadas por políticas para la conformidad del espacio de trabajo.
title: Plugin de políticas
x-i18n:
    generated_at: "2026-07-05T11:31:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin de políticas

Añade comprobaciones de doctor respaldadas por políticas para la conformidad del espacio de trabajo.

## Distribución

- Paquete: `@openclaw/policy`
- Ruta de instalación: incluido en OpenClaw

## Superficie

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Comportamiento

El Plugin de políticas aporta comprobaciones de estado de doctor para ajustes de OpenClaw
gestionados por políticas y declaraciones de espacio de trabajo gobernadas. Actualmente, la política cubre la
conformidad de canales, los metadatos de herramientas gobernadas, la postura de servidores MCP, la postura de proveedores de modelos,
la postura de acceso a redes privadas, la postura de exposición del Gateway, la postura del espacio de trabajo/herramientas de agentes, la postura de herramientas globales/por agente configuradas, la postura del entorno de ejecución de sandbox configurado, la postura de acceso de entrada/canales, la postura de manejo de datos y la postura del proveedor de secretos/perfil de autenticación de la configuración de OpenClaw.

La política almacena los requisitos redactados en `policy.jsonc`, observa los ajustes existentes
de OpenClaw y las declaraciones del espacio de trabajo como evidencia, e informa desviaciones
mediante `openclaw policy check` y `openclaw doctor --lint`. Una comprobación de política
limpia emite hashes de política, evidencia, hallazgos y certificación que los operadores
pueden registrar para auditoría.

`openclaw policy compare --baseline <file>` compara un archivo de política con otro
archivo de política. Es solo conformidad a nivel de configuración: usa metadatos de reglas de política
para verificar que a la política comprobada no le falte nada ni sea más débil que la línea base
redactada, y no inspecciona el estado de ejecución, las credenciales ni los valores secretos.

Las reglas de postura de herramientas pueden exigir perfiles aprobados, herramientas de sistema de archivos
solo del espacio de trabajo, ajustes acotados de seguridad/solicitud/host de exec, modo elevado deshabilitado, entradas exactas de
`alsoAllow` y entradas requeridas de denegación de herramientas. Los registros de evidencia
incluyen entradas aditivas de `alsoAllow` porque pueden ampliar la postura efectiva de las herramientas.
Estas comprobaciones observan solo la conformidad de la configuración; no leen el estado de aprobación en ejecución
ni añaden aplicación en ejecución.

Las reglas de postura de sandbox pueden exigir modos/backends de sandbox aprobados, denegar redes de contenedor
del host, denegar uniones de espacio de nombres de contenedor, exigir montajes de contenedor de solo lectura, denegar montajes de sockets del entorno de ejecución de contenedores y perfiles de contenedor no confinados,
y exigir rangos de origen de CDP del navegador de sandbox.
Estas comprobaciones observan solo la conformidad de la configuración; no leen el estado de aprobación en ejecución,
no inspeccionan contenedores activos ni añaden aplicación en ejecución.

Las reglas de manejo de datos pueden exigir redacción de registros sensibles, denegar la captura de contenido
de telemetría, exigir mantenimiento de retención de sesiones y denegar la indexación de memoria
de transcripciones de sesión. Estas comprobaciones observan solo la conformidad de la configuración; no
inspeccionan registros sin procesar, exportaciones de telemetría, transcripciones, archivos de memoria, secretos
ni datos personales.

Los ámbitos de política con nombre bajo `scopes.<scopeName>` pueden añadir secciones de política normal
más estrictas para el selector que enumeran. `agentIds` admite `tools`,
`agents.workspace`, `sandbox` y `dataHandling.memory`; `channelIds` admite
`ingress.channels`.
Los ids de agente en ejecución que no figuren explícitamente en `agents.list[]` se comprueban
contra la postura global/predeterminada heredada, en lugar de pasar silenciosamente sin
evidencia. Cada ámbito presente en `policy.jsonc` debe ser válido y aplicable
para su selector. Las reglas superpuestas son declaraciones adicionales, por lo que no debilitan
la política de nivel superior y pueden producir sus propios hallazgos cuando la misma configuración
observada infringe ambos ámbitos.

<!-- openclaw-plugin-reference:manual-end -->

## Documentos relacionados

- [policy](/es/cli/policy)
