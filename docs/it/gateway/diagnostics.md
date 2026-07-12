---
read_when:
    - Preparazione di una segnalazione di bug o di una richiesta di assistenza
    - Debug di arresti anomali e riavvii del Gateway, pressione sulla memoria o payload di dimensioni eccessive
    - Verifica di quali dati diagnostici vengono registrati o oscurati
summary: Crea pacchetti diagnostici del Gateway condivisibili per le segnalazioni di bug
title: Esportazione della diagnostica
x-i18n:
    generated_at: "2026-07-12T07:01:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw può creare un file `.zip` locale di diagnostica per le segnalazioni di bug: stato
sanitizzato del Gateway, integrità, log, struttura della configurazione ed eventi recenti di stabilità privi di payload.

Tratta i pacchetti di diagnostica come segreti finché non vengono esaminati. I payload e le credenziali
vengono oscurati per impostazione predefinita, ma il pacchetto riepiloga comunque i log locali del Gateway e
lo stato di runtime a livello di host.

## Avvio rapido

```bash
openclaw gateway diagnostics export
```

Stampa il percorso del file zip creato. Per scegliere un percorso di output:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Per l'automazione:

```bash
openclaw gateway diagnostics export --json
```

## Comando di chat

I proprietari possono eseguire `/diagnostics [note]` in qualsiasi conversazione per richiedere
un'esportazione locale del Gateway sotto forma di singolo report di supporto copiabile e incollabile:

1. Invia `/diagnostics`, facoltativamente con una breve nota (`/diagnostics bad tool choice`).
2. OpenClaw invia un preambolo e richiede un'unica approvazione esplicita dell'esecuzione, che avvia
   `openclaw gateway diagnostics export --json`. Non approvare la diagnostica tramite
   una regola che consenta tutto.
3. Dopo l'approvazione, OpenClaw risponde con il percorso del pacchetto locale, il riepilogo
   del manifesto, le note sulla privacy e gli ID di sessione pertinenti.

Nelle chat di gruppo, un proprietario può comunque eseguire `/diagnostics`, ma OpenClaw invia
privatamente al proprietario il risultato dell'esportazione, le richieste di approvazione e la suddivisione
delle sessioni e dei thread di Codex. Il gruppo vede solo un breve avviso che indica che la diagnostica è stata inviata
privatamente. Se non esiste un canale privato verso il proprietario, il comando si arresta in modo sicuro e chiede
al proprietario di eseguirlo da un messaggio diretto.

Quando la sessione attiva usa l'harness nativo OpenAI Codex, la stessa approvazione
dell'esecuzione copre anche il caricamento di feedback a OpenAI per i thread di Codex noti
a OpenClaw. Tale caricamento è separato dal file zip locale del Gateway e avviene solo
per le sessioni dell'harness Codex. La richiesta di approvazione specifica che l'approvazione
invia anche il feedback di Codex, senza elencare gli ID di sessione o di thread di Codex. Dopo
l'approvazione, la risposta elenca i canali, gli ID di sessione di OpenClaw, gli ID dei thread di Codex e
i comandi locali di ripresa per i thread inviati a OpenAI. Negare o
ignorare l'approvazione impedisce l'esportazione, il caricamento del feedback di Codex e la visualizzazione
dell'elenco degli ID di Codex.

