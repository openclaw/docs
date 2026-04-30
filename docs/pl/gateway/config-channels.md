---
read_when:
    - Konfigurowanie Plugin kanału (uwierzytelnianie, kontrola dostępu, wiele kont)
    - Rozwiązywanie problemów z kluczami konfiguracji dla poszczególnych kanałów
    - Audytowanie zasad DM, zasad grupowych lub bramkowania wzmianek
summary: 'Konfiguracja kanałów: kontrola dostępu, parowanie i klucze dla poszczególnych kanałów w Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych'
title: Konfiguracja — kanały
x-i18n:
    generated_at: "2026-04-30T16:28:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba14cb43e1fe914cc7c03f41bed1b5915cc6b2ad8e0f1d47f58b7e98c1b3915
    source_path: gateway/config-channels.md
    workflow: 16
---

Klucze konfiguracji poszczególnych kanałów pod `channels.*`. Obejmuje dostęp do DM i grup,
konfiguracje wielu kont, bramkowanie wzmiankami oraz klucze poszczególnych kanałów dla Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage i innych dołączonych Plugin kanałów.

Informacje o agentach, narzędziach, środowisku uruchomieniowym Gateway i innych kluczach najwyższego poziomu znajdziesz w
[Dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że ustawiono `enabled: false`).

### Dostęp do DM i grup

Wszystkie kanały obsługują zasady DM i zasady grup:

| Zasada DM           | Zachowanie                                                      |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (domyślna) | Nieznani nadawcy otrzymują jednorazowy kod parowania; właściciel musi zatwierdzić |
| `allowlist`         | Tylko nadawcy w `allowFrom` (lub sparowanym magazynie dozwolonych) |
| `open`              | Zezwalaj na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`) |
| `disabled`          | Ignoruj wszystkie przychodzące DM                               |

| Zasada grup           | Zachowanie                                             |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (domyślna) | Tylko grupy pasujące do skonfigurowanej listy dozwolonych |
| `open`                | Pomijaj listy dozwolonych grup (bramkowanie wzmiankami nadal obowiązuje) |
| `disabled`            | Blokuj wszystkie wiadomości z grup/pokoi               |

<Note>
`channels.defaults.groupPolicy` ustawia wartość domyślną, gdy `groupPolicy` dostawcy nie jest ustawione.
Kody parowania wygasają po 1 godzinie. Oczekujące żądania parowania DM są ograniczone do **3 na kanał**.
Jeśli blok dostawcy jest całkowicie nieobecny (brak `channels.<provider>`), zasada grup w czasie wykonywania wraca do `allowlist` (fail-closed) z ostrzeżeniem przy starcie.
</Note>

### Nadpisania modelu kanału

Użyj `channels.modelByChannel`, aby przypiąć konkretne identyfikatory kanałów do modelu. Wartości akceptują `provider/model` lub skonfigurowane aliasy modeli. Mapowanie kanału obowiązuje, gdy sesja nie ma już nadpisania modelu (na przykład ustawionego przez `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Domyślne ustawienia kanałów i Heartbeat

Użyj `channels.defaults` do współdzielonego zachowania zasad grup i Heartbeat między dostawcami:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: zapasowa zasada grup, gdy `groupPolicy` na poziomie dostawcy nie jest ustawiona.
- `channels.defaults.contextVisibility`: domyślny tryb widoczności dodatkowego kontekstu dla wszystkich kanałów. Wartości: `all` (domyślnie, uwzględnia cały cytowany/wątkowy/historyczny kontekst), `allowlist` (uwzględnia tylko kontekst od nadawców z listy dozwolonych), `allowlist_quote` (tak samo jak lista dozwolonych, ale zachowuje jawny kontekst cytatu/odpowiedzi). Nadpisanie dla kanału: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględnia zdrowe statusy kanałów w wyjściu Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: uwzględnia statusy zdegradowane/błędów w wyjściu Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderuje zwarte wyjście Heartbeat w stylu wskaźnika.

### WhatsApp

