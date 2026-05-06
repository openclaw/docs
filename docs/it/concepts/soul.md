---
read_when:
    - Vuoi che il tuo agente abbia un tono meno generico
    - Stai modificando SOUL.md
    - Vuoi una personalità più marcata senza compromettere la sicurezza o la concisione
summary: Usa SOUL.md per dare al tuo agente OpenClaw una voce autentica invece di contenuti generici da assistente
title: Guida alla personalità di SOUL.md
x-i18n:
    generated_at: "2026-05-06T08:47:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` è il posto in cui vive la voce del tuo agente.

OpenClaw lo inietta nelle sessioni normali, quindi ha un peso reale. Se il tuo agente
suona piatto, esitante o stranamente aziendale, di solito questo è il file da correggere.

## Cosa va in SOUL.md

Inserisci ciò che cambia la sensazione di parlare con l'agente:

- tono
- opinioni
- brevità
- umorismo
- limiti
- livello predefinito di franchezza

**Non** trasformarlo in:

- una storia di vita
- un changelog
- un riversamento di policy di sicurezza
- un enorme muro di atmosfera senza effetto comportamentale

Breve batte lungo. Preciso batte vago.

## Perché funziona

Questo è in linea con le indicazioni di OpenAI sui prompt:

- La guida all'ingegneria dei prompt dice che comportamento di alto livello, tono, obiettivi ed
  esempi appartengono al livello di istruzioni ad alta priorità, non sepolti nel
  turno dell'utente.
- La stessa guida consiglia di trattare i prompt come qualcosa su cui iterare,
  fissare e valutare, non come prosa magica da scrivere una volta e dimenticare.

Per OpenClaw, `SOUL.md` è quel livello.

Se vuoi una personalità migliore, scrivi istruzioni più forti. Se vuoi una personalità
stabile, mantienile concise e versionate.

Riferimenti OpenAI:

- [Ingegneria dei prompt](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Ruoli dei messaggi e rispetto delle istruzioni](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Il prompt Molty

Incollalo nel tuo agente e lascia che riscriva `SOUL.md`.

Percorso fisso per gli spazi di lavoro OpenClaw: usa `SOUL.md`, non `http://SOUL.md`.

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

## Com'è fatto bene

Le buone regole di `SOUL.md` suonano così:

- avere una posizione
- saltare il riempitivo
- essere divertente quando ci sta
- segnalare presto le cattive idee
- restare conciso, a meno che la profondità non sia davvero utile

Le cattive regole di `SOUL.md` suonano così:

- mantenere la professionalità in ogni momento
- fornire assistenza completa e ponderata
- garantire un'esperienza positiva e di supporto

Quel secondo elenco è il modo in cui ottieni poltiglia.

## Un avvertimento

La personalità non è un permesso per essere approssimativi.

Tieni `AGENTS.md` per le regole operative. Tieni `SOUL.md` per voce, posizione e
stile. Se il tuo agente lavora in canali condivisi, risposte pubbliche o superfici
cliente, assicurati che il tono sia comunque adatto al contesto.

Tagliente va bene. Fastidioso no.

## Correlati

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/it/concepts/agent-workspace" icon="folder-open">
    File dello spazio di lavoro che OpenClaw inietta nel prompt di sistema.
  </Card>
  <Card title="System prompt" href="/it/concepts/system-prompt" icon="message-lines">
    Come `SOUL.md` viene composto nel prompt di sistema per ogni turno.
  </Card>
  <Card title="SOUL.md template" href="/it/reference/templates/SOUL" icon="file-lines">
    Modello iniziale per un file di personalità.
  </Card>
</CardGroup>
