---
read_when:
    - Stai approvando richieste di associazione dei dispositivi
    - Devi ruotare o revocare i token dei dispositivi
summary: Riferimento della CLI per `openclaw devices` (associazione dei dispositivi + rotazione/revoca dei token)
title: Dispositivi
x-i18n:
    generated_at: "2026-07-12T06:53:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gestisce le richieste di associazione dei dispositivi e i token con ambito dispositivo.

## Opzioni comuni

- `--url <url>`: URL WebSocket del Gateway (per impostazione predefinita usa `gateway.remote.url`, se configurato)
- `--token <token>`: token del Gateway (se richiesto)
- `--password <password>`: password del Gateway (autenticazione tramite password)
- `--timeout <ms>`: timeout RPC
- `--json`: output JSON (consigliato per gli script)

<Warning>
Quando imposti `--url`, la CLI non utilizza come ripiego le credenziali della configurazione o dell'ambiente. Passa esplicitamente `--token` o `--password`, altrimenti il comando restituisce un errore.
</Warning>

## Comandi

### `openclaw devices list`

Elenca le richieste di associazione in sospeso e i dispositivi associati.

```bash
openclaw devices list
openclaw devices list --json
```

Per una richiesta in sospeso relativa a un dispositivo già associato, l'output mostra l'accesso richiesto accanto all'accesso attualmente approvato per il dispositivo, in modo che gli ampliamenti di ambito o ruolo siano visibili e non sembrino un'associazione persa.

I nomi visualizzati dei dispositivi associati usano questo ordine di precedenza: etichetta dell'operatore (`operatorLabel` da `devices rename`), quindi `displayName` del client, poi `clientId` e infine `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Approva una richiesta di associazione in sospeso tramite il `requestId` esatto. Se ometti `requestId` o passi `--latest`, il comando mostra solo un'anteprima della richiesta in sospeso più recente e termina (codice 1); eseguilo di nuovo con l'ID richiesta esatto per approvarla.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Se un dispositivo ritenta l'associazione con dettagli di autenticazione modificati (ruolo, ambiti o chiave pubblica), OpenClaw sostituisce la precedente voce in sospeso con un nuovo `requestId`. Esegui `openclaw devices list` immediatamente prima dell'approvazione per ottenere l'ID corrente.
</Note>

Comportamento dell'approvazione:

- Se il dispositivo è già associato e richiede ambiti più ampi o un altro ruolo, OpenClaw mantiene l'approvazione esistente e crea una nuova richiesta di aggiornamento in sospeso. Prima di approvarla, confronta `Requested` con `Approved` in `openclaw devices list` oppure visualizza l'anteprima con `--latest`.
- L'approvazione di un ruolo `node` o di un altro ruolo non operatore richiede `operator.admin`. `operator.pairing` è sufficiente per approvare dispositivi operatore, ma solo quando gli ambiti operatore richiesti rientrano negli ambiti del chiamante. Consulta [Ambiti dell'operatore](/it/gateway/operator-scopes).
- Se `gateway.nodes.pairing.autoApproveCidrs` è configurato, le prime richieste con `role: node` provenienti da IP client corrispondenti possono essere approvate automaticamente prima di comparire in questo elenco. È disabilitato per impostazione predefinita e non si applica mai ai client operatore/browser né alle richieste di aggiornamento.
- `gateway.nodes.pairing.sshVerify` (attivo per impostazione predefinita) approva automaticamente le prime richieste con `role: node` quando il Gateway verifica tramite SSH la chiave del dispositivo sull'host del nodo. Le richieste possono quindi risultare approvate poco dopo la loro comparsa. Imposta `sshVerify: false` per disabilitare la verifica SSH; questa impostazione è indipendente da `autoApproveCidrs`, quindi rimuovi anche quest'ultima per consentire esclusivamente l'associazione manuale.

### `openclaw devices reject <requestId>`

