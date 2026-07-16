---
read_when:
    - Si desidera connettere OpenClaw agli SMS tramite Twilio
    - È necessario configurare il Webhook SMS o l'elenco di elementi consentiti
summary: Configurazione del canale SMS Twilio, controlli di accesso e configurazione del webhook
title: SMS
x-i18n:
    generated_at: "2026-07-16T14:01:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw riceve e invia SMS tramite un numero di telefono Twilio o un Messaging Service. Il Gateway registra una route Webhook in ingresso (valore predefinito `/webhooks/sms`), convalida per impostazione predefinita le firme delle richieste Twilio e invia le risposte tramite l'API Messages di Twilio.

Stato: Plugin ufficiale, installato separatamente. Solo testo: nessun MMS/contenuto multimediale, solo messaggi diretti.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Il criterio predefinito per i messaggi diretti SMS è l'associazione.
  </Card>
  <Card title="Sicurezza del Gateway" icon="shield" href="/it/gateway/security">
    Esaminare l'esposizione del Webhook e i controlli di accesso dei mittenti.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica multicanale e procedure di ripristino.
  </Card>
</CardGroup>

## Prima di iniziare

Sono necessari:

- Il Plugin SMS ufficiale installato con `openclaw plugins install @openclaw/sms`.
- Un account Twilio con un numero di telefono abilitato agli SMS oppure un Twilio Messaging Service.
- L'Account SID e l'Auth Token di Twilio.
- Un URL HTTPS pubblico che raggiunga il Gateway OpenClaw.
- La scelta di un criterio per i mittenti: `pairing` (valore predefinito) per uso privato, `allowlist` per numeri di telefono preapprovati oppure `open` solo per un accesso SMS intenzionalmente pubblico.

Un numero Twilio può essere utilizzato sia per gli SMS sia per le [chiamate vocali](/it/plugins/voice-call), se dispone di entrambe le funzionalità. Il Webhook SMS e il Webhook vocale vengono configurati separatamente in Twilio e utilizzano percorsi del Gateway distinti; questa pagina riguarda solo il Webhook SMS.

## Configurazione rapida

<Steps>
  <Step title="Installare il Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Creare o scegliere un mittente Twilio">
    In Twilio, aprire **Phone Numbers > Manage > Active numbers** e scegliere un numero abilitato agli SMS. Salvare:

    - Account SID, ad esempio `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Numero di telefono del mittente, ad esempio `+15551234567`

    Se si utilizza un Messaging Service anziché un numero mittente fisso, salvare il SID del Messaging Service, ad esempio `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configurare il canale SMS">

Salvare quanto segue come `sms.patch.json5` e modificare i segnaposto:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Applicare la configurazione:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Indirizzare Twilio al Webhook del Gateway">
    Nelle impostazioni del numero di telefono Twilio, aprire **Messaging** e impostare **A message comes in** su:

```text
https://gateway.example.com/webhooks/sms
```

    Utilizzare HTTP `POST`. Il percorso locale predefinito è `/webhooks/sms`; modificare `channels.sms.webhookPath` se è necessaria una route diversa.

  </Step>

  <Step title="Esporre il percorso esatto del Webhook SMS">
    L'URL pubblico deve instradare il percorso SMS al processo del Gateway (porta predefinita `18789`). Se si utilizza Tailscale Funnel per i test locali, esporre esplicitamente `/webhooks/sms`:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Le chiamate vocali e gli SMS utilizzano percorsi Webhook distinti. Se lo stesso numero Twilio gestisce entrambi, mantenere entrambe le route configurate in Twilio e nel tunnel.

  </Step>

  <Step title="Avviare il Gateway e approvare il primo mittente">

```bash
openclaw gateway
```

Inviare un SMS al numero Twilio. Il primo messaggio crea una richiesta di associazione. Approvarla:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    I codici di associazione scadono dopo 1 ora.

  </Step>
</Steps>

## Esempi di configurazione

Tutte le chiavi si trovano sotto `channels.sms` (e, per ciascun account, sotto `channels.sms.accounts.<id>`):

