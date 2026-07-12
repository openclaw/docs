---
read_when:
    - Configurazione dell'integrazione della chat di Twitch per OpenClaw
sidebarTitle: Twitch
summary: 'Bot per la chat di Twitch: installazione, credenziali, controllo degli accessi, aggiornamento del token'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T06:52:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Supporto della chat di Twitch tramite l'interfaccia chat (IRC) di Twitch usando il client Twurple. OpenClaw accede con un account bot Twitch, entra in un canale per ogni account configurato e risponde in quel canale.

## Installazione

Twitch viene distribuito come Plugin ufficiale; non fa parte dell'installazione principale.

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

`plugins install` registra e abilita il Plugin. Selezionando Twitch durante `openclaw onboard` o `openclaw channels add`, viene installato su richiesta. Usa il nome del pacchetto senza versione per seguire la release corrente; specifica una versione esatta solo per installazioni riproducibili. Richiede OpenClaw 2026.4.10 o versione successiva.

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

<Steps>
  <Step title="Installa il Plugin">
    Consulta la sezione [Installazione](#install) precedente.
  </Step>
  <Step title="Crea un account bot Twitch">
    Crea un account Twitch dedicato al bot oppure usa un account esistente.
  </Step>
  <Step title="Genera le credenziali">
    Usa [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Seleziona **Bot Token**
    - Verifica che gli ambiti `chat:read` e `chat:write` siano selezionati
    - Copia **Client ID** e **Access Token**

  </Step>
  <Step title="Trova il tuo ID utente Twitch">
    Usa [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) per convertire un nome utente in un ID utente Twitch.
  </Step>
  <Step title="Configura il token">
    - Variabile d'ambiente: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (solo per l'account predefinito)
    - Oppure configurazione: `channels.twitch.accessToken`

    Se sono impostati entrambi, la configurazione ha la precedenza (la variabile d'ambiente viene usata solo come ripiego per l'account predefinito).

  </Step>
  <Step title="Avvia il Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Aggiungi il controllo degli accessi (`allowFrom` o `allowedRoles`) per impedire agli utenti non autorizzati di attivare il bot. Il valore predefinito di `requireMention` è `true`.
</Warning>

Configurazione minima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Account Twitch del bot (esegue l'autenticazione)
      accessToken: "oauth:abc123...", // Token di accesso OAuth (oppure usa la variabile d'ambiente OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // ID client ottenuto da Token Generator
      channel: "yourchannel", // Chat del canale Twitch a cui accedere (obbligatorio)
      allowFrom: ["123456789"], // (consigliato) Solo il tuo ID utente Twitch
    },
  },
}
```

## Cos'è

- Un canale Twitch gestito dal Gateway.
- Instradamento deterministico: le risposte vengono sempre inviate al canale Twitch da cui proviene il messaggio.
- Ogni canale a cui si accede corrisponde a una chiave di sessione di gruppo isolata `agent:<agentId>:twitch:group:<channel>`.
- `username` è l'account del bot che esegue l'autenticazione, mentre `channel` è la chat a cui accedere. Ogni voce di account accede esattamente a un canale.
- I token funzionano con o senza il prefisso `oauth:`; OpenClaw normalizza entrambe le forme (la procedura guidata di configurazione richiede la forma con `oauth:`).

## Aggiornamento del token (facoltativo)

I token ottenuti da [Twitch Token Generator](https://twitchtokengenerator.com/) non possono essere aggiornati da OpenClaw: rigenerali quando scadono (durano alcune ore e non richiedono la registrazione di un'app).

Per l'aggiornamento automatico, crea una tua app nella [Console per sviluppatori Twitch](https://dev.twitch.tv/console) e aggiungi:

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

Quando entrambi sono impostati, il Plugin usa un provider di autenticazione con aggiornamento automatico, che rinnova i token prima della scadenza e registra ogni aggiornamento. Senza `refreshToken`, registra `token refresh disabled (no refresh token)`; senza `clientSecret`, torna a usare un token statico, privo di aggiornamento automatico.

## Supporto multi-account

Usa `channels.twitch.accounts` con credenziali specifiche per ogni account. Consulta [Configurazione](/it/gateway/configuration) per il modello condiviso.

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
          channel: "yourchannel",
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
Ogni voce di account richiede un proprio `accessToken` (la variabile d'ambiente copre solo l'account predefinito). Un account accede esattamente a un canale, quindi per accedere a due canali sono necessari due account. `channels.twitch.defaultAccount` seleziona l'account predefinito.
</Note>

## Controllo degli accessi

`allowFrom` è un elenco di autorizzazione rigido di ID utente Twitch. Quando è impostato, `allowedRoles` viene ignorato; lascia `allowFrom` non impostato per usare invece l'accesso basato sui ruoli.

**Ruoli disponibili:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Elenco di autorizzazione degli ID utente (più sicuro)">
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
  </Tab>
  <Tab title="Disabilita il requisito della @menzione">
    Per impostazione predefinita, `requireMention` è `true`. Per rispondere a tutti i messaggi autorizzati:

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

<Note>
**Perché gli ID utente?** I nomi utente possono cambiare, consentendo la sostituzione d'identità. Gli ID utente sono permanenti.

Trova il tuo con il [convertitore da nome utente a ID](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Risoluzione dei problemi

Per prima cosa, esegui i comandi diagnostici:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Il bot non risponde ai messaggi">
    - **Controlla il controllo degli accessi:** assicurati che il tuo ID utente sia presente in `allowFrom` oppure, temporaneamente, rimuovi `allowFrom` e imposta `allowedRoles: ["all"]` per eseguire una prova.
    - **Controlla il vincolo della menzione:** con `requireMention: true` (valore predefinito), i messaggi devono contenere una @menzione del nome utente del bot.
    - **Controlla che il bot sia nel canale:** il bot accede solo al canale specificato in `channel`.

  </Accordion>
  <Accordion title="Problemi con il token">
    Errori `"Failed to connect"` o di autenticazione:

    - Verifica che `accessToken` contenga il valore del token di accesso OAuth (il prefisso `oauth:` è facoltativo)
    - Controlla che il token disponga degli ambiti `chat:read` e `chat:write`
    - Se usi l'aggiornamento del token, verifica che `clientSecret` e `refreshToken` siano impostati

  </Accordion>
  <Accordion title="L'aggiornamento del token non funziona">
    Controlla nei registri gli eventi di aggiornamento:

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Se viene visualizzato `token refresh disabled (no refresh token)`:

    - Assicurati che `clientSecret` sia specificato
    - Assicurati che `refreshToken` sia specificato

  </Accordion>
</AccordionGroup>

## Configurazione

### Configurazione dell'account

<ParamField path="username" type="string" required>
  Nome utente del bot, ossia l'account che esegue l'autenticazione.
</ParamField>
<ParamField path="accessToken" type="string" required>
  Token di accesso OAuth con `chat:read` e `chat:write` (tramite configurazione o variabile d'ambiente per l'account predefinito).
</ParamField>
<ParamField path="clientId" type="string" required>
  ID client Twitch (da Token Generator o dalla tua app). Facoltativo nello schema, ma obbligatorio per la connessione.
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
  Scadenza del token in secondi (monitoraggio dell'aggiornamento).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Indicatore temporale dell'ottenimento del token (monitoraggio dell'aggiornamento).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Elenco di autorizzazione degli ID utente. Quando è impostato, i ruoli vengono ignorati.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Controllo degli accessi basato sui ruoli.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Richiede una @menzione per attivare il bot.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Sostituzione del prefisso delle risposte in uscita per questo account.
</ParamField>

### Opzioni del provider

- `channels.twitch.enabled` - Abilita o disabilita l'avvio del canale
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - Configurazione semplificata per un singolo account (account `default` implicito; ha la precedenza su `accounts.default`)
- `channels.twitch.accounts.<accountName>` - Configurazione multi-account (tutti i campi dell'account indicati sopra)
- `channels.twitch.defaultAccount` - Nome dell'account predefinito
- `channels.twitch.markdown.tables` - Modalità di rendering delle tabelle Markdown (`off` | `bullets` | `code` | `block`)

Esempio completo:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Azioni degli strumenti

L'agente può inviare messaggi Twitch tramite l'azione `send` dello strumento di messaggistica:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` è facoltativo e usa come valore predefinito il `channel` configurato per l'account.

## Sicurezza e operatività

- **Tratta i token come password**: non eseguire mai il commit dei token in git.
- **Usa l'aggiornamento automatico del token** per i bot in esecuzione prolungata.
- **Usa elenchi di autorizzazione degli ID utente** anziché nomi utente per il controllo degli accessi.
- **Monitora i registri** per gli eventi di aggiornamento del token e lo stato della connessione.
- **Riduci al minimo gli ambiti dei token**: richiedi solo `chat:read` e `chat:write`.
- **In caso di blocco**: riavvia il Gateway dopo aver verificato che nessun altro processo sia proprietario della sessione.

## Limiti

- **500 caratteri** per messaggio; le risposte più lunghe vengono suddivise in corrispondenza dei confini tra parole.
- Markdown viene rimosso prima dell'invio (la chat di Twitch usa testo normale; le interruzioni di riga diventano spazi).
- OpenClaw non aggiunge una propria limitazione della frequenza; il client di chat Twurple gestisce i limiti di frequenza di Twitch.

## Argomenti correlati

- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e vincolo della menzione
- [Associazione](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di associazione
- [Sicurezza](/it/gateway/security) — modello di accesso e protezione avanzata
