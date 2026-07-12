---
read_when:
    - Estás instalando, configurando o auditando el plugin de políticas
summary: Añade comprobaciones de diagnóstico respaldadas por políticas para verificar la conformidad del espacio de trabajo.
title: Plugin de políticas
x-i18n:
    generated_at: "2026-07-11T23:25:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin de políticas

Añade comprobaciones de diagnóstico respaldadas por políticas para verificar la conformidad del espacio de trabajo.

## Distribución

- Paquete: `@openclaw/policy`
- Vía de instalación: incluido en OpenClaw

## Superficie

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Comportamiento

El Plugin de políticas aporta comprobaciones de estado del diagnóstico para los ajustes de OpenClaw gestionados mediante políticas y las declaraciones de espacios de trabajo sujetas a gobernanza. Actualmente, las políticas abarcan la conformidad de los canales, los metadatos de herramientas sujetos a gobernanza, la postura de los servidores MCP, la postura de los proveedores de modelos, la postura de acceso a redes privadas, la postura de exposición del Gateway, la postura de los espacios de trabajo y las herramientas de los agentes, la postura configurada de las herramientas globales y por agente, la postura configurada del entorno de ejecución del sandbox, la postura de acceso de entrada y de los canales, la postura de tratamiento de datos y la postura de los proveedores de secretos y los perfiles de autenticación de la configuración de OpenClaw.

Las políticas almacenan los requisitos definidos en `policy.jsonc`, observan los ajustes existentes de OpenClaw y las declaraciones del espacio de trabajo como evidencia, e informan de las desviaciones mediante `openclaw policy check` y `openclaw doctor --lint`. Una comprobación de políticas sin problemas emite hashes de las políticas, las evidencias, los hallazgos y las atestaciones que los operadores pueden registrar para auditorías.

`openclaw policy compare --baseline <file>` compara un archivo de políticas con otro. Solo comprueba la conformidad en el nivel de configuración: utiliza los metadatos de las reglas de políticas para verificar que la política comprobada no omita requisitos ni sea menos estricta que la referencia definida, y no inspecciona el estado del entorno de ejecución, las credenciales ni los valores secretos.

Las reglas de postura de las herramientas pueden exigir perfiles aprobados, herramientas del sistema de archivos limitadas al espacio de trabajo, ajustes acotados de seguridad, consulta y host para la ejecución, el modo con privilegios elevados desactivado, entradas exactas de `alsoAllow` y entradas obligatorias de denegación de herramientas. La evidencia registra las entradas adicionales de `alsoAllow` porque pueden ampliar la postura efectiva de las herramientas. Estas comprobaciones solo observan la conformidad de la configuración; no leen el estado de aprobación del entorno de ejecución ni añaden medidas de cumplimiento durante la ejecución.

Las reglas de postura del sandbox pueden exigir modos y backends de sandbox aprobados, denegar las redes de contenedores del host, denegar la unión a espacios de nombres de contenedores, exigir montajes de contenedores de solo lectura, denegar los montajes de sockets del entorno de ejecución de contenedores y los perfiles de contenedores sin restricciones, y exigir rangos de origen CDP para el navegador del sandbox.
Estas comprobaciones solo observan la conformidad de la configuración; no leen el estado de aprobación del entorno de ejecución, no inspeccionan contenedores activos ni añaden medidas de cumplimiento durante la ejecución.

Las reglas de tratamiento de datos pueden exigir la ocultación de información sensible en los registros, denegar la captura de contenido de telemetría, exigir el mantenimiento de la retención de sesiones y denegar la indexación en memoria de las transcripciones de sesiones. Estas comprobaciones solo observan la conformidad de la configuración; no inspeccionan registros sin procesar, exportaciones de telemetría, transcripciones, archivos de memoria, secretos ni datos personales.

Los ámbitos de políticas con nombre definidos en `scopes.<scopeName>` pueden añadir secciones de políticas normales más estrictas para el selector que indiquen. `agentIds` admite `tools`, `agents.workspace`, `sandbox` y `dataHandling.memory`; `channelIds` admite `ingress.channels`.
Los identificadores de agentes del entorno de ejecución que no se indiquen explícitamente en `agents.list[]` se comprueban con respecto a la postura global o predeterminada heredada, en lugar de aprobarse silenciosamente sin evidencia. Cada ámbito presente en `policy.jsonc` debe ser válido y aplicable a su selector. Las reglas de superposición son requisitos adicionales, por lo que no debilitan la política de nivel superior y pueden generar sus propios hallazgos cuando una misma configuración observada infringe ambos ámbitos.

<!-- openclaw-plugin-reference:manual-end -->

## Documentación relacionada

- [políticas](/es/cli/policy)
