---
read_when:
    - Quieres que tu agente suene menos genérico
    - Estás editando SOUL.md
    - Quieres una personalidad más marcada sin comprometer la seguridad ni la concisión
summary: Usa SOUL.md para darle a tu agente de OpenClaw una voz propia en lugar de la palabrería genérica de un asistente
title: Guía de personalidad de SOUL.md
x-i18n:
    generated_at: "2026-07-11T23:04:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` es donde vive la voz de tu agente. OpenClaw lo inyecta en las sesiones
normales, así que tiene un peso real: si tu agente suena insulso, evasivo o
corporativo, este suele ser el archivo que debes corregir.

## Qué debe incluir SOUL.md

Incluye lo que cambia la experiencia de hablar con el agente: tono, opiniones,
brevedad, humor, límites y grado predeterminado de franqueza.

**No** lo conviertas en una historia de vida, un registro de cambios, un volcado
de políticas de seguridad ni un muro de sensaciones sin efecto en el
comportamiento. Lo breve supera a lo extenso. Lo preciso supera a lo ambiguo.

## Por qué funciona

Esto coincide con las directrices de OpenAI sobre prompts: el comportamiento de
alto nivel, el tono, los objetivos y los ejemplos deben estar en la capa de
instrucciones de alta prioridad, no ocultos en el turno del usuario, y los
prompts deben iterarse, fijarse y evaluarse, en lugar de escribirse una vez y
olvidarse. Para OpenClaw, `SOUL.md` es esa capa: redacta instrucciones más
firmes para conseguir una personalidad mejor y mantenlas concisas y versionadas
para que sea estable.

Referencias de OpenAI:

- [Ingeniería de prompts](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Roles de los mensajes y seguimiento de instrucciones](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## El prompt de Molty

Pega esto en tu agente y deja que reescriba `SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## Cómo se ve un buen resultado

Buenas reglas: adoptar una postura, omitir el relleno, usar el humor cuando
encaje, señalar pronto las malas ideas y ser conciso salvo que la profundidad
sea realmente útil.

Malas reglas: «mantén la profesionalidad en todo momento», «proporciona una
asistencia exhaustiva y reflexiva», «garantiza una experiencia positiva y de
apoyo». Así es como se obtiene una masa informe.

## Una advertencia

Tener personalidad no da permiso para ser descuidado. Reserva `AGENTS.md` para
las reglas operativas y `SOUL.md` para la voz, la postura y el estilo. Si tu
agente trabaja en canales compartidos, respuestas públicas o espacios de
atención al cliente, asegúrate de que el tono siga siendo adecuado para el
contexto. Ser incisivo está bien. Ser molesto, no.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/es/concepts/agent-workspace" icon="folder-open">
    Archivos del espacio de trabajo que OpenClaw inyecta en el contexto del modelo.
  </Card>
  <Card title="System prompt" href="/es/concepts/system-prompt" icon="message-lines">
    Cómo se integra `SOUL.md` en el contexto de ejecución de OpenClaw y Codex.
  </Card>
  <Card title="SOUL.md template" href="/es/reference/templates/SOUL" icon="file-lines">
    Plantilla inicial para un archivo de personalidad.
  </Card>
</CardGroup>
