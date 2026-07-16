---
read_when:
    - Leren hoe je OpenClaw configureert
    - Op zoek naar configuratievoorbeelden
    - OpenClaw voor de eerste keer instellen
summary: Schematisch correcte configuratievoorbeelden voor veelvoorkomende OpenClaw-installaties
title: Configuratievoorbeelden
x-i18n:
    generated_at: "2026-07-16T15:49:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a669f3da2392aa8d2953fa124c43447afe3da971d5f5e497d6c2ec3bf88c6a
    source_path: gateway/configuration-examples.md
    workflow: 16
---

Onderstaande voorbeelden zijn afgestemd op het huidige configuratieschema. Zie [Configuratie](/nl/gateway/configuration) voor de volledige referentie en opmerkingen per veld.

## Snel aan de slag

### Absoluut minimum

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Sla dit op in `~/.openclaw/openclaw.json`; daarna kun je de bot vanaf dat nummer een privébericht sturen.

### Aanbevolen startconfiguratie

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "anthropic/claude-sonnet-4-6" },
    },
    list: [
      {
        id: "main",
        identity: {
          name: "Clawd",
          theme: "helpful assistant",
          emoji: "🦞",
        },
      },
    ],
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: {
    visibleReplies: "automatic",
    groupChat: {
      visibleReplies: "message_tool", // opt-in; voor zichtbare uitvoer is message(action=send) vereist
      unmentionedInbound: "room_event",
    },
  },
}
```

## Uitgebreid voorbeeld (belangrijkste opties)

> Met JSON5 kun je opmerkingen en afsluitende komma's gebruiken. Gewone JSON werkt ook.

```json5
{
  // Omgeving + shell
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },

  // Metagegevens van authenticatieprofielen (geheimen staan in auth-profiles.json)
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:default": { provider: "openai", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal", "openai:default"],
    },
  },

  // Identiteit wordt per agent ingesteld — stel deze hieronder in via agents.list[].identity.

  // Logboekregistratie
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // Berichtopmaak
  messages: {
    messagePrefix: "[openclaw]",
    visibleReplies: "automatic",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // schakel dit in voor gedeelde ruimtes met modellen die tools betrouwbaar gebruiken
      unmentionedInbound: "room_event",
    },
    queue: {
      mode: "followup",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
        discord: "collect",
        slack: "collect",
        signal: "followup",
        imessage: "followup",
        webchat: "followup",
      },
    },
  },

  // Hulpmiddelen
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          // Optionele CLI-terugvaloptie (Whisper-binair bestand):
          // { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] }
        ],
        timeoutSeconds: 120,
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },

  // Sessiegedrag
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // aanbevolen voor inboxen met meerdere gebruikers
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 60,
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/main/sessions/sessions.json",
    maintenance: {
      mode: "warn",
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duur of false
      maxDiskBytes: "500mb", // optioneel
      highWaterBytes: "400mb", // optioneel (standaard 80% van maxDiskBytes)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // Kanalen
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15555550123"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },

    telegram: {
      enabled: true,
      botToken: "YOUR_TELEGRAM_BOT_TOKEN",
      allowFrom: ["123456789"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
      groups: { "*": { requireMention: true } },
    },

    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },

    slack: {
      enabled: true,
      botToken: "xoxb-REPLACE_ME",
      appToken: "xapp-REPLACE_ME",
      channels: {
        "#general": { enabled: true, requireMention: true },
      },
      dm: { enabled: true, allowFrom: ["U123"] },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
    },
  },

  // Agent-runtime
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      userTimezone: "America/Chicago",
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["anthropic/claude-opus-4-6", "openai/gpt-5.4"],
      },
      imageModel: {
        primary: "openrouter/anthropic/claude-sonnet-4-6",
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
        "openai/gpt-5.4": { alias: "gpt" },
      },
      skills: ["github", "weather"], // overgenomen door agents waarbij list[].skills ontbreekt
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      blockStreamingDefault: "off",
      blockStreamingBreak: "text_end",
      blockStreamingChunk: {
        minChars: 800,
        maxChars: 1200,
        breakPreference: "paragraph",
      },
      blockStreamingCoalesce: {
        idleMs: 1000,
      },
      humanDelay: {
        mode: "natural",
      },
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      typingIntervalSeconds: 5,
      maxConcurrent: 3,
      heartbeat: {
        every: "30m",
        model: "anthropic/claude-sonnet-4-6",
        target: "last",
        directPolicy: "allow", // toestaan (standaard) | blokkeren
        to: "+15555550123",
        prompt: "HEARTBEAT",
        ackMaxChars: 300,
      },
      memorySearch: {
        provider: "gemini",
        model: "gemini-embedding-001",
        remote: {
          apiKey: "${GEMINI_API_KEY}",
        },
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
      sandbox: {
        mode: "non-main",
        scope: "session", // aanbevolen boven de verouderde instelling perSession: true
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
        },
        browser: {
          enabled: false,
        },
      },
    },
    list: [
      {
        id: "main",
        default: true,
        identity: {
          name: "Samantha",
          theme: "behulpzame luiaard",
          emoji: "🦥",
        },
        // neemt defaults.skills over -> github, weather
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
        thinkingDefault: "high", // denkmodus per agent overschrijven
        reasoningDefault: "on", // zichtbaarheid van redenering per agent
        fastModeDefault: false, // snelle modus per agent
      },
      {
        id: "quick",
        skills: [], // geen Skills voor deze agent
        fastModeDefault: true, // deze agent werkt altijd snel
        thinkingDefault: "off",
      },
    ],
  },

  tools: {
    allow: ["exec", "process", "read", "write", "edit", "apply_patch"],
    deny: ["browser", "canvas"],
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
    },
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        telegram: ["123456789"],
        discord: ["123456789012345678"],
        slack: ["U123"],
        signal: ["+15555550123"],
        imessage: ["user@example.com"],
        webchat: ["session:demo"],
      },
    },
  },

  // Aangepaste modelproviders
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-responses",
        authHeader: true,
        headers: { "X-Proxy-Region": "us-west" },
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            api: "openai-responses",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },

  // Cron-taken
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8, // standaard; Cron-dispatch + geïsoleerde uitvoering van Cron-agentbeurten
    sessionRetention: "24h",
  },

  // Webhooks
  hooks: {
    enabled: true,
    path: "/hooks",
    token: "shared-secret",
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        id: "gmail-hook",
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "Van: {{messages[0].from}}\nOnderwerp: {{messages[0].subject}}",
        textTemplate: "{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        to: "+15555550123",
        thinking: "low",
        timeoutSeconds: 300,
        transform: {
          module: "gmail.js",
          export: "transformGmail",
        },
      },
    ],
    gmail: {
      account: "openclaw@gmail.com",
      label: "INBOX",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
    },
  },

  // Gateway + netwerk
  gateway: {
    mode: "local",
    port: 18789,
    bind: "loopback",
    controlUi: { enabled: true, basePath: "/openclaw" },
    auth: {
      mode: "token",
      token: "gateway-token",
      allowTailscale: true,
    },
    tailscale: { mode: "serve", resetOnExit: false },
    remote: { url: "ws://gateway-host.ts.net:18789", token: "remote-token" },
    reload: { mode: "hybrid", debounceMs: 300 },
  },

  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
    },
  },
}
```

### Via een symbolische koppeling gekoppelde naburige Skill-repository

Gebruik dit wanneer een ingebouwde hoofdmap voor Skills een symbolische koppeling naar een naburige repository bevat, bijvoorbeeld
`~/.agents/skills/manager -> ~/Projects/manager/skills`.

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

- `extraDirs` scant de naburige repository als een expliciete hoofdmap voor Skills.
- `allowSymlinkTargets` zorgt ervoor dat via symbolische koppelingen gekoppelde Skill-mappen naar die vertrouwde
  werkelijke hoofdmap kunnen worden herleid zonder willekeurige ontsnappingen via symbolische koppelingen toe te staan.
- Stel `skills.workshop.allowSymlinkTargetWrites: true` in om Skill Workshop via hetzelfde vertrouwde doel van de symbolische koppeling
  schrijfbewerkingen te laten uitvoeren.

## Veelvoorkomende patronen

### Gedeelde basisset van Skills met één overschrijving

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      skills: ["github", "weather"],
    },
    list: [
      { id: "main", default: true },
      { id: "docs", workspace: "~/.openclaw/workspace-docs", skills: ["docs-search"] },
    ],
  },
}
```

