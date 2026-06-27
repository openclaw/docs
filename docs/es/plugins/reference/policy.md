---
read_when:
    - Estás instalando, configurando o auditando el plugin de políticas
summary: Agrega comprobaciones de doctor respaldadas por políticas para la conformidad del espacio de trabajo.
title: Plugin de políticas
x-i18n:
    generated_at: "2026-06-27T12:23:35Z"
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

El Plugin de políticas aporta comprobaciones de estado de doctor para ajustes de OpenClaw gestionados por políticas y declaraciones de espacio de trabajo gobernadas. Actualmente, la política cubre la conformidad de canales, los metadatos de herramientas gobernadas, la postura del servidor MCP, la postura del proveedor de modelos, la postura de acceso a red privada, la postura de exposición del Gateway, la postura del espacio de trabajo/herramientas del agente, la postura configurada de herramientas globales/por agente, la postura configurada del entorno de ejecución de sandbox, la postura de acceso de entrada/canal, la postura de manejo de datos y la postura del proveedor de secretos/perfil de autenticación de la configuración de OpenClaw.

La política almacena los requisitos definidos en `policy.jsonc`, observa los ajustes existentes de OpenClaw y las declaraciones del espacio de trabajo como evidencia, e informa de desviaciones mediante `openclaw policy check` y `openclaw doctor --lint`. Una comprobación de política limpia emite hashes de política, evidencia, hallazgos y atestación que los operadores pueden registrar para auditoría.

`openclaw policy compare --baseline <file>` compara un archivo de política con otro archivo de política. Es solo conformidad a nivel de configuración: usa los metadatos de reglas de política para verificar que la política comprobada no falte ni sea más débil que la línea base definida, y no inspecciona el estado de ejecución, las credenciales ni los valores secretos.

Las reglas de postura de herramientas pueden requerir perfiles aprobados, herramientas de sistema de archivos solo para el espacio de trabajo, ajustes acotados de seguridad/solicitud/host para exec, modo elevado deshabilitado, entradas exactas de `alsoAllow` y entradas obligatorias de denegación de herramientas. Los registros de evidencia incluyen entradas aditivas de `alsoAllow` porque pueden ampliar la postura efectiva de herramientas. Estas comprobaciones observan solo la conformidad de configuración; no leen el estado de aprobación en ejecución ni añaden aplicación en tiempo de ejecución.

Las reglas de postura de sandbox pueden requerir modos/backends de sandbox aprobados, denegar redes de contenedor de host, denegar uniones de espacios de nombres de contenedor, requerir montajes de contenedor de solo lectura, denegar montajes del socket de ejecución de contenedores y perfiles de contenedor no confinados, y requerir rangos de origen CDP del navegador de sandbox.
Estas comprobaciones observan solo la conformidad de configuración; no leen el estado de aprobación en ejecución, no inspeccionan contenedores activos ni añaden aplicación en tiempo de ejecución.

Las reglas de manejo de datos pueden requerir redacción de registros sensibles, denegar captura de contenido de telemetría, requerir mantenimiento de retención de sesiones y denegar la indexación en memoria de transcripciones de sesión. Estas comprobaciones observan solo la conformidad de configuración; no inspeccionan registros sin procesar, exportaciones de telemetría, transcripciones, archivos de memoria, secretos ni datos personales.

Los ámbitos de política nombrados bajo `scopes.<scopeName>` pueden añadir secciones normales de política más estrictas para el selector que enumeran. `agentIds` admite `tools`, `agents.workspace`, `sandbox` y `dataHandling.memory`; `channelIds` admite `ingress.channels`.
Los ids de agente en ejecución que no estén enumerados explícitamente en `agents.list[]` se comprueban contra la postura global/predeterminada heredada, en lugar de aprobarse silenciosamente sin evidencia. Todo ámbito presente en `policy.jsonc` debe ser válido y aplicable para su selector. Las reglas de superposición son afirmaciones adicionales, por lo que no debilitan la política de nivel superior y pueden producir sus propios hallazgos cuando la misma configuración observada infringe ambos ámbitos.

<!-- openclaw-plugin-reference:manual-end -->

## Documentación relacionada

- [política](/es/cli/policy)
