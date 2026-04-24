---
read_when:
    - Agregar una nueva capacidad central y una superficie de registro de Plugins
    - Decidir si el código pertenece al núcleo, a un Plugin de proveedor o a un Plugin de funcionalidad
    - Conectar un nuevo helper de runtime para canales o herramientas
sidebarTitle: Adding Capabilities
summary: Guía para contribuyentes sobre cómo agregar una nueva capacidad compartida al sistema de Plugins de OpenClaw
title: Agregar capacidades (guía para contribuyentes)
x-i18n:
    generated_at: "2026-04-24T09:02:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Esta es una **guía para contribuyentes** para desarrolladores del núcleo de OpenClaw. Si estás
  creando un Plugin externo, consulta [Building Plugins](/es/plugins/building-plugins)
  en su lugar.
</Info>

Usa esto cuando OpenClaw necesite un nuevo dominio como generación de imágenes, generación de video
o alguna futura área de funcionalidad respaldada por proveedores.

La regla:

- plugin = límite de propiedad
- capability = contrato central compartido

Eso significa que no debes empezar conectando un proveedor directamente a un canal o una
herramienta. Empieza definiendo la capacidad.

## Cuándo crear una capacidad

Crea una nueva capacidad cuando todo lo siguiente sea cierto:

1. más de un proveedor podría implementarla de forma plausible
2. los canales, herramientas o Plugins de funcionalidad deberían consumirla sin preocuparse por
   el proveedor
3. el núcleo necesita ser propietario del comportamiento de fallback, política, configuración o entrega

Si el trabajo es solo de proveedor y todavía no existe un contrato compartido, detente y define
primero el contrato.

## La secuencia estándar

1. Define el contrato central tipado.
2. Agrega el registro de Plugins para ese contrato.
3. Agrega un helper de runtime compartido.
4. Conecta un Plugin de proveedor real como prueba.
5. Mueve los consumidores de funcionalidad/canal al helper de runtime.
6. Agrega pruebas de contrato.
7. Documenta la configuración orientada al operador y el modelo de propiedad.

## Qué va dónde

Núcleo:

- tipos de solicitud/respuesta
- registro de proveedores + resolución
- comportamiento de fallback
- esquema de configuración más metadatos de documentación propagados de `title` / `description` en nodos de objeto anidados, comodín, elementos de array y composición
- superficie del helper de runtime

Plugin de proveedor:

- llamadas a la API del proveedor
- manejo de autenticación del proveedor
- normalización de solicitudes específica del proveedor
- registro de la implementación de la capacidad

Plugin de funcionalidad/canal:

- llama a `api.runtime.*` o al helper correspondiente `plugin-sdk/*-runtime`
- nunca llama directamente a una implementación del proveedor

## Seams de proveedor y Harness

Usa hooks de proveedor cuando el comportamiento pertenezca al contrato del proveedor del modelo
en lugar de al bucle genérico del agente. Algunos ejemplos incluyen parámetros de solicitud específicos del proveedor
después de la selección de transporte, preferencia de perfil de autenticación, overlays de prompt y
enrutamiento de fallback de seguimiento después de failover de modelo/perfil.

Usa hooks de harness del agente cuando el comportamiento pertenezca al runtime que está
ejecutando un turno. Los harnesses pueden clasificar resultados de intento exitosos pero inutilizables,
como respuestas vacías, solo de razonamiento o solo de planificación, para que la política externa
de fallback del modelo pueda tomar la decisión de reintento.

Mantén ambos seams estrechos:

- el núcleo es propietario de la política de reintento/fallback
- los Plugins de proveedor son propietarios de las sugerencias de solicitud/autenticación/enrutamiento específicas del proveedor
- los Plugins de harness son propietarios de la clasificación de intentos específica del runtime
- los Plugins de terceros devuelven sugerencias, no mutaciones directas del estado central

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
- uno o más paquetes de Plugins incluidos
- config/docs/tests

## Ejemplo: generación de imágenes

La generación de imágenes sigue la forma estándar:

1. el núcleo define `ImageGenerationProvider`
2. el núcleo expone `registerImageGenerationProvider(...)`
3. el núcleo expone `runtime.imageGeneration.generate(...)`
4. los Plugins `openai`, `google`, `fal` y `minimax` registran implementaciones respaldadas por proveedores
5. los futuros proveedores pueden registrar el mismo contrato sin cambiar canales/herramientas

La clave de configuración es independiente del enrutamiento de análisis de visión:

- `agents.defaults.imageModel` = analizar imágenes
- `agents.defaults.imageGenerationModel` = generar imágenes

Mantenlas separadas para que el fallback y la política sigan siendo explícitos.

## Lista de revisión

Antes de enviar una nueva capacidad, verifica:

- ningún canal/herramienta importa código del proveedor directamente
- el helper de runtime es la ruta compartida
- al menos una prueba de contrato afirma la propiedad incluida
- la documentación de configuración nombra la nueva clave de modelo/configuración
- la documentación de Plugins explica el límite de propiedad

Si un PR omite la capa de capacidad y codifica de forma fija el comportamiento del proveedor en un
canal/herramienta, devuélvelo y define primero el contrato.

## Relacionado

- [Plugin](/es/tools/plugin)
- [Creating skills](/es/tools/creating-skills)
- [Tools and plugins](/es/tools)
