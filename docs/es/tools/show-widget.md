---
read_when:
    - Quieres que un agente muestre un resultado interactivo en el chat web, una aplicación nativa o Discord
    - Quiere que los botones del widget envíen indicaciones de seguimiento al chat
    - Quieres aplicar un tema a los widgets con los tokens de diseño compartidos
    - Necesita el contrato de entrada, seguridad o retención de show_widget
sidebarTitle: Show widget
summary: Muestra widgets HTML autocontenidos en superficies de chat compatibles
title: Mostrar widget
x-i18n:
    generated_at: "2026-07-21T09:02:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 903adff1fadeb9d224d3e2d839c86082b5244e1e319255c8d3f6619344b749a3
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` es una herramienta principal que muestra un widget HTML autónomo en la superficie actual del usuario. OpenClaw lo representa en línea en la interfaz de control y en las transcripciones de Chat rápido de iOS, Android, macOS y Linux; el panel de Linux utiliza la interfaz de control del navegador. En una sesión de Discord con [Actividades](/es/channels/discord-activities) habilitadas, el plugin de Discord publica un botón **Abrir widget** que lo inicia como una actividad.

## Cómo funcionan los widgets

Cuando el agente llama a `show_widget`, el núcleo de OpenClaw envuelve `widget_code` en un documento HTML mínimo, lo almacena como documento de Canvas y devuelve un identificador de vista previa. La interfaz de control representa ese identificador en un iframe aislado, mientras que Chat rápido de iOS, Android, macOS y Linux utiliza vistas web aisladas. Los clientes de chat completos restauran el widget después de volver a cargar el historial; Chat rápido conserva el widget durante su respuesta activa.

En las sesiones de la interfaz de control, un widget de Canvas también se puede fijar al panel de la sesión. Establezca `pin: true` en la llamada a la herramienta o utilice **Fijar al panel** en un widget existente de la transcripción. El HTML fijado se ejecuta detrás del mismo host de aislamiento de doble iframe y origen dedicado que utilizan las aplicaciones MCP; el navegador nunca resuelve un enlace de datos del widget dentro del marco no confiable.

Para la inserción en el navegador, el documento contenedor inyecta cuatro pequeños puentes del host alrededor del código del widget:

- Un informador de tamaño envía la altura del contenido representado al chat contenedor, que la limita y ajusta el iframe (de 160 a 1200 píxeles).
- Un puente del host define la función auxiliar heredada `sendPrompt(text)`, además de las API estructuradas `openclaw.prompt`, `openclaw.state`, `openclaw.data` y `openclaw.cron`. Las solicitudes en línea del chat conservan su canal de mensajes privado; las API del panel utilizan un canal de solicitudes vinculado a un vale de vista. Consulte [Widgets interactivos](#interactive-widgets) y [Capacidades del panel](#dashboard-capabilities).
- Un puente de tema escucha los tokens de diseño actuales de la interfaz de control y los aplica como variables CSS, al cargar y de nuevo con cada cambio de tema.
- Un puente de instantáneas representa el documento actual del widget como PNG cuando el chat contenedor solicita una exportación.

Todo lo demás permanece dentro del marco: el documento se ejecuta en un origen opaco con una Política de Seguridad de Contenidos estricta, por lo que los scripts del widget no pueden acceder a la interfaz de control, al Gateway ni a la red.

La implementación principal solo está disponible cuando el cliente Gateway de origen declara la capacidad `inline-widgets`. La interfaz de control y las aplicaciones nativas compatibles declaran esta capacidad automáticamente. Chat rápido de Linux permanece limitado a texto para las conexiones del Gateway que requieren un anclaje personalizado del certificado TLS final, porque la WebView de su plataforma no puede vincular ese anclaje. La implementación de Discord solo está disponible en sesiones de Discord con Actividades configuradas. Las ejecuciones de otros canales no reciben `show_widget`.

El transporte de capacidades cubre los backends de modelos integrados, de servidor de aplicaciones Codex y basados en CLI. Los invocadores de MCP autenticados mediante concesión y los invocadores directos de herramientas HTTP permanecen cerrados de forma segura porque no declaran capacidades de cliente.

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
| `--ok`                                                                                | Estado correcto                        |
| `--warn`                                                                              | Estado de advertencia                  |
| `--danger`                                                                            | Estado de error o destructivo          |
| `--info`                                                                              | Estado informativo                     |
| `--radius`                                                                            | Radio de esquina compartido de controles y tarjetas |
| `--font-body`                                                                         | Conjunto de fuentes del cuerpo del host |
| `--font-mono`                                                                         | Conjunto de fuentes monoespaciadas del host |
| `--accent-subtle`, `--ok-subtle`, `--warn-subtle`, `--danger-subtle`, `--info-subtle` | Fondos translúcidos derivados para estados |

Los encabezados, párrafos, enlaces, botones, campos de entrada, selectores, áreas de texto, tablas y bloques de código sin clases reciben estilos base. Las clases auxiliares proporcionan patrones comunes:

- `.card` para una superficie de contenido con borde
- `.badge`, junto con `.ok`, `.warn`, `.danger` o `.info`, para etiquetas de estado compactas
- `.metric` para un valor numérico destacado
- `.muted` para texto secundario
- `.row` para una disposición horizontal con ajuste de línea
- `button.primary` para la acción principal

La interfaz de control publica un mensaje `openclaw:widget-theme` con los valores del tema activo cuando se carga un widget y cada vez que cambia el tema. Por tanto, los widgets siguen todas las familias de temas, incluidas Claw, Knot, Dash y los temas personalizados, sin volver a cargarse. Fuera de la interfaz de control, incluidas las aplicaciones nativas y las aperturas directas, los widgets utilizan la paleta clara u oscura integrada seleccionada por `prefers-color-scheme`.

Cree widgets siguiendo tres reglas:

1. Utilice las variables de diseño para todos los colores y fondos. No codifique valores de color de forma fija.
2. Mantenga transparente el fondo de la página para que el widget pertenezca a la superficie de su host.
3. Reserve `--accent-fill` para una sola acción principal como máximo.

**Exportación:** En el chat web, abra el menú de la tarjeta del widget para copiar el widget representado al portapapeles o descargarlo como PNG. Los documentos de widgets antiguos sin el puente de instantáneas recurren a la descarga de un archivo HTML.

## Uso de la herramienta

Ambas implementaciones utilizan los mismos campos obligatorios:

<ParamField path="title" type="string" required>
  Título breve que se muestra con la vista previa en línea y en el título del documento alojado.
</ParamField>

<ParamField path="widget_code" type="string" required>
  HTML o SVG autónomo. Para los clientes de widgets en línea, la entrada que comienza por `<svg` después de eliminar los espacios en blanco se representa en modo SVG; la longitud máxima es de 262,144 caracteres. Discord acepta un documento HTML completo o un fragmento del cuerpo de hasta 48 KiB.
</ParamField>

Discord también acepta texto `button_label` opcional para el botón de inicio de la actividad. El esquema de Canvas omite intencionadamente este campo exclusivo de Discord.

La herramienta principal Canvas acepta estos campos opcionales de colocación en el panel:

- `pin`: también coloca el widget en el panel de la sesión.
- `name`: nombre estable del widget; de forma predeterminada, se utiliza un slug de `title`.
- `tab`: slug de la pestaña de destino.
- `size`: uno de `sm`, `md`, `lg`, `xl` o `full`.
- `after`: nombre del widget hermano después del cual se colocará el widget.
- `capabilities`: acceso solicitado por un widget fijado. `netOrigins` contiene orígenes HTTPS exactos; `tools` contiene `prompt`, un enlace de lectura incluido en la lista de permitidos o una acción `cron.trigger:<jobId>` exacta.

El resultado principal incluye un identificador de vista previa de Canvas, por lo que la interfaz de control y las aplicaciones nativas compatibles representan el widget directamente desde la llamada a la herramienta y lo restauran después de volver a cargar el historial. Los resultados fijados también conservan el nombre del widget del tablero para que la interfaz de control no ofrezca fijarlo por duplicado después de volver a cargar la transcripción. Discord devuelve los identificadores del widget almacenado y del mensaje publicado.

`discord_widget` permanece registrado como alias obsoleto durante una versión. Las nuevas llamadas del agente deben utilizar `show_widget`.

## Widgets interactivos

En la interfaz de control, los scripts del widget pueden dirigir la conversación. El documento contenedor define una función global `sendPrompt(text)`; al llamarla, se envía `text` al chat como si el usuario hubiera escrito y enviado el mensaje. Conéctela a botones u otros controles para crear flujos interactivos, como selectores, cuestionarios o paneles con exploración detallada. Las aplicaciones nativas representan código de widgets interactivos, pero no exponen este puente de solicitudes del chat.

```html
<button onclick="sendPrompt('Muestra en detalle las pruebas que fallan')">Pruebas que fallan</button>
```

Cada solicitud se valida a ambos lados del límite del marco:

- `sendPrompt` requiere una [activación transitoria del usuario](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation) dentro del widget: solo funciona durante los pocos segundos posteriores a que el usuario haga clic o pulse una tecla en el widget, así que conéctela a botones y otros objetivos de clic; llamarla automáticamente al cargar no produce ningún efecto. El puente mantiene el punto de conexión de envío en privado y se cierra de forma segura en navegadores que no exponen la activación del usuario, por lo que el código del widget no puede eludir la comprobación.
- La autoridad de las solicitudes pertenece únicamente al documento original del widget. El puente confiable ofrece su punto de conexión del canal al chat antes de que el código del widget pueda ejecutarse o navegar por el marco, el chat adopta solo esa primera oferta y el canal deja de existir con el documento al navegar. Las URL de inserción permitidas externamente nunca se adoptan.
- El marco del widget debe estar visible en la transcripción del chat y tener el foco, una señal adicional observada por el host de que el usuario realmente está interactuando con este widget.
- El texto no debe estar vacío después de eliminar los espacios en blanco y debe tener como máximo 4,000 caracteres.
- Se rechazan las solicitudes que comienzan por `/`, por lo que el código del widget no puede activar comandos de chat como `/approve` o `/stop`.
- Cada documento de widget puede enviar como máximo 10 solicitudes por minuto móvil; las solicitudes que excedan el límite se descartan silenciosamente.

Las solicitudes aceptadas aparecen en la transcripción como mensajes normales del usuario e inician un turno normal del agente en la sesión propietaria del widget. No existe ningún canal de respuesta hacia el widget: una solicitud descartada falla silenciosamente y el widget no puede leer la respuesta del agente.

## Capacidades del panel

Los widgets fijados pueden utilizar una API del host vinculada a un vale después de que el operador revise la declaración mostrada en la tarjeta pendiente:

- `openclaw.prompt.send(text)` requiere una activación transitoria del usuario y publica un mensaje visible en el editor. Declarar y recibir la concesión de la herramienta `prompt` omite la confirmación adicional por cada clic; la validación, las comprobaciones de foco y los límites de frecuencia siguen aplicándose.
- `openclaw.state.emit(payload)` añade un aviso de sesión. Las cargas útiles están limitadas a 8 KiB y las emisiones idénticas del cliente realizadas en un intervalo de cinco segundos se agrupan.
- `openclaw.data.read(bindingId, params?)` se resuelve únicamente en el Gateway. Las vinculaciones que se pueden conceder son `sessions.list`, `usage.status`, `usage.cost`, `cron.list`, `cron.status`, `agents.list` y `health`.
- `openclaw.cron.trigger(jobId)` ejecuta ahora un trabajo existente únicamente cuando se ha concedido la capacidad exacta `cron.trigger:<jobId>`.

El acceso a la red es independiente de las herramientas del host. Incluya los orígenes HTTPS exactos en `capabilities.netOrigins`; tras la aprobación, solo esos orígenes se incorporan a `connect-src` del widget. Los comodines, las credenciales, las rutas, las cadenas de consulta y los orígenes no declarados permanecen bloqueados. Solo se permite un puerto literal cuando forma parte del origen declarado.

## Seguridad y almacenamiento

Los documentos de los widgets utilizan políticas de seguridad de contenido restrictivas. Se permiten los estilos y scripts insertados directamente, mientras que las cargas de recursos externos permanecen bloqueadas. Los widgets de transcripción insertados directamente no pueden acceder a la red. Un widget de panel anclado solo puede acceder a los orígenes HTTPS exactos que el agente haya declarado y el operador haya concedido.

El iframe de la interfaz de control siempre omite `allow-same-origin`, incluso cuando el modo de inserción global es `trusted`, por lo que los scripts de los widgets no pueden leer el origen de la aplicación principal. Los clientes nativos utilizan vistas web aisladas y no persistentes, y bloquean la navegación fuera del widget alojado. El host de documentos principal también sirve los widgets con un encabezado de respuesta `Content-Security-Policy: sandbox allow-scripts`, por lo que la representación directa sigue ejecutando el widget en un origen opaco en lugar de en el origen de una aplicación. Represente únicamente código de widgets que esté dispuesto a ejecutar en ese marco aislado.

El iframe también sigue [`gateway.controlUi.embedSandbox`](/es/web/control-ui#hosted-embeds). El nivel predeterminado `scripts` admite widgets interactivos y, al mismo tiempo, conserva el aislamiento del origen.

El riesgo residual aceptado de salida mediante canales de datos WebRTC se documenta en [Arquitectura del panel](/es/web/dashboard-architecture#modeled-residual-webrtc-data-channels).

Canvas conserva como máximo 32 widgets por sesión (o por agente cuando no hay ninguna sesión disponible). Al crear otro widget, se elimina el documento más antiguo de ese ámbito.

## Contenido relacionado

- [Inserciones alojadas de la interfaz de control](/es/web/control-ui#hosted-embeds)
- [Actividades de Discord](/es/channels/discord-activities)
- [Controles de nodos de Canvas](/es/plugins/reference/canvas)
- [Capacidades del cliente del protocolo del Gateway](/es/gateway/protocol#client-capabilities)
