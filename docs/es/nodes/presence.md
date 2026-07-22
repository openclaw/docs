---
read_when:
    - Se desea que OpenClaw identifique el Mac activo
    - Se está depurando la actividad de la última entrada o la selección del nodo activo
    - Se desea comprender el enrutamiento de las notificaciones de conexión de Node
summary: Detecta el Mac que usaste más recientemente y dirige allí las alertas del Node
title: Presencia activa del equipo
x-i18n:
    generated_at: "2026-07-21T22:39:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3f1d1d0e98b1f3b7478cf80696dc693677b57897b07260cce30938e9187c314
    source_path: nodes/presence.md
    workflow: 16
---

La presencia activa en el ordenador indica al Gateway qué nodo macOS conectado recibió
la entrada física más reciente del ratón o el teclado. OpenClaw utiliza esa señal para
marcar un Mac como `active`, proporcionar al agente una indicación estable del nodo activo y dirigir
las alertas de conexión de nodos al ordenador en el que es más probable que se encuentre.

Esto es independiente de la [presencia del sistema](/es/concepts/presence), que es la lista en tiempo real
de clientes del Gateway, y de las balizas duraderas `node.presence.alive`, que
registran cuándo se activó por última vez un nodo móvil sin tratarlo como conectado.

## Requisitos

- La aplicación OpenClaw para macOS está emparejada y conectada en modo nodo.
- **Configuración -> Permisos -> Detección del ordenador activo** está habilitado. Está deshabilitado de forma predeterminada.
- Se ha concedido el permiso **Accessibility** a la aplicación OpenClaw firmada.
- Para las alertas de conexión, también se ha concedido el permiso **Notifications** y el
  nodo Mac expone `system.notify`.

Actualmente, los informes de actividad están implementados por el nodo nativo de macOS. Los hosts
de nodos iOS, Android, watchOS y sin interfaz pueden informar del estado de conexión o de la
última vez que estuvieron activos en segundo plano, pero no compiten por la designación de ordenador activo.

## Comprobar el ordenador activo

1. En la aplicación para macOS, abra **Configuración -> Permisos**, habilite
   **Detección del ordenador activo** y conceda **Accessibility** en System Settings de macOS.
2. Confirme que el nodo Mac está conectado:

   ```bash
   openclaw nodes status --connected
   ```

3. Mueva el ratón o pulse una tecla en ese Mac y, a continuación, ejecute:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

El Mac elegible con la actividad más reciente se marca como `active`. La salida de estado muestra el tiempo
transcurrido desde su última entrada; `describe` expone `active`, `lastActiveAtMs` y `presenceUpdatedAtMs`.
La actividad se agrupa intencionadamente, por lo que la pantalla puede tardar hasta unos 15
segundos en reflejar otra entrada después de un informe reciente.

## Cómo se convierte la actividad en presencia

El informador de macOS consulta el reloj de inactividad del sistema HID cada dos segundos.
Informa una vez cuando la conexión de un nodo está lista y, después, informa de la actividad física
más reciente como máximo una vez cada 15 segundos. Durante la inactividad, envía una señal de mantenimiento
cada tres minutos. La duración de la inactividad se limita a 30 días para que una muestra muy antigua
no pueda desplazarse hacia adelante y convertirse incorrectamente en el ordenador más reciente.

Al deshabilitar **Detección del ordenador activo**, se detiene la consulta y se envía un evento
autenticado de borrado mediante la conexión actual del nodo. El Gateway elimina inmediatamente
las marcas de tiempo de actividad conservadas de ese Mac y vuelve a calcular el ordenador activo;
las demás capacidades del nodo y el trabajo en curso permanecen conectados. Si el Gateway conectado
es anterior a esta acción de borrado, el nodo Mac se vuelve a conectar una vez para que la limpieza
por desconexión pueda eliminar en su lugar la actividad conservada.

El Gateway solo acepta actividad cuando se cumplen todas estas condiciones:

- el evento pertenece a la conexión autenticada actual de ese id de nodo;
- el nodo tiene el permiso efectivo `accessibility: true`;
- la carga útil contiene un valor entero acotado `idleSeconds`.

El Gateway resta `idleSeconds` de su propio tiempo de observación para obtener
`lastActiveAtMs`. Nunca confía en una marca de tiempo del reloj del sistema proporcionada por un nodo. Entre
los Mac elegibles conectados, prevalece el `lastActiveAtMs` más reciente; en caso de empate, se utiliza la
actualización de presencia más reciente.

