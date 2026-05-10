---
read_when:
    - OpenClaw verbinden met een ClickClack-werkruimte
    - ClickClack-botidentiteiten testen
summary: ClickClack bot-token-kanaalconfiguratie en doelsyntaxis
title: ClickClack
x-i18n:
    generated_at: "2026-05-10T19:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4860b5f0a40d38af99bec0b8187f723a30c9b4b78d2d1de50ba8a97954baeb
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack verbindt OpenClaw met een zelfgehoste ClickClack-werkruimte via volwaardig ondersteunde ClickClack-bottokens.

Gebruik dit wanneer je wilt dat een OpenClaw-agent verschijnt als ClickClack-botgebruiker. ClickClack ondersteunt onafhankelijke servicebots en bots van gebruikers; bots van gebruikers behouden een `owner_user_id` en ontvangen alleen de tokenbereiken die je toekent.

## Snelle configuratie

Maak een bottoken aan in ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Voeg voor een bot van een gebruiker `--owner <user_id>` toe.

Configureer OpenClaw:

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

Voer daarna uit:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

## Meerdere bots

Elk account opent zijn eigen ClickClack-realtimeverbinding en gebruikt zijn eigen bottoken.

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

`replyMode: "model"` gebruikt `api.runtime.llm.complete` rechtstreeks voor korte botantwoorden.
Wanneer een account `agentId` instelt, vereist OpenClaw de expliciete
`plugins.entries.clickclack.llm.allowAgentIdOverride`-vertrouwensbit zodat de Plugin
aanvullingen voor die botagent kan uitvoeren. Laat dit uit als je alleen de standaard
agentroute gebruikt.

## Doelen

- `channel:<name-or-id>` stuurt naar een werkruimtekanaal. Kale doelen gebruiken standaard `channel:`.
- `dm:<user_id>` maakt een rechtstreeks gesprek met die gebruiker aan of hergebruikt het.
- `thread:<message_id>` antwoordt in een bestaande thread.

Voorbeelden:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Machtigingen

ClickClack-tokenbereiken worden afgedwongen door de ClickClack-API.

- `bot:read`: lees werkruimte-, kanaal-, bericht-, thread-, DM-, realtime- en profielgegevens.
- `bot:write`: `bot:read` plus kanaalberichten, threadantwoorden, DM's en uploads.
- `bot:admin`: `bot:write` plus kanaalaanmaak.

OpenClaw heeft alleen `bot:write` nodig voor normale agentchat.

## Probleemoplossing

- `ClickClack is not configured`: stel `channels.clickclack.token` of `CLICKCLACK_BOT_TOKEN` in.
- `workspace not found`: stel `workspace` in op de werkruimte-ID of slug die door ClickClack wordt geretourneerd.
- Geen inkomende antwoorden: bevestig dat het token realtime-leestoegang heeft en dat de bot niet op zijn eigen berichten antwoordt.
- Verzenden naar kanalen mislukt: controleer of de bot lid is van de werkruimte en `bot:write` heeft.
