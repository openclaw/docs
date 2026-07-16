---
read_when:
    - Esecuzione o debug del processo Gateway
    - Analisi dell'applicazione dell'istanza singola
summary: 'Protezione dell''istanza singola del Gateway: blocco del file e associazione WebSocket/HTTP'
title: Blocco del Gateway
x-i18n:
    generated_at: "2026-07-16T14:20:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Perché

- Una sola istanza del Gateway deve gestire una directory di stato; eseguire Gateway aggiuntivi con profili, directory di stato, configurazioni e porte isolati.
- Resiste ad arresti anomali/SIGKILL senza lasciare file di lock obsoleti.
- Interrompe immediatamente l'avvio con un errore chiaro quando un altro Gateway gestisce già la porta.

## Tre livelli

All'avvio, la proprietà viene verificata in tre passaggi, nell'ordine seguente:

1. Il **lock di proprietà dello stato** acquisisce un lock basato sulla directory di stato canonica. Ogni Gateway partecipa, inclusi quelli avviati con `OPENCLAW_ALLOW_MULTI_GATEWAY=1`, così le operazioni distruttive di manutenzione SQLite non possono entrare in conflitto con un'istanza attiva.
2. Il **lock della configurazione** acquisisce lo storico lock specifico della configurazione e registra la porta di runtime. La modalità con più Gateway ignora questo singleton della configurazione, ma mantiene il lock di proprietà dello stato.
3. Il **binding del socket** associa il listener HTTP/WebSocket (impostazione predefinita: `ws://127.0.0.1:18789`) come listener TCP esclusivo.

Ogni livello può non riuscire indipendentemente e genera il proprio `GatewayLockError`.

### Lock dello stato e della configurazione

- La validità del lock deriva dal PID registrato, dall'identità di avvio del processo della piattaforma, quando disponibile, e dall'identità del processo del Gateway. Un proprietario verificato mantiene l'autorità durante l'avvio, prima che la sua porta inizi l'ascolto.
- Un coordinatore SQLite dedicato serializza l'ispezione dei metadati, il recupero dei proprietari obsoleti e la sostituzione dei lock. La relativa transazione esclusiva viene rilasciata automaticamente se il processo proprietario si arresta in modo anomalo.
- Se manca un file di lock o il processo proprietario registrato non è più attivo, l'avvio recupera il lock e prosegue.
- Se uno dei lock è attivamente detenuto, l'avvio riprova per un massimo di 5 secondi (impostazione predefinita) prima di rinunciare:

  ```text
  GatewayLockError("Gateway già in esecuzione (pid <pid>); timeout del lock dopo <ms> ms")
  ```

### Binding del socket

- In caso di `EADDRINUSE`, l'avvio ritenta il binding per un massimo di 20 tentativi a intervalli di 500ms (circa 10 secondi in totale), per superare una finestra `TIME_WAIT` successiva alla recente terminazione di un processo.
- Se la porta è ancora in uso dopo i tentativi:

  ```text
  GatewayLockError("un'altra istanza del Gateway è già in ascolto su ws://127.0.0.1:<port>")
  ```

- Altri errori di binding:

  ```text
  GatewayLockError("impossibile associare il socket del Gateway su ws://127.0.0.1:<port>: <cause>")
  ```

All'arresto, il Gateway chiude il server HTTP/WebSocket e rimuove i propri file
di lock dello stato e della configurazione.

## Note operative

- Se la porta è occupata da un processo diverso, che non è un Gateway, l'errore è lo stesso; liberare la porta o sceglierne un'altra con `openclaw gateway --port <port>`.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` consente più istanze di configurazione/runtime, non uno stato mutabile condiviso. Ogni istanza richiede comunque un `OPENCLAW_STATE_DIR` univoco.
- Con un supervisore di servizi, un nuovo processo del Gateway che incontra uno degli errori precedenti verifica prima `/healthz` sul processo esistente. Se tale processo è integro, il nuovo processo gli lascia il controllo anziché non riuscire. Su systemd, termina con il codice `78`; l'impostazione `RestartPreventExitStatus=78` dell'unità impedisce a `Restart=always` di entrare in un ciclo a causa di un conflitto di lock o `EADDRINUSE`. Se il processo esistente non diventa mai integro, i tentativi della verifica dello stato sono limitati nel tempo e l'avvio termina quindi con l'errore di lock precedente, anziché continuare indefinitamente.
- L'app macOS mantiene una propria protezione PID leggera prima di avviare il Gateway; il file di lock e il binding del socket descritti sopra costituiscono l'effettivo meccanismo di applicazione a runtime.

## Voci correlate

- [Più Gateway](/it/gateway/multiple-gateways) - esecuzione di più istanze con porte univoche
- [Risoluzione dei problemi](/it/gateway/troubleshooting) - diagnosi di `EADDRINUSE` e dei conflitti di porta
