---
read_when:
    - OpenClaw verbinden met een ClickClack-werkruimte
    - ClickClack-botidentiteiten testen
summary: ClickClack bot-token-kanaalconfiguratie en doelsyntaxis
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack verbindt OpenClaw met een zelf gehoste ClickClack-werkruimte via eersteklas ClickClack-bottokens.

Gebruik dit wanneer je wilt dat een OpenClaw-agent verschijnt als een ClickClack-botgebruiker. ClickClack ondersteunt onafhankelijke servicebots en bots die eigendom zijn van gebruikers; bots die eigendom zijn van gebruikers behouden een `owner_user_id` en krijgen alleen de token-scopes die je verleent.

## Snelle installatie

Maak een bottoken aan in ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Voeg voor een bot die eigendom is van een gebruiker `--owner <user_id>` toe.

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

Als `plugins.allow` een niet-lege beperkende lijst is, wordt bij het expliciet selecteren
van ClickClack tijdens kanaalconfiguratie of het uitvoeren van `openclaw plugins enable clickclack`
`clickclack` aan die lijst toegevoegd. Installatie tijdens onboarding gebruikt hetzelfde
gedrag voor expliciete selectie. Deze paden overschrijven `plugins.deny` of een
globale instelling `plugins.enabled: false` niet. Rechtstreeks
`openclaw plugins install @openclaw/clickclack` volgt het normale
Plugin-installatiebeleid en registreert ClickClack ook in een bestaande allowlist.

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
vertrouwensbit `plugins.entries.clickclack.llm.allowAgentIdOverride`, zodat de Plugin
voltooiingen voor die botagent kan uitvoeren. Laat dit uitgeschakeld als je alleen de standaard
agentroute gebruikt.

## Doelen

- `channel:<name-or-id>` verzendt naar een werkruimtekanaal. Kale doelen gebruiken standaard `channel:`.
- `dm:<user_id>` maakt een direct gesprek met die gebruiker aan of hergebruikt dit.
- `thread:<message_id>` antwoordt in een bestaande thread.

Voorbeelden:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Machtigingen

ClickClack-token-scopes worden afgedwongen door de ClickClack-API.

- `bot:read`: lees werkruimte-/kanaal-/bericht-/thread-/DM-/realtime-/profielgegevens.
- `bot:write`: `bot:read` plus kanaalberichten, threadantwoorden, DM's en uploads.
- `bot:admin`: `bot:write` plus kanaalaanmaak.

OpenClaw heeft alleen `bot:write` nodig voor normale agentchat.

## Probleemoplossing

- `ClickClack is not configured`: stel `channels.clickclack.token` of `CLICKCLACK_BOT_TOKEN` in.
- `workspace not found`: stel `workspace` in op de werkruimte-id of slug die door ClickClack wordt geretourneerd.
- Geen inkomende antwoorden: controleer of het token realtime leestoegang heeft en of de bot niet op zijn eigen berichten antwoordt.
- Verzenden naar kanaal mislukt: controleer of de bot lid is van de werkruimte en `bot:write` heeft.
