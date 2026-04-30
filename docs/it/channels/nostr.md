---
read_when:
    - Vuoi che OpenClaw riceva messaggi diretti tramite Nostr
    - Stai configurando la messaggistica decentralizzata
summary: Canale DM Nostr tramite messaggi crittografati NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-30T08:38:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**Stato:** Plugin incluso opzionale (disabilitato per impostazione predefinita finché non viene configurato).

Nostr è un protocollo decentralizzato per il social networking. Questo canale consente a OpenClaw di ricevere e rispondere ai messaggi diretti (DM) crittografati tramite NIP-04.

## Plugin incluso

Le versioni attuali di OpenClaw distribuiscono Nostr come plugin incluso, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

### Installazioni meno recenti/personalizzate

- L'onboarding (`openclaw onboard`) e `openclaw channels add` mostrano ancora
  Nostr dal catalogo dei canali condiviso.
- Se la tua build esclude Nostr incluso, installa un pacchetto npm attuale quando
  ne viene pubblicato uno.

```bash
openclaw plugins install @openclaw/nostr
```

Se npm segnala il pacchetto di proprietà di OpenClaw come deprecato, usa una build
OpenClaw pacchettizzata attuale o un checkout locale finché non viene pubblicato un pacchetto npm più recente.

Usa un checkout locale (flussi di lavoro di sviluppo):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Riavvia il Gateway dopo aver installato o abilitato i plugin.

### Configurazione non interattiva

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Usa `--use-env` per mantenere `NOSTR_PRIVATE_KEY` nell'ambiente invece di archiviare la chiave nella configurazione.

## Configurazione rapida

1. Genera una coppia di chiavi Nostr (se necessario):

```bash
# Using nak
nak key generate
```

2. Aggiungi alla configurazione:

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

## Riferimento di configurazione

| Chiave       | Tipo     | Predefinito                                | Descrizione                          |
| ------------ | -------- | ------------------------------------------- | ------------------------------------ |
| `privateKey` | string   | obbligatorio                                | Chiave privata in formato `nsec` o esadecimale |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL dei relay (WebSocket)            |
| `dmPolicy`   | string   | `pairing`                                   | Criterio di accesso ai DM            |
| `allowFrom`  | string[] | `[]`                                        | Pubkey dei mittenti consentiti       |
| `enabled`    | boolean  | `true`                                      | Abilita/disabilita il canale         |
| `name`       | string   | -                                           | Nome visualizzato                    |
| `profile`    | object   | -                                           | Metadati del profilo NIP-01          |

## Metadati del profilo

I dati del profilo vengono pubblicati come evento NIP-01 `kind:0`. Puoi gestirli dalla Control UI (Channels -> Nostr -> Profile) o impostarli direttamente nella configurazione.

Esempio:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
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
- L'importazione dai relay unisce i campi e preserva le sovrascritture locali.

## Controllo degli accessi

### Criteri DM

- **pairing** (predefinito): i mittenti sconosciuti ricevono un codice di pairing.
- **allowlist**: solo le pubkey in `allowFrom` possono inviare DM.
- **open**: DM pubblici in ingresso (richiede `allowFrom: ["*"]`).
- **disabled**: ignora i DM in ingresso.

Note sull'applicazione:

- Le firme degli eventi in ingresso vengono verificate prima del criterio del mittente e della decrittazione NIP-04, quindi gli eventi falsificati vengono rifiutati in anticipo.
- Le risposte di pairing vengono inviate senza elaborare il corpo del DM originale.
- I DM in ingresso sono soggetti a limitazione di frequenza e i payload sovradimensionati vengono scartati prima della decrittazione.

### Esempio di allowlist

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

- **Chiave privata:** `nsec...` o esadecimale da 64 caratteri
- **Pubkey (`allowFrom`):** `npub...` o esadecimale

## Relay

Predefiniti: `relay.damus.io` e `nos.lol`.

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

- Usa 2-3 relay per la ridondanza.
- Evita troppi relay (latenza, duplicazione).
- I relay a pagamento possono migliorare l'affidabilità.
- I relay locali vanno bene per i test (`ws://localhost:7777`).

## Supporto del protocollo

| NIP    | Stato    | Descrizione                             |
| ------ | -------- | --------------------------------------- |
| NIP-01 | Supportato | Formato evento di base + metadati del profilo |
| NIP-04 | Supportato | DM crittografati (`kind:4`)           |
| NIP-17 | Pianificato | DM con gift wrap                      |
| NIP-44 | Pianificato | Crittografia versionata               |

## Test

### Relay locale

```bash
# Start strfry
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

1. Annota la pubkey del bot (npub) dai log.
2. Apri un client Nostr (Damus, Amethyst, ecc.).
3. Invia un DM alla pubkey del bot.
4. Verifica la risposta.

## Risoluzione dei problemi

### Non ricevi messaggi

- Verifica che la chiave privata sia valida.
- Assicurati che gli URL dei relay siano raggiungibili e usino `wss://` (o `ws://` per il locale).
- Conferma che `enabled` non sia `false`.
- Controlla i log del Gateway per errori di connessione ai relay.

### Non invii risposte

- Controlla che il relay accetti scritture.
- Verifica la connettività in uscita.
- Fai attenzione ai limiti di frequenza dei relay.

### Risposte duplicate

- Previsto quando si usano più relay.
- I messaggi vengono deduplicati in base all'ID evento; solo la prima consegna attiva una risposta.

## Sicurezza

- Non eseguire mai il commit di chiavi private.
- Usa variabili d'ambiente per le chiavi.
- Considera `allowlist` per i bot di produzione.
- Le firme vengono verificate prima del criterio del mittente, e il criterio del mittente viene applicato prima della decrittazione, quindi gli eventi falsificati vengono rifiutati in anticipo e i mittenti sconosciuti non possono forzare il lavoro crittografico completo.

## Limitazioni (MVP)

- Solo messaggi diretti (nessuna chat di gruppo).
- Nessun allegato multimediale.
- Solo NIP-04 (gift-wrap NIP-17 pianificato).

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Routing dei canali](/it/channels/channel-routing) — routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