WhatsApp działa przez kanał web Gateway (Baileys Web). Uruchamia się automatycznie, gdy istnieje połączona sesja.

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="Wiele kont WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Polecenia wychodzące domyślnie używają konta `default`, jeśli istnieje; w przeciwnym razie pierwszego skonfigurowanego identyfikatora konta (posortowanego).
- Opcjonalne `channels.whatsapp.defaultAccount` nadpisuje ten wybór domyślnego konta zapasowego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Starszy katalog uwierzytelniania Baileys dla jednego konta jest migrowany przez `openclaw doctor` do `whatsapp/default`.
- Nadpisania dla konta: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bota: `channels.telegram.botToken` lub `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne odrzucane), z `TELEGRAM_BOT_TOKEN` jako wartością zapasową dla konta domyślnego.
- `apiRoot` to wyłącznie główny adres Telegram Bot API. Użyj `https://api.telegram.org` albo własnego hostowanego/proxy głównego adresu, a nie `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` usuwa przypadkowy końcowy sufiks `/bot<TOKEN>`.
- Opcjonalne `channels.telegram.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- W konfiguracjach wielu kont (co najmniej 2 identyfikatory kont) ustaw jawne konto domyślne (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć routingu zapasowego; `openclaw doctor` ostrzega, gdy tego brakuje albo jest nieprawidłowe.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Telegram (migracje identyfikatorów supergrup, `/config set|unset`).
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla tematów forum (użyj kanonicznego `chatId:topic:topicId` w `match.peer.id`). Semantyka pól jest współdzielona w [Agentach ACP](/pl/tools/acp-agents#channel-specific-settings).
- Podglądy strumieni Telegram używają `sendMessage` + `editMessageText` (działa w czatach bezpośrednich i grupowych).
- Zasada ponawiania: zobacz [Zasadę ponawiania](/pl/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, z `DISCORD_BOT_TOKEN` jako wartością zapasową dla konta domyślnego.
- Bezpośrednie wywołania wychodzące, które podają jawny Discord `token`, używają tego tokena dla wywołania; ustawienia ponawiania/polityki konta nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
- Opcjonalne `channels.discord.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Użyj `user:<id>` (DM) albo `channel:<id>` (kanał gildii) dla celów dostarczania; same numeryczne identyfikatory są odrzucane.
- Slugi gildii są pisane małymi literami, ze spacjami zastąpionymi przez `-`; klucze kanałów używają nazwy w postaci sluga (bez `#`). Preferuj identyfikatory gildii.
- Wiadomości autorstwa botów są domyślnie ignorowane. `allowBots: true` je włącza; użyj `allowBots: "mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal filtrowane).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz nadpisania kanałów) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyłączeniem @everyone/@here).
- `maxLinesPerMessage` (domyślnie 17) dzieli wysokie wiadomości nawet wtedy, gdy mają mniej niż 2000 znaków.
- `channels.discord.threadBindings` steruje trasowaniem powiązanym z wątkami Discord:
  - `enabled`: nadpisanie Discord dla funkcji sesji powiązanych z wątkiem (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane dostarczanie/trasowanie)
  - `idleHours`: nadpisanie Discord dla automatycznego cofania fokusu po nieaktywności w godzinach (`0` wyłącza)
  - `maxAgeHours`: nadpisanie Discord dla twardego maksymalnego wieku w godzinach (`0` wyłącza)
  - `spawnSubagentSessions`: przełącznik opt-in dla automatycznego tworzenia/powiązywania wątku przez `sessions_spawn({ thread: true })`
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (użyj identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest wspólna w [Agenci ACP](/pl/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu dla kontenerów komponentów Discord v2.
- `channels.discord.voice` włącza rozmowy w kanałach głosowych Discord oraz opcjonalne automatyczne dołączanie i nadpisania LLM + TTS.
- `channels.discord.voice.model` opcjonalnie nadpisuje model LLM używany do odpowiedzi w kanałach głosowych Discord.
- `channels.discord.voice.daveEncryption` i `channels.discord.voice.decryptionFailureTolerance` są przekazywane do opcji DAVE `@discordjs/voice` (domyślnie `true` i `24`).
- OpenClaw dodatkowo próbuje odzyskiwać odbiór głosu przez opuszczenie sesji głosowej i ponowne dołączenie do niej po powtarzających się błędach odszyfrowania.
- `channels.discord.streaming` jest kanonicznym kluczem trybu strumieniowania. Starsze wartości `streamMode` oraz logiczne `streaming` są automatycznie migrowane.
- `channels.discord.autoPresence` mapuje dostępność środowiska uruchomieniowego na obecność bota (healthy => online, degraded => idle, exhausted => dnd) i pozwala na opcjonalne nadpisania tekstu statusu.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza zmienne dopasowywanie nazwy/tagu (tryb zgodności break-glass).
- `channels.discord.execApprovals`: natywne dla Discord dostarczanie zatwierdzeń exec oraz autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` albo `"auto"` (domyślnie). W trybie automatycznym zatwierdzenia exec aktywują się, gdy zatwierdzających można rozwiązać z `approvers` albo `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discord uprawnionych do zatwierdzania żądań exec. Gdy pominięte, używa zapasowo `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg albo regex).
  - `target`: gdzie wysyłać monity zatwierdzenia. `"dm"` (domyślnie) wysyła do DM zatwierdzających, `"channel"` wysyła do kanału źródłowego, `"both"` wysyła do obu. Gdy cel zawiera `"channel"`, przyciski mogą być używane tylko przez rozwiązanych zatwierdzających.
  - `cleanupAfterResolve`: gdy `true`, usuwa DM zatwierdzeń po zatwierdzeniu, odmowie albo przekroczeniu czasu.

