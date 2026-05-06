---
read_when:
    - Agregar una nueva capacidad del núcleo y una superficie de registro de Plugin
    - Decidir si el código debe estar en el núcleo, en un Plugin de proveedor o en un Plugin de funcionalidad
    - Conectar un nuevo auxiliar de tiempo de ejecución para canales o herramientas
sidebarTitle: Adding capabilities
summary: Guía para colaboradores para añadir una nueva capacidad compartida al sistema de plugins de OpenClaw
title: Añadir capacidades (guía para colaboradores)
x-i18n:
    generated_at: "2026-05-06T05:42:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Esta es una **guía para colaboradores** para desarrolladores principales de OpenClaw. Si estás
  creando un plugin externo, consulta [Crear plugins](/es/plugins/building-plugins)
  en su lugar. Para la referencia de arquitectura profunda (modelo de capacidades, propiedad,
  canalización de carga, ayudantes de runtime), consulta [Internos del Plugin](/es/plugins/architecture).
</Info>

Usa esto cuando OpenClaw necesite un nuevo dominio compartido, como generación de imágenes, generación de video o alguna futura área de funciones respaldada por proveedores.

La regla:

- **plugin** = límite de propiedad
- **capacidad** = contrato compartido del núcleo

No empieces conectando un proveedor directamente a un canal o una herramienta. Empieza definiendo la capacidad.

## Cuándo crear una capacidad

Crea una nueva capacidad cuando **todo** lo siguiente sea cierto:

1. Más de un proveedor podría implementarla de forma plausible.
2. Los canales, herramientas o plugins de funciones deberían consumirla sin preocuparse por el proveedor.
3. El núcleo necesita poseer el comportamiento de fallback, política, configuración o entrega.

Si el trabajo es solo para un proveedor y aún no existe un contrato compartido, detente y define primero el contrato.

## La secuencia estándar

1. Define el contrato tipado del núcleo.
2. Agrega el registro de plugins para ese contrato.
3. Agrega un ayudante de runtime compartido.
4. Conecta un plugin de proveedor real como prueba.
5. Mueve los consumidores de funciones/canales al ayudante de runtime.
6. Agrega pruebas de contrato.
7. Documenta la configuración orientada al operador y el modelo de propiedad.

## Qué va dónde

**Núcleo:**

- Tipos de solicitud/respuesta.
- Registro de proveedores + resolución.
- Comportamiento de fallback.
- Esquema de configuración con metadatos de documentación `title` / `description` propagados en nodos de objeto anidado, comodín, elemento de array y composición.
- Superficie de ayudante de runtime.

**Plugin de proveedor:**

- Llamadas a la API del proveedor.
- Manejo de autenticación del proveedor.
- Normalización de solicitudes específica del proveedor.
- Registro de la implementación de la capacidad.

**Plugin de función/canal:**

- Llama a `api.runtime.*` o al ayudante `plugin-sdk/*-runtime` correspondiente.
- Nunca llama directamente a una implementación de proveedor.

## Seams de proveedor y arnés

Usa **hooks de proveedor** cuando el comportamiento pertenezca al contrato del proveedor de modelo en lugar del bucle genérico del agente. Algunos ejemplos incluyen parámetros de solicitud específicos del proveedor después de la selección de transporte, preferencia de perfil de autenticación, superposiciones de prompt y enrutamiento de fallback de seguimiento después de una conmutación por error de modelo/perfil.

Usa **hooks de arnés de agente** cuando el comportamiento pertenezca al runtime que ejecuta un turno. Los arneses pueden clasificar resultados de intentos exitosos pero inutilizables, como respuestas vacías, solo de razonamiento o solo de planificación, para que la política externa de fallback de modelo pueda tomar la decisión de reintento.

Mantén ambos seams estrechos:

- El núcleo posee la política de reintento/fallback.
- Los plugins de proveedor poseen las pistas de solicitud/autenticación/enrutamiento específicas del proveedor.
- Los plugins de arnés poseen la clasificación de intentos específica del runtime.
- Los plugins de terceros devuelven pistas, no mutaciones directas del estado del núcleo.

## Lista de comprobación de archivos

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

## Ejemplo trabajado: generación de imágenes

La generación de imágenes sigue la forma estándar:

1. El núcleo define `ImageGenerationProvider`.
2. El núcleo expone `registerImageGenerationProvider(...)`.
3. El núcleo expone `runtime.imageGeneration.generate(...)`.
4. Los plugins `openai`, `google`, `fal` y `minimax` registran implementaciones respaldadas por proveedores.
5. Los futuros proveedores registran el mismo contrato sin cambiar canales/herramientas.

La clave de configuración está separada intencionalmente del enrutamiento de análisis de visión:

- `agents.defaults.imageModel` analiza imágenes.
- `agents.defaults.imageGenerationModel` genera imágenes.

Mantén esas claves separadas para que el fallback y la política sigan siendo explícitos.

## Lista de comprobación de revisión

Antes de publicar una nueva capacidad, verifica:

- Ningún canal/herramienta importa directamente código de proveedor.
- El ayudante de runtime es la ruta compartida.
- Al menos una prueba de contrato afirma la propiedad incluida.
- La documentación de configuración nombra la nueva clave de modelo/configuración.
- La documentación de Plugin explica el límite de propiedad.

Si un PR omite la capa de capacidad y codifica de forma rígida el comportamiento del proveedor en un canal/herramienta, devuélvelo y define primero el contrato.

## Relacionado

- [Internos del Plugin](/es/plugins/architecture) — modelo de capacidades, propiedad, canalización de carga, ayudantes de runtime.
- [Crear plugins](/es/plugins/building-plugins) — tutorial del primer plugin.
- [Resumen del SDK](/es/plugins/sdk-overview) — mapa de importaciones y referencia de la API de registro.
- [Crear Skills](/es/tools/creating-skills) — superficie complementaria para colaboradores.
