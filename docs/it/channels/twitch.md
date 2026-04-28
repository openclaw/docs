---
read_when:
    - Configurazione dell’integrazione della chat di Twitch per OpenClaw
sidebarTitle: Twitch
summary: Configurazione e impostazione del bot per la chat di Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

Supporto della chat di Twitch tramite connessione IRC. OpenClaw si connette come utente Twitch (account bot) per ricevere e inviare messaggi nei canali.

## Plugin incluso

<Note>
Twitch è distribuito come Plugin incluso nelle attuali release di OpenClaw, quindi le normali build pacchettizzate non richiedono un’installazione separata.
</Note>

Se usi una build meno recente o un’installazione personalizzata che esclude Twitch, installalo manualmente:

<Tabs>
  <Tab title="registro npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="checkout locale">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Dettagli: [Plugins](/it/tools/plugin)

## Configurazione rapida (principianti)

<Steps>
  <Step title="Assicurati che il Plugin sia disponibile">
    Le attuali release pacchettizzate di OpenClaw lo includono già. Le installazioni meno recenti o personalizzate possono aggiungerlo manualmente con i comandi sopra.
  </Step>
  <Step title="Crea un account bot Twitch">
    Crea un account Twitch dedicato per il bot (oppure usa un account esistente).
  </Step>
  <Step title="Genera le credenziali">
    Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Seleziona **Bot Token**
    - Verifica che siano selezionati gli scope `chat:read` e `chat:write`
    - Copia il **Client ID** e l’**Access Token**

  </Step>
  <Step title="Trova il tuo ID utente Twitch">
    Usa [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) per convertire un nome utente in un ID utente Twitch.
  </Step>
  <Step title="Configura il token">
    - Variabile d’ambiente: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (solo account predefinito)
    - Oppure config: `channels.twitch.accessToken`

    Se sono impostati entrambi, la config ha la precedenza (il fallback alla variabile d’ambiente vale solo per l’account predefinito).

  </Step>
  <Step title="Avvia il Gateway">
    Avvia il Gateway con il canale configurato.
  </Step>
</Steps>

<Warning>
Aggiungi il controllo di accesso (`allowFrom` o `allowedRoles`) per impedire a utenti non autorizzati di attivare il bot. `requireMention` è impostato su `true` per impostazione predefinita.
</Warning>

Configurazione minima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Account Twitch del bot
      accessToken: "oauth:abc123...", // OAuth Access Token (oppure usa la variabile d'ambiente OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID da Token Generator
      channel: "vevisk", // Canale Twitch di cui unirsi alla chat (obbligatorio)
      allowFrom: ["123456789"], // (consigliato) Solo il tuo ID utente Twitch - ottienilo da https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Cos’è

- Un canale Twitch gestito dal Gateway.
- Routing deterministico: le risposte tornano sempre a Twitch.
- Ogni account viene mappato a una chiave di sessione isolata `agent:<agentId>:twitch:<accountName>`.
- `username` è l’account del bot (chi si autentica), `channel` è la chat room a cui unirsi.

## Configurazione (dettagliata)

### Generare le credenziali

Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

- Seleziona **Bot Token**
- Verifica che siano selezionati gli scope `chat:read` e `chat:write`
- Copia il **Client ID** e l’**Access Token**

<Note>
Non è necessaria alcuna registrazione manuale dell’app. I token scadono dopo alcune ore.
</Note>

### Configurare il bot

<Tabs>
  <Tab title="Variabile d’ambiente (solo account predefinito)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
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

Se sono impostati sia la variabile d’ambiente sia la config, la config ha la precedenza.

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

<Note>
**Perché gli ID utente?** I nomi utente possono cambiare, consentendo impersonificazione. Gli ID utente sono permanenti.

Trova il tuo ID utente Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Converti il tuo nome utente Twitch in ID)
</Note>

## Aggiornamento del token (facoltativo)