La presencia es local al proceso y está vinculada a la conexión. Al desconectar la sesión
actual, sustituirla por otra sesión que utilice el mismo id de nodo o revocar
Accessibility, se borra el estado de actividad de ese nodo y se vuelve a calcular el Mac activo.

## Privacidad y contexto del modelo

El uso compartido de la actividad está deshabilitado de forma predeterminada y es independiente de la concesión de Accessibility
utilizada para la automatización de la interfaz de usuario. OpenClaw envía la duración de la inactividad, no el contenido de la entrada. No envía valores de teclas,
coordenadas del ratón, nombres de aplicaciones, títulos de ventanas ni eventos de entrada sin procesar. El
informador de macOS lee el estado HID del hardware, por lo que los eventos sintéticos de control
del ordenador no hacen que un Mac automatizado parezca ser el ordenador que se utilizó
físicamente.

La actividad continua no crea eventos del sistema visibles para el modelo. La línea dinámica
del entorno de ejecución contiene únicamente el id de nodo autenticado:

```text
active_node=<node-id>
```

Las marcas de tiempo exactas y los nombres para mostrar controlados por los nodos se mantienen fuera del prompt para
evitar la inyección de prompts y la renovación innecesaria de la caché. Cuando el agente necesita detalles actuales,
la herramienta `nodes` puede leer `node.list` o `node.describe` en su lugar.

## Cómo se dirigen las alertas de conexión

Después de que un nodo complete su primer protocolo de enlace correcto con el Gateway tras la aprobación,
OpenClaw espera 750 milisegundos para que el Mac que se conecta pueda enviar su primera
muestra de actividad. A continuación, intenta usar el Mac conectado con capacidad de notificación que tenga la
actividad más reciente.

- Si la entrega principal se realiza correctamente, ningún otro Mac recibe la alerta.
- Si no hay ningún Mac activo disponible o falla la entrega principal, OpenClaw espera cinco
  segundos e intenta realizarla en todos los demás Mac conectados que exponen `system.notify`.
- Las reconexiones posteriores son silenciosas. El Gateway registra la conexión correcta
  en los metadatos de emparejamiento, por lo que reiniciar el Gateway no vuelve a enviar alertas para todos
  los nodos conectados anteriormente.

Las alertas están vinculadas a la identidad autenticada del nodo. Una sesión de sustitución para
el mismo nodo asume su alerta pendiente de primera conexión; si ese nodo ya no
está conectado cuando se ejecuta la entrega, la alerta se cancela.

## Solución de problemas

| Síntoma                                   | Comprobación                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ninguna fila está marcada como `active`                 | Confirme que la detección del ordenador activo está habilitada, que hay un nodo nativo de macOS conectado y que `openclaw nodes describe --node <id>` muestra `permissions.accessibility: true`.   |
| El Mac incorrecto permanece activo              | Utilice físicamente ese Mac, espere a que termine el intervalo de agrupación y vuelva a ejecutar `openclaw nodes status`. Las acciones sintéticas de control del ordenador no cuentan.                        |
| Desaparecen los datos de la última entrada                | Compruebe si el Mac se desconectó, si se sustituyó su sesión de nodo o si se revocó Accessibility. Cada condición borra intencionadamente la actividad.                       |
| La alerta aparece en varios Mac         | La entrega principal no estaba disponible o falló, por lo que se ejecutó la alternativa retrasada. Verifique que el Mac activo esté conectado, permita notificaciones y exponga `system.notify`. |
| El agente no menciona el Mac activo | Inicie un nuevo turno después de que cambie la actividad. La indicación del entorno de ejecución es estable y compacta; utilice la herramienta `nodes` para obtener los metadatos actuales exactos.                                    |

Para recuperar los permisos TCC, consulte [permisos de macOS](/es/platforms/mac/permissions). Para los fallos de
conexión y de comandos de los nodos, consulte [Solución de problemas de Node](/es/nodes/troubleshooting).

## Contenido relacionado

- [Nodos](/es/nodes)
- [CLI de nodos](/es/cli/nodes)
- [Presencia del sistema](/es/concepts/presence)
- [Protocolo del Gateway](/es/gateway/protocol#presence)
- [Aplicación para macOS](/es/platforms/macos)
