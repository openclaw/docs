---
read_when:
    - Vuoi porre una breve domanda collaterale sulla sessione corrente
    - Si sta implementando o eseguendo il debug del comportamento di BTW tra i client
summary: Domande secondarie effimere con /btw
title: A proposito, domande secondarie
x-i18n:
    generated_at: "2026-07-16T15:00:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 338a54d0e15ec90aebaeeaee551559a26f1437f7b6dcdde4a4b1e63347ad0759
    source_path: tools/btw.md
    workflow: 16
---

`/btw` (alias `/side`) pone una rapida domanda secondaria sulla **sessione
corrente** senza aggiungerla alla cronologia della conversazione. Si ispira a
`/btw` di Claude Code, adattato al Gateway e all'architettura multicanale
di OpenClaw.

```text
/btw che cosa è cambiato?
/side che cosa significa questo errore?
```

## Funzionamento

1. Crea un'istantanea della sessione corrente come contesto di riferimento (incluso qualsiasi
   prompt dell'esecuzione principale in corso).
2. Esegue una query secondaria separata e monouso, indicando al modello di rispondere soltanto alla
   domanda secondaria e di non riprendere né indirizzare l'attività principale.
3. Recapita la risposta come risultato secondario in tempo reale, non come normale messaggio dell'assistente.
4. Non scrive mai la domanda o la risposta nella cronologia della sessione né in `chat.history`.

L'esecuzione principale, se attiva, rimane inalterata.

Per le sessioni dell'harness Codex, BTW crea un fork del thread attivo dell'app-server Codex in
un thread figlio temporaneo, anziché effettuare una chiamata separata al provider. In questo modo
OAuth di Codex e il comportamento nativo di strumenti e thread rimangono invariati, mentre il thread
derivato mantiene i criteri di approvazione, la sandbox e la superficie degli strumenti nativi
correnti del thread padre. Il thread derivato riceve un prompt di delimitazione che comunica al modello che
tutto ciò che lo precede è contesto di riferimento ereditato, non istruzioni attive,
e che sono effettivi soltanto i messaggi successivi al delimitatore. `/btw` richiede un
thread Codex esistente; inviare prima un messaggio normale.

Per gli alias del runtime CLI, BTW invoca il backend CLI proprietario in modalità
domanda secondaria monouso: inserisce il contesto della conversazione sanificato in una nuova invocazione
CLI con il raggruppamento degli strumenti e lo stato riutilizzabile della sessione disabilitati, e aggiunge
gli eventuali flag per impedire la ripresa e l'uso degli strumenti supportati dal backend. I runtime diretti (non CLI)
utilizzano invece una chiamata diretta e monouso al provider.

## Cosa non fa

`/btw` non crea una sessione permanente, non prosegue l'attività principale incompleta,
non salva i dati di domanda e risposta nella cronologia della trascrizione e non sopravvive a un ricaricamento.

## Modello di recapito

La normale chat dell'assistente utilizza l'evento `chat` del Gateway. BTW utilizza un evento
`chat.side_result` separato, affinché i client non possano confonderlo con la normale
cronologia della conversazione. Poiché non viene riprodotto da `chat.history`,
scompare dopo il ricaricamento.

## Comportamento nelle interfacce

| Interfaccia       | Comportamento                                                                                                                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI               | Visualizzato in linea nel registro della chat, chiaramente distinto da una normale risposta, può essere chiuso con `Enter` o `Esc`.                                                                                                                                                                           |
| Canali esterni    | Recapitato come risposta singola chiaramente etichettata (Telegram, WhatsApp e Discord non dispongono di un overlay temporaneo locale).                                                                                                                                                                         |
| UI di controllo / web | Visualizzato come pannello mobile "Chat secondaria" fissato al thread. Le risposte si accumulano come turni e un campo "Approfondisci" consente di porre la domanda secondaria successiva. La chiusura (`Esc` o la X) conserva la conversazione e la riapre alla risposta successiva; il pulsante del cestino la elimina e interrompe un'esecuzione in sospeso. |

## Popup di selezione (UI di controllo)

Evidenziando del testo all'interno di un messaggio di chat nell'UI di controllo, si apre un piccolo
popup di selezione con due azioni:

- **Maggiori dettagli** invia immediatamente una domanda `/btw` implicita che chiede al
  modello di spiegare il testo evidenziato nel contesto della sessione
  corrente. La risposta viene visualizzata nel pannello mobile della chat secondaria.
- **Chiedi nella chat secondaria** precompila l'editor con una bozza `/btw` che cita il
  testo evidenziato, così da poter digitare una domanda personalizzata al riguardo.

Entrambe le azioni seguono la normale semantica di `/btw`: la domanda e la risposta restano escluse
dalla cronologia della sessione e l'esecuzione principale rimane inalterata.

## Quando utilizzarlo

Utilizzare `/btw` per un rapido chiarimento, una risposta fattuale secondaria mentre un'esecuzione lunga
è ancora in corso oppure una risposta temporanea che non deve entrare nel futuro
contesto della sessione.

```text
/btw quale file stiamo modificando?
/btw riassumi l'attività corrente in una frase
/btw quanto fa 17 * 19?
```

Per qualsiasi informazione che debba diventare parte del futuro contesto di lavoro
della sessione, porre invece la domanda normalmente nella sessione principale.

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="terminal">
    Catalogo dei comandi nativi e direttive della chat.
  </Card>
  <Card title="Livelli di ragionamento" href="/it/tools/thinking" icon="brain">
    Livelli di intensità del ragionamento per la chiamata al modello relativa alla domanda secondaria.
  </Card>
  <Card title="Sessione" href="/it/concepts/session" icon="comments">
    Chiavi della sessione, cronologia e semantica della persistenza.
  </Card>
  <Card title="Comando Steer" href="/it/tools/steer" icon="arrow-right">
    Inserisce un messaggio di indirizzamento nell'esecuzione attiva senza terminarla.
  </Card>
</CardGroup>
