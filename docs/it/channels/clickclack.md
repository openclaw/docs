---
read_when:
    - Collegare OpenClaw a un'area di lavoro ClickClack
    - Test delle identità dei bot ClickClack
summary: Configurazione del canale bot-token di ClickClack e sintassi dei target
title: ClickClack
x-i18n:
    generated_at: "2026-05-10T19:20:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4860b5f0a40d38af99bec0b8187f723a30c9b4b78d2d1de50ba8a97954baeb
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack collega OpenClaw a un workspace ClickClack self-hosted tramite token bot ClickClack di prima classe.

Usalo quando vuoi che un agente OpenClaw appaia come un utente bot ClickClack. ClickClack supporta bot di servizio indipendenti e bot di proprietà dell’utente; i bot di proprietà dell’utente mantengono un `owner_user_id` e ricevono solo gli ambiti del token che concedi.

## Configurazione rapida

Crea un token bot in ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Per un bot di proprietà dell’utente, aggiungi `--owner <user_id>`.

Configura OpenClaw:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

Poi esegui:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

## Più bot

Ogni account apre la propria connessione realtime ClickClack e usa il proprio token bot.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` usa direttamente `api.runtime.llm.complete` per brevi risposte del bot.
Quando un account imposta `agentId`, OpenClaw richiede il bit di attendibilità esplicito
`plugins.entries.clickclack.llm.allowAgentIdOverride` in modo che il plugin
possa eseguire completamenti per quell’agente bot. Lascialo disattivato se usi solo il percorso dell’agente
predefinito.

## Destinazioni

- `channel:<name-or-id>` invia a un canale del workspace. Le destinazioni semplici usano `channel:` per impostazione predefinita.
- `dm:<user_id>` crea o riusa una conversazione diretta con quell’utente.
- `thread:<message_id>` risponde in un thread esistente.

Esempi:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Autorizzazioni

Gli ambiti dei token ClickClack vengono applicati dall’API ClickClack.

- `bot:read`: legge dati di workspace/canali/messaggi/thread/DM/realtime/profilo.
- `bot:write`: `bot:read` più messaggi dei canali, risposte nei thread, DM e caricamenti.
- `bot:admin`: `bot:write` più creazione di canali.

OpenClaw richiede solo `bot:write` per la normale chat dell’agente.

## Risoluzione dei problemi

- `ClickClack is not configured`: imposta `channels.clickclack.token` o `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: imposta `workspace` sull’id o sullo slug del workspace restituito da ClickClack.
- Nessuna risposta in entrata: conferma che il token abbia accesso in lettura realtime e che il bot non stia rispondendo ai propri messaggi.
- Gli invii ai canali non riescono: verifica che il bot sia membro del workspace e abbia `bot:write`.
