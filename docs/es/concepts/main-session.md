---
read_when:
    - Quieres entender dónde «vive» tu agente
    - Se espera el mismo contexto tanto si se escribe en Telegram, WhatsApp o la web
    - Quieres que tu agente sepa qué ocurre en los grupos y los hilos secundarios
summary: 'Una conversación continua en todos tus canales: la opción predeterminada del agente personal'
title: La sesión principal
x-i18n:
    generated_at: "2026-07-19T13:34:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb77382ebdce269a05a03ab6fa39b44b1e9f1856166f1d9cb79111dccb547f69
    source_path: concepts/main-session.md
    workflow: 16
---

OpenClaw es, ante todo, un agente personal. De forma predeterminada, cada mensaje directo que
se le envía —desde Telegram, WhatsApp, iMessage, mensajes directos de Slack, la aplicación web, cualquier lugar—
llega a **una única conversación continua**: la sesión principal. Se puede preguntar algo desde el
teléfono, continuar desde el portátil y el agente tendrá el mismo contexto en ambos
lugares. Hay un solo cerebro, y aquí es donde piensa.

Internamente, la sesión principal es una sesión normal con la clave
`agent:<agentId>:main` (por ejemplo, `agent:main:main`). Lo que la hace especial
es que el ámbito predeterminado de los mensajes directos los concentra todos en ella y que
el resto del sistema la trata como la raíz del agente: los Heartbeats la activan,
el trabajo en segundo plano le comunica sus resultados y la actividad de otros lugares converge en ella.

## Inicio

En la aplicación web, la sesión principal es la página **Inicio**, la primera entrada de la
barra lateral. La fila de identidad de la parte superior corresponde al agente (se puede hacer clic en ella para abrir el menú
del agente); Inicio es donde se conversa con él. Las sesiones que se bifurcan de la
conversación principal aparecen en **Hilos**, los chats grupales en **Grupos** y
las sesiones de programación o CLI en **Programación**.

## Qué converge en la sesión principal

La sesión principal no es solo un registro de chat; es el lugar donde converge el
mundo del agente:

- **Actividad de los grupos.** Las sesiones de grupos y salas permanecen aisladas (véase más abajo), pero,
  con el ámbito predeterminado de los mensajes directos, la sesión principal las observa automáticamente.
  La actividad se acumula como avisos compactos —agrupados por conversación, nunca
  una activación por mensaje— y el agente los ve la próxima vez que se ejecuta: al
  recibir el siguiente mensaje o durante un Heartbeat programado. El agente también puede leer las
  sesiones que observa, por lo que funciona preguntar «¿qué me perdí en el grupo familiar?».
- **Trabajo en segundo plano.** Los subagentes y las sesiones generadas comunican sus resultados
  a la sesión que los inició, por lo que el trabajo que el agente inició desde
  Inicio comunica sus resultados a Inicio.
- **Heartbeats.** Los Heartbeats programados se dirigen a la sesión principal, lo que
  convierte los avisos en espera en información conocida incluso cuando no se ha escrito nada.

## Memoria entre restablecimientos y conversaciones

La conversación continua está limitada por la ventana de contexto del modelo, por lo que
la continuidad proviene de las capas que la rodean:

- `MEMORY.md`, la memoria a largo plazo seleccionada por el agente, se carga en cada
  sesión nueva. Las notas diarias (`memory/YYYY-MM-DD.md`) pueden buscarse bajo demanda,
  y las recientes vuelven a cargarse después de un `/new` o `/reset`. Antes de la Compaction,
  el agente guarda los hechos duraderos en las notas diarias para que las conversaciones largas
  no los pierdan silenciosamente.
- **La recuperación de memoria entre conversaciones** permite que el agente recuerde contenido de
  sus otras sesiones privadas. En configuraciones personales —con el
  `session.dmScope` global resolviéndose como `main` y sin anulaciones del ámbito de mensajes directos por vinculación—
  está habilitada de forma predeterminada; cualquier aislamiento configurado para los mensajes directos la desactiva, salvo que se
  habilite explícitamente. Véase [Configuración de la memoria](/es/reference/memory-config).

## Una sesión continua con historial duradero

La sesión principal continúa a través de restablecimientos y de la Compaction, en lugar de
hacer que el modelo mantenga todo su historial a la vez:

- De forma predeterminada, no hay ningún restablecimiento automático; la Compaction mantiene limitado el contexto activo
  mientras conserva la sesión continua. Los restablecimientos diarios y por inactividad son
  opcionales (véase [Gestión de sesiones](/es/concepts/session)). Con `/new` y `/reset`,
  el final de la conversación que termina se guarda en las notas diarias de memoria, y la
  siguiente sesión vuelve a cargar las notas recientes. El restablecimiento asigna un nuevo identificador de sesión activa, pero
  mantiene la transcripción anterior de SQLite disponible para búsquedas con la misma clave de la sesión
  principal.
- Cuando la conversación se acerca al límite de la ventana de contexto, la Compaction la resume
  y continúa en el mismo lugar; el historial de la transcripción permanece en el almacén de sesiones.
- Las listas de sesiones muestran la conversación activa actual, no todos los identificadores
  históricos de sesiones que hay tras ella.
- Cuando la base de datos física, el WAL y los artefactos de sesión del almacén por agente
  superan el presupuesto de disco (10 GB de forma predeterminada), OpenClaw extrae el historial
  no referenciado más antiguo a un archivo comprimido verificado antes de eliminar sus
  filas de la base de datos. Las sesiones activas, enrutadas y en curso nunca se eliminan por el presupuesto.

## Cuando se prefiere el aislamiento

La sesión principal compartida es la opción predeterminada adecuada para un agente con el que solo conversa
una persona. Si varias personas pueden enviar mensajes al agente, deben aislarse los mensajes directos:

```json5
{
  session: {
    dmScope: "per-channel-peer",
  },
}
```

Con un ámbito aislado, cada remitente obtiene su propia sesión, se deshabilita la observación de grupos
desde la sesión principal y la recuperación de memoria entre conversaciones
se desactiva de forma predeterminada. `openclaw security audit` recomienda el aislamiento cuando detecta
varios remitentes de mensajes directos. La matriz completa de ámbitos, la vinculación de identidades y las anulaciones
por ruta se describen en [Gestión de sesiones](/es/concepts/session) y
[Enrutamiento de canales](/es/channels/channel-routing).

## Contenido relacionado

- [Gestión de sesiones](/es/concepts/session) — enrutamiento, ámbitos y restablecimientos
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo se seleccionan los agentes y las sesiones
- [Memoria](/es/concepts/memory) — capas de memoria duradera
- [Varios agentes](/es/concepts/multi-agent) — ejecución de varios agentes aislados
