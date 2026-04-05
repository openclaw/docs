---
read_when:
    - Configurazione dell'integrazione della chat Twitch per OpenClaw
summary: Configurazione e configurazione del bot di chat Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-05T13:45:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47af9fb6edb1f462c5919850ee9d05e500a1914ddd0d64a41608fbe960e77cd6
    source_path: channels/twitch.md
    workflow: 15
---

# Twitch

Supporto della chat Twitch tramite connessione IRC. OpenClaw si connette come utente Twitch (account bot) per ricevere e inviare messaggi nei canali.

## Plugin incluso

Twitch è distribuito come plugin incluso nelle attuali versioni di OpenClaw, quindi le normali build pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Twitch, installalo manualmente:

Installa tramite CLI (registro npm):

```bash
openclaw plugins install @openclaw/twitch
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Dettagli: [Plugin](/tools/plugin)

## Configurazione rapida (principianti)

1. Assicurati che il plugin Twitch sia disponibile.
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un account Twitch dedicato per il bot (oppure usa un account esistente).
3. Genera le credenziali: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Seleziona **Bot Token**
   - Verifica che gli scope `chat:read` e `chat:write` siano selezionati
   - Copia il **Client ID** e l'**Access Token**
4. Trova il tuo ID utente Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Configura il token:
   - Variabile d'ambiente: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (solo account predefinito)
   - Oppure config: `channels.twitch.accessToken`
   - Se sono impostati entrambi, la config ha la precedenza (il fallback alla variabile d'ambiente vale solo per l'account predefinito).
6. Avvia il gateway.

**⚠️ Importante:** Aggiungi un controllo di accesso (`allowFrom` o `allowedRoles`) per impedire a utenti non autorizzati di attivare il bot. `requireMention` è impostato su `true` per impostazione predefinita.

Configurazione minima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Account Twitch del bot
      accessToken: "oauth:abc123...", // OAuth Access Token (oppure usa la variabile d'ambiente OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID da Token Generator
      channel: "vevisk", // Quale chat del canale Twitch unire (obbligatorio)
      allowFrom: ["123456789"], // (consigliato) Solo il tuo ID utente Twitch - recuperalo da https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Che cos'è

- Un canale Twitch di proprietà del Gateway.
- Routing deterministico: le risposte tornano sempre su Twitch.
- Ogni account è associato a una chiave di sessione isolata `agent:<agentId>:twitch:<accountName>`.
- `username` è l'account del bot (quello che si autentica), `channel` è la chat room a cui unirsi.

## Configurazione (dettagliata)

### Generare le credenziali

Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

- Seleziona **Bot Token**
- Verifica che gli scope `chat:read` e `chat:write` siano selezionati
- Copia il **Client ID** e l'**Access Token**

Non è necessaria alcuna registrazione manuale dell'app. I token scadono dopo diverse ore.

### Configurare il bot

**Variabile d'ambiente (solo account predefinito):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Oppure config:**

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

Se sono impostati sia la variabile d'ambiente sia la config, la config ha la precedenza.

### Controllo di accesso (consigliato)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (consigliato) Solo il tuo ID utente Twitch
    },
  },
}
```

Preferisci `allowFrom` per una allowlist rigida. Usa invece `allowedRoles` se vuoi un accesso basato sui ruoli.

**Ruoli disponibili:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Perché gli ID utente?** I nomi utente possono cambiare, consentendo impersonificazioni. Gli ID utente sono permanenti.

Trova il tuo ID utente Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Converti il tuo nome utente Twitch in ID)

## Aggiornamento del token (facoltativo)