**Tryby powiadomień o reakcjach:** `off` (brak), `own` (wiadomości bota, domyślnie), `all` (wszystkie wiadomości), `allowlist` (z `guilds.<id>.users` dla wszystkich wiadomości).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON konta usługi: wbudowany (`serviceAccount`) albo oparty na pliku (`serviceAccountFile`).
- SecretRef konta usługi jest również obsługiwany (`serviceAccountRef`).
- Wartości zapasowe env: `GOOGLE_CHAT_SERVICE_ACCOUNT` albo `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Użyj `spaces/<spaceId>` albo `users/<userId>` dla celów dostarczania.
- `channels.googlechat.dangerouslyAllowNameMatching` ponownie włącza zmienne dopasowywanie podmiotu e-mail (tryb zgodności break-glass).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Tryb Socket** wymaga zarówno `botToken`, jak i `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` jako zapasowa wartość env dla konta domyślnego).
- **Tryb HTTP** wymaga `botToken` oraz `signingSecret` (w katalogu głównym albo dla konta).
- `socketMode` przekazuje strojenie transportu Slack SDK Socket Mode do publicznego API odbiornika Bolt. Używaj go tylko podczas badania przekroczeń czasu ping/pong albo nieaktualnego zachowania websocket.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują jawne
  ciągi znaków albo obiekty SecretRef.
- Migawki kont Slack ujawniają pola źródła/statusu dla poszczególnych poświadczeń, takie jak
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` oraz, w trybie HTTP,
  `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest
  skonfigurowane przez SecretRef, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego nie mogła
  rozwiązać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Slack.
- Opcjonalne `channels.slack.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- `channels.slack.streaming.mode` jest kanonicznym kluczem trybu strumieniowania Slack. `channels.slack.streaming.nativeTransport` kontroluje natywny transport strumieniowania Slack. Starsze wartości `streamMode`, logiczne `streaming` oraz `nativeStreaming` są automatycznie migrowane.
- Użyj `user:<id>` (DM) albo `channel:<id>` dla celów dostarczania.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji wątku:** `thread.historyScope` jest osobna dla wątku (domyślnie) albo współdzielona w kanale. `thread.inheritParent` kopiuje transkrypt kanału nadrzędnego do nowych wątków.