| Chiave                                  | Valore predefinito | Scopo                                                               |
| --------------------------------------- | ------------------ | ------------------------------------------------------------------- |
| `enabled`                      | `true`  | Abilita o disabilita il canale/account.                             |
| `accountSid`                      | —                  | Account SID di Twilio (`AC...`).                         |
| `authToken`                      | —                  | Auth Token di Twilio; stringa in testo normale o SecretRef.         |
| `fromNumber`                      | —                  | Numero del mittente in formato E.164.                               |
| `messagingServiceSid`                      | —                  | SID del Messaging Service (`MG...`) utilizzato quando non viene risolto alcun `fromNumber`. |
| `defaultTo`                      | —                  | Destinazione predefinita quando un flusso di invio omette una destinazione esplicita. |
| `webhookPath`                      | `/webhooks/sms`  | Percorso HTTP del Gateway per i Webhook Twilio in ingresso.         |
| `publicWebhookUrl`                      | —                  | URL pubblico configurato in Twilio; necessario per la convalida della firma. |
| `dangerouslyDisableSignatureValidation`                      | `false`  | Ignora i controlli `X-Twilio-Signature`; solo per test con tunnel locale. |
| `dmPolicy`                      | `"pairing"`  | `pairing`, `allowlist`, `open` o `disabled`. |
| `allowFrom`                      | `[]`  | Numeri mittente consentiti in formato E.164 oppure `"*"` con `dmPolicy: "open"`. |
| `textChunkLimit`                      | `1500`  | Numero massimo di caratteri per ogni segmento SMS in uscita.        |
| `accounts`, `defaultAccount`  | —                  | Mappa multi-account e ID dell'account predefinito.                  |

### File di configurazione

Utilizzare la configurazione tramite file quando si desidera che la definizione del canale sia inclusa nella configurazione del Gateway:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### Variabili di ambiente

Le variabili di ambiente si applicano solo all'account predefinito; i valori di configurazione hanno la precedenza sui valori delle variabili di ambiente.

| Variabile                                      | Corrisponde a                                       |
| ---------------------------------------------- | --------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                             | `accountSid`                                  |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                  |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`)  | `fromNumber`                                  |
| `TWILIO_MESSAGING_SERVICE_SID`                             | `messagingServiceSid`                                  |
| `SMS_PUBLIC_WEBHOOK_URL`                             | `publicWebhookUrl`                                  |
| `SMS_WEBHOOK_PATH`                             | `webhookPath`                                  |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (separati da virgole)            |
| `SMS_TEXT_CHUNK_LIMIT`                             | `textChunkLimit`                                  |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`                             | `dangerouslyDisableSignatureValidation` (`"true"`)             |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Abilitare quindi il canale nella configurazione:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### Auth Token tramite SecretRef

`authToken` può essere un SecretRef (`source: "env" | "file" | "exec"`). Utilizzare questa opzione quando il Gateway deve risolvere l'Auth Token di Twilio tramite il runtime dei segreti di OpenClaw anziché archiviarlo nella configurazione in testo normale:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

La variabile di ambiente o il provider di segreti a cui si fa riferimento deve essere visibile al runtime del Gateway. Riavviare i processi gestiti del Gateway dopo aver modificato le variabili di ambiente dell'host.

### Mittente tramite Messaging Service

Utilizzare `messagingServiceSid` anziché `fromNumber` quando Twilio deve scegliere il mittente tramite un Messaging Service:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Se sono presenti sia `fromNumber` sia `messagingServiceSid` dopo la risoluzione della configurazione e delle variabili di ambiente, viene utilizzato `fromNumber`.

### Destinazione predefinita in uscita

Impostare `defaultTo` quando l'automazione o la consegna avviata dall'agente deve avere una destinazione predefinita se un flusso di invio omette una destinazione esplicita:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## Controllo degli accessi

`channels.sms.dmPolicy` controlla l'accesso diretto tramite SMS:

