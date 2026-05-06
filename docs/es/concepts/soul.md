---
read_when:
    - Quieres que tu agente suene menos genérico
    - Estás editando SOUL.md
    - Quieres una personalidad más marcada sin comprometer la seguridad ni la brevedad
summary: Usa SOUL.md para darle a tu agente de OpenClaw una voz real en lugar de contenido genérico de asistente
title: Guía de personalidad de SOUL.md
x-i18n:
    generated_at: "2026-05-06T05:32:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` es donde vive la voz de tu agente.

OpenClaw lo inyecta en las sesiones normales, así que tiene peso real. Si tu agente
suena insulso, evasivo o extrañamente corporativo, normalmente este es el archivo que hay que corregir.

## Qué debe ir en SOUL.md

Pon lo que cambia cómo se siente hablar con el agente:

- tono
- opiniones
- brevedad
- humor
- límites
- nivel predeterminado de franqueza

**No** lo conviertas en:

- una historia de vida
- un registro de cambios
- un volcado de política de seguridad
- un muro enorme de sensaciones sin efecto conductual

Lo breve supera a lo largo. Lo incisivo supera a lo vago.

## Por qué esto funciona

Esto encaja con la guía de prompts de OpenAI:

- La guía de ingeniería de prompts dice que el comportamiento de alto nivel, el tono, los objetivos y los
  ejemplos pertenecen a la capa de instrucciones de alta prioridad, no enterrados en el
  turno del usuario.
- La misma guía recomienda tratar los prompts como algo que iteras,
  fijas y evalúas, no como prosa mágica que escribes una vez y olvidas.

Para OpenClaw, `SOUL.md` es esa capa.

Si quieres mejor personalidad, escribe instrucciones más fuertes. Si quieres una personalidad estable,
mantenlas concisas y versionadas.

Referencias de OpenAI:

- [Ingeniería de prompts](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Roles de mensaje y seguimiento de instrucciones](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## El prompt de Molty

Pega esto en tu agente y deja que reescriba `SOUL.md`.

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

## Cómo se ve algo bueno

Las buenas reglas de `SOUL.md` suenan así:

- tener una postura
- omitir el relleno
- ser gracioso cuando encaja
- señalar las malas ideas temprano
- mantener la concisión salvo que la profundidad sea realmente útil

Las malas reglas de `SOUL.md` suenan así:

- mantener la profesionalidad en todo momento
- proporcionar asistencia integral y reflexiva
- garantizar una experiencia positiva y de apoyo

Esa segunda lista es como obtienes papilla.

## Una advertencia

La personalidad no es permiso para ser descuidado.

Mantén `AGENTS.md` para las reglas operativas. Mantén `SOUL.md` para la voz, la postura y el
estilo. Si tu agente trabaja en canales compartidos, respuestas públicas o superficies de cliente,
asegúrate de que el tono siga encajando con el entorno.

Lo incisivo está bien. Lo molesto no.

## Relacionado

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/es/concepts/agent-workspace" icon="folder-open">
    Archivos de espacio de trabajo que OpenClaw inyecta en el prompt del sistema.
  </Card>
  <Card title="System prompt" href="/es/concepts/system-prompt" icon="message-lines">
    Cómo `SOUL.md` se compone en el prompt del sistema de cada turno.
  </Card>
  <Card title="SOUL.md template" href="/es/reference/templates/SOUL" icon="file-lines">
    Plantilla inicial para un archivo de personalidad.
  </Card>
</CardGroup>
