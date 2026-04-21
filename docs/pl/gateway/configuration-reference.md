---
read_when:
    - Potrzebujesz dokładnej semantyki konfiguracji na poziomie pól lub wartości domyślnych
    - Weryfikujesz bloki konfiguracji kanału, modelu, Gatewaya lub narzędzia
summary: Dokumentacja konfiguracji Gatewaya dla głównych kluczy OpenClaw, wartości domyślnych i odnośników do dedykowanych dokumentacji podsystemów
title: Dokumentacja konfiguracji
x-i18n:
    generated_at: "2026-04-21T09:53:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82a9a150a862c20863c187ac5c118b74aeac624e99849cf4c6e3fb56629423e
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Dokumentacja konfiguracji

Podstawowa dokumentacja konfiguracji dla `~/.openclaw/openclaw.json`. Aby zobaczyć przegląd zorientowany na zadania, przejdź do [Configuration](/pl/gateway/configuration).

Ta strona opisuje główne obszary konfiguracji OpenClaw i odsyła dalej, gdy dany podsystem ma własną, bardziej szczegółową dokumentację. **Nie** próbuje wstawiać na jednej stronie każdego katalogu komend należącego do kanału/pluginu ani każdego szczegółowego parametru pamięci/QMD.

Źródło prawdy w kodzie:

- `openclaw config schema` wypisuje aktualny JSON Schema używany do walidacji i interfejsu Control UI, z dołączonymi metadanymi pluginów/kanałów, jeśli są dostępne
- `config.schema.lookup` zwraca jeden węzeł schematu ograniczony do ścieżki dla narzędzi drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` walidują hash baseline dokumentacji konfiguracji względem bieżącej powierzchni schematu

Dedykowane dokumentacje szczegółowe:

- [Memory configuration reference](/pl/reference/memory-config) dla `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` i konfiguracji Dreaming pod `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/pl/tools/slash-commands) dla aktualnego katalogu wbudowanych + dołączonych komend
- strony właścicieli kanałów/pluginów dla powierzchni komend specyficznych dla kanału

Format konfiguracji to **JSON5** (dozwolone komentarze + przecinki końcowe). Wszystkie pola są opcjonalne — OpenClaw używa bezpiecznych wartości domyślnych, gdy zostaną pominięte.

---

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że ustawiono `enabled: false`).

### Dostęp do DM i grup

Wszystkie kanały obsługują zasady DM i zasady grup:

| DM policy           | Zachowanie                                                      |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (domyślne) | Nieznani nadawcy otrzymują jednorazowy kod parowania; właściciel musi zatwierdzić |
| `allowlist`         | Tylko nadawcy z `allowFrom` (lub ze sparowanego magazynu zezwoleń) |
| `open`              | Zezwala na wszystkie przychodzące DM-y (wymaga `allowFrom: ["*"]`) |
| `disabled`          | Ignoruje wszystkie przychodzące DM-y                            |

| Group policy          | Zachowanie                                               |
| --------------------- | -------------------------------------------------------- |
| `allowlist` (domyślne) | Tylko grupy pasujące do skonfigurowanej allowlisty      |
| `open`                | Pomija allowlisty grupowe (bramkowanie wzmianek nadal obowiązuje) |
| `disabled`            | Blokuje wszystkie wiadomości grupowe/pokojów            |

<Note>
`channels.defaults.groupPolicy` ustawia wartość domyślną, gdy `groupPolicy` dostawcy nie jest ustawione.
Kody parowania wygasają po 1 godzinie. Oczekujące żądania parowania DM są ograniczone do **3 na kanał**.
Jeśli blok dostawcy całkowicie nie istnieje (`channels.<provider>` jest nieobecne), zasada grup runtime przechodzi na `allowlist` (fail-closed) z ostrzeżeniem przy uruchomieniu.
</Note>

### Nadpisania modelu dla kanałów

Użyj `channels.modelByChannel`, aby przypisać konkretne identyfikatory kanałów do modelu. Wartości akceptują `provider/model` lub skonfigurowane aliasy modeli. Mapowanie kanału jest stosowane, gdy sesja nie ma już nadpisania modelu (na przykład ustawionego przez `/model`).

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

### Ustawienia domyślne kanałów i Heartbeat

Użyj `channels.defaults` do współdzielonych zasad grup i zachowania Heartbeat między dostawcami:

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

- `channels.defaults.groupPolicy`: zapasowa zasada grup, gdy `groupPolicy` na poziomie dostawcy nie jest ustawione.
- `channels.defaults.contextVisibility`: domyślny tryb widoczności kontekstu uzupełniającego dla wszystkich kanałów. Wartości: `all` (domyślne, dołączaj cały kontekst cytatu/wątku/historii), `allowlist` (dołączaj tylko kontekst od nadawców z allowlisty), `allowlist_quote` (jak allowlist, ale zachowuje jawny kontekst cytatu/odpowiedzi). Nadpisanie per kanał: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględnia zdrowe statusy kanałów w danych wyjściowych Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: uwzględnia statusy zdegradowane/z błędami w danych wyjściowych Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderuje zwarte dane wyjściowe Heartbeat w stylu wskaźnika.

### WhatsApp

WhatsApp działa przez web channel Gatewaya (Baileys Web). Uruchamia się automatycznie, gdy istnieje powiązana sesja.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticki (false w trybie czatu z samym sobą)
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

