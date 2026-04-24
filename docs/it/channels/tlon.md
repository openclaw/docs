---
read_when:
    - Lavorare sulle funzionalità del canale Tlon/Urbit
summary: Stato del supporto Tlon/Urbit, capacità e configurazione
title: Tlon
x-i18n:
    generated_at: "2026-04-24T08:31:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff92473a958a4cba355351a686431748ea801b1c640cc5873e8bdac8f37a53f
    source_path: channels/tlon.md
    workflow: 15
---

Tlon è un messenger decentralizzato basato su Urbit. OpenClaw si connette alla tua ship Urbit e può
rispondere ai DM e ai messaggi delle chat di gruppo. Per impostazione predefinita, le risposte nei gruppi richiedono una menzione @ e possono
essere ulteriormente limitate tramite allowlist.

Stato: Plugin incluso. Sono supportati DM, menzioni nei gruppi, risposte nei thread, formattazione rich text e
caricamento di immagini. Reazioni e sondaggi non sono ancora supportati.

## Plugin incluso

Tlon è distribuito come Plugin incluso nelle versioni correnti di OpenClaw, quindi le normali build
pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Tlon, installalo
manualmente:

Installa tramite CLI (registro npm):

```bash
openclaw plugins install @openclaw/tlon
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione

1. Assicurati che il Plugin Tlon sia disponibile.
   - Le versioni pacchettizzate correnti di OpenClaw lo includono già.
   - Le installazioni vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Raccogli l'URL della ship e il codice di accesso.
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
      ownerShip: "~your-main-ship", // consigliato: la tua ship, sempre consentita
    },
  },
}
```

## Ship private/LAN

Per impostazione predefinita, OpenClaw blocca host e intervalli IP privati/interni per la protezione SSRF.
Se la tua ship è in esecuzione su una rete privata (localhost, IP LAN o hostname interno),
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

Questo vale per URL come:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Abilitalo solo se ti fidi della tua rete locale. Questa impostazione disabilita le protezioni SSRF
per le richieste al tuo URL ship.

## Canali di gruppo

L'individuazione automatica è abilitata per impostazione predefinita. Puoi anche fissare manualmente i canali:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Disabilita l'individuazione automatica:

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

## Owner e sistema di approvazione

Imposta una ship owner per ricevere richieste di approvazione quando utenti non autorizzati tentano di interagire:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

La ship owner è **automaticamente autorizzata ovunque** — gli inviti DM vengono accettati automaticamente e
i messaggi del canale sono sempre consentiti. Non devi aggiungere l'owner a `dmAllowlist` o
`defaultAuthorizedShips`.

Quando impostata, l'owner riceve notifiche DM per:

- richieste DM da ship non presenti nella allowlist
- menzioni in canali senza autorizzazione
- richieste di invito ai gruppi

## Impostazioni di accettazione automatica

Accetta automaticamente gli inviti DM (per le ship in `dmAllowlist`):

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

## Target di consegna (CLI/Cron)

Usa questi con `openclaw message send` o con la consegna Cron:

- DM: `~sampel-palnet` o `dm/~sampel-palnet`
- Gruppo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Skill incluso

Il Plugin Tlon include uno Skills incluso ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
che fornisce accesso CLI alle operazioni Tlon:

- **Contatti**: ottieni/aggiorna profili, elenca contatti
- **Canali**: elenca, crea, pubblica messaggi, recupera cronologia
- **Gruppi**: elenca, crea, gestisci membri
- **DM**: invia messaggi, reagisci ai messaggi
- **Reazioni**: aggiungi/rimuovi reazioni emoji a post e DM
- **Impostazioni**: gestisci i permessi del Plugin tramite comandi slash

Lo Skills è automaticamente disponibile quando il Plugin è installato.

## Capacità

| Funzionalità    | Stato                                   |
| --------------- | --------------------------------------- |
| Messaggi diretti | ✅ Supportato                           |
| Gruppi/canali   | ✅ Supportato (con menzione obbligatoria per impostazione predefinita) |
| Thread          | ✅ Supportato (risposte automatiche nel thread) |
| Rich text       | ✅ Markdown convertito nel formato Tlon |
| Immagini        | ✅ Caricate nello storage Tlon          |
| Reazioni        | ✅ Tramite [Skills incluso](#skill-incluso) |
| Sondaggi        | ❌ Non ancora supportato                |
| Comandi nativi  | ✅ Supportato (solo owner per impostazione predefinita) |

## Risoluzione dei problemi

Esegui prima questa sequenza:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Errori comuni:

- **DM ignorati**: il mittente non è in `dmAllowlist` e non è configurato alcun `ownerShip` per il flusso di approvazione.
- **Messaggi di gruppo ignorati**: canale non individuato o mittente non autorizzato.
- **Errori di connessione**: controlla che l'URL della ship sia raggiungibile; abilita `allowPrivateNetwork` per ship locali.
- **Errori di autenticazione**: verifica che il codice di accesso sia corrente (i codici ruotano).

## Riferimento della configurazione

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.tlon.enabled`: abilita/disabilita l'avvio del canale.
- `channels.tlon.ship`: nome della ship Urbit del bot (per esempio `~sampel-palnet`).
- `channels.tlon.url`: URL della ship (per esempio `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: codice di accesso della ship.
- `channels.tlon.allowPrivateNetwork`: consente URL localhost/LAN (bypass SSRF).
- `channels.tlon.ownerShip`: ship owner per il sistema di approvazione (sempre autorizzata).
- `channels.tlon.dmAllowlist`: ship autorizzate a inviare DM (vuota = nessuna).
- `channels.tlon.autoAcceptDmInvites`: accetta automaticamente i DM da ship presenti nella allowlist.
- `channels.tlon.autoAcceptGroupInvites`: accetta automaticamente tutti gli inviti ai gruppi.
- `channels.tlon.autoDiscoverChannels`: individua automaticamente i canali di gruppo (predefinito: true).
- `channels.tlon.groupChannels`: nest di canali fissati manualmente.
- `channels.tlon.defaultAuthorizedShips`: ship autorizzate per tutti i canali.
- `channels.tlon.authorization.channelRules`: regole di autenticazione per canale.
- `channels.tlon.showModelSignature`: aggiunge il nome del modello ai messaggi.

## Note

- Le risposte nei gruppi richiedono una menzione (per esempio `~your-bot-ship`) per rispondere.
- Risposte nei thread: se il messaggio in ingresso è in un thread, OpenClaw risponde nel thread.
- Rich text: la formattazione Markdown (grassetto, corsivo, codice, intestazioni, elenchi) viene convertita nel formato nativo di Tlon.
- Immagini: gli URL vengono caricati nello storage Tlon e incorporati come blocchi immagine.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e vincolo della menzione
- [Instradamento del canale](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
