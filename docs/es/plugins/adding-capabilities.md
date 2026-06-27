---
read_when:
    - Agregar una nueva capacidad central y superficie de registro de Plugin
    - Decidir si el código pertenece al núcleo, a un Plugin de proveedor o a un Plugin de funcionalidad
    - Cablear un nuevo auxiliar de runtime para canales o herramientas
sidebarTitle: Adding capabilities
summary: Guía para colaboradores sobre cómo añadir una nueva capacidad compartida al sistema de plugins de OpenClaw
title: Agregar capacidades (guía para colaboradores)
x-i18n:
    generated_at: "2026-06-27T12:05:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Esta es una **guía para colaboradores** para desarrolladores del núcleo de OpenClaw. Si estás
  creando un plugin externo, consulta [Crear plugins](/es/plugins/building-plugins)
  en su lugar. Para la referencia detallada de arquitectura (modelo de capacidades, propiedad,
  canalización de carga, helpers de tiempo de ejecución), consulta [Elementos internos de Plugin](/es/plugins/architecture).
</Info>

Usa esto cuando OpenClaw necesite un nuevo dominio compartido, como embeddings, generación de
imágenes, generación de video o alguna área futura de funcionalidades respaldada por proveedores.

La regla:

- **plugin** = límite de propiedad
- **capacidad** = contrato compartido del núcleo

No empieces conectando un proveedor directamente a un canal o una herramienta. Empieza definiendo la capacidad.

## Cuándo crear una capacidad

Crea una nueva capacidad cuando **todas** estas condiciones sean verdaderas:

1. Más de un proveedor podría implementarla de forma plausible.
2. Los canales, herramientas o plugins de funcionalidades deberían consumirla sin importarles el proveedor.
3. El núcleo necesita poseer el comportamiento de reserva, política, configuración o entrega.

Si el trabajo es exclusivo de un proveedor y todavía no existe un contrato compartido, detente y define primero el contrato.

## La secuencia estándar

1. Define el contrato tipado del núcleo.
2. Añade el registro de plugins para ese contrato.
3. Añade un helper de tiempo de ejecución compartido.
4. Conecta un plugin de proveedor real como prueba.
5. Mueve los consumidores de funcionalidades/canales al helper de tiempo de ejecución.
6. Añade pruebas de contrato.
7. Documenta la configuración visible para operadores y el modelo de propiedad.

## Qué va dónde

**Núcleo:**

- Tipos de solicitud/respuesta.
- Registro de proveedores + resolución.
- Comportamiento de reserva.
- Esquema de configuración con metadatos de documentación `title` / `description` propagados en nodos de objeto anidado, comodín, elemento de array y composición.
- Superficie de helpers de tiempo de ejecución.

**Plugin de proveedor:**

- Llamadas a la API del proveedor.
- Manejo de autenticación del proveedor.
- Normalización de solicitudes específica del proveedor.
- Registro de la implementación de la capacidad.

**Plugin de funcionalidad/canal:**

- Llama a `api.runtime.*` o al helper correspondiente de `plugin-sdk/*-runtime`.
- Nunca llama directamente a una implementación de proveedor.

## Puntos de integración de proveedor y arnés

Usa **ganchos de proveedor** cuando el comportamiento pertenezca al contrato del proveedor de modelo en lugar de al bucle genérico del agente. Algunos ejemplos incluyen parámetros de solicitud específicos del proveedor después de seleccionar el transporte, preferencia de perfil de autenticación, superposiciones de prompt y enrutamiento de reserva de seguimiento después de una conmutación por error de modelo/perfil.

Usa **ganchos de arnés de agente** cuando el comportamiento pertenezca al tiempo de ejecución que ejecuta un turno. Los arneses pueden clasificar resultados explícitos del protocolo, como salida vacía, razonamiento sin salida visible o un plan estructurado sin respuesta final, para que la política externa de reserva del modelo pueda tomar la decisión de reintento.

Mantén ambos puntos de integración acotados:

- El núcleo posee la política de reintento/reserva.
- Los plugins de proveedores poseen las pistas de solicitud/autenticación/enrutamiento específicas del proveedor.
- Los plugins de arnés poseen la clasificación de intentos específica del tiempo de ejecución.
- Los plugins de terceros devuelven pistas, no mutaciones directas del estado del núcleo.

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
- Uno o más paquetes de plugins incluidos.
- Configuración, documentación, pruebas.

## Ejemplo desarrollado: generación de imágenes

La generación de imágenes sigue la forma estándar:

1. El núcleo define `ImageGenerationProvider`.
2. El núcleo expone `registerImageGenerationProvider(...)`.
3. El núcleo expone `runtime.imageGeneration.generate(...)`.
4. Los plugins `openai`, `google`, `fal` y `minimax` registran implementaciones respaldadas por proveedores.
5. Los proveedores futuros registran el mismo contrato sin cambiar canales/herramientas.

La clave de configuración está separada intencionalmente del enrutamiento de análisis de visión:

- `agents.defaults.imageModel` analiza imágenes.
- `agents.defaults.imageGenerationModel` genera imágenes.

Mantenlas separadas para que la reserva y la política sigan siendo explícitas.

## Proveedores de embeddings

Usa `embeddingProviders` para proveedores reutilizables de embeddings vectoriales. Este contrato
es intencionalmente más amplio que la memoria: las herramientas, la búsqueda, la recuperación, los importadores o
futuros plugins de funcionalidades pueden consumir embeddings sin depender del motor de memoria.

La búsqueda en memoria puede consumir `embeddingProviders` genéricos. El contrato anterior
`memoryEmbeddingProviders` es compatibilidad obsoleta mientras migran los proveedores existentes
específicos de memoria; los nuevos proveedores reutilizables de embeddings deberían usar
`embeddingProviders`.

## Lista de verificación de revisión

Antes de publicar una nueva capacidad, verifica:

- Ningún canal/herramienta importa directamente código de proveedor.
- El helper de tiempo de ejecución es la ruta compartida.
- Al menos una prueba de contrato afirma la propiedad incluida.
- La documentación de configuración nombra la nueva clave de modelo/configuración.
- La documentación de Plugin explica el límite de propiedad.

Si una PR omite la capa de capacidad y codifica comportamiento de proveedor en un canal/herramienta, devuélvela y define primero el contrato.

## Relacionado

- [Elementos internos de Plugin](/es/plugins/architecture) — modelo de capacidades, propiedad, canalización de carga, helpers de tiempo de ejecución.
- [Crear plugins](/es/plugins/building-plugins) — tutorial del primer plugin.
- [Resumen del SDK](/es/plugins/sdk-overview) — mapa de importación y referencia de API de registro.
- [Crear Skills](/es/tools/creating-skills) — superficie complementaria para colaboradores.
