---
read_when:
    - Añadir una nueva capacidad central y superficie de registro de Plugin
    - |-
      Decidir si el código pertenece al núcleo, a un Plugin de proveedor o a un Plugin de función	RTLU to=functions.read వ్యాఖ్యary เงินไทยฟรีjson  天天中彩票投注  เดิมพันฟรีjson
      {"path":"AGENTS.md","offset":1,"limit":120}
    - Conectar una nueva ayuda de entorno de ejecución para canales o herramientas
sidebarTitle: Adding Capabilities
summary: Guía para colaboradores sobre cómo añadir una nueva capacidad compartida al sistema de Plugins de OpenClaw
title: Añadir capacidades (guía para colaboradores)
x-i18n:
    generated_at: "2026-04-24T05:52:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1e3251b9150c9744d967e91f531dfce01435b13aea3a17088ccd54f2145d14f
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Esta es una **guía para colaboradores** de desarrolladores del núcleo de OpenClaw. Si estás
  creando un Plugin externo, consulta [Building Plugins](/es/plugins/building-plugins)
  en su lugar.
</Info>

Usa esto cuando OpenClaw necesite un nuevo dominio como generación de imágenes, generación de video
o alguna futura área de funciones respaldada por proveedor.

La regla:

- plugin = límite de propiedad
- capability = contrato compartido del núcleo

Eso significa que no debes empezar conectando un proveedor directamente a un canal o una
herramienta. Empieza definiendo la capability.

## Cuándo crear una capability

Crea una nueva capability cuando se cumplan todas estas condiciones:

1. más de un proveedor podría implementarla de forma plausible
2. los canales, herramientas o Plugins de funciones deberían consumirla sin preocuparse por
   el proveedor
3. el núcleo necesita ser propietario del comportamiento de fallback, política, configuración o entrega

Si el trabajo es solo de proveedor y aún no existe un contrato compartido, detente y define
primero el contrato.

## La secuencia estándar

1. Define el contrato tipado del núcleo.
2. Añade el registro de Plugin para ese contrato.
3. Añade una ayuda compartida de entorno de ejecución.
4. Conecta un Plugin real de proveedor como prueba.
5. Mueve los consumidores de funciones/canales a la ayuda de entorno de ejecución.
6. Añade pruebas de contrato.
7. Documenta la configuración orientada al operador y el modelo de propiedad.

## Qué va dónde

Núcleo:

- tipos de solicitud/respuesta
- registro de proveedor + resolución
- comportamiento de fallback
- esquema de configuración más metadatos de documentación `title` / `description` propagados en nodos anidados de objeto, comodín, elemento de array y composición
- superficie de ayudas del entorno de ejecución

Plugin de proveedor:

- llamadas a la API del proveedor
- manejo de autenticación del proveedor
- normalización de solicitudes específica del proveedor
- registro de la implementación de la capability

Plugin de función/canal:

- llama a `api.runtime.*` o a la ayuda `plugin-sdk/*-runtime` correspondiente
- nunca llama directamente a una implementación de proveedor

## Lista de archivos

Para una nueva capability, espera tocar estas áreas:

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
- uno o más paquetes de Plugins integrados
- configuración/documentación/pruebas

## Ejemplo: generación de imágenes

La generación de imágenes sigue la forma estándar:

1. el núcleo define `ImageGenerationProvider`
2. el núcleo expone `registerImageGenerationProvider(...)`
3. el núcleo expone `runtime.imageGeneration.generate(...)`
4. los Plugins `openai`, `google`, `fal` y `minimax` registran implementaciones respaldadas por proveedor
5. futuros proveedores pueden registrar el mismo contrato sin cambiar canales/herramientas

La clave de configuración está separada del enrutamiento de análisis de visión:

- `agents.defaults.imageModel` = analizar imágenes
- `agents.defaults.imageGenerationModel` = generar imágenes

Mantén esto separado para que el fallback y la política sigan siendo explícitos.

## Lista de verificación de revisión

Antes de publicar una nueva capability, verifica:

- ningún canal/herramienta importa código de proveedor directamente
- la ayuda del entorno de ejecución es la ruta compartida
- al menos una prueba de contrato afirma la propiedad integrada
- la documentación de configuración nombra la nueva clave de modelo/configuración
- la documentación del Plugin explica el límite de propiedad

Si una PR omite la capa de capability y codifica el comportamiento del proveedor de forma rígida en un
canal/herramienta, devuélvela y define primero el contrato.

## Relacionado

- [Plugin](/es/tools/plugin)
- [Creación de Skills](/es/tools/creating-skills)
- [Herramientas y plugins](/es/tools)
