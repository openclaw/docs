---
read_when:
    - Esecuzione o debug del processo del Gateway
    - Analisi dell'applicazione dell'istanza singola
summary: 'Protezione dell''istanza singola del Gateway: blocco del file e binding WebSocket/HTTP'
title: Blocco del Gateway
x-i18n:
    generated_at: "2026-07-12T07:04:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Perché

- Un solo processo Gateway dovrebbe essere proprietario di una determinata configurazione e porta su un host; per eseguire Gateway aggiuntivi, usa profili isolati e porte univoche.
- Sopravvivere ad arresti anomali/SIGKILL senza lasciare file di blocco obsoleti.
- Interrompere immediatamente l'avvio con un errore chiaro quando un altro Gateway è già proprietario della porta.

## Due livelli

L'avvio impone la proprietà a istanza singola in due passaggi indipendenti, nell'ordine seguente:

1. Il **blocco del file** acquisisce un file di blocco specifico per la configurazione nella directory dei blocchi dello stato. Durante l'acquisizione, l'avvio verifica se sulla porta configurata è presente un listener attivo, per rilevare un proprietario del blocco obsoleto (arrestato in modo anomalo).
2. Il **binding del socket** associa il listener HTTP/WebSocket (valore predefinito `ws://127.0.0.1:18789`) come listener TCP esclusivo.

Ogni livello può non riuscire indipendentemente e genera il proprio `GatewayLockError`.

### Blocco del file

- Se il file di blocco non è presente, il processo proprietario registrato non è più in esecuzione oppure la verifica della porta del proprietario non rileva alcun listener attivo, l'avvio recupera il blocco e prosegue.
- Se il blocco è attivamente detenuto e non si applica nessuna delle condizioni precedenti, l'avvio riprova per un massimo di 5 secondi (valore predefinito) prima di rinunciare:

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### Binding del socket

- In caso di `EADDRINUSE`, l'avvio riprova il binding per un massimo di 20 tentativi a intervalli di 500 ms (circa 10 secondi in totale), per superare una finestra `TIME_WAIT` successiva alla recente terminazione di un processo.
- Se la porta è ancora in uso dopo i tentativi:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- Altri errori di binding:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

All'arresto, il Gateway chiude il server HTTP/WebSocket e rimuove il file di blocco.

## Note operative

- Se la porta è occupata da un processo diverso, che non è un Gateway, l'errore è lo stesso; libera la porta oppure scegline un'altra con `openclaw gateway --port <port>`.
- Con un supervisore di servizi, un nuovo processo Gateway che riscontra uno degli errori precedenti verifica prima `/healthz` sul processo esistente. Se tale processo è integro, il nuovo processo gli lascia il controllo anziché terminare con un errore. Su systemd, termina con il codice `78`; l'impostazione `RestartPreventExitStatus=78` dell'unità impedisce a `Restart=always` di entrare in un ciclo a causa di un conflitto di blocco o `EADDRINUSE`. Se il processo esistente non diventa mai integro, i nuovi tentativi di verifica dello stato sono limitati nel tempo e l'avvio termina quindi con l'errore di blocco riportato sopra, anziché continuare all'infinito.
- L'app macOS mantiene una propria protezione PID leggera prima di avviare il Gateway; il blocco del file e il binding del socket descritti sopra costituiscono l'effettivo meccanismo di imposizione in fase di esecuzione.

## Contenuti correlati

- [Gateway multipli](/it/gateway/multiple-gateways) - esecuzione di più istanze con porte univoche
- [Risoluzione dei problemi](/it/gateway/troubleshooting) - diagnosi di `EADDRINUSE` e dei conflitti di porta
