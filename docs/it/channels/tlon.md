---
read_when:
    - Sviluppo delle funzionalità del canale Tlon/Urbit
summary: Stato del supporto, funzionalità e configurazione di Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon è un messenger decentralizzato basato su Urbit. OpenClaw si connette alla tua nave Urbit e può
rispondere ai messaggi diretti e ai messaggi nelle chat di gruppo. Le risposte nei gruppi richiedono per impostazione predefinita una menzione @ e possono
essere ulteriormente limitate tramite allowlist.

Stato: Plugin incluso. Sono supportati messaggi diretti, menzioni nei gruppi, risposte nei thread, formattazione rich text e
caricamenti di immagini. Reazioni e sondaggi non sono ancora supportati.

## Plugin incluso

Tlon viene distribuito come Plugin incluso nelle versioni attuali di OpenClaw, quindi le normali build
pacchettizzate non richiedono un'installazione separata.

Se usi una build precedente o un'installazione personalizzata che esclude Tlon, installa un
pacchetto npm attuale:

Installa tramite CLI (registro npm):

```bash
openclaw plugins install @openclaw/tlon
```

Usa il pacchetto senza versione per seguire il tag di rilascio ufficiale corrente. Blocca una
versione esatta solo quando ti serve un'installazione riproducibile.

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione

1. Assicurati che il Plugin Tlon sia disponibile.
   - Le versioni pacchettizzate attuali di OpenClaw lo includono già.
   - Le installazioni precedenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Recupera l'URL della tua nave e il codice di accesso.
3. Configura `channels.tlon`.
4. Riavvia il Gateway.
5. Invia un messaggio diretto al bot o menzionalo in un canale di gruppo.

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

## Navi private/LAN

Per impostazione predefinita, OpenClaw blocca hostname e intervalli IP privati/interni per protezione SSRF.
Se la tua nave è in esecuzione su una rete privata (localhost, IP LAN o hostname interno),
devi abilitarla esplicitamente:

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

⚠️ Abilita questa opzione solo se ti fidi della tua rete locale. Questa impostazione disabilita le protezioni SSRF
per le richieste all'URL della tua nave.

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

## Controllo degli accessi

Allowlist dei messaggi diretti (vuota = nessun messaggio diretto consentito, usa `ownerShip` per il flusso di approvazione):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autorizzazione dei gruppi (limitata per impostazione predefinita):

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

## Sistema proprietario e approvazione

Imposta una nave proprietaria per ricevere richieste di approvazione quando utenti non autorizzati provano a interagire:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

La nave proprietaria è **autorizzata automaticamente ovunque**: gli inviti ai messaggi diretti vengono accettati automaticamente e
i messaggi nei canali sono sempre consentiti. Non devi aggiungere il proprietario a `dmAllowlist` o
`defaultAuthorizedShips`.

Quando è impostata, il proprietario riceve notifiche tramite messaggio diretto per:

- Richieste di messaggi diretti da navi non presenti nell'allowlist
- Menzioni in canali senza autorizzazione
- Richieste di invito a gruppi

## Impostazioni di accettazione automatica

Accetta automaticamente gli inviti ai messaggi diretti (per le navi in dmAllowlist):

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

- Messaggio diretto: `~sampel-palnet` o `dm/~sampel-palnet`
- Gruppo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Skill inclusa

Il Plugin Tlon include una skill inclusa ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
che fornisce accesso CLI alle operazioni di Tlon:

- **Contatti**: ottenere/aggiornare profili, elencare contatti
- **Canali**: elencare, creare, pubblicare messaggi, recuperare la cronologia
- **Gruppi**: elencare, creare, gestire membri
- **Messaggi diretti**: inviare messaggi, reagire ai messaggi
- **Reazioni**: aggiungere/rimuovere reazioni emoji a post e messaggi diretti
- **Impostazioni**: gestire le autorizzazioni del Plugin tramite comandi slash

La skill è disponibile automaticamente quando il Plugin è installato.

## Funzionalità

| Funzionalità    | Stato                                           |
| --------------- | ----------------------------------------------- |
| Messaggi diretti | ✅ Supportato                                  |
| Gruppi/canali   | ✅ Supportato (con menzione richiesta per impostazione predefinita) |
| Thread          | ✅ Supportato (risposte automatiche nel thread) |
| Rich text       | ✅ Markdown convertito nel formato Tlon         |
| Immagini        | ✅ Caricate nello storage Tlon                  |
| Reazioni        | ✅ Tramite [skill inclusa](#bundled-skill)      |
| Sondaggi        | ❌ Non ancora supportato                        |
| Comandi nativi  | ✅ Supportato (solo proprietario per impostazione predefinita) |

## Risoluzione dei problemi

Esegui prima questa sequenza:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Errori comuni:

- **Messaggi diretti ignorati**: il mittente non è in `dmAllowlist` e non è configurato alcun `ownerShip` per il flusso di approvazione.
- **Messaggi di gruppo ignorati**: canale non rilevato o mittente non autorizzato.
- **Errori di connessione**: verifica che l'URL della nave sia raggiungibile; abilita `allowPrivateNetwork` per le navi locali.
- **Errori di autenticazione**: verifica che il codice di accesso sia attuale (i codici ruotano).

## Riferimento di configurazione

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.tlon.enabled`: abilita/disabilita l'avvio del canale.
- `channels.tlon.ship`: nome della nave Urbit del bot (ad es. `~sampel-palnet`).
- `channels.tlon.url`: URL della nave (ad es. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: codice di accesso della nave.
- `channels.tlon.allowPrivateNetwork`: consenti URL localhost/LAN (bypass SSRF).
- `channels.tlon.ownerShip`: nave proprietaria per il sistema di approvazione (sempre autorizzata).
- `channels.tlon.dmAllowlist`: navi autorizzate a inviare messaggi diretti (vuota = nessuna).
- `channels.tlon.autoAcceptDmInvites`: accetta automaticamente messaggi diretti da navi nell'allowlist.
- `channels.tlon.autoAcceptGroupInvites`: accetta automaticamente tutti gli inviti ai gruppi.
- `channels.tlon.autoDiscoverChannels`: rileva automaticamente i canali di gruppo (predefinito: true).
- `channels.tlon.groupChannels`: nest di canali fissati manualmente.
- `channels.tlon.defaultAuthorizedShips`: navi autorizzate per tutti i canali.
- `channels.tlon.authorization.channelRules`: regole di autorizzazione per canale.
- `channels.tlon.showModelSignature`: aggiunge il nome del modello ai messaggi.

## Note

- Le risposte nei gruppi richiedono una menzione (ad es. `~your-bot-ship`) per rispondere.
- Risposte nei thread: se il messaggio in ingresso è in un thread, OpenClaw risponde nel thread.
- Rich text: la formattazione Markdown (grassetto, corsivo, codice, intestazioni, elenchi) viene convertita nel formato nativo di Tlon.
- Immagini: gli URL vengono caricati nello storage Tlon e incorporati come blocchi immagine.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione tramite messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e richiesta di menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
