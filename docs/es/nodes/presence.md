---
read_when:
    - Quieres que OpenClaw identifique el Mac activo
    - Estás depurando la actividad de la última entrada o la selección del Node activo
    - Quieres comprender el enrutamiento de las notificaciones de conexión de Node
summary: Detecta el Mac que usaste más recientemente y dirige allí las alertas del nodo
title: Presencia activa en el equipo
x-i18n:
    generated_at: "2026-07-12T14:38:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2a4ec4607e1e4ef8d989d3c4ece0ee6e0730908a1df76ff52c1898b4307d979b
    source_path: nodes/presence.md
    workflow: 16
---

La presencia activa del equipo indica al Gateway qué nodo macOS conectado recibió
la entrada física de ratón o teclado más reciente. OpenClaw utiliza esa señal para
marcar un Mac como `active`, proporcionar al agente una indicación estable del nodo activo y dirigir
las alertas de conexión de nodos al equipo en el que es más probable que se encuentre presente.

Esto es independiente de la [presencia del sistema](/es/concepts/presence), que es la lista en tiempo real
de clientes del Gateway, y de las balizas persistentes `node.presence.alive`, que
registran cuándo se activó por última vez un nodo móvil sin tratarlo como conectado.

## Requisitos

- La aplicación OpenClaw para macOS está emparejada y conectada en modo nodo.
- Se ha concedido el permiso de **Accesibilidad** a la aplicación OpenClaw firmada.
- Para las alertas de conexión, también se ha concedido el permiso de **Notificaciones** y el
  nodo Mac expone `system.notify`.

Actualmente, los informes de actividad están implementados por el nodo nativo de macOS. Los hosts
de nodos iOS, Android, watchOS y sin interfaz gráfica pueden informar del estado de última conexión
o actividad en segundo plano, pero no compiten por la designación de equipo activo.

## Comprobar el equipo activo

1. En la aplicación para macOS, abra **Settings -> Permissions** y conceda
   **Accessibility** en los ajustes del sistema de macOS.
2. Confirme que el nodo Mac está conectado:

   ```bash
   openclaw nodes status --connected
   ```

3. Mueva el ratón o pulse una tecla en ese Mac y, a continuación, ejecute:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

El Mac apto con la actividad más reciente se marca como `active`. La salida de estado muestra la antigüedad de
su última entrada; `describe` expone `active`, `lastActiveAtMs` y `presenceUpdatedAtMs`.
La actividad se agrupa deliberadamente, por lo que la visualización puede tardar hasta unos 15
segundos en reflejar otra entrada después de un informe reciente.

## Cómo se convierte la actividad en presencia

El informador de macOS consulta el reloj de inactividad del sistema HID cada dos segundos. Envía
un informe cuando la conexión de un nodo queda lista y, después, informa de nuevas actividades físicas
como máximo una vez cada 15 segundos. Mientras está inactivo, envía una señal de mantenimiento
cada tres minutos. La duración de la inactividad está limitada a 30 días para que una muestra muy antigua
no pueda desplazarse hacia delante y convertirse incorrectamente en la del equipo más reciente.

El Gateway solo acepta la actividad cuando se cumplen todas estas condiciones:

- el evento pertenece a la conexión autenticada actual de ese identificador de nodo;
- el nodo tiene el permiso efectivo `accessibility: true`;
- la carga útil contiene un valor entero acotado `idleSeconds`.

El Gateway resta `idleSeconds` de su propia hora de observación para obtener
`lastActiveAtMs`. Nunca confía en una marca de tiempo del reloj del sistema proporcionada por un nodo. Entre
los Mac aptos conectados, gana el `lastActiveAtMs` más reciente; en caso de empate, se utiliza la
actualización de presencia más reciente.

La presencia es local al proceso y está vinculada a la conexión. Desconectar la sesión
actual, sustituirla por otra sesión que utilice el mismo identificador de nodo o revocar
Accesibilidad borra el estado de actividad de ese nodo y vuelve a calcular el Mac activo.

## Privacidad y contexto del modelo

OpenClaw envía la duración de la inactividad, no el contenido de las entradas. No envía valores de teclas,
coordenadas del ratón, nombres de aplicaciones, títulos de ventanas ni eventos de entrada sin procesar. El
informador de macOS lee el estado HID del hardware, por lo que los eventos sintéticos de control del equipo
no hacen que un Mac automatizado parezca ser el equipo que se utilizó físicamente.

La actividad continua no crea eventos del sistema visibles para el modelo. La línea dinámica
del entorno de ejecución contiene únicamente el identificador de nodo autenticado:

```text
active_node=<node-id>
```

Las marcas de tiempo exactas y los nombres para mostrar controlados por los nodos se mantienen fuera del prompt para
evitar la inyección de prompts y la renovación innecesaria de la caché. Cuando el agente necesita detalles actuales,
la herramienta `nodes` puede leer `node.list` o `node.describe` en su lugar.

## Cómo se dirigen las alertas de conexión

Después de que un nodo completa su negociación con el Gateway, OpenClaw espera 750 milisegundos para
que el Mac que se conecta pueda enviar su primera muestra de actividad. A continuación, intenta utilizar el
Mac conectado con capacidad de notificación que tenga la actividad más reciente.

- Si la entrega principal se realiza correctamente, ningún otro Mac recibe la alerta.
- Si no hay ningún Mac activo disponible o la entrega principal falla, OpenClaw espera cinco
  segundos e intenta usar todos los demás Mac conectados que exponen `system.notify`.
- Una alerta de reconexión para el mismo nodo se suprime durante cinco minutos después de un
  intento real de entrega, lo que evita que las reconexiones inestables generen una
  avalancha de notificaciones.

Las alertas están vinculadas a conexiones de nodo exactas. Una sesión de origen desconectada
o sustituida no puede completar una alerta programada antigua, y una conexión de destino
sustitutiva aún puede participar en la entrega alternativa.

## Solución de problemas

| Síntoma                                    | Comprobación                                                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ninguna fila está marcada como `active`    | Confirme que hay un nodo nativo de macOS conectado y que `openclaw nodes describe --node <id>` muestra `permissions.accessibility: true`.                                                                     |
| El Mac incorrecto sigue activo             | Utilice físicamente ese Mac, espere a que termine el intervalo de agrupación y vuelva a ejecutar `openclaw nodes status`. Las acciones sintéticas de control del equipo no cuentan.                           |
| Los datos de la última entrada desaparecen | Compruebe si el Mac se desconectó, si se sustituyó su sesión de nodo o si se revocó Accesibilidad. Cada una de estas condiciones borra intencionadamente la actividad.                                         |
| La alerta aparece en varios Mac            | La entrega principal no estaba disponible o falló, por lo que se ejecutó la alternativa retrasada. Compruebe que el Mac activo esté conectado, permita notificaciones y exponga `system.notify`.              |
| El agente no menciona el Mac activo        | Inicie un nuevo turno después de que cambie la actividad. La indicación del entorno de ejecución es estable y compacta; utilice la herramienta `nodes` para consultar los metadatos actuales exactos.          |

Para recuperar los permisos de TCC, consulte [permisos de macOS](/es/platforms/mac/permissions). Para los fallos de
conexión y comandos de nodos, consulte [Solución de problemas de Node](/es/nodes/troubleshooting).

## Contenido relacionado

- [Nodos](/es/nodes)
- [CLI de nodos](/es/cli/nodes)
- [Presencia del sistema](/es/concepts/presence)
- [Protocolo del Gateway](/es/gateway/protocol#presence)
- [Aplicación para macOS](/es/platforms/macos)