Rifiuta una richiesta di associazione del dispositivo in sospeso.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Rimuove la voce di un dispositivo associato.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Un chiamante autenticato con il token di un dispositivo associato può rimuovere solo la voce del **proprio** dispositivo. La rimozione di un altro dispositivo richiede `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Assegna un'etichetta dell'operatore a un dispositivo associato. Le etichette sono uno stato sul lato del proprietario: persistono dopo le riparazioni dell'associazione e le nuove approvazioni dei ruoli e non modificano il `deviceId` stabile.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` è obbligatorio, viene privato degli spazi iniziali e finali, non può essere vuoto ed è limitato a 64 caratteri.
- Le interfacce di visualizzazione (elenco della CLI, inventario della Control UI) preferiscono l'etichetta dell'operatore al nome visualizzato comunicato dal client.
- Un chiamante associato privo di privilegi di amministratore può rinominare solo il **proprio** dispositivo. Per rinominare un altro dispositivo è necessario `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Rimuove in blocco i dispositivi associati. Richiede `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` rifiuta anche tutte le richieste di associazione in sospeso.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Ruota il token di un dispositivo per un ruolo, aggiornandone facoltativamente gli ambiti.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- Il ruolo di destinazione deve già esistere nel contratto di associazione approvato del dispositivo; la rotazione non può generare un nuovo ruolo non approvato.
- Omettendo `--scope`, nelle riconnessioni successive vengono riutilizzati gli ambiti approvati memorizzati nella cache del token archiviato. Passando valori `--scope` espliciti, l'insieme di ambiti archiviato viene sostituito per le future riconnessioni con token memorizzato nella cache.
- Un chiamante associato privo di privilegi di amministratore può ruotare solo il token del **proprio** dispositivo e l'insieme di ambiti di destinazione deve rientrare negli ambiti operatore del chiamante; la rotazione non può generare né conservare un token con privilegi più ampi di quelli già posseduti dal chiamante.

Restituisce i metadati di rotazione in formato JSON. Se il chiamante ruota il proprio token mentre è autenticato con il token di quel dispositivo, la risposta include il token sostitutivo affinché il client possa salvarlo prima di riconnettersi. Le rotazioni condivise o amministrative non restituiscono mai il bearer token.

### `openclaw devices revoke --device <id> --role <role>`

Revoca il token di un dispositivo per un ruolo.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Un chiamante associato privo di privilegi di amministratore può revocare solo il token del **proprio** dispositivo. La revoca del token di un altro dispositivo richiede `operator.admin`. Anche l'insieme di ambiti di destinazione deve rientrare negli ambiti operatore del chiamante; i chiamanti con soli privilegi di associazione non possono revocare token operatore di amministrazione/scrittura.

## Note

- Questi comandi richiedono l'ambito `operator.pairing` (o `operator.admin`). I ruoli dispositivo non operatore richiedono sempre `operator.admin`; consulta [Ambiti dell'operatore](/it/gateway/operator-scopes).
- La rotazione e la revoca dei token rimangono entro l'insieme di ruoli di associazione approvati e la base di riferimento degli ambiti del dispositivo. Una voce di token estranea memorizzata nella cache non concede una destinazione per la gestione dei token.
- Per le sessioni con token di dispositivi associati, la gestione tra dispositivi diversi (`remove`, `rename`, `rotate`, `revoke`) è limitata al proprio dispositivo, a meno che il chiamante non disponga di `operator.admin`.
- La rotazione del token restituisce un nuovo token (sensibile): trattalo come un segreto.
- Se l'ambito di associazione non è disponibile sul local loopback e non viene passato un `--url` esplicito, `list`/`approve` possono utilizzare come ripiego lo stato di associazione locale.

## Elenco di controllo per il ripristino della divergenza dei token

Usa questa procedura quando la Control UI o altri client continuano a non riuscire a connettersi con `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` o `AUTH_SCOPE_MISMATCH`.

1. Conferma l'origine corrente del token del Gateway:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Elenca i dispositivi associati e identifica l'ID del dispositivo interessato:

   ```bash
   openclaw devices list
   ```

3. Ruota il token operatore del dispositivo interessato:

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Se la rotazione non è sufficiente, rimuovi l'associazione obsoleta e approvala di nuovo:

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Riprova la connessione del client con il token o la password condivisi correnti.

Note:

- Precedenza normale dell'autenticazione alla riconnessione: prima il token o la password condivisi espliciti, quindi il `deviceToken` esplicito, poi il token del dispositivo archiviato e infine il token di bootstrap.
- Il ripristino attendibile da `AUTH_TOKEN_MISMATCH` può inviare temporaneamente insieme il token condiviso e il token del dispositivo archiviato per un singolo tentativo limitato.
- `AUTH_SCOPE_MISMATCH` indica che il token del dispositivo è stato riconosciuto ma non include l'insieme di ambiti richiesto; correggi il contratto di approvazione dell'associazione/degli ambiti prima di modificare l'autenticazione condivisa del Gateway.

Correlati:

- [Risoluzione dei problemi di autenticazione della dashboard](/it/web/dashboard#if-you-see-unauthorized-1008)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Approvazione al primo avvio di Paperclip / `openclaw_gateway`

Gli agenti Paperclip che si connettono tramite l'adattatore `openclaw_gateway` seguono la stessa approvazione di associazione del dispositivo al primo avvio di qualsiasi altro nuovo client. Se Paperclip segnala `openclaw_gateway_pairing_required`, approva il dispositivo in sospeso e riprova.

```bash
openclaw devices approve --latest
```

L'anteprima mostra il comando esatto `openclaw devices approve <requestId>`; verifica i dettagli, quindi esegui di nuovo quel comando con l'ID richiesta per approvarla. Per un Gateway remoto o credenziali esplicite, passa le stesse opzioni sia durante l'anteprima sia durante l'approvazione:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Per evitare di dover approvare nuovamente dopo ogni riavvio, configura un valore persistente per `adapterConfig.devicePrivateKeyPem` in Paperclip, invece di consentirgli di generare una nuova identità effimera del dispositivo a ogni esecuzione:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Se l'approvazione continua a non riuscire, esegui prima `openclaw devices list` per confermare che esista una richiesta in sospeso.

## Correlati

- [Riferimento della CLI](/it/cli)
- [Nodi](/it/nodes)
