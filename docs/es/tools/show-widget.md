---
read_when:
    - Quieres que un agente muestre un resultado interactivo en el chat web, una aplicación nativa o Discord
    - Quieres que los botones de los widgets envíen indicaciones de seguimiento al chat
    - Quieres aplicar un tema a los widgets con los tokens de diseño compartidos
    - Necesita el contrato de entrada, seguridad o retención de show_widget
sidebarTitle: Show widget
summary: Mostrar widgets HTML independientes en superficies de chat compatibles
title: Mostrar widget
x-i18n:
    generated_at: "2026-07-19T02:27:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f269156b16b40d5171d5a0e8edaef87a9cb726a536dce1d9a73a426ce89a71b2
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` es una herramienta central que muestra un widget HTML autónomo en la superficie actual del usuario. OpenClaw lo renderiza en línea en las transcripciones de chat de la interfaz de control, iOS, Android y macOS; Linux utiliza la interfaz de control del navegador. En una sesión de Discord con [Activities](/channels/discord-activities) habilitadas, el plugin de Discord publica un botón **Open widget** que lo inicia como una Activity.

## Cómo funcionan los widgets

Cuando el agente llama a `show_widget`, el núcleo de OpenClaw envuelve `widget_code` en un documento HTML mínimo, lo almacena como un documento de Canvas y devuelve un identificador de vista previa. La interfaz de control renderiza ese identificador como un iframe en entorno aislado directamente debajo de la llamada a la herramienta, mientras que las aplicaciones nativas utilizan una vista web aislada. Ambos restauran el widget después de recargar el historial.

Para la inserción en el navegador, el documento contenedor inyecta cuatro pequeños puentes con el host alrededor del código del widget:

- Un notificador de tamaño envía la altura del contenido renderizado al chat contenedor, que la limita y ajusta el iframe (de 160 a 1200 píxeles).
- Un puente de prompts define una función global `sendPrompt(text)` que los scripts del widget pueden llamar para enviar un mensaje de seguimiento al chat. El puente crea un canal privado de mensajes y ofrece un punto de conexión al chat antes de que se ejecute el código del widget; el chat solo acepta esa primera oferta. Consulte [Widgets interactivos](#interactive-widgets).
- Un puente de temas escucha los tokens de diseño actuales de la interfaz de control y los aplica como variables CSS, durante la carga y de nuevo con cada cambio de tema.
- Un puente de instantáneas renderiza el documento actual del widget como PNG cuando el chat contenedor solicita una exportación.

Todo lo demás permanece dentro del marco: el documento se ejecuta en un origen opaco con una política de seguridad de contenido estricta, por lo que los scripts del widget no pueden acceder a la interfaz de control, al Gateway ni a la red.

La implementación del núcleo solo está disponible cuando el cliente Gateway de origen declara la capacidad `inline-widgets`. La interfaz de control y las aplicaciones nativas compatibles declaran esta capacidad automáticamente. La implementación de Discord solo está disponible en sesiones de Discord con Activities configuradas. Las ejecuciones de otros canales no reciben `show_widget`.

El transporte de capacidades abarca los backends de modelos integrados, de Codex app-server y basados en CLI. Los clientes MCP autenticados mediante concesión y los clientes que invocan herramientas directamente por HTTP mantienen un cierre seguro porque no declaran capacidades de cliente.

## Sistema de diseño

Cada widget de Canvas incluye una hoja de estilos base sin clases y un pequeño conjunto de tokens:

| Token                                                                                 | Propósito                              |
| ------------------------------------------------------------------------------------- | -------------------------------------- |
| `--surface`                                                                           | Color de la superficie de la página    |
| `--card`                                                                              | Fondo de tarjetas, botones y código    |
| `--elevated`                                                                          | Fondo elevado de controles de formulario |
| `--text`                                                                              | Texto predeterminado del cuerpo y los controles |
| `--text-strong`                                                                       | Encabezados y valores destacados       |
| `--muted`                                                                             | Texto secundario y bordes sutiles      |
| `--border`                                                                            | Separadores estándar y bordes de tarjetas |
| `--border-strong`                                                                     | Bordes marcados de controles           |
| `--accent`                                                                            | Enlaces y anillos de enfoque           |
| `--accent-fill`                                                                       | Relleno de la acción principal         |
| `--accent-fg`                                                                         | Texto de una acción principal          |
| `--ok`                                                                                | Estado de éxito                        |
| `--warn`                                                                              | Estado de advertencia                  |
| `--danger`                                                                            | Estado de error o destructivo          |
| `--info`                                                                              | Estado informativo                     |
| `--radius`                                                                            | Radio de esquina compartido de controles y tarjetas |
| `--font-body`                                                                         | Conjunto de fuentes del cuerpo del host |
| `--font-mono`                                                                         | Conjunto de fuentes monoespaciadas del host |
| `--accent-subtle`, `--ok-subtle`, `--warn-subtle`, `--danger-subtle`, `--info-subtle` | Fondos de estado translúcidos derivados |

Los encabezados, párrafos, enlaces, botones, campos de entrada, selectores, áreas de texto, tablas y bloques de código sin clases reciben estilos base. Las clases auxiliares proporcionan patrones comunes:

- `.card` para una superficie de contenido con borde
- `.badge`, además de `.ok`, `.warn`, `.danger` o `.info`, para etiquetas de estado compactas
- `.metric` para un valor numérico destacado
- `.muted` para texto secundario
- `.row` para un diseño horizontal con ajuste de línea
- `button.primary` para la acción principal

La interfaz de control publica un mensaje `openclaw:widget-theme` con los valores del tema activo cuando se carga un widget y cada vez que cambia el tema. Por tanto, los widgets siguen todas las familias de temas, incluidas Claw, Knot, Dash y los temas personalizados, sin recargarse. Fuera de la interfaz de control, incluidas las aplicaciones nativas y las aperturas directas, los widgets utilizan la paleta clara u oscura incorporada seleccionada por `prefers-color-scheme`.

Cree widgets siguiendo tres reglas:

1. Utilice las variables de diseño para todos los colores y fondos. No codifique valores de color de forma fija.
2. Mantenga transparente el fondo de la página para que el widget se integre en la superficie de su host.
3. Reserve `--accent-fill` para una sola acción principal como máximo.

**Exportación:** En el chat web, abra el menú de la tarjeta del widget para copiar el widget renderizado al portapapeles o descargarlo como PNG. Los documentos de widgets antiguos que no incluyan el puente de instantáneas recurren a la descarga de un archivo HTML.

## Uso de la herramienta

Ambas implementaciones utilizan los mismos campos obligatorios:

<ParamField path="title" type="string" required>
  Título breve que se muestra con la vista previa en línea y en el título del documento alojado.
</ParamField>

<ParamField path="widget_code" type="string" required>
  HTML o SVG autónomo. Para los clientes de widgets en línea, una entrada que comience por `<svg` después de eliminar los espacios se renderiza en modo SVG; la longitud máxima es de 262,144 caracteres. Discord acepta un documento HTML completo o un fragmento del cuerpo de hasta 48 KiB.
</ParamField>

Discord también acepta el texto opcional `button_label` para el botón que inicia la Activity. El esquema de Canvas omite intencionadamente este campo exclusivo de Discord.

El resultado del núcleo incluye un identificador de vista previa de Canvas, por lo que la interfaz de control y las aplicaciones nativas compatibles renderizan el widget directamente desde la llamada a la herramienta y lo restauran después de recargar el historial. Discord devuelve los identificadores del widget almacenado y del mensaje publicado.

`discord_widget` permanece registrado como alias obsoleto durante una versión. Las nuevas llamadas de agentes deben utilizar `show_widget`.

## Widgets interactivos

En la interfaz de control, los scripts de los widgets pueden dirigir la conversación. El documento contenedor define una función global `sendPrompt(text)`; al llamarla, envía `text` al chat como si el usuario hubiera escrito y enviado el mensaje. Vincúlela a botones u otros controles para crear flujos interactivos, como selectores, cuestionarios o paneles con niveles de detalle. Las aplicaciones nativas renderizan código de widgets interactivos, pero no exponen este puente de prompts del chat.

```html
<button onclick="sendPrompt('Muestra en detalle las pruebas que fallan')">Pruebas que fallan</button>
```

Cada prompt se valida a ambos lados del límite del marco:

- `sendPrompt` requiere [activación transitoria del usuario](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation) dentro del widget: solo funciona durante los pocos segundos posteriores a que el usuario haga clic o pulse una tecla en el widget, por lo que debe vincularse a botones y otros objetivos de clic; llamarlo automáticamente durante la carga no tiene ningún efecto. El puente mantiene privado su punto de conexión de envío y aplica un cierre seguro en los navegadores que no exponen la activación del usuario, por lo que el código del widget no puede eludir la comprobación.
- La autoridad sobre los prompts pertenece únicamente al documento original del widget. El puente de confianza ofrece su punto de conexión del canal al chat antes de que el código del widget pueda ejecutarse o navegar por el marco, el chat solo acepta esa primera oferta y el canal desaparece con el documento al navegar. Las URL de inserción permitidas externamente nunca se aceptan.
- El marco del widget debe estar visible en la transcripción del chat y tener el foco, una señal adicional observada por el host de que el usuario está interactuando realmente con este widget.
- El texto no debe quedar vacío después de eliminar los espacios y puede tener como máximo 4,000 caracteres.
- Los prompts que comiencen por `/` se rechazan, por lo que el código del widget no puede activar comandos del chat como `/approve` o `/stop`.
- Cada documento de widget puede enviar como máximo 10 prompts por minuto móvil; los prompts excedentes se descartan silenciosamente.

Los prompts aceptados aparecen en la transcripción como mensajes normales del usuario e inician un turno normal del agente en la sesión propietaria del widget. No existe ningún canal de respuesta hacia el widget: un prompt descartado falla silenciosamente y el widget no puede leer la respuesta del agente.

## Seguridad y almacenamiento

Los documentos de widgets utilizan políticas de seguridad de contenido restrictivas. Se permiten los estilos y scripts en línea, mientras que se bloquean las solicitudes externas y la carga de recursos. Mantenga todo el marcado, los estilos, los scripts y los datos de imágenes dentro de `widget_code`.

El iframe de la interfaz de control siempre omite `allow-same-origin`, incluso cuando el modo global de inserción es `trusted`, por lo que los scripts del widget no pueden leer el origen de la aplicación principal. Los clientes nativos utilizan vistas web aisladas y no persistentes, y bloquean la navegación fuera del widget alojado. El host de documentos del núcleo también sirve los widgets con un encabezado de respuesta `Content-Security-Policy: sandbox allow-scripts`, por lo que el renderizado directo sigue ejecutando el widget en un origen opaco en lugar de un origen de aplicación. Renderice únicamente código de widgets que esté dispuesto a ejecutar en ese marco aislado.

El iframe también sigue [`gateway.controlUi.embedSandbox`](/es/web/control-ui#hosted-embeds). El nivel predeterminado `scripts` admite widgets interactivos y conserva el aislamiento del origen.

Canvas conserva como máximo 32 widgets por sesión (o por agente cuando no hay ninguna sesión disponible). Al crear otro widget, se elimina el documento más antiguo de ese ámbito.

## Relacionado

- [Inserciones alojadas de la interfaz de control](/es/web/control-ui#hosted-embeds)
- [Activities de Discord](/channels/discord-activities)
- [Controles de nodos de Canvas](/es/plugins/reference/canvas)
- [Capacidades de cliente del protocolo Gateway](/es/gateway/protocol#client-capabilities)
