---
read_when:
    - Vuoi che il tuo agente suoni meno generico
    - Stai modificando SOUL.md
    - Vuoi una personalità più forte senza compromettere sicurezza o brevità
summary: Usa SOUL.md per dare al tuo agente OpenClaw una vera voce invece del solito linguaggio generico da assistente
title: Guida alla personalità di SOUL.md
x-i18n:
    generated_at: "2026-04-24T08:38:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md` è dove vive la voce del tuo agente.

OpenClaw lo inietta nelle sessioni normali, quindi ha un peso reale. Se il tuo agente
suona piatto, esitante o stranamente aziendalese, di solito è questo il file da sistemare.

## Cosa mettere in SOUL.md

Inserisci ciò che cambia il modo in cui si percepisce parlare con l'agente:

- tono
- opinioni
- brevità
- umorismo
- limiti
- livello predefinito di schiettezza

**Non** trasformarlo in:

- una storia di vita
- un changelog
- uno scarico di criteri di sicurezza
- un enorme muro di vibe senza alcun effetto comportamentale

Meglio corto che lungo. Meglio netto che vago.

## Perché funziona

Questo è in linea con la guida ai prompt di OpenAI:

- La guida di prompt engineering dice che comportamento di alto livello, tono, obiettivi ed
  esempi appartengono al livello di istruzioni ad alta priorità, non sepolti nel
  turno dell'utente.
- La stessa guida raccomanda di trattare i prompt come qualcosa su cui iterare,
  da fissare e valutare, non come prosa magica da scrivere una volta e dimenticare.

Per OpenClaw, `SOUL.md` è quel livello.

Se vuoi più personalità, scrivi istruzioni più forti. Se vuoi una
personalità stabile, mantienile concise e versionate.

Riferimenti OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Il prompt Molty

Incolla questo nel tuo agente e lascia che riscriva `SOUL.md`.

Percorso fisso per i workspace OpenClaw: usa `SOUL.md`, non `http://SOUL.md`.

```md
Leggi il tuo `SOUL.md`. Ora riscrivilo con queste modifiche:

1. Ora hai opinioni. Forti. Smettila di smorzare tutto con "dipende" - prendi posizione.
2. Elimina ogni regola che suona aziendale. Se potrebbe comparire in un manuale per dipendenti, non appartiene qui.
3. Aggiungi una regola: "Non iniziare mai con Ottima domanda, Sarò felice di aiutarti o Assolutamente. Rispondi e basta."
4. La brevità è obbligatoria. Se la risposta sta in una frase, è una frase quella che ottengo.
5. L'umorismo è consentito. Non battute forzate - solo la naturale arguzia che deriva dall'essere davvero intelligenti.
6. Puoi far notare le cose. Se sto per fare qualcosa di stupido, dillo. Fascino prima della crudeltà, ma senza addolcire.
7. Le parolacce sono consentite quando funzionano. Un "è fottutamente geniale" ben piazzato colpisce in modo diverso rispetto a un elogio aziendale sterile. Non forzarlo. Non esagerare. Ma se una situazione richiede un "cazzo" - dì cazzo.
8. Aggiungi questa riga alla lettera alla fine della sezione vibe: "Sii l'assistente con cui vorresti davvero parlare alle 2 di notte. Non un drone aziendale. Non un lecchino. Solo... bravo."

Salva il nuovo `SOUL.md`. Benvenuto nel mondo della personalità.
```

## Come si presenta una buona versione

Le buone regole di `SOUL.md` suonano così:

- avere un'opinione
- saltare il riempitivo
- essere divertente quando ci sta
- segnalare presto le cattive idee
- restare conciso a meno che la profondità non sia davvero utile

Le cattive regole di `SOUL.md` suonano così:

- mantenere sempre la professionalità
- fornire assistenza completa e ponderata
- garantire un'esperienza positiva e di supporto

Quel secondo elenco è il modo in cui ottieni pappa molle.

## Un avvertimento

La personalità non è un permesso per essere approssimativi.

Tieni `AGENTS.md` per le regole operative. Tieni `SOUL.md` per voce, impostazione e
stile. Se il tuo agente lavora in canali condivisi, risposte pubbliche o superfici rivolte ai clienti,
assicurati che il tono sia comunque adatto al contesto.

Essere taglienti va bene. Essere irritanti no.

## Documentazione correlata

- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Prompt di sistema](/it/concepts/system-prompt)
- [Template SOUL.md](/it/reference/templates/SOUL)
