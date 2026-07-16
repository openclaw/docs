---
read_when:
    - Está instalando, configurando o auditando el plugin microsoft-foundry
summary: Añade compatibilidad con el proveedor de modelos Microsoft Foundry a OpenClaw.
title: Plugin de Microsoft Foundry
x-i18n:
    generated_at: "2026-07-16T11:52:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ea554ce16cffeb4cc315e53d986d6f07b5e113fbb844c61c6575f19f8ad291
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin de Microsoft Foundry

Añade compatibilidad con el proveedor de modelos Microsoft Foundry a OpenClaw.

## Distribución

- Paquete: `@openclaw/microsoft-foundry`
- Método de instalación: incluido en OpenClaw

## Superficie

proveedores: `microsoft-foundry`; contratos: `imageGenerationProviders`

<!-- openclaw-plugin-reference:manual-start -->

- Proveedor de generación de imágenes: `microsoft-foundry`

## Requisitos

- Un recurso de Microsoft Foundry o Azure AI Foundry con implementaciones.
- Autenticación mediante clave de API a través de `AZURE_OPENAI_API_KEY` o una clave de API configurada para el proveedor.
- Para la autenticación con Entra ID, instale la CLI de Azure y ejecute `az login` antes
  de la incorporación. OpenClaw actualiza los tokens de tiempo de ejecución de Microsoft Foundry mediante
  `az account get-access-token`.

## Modelos de chat

Las implementaciones de chat de Microsoft Foundry usan la referencia de modelo del proveedor
`microsoft-foundry/<deployment-name>`. La incorporación detecta los recursos
y las implementaciones de Foundry mediante la CLI de Azure y, a continuación, escribe el nombre de la implementación seleccionada en
la configuración del modelo.

OpenClaw usa el punto de conexión `/openai/v1` de Foundry para las API de chat compatibles
con OpenAI admitidas:

- Las familias de modelos GPT, `o*`, `computer-use-preview` y DeepSeek-V4 usan de forma predeterminada
  `openai-responses`.
- MAI-DS-R1 y otras implementaciones de finalización de chat usan `openai-completions`,
  salvo que se configure explícitamente una API compatible.
- MAI-DS-R1 se registra como capaz de razonar mediante contenido de razonamiento, no
  mediante `reasoning_effort`. Sus metadatos de tokens de contexto y salida son de
  163,840 tokens.

Las implementaciones de Anthropic Claude en Microsoft Foundry usan el formato de la API Anthropic Messages,
no el formato `/openai/v1` compatible con OpenAI. Configúrelas como un
proveedor `anthropic-messages` personalizado hasta que el Plugin de Microsoft Foundry incorpore un
tiempo de ejecución nativo de Anthropic. Cuando el nombre de la implementación de Foundry difiera del
ID del modelo Claude, establezca `params.canonicalModelId` en la entrada del modelo para que OpenClaw
pueda aplicar contratos de protocolo específicos del modelo, asignar correctamente `/think off` y
conservar de forma segura el razonamiento firmado.

## Generación de imágenes con MAI

El Plugin registra `microsoft-foundry` para `image_generate` con los modelos
de imágenes actuales de Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Use como referencia del modelo el nombre de una implementación de imágenes MAI implementada. El proveedor
no declara un modelo de imágenes predeterminado porque la API de MAI requiere el nombre de su implementación
en el campo `model` de la solicitud:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

La generación basada únicamente en instrucciones llama al punto de conexión de generaciones MAI de Microsoft Foundry:
`/mai/v1/images/generations`. Las ediciones de imágenes de referencia llaman a
`/mai/v1/images/edits` y están limitadas a las implementaciones `MAI-Image-2.5-Flash` y
`MAI-Image-2.5`.

La generación basada únicamente en instrucciones puede usar un nombre de implementación personalizado con solo el punto de conexión
de Foundry configurado. Para las ediciones de imágenes con un nombre de implementación personalizado, seleccione la
implementación durante la incorporación o incluya metadatos del modelo para que OpenClaw pueda verificar
que la implementación se basa en `MAI-Image-2.5-Flash` o `MAI-Image-2.5`.

Restricciones de imágenes MAI:

- Salida: una imagen PNG por solicitud.
- Tamaño: valor predeterminado `1024x1024`; tanto el ancho como el alto deben ser de al menos 768 px.
- Píxeles totales: ancho × alto debe ser como máximo 1,048,576.
- Ediciones: una imagen de entrada PNG o JPEG.
- Las indicaciones compartidas no compatibles, como `aspectRatio`, `resolution`, `quality`,
  `background` y los valores de `outputFormat` distintos de PNG no se envían a Microsoft Foundry.

## Solución de problemas

- `az: command not found`: instale la CLI de Azure o use autenticación mediante clave de API.
- `Microsoft Foundry endpoint missing for MAI image generation`: seleccione una
  implementación de Foundry durante la incorporación o añada `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: el modelo de imágenes seleccionado apunta a una
  implementación que no es de MAI. Use un modelo de imágenes MAI implementado para `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
