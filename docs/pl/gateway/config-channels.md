---
read_when:
    - Konfigurowanie Plugin dla kanału (uwierzytelnianie, kontrola dostępu, obsługa wielu kont)
    - Rozwiązywanie problemów z kluczami konfiguracji poszczególnych kanałów
    - Audyt zasad DM, zasad grupowych lub bramkowania wzmianek
summary: 'Konfiguracja kanałów: kontrola dostępu, parowanie, klucze dla poszczególnych kanałów w usługach Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i nie tylko'
title: Konfiguracja — kanały
x-i18n:
    generated_at: "2026-05-03T21:31:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 366bcee632c649219bbf6cf44d64cc13d966ec813abc74d54088d89de640b47c
    source_path: gateway/config-channels.md
    workflow: 16
---

Klucze konfiguracji kanałów w `channels.*`. Obejmuje dostęp DM i grupowy,
konfiguracje wielu kont, bramkowanie wzmiankami oraz klucze per kanał dla Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage i innych dołączonych pluginów kanałów.

Dla agentów, narzędzi, środowiska uruchomieniowego Gateway i innych kluczy najwyższego poziomu zobacz
[Informacje o konfiguracji](/pl/gateway/configuration-reference).

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że ustawiono `enabled: false`).

### Dostęp DM i grupowy

Wszystkie kanały obsługują zasady DM i zasady grupowe:

| Zasada DM           | Zachowanie                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (domyślna) | Nieznani nadawcy otrzymują jednorazowy kod parowania; właściciel musi zatwierdzić |
| `allowlist`         | Tylko nadawcy w `allowFrom` (lub w sparowanym magazynie zezwoleń)             |
| `open`              | Zezwól na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)             |
| `disabled`          | Ignoruj wszystkie przychodzące DM                                          |

| Zasada grupowa          | Zachowanie                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (domyślna) | Tylko grupy pasujące do skonfigurowanej listy zezwoleń          |
| `open`                | Pomiń listy zezwoleń grup (bramkowanie wzmiankami nadal obowiązuje) |
| `disabled`            | Blokuj wszystkie wiadomości grupowe/pokojów                          |

<Note>
`channels.defaults.groupPolicy` ustawia wartość domyślną, gdy `groupPolicy` dostawcy nie jest ustawione.
Kody parowania wygasają po 1 godzinie. Oczekujące żądania parowania DM są ograniczone do **3 na kanał**.
Jeśli blok dostawcy całkowicie nie istnieje (brak `channels.<provider>`), zasada grupowa środowiska uruchomieniowego wraca do `allowlist` (fail-closed) z ostrzeżeniem przy uruchomieniu.
</Note>

### Nadpisania modeli kanałów

Użyj `channels.modelByChannel`, aby przypiąć konkretne identyfikatory kanałów do modelu. Wartości akceptują `provider/model` lub skonfigurowane aliasy modeli. Mapowanie kanałów ma zastosowanie, gdy sesja nie ma już nadpisania modelu (na przykład ustawionego przez `/model`).

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

Użyj `channels.defaults` dla wspólnego zachowania zasad grupowych i Heartbeat u różnych dostawców:

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

- `channels.defaults.groupPolicy`: awaryjna zasada grupowa, gdy `groupPolicy` na poziomie dostawcy nie jest ustawione.
- `channels.defaults.contextVisibility`: domyślny tryb widoczności dodatkowego kontekstu dla wszystkich kanałów. Wartości: `all` (domyślnie, dołącz cały kontekst cytatów/wątków/historii), `allowlist` (dołączaj tylko kontekst od nadawców z listy zezwoleń), `allowlist_quote` (tak samo jak allowlist, ale zachowaj jawny kontekst cytatu/odpowiedzi). Nadpisanie per kanał: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględniaj zdrowe statusy kanałów w danych wyjściowych Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: uwzględniaj statusy zdegradowane/błędów w danych wyjściowych Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderuj kompaktowe dane wyjściowe Heartbeat w stylu wskaźnika.

