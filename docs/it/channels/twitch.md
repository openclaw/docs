---
read_when:
    - Configurare l'integrazione della chat di Twitch per OpenClaw
sidebarTitle: Twitch
summary: Configurazione e impostazione del bot della chat di Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-30T08:40:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

Supporto della chat di Twitch tramite connessione IRC. OpenClaw si connette come utente Twitch (account bot) per ricevere e inviare messaggi nei canali.

## Plugin incluso

<Note>
Twitch viene distribuito come Plugin incluso nelle versioni correnti di OpenClaw, quindi le normali build pacchettizzate non richiedono un'installazione separata.
</Note>

Se usi una build precedente o un'installazione personalizzata che esclude Twitch, installa un pacchetto npm corrente quando ne viene pubblicato uno:

<Tabs>
  <Tab title="Registro npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Checkout locale">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Se npm segnala il pacchetto di proprietà di OpenClaw come deprecato, usa una build
OpenClaw pacchettizzata corrente o il percorso di checkout locale finché non viene
pubblicato un pacchetto npm più recente.

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida (principianti)

<Steps>
  <Step title="Assicurati che il Plugin sia disponibile">
    Le versioni OpenClaw pacchettizzate correnti lo includono già. Le installazioni precedenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
  </Step>
  <Step title="Crea un account bot Twitch">
    Crea un account Twitch dedicato per il bot (oppure usa un account esistente).
  </Step>
  <Step title="Genera le credenziali">
    Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Seleziona **Bot Token**
    - Verifica che gli scope `chat:read` e `chat:write` siano selezionati
    - Copia il **Client ID** e l'**Access Token**

  </Step>
  <Step title="Trova il tuo ID utente Twitch">
    Usa [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) per convertire un nome utente in un ID utente Twitch.
  </Step>
  <Step title="Configura il token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (solo account predefinito)
    - Oppure configurazione: `channels.twitch.accessToken`

    Se sono impostati entrambi, la configurazione ha la precedenza (il fallback env vale solo per l'account predefinito).

  </Step>
  <Step title="Avvia il gateway">
    Avvia il gateway con il canale configurato.
  </Step>
</Steps>

<Warning>
Aggiungi il controllo degli accessi (`allowFrom` o `allowedRoles`) per impedire a utenti non autorizzati di attivare il bot. `requireMention` ha valore predefinito `true`.
</Warning>

Configurazione minima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Che cos'è

- Un canale Twitch di proprietà del Gateway.
- Routing deterministico: le risposte tornano sempre a Twitch.
- Ogni account viene mappato a una chiave di sessione isolata `agent:<agentId>:twitch:<accountName>`.
- `username` è l'account del bot (chi si autentica), `channel` è la chat room a cui accedere.

## Configurazione (dettagliata)

### Genera le credenziali

Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

- Seleziona **Bot Token**
- Verifica che gli scope `chat:read` e `chat:write` siano selezionati
- Copia il **Client ID** e l'**Access Token**

<Note>
Non è necessaria la registrazione manuale dell'app. I token scadono dopo diverse ore.
</Note>

### Configura il bot

<Tabs>
  <Tab title="Variabile env (solo account predefinito)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Configurazione">
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
  </Tab>
</Tabs>

Se sono impostati sia env sia configurazione, la configurazione ha la precedenza.

### Controllo degli accessi (consigliato)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Preferisci `allowFrom` per una allowlist rigida. Usa invece `allowedRoles` se vuoi un accesso basato sui ruoli.

**Ruoli disponibili:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Perché gli ID utente?** I nomi utente possono cambiare, consentendo impersonificazioni. Gli ID utente sono permanenti.

Trova il tuo ID utente Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Converti il tuo nome utente Twitch in ID)
</Note>

## Aggiornamento del token (facoltativo)

