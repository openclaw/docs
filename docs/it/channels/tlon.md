---
read_when:
    - Sviluppo delle funzionalità del canale Tlon/Urbit
summary: Stato del supporto, funzionalità e configurazione di Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-30T08:40:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon è un messenger decentralizzato basato su Urbit. OpenClaw si connette alla tua ship Urbit e può
rispondere ai DM e ai messaggi delle chat di gruppo. Per impostazione predefinita, le risposte di gruppo richiedono una menzione @ e possono
essere ulteriormente limitate tramite allowlist.

Stato: Plugin incluso. Sono supportati DM, menzioni nei gruppi, risposte nei thread, formattazione rich text e
caricamenti di immagini. Reazioni e sondaggi non sono ancora supportati.

## Plugin incluso

Tlon viene distribuito come Plugin incluso nelle release OpenClaw attuali, quindi le normali build
pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Tlon, installa un
pacchetto npm attuale quando viene pubblicato:

Installa tramite CLI (registro npm, quando esiste un pacchetto attuale):

```bash
openclaw plugins install @openclaw/tlon
```

Se npm segnala il pacchetto di proprietà di OpenClaw come deprecato, usa una build OpenClaw
pacchettizzata attuale o il percorso del checkout locale finché non viene
pubblicato un pacchetto npm più recente.

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione

1. Assicurati che il Plugin Tlon sia disponibile.
   - Le release OpenClaw pacchettizzate attuali lo includono già.
   - Le installazioni più vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Recupera l'URL della tua ship e il codice di accesso.
3. Configura `channels.tlon`.
4. Riavvia il Gateway.
5. Invia un DM al bot o menzionalo in un canale di gruppo.

Configurazione minima (account singolo):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Ship private/LAN

Per impostazione predefinita, OpenClaw blocca nomi host privati/interni e intervalli IP per la protezione SSRF.
Se la tua ship è in esecuzione su una rete privata (localhost, IP LAN o nome host interno),
devi abilitarlo esplicitamente:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Questo si applica a URL come:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Abilita questa opzione solo se consideri affidabile la tua rete locale. Questa impostazione disabilita le protezioni SSRF
per le richieste all'URL della tua ship.

## Canali di gruppo

Il rilevamento automatico è abilitato per impostazione predefinita. Puoi anche fissare manualmente i canali:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Disabilita il rilevamento automatico:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Controllo accessi

Allowlist DM (vuota = nessun DM consentito, usa `ownerShip` per il flusso di approvazione):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autorizzazione di gruppo (limitata per impostazione predefinita):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Proprietario e sistema di approvazione

Imposta una ship proprietaria per ricevere richieste di approvazione quando utenti non autorizzati provano a interagire:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

La ship proprietaria è **autorizzata automaticamente ovunque**: gli inviti DM vengono accettati automaticamente e
i messaggi dei canali sono sempre consentiti. Non devi aggiungere il proprietario a `dmAllowlist` o
`defaultAuthorizedShips`.

Quando impostata, il proprietario riceve notifiche DM per:

- Richieste DM da ship non presenti nell'allowlist
- Menzioni in canali senza autorizzazione
- Richieste di invito a gruppi

## Impostazioni di accettazione automatica

Accetta automaticamente gli inviti DM (per ship in dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Accetta automaticamente gli inviti ai gruppi:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Destinazioni di consegna (CLI/cron)

Usale con `openclaw message send` o con la consegna cron:

- DM: `~sampel-palnet` o `dm/~sampel-palnet`
- Gruppo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Skill inclusa

Il Plugin Tlon include una skill inclusa ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
che fornisce accesso CLI alle operazioni Tlon:

- **Contatti**: ottenere/aggiornare profili, elencare contatti
- **Canali**: elencare, creare, pubblicare messaggi, recuperare la cronologia
- **Gruppi**: elencare, creare, gestire membri
- **DM**: inviare messaggi, reagire ai messaggi
- **Reazioni**: aggiungere/rimuovere reazioni emoji a post e DM
- **Impostazioni**: gestire i permessi del Plugin tramite comandi slash

La skill è automaticamente disponibile quando il Plugin è installato.

## Funzionalità

| Funzionalità     | Stato                                           |
| ---------------- | ----------------------------------------------- |
| Messaggi diretti | ✅ Supportati                                   |
| Gruppi/canali    | ✅ Supportati (con menzione richiesta per impostazione predefinita) |
| Thread           | ✅ Supportati (risposte automatiche nel thread) |
| Rich text        | ✅ Markdown convertito nel formato Tlon         |
| Immagini         | ✅ Caricate nello storage Tlon                  |
| Reazioni         | ✅ Tramite [skill inclusa](#bundled-skill)      |
| Sondaggi         | ❌ Non ancora supportati                        |
| Comandi nativi   | ✅ Supportati (solo proprietario per impostazione predefinita) |

## Risoluzione dei problemi

Esegui prima questa sequenza:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Errori comuni:

- **DM ignorati**: mittente non presente in `dmAllowlist` e nessun `ownerShip` configurato per il flusso di approvazione.
- **Messaggi di gruppo ignorati**: canale non rilevato o mittente non autorizzato.
- **Errori di connessione**: verifica che l'URL della ship sia raggiungibile; abilita `allowPrivateNetwork` per le ship locali.
- **Errori di autenticazione**: verifica che il codice di accesso sia attuale (i codici ruotano).

## Riferimento di configurazione

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.tlon.enabled`: abilita/disabilita l'avvio del canale.
- `channels.tlon.ship`: nome della ship Urbit del bot (es. `~sampel-palnet`).
- `channels.tlon.url`: URL della ship (es. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: codice di accesso della ship.
- `channels.tlon.allowPrivateNetwork`: consenti URL localhost/LAN (bypass SSRF).
- `channels.tlon.ownerShip`: ship proprietaria per il sistema di approvazione (sempre autorizzata).
- `channels.tlon.dmAllowlist`: ship autorizzate a inviare DM (vuota = nessuna).
- `channels.tlon.autoAcceptDmInvites`: accetta automaticamente DM da ship nell'allowlist.
- `channels.tlon.autoAcceptGroupInvites`: accetta automaticamente tutti gli inviti ai gruppi.
- `channels.tlon.autoDiscoverChannels`: rileva automaticamente i canali di gruppo (predefinito: true).
- `channels.tlon.groupChannels`: nest di canali fissati manualmente.
- `channels.tlon.defaultAuthorizedShips`: ship autorizzate per tutti i canali.
- `channels.tlon.authorization.channelRules`: regole di autenticazione per canale.
- `channels.tlon.showModelSignature`: aggiungi il nome del modello ai messaggi.

## Note

- Le risposte di gruppo richiedono una menzione (es. `~your-bot-ship`) per rispondere.
- Risposte nei thread: se il messaggio in ingresso è in un thread, OpenClaw risponde nel thread.
- Rich text: la formattazione Markdown (grassetto, corsivo, codice, intestazioni, liste) viene convertita nel formato nativo di Tlon.
- Immagini: gli URL vengono caricati nello storage Tlon e incorporati come blocchi immagine.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating tramite menzione
- [Instradamento canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
