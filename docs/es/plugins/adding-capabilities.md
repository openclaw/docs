---
read_when:
    - Adición de una nueva capacidad del núcleo y una interfaz de registro de plugins
    - Decidir si el código pertenece al núcleo, a un plugin de proveedor o a un plugin de funcionalidad
    - Conectar un nuevo asistente de entorno de ejecución para canales o herramientas
sidebarTitle: Adding capabilities
summary: Guía para colaboradores sobre cómo añadir una nueva capacidad compartida al sistema de plugins de OpenClaw
title: Añadir funcionalidades (guía para colaboradores)
x-i18n:
    generated_at: "2026-07-11T23:16:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Esta es una **guía para colaboradores** dirigida a los desarrolladores del núcleo de OpenClaw. Si está
  creando un plugin externo, consulte [Creación de plugins](/es/plugins/building-plugins)
  en su lugar. Para obtener la referencia detallada de la arquitectura (modelo de capacidades, propiedad,
  canal de carga, auxiliares de tiempo de ejecución), consulte [Aspectos internos de los plugins](/es/plugins/architecture).
</Info>

Use esta guía cuando OpenClaw necesite un nuevo dominio compartido, como incrustaciones, generación
de imágenes, generación de vídeo o alguna futura área de funcionalidades respaldada por proveedores.

La regla:

- **plugin** = límite de propiedad
- **capacidad** = contrato compartido del núcleo

No conecte un proveedor directamente a un canal o una herramienta. Defina primero la capacidad.

## Cuándo crear una capacidad

Cree una capacidad nueva únicamente cuando se cumplan **todas** estas condiciones:

1. Más de un proveedor podría implementarla de manera plausible.
2. Los canales, las herramientas o los plugins de funcionalidades deben poder consumirla sin preocuparse por el proveedor.
3. El núcleo debe encargarse del comportamiento de respaldo, las políticas, la configuración o la entrega.

Si el trabajo es exclusivo de un proveedor y aún no existe un contrato compartido, defina primero el contrato.

## La secuencia estándar

1. Defina el contrato tipado del núcleo.
2. Añada el registro de plugins para ese contrato.
3. Añada un auxiliar compartido de tiempo de ejecución.
4. Conecte un plugin de un proveedor real como prueba.
5. Migre los consumidores de funcionalidades o canales al auxiliar de tiempo de ejecución.
6. Añada pruebas de contrato.
7. Documente la configuración de cara al operador y el modelo de propiedad.

## Qué corresponde a cada lugar

| Capa                       | Se encarga de                                                                                                                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Núcleo**                 | Tipos de solicitud/respuesta; registro y resolución de proveedores; comportamiento de respaldo; esquema de configuración con metadatos de documentación `title`/`description` propagados en objetos anidados, comodines, elementos de matrices y nodos de composición; superficie de auxiliares de tiempo de ejecución. |
| **Plugin del proveedor**   | Llamadas a la API del proveedor, gestión de la autenticación del proveedor, normalización de solicitudes específica del proveedor y registro de la implementación de la capacidad.                                                       |
| **Plugin de funcionalidad/canal** | Llama a `api.runtime.*` o al auxiliar `plugin-sdk/*-runtime` correspondiente. Nunca llama directamente a la implementación de un proveedor.                                                                                       |

## Puntos de integración de proveedores y entornos de ejecución

Use **hooks de proveedores** cuando el comportamiento pertenezca al contrato del proveedor del modelo y no al bucle genérico del agente. Algunos ejemplos son los parámetros de solicitud específicos del proveedor tras seleccionar el transporte, la preferencia del perfil de autenticación, las superposiciones de indicaciones y el enrutamiento de respaldo posterior después de la conmutación por error del modelo o perfil.

Use **hooks del entorno de ejecución del agente** cuando el comportamiento pertenezca al entorno que ejecuta un turno. Los entornos pueden clasificar resultados explícitos del protocolo, como una salida vacía, razonamiento sin salida visible o un plan estructurado sin respuesta final, para que la política externa de respaldo de modelos pueda decidir si debe reintentar.

Mantenga reducidos ambos puntos de integración:

- El núcleo se encarga de la política de reintentos y respaldo.
- Los plugins de proveedores se encargan de las indicaciones específicas del proveedor para solicitudes, autenticación y enrutamiento.
- Los plugins del entorno de ejecución se encargan de la clasificación de intentos específica del tiempo de ejecución.
- Los plugins de terceros devuelven indicaciones, no modificaciones directas del estado del núcleo.

## Lista de comprobación de archivos

Para una capacidad nueva, cabe esperar que tenga que modificar estas áreas:

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
5. Los futuros proveedores registran el mismo contrato sin modificar los canales ni las herramientas.

La clave de configuración está separada intencionadamente del enrutamiento del análisis visual:

- `agents.defaults.imageModel` analiza imágenes.
- `agents.defaults.imageGenerationModel` genera imágenes.

Manténgalas separadas para que el respaldo y las políticas sigan siendo explícitos.

## Proveedores de incrustaciones

Use `registerEmbeddingProvider(...)` y el contrato `embeddingProviders` para
proveedores reutilizables de incrustaciones vectoriales. Este contrato es deliberadamente más amplio
que la memoria: las herramientas, la búsqueda, la recuperación, los importadores o los futuros plugins de funcionalidades
pueden consumir incrustaciones sin depender del motor de memoria. La búsqueda en memoria
también consume los `embeddingProviders` genéricos.

La API de registro anterior específica de la memoria y el contrato `memoryEmbeddingProviders`
están obsoletos. Use `registerEmbeddingProvider` y
`embeddingProviders` para todos los proveedores de incrustaciones nuevos.

## Lista de comprobación para la revisión

Antes de publicar una capacidad nueva, compruebe lo siguiente:

- Ningún canal ni herramienta importa directamente el código de un proveedor.
- El auxiliar de tiempo de ejecución es la ruta compartida.
- Al menos una prueba de contrato verifica la propiedad incluida.
- La documentación de configuración indica el nuevo modelo o la nueva clave de configuración.
- La documentación de plugins explica el límite de propiedad.

Si una solicitud de incorporación omite la capa de capacidades y codifica directamente el comportamiento del proveedor en un canal o una herramienta, devuélvala y defina primero el contrato.

## Contenido relacionado

- [Aspectos internos de los plugins](/es/plugins/architecture) — modelo de capacidades, propiedad, canal de carga y auxiliares de tiempo de ejecución.
- [Creación de plugins](/es/plugins/building-plugins) — tutorial para crear el primer plugin.
- [Descripción general del SDK](/es/plugins/sdk-overview) — mapa de importaciones y referencia de la API de registro.
- [Creación de Skills](/es/tools/creating-skills) — superficie complementaria para colaboradores.