- Natywne strumieniowanie Slack oraz status wątku w stylu asystenta Slack „pisze...” wymagają celu wątku odpowiedzi. DM najwyższego poziomu pozostają domyślnie poza wątkiem, więc używają `typingReaction` albo normalnego dostarczania zamiast podglądu w stylu wątku.
- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack podczas generowania odpowiedzi, a następnie usuwa ją po ukończeniu. Użyj krótkiego kodu emoji Slack, takiego jak `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slack dostarczanie zatwierdzeń exec oraz autoryzacja zatwierdzających. Ten sam schemat co Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slack), `agentFilter`, `sessionFilter` i `target` (`"dm"`, `"channel"` albo `"both"`).

| Grupa akcji | Domyślnie | Uwagi                  |
| ------------ | ------- | ---------------------- |
| reactions    | włączone | Reagowanie + lista reakcji |
| messages     | włączone | Odczyt/wysyłanie/edycja/usuwanie  |
| pins         | włączone | Przypinanie/odpinanie/lista         |
| memberInfo   | włączone | Informacje o członku            |
| emojiList    | włączone | Lista niestandardowych emoji      |

### Mattermost

Mattermost jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw. Starsze albo
niestandardowe kompilacje mogą zainstalować bieżący pakiet npm przez
`openclaw plugins install @openclaw/mattermost`; jeśli npm zgłasza pakiet
należący do OpenClaw jako przestarzały, użyj dołączonego pluginu albo lokalnego checkoutu,
dopóki nowszy pakiet npm nie zostanie opublikowany.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Tryby czatu: `oncall` (odpowiada przy @-wzmiance, domyślnie), `onmessage` (każda wiadomość), `onchar` (wiadomości zaczynające się od prefiksu wyzwalacza).

Gdy natywne polecenia Mattermost są włączone:

- `commands.callbackPath` musi być ścieżką (na przykład `/api/channels/mattermost/command`), a nie pełnym adresem URL.
- `commands.callbackUrl` musi rozwiązywać się do punktu końcowego Gateway OpenClaw i być osiągalny z serwera Mattermost.
- Natywne wywołania zwrotne slash są uwierzytelniane tokenami dla poszczególnych poleceń zwracanymi
  przez Mattermost podczas rejestracji polecenia slash. Jeśli rejestracja się nie powiedzie albo żadne
  polecenia nie zostaną aktywowane, OpenClaw odrzuca wywołania zwrotne komunikatem
  `Unauthorized: invalid command token.`
- Dla prywatnych/tailnet/wewnętrznych hostów wywołań zwrotnych Mattermost może wymagać,
  aby `ServiceSettings.AllowedUntrustedInternalConnections` zawierało host/domenę wywołania zwrotnego.
  Użyj wartości hosta/domeny, nie pełnych adresów URL.
- `channels.mattermost.configWrites`: zezwól albo odmów zapisów konfiguracji inicjowanych przez Mattermost.
- `channels.mattermost.requireMention`: wymagaj `@mention` przed odpowiadaniem w kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: nadpisanie bramkowania wzmianką dla kanału (`"*"` jako domyślne).
- Opcjonalne `channels.mattermost.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

- `channels.signal.account`: przypnij uruchamianie kanału do określonej tożsamości konta Signal.
- `channels.signal.configWrites`: zezwól lub zabroń zapisów konfiguracji inicjowanych przez Signal.
- Opcjonalne `channels.signal.defaultAccount` zastępuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.

### BlueBubbles

BlueBubbles to zalecana ścieżka iMessage (oparta na Plugin, skonfigurowana w `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Główne ścieżki kluczy omówione tutaj: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Opcjonalne `channels.bluebubbles.defaultAccount` zastępuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą powiązać konwersacje BlueBubbles z trwałymi sesjami ACP. Użyj uchwytu BlueBubbles albo ciągu docelowego (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Semantyka pól wspólnych: [Agenci ACP](/pl/tools/acp-agents#channel-specific-settings).
- Pełna konfiguracja kanału BlueBubbles jest udokumentowana w [BlueBubbles](/pl/channels/bluebubbles).

### iMessage

OpenClaw uruchamia `imsg rpc` (JSON-RPC przez stdio). Nie jest wymagany daemon ani port.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- Opcjonalne `channels.imessage.defaultAccount` zastępuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.

- Wymaga pełnego dostępu do dysku dla bazy danych Wiadomości.
- Preferuj cele `chat_id:<id>`. Użyj `imsg chats --limit 20`, aby wyświetlić listę czatów.
- `cliPath` może wskazywać wrapper SSH; ustaw `remoteHost` (`host` lub `user@host`) do pobierania załączników przez SCP.
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają ścieżki załączników przychodzących (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa ścisłej weryfikacji klucza hosta, więc upewnij się, że klucz hosta pośredniczącego już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwól lub zabroń zapisów konfiguracji inicjowanych przez iMessage.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą powiązać konwersacje iMessage z trwałymi sesjami ACP. Użyj znormalizowanego uchwytu albo jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Semantyka pól wspólnych: [Agenci ACP](/pl/tools/acp-agents#channel-specific-settings).

<Accordion title="Przykład wrappera SSH dla iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix jest oparty na Plugin i skonfigurowany w `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Uwierzytelnianie tokenem używa `accessToken`; uwierzytelnianie hasłem używa `userId` + `password`.
- `channels.matrix.proxy` kieruje ruch HTTP Matrix przez jawny serwer proxy HTTP(S). Nazwane konta mogą go zastąpić przez `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` zezwala na prywatne/wewnętrzne serwery homeserver. `proxy` i ta zgoda sieciowa są niezależnymi mechanizmami kontroli.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach z wieloma kontami.
- `channels.matrix.autoJoin` domyślnie ma wartość `off`, więc zaproszone pokoje i nowe zaproszenia w stylu DM są ignorowane, dopóki nie ustawisz `autoJoin: "allowlist"` z `autoJoinAllowlist` albo `autoJoin: "always"`.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` albo `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzających można ustalić z `approvers` albo `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`) uprawnione do zatwierdzania żądań exec.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub wyrażenie regularne).
  - `target`: gdzie wysyłać monity o zatwierdzenie. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) albo `"both"`.
  - Nadpisania dla poszczególnych kont: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kontroluje, jak DM w Matrix są grupowane w sesje: `per-user` (domyślnie) współdzieli według kierowanego peera, a `per-room` izoluje każdy pokój DM.
