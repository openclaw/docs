---
read_when:
    - Quieres que OpenClaw identifique el Mac activo
    - Está depurando la actividad de la última entrada o la selección del Node activo
    - Se desea comprender el enrutamiento de las notificaciones de conexión de nodos
summary: Detecta el Mac que usaste más recientemente y dirige allí las alertas del Node
title: Presencia activa del ordenador
x-i18n:
    generated_at: "2026-07-19T01:58:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c1d9ed66ed89580c51040026a7c054f76434446eb43a505fea79ee3412431771
    source_path: nodes/presence.md
    workflow: 16
---

La presencia activa del equipo indica al Gateway qué nodo macOS conectado recibió
la entrada física más reciente del ratón o el teclado. OpenClaw utiliza esa señal para
marcar un Mac como `active`, proporcionar al agente una indicación estable del nodo activo y dirigir
las alertas de conexión de nodos al equipo donde es más probable que haya alguien presente.

Esto es independiente de la [presencia del sistema](/es/concepts/presence), que es la lista
en tiempo real de clientes del Gateway, y de las balizas duraderas `node.presence.alive`, que
registran cuándo se activó por última vez un nodo móvil sin considerarlo conectado.

## Requisitos

- La aplicación OpenClaw para macOS está emparejada y conectada en modo nodo.
- Se ha concedido el permiso de **Accesibilidad** a la aplicación OpenClaw firmada.
- Para las alertas de conexión, también se ha concedido el permiso de **Notificaciones** y el
  nodo Mac expone `system.notify`.

Actualmente, los informes de actividad están implementados en el nodo nativo de macOS. Los hosts de nodos
iOS, Android, watchOS y sin interfaz pueden informar del estado de última actividad de conexión o en segundo plano,
pero no compiten por la designación de equipo activo.

## Comprobar el equipo activo

1. En la aplicación para macOS, abre **Settings -> Permissions** y concede
   **Accessibility** en la configuración del sistema de macOS.
2. Confirma que el nodo Mac está conectado:

   ```bash
   openclaw nodes status --connected
   ```

3. Mueve el ratón o pulsa una tecla en ese Mac y, a continuación, ejecuta:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

El Mac apto con la actividad más reciente se marca como `active`. La salida de estado muestra el tiempo
transcurrido desde su última entrada; `describe` expone `active`, `lastActiveAtMs` y `presenceUpdatedAtMs`.
La actividad se agrupa intencionadamente, por lo que la pantalla puede tardar hasta unos 15
segundos en reflejar otra entrada después de un informe reciente.

## Cómo se convierte la actividad en presencia

El generador de informes de macOS consulta el reloj de inactividad del sistema HID cada dos segundos. Informa
una vez cuando la conexión de un nodo está lista y, después, informa de actividad física más reciente
como máximo una vez cada 15 segundos. Durante la inactividad, envía una señal de mantenimiento
cada tres minutos. La duración de la inactividad se limita a 30 días para que una muestra muy antigua
no pueda desplazarse hacia delante y convertirse incorrectamente en el equipo más reciente.

El Gateway acepta la actividad solo cuando se cumplen todas estas condiciones:

- el evento pertenece a la conexión autenticada actual de ese identificador de nodo;
- el nodo tiene el permiso efectivo `accessibility: true`;
- la carga útil contiene un valor entero acotado `idleSeconds`.

El Gateway resta `idleSeconds` de su propio momento de observación para derivar
`lastActiveAtMs`. Nunca confía en una marca de tiempo de reloj suministrada por un nodo. Entre
los Mac conectados aptos, gana el `lastActiveAtMs` más reciente; en caso de empate, se utiliza la actualización
de presencia más reciente.

La presencia es local al proceso y está vinculada a la conexión. Desconectar la sesión
actual, sustituirla por otra sesión que utilice el mismo identificador de nodo o revocar
Accesibilidad borra el estado de actividad de ese nodo y vuelve a calcular el Mac activo.

## Privacidad y contexto del modelo

OpenClaw envía la duración de la inactividad, no el contenido de la entrada. No envía valores de teclas,
coordenadas del ratón, nombres de aplicaciones, títulos de ventanas ni eventos de entrada sin procesar. El
generador de informes de macOS lee el estado HID del hardware, por lo que los eventos sintéticos de control
del equipo no hacen que un Mac automatizado parezca ser el equipo utilizado físicamente.

La actividad continua no crea eventos del sistema visibles para el modelo. La línea dinámica
del entorno de ejecución contiene únicamente el identificador de nodo autenticado:

```text
active_node=<node-id>
```

Las marcas de tiempo exactas y los nombres para mostrar controlados por los nodos se mantienen fuera del prompt para
evitar la inyección de prompts y la renovación innecesaria de la caché. Cuando el agente necesita información actual,
la herramienta `nodes` puede leer `node.list` o `node.describe` en su lugar.

## Cómo se dirigen las alertas de conexión

Después de que un nodo complete su primer protocolo de enlace correcto con el Gateway tras la aprobación,
OpenClaw espera 750 milisegundos para que el Mac que se está conectando pueda enviar su primera
muestra de actividad. A continuación, prueba el Mac conectado con capacidad de notificación que tenga la
actividad más reciente.

- Si la entrega principal se realiza correctamente, ningún otro Mac recibe la alerta.
- Si no hay ningún Mac activo disponible o la entrega principal falla, OpenClaw espera cinco
  segundos y prueba todos los demás Mac conectados que exponen `system.notify`.
- Las reconexiones posteriores son silenciosas. El Gateway registra la conexión correcta
  en los metadatos de emparejamiento, por lo que un reinicio del Gateway no vuelve a reproducir las alertas de todos
  los nodos conectados anteriormente.

Las alertas están vinculadas a la identidad autenticada del nodo. Una sesión de sustitución del
mismo nodo asume su alerta pendiente de primera conexión; si ese nodo ya no está
conectado cuando se ejecuta la entrega, la alerta se cancela.

## Solución de problemas

| Síntoma                                   | Comprobación                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ninguna fila está marcada como `active`                 | Confirma que haya un nodo nativo de macOS conectado y que `openclaw nodes describe --node <id>` muestre `permissions.accessibility: true`.                                          |
| El Mac incorrecto continúa activo              | Utiliza físicamente ese Mac, espera a que transcurra el intervalo de agrupación y vuelve a ejecutar `openclaw nodes status`. Las acciones sintéticas de control del equipo no cuentan.                        |
| Desaparecen los datos de la última entrada                | Comprueba si el Mac se desconectó, si se sustituyó su sesión de nodo o si se revocó Accesibilidad. Cada condición borra intencionadamente la actividad.                       |
| La alerta aparece en varios Mac         | La entrega principal no estaba disponible o falló, por lo que se ejecutó la alternativa retrasada. Comprueba que el Mac activo esté conectado, permita las notificaciones y exponga `system.notify`. |
| El agente no menciona el Mac activo | Inicia un turno nuevo después de que cambie la actividad. La indicación del entorno de ejecución es estable y compacta; utiliza la herramienta `nodes` para obtener los metadatos actuales exactos.                                    |

Para recuperar los permisos TCC, consulta [permisos de macOS](/es/platforms/mac/permissions). Para los fallos de
conexión de nodos y comandos, consulta [Solución de problemas de Node](/es/nodes/troubleshooting).

## Temas relacionados

- [Nodos](/es/nodes)
- [CLI de nodos](/es/cli/nodes)
- [Presencia del sistema](/es/concepts/presence)
- [Protocolo del Gateway](/es/gateway/protocol#presence)
- [Aplicación para macOS](/es/platforms/macos)
