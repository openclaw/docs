---
read_when:
    - Nauka konfigurowania OpenClaw
    - Szukasz przykładów konfiguracji
    - Konfigurowanie OpenClaw po raz pierwszy
summary: Przykłady konfiguracji zgodne ze schematem dla typowych wdrożeń OpenClaw
title: Przykłady konfiguracji
x-i18n:
    generated_at: "2026-07-16T18:36:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a669f3da2392aa8d2953fa124c43447afe3da971d5f5e497d6c2ec3bf88c6a
    source_path: gateway/configuration-examples.md
    workflow: 16
---

Poniższe przykłady są zgodne z bieżącym schematem konfiguracji. Pełna dokumentacja i uwagi dotyczące poszczególnych pól znajdują się w sekcji [Konfiguracja](/pl/gateway/configuration).

## Szybki start

### Absolutne minimum

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Zapisz w `~/.openclaw/openclaw.json`, aby móc wysyłać botowi wiadomości prywatne z tego numeru.

### Zalecana konfiguracja początkowa

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
          theme: "pomocny asystent",
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
      visibleReplies: "message_tool", // opcjonalne; widoczny wynik wymaga message(action=send)
      unmentionedInbound: "room_event",
    },
  },
}
```

## Rozszerzony przykład (najważniejsze opcje)

> JSON5 umożliwia używanie komentarzy i końcowych przecinków. Zwykły JSON również działa.

```json5
{
  // Środowisko + powłoka
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

  // Metadane profili uwierzytelniania (sekrety znajdują się w auth-profiles.json)
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

  // Tożsamość jest przypisana do agenta — ustaw ją poniżej w agents.list[].identity.

  // Rejestrowanie
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // Formatowanie wiadomości
  messages: {
    messagePrefix: "[openclaw]",
    visibleReplies: "automatic",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // włącz w pokojach współdzielonych z modelami niezawodnie korzystającymi z narzędzi
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

  // Narzędzia
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          // Opcjonalny mechanizm zapasowy CLI (plik wykonywalny Whisper):
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

  // Zachowanie sesji
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // zalecane dla skrzynek odbiorczych obsługiwanych przez wielu użytkowników
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
      resetArchiveRetention: "30d", // czas trwania lub false
      maxDiskBytes: "500mb", // opcjonalne
      highWaterBytes: "400mb", // opcjonalne (domyślnie 80% wartości maxDiskBytes)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // Kanały
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

  // Środowisko uruchomieniowe agenta
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
      skills: ["github", "weather"], // dziedziczone przez agentów, którzy pomijają list[].skills
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
        directPolicy: "allow", // allow (domyślnie) | block
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
        scope: "session", // preferowane zamiast starszego perSession: true
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
          theme: "pomocny leniwiec",
          emoji: "🦥",
        },
        // dziedziczy defaults.skills -> github, weather
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
        thinkingDefault: "high", // nadpisanie myślenia dla agenta
        reasoningDefault: "on", // widoczność rozumowania dla agenta
        fastModeDefault: false, // tryb szybki dla agenta
      },
      {
        id: "quick",
        skills: [], // bez Skills dla tego agenta
        fastModeDefault: true, // ten agent zawsze działa szybko
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

  // Niestandardowi dostawcy modeli
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

  // Zadania Cron
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8, // wartość domyślna; wysyłanie Cron + izolowane wykonanie tury agenta Cron
    sessionRetention: "24h",
  },

  // Webhooki
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
        messageTemplate: "Od: {{messages[0].from}}\nTemat: {{messages[0].subject}}",
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

  // Gateway + sieć
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

### Repozytorium sąsiedniego Skill połączone dowiązaniem symbolicznym

Należy użyć tej konfiguracji, gdy wbudowany katalog główny Skill zawiera dowiązanie symboliczne do sąsiedniego repozytorium, na
przykład `~/.agents/skills/manager -> ~/Projects/manager/skills`.

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

