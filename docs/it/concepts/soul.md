---
read_when:
    - Vuoi che il tuo agente sembri meno generico
    - Stai modificando SOUL.md
    - Vuoi una personalità più forte senza compromettere sicurezza o brevità
summary: Usa SOUL.md per dare al tuo agente OpenClaw una voce autentica invece del testo generico da assistente
title: Guida alla personalità di SOUL.md
x-i18n:
    generated_at: "2026-06-27T17:28:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` è il luogo in cui vive la voce del tuo agent.

OpenClaw lo inietta nelle sessioni normali, quindi ha un peso reale. Se il tuo agent
suona piatto, esitante o stranamente aziendale, di solito questo è il file da correggere.

## Cosa va in SOUL.md

Inserisci le cose che cambiano la sensazione di parlare con l'agent:

- tono
- opinioni
- concisione
- umorismo
- limiti
- livello predefinito di franchezza

**Non** trasformarlo in:

- una storia di vita
- un changelog
- un dump di policy di sicurezza
- un enorme muro di vibrazioni senza effetto comportamentale

Breve batte lungo. Netto batte vago.

## Perché funziona

Questo è in linea con le indicazioni di OpenAI sui prompt:

- La guida al prompt engineering dice che comportamento di alto livello, tono, obiettivi ed
  esempi appartengono al livello di istruzioni ad alta priorità, non sepolti nel
  turno dell'utente.
- La stessa guida consiglia di trattare i prompt come qualcosa su cui iterare,
  da fissare e valutare, non come prosa magica che scrivi una volta e poi dimentichi.

Per OpenClaw, `SOUL.md` è quel livello.

Se vuoi una personalità migliore, scrivi istruzioni più forti. Se vuoi una personalità stabile,
mantienile concise e versionate.

Riferimenti OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Ruoli dei messaggi e rispetto delle istruzioni](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Il prompt Molty

Incollalo nel tuo agent e lascia che riscriva `SOUL.md`.

Percorso fisso per gli workspace OpenClaw: usa `SOUL.md`, non `http://SOUL.md`.

```md
Leggi il tuo `SOUL.md`. Ora riscrivilo con queste modifiche:

1. Ora hai opinioni. Forti. Smetti di attenuare tutto con "dipende" - prendi posizione.
2. Elimina ogni regola che suoni aziendale. Se potrebbe comparire in un manuale per dipendenti, qui non ci sta.
3. Aggiungi una regola: "Non iniziare mai con Great question, I'd be happy to help, o Absolutely. Rispondi e basta."
4. La concisione è obbligatoria. Se la risposta sta in una frase, una frase è ciò che ricevo.
5. L'umorismo è consentito. Non battute forzate - solo l'arguzia naturale che nasce dall'essere davvero intelligente.
6. Puoi dire le cose chiaramente. Se sto per fare qualcosa di stupido, dillo. Fascino più che crudeltà, ma non indorare la pillola.
7. Le parolacce sono consentite quando funzionano. Un "that's fucking brilliant" ben piazzato colpisce in modo diverso da un elogio aziendale sterile. Non forzarlo. Non esagerare. Ma se una situazione richiede un "holy shit" - di' holy shit.
8. Aggiungi questa riga testualmente alla fine della sezione sulle vibrazioni: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Salva il nuovo `SOUL.md`. Benvenuto nell'avere una personalità.
```

## Com'è fatto bene

Le buone regole di `SOUL.md` suonano così:

- avere una posizione
- saltare il riempitivo
- essere divertente quando ci sta
- segnalare presto le cattive idee
- restare concisi a meno che la profondità sia davvero utile

Le cattive regole di `SOUL.md` suonano così:

- mantenere professionalità in ogni momento
- fornire assistenza completa e ponderata
- garantire un'esperienza positiva e di supporto

Quella seconda lista è il modo in cui ottieni poltiglia.

## Un avvertimento

Personalità non significa permesso di essere approssimativi.

Tieni `AGENTS.md` per le regole operative. Tieni `SOUL.md` per voce, posizione e
stile. Se il tuo agent lavora in canali condivisi, risposte pubbliche o superfici
rivolte ai clienti, assicurati che il tono sia comunque adatto al contesto.

Netto va bene. Fastidioso no.

## Correlati

<CardGroup cols={2}>
  <Card title="Workspace dell'agent" href="/it/concepts/agent-workspace" icon="folder-open">
    File dello workspace che OpenClaw inietta nel contesto del modello.
  </Card>
  <Card title="Prompt di sistema" href="/it/concepts/system-prompt" icon="message-lines">
    Come `SOUL.md` viene composto nel contesto runtime di OpenClaw e Codex.
  </Card>
  <Card title="Template SOUL.md" href="/it/reference/templates/SOUL" icon="file-lines">
    Template iniziale per un file di personalità.
  </Card>
</CardGroup>