- Sondy statusu Matrix i wyszukiwania w katalogu na żywo używają tej samej polityki proxy co ruch w czasie działania.
- Pełna konfiguracja Matrix, reguły kierowania i przykłady konfiguracji są udokumentowane w [Matrix](/pl/channels/matrix).

### Microsoft Teams

Microsoft Teams jest oparty na Plugin i skonfigurowany w `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Główne ścieżki kluczy omówione tutaj: `channels.msteams`, `channels.msteams.configWrites`.
- Pełna konfiguracja Teams (poświadczenia, Webhook, polityka DM/grup, nadpisania dla zespołów/kanałów) jest udokumentowana w [Microsoft Teams](/pl/channels/msteams).

### IRC

IRC jest oparty na Plugin i skonfigurowany w `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Główne ścieżki kluczy omówione tutaj: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Opcjonalne `channels.irc.defaultAccount` zastępuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Pełna konfiguracja kanału IRC (host/port/TLS/kanały/listy dozwolonych/bramkowanie wzmianką) jest udokumentowana w [IRC](/pl/channels/irc).

### Wiele kont (wszystkie kanały)

Uruchamiaj wiele kont na kanał (każde z własnym `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` jest używane, gdy `accountId` jest pominięte (CLI + routing).
- Tokeny środowiskowe dotyczą tylko konta **domyślnego**.
- Bazowe ustawienia kanału dotyczą wszystkich kont, chyba że zostaną nadpisane dla konta.
- Użyj `bindings[].match.accountId`, aby kierować każde konto do innego agenta.
- Jeśli dodasz konto inne niż domyślne przez `openclaw channels add` (albo onboarding kanału), gdy nadal używasz jednokontowej konfiguracji kanału na najwyższym poziomie, OpenClaw najpierw przeniesie wartości jednokontowe z najwyższego poziomu, przypisane do konta, do mapy kont kanału, aby pierwotne konto nadal działało. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący pasujący cel nazwany/domyślny.
- Istniejące powiązania tylko z kanałem (bez `accountId`) nadal pasują do konta domyślnego; powiązania przypisane do kont pozostają opcjonalne.
- `openclaw doctor --fix` naprawia także mieszane kształty, przenosząc jednokontowe wartości z najwyższego poziomu, przypisane do konta, do promowanego konta wybranego dla tego kanału. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący pasujący cel nazwany/domyślny.

### Inne kanały Plugin

Wiele kanałów Plugin jest konfigurowanych jako `channels.<id>` i udokumentowanych na swoich dedykowanych stronach kanałów (na przykład Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat i Twitch).
Zobacz pełny indeks kanałów: [Kanały](/pl/channels).

### Bramkowanie wzmianką w czacie grupowym

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianki w metadanych albo bezpieczne wzorce wyrażeń regularnych). Dotyczy czatów grupowych WhatsApp, Telegram, Discord, Google Chat i iMessage.

Widoczne odpowiedzi są kontrolowane osobno. Pokoje grupowe/kanałowe domyślnie używają `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw nadal przetwarza turę, ale zwykłe odpowiedzi końcowe pozostają prywatne, a widoczne wyjście w pokoju wymaga `message(action=send)`. Ustaw `"automatic"` tylko wtedy, gdy chcesz zachować starsze zachowanie, w którym zwykłe odpowiedzi są publikowane z powrotem w pokoju. Aby zastosować to samo zachowanie widocznych odpowiedzi tylko przez narzędzie także do czatów bezpośrednich, ustaw `messages.visibleReplies: "message_tool"`.

Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku. Restartuj tylko wtedy, gdy obserwowanie plików albo przeładowywanie konfiguracji jest wyłączone we wdrożeniu.

**Typy wzmianek:**

- **Wzmianki w metadanych**: natywne wzmianki platformy @. Ignorowane w trybie czatu z samym sobą w WhatsApp.
- **Wzorce tekstowe**: bezpieczne wzorce wyrażeń regularnych w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Bramkowanie wzmianką jest egzekwowane tylko wtedy, gdy wykrywanie jest możliwe (natywne wzmianki albo co najmniej jeden wzorzec).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` ustawia globalną wartość domyślną. Kanały mogą ją nadpisać przez `channels.<channel>.historyLimit` (albo dla konta). Ustaw `0`, aby wyłączyć.

