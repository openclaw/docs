---
read_when:
    - Configurazione di Slack o risoluzione dei problemi relativi alla modalità socket, HTTP o relay di Slack
summary: Configurazione di Slack e comportamento in fase di esecuzione (Socket Mode, URL delle richieste HTTP e modalità relay)
title: Slack
x-i18n:
    generated_at: "2026-07-16T13:54:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Il supporto per Slack include i messaggi diretti e i canali tramite integrazioni con app Slack. Il trasporto predefinito è Socket Mode; sono supportati anche gli URL delle richieste HTTP. La modalità relay è destinata alle distribuzioni gestite in cui un router attendibile gestisce l'ingresso da Slack.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Per impostazione predefinita, i messaggi diretti di Slack usano la modalità di associazione.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Procedure diagnostiche e di riparazione comuni a più canali.
  </Card>
</CardGroup>

## Scelta del trasporto

Socket Mode e gli URL delle richieste HTTP offrono le stesse funzionalità per messaggistica, comandi slash, App Home e interattività. La scelta deve basarsi sul tipo di distribuzione, non sulle funzionalità.

| Aspetto                      | Socket Mode (predefinito)                                                                                                                                | URL delle richieste HTTP                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL pubblico del Gateway           | Non richiesto                                                                                                                                         | Richiesto (DNS, TLS, proxy inverso o tunnel)                                                                   |
| Rete in uscita             | Il WSS in uscita verso `wss-primary.slack.com` deve essere raggiungibile                                                                                            | Nessun WS in uscita; solo HTTPS in ingresso                                                                             |
| Token necessari                | Token del bot + token a livello di app con `connections:write`                                                                                                 | Token del bot + Signing Secret                                                                                     |
| Portatile di sviluppo / dietro un firewall | Funziona senza modifiche                                                                                                                                          | Richiede un tunnel pubblico (ngrok, Cloudflare Tunnel, Tailscale Funnel) o un Gateway di staging                          |
| Scalabilità orizzontale           | Una sessione Socket Mode per app e per host; più Gateway richiedono app Slack separate                                                                 | Gestore POST senza stato; più repliche del Gateway possono condividere un'app dietro un bilanciatore del carico                     |
| Più account su un Gateway | Supportato; ogni account apre il proprio WS                                                                                                             | Supportato; ogni account richiede un `webhookPath` univoco (predefinito `/slack/events`) affinché le registrazioni non entrino in conflitto |
| Trasporto dei comandi slash      | Recapitati tramite la connessione WS; `slash_commands[].url` viene ignorato                                                                                  | Slack invia richieste POST a `slash_commands[].url`; il campo è obbligatorio per inoltrare il comando                           |
| Firma delle richieste              | Non utilizzata (l'autenticazione avviene tramite il token a livello di app)                                                                                                               | Slack firma ogni richiesta; OpenClaw esegue la verifica con `signingSecret`                                              |
| Ripristino in caso di interruzione della connessione  | La riconnessione automatica dell'SDK Slack è abilitata; OpenClaw riavvia inoltre le sessioni Socket Mode non riuscite con un backoff limitato. Si applica la configurazione del trasporto relativa al timeout del pong. | Nessuna connessione persistente soggetta a interruzioni; i nuovi tentativi vengono effettuati da Slack per ogni richiesta                                           |

<Note>
  **Scegliere Socket Mode** per host con un singolo Gateway, portatili di sviluppo e reti locali che possono raggiungere `*.slack.com` in uscita ma non possono accettare HTTPS in ingresso.

**Scegliere gli URL delle richieste HTTP** quando si eseguono più repliche del Gateway dietro un bilanciatore del carico, quando il WSS in uscita è bloccato ma l'HTTPS in ingresso è consentito oppure quando i webhook di Slack vengono già terminati presso un proxy inverso.
</Note>

<Warning>
  Slack può mantenere più connessioni Socket Mode per una singola app e può recapitare ciascun payload a qualsiasi connessione. Gateway OpenClaw separati che condividono un'app Slack richiedono quindi configurazioni equivalenti di instradamento e autorizzazione. In caso contrario, utilizzare un'app Slack separata per ogni Gateway, un singolo ingresso relay oppure gli URL delle richieste HTTP dietro un bilanciatore del carico. Consultare [Utilizzo di Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Modalità relay

La modalità relay separa l'ingresso da Slack dal Gateway OpenClaw. Un router attendibile gestisce l'unica connessione Slack Socket Mode, sceglie un Gateway di destinazione e inoltra un evento tipizzato tramite un websocket autenticato. Il Gateway continua a utilizzare il proprio token del bot per le chiamate in uscita all'API Web di Slack.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

L'URL del relay deve utilizzare `wss://`, a meno che non sia destinato a localhost. Il token bearer e la tabella di instradamento del router devono essere considerati parte del confine di autorizzazione di Slack: gli eventi instradati entrano nel normale gestore dei messaggi Slack come attivazioni autorizzate. Un `slack_identity` fornito dal router nel frame websocket `hello` può impostare il nome utente e l'icona predefiniti per l'uscita; un'identità esplicita fornita dal chiamante mantiene comunque la precedenza. La connessione relay si riconnette con gli stessi intervalli di backoff limitato di Socket Mode e cancella l'identità fornita dal router ogni volta che si disconnette.

### Installazioni a livello di organizzazione Enterprise Grid

Un singolo account Slack può ricevere messaggi da ogni area di lavoro inclusa in
un'installazione Enterprise Grid a livello di organizzazione. Scegliere Socket Mode diretto o gli URL
delle richieste HTTP; la modalità relay non è supportata per gli account aziendali. Entrambi
i manifest con privilegi minimi riportati di seguito abilitano solo il percorso degli eventi V1 `message` e `app_mention`,
le risposte immediate e le reazioni di stato gestite dal listener.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connettore Slack per OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Un amministratore o proprietario dell'organizzazione Enterprise Grid deve approvare l'app, installarla a
livello di organizzazione e scegliere le aree di lavoro incluse nell'installazione.
Prima di avviare OpenClaw, verificare che l'app sia disponibile in tutte le aree di lavoro
previste. Generare un token a livello di app con `connections:write` per Socket Mode,
quindi copiare il token del bot dall'installazione dell'organizzazione. Configurare l'account che
utilizza il token del bot installato a livello di organizzazione:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### URL delle richieste HTTP

Utilizzare la modalità HTTP quando il Gateway dispone di un endpoint HTTPS pubblico e non apre una
connessione Socket Mode. Sostituire l'URL di esempio con l'URL pubblico
`webhookPath` del Gateway (predefinito `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connettore Slack per OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Un amministratore o proprietario dell'organizzazione Enterprise Grid deve approvare l'app, installarla a
livello di organizzazione e scegliere le aree di lavoro incluse nell'installazione.
Dopo che Slack ha verificato il Request URL, copiare il token del bot dell'installazione dell'organizzazione e
il **Basic Information -> App Credentials -> Signing Secret** dell'app. Configurare
l'account aziendale con lo stesso percorso del Request URL:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

All'avvio, OpenClaw verifica `enterpriseOrgInstall` tramite `auth.test` di Slack.
Un token installato a livello di organizzazione senza il flag, oppure un token dell'area di lavoro con il flag,
causa il mancato avvio. Slack rimane la fonte autorevole per determinare quali aree di lavoro hanno
concesso l'installazione; OpenClaw applica quindi i criteri configurati per canali, utenti,
messaggi diretti e menzioni a ciascun evento recapitato. Enterprise V1 rifiuta tutti gli eventi
`message` e `app_mention` creati dai bot prima dell'inoltro, indipendentemente da
`allowBots`, poiché le installazioni a livello di organizzazione non forniscono un'identità del bot stabile
e qualificata per area di lavoro per prevenire i cicli.

Il supporto aziendale è intenzionalmente limitato agli eventi diretti Socket Mode o HTTP
`message` e `app_mention` e alle relative risposte immediate. La modalità relay,
i comandi slash, le interazioni, App Home, i listener degli eventi di reazione, gli elementi fissati, gli
strumenti di azione Slack, le approvazioni native di Slack, le associazioni, la consegna in coda o pianificata
e gli invii proattivi non sono disponibili per un account aziendale. Le reazioni di
conferma, digitazione e stato in uscita sono supportate tramite il client Slack
gestito dal listener e richiedono `reactions:write`; le notifiche delle reazioni
in ingresso e gli strumenti di azione per le reazioni rimangono non disponibili.

Le risposte immediate riutilizzano il comportamento standard di recapito di Slack per blocchi,
contenuti multimediali, metadati, ripiego dell'identità, anteprime dei link e conferme di ricezione, ma solo finché il
client convalidato di proprietà del listener rimane nel turno dell'evento attivo. La
coda di invio in memoria e i record di partecipazione ai thread sono partizionati in base allo
spazio di lavoro dell'evento; il client stesso non viene mai serializzato né reso persistente.

Le chiavi dei criteri dei canali e le voci `dm.groupChannels` devono utilizzare ID di canale Slack stabili non elaborati oppure il
formato `channel:<id>`. OpenClaw normalizza entrambi i formati nell'ID di canale non elaborato per la
corrispondenza in fase di esecuzione; i prefissi `slack:`, `group:` e `mpim:` impediscono l'avvio.
Le voci dei criteri utente devono utilizzare ID utente Slack stabili; nomi, slug, nomi visualizzati
e indirizzi email impediscono l'avvio. Gli ID devono utilizzare il prefisso e il corpo canonici in maiuscolo di Slack
(ad esempio, `C0123456789` o `U0123456789`); le varianti in minuscolo e
le forme abbreviate simili impediscono l'avvio. Gli account Enterprise non possono abilitare
`dangerouslyAllowNameMatching`. Gli account Enterprise possono impostare il valore globale
`mentionPatterns.mode`, ma `mentionPatterns.allowIn` e
`mentionPatterns.denyIn` impediscono l'avvio perché gli ID di canale Slack semplici non sono
qualificati per spazio di lavoro e possono essere riutilizzati in spazi di lavoro diversi. Le installazioni nello spazio di lavoro
mantengono il comportamento esistente dei modelli di menzione con ambito. Ogni spazio di lavoro accettato
ottiene identità separate per instradamento, sessione, trascrizione, deduplicazione, cronologia e cache,
anche quando gli ID Slack coincidono. Nel flusso `message` sono supportati i normali messaggi utente
e gli eventi `file_share` creati dagli utenti; gli altri sottotipi di messaggio vengono
rifiutati prima dell'autorizzazione o della gestione degli eventi di sistema.

I messaggi diretti Enterprise devono essere disabilitati (`dm.enabled=false` o
`dmPolicy="disabled"`) oppure esplicitamente aperti con `dmPolicy="open"` e
un valore effettivo dell'account `allowFrom` contenente il valore letterale `"*"`. Un elenco di elementi consentiti vuoto
o ID specifici degli utenti senza `"*"` impediscono l'avvio. L'associazione e
gli elenchi di utenti consentiti per i messaggi diretti vengono rifiutati perché gli ID utente Slack non sono
qualificati per spazio di lavoro in tali archivi di autorizzazione. I criteri relativi al canale e al mittente
continuano ad applicarsi ai messaggi dei canali.

## Installazione

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registra e abilita il plugin. Non esegue alcuna operazione finché non vengono configurate l'app Slack e le impostazioni dei canali riportate di seguito. Consultare [Plugin](/it/tools/plugin) per le regole generali di installazione dei plugin.

## Configurazione rapida

I manifesti di questa sezione creano un'installazione con ambito limitato allo spazio di lavoro. Per
un'installazione nell'intera organizzazione Enterprise Grid, utilizzare invece il
[manifesto e flusso di lavoro dedicati per l'intera organizzazione](#enterprise-grid-org-wide-installs).

<Tabs>
  <Tab title="Modalità Socket (predefinita)">
    <Steps>
      <Step title="Creare una nuova app Slack">
        Aprire [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selezionare lo spazio di lavoro → incollare uno dei manifesti riportati di seguito → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connettore Slack per OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw collega i thread dell'assistente Slack agli agenti OpenClaw.",
      "suggested_prompts": [
        { "title": "Che cosa sai fare?", "message": "In che cosa puoi aiutarmi?" },
        {
          "title": "Riassumi questo canale",
          "message": "Riassumi l'attività recente in questo canale."
        },
        { "title": "Prepara una risposta", "message": "Aiutami a preparare una risposta." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Invia un messaggio a OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connettore Slack per OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw collega i thread dell'assistente Slack agli agenti OpenClaw.",
      "suggested_prompts": [
        { "title": "Che cosa sai fare?", "message": "In che cosa puoi aiutarmi?" },
        {
          "title": "Riassumi questo canale",
          "message": "Riassumi l'attività recente in questo canale."
        },
        { "title": "Prepara una risposta", "message": "Aiutami a preparare una risposta." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Invia un messaggio a OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** corrisponde al set completo di funzionalità del plugin Slack: App Home, comandi slash, file, reazioni, elementi fissati, messaggi diretti di gruppo e lettura di emoji/gruppi di utenti. Scegliere **Minimal** quando i criteri dello spazio di lavoro limitano gli ambiti: copre i messaggi diretti, la cronologia dei canali/gruppi, le menzioni e i comandi slash, ma esclude file, reazioni, elementi fissati, messaggi diretti di gruppo (`mpim:*`), `emoji:read` e `usergroups:read`. Consultare [Elenco di controllo del manifesto e degli ambiti](#manifest-and-scope-checklist) per la motivazione di ciascun ambito e le opzioni aggiuntive, come ulteriori comandi slash.
        </Note>

        Dopo che Slack ha creato l'app:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: aggiungere `connections:write`, salvare e copiare l'App-Level Token.
        - **Install App -> Install to Workspace**: copiare il Bot User OAuth Token.

      </Step>

      <Step title="Configurare OpenClaw">

        Configurazione SecretRef consigliata:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Ripiego sulle variabili di ambiente (solo account predefinito):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Avviare il Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL delle richieste HTTP">
    <Steps>
      <Step title="Creare una nuova app Slack">
        Aprire [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selezionare lo spazio di lavoro → incollare uno dei manifesti riportati di seguito → sostituire `https://gateway-host.example.com/slack/events` con l'URL pubblico del Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connettore Slack per OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw collega i thread dell'assistente Slack agli agenti OpenClaw.",
      "suggested_prompts": [
        { "title": "Che cosa sai fare?", "message": "In che cosa puoi aiutarmi?" },
        {
          "title": "Riassumi questo canale",
          "message": "Riassumi l'attività recente in questo canale."
        },
        { "title": "Prepara una risposta", "message": "Aiutami a preparare una risposta." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Invia un messaggio a OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connettore Slack per OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw collega i thread dell'assistente Slack agli agenti OpenClaw.",
      "suggested_prompts": [
        { "title": "Che cosa puoi fare?", "message": "In che cosa puoi aiutarmi?" },
        {
          "title": "Riassumi questo canale",
          "message": "Riassumi l'attività recente in questo canale."
        },
        { "title": "Prepara una risposta", "message": "Aiutami a preparare una risposta." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Invia un messaggio a OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Consigliato** corrisponde al set completo di funzionalità del plugin Slack; **Minimo** esclude file, reazioni, elementi fissati, messaggi diretti di gruppo (`mpim:*`), `emoji:read` e `usergroups:read` per gli spazi di lavoro con restrizioni. Consultare l'[elenco di controllo del manifesto e degli ambiti](#manifest-and-scope-checklist) per la motivazione di ciascun ambito.
        </Note>

        <Info>
          I tre campi URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) puntano tutti allo stesso endpoint OpenClaw. Lo schema del manifesto di Slack richiede che abbiano nomi distinti, ma OpenClaw instrada in base al tipo di payload, quindi è sufficiente un solo `webhookPath` (valore predefinito `/slack/events`). I comandi slash senza `slash_commands[].url` non eseguono silenziosamente alcuna operazione in modalità HTTP.
        </Info>

        Dopo che Slack ha creato l'app:

        - **Basic Information → App Credentials**: copiare il **Signing Secret** per la verifica delle richieste.
        - **Install App -> Install to Workspace**: copiare il Bot User OAuth Token.

      </Step>

      <Step title="Configurare OpenClaw">

        Configurazione SecretRef consigliata:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Utilizzare percorsi Webhook univoci per HTTP con più account

        Assegnare a ogni account un `webhookPath` distinto (valore predefinito `/slack/events`) affinché le registrazioni non entrino in conflitto.
        </Note>

      </Step>

      <Step title="Avviare il Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ottimizzazione del trasporto in modalità Socket

Per impostazione predefinita, OpenClaw configura su 15 secondi il timeout pong del client SDK Slack per la modalità Socket. Modificare le impostazioni di trasporto solo quando è necessaria un'ottimizzazione specifica per lo spazio di lavoro o l'host:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Utilizzare questa configurazione solo per gli spazi di lavoro in modalità Socket che registrano timeout del pong websocket o del ping del server Slack oppure che sono eseguiti su host con una nota saturazione del ciclo degli eventi. `clientPingTimeout` è il tempo di attesa del pong dopo l'invio di un ping client da parte dell'SDK; `serverPingTimeout` è il tempo di attesa dei ping del server Slack. I messaggi e gli eventi dell'app rimangono stato dell'applicazione, non segnali di attività del trasporto.

Note:

- `socketMode` viene ignorato nella modalità URL di richiesta HTTP.
- Le impostazioni `channels.slack.socketMode` di base si applicano a tutti gli account Slack, salvo sostituzioni. Le sostituzioni per account utilizzano `channels.slack.accounts.<accountId>.socketMode`; poiché si tratta della sostituzione di un oggetto, includere tutti i campi di ottimizzazione del socket desiderati per tale account.
- Solo `clientPingTimeout` dispone di un valore predefinito OpenClaw (`15000`). `serverPingTimeout` e `pingPongLoggingEnabled` vengono passati all'SDK Slack solo quando sono configurati.
- Il backoff per il riavvio della modalità Socket parte da circa 2 secondi e raggiunge un massimo di circa 30 secondi. Gli errori recuperabili di avvio, attesa dell'avvio e disconnessione vengono ritentati finché il canale non si arresta. Gli errori permanenti relativi all'account e alle credenziali, come autenticazione non valida, token revocati o ambiti mancanti, causano immediatamente un errore anziché essere ritentati indefinitamente.

## Elenco di controllo del manifesto e degli ambiti

Il manifesto di base dell'app Slack è identico per la modalità Socket e per gli URL di richiesta HTTP. Cambiano solo il blocco `settings` e il valore `url` del comando slash.

Manifesto di base (modalità Socket predefinita):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connettore Slack per OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw collega i thread dell'assistente Slack agli agenti OpenClaw.",
      "suggested_prompts": [
        { "title": "Che cosa puoi fare?", "message": "In che cosa puoi aiutarmi?" },
        {
          "title": "Riassumi questo canale",
          "message": "Riassumi l'attività recente in questo canale."
        },
        { "title": "Prepara una risposta", "message": "Aiutami a preparare una risposta." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Invia un messaggio a OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Per la **modalità URL di richiesta HTTP**, sostituire `settings` con la variante HTTP e aggiungere `url` a ogni comando slash. È richiesto un URL pubblico:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Invia un messaggio a OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Impostazioni aggiuntive del manifesto

Rendono disponibili funzionalità diverse che estendono i valori predefiniti precedenti.

Il manifesto predefinito abilita la scheda **Home** della sezione App Home di Slack e sottoscrive `app_home_opened`. Quando un membro dello spazio di lavoro apre la scheda Home, OpenClaw pubblica una vista Home predefinita sicura con `views.publish`; non viene incluso alcun payload di conversazione né alcuna configurazione privata. Quando è abilitata la modalità con un singolo comando slash, il suggerimento del comando utilizza `channels.slack.slashCommand.name`; le installazioni che utilizzano comandi nativi o nessun comando slash omettono tale suggerimento. La scheda **Messages** rimane abilitata per i messaggi diretti di Slack. Il manifesto abilita inoltre i thread dell'assistente Slack con `features.assistant_view`, `assistant:write`, `assistant_thread_started` e `assistant_thread_context_changed`; i thread dell'assistente vengono instradati verso sessioni di thread OpenClaw dedicate e mantengono disponibile per l'agente il contesto del thread fornito da Slack.

<AccordionGroup>
  <Accordion title="Comandi slash nativi facoltativi">

    È possibile utilizzare più [comandi slash nativi](#commands-and-slash-behavior) anziché un singolo comando configurato, tenendo conto delle seguenti precisazioni:

    - Utilizzare `/agentstatus` anziché `/status`, perché il comando `/status` è riservato.
    - Su un'app Slack non è possibile registrare contemporaneamente più di 25 comandi slash (limite della piattaforma Slack).

    Sostituire la sezione `features.slash_commands` esistente con un sottoinsieme dei [comandi disponibili](/it/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Modalità Socket (predefinita)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Avvia una nuova sessione",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Reimposta la sessione corrente"
    },
    {
      "command": "/compact",
      "description": "Compatta il contesto della sessione",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Interrompe l'esecuzione corrente"
    },
    {
      "command": "/session",
      "description": "Gestisce la scadenza dell'associazione al thread",
      "usage_hint": "inattività <duration|off> o età massima <duration|off>"
    },
    {
      "command": "/think",
      "description": "Imposta il livello di elaborazione",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Attiva o disattiva l'output dettagliato",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Mostra o imposta la modalità rapida",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Attiva o disattiva la visibilità del ragionamento",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Attiva o disattiva la modalità con privilegi elevati",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Mostra o imposta i valori predefiniti di esecuzione",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Approva o rifiuta le richieste di approvazione in sospeso",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Mostra o imposta il modello",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Elenca provider/modelli",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Mostra il riepilogo breve della guida"
    },
    {
      "command": "/commands",
      "description": "Mostra il catalogo dei comandi generato"
    },
    {
      "command": "/tools",
      "description": "Mostra ciò che l'agente corrente può utilizzare in questo momento",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Mostra lo stato del runtime, incluso l'utilizzo/la quota del provider quando disponibile"
    },
    {
      "command": "/tasks",
      "description": "Elenca le attività in background attive/recenti per la sessione corrente"
    },
    {
      "command": "/context",
      "description": "Spiega come viene assemblato il contesto",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Mostra l'identità del mittente"
    },
    {
      "command": "/skill",
      "description": "Esegue una skill in base al nome",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Pone una domanda secondaria senza modificare il contesto della sessione",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Pone una domanda secondaria senza modificare il contesto della sessione",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Controlla il piè di pagina sull'utilizzo o mostra il riepilogo dei costi",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL delle richieste HTTP">
        Utilizzare lo stesso elenco `slash_commands` della modalità Socket riportata sopra e aggiungere `"url": "https://gateway-host.example.com/slack/events"` a ogni voce. Esempio:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Avvia una nuova sessione",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Mostra il riepilogo breve della guida",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Ripetere tale valore `url` per ogni comando nell'elenco.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Ambiti di attribuzione facoltativi (operazioni di scrittura)">
    Aggiungere l'ambito del bot `chat:write.customize` se si desidera che i messaggi in uscita utilizzino l'identità dell'agente attivo (nome utente e icona personalizzati) anziché l'identità predefinita dell'app Slack.

    Se si utilizza un'icona emoji, Slack richiede la sintassi `:emoji_name:`.

  </Accordion>
  <Accordion title="Ambiti facoltativi del token utente (operazioni di lettura)">
    Se si configura `channels.slack.userToken`, gli ambiti di lettura tipici sono:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se si dipende dalle letture di ricerca di Slack)

  </Accordion>
</AccordionGroup>

## Modello dei token

- `botToken` + `appToken` sono obbligatori per la modalità Socket.
- La modalità HTTP richiede `botToken` + `signingSecret`.
- La modalità relay richiede `botToken` oltre a `relay.url`, `relay.authToken` e `relay.gatewayId`; non utilizza un token dell'app né un segreto di firma.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` e `userToken` accettano stringhe
  di testo normale oppure oggetti SecretRef.
- I token di configurazione hanno la precedenza sui valori di ripiego dell'ambiente.
- I valori di ripiego dell'ambiente `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` e `SLACK_USER_TOKEN` si applicano ciascuno soltanto all'account predefinito.
- `userToken` adotta per impostazione predefinita un comportamento di sola lettura (`userTokenReadOnly: true`).

Comportamento dell'istantanea di stato:

- L'ispezione dell'account Slack tiene traccia dei campi `*Source` e `*Status`
  per ciascuna credenziale (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Lo stato è `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` indica che l'account è configurato tramite SecretRef
  o un'altra origine di segreti non incorporata, ma il percorso corrente del comando/runtime
  non è riuscito a risolvere il valore effettivo.
- In modalità HTTP è incluso `signingSecretStatus`; in modalità Socket, la
  coppia obbligatoria è `botTokenStatus` + `appTokenStatus`.

<Tip>
Per le azioni/letture della directory, il token utente può avere la precedenza quando è configurato. Per le scritture, il token del bot mantiene la precedenza; le scritture tramite token utente sono consentite soltanto quando `userTokenReadOnly: false` e il token del bot non è disponibile.
</Tip>

## Azioni e controlli

Le azioni Slack sono controllate da `channels.slack.actions.*`.

Gruppi di azioni disponibili negli strumenti Slack correnti:

| Gruppo     | Predefinito |
| ---------- | ----------- |
| messages   | abilitato   |
| reactions  | abilitato   |
| pins       | abilitato   |
| memberInfo | abilitato   |
| emojiList  | abilitato   |

Le azioni correnti sui messaggi Slack includono `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` e `emoji-list`. `download-file` accetta gli ID dei file Slack mostrati nei segnaposto dei file in entrata e restituisce anteprime per le immagini oppure metadati dei file locali per gli altri tipi di file.

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="Criterio per i messaggi diretti">
    `channels.slack.dmPolicy` controlla l'accesso ai messaggi diretti. `channels.slack.allowFrom` è l'elenco consentiti canonico per i messaggi diretti.

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.slack.allowFrom` includa `"*"`)
    - `disabled`

    Flag dei messaggi diretti:

    - `dm.enabled` (valore predefinito: true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (valore predefinito per i messaggi diretti di gruppo: false)
    - `dm.groupChannels` (elenco consentiti MPIM facoltativo)

    Precedenza con più account:

    - `channels.slack.accounts.default.allowFrom` si applica soltanto all'account `default`.
    - Gli account denominati ereditano `channels.slack.allowFrom` quando il proprio `allowFrom` non è impostato.
    - Gli account denominati non ereditano `channels.slack.accounts.default.allowFrom`.

    I valori legacy `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` vengono ancora letti per compatibilità. `openclaw doctor --fix` li migra a `dmPolicy` e `allowFrom` quando può farlo senza modificare l'accesso.

    L'associazione nei messaggi diretti utilizza `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Criterio per i canali">
    `channels.slack.groupPolicy` controlla la gestione dei canali:

    - `open`
    - `allowlist`
    - `disabled`

    L'elenco consentiti dei canali si trova sotto `channels.slack.channels` e **deve utilizzare ID stabili dei canali Slack** (ad esempio `C12345678`) come chiavi di configurazione.

    Nota sul runtime: se `channels.slack` è completamente assente (configurazione basata soltanto sull'ambiente), il runtime ripiega su `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Risoluzione di nomi/ID:

    - le voci dell'elenco consentiti dei canali e quelle dell'elenco consentiti dei messaggi diretti vengono risolte all'avvio quando l'accesso al token lo consente
    - le voci con nomi di canali non risolti vengono mantenute come configurate, ma per impostazione predefinita vengono ignorate ai fini dell'instradamento
    - per impostazione predefinita, l'autorizzazione in entrata e l'instradamento dei canali privilegiano gli ID; la corrispondenza diretta di nome utente/slug richiede `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Le chiavi basate sul nome (`#channel-name` o `channel-name`) **non** corrispondono con `groupPolicy: "allowlist"`. Per impostazione predefinita, la ricerca del canale privilegia l'ID, pertanto una chiave basata sul nome non verrà mai instradata correttamente e tutti i messaggi di tale canale verranno bloccati senza alcuna segnalazione. Questo comportamento differisce da `groupPolicy: "open"`, dove la chiave del canale non è necessaria per l'instradamento e una chiave basata sul nome sembra funzionare.

    Utilizzare sempre l'ID del canale Slack come chiave. Per trovarlo: fare clic con il pulsante destro del mouse sul canale in Slack → **Copy link** — l'ID (`C...`) appare alla fine dell'URL.

    Corretto:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    Errato (bloccato senza alcuna segnalazione con `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Menzioni e utenti dei canali">
    Per impostazione predefinita, i messaggi dei canali richiedono una menzione.

    Origini delle menzioni:

    - menzione esplicita dell'app (`<@botId>`)
    - menzione di un gruppo di utenti Slack (`<!subteam^S...>`) quando l'utente bot è membro di tale gruppo di utenti; richiede `usergroups:read`
    - modelli regex per le menzioni (`agents.list[].groupChat.mentionPatterns`, valore di ripiego `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta al thread del bot (disabilitato quando `thread.requireExplicitMention` è `true`)

    Controlli per canale (`channels.slack.channels.<id>`; nomi soltanto tramite risoluzione all'avvio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; sostituisce la modalità di risposta dell'account/tipo di chat per questo canale)
    - `users` (elenco consentiti)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato della chiave `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` oppure il carattere jolly `"*"`
      (le chiavi legacy senza prefisso continuano a essere associate soltanto a `id:`)

    `ignoreOtherMentions` (valore predefinito `false`) scarta i messaggi del canale che menzionano un altro utente o gruppo di utenti, ma non questo bot. I DM e i DM di gruppo (MPIM) non sono interessati. Il filtro richiede un ID utente del bot risolto da `auth.test`; se tale identità non è disponibile (ad esempio, un'identità basata esclusivamente su token utente), il controllo resta aperto e i messaggi vengono inoltrati senza modifiche.

    `allowBots` adotta un comportamento conservativo per i canali pubblici e privati: i messaggi nella stanza creati da bot vengono accettati solo quando il bot mittente è elencato esplicitamente nella lista consentita `users` della stanza, oppure quando almeno un ID proprietario Slack esplicito da `channels.slack.allowFrom` appartiene attualmente alla stanza. I caratteri jolly e le voci dei proprietari basate sul nome visualizzato non soddisfano il requisito di presenza del proprietario. La presenza del proprietario usa `conversations.members` di Slack; assicurarsi che l'app disponga dell'ambito di lettura corrispondente al tipo di stanza (`channels:read` per i canali pubblici, `groups:read` per quelli privati). Se la ricerca dei membri non riesce, OpenClaw scarta il messaggio nella stanza creato dal bot.

    I messaggi Slack accettati e creati da bot usano la [protezione condivisa dai loop dei bot](/it/channels/bot-loop-protection). Configurare `channels.defaults.botLoopProtection` per il limite predefinito, quindi sostituirlo con `channels.slack.botLoopProtection` o `channels.slack.channels.<id>.botLoopProtection` quando uno spazio di lavoro o un canale richiede un limite diverso.

  </Tab>
</Tabs>

## Thread, sessioni e tag di risposta

- I DM vengono instradati come `direct`; i canali come `channel`; gli MPIM come `group`.
- Le associazioni di instradamento Slack accettano ID peer non elaborati e formati di destinazione Slack come `channel:C12345678`, `user:U12345678` e `<@U12345678>`.
- Con il valore predefinito `session.dmScope=main`, i DM di Slack confluiscono nella sessione principale dell'agente.
- Sessioni dei canali: `agent:<agentId>:slack:channel:<channelId>`.
- I normali messaggi di primo livello nei canali rimangono nella sessione specifica del canale, anche quando `replyToMode` è diverso da `off`.
- Le risposte nei thread di Slack usano il valore `thread_ts` del messaggio Slack padre per i suffissi delle sessioni (`:thread:<threadTs>`), anche quando i thread delle risposte in uscita sono disabilitati tramite `replyToMode="off"`.
- OpenClaw inizializza una radice di canale di primo livello idonea in `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` quando si prevede che tale radice avvii un thread Slack visibile, in modo che la radice e le successive risposte nel thread condividano un'unica sessione OpenClaw. Ciò si applica agli eventi `app_mention`, alle corrispondenze esplicite con il bot o con i modelli di menzione configurati e ai canali `requireMention: false` con `replyToMode` diverso da `off`.
- Il valore predefinito di `channels.slack.thread.historyScope` è `thread`; il valore predefinito di `thread.inheritParent` è `false`.
- `channels.slack.thread.initialHistoryLimit` controlla quanti messaggi esistenti del thread vengono recuperati all'avvio di una nuova sessione del thread (valore predefinito `20`; impostare `0` per disabilitare).
- `channels.slack.thread.requireExplicitMention` (valore predefinito `false`): quando è impostato su `true`, elimina le menzioni implicite nei thread, in modo che il bot risponda solo alle menzioni esplicite `@bot` all'interno dei thread, anche se ha già partecipato al thread. Senza questa opzione, le risposte in un thread a cui ha partecipato il bot ignorano il controllo `requireMention`.

Controlli dei thread delle risposte:

- `channels.slack.channels.<id>.replyToMode`: sostituzione specifica per canale per i messaggi nei canali pubblici e privati di Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (valore predefinito `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- ripiego legacy per le chat dirette: `channels.slack.dm.replyToMode`

Sono supportati i tag di risposta manuali:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Per le risposte esplicite nei thread di Slack inviate dallo strumento `message`, impostare `replyBroadcast: true` con `action: "send"` e `threadId` oppure `replyTo` per chiedere a Slack di trasmettere la risposta del thread anche nel canale padre. Ciò corrisponde al flag `reply_broadcast` di `chat.postMessage` in Slack ed è supportato solo per gli invii di testo o Block Kit, non per i caricamenti multimediali.

Quando una chiamata allo strumento `message` viene eseguita all'interno di un thread Slack e ha come destinazione lo stesso canale, OpenClaw normalmente eredita il thread Slack corrente in base al valore effettivo `replyToMode` dell'account, del tipo di chat o specifico del canale. Le risposte automatiche e le chiamate `send` o `upload-file` nello stesso canale usano la stessa sostituzione specifica del canale. Impostare `topLevel: true` su `action: "send"` o `action: "upload-file"` per forzare un nuovo messaggio nel canale padre. Anche `threadId: null` è accettato come esclusione equivalente di primo livello.

<Note>
`replyToMode="off"` disabilita i thread delle risposte Slack in uscita, inclusi i tag espliciti `[[reply_to_*]]`. Non appiattisce le sessioni dei thread Slack in entrata: i messaggi già pubblicati all'interno di un thread Slack continuano a essere instradati alla sessione `:thread:<threadTs>`. Questo comportamento è diverso da Telegram, dove i tag espliciti vengono comunque rispettati in modalità `"off"`. I thread Slack nascondono i messaggi dal canale, mentre le risposte di Telegram rimangono visibili in linea.
</Note>

## Reazioni di conferma

`ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in entrata. `ackReactionScope` determina _quando_ tale emoji viene effettivamente inviata.

Per impostazione predefinita, la conferma rimane statica mentre lo stato nativo del thread dell'assistente Slack mostra l'avanzamento tramite messaggi di caricamento a rotazione. Impostare `messages.statusReactions.enabled: true` per attivare invece il ciclo di vita delle reazioni in coda/elaborazione/strumento/completamento/errore.

### Emoji (`ackReaction`)

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- ripiego sull'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti `"eyes"` / 👀)

Note:

- Slack richiede codici brevi (ad esempio `"eyes"`).
- Usare `""` per disabilitare la reazione per l'account Slack o globalmente.

### Ambito (`messages.ackReactionScope`)

Il provider Slack legge l'ambito da `messages.ackReactionScope` (valore predefinito `"group-mentions"`). Attualmente non esiste una sostituzione a livello di account o canale Slack; il valore è globale per il Gateway.

Valori:

- `"all"`: reagisce nei DM e nei gruppi, inclusi gli eventi ambientali delle stanze.
- `"direct"`: reagisce solo nei DM.
- `"group-all"`: reagisce a ogni messaggio di gruppo, eccetto gli eventi ambientali delle stanze (nessun DM).
- `"group-mentions"` (valore predefinito): reagisce nei gruppi, ma solo quando il bot viene menzionato (o nei gruppi menzionabili che hanno aderito). **I DM sono esclusi.**
- `"off"` / `"none"`: non reagisce mai.

<Note>
L'ambito predefinito (`"group-mentions"`) non attiva le reazioni di conferma nei messaggi diretti o negli eventi ambientali delle stanze. Per visualizzare il valore `ackReaction` configurato (ad esempio `"eyes"`) nei DM Slack in entrata e negli eventi silenziosi delle stanze, impostare `messages.ackReactionScope` su `"all"`. `messages.ackReactionScope` viene letto all'avvio del provider Slack, quindi è necessario riavviare il Gateway affinché la modifica abbia effetto.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // reagisce nei DM e nei gruppi
  },
}
```

## Streaming del testo

`channels.slack.streaming` controlla il comportamento dell'anteprima in tempo reale:

- `off`: disabilita lo streaming dell'anteprima in tempo reale.
- `partial` (valore predefinito): sostituisce il testo dell'anteprima con l'output parziale più recente.
- `block`: aggiunge gli aggiornamenti dell'anteprima in segmenti.
- `progress`: mostra il testo sullo stato di avanzamento durante la generazione, quindi invia il testo finale.
- `streaming.preview.toolProgress`: quando l'anteprima della bozza è attiva, instrada gli aggiornamenti degli strumenti e dell'avanzamento nello stesso messaggio di anteprima modificato (valore predefinito: `true`). Impostare `false` per mantenere separati i messaggi degli strumenti e dell'avanzamento.
- `streaming.preview.commandText` / `streaming.progress.commandText`: impostare su `status` per mantenere righe compatte sullo stato degli strumenti nascondendo il testo non elaborato dei comandi e delle esecuzioni (valore predefinito: `raw`).

Nascondere il testo non elaborato dei comandi e delle esecuzioni mantenendo righe di avanzamento compatte:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` controlla lo streaming di testo nativo di Slack quando `channels.slack.streaming.mode` è `partial` (valore predefinito: `true`).

Le schede attività di avanzamento native di Slack sono facoltative per la modalità di avanzamento. Impostare `channels.slack.streaming.progress.nativeTaskCards` su `true` con `channels.slack.streaming.mode="progress"` per inviare una scheda piano/attività nativa di Slack durante l'esecuzione del lavoro, quindi aggiornare la stessa scheda al completamento. Senza questo flag, la modalità di avanzamento mantiene il comportamento portabile dell'anteprima della bozza.

- Per visualizzare lo streaming di testo nativo e lo stato del thread dell'assistente Slack, deve essere disponibile un thread di risposta. La selezione del thread continua a seguire `replyToMode`.
- Le radici dei canali, delle chat di gruppo e dei DM di primo livello possono comunque usare la normale anteprima della bozza quando lo streaming nativo non è disponibile o non esiste alcun thread di risposta.
- I DM Slack di primo livello rimangono fuori dai thread per impostazione predefinita, quindi non mostrano l'anteprima dello streaming o dello stato nativo in stile thread di Slack; OpenClaw pubblica e modifica invece un'anteprima della bozza nel DM.
- I contenuti multimediali e i payload non testuali ricorrono alla normale consegna.
- I risultati finali multimediali o di errore annullano le modifiche dell'anteprima in sospeso; i risultati finali di testo o blocchi idonei vengono completati solo quando possono modificare direttamente l'anteprima.
- Se lo streaming non riesce durante una risposta, OpenClaw ricorre alla normale consegna per i payload rimanenti.

Usare l'anteprima della bozza anziché lo streaming di testo nativo di Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Attivare le schede attività di avanzamento native di Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Chiavi legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) è un alias legacy di `channels.slack.streaming.mode`.
- Il valore booleano `channels.slack.streaming` è un alias legacy di `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- `channels.slack.chunkMode` e `channels.slack.nativeStreaming` di primo livello sono alias legacy di `channels.slack.streaming.chunkMode` e `channels.slack.streaming.nativeTransport`.
- Gli alias legacy non vengono letti in fase di esecuzione; eseguire `openclaw doctor --fix` per riscrivere la configurazione persistente dello streaming Slack usando le chiavi canoniche.

## Ripiego sulla reazione di digitazione

`typingReaction` aggiunge una reazione temporanea al messaggio Slack in entrata mentre OpenClaw elabora una risposta, quindi la rimuove al termine dell'esecuzione. Ciò è particolarmente utile al di fuori delle risposte nei thread, che usano un indicatore di stato predefinito "is typing...".

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Note:

- Slack richiede codici brevi (ad esempio `"hourglass_flowing_sand"`).
- La reazione è basata sul massimo impegno possibile e la pulizia viene tentata automaticamente dopo il completamento della risposta o del percorso di errore.

## Input vocale

Attualmente, per parlare con OpenClaw in Slack, inviare un clip audio Slack all'app OpenClaw. Il microfono di dettatura di Slackbot è una funzionalità separata di proprietà di Slack, non un'API per le app.

- **La [dettatura vocale di Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** avviene all'interno della conversazione Slackbot privata dell'utente. Slack trasforma la registrazione in un prompt per Slackbot, ma non trasmette alle app Slack di terze parti, tramite l'Events API, alcun file audio, evento di dettatura, prompt o indicatore della sorgente di input. Il plugin Slack di OpenClaw non può abilitarla né riceverla.
- **I [clip audio di Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** sono file archiviati da Slack che possono essere pubblicati in un messaggio diretto, un canale o un thread di OpenClaw. OpenClaw scarica un clip accessibile con il token del bot, normalizza i metadati MIME del clip forniti da Slack e lo invia attraverso la [pipeline condivisa di trascrizione audio](/it/nodes/audio). Il manifesto dell'app consigliato include l'ambito `files:read` richiesto.

I clip audio e la dettatura di Slackbot hanno implicazioni diverse per la privacy: i clip seguono i criteri di conservazione dei file di Slack e OpenClaw li scarica per la trascrizione, mentre Slack dichiara che l'audio della dettatura non viene archiviato.

In un canale con `requireMention: true`, un clip audio senza didascalia può superare il controllo pronunciando un pattern di menzione configurato (`agents.list[].groupChat.mentionPatterns`, con ripiego su `messages.groupChat.mentionPatterns`). OpenClaw autorizza il mittente prima di scaricare o trascrivere il clip, quindi lo ammette solo quando la trascrizione corrisponde. Una trascrizione speculativa non riuscita o non corrispondente viene eliminata insieme al clip scaricato e non viene conservata nella cronologia del canale. L'identità Slack nativa `@bot` non può essere dedotta dalla voce, quindi occorre configurare un pattern per il nome pronunciato o includere una menzione digitata. Se l'eco della trascrizione è abilitata, viene inviato solo dopo l'ammissione.

## Contenuti multimediali, suddivisione e consegna

<AccordionGroup>
  <Accordion title="Allegati in entrata">
    Gli allegati di file Slack vengono scaricati dagli URL privati ospitati da Slack (flusso di richieste autenticato tramite token) e scritti nell'archivio multimediale quando il recupero riesce e i limiti di dimensione lo consentono. I segnaposto dei file includono l'elemento Slack `fileId`, in modo che gli agenti possano recuperare il file originale con `download-file`.

    I download utilizzano timeout limitati sia per l'inattività sia per la durata totale. Se il recupero del file da Slack si blocca o non riesce, OpenClaw continua a elaborare il messaggio e ripiega sul segnaposto del file.

    Il limite predefinito di runtime per le dimensioni in entrata è `20MB`, salvo sostituzione mediante `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Testo e file in uscita">
    - i segmenti di testo usano `channels.slack.textChunkLimit` (valore predefinito `8000`, limitato alla lunghezza massima dei messaggi di Slack)
    - `channels.slack.streaming.chunkMode="newline"` abilita la suddivisione dando priorità ai paragrafi
    - gli invii di file usano le API di caricamento di Slack e possono includere risposte nei thread (`thread_ts`)
    - le didascalie lunghe dei file usano il primo segmento di testo compatibile con Slack come commento del caricamento e inviano i segmenti rimanenti come messaggi successivi
    - il limite dei contenuti multimediali in uscita segue `channels.slack.mediaMaxMb`, se configurato; altrimenti gli invii del canale usano i valori predefiniti per tipo MIME della pipeline multimediale

  </Accordion>

  <Accordion title="Destinazioni di consegna">
    Destinazioni esplicite preferite:

    - `user:<id>` per i messaggi diretti
    - `channel:<id>` per i canali

    I messaggi diretti Slack contenenti solo testo o blocchi possono essere pubblicati direttamente sugli ID utente; i caricamenti di file e gli invii nei thread aprono prima il messaggio diretto tramite le API per le conversazioni di Slack, perché questi percorsi richiedono un ID conversazione concreto.

  </Accordion>
</AccordionGroup>

## Comandi e comportamento dei comandi slash

I comandi slash vengono visualizzati in Slack come un singolo comando configurato oppure come più comandi nativi. Configurare `channels.slack.slashCommand` per modificare le impostazioni predefinite dei comandi:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

I comandi nativi richiedono [impostazioni aggiuntive del manifesto](#additional-manifest-settings) nell'app Slack e vengono invece abilitati con `channels.slack.commands.native: true` o `commands.native: true` nelle configurazioni globali.

- La modalità automatica dei comandi nativi è **disattivata** per Slack, pertanto `commands.native: "auto"` non abilita i comandi nativi di Slack.

```txt
/help
```

I menu degli argomenti nativi vengono visualizzati in una delle forme seguenti, in ordine di priorità:

- 3-5 opzioni sufficientemente brevi: un menu di overflow ("...")
- più di 100 opzioni, con disponibilità del filtro asincrono delle opzioni: selezione esterna
- 1-2 opzioni oppure qualsiasi opzione il cui valore codificato sia troppo lungo per una selezione: blocchi di pulsanti
- negli altri casi (6-100 opzioni oppure più di 100 senza filtro asincrono): menu di selezione statico, suddiviso in gruppi di 100 opzioni per menu

```txt
/think
```

Le sessioni slash usano chiavi isolate come `agent:<agentId>:slack:slash:<userId>` e continuano a instradare le esecuzioni dei comandi alla sessione della conversazione di destinazione mediante `CommandTargetSessionKey`.

## Grafici nativi

Il [blocco Block Kit `data_visualization`](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/) pubblico di Slack
visualizza grafici a linee, a barre, ad area e a torta nei messaggi. OpenClaw associa il blocco
portabile `presentation` `chart` a tale formato nativo; non sono necessari ambiti OAuth aggiuntivi,
caricamenti di file, renderer di immagini o configurazioni di Slack oltre al normale
accesso ai messaggi `chat:write`.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Ricavi trimestrali",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "Ricavi", "values": [120, 145] }],
      "xLabel": "Trimestre"
    }
  ]
}
```

I limiti di Slack vengono applicati prima della visualizzazione nativa:

- titolo ed etichette facoltative degli assi: 50 caratteri
- torta: 1-12 segmenti positivi
- linee/barre/area: 1-12 serie con nomi univoci e 1-20 categorie condivise
- etichette di segmenti, categorie e serie: 20 caratteri
- ogni serie deve contenere un valore finito per ogni categoria; i valori non appartenenti a grafici a torta
  possono essere negativi

Ogni grafico nativo include anche una rappresentazione testuale di primo livello per gli screen reader,
le notifiche, il mirroring delle sessioni e i client che non possono visualizzare il
blocco. Gli invii di presentazioni standard ad altri canali OpenClaw ricevono gli stessi
dati deterministici del grafico in formato testuale, a meno che non dichiarino il supporto nativo per i grafici. Se
Slack rifiuta il grafico con `invalid_blocks` durante un'implementazione graduale, OpenClaw
rimuove i blocchi di dati nativi rifiutati, conserva gli eventuali controlli adiacenti e invia
la rappresentazione completa del grafico come testo visibile.

Slack accetta attualmente fino a due blocchi `data_visualization` per messaggio. Quando
una presentazione contiene più di due grafici validi, OpenClaw ne mantiene l'ordine
e prosegue la visualizzazione nativa nei messaggi successivi, con non più di due
grafici in ciascun messaggio.

L'[annuncio per sviluppatori](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/) di Slack
documenta il blocco come funzionalità Block Kit destinata alle app e non indica alcuna
restrizione legata ai piani a pagamento. Le indicazioni di idoneità per Business+/Enterprise si applicano alla
generazione automatica di grafici tramite IA di Slackbot, che è distinta dall'invio,
da parte di un'app, di un grafico Block Kit già strutturato. I grafici sono blocchi destinati esclusivamente ai messaggi, non
a App Home, finestre modali o contenuti Canvas.

## Tabelle native

L'attuale [blocco Block Kit `data_table`](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/) di Slack
visualizza righe e colonne strutturate nei messaggi. OpenClaw associa un blocco portabile
esplicito `presentation` `table` a `data_table`; non usa il
[blocco `table`](https://docs.slack.dev/reference/block-kit/blocks/table-block/) legacy di Slack.
Non sono necessari ambiti OAuth aggiuntivi né configurazioni di Slack oltre al normale
accesso ai messaggi `chat:write`.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Pipeline aperta",
      "headers": ["Account", "Fase", "ARR"],
      "rows": [
        ["Acme", "Vinto", 125000],
        ["Globex", "Revisione", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw associa le intestazioni e le celle di stringhe alle celle Slack `raw_text`. Le celle numeriche
vengono associate a `raw_number`, preservando il valore numerico finito per l'ordinamento
e il filtro nativi. `rowHeaderColumnIndex`, quando presente, contrassegna tale colonna con indice a base zero
come intestazione di riga Slack.

I limiti `data_table` pubblicati da Slack vengono applicati prima della visualizzazione nativa:

- 1-20 colonne
- 1-100 righe di dati, oltre alla riga di intestazione
- lo stesso numero di celle in ogni riga
- al massimo 10.000 caratteri complessivi in tutte le celle delle tabelle di un singolo messaggio

Più blocchi tabella validi possono essere visualizzati in modo nativo finché il messaggio rimane
entro il limite complessivo di caratteri. Una tabella che non può essere visualizzata entro
i limiti nativi diventa testo deterministico completo anziché perdere righe o
celle. Se tale testo supera la lunghezza di un messaggio Slack, gli invii e le risposte ai comandi slash usano
segmenti di testo ordinati. Le modifiche alle tabelle non riescono e restituiscono un errore esplicito relativo alle dimensioni, invece di
troncare silenziosamente le righe di un messaggio esistente.

Ogni tabella nativa prodotta da una presentazione portabile include anche una rappresentazione
testuale di primo livello per gli screen reader, le notifiche, il mirroring delle sessioni e
i client che non possono visualizzare il blocco. I valori non elaborati dei grafici e delle tabelle rimangono letterali
nel ripiego, così i dati delle celle come `<@U123>` non diventano una menzione Slack.
Se Slack rifiuta i blocchi nativi di grafici o tabelle con `invalid_blocks`, OpenClaw
rimuove tutti i blocchi di dati nativi in un unico passaggio di ripristino limitato, conserva i
blocchi adiacenti validi, come pulsanti e selezioni, e invia il testo visibile completo di grafici
e tabelle con la formattazione Slack disabilitata. La consegna dei comandi slash
tiene traccia del limite di cinque chiamate `response_url` di Slack per l'intero comando. Prima di ogni
lotto di risposte, seleziona un piano completo che rientra nelle chiamate rimanenti oppure non riesce
prima di pubblicare tale lotto.

Solo i blocchi tabella espliciti `presentation` vengono convertiti in tabelle native.
Le tabelle Markdown con barre verticali restano testo creato dall'autore; OpenClaw non tenta di dedurre la struttura
della tabella né i tipi delle celle. I produttori Slack nativi attendibili esistenti possono continuare
a passare blocchi non elaborati tramite `channelData.slack.blocks`; OpenClaw ricava il testo
di ripiego dalle celle `data_table` non elaborate valide, mentre i blocchi personalizzati non validi possono
ridursi alla relativa didascalia o al ripiego generale di Block Kit. L'output portabile di agenti, CLI
e plugin dovrebbe usare `presentation`.

## Risposte interattive

Slack può visualizzare controlli di risposta interattivi creati dagli agenti, ma questa funzionalità è disabilitata per impostazione predefinita.
Per il nuovo output di agenti, CLI e plugin, è preferibile usare i pulsanti o i blocchi di selezione condivisi
`presentation`. Usano lo stesso percorso di interazione
di Slack e si adattano anche agli altri canali.

Per abilitarla globalmente:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Oppure per abilitarla solo per un account Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Quando la funzionalità è abilitata, gli agenti possono ancora emettere direttive di risposta deprecate specifiche per Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Queste direttive vengono compilate in Slack Block Kit e instradano i clic o le selezioni
attraverso il percorso esistente degli eventi di interazione di Slack. Vanno mantenute per i vecchi
prompt e come vie di uscita specifiche per Slack; per i nuovi
controlli portabili va usata la presentazione condivisa.

Anche le API del compilatore di direttive sono deprecate per il nuovo codice dei produttori:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Per i nuovi controlli visualizzati da Slack, usare i payload `presentation` e `buildSlackPresentationBlocks(...)`.

Note:

- Questa è un'interfaccia utente legacy specifica di Slack. Gli altri canali non traducono le direttive di Slack Block
  Kit nei propri sistemi di pulsanti.
- I valori dei callback interattivi sono token opachi generati da OpenClaw, non valori grezzi creati dall'agente.
- Se i blocchi interattivi generati superano i limiti di Slack Block Kit, OpenClaw ripiega sulla risposta testuale originale anziché inviare un payload di blocchi non valido.

### Invii di modali gestiti dai Plugin

I Plugin Slack che registrano un gestore interattivo possono anche ricevere gli eventi del ciclo di vita
`view_submission` e `view_closed` prima che OpenClaw esegua la Compaction
del payload per l'evento di sistema visibile all'agente. Quando si apre un modale Slack, utilizzare uno di questi
schemi di instradamento:

- Impostare `callback_id` su `openclaw:<namespace>:<payload>`.
- In alternativa, mantenere un `callback_id` esistente e inserire `pluginInteractiveData:
"<namespace>:<payload>"` nel `private_metadata` del modale.

Il gestore riceve `ctx.interaction.kind` come `view_submission` o
`view_closed`, il valore `inputs` normalizzato e l'oggetto grezzo completo `stateValues` da
Slack. L'instradamento basato solo sull'ID del callback è sufficiente per invocare il gestore del Plugin; includere
i campi di instradamento utente/sessione `private_metadata` del modale esistente quando il
modale deve anche produrre un evento di sistema visibile all'agente. L'agente riceve un
evento di sistema `Slack interaction: ...` compatto e oscurato. Se il gestore restituisce
`systemEvent.summary`, `systemEvent.reference` o `systemEvent.data`, tali
campi vengono inclusi nell'evento compatto affinché l'agente possa fare riferimento
allo spazio di archiviazione gestito dal Plugin senza vedere il payload completo del modulo.

## Approvazioni native in Slack

Slack può fungere da client di approvazione nativo con pulsanti e interazioni, anziché ripiegare sull'interfaccia web o sul terminale.

- Le approvazioni dell'esecuzione e dei Plugin possono essere visualizzate come richieste native di Slack Block Kit.
- `channels.slack.execApprovals.*` rimane la configurazione per l'abilitazione del client nativo delle approvazioni dell'esecuzione e per l'instradamento tramite messaggio diretto/canale.
- I messaggi diretti per l'approvazione dell'esecuzione utilizzano `channels.slack.execApprovals.approvers` o `commands.ownerAllowFrom`.
- Le approvazioni dei Plugin utilizzano pulsanti nativi di Slack quando Slack è abilitato come client di approvazione nativo per la sessione di origine oppure quando `approvals.plugin` indirizza alla sessione Slack di origine o a una destinazione Slack.
- I messaggi diretti per l'approvazione dei Plugin utilizzano gli approvatori dei Plugin Slack da `channels.slack.allowFrom`, il valore `allowFrom` dell'account denominato o l'instradamento predefinito dell'account.
- L'autorizzazione degli approvatori viene comunque applicata: gli approvatori autorizzati solo per l'esecuzione non possono approvare richieste dei Plugin, a meno che non siano anche approvatori dei Plugin.

Viene utilizzata la stessa superficie condivisa dei pulsanti di approvazione degli altri canali. Quando `interactivity` è abilitato nelle impostazioni dell'app Slack, le richieste di approvazione vengono visualizzate come pulsanti Block Kit direttamente nella conversazione.
Quando tali pulsanti sono presenti, costituiscono l'esperienza utente principale per l'approvazione; OpenClaw
deve includere un comando manuale `/approve` solo quando il risultato dello strumento indica che le
approvazioni tramite chat non sono disponibili o che l'approvazione manuale è l'unica opzione.

Percorso di configurazione:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facoltativo; ripiega su `commands.ownerAllowFrom` quando possibile)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, valore predefinito: `dm`)
- `agentFilter`, `sessionFilter`

Slack abilita automaticamente le approvazioni native dell'esecuzione quando `enabled` non è impostato oppure è `"auto"` e viene individuato almeno un
approvatore dell'esecuzione. Slack può inoltre gestire le approvazioni native dei Plugin tramite questo percorso
del client nativo quando vengono individuati approvatori dei Plugin Slack e la richiesta corrisponde ai filtri del client nativo. Impostare
`enabled: false` per disabilitare esplicitamente Slack come client di approvazione nativo. Impostare `enabled: true` per
forzare l'attivazione delle approvazioni native quando vengono individuati approvatori. La disabilitazione delle approvazioni dell'esecuzione in Slack non disabilita
la consegna delle approvazioni native dei Plugin Slack abilitata tramite `approvals.plugin`; per la consegna delle approvazioni
dei Plugin vengono invece utilizzati gli approvatori dei Plugin Slack.

Comportamento predefinito senza una configurazione esplicita delle approvazioni dell'esecuzione in Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configurazione nativa di Slack esplicita è necessaria solo per sostituire gli approvatori, aggiungere filtri o
abilitare esplicitamente la consegna nella chat di origine:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

L'inoltro condiviso `approvals.exec` è separato. Utilizzarlo solo quando le richieste di approvazione dell'esecuzione devono essere
instradate anche ad altre chat o a destinazioni esplicite fuori banda. Anche l'inoltro condiviso `approvals.plugin` è
separato; la consegna nativa di Slack sopprime tale ripiego solo quando Slack può gestire nativamente la richiesta
di approvazione del Plugin.

Anche `/approve` nella stessa chat funziona nei canali e nei messaggi diretti Slack che supportano già i comandi. Consultare [Approvazioni dell'esecuzione](/it/tools/exec-approvals) per il modello completo di inoltro delle approvazioni.

## Eventi e comportamento operativo

- Le modifiche/eliminazioni dei messaggi vengono convertite in eventi di sistema.
- Le trasmissioni delle discussioni (risposte alle discussioni con "Also send to channel") vengono elaborate come normali messaggi utente.
- Gli eventi di aggiunta/rimozione delle reazioni vengono convertiti in eventi di sistema.
- Gli eventi di ingresso/uscita dei membri, creazione/ridenominazione dei canali e aggiunta/rimozione degli elementi fissati vengono convertiti in eventi di sistema.
- Il polling facoltativo della presenza può convertire la transizione da `away` a `active` di un partecipante umano osservato nella sessione Slack idonea attiva più di recente del partecipante. Per impostazione predefinita è disattivato.
- `channel_id_changed` può migrare le chiavi di configurazione dei canali quando `configWrites` è abilitato.
- I metadati relativi ad argomento/scopo del canale vengono considerati contesto non attendibile e possono essere inseriti nel contesto di instradamento.
- Il messaggio iniziale della discussione e il popolamento iniziale del contesto della cronologia della discussione vengono filtrati in base agli elenchi configurati dei mittenti consentiti, quando applicabile.
- Le azioni dei blocchi, le scorciatoie e le interazioni con i modali generano eventi di sistema strutturati `Slack interaction: ...` con campi del payload dettagliati:
  - azioni dei blocchi: valori selezionati, etichette, valori dei selettori e metadati `workflow_*`
  - scorciatoie globali: metadati del callback e dell'attore, instradati alla sessione diretta dell'attore
  - scorciatoie dei messaggi: contesto del callback, dell'attore, del canale, della discussione e del messaggio selezionato
  - eventi modali `view_submission` e `view_closed` con metadati del canale instradato e dati immessi nel modulo

Definire scorciatoie globali o dei messaggi nella configurazione dell'app Slack e utilizzare un ID callback non vuoto. OpenClaw conferma i payload delle scorciatoie corrispondenti, applica gli stessi criteri per i mittenti dei messaggi diretti/canali delle altre interazioni Slack e accoda l'evento sanificato per la sessione dell'agente instradata. Gli ID dei trigger e gli URL di risposta vengono oscurati dal contesto dell'agente.

### Eventi di presenza

Slack non invia le modifiche della presenza tramite l'API Events o Socket Mode. OpenClaw può invece eseguire il polling di [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) per i partecipanti umani i cui messaggi hanno superato i normali controlli di accesso e instradamento di Slack.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (valore predefinito): nessun timer di presenza o chiamata API Slack.
- `auto`: monitora i messaggi diretti, gli MPIM e le discussioni Slack attivi nelle ultime 24 ore con non più di 8 partecipanti umani osservati. Le sessioni dei canali di primo livello sono escluse.
- `on`: monitora le stesse conversazioni senza il limite di partecipanti e include le sessioni dei canali di primo livello. Utilizzare una sostituzione per canale per forzare o sopprimere un canale.

OpenClaw esegue il polling di non più di 45 utenti univoci al minuto per account Slack, inizializza il primo risultato senza riattivare l'agente e lo riattiva solo quando viene osservata una transizione da `away` a `active`. Per ogni account Slack e utente si applica un intervallo di attesa persistente di 8 ore, anche se la persona partecipa a più discussioni. L'evento viene instradato solo alla conversazione idonea attiva più di recente di quella persona e indica all'agente di consultare la memoria/wiki e il contesto noto del fuso orario prima di decidere se inviare un breve saluto. L'agente può rimanere in silenzio.

Il token del bot richiede `users:read`, già incluso nel manifesto consigliato. Gli eventi di presenza non sono disponibili per le installazioni a livello di organizzazione Enterprise Grid.

## Riferimento della configurazione

Riferimento principale: [Riferimento della configurazione - Slack](/it/gateway/config-channels#slack).

<Accordion title="Campi Slack più significativi">

- modalità/autenticazione: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accesso ai messaggi diretti: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- opzione di compatibilità: `dangerouslyAllowNameMatching` (di emergenza; mantenerla disattivata se non necessaria)
- accesso ai canali: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- discussioni/cronologia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- riattivazioni in base alla presenza: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; valore predefinito `off`)
- consegna: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- anteprime: `unfurlLinks` (valore predefinito: `false`), `unfurlMedia` per il controllo dell'anteprima di link/contenuti multimediali `chat.postMessage`; impostare `unfurlLinks: true` per riabilitare esplicitamente le anteprime dei link
- operazioni/funzionalità: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Verificare, nell'ordine:

    - `groupPolicy`
    - elenco dei canali consentiti (`channels.slack.channels`) — **le chiavi devono essere ID di canale** (`C12345678`), non nomi (`#channel-name`). Le chiavi basate sui nomi non producono errori ma non funzionano con `groupPolicy: "allowlist"`, perché per impostazione predefinita l'instradamento dei canali usa prima l'ID. Per trovare un ID: fare clic con il pulsante destro del mouse sul canale in Slack → **Copy link** — il valore `C...` alla fine dell'URL è l'ID del canale.
    - `requireMention`
    - elenco consentito `users` per canale
    - `messages.groupChat.visibleReplies`: le normali richieste di gruppo/canale utilizzano per impostazione predefinita `"automatic"`. Se è stato abilitato esplicitamente `"message_tool"` e i log mostrano testo dell'assistente senza una chiamata a `message(action=send)`, il modello non ha utilizzato il percorso visibile dello strumento per i messaggi. In questa modalità, il testo finale rimane privato; esaminare il log dettagliato del Gateway per i metadati del payload soppressi oppure impostare il valore su `"automatic"` se si desidera che ogni normale risposta finale dell'assistente venga pubblicata tramite il percorso legacy.
    - `messages.groupChat.unmentionedInbound`: se è `"room_event"`, le conversazioni non menzionate dei canali consentiti costituiscono contesto ambientale e rimangono silenziose a meno che l'agente non chiami lo strumento `message`. Consultare [Eventi ambientali delle stanze](/it/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    Comandi utili:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Messaggi diretti ignorati">
    Verificare:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (o il precedente `channels.slack.dm.policy`)
    - approvazioni di associazione / voci dell'elenco consentito (`dmPolicy: "open"` richiede comunque `channels.slack.allowFrom: ["*"]`)
    - i messaggi diretti di gruppo usano la gestione MPIM; abilitare `channels.slack.dm.groupEnabled` e, se configurato, includere l'MPIM in `channels.slack.dm.groupChannels`
    - eventi dei messaggi diretti di Slack Assistant: i log dettagliati che menzionano `drop message_changed`
      indicano solitamente che Slack ha inviato un evento modificato di un thread dell'Assistant senza un
      mittente umano recuperabile nei metadati del messaggio

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="La modalità Socket non si connette">
    Verificare i token del bot e dell'app e l'abilitazione di Socket Mode nelle impostazioni dell'app Slack.
    Il token a livello di app richiede `connections:write`, mentre il Bot User OAuth Token
    del bot deve appartenere alla stessa app e allo stesso spazio di lavoro Slack del token dell'app.

    Se `openclaw channels status --probe --json` mostra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, l'account Slack è
    configurato, ma il runtime corrente non è riuscito a risolvere il valore
    basato su SecretRef.

    I log come `slack socket mode failed to start; retry ...` indicano errori di
    avvio recuperabili. Gli ambiti mancanti, i token revocati e l'autenticazione non valida causano
    invece un errore immediato. Un log `slack token mismatch ...` indica che il token del bot e quello dell'app
    sembrano appartenere ad app Slack diverse; correggere le credenziali dell'app Slack.

  </Accordion>

  <Accordion title="La modalità HTTP non riceve eventi">
    Verificare:

    - segreto di firma
    - percorso del Webhook
    - URL delle richieste Slack (eventi + interattività + comandi slash)
    - `webhookPath` univoco per ogni account HTTP
    - che l'URL pubblico termini TLS e inoltri le richieste al percorso del Gateway
    - che il percorso `request_url` dell'app Slack corrisponda esattamente a `channels.slack.webhookPath` (valore predefinito `/slack/events`)

    Se `signingSecretStatus: "configured_unavailable"` appare nelle istantanee
    dell'account, l'account HTTP è configurato, ma il runtime corrente non è riuscito a
    risolvere il segreto di firma basato su SecretRef.

    La ripetizione del log `slack: webhook path ... already registered` indica che due account HTTP
    usano lo stesso `webhookPath`; assegnare un percorso distinto a ciascun account.

  </Accordion>

  <Accordion title="I comandi nativi/slash non vengono eseguiti">
    Verificare quale modalità si intendeva usare:

    - modalità dei comandi nativi (`channels.slack.commands.native: true`) con i comandi slash corrispondenti registrati in Slack
    - oppure modalità con un singolo comando slash (`channels.slack.slashCommand.enabled: true`)

    Slack non crea né rimuove automaticamente i comandi slash. `commands.native: "auto"` non abilita i comandi nativi di Slack; usare `true` e creare i comandi corrispondenti nell'app Slack. In modalità HTTP, ogni comando slash di Slack deve includere l'URL del Gateway. In Socket Mode, i payload dei comandi arrivano tramite websocket e Slack ignora `slash_commands[].url`.

    Controllare anche `commands.useAccessGroups`, l'autorizzazione dei messaggi diretti, gli elenchi consentiti dei canali
    e gli elenchi consentiti `users` per canale. Slack restituisce errori effimeri per
    i mittenti bloccati dei comandi slash, tra cui:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Riferimento per gli allegati multimediali

Slack può allegare i contenuti multimediali scaricati al turno dell'agente quando il download dei file Slack riesce e i limiti di dimensione lo consentono. Le clip audio possono essere trascritte, i file immagine possono essere elaborati dal percorso di comprensione multimediale o passati direttamente a un modello di risposta con funzionalità visive, mentre gli altri file restano disponibili come contesto di file scaricabile.

### Tipi di contenuti multimediali supportati

| Tipo di contenuto multimediale | Origine               | Comportamento attuale                                                              | Note                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Clip audio di Slack            | URL del file Slack   | Scaricate e instradate attraverso la trascrizione audio condivisa                 | Richiede `files:read` e un modello o una CLI `tools.media.audio` funzionante |
| Immagini JPEG / PNG / GIF / WebP | URL del file Slack | Scaricate e allegate al turno per la gestione con funzionalità visive             | Limite per file: `channels.slack.mediaMaxMb` (valore predefinito 20 MB)            |
| File PDF                       | URL del file Slack   | Scaricati ed esposti come contesto di file per strumenti quali `download-file` o `pdf` | I messaggi Slack in ingresso non convertono automaticamente i PDF in input visivo di immagini |
| Altri file                     | URL del file Slack   | Scaricati quando possibile ed esposti come contesto di file                       | I file binari non sono trattati come input di immagini                    |
| Risposte nei thread            | File del messaggio iniziale del thread | I file del messaggio radice possono essere caricati come contesto quando la risposta non contiene contenuti multimediali diretti | I messaggi iniziali contenenti solo file usano un segnaposto per l'allegato |
| Messaggi con più file          | Più file Slack       | Ogni file viene valutato separatamente                                            | L'elaborazione Slack è limitata a otto file per messaggio                  |

### Pipeline in ingresso

Quando arriva un messaggio Slack con file allegati:

1. OpenClaw scarica il file dall'URL privato di Slack usando il token del bot.
2. Se l'operazione riesce, il file viene scritto nell'archivio multimediale.
3. I percorsi dei contenuti multimediali scaricati e i tipi di contenuto vengono aggiunti al contesto in ingresso.
4. Le clip audio vengono instradate alla pipeline di trascrizione condivisa; i percorsi di modelli e strumenti con funzionalità di elaborazione delle immagini possono usare gli allegati immagine dello stesso contesto.
5. Gli altri file restano disponibili come metadati di file o riferimenti multimediali per gli strumenti in grado di gestirli.

### Ereditarietà degli allegati del messaggio radice del thread

Quando arriva un messaggio in un thread (con un elemento padre `thread_ts`):

- Se la risposta non contiene contenuti multimediali diretti e il messaggio radice incluso contiene file, Slack può caricare i file radice come contesto iniziale del thread.
- I file radice vengono caricati solo durante l'inizializzazione di una sessione di thread nuova o reimpostata. Le successive risposte contenenti solo testo riutilizzano il contesto della sessione esistente e non allegano nuovamente i file radice come nuovi contenuti multimediali.
- Gli allegati diretti della risposta hanno la precedenza sugli allegati del messaggio radice.
- Un messaggio radice contenente solo file e nessun testo viene rappresentato con un segnaposto per l'allegato, in modo che il meccanismo di riserva possa comunque includerne i file.

### Gestione di più allegati

Quando un singolo messaggio Slack contiene più file allegati:

- Ogni allegato viene elaborato separatamente attraverso la pipeline multimediale.
- I riferimenti ai contenuti multimediali scaricati vengono aggregati nel contesto del messaggio.
- L'ordine di elaborazione segue l'ordine dei file di Slack nel payload dell'evento.
- Il mancato download di un allegato non blocca gli altri.

### Limiti di dimensione, download e modello

- **Limite di dimensione**: valore predefinito di 20 MB per file. Configurabile tramite `channels.slack.mediaMaxMb`.
- **Limite della trascrizione audio**: `tools.media.audio.maxBytes` si applica anche quando il file scaricato viene inviato a un provider di trascrizione o a una CLI.
- **Errori di download**: i file che Slack non riesce a fornire, gli URL scaduti, i file inaccessibili, i file troppo grandi e le risposte HTML di autenticazione/accesso di Slack vengono ignorati anziché essere segnalati come formati non supportati.
- **Modello visivo**: l'analisi delle immagini usa il modello di risposta attivo quando supporta le funzionalità visive oppure il modello di immagini configurato in `agents.defaults.imageModel`.

### Limiti noti

| Scenario                                      | Comportamento attuale                                                              | Soluzione alternativa                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| URL del file Slack scaduto                    | Il file viene ignorato; non viene mostrato alcun errore                            | Caricare nuovamente il file in Slack                                           |
| Trascrizione audio non disponibile            | La clip resta allegata, ma non viene prodotta alcuna trascrizione                  | Configurare `tools.media.audio` o installare una CLI locale di trascrizione supportata |
| Una clip senza didascalia non supera il controllo delle menzioni | Ignorata dopo una trascrizione speculativa privata; trascrizione e download vengono eliminati | Configurare un modello di menzione del nome pronunciato, aggiungere una menzione testuale del bot oppure usare un messaggio diretto |
| Modello visivo non configurato                | Gli allegati immagine vengono archiviati come riferimenti multimediali, ma non analizzati come immagini | Configurare `agents.defaults.imageModel` o usare un modello di risposta con funzionalità visive |
| Immagini molto grandi (> 20 MB per impostazione predefinita) | Ignorate in base al limite di dimensione                                           | Aumentare `channels.slack.mediaMaxMb` se Slack lo consente                              |
| Allegati inoltrati/condivisi                  | Il testo e i contenuti multimediali di immagini/file ospitati da Slack vengono gestiti con il massimo impegno | Condividere nuovamente l'elemento direttamente nel thread di OpenClaw           |
| Allegati PDF                                  | Archiviati come contesto di file/contenuti multimediali, non instradati automaticamente alla visione di immagini | Usare `download-file` per i metadati dei file o lo strumento `pdf` per l'analisi dei PDF |

### Documentazione correlata

- [Pipeline di comprensione multimediale](/it/nodes/media-understanding)
- [Audio e note vocali](/it/nodes/audio)
- [Strumento PDF](/it/tools/pdf)

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Associare un utente Slack al Gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento dei canali e dei messaggi diretti di gruppo.
  </Card>
  <Card title="Instradamento dei canali" icon="route" href="/it/channels/channel-routing">
    Instradare i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello delle minacce e rafforzamento della sicurezza.
  </Card>
  <Card title="Configurazione" icon="sliders" href="/it/gateway/configuration">
    Struttura e precedenza della configurazione.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Catalogo e comportamento dei comandi.
  </Card>
</CardGroup>
