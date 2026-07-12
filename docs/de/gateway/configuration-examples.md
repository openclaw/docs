---
read_when:
    - Erfahren Sie, wie Sie OpenClaw konfigurieren
    - Auf der Suche nach Konfigurationsbeispielen
    - OpenClaw zum ersten Mal einrichten
summary: Schemagenau konfigurierte Beispiele für gängige OpenClaw-Setups
title: Konfigurationsbeispiele
x-i18n:
    generated_at: "2026-07-12T15:22:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c3ad82ccce62e0c8dbb72f81b0de62d60d8a6282f0a327ed1cbda7ffa3e47969
    source_path: gateway/configuration-examples.md
    workflow: 16
---

Die folgenden Beispiele entsprechen dem aktuellen Konfigurationsschema. Eine vollständige Referenz und Hinweise zu den einzelnen Feldern finden Sie unter [Konfiguration](/de/gateway/configuration).

## Schnellstart

### Absolutes Minimum

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Speichern Sie dies unter `~/.openclaw/openclaw.json`. Anschließend können Sie dem Bot von dieser Nummer aus eine Direktnachricht senden.

### Empfohlene Ausgangskonfiguration

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
      visibleReplies: "message_tool", // optionale Aktivierung; sichtbare Ausgabe erfordert message(action=send)
      unmentionedInbound: "room_event",
    },
  },
}
```

## Erweitertes Beispiel (wichtige Optionen)

> Mit JSON5 können Sie Kommentare und nachgestellte Kommas verwenden. Reguläres JSON funktioniert ebenfalls.

```json5
{
  // Umgebung + Shell
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

  // Metadaten der Authentifizierungsprofile (Geheimnisse befinden sich in auth-profiles.json)
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

  // Die Identität wird pro Agent festgelegt — legen Sie sie unten unter agents.list[].identity fest.

  // Protokollierung
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // Nachrichtenformatierung
  messages: {
    messagePrefix: "[openclaw]",
    visibleReplies: "automatic",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // für gemeinsam genutzte Räume mit Modellen aktivieren, die Tools zuverlässig verwenden
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

  // Tools
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          // Optionaler CLI-Fallback (Whisper-Binärdatei):
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

  // Sitzungsverhalten
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // für Posteingänge mit mehreren Benutzern empfohlen
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
      resetArchiveRetention: "30d", // Dauer oder false
      maxDiskBytes: "500mb", // optional
      highWaterBytes: "400mb", // optional (standardmäßig 80 % von maxDiskBytes)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // Kanäle
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

  // Agent-Laufzeit
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
      skills: ["github", "weather"], // wird von Agents übernommen, bei denen list[].skills fehlt
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
        directPolicy: "allow", // allow (Standardwert) | block
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
        scope: "session", // gegenüber dem veralteten perSession: true bevorzugt
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
          theme: "hilfsbereites Faultier",
          emoji: "🦥",
        },
        // übernimmt defaults.skills -> github, weather
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
        thinkingDefault: "high", // Agent-spezifische Überschreibung des Denkmodus
        reasoningDefault: "on", // Agent-spezifische Sichtbarkeit der Schlussfolgerungen
        fastModeDefault: false, // Agent-spezifischer Schnellmodus
      },
      {
        id: "quick",
        skills: [], // keine Skills für diesen Agent
        fastModeDefault: true, // dieser Agent läuft immer im Schnellmodus
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

  // Benutzerdefinierte Modell-Provider
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

  // Cron-Aufträge
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8, // Standardwert; Cron-Verteilung + isolierte Ausführung von Cron-Agent-Durchläufen
    sessionRetention: "24h",
    runLog: {
      maxBytes: "2mb",
      keepLines: 2000,
    },
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
        messageTemplate: "Von: {{messages[0].from}}\nBetreff: {{messages[0].subject}}",
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

  // Gateway + Netzwerk
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

### Über Symlinks eingebundenes benachbartes Skill-Repository

Verwenden Sie dies, wenn ein integriertes Skill-Stammverzeichnis einen Symlink in ein benachbartes Repository enthält, zum
Beispiel `~/.agents/skills/manager -> ~/Projects/manager/skills`.

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

- `extraDirs` durchsucht das benachbarte Repository als explizites Skill-Stammverzeichnis.
- `allowSymlinkTargets` ermöglicht, dass über Symlinks eingebundene Skill-Ordner in dieses vertrauenswürdige
  tatsächliche Zielstammverzeichnis aufgelöst werden, ohne beliebige Ausbrüche über Symlinks zuzulassen.
- Damit Skill Workshop über dasselbe vertrauenswürdige Symlink-Ziel schreiben kann,
  setzen Sie `skills.workshop.allowSymlinkTargetWrites: true`.

## Häufige Muster

### Gemeinsame Skill-Basis mit einer Überschreibung

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

- `agents.defaults.skills` ist die gemeinsame Basis.
- `agents.list[].skills` ersetzt diese Basis für einen Agenten.
- Verwenden Sie `skills: []`, wenn ein Agent keine Skills sehen soll.

### Einrichtung für mehrere Plattformen

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

### Automatische Genehmigung in einem vertrauenswürdigen Node-Netzwerk

Lassen Sie die Gerätekopplung manuell, sofern Sie nicht den Netzwerkpfad kontrollieren. Für ein dediziertes
Labor- oder Tailnet-Subnetz können Sie die automatische Genehmigung neuer Node-Geräte
mit exakten CIDRs oder IPs aktivieren:

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

Ohne Konfiguration bleibt diese Funktion deaktiviert. Sie gilt nur für eine neue Kopplung mit `role: node`
ohne angeforderte Geltungsbereiche. Operator-/Browser-Clients sowie Aktualisierungen von Rolle, Geltungsbereich, Metadaten oder
öffentlichem Schlüssel müssen weiterhin manuell genehmigt werden.

### Sicherer DM-Modus (gemeinsamer Posteingang/DMs mit mehreren Benutzern)

Wenn mehr als eine Person Ihrem Bot eine DM senden kann (mehrere Einträge in `allowFrom`, Kopplungsgenehmigungen für mehrere Personen oder `dmPolicy: "open"`), aktivieren Sie den **sicheren DM-Modus**, damit DMs verschiedener Absender standardmäßig nicht denselben Kontext verwenden:

```json5
{
  // Sicherer DM-Modus (empfohlen für DM-Agenten mit mehreren Benutzern oder sensiblen Daten)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // Beispiel: WhatsApp-Posteingang für mehrere Benutzer
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // Beispiel: Discord-Posteingang für mehrere Benutzer
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

Bei Discord/Google Chat/IRC/Mattermost/Microsoft Teams/Slack basiert die Absenderautorisierung standardmäßig primär auf IDs.
Aktivieren Sie den direkten Abgleich veränderlicher Namen, E-Mail-Adressen oder Spitznamen über `dangerouslyAllowNameMatching: true` des jeweiligen Kanals nur, wenn Sie dieses Risiko ausdrücklich akzeptieren.

### Anthropic-API-Schlüssel mit MiniMax als Fallback

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

### Arbeits-Bot (eingeschränkter Zugriff)

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

### Nur lokale Modelle

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

## Tipps

- Wenn Sie `dmPolicy: "open"` festlegen, muss die zugehörige `allowFrom`-Liste `"*"` enthalten.
- Provider-IDs unterscheiden sich (Telefonnummern, Benutzer-IDs, Kanal-IDs). Prüfen Sie das Format in der Dokumentation des Providers.
- Optionale Abschnitte, die Sie später hinzufügen können: `web`, `browser`, `ui`, `discovery`, `plugins`, `talk`, `signal`, `imessage`.
- Weitere Hinweise zur Einrichtung finden Sie unter [Provider](/de/providers) und [Fehlerbehebung](/de/gateway/troubleshooting).

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Konfiguration](/de/gateway/configuration)
