---
read_when:
    - Vuoi connettere OpenClaw agli SMS tramite Twilio
    - È necessario configurare il Webhook SMS o l'elenco dei mittenti consentiti
summary: Configurazione del canale SMS Twilio, controlli di accesso e configurazione del webhook
title: SMS
x-i18n:
    generated_at: "2026-07-12T06:51:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw riceve e invia SMS tramite un numero di telefono Twilio o un Messaging Service. Il Gateway registra una route Webhook in entrata (predefinita: `/webhooks/sms`), convalida per impostazione predefinita le firme delle richieste Twilio e invia le risposte tramite l'API Messages di Twilio.

Stato: Plugin ufficiale, installato separatamente. Solo testo: nessun MMS/contenuto multimediale, solo messaggi diretti.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Il criterio predefinito per i messaggi diretti tramite SMS è l'associazione.
  </Card>
  <Card title="Sicurezza del Gateway" icon="shield" href="/it/gateway/security">
    Esamina l'esposizione del Webhook e i controlli di accesso dei mittenti.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e procedure di riparazione.
  </Card>
</CardGroup>

## Prima di iniziare

Sono necessari:

- Il Plugin SMS ufficiale installato con `openclaw plugins install @openclaw/sms`.
- Un account Twilio con un numero di telefono abilitato agli SMS oppure un Twilio Messaging Service.
- L'Account SID e l'Auth Token di Twilio.
- Un URL HTTPS pubblico che raggiunga il Gateway OpenClaw.
- La scelta di un criterio per i mittenti: `pairing` (predefinito) per uso privato, `allowlist` per numeri di telefono preapprovati oppure `open` solo per un accesso SMS intenzionalmente pubblico.

Un singolo numero Twilio può gestire sia gli SMS sia le [chiamate vocali](/it/plugins/voice-call), se dispone di entrambe le funzionalità. Il Webhook SMS e quello vocale vengono configurati separatamente in Twilio e utilizzano percorsi distinti del Gateway; questa pagina tratta solo il Webhook SMS.

## Configurazione rapida

<Steps>
  <Step title="Installa il Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Crea o scegli un mittente Twilio">
    In Twilio, apri **Phone Numbers > Manage > Active numbers** e scegli un numero abilitato agli SMS. Salva:

    - Account SID, ad esempio `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Numero di telefono del mittente, ad esempio `+15551234567`

    Se utilizzi un Messaging Service anziché un numero mittente fisso, salva il SID del Messaging Service, ad esempio `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configura il canale SMS">

Salva quanto segue come `sms.patch.json5` e modifica i segnaposto:

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

Applica la configurazione:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Indirizza Twilio al Webhook del Gateway">
    Nelle impostazioni del numero di telefono Twilio, apri **Messaging** e imposta **A message comes in** su:

```text
https://gateway.example.com/webhooks/sms
```

    Utilizza HTTP `POST`. Il percorso locale predefinito è `/webhooks/sms`; modifica `channels.sms.webhookPath` se hai bisogno di una route diversa.

  </Step>

  <Step title="Esponi il percorso esatto del Webhook SMS">
    L'URL pubblico deve instradare il percorso SMS al processo del Gateway (porta predefinita `18789`). Se utilizzi Tailscale Funnel per i test locali, esponi esplicitamente `/webhooks/sms`:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Le chiamate vocali e gli SMS utilizzano percorsi Webhook distinti. Se lo stesso numero Twilio gestisce entrambi, mantieni entrambe le route configurate in Twilio e nel tunnel.

  </Step>

  <Step title="Avvia il Gateway e approva il primo mittente">

```bash
openclaw gateway
```

Invia un SMS al numero Twilio. Il primo messaggio crea una richiesta di associazione. Approvala:

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
| `enabled`                               | `true`             | Abilita o disabilita il canale/account.                             |
| `accountSid`                            | —                  | Account SID di Twilio (`AC...`).                                    |
| `authToken`                             | —                  | Auth Token di Twilio; stringa in chiaro o SecretRef.                |
| `fromNumber`                            | —                  | Numero del mittente in formato E.164.                               |
| `messagingServiceSid`                   | —                  | SID del Messaging Service (`MG...`) usato se non viene risolto alcun `fromNumber`. |
| `defaultTo`                             | —                  | Destinazione predefinita quando un flusso di invio omette un destinatario esplicito. |
| `webhookPath`                           | `/webhooks/sms`     | Percorso HTTP del Gateway per i Webhook Twilio in entrata.          |
| `publicWebhookUrl`                      | —                  | URL pubblico configurato in Twilio; obbligatorio per la convalida della firma. |
| `dangerouslyDisableSignatureValidation` | `false`            | Ignora i controlli `X-Twilio-Signature`; solo per test con tunnel locale. |
| `dmPolicy`                              | `"pairing"`        | `pairing`, `allowlist`, `open` o `disabled`.                        |
| `allowFrom`                             | `[]`               | Numeri mittenti consentiti in formato E.164 oppure `"*"` con `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`             | Numero massimo di caratteri per ogni segmento SMS in uscita.       |
| `accounts`, `defaultAccount`            | —                  | Mappa multi-account e ID dell'account predefinito.                  |

