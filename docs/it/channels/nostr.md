---
read_when:
    - Vuoi che OpenClaw riceva DM tramite Nostr
    - Stai configurando la messaggistica decentralizzata
summary: Canale DM Nostr tramite messaggi cifrati NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-05T13:43:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82829ee66fbeb3367007af343797140049ea49f2e842a695fa56acea0c80728
    source_path: channels/nostr.md
    workflow: 15
---

# Nostr

**Stato:** plugin bundle opzionale (disabilitato per impostazione predefinita finché non viene configurato).

Nostr è un protocollo decentralizzato per il social networking. Questo canale consente a OpenClaw di ricevere e rispondere a messaggi diretti (DM) cifrati tramite NIP-04.

## Plugin bundle

Le attuali release di OpenClaw includono Nostr come plugin bundle, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

### Installazioni meno recenti/personalizzate

- L'onboarding (`openclaw onboard`) e `openclaw channels add` continuano a mostrare
  Nostr dal catalogo canali condiviso.
- Se la tua build esclude Nostr bundle, installalo manualmente.

```bash
openclaw plugins install @openclaw/nostr
```

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

## Riferimento configurazione

| Chiave       | Tipo     | Predefinito                               | Descrizione                         |
| ------------ | -------- | ----------------------------------------- | ----------------------------------- |
| `privateKey` | string   | obbligatorio                              | Chiave privata in formato `nsec` o hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL relay (WebSocket)               |
| `dmPolicy`   | string   | `pairing`                                 | Criterio di accesso DM              |
| `allowFrom`  | string[] | `[]`                                      | Chiavi pubbliche mittente consentite |
| `enabled`    | boolean  | `true`                                    | Abilita/disabilita il canale        |
| `name`       | string   | -                                         | Nome visualizzato                   |
| `profile`    | object   | -                                         | Metadati del profilo NIP-01         |

## Metadati del profilo

I dati del profilo vengono pubblicati come evento NIP-01 `kind:0`. Puoi gestirli dalla UI di controllo (Channels -> Nostr -> Profile) oppure impostarli direttamente nella configurazione.

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
- L'importazione dai relay unisce i campi e preserva gli override locali.

## Controllo degli accessi

### Criteri DM

- **pairing** (predefinito): i mittenti sconosciuti ricevono un codice di pairing.
- **allowlist**: solo le chiavi pubbliche in `allowFrom` possono inviare DM.
- **open**: DM pubblici in ingresso (richiede `allowFrom: ["*"]`).
- **disabled**: ignora i DM in ingresso.

Note sull'applicazione:

- Le firme degli eventi in ingresso vengono verificate prima del criterio mittente e della decifratura NIP-04, quindi gli eventi falsificati vengono rifiutati subito.
- Le risposte di pairing vengono inviate senza elaborare il corpo originale del DM.
- I DM in ingresso sono soggetti a rate limiting e i payload troppo grandi vengono scartati prima della decifratura.

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

- **Chiave privata:** `nsec...` o hex di 64 caratteri
- **Chiavi pubbliche (`allowFrom`):** `npub...` o hex

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

| NIP    | Stato     | Descrizione                           |
| ------ | --------- | ------------------------------------- |
| NIP-01 | Supportato | Formato evento di base + metadati del profilo |
| NIP-04 | Supportato | DM cifrati (`kind:4`)                 |
| NIP-17 | Pianificato | DM gift-wrapped                      |
| NIP-44 | Pianificato | Cifratura versionata                 |

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

1. Annota la chiave pubblica del bot (npub) dai log.
2. Apri un client Nostr (Damus, Amethyst, ecc.).
3. Invia un DM alla chiave pubblica del bot.
4. Verifica la risposta.

## Risoluzione dei problemi

### Nessuna ricezione dei messaggi

- Verifica che la chiave privata sia valida.
- Assicurati che gli URL dei relay siano raggiungibili e usino `wss://` (o `ws://` in locale).
- Conferma che `enabled` non sia `false`.
- Controlla i log del Gateway per errori di connessione ai relay.

### Nessun invio delle risposte

- Controlla che il relay accetti scritture.
- Verifica la connettività in uscita.
- Controlla eventuali limiti di frequenza del relay.

### Risposte duplicate

- Previsto quando si usano più relay.
- I messaggi vengono deduplicati per ID evento; solo la prima consegna attiva una risposta.

## Sicurezza

- Non eseguire mai commit delle chiavi private.
- Usa variabili d'ambiente per le chiavi.
- Valuta `allowlist` per i bot di produzione.
- Le firme vengono verificate prima del criterio mittente, e il criterio mittente viene applicato prima della decifratura, quindi gli eventi falsificati vengono rifiutati subito e i mittenti sconosciuti non possono forzare lavoro crittografico completo.

## Limitazioni (MVP)

- Solo messaggi diretti (nessuna chat di gruppo).
- Nessun allegato multimediale.
- Solo NIP-04 (NIP-17 gift-wrap pianificato).

## Correlati

- [Panoramica dei canali](/channels) — tutti i canali supportati
- [Pairing](/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/channels/groups) — comportamento delle chat di gruppo e controllo tramite menzione
- [Instradamento dei canali](/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/gateway/security) — modello di accesso e hardening
