---
read_when:
    - Quieres que tu agente suene menos genérico
    - Estás editando SOUL.md
    - Quieres una personalidad más marcada sin romper la seguridad ni la brevedad
summary: Usa SOUL.md para darle a tu agente de OpenClaw una voz real en lugar de la típica verborrea genérica de asistente
title: Guía de personalidad de SOUL.md
x-i18n:
    generated_at: "2026-04-24T05:26:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md` es donde vive la voz de tu agente.

OpenClaw lo inyecta en las sesiones normales, así que tiene peso real. Si tu agente
suena soso, dubitativo o raramente corporativo, normalmente este es el archivo que debes corregir.

## Qué va en SOUL.md

Pon lo que cambia cómo se siente hablar con el agente:

- tono
- opiniones
- brevedad
- humor
- límites
- nivel predeterminado de franqueza

**No** lo conviertas en:

- una historia de vida
- un changelog
- un volcado de política de seguridad
- una enorme pared de vibra sin efecto real en el comportamiento

Corto gana a largo. Preciso gana a vago.

## Por qué funciona

Esto encaja con la guía de prompts de OpenAI:

- La guía de prompt engineering dice que el comportamiento de alto nivel, el tono, los objetivos y
  los ejemplos deben ir en la capa de instrucciones de alta prioridad, no enterrados en el
  turno del usuario.
- La misma guía recomienda tratar los prompts como algo que iteras,
  fijas y evalúas, no como una prosa mágica que escribes una vez y olvidas.

Para OpenClaw, `SOUL.md` es esa capa.

Si quieres mejor personalidad, escribe instrucciones más contundentes. Si quieres una
personalidad estable, mantenlas concisas y versionadas.

Referencias de OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## El prompt de Molty

Pégalo en tu agente y deja que reescriba `SOUL.md`.

Ruta fijada para espacios de trabajo de OpenClaw: usa `SOUL.md`, no `http://SOUL.md`.

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

## Qué aspecto tiene algo bueno

Las buenas reglas de `SOUL.md` suenan así:

- ten una postura
- omite el relleno
- sé gracioso cuando encaje
- señala pronto las malas ideas
- mantente conciso salvo que la profundidad sea realmente útil

Las malas reglas de `SOUL.md` suenan así:

- mantén la profesionalidad en todo momento
- proporciona asistencia completa y reflexiva
- garantiza una experiencia positiva y de apoyo

Esa segunda lista es cómo se obtiene papilla.

## Una advertencia

La personalidad no es permiso para ser descuidado.

Mantén `AGENTS.md` para las reglas operativas. Mantén `SOUL.md` para la voz, la postura y el
estilo. Si tu agente trabaja en canales compartidos, respuestas públicas o superficies de cara al cliente,
asegúrate de que el tono siga encajando en el contexto.

Ser preciso está bien. Ser irritante, no.

## Documentos relacionados

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Prompt del sistema](/es/concepts/system-prompt)
- [Plantilla de SOUL.md](/es/reference/templates/SOUL)
