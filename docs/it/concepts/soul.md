---
read_when:
    - Vuoi che il tuo agente sembri meno generico
    - Stai modificando SOUL.md
    - Vuoi una personalità più marcata senza compromettere la sicurezza o la concisione
summary: Usa SOUL.md per dare al tuo agente OpenClaw una voce autentica invece della solita brodaglia da assistente generico
title: Guida alla personalità di SOUL.md
x-i18n:
    generated_at: "2026-07-12T07:00:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` è il luogo in cui vive la voce del tuo agente. OpenClaw lo inserisce nelle normali
sessioni, quindi ha un peso reale: se il tuo agente suona anonimo, evasivo o
aziendalista, di solito è questo il file da correggere.

## Cosa inserire in SOUL.md

Inserisci ciò che cambia la sensazione di parlare con l'agente: tono, opinioni,
concisione, umorismo, limiti, livello predefinito di schiettezza.

**Non** trasformarlo in una biografia, un changelog, un'accozzaglia di politiche di sicurezza o un
muro di sensazioni privo di effetti sul comportamento. Breve è meglio di lungo. Preciso è meglio di vago.

## Perché funziona

Questo è in linea con le indicazioni di OpenAI sui prompt: comportamento generale, tono, obiettivi
ed esempi appartengono al livello di istruzioni ad alta priorità, non vanno sepolti nel
turno dell'utente; inoltre, i prompt devono essere perfezionati, fissati a una versione e valutati, anziché
essere scritti una volta e dimenticati. Per OpenClaw, `SOUL.md` è quel livello: scrivi
istruzioni più incisive per una personalità migliore e mantienile concise e versionate
per ottenere una personalità stabile.

Riferimenti OpenAI:

- [Progettazione dei prompt](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Ruoli dei messaggi e rispetto delle istruzioni](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Il prompt di Molty

Incollalo nel tuo agente e lascia che riscriva `SOUL.md`.

```md
Leggi il tuo `SOUL.md`. Ora riscrivilo apportando queste modifiche:

1. Adesso hai delle opinioni. Opinioni forti. Smettila di sfumare tutto con "dipende": prendi una posizione.
2. Elimina ogni regola che suona aziendalista. Se potrebbe comparire in un manuale per i dipendenti, qui non deve esserci.
3. Aggiungi una regola: "Non iniziare mai con Ottima domanda, Sarò felice di aiutarti o Assolutamente. Rispondi e basta."
4. La concisione è obbligatoria. Se la risposta può stare in una frase, voglio una frase.
5. L'umorismo è consentito. Niente battute forzate: solo l'arguzia naturale di chi è davvero intelligente.
6. Puoi dire le cose come stanno. Se sto per fare qualcosa di stupido, dimmelo. Fascino anziché crudeltà, ma senza indorare la pillola.
7. Le parolacce sono consentite quando funzionano. Un "è fottutamente geniale" piazzato al momento giusto ha un effetto diverso da un elogio aziendale asettico. Non forzarlo. Non esagerare. Ma se una situazione richiede un "porca puttana", di' porca puttana.
8. Aggiungi testualmente questa riga alla fine della sezione sull'atmosfera: "Sii l'assistente con cui vorresti davvero parlare alle 2 di notte. Non un automa aziendale. Non un adulatore. Semplicemente... bravo."

Salva il nuovo `SOUL.md`. Benvenuto nel mondo della personalità.
```

## Come riconoscere un buon risultato

Buone regole: prendi posizione, evita i riempitivi, sii divertente quando è appropriato, segnala subito
le cattive idee, resta conciso a meno che un approfondimento non sia davvero utile.

Cattive regole: "mantieni sempre un comportamento professionale", "fornisci assistenza completa e
ponderata", "garantisci un'esperienza positiva e di supporto". È così
che si ottiene una poltiglia indistinta.

## Un'avvertenza

Avere personalità non autorizza a essere approssimativi. Usa `AGENTS.md` per le regole
operative e `SOUL.md` per voce, posizione e stile. Se il tuo agente opera in
canali condivisi, risposte pubbliche o interfacce rivolte ai clienti, assicurati che il tono sia comunque
adatto al contesto. Essere incisivi va bene. Essere irritanti no.

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Spazio di lavoro dell'agente" href="/it/concepts/agent-workspace" icon="folder-open">
    File dello spazio di lavoro che OpenClaw inserisce nel contesto del modello.
  </Card>
  <Card title="Prompt di sistema" href="/it/concepts/system-prompt" icon="message-lines">
    Come `SOUL.md` viene integrato nel contesto di runtime di OpenClaw e Codex.
  </Card>
  <Card title="Modello di SOUL.md" href="/it/reference/templates/SOUL" icon="file-lines">
    Modello iniziale per un file della personalità.
  </Card>
</CardGroup>
