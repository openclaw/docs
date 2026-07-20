---
read_when:
    - Quieres que un agente formule al usuario una pregunta estructurada
    - Está respondiendo o depurando una solicitud ask_user
    - Necesita el esquema de ask_user, el tiempo de espera o el comportamiento del canal
summary: Cómo ask_user pausa un turno del agente para solicitar una decisión humana estructurada
title: Preguntar al usuario
x-i18n:
    generated_at: "2026-07-20T00:59:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 32556314a34c26054c3aabfdd8ecc474cf85196e5cc71adb833face596edbd24
    source_path: tools/ask-user.md
    workflow: 16
---

`ask_user` permite al agente formular al humano de una a tres preguntas estructuradas y
esperar las respuestas. Se usa para decisiones que realmente corresponden al usuario,
no para confirmaciones rutinarias ni para información que el agente pueda deducir de la solicitud,
el código o un valor predeterminado razonable.

La herramienta solo está disponible en la sesión principal. Los subagentes y otras ejecuciones
no principales no la reciben.

## Responder una pregunta

Se puede responder desde cualquier interfaz de conversación compatible:

- La interfaz web de Control acopla un panel de preguntas directamente encima del cuadro de redacción. En
  las solicitudes con varias preguntas, el panel muestra una pregunta a la vez y avanza
  mediante un breve indicador de pasos. Tras resolverse, el panel se cierra y el chat
  conserva únicamente un resumen compacto de las respuestas.
- Telegram, Discord y Slack muestran botones nativos para una solicitud de una sola pregunta
  y una sola opción.
- Una respuesta de texto sin formato funciona en cualquier canal. Responda con un número, la etiqueta de una opción
  o una respuesta propia.

OpenClaw siempre habilita una respuesta de texto libre **Otra**. El agente no debe añadir una
opción `Other` a la lista de opciones creada.

## Comportamiento de las plataformas

Las respuestas funcionan en todas las interfaces de conversación compatibles. La interfaz web de Control utiliza un
indicador de pasos acoplado que sustituye el cuadro de redacción mientras está expandido; al contraerlo, se restaura
el cuadro de redacción completo debajo de una barra de preguntas estrecha. iOS, macOS y Android muestran
tarjetas integradas; las preguntas múltiples permanecen apiladas como un patrón deliberadamente
adaptado a interfaces táctiles. Cada plataforma conserva el resumen de preguntas y respuestas en la cronología
del chat activo sin eliminación programada, y **Omitir** está disponible en todas ellas.

Las solicitudes que no pueden utilizar botones nativos, incluidas las de varias preguntas y
selección múltiple, se convierten en texto legible en los canales. La interfaz de Control
conserva el indicador de pasos estructurado completo.

## Tiempo de espera y ausencia de respuesta

El tiempo de espera predeterminado es de 900 segundos. `timeoutSeconds` se limita al intervalo
de 30 a 3600 segundos.

Si la pregunta caduca o se cancela antes de recibir una respuesta, la herramienta
devuelve `status: "no_answer"`. A continuación, el agente continúa según su mejor criterio.
La interrupción de una ejecución del agente cancela su pregunta pendiente del Gateway.

## Esquema de la herramienta

```ts
{
  questions: Array<{
    id: string; // clave de respuesta única en snake_case
    header: string; // etiqueta breve; se trunca a 12 caracteres
    question: string; // una oración
    options: Array<{
      label: string;
      description?: string;
    }>; // 2-4 opciones
    multiSelect?: boolean;
  }>; // 1-3 preguntas
  timeoutSeconds?: number; // entero; valor predeterminado: 900, limitado a 30-3600
}
```

Con `multiSelect: true`, el usuario puede elegir más de una opción. Los valores de
respuesta se devuelven como un arreglo para cada pregunta.

Ejemplo de resultado respondido:

```json
{
  "status": "answered",
  "answers": {
    "answers": {
      "deploy_target": ["Staging (Recommended)"]
    }
  }
}
```

## Orientación para el modelo

El contrato presentado al modelo indica al agente que debe:

- preguntar únicamente cuando una decisión que realmente corresponda al usuario impida continuar;
- preferir una sola pregunta y no formular más de tres;
- colocar primero la opción recomendada y añadir `(Recommended)` al final de su etiqueta;
- omitir una opción `Other` creada porque el texto libre se añade automáticamente;
- continuar según su mejor criterio después de `no_answer`.

El agente no debe utilizar `ask_user` para preguntar si puede continuar ni para confirmar
su propio plan.