- `pairing` (valore predefinito): i mittenti sconosciuti ricevono un codice di associazione; approvare con `openclaw pairing approve sms <CODE>`.
- `allowlist`: vengono elaborati solo i mittenti presenti in `allowFrom`. Un valore `allowFrom` vuoto rifiuta ogni mittente (il Gateway registra un avviso all'avvio).
- `open`: la convalida della configurazione richiede che `allowFrom` includa `"*"`. Senza il carattere jolly, possono comunicare solo i numeri elencati.
- `disabled`: tutti i messaggi diretti in ingresso vengono ignorati.

Le voci `allowFrom` devono essere numeri di telefono in formato E.164, come `+15551234567`. I prefissi `sms:` e `twilio-sms:` sono accettati e normalizzati. Per un assistente privato, preferire `dmPolicy: "allowlist"` con numeri di telefono espliciti:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## Invio di SMS

Con il canale SMS selezionato, le destinazioni accettano numeri E.164 senza prefisso oppure il prefisso `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Quando la selezione del canale è implicita, il prefisso `twilio-sms:` seleziona questo canale senza sostituire il prefisso di servizio `sms:`, utilizzato da iMessage per scegliere la consegna tramite SMS dell'operatore per le proprie destinazioni:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

La CLI richiede un valore `--target` esplicito. `defaultTo` è destinato all'automazione e ai percorsi di consegna avviati dall'agente nei quali la destinazione può essere risolta dalla configurazione del canale.

Le risposte dell'agente alle conversazioni SMS in entrata vengono inviate automaticamente al mittente tramite il mittente Twilio configurato.

L'output SMS è in testo normale. OpenClaw rimuove il Markdown, appiattisce i blocchi di codice delimitati, riscrive i link come `label (url)` e suddivide le risposte lunghe in parti di al massimo `textChunkLimit` caratteri (valore predefinito: 1500) prima di inviarle tramite Twilio.

## Verificare la configurazione

Dopo l'avvio del Gateway:

1. Verificare che il log del Gateway mostri la route Webhook per gli SMS.
2. Eseguire una verifica dal lato Twilio (controlla l'URL e il metodo del Webhook Twilio configurato e gli errori recenti relativi ai messaggi in entrata):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Inviare un SMS al numero Twilio dal proprio telefono.
4. Eseguire `openclaw pairing list sms`.
5. Approvare il codice di associazione con `openclaw pairing approve sms <CODE>`.
6. Inviare un altro SMS e verificare che l'agente risponda.

Per eseguire un test solo in uscita, utilizzare:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "Test SMS OpenClaw"
```

### Test end-to-end da iMessage/SMS su macOS

Su un Mac in grado di inviare SMS tramite operatore con Messaggi, è possibile utilizzare `imsg` per controllare il lato mittente senza usare il telefono:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "rispondi esattamente SMS pong" --json
```

Il primo messaggio dovrebbe creare una richiesta di associazione. Il secondo messaggio dovrebbe ricevere la risposta dell'agente tramite Twilio.

## Sicurezza del Webhook

Per impostazione predefinita, OpenClaw convalida `X-Twilio-Signature` utilizzando `publicWebhookUrl` e `authToken`. Mantenere la parte relativa all'endpoint di `publicWebhookUrl` identica byte per byte all'URL configurato in Twilio, inclusi schema, host, percorso e stringa di query. OpenClaw esclude i frammenti [connection-override](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) di Twilio (`#...`) dal calcolo della firma, come richiesto da Twilio.

La route del Webhook applica inoltre, indipendentemente dalla convalida della firma:

- Solo `POST`.
- Un limite di 300 richieste non riuscite al minuto per account SMS, route del Webhook e indirizzo client risolto. Tutte le richieste concorrono a questo limite, ma HTTP 429 viene applicato solo dopo che una richiesta non supera l'analisi del corpo, la convalida Twilio o la verifica della corrispondenza di AccountSid.
- Un limite di 30 callback accettati e distribuibili al minuto per account SMS, route del Webhook e indirizzo client risolto, dopo il superamento di tali controlli (HTTP 429 oltre questa soglia). Se la convalida della firma è disabilitata, questo limite di 30/min rappresenta il tetto massimo per la distribuzione non autenticata.
- Gli indirizzi client vengono risolti tramite le regole condivise del Gateway per i proxy attendibili. Se `gateway.trustedProxies` contiene il reverse proxy che inoltra i callback di Twilio, OpenClaw calcola questi limiti in base all'indirizzo client inoltrato; in caso contrario, utilizza l'indirizzo diretto del socket.
- Il valore `AccountSid` del payload deve corrispondere al valore `accountSid` configurato (in caso contrario, HTTP 403).
- I valori `MessageSid` riprodotti vengono deduplicati per 10 minuti.
- La cache di riproduzione di ciascun account SMS conserva fino a 10.000 SID di messaggi attivi. Quando tutti gli slot sono attivi, i nuovi Webhook per tale account vengono rifiutati in modalità fail-closed con HTTP 429 e un'intestazione `Retry-After` finché non scade lo slot meno recente.
- I corpi delle richieste superiori a 32 KB vengono rifiutati.

Per impostazione predefinita, Twilio non ritenta le richieste HTTP 429 né documenta il supporto per `Retry-After`. Gli override di connessione `#rp=4xx` e `#rp=all` abilitano i nuovi tentativi per gli errori 4xx, ma Twilio limita l'intera transazione di ripetizione a 15 secondi, quindi i tentativi possono comunque terminare prima della scadenza di uno slot della cache di riproduzione. Configurare un URL di fallback quando un altro gestore deve ricevere le consegne non riuscite; considerare un errore 429 come un rifiuto fail-closed, non come un meccanismo affidabile di backpressure.

Solo per i test con tunnel locale, è possibile impostare:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Non disabilitare la convalida della firma su un Gateway pubblico.

## Configurazione multi-account

Utilizzare `accounts` quando si gestisce più di un numero Twilio:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

Ogni account deve utilizzare un valore `webhookPath` distinto; il Gateway rifiuta di registrare una route del Webhook il cui percorso appartiene già a un altro account. I fallback delle variabili di ambiente `TWILIO_*`/`SMS_*` si applicano solo all'account predefinito; impostare `defaultAccount` per scegliere un account diverso come predefinito.

## Risoluzione dei problemi

### Twilio restituisce 403 oppure OpenClaw rifiuta il Webhook

Verificare che `publicWebhookUrl` corrisponda esattamente all'URL configurato in Twilio, inclusi schema, host, percorso e stringa di query. Twilio firma la stringa dell'URL pubblico, pertanto le riscritture del proxy e i nomi host alternativi possono impedire la convalida della firma.

Un errore 403 con `Invalid account` indica che il valore `AccountSid` del payload in entrata non corrisponde al valore `accountSid` configurato; verificare che il Webhook punti all'account proprietario del numero.

### Non viene visualizzata alcuna richiesta di associazione

Controllare l'URL e il metodo del Webhook **Messaging** del numero Twilio. Deve puntare all'URL del Webhook SMS e utilizzare `POST`. Verificare inoltre che il Gateway sia raggiungibile da Internet pubblico o tramite il tunnel.

Se il registro dei messaggi di Twilio mostra l'errore `11200`, Twilio ha accettato l'SMS in entrata ma non è riuscito a raggiungere il Webhook. Verificare quanto segue:

- In Twilio, **Messaging > A message comes in** punta a `publicWebhookUrl`.
- Il metodo è `POST`.
- Il tunnel o il reverse proxy espone esattamente `webhookPath`; per Tailscale Funnel, eseguire `tailscale funnel status` e verificare che `/webhooks/sms` sia elencato.
- `publicWebhookUrl` utilizza gli stessi schema, host, percorso e stringa di query inviati da Twilio, affinché la convalida della firma possa riprodurre l'URL firmato.

`openclaw channels status --channel sms --probe` mostra sia le impostazioni del Webhook Twilio non corrispondenti sia gli errori `11200` recenti.

### Gli invii in uscita non riescono

Verificare che `accountSid`, `authToken` e `fromNumber` oppure `messagingServiceSid` siano risolti. Se si utilizza un account di prova Twilio, potrebbe essere necessario verificare il numero di destinazione in Twilio prima di poter inviare SMS in uscita.

### I messaggi arrivano, ma l'agente non risponde

Controllare `dmPolicy` e `allowFrom`. Con la policy `pairing` predefinita, il mittente deve essere approvato prima che vengano elaborati i normali turni dell'agente.