- `agents.defaults.skills` is de gedeelde basisconfiguratie.
- `agents.list[].skills` vervangt die basisconfiguratie voor één agent.
- Gebruik `skills: []` wanneer een agent geen skills mag zien.

### Installatie voor meerdere platforms

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: {
    whatsapp: { allowFrom: ["+15555550123"] },
    telegram: {
      enabled: true,
      botToken: "YOUR_TOKEN",
      allowFrom: ["123456789"],
    },
    discord: {
      enabled: true,
      token: "YOUR_TOKEN",
      dm: { allowFrom: ["123456789012345678"] },
    },
  },
}
```

### Automatische goedkeuring voor een vertrouwd Node-netwerk

Houd het koppelen van apparaten handmatig, tenzij je het netwerkpad beheert. Voor een speciaal
lab- of tailnet-subnet kun je automatische goedkeuring bij de eerste koppeling van een Node-apparaat inschakelen
met exacte CIDR's of IP-adressen:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
    },
  },
}
```

Dit blijft uitgeschakeld wanneer het niet is ingesteld. Het geldt alleen voor een nieuwe koppeling met `role: node`
zonder aangevraagde scopes. Operator-/browserclients en upgrades van rol, scope, metadata of
openbare sleutel vereisen nog steeds handmatige goedkeuring.