I token di [Twitch Token Generator](https://twitchtokengenerator.com/) non possono essere aggiornati automaticamente: rigenerali quando scadono.

Per l'aggiornamento automatico del token, crea la tua applicazione Twitch in [Twitch Developer Console](https://dev.twitch.tv/console) e aggiungi alla config:

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

Il bot aggiorna automaticamente i token prima della scadenza e registra gli eventi di aggiornamento.

## Supporto multi-account

Usa `channels.twitch.accounts` con token per account. Vedi [`gateway/configuration`](/gateway/configuration) per il pattern condiviso.

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

**Nota:** Ogni account necessita del proprio token (un token per canale).

## Controllo di accesso

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

### Disattivare il requisito di @mention

Per impostazione predefinita, `requireMention` è `true`. Per disattivarlo e rispondere a tutti i messaggi:

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

**Controlla il controllo di accesso:** assicurati che il tuo ID utente sia in `allowFrom`, oppure rimuovi temporaneamente `allowFrom` e imposta `allowedRoles: ["all"]` per fare una prova.

**Controlla che il bot sia nel canale:** il bot deve unirsi al canale specificato in `channel`.

### Problemi con il token

**"Failed to connect" o errori di autenticazione:**

- Verifica che `accessToken` sia il valore del token di accesso OAuth (in genere inizia con il prefisso `oauth:`)
- Controlla che il token abbia gli scope `chat:read` e `chat:write`
- Se usi l'aggiornamento del token, verifica che `clientSecret` e `refreshToken` siano impostati

### L'aggiornamento del token non funziona

**Controlla i log per gli eventi di aggiornamento:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Se vedi "token refresh disabled (no refresh token)":

- Assicurati che `clientSecret` sia fornito
- Assicurati che `refreshToken` sia fornito

## Configurazione

**Configurazione account:**

- `username` - Nome utente del bot
- `accessToken` - Token di accesso OAuth con `chat:read` e `chat:write`
- `clientId` - Twitch Client ID (da Token Generator o dalla tua app)
- `channel` - Canale a cui unirsi (obbligatorio)
- `enabled` - Abilita questo account (predefinito: `true`)
- `clientSecret` - Facoltativo: per l'aggiornamento automatico del token
- `refreshToken` - Facoltativo: per l'aggiornamento automatico del token
- `expiresIn` - Scadenza del token in secondi
- `obtainmentTimestamp` - Timestamp di ottenimento del token
- `allowFrom` - Allowlist di ID utente
- `allowedRoles` - Controllo di accesso basato sui ruoli (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - Richiede @mention (predefinito: `true`)

**Opzioni del provider:**

- `channels.twitch.enabled` - Abilita/disabilita l'avvio del canale
- `channels.twitch.username` - Nome utente del bot (configurazione semplificata a singolo account)
- `channels.twitch.accessToken` - Token di accesso OAuth (configurazione semplificata a singolo account)
- `channels.twitch.clientId` - Twitch Client ID (configurazione semplificata a singolo account)
- `channels.twitch.channel` - Canale a cui unirsi (configurazione semplificata a singolo account)
- `channels.twitch.accounts.<accountName>` - Configurazione multi-account (tutti i campi account sopra)

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

L'agente può chiamare `twitch` con l'azione:

- `send` - Invia un messaggio a un canale

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

## Sicurezza e operazioni

- **Tratta i token come password** - Non salvare mai i token in git
- **Usa l'aggiornamento automatico del token** per bot a lunga esecuzione
- **Usa allowlist di ID utente** invece dei nomi utente per il controllo di accesso
- **Monitora i log** per eventi di aggiornamento del token e stato della connessione
- **Limita al minimo gli scope dei token** - Richiedi solo `chat:read` e `chat:write`
- **Se resti bloccato**: riavvia il gateway dopo aver confermato che nessun altro processo possieda la sessione

## Limiti

- **500 caratteri** per messaggio (suddivisione automatica ai confini delle parole)
- Il Markdown viene rimosso prima della suddivisione
- Nessun rate limiting (usa i limiti di frequenza integrati di Twitch)

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e blocco tramite mention
- [Routing dei canali](/it/channels/channel-routing) — routing di sessione per i messaggi
- [Sicurezza](/gateway/security) — modello di accesso e hardening