### WhatsApp

WhatsApp działa przez kanał web Gateway (Baileys Web). Uruchamia się automatycznie, gdy istnieje połączona sesja.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
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
}
```

<Accordion title="WhatsApp z wieloma kontami">

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
- Opcjonalne `channels.whatsapp.defaultAccount` nadpisuje ten awaryjny wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
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

- Token bota: `channels.telegram.botToken` lub `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne odrzucane), z `TELEGRAM_BOT_TOKEN` jako wartością awaryjną dla konta domyślnego.
- `apiRoot` to wyłącznie katalog główny Telegram Bot API. Użyj `https://api.telegram.org` lub własnego hostowanego/proxy katalogu głównego, nie `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` usuwa przypadkowy końcowy sufiks `/bot<TOKEN>`.
- Opcjonalne `channels.telegram.defaultAccount` nadpisuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- W konfiguracjach wielu kont (2+ identyfikatory kont) ustaw jawne konto domyślne (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć routingu awaryjnego; `openclaw doctor` ostrzega, gdy go brakuje lub jest nieprawidłowe.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Telegram (migracje identyfikatorów supergrup, `/config set|unset`).
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla tematów forum (użyj kanonicznego `chatId:topic:topicId` w `match.peer.id`). Semantyka pól jest wspólna w [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- Podglądy strumieni Telegram używają `sendMessage` + `editMessageText` (działa w czatach bezpośrednich i grupowych).
- Zasada ponawiania: zobacz [Zasada ponawiania](/pl/concepts/retry).

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
      streaming: "off", // off | partial | block | progress
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
        spawnSessions: true,
        defaultSpawnContext: "fork",
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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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

- Token: `channels.discord.token`, z `DISCORD_BOT_TOKEN` jako rozwiązaniem zapasowym dla konta domyślnego.
- Bezpośrednie wywołania wychodzące, które podają jawny `token` Discord, używają tego tokena dla wywołania; ustawienia ponawiania konta i zasad nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
- Opcjonalne `channels.discord.defaultAccount` zastępuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Używaj `user:<id>` (DM) lub `channel:<id>` (kanał serwera) jako celów dostarczania; same numeryczne identyfikatory są odrzucane.
- Slugi serwerów są pisane małymi literami, a spacje są zastępowane przez `-`; klucze kanałów używają nazwy w formie sluga (bez `#`). Preferuj identyfikatory serwerów.
- Wiadomości utworzone przez boty są domyślnie ignorowane. `allowBots: true` włącza je; użyj `allowBots: "mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal są filtrowane).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz nadpisania kanałów) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyłączeniem @everyone/@here).
- `channels.discord.mentionAliases` mapuje stabilny wychodzący tekst `@handle` na identyfikatory użytkowników Discord przed wysłaniem, dzięki czemu znanych członków zespołu można wspominać deterministycznie nawet wtedy, gdy tymczasowa pamięć podręczna katalogu jest pusta. Nadpisania dla poszczególnych kont znajdują się pod `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (domyślnie 17) dzieli wysokie wiadomości nawet wtedy, gdy mają mniej niż 2000 znaków.
- `channels.discord.threadBindings` kontroluje routowanie Discord powiązane z wątkami:
  - `enabled`: nadpisanie Discord dla funkcji sesji powiązanych z wątkami (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane dostarczanie/routowanie)
  - `idleHours`: nadpisanie Discord dla automatycznego odpięcia przy braku aktywności w godzinach (`0` wyłącza)
  - `maxAgeHours`: nadpisanie Discord dla twardego maksymalnego wieku w godzinach (`0` wyłącza)
  - `spawnSessions`: przełącznik dla `sessions_spawn({ thread: true })` oraz automatycznego tworzenia/powiązywania wątków przy uruchamianiu wątku ACP (domyślnie: `true`)
  - `defaultSpawnContext`: natywny kontekst subagenta dla uruchomień powiązanych z wątkiem (domyślnie `"fork"`)
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (użyj identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest wspólna w [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu dla kontenerów komponentów Discord v2.
- `channels.discord.voice` włącza rozmowy na kanałach głosowych Discord oraz opcjonalne nadpisania automatycznego dołączania + LLM + TTS. Konfiguracje Discord tylko tekstowe domyślnie pozostawiają głos wyłączony; ustaw `channels.discord.voice.enabled=true`, aby go włączyć.
- `channels.discord.voice.model` opcjonalnie nadpisuje model LLM używany do odpowiedzi na kanałach głosowych Discord.
- `channels.discord.voice.daveEncryption` i `channels.discord.voice.decryptionFailureTolerance` są przekazywane do opcji DAVE `@discordjs/voice` (domyślnie `true` i `24`).
- `channels.discord.voice.connectTimeoutMs` kontroluje początkowe oczekiwanie Ready `@discordjs/voice` dla `/vc join` i prób automatycznego dołączania (domyślnie `30000`).
- `channels.discord.voice.reconnectGraceMs` kontroluje, ile czasu rozłączona sesja głosowa może mieć na wejście w sygnalizowanie ponownego połączenia, zanim OpenClaw ją zniszczy (domyślnie `15000`).
- OpenClaw dodatkowo próbuje odzyskać odbiór głosu przez opuszczenie sesji głosowej i ponowne do niej dołączenie po powtarzających się niepowodzeniach odszyfrowywania.
- `channels.discord.streaming` jest kanonicznym kluczem trybu strumienia. Starsze wartości `streamMode` i logiczne `streaming` są migrowane automatycznie.
- `channels.discord.autoPresence` mapuje dostępność środowiska uruchomieniowego na obecność bota (healthy => online, degraded => idle, exhausted => dnd) i pozwala na opcjonalne nadpisania tekstu statusu.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennych nazw/tagów (tryb zgodności awaryjnej).
- `channels.discord.execApprovals`: natywne dla Discord dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzających można rozwiązać z `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discord uprawnionych do zatwierdzania żądań exec. Gdy pominięte, używa zastępczo `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub wyrażenie regularne).
  - `target`: gdzie wysyłać monity zatwierdzeń. `"dm"` (domyślnie) wysyła do DM zatwierdzających, `"channel"` wysyła do kanału źródłowego, `"both"` wysyła do obu. Gdy cel zawiera `"channel"`, przyciski mogą być używane tylko przez rozwiązanych zatwierdzających.
  - `cleanupAfterResolve`: gdy `true`, usuwa DM zatwierdzeń po zatwierdzeniu, odmowie lub przekroczeniu czasu.

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

- JSON konta usługi: wbudowany (`serviceAccount`) lub oparty na pliku (`serviceAccountFile`).
- Obsługiwany jest także SecretRef konta usługi (`serviceAccountRef`).
- Zapasowe zmienne środowiskowe: `GOOGLE_CHAT_SERVICE_ACCOUNT` lub `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Używaj `spaces/<spaceId>` lub `users/<userId>` jako celów dostarczania.
- `channels.googlechat.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennych podmiotów e-mail (tryb zgodności awaryjnej).

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

- **Tryb Socket** wymaga zarówno `botToken`, jak i `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` jako zapasowe zmienne środowiskowe dla konta domyślnego).
- **Tryb HTTP** wymaga `botToken` oraz `signingSecret` (na poziomie głównym lub dla konta).
- `socketMode` przekazuje strojenie transportu Slack SDK Socket Mode do publicznego API odbiornika Bolt. Używaj go tylko podczas badania przekroczeń czasu ping/pong lub nieaktualnego zachowania websocket.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują zwykłe ciągi tekstowe lub obiekty SecretRef.
- Migawki kont Slack ujawniają pola źródła/statusu dla poszczególnych poświadczeń, takie jak `botTokenSource`, `botTokenStatus`, `appTokenStatus` oraz, w trybie HTTP, `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego nie mogła rozwiązać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Slack.
- Opcjonalne `channels.slack.defaultAccount` zastępuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- `channels.slack.streaming.mode` jest kanonicznym kluczem trybu strumienia Slack. `channels.slack.streaming.nativeTransport` kontroluje natywny transport strumieniowania Slack. Starsze wartości `streamMode`, logiczne `streaming` i `nativeStreaming` są migrowane automatycznie.
- Używaj `user:<id>` (DM) lub `channel:<id>` jako celów dostarczania.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji wątku:** `thread.historyScope` jest osobna dla wątku (domyślnie) albo współdzielona w kanale. `thread.inheritParent` kopiuje transkrypcję kanału nadrzędnego do nowych wątków.

- Natywne strumieniowanie Slack oraz status wątku w stylu asystenta Slack „pisze...” wymagają docelowego wątku odpowiedzi. DM najwyższego poziomu domyślnie pozostają poza wątkami, więc nadal mogą strumieniować przez robocze podglądy publikacji i edycji Slack zamiast pokazywać natywny podgląd strumienia/statusu w stylu wątku.
- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack podczas działania odpowiedzi, a następnie usuwa ją po zakończeniu. Użyj krótkiego kodu emoji Slack, takiego jak `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slack dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających. Ten sam schemat co Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slack), `agentFilter`, `sessionFilter` i `target` (`"dm"`, `"channel"` lub `"both"`).

| Grupa akcji | Domyślnie | Uwagi                       |
| ------------ | ------- | ---------------------- |
| reactions    | włączone | Reaguj + wyświetl reakcje |
| messages     | włączone | Czytaj/wysyłaj/edytuj/usuwaj |
| pins         | włączone | Przypnij/odepnij/wyświetl |
| memberInfo   | włączone | Informacje o członku      |
| emojiList    | włączone | Lista niestandardowych emoji |

### Mattermost

Mattermost jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw. Starsze lub niestandardowe kompilacje mogą zainstalować bieżący pakiet npm za pomocą `openclaw plugins install @openclaw/mattermost`. Sprawdź [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost), aby zobaczyć bieżące tagi dystrybucyjne przed przypięciem wersji.

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

Tryby czatu: `oncall` (odpowiada na @-wzmiankę, domyślnie), `onmessage` (każda wiadomość), `onchar` (wiadomości zaczynające się od prefiksu wyzwalającego).

Gdy natywne polecenia Mattermost są włączone:

- `commands.callbackPath` musi być ścieżką (na przykład `/api/channels/mattermost/command`), a nie pełnym adresem URL.
- `commands.callbackUrl` musi rozwiązywać się do punktu końcowego Gateway OpenClaw i być osiągalny z serwera Mattermost.
- Natywne wywołania zwrotne slash są uwierzytelniane tokenami przypisanymi do poleceń, zwróconymi
  przez Mattermost podczas rejestracji poleceń slash. Jeśli rejestracja się nie powiedzie albo żadne
  polecenia nie zostaną aktywowane, OpenClaw odrzuca wywołania zwrotne z komunikatem
  `Unauthorized: invalid command token.`
- W przypadku prywatnych/tailnet/wewnętrznych hostów wywołań zwrotnych Mattermost może wymagać,
  aby `ServiceSettings.AllowedUntrustedInternalConnections` zawierało host/domenę wywołania zwrotnego.
  Używaj wartości hosta/domeny, nie pełnych adresów URL.
- `channels.mattermost.configWrites`: zezwól na zapisy konfiguracji inicjowane przez Mattermost lub ich zabroń.
- `channels.mattermost.requireMention`: wymagaj `@mention` przed odpowiedzią w kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: nadpisanie bramkowania wzmianką dla kanału (`"*"` jako domyślne).
- Opcjonalne `channels.mattermost.defaultAccount` nadpisuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.

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

- `channels.signal.account`: przypnij uruchamianie kanału do konkretnej tożsamości konta Signal.
- `channels.signal.configWrites`: zezwól na zapisy konfiguracji inicjowane przez Signal lub ich zabroń.
- Opcjonalne `channels.signal.defaultAccount` nadpisuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.

### BlueBubbles

BlueBubbles to zalecana ścieżka iMessage (oparta na pluginie, konfigurowana pod `channels.bluebubbles`).

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

- Opisane tutaj podstawowe ścieżki kluczy: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Opcjonalne `channels.bluebubbles.defaultAccount` nadpisuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje BlueBubbles z trwałymi sesjami ACP. Użyj uchwytu BlueBubbles albo ciągu docelowego (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Semantyka pól współdzielonych: [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- Pełna konfiguracja kanału BlueBubbles jest udokumentowana w [BlueBubbles](/pl/channels/bluebubbles).

### iMessage

OpenClaw uruchamia `imsg rpc` (JSON-RPC przez stdio). Demon ani port nie są wymagane.

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

- Opcjonalne `channels.imessage.defaultAccount` nadpisuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.

- Wymaga pełnego dostępu do dysku dla bazy danych Messages.
- Preferuj cele `chat_id:<id>`. Użyj `imsg chats --limit 20`, aby wyświetlić listę czatów.
- `cliPath` może wskazywać wrapper SSH; ustaw `remoteHost` (`host` lub `user@host`) do pobierania załączników przez SCP.
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają ścieżki załączników przychodzących (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa ścisłego sprawdzania klucza hosta, więc upewnij się, że klucz hosta przekaźnika już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwól na zapisy konfiguracji inicjowane przez iMessage lub ich zabroń.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje iMessage z trwałymi sesjami ACP. Użyj znormalizowanego uchwytu albo jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Semantyka pól współdzielonych: [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Przykład wrappera SSH dla iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix jest oparty na pluginie i konfigurowany pod `channels.matrix`.

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
- `channels.matrix.proxy` kieruje ruch HTTP Matrix przez jawny serwer proxy HTTP(S). Nazwane konta mogą go nadpisać za pomocą `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` zezwala na prywatne/wewnętrzne serwery homeserver. `proxy` i ta zgoda sieciowa są niezależnymi mechanizmami kontroli.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach z wieloma kontami.
- `channels.matrix.autoJoin` domyślnie ma wartość `off`, więc zaproszone pokoje i nowe zaproszenia w stylu DM są ignorowane, dopóki nie ustawisz `autoJoin: "allowlist"` z `autoJoinAllowlist` albo `autoJoin: "always"`.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` albo `"auto"` (domyślnie). W trybie automatycznym zatwierdzenia exec aktywują się, gdy zatwierdzających da się rozpoznać z `approvers` albo `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`) uprawnione do zatwierdzania żądań exec.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg albo regex).
  - `target`: miejsce wysyłania monitów o zatwierdzenie. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) albo `"both"`.
  - Nadpisania dla kont: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kontroluje, jak DM Matrix grupują się w sesje: `per-user` (domyślnie) współdzieli według kierowanego peera, a `per-room` izoluje każdy pokój DM.
- Próby statusu Matrix i dynamiczne wyszukiwania katalogowe używają tej samej polityki proxy co ruch w czasie działania.
- Pełna konfiguracja Matrix, reguły kierowania i przykłady konfiguracji są udokumentowane w [Matrix](/pl/channels/matrix).

### Microsoft Teams

Microsoft Teams jest oparty na pluginie i konfigurowany pod `channels.msteams`.

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

- Opisane tutaj podstawowe ścieżki kluczy: `channels.msteams`, `channels.msteams.configWrites`.
- Pełna konfiguracja Teams (dane uwierzytelniające, webhook, polityka DM/grup, nadpisania dla zespołów/kanałów) jest udokumentowana w [Microsoft Teams](/pl/channels/msteams).

### IRC

IRC jest oparty na pluginie i konfigurowany pod `channels.irc`.

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

- Opisane tutaj podstawowe ścieżki kluczy: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Opcjonalne `channels.irc.defaultAccount` nadpisuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.
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

- `default` jest używane, gdy `accountId` jest pominięte (CLI + kierowanie).
- Tokeny env dotyczą tylko konta **domyślnego**.
- Bazowe ustawienia kanału dotyczą wszystkich kont, chyba że zostaną nadpisane dla konta.
- Użyj `bindings[].match.accountId`, aby kierować każde konto do innego agenta.
- Jeśli dodasz konto inne niż domyślne za pomocą `openclaw channels add` (albo onboardingu kanału), pozostając przy jednokontowej konfiguracji kanału najwyższego poziomu, OpenClaw najpierw przeniesie wartości jednokontowe najwyższego poziomu o zakresie konta do mapy kont kanału, aby oryginalne konto nadal działało. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.
- Istniejące powiązania tylko kanałowe (bez `accountId`) nadal pasują do konta domyślnego; powiązania o zakresie konta pozostają opcjonalne.
- `openclaw doctor --fix` naprawia też mieszane kształty, przenosząc wartości jednokontowe najwyższego poziomu o zakresie konta do promowanego konta wybranego dla tego kanału. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.

### Inne kanały pluginów

Wiele kanałów pluginów jest konfigurowanych jako `channels.<id>` i udokumentowanych na ich dedykowanych stronach kanałów (na przykład Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat i Twitch).
Zobacz pełny indeks kanałów: [Kanały](/pl/channels).

### Bramkowanie czatu grupowego wzmianką

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianki metadanych albo bezpiecznych wzorców regex). Dotyczy to czatów grupowych WhatsApp, Telegram, Discord, Google Chat i iMessage.

Widoczne odpowiedzi są kontrolowane osobno. Pokoje grupowe/kanałowe domyślnie używają `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw nadal przetwarza turę, ale zwykłe końcowe odpowiedzi pozostają prywatne, a widoczne wyjście w pokoju wymaga `message(action=send)`. Ustaw `"automatic"` tylko wtedy, gdy chcesz zachować starsze działanie, w którym zwykłe odpowiedzi są publikowane z powrotem w pokoju. Aby zastosować takie samo zachowanie widocznych odpowiedzi tylko przez narzędzie także do czatów bezpośrednich, ustaw `messages.visibleReplies: "message_tool"`; uprząż Codex także używa tego zachowania tylko przez narzędzie jako nieustawionej wartości domyślnej dla czatów bezpośrednich.

Jeśli narzędzie wiadomości jest niedostępne w ramach aktywnej polityki narzędzi, OpenClaw przełącza się na automatyczne widoczne odpowiedzi zamiast po cichu tłumić odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku. Restartuj tylko wtedy, gdy obserwowanie plików albo przeładowywanie konfiguracji jest wyłączone we wdrożeniu.

**Typy wzmianek:**

- **Wzmianki metadanych**: natywne platformowe @-wzmianki. Ignorowane w trybie auto-czatu WhatsApp.
- **Wzorce tekstowe**: bezpieczne wzorce regex w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Bramkowanie wzmianką jest egzekwowane tylko wtedy, gdy wykrywanie jest możliwe (natywne wzmianki albo co najmniej jeden wzorzec).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
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

`messages.groupChat.historyLimit` ustawia globalną wartość domyślną. Kanały mogą ją zastąpić za pomocą `channels.<channel>.historyLimit` (lub dla poszczególnych kont). Ustaw `0`, aby wyłączyć.

`messages.visibleReplies` to globalna wartość domyślna dla tury źródłowej; `messages.groupChat.visibleReplies` zastępuje ją dla tur źródłowych grupy/kanału. Gdy `messages.visibleReplies` nie jest ustawione, harness może zapewnić własną wartość domyślną dla bezpośredniego/źródłowego trybu; harness Codex domyślnie używa `message_tool`. Listy dozwolonych kanałów i bramkowanie wzmianek nadal decydują, czy tura jest przetwarzana.

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

Rozstrzyganie: nadpisanie dla konkretnego DM → domyślna wartość dostawcy → brak limitu (wszystko zachowywane).

Obsługiwane: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Tryb czatu ze sobą

Dodaj własny numer w `allowFrom`, aby włączyć tryb czatu ze sobą (ignoruje natywne wzmianki @, odpowiada tylko na wzorce tekstowe):

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

<Accordion title="Command details">

- Ten blok konfiguruje powierzchnie poleceń. Aktualny wbudowany i dołączony katalog poleceń znajdziesz w sekcji [Slash Commands](/pl/tools/slash-commands).
- Ta strona jest **odniesieniem do kluczy konfiguracji**, a nie pełnym katalogiem poleceń. Polecenia należące do kanałów/Pluginów, takie jak QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, parowanie urządzeń `/pair`, pamięć `/dreaming`, sterowanie telefonem `/phone` i Talk `/voice`, są udokumentowane na stronach ich kanałów/Pluginów oraz w sekcji [Slash Commands](/pl/tools/slash-commands).
- Polecenia tekstowe muszą być **samodzielnymi** wiadomościami zaczynającymi się od `/`.
- `native: "auto"` włącza natywne polecenia dla Discord/Telegram, pozostawia Slack wyłączony.
- `nativeSkills: "auto"` włącza natywne polecenia Skills dla Discord/Telegram, pozostawia Slack wyłączony.
- Nadpisanie dla kanału: `channels.discord.commands.native` (wartość logiczna lub `"auto"`). Dla Discord `false` pomija rejestrację natywnych poleceń i czyszczenie podczas uruchamiania.
- Nadpisz rejestrację natywnych poleceń Skills dla kanału za pomocą `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` dodaje dodatkowe pozycje menu bota Telegram.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` oraz nadawcy w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczytuje/zapisuje `openclaw.json`). Dla klientów Gateway `chat.send` trwałe zapisy `/config set|unset` wymagają także `operator.admin`; `/config show` tylko do odczytu pozostaje dostępne dla zwykłych klientów operatora z zakresem zapisu.
- `mcp: true` włącza `/mcp` dla konfiguracji serwera MCP zarządzanego przez OpenClaw w `mcp.servers`.
- `plugins: true` włącza `/plugins` do wykrywania, instalowania oraz włączania/wyłączania Pluginów.
- `channels.<provider>.configWrites` bramkuje mutacje konfiguracji dla kanału (domyślnie: true).
- W przypadku kanałów z wieloma kontami `channels.<provider>.accounts.<id>.configWrites` bramkuje także zapisy skierowane do tego konta (na przykład `/allowlist --config --account <id>` lub `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` wyłącza `/restart` i akcje narzędzia restartu Gateway. Domyślnie: `true`.
- `ownerAllowFrom` to jawna lista dozwolonych właścicieli dla poleceń/narzędzi dostępnych tylko dla właściciela. Jest oddzielna od `allowFrom`.
- `ownerDisplay: "hash"` haszuje identyfikatory właścicieli w prompcie systemowym. Ustaw `ownerDisplaySecret`, aby kontrolować haszowanie.
- `allowFrom` jest per dostawca. Gdy jest ustawione, stanowi **jedyne** źródło autoryzacji (listy dozwolonych kanałów/parowanie oraz `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala poleceniom ominąć zasady grup dostępu, gdy `allowFrom` nie jest ustawione.
- Mapa dokumentacji poleceń:
  - wbudowany i dołączony katalog: [Slash Commands](/pl/tools/slash-commands)
  - powierzchnie poleceń specyficzne dla kanałów: [Kanały](/pl/channels)
  - polecenia QQ Bot: [QQ Bot](/pl/channels/qqbot)
  - polecenia parowania: [Parowanie](/pl/channels/pairing)
  - polecenie karty LINE: [LINE](/pl/channels/line)
  - Dreaming pamięci: [Dreaming](/pl/concepts/dreaming)

</Accordion>

---

## Powiązane

- [Odniesienie konfiguracji](/pl/gateway/configuration-reference) — klucze najwyższego poziomu
- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Przegląd kanałów](/pl/channels)