Questo rende breve il ciclo di debug di Codex: rileva un comportamento errato in un canale,
esegui `/diagnostics`, approva una sola volta, condividi il report, quindi esegui localmente il comando
`codex resume <thread-id>` stampato se vuoi esaminare personalmente il thread.
Consulta [Harness Codex](/it/plugins/codex-harness#inspect-codex-threads-locally).

## Contenuto dell'esportazione

- `summary.md`: panoramica leggibile destinata al supporto.
- `diagnostics.json`: riepilogo leggibile dalle macchine di configurazione, log, stato, integrità
  e dati di stabilità.
- `manifest.json`: metadati dell'esportazione ed elenco dei file.
- Struttura sanitizzata della configurazione e dettagli di configurazione non segreti.
- Riepiloghi sanitizzati dei log e righe di log recenti oscurate.
- Snapshot dello stato e dell'integrità del Gateway acquisiti con il massimo impegno possibile.
- `stability/latest.json`: pacchetto di stabilità persistente più recente, quando disponibile.

L'esportazione rimane utile anche quando il Gateway non è integro: se le richieste
di stato o integrità non riescono, vengono comunque raccolti, quando disponibili, i log locali, la struttura
della configurazione e il pacchetto di stabilità più recente.

## Modello di privacy

Conservati: nomi dei sottosistemi, ID dei Plugin, ID dei provider, ID dei canali, modalità
configurate, codici di stato, durate, conteggi dei byte, stato delle code, letture della memoria,
metadati sanitizzati dei log, messaggi operativi oscurati, struttura della configurazione e
impostazioni non segrete delle funzionalità.

Omessi o oscurati: testo delle chat, prompt, istruzioni, corpi dei Webhook, output degli
strumenti, credenziali, chiavi API, token, cookie, valori segreti, corpi non elaborati
di richieste e risposte, ID degli account, ID dei messaggi, ID di sessione non elaborati,
nomi host e nomi utente locali.

Quando un messaggio di log sembra contenere testo proveniente da un utente, una chat, un prompt o il payload di uno strumento,
l'esportazione conserva solo l'indicazione che il messaggio è stato omesso e il relativo conteggio dei byte.

## Registratore di stabilità

Per impostazione predefinita, quando la diagnostica è abilitata, il Gateway registra un flusso di stabilità
limitato e privo di payload. Acquisisce dati operativi, non contenuti.

Lo stesso Heartbeat campiona anche la vitalità quando il ciclo degli eventi o la CPU sembrano
saturi, generando eventi `diagnostic.liveness.warning` con il ritardo del ciclo degli eventi,
il suo utilizzo, il rapporto tra core della CPU, il numero di sessioni attive/in attesa/in coda,
la fase corrente di avvio o runtime (quando nota), gli intervalli delle fasi recenti e
etichette limitate delle attività. Questi dati diventano righe di log di livello `warn` del Gateway solo quando
sono presenti attività in attesa o in coda, oppure quando un'attività attiva coincide con un ritardo prolungato
del ciclo degli eventi; in caso contrario vengono registrati a livello `debug`. I campioni di vitalità durante l'inattività vengono comunque registrati
come eventi di diagnostica, ma da soli non vengono mai elevati al livello di avviso.

Le fasi di avvio generano eventi `diagnostic.phase.completed` con le tempistiche
dell'orologio reale e della CPU. La diagnostica delle esecuzioni incorporate bloccate imposta `terminalProgressStale=true`
quando l'ultimo avanzamento del bridge sembrava terminale, ad esempio un elemento di risposta non elaborato
o un evento di completamento della risposta, ma il Gateway considera ancora attiva
l'esecuzione incorporata.

Per ispezionare il registratore in tempo reale:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Per ispezionare il pacchetto persistente più recente dopo un'uscita fatale, un timeout di arresto o
un errore di avvio successivo a un riavvio:

```bash
openclaw gateway stability --bundle latest
```

Per creare un file zip di diagnostica dal pacchetto persistente più recente:

```bash
openclaw gateway stability --bundle latest --export
```

Quando esistono eventi, i pacchetti persistenti si trovano in `~/.openclaw/logs/stability/`.

## Opzioni utili

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Flag                    | Valore predefinito                                                            | Descrizione                                                        |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Scrive in un percorso specifico per il file zip o la directory.    |
| `--log-lines <count>`   | `5000`                                                                        | Numero massimo di righe di log sanitizzate da includere.           |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Numero massimo di byte dei log da esaminare.                       |
| `--url <url>`           | -                                                                             | URL WebSocket del Gateway per gli snapshot di stato e integrità.   |
| `--token <token>`       | -                                                                             | Token del Gateway per gli snapshot di stato e integrità.           |
| `--password <password>` | -                                                                             | Password del Gateway per gli snapshot di stato e integrità.        |
| `--timeout <ms>`        | `3000`                                                                        | Timeout degli snapshot di stato e integrità.                       |
| `--no-stability-bundle` | disattivato                                                                   | Salta la ricerca del pacchetto di stabilità persistente.           |
| `--json`                | disattivato                                                                   | Stampa i metadati dell'esportazione in formato leggibile dalle macchine. |

## Disabilitare la diagnostica

La diagnostica è abilitata per impostazione predefinita. Per disabilitare il registratore di stabilità e
la raccolta degli eventi di diagnostica:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

La disabilitazione della diagnostica riduce i dettagli disponibili nelle segnalazioni di bug, ma non influisce sulla normale
registrazione dei log del Gateway.

Gli snapshot in condizioni critiche di pressione sulla memoria sono disattivati per impostazione predefinita. Per acquisire lo
snapshot di stabilità precedente all'esaurimento della memoria, oltre ai normali eventi di diagnostica:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Usa questa opzione solo su host in grado di tollerare la scansione aggiuntiva del file system e
la scrittura dello snapshot durante una pressione critica sulla memoria. Quando lo snapshot è disattivato,
i normali eventi di pressione sulla memoria registrano comunque RSS, heap, soglia e dati di crescita
(`rss_threshold`, `heap_threshold`, `rss_growth`).

## Argomenti correlati

- [Controlli di integrità](/it/gateway/health)
- [CLI del Gateway](/it/cli/gateway#gateway-diagnostics-export)
- [Protocollo del Gateway](/it/gateway/protocol#rpc-method-families)
- [Registrazione dei log](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) - flusso separato per trasmettere la diagnostica a un raccoglitore
