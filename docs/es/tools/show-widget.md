---
read_when:
    - Quieres que un agente muestre un resultado interactivo en el chat web, una aplicación nativa o Discord
    - Quieres que los botones de los widgets envíen indicaciones de seguimiento al chat
    - Quieres aplicar un tema a los widgets con los tokens de diseño compartidos
    - Necesita el contrato de entrada, seguridad o retención de show_widget
sidebarTitle: Show widget
summary: Mostrar widgets HTML independientes en las superficies de chat compatibles
title: Mostrar widget
x-i18n:
    generated_at: "2026-07-20T01:00:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bcb149984840fdbb84d91da98c488b0a8ca2300f8a1984a8b0b144b0a8d6cd28
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` es una herramienta central que muestra un widget HTML autocontenido en la superficie actual del usuario. OpenClaw lo representa en línea en las transcripciones de chat de la interfaz de control, iOS, Android y macOS; Linux utiliza la interfaz de control del navegador. En una sesión de Discord con [Actividades](/es/channels/discord-activities) habilitadas, el Plugin de Discord publica un botón **Abrir widget** que lo inicia como una actividad.

## Cómo funcionan los widgets

Cuando el agente llama a `show_widget`, el núcleo de OpenClaw envuelve `widget_code` en un documento HTML mínimo, lo almacena como documento de Canvas y devuelve un identificador de vista previa. La interfaz de control representa ese identificador como un iframe aislado directamente debajo de la llamada a la herramienta, mientras que las aplicaciones nativas utilizan una vista web aislada. Ambos restauran el widget después de volver a cargar el historial.

En las sesiones de la interfaz de control, también se puede fijar un widget de Canvas en el panel de la sesión. Establezca `pin: true` en la llamada a la herramienta o utilice **Fijar al panel** en un widget existente de la transcripción. Al fijarlo, se reutiliza exactamente el mismo documento alojado; no se obtiene el HTML del widget mediante el navegador.

Para la inserción en el navegador, el documento contenedor inyecta cuatro pequeños puentes con el host alrededor del código del widget:

- Un indicador de tamaño envía la altura del contenido representado al chat contenedor, que la limita y ajusta el iframe (de 160 a 1200 píxeles).
- Un puente de solicitudes define una función global `sendPrompt(text)` a la que los scripts del widget pueden llamar para enviar un mensaje de seguimiento al chat. El puente crea un canal de mensajes privado y ofrece un punto de conexión al chat antes de que se ejecute cualquier código del widget; el chat acepta únicamente esa primera oferta. Consulte [Widgets interactivos](#interactive-widgets).
- Un puente de temas escucha los tokens de diseño actuales de la interfaz de control y los aplica como variables CSS, al cargar y de nuevo cada vez que cambia el tema.
- Un puente de instantáneas representa el documento actual del widget como PNG cuando el chat contenedor solicita una exportación.

Todo lo demás permanece dentro del marco: el documento se ejecuta en un origen opaco con una Política de Seguridad de Contenido estricta, por lo que los scripts del widget no pueden acceder a la interfaz de control, al Gateway ni a la red.

La implementación del núcleo solo está disponible cuando el cliente de Gateway de origen declara la capacidad `inline-widgets`. La interfaz de control y las aplicaciones nativas compatibles declaran esta capacidad automáticamente. La implementación de Discord solo está disponible en sesiones de Discord con Actividades configuradas. Las ejecuciones de otros canales no reciben `show_widget`.

El transporte de capacidades abarca los backends de modelos integrados, de servidor de aplicaciones Codex y basados en CLI. Los llamadores de MCP autenticados mediante concesión y los llamadores directos de invocación de herramientas por HTTP permanecen cerrados de forma segura porque no declaran capacidades de cliente.

## Sistema de diseño

Cada widget de Canvas incluye una hoja de estilos base sin clases y un pequeño conjunto de tokens:

| Token                                                                                 | Finalidad                                      |
| ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `--surface`                                                                    | Color de la superficie de nivel de página      |
| `--card`                                                                    | Fondo de tarjetas, botones y código             |
| `--elevated`                                                                    | Fondo elevado de controles de formulario       |
| `--text`                                                                    | Texto predeterminado del cuerpo y los controles |
| `--text-strong`                                                                    | Encabezados y valores destacados               |
| `--muted`                                                                    | Texto secundario y bordes sutiles               |
| `--border`                                                                    | Separadores estándar y bordes de tarjetas      |
| `--border-strong`                                                                    | Bordes marcados de controles                   |
| `--accent`                                                                    | Enlaces y anillos de enfoque                   |
| `--accent-fill`                                                                    | Relleno de la acción principal                 |
| `--accent-fg`                                                                    | Texto de una acción principal                  |
| `--ok`                                                                    | Estado correcto                                |
| `--warn`                                                                    | Estado de advertencia                          |
| `--danger`                                                                    | Estado de error o destructivo                  |
| `--info`                                                                    | Estado informativo                             |
| `--radius`                                                                    | Radio de esquina compartido de controles y tarjetas |
| `--font-body`                                                                    | Conjunto de fuentes del cuerpo del host        |
| `--font-mono`                                                                    | Conjunto de fuentes monoespaciadas del host    |
| `--accent-subtle`, `--ok-subtle`, `--warn-subtle`, `--danger-subtle`, `--info-subtle` | Fondos translúcidos derivados para estados |

Los encabezados, párrafos, enlaces, botones, campos de entrada, selectores, áreas de texto, tablas y bloques de código sin clases reciben estilos base. Las clases auxiliares proporcionan patrones comunes:

- `.card` para una superficie de contenido con borde
- `.badge`, además de `.ok`, `.warn`, `.danger` o `.info`, para etiquetas de estado compactas
- `.metric` para un valor numérico destacado
- `.muted` para texto secundario
- `.row` para un diseño horizontal con ajuste de línea
- `button.primary` para la acción principal

La interfaz de control publica un mensaje `openclaw:widget-theme` con los valores del tema activo cuando se carga un widget y cada vez que cambia el tema. Por lo tanto, los widgets siguen todas las familias de temas, incluidas Claw, Knot, Dash y los temas personalizados, sin necesidad de volver a cargarse. Fuera de la interfaz de control, incluidas las aplicaciones nativas y las aperturas directas, los widgets utilizan la paleta clara u oscura integrada seleccionada mediante `prefers-color-scheme`.

Cree widgets conforme a tres reglas:

1. Utilice las variables de diseño para todos los colores y fondos. No codifique valores de color de forma fija.
2. Mantenga transparente el fondo de la página para que el widget se integre en la superficie del host.
3. Reserve `--accent-fill` para una sola acción principal como máximo.

**Exportación:** En el chat web, abra el menú de la tarjeta del widget para copiar el widget representado al portapapeles o descargarlo como PNG. Los documentos de widget antiguos que no incluyen el puente de instantáneas recurren a la descarga de un archivo HTML.

## Uso de la herramienta

Ambas implementaciones utilizan los mismos campos obligatorios:

<ParamField path="title" type="string" required>
  Título breve que se muestra con la vista previa en línea y en el título del documento alojado.
</ParamField>

<ParamField path="widget_code" type="string" required>
  HTML o SVG autocontenido. Para los clientes de widgets en línea, la entrada que comienza con `<svg` después de eliminar los espacios se representa en modo SVG; la longitud máxima es de 262,144 caracteres. Discord acepta un documento HTML completo o un fragmento de cuerpo de hasta 48 KiB.
</ParamField>

Discord también acepta texto opcional `button_label` para el botón que inicia la actividad. El esquema de Canvas omite intencionadamente este campo exclusivo de Discord.

La herramienta central de Canvas acepta estos campos opcionales de colocación en el panel:

- `pin`: también coloca el widget en el panel de la sesión.
- `name`: nombre estable del widget; de forma predeterminada, utiliza un slug de `title`.
- `tab`: slug de la pestaña de destino.
- `size`: uno de `sm`, `md`, `lg`, `xl` o `full`.
- `after`: nombre del widget hermano después del cual se colocará el widget.

El resultado del núcleo incluye un identificador de vista previa de Canvas, por lo que la interfaz de control y las aplicaciones nativas compatibles representan el widget directamente desde la llamada a la herramienta y lo restauran después de volver a cargar el historial. Los resultados fijados también conservan el nombre del widget del panel para que la interfaz de control no ofrezca volver a fijarlo después de recargar la transcripción. Discord devuelve los identificadores del widget almacenado y del mensaje publicado.

`discord_widget` permanece registrado como alias obsoleto durante una versión. Las nuevas llamadas de agentes deben utilizar `show_widget`.

## Widgets interactivos

En la interfaz de control, los scripts de los widgets pueden dirigir la conversación. El documento contenedor define una función global `sendPrompt(text)`; al llamarla, se envía `text` al chat como si el usuario hubiera escrito y enviado el mensaje. Conéctela a botones u otros controles para crear flujos interactivos, como selectores, cuestionarios o paneles de exploración detallada. Las aplicaciones nativas representan el código interactivo de los widgets, pero no exponen este puente de solicitudes del chat.

```html
<button onclick="sendPrompt('Muestra en detalle las pruebas que fallan')">Pruebas que fallan</button>
```

Cada solicitud se valida a ambos lados del límite del marco:

- `sendPrompt` requiere [activación transitoria del usuario](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation) dentro del widget: solo funciona durante los pocos segundos posteriores a que el usuario haga clic o pulse una tecla en el widget, por lo que debe conectarse a botones y otros objetivos de clic; llamarla automáticamente durante la carga no produce ningún efecto. El puente mantiene privado su punto de conexión de envío y se cierra de forma segura en los navegadores que no exponen la activación del usuario, por lo que el código del widget no puede eludir la comprobación.
- La autoridad para enviar solicitudes pertenece únicamente al documento original del widget. El puente de confianza ofrece su punto de conexión del canal al chat antes de que el código del widget pueda ejecutarse o navegar por el marco, el chat acepta únicamente esa primera oferta y el canal deja de existir con el documento al navegar. Las URL de inserción permitidas externamente nunca se aceptan.
- El marco del widget debe estar visible en la transcripción del chat y tener el foco, una señal adicional observada por el host de que el usuario está interactuando realmente con este widget.
- El texto no debe estar vacío después de eliminar los espacios y debe tener como máximo 4,000 caracteres.
- Se rechazan las solicitudes que comienzan con `/`, por lo que el código del widget no puede activar comandos de chat como `/approve` o `/stop`.
- Cada documento de widget puede enviar como máximo 10 solicitudes por minuto móvil; las solicitudes excedentes se descartan silenciosamente.

Las solicitudes aceptadas aparecen en la transcripción como mensajes normales del usuario e inician un turno normal del agente en la sesión propietaria del widget. No existe ningún canal de respuesta hacia el widget: una solicitud descartada falla silenciosamente y el widget no puede leer la respuesta del agente.

## Seguridad y almacenamiento

Los documentos de los widgets utilizan Políticas de Seguridad de Contenido restrictivas. Se permiten los estilos y scripts en línea, mientras que se bloquean las solicitudes y cargas de recursos externos. Mantenga todo el marcado, los estilos, los scripts y los datos de imágenes dentro de `widget_code`.

El iframe de la interfaz de control siempre omite `allow-same-origin`, incluso cuando el modo de inserción global es `trusted`, por lo que los scripts de los widgets no pueden leer el origen de la aplicación principal. Los clientes nativos utilizan vistas web aisladas y no persistentes, y bloquean la navegación fuera del widget alojado. El host de documentos principal también sirve los widgets con un encabezado de respuesta `Content-Security-Policy: sandbox allow-scripts`, por lo que la representación directa sigue ejecutando el widget en un origen opaco en lugar de en el origen de una aplicación. Representa únicamente código de widgets que se esté dispuesto a ejecutar en ese marco aislado.

El iframe también sigue [`gateway.controlUi.embedSandbox`](/es/web/control-ui#hosted-embeds). El nivel predeterminado `scripts` admite widgets interactivos y, al mismo tiempo, conserva el aislamiento del origen.

Canvas conserva como máximo 32 widgets por sesión (o por agente cuando no hay ninguna sesión disponible). Al crear otro widget, se elimina el documento más antiguo de ese ámbito.

## Contenido relacionado

- [Inserciones alojadas de la interfaz de control](/es/web/control-ui#hosted-embeds)
- [Actividades de Discord](/es/channels/discord-activities)
- [Controles de nodos de Canvas](/es/plugins/reference/canvas)
- [Capacidades del cliente del protocolo del Gateway](/es/gateway/protocol#client-capabilities)