`messages.visibleReplies` to globalna wartość domyślna dla tur źródłowych; `messages.groupChat.visibleReplies` nadpisuje ją dla tur źródłowych grup/kanałów. Listy dozwolonych kanału i bramkowanie wzmianką nadal decydują, czy tura jest przetwarzana.

#### Limity historii DM

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Rozwiązywanie: nadpisanie dla DM → domyślna wartość dostawcy → brak limitu (wszystko zachowane).

Obsługiwane: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Tryb czatu z samym sobą

Dodaj własny numer do `allowFrom`, aby włączyć tryb czatu z samym sobą (ignoruje natywne wzmianki @, odpowiada tylko na wzorce tekstowe):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Polecenia (obsługa poleceń czatu)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Szczegóły polecenia">

- Ten blok konfiguruje powierzchnie poleceń. Aktualny wbudowany i dołączony katalog poleceń znajdziesz w sekcji [Polecenia ukośnikiem](/pl/tools/slash-commands).
- Ta strona jest **dokumentacją kluczy konfiguracji**, a nie pełnym katalogiem poleceń. Polecenia należące do kanałów/Pluginów, takie jak QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` oraz Talk `/voice`, są opisane na stronach swoich kanałów/Pluginów oraz w sekcji [Polecenia ukośnikiem](/pl/tools/slash-commands).
- Polecenia tekstowe muszą być **samodzielnymi** wiadomościami zaczynającymi się od `/`.
- `native: "auto"` włącza natywne polecenia dla Discord/Telegram, pozostawia Slack wyłączony.
- `nativeSkills: "auto"` włącza natywne polecenia Skills dla Discord/Telegram, pozostawia Slack wyłączony.
- Nadpisanie dla kanału: `channels.discord.commands.native` (wartość boolowska albo `"auto"`). `false` usuwa wcześniej zarejestrowane polecenia.
- Nadpisz rejestrację natywnych poleceń Skills dla kanału za pomocą `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` dodaje dodatkowe wpisy menu bota Telegram.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` oraz nadawcy w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczytuje/zapisuje `openclaw.json`). W przypadku klientów `chat.send` Gateway trwałe zapisy `/config set|unset` wymagają też `operator.admin`; tylko do odczytu `/config show` pozostaje dostępne dla zwykłych klientów operatora z zakresem zapisu.
- `mcp: true` włącza `/mcp` dla konfiguracji serwera MCP zarządzanego przez OpenClaw w `mcp.servers`.
- `plugins: true` włącza `/plugins` do wykrywania, instalowania oraz włączania/wyłączania Pluginów.
- `channels.<provider>.configWrites` kontroluje mutacje konfiguracji dla kanału (domyślnie: true).
- W kanałach z wieloma kontami `channels.<provider>.accounts.<id>.configWrites` kontroluje również zapisy kierowane do tego konta (na przykład `/allowlist --config --account <id>` albo `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` wyłącza `/restart` oraz akcje narzędzia restartu Gateway. Domyślnie: `true`.
- `ownerAllowFrom` to jawna allowlista właściciela dla poleceń/narzędzi dostępnych tylko dla właściciela. Jest oddzielna od `allowFrom`.
- `ownerDisplay: "hash"` haszuje identyfikatory właściciela w prompcie systemowym. Ustaw `ownerDisplaySecret`, aby kontrolować haszowanie.
- `allowFrom` jest osobne dla każdego dostawcy. Gdy jest ustawione, stanowi **jedyne** źródło autoryzacji (allowlisty/parowanie kanałów oraz `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala poleceniom omijać zasady grup dostępu, gdy `allowFrom` nie jest ustawione.
- Mapa dokumentacji poleceń:
  - wbudowany i dołączony katalog: [Polecenia ukośnikiem](/pl/tools/slash-commands)
  - powierzchnie poleceń specyficzne dla kanałów: [Kanały](/pl/channels)
  - polecenia QQ Bot: [QQ Bot](/pl/channels/qqbot)
  - polecenia parowania: [Parowanie](/pl/channels/pairing)
  - polecenie karty LINE: [LINE](/pl/channels/line)
  - dreaming pamięci: [Dreaming](/pl/concepts/dreaming)

</Accordion>

---

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — klucze najwyższego poziomu
- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Przegląd kanałów](/pl/channels)
