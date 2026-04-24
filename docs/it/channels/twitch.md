---
read_when:
    - Configurare l’integrazione della chat di Twitch per OpenClaw
summary: Configurazione e impostazione del bot per la chat di Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-24T08:31:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

Supporto della chat di Twitch tramite connessione IRC. OpenClaw si connette come utente Twitch (account bot) per ricevere e inviare messaggi nei canali.

## Plugin incluso

Twitch viene distribuito come Plugin incluso nelle versioni attuali di OpenClaw, quindi le normali build pacchettizzate non richiedono un’installazione separata.

Se usi una build più vecchia o un’installazione personalizzata che esclude Twitch, installalo manualmente:

Installa tramite CLI (registro npm):

```bash
openclaw plugins install @openclaw/twitch
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Dettagli: [Plugins](/it/tools/plugin)

## Configurazione rapida (principianti)

1. Assicurati che il Plugin Twitch sia disponibile.
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni più vecchie o personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un account Twitch dedicato per il bot (oppure usa un account esistente).
3. Genera le credenziali: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Seleziona **Bot Token**
   - Verifica che siano selezionati gli scope `chat:read` e `chat:write`
   - Copia il **Client ID** e l’**Access Token**
4. Trova il tuo ID utente Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Configura il token:
   - Variabile d’ambiente: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (solo account predefinito)
   - Oppure configurazione: `channels.twitch.accessToken`
   - Se entrambi sono impostati, la configurazione ha la precedenza (il fallback alla variabile d’ambiente vale solo per l’account predefinito).
6. Avvia il gateway.

**⚠️ Importante:** aggiungi un controllo degli accessi (`allowFrom` o `allowedRoles`) per impedire a utenti non autorizzati di attivare il bot. `requireMention` è `true` per impostazione predefinita.

Configurazione minima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Account Twitch del bot
      accessToken: "oauth:abc123...", // OAuth Access Token (oppure usa la variabile d'ambiente OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID dal Token Generator
      channel: "vevisk", // Canale Twitch di cui unirsi alla chat (obbligatorio)
      allowFrom: ["123456789"], // (consigliato) solo il tuo ID utente Twitch - ottienilo da https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Che cos’è

- Un canale Twitch gestito dal Gateway.
- Instradamento deterministico: le risposte tornano sempre a Twitch.
- Ogni account viene mappato a una chiave di sessione isolata `agent:<agentId>:twitch:<accountName>`.
- `username` è l’account del bot (quello che si autentica), `channel` è la chat room a cui unirsi.

## Configurazione (dettagliata)

### Generare le credenziali

Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

- Seleziona **Bot Token**
- Verifica che siano selezionati gli scope `chat:read` e `chat:write`
- Copia il **Client ID** e l’**Access Token**

Non è necessaria alcuna registrazione manuale dell’app. I token scadono dopo diverse ore.

### Configurare il bot

**Variabile d’ambiente (solo account predefinito):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Oppure configurazione:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

Se sono impostati sia la variabile d’ambiente sia la configurazione, la configurazione ha la precedenza.

### Controllo degli accessi (consigliato)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (consigliato) solo il tuo ID utente Twitch
    },
  },
}
```

Preferisci `allowFrom` per una allowlist rigida. Usa invece `allowedRoles` se vuoi un accesso basato sui ruoli.

**Ruoli disponibili:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Perché gli ID utente?** I nomi utente possono cambiare, consentendo impersonificazione. Gli ID utente sono permanenti.

Trova il tuo ID utente Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Converti il tuo username Twitch in ID)

## Refresh del token (opzionale)

