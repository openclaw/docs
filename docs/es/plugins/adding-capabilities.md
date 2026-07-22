---
read_when:
    - Adición de una nueva capacidad del núcleo y una superficie de registro de plugins
    - Decidir si el código debe estar en el núcleo, en un plugin de proveedor o en un plugin de funcionalidad
    - Conexión de un nuevo auxiliar de tiempo de ejecución para canales o herramientas
sidebarTitle: Adding capabilities
summary: Guía para colaboradores sobre cómo añadir una nueva capacidad compartida al sistema de plugins de OpenClaw
title: Adición de capacidades (guía para colaboradores)
x-i18n:
    generated_at: "2026-07-22T10:38:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 14f86c98eb10c6e92970d1b65009ac7bb103afcb6bc57bad2c39e59bc038c961
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Esta es una **guía para colaboradores** dirigida a los desarrolladores del núcleo de OpenClaw. Si se está
  creando un plugin externo, consulte [Creación de plugins](/es/plugins/building-plugins)
  en su lugar. Para consultar la referencia detallada de la arquitectura (modelo de capacidades, propiedad,
  pipeline de carga, ayudantes de tiempo de ejecución), consulte [Aspectos internos de los plugins](/es/plugins/architecture).
</Info>

Utilice esta guía cuando OpenClaw necesite un nuevo dominio compartido, como embeddings, generación
de imágenes, generación de vídeo o alguna futura área de funcionalidades respaldada por proveedores.

La regla:

- **plugin** = límite de propiedad
- **capacidad** = contrato compartido del núcleo

No conecte un proveedor directamente a un canal ni a una herramienta. Defina primero la capacidad.

## Cuándo crear una capacidad

Cree una nueva capacidad solo cuando se cumplan **todas** estas condiciones:

1. Más de un proveedor podría implementarla de forma plausible.
2. Los canales, las herramientas o los plugins de funcionalidades deben consumirla sin preocuparse por el proveedor.
3. El núcleo debe controlar el comportamiento de respaldo, las políticas, la configuración o la entrega.

Si el trabajo corresponde únicamente a un proveedor y todavía no existe un contrato compartido, defina primero el contrato.

## Secuencia estándar

1. Defina el contrato tipado del núcleo.
2. Añada el registro de plugins para ese contrato.
3. Añada un ayudante compartido de tiempo de ejecución.
4. Conecte un plugin de proveedor real como demostración.
5. Migre los consumidores de funcionalidades o canales al ayudante de tiempo de ejecución.
6. Añada pruebas de contrato.
7. Documente la configuración orientada a operadores y el modelo de propiedad.

## Qué corresponde a cada capa

| Capa                       | Responsabilidades                                                                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Núcleo**                 | Tipos de solicitud/respuesta; registro y resolución de proveedores; comportamiento de respaldo; esquema de configuración con metadatos de documentación `title`/`description` propagados en nodos de objetos anidados, comodines, elementos de matriz y composición; superficie de ayudantes de tiempo de ejecución. |
| **Plugin del proveedor**   | Llamadas a la API del proveedor, gestión de la autenticación del proveedor, normalización de solicitudes específica del proveedor y registro de la implementación de la capacidad.                                                     |
| **Plugin de funcionalidad/canal** | Llama a `api.runtime.*` o al ayudante `plugin-sdk/*-runtime` correspondiente. Nunca llama directamente a la implementación de un proveedor.                                                                                     |

## Puntos de integración de proveedores y arneses

Utilice **hooks de proveedor** cuando el comportamiento pertenezca al contrato del proveedor del modelo en lugar de al bucle genérico del agente. Algunos ejemplos son los parámetros de solicitud específicos del proveedor después de seleccionar el transporte, la preferencia de perfiles de autenticación, las superposiciones de prompts y el enrutamiento de respaldo posterior tras la conmutación por error del modelo o perfil.

Utilice **hooks del arnés del agente** cuando el comportamiento pertenezca al tiempo de ejecución que ejecuta un turno. Los arneses pueden clasificar resultados explícitos del protocolo, como una salida vacía, razonamiento sin salida visible o un plan estructurado sin respuesta final, para que la política externa de respaldo de modelos pueda decidir si se debe volver a intentar.

Mantenga reducidos ambos puntos de integración:

- El núcleo controla la política de reintentos y respaldo.
- Los plugins de proveedores controlan las indicaciones específicas del proveedor para solicitudes, autenticación y enrutamiento.
- Los plugins de arneses controlan la clasificación de intentos específica del tiempo de ejecución.
- Los plugins de terceros devuelven indicaciones, no modificaciones directas del estado del núcleo.

## Lista de comprobación de archivos

Para una nueva capacidad, cabe esperar que sea necesario modificar estas áreas:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- Uno o más paquetes de plugins incluidos.
- Configuración, documentación y pruebas.

## Ejemplo práctico: generación de imágenes

La generación de imágenes sigue la estructura estándar:

1. El núcleo define `ImageGenerationProvider`.
2. El núcleo expone `registerImageGenerationProvider(...)`.
3. El núcleo expone `api.runtime.imageGeneration.generate(...)` y `.listProviders(...)`.
4. Los plugins de proveedores (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) registran implementaciones respaldadas por proveedores.
5. Los proveedores futuros registran el mismo contrato sin modificar los canales ni las herramientas.

La clave de configuración se mantiene separada deliberadamente del enrutamiento del análisis visual:

- `agents.defaults.imageModel` analiza imágenes.
- `agents.defaults.mediaModels.image` genera imágenes.

Manténgalos separados para que el respaldo y las políticas sigan siendo explícitos.

## Proveedores de embeddings

Utilice `registerEmbeddingProvider(...)` / el contrato `embeddingProviders` para
proveedores reutilizables de embeddings vectoriales. Este contrato es deliberadamente más amplio
que la memoria: las herramientas, la búsqueda, la recuperación, los importadores o los futuros plugins de funcionalidades
pueden consumir embeddings sin depender del motor de memoria. La búsqueda en memoria
también consume `embeddingProviders` genéricos.

La API anterior de registro específica de la memoria y el contrato `memoryEmbeddingProviders`
están obsoletos. Utilice `registerEmbeddingProvider` y
`embeddingProviders` para todos los nuevos proveedores de embeddings.

## Lista de comprobación para la revisión

Antes de publicar una nueva capacidad, compruebe lo siguiente:

- Ningún canal ni herramienta importa directamente código de proveedores.
- El ayudante de tiempo de ejecución es la ruta compartida.
- Al menos una prueba de contrato verifica la propiedad incluida.
- La documentación de configuración indica el nuevo modelo o la nueva clave de configuración.
- La documentación del plugin explica el límite de propiedad.

Si un PR omite la capa de capacidades y codifica de forma rígida el comportamiento del proveedor en un canal o una herramienta, devuélvalo y defina primero el contrato.

## Recursos relacionados

- [Aspectos internos de los plugins](/es/plugins/architecture) — modelo de capacidades, propiedad, pipeline de carga y ayudantes de tiempo de ejecución.
- [Creación de plugins](/es/plugins/building-plugins) — tutorial para crear el primer plugin.
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia del mapa de importaciones y la API de registro.
- [Creación de Skills](/es/tools/creating-skills) — superficie complementaria para colaboradores.
