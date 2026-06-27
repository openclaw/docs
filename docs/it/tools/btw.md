---
read_when:
    - Vuoi fare una rapida domanda secondaria sulla sessione corrente
    - Stai implementando o eseguendo il debug del comportamento BTW tra i client
summary: Domande collaterali effimere con /btw
title: A proposito, domande secondarie
x-i18n:
    generated_at: "2026-06-27T18:18:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw` ti consente di porre una rapida domanda secondaria sulla **sessione corrente** senza
trasformare quella domanda nella normale cronologia della conversazione. `/side` è un alias.

È modellato sul comportamento di `/btw` di Claude Code, ma adattato al
Gateway e all'architettura multi-canale di OpenClaw.

## Cosa fa

Quando invii:

```text
/btw what changed?
```

OpenClaw:

1. acquisisce uno snapshot del contesto della sessione corrente,
2. esegue una query secondaria effimera separata,
3. risponde solo alla domanda secondaria,
4. lascia invariata l'esecuzione principale,
5. **non** scrive la domanda o la risposta BTW nella cronologia della sessione,
6. emette la risposta come **risultato secondario live** invece che come normale messaggio dell'assistente.

Il modello mentale importante è:

- stesso contesto di sessione
- query secondaria one-shot separata
- stesso trasporto harness nativo quando la sessione usa un harness nativo
- nessuna contaminazione del contesto futuro
- nessuna persistenza della trascrizione

Per le sessioni con harness Codex, BTW resta dentro Codex tramite il fork del thread
app-server attivo come thread secondario effimero. Questo mantiene intatti OAuth di Codex e il comportamento
del thread nativo, isolando comunque la risposta secondaria dalla trascrizione padre. Come `/side` di Codex, il thread secondario mantiene le autorizzazioni Codex correnti
e la superficie degli strumenti nativi, con guardrail che indicano al modello di non
trattare il lavoro ereditato dal thread padre come istruzioni attive.

Per gli alias del runtime CLI, BTW usa il backend CLI proprietario in modalità domanda secondaria
invece di ripiegare su una chiamata diretta al provider. OpenClaw inserisce un contesto
di conversazione sanificato in una nuova invocazione CLI one-shot, disabilita il bundling degli strumenti MCP
di OpenClaw e lo stato della sessione CLI riutilizzabile per tale invocazione, e lascia che il
backend aggiunga eventuali flag CLI nativi no-resume o no-tools supportati. I runtime diretti
non CLI mantengono il percorso one-shot diretto.

## Cosa non fa

`/btw` **non**:

- crea una nuova sessione durevole,
- continua l'attività principale incompiuta,
- scrive dati di domanda/risposta BTW nella cronologia della trascrizione,
- appare in `chat.history`,
- sopravvive a un ricaricamento.

È intenzionalmente **effimero**.

## Come funziona il contesto

BTW usa la sessione corrente solo come **contesto di sfondo**.

Se l'esecuzione principale è attualmente attiva, OpenClaw acquisisce uno snapshot dello stato
dei messaggi corrente e include il prompt principale in corso come contesto di sfondo,
indicando esplicitamente al modello di:

- rispondere solo alla domanda secondaria,
- non riprendere né completare l'attività principale incompiuta,
- non orientare la conversazione padre.

Questo mantiene BTW isolato dall'esecuzione principale, pur rendendolo consapevole di ciò di cui
tratta la sessione.

## Modello di consegna

BTW **non** viene consegnato come un normale messaggio dell'assistente nella trascrizione.

A livello di protocollo Gateway:

- la normale chat dell'assistente usa l'evento `chat`
- BTW usa l'evento `chat.side_result`

Questa separazione è intenzionale. Se BTW riutilizzasse il normale percorso dell'evento `chat`,
i client lo tratterebbero come cronologia di conversazione regolare.

Poiché BTW usa un evento live separato e non viene riprodotto da
`chat.history`, scompare dopo un ricaricamento.

## Comportamento sulle superfici

### TUI

Nel TUI, BTW viene renderizzato inline nella vista della sessione corrente, ma resta
effimero:

- visibilmente distinto da una normale risposta dell'assistente
- chiudibile con `Enter` o `Esc`
- non riprodotto al ricaricamento

### Canali esterni

Su canali come Telegram, WhatsApp e Discord, BTW viene consegnato come
risposta una tantum chiaramente etichettata, perché queste superfici non hanno un concetto locale
di overlay effimero.

La risposta viene comunque trattata come risultato secondario, non come normale cronologia della sessione.

### Control UI / web

Il Gateway emette correttamente BTW come `chat.side_result`, e BTW non è incluso
in `chat.history`, quindi il contratto di persistenza è già corretto per il web.

L'attuale Control UI necessita ancora di un consumer dedicato per `chat.side_result` per
renderizzare BTW live nel browser. Finché quel supporto lato client non sarà disponibile, BTW è una
funzionalità a livello di Gateway con comportamento completo nel TUI e nei canali esterni, ma non ancora
una UX browser completa.

## Quando usare BTW

Usa `/btw` quando vuoi:

- una rapida chiarificazione sul lavoro corrente,
- una risposta fattuale secondaria mentre una lunga esecuzione è ancora in corso,
- una risposta temporanea che non deve diventare parte del contesto futuro della sessione.

Esempi:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quando non usare BTW

Non usare `/btw` quando vuoi che la risposta diventi parte del
contesto di lavoro futuro della sessione.

In quel caso, fai la domanda normalmente nella sessione principale invece di usare BTW.

## Correlati

<CardGroup cols={2}>
  <Card title="Slash commands" href="/it/tools/slash-commands" icon="terminal">
    Catalogo dei comandi nativi e direttive della chat.
  </Card>
  <Card title="Thinking levels" href="/it/tools/thinking" icon="brain">
    Livelli di impegno di ragionamento per la chiamata al modello della domanda secondaria.
  </Card>
  <Card title="Session" href="/it/concepts/session" icon="comments">
    Chiavi di sessione, cronologia e semantica della persistenza.
  </Card>
  <Card title="Steer command" href="/it/tools/steer" icon="arrow-right">
    Inserisci un messaggio di orientamento nell'esecuzione attiva senza terminarla.
  </Card>
</CardGroup>
