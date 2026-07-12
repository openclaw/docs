---
read_when:
    - Quieres que un agente muestre un resultado interactivo dentro del chat web
    - Necesita el contrato de entrada, seguridad o retención de show_widget
sidebarTitle: Show widget
summary: Renderiza widgets SVG o HTML autocontenidos en línea en el chat web
title: Mostrar widget
x-i18n:
    generated_at: "2026-07-12T14:55:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` renderiza en línea un fragmento SVG o HTML autocontenido en la transcripción del chat de la interfaz de control. El Plugin Canvas incluido proporciona la herramienta y aloja cada resultado como un documento Canvas del mismo origen.

La herramienta solo está disponible cuando el cliente Gateway de origen declara la capacidad `inline-widgets`. La interfaz de control declara esta capacidad automáticamente. Las ejecuciones de canales como Telegram y WhatsApp no reciben `show_widget`.

El transporte de capacidades abarca los backends de modelos integrados, del servidor de aplicaciones de Codex y basados en la CLI. Los llamadores MCP autenticados mediante concesión y los llamadores directos de invocación de herramientas mediante HTTP mantienen el cierre seguro porque no declaran capacidades de cliente.

## Usar la herramienta

El agente proporciona dos cadenas obligatorias:

<ParamField path="title" type="string" required>
  Título breve que se muestra con la vista previa en línea y en el título del documento alojado.
</ParamField>

<ParamField path="widget_code" type="string" required>
  Fragmento SVG o HTML autocontenido. La entrada que comienza por `<svg` después de eliminar los espacios en blanco se renderiza en modo SVG; cualquier otra entrada se trata como un fragmento HTML. Longitud máxima: 262,144 caracteres.
</ParamField>

El resultado de la herramienta incluye un identificador de vista previa de Canvas, por lo que el chat web renderiza el widget directamente desde la llamada a la herramienta y lo restaura después de volver a cargar el historial. Las transcripciones que no renderizan vistas previas siguen mostrando la ruta de Canvas alojada.

## Seguridad y almacenamiento

Los documentos de widgets utilizan una política de seguridad de contenido restrictiva: se permiten los estilos y scripts en línea, las imágenes pueden usar URL `data:` y se bloquean las solicitudes externas y las cargas de recursos. Mantenga todo el marcado, los estilos, los scripts y los datos de imagen dentro de `widget_code`.

El iframe siempre omite `allow-same-origin`, incluso cuando el modo de inserción global de la interfaz de control es `trusted`, por lo que los scripts del widget no pueden leer el origen de la aplicación principal. El host de Canvas también sirve los documentos de widgets con una cabecera de respuesta `Content-Security-Policy: sandbox allow-scripts`, por lo que abrir directamente la URL alojada sigue ejecutando el widget en un origen opaco en lugar del origen de la interfaz de control. El aislamiento del navegador no impide que un script navegue por su propio iframe; renderice únicamente código de widgets que esté dispuesto a ejecutar en ese marco aislado.

El iframe también sigue [`gateway.controlUi.embedSandbox`](/es/web/control-ui#hosted-embeds). El nivel predeterminado `scripts` admite widgets interactivos y, al mismo tiempo, mantiene el aislamiento del origen.

Canvas conserva como máximo 32 widgets por sesión (o por agente cuando no hay ninguna sesión disponible). Al crear otro widget, se elimina el documento más antiguo de ese ámbito.

## Contenido relacionado

- [Inserciones alojadas de la interfaz de control](/es/web/control-ui#hosted-embeds)
- [Plugin Canvas](/es/plugins/reference/canvas)
- [Capacidades de cliente del protocolo Gateway](/es/gateway/protocol#client-capabilities)