- Komendy wychodzące domyślnie używają konta `default`, jeśli istnieje; w przeciwnym razie pierwszego skonfigurowanego identyfikatora konta (posortowanego).
- Opcjonalne `channels.whatsapp.defaultAccount` nadpisuje ten zapasowy wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Starszy katalog uwierzytelniania Baileys dla pojedynczego konta jest migrowany przez `openclaw doctor` do `whatsapp/default`.
- Nadpisania per konto: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Odpowiedzi mają być krótkie.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Trzymaj się tematu.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Kopia zapasowa Git" },
        { command: "generate", description: "Utwórz obraz" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (domyślnie: off; włącz jawnie, aby uniknąć limitów szybkości dla edycji podglądu)
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bota: `channels.telegram.botToken` lub `channels.telegram.tokenFile` (tylko zwykły plik; symlinki są odrzucane), z `TELEGRAM_BOT_TOKEN` jako wartością zapasową dla konta domyślnego.
- Opcjonalne `channels.telegram.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- W konfiguracjach z wieloma kontami (2+ identyfikatory kont) ustaw jawne konto domyślne (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć routingu zapasowego; `openclaw doctor` ostrzega, gdy tego brakuje lub jest nieprawidłowe.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane z Telegrama (migracje identyfikatorów supergrup, `/config set|unset`).
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla tematów forum (użyj kanonicznego `chatId:topic:topicId` w `match.peer.id`). Semantyka pól jest współdzielona w [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
- Podglądy streamów Telegram używają `sendMessage` + `editMessageText` (działa w czatach bezpośrednich i grupowych).
- Zasada ponawiania: zobacz [Retry policy](/pl/concepts/retry).

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
              systemPrompt: "Tylko krótkie odpowiedzi.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress mapuje się do partial na Discordzie)
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
        spawnSubagentSessions: false, // opt-in dla sessions_spawn({ thread: true })
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
- Bezpośrednie wywołania wychodzące, które podają jawny `token` Discorda, używają tego tokena do wywołania; ustawienia ponawiania/polityki konta nadal pochodzą z wybranego konta w aktywnej migawce runtime.
- Opcjonalne `channels.discord.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Dla celów dostarczania używaj `user:<id>` (DM) lub `channel:<id>` (kanał guild); same numeryczne identyfikatory są odrzucane.
- Slugi guild są małymi literami, a spacje są zastępowane przez `-`; klucze kanałów używają zslugowanej nazwy (bez `#`). Preferuj identyfikatory guild.
- Wiadomości napisane przez boty są domyślnie ignorowane. `allowBots: true` je włącza; użyj `allowBots: "mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal są filtrowane).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz nadpisania kanałów) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyłączeniem @everyone/@here).
- `maxLinesPerMessage` (domyślnie 17) dzieli wysokie wiadomości nawet wtedy, gdy mają mniej niż 2000 znaków.
- `channels.discord.threadBindings` kontroluje routing powiązany z wątkami Discorda:
  - `enabled`: nadpisanie Discorda dla funkcji sesji powiązanych z wątkiem (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz dostarczanie/routing powiązany)
  - `idleHours`: nadpisanie Discorda dla automatycznego odpinania po bezczynności w godzinach (`0` wyłącza)
  - `maxAgeHours`: nadpisanie Discorda dla twardego maksymalnego wieku w godzinach (`0` wyłącza)
  - `spawnSubagentSessions`: przełącznik opt-in dla automatycznego tworzenia/powiązywania wątków przez `sessions_spawn({ thread: true })`
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (użyj identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest współdzielona w [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu dla kontenerów Discord components v2.
- `channels.discord.voice` włącza konwersacje w kanałach głosowych Discorda oraz opcjonalne auto-join + nadpisania TTS.
- `channels.discord.voice.daveEncryption` i `channels.discord.voice.decryptionFailureTolerance` są przekazywane do opcji DAVE w `@discordjs/voice` (domyślnie `true` i `24`).
- OpenClaw dodatkowo próbuje odzyskać odbiór głosu przez opuszczenie i ponowne dołączenie do sesji głosowej po powtarzających się błędach deszyfrowania.
- `channels.discord.streaming` jest kanonicznym kluczem trybu streamingu. Starsze wartości `streamMode` i logiczne `streaming` są automatycznie migrowane.
- `channels.discord.autoPresence` mapuje dostępność runtime na status obecności bota (healthy => online, degraded => idle, exhausted => dnd) i pozwala opcjonalnie nadpisywać tekst statusu.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie po zmiennej nazwie/tagu (awaryjny tryb zgodności).
- `channels.discord.execApprovals`: natywne dla Discorda dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzający mogą zostać rozpoznani na podstawie `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discorda, którzy mogą zatwierdzać żądania exec. Gdy pominięte, używane jest `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna allowlista identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub regex).
  - `target`: miejsce wysyłania próśb o zatwierdzenie. `"dm"` (domyślnie) wysyła do DM-ów zatwierdzających, `"channel"` wysyła do kanału źródłowego, `"both"` wysyła do obu. Gdy target obejmuje `"channel"`, przyciski mogą być używane tylko przez rozpoznanych zatwierdzających.
  - `cleanupAfterResolve`: gdy `true`, usuwa DM-y zatwierdzeń po zatwierdzeniu, odrzuceniu lub przekroczeniu limitu czasu.

**Tryby powiadomień o reakcjach:** `off` (brak), `own` (wiadomości bota, domyślnie), `all` (wszystkie wiadomości), `allowlist` (od `guilds.<id>.users` dla wszystkich wiadomości).

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

- JSON konta usługi: inline (`serviceAccount`) lub z pliku (`serviceAccountFile`).
- SecretRef dla konta usługi również jest obsługiwany (`serviceAccountRef`).
- Wartości zapasowe z env: `GOOGLE_CHAT_SERVICE_ACCOUNT` lub `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Dla celów dostarczania używaj `spaces/<spaceId>` lub `users/<userId>`.
- `channels.googlechat.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie po zmiennym principalu e-mail (awaryjny tryb zgodności).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
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
          systemPrompt: "Tylko krótkie odpowiedzi.",
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

- **Socket mode** wymaga zarówno `botToken`, jak i `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` jako zapasowe wartości env dla konta domyślnego).
- **HTTP mode** wymaga `botToken` oraz `signingSecret` (na poziomie głównym lub per konto).
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują zwykłe
  ciągi tekstowe lub obiekty SecretRef.
- Migawki kont Slacka udostępniają pola źródła/statusu per poświadczenie, takie jak
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` oraz, w trybie HTTP,
  `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest
  skonfigurowane przez SecretRef, ale bieżąca ścieżka komendy/runtime nie mogła
  rozwiązać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane ze Slacka.
- Opcjonalne `channels.slack.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- `channels.slack.streaming.mode` jest kanonicznym kluczem trybu streamingu Slacka. `channels.slack.streaming.nativeTransport` kontroluje natywny transport streamingu Slacka. Starsze wartości `streamMode`, logiczne `streaming` i `nativeStreaming` są automatycznie migrowane.
- Dla celów dostarczania używaj `user:<id>` (DM) lub `channel:<id>`.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji wątków:** `thread.historyScope` działa per wątek (domyślnie) lub współdzielone w całym kanale. `thread.inheritParent` kopiuje transkrypt kanału nadrzędnego do nowych wątków.

- Natywny streaming Slacka oraz status wątku w stylu asystenta Slack „is typing...” wymagają docelowego wątku odpowiedzi. DM-y najwyższego poziomu domyślnie pozostają poza wątkiem, więc używają `typingReaction` lub zwykłego dostarczania zamiast podglądu w stylu wątku.
- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slacka podczas generowania odpowiedzi, a następnie usuwa ją po zakończeniu. Użyj shortcode emoji Slacka, takiego jak `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slacka dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających. Ten sam schemat co w Discordzie: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slacka), `agentFilter`, `sessionFilter` i `target` (`"dm"`, `"channel"` lub `"both"`).

| Grupa działań | Domyślnie | Uwagi                     |
| ------------- | --------- | ------------------------- |
| reactions     | włączone  | Reagowanie + lista reakcji |
| messages      | włączone  | Odczyt/wysyłanie/edycja/usuwanie |
| pins          | włączone  | Przypinanie/odpinanie/lista |
| memberInfo    | włączone  | Informacje o członku      |
| emojiList     | włączone  | Lista własnych emoji      |

### Mattermost

Mattermost jest dostarczany jako plugin: `openclaw plugins install @openclaw/mattermost`.

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

Tryby czatu: `oncall` (odpowiada na wzmiankę @, domyślnie), `onmessage` (na każdą wiadomość), `onchar` (na wiadomości zaczynające się od prefiksu wyzwalającego).

Gdy natywne komendy Mattermost są włączone:

- `commands.callbackPath` musi być ścieżką (na przykład `/api/channels/mattermost/command`), a nie pełnym URL-em.
- `commands.callbackUrl` musi wskazywać endpoint Gatewaya OpenClaw i być osiągalny z serwera Mattermost.
- Natywne callbacki slash są uwierzytelniane tokenami per komenda zwracanymi
  przez Mattermost podczas rejestracji slash command. Jeśli rejestracja się nie powiedzie lub żadne
  komendy nie zostaną aktywowane, OpenClaw odrzuci callbacki z komunikatem
  `Unauthorized: invalid command token.`
- Dla prywatnych/tailnet/wewnętrznych hostów callbacków Mattermost może wymagać,
  aby `ServiceSettings.AllowedUntrustedInternalConnections` zawierało host/domenę callbacka.
  Używaj wartości host/domena, a nie pełnych URL-i.
- `channels.mattermost.configWrites`: zezwala lub zabrania zapisów konfiguracji inicjowanych z Mattermost.
- `channels.mattermost.requireMention`: wymaga `@mention` przed odpowiedzią w kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: nadpisanie bramkowania wzmianek per kanał (`"*"` dla wartości domyślnej).
- Opcjonalne `channels.mattermost.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // opcjonalne powiązanie konta
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

- `channels.signal.account`: przypina uruchomienie kanału do konkretnej tożsamości konta Signal.
- `channels.signal.configWrites`: zezwala lub zabrania zapisów konfiguracji inicjowanych z Signal.
- Opcjonalne `channels.signal.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.

### BlueBubbles

BlueBubbles to zalecana ścieżka dla iMessage (oparta na pluginie, konfigurowana pod `channels.bluebubbles`).

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

- Podstawowe ścieżki kluczy opisane tutaj: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Opcjonalne `channels.bluebubbles.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje BlueBubbles z trwałymi sesjami ACP. Użyj uchwytu BlueBubbles lub ciągu celu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Współdzielona semantyka pól: [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
- Pełna konfiguracja kanału BlueBubbles jest opisana w [BlueBubbles](/pl/channels/bluebubbles).

### iMessage

OpenClaw uruchamia `imsg rpc` (JSON-RPC przez stdio). Nie wymaga demona ani portu.

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

- Opcjonalne `channels.imessage.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.

- Wymaga Full Disk Access do bazy danych Messages.
- Preferuj cele `chat_id:<id>`. Użyj `imsg chats --limit 20`, aby wyświetlić listę czatów.
- `cliPath` może wskazywać wrapper SSH; ustaw `remoteHost` (`host` lub `user@host`) dla pobierania załączników przez SCP.
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają ścieżki przychodzących załączników (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa ścisłego sprawdzania klucza hosta, więc upewnij się, że klucz hosta relay już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwala lub zabrania zapisów konfiguracji inicjowanych z iMessage.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje iMessage z trwałymi sesjami ACP. Użyj znormalizowanego uchwytu lub jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Współdzielona semantyka pól: [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).

<Accordion title="Przykład wrappera SSH dla iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix jest oparty na rozszerzeniu i konfigurowany pod `channels.matrix`.

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
- `channels.matrix.proxy` kieruje ruch HTTP Matrix przez jawny proxy HTTP(S). Nazwane konta mogą go nadpisywać przez `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` zezwala na prywatne/wewnętrzne homeserwery. `proxy` i to włączenie sieciowe są niezależnymi mechanizmami.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach wielokontowych.
- `channels.matrix.autoJoin` ma domyślnie wartość `off`, więc zaproszone pokoje i nowe zaproszenia w stylu DM są ignorowane, dopóki nie ustawisz `autoJoin: "allowlist"` z `autoJoinAllowlist` lub `autoJoin: "always"`.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzający mogą zostać rozpoznani na podstawie `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`) uprawnionych do zatwierdzania żądań exec.
  - `agentFilter`: opcjonalna allowlista identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub regex).
  - `target`: gdzie wysyłać prośby o zatwierdzenie. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) lub `"both"`.
  - Nadpisania per konto: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kontroluje, jak DM-y Matrix są grupowane w sesje: `per-user` (domyślnie) współdzieli je według routowanego peera, natomiast `per-room` izoluje każdy pokój DM.
- Sondy statusu Matrix i wyszukiwania live directory używają tej samej polityki proxy co ruch runtime.
- Pełna konfiguracja Matrix, reguły targetowania i przykłady konfiguracji są opisane w [Matrix](/pl/channels/matrix).

### Microsoft Teams

Microsoft Teams jest oparty na rozszerzeniu i konfigurowany pod `channels.msteams`.

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

- Podstawowe ścieżki kluczy opisane tutaj: `channels.msteams`, `channels.msteams.configWrites`.
- Pełna konfiguracja Teams (poświadczenia, webhook, zasady DM/grup, nadpisania per team/per channel) jest opisana w [Microsoft Teams](/pl/channels/msteams).

### IRC

IRC jest oparty na rozszerzeniu i konfigurowany pod `channels.irc`.

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

- Podstawowe ścieżki kluczy opisane tutaj: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Opcjonalne `channels.irc.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Pełna konfiguracja kanału IRC (host/port/TLS/kanały/allowlisty/bramkowanie wzmianek) jest opisana w [IRC](/pl/channels/irc).

### Wiele kont (wszystkie kanały)

Uruchamiaj wiele kont per kanał (każde z własnym `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Główny bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Bot alertów",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` jest używane, gdy `accountId` jest pominięte (CLI + routing).
- Tokeny z env mają zastosowanie tylko do konta **default**.
- Bazowe ustawienia kanału mają zastosowanie do wszystkich kont, chyba że zostaną nadpisane per konto.
- Użyj `bindings[].match.accountId`, aby kierować każde konto do innego agenta.
- Jeśli dodasz konto inne niż domyślne przez `openclaw channels add` (lub onboarding kanału), gdy nadal używasz jednokontowej konfiguracji kanału na poziomie głównym, OpenClaw najpierw promuje wartości jednokontowe z poziomu głównego zależne od konta do mapy kont kanału, tak aby oryginalne konto nadal działało. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyslny cel.
- Istniejące powiązania tylko kanałowe (bez `accountId`) nadal pasują do konta domyślnego; powiązania zależne od konta pozostają opcjonalne.
- `openclaw doctor --fix` również naprawia mieszane kształty, przenosząc wartości jednokontowe z poziomu głównego zależne od konta do promowanego konta wybranego dla danego kanału. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyslny cel.

### Inne kanały rozszerzeń

Wiele kanałów rozszerzeń jest konfigurowanych jako `channels.<id>` i opisanych na ich dedykowanych stronach kanałów (na przykład Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat i Twitch).
Zobacz pełny indeks kanałów: [Channels](/pl/channels).

### Bramka wzmianek w czatach grupowych

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianka w metadanych lub bezpieczne wzorce regex). Dotyczy WhatsApp, Telegram, Discord, Google Chat i czatów grupowych iMessage.

**Typy wzmianek:**

- **Wzmianki w metadanych**: natywne platformowe wzmianki @. Ignorowane w trybie self-chat WhatsApp.
- **Wzorce tekstowe**: bezpieczne wzorce regex w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Bramkowanie wzmianek jest egzekwowane tylko wtedy, gdy wykrycie jest możliwe (natywne wzmianki lub co najmniej jeden wzorzec).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` ustawia globalną wartość domyślną. Kanały mogą ją nadpisać przez `channels.<channel>.historyLimit` (lub per konto). Ustaw `0`, aby wyłączyć.

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

Rozstrzyganie: nadpisanie per DM → domyślna wartość dostawcy → brak limitu (zachowywane jest wszystko).

Obsługiwane: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Tryb self-chat

Dodaj własny numer do `allowFrom`, aby włączyć tryb self-chat (ignoruje natywne wzmianki @, odpowiada tylko na wzorce tekstowe):

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

### Komendy (obsługa komend czatu)

```json5
{
  commands: {
    native: "auto", // rejestruj natywne komendy, gdy są obsługiwane
    nativeSkills: "auto", // rejestruj natywne komendy Skills, gdy są obsługiwane
    text: true, // parsuj /commands w wiadomościach czatu
    bash: false, // zezwól na ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // zezwól na /config
    mcp: false, // zezwól na /mcp
    plugins: false, // zezwól na /plugins
    debug: false, // zezwól na /debug
    restart: true, // zezwól na /restart + narzędzie restartu Gatewaya
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

<Accordion title="Szczegóły komend">

- Ten blok konfiguruje powierzchnie komend. Aktualny katalog komend wbudowanych + dołączonych znajdziesz w [Slash Commands](/pl/tools/slash-commands).
- Ta strona to **dokumentacja kluczy konfiguracji**, a nie pełny katalog komend. Komendy należące do kanałów/pluginów, takie jak QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` i Talk `/voice`, są opisane na stronach ich kanałów/pluginów oraz w [Slash Commands](/pl/tools/slash-commands).
- Komendy tekstowe muszą być **samodzielnymi** wiadomościami rozpoczynającymi się od `/`.
- `native: "auto"` włącza natywne komendy dla Discord/Telegram, pozostawia Slack wyłączony.
- `nativeSkills: "auto"` włącza natywne komendy Skills dla Discord/Telegram, pozostawia Slack wyłączony.
- Nadpisanie per kanał: `channels.discord.commands.native` (bool lub `"auto"`). `false` czyści wcześniej zarejestrowane komendy.
- Nadpisz rejestrację natywnych komend Skills per kanał przez `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` dodaje dodatkowe wpisy menu bota Telegram.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` oraz nadawcy obecnego w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczyt/zapis `openclaw.json`). Dla klientów Gatewaya `chat.send` trwałe zapisy `/config set|unset` wymagają też `operator.admin`; tylko do odczytu `/config show` pozostaje dostępne dla zwykłych klientów operatora z zakresem zapisu.
- `mcp: true` włącza `/mcp` dla zarządzanej przez OpenClaw konfiguracji serwerów MCP pod `mcp.servers`.
- `plugins: true` włącza `/plugins` dla wykrywania pluginów, instalacji i sterowania włączaniem/wyłączaniem.
- `channels.<provider>.configWrites` bramkuje mutacje konfiguracji per kanał (domyślnie: true).
- Dla kanałów wielokontowych `channels.<provider>.accounts.<id>.configWrites` również bramkuje zapisy kierowane do tego konta (na przykład `/allowlist --config --account <id>` lub `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` wyłącza `/restart` oraz działania narzędzia restartu Gatewaya. Domyślnie: `true`.
- `ownerAllowFrom` to jawna allowlista właściciela dla komend/narzędzi tylko dla właściciela. Jest oddzielona od `allowFrom`.
- `ownerDisplay: "hash"` hashuje identyfikatory właściciela w system prompt. Ustaw `ownerDisplaySecret`, aby kontrolować hashowanie.
- `allowFrom` jest per dostawca. Gdy jest ustawione, jest to **jedyne** źródło autoryzacji (allowlisty/parowanie kanału i `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala komendom omijać zasady grup dostępu, gdy `allowFrom` nie jest ustawione.
- Mapa dokumentacji komend:
  - katalog wbudowany + dołączony: [Slash Commands](/pl/tools/slash-commands)
  - powierzchnie komend specyficzne dla kanałów: [Channels](/pl/channels)
  - komendy QQ Bot: [QQ Bot](/pl/channels/qqbot)
  - komendy parowania: [Pairing](/pl/channels/pairing)
  - komenda karty LINE: [LINE](/pl/channels/line)
  - memory dreaming: [Dreaming](/pl/concepts/dreaming)

</Accordion>

---

## Domyślne ustawienia agentów

### `agents.defaults.workspace`

Domyślnie: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Opcjonalny katalog główny repozytorium pokazywany w wierszu Runtime w system prompt. Jeśli nie jest ustawiony, OpenClaw wykrywa go automatycznie, przechodząc w górę od workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Opcjonalna domyślna allowlista Skills dla agentów, które nie ustawiają
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje wartości domyślne
      { id: "locked-down", skills: [] }, // bez Skills
    ],
  },
}
```

- Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
- Pomiń `agents.list[].skills`, aby dziedziczyć wartości domyślne.
- Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
- Niepusta lista `agents.list[].skills` jest ostatecznym zestawem dla tego agenta; nie
  łączy się z wartościami domyślnymi.

### `agents.defaults.skipBootstrap`

Wyłącza automatyczne tworzenie plików bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Kontroluje, kiedy pliki bootstrap workspace są wstrzykiwane do system prompt. Domyślnie: `"always"`.

- `"continuation-skip"`: bezpieczne tury kontynuacji (po zakończonej odpowiedzi asystenta) pomijają ponowne wstrzykiwanie bootstrapu workspace, zmniejszając rozmiar prompta. Uruchomienia Heartbeat i ponowne próby po Compaction nadal odbudowują kontekst.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maksymalna liczba znaków na plik bootstrap workspace przed obcięciem. Domyślnie: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maksymalna łączna liczba znaków wstrzykiwanych ze wszystkich plików bootstrap workspace. Domyślnie: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kontroluje widoczny dla agenta tekst ostrzeżenia, gdy kontekst bootstrap zostanie obcięty.
Domyślnie: `"once"`.

- `"off"`: nigdy nie wstrzykuj tekstu ostrzeżenia do system prompt.
- `"once"`: wstrzyknij ostrzeżenie raz dla każdej unikalnej sygnatury obcięcia (zalecane).
- `"always"`: wstrzykuj ostrzeżenie przy każdym uruchomieniu, gdy istnieje obcięcie.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa własności budżetu kontekstu

OpenClaw ma wiele budżetów promptu/kontekstu o dużej objętości i są one
celowo rozdzielone według podsystemów zamiast przepływać przez jeden ogólny
parametr.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normalne wstrzykiwanie bootstrap workspace.
- `agents.defaults.startupContext.*`:
  jednorazowe preludium startowe dla `/new` i `/reset`, w tym ostatnie dzienne
  pliki `memory/*.md`.
- `skills.limits.*`:
  kompaktowa lista Skills wstrzykiwana do system prompt.
- `agents.defaults.contextLimits.*`:
  ograniczone wycinki runtime i wstrzykiwane bloki należące do runtime.
- `memory.qmd.limits.*`:
  rozmiar fragmentów i wstrzyknięć dla indeksowanego wyszukiwania pamięci.

Używaj pasującego nadpisania per agent tylko wtedy, gdy jeden agent potrzebuje innego
budżetu:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kontroluje preludium startowe pierwszej tury wstrzykiwane przy pustych uruchomieniach `/new` i `/reset`.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Współdzielone wartości domyślne dla ograniczonych powierzchni kontekstu runtime.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: domyślny limit wycinka `memory_get` przed dodaniem metadanych obcięcia
  i informacji o kontynuacji.
- `memoryGetDefaultLines`: domyślne okno wierszy `memory_get`, gdy `lines` jest
  pominięte.
- `toolResultMaxChars`: aktywny limit wyników narzędzi używany dla utrwalonych wyników i
  obsługi przepełnienia.
- `postCompactionMaxChars`: limit wycinka AGENTS.md używany podczas odświeżania po Compaction.

#### `agents.list[].contextLimits`

Nadpisanie per agent dla współdzielonych parametrów `contextLimits`. Pominięte pola dziedziczą
z `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globalny limit dla kompaktowej listy Skills wstrzykiwanej do system prompt. To
nie wpływa na odczytywanie plików `SKILL.md` na żądanie.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Nadpisanie per agent dla budżetu promptu Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Maksymalny rozmiar w pikselach dla dłuższego boku obrazu w blokach obrazów transkryptu/narzędzi przed wywołaniami dostawcy.
Domyślnie: `1200`.

Niższe wartości zwykle zmniejszają zużycie tokenów wizji i rozmiar payloadu żądania przy przebiegach z dużą liczbą zrzutów ekranu.
Wyższe wartości zachowują więcej szczegółów wizualnych.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Strefa czasowa dla kontekstu system prompt (nie dla znaczników czasu wiadomości). Wartość zapasowa to strefa czasowa hosta.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format czasu w system prompt. Domyślnie: `auto` (preferencja OS).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // globalne domyślne parametry dostawcy
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Forma ciągu ustawia tylko model główny.
  - Forma obiektu ustawia model główny oraz uporządkowane modele failover.
- `imageModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez ścieżkę narzędzia `image` jako konfiguracja modelu vision.
  - Używany również jako fallback routingu, gdy wybrany/domyslny model nie akceptuje wejścia obrazowego.
- `imageGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania obrazów i każdą przyszłą powierzchnię narzędzia/pluginu, która generuje obrazy.
  - Typowe wartości: `google/gemini-3.1-flash-image-preview` dla natywnego generowania obrazów Gemini, `fal/fal-ai/flux/dev` dla fal albo `openai/gpt-image-1` dla OpenAI Images.
  - Jeśli wybierzesz bezpośrednio `provider/model`, skonfiguruj także pasujące uwierzytelnianie/klucz API dostawcy (na przykład `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla `google/*`, `OPENAI_API_KEY` dla `openai/*`, `FAL_KEY` dla `fal/*`).
  - Jeśli pole zostanie pominięte, `image_generate` nadal może wywnioskować domyślny dostawca na podstawie uwierzytelnienia. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców.
- `musicGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania muzyki i wbudowane narzędzie `music_generate`.
  - Typowe wartości: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` lub `minimax/music-2.5+`.
  - Jeśli pole zostanie pominięte, `music_generate` nadal może wywnioskować domyślny dostawca na podstawie uwierzytelnienia. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców.
  - Jeśli wybierzesz bezpośrednio `provider/model`, skonfiguruj także pasujące uwierzytelnianie/klucz API dostawcy.
- `videoGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania wideo i wbudowane narzędzie `video_generate`.
  - Typowe wartości: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` lub `qwen/wan2.7-r2v`.
  - Jeśli pole zostanie pominięte, `video_generate` nadal może wywnioskować domyślny dostawca na podstawie uwierzytelnienia. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców.
  - Jeśli wybierzesz bezpośrednio `provider/model`, skonfiguruj także pasujące uwierzytelnianie/klucz API dostawcy.
  - Dołączony dostawca generowania wideo Qwen obsługuje maksymalnie 1 wyjściowe wideo, 1 wejściowy obraz, 4 wejściowe wideo, czas trwania 10 sekund oraz opcje na poziomie dostawcy `size`, `aspectRatio`, `resolution`, `audio` i `watermark`.
- `pdfModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez narzędzie `pdf` do routingu modelu.
  - Jeśli pole zostanie pominięte, narzędzie PDF używa jako fallback `imageModel`, a następnie rozstrzygniętego modelu sesji/domyslnego.
- `pdfMaxBytesMb`: domyślny limit rozmiaru PDF dla narzędzia `pdf`, gdy `maxBytesMb` nie jest przekazane przy wywołaniu.
- `pdfMaxPages`: domyślna maksymalna liczba stron uwzględnianych przez tryb awaryjnego wyodrębniania w narzędziu `pdf`.
- `verboseDefault`: domyślny poziom verbose dla agentów. Wartości: `"off"`, `"on"`, `"full"`. Domyślnie: `"off"`.
- `elevatedDefault`: domyślny poziom outputu elevated dla agentów. Wartości: `"off"`, `"on"`, `"ask"`, `"full"`. Domyślnie: `"on"`.
- `model.primary`: format `provider/model` (np. `openai/gpt-5.4`). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, następnie unikalnego dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego domyślnego dostawcy (przestarzałe zachowanie zgodności, więc preferuj jawne `provider/model`). Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw przechodzi na pierwszy skonfigurowany dostawca/model zamiast zwracać nieaktualny domyślny model usuniętego dostawcy.
- `models`: skonfigurowany katalog modeli i allowlista dla `/model`. Każdy wpis może zawierać `alias` (skrót) i `params` (specyficzne dla dostawcy, na przykład `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: globalne domyślne parametry dostawcy stosowane do wszystkich modeli. Ustawiane w `agents.defaults.params` (np. `{ cacheRetention: "long" }`).
- Priorytet scalania `params` (konfiguracja): `agents.defaults.params` (globalna baza) jest nadpisywane przez `agents.defaults.models["provider/model"].params` (per model), a następnie `agents.list[].params` (pasujący identyfikator agenta) nadpisuje po kluczu. Szczegóły znajdziesz w [Prompt Caching](/pl/reference/prompt-caching).
- `embeddedHarness`: domyślna polityka niskopoziomowego runtime osadzonego agenta. Użyj `runtime: "auto"`, aby zarejestrowane harnessy pluginów mogły przejmować obsługiwane modele, `runtime: "pi"`, aby wymusić wbudowany harness PI, albo zarejestrowanego identyfikatora harnessu, takiego jak `runtime: "codex"`. Ustaw `fallback: "none"`, aby wyłączyć automatyczny fallback do PI.
- Programy zapisujące konfigurację, które modyfikują te pola (na przykład `/models set`, `/models set-image` i komendy dodawania/usuwania fallbacków), zapisują kanoniczną postać obiektu i w miarę możliwości zachowują istniejące listy fallbacków.
- `maxConcurrent`: maksymalna liczba równoległych uruchomień agentów między sesjami (każda sesja nadal jest serializowana). Domyślnie: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` kontroluje, który niskopoziomowy executor uruchamia osadzone tury agentów.
W większości wdrożeń należy pozostawić wartość domyślną `{ runtime: "auto", fallback: "pi" }`.
Użyj tego, gdy zaufany plugin udostępnia natywny harness, taki jak dołączony
harness app-server Codex.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` lub zarejestrowany identyfikator harnessu pluginu. Dołączony plugin Codex rejestruje `codex`.
- `fallback`: `"pi"` lub `"none"`. `"pi"` zachowuje wbudowany harness PI jako fallback zgodności. `"none"` powoduje błąd przy braku lub nieobsługiwanym wyborze harnessu pluginu zamiast cichego użycia PI.
- Nadpisania przez środowisko: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` nadpisuje `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` wyłącza fallback do PI dla tego procesu.
- Dla wdrożeń tylko z Codex ustaw `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` i `embeddedHarness.fallback: "none"`.
- To kontroluje tylko osadzony harness czatu. Generowanie mediów, vision, PDF, muzyka, wideo i TTS nadal używają swoich ustawień dostawcy/modelu.

**Wbudowane skróty aliasów** (mają zastosowanie tylko wtedy, gdy model znajduje się w `agents.defaults.models`):

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Twoje skonfigurowane aliasy zawsze mają pierwszeństwo przed domyślnymi.

Modele Z.AI GLM-4.x automatycznie włączają tryb thinking, chyba że ustawisz `--thinking off` albo samodzielnie zdefiniujesz `agents.defaults.models["zai/<model>"].params.thinking`.
Modele Z.AI domyślnie włączają `tool_stream` dla strumieniowania wywołań narzędzi. Ustaw `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby to wyłączyć.
Modele Anthropic Claude 4.6 mają domyślnie `adaptive` thinking, gdy nie ustawiono jawnego poziomu thinking.

### `agents.defaults.cliBackends`

Opcjonalne backendy CLI dla awaryjnych uruchomień tylko tekstowych (bez wywołań narzędzi). Przydatne jako kopia zapasowa, gdy dostawcy API zawodzą.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backendy CLI są przede wszystkim tekstowe; narzędzia są zawsze wyłączone.
- Sesje są obsługiwane, gdy ustawiono `sessionArg`.
- Przekazywanie obrazów jest obsługiwane, gdy `imageArg` akceptuje ścieżki do plików.

### `agents.defaults.systemPromptOverride`

Zastępuje cały system prompt złożony przez OpenClaw stałym ciągiem. Ustaw na poziomie domyślnym (`agents.defaults.systemPromptOverride`) lub per agent (`agents.list[].systemPromptOverride`). Wartości per agent mają pierwszeństwo; pusta wartość lub zawierająca tylko białe znaki jest ignorowana. Przydatne do kontrolowanych eksperymentów z promptami.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "Jesteś pomocnym asystentem.",
    },
  },
}
```

### `agents.defaults.heartbeat`

Okresowe uruchomienia Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m wyłącza
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // domyślnie: true; false pomija sekcję Heartbeat w system prompt
        lightContext: false, // domyślnie: false; true zachowuje tylko HEARTBEAT.md z plików bootstrap workspace
        isolatedSession: false, // domyślnie: false; true uruchamia każdy Heartbeat w nowej sesji (bez historii konwersacji)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (domyślnie) | block
        target: "none", // domyślnie: none | opcje: last | whatsapp | telegram | discord | ...
        prompt: "Przeczytaj HEARTBEAT.md, jeśli istnieje...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: ciąg czasu trwania (ms/s/m/h). Domyślnie: `30m` (uwierzytelnianie kluczem API) lub `1h` (uwierzytelnianie OAuth). Ustaw `0m`, aby wyłączyć.
- `includeSystemPromptSection`: gdy `false`, pomija sekcję Heartbeat w system prompt i pomija wstrzykiwanie `HEARTBEAT.md` do kontekstu bootstrap. Domyślnie: `true`.
- `suppressToolErrorWarnings`: gdy `true`, tłumi payloady ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
- `timeoutSeconds`: maksymalny czas w sekundach dozwolony dla tury agenta Heartbeat przed jej przerwaniem. Pozostaw nieustawione, aby używać `agents.defaults.timeoutSeconds`.
- `directPolicy`: polityka dostarczania bezpośredniego/DM. `allow` (domyślnie) zezwala na dostarczanie do celu bezpośredniego. `block` tłumi dostarczanie do celu bezpośredniego i emituje `reason=dm-blocked`.
- `lightContext`: gdy `true`, uruchomienia Heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap workspace.
- `isolatedSession`: gdy `true`, każdy Heartbeat uruchamia się w nowej sesji bez wcześniejszej historii konwersacji. Ten sam wzorzec izolacji co Cron `sessionTarget: "isolated"`. Zmniejsza koszt tokenów per Heartbeat z około 100K do około 2–5K tokenów.
- Per agent: ustaw `agents.list[].heartbeat`. Gdy dowolny agent definiuje `heartbeat`, **tylko ci agenci** uruchamiają Heartbeat.
- Heartbeat uruchamia pełne tury agentów — krótsze interwały zużywają więcej tokenów.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id zarejestrowanego pluginu dostawcy Compaction (opcjonalne)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Zachowuj identyfikatory wdrożeń, identyfikatory zgłoszeń i pary host:port dokładnie.", // używane, gdy identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] wyłącza ponowne wstrzykiwanie
        model: "openrouter/anthropic/claude-sonnet-4-6", // opcjonalne nadpisanie modelu tylko dla Compaction
        notifyUser: true, // wysyła krótkie powiadomienia, gdy Compaction się rozpoczyna i kończy (domyślnie: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Sesja zbliża się do Compaction. Zapisz teraz trwałe wspomnienia.",
          prompt: "Zapisz wszystkie trwałe notatki do memory/YYYY-MM-DD.md; odpowiedz dokładnym cichym tokenem NO_REPLY, jeśli nie ma nic do zapisania.",
        },
      },
    },
  },
}
```

- `mode`: `default` lub `safeguard` (sumaryzacja porcjowana dla długich historii). Zobacz [Compaction](/pl/concepts/compaction).
- `provider`: identyfikator zarejestrowanego pluginu dostawcy Compaction. Gdy ustawione, wywoływane jest `summarize()` dostawcy zamiast wbudowanej sumaryzacji LLM. W razie niepowodzenia następuje fallback do wersji wbudowanej. Ustawienie dostawcy wymusza `mode: "safeguard"`. Zobacz [Compaction](/pl/concepts/compaction).
- `timeoutSeconds`: maksymalna liczba sekund dozwolona dla pojedynczej operacji Compaction, po której OpenClaw ją przerywa. Domyślnie: `900`.
- `identifierPolicy`: `strict` (domyślnie), `off` lub `custom`. `strict` dodaje na początku wbudowane wskazówki zachowywania niejawnych identyfikatorów podczas sumaryzacji Compaction.
- `identifierInstructions`: opcjonalny własny tekst zachowywania identyfikatorów używany, gdy `identifierPolicy=custom`.
- `postCompactionSections`: opcjonalne nazwy sekcji H2/H3 z AGENTS.md do ponownego wstrzyknięcia po Compaction. Domyślnie `["Session Startup", "Red Lines"]`; ustaw `[]`, aby wyłączyć ponowne wstrzykiwanie. Gdy nieustawione lub jawnie ustawione na tę domyślną parę, starsze nagłówki `Every Session`/`Safety` są również akceptowane jako starszy fallback.
- `model`: opcjonalne nadpisanie `provider/model-id` tylko dla sumaryzacji Compaction. Użyj tego, gdy główna sesja ma pozostać przy jednym modelu, ale podsumowania Compaction powinny działać na innym; gdy nieustawione, Compaction używa głównego modelu sesji.
- `notifyUser`: gdy `true`, wysyła krótkie powiadomienia do użytkownika, gdy Compaction się rozpoczyna i kończy (na przykład „Trwa Compacting context...” i „Compaction complete”). Domyślnie wyłączone, aby Compaction był cichy.
- `memoryFlush`: cicha tura agentowa przed automatycznym Compaction, aby zapisać trwałe wspomnienia. Pomijane, gdy workspace jest tylko do odczytu.

### `agents.defaults.contextPruning`

Przycina **stare wyniki narzędzi** z kontekstu w pamięci przed wysłaniem do LLM. **Nie** modyfikuje historii sesji zapisanej na dysku.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // czas trwania (ms/s/m/h), domyślna jednostka: minuty
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Treść starego wyniku narzędzia została wyczyszczona]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Zachowanie trybu cache-ttl">