### Veilige DM-modus (gedeelde inbox / DM's met meerdere gebruikers)

Als meer dan één persoon je bot een DM kan sturen (meerdere vermeldingen in `allowFrom`, koppelingsgoedkeuringen voor meerdere personen of `dmPolicy: "open"`), schakel je de **veilige DM-modus** in, zodat DM's van verschillende afzenders standaard niet dezelfde context delen:

```json5
{
  // Veilige DM-modus (aanbevolen voor DM-agents met meerdere gebruikers of gevoelige gegevens)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // Voorbeeld: WhatsApp-inbox voor meerdere gebruikers
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // Voorbeeld: Discord-inbox voor meerdere gebruikers
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

Voor Discord/Google Chat/IRC/Mattermost/Microsoft Teams/Slack is afzenderautorisatie standaard primair gebaseerd op ID.
Schakel directe vergelijking op veranderlijke namen/e-mailadressen/bijnamen met `dangerouslyAllowNameMatching: true` van elk kanaal alleen in als je dat risico expliciet accepteert.

### Anthropic-API-sleutel + MiniMax-terugvaloptie

```json5
{
  auth: {
    profiles: {
      "anthropic:api": {
        provider: "anthropic",
        mode: "api_key",
      },
    },
    order: {
      anthropic: ["anthropic:api"],
    },
  },
  models: {
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        api: "anthropic-messages",
        apiKey: "${MINIMAX_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

### Werkbot (beperkte toegang)

```json5
{
  agents: {
    defaults: {
      workspace: "~/work-openclaw",
      elevatedDefault: "off",
    },
    list: [
      {
        id: "main",
        identity: {
          name: "WorkBot",
          theme: "professional assistant",
        },
      },
    ],
  },
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      channels: {
        "#engineering": { enabled: true, requireMention: true },
        "#general": { enabled: true, requireMention: true },
      },
    },
  },
}
```

### Alleen lokale modellen

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "lmstudio/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Tips

- Als je `dmPolicy: "open"` instelt, moet de overeenkomende lijst `allowFrom` `"*"` bevatten.
- Provider-ID's verschillen (telefoonnummers, gebruikers-ID's, kanaal-ID's). Raadpleeg de documentatie van de provider om de indeling te bevestigen.
- Optionele secties om later toe te voegen: `web`, `browser`, `ui`, `discovery`, `plugins`, `talk`, `signal`, `imessage`.
- Zie [Providers](/nl/providers) en [Probleemoplossing](/nl/gateway/troubleshooting) voor uitgebreidere installatie-informatie.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Configuratie](/nl/gateway/configuration)