I token di [Twitch Token Generator](https://twitchtokengenerator.com/) non possono essere aggiornati automaticamente: rigenerali quando scadono.

Per l’aggiornamento automatico del token, crea la tua applicazione Twitch nella [Twitch Developer Console](https://dev.twitch.tv/console) e aggiungi alla config:

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

Usa `channels.twitch.accounts` con token per account. Consulta [Configuration](/it/gateway/configuration) per il modello condiviso.

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

## Controllo di accesso

<Tabs>
  <Tab title="Allowlist ID utente (più sicura)">
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
  <Tab title="Disabilitare l’obbligo di @mention">
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
    - **Controlla il controllo di accesso:** assicurati che il tuo ID utente sia in `allowFrom`, oppure rimuovi temporaneamente `allowFrom` e imposta `allowedRoles: ["all"]` per fare un test.
    - **Controlla che il bot sia nel canale:** il bot deve unirsi al canale specificato in `channel`.

  </Accordion>
  <Accordion title="Problemi con il token">
    Errori di “Failed to connect” o di autenticazione:

    - Verifica che `accessToken` sia il valore del token di accesso OAuth (in genere inizia con il prefisso `oauth:`)
    - Controlla che il token abbia gli scope `chat:read` e `chat:write`
    - Se usi l’aggiornamento del token, verifica che `clientSecret` e `refreshToken` siano impostati

  </Accordion>
  <Accordion title="L’aggiornamento del token non funziona">
    Controlla i log per gli eventi di aggiornamento:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Se vedi “token refresh disabled (no refresh token)”:

    - Assicurati che `clientSecret` sia fornito
    - Assicurati che `refreshToken` sia fornito

  </Accordion>
</AccordionGroup>

## Config

### Config account

<ParamField path="username" type="string">
  Nome utente del bot.
</ParamField>
<ParamField path="accessToken" type="string">
  Token di accesso OAuth con `chat:read` e `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (da Token Generator o dalla tua app).
</ParamField>
<ParamField path="channel" type="string" required>
  Canale a cui unirsi.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Abilita questo account.
</ParamField>
<ParamField path="clientSecret" type="string">
  Facoltativo: per l’aggiornamento automatico del token.
</ParamField>
<ParamField path="refreshToken" type="string">
  Facoltativo: per l’aggiornamento automatico del token.
</ParamField>
<ParamField path="expiresIn" type="number">
  Scadenza del token in secondi.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Timestamp di ottenimento del token.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Allowlist degli ID utente.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Controllo di accesso basato sui ruoli.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Richiedi @mention.
</ParamField>

### Opzioni del provider

- `channels.twitch.enabled` - Abilita/disabilita l’avvio del canale
- `channels.twitch.username` - Nome utente del bot (config semplificata a singolo account)
- `channels.twitch.accessToken` - Token di accesso OAuth (config semplificata a singolo account)
- `channels.twitch.clientId` - Twitch Client ID (config semplificata a singolo account)
- `channels.twitch.channel` - Canale a cui unirsi (config semplificata a singolo account)
- `channels.twitch.accounts.<accountName>` - Config multi-account (tutti i campi account sopra)

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

## Sicurezza e operatività

- **Tratta i token come password** — Non eseguire mai il commit dei token in git.
- **Usa l’aggiornamento automatico del token** per bot a lunga esecuzione.
- **Usa allowlist di ID utente** invece dei nomi utente per il controllo di accesso.
- **Monitora i log** per gli eventi di aggiornamento del token e lo stato della connessione.
- **Limita al minimo gli scope dei token** — Richiedi solo `chat:read` e `chat:write`.
- **Se sei bloccato**: riavvia il Gateway dopo aver verificato che nessun altro processo possieda la sessione.

## Limiti

- **500 caratteri** per messaggio (suddivisione automatica ai confini delle parole).
- Il Markdown viene rimosso prima della suddivisione.
- Nessuna limitazione di frequenza (usa i limiti di frequenza integrati di Twitch).

## Correlati

- [Channel Routing](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Groups](/it/channels/groups) — comportamento della chat di gruppo e gating delle menzioni
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Security](/it/gateway/security) — modello di accesso e hardening