- `mode: "cache-ttl"` włącza przebiegi przycinania.
- `ttl` określa, jak często przycinanie może zostać uruchomione ponownie (od ostatniego dotknięcia cache).
- Przycinanie najpierw delikatnie przycina zbyt duże wyniki narzędzi, a następnie w razie potrzeby całkowicie czyści starsze wyniki narzędzi.

**Soft-trim** zachowuje początek + koniec i wstawia `...` w środku.

**Hard-clear** zastępuje cały wynik narzędzia placeholderem.

Uwagi:

- Bloki obrazów nigdy nie są przycinane/czyszczone.
- Proporcje są oparte na znakach (w przybliżeniu), a nie na dokładnej liczbie tokenów.
- Jeśli istnieje mniej niż `keepLastAssistants` wiadomości asystenta, przycinanie jest pomijane.

</Accordion>

Szczegóły zachowania znajdziesz w [Session Pruning](/pl/concepts/session-pruning).

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (użyj minMs/maxMs)
    },
  },
}
```

- Kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
- Nadpisania kanałów: `channels.<channel>.blockStreamingCoalesce` (oraz warianty per konto). Signal/Slack/Discord/Google Chat domyślnie używają `minChars: 1500`.
- `humanDelay`: losowa pauza między odpowiedziami blokowymi. `natural` = 800–2500 ms. Nadpisanie per agent: `agents.list[].humanDelay`.

Szczegóły zachowania i porcjowania znajdziesz w [Streaming](/pl/concepts/streaming).

### Wskaźniki pisania

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Domyślnie: `instant` dla czatów bezpośrednich/wzmianek, `message` dla niewspomnianych czatów grupowych.
- Nadpisania per sesja: `session.typingMode`, `session.typingIntervalSeconds`.

Zobacz [Typing Indicators](/pl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Opcjonalny sandboxing dla osadzonego agenta. Pełny przewodnik znajdziesz w [Sandboxing](/pl/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / treści inline też są obsługiwane:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Szczegóły sandboxa">

**Backend:**

- `docker`: lokalny runtime Docker (domyślnie)
- `ssh`: ogólny zdalny runtime oparty na SSH
- `openshell`: runtime OpenShell

Gdy wybrane jest `backend: "openshell"`, ustawienia specyficzne dla runtime są przenoszone do
`plugins.entries.openshell.config`.

**Konfiguracja backendu SSH:**

- `target`: cel SSH w formacie `user@host[:port]`
- `command`: komenda klienta SSH (domyślnie: `ssh`)
- `workspaceRoot`: bezwzględny zdalny katalog główny używany dla workspace per zakres
- `identityFile` / `certificateFile` / `knownHostsFile`: istniejące pliki lokalne przekazywane do OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: treści inline lub SecretRefs, które OpenClaw materializuje do plików tymczasowych w runtime
- `strictHostKeyChecking` / `updateHostKeys`: parametry polityki kluczy hosta OpenSSH

**Priorytet uwierzytelniania SSH:**

- `identityData` ma pierwszeństwo przed `identityFile`
- `certificateData` ma pierwszeństwo przed `certificateFile`
- `knownHostsData` ma pierwszeństwo przed `knownHostsFile`
- Wartości `*Data` oparte na SecretRef są rozwiązywane z aktywnej migawki runtime sekretów przed uruchomieniem sesji sandboxa

**Zachowanie backendu SSH:**

- inicjalizuje zdalny workspace jednokrotnie po utworzeniu lub odtworzeniu
- następnie utrzymuje zdalny workspace SSH jako kanoniczny
- kieruje `exec`, narzędzia plikowe i ścieżki mediów przez SSH
- nie synchronizuje automatycznie zmian zdalnych z powrotem do hosta
- nie obsługuje kontenerów przeglądarki sandboxa

**Dostęp do workspace:**

- `none`: workspace sandboxa per zakres pod `~/.openclaw/sandboxes`
- `ro`: workspace sandboxa pod `/workspace`, workspace agenta montowany tylko do odczytu pod `/agent`
- `rw`: workspace agenta montowany do odczytu i zapisu pod `/workspace`

**Zakres:**

- `session`: kontener + workspace per sesja
- `agent`: jeden kontener + workspace per agent (domyślnie)
- `shared`: współdzielony kontener i workspace (brak izolacji między sesjami)

**Konfiguracja pluginu OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcjonalne
          gatewayEndpoint: "https://lab.example", // opcjonalne
          policy: "strict", // opcjonalny identyfikator polityki OpenShell
          providers: ["openai"], // opcjonalne
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Tryb OpenShell:**

- `mirror`: inicjalizuje zdalny katalog z lokalnego przed `exec`, synchronizuje z powrotem po `exec`; lokalny workspace pozostaje kanoniczny
- `remote`: inicjalizuje zdalny katalog jednokrotnie podczas tworzenia sandboxa, a następnie utrzymuje zdalny workspace jako kanoniczny

W trybie `remote` lokalne edycje hosta wykonane poza OpenClaw nie są automatycznie synchronizowane do sandboxa po kroku inicjalizacji.
Transport to SSH do sandboxa OpenShell, ale plugin zarządza cyklem życia sandboxa i opcjonalną synchronizacją mirror.

**`setupCommand`** uruchamia się jednokrotnie po utworzeniu kontenera (przez `sh -lc`). Wymaga wychodzącego dostępu do sieci, zapisywalnego roota i użytkownika root.

**Kontenery domyślnie używają `network: "none"`** — ustaw `"bridge"` (lub własną sieć bridge), jeśli agent potrzebuje dostępu wychodzącego.
`"host"` jest blokowane. `"container:<id>"` jest domyślnie blokowane, chyba że jawnie ustawisz
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (tryb awaryjny).

**Załączniki przychodzące** są stagingowane do `media/inbound/*` w aktywnym workspace.

**`docker.binds`** montuje dodatkowe katalogi hosta; globalne i per-agent bindy są scalane.

**Sandboxowana przeglądarka** (`sandbox.browser.enabled`): Chromium + CDP w kontenerze. URL noVNC jest wstrzykiwany do system prompt. Nie wymaga `browser.enabled` w `openclaw.json`.
Dostęp obserwatora noVNC domyślnie używa uwierzytelniania VNC, a OpenClaw emituje URL z krótkotrwałym tokenem (zamiast ujawniać hasło we współdzielonym URL).

- `allowHostControl: false` (domyślnie) blokuje sesjom sandboxowanym kierowanie na przeglądarkę hosta.
- `network` ma domyślnie wartość `openclaw-sandbox-browser` (dedykowana sieć bridge). Ustaw `bridge` tylko wtedy, gdy jawnie chcesz globalnej łączności bridge.
- `cdpSourceRange` opcjonalnie ogranicza wejście CDP na krawędzi kontenera do zakresu CIDR (na przykład `172.21.0.1/32`).
- `sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko do kontenera przeglądarki sandboxa. Gdy ustawione (łącznie z `[]`), zastępuje `docker.binds` dla kontenera przeglądarki.
- Domyślne parametry uruchamiania są zdefiniowane w `scripts/sandbox-browser-entrypoint.sh` i dostrojone do hostów kontenerowych:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<pochodne z OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (domyślnie włączone)
  - `--disable-3d-apis`, `--disable-software-rasterizer` i `--disable-gpu` są
    domyślnie włączone i można je wyłączyć przez
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli użycie WebGL/3D tego wymaga.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ponownie włącza rozszerzenia, jeśli twój workflow
    od nich zależy.
  - `--renderer-process-limit=2` można zmienić przez
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ustaw `0`, aby użyć
    domyślnego limitu procesów Chromium.
  - dodatkowo `--no-sandbox` i `--disable-setuid-sandbox`, gdy włączone jest `noSandbox`.
  - Wartości domyślne są bazą obrazu kontenera; aby zmienić domyślne ustawienia kontenera, użyj własnego
    obrazu przeglądarki z własnym entrypointem.

</Accordion>

Sandboxing przeglądarki i `sandbox.docker.binds` są dostępne tylko dla Dockera.

Budowanie obrazów:

```bash
scripts/sandbox-setup.sh           # główny obraz sandboxa
scripts/sandbox-browser-setup.sh   # opcjonalny obraz przeglądarki
```

### `agents.list` (nadpisania per agent)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // lub { primary, fallbacks }
        thinkingDefault: "high", // nadpisanie poziomu thinking per agent
        reasoningDefault: "on", // nadpisanie widoczności reasoning per agent
        fastModeDefault: false, // nadpisanie fast mode per agent
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // nadpisuje pasujące defaults.models params po kluczu
        skills: ["docs-search"], // zastępuje agents.defaults.skills, gdy ustawione
        identity: {
          name: "Samantha",
          theme: "pomocny leniwiec",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: stabilny identyfikator agenta (wymagany).
- `default`: gdy ustawiono wiele, wygrywa pierwszy (zapisywane jest ostrzeżenie). Jeśli nie ustawiono żadnego, domyślny jest pierwszy wpis listy.
- `model`: forma ciągu nadpisuje tylko `primary`; forma obiektu `{ primary, fallbacks }` nadpisuje oba (`[]` wyłącza globalne fallbacki). Zadania Cron, które nadpisują tylko `primary`, nadal dziedziczą domyślne fallbacki, chyba że ustawisz `fallbacks: []`.
- `params`: parametry strumienia per agent scalane ponad wybranym wpisem modelu w `agents.defaults.models`. Użyj tego do nadpisań specyficznych dla agenta, takich jak `cacheRetention`, `temperature` lub `maxTokens`, bez duplikowania całego katalogu modeli.
- `skills`: opcjonalna allowlista Skills per agent. Jeśli pominięta, agent dziedziczy `agents.defaults.skills`, gdy jest ustawione; jawna lista zastępuje wartości domyślne zamiast je scalać, a `[]` oznacza brak Skills.
- `thinkingDefault`: opcjonalny domyślny poziom thinking per agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Nadpisuje `agents.defaults.thinkingDefault` dla tego agenta, gdy nie ustawiono nadpisania per wiadomość lub sesję.
- `reasoningDefault`: opcjonalna domyślna widoczność reasoning per agent (`on | off | stream`). Ma zastosowanie, gdy nie ustawiono nadpisania reasoning per wiadomość lub sesję.
- `fastModeDefault`: opcjonalna domyślna wartość fast mode per agent (`true | false`). Ma zastosowanie, gdy nie ustawiono nadpisania fast mode per wiadomość lub sesję.
- `embeddedHarness`: opcjonalne nadpisanie polityki niskopoziomowego harnessu per agent. Użyj `{ runtime: "codex", fallback: "none" }`, aby jeden agent był tylko dla Codex, podczas gdy inni zachowają domyślny fallback do PI.
- `runtime`: opcjonalny deskryptor runtime per agent. Użyj `type: "acp"` z domyślnymi wartościami `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), gdy agent ma domyślnie używać sesji harnessu ACP.
- `identity.avatar`: ścieżka względna do workspace, URL `http(s)` lub URI `data:`.
- `identity` wyprowadza wartości domyślne: `ackReaction` z `emoji`, `mentionPatterns` z `name`/`emoji`.
- `subagents.allowAgents`: allowlista identyfikatorów agentów dla `sessions_spawn` (`["*"]` = dowolny; domyślnie: tylko ten sam agent).
- Ograniczenie dziedziczenia sandboxa: jeśli sesja żądająca jest sandboxowana, `sessions_spawn` odrzuca cele, które działałyby bez sandboxa.
- `subagents.requireAgentId`: gdy true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu; domyślnie: false).

---

## Routing wielu agentów

Uruchamiaj wielu izolowanych agentów w jednym Gatewayu. Zobacz [Multi-Agent](/pl/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Pola dopasowania binding

- `type` (opcjonalne): `route` dla zwykłego routingu (brak typu domyślnie oznacza route), `acp` dla trwałych powiązań konwersacji ACP.
- `match.channel` (wymagane)
- `match.accountId` (opcjonalne; `*` = dowolne konto; pominięte = konto domyślne)
- `match.peer` (opcjonalne; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcjonalne; zależne od kanału)
- `acp` (opcjonalne; tylko dla `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministyczna kolejność dopasowania:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (dokładne, bez peer/guild/team)
5. `match.accountId: "*"` (na cały kanał)
6. Agent domyślny

W obrębie każdego poziomu wygrywa pierwszy pasujący wpis `bindings`.

Dla wpisów `type: "acp"` OpenClaw rozstrzyga według dokładnej tożsamości konwersacji (`match.channel` + konto + `match.peer.id`) i nie używa powyższej kolejności poziomów binding route.

### Profile dostępu per agent

<Accordion title="Pełny dostęp (bez sandboxa)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Narzędzia tylko do odczytu + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Brak dostępu do systemu plików (tylko wiadomości)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Szczegóły priorytetów znajdziesz w [Multi-Agent Sandbox & Tools](/pl/tools/multi-agent-sandbox-tools).

---

## Session

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // pomiń fork wątku nadrzędnego powyżej tej liczby tokenów (0 wyłącza)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // czas trwania lub false
      maxDiskBytes: "500mb", // opcjonalny twardy budżet
      highWaterBytes: "400mb", // opcjonalny cel czyszczenia
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // domyślne automatyczne odpinanie po bezczynności w godzinach (`0` wyłącza)
      maxAgeHours: 0, // domyślny twardy maksymalny wiek w godzinach (`0` wyłącza)
    },
    mainKey: "main", // starsze pole (runtime zawsze używa "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Szczegóły pól Session">

- **`scope`**: bazowa strategia grupowania sesji dla kontekstów czatów grupowych.
  - `per-sender` (domyślnie): każdy nadawca otrzymuje izolowaną sesję w ramach kontekstu kanału.
  - `global`: wszyscy uczestnicy w kontekście kanału współdzielą jedną sesję (używaj tylko wtedy, gdy współdzielony kontekst jest zamierzony).
- **`dmScope`**: sposób grupowania DM-ów.
  - `main`: wszystkie DM-y współdzielą główną sesję.
  - `per-peer`: izolacja według identyfikatora nadawcy między kanałami.
  - `per-channel-peer`: izolacja per kanał + nadawca (zalecane dla wieloużytkownikowych skrzynek odbiorczych).
  - `per-account-channel-peer`: izolacja per konto + kanał + nadawca (zalecane dla wielu kont).
- **`identityLinks`**: mapuje kanoniczne identyfikatory do peerów z prefiksem dostawcy dla współdzielenia sesji między kanałami.
- **`reset`**: główna polityka resetu. `daily` resetuje o `atHour` czasu lokalnego; `idle` resetuje po `idleMinutes`. Gdy skonfigurowano oba, wygrywa to, które wygaśnie wcześniej.
- **`resetByType`**: nadpisania per typ (`direct`, `group`, `thread`). Starsze `dm` jest akceptowane jako alias dla `direct`.
- **`parentForkMaxTokens`**: maksymalna wartość `totalTokens` sesji nadrzędnej dozwolona przy tworzeniu forkowanej sesji wątku (domyślnie `100000`).
  - Jeśli `totalTokens` nadrzędnej sesji przekracza tę wartość, OpenClaw rozpoczyna nową sesję wątku zamiast dziedziczyć historię transkryptu sesji nadrzędnej.
  - Ustaw `0`, aby wyłączyć to zabezpieczenie i zawsze pozwalać na forking sesji nadrzędnej.
- **`mainKey`**: starsze pole. Runtime zawsze używa `"main"` dla głównego bucketu czatu bezpośredniego.
- **`agentToAgent.maxPingPongTurns`**: maksymalna liczba tur odpowiedzi zwrotnych między agentami podczas wymian agent-agent (liczba całkowita, zakres: `0`–`5`). `0` wyłącza łańcuchowanie ping-pong.
- **`sendPolicy`**: dopasowanie po `channel`, `chatType` (`direct|group|channel`, ze starszym aliasem `dm`), `keyPrefix` lub `rawKeyPrefix`. Pierwsza reguła deny wygrywa.
- **`maintenance`**: kontrola czyszczenia magazynu sesji + retencji.
  - `mode`: `warn` emituje tylko ostrzeżenia; `enforce` stosuje czyszczenie.
  - `pruneAfter`: granica wieku dla nieaktualnych wpisów (domyślnie `30d`).
  - `maxEntries`: maksymalna liczba wpisów w `sessions.json` (domyślnie `500`).
  - `rotateBytes`: rotuje `sessions.json`, gdy przekroczy ten rozmiar (domyślnie `10mb`).
  - `resetArchiveRetention`: retencja dla archiwów transkryptów `*.reset.<timestamp>`. Domyślnie przyjmuje wartość `pruneAfter`; ustaw `false`, aby wyłączyć.
  - `maxDiskBytes`: opcjonalny budżet dyskowy dla katalogu sesji. W trybie `warn` zapisuje ostrzeżenia; w trybie `enforce` najpierw usuwa najstarsze artefakty/sesje.
  - `highWaterBytes`: opcjonalny cel po czyszczeniu budżetu. Domyślnie `80%` wartości `maxDiskBytes`.
- **`threadBindings`**: globalne wartości domyślne dla funkcji sesji powiązanych z wątkami.
  - `enabled`: główny domyślny przełącznik (dostawcy mogą nadpisywać; Discord używa `channels.discord.threadBindings.enabled`)
  - `idleHours`: domyślne automatyczne odpinanie po bezczynności w godzinach (`0` wyłącza; dostawcy mogą nadpisywać)
  - `maxAgeHours`: domyślny twardy maksymalny wiek w godzinach (`0` wyłącza; dostawcy mogą nadpisywać)

</Accordion>

---

## Wiadomości

```json5
{
  messages: {
    responsePrefix: "🦞", // lub "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 wyłącza
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefiks odpowiedzi

Nadpisania per kanał/konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Rozstrzyganie (najbardziej szczegółowe wygrywa): konto → kanał → globalne. `""` wyłącza i zatrzymuje kaskadę. `"auto"` wyprowadza `[{identity.name}]`.

**Zmienne szablonu:**

| Zmienna          | Opis                   | Przykład                    |
| ---------------- | ---------------------- | --------------------------- |
| `{model}`        | Krótka nazwa modelu    | `claude-opus-4-6`           |
| `{modelFull}`    | Pełny identyfikator modelu | `anthropic/claude-opus-4-6` |
| `{provider}`     | Nazwa dostawcy         | `anthropic`                 |
| `{thinkingLevel}` | Bieżący poziom thinking | `high`, `low`, `off`        |
| `{identity.name}` | Nazwa tożsamości agenta | (to samo co `"auto"`)       |

Zmienne nie rozróżniają wielkości liter. `{think}` jest aliasem dla `{thinkingLevel}`.

### Reakcja ack

- Domyślnie przyjmuje `identity.emoji` aktywnego agenta, w przeciwnym razie `"👀"`. Ustaw `""`, aby wyłączyć.
- Nadpisania per kanał: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Kolejność rozstrzygania: konto → kanał → `messages.ackReaction` → fallback tożsamości.
- Zakres: `group-mentions` (domyślnie), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: usuwa ack po odpowiedzi w Slack, Discord i Telegram.
- `messages.statusReactions.enabled`: włącza reakcje statusu cyklu życia w Slack, Discord i Telegram.
  W Slack i Discord brak ustawienia pozostawia reakcje statusu włączone, gdy aktywne są reakcje ack.
  W Telegram ustaw jawnie `true`, aby włączyć reakcje statusu cyklu życia.

### Inbound debounce

Łączy szybkie wiadomości tekstowe od tego samego nadawcy w jedną turę agenta. Media/załączniki opróżniają się natychmiast. Komendy sterujące omijają debounce.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` kontroluje domyślny tryb auto-TTS: `off`, `always`, `inbound` lub `tagged`. `/tts on|off` może nadpisać lokalne preferencje, a `/tts status` pokazuje stan efektywny.
- `summaryModel` nadpisuje `agents.defaults.model.primary` dla automatycznego podsumowania.
- `modelOverrides` jest domyślnie włączone; `modelOverrides.allowProvider` ma domyślnie wartość `false` (opt-in).
- Klucze API używają wartości zapasowych `ELEVENLABS_API_KEY`/`XI_API_KEY` oraz `OPENAI_API_KEY`.
- `openai.baseUrl` nadpisuje endpoint OpenAI TTS. Kolejność rozstrzygania to konfiguracja, następnie `OPENAI_TTS_BASE_URL`, a potem `https://api.openai.com/v1`.
- Gdy `openai.baseUrl` wskazuje endpoint inny niż OpenAI, OpenClaw traktuje go jako serwer TTS zgodny z OpenAI i łagodzi walidację modelu/głosu.

---

## Talk

Ustawienia domyślne dla trybu Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` musi pasować do klucza w `talk.providers`, gdy skonfigurowano wielu dostawców Talk.
- Starsze płaskie klucze Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) są obsługiwane wyłącznie ze względu na zgodność i są automatycznie migrowane do `talk.providers.<provider>`.
- Identyfikatory głosów używają wartości zapasowych `ELEVENLABS_VOICE_ID` lub `SAG_VOICE_ID`.
- `providers.*.apiKey` akceptuje zwykłe ciągi tekstowe lub obiekty SecretRef.
- Wartość zapasowa `ELEVENLABS_API_KEY` ma zastosowanie tylko wtedy, gdy nie skonfigurowano klucza API Talk.
- `providers.*.voiceAliases` pozwala dyrektywom Talk używać przyjaznych nazw.
- `silenceTimeoutMs` określa, jak długo tryb Talk czeka po ciszy użytkownika, zanim wyśle transkrypt. Brak ustawienia zachowuje domyślne okno pauzy platformy (`700 ms na macOS i Androidzie, 900 ms na iOS`).

---

## Narzędzia

### Profile narzędzi

`tools.profile` ustawia bazową allowlistę przed `tools.allow`/`tools.deny`:

Lokalny onboarding domyślnie ustawia `tools.profile: "coding"` dla nowych lokalnych konfiguracji, gdy pole nie jest ustawione (istniejące jawne profile są zachowywane).

| Profil      | Zawiera                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | tylko `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Brak ograniczeń (to samo co brak ustawienia)                                                                                    |

### Grupy narzędzi

| Grupa              | Narzędzia                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` jest akceptowane jako alias `exec`)                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Wszystkie wbudowane narzędzia (bez pluginów dostawców)                                                                  |

### `tools.allow` / `tools.deny`

Globalna polityka zezwalania/blokowania narzędzi (deny wygrywa). Bez rozróżniania wielkości liter, obsługuje wildcardy `*`. Stosowana nawet wtedy, gdy sandbox Docker jest wyłączony.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Dodatkowo ogranicza narzędzia dla konkretnych dostawców lub modeli. Kolejność: profil bazowy → profil dostawcy → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Kontroluje podwyższony dostęp exec poza sandboxem:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Nadpisanie per agent (`agents.list[].tools.elevated`) może tylko dalej ograniczać.
- `/elevated on|off|ask|full` zapisuje stan per sesja; dyrektywy inline mają zastosowanie do pojedynczej wiadomości.
- Podwyższone `exec` omija sandboxing i używa skonfigurowanej ścieżki ucieczki (`gateway` domyślnie, albo `node`, gdy celem exec jest `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Kontrole bezpieczeństwa pętli narzędzi są **domyślnie wyłączone**. Ustaw `enabled: true`, aby aktywować wykrywanie.
Ustawienia można zdefiniować globalnie w `tools.loopDetection` i nadpisać per agent w `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: maksymalna historia wywołań narzędzi przechowywana do analizy pętli.
- `warningThreshold`: próg powtarzającego się wzorca bez postępu dla ostrzeżeń.
- `criticalThreshold`: wyższy próg powtarzania dla blokowania krytycznych pętli.
- `globalCircuitBreakerThreshold`: próg twardego zatrzymania dla dowolnego przebiegu bez postępu.
- `detectors.genericRepeat`: ostrzega o powtarzanych wywołaniach tego samego narzędzia z tymi samymi argumentami.
- `detectors.knownPollNoProgress`: ostrzega/blokuje znane narzędzia poll bez postępu (`process.poll`, `command_status` itd.).
- `detectors.pingPong`: ostrzega/blokuje naprzemienne wzorce par bez postępu.
- Jeśli `warningThreshold >= criticalThreshold` lub `criticalThreshold >= globalCircuitBreakerThreshold`, walidacja kończy się błędem.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // lub BRAVE_API_KEY z env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opcjonalne; pomiń dla auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Konfiguruje rozumienie mediów przychodzących (obraz/audio/wideo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: wyślij ukończone asynchroniczne zadania muzyki/wideo bezpośrednio do kanału
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Pola wpisu modelu mediów">

**Wpis dostawcy** (`type: "provider"` lub pominięte):

- `provider`: identyfikator dostawcy API (`openai`, `anthropic`, `google`/`gemini`, `groq` itd.)
- `model`: nadpisanie identyfikatora modelu
- `profile` / `preferredProfile`: wybór profilu z `auth-profiles.json`

**Wpis CLI** (`type: "cli"`):

- `command`: wykonywalna komenda do uruchomienia
- `args`: sparametryzowane argumenty (obsługują `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` itd.)

**Pola wspólne:**

- `capabilities`: opcjonalna lista (`image`, `audio`, `video`). Domyślnie: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: nadpisania per wpis.
- Niepowodzenia przechodzą do kolejnego wpisu.

Uwierzytelnianie dostawcy używa standardowej kolejności: `auth-profiles.json` → zmienne env → `models.providers.*.apiKey`.

**Pola async completion:**

- `asyncCompletion.directSend`: gdy `true`, ukończone asynchroniczne zadania `music_generate`
  i `video_generate` najpierw próbują bezpośredniego dostarczenia do kanału. Domyślnie: `false`
  (starsza ścieżka wybudzania sesji żądającej/dostarczania przez model).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Kontroluje, do których sesji mogą kierować narzędzia sesji (`sessions_list`, `sessions_history`, `sessions_send`).

Domyślnie: `tree` (bieżąca sesja + sesje utworzone przez nią, takie jak subagenci).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Uwagi:

- `self`: tylko bieżący klucz sesji.
- `tree`: bieżąca sesja + sesje utworzone przez bieżącą sesję (subagenci).
- `agent`: dowolna sesja należąca do bieżącego identyfikatora agenta (może obejmować innych użytkowników, jeśli uruchamiasz sesje per sender pod tym samym identyfikatorem agenta).
- `all`: dowolna sesja. Kierowanie między agentami nadal wymaga `tools.agentToAgent`.
- Ograniczenie sandboxa: gdy bieżąca sesja jest sandboxowana i `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, widoczność jest wymuszona na `tree`, nawet jeśli `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Kontroluje obsługę załączników inline dla `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: ustaw true, aby zezwolić na załączniki plikowe inline
        maxTotalBytes: 5242880, // 5 MB łącznie dla wszystkich plików
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB na plik
        retainOnSessionKeep: false, // zachowaj załączniki, gdy cleanup="keep"
      },
    },
  },
}
```

Uwagi:

- Załączniki są obsługiwane tylko dla `runtime: "subagent"`. Runtime ACP je odrzuca.
- Pliki są materializowane w workspace potomnym pod `.openclaw/attachments/<uuid>/` z plikiem `.manifest.json`.
- Zawartość załączników jest automatycznie redagowana z utrwalania transkryptu.
- Wejścia Base64 są walidowane z rygorystyczną kontrolą alfabetu/paddingu i zabezpieczeniem rozmiaru przed dekodowaniem.
- Uprawnienia plików to `0700` dla katalogów i `0600` dla plików.
- Czyszczenie podąża za polityką `cleanup`: `delete` zawsze usuwa załączniki; `keep` zachowuje je tylko wtedy, gdy `retainOnSessionKeep: true`.

### `tools.experimental`

Eksperymentalne flagi wbudowanych narzędzi. Domyślnie wyłączone, chyba że działa reguła automatycznego włączania strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // włącza eksperymentalne update_plan
    },
  },
}
```

Uwagi:

- `planTool`: włącza strukturalne narzędzie `update_plan` do śledzenia nietrywialnej pracy wieloetapowej.
- Domyślnie: `false`, chyba że `agents.defaults.embeddedPi.executionContract` (lub nadpisanie per agent) jest ustawione na `"strict-agentic"` dla przebiegu OpenAI lub OpenAI Codex z rodziny GPT-5. Ustaw `true`, aby wymusić włączenie narzędzia poza tym zakresem, albo `false`, aby pozostawić je wyłączone nawet dla przebiegów strict-agentic GPT-5.
- Gdy jest włączone, system prompt dodaje również wskazówki użycia, aby model korzystał z niego tylko do istotnej pracy i utrzymywał najwyżej jeden krok `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: domyślny model dla uruchamianych subagentów. Jeśli pominięty, subagenci dziedziczą model wywołującego.
- `allowAgents`: domyślna allowlista docelowych identyfikatorów agentów dla `sessions_spawn`, gdy agent żądający nie ustawia własnego `subagents.allowAgents` (`["*"]` = dowolny; domyślnie: tylko ten sam agent).
- `runTimeoutSeconds`: domyślny limit czasu (sekundy) dla `sessions_spawn`, gdy wywołanie narzędzia pomija `runTimeoutSeconds`. `0` oznacza brak limitu czasu.
- Polityka narzędzi per subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Własni dostawcy i bazowe URL-e

OpenClaw używa wbudowanego katalogu modeli. Dodawaj własnych dostawców przez `models.providers` w konfiguracji lub `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (domyślnie) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Użyj `authHeader: true` + `headers` dla niestandardowych potrzeb uwierzytelniania.
- Nadpisz katalog główny konfiguracji agenta przez `OPENCLAW_AGENT_DIR` (lub `PI_CODING_AGENT_DIR`, starszy alias zmiennej środowiskowej).
- Priorytet scalania dla pasujących identyfikatorów dostawców:
  - Niepuste wartości `baseUrl` z agent `models.json` mają pierwszeństwo.
  - Niepuste wartości `apiKey` z agenta mają pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście config/auth-profile.
  - Wartości `apiKey` dostawcy zarządzane przez SecretRef są odświeżane na podstawie znaczników źródła (`ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec) zamiast utrwalać rozwiązane sekrety.
  - Wartości nagłówków dostawcy zarządzane przez SecretRef są odświeżane na podstawie znaczników źródła (`secretref-env:ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec).
  - Puste lub brakujące `apiKey`/`baseUrl` agenta przechodzą na `models.providers` w konfiguracji.
  - Pasujące `contextWindow`/`maxTokens` modelu używają wyższej wartości spośród jawnej konfiguracji i niejawnych wartości katalogu.
  - Pasujące `contextTokens` zachowuje jawny limit runtime, gdy jest obecny; użyj go, aby ograniczyć efektywny kontekst bez zmiany natywnych metadanych modelu.
  - Użyj `models.mode: "replace"`, gdy chcesz, aby konfiguracja całkowicie przepisała `models.json`.
  - Utrwalanie markerów jest autorytatywne względem źródła: markery są zapisywane z aktywnej migawki konfiguracji źródłowej (przed rozwiązaniem), a nie z rozwiązanych wartości sekretów w runtime.

### Szczegóły pól dostawcy

- `models.mode`: zachowanie katalogu dostawców (`merge` lub `replace`).
- `models.providers`: mapa własnych dostawców kluczowana identyfikatorem dostawcy.
- `models.providers.*.api`: adapter żądań (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` itd.).
- `models.providers.*.apiKey`: poświadczenie dostawcy (preferowane SecretRef/podstawienie env).
- `models.providers.*.auth`: strategia uwierzytelniania (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: dla Ollama + `openai-completions` wstrzykuje `options.num_ctx` do żądań (domyślnie: `true`).
- `models.providers.*.authHeader`: wymusza przesyłanie poświadczeń w nagłówku `Authorization`, gdy jest to wymagane.
- `models.providers.*.baseUrl`: bazowy URL upstream API.
- `models.providers.*.headers`: dodatkowe statyczne nagłówki do routingu proxy/tenant.
- `models.providers.*.request`: nadpisania transportu dla żądań HTTP dostawcy modeli.
  - `request.headers`: dodatkowe nagłówki (scalane z domyślnymi dostawcy). Wartości akceptują SecretRef.
  - `request.auth`: nadpisanie strategii uwierzytelniania. Tryby: `"provider-default"` (używa wbudowanego uwierzytelniania dostawcy), `"authorization-bearer"` (z `token`), `"header"` (z `headerName`, `value`, opcjonalnym `prefix`).
  - `request.proxy`: nadpisanie proxy HTTP. Tryby: `"env-proxy"` (używa zmiennych env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (z `url`). Oba tryby akceptują opcjonalny podobiekt `tls`.
  - `request.tls`: nadpisanie TLS dla połączeń bezpośrednich. Pola: `ca`, `cert`, `key`, `passphrase` (wszystkie akceptują SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: gdy `true`, zezwala na HTTPS do `baseUrl`, gdy DNS rozwiązuje się do prywatnych, CGNAT lub podobnych zakresów, przez zabezpieczenie pobierania HTTP dostawcy (opt-in operatora dla zaufanych self-hosted endpointów zgodnych z OpenAI). WebSocket używa tego samego `request` dla nagłówków/TLS, ale nie tego zabezpieczenia SSRF fetch. Domyślnie `false`.
- `models.providers.*.models`: jawne wpisy katalogu modeli dostawcy.
- `models.providers.*.models.*.contextWindow`: natywne metadane okna kontekstu modelu.
- `models.providers.*.models.*.contextTokens`: opcjonalny limit kontekstu runtime. Użyj tego, gdy chcesz mieć mniejszy efektywny budżet kontekstu niż natywne `contextWindow` modelu.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: opcjonalna wskazówka zgodności. Dla `api: "openai-completions"` z niepustym nienatywnym `baseUrl` (host inny niż `api.openai.com`) OpenClaw wymusza w runtime wartość `false`. Puste/pominięte `baseUrl` zachowuje domyślne zachowanie OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: opcjonalna wskazówka zgodności dla punktów końcowych czatu zgodnych z OpenAI obsługujących tylko ciągi. Gdy `true`, OpenClaw spłaszcza tablice `messages[].content` zawierające wyłącznie tekst do zwykłych ciągów przed wysłaniem żądania.
- `plugins.entries.amazon-bedrock.config.discovery`: główny węzeł ustawień automatycznego wykrywania Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: włącza/wyłącza niejawne wykrywanie.
- `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS dla wykrywania.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: opcjonalny filtr identyfikatora dostawcy do ukierunkowanego wykrywania.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interwał odpytywania do odświeżania wykrywania.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: zapasowe okno kontekstu dla wykrytych modeli.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: zapasowa maksymalna liczba tokenów wyjściowych dla wykrytych modeli.

### Przykłady dostawców

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Użyj `cerebras/zai-glm-4.7` dla Cerebras; `zai/glm-4.7` dla bezpośredniego Z.AI.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Ustaw `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`). Używaj odwołań `opencode/...` dla katalogu Zen albo `opencode-go/...` dla katalogu Go. Skrót: `openclaw onboard --auth-choice opencode-zen` lub `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Ustaw `ZAI_API_KEY`. `z.ai/*` i `z-ai/*` są akceptowanymi aliasami. Skrót: `openclaw onboard --auth-choice zai-api-key`.

- Ogólny endpoint: `https://api.z.ai/api/paas/v4`
- Endpoint coding (domyślny): `https://api.z.ai/api/coding/paas/v4`
- Dla ogólnego endpointu zdefiniuj własnego dostawcę z nadpisaniem base URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Dla endpointu China: `baseUrl: "https://api.moonshot.cn/v1"` lub `openclaw onboard --auth-choice moonshot-api-key-cn`.

Natywne endpointy Moonshot ogłaszają zgodność użycia streamingu na współdzielonym
transporcie `openai-completions`, a OpenClaw wiąże to z możliwościami endpointu,
a nie tylko z wbudowanym identyfikatorem dostawcy.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Zgodny z Anthropic, wbudowany dostawca. Skrót: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (zgodny z Anthropic)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Base URL powinien pomijać `/v1` (klient Anthropic dopisuje je sam). Skrót: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (bezpośrednio)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Ustaw `MINIMAX_API_KEY`. Skróty:
`openclaw onboard --auth-choice minimax-global-api` lub
`openclaw onboard --auth-choice minimax-cn-api`.
Katalog modeli domyślnie zawiera tylko M2.7.
Na ścieżce streamingu zgodnej z Anthropic OpenClaw domyślnie wyłącza thinking MiniMax,
chyba że jawnie ustawisz `thinking`. `/fast on` lub
`params.fastMode: true` przepisuje `MiniMax-M2.7` na
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modele lokalne (LM Studio)">

Zobacz [Local Models](/pl/gateway/local-models). W skrócie: uruchom duży model lokalny przez LM Studio Responses API na wydajnym sprzęcie; zachowaj scalone modele hostowane jako fallback.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // lub zwykły ciąg tekstowy
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: opcjonalna allowlista tylko dla dołączonych Skills (zarządzane/Skills z workspace pozostają bez zmian).
- `load.extraDirs`: dodatkowe współdzielone katalogi główne Skills (najniższy priorytet).
- `install.preferBrew`: gdy true, preferuje instalatory Homebrew, jeśli `brew` jest
  dostępne, zanim przejdzie do innych rodzajów instalatorów.
- `install.nodeManager`: preferencja instalatora Node dla specyfikacji `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` wyłącza Skill nawet wtedy, gdy jest dołączony/zainstalowany.
- `entries.<skillKey>.apiKey`: wygoda dla Skills deklarujących podstawową zmienną env (zwykły ciąg tekstowy lub obiekt SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Wczytywane z `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` oraz `plugins.load.paths`.
- Wykrywanie akceptuje natywne pluginy OpenClaw oraz zgodne bundlowe pakiety Codex i Claude, w tym bundlowe pakiety Claude bez manifestu w domyślnym układzie.
- **Zmiany konfiguracji wymagają restartu Gatewaya.**
- `allow`: opcjonalna allowlista (ładowane są tylko wymienione pluginy). `deny` wygrywa.
- `plugins.entries.<id>.apiKey`: wygodne pole klucza API na poziomie pluginu (gdy plugin to obsługuje).
- `plugins.entries.<id>.env`: mapa zmiennych env ograniczona do pluginu.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy `false`, core blokuje `before_prompt_build` i ignoruje pola modyfikujące prompt ze starszego `before_agent_start`, zachowując jednocześnie starsze `modelOverride` i `providerOverride`. Dotyczy natywnych hooków pluginów i obsługiwanych katalogów hooków dostarczanych przez bundle.
- `plugins.entries.<id>.subagent.allowModelOverride`: jawnie ufa temu pluginowi, że może żądać nadpisań `provider` i `model` per uruchomienie dla zadań subagenta w tle.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna allowlista kanonicznych celów `provider/model` dla zaufanych nadpisań subagenta. Używaj `"*"`, tylko gdy świadomie chcesz zezwolić na dowolny model.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez plugin (walidowany przez natywny schemat pluginu OpenClaw, jeśli jest dostępny).
- `plugins.entries.firecrawl.config.webFetch`: ustawienia dostawcy web-fetch Firecrawl.
  - `apiKey`: klucz API Firecrawl (akceptuje SecretRef). Wartości zapasowe: `plugins.entries.firecrawl.config.webSearch.apiKey`, starsze `tools.web.fetch.firecrawl.apiKey` lub zmienna env `FIRECRAWL_API_KEY`.
  - `baseUrl`: bazowy URL API Firecrawl (domyślnie: `https://api.firecrawl.dev`).
  - `onlyMainContent`: wyodrębnia tylko główną treść ze stron (domyślnie: `true`).
  - `maxAgeMs`: maksymalny wiek cache w milisekundach (domyślnie: `172800000` / 2 dni).
  - `timeoutSeconds`: limit czasu żądania scrape w sekundach (domyślnie: `60`).
- `plugins.entries.xai.config.xSearch`: ustawienia xAI X Search (wyszukiwanie webowe Grok).
  - `enabled`: włącza dostawcę X Search.
  - `model`: model Grok używany do wyszukiwania (np. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ustawienia memory dreaming. Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać fazy i progi.
  - `enabled`: główny przełącznik dreaming (domyślnie `false`).
  - `frequency`: harmonogram Cron dla każdego pełnego przebiegu dreaming (domyślnie `"0 3 * * *"`).
  - polityka faz i progi to szczegóły implementacyjne (nie są kluczami konfiguracji dla użytkownika).
- Pełna konfiguracja pamięci znajduje się w [Memory configuration reference](/pl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Włączone bundlowe pluginy Claude mogą również wnosić osadzone ustawienia domyślne Pi z `settings.json`; OpenClaw stosuje je jako oczyszczone ustawienia agenta, a nie jako surowe patche konfiguracji OpenClaw.
- `plugins.slots.memory`: wybiera identyfikator aktywnego pluginu pamięci albo `"none"`, aby wyłączyć pluginy pamięci.
- `plugins.slots.contextEngine`: wybiera identyfikator aktywnego pluginu silnika kontekstu; domyślnie `"legacy"`, chyba że zainstalujesz i wybierzesz inny silnik.
- `plugins.installs`: metadane instalacji zarządzane przez CLI, używane przez `openclaw plugins update`.
  - Zawiera `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Traktuj `plugins.installs.*` jako stan zarządzany; preferuj komendy CLI zamiast ręcznych edycji.

Zobacz [Plugins](/pl/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt-in tylko dla zaufanego dostępu do sieci prywatnej
      // allowPrivateNetwork: true, // starszy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` wyłącza `act:evaluate` i `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` jest wyłączone, gdy nieustawione, więc nawigacja Browser pozostaje domyślnie ścisła.
- Ustaw `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` tylko wtedy, gdy świadomie ufasz nawigacji Browser w sieci prywatnej.
- W trybie ścisłym zdalne endpointy profili CDP (`profiles.*.cdpUrl`) podlegają temu samemu blokowaniu sieci prywatnej podczas kontroli osiągalności/wykrywania.
- `ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.
- W trybie ścisłym używaj `ssrfPolicy.hostnameAllowlist` i `ssrfPolicy.allowedHostnames` dla jawnych wyjątków.
- Profile zdalne są tylko do podpięcia (start/stop/reset są wyłączone).
- `profiles.*.cdpUrl` akceptuje `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S), gdy chcesz, aby OpenClaw wykrył `/json/version`; użyj WS(S),
  gdy dostawca daje bezpośredni URL DevTools WebSocket.
- Profile `existing-session` używają Chrome MCP zamiast CDP i mogą podłączać się
  na wybranym hoście lub przez podłączony browser node.
- Profile `existing-session` mogą ustawić `userDataDir`, aby wskazać konkretny
  profil przeglądarki opartej na Chromium, taki jak Brave lub Edge.
- Profile `existing-session` zachowują bieżące ograniczenia trasy Chrome MCP:
  działania oparte na snapshot/ref zamiast targetowania selektorem CSS, hooki
  przesyłania jednego pliku, brak nadpisań timeoutów dialogów, brak `wait --load networkidle`,
  brak `responsebody`, eksportu PDF, przechwytywania pobierania ani działań wsadowych.
- Lokalnie zarządzane profile `openclaw` automatycznie przypisują `cdpPort` i `cdpUrl`; ustawiaj
  `cdpUrl` jawnie tylko dla zdalnego CDP.
- Kolejność auto-detect: domyślna przeglądarka, jeśli oparta na Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Usługa sterowania: tylko loopback (port pochodny od `gateway.port`, domyślnie `18791`).
- `extraArgs` dopisuje dodatkowe flagi uruchomieniowe do lokalnego startu Chromium (na przykład
  `--disable-gpu`, rozmiar okna lub flagi debugowania).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, krótki tekst, URL obrazu lub data URI
    },
  },
}
```

- `seamColor`: kolor akcentu dla chrome natywnego UI aplikacji (odcień dymka Talk Mode itd.).
- `assistant`: nadpisanie tożsamości Control UI. Wartość zapasowa pochodzi z tożsamości aktywnego agenta.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // lub OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // dla mode=trusted-proxy; zobacz /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // niebezpieczne: zezwala na bezwzględne zewnętrzne URL-e osadzeń http(s)
      // allowedOrigins: ["https://control.example.com"], // wymagane dla Control UI poza loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // niebezpieczny tryb awaryjny origin z nagłówka Host
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Opcjonalne. Domyślnie false.
    allowRealIpFallback: false,
    tools: {
      // Dodatkowe HTTP deny dla /tools/invoke
      deny: ["browser"],
      // Usuwa narzędzia z domyślnej listy HTTP deny
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Szczegóły pól Gateway">

- `mode`: `local` (uruchamia Gateway) lub `remote` (łączy się ze zdalnym Gatewayem). Gateway odmawia uruchomienia, jeśli nie jest ustawiony na `local`.
- `port`: pojedynczy multipleksowany port dla WS + HTTP. Priorytet: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (domyślnie), `lan` (`0.0.0.0`), `tailnet` (tylko adres IP Tailscale) lub `custom`.
- **Starsze aliasy bind**: używaj wartości trybu bind w `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), a nie aliasów hosta (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Uwaga dotycząca Dockera**: domyślne bindowanie `loopback` nasłuchuje na `127.0.0.1` wewnątrz kontenera. Przy sieci bridge Dockera (`-p 18789:18789`) ruch przychodzi na `eth0`, więc Gateway jest nieosiągalny. Użyj `--network host` albo ustaw `bind: "lan"` (lub `bind: "custom"` z `customBindHost: "0.0.0.0"`), aby nasłuchiwać na wszystkich interfejsach.
- **Auth**: domyślnie wymagane. Bindowania inne niż loopback wymagają uwierzytelniania Gatewaya. W praktyce oznacza to wspólny token/hasło albo reverse proxy świadome tożsamości z `gateway.auth.mode: "trusted-proxy"`. Kreator onboardingu domyślnie generuje token.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), ustaw jawnie `gateway.auth.mode` na `token` lub `password`. Uruchamianie i przepływy instalacji/naprawy usługi kończą się błędem, gdy oba są skonfigurowane, a tryb nie jest ustawiony.
- `gateway.auth.mode: "none"`: jawny tryb bez auth. Używaj tylko dla zaufanych lokalnych konfiguracji loopback; ten tryb celowo nie jest oferowany w promptach onboardingu.
- `gateway.auth.mode: "trusted-proxy"`: deleguje auth do reverse proxy świadomego tożsamości i ufa nagłówkom tożsamości z `gateway.trustedProxies` (zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth)). Ten tryb oczekuje źródła proxy **spoza loopback**; reverse proxy loopback na tym samym hoście nie spełniają wymagań trusted-proxy auth.
- `gateway.auth.allowTailscale`: gdy `true`, nagłówki tożsamości Tailscale Serve mogą spełniać auth dla Control UI/WebSocket (weryfikowane przez `tailscale whois`). Endpointy HTTP API **nie** używają tego uwierzytelniania nagłówkami Tailscale; podążają za zwykłym trybem HTTP auth Gatewaya. Ten przepływ bez tokena zakłada, że host Gatewaya jest zaufany. Domyślnie `true`, gdy `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: opcjonalny limiter nieudanych prób auth. Stosowany per IP klienta i per zakres auth (wspólny sekret i token urządzenia są śledzone niezależnie). Zablokowane próby zwracają `429` + `Retry-After`.
  - Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, clientIp}` są serializowane przed zapisem porażki. Współbieżne błędne próby od tego samego klienta mogą więc uruchomić limiter przy drugim żądaniu zamiast obu przejść równolegle jako zwykłe niedopasowania.
  - `gateway.auth.rateLimit.exemptLoopback` ma domyślnie wartość `true`; ustaw `false`, gdy świadomie chcesz ograniczać także ruch localhost (dla konfiguracji testowych lub ścisłych wdrożeń proxy).
- Próby auth WS pochodzące z Browser są zawsze ograniczane z wyłączonym wyjątkiem loopback (defense-in-depth przeciw brutalnym atakom localhost z Browser).
- Na loopback te blokady z origin Browser są izolowane per znormalizowana wartość `Origin`,
  więc powtarzające się niepowodzenia z jednego origin localhost nie blokują automatycznie
  innego origin.
- `tailscale.mode`: `serve` (tylko tailnet, bind loopback) lub `funnel` (publiczny, wymaga auth).
- `controlUi.allowedOrigins`: jawna allowlista origin Browser dla połączeń Gateway WebSocket. Wymagana, gdy klienci Browser mają pochodzić z origin innych niż loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: niebezpieczny tryb, który włącza awaryjne użycie origin z nagłówka Host dla wdrożeń celowo opartych na polityce origin z nagłówka Host.
- `remote.transport`: `ssh` (domyślnie) lub `direct` (ws/wss). Dla `direct` `remote.url` musi mieć postać `ws://` lub `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: awaryjne nadpisanie po stronie klienta, które zezwala na jawny `ws://` do zaufanych prywatnych adresów IP; domyślnie jawny transport pozostaje ograniczony do loopback.
- `gateway.remote.token` / `.password` to pola poświadczeń klienta zdalnego. Same w sobie nie konfigurują auth Gatewaya.
- `gateway.push.apns.relay.baseUrl`: bazowy URL HTTPS zewnętrznego przekaźnika APNs używanego przez oficjalne/TestFlight buildy iOS po opublikowaniu przez nie rejestracji relay-backed do Gatewaya. Ten URL musi odpowiadać URL-owi przekaźnika skompilowanemu w buildzie iOS.
- `gateway.push.apns.relay.timeoutMs`: limit czasu wysyłki gateway-to-relay w milisekundach. Domyślnie `10000`.
- Rejestracje relay-backed są delegowane do konkretnej tożsamości Gatewaya. Sparowana aplikacja iOS pobiera `gateway.identity.get`, dołącza tę tożsamość do rejestracji relay i przekazuje do Gatewaya uprawnienie wysyłki ograniczone do tej rejestracji. Inny Gateway nie może ponownie użyć tej zapisanej rejestracji.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tymczasowe nadpisania env dla powyższej konfiguracji relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: tylko dla developmentu, awaryjne obejście dla URL-i relay HTTP na loopback. Produkcyjne URL-e relay powinny pozostać na HTTPS.
- `gateway.channelHealthCheckMinutes`: interwał monitora stanu kanałów w minutach. Ustaw `0`, aby globalnie wyłączyć restarty monitora stanu. Domyślnie: `5`.
- `gateway.channelStaleEventThresholdMinutes`: próg przestarzałego socketu w minutach. Utrzymuj tę wartość większą lub równą `gateway.channelHealthCheckMinutes`. Domyślnie: `30`.
- `gateway.channelMaxRestartsPerHour`: maksymalna liczba restartów monitora stanu per kanał/konto w ruchomej godzinie. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: rezygnacja per kanał z restartów monitora stanu przy zachowaniu globalnego monitora.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie per konto dla kanałów wielokontowych. Gdy ustawione, ma pierwszeństwo przed nadpisaniem na poziomie kanału.
- Lokalne ścieżki wywołań Gatewaya mogą używać `gateway.remote.*` jako fallback tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się w trybie fail-closed (bez maskującego fallbacku zdalnego).
- `trustedProxies`: adresy IP reverse proxy, które kończą TLS lub wstrzykują nagłówki klienta przekazywanego dalej. Wpisuj tylko proxy, które kontrolujesz. Wpisy loopback nadal są prawidłowe dla konfiguracji proxy na tym samym hoście/wykrywania lokalnego (na przykład Tailscale Serve lub lokalne reverse proxy), ale **nie** czynią żądań loopback kwalifikującymi się do `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: gdy `true`, Gateway akceptuje `X-Real-IP`, jeśli brakuje `X-Forwarded-For`. Domyślnie `false` dla zachowania fail-closed.
- `gateway.tools.deny`: dodatkowe nazwy narzędzi blokowane dla HTTP `POST /tools/invoke` (rozszerza domyślną listę deny).
- `gateway.tools.allow`: usuwa nazwy narzędzi z domyślnej listy HTTP deny.

</Accordion>

### Endpointy zgodne z OpenAI

- Chat Completions: domyślnie wyłączone. Włącz przez `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Utwardzanie wejść URL dla Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Puste allowlisty są traktowane jak nieustawione; użyj `gateway.http.endpoints.responses.files.allowUrl=false`
    i/lub `gateway.http.endpoints.responses.images.allowUrl=false`, aby wyłączyć pobieranie URL-i.
- Opcjonalny nagłówek utwardzający odpowiedzi:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ustawiaj tylko dla kontrolowanych origin HTTPS; zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Izolacja wielu instancji

Uruchamiaj wiele Gatewayów na jednym hoście z unikalnymi portami i katalogami stanu:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Wygodne flagi: `--dev` (używa `~/.openclaw-dev` + portu `19001`), `--profile <name>` (używa `~/.openclaw-<name>`).

Zobacz [Multiple Gateways](/pl/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: włącza terminację TLS na listenerze Gatewaya (HTTPS/WSS) (domyślnie: `false`).
- `autoGenerate`: automatycznie generuje lokalną parę certyfikat/klucz samopodpisaną, gdy nie skonfigurowano jawnych plików; tylko do użycia lokalnego/development.
- `certPath`: ścieżka systemu plików do pliku certyfikatu TLS.
- `keyPath`: ścieżka systemu plików do prywatnego klucza TLS; zachowuj ograniczone uprawnienia.
- `caPath`: opcjonalna ścieżka do bundla CA do weryfikacji klienta lub własnych łańcuchów zaufania.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: kontroluje, jak edycje konfiguracji są stosowane w runtime.
  - `"off"`: ignoruje zmiany na żywo; zmiany wymagają jawnego restartu.
  - `"restart"`: zawsze restartuje proces Gatewaya przy zmianie konfiguracji.
  - `"hot"`: stosuje zmiany w procesie bez restartu.
  - `"hybrid"` (domyślnie): najpierw próbuje hot reload; w razie potrzeby przechodzi do restartu.
- `debounceMs`: okno debounce w ms przed zastosowaniem zmian konfiguracji (nieujemna liczba całkowita).
- `deferralTimeoutMs`: maksymalny czas w ms oczekiwania na operacje w locie przed wymuszeniem restartu (domyślnie: `300000` = 5 minut).

---

## Hooki

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "Od: {{messages[0].from}}\nTemat: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` lub `x-openclaw-token: <token>`.
Tokeny hooków w query string są odrzucane.

Uwagi dotyczące walidacji i bezpieczeństwa:

- `hooks.enabled=true` wymaga niepustego `hooks.token`.
- `hooks.token` musi być **inne** niż `gateway.auth.token`; ponowne użycie tokenu Gatewaya jest odrzucane.
- `hooks.path` nie może być `/`; użyj dedykowanej podścieżki, takiej jak `/hooks`.
- Jeśli `hooks.allowRequestSessionKey=true`, ogranicz `hooks.allowedSessionKeyPrefixes` (na przykład `["hook:"]`).
- Jeśli mapping lub preset używa sparametryzowanego `sessionKey`, ustaw `hooks.allowedSessionKeyPrefixes` i `hooks.allowRequestSessionKey=true`. Statyczne klucze mapping nie wymagają tego opt-in.

**Endpointy:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` z payloadu żądania jest akceptowany tylko wtedy, gdy `hooks.allowRequestSessionKey=true` (domyślnie: `false`).
- `POST /hooks/<name>` → rozstrzygane przez `hooks.mappings`
  - Wartości `sessionKey` wyrenderowane z szablonu mapping są traktowane jako dostarczone z zewnątrz i również wymagają `hooks.allowRequestSessionKey=true`.

<Accordion title="Szczegóły mapping">

- `match.path` dopasowuje podścieżkę po `/hooks` (np. `/hooks/gmail` → `gmail`).
- `match.source` dopasowuje pole payloadu dla ścieżek ogólnych.
- Szablony takie jak `{{messages[0].subject}}` odczytują dane z payloadu.
- `transform` może wskazywać moduł JS/TS zwracający działanie hooka.
  - `transform.module` musi być ścieżką względną i pozostawać w obrębie `hooks.transformsDir` (ścieżki bezwzględne i traversal są odrzucane).
- `agentId` kieruje do konkretnego agenta; nieznane identyfikatory przechodzą na domyślnego.
- `allowedAgentIds`: ogranicza jawny routing (`*` lub brak = zezwól na wszystkie, `[]` = zabroń wszystkich).
- `defaultSessionKey`: opcjonalny stały klucz sesji dla uruchomień hook agent bez jawnego `sessionKey`.
- `allowRequestSessionKey`: pozwala wywołującym `/hooks/agent` i kluczom sesji mappingów sterowanym szablonem ustawiać `sessionKey` (domyślnie: `false`).
- `allowedSessionKeyPrefixes`: opcjonalna allowlista prefiksów dla jawnych wartości `sessionKey` (żądanie + mapping), np. `["hook:"]`. Staje się wymagana, gdy dowolny mapping lub preset używa sparametryzowanego `sessionKey`.
- `deliver: true` wysyła końcową odpowiedź do kanału; `channel` domyślnie ma wartość `last`.
- `model` nadpisuje LLM dla tego przebiegu hooka (musi być dozwolony, jeśli ustawiono katalog modeli).

</Accordion>

### Integracja z Gmail

- Wbudowany preset Gmail używa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jeśli zachowasz ten routing per wiadomość, ustaw `hooks.allowRequestSessionKey: true` i ogranicz `hooks.allowedSessionKeyPrefixes`, aby pasowały do przestrzeni nazw Gmail, na przykład `["hook:", "hook:gmail:"]`.
- Jeśli potrzebujesz `hooks.allowRequestSessionKey: false`, nadpisz preset statycznym `sessionKey` zamiast sparametryzowanej wartości domyślnej.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway automatycznie uruchamia `gog gmail watch serve` podczas startu, gdy jest skonfigurowane. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby to wyłączyć.
- Nie uruchamiaj osobnego `gog gmail watch serve` równolegle z Gatewayem.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // lub OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Udostępnia edytowalne przez agenta HTML/CSS/JS oraz A2UI przez HTTP pod portem Gatewaya:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Tylko lokalnie: zachowaj `gateway.bind: "loopback"` (domyślnie).
- Bindowania inne niż loopback: trasy canvas wymagają auth Gatewaya (token/hasło/trusted-proxy), tak samo jak inne powierzchnie HTTP Gatewaya.
- Node WebViews zwykle nie wysyłają nagłówków auth; po sparowaniu i podłączeniu node Gateway reklamuje URL-e capability ograniczone do node dla dostępu do canvas/A2UI.
- URL-e capability są związane z aktywną sesją WS node i szybko wygasają. Nie używa się fallbacku opartego na IP.
- Wstrzykuje klienta live-reload do serwowanego HTML.
- Automatycznie tworzy startowy `index.html`, gdy katalog jest pusty.
- Udostępnia również A2UI pod `/__openclaw__/a2ui/`.
- Zmiany wymagają restartu Gatewaya.
- Wyłącz live reload dla dużych katalogów lub przy błędach `EMFILE`.

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (domyślnie): pomija `cliPath` + `sshPort` z rekordów TXT.
- `full`: dołącza `cliPath` + `sshPort`.
- Nazwa hosta domyślnie to `openclaw`. Nadpisz przez `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Zapisuje strefę unicast DNS-SD pod `~/.openclaw/dns/`. Dla wykrywania między sieciami połącz z serwerem DNS (zalecany CoreDNS) + Tailscale split DNS.

Konfiguracja: `openclaw dns setup --apply`.

---

## Środowisko

### `env` (zmienne env inline)

```json5
{
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
}
```

- Zmienne env inline są stosowane tylko wtedy, gdy w env procesu brakuje danego klucza.
- Pliki `.env`: `.env` w CWD + `~/.openclaw/.env` (żaden nie nadpisuje istniejących zmiennych).
- `shellEnv`: importuje brakujące oczekiwane klucze z profilu powłoki logowania.
- Pełny priorytet znajdziesz w [Environment](/pl/help/environment).

### Podstawianie zmiennych env

Odwołuj się do zmiennych env w dowolnym ciągu konfiguracji przez `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Dopasowywane są tylko nazwy wielkimi literami: `[A-Z_][A-Z0-9_]*`.
- Brakujące/puste zmienne powodują błąd przy wczytywaniu konfiguracji.
- Ucieknij przez `$${VAR}`, aby uzyskać dosłowne `${VAR}`.
- Działa z `$include`.

---

## Sekrety

Odwołania do sekretów są addytywne: zwykłe wartości tekstowe nadal działają.

### `SecretRef`

Używaj jednego kształtu obiektu:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Walidacja:

- wzorzec `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- wzorzec `id` dla `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` dla `source: "file"`: bezwzględny wskaźnik JSON (na przykład `"/providers/openai/apiKey"`)
- wzorzec `id` dla `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` dla `source: "exec"` nie może zawierać segmentów ścieżki `.` ani `..` rozdzielanych ukośnikiem (na przykład `a/../b` jest odrzucane)

### Obsługiwana powierzchnia poświadczeń

- Macierz kanoniczna: [SecretRef Credential Surface](/pl/reference/secretref-credential-surface)
- `secrets apply` kieruje na obsługiwane ścieżki poświadczeń w `openclaw.json`.
- Odwołania w `auth-profiles.json` są uwzględniane w rozwiązywaniu runtime i pokryciu audytu.

### Konfiguracja dostawców sekretów

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // opcjonalny jawny dostawca env
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Uwagi:

- Dostawca `file` obsługuje `mode: "json"` i `mode: "singleValue"` (`id` musi mieć wartość `"value"` w trybie singleValue).
- Dostawca `exec` wymaga bezwzględnej ścieżki `command` i używa payloadów protokołu na stdin/stdout.
- Domyślnie ścieżki poleceń będące symlinkami są odrzucane. Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki symlinków przy jednoczesnej walidacji rozwiązanej ścieżki docelowej.
- Jeśli skonfigurowano `trustedDirs`, kontrola zaufanych katalogów dotyczy rozwiązanej ścieżki docelowej.
- Środowisko potomne `exec` jest domyślnie minimalne; przekazuj wymagane zmienne jawnie przez `passEnv`.
- Odwołania do sekretów są rozwiązywane w momencie aktywacji do migawki w pamięci, a następnie ścieżki żądań odczytują już tylko tę migawkę.
- Filtrowanie aktywnej powierzchni ma zastosowanie podczas aktywacji: nierozwiązane odwołania na włączonych powierzchniach powodują błąd startu/reloadu, a nieaktywne powierzchnie są pomijane z diagnostyką.

---

## Magazyn auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Profile per agent są przechowywane w `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` obsługuje odwołania na poziomie wartości (`keyRef` dla `api_key`, `tokenRef` dla `token`) dla statycznych trybów poświadczeń.
- Profile w trybie OAuth (`auth.profiles.<id>.mode = "oauth"`) nie obsługują poświadczeń auth-profile opartych na SecretRef.
- Statyczne poświadczenia runtime pochodzą z rozwiązanych migawek w pamięci; starsze statyczne wpisy `auth.json` są czyszczone po wykryciu.
- Starsze importy OAuth z `~/.openclaw/credentials/oauth.json`.
- Zobacz [OAuth](/pl/concepts/oauth).
- Zachowanie runtime sekretów oraz narzędzia `audit/configure/apply`: [Secrets Management](/pl/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: bazowy backoff w godzinach, gdy profil zawiedzie z powodu rzeczywistych
  błędów rozliczeniowych/braku środków (domyślnie: `5`). Jawny tekst billingowy może
  nadal trafić tutaj nawet przy odpowiedziach `401`/`403`, ale dopasowania tekstu
  specyficzne dla dostawcy pozostają ograniczone do dostawcy, który je obsługuje (na przykład OpenRouter
  `Key limit exceeded`). Podlegające ponowieniu wiadomości HTTP `402` o oknie użycia lub
  limicie wydatków organizacji/workspace pozostają zamiast tego w ścieżce `rate_limit`.
- `billingBackoffHoursByProvider`: opcjonalne nadpisania godzin backoff billing per dostawca.
- `billingMaxHours`: limit w godzinach dla wykładniczego wzrostu backoff billingowego (domyślnie: `24`).
- `authPermanentBackoffMinutes`: bazowy backoff w minutach dla błędów `auth_permanent` o wysokiej pewności (domyślnie: `10`).
- `authPermanentMaxMinutes`: limit w minutach dla wzrostu backoff `auth_permanent` (domyślnie: `60`).
- `failureWindowHours`: ruchome okno w godzinach używane dla liczników backoff (domyślnie: `24`).
- `overloadedProfileRotations`: maksymalna liczba rotacji auth-profile tego samego dostawcy dla błędów przeciążenia przed przejściem do fallbacku modelu (domyślnie: `1`). Kształty typu provider-busy, takie jak `ModelNotReadyException`, trafiają tutaj.
- `overloadedBackoffMs`: stałe opóźnienie przed ponowną próbą przeciążonej rotacji dostawca/profil (domyślnie: `0`).
- `rateLimitedProfileRotations`: maksymalna liczba rotacji auth-profile tego samego dostawcy dla błędów rate-limit przed przejściem do fallbacku modelu (domyślnie: `1`). Ten koszyk rate-limit obejmuje teksty charakterystyczne dla dostawców, takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` i `resource exhausted`.

---

## Logowanie

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Domyślny plik logu: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Ustaw `logging.file`, aby uzyskać stałą ścieżkę.
- `consoleLevel` podnosi się do `debug`, gdy używasz `--verbose`.
- `maxFileBytes`: maksymalny rozmiar pliku logu w bajtach, po którym zapisy są wstrzymywane (dodatnia liczba całkowita; domyślnie: `524288000` = 500 MB). Dla wdrożeń produkcyjnych używaj zewnętrznej rotacji logów.

---

## Diagnostyka

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: główny przełącznik danych wyjściowych instrumentacji (domyślnie: `true`).
- `flags`: tablica ciągów flag włączających ukierunkowane dane wyjściowe logów (obsługuje wildcardy, takie jak `"telegram.*"` lub `"*"`).
- `stuckSessionWarnMs`: próg wieku w ms do emitowania ostrzeżeń o zablokowanej sesji, gdy sesja pozostaje w stanie przetwarzania.
- `otel.enabled`: włącza potok eksportu OpenTelemetry (domyślnie: `false`).
- `otel.endpoint`: URL kolektora dla eksportu OTel.
- `otel.protocol`: `"http/protobuf"` (domyślnie) lub `"grpc"`.
- `otel.headers`: dodatkowe nagłówki metadanych HTTP/gRPC wysyłane z żądaniami eksportu OTel.
- `otel.serviceName`: nazwa usługi dla atrybutów zasobu.
- `otel.traces` / `otel.metrics` / `otel.logs`: włącza eksport trace, metrics lub logs.
- `otel.sampleRate`: współczynnik próbkowania trace `0`–`1`.
- `otel.flushIntervalMs`: interwał okresowego flush telemetrii w ms.
- `cacheTrace.enabled`: zapisuje migawki śledzenia cache dla uruchomień osadzonych (domyślnie: `false`).
- `cacheTrace.filePath`: ścieżka wyjściowa dla cache trace JSONL (domyślnie: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kontrolują, co jest dołączane do danych wyjściowych cache trace (domyślnie wszystkie: `true`).

---

## Aktualizacja

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: kanał wydań dla instalacji npm/git — `"stable"`, `"beta"` lub `"dev"`.
- `checkOnStart`: sprawdza aktualizacje npm przy starcie Gatewaya (domyślnie: `true`).
- `auto.enabled`: włącza automatyczne aktualizacje w tle dla instalacji pakietów (domyślnie: `false`).
- `auto.stableDelayHours`: minimalne opóźnienie w godzinach przed automatycznym zastosowaniem w kanale stable (domyślnie: `6`; maks.: `168`).
- `auto.stableJitterHours`: dodatkowe okno rozłożenia wdrożenia kanału stable w godzinach (domyślnie: `12`; maks.: `168`).
- `auto.betaCheckIntervalHours`: jak często uruchamiane są sprawdzenia kanału beta w godzinach (domyślnie: `1`; maks.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: globalna flaga funkcji ACP (domyślnie: `false`).
- `dispatch.enabled`: niezależna flaga wysyłania tur sesji ACP (domyślnie: `true`). Ustaw `false`, aby zachować dostępność komend ACP przy jednoczesnym blokowaniu wykonania.
- `backend`: domyślny identyfikator backendu runtime ACP (musi pasować do zarejestrowanego pluginu runtime ACP).
- `defaultAgent`: zapasowy identyfikator docelowego agenta ACP, gdy uruchomienia nie określają jawnego celu.
- `allowedAgents`: allowlista identyfikatorów agentów dozwolonych dla sesji runtime ACP; pusta oznacza brak dodatkowego ograniczenia.
- `maxConcurrentSessions`: maksymalna liczba jednocześnie aktywnych sesji ACP.
- `stream.coalesceIdleMs`: okno flush po bezczynności w ms dla tekstu strumieniowanego.
- `stream.maxChunkChars`: maksymalny rozmiar fragmentu przed podziałem projekcji bloku strumieniowanego.
- `stream.repeatSuppression`: tłumi powtarzające się linie statusu/narzędzi per tura (domyślnie: `true`).
- `stream.deliveryMode`: `"live"` strumieniuje przyrostowo; `"final_only"` buforuje do terminalnych zdarzeń tury.
- `stream.hiddenBoundarySeparator`: separator przed widocznym tekstem po ukrytych zdarzeniach narzędzi (domyślnie: `"paragraph"`).
- `stream.maxOutputChars`: maksymalna liczba znaków wyjścia asystenta projektowanych per tura ACP.
- `stream.maxSessionUpdateChars`: maksymalna liczba znaków dla projektowanych linii statusu/aktualizacji ACP.
- `stream.tagVisibility`: zapis nazw tagów do nadpisań widoczności typu boolean dla zdarzeń strumieniowanych.
- `runtime.ttlMinutes`: TTL bezczynności w minutach dla workerów sesji ACP przed kwalifikacją do czyszczenia.
- `runtime.installCommand`: opcjonalna komenda instalacji uruchamiana przy bootstrapie środowiska runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` kontroluje styl tagline bannera:
  - `"random"` (domyślnie): rotujące zabawne/sezonowe tagline.
  - `"default"`: stały neutralny tagline (`Wszystkie Twoje czaty, jeden OpenClaw.`).
  - `"off"`: brak tekstu tagline (tytuł/wersja bannera nadal są wyświetlane).
- Aby ukryć cały banner (nie tylko tagline), ustaw env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadane zapisywane przez przepływy konfiguracji prowadzone przez CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Tożsamość

Zobacz pola `identity` w `agents.list` w sekcji [Agent defaults](#agent-defaults).

---

## Bridge (starsze, usunięte)

Bieżące buildy nie zawierają już bridge TCP. Nodes łączą się przez Gateway WebSocket. Klucze `bridge.*` nie są już częścią schematu konfiguracji (walidacja kończy się błędem, dopóki nie zostaną usunięte; `openclaw doctor --fix` może usunąć nieznane klucze).

<Accordion title="Starsza konfiguracja bridge (odniesienie historyczne)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // przestarzały fallback dla zapisanych zadań notify:true
    webhookToken: "replace-with-dedicated-token", // opcjonalny token bearer dla wychodzącego auth webhooka
    sessionRetention: "24h", // ciąg czasu trwania lub false
    runLog: {
      maxBytes: "2mb", // domyślnie 2_000_000 bajtów
      keepLines: 2000, // domyślnie 2000
    },
  },
}
```

- `sessionRetention`: jak długo przechowywać ukończone izolowane sesje uruchomień Cron przed usunięciem z `sessions.json`. Kontroluje też czyszczenie zarchiwizowanych usuniętych transkryptów Cron. Domyślnie: `24h`; ustaw `false`, aby wyłączyć.
- `runLog.maxBytes`: maksymalny rozmiar pojedynczego pliku logu uruchomienia (`cron/runs/<jobId>.jsonl`) przed przycięciem. Domyślnie: `2_000_000` bajtów.
- `runLog.keepLines`: liczba najnowszych wierszy zachowywanych po uruchomieniu przycinania logu uruchomienia. Domyślnie: `2000`.
- `webhookToken`: token bearer używany do dostarczania POST webhooka Cron (`delivery.mode = "webhook"`); jeśli pominięty, żaden nagłówek auth nie jest wysyłany.
- `webhook`: przestarzały starszy zapasowy URL webhooka (http/https) używany tylko dla zapisanych zadań, które nadal mają `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: maksymalna liczba ponowień dla jednorazowych zadań przy błędach przejściowych (domyślnie: `3`; zakres: `0`–`10`).
- `backoffMs`: tablica opóźnień backoff w ms dla każdej próby ponowienia (domyślnie: `[30000, 60000, 300000]`; 1–10 wpisów).
- `retryOn`: typy błędów, które uruchamiają ponowienia — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Pomiń, aby ponawiać wszystkie typy przejściowe.

Dotyczy tylko jednorazowych zadań Cron. Zadania cykliczne używają osobnej obsługi błędów.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: włącza alerty o błędach dla zadań Cron (domyślnie: `false`).
- `after`: liczba kolejnych błędów, po której uruchamiany jest alert (dodatnia liczba całkowita, min: `1`).
- `cooldownMs`: minimalna liczba milisekund między powtarzanymi alertami dla tego samego zadania (nieujemna liczba całkowita).
- `mode`: tryb dostarczania — `"announce"` wysyła przez wiadomość kanałową; `"webhook"` wysyła POST do skonfigurowanego webhooka.
- `accountId`: opcjonalny identyfikator konta lub kanału ograniczający dostarczanie alertu.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Domyślny cel powiadomień o błędach Cron dla wszystkich zadań.
- `mode`: `"announce"` lub `"webhook"`; domyślnie `"announce"`, gdy istnieje wystarczająca liczba danych celu.
- `channel`: nadpisanie kanału dla dostarczania typu announce. `"last"` ponownie używa ostatniego znanego kanału dostarczania.
- `to`: jawny cel announce lub URL webhooka. Wymagane dla trybu webhook.
- `accountId`: opcjonalne nadpisanie konta dla dostarczania.
- `delivery.failureDestination` per zadanie nadpisuje tę globalną wartość domyślną.
- Gdy ani globalny, ani per-zadaniowy failure destination nie jest ustawiony, zadania, które już dostarczają przez `announce`, w razie błędu przechodzą na ten główny cel announce.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań `sessionTarget="isolated"`, chyba że główne `delivery.mode` zadania to `"webhook"`.

Zobacz [Cron Jobs](/pl/automation/cron-jobs). Izolowane wykonania Cron są śledzone jako [background tasks](/pl/automation/tasks).

---

## Zmienne szablonu modelu mediów

Placeholdery szablonu rozwijane w `tools.media.models[].args`:

| Zmienna           | Opis                                              |
| ----------------- | ------------------------------------------------- |
| `{{Body}}`        | Pełna treść przychodzącej wiadomości              |
| `{{RawBody}}`     | Surowa treść (bez wrapperów historii/nadawcy)     |
| `{{BodyStripped}}` | Treść z usuniętymi wzmiankami grupowymi          |
| `{{From}}`        | Identyfikator nadawcy                             |
| `{{To}}`          | Identyfikator celu                                |
| `{{MessageSid}}`  | Identyfikator wiadomości kanału                   |
| `{{SessionId}}`   | UUID bieżącej sesji                               |
| `{{IsNewSession}}` | `"true"`, gdy utworzono nową sesję               |
| `{{MediaUrl}}`    | Pseudo-URL przychodzącego medium                  |
| `{{MediaPath}}`   | Lokalna ścieżka medium                            |
| `{{MediaType}}`   | Typ medium (image/audio/document/…)               |
| `{{Transcript}}`  | Transkrypt audio                                  |
| `{{Prompt}}`      | Rozstrzygnięty prompt mediów dla wpisów CLI       |
| `{{MaxChars}}`    | Rozstrzygnięta maksymalna liczba znaków wyjścia dla wpisów CLI |
| `{{ChatType}}`    | `"direct"` lub `"group"`                          |
| `{{GroupSubject}}` | Temat grupy (best effort)                        |
| `{{GroupMembers}}` | Podgląd członków grupy (best effort)             |
| `{{SenderName}}`  | Wyświetlana nazwa nadawcy (best effort)           |
| `{{SenderE164}}`  | Numer telefonu nadawcy (best effort)              |
| `{{Provider}}`    | Wskazówka dostawcy (whatsapp, telegram, discord itd.) |

---

## Include konfiguracji (`$include`)

Podziel konfigurację na wiele plików:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Zachowanie scalania:**

- Pojedynczy plik: zastępuje obiekt zawierający.
- Tablica plików: głębokie scalanie w kolejności (późniejsze nadpisują wcześniejsze).
- Klucze rodzeństwa: są scalane po include (nadpisują wartości z include).
- Zagnieżdżone include: maksymalnie 10 poziomów głębokości.
- Ścieżki: rozwiązywane względem pliku zawierającego, ale muszą pozostać w obrębie katalogu głównego konfiguracji najwyższego poziomu (`dirname` od `openclaw.json`). Formy bezwzględne/`../` są dozwolone tylko wtedy, gdy nadal rozwiązują się wewnątrz tej granicy.
- Błędy: jasne komunikaty dla brakujących plików, błędów parsowania i cyklicznych include.

---

_Powiązane: [Configuration](/pl/gateway/configuration) · [Configuration Examples](/pl/gateway/configuration-examples) · [Doctor](/pl/gateway/doctor)_