- `extraDirs` skanuje sąsiednie repozytorium jako jawny katalog główny Skill.
- `allowSymlinkTargets` umożliwia rozwiązywanie folderów Skill połączonych dowiązaniami symbolicznymi do tego zaufanego
  rzeczywistego katalogu głównego bez zezwalania na dowolne wyjścia przez dowiązania symboliczne.
- Aby umożliwić Skill Workshop zapisywanie przez ten sam zaufany cel dowiązania symbolicznego,
  ustaw `skills.workshop.allowSymlinkTargetWrites: true`.

## Typowe wzorce

### Wspólna konfiguracja bazowa Skill z jednym nadpisaniem

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

- `agents.defaults.skills` jest wspólną konfiguracją bazową.
- `agents.list[].skills` zastępuje tę konfigurację bazową dla jednego agenta.
- Należy użyć `skills: []`, gdy agent nie powinien widzieć żadnych Skills.

### Konfiguracja wieloplatformowa

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

### Automatyczne zatwierdzanie w zaufanej sieci węzłów

Parowanie urządzeń należy pozostawić w trybie ręcznym, chyba że ścieżka sieciowa jest pod pełną kontrolą. W dedykowanym
laboratorium lub podsieci tailnet można włączyć automatyczne zatwierdzanie urządzeń węzłów
przy pierwszym połączeniu, podając dokładne zakresy CIDR lub adresy IP:

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

Jeśli opcja nie jest ustawiona, pozostaje wyłączona. Dotyczy tylko nowego parowania `role: node`
bez żądanych zakresów uprawnień. Klienci operatora/przeglądarki oraz zmiany roli, zakresu uprawnień, metadanych lub
klucza publicznego nadal wymagają ręcznego zatwierdzenia.

### Bezpieczny tryb wiadomości prywatnych (wspólna skrzynka odbiorcza / wiadomości prywatne wielu użytkowników)

Jeśli więcej niż jedna osoba może wysyłać wiadomości prywatne do bota (wiele wpisów w `allowFrom`, zatwierdzenia parowania dla wielu osób lub `dmPolicy: "open"`), należy włączyć **bezpieczny tryb wiadomości prywatnych**, aby wiadomości od różnych nadawców domyślnie nie współdzieliły jednego kontekstu:

```json5
{
  // Bezpieczny tryb wiadomości prywatnych (zalecany dla agentów obsługujących wielu użytkowników lub poufne wiadomości prywatne)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // Przykład: skrzynka odbiorcza WhatsApp dla wielu użytkowników
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // Przykład: skrzynka odbiorcza Discord dla wielu użytkowników
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

W przypadku Discord/Google Chat/IRC/Mattermost/Microsoft Teams/Slack autoryzacja nadawcy jest domyślnie oparta przede wszystkim na identyfikatorze.
Bezpośrednie dopasowywanie zmiennych nazw, adresów e-mail lub pseudonimów za pomocą opcji `dangerouslyAllowNameMatching: true` danego kanału należy włączać tylko wtedy, gdy związane z tym ryzyko jest wyraźnie akceptowane.

### Klucz API Anthropic i rezerwowy MiniMax

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

### Bot służbowy (ograniczony dostęp)

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

### Tylko modele lokalne

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

## Wskazówki

- Jeśli ustawiono `dmPolicy: "open"`, odpowiednia lista `allowFrom` musi zawierać `"*"`.
- Identyfikatory dostawców mają różne formaty (numery telefonów, identyfikatory użytkowników, identyfikatory kanałów). Format należy potwierdzić w dokumentacji dostawcy.
- Opcjonalne sekcje, które można dodać później: `web`, `browser`, `ui`, `discovery`, `plugins`, `talk`, `signal`, `imessage`.
- Więcej szczegółowych informacji o konfiguracji zawierają sekcje [Dostawcy](/pl/providers) i [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Konfiguracja](/pl/gateway/configuration)
