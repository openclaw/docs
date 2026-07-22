---
read_when:
    - Está instalando, configurando o auditando el plugin de políticas
summary: Añade comprobaciones de doctor respaldadas por políticas para verificar la conformidad del espacio de trabajo.
title: Plugin de políticas
x-i18n:
    generated_at: "2026-07-22T10:40:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 440f2f46e4149fdd5e65bf0140d4981c6d840e8e8c8a85d05eeb23a0839a61ac
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin de políticas

Añade comprobaciones de diagnóstico respaldadas por políticas para verificar la conformidad del espacio de trabajo.

## Distribución

- Paquete: `@openclaw/policy`
- Ruta de instalación: incluida en OpenClaw

## Superficie

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Comportamiento

El Plugin de políticas aporta comprobaciones de diagnóstico del estado para la configuración de OpenClaw administrada mediante políticas y las declaraciones reguladas del espacio de trabajo. Actualmente, las políticas abarcan la conformidad de los canales, los metadatos regulados de las herramientas, la postura de los servidores MCP, la postura de los proveedores de modelos, la postura de acceso a redes privadas, la postura de exposición del Gateway, la postura del espacio de trabajo y las herramientas de los agentes, la postura configurada de las herramientas globales y por agente, la postura configurada del entorno de ejecución aislado, la postura de acceso de entrada y de los canales, la postura de tratamiento de datos y la postura de los proveedores de secretos y perfiles de autenticación de la configuración de OpenClaw.

Las políticas almacenan los requisitos definidos en `policy.jsonc`, observan la configuración y las declaraciones del espacio de trabajo existentes de OpenClaw como evidencia e informan de las desviaciones mediante `openclaw policy check` y `openclaw doctor --lint`. Una comprobación de políticas sin incidencias genera hashes de las políticas, las evidencias, los hallazgos y las certificaciones que los operadores pueden registrar para auditorías.

`openclaw policy compare --baseline <file>` compara un archivo de políticas con otro archivo de políticas. Solo comprueba la conformidad en el nivel de configuración: utiliza los metadatos de las reglas de políticas para verificar que la política comprobada no omita requisitos ni sea menos estricta que la base de referencia definida, y no inspecciona el estado del entorno de ejecución, las credenciales ni los valores secretos.

Las reglas de postura de las herramientas pueden exigir perfiles aprobados, herramientas del sistema de archivos limitadas al espacio de trabajo, valores restringidos de seguridad, consulta y host para la ejecución, el modo con privilegios elevados desactivado, entradas `alsoAllow` exactas y entradas obligatorias de denegación de herramientas. Los registros de evidencias incluyen las entradas `alsoAllow` adicionales porque pueden ampliar la postura efectiva de las herramientas. Estas comprobaciones solo observan la conformidad de la configuración; no leen el estado de aprobación del entorno de ejecución ni añaden mecanismos de aplicación en dicho entorno.

Las reglas de postura del entorno aislado pueden exigir modos y backends de aislamiento aprobados, denegar las redes de contenedores del host, denegar la unión a espacios de nombres de contenedores, exigir montajes de contenedores de solo lectura, denegar los montajes de sockets del entorno de ejecución de contenedores y los perfiles de contenedores sin restricciones, y exigir intervalos de origen de CDP para el navegador aislado.
Estas comprobaciones solo observan la conformidad de la configuración; no leen el estado de aprobación del entorno de ejecución, inspeccionan contenedores activos ni añaden mecanismos de aplicación en dicho entorno.

Las reglas de tratamiento de datos pueden exigir la ocultación de información confidencial en los registros, denegar la captura de contenido de telemetría, exigir el mantenimiento de la retención de sesiones y denegar la indexación en memoria de las transcripciones de sesiones. Estas comprobaciones solo observan la conformidad de la configuración; no inspeccionan registros sin procesar, exportaciones de telemetría, transcripciones, archivos de memoria, secretos ni datos personales.

Los ámbitos de políticas con nombre definidos en `scopes.<scopeName>` pueden añadir secciones de políticas normales más estrictas para el selector que indiquen. `agentIds` admite `tools`, `agents.workspace`, `sandbox` y `dataHandling.memory`; `channelIds` admite `ingress.channels`.
Los identificadores de agentes del entorno de ejecución que no figuren explícitamente en `agents.entries.*` se comprueban con respecto a la postura global o predeterminada heredada, en lugar de aprobarse silenciosamente sin evidencias. Todos los ámbitos presentes en `policy.jsonc` deben ser válidos y aplicables para su selector. Las reglas superpuestas constituyen afirmaciones adicionales, por lo que no debilitan la política de nivel superior y pueden generar sus propios hallazgos cuando la misma configuración observada infringe ambos ámbitos.

<!-- openclaw-plugin-reference:manual-end -->

## Documentación relacionada

- [políticas](/es/cli/policy)
