---
read_when:
    - Vuoi che il tuo agente suoni meno generico
    - Stai modificando SOUL.md
    - Vuoi una personalità più forte senza compromettere sicurezza o brevità
summary: Usa SOUL.md per dare al tuo agente OpenClaw una vera voce invece del solito generico tono da assistente
title: Guida alla personalità di SOUL.md
x-i18n:
    generated_at: "2026-04-05T13:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4f73d68bc8ded6b46497a2f63516f9b2753b111e6176ba40b200858a6938fba
    source_path: concepts/soul.md
    workflow: 15
---

# Guida alla personalità di SOUL.md

`SOUL.md` è il luogo in cui vive la voce del tuo agente.

OpenClaw lo inietta nelle sessioni normali, quindi ha un peso reale. Se il tuo agente
suona piatto, esitante o stranamente aziendale, di solito è questo il file da correggere.

## Cosa va inserito in SOUL.md

Inserisci gli elementi che cambiano come ci si sente a parlare con l'agente:

- tono
- opinioni
- brevità
- umorismo
- limiti
- livello predefinito di schiettezza

**Non** trasformarlo in:

- una storia di vita
- un changelog
- uno scarico di policy di sicurezza
- un gigantesco muro di vibes senza alcun effetto sul comportamento

Meglio corto che lungo. Meglio netto che vago.

## Perché funziona

Questo è in linea con le linee guida di OpenAI sui prompt:

- La guida al prompt engineering dice che comportamento di alto livello, tono, obiettivi ed
  esempi appartengono al livello di istruzioni ad alta priorità, non nascosti nel
  turno dell'utente.
- La stessa guida consiglia di trattare i prompt come qualcosa su cui iterare,
  da fissare e valutare, non come prosa magica che scrivi una volta e poi dimentichi.

Per OpenClaw, `SOUL.md` è quel livello.

Se vuoi una personalità migliore, scrivi istruzioni più forti. Se vuoi una personalità
stabile, mantienile concise e versionate.

Riferimenti OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Ruoli dei messaggi e rispetto delle istruzioni](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Il prompt di Molty

Incolla questo nel tuo agente e lascia che riscriva `SOUL.md`.

Percorso fisso per i workspace OpenClaw: usa `SOUL.md`, non `http://SOUL.md`.

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

## Che aspetto ha un buon risultato

Le buone regole di `SOUL.md` suonano così:

- abbi una posizione
- salta il riempitivo
- sii divertente quando ci sta
- segnala subito le cattive idee
- resta conciso a meno che la profondità non sia davvero utile

Le cattive regole di `SOUL.md` suonano così:

- maintain professionalism at all times
- provide comprehensive and thoughtful assistance
- ensure a positive and supportive experience

Quell'elenco è il modo in cui ottieni pappa molle.

## Un'avvertenza

La personalità non è un permesso per essere approssimativi.

Tieni `AGENTS.md` per le regole operative. Tieni `SOUL.md` per voce, impostazione e
stile. Se il tuo agente lavora in canali condivisi, risposte pubbliche o superfici rivolte ai clienti,
assicurati che il tono sia comunque adatto al contesto.

Essere taglienti va bene. Essere irritanti no.

## Documenti correlati

- [Workspace dell'agente](/concepts/agent-workspace)
- [Prompt di sistema](/concepts/system-prompt)
- [Template SOUL.md](/reference/templates/SOUL)