I token di [Twitch Token Generator](https://twitchtokengenerator.com/) non possono essere aggiornati automaticamente: rigenerali quando scadono.

Per l'aggiornamento automatico del token, crea la tua applicazione Twitch in [Twitch Developer Console](https://dev.twitch.tv/console) e aggiungi alla configurazione:

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

Il bot aggiorna automaticamente i token prima della scadenza e registra gli eventi di aggiornamento nei log.

## Supporto multi-account

Usa `channels.twitch.accounts` con token per account. Vedi [Configurazione](/it/gateway/configuration) per il pattern condiviso.

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

<Note>
Ogni account richiede il proprio token (un token per canale).
</Note>

## Controllo degli accessi

<Tabs>
  <Tab title="Allowlist di ID utente (più sicura)">
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
  </Tab>
  <Tab title="Basato sui ruoli">
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

    `allowFrom` è una allowlist rigida. Quando è impostata, sono consentiti solo quegli ID utente. Se vuoi un accesso basato sui ruoli, lascia `allowFrom` non impostato e configura invece `allowedRoles`.

  </Tab>
  <Tab title="Disattiva il requisito @mention">
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

  </Tab>
</Tabs>

## Risoluzione dei problemi

Per prima cosa, esegui i comandi diagnostici:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Il bot non risponde ai messaggi">
    - **Controlla il controllo degli accessi:** assicurati che il tuo ID utente sia in `allowFrom`, oppure rimuovi temporaneamente `allowFrom` e imposta `allowedRoles: ["all"]` per fare una prova.
    - **Controlla che il bot sia nel canale:** il bot deve accedere al canale specificato in `channel`.

  </Accordion>
  <Accordion title="Problemi con il token">
    "Impossibile connettersi" o errori di autenticazione:

    - Verifica che `accessToken` sia il valore del token di accesso OAuth (di solito inizia con il prefisso `oauth:`)
    - Controlla che il token abbia gli scope `chat:read` e `chat:write`
    - Se usi l'aggiornamento del token, verifica che `clientSecret` e `refreshToken` siano impostati

  </Accordion>
  <Accordion title="L'aggiornamento del token non funziona">
    Controlla nei log gli eventi di aggiornamento:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Se vedi "token refresh disabled (no refresh token)":

    - Assicurati che `clientSecret` sia fornito
    - Assicurati che `refreshToken` sia fornito

  </Accordion>
</AccordionGroup>

## Configurazione

### Configurazione dell'account

<ParamField path="username" type="string">
  Nome utente del bot.
</ParamField>
<ParamField path="accessToken" type="string">
  Token di accesso OAuth con `chat:read` e `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Client ID Twitch (da Token Generator o dalla tua app).
</ParamField>
<ParamField path="channel" type="string" required>
  Canale a cui accedere.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Abilita questo account.
</ParamField>
<ParamField path="clientSecret" type="string">
  Facoltativo: per l'aggiornamento automatico del token.
</ParamField>
<ParamField path="refreshToken" type="string">
  Facoltativo: per l'aggiornamento automatico del token.
</ParamField>
<ParamField path="expiresIn" type="number">
  Scadenza del token in secondi.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Timestamp di ottenimento del token.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Allowlist di ID utente.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Controllo degli accessi basato sui ruoli.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Richiedi @mention.
</ParamField>

### Opzioni del provider

- `channels.twitch.enabled` - Abilita/disabilita l'avvio del canale
- `channels.twitch.username` - Nome utente del bot (configurazione semplificata per account singolo)
- `channels.twitch.accessToken` - Token di accesso OAuth (configurazione semplificata per account singolo)
- `channels.twitch.clientId` - Client ID Twitch (configurazione semplificata per account singolo)
- `channels.twitch.channel` - Canale a cui accedere (configurazione semplificata per account singolo)
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

- **Tratta i token come password** — Non commettere mai token in git.
- **Usa l'aggiornamento automatico del token** per bot a lunga esecuzione.
- **Usa allowlist di ID utente** invece dei nomi utente per il controllo degli accessi.
- **Monitora i log** per gli eventi di aggiornamento del token e lo stato della connessione.
- **Limita al minimo gli scope dei token** — Richiedi solo `chat:read` e `chat:write`.
- **Se sei bloccato**: riavvia il gateway dopo aver confermato che nessun altro processo possiede la sessione.

## Limiti

- **500 caratteri** per messaggio (suddivisione automatica ai confini delle parole).
- Markdown viene rimosso prima della suddivisione.
- Nessuna limitazione della frequenza (usa i limiti di frequenza integrati di Twitch).

## Correlati

- [Routing dei canali](/it/channels/channel-routing) — routing delle sessioni per i messaggi
- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