### File di configurazione

Utilizza la configurazione tramite file quando vuoi che la definizione del canale sia inclusa nella configurazione del Gateway:

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

Le variabili di ambiente si applicano solo all'account predefinito; i valori della configurazione hanno la precedenza sui valori delle variabili di ambiente.

| Variabile                                       | Corrisponde a                                       |
| ----------------------------------------------- | --------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                        |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                         |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`) | `fromNumber`                                        |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                               |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                  |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                       |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (separati da virgole)                   |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                    |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`)  |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Quindi abilita il canale nella configurazione:

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

### Auth Token SecretRef

`authToken` può essere un SecretRef (`source: "env" | "file" | "exec"`). Utilizzalo quando il Gateway deve risolvere l'Auth Token di Twilio tramite il runtime dei segreti di OpenClaw anziché archiviarlo in chiaro nella configurazione:

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

La variabile di ambiente o il provider di segreti referenziato deve essere visibile al runtime del Gateway. Riavvia i processi gestiti del Gateway dopo aver modificato le variabili di ambiente dell'host.

### Mittente Messaging Service

Utilizza `messagingServiceSid` al posto di `fromNumber` quando Twilio deve scegliere il mittente tramite un Messaging Service:

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

Se, dopo la risoluzione della configurazione e delle variabili di ambiente, sono presenti sia `fromNumber` sia `messagingServiceSid`, viene utilizzato `fromNumber`.

### Destinatario predefinito in uscita

Imposta `defaultTo` quando l'automazione o l'invio avviato dall'agente devono disporre di una destinazione predefinita nel caso in cui un flusso di invio ometta un destinatario esplicito:

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

