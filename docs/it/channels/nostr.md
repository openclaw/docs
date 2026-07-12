---
read_when:
    - Vuoi che OpenClaw riceva messaggi diretti tramite Nostr
    - Stai configurando la messaggistica decentralizzata
summary: Canale DM Nostr tramite messaggi crittografati NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-07-12T06:51:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr è un plugin di canale scaricabile (`@openclaw/nostr`) che consente a OpenClaw di ricevere e rispondere a messaggi diretti crittografati NIP-04 tramite relay Nostr. Un account per Gateway; solo messaggi diretti.

## Installazione

```bash
openclaw plugins install @openclaw/nostr
```

Usa la specifica del pacchetto senza versione per seguire il tag della versione ufficiale corrente. Blocca una versione esatta solo quando ti serve un'installazione riproducibile.

Da un checkout locale (flussi di lavoro di sviluppo):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Riavvia il Gateway dopo aver installato o abilitato i plugin. La configurazione iniziale (`openclaw onboard`) e `openclaw channels add` mostrano Nostr dal catalogo dei canali condiviso una volta installato il plugin.

### Configurazione non interattiva

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Usa `--use-env` per mantenere `NOSTR_PRIVATE_KEY` nell'ambiente invece di archiviare la chiave nella configurazione (solo per l'account predefinito).

## Configurazione rapida

1. Genera una coppia di chiavi Nostr (se necessario):

```bash
# Utilizzando nak
nak key generate
```

2. Aggiungila alla configurazione:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Esporta la chiave:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Riavvia il Gateway.

## Riferimento della configurazione

| Chiave       | Tipo     | Valore predefinito                          | Descrizione                                                       |
| ------------ | -------- | ------------------------------------------- | ----------------------------------------------------------------- |
| `privateKey` | string   | obbligatorio                                | Chiave privata in formato `nsec` o esadecimale; sono ammessi riferimenti ai segreti |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL dei relay (WebSocket)                                         |
| `dmPolicy`   | string   | `pairing`                                   | Criterio di accesso ai messaggi diretti                           |
| `allowFrom`  | string[] | `[]`                                        | Chiavi pubbliche dei mittenti consentiti                          |
| `enabled`    | boolean  | `true`                                      | Abilita/disabilita il canale                                      |
| `name`       | string   | -                                           | Nome visualizzato                                                 |
| `profile`    | object   | -                                           | Metadati del profilo NIP-01                                       |

## Metadati del profilo

I dati del profilo vengono pubblicati come evento NIP-01 `kind:0`. Puoi gestirli dall'interfaccia di controllo (Channels -> Nostr -> Profile) o impostarli direttamente nella configurazione.

Esempio:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Bot assistente personale per messaggi diretti",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Note:

- Gli URL del profilo devono usare `https://`.
- L'importazione dai relay unisce i campi e mantiene le sostituzioni locali.

## Controllo degli accessi

### Criteri per i messaggi diretti

- **pairing** (predefinito): i mittenti sconosciuti ricevono un codice di associazione.
- **allowlist**: solo le chiavi pubbliche in `allowFrom` possono inviare messaggi diretti.
- **open**: messaggi diretti pubblici in entrata (richiede `allowFrom: ["*"]`).
- **disabled**: ignora i messaggi diretti in entrata.

Note sull'applicazione:

- Le firme degli eventi in entrata vengono verificate prima del criterio relativo al mittente e della decrittografia NIP-04, pertanto gli eventi contraffatti vengono rifiutati in anticipo.
- Le risposte di associazione vengono inviate senza decrittografare né elaborare il corpo del messaggio diretto originale.
- I messaggi diretti in entrata sono soggetti a limiti di frequenza (globalmente e per mittente) e i payload di dimensioni eccessive vengono scartati prima della decrittografia.

### Esempio di elenco consentiti

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Formati delle chiavi

Formati accettati:

- **Chiave privata:** `nsec...` o formato esadecimale di 64 caratteri
- **Chiavi pubbliche (`allowFrom`):** `npub...` o formato esadecimale

## Relay

Valori predefiniti: `relay.damus.io` e `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Suggerimenti:

- Usa 2-3 relay per garantire ridondanza.
- Evita un numero eccessivo di relay (latenza, duplicazione).
- I relay a pagamento possono migliorare l'affidabilità.
- I relay locali sono adatti per i test (`ws://localhost:7777`).

## Supporto del protocollo

| NIP    | Stato        | Descrizione                                    |
| ------ | ------------ | ---------------------------------------------- |
| NIP-01 | Supportato   | Formato di base degli eventi + metadati del profilo |
| NIP-04 | Supportato   | Messaggi diretti crittografati (`kind:4`)      |
| NIP-17 | Pianificato  | Messaggi diretti in busta crittografica        |
| NIP-44 | Pianificato  | Crittografia con versione                      |

## Test

### Relay locale

```bash
# Avvia strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Test manuale

1. Prendi nota della chiave pubblica del bot dai log del Gateway o da `openclaw channels status` (formato esadecimale; convertila in npub nel tuo client, se necessario).
2. Apri un client Nostr (Amethyst, Damus, ecc.).
3. Invia un messaggio diretto alla chiave pubblica del bot.
4. Verifica la risposta.

## Risoluzione dei problemi

### Mancata ricezione dei messaggi

- Verifica che la chiave privata sia valida.
- Assicurati che gli URL dei relay siano raggiungibili e usino `wss://` (o `ws://` per quelli locali).
- Verifica che `enabled` non sia `false`.
- Controlla nei log del Gateway la presenza di errori di connessione ai relay.

### Mancato invio delle risposte

- Verifica che il relay accetti le scritture.
- Verifica la connettività in uscita.
- Controlla eventuali limiti di frequenza imposti dal relay.

### Risposte duplicate

- È un comportamento previsto quando si utilizzano più relay.
- I messaggi vengono deduplicati in base all'ID evento; solo la prima consegna attiva una risposta.

## Sicurezza

- Non eseguire mai il commit delle chiavi private.
- Usa variabili d'ambiente per le chiavi.
- Valuta l'uso di `allowlist` per i bot in produzione.
- Le firme vengono verificate prima del criterio relativo al mittente e tale criterio viene applicato prima della decrittografia, pertanto gli eventi contraffatti vengono rifiutati in anticipo e i mittenti sconosciuti non possono imporre l'esecuzione dell'intera elaborazione crittografica.

## Limitazioni (MVP)

- Solo messaggi diretti (nessuna chat di gruppo).
- Nessun allegato multimediale.
- Solo NIP-04 (è pianificato il supporto per le buste crittografiche NIP-17).

## Contenuti correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo tramite menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento della sicurezza
