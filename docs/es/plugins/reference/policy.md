---
read_when:
    - Está instalando, configurando o auditando el plugin de políticas
summary: Agrega comprobaciones de doctor respaldadas por políticas para la conformidad del espacio de trabajo.
title: Plugin de políticas
x-i18n:
    generated_at: "2026-07-05T01:58:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af7b8db65e0e7baac10481d2508c771e297e29e51174c706bdbdff8f39ad4f5
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin de políticas

Agrega comprobaciones de doctor respaldadas por políticas para la conformidad del espacio de trabajo.

## Distribución

- Paquete: `@openclaw/policy`
- Ruta de instalación: incluido en OpenClaw

## Superficie

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Comportamiento

El Plugin de políticas aporta comprobaciones de estado de doctor para la configuración de OpenClaw gestionada por políticas y las declaraciones de espacios de trabajo gobernadas. Actualmente, la política cubre la conformidad de canales, los metadatos de herramientas gobernadas, la postura de servidores MCP, la postura de proveedores de modelos, la postura de acceso a redes privadas, la postura de exposición del Gateway, la postura de herramientas del espacio de trabajo del agente y comandos de nodos, la postura configurada de herramientas globales/por agente, la postura configurada del entorno de ejecución de sandbox, la postura de acceso de entrada/canales, la postura de gestión de datos y la postura de proveedores de secretos/perfiles de autenticación de la configuración de OpenClaw.

La política almacena los requisitos redactados en `policy.jsonc`, observa la configuración existente de OpenClaw y las declaraciones del espacio de trabajo como evidencia, e informa desviaciones mediante `openclaw policy check` y `openclaw doctor --lint`. Una comprobación de política limpia emite hashes de política, evidencia, hallazgos y atestación que los operadores pueden registrar para auditoría.

`openclaw policy compare --baseline <file>` compara un archivo de política con otro archivo de política. Solo es conformidad a nivel de configuración: usa los metadatos de reglas de política para verificar que la política comprobada no falte ni sea más débil que la línea base redactada, y no inspecciona el estado de ejecución, las credenciales ni los valores secretos.

Las reglas de postura de herramientas pueden exigir perfiles aprobados, herramientas de sistema de archivos solo del espacio de trabajo, configuraciones de seguridad/solicitud/host de exec acotadas, modo elevado deshabilitado, entradas exactas de `alsoAllow` y entradas obligatorias de denegación de herramientas. Los registros de evidencia incluyen entradas aditivas de `alsoAllow` porque pueden ampliar la postura efectiva de herramientas. Estas comprobaciones solo observan la conformidad de la configuración; no leen el estado de aprobación en tiempo de ejecución ni agregan aplicación en tiempo de ejecución.

Las reglas de comandos de nodos del Gateway pueden exigir que ids de comandos exactos y sensibles a mayúsculas/minúsculas, como `system.run`, estén presentes en la configuración de OpenClaw `gateway.nodes.denyCommands`. Estas comprobaciones solo observan la conformidad de la configuración; no agregan aplicación en tiempo de ejecución ni cambian la lista de comandos permitidos del gateway.

Las reglas de postura de sandbox pueden exigir modos/backends de sandbox aprobados, denegar redes de contenedores del host, denegar uniones a espacios de nombres de contenedores, exigir montajes de contenedores de solo lectura, denegar montajes de sockets del entorno de ejecución de contenedores y perfiles de contenedor sin confinamiento, y exigir rangos de origen CDP del navegador de sandbox.
Estas comprobaciones solo observan la conformidad de la configuración; no leen el estado de aprobación en tiempo de ejecución, inspeccionan contenedores en vivo ni agregan aplicación en tiempo de ejecución.

Las reglas de gestión de datos pueden exigir la redacción de registros sensibles, denegar la captura de contenido de telemetría, exigir el mantenimiento de la retención de sesiones y denegar la indexación en memoria de transcripciones de sesiones. Estas comprobaciones solo observan la conformidad de la configuración; no inspeccionan registros sin procesar, exportaciones de telemetría, transcripciones, archivos de memoria, secretos ni datos personales.

Los ámbitos de política con nombre bajo `scopes.<scopeName>` pueden agregar secciones normales de política más estrictas para el selector que indican. `agentIds` admite `tools`, `agents.workspace`, `sandbox` y `dataHandling.memory`; `channelIds` admite `ingress.channels`.
Los ids de agentes en tiempo de ejecución que no estén listados explícitamente en `agents.list[]` se comprueban contra la postura global/predeterminada heredada en lugar de aprobarse silenciosamente sin evidencia. Cada ámbito presente en `policy.jsonc` debe ser válido y exigible para su selector. Las reglas superpuestas son afirmaciones adicionales, por lo que no debilitan la política de nivel superior y pueden producir sus propios hallazgos cuando la misma configuración observada infringe ambos ámbitos.

<!-- openclaw-plugin-reference:manual-end -->

## Documentos relacionados

- [política](/es/cli/policy)
