---
read_when:
    - Está instalando, configurando o auditando el plugin microsoft-foundry
summary: Agrega soporte del proveedor de modelos Microsoft Foundry a OpenClaw.
title: Plugin de Microsoft Foundry
x-i18n:
    generated_at: "2026-06-27T12:22:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin de Microsoft Foundry

Añade compatibilidad con el proveedor de modelos Microsoft Foundry a OpenClaw.

## Distribución

- Paquete: `@openclaw/microsoft-foundry`
- Ruta de instalación: incluido en OpenClaw

## Superficie

proveedores: microsoft-foundry; contratos: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Proveedor de generación de imágenes: `microsoft-foundry`

## Requisitos

- Un recurso de Microsoft Foundry o Azure AI Foundry con implementaciones.
- Autenticación con clave de API mediante `AZURE_OPENAI_API_KEY` o una clave de API de proveedor configurada.
- Para la autenticación con Entra ID, instala la Azure CLI y ejecuta `az login` antes de
  la incorporación. OpenClaw actualiza los tokens de runtime de Microsoft Foundry mediante
  `az account get-access-token`.

## Modelos de chat

Las implementaciones de chat de Microsoft Foundry usan la referencia de modelo del proveedor
`microsoft-foundry/<deployment-name>`. La incorporación descubre recursos e implementaciones de Foundry
con la Azure CLI y luego escribe el nombre de la implementación seleccionada en
la configuración del modelo.

OpenClaw usa el endpoint `/openai/v1` de Foundry para las API de chat compatibles
con OpenAI admitidas:

- Las familias de modelos GPT, `o*`, `computer-use-preview` y DeepSeek-V4 usan de forma predeterminada
  `openai-responses`.
- MAI-DS-R1 y otras implementaciones de chat completions usan `openai-completions`
  salvo que se configure una API compatible explícita.
- MAI-DS-R1 se registra como compatible con razonamiento mediante contenido de razonamiento, no
  mediante `reasoning_effort`. Sus metadatos de tokens de contexto y salida son
  163.840 tokens.

Las implementaciones de Anthropic Claude en Microsoft Foundry usan la forma de la API Anthropic Messages,
no la forma compatible con OpenAI `/openai/v1`. Configúralas como un
proveedor `anthropic-messages` personalizado hasta que el Plugin de Microsoft Foundry incorpore un
runtime Anthropic nativo. Cuando el nombre de la implementación de Foundry difiera del
ID del modelo Claude, establece `params.canonicalModelId` en la entrada del modelo para que OpenClaw
pueda aplicar contratos de conexión específicos del modelo, asignar `/think off` correctamente y
conservar el pensamiento firmado de forma segura.

## Generación de imágenes MAI

El Plugin registra `microsoft-foundry` para `image_generate` con los modelos actuales
de imágenes de Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Usa el nombre de una implementación de imágenes MAI implementada como referencia del modelo. El proveedor
no declara un modelo de imagen predeterminado porque la API de MAI requiere el nombre de tu implementación
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

Las llamadas de generación solo con prompt usan el endpoint de generaciones MAI de Microsoft Foundry:
`/mai/v1/images/generations`. Las ediciones con imagen de referencia llaman a
`/mai/v1/images/edits` y están limitadas a las implementaciones `MAI-Image-2.5-Flash` y
`MAI-Image-2.5`.

La generación solo con prompt puede usar un nombre de implementación personalizado con solo el endpoint
de Foundry configurado. Para ediciones de imágenes con un nombre de implementación personalizado, selecciona la
implementación mediante la incorporación o incluye metadatos del modelo para que OpenClaw pueda verificar
que la implementación esté respaldada por `MAI-Image-2.5-Flash` o `MAI-Image-2.5`.

Restricciones de imágenes MAI:

- Salida: una imagen PNG por solicitud.
- Tamaño: `1024x1024` de forma predeterminada; tanto el ancho como el alto deben ser de al menos 768 px.
- Píxeles totales: ancho × alto debe ser como máximo 1.048.576.
- Ediciones: una imagen de entrada PNG o JPEG.
- Las sugerencias compartidas no compatibles, como `aspectRatio`, `resolution`, `quality`,
  `background` y `outputFormat` no PNG, no se envían a Microsoft Foundry.

## Solución de problemas

- `az: command not found`: instala la Azure CLI o usa autenticación con clave de API.
- `Microsoft Foundry endpoint missing for MAI image generation`: selecciona una
  implementación de Foundry mediante la incorporación o añade `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: el modelo de imagen seleccionado apunta a una
  implementación que no es MAI. Usa un modelo de imagen MAI implementado para `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