- `pairing` (predefinito): i mittenti sconosciuti ricevono un codice di associazione; approvali con `openclaw pairing approve sms <CODE>`.
- `allowlist`: vengono elaborati solo i mittenti presenti in `allowFrom`. Un valore `allowFrom` vuoto rifiuta tutti i mittenti (il Gateway registra un avviso all'avvio).
- `open`: la convalida della configurazione richiede che `allowFrom` includa `"*"`. Senza il carattere jolly, possono conversare solo i numeri elencati.
- `disabled`: tutti i messaggi diretti in entrata vengono ignorati.

Le voci di `allowFrom` devono essere numeri di telefono in formato E.164, ad esempio `+15551234567`. I prefissi `sms:` e `twilio-sms:` sono accettati e normalizzati. Per un assistente privato, preferisci `dmPolicy: "allowlist"` con numeri di telefono espliciti:

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

Quando è selezionato il canale SMS, i destinatari accettano numeri E.164 senza prefisso oppure con il prefisso `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Quando la selezione del canale è implicita, il prefisso `twilio-sms:` seleziona questo canale senza sostituire il prefisso di servizio `sms:`, utilizzato da iMessage per scegliere l'invio tramite SMS dell'operatore per i propri destinatari:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

La CLI richiede un `--target` esplicito. `defaultTo` è destinato all'automazione e ai percorsi di invio avviati dall'agente, nei quali il destinatario può essere risolto dalla configurazione del canale.

Le risposte dell'agente alle conversazioni SMS in entrata vengono inviate automaticamente al mittente tramite il mittente Twilio configurato.

L'output SMS è in testo semplice. OpenClaw rimuove il Markdown, appiattisce i blocchi di codice delimitati, riscrive i collegamenti come `etichetta (url)` e divide le risposte lunghe in segmenti di massimo `textChunkLimit` caratteri (valore predefinito: 1500) prima di inviarle tramite Twilio.

## Verifica della configurazione

Dopo l'avvio del Gateway:

1. Verifica che il log del Gateway mostri la route Webhook SMS.
2. Esegui una verifica lato Twilio (controlla l'URL e il metodo Webhook Twilio configurati e gli errori recenti in ingresso):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Invia un SMS dal telefono al numero Twilio.
4. Esegui `openclaw pairing list sms`.
5. Approva il codice di associazione con `openclaw pairing approve sms <CODE>`.
6. Invia un altro SMS e verifica che l'agente risponda.

Per un test della sola uscita, usa:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "Test SMS OpenClaw"
```

### Test end-to-end da iMessage/SMS su macOS

Su un Mac in grado di inviare SMS tramite operatore con Messaggi, puoi usare `imsg` per gestire il lato mittente senza usare il telefono:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Il primo messaggio dovrebbe creare una richiesta di associazione. Il secondo messaggio dovrebbe ricevere la risposta dell'agente tramite Twilio.

## Sicurezza del Webhook

Per impostazione predefinita, OpenClaw convalida `X-Twilio-Signature` usando `publicWebhookUrl` e `authToken`. Mantieni la parte dell'endpoint di `publicWebhookUrl` identica byte per byte all'URL configurato in Twilio, inclusi schema, host, percorso e stringa di query. OpenClaw esclude i frammenti di [sovrascrittura della connessione](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) di Twilio (`#...`) dal calcolo della firma, come richiesto da Twilio.

La route Webhook applica inoltre, indipendentemente dalla convalida della firma:

- Solo `POST`.
- Limite di 30 richieste al minuto per indirizzo IP di origine (HTTP 429 oltre tale limite).
- Il valore `AccountSid` del payload deve corrispondere al valore `accountSid` configurato (altrimenti HTTP 403).
- I valori `MessageSid` ripetuti vengono deduplicati per 10 minuti.
- La cache di ripetizione di ciascun account SMS conserva fino a 10.000 SID di messaggi attivi. Quando tutti gli slot sono attivi, i nuovi Webhook per quell'account vengono rifiutati in modalità fail-closed con HTTP 429 e un'intestazione `Retry-After` finché non scade lo slot meno recente.
- I corpi delle richieste superiori a 32 KB vengono rifiutati.

Per impostazione predefinita, Twilio non riprova le richieste HTTP 429 e non documenta il supporto per `Retry-After`. Le sovrascritture della connessione `#rp=4xx` e `#rp=all` abilitano i nuovi tentativi per gli errori 4xx, ma Twilio limita l'intera transazione di ripetizione a 15 secondi; pertanto, i tentativi possono comunque terminare prima che scada uno slot della cache di ripetizione. Configura un URL di fallback quando un altro gestore deve ricevere le consegne non riuscite; considera un errore 429 come un rifiuto fail-closed, non come un meccanismo affidabile di contropressione.

Solo per i test con tunnel locale, puoi impostare:

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

## Configurazione con più account

Usa `accounts` quando gestisci più di un numero Twilio:

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

Ogni account deve usare un `webhookPath` distinto; il Gateway rifiuta di registrare una route Webhook il cui percorso appartiene già a un altro account. I fallback delle variabili d'ambiente `TWILIO_*`/`SMS_*` si applicano solo all'account predefinito; imposta `defaultAccount` per specificare un account diverso.

## Risoluzione dei problemi

### Twilio restituisce 403 oppure OpenClaw rifiuta il Webhook

Verifica che `publicWebhookUrl` corrisponda esattamente all'URL configurato in Twilio, inclusi schema, host, percorso e stringa di query. Twilio firma la stringa dell'URL pubblico, quindi le riscritture del proxy e i nomi host alternativi possono impedire la convalida della firma.

Un errore 403 con `Invalid account` indica che il valore `AccountSid` del payload in ingresso non corrisponde al valore `accountSid` configurato; verifica che il Webhook faccia riferimento all'account proprietario del numero.

### Non viene visualizzata alcuna richiesta di associazione

Controlla l'URL e il metodo del Webhook **Messaging** del numero Twilio. Deve fare riferimento all'URL del Webhook SMS e usare `POST`. Verifica inoltre che il Gateway sia raggiungibile da Internet pubblico o tramite il tunnel.

Se il registro dei messaggi di Twilio mostra l'errore `11200`, Twilio ha accettato l'SMS in ingresso ma non è riuscito a raggiungere il Webhook. Controlla quanto segue:

- Twilio **Messaging > A message comes in** fa riferimento a `publicWebhookUrl`.
- Il metodo è `POST`.
- Il tunnel o il proxy inverso espone l'esatto `webhookPath`; per Tailscale Funnel, esegui `tailscale funnel status` e verifica che `/webhooks/sms` sia elencato.
- `publicWebhookUrl` usa lo stesso schema, host, percorso e stringa di query inviati da Twilio, affinché la convalida della firma possa riprodurre l'URL firmato.

`openclaw channels status --channel sms --probe` segnala sia le impostazioni Webhook Twilio non corrispondenti sia gli errori `11200` recenti.

### Gli invii in uscita non riescono

Verifica che `accountSid`, `authToken` e `fromNumber` oppure `messagingServiceSid` siano risolti. Se usi un account Twilio di prova, potrebbe essere necessario verificare il numero di destinazione in Twilio prima di poter inviare SMS in uscita.

### I messaggi arrivano, ma l'agente non risponde

Controlla `dmPolicy` e `allowFrom`. Con il criterio predefinito `pairing`, il mittente deve essere approvato prima che vengano elaborati i normali turni dell'agente.
