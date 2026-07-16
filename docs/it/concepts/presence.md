---
read_when:
    - Debug dello stato in tempo reale nella pagina Dispositivi dell'interfaccia di controllo
    - Analisi delle righe di istanze duplicate o obsolete
    - Modifica della connessione WS del Gateway o dei beacon degli eventi di sistema
summary: Come vengono generate, unite e visualizzate le voci di presenza di OpenClaw
title: Presenza
x-i18n:
    generated_at: "2026-07-16T14:09:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw "presence" è una vista leggera e basata sul massimo impegno di:

- il **Gateway** stesso e
- i **client visibili all'utente connessi al Gateway** (app per Mac, WebChat, nodi ecc.)

La presenza mostra i metadati della connessione in tempo reale nella pagina **Dispositivi** dell'interfaccia di controllo
(in **Impostazioni → Dispositivi**) e nella scheda **Istanze** dell'app macOS.

Questa pagina descrive l'elenco dei client del Gateway. Per rilevare il Mac utilizzato
più di recente e instradare lì gli avvisi dei nodi, consultare
[Presenza del computer attivo](/nodes/presence).

## Campi della presenza (cosa viene visualizzato)

Le voci di presenza sono oggetti strutturati con campi quali:

- `instanceId` (facoltativo ma fortemente consigliato): identità stabile del client (solitamente `connect.client.instanceId`)
- `host`: nome host facilmente comprensibile
- `ip`: indirizzo IP determinato in base al massimo impegno
- `version`: stringa della versione del client
- `deviceFamily` / `modelIdentifier`: indicazioni sull'hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: secondi trascorsi dall'ultimo input dell'utente, se noto
- `reason`: stringa in formato libero fornita dal client; il Gateway stesso emette solo `self`, `connect` e `disconnect`
- `deviceId`, `roles`, `scopes`: identità del dispositivo e indicazioni sul ruolo/ambito provenienti dall'handshake di connessione
- `ts`: timestamp dell'ultimo aggiornamento (ms dall'epoca)

## Produttori (origine della presenza)

Le voci di presenza sono prodotte da più fonti e vengono **unite**.

### 1) Voce del Gateway stesso

All'avvio, il Gateway inserisce sempre una voce relativa a sé stesso affinché le interfacce mostrino l'host del Gateway
anche prima della connessione di qualsiasi client.

### 2) Connessione WebSocket

Ogni client WS inizia con una richiesta `connect`. Quando l'handshake riesce, il
Gateway inserisce o aggiorna una voce di presenza per quella connessione.

#### Perché le connessioni effimere del piano di controllo non vengono visualizzate

I comandi CLI, i client RPC di backend e le sonde spesso si connettono brevemente. Per evitare
di conservare queste frequenti variazioni per l'intero TTL della presenza, i client in modalità `cli`, `backend`
o `probe` **non** vengono trasformati in voci di presenza. I client in modalità di test
continuano a essere monitorati perché le suite di test li usano come sostituti dei client reali.

### 3) Beacon `system-event`

I client possono inviare beacon periodici più dettagliati tramite il metodo `system-event`. L'app per Mac
lo usa per segnalare il nome host, l'IP e `lastInputSeconds`.

### 4) Connessioni dei nodi (ruolo: nodo)

Quando un nodo si connette tramite il WebSocket del Gateway con `role: node`, il Gateway
inserisce o aggiorna una voce di presenza per quel nodo (seguendo lo stesso flusso degli altri client WS).

## Regole di unione e deduplicazione (perché `instanceId` è importante)

Le voci di presenza vengono archiviate in un'unica mappa in memoria, le cui chiavi non distinguono tra maiuscole e minuscole
e corrispondono al primo valore disponibile tra i seguenti, nell'ordine: l'ID di un dispositivo associato, `connect.client.instanceId`
o, come ultima risorsa, l'ID specifico della connessione.

I client effimeri del piano di controllo sono completamente esclusi dal monitoraggio (vedere
sopra), pertanto i relativi ID di connessione non diventano mai chiavi. Per tutti gli altri client, il
ripiego sull'ID di connessione implica che un client che si riconnette senza un
`instanceId` stabile venga visualizzato come riga **duplicata**.

## TTL e dimensione limitata

La presenza è intenzionalmente effimera:

- **TTL:** le voci più vecchie di 5 minuti vengono eliminate
- **Numero massimo di voci:** 200 (le più vecchie vengono eliminate per prime)

Ciò mantiene aggiornato l'elenco ed evita una crescita illimitata della memoria.

## Avvertenza su connessioni remote/tunnel (IP di loopback)

Quando un client si connette tramite un tunnel SSH o un inoltro di porta locale, il Gateway
può rilevare l'indirizzo remoto come `127.0.0.1`. Per evitare di registrare l'indirizzo del tunnel
come IP del client, la gestione della connessione omette completamente `ip` per
i client rilevati come locali (loopback), anziché scrivere l'indirizzo di loopback
nella voce.

## Utilizzatori

### Pagina Dispositivi dell'interfaccia di controllo

La pagina **Dispositivi** combina `system-presence` con i record persistenti di associazione e dei
nodi. Fissa per primo il beacon del Gateway stesso e usa gli ID corrispondenti del dispositivo o
dell'istanza per i metadati in tempo reale relativi a piattaforma, versione, modello e tempo trascorso dall'ultimo input.

### Scheda Istanze di macOS

L'app macOS visualizza l'output di `system-presence` e applica un piccolo indicatore
di stato (Attivo/Inattivo/Obsoleto) in base al tempo trascorso dall'ultimo aggiornamento.

## Suggerimenti per il debug

- Per visualizzare l'elenco non elaborato, chiamare `system-presence` sul Gateway.
- Se vengono visualizzati duplicati:
  - verificare che i client inviino un `client.instanceId` stabile durante l'handshake
  - verificare che i beacon periodici usino lo stesso `instanceId`
  - controllare se nella voce derivata dalla connessione manca `instanceId` (i duplicati sono previsti)

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Presenza del computer attivo" href="/nodes/presence" icon="computer-mouse">
    In che modo l'input fisico del Mac seleziona un nodo attivo e instrada gli avvisi di connessione.
  </Card>
  <Card title="Indicatori di digitazione" href="/it/concepts/typing-indicators" icon="ellipsis">
    Quando vengono inviati gli indicatori di digitazione e come regolarli.
  </Card>
  <Card title="Streaming e suddivisione in blocchi" href="/it/concepts/streaming" icon="bars-staggered">
    Streaming in uscita, suddivisione in blocchi e formattazione specifica per canale.
  </Card>
  <Card title="Architettura del Gateway" href="/it/concepts/architecture" icon="diagram-project">
    I componenti del Gateway e il protocollo WebSocket che gestisce gli aggiornamenti della presenza.
  </Card>
  <Card title="Protocollo del Gateway" href="/it/gateway/protocol" icon="plug">
    Il protocollo di comunicazione per `connect`, `system-event` e `system-presence`.
  </Card>
</CardGroup>
