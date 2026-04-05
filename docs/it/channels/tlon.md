---
read_when:
    - Quando lavori sulle funzionalità del canale Tlon/Urbit
summary: Stato del supporto Tlon/Urbit, funzionalità e configurazione
title: Tlon
x-i18n:
    generated_at: "2026-04-05T13:45:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 289cffb3c1b2d450a5f41e0d67117dfb5c192cec956d82039caac9df9f07496d
    source_path: channels/tlon.md
    workflow: 15
---

# Tlon

Tlon è un messenger decentralizzato basato su Urbit. OpenClaw si connette alla tua ship Urbit e può
rispondere ai messaggi diretti e ai messaggi nelle chat di gruppo. Le risposte nei gruppi richiedono
per impostazione predefinita una menzione `@` e possono essere ulteriormente limitate tramite allowlist.

Stato: plugin incluso. Sono supportati messaggi diretti, menzioni nei gruppi, risposte nei thread, formattazione di testo avanzata e
caricamento di immagini. Reazioni e sondaggi non sono ancora supportati.

## Plugin incluso

Tlon viene distribuito come plugin incluso nelle versioni correnti di OpenClaw, quindi le normali build
pacchettizzate non richiedono un'installazione separata.

Se utilizzi una build più vecchia o un'installazione personalizzata che esclude Tlon, installalo
manualmente:

Installa tramite CLI (registro npm):

```bash
openclaw plugins install @openclaw/tlon
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Dettagli: [Plugin](/tools/plugin)

## Configurazione

1. Assicurati che il plugin Tlon sia disponibile.
   - Le versioni pacchettizzate correnti di OpenClaw lo includono già.
   - Le installazioni vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Raccogli l'URL della tua ship e il codice di accesso.
3. Configura `channels.tlon`.
4. Riavvia il gateway.
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

Per impostazione predefinita, OpenClaw blocca hostname privati/interni e intervalli IP per la protezione SSRF.
Se la tua ship è in esecuzione su una rete privata (localhost, IP LAN o hostname interno),
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

Questo vale per URL come:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Abilita questa opzione solo se ti fidi della tua rete locale. Questa impostazione disattiva le protezioni SSRF
per le richieste verso l'URL della tua ship.

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

## Sistema del proprietario e di approvazione

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

La ship proprietaria è **automaticamente autorizzata ovunque** — gli inviti ai DM vengono accettati automaticamente e
i messaggi nei canali sono sempre consentiti. Non è necessario aggiungere il proprietario a `dmAllowlist` o
`defaultAuthorizedShips`.

Quando è impostata, la ship proprietaria riceve notifiche via DM per:

- richieste DM da ship non presenti nell'allowlist
- menzioni in canali senza autorizzazione
- richieste di invito a gruppi

## Impostazioni di accettazione automatica

Accetta automaticamente gli inviti ai DM (per le ship in dmAllowlist):

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

Usa questi valori con `openclaw message send` o con la consegna tramite cron:

- DM: `~sampel-palnet` o `dm/~sampel-palnet`
- Gruppo: `chat/~host-ship/channel` o `group:~host-ship/channel`

## Skill incluso

Il plugin Tlon include uno skill integrato ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
che fornisce accesso CLI alle operazioni Tlon:

- **Contatti**: ottieni/aggiorna profili, elenca contatti
- **Canali**: elenca, crea, pubblica messaggi, recupera cronologia
- **Gruppi**: elenca, crea, gestisci membri
- **DM**: invia messaggi, reagisci ai messaggi
- **Reazioni**: aggiungi/rimuovi reazioni emoji a post e DM
- **Impostazioni**: gestisci i permessi del plugin tramite comandi slash

Lo skill è automaticamente disponibile quando il plugin è installato.

## Funzionalità

| Funzionalità    | Stato                                   |
| --------------- | --------------------------------------- |
| Messaggi diretti | ✅ Supportati                          |
| Gruppi/canali   | ✅ Supportati (con menzione richiesta per impostazione predefinita) |
| Thread          | ✅ Supportati (risposte automatiche nel thread) |
| Testo avanzato  | ✅ Markdown convertito nel formato Tlon |
| Immagini        | ✅ Caricate nello storage Tlon          |
| Reazioni        | ✅ Tramite [skill incluso](#bundled-skill) |
| Sondaggi        | ❌ Non ancora supportati                |
| Comandi nativi  | ✅ Supportati (solo proprietario per impostazione predefinita) |

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
- **Messaggi di gruppo ignorati**: canale non rilevato o mittente non autorizzato.
- **Errori di connessione**: verifica che l'URL della ship sia raggiungibile; abilita `allowPrivateNetwork` per ship locali.
- **Errori di autenticazione**: verifica che il codice di accesso sia attuale (i codici ruotano).

## Riferimento configurazione

Configurazione completa: [Configurazione](/gateway/configuration)

Opzioni del provider:

- `channels.tlon.enabled`: abilita/disabilita l'avvio del canale.
- `channels.tlon.ship`: nome della ship Urbit del bot (ad es. `~sampel-palnet`).
- `channels.tlon.url`: URL della ship (ad es. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: codice di accesso della ship.
- `channels.tlon.allowPrivateNetwork`: consente URL localhost/LAN (bypass SSRF).
- `channels.tlon.ownerShip`: ship proprietaria per il sistema di approvazione (sempre autorizzata).
- `channels.tlon.dmAllowlist`: ship autorizzate a inviare DM (vuota = nessuna).
- `channels.tlon.autoAcceptDmInvites`: accetta automaticamente i DM dalle ship in allowlist.
- `channels.tlon.autoAcceptGroupInvites`: accetta automaticamente tutti gli inviti ai gruppi.
- `channels.tlon.autoDiscoverChannels`: rileva automaticamente i canali di gruppo (predefinito: true).
- `channels.tlon.groupChannels`: nest dei canali fissati manualmente.
- `channels.tlon.defaultAuthorizedShips`: ship autorizzate per tutti i canali.
- `channels.tlon.authorization.channelRules`: regole di autorizzazione per canale.
- `channels.tlon.showModelSignature`: aggiunge il nome del modello ai messaggi.

## Note

- Le risposte nei gruppi richiedono una menzione (ad es. `~your-bot-ship`) per rispondere.
- Risposte nei thread: se il messaggio in ingresso è in un thread, OpenClaw risponde nel thread.
- Testo avanzato: la formattazione Markdown (grassetto, corsivo, codice, intestazioni, elenchi) viene convertita nel formato nativo di Tlon.
- Immagini: gli URL vengono caricati nello storage Tlon e incorporati come blocchi immagine.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e requisito di menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/gateway/security) — modello di accesso e hardening
