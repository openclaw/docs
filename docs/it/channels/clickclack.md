---
read_when:
    - Connessione di OpenClaw a uno spazio di lavoro ClickClack
    - Test delle identità dei bot ClickClack
summary: Configurazione del canale token bot ClickClack e sintassi del target
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack connette OpenClaw a uno spazio di lavoro ClickClack self-hosted tramite token bot ClickClack di prima classe.

Usalo quando vuoi che un agente OpenClaw appaia come utente bot ClickClack. ClickClack supporta bot di servizio indipendenti e bot di proprietà dell'utente; i bot di proprietà dell'utente mantengono un `owner_user_id` e ricevono solo gli ambiti token concessi.

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

Per un bot di proprietà dell'utente, aggiungi `--owner <user_id>`.

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

Quindi esegui:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Se `plugins.allow` è un elenco restrittivo non vuoto, selezionare esplicitamente
ClickClack nella configurazione del canale o eseguire `openclaw plugins enable clickclack`
aggiunge `clickclack` a tale elenco. L'installazione di onboarding usa lo stesso
comportamento di selezione esplicita. Questi percorsi non sovrascrivono `plugins.deny` né
un'impostazione globale `plugins.enabled: false`. Il comando diretto
`openclaw plugins install @openclaw/clickclack` segue la normale
policy di installazione dei plugin e registra anche ClickClack in una allowlist esistente.

## Bot multipli

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
Quando un account imposta `agentId`, OpenClaw richiede il bit di fiducia esplicito
`plugins.entries.clickclack.llm.allowAgentIdOverride` affinché il plugin
possa eseguire completamenti per quell'agente bot. Mantienilo disattivato se usi solo il percorso
agente predefinito.

## Destinazioni

- `channel:<name-or-id>` invia a un canale dello spazio di lavoro. Le destinazioni senza prefisso usano per impostazione predefinita `channel:`.
- `dm:<user_id>` crea o riusa una conversazione diretta con quell'utente.
- `thread:<message_id>` risponde in un thread esistente.

Esempi:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Autorizzazioni

Gli ambiti dei token ClickClack sono applicati dall'API ClickClack.

- `bot:read`: legge dati di spazio di lavoro/canale/messaggio/thread/DM/realtime/profilo.
- `bot:write`: `bot:read` più messaggi di canale, risposte nei thread, DM e caricamenti.
- `bot:admin`: `bot:write` più creazione di canali.

OpenClaw richiede solo `bot:write` per la normale chat dell'agente.

## Risoluzione dei problemi

- `ClickClack is not configured`: imposta `channels.clickclack.token` o `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: imposta `workspace` sull'id o sullo slug dello spazio di lavoro restituito da ClickClack.
- Nessuna risposta in ingresso: conferma che il token abbia accesso in lettura realtime e che il bot non stia rispondendo ai propri messaggi.
- Gli invii al canale falliscono: verifica che il bot sia membro dello spazio di lavoro e abbia `bot:write`.
