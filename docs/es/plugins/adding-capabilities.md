---
read_when:
    - Añadir una nueva capacidad central y una superficie de registro de Plugin
    - Decidir si el código pertenece al núcleo, a un plugin de proveedor o a un plugin de funcionalidad
    - Conectar un nuevo helper de runtime para canales o herramientas
sidebarTitle: Adding capabilities
summary: Guía para colaboradores para agregar una nueva capacidad compartida al sistema de Plugin de OpenClaw
title: Añadir capacidades (guía del colaborador)
x-i18n:
    generated_at: "2026-07-05T11:32:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Esta es una **guía para colaboradores** para desarrolladores del núcleo de OpenClaw. Si estás
  creando un Plugin externo, consulta [Crear plugins](/es/plugins/building-plugins)
  en su lugar. Para la referencia de arquitectura detallada (modelo de capacidades, propiedad,
  canalización de carga, auxiliares de runtime), consulta [Aspectos internos de Plugin](/es/plugins/architecture).
</Info>

Usa esto cuando OpenClaw necesite un nuevo dominio compartido, como embeddings, generación de
imágenes, generación de video o algún área futura de funcionalidades respaldada por proveedores.

La regla:

- **Plugin** = límite de propiedad
- **capacidad** = contrato compartido del núcleo

No conectes un proveedor directamente a un canal o una herramienta. Define primero la capacidad.

## Cuándo crear una capacidad

Crea una nueva capacidad solo cuando **todo** lo siguiente sea cierto:

1. Más de un proveedor podría implementarla de forma plausible.
2. Los canales, herramientas o plugins de funcionalidad deberían consumirla sin preocuparse por el proveedor.
3. El núcleo necesita poseer el fallback, la política, la configuración o el comportamiento de entrega.

Si el trabajo es solo para un proveedor y aún no existe un contrato compartido, define primero el contrato.

## La secuencia estándar

1. Define el contrato tipado del núcleo.
2. Agrega el registro de Plugin para ese contrato.
3. Agrega un auxiliar de runtime compartido.
4. Conecta un Plugin de proveedor real como prueba.
5. Mueve los consumidores de funcionalidad/canal al auxiliar de runtime.
6. Agrega pruebas de contrato.
7. Documenta la configuración visible para el operador y el modelo de propiedad.

## Qué va dónde

| Capa                       | Posee                                                                                                                                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Núcleo**                 | Tipos de solicitud/respuesta; registro y resolución de proveedores; comportamiento de fallback; esquema de configuración con metadatos de documentación `title`/`description` propagados en nodos de objeto anidado, comodín, elemento de arreglo y composición; superficie del auxiliar de runtime. |
| **Plugin de proveedor**    | Llamadas a la API del proveedor, manejo de autenticación del proveedor, normalización de solicitudes específica del proveedor y registro de la implementación de capacidad.                                                             |
| **Plugin de funcionalidad/canal** | Llama a `api.runtime.*` o al auxiliar `plugin-sdk/*-runtime` correspondiente. Nunca llama directamente a una implementación de proveedor.                                                                                       |

## Costuras de proveedor y arnés

Usa **hooks de proveedor** cuando el comportamiento pertenezca al contrato del proveedor del modelo en lugar de al bucle genérico del agente. Los ejemplos incluyen parámetros de solicitud específicos del proveedor después de la selección de transporte, preferencia de perfil de autenticación, superposiciones de prompts y enrutamiento de fallback de seguimiento después de la conmutación por error de modelo/perfil.

Usa **hooks de arnés de agente** cuando el comportamiento pertenezca al runtime que está ejecutando un turno. Los arneses pueden clasificar resultados explícitos del protocolo, como salida vacía, razonamiento sin salida visible o un plan estructurado sin respuesta final, para que la política externa de fallback del modelo pueda tomar la decisión de reintento.

Mantén ambas costuras estrechas:

- El núcleo posee la política de reintento/fallback.
- Los plugins de proveedor poseen sugerencias específicas del proveedor sobre solicitud/autenticación/enrutamiento.
- Los plugins de arnés poseen la clasificación de intentos específica del runtime.
- Los plugins de terceros devuelven sugerencias, no mutaciones directas del estado del núcleo.

## Lista de archivos

Para una nueva capacidad, espera tocar estas áreas:

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
- Uno o más paquetes de Plugin incluidos.
- Configuración, documentación, pruebas.

## Ejemplo desarrollado: generación de imágenes

La generación de imágenes sigue la forma estándar:

1. El núcleo define `ImageGenerationProvider`.
2. El núcleo expone `registerImageGenerationProvider(...)`.
3. El núcleo expone `api.runtime.imageGeneration.generate(...)` y `.listProviders(...)`.
4. Los plugins de proveedor (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) registran implementaciones respaldadas por proveedores.
5. Los proveedores futuros registran el mismo contrato sin cambiar canales/herramientas.

La clave de configuración está separada intencionalmente del enrutamiento de análisis de visión:

- `agents.defaults.imageModel` analiza imágenes.
- `agents.defaults.imageGenerationModel` genera imágenes.

Mantenlas separadas para que el fallback y la política sigan siendo explícitos.

## Proveedores de embeddings

Usa `registerEmbeddingProvider(...)` / contrato `embeddingProviders` para
proveedores reutilizables de embeddings vectoriales. Este contrato es intencionalmente más amplio
que la memoria: herramientas, búsqueda, recuperación, importadores o futuros plugins de funcionalidad
pueden consumir embeddings sin depender del motor de memoria. La búsqueda de memoria
también consume `embeddingProviders` genéricos.

La API de registro anterior específica de memoria y el contrato `memoryEmbeddingProviders`
están obsoletos. Usa `registerEmbeddingProvider` y
`embeddingProviders` para todos los nuevos proveedores de embeddings.

## Lista de revisión

Antes de publicar una nueva capacidad, verifica:

- Ningún canal/herramienta importa código de proveedor directamente.
- El auxiliar de runtime es la ruta compartida.
- Al menos una prueba de contrato afirma la propiedad incluida.
- La documentación de configuración nombra la nueva clave de modelo/configuración.
- La documentación de Plugin explica el límite de propiedad.

Si un PR omite la capa de capacidad y codifica comportamiento de proveedor en un canal/herramienta, devuélvelo y define primero el contrato.

## Relacionado

- [Aspectos internos de Plugin](/es/plugins/architecture) — modelo de capacidades, propiedad, canalización de carga, auxiliares de runtime.
- [Crear plugins](/es/plugins/building-plugins) — tutorial del primer Plugin.
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia del mapa de importaciones y la API de registro.
- [Crear Skills](/es/tools/creating-skills) — superficie complementaria para colaboradores.