I token di [Twitch Token Generator](https://twitchtokengenerator.com/) non possono essere aggiornati automaticamente: rigenerali quando scadono.

Per il refresh automatico del token, crea la tua applicazione Twitch su [Twitch Developer Console](https://dev.twitch.tv/console) e aggiungi alla configurazione:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Il bot aggiorna automaticamente i token prima della scadenza e registra gli eventi di refresh nei log.

## Supporto multi-account

Usa `channels.twitch.accounts` con token per account. Vedi [`gateway/configuration`](/it/gateway/configuration) per il modello condiviso.

Esempio (un account bot in due canali):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**Nota:** ogni account ha bisogno del proprio token (un token per canale).

## Controllo degli accessi

### Restrizioni basate sui ruoli

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### Allowlist per ID utente (più sicura)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### Accesso basato sui ruoli (alternativa)

`allowFrom` è una allowlist rigida. Quando è impostato, sono consentiti solo quegli ID utente.
Se vuoi un accesso basato sui ruoli, lascia `allowFrom` non impostato e configura invece `allowedRoles`:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### Disabilitare il requisito di @mention

Per impostazione predefinita, `requireMention` è `true`. Per disabilitarlo e rispondere a tutti i messaggi:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## Risoluzione dei problemi

Per prima cosa, esegui i comandi diagnostici:

```bash
openclaw doctor
openclaw channels status --probe
```

### Il bot non risponde ai messaggi

**Controlla il controllo degli accessi:** assicurati che il tuo ID utente sia in `allowFrom`, oppure rimuovi temporaneamente
`allowFrom` e imposta `allowedRoles: ["all"]` per fare una prova.

**Controlla che il bot sia nel canale:** il bot deve unirsi al canale specificato in `channel`.

### Problemi con il token

**“Failed to connect” o errori di autenticazione:**

- Verifica che `accessToken` sia il valore del token di accesso OAuth (in genere inizia con il prefisso `oauth:`)
- Controlla che il token abbia gli scope `chat:read` e `chat:write`
- Se usi il refresh del token, verifica che `clientSecret` e `refreshToken` siano impostati

### Il refresh del token non funziona

**Controlla i log per gli eventi di refresh:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Se vedi “token refresh disabled (no refresh token)”:

- Assicurati che `clientSecret` sia fornito
- Assicurati che `refreshToken` sia fornito

## Configurazione

**Configurazione account:**

- `username` - username del bot
- `accessToken` - token di accesso OAuth con `chat:read` e `chat:write`
- `clientId` - Twitch Client ID (dal Token Generator o dalla tua app)
- `channel` - canale a cui unirsi (obbligatorio)
- `enabled` - abilita questo account (predefinito: `true`)
- `clientSecret` - opzionale: per il refresh automatico del token
- `refreshToken` - opzionale: per il refresh automatico del token
- `expiresIn` - scadenza del token in secondi
- `obtainmentTimestamp` - timestamp di ottenimento del token
- `allowFrom` - allowlist di ID utente
- `allowedRoles` - controllo degli accessi basato sui ruoli (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - richiedi @mention (predefinito: `true`)

**Opzioni del provider:**

- `channels.twitch.enabled` - abilita/disabilita l’avvio del canale
- `channels.twitch.username` - username del bot (configurazione semplificata a account singolo)
- `channels.twitch.accessToken` - token di accesso OAuth (configurazione semplificata a account singolo)
- `channels.twitch.clientId` - Twitch Client ID (configurazione semplificata a account singolo)
- `channels.twitch.channel` - canale a cui unirsi (configurazione semplificata a account singolo)
- `channels.twitch.accounts.<accountName>` - configurazione multi-account (tutti i campi account sopra)

Esempio completo:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Azioni dello strumento

L’agente può chiamare `twitch` con l’azione:

- `send` - invia un messaggio a un canale

Esempio:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Sicurezza e operatività

- **Tratta i token come password** - non salvare mai i token in git
- **Usa il refresh automatico del token** per bot eseguiti a lungo
- **Usa allowlist di ID utente** invece degli username per il controllo degli accessi
- **Monitora i log** per eventi di refresh del token e stato della connessione
- **Riduci al minimo gli scope dei token** - richiedi solo `chat:read` e `chat:write`
- **Se resti bloccato**: riavvia il gateway dopo aver confermato che nessun altro processo possiede la sessione

## Limiti

- **500 caratteri** per messaggio (suddivisi automaticamente ai confini delle parole)
- Il Markdown viene rimosso prima della suddivisione
- Nessun rate limiting (usa i rate limit integrati di Twitch)

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Channel Routing](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Security](/it/gateway/security) — modello di accesso e hardening
