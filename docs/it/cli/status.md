---
read_when:
    - Vuoi una diagnosi rapida dello stato del canale e dei destinatari delle sessioni recenti
    - Vuoi uno stato "all" incollabile per il debug
summary: Riferimento CLI per `openclaw status` (diagnostica, sonde, istantanee di utilizzo)
title: openclaw status
x-i18n:
    generated_at: "2026-07-12T06:57:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

Diagnostica per canali e sessioni.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| Flag                    | Descrizione                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--all`                 | Diagnosi completa (di sola lettura, incollabile). Include controlli di sicurezza, compatibilità dei plugin e verifiche dei vettori di memoria. |
| `--deep`                | Esegue verifiche in tempo reale (WhatsApp Web + Telegram + Discord + Slack + Signal). Abilita anche il controllo di sicurezza. |
| `--usage`               | Visualizza le finestre normalizzate di utilizzo dei provider nel formato `X% left`.                                      |
| `--json`                | Output leggibile dalla macchina.                                                                                         |
| `--verbose` / `--debug` | Visualizza anche la risoluzione non elaborata della destinazione del Gateway prima del rapporto.                         |

Il semplice `openclaw status` mantiene il percorso rapido di sola lettura e contrassegna la memoria come
`not checked` anziché non disponibile quando ne salta l'ispezione. I controlli più approfonditi
di sicurezza, compatibilità dei plugin e vettori di memoria sono demandati a
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
e `openclaw memory status --deep`.

## Risoluzione della sessione e del modello

- L'output dello stato della sessione separa `Execution:` da `Runtime:`. `Execution`
  indica il percorso della sandbox (`direct`, `docker/*`), mentre `Runtime` indica
  se la sessione utilizza `OpenClaw Default`, `OpenAI Codex`, un backend
  CLI o un backend ACP come `codex (acp/acpx)`. Consulta
  [Runtime degli agenti](/it/concepts/agent-runtimes) per la distinzione tra
  provider, modello e runtime.
- Quando l'istantanea della sessione corrente contiene pochi dati, `/status` può recuperare i contatori
  di token e cache dal registro di utilizzo della trascrizione più recente. I valori correnti
  diversi da zero continuano ad avere la precedenza sui valori di ripiego della trascrizione.
- Il ripiego sulla trascrizione può anche recuperare l'etichetta del modello runtime attivo quando
  manca nella voce della sessione in tempo reale. Se tale modello della trascrizione differisce
  dal modello selezionato, lo stato risolve la finestra di contesto rispetto al
  modello runtime recuperato anziché a quello selezionato.
- Per il calcolo delle dimensioni del prompt, il ripiego sulla trascrizione preferisce il totale più elevato
  orientato al prompt quando i metadati della sessione sono mancanti o inferiori, in modo che
  le sessioni con provider personalizzati non vengano ridotte a visualizzazioni di `0` token.
- Quando una sessione è vincolata a un modello diverso da quello primario configurato,
  lo stato visualizza entrambi i valori, il motivo (`session override`) e
  il suggerimento `/model default`. Il modello primario configurato si applica alle sessioni nuove o
  non vincolate; le sessioni già vincolate mantengono la propria selezione
  finché non viene rimossa.
- L'output include gli archivi delle sessioni per ogni agente quando sono configurati
  più agenti.

## Utilizzo e quota

- `--usage` visualizza le finestre normalizzate di utilizzo dei provider nel formato `X% left`.
- I campi non elaborati `usage_percent` / `usagePercent` di MiniMax indicano la quota rimanente,
  quindi OpenClaw li inverte prima della visualizzazione; i campi basati sul conteggio hanno la precedenza quando
  presenti. Le risposte `model_remains` preferiscono la voce del modello di chat, ricavano
  l'etichetta della finestra dai timestamp quando necessario e includono il nome del modello
  nell'etichetta del piano.
- Gli errori di aggiornamento dei prezzi dei modelli vengono mostrati come avvisi facoltativi sui prezzi.
  Non indicano che il Gateway o i canali non funzionino correttamente.

## Panoramica e stato degli aggiornamenti

- Quando disponibili, la panoramica include lo stato di installazione ed esecuzione del servizio host
  del Gateway e del Node, oltre al tempo di attività compatto del processo Gateway e
  al tempo di attività del sistema host.
- La panoramica include il canale di aggiornamento e lo SHA git (per i checkout del codice sorgente).
- Le informazioni sugli aggiornamenti sono mostrate nella panoramica; se è disponibile un aggiornamento, lo stato
  visualizza un suggerimento per eseguire `openclaw update` (consulta [Aggiornamento](/it/install/updating)).

## Segreti

- Le superfici di stato di sola lettura (`status`, `status --json`, `status --all`)
  risolvono, quando possibile, i SecretRef supportati per i percorsi di configurazione interessati.
- Se un SecretRef supportato per un canale è configurato ma non disponibile nel
  percorso del comando corrente, lo stato rimane di sola lettura e segnala un output
  degradato anziché arrestarsi in modo anomalo. L'output leggibile mostra avvisi come "token configurato
  non disponibile nel percorso di questo comando", mentre l'output JSON include
  `secretDiagnostics`.
- Quando la risoluzione locale al comando del SecretRef riesce, lo stato preferisce
  l'istantanea risolta e rimuove dall'output finale gli indicatori temporanei
  "segreto non disponibile" del canale.
- `status --all` include una riga di panoramica dei segreti e una sezione diagnostica
  che riepiloga la diagnostica dei segreti (troncata per facilitarne la lettura) senza
  interrompere la generazione del rapporto.

## Memoria

`status --json --all` riporta i dettagli della memoria dal runtime del plugin di memoria attivo
selezionato da `plugins.slots.memory`. I plugin di memoria personalizzati possono lasciare
disabilitato il parametro integrato `agents.defaults.memorySearch.enabled` e continuare a riportare
i propri file, frammenti, vettori e lo stato FTS.

## Contenuti correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/gateway/doctor)
