---
read_when:
    - Konfigurowanie Plugin kanału (uwierzytelnianie, kontrola dostępu, obsługa wielu kont)
    - Rozwiązywanie problemów z kluczami konfiguracji dla poszczególnych kanałów
    - Audytowanie zasad wiadomości bezpośrednich, zasad dotyczących grup lub kontroli przez wzmianki
summary: 'Konfiguracja kanałów: kontrola dostępu, parowanie i klucze dla poszczególnych kanałów w Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych'
title: Konfiguracja — kanały
x-i18n:
    generated_at: "2026-05-07T13:16:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10ff37f804fe3a2443372c4b195c00a4ee427ebd4c602bfb13e5040bddfaab93
    source_path: gateway/config-channels.md
    workflow: 16
---

Klucze konfiguracji poszczególnych kanałów pod `channels.*`. Obejmuje dostęp do DM i grup,
konfiguracje wielu kont, bramkowanie wzmianek oraz klucze poszczególnych kanałów dla Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage i pozostałych dołączonych wtyczek kanałów.

Informacje o agentach, narzędziach, środowisku uruchomieniowym Gateway i innych kluczach najwyższego poziomu znajdziesz w
[Dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że ustawiono `enabled: false`).

### Dostęp do DM i grup

Wszystkie kanały obsługują zasady DM i zasady grup:

| Zasada DM           | Zachowanie                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (domyślna) | Nieznani nadawcy otrzymują jednorazowy kod parowania; właściciel musi zatwierdzić |
| `allowlist`         | Tylko nadawcy z `allowFrom` (lub ze sparowanego magazynu zezwoleń)             |
| `open`              | Zezwala na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)             |
| `disabled`          | Ignoruje wszystkie przychodzące DM                                          |

| Zasada grupy          | Zachowanie                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (domyślna) | Tylko grupy pasujące do skonfigurowanej listy zezwoleń          |
| `open`                | Pomija listy zezwoleń grup (bramkowanie wzmianek nadal obowiązuje) |
| `disabled`            | Blokuje wszystkie wiadomości grup/pokoi                          |

<Note>
`channels.defaults.groupPolicy` ustawia wartość domyślną, gdy `groupPolicy` dostawcy nie jest ustawione.
Kody parowania wygasają po 1 godzinie. Oczekujące żądania parowania DM są ograniczone do **3 na kanał**.
Jeśli brakuje całego bloku dostawcy (`channels.<provider>` nie istnieje), zasada grup środowiska uruchomieniowego wraca do `allowlist` (fail-closed) z ostrzeżeniem przy uruchomieniu.
</Note>

### Nadpisania modelu kanału

Użyj `channels.modelByChannel`, aby przypiąć konkretne identyfikatory kanałów do modelu. Wartości akceptują `provider/model` lub skonfigurowane aliasy modeli. Mapowanie kanału ma zastosowanie, gdy sesja nie ma już nadpisania modelu (na przykład ustawionego przez `/model`).

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

Użyj `channels.defaults` dla współdzielonych zasad grup i zachowania Heartbeat między dostawcami:

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

- `channels.defaults.groupPolicy`: zastępcza zasada grup, gdy `groupPolicy` na poziomie dostawcy nie jest ustawione.
- `channels.defaults.contextVisibility`: domyślny tryb widoczności dodatkowego kontekstu dla wszystkich kanałów. Wartości: `all` (domyślnie, uwzględnia cały cytowany/wątkowy/historyczny kontekst), `allowlist` (uwzględnia tylko kontekst od nadawców z listy zezwoleń), `allowlist_quote` (tak samo jak allowlist, ale zachowuje jawny kontekst cytatu/odpowiedzi). Nadpisanie dla kanału: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględnia prawidłowe statusy kanałów w wyjściu Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: uwzględnia statusy zdegradowane/błędów w wyjściu Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderuje kompaktowe wyjście Heartbeat w stylu wskaźnika.

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

- Polecenia wychodzące domyślnie używają konta `default`, jeśli istnieje; w przeciwnym razie pierwszego skonfigurowanego identyfikatora konta (po sortowaniu).
- Opcjonalne `channels.whatsapp.defaultAccount` nadpisuje ten wybór domyślnego konta zastępczego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Starszy katalog uwierzytelniania Baileys dla jednego konta jest migrowany przez `openclaw doctor` do `whatsapp/default`.
- Nadpisania dla kont: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Token bota: `channels.telegram.botToken` lub `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne są odrzucane), z `TELEGRAM_BOT_TOKEN` jako wartością zastępczą dla konta domyślnego.
- `apiRoot` to wyłącznie katalog główny Telegram Bot API. Użyj `https://api.telegram.org` albo własnego hostowanego/proxy katalogu głównego, nie `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` usuwa przypadkowy końcowy sufiks `/bot<TOKEN>`.
- Opcjonalne `channels.telegram.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- W konfiguracjach wielu kont (2+ identyfikatory kont) ustaw jawne konto domyślne (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć routingu zastępczego; `openclaw doctor` ostrzega, gdy go brakuje lub jest nieprawidłowe.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Telegram (migracje ID supergrup, `/config set|unset`).
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla tematów forum (użyj kanonicznego `chatId:topic:topicId` w `match.peer.id`). Semantyka pól jest współdzielona w [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).
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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
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

- Token: `channels.discord.token`, z `DISCORD_BOT_TOKEN` jako rozwiązaniem zastępczym dla konta domyślnego.
- Bezpośrednie połączenia wychodzące, które podają jawny Discord `token`, używają tego tokena dla danego wywołania; ustawienia ponawiania/polityki konta nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
- Opcjonalne `channels.discord.defaultAccount` zastępuje wybór konta domyślnego, gdy pasuje do identyfikatora skonfigurowanego konta.
- Używaj `user:<id>` (DM) albo `channel:<id>` (kanał gildii) jako celów dostarczania; same numeryczne identyfikatory są odrzucane.
- Slugi gildii są zapisane małymi literami, a spacje zastąpione znakami `-`; klucze kanałów używają nazwy w formie sluga (bez `#`). Preferuj identyfikatory gildii.
- Wiadomości autorstwa botów są domyślnie ignorowane. `allowBots: true` je włącza; użyj `allowBots: "mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal są filtrowane).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz nadpisania kanałów) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyłączeniem @everyone/@here).
- `channels.discord.mentionAliases` mapuje stabilny wychodzący tekst `@handle` na identyfikatory użytkowników Discord przed wysłaniem, dzięki czemu znani członkowie zespołu mogą być wspominani deterministycznie nawet wtedy, gdy przejściowa pamięć podręczna katalogu jest pusta. Nadpisania per konto znajdują się pod `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (domyślnie 17) dzieli wysokie wiadomości nawet wtedy, gdy mają mniej niż 2000 znaków.
- `channels.discord.threadBindings` steruje routingiem Discord powiązanym z wątkiem:
  - `enabled`: nadpisanie Discord dla funkcji sesji powiązanych z wątkiem (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane dostarczanie/routing)
  - `idleHours`: nadpisanie Discord dla automatycznego cofnięcia skupienia po braku aktywności, w godzinach (`0` wyłącza)
  - `maxAgeHours`: nadpisanie Discord dla sztywnego maksymalnego wieku, w godzinach (`0` wyłącza)
  - `spawnSessions`: przełącznik dla `sessions_spawn({ thread: true })` oraz automatycznego tworzenia/powiązania wątku przez ACP thread-spawn (domyślnie: `true`)
  - `defaultSpawnContext`: natywny kontekst podagenta dla uruchomień powiązanych z wątkiem (domyślnie `"fork"`)
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (użyj identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest wspólna w [Agentach ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu dla kontenerów komponentów Discord v2.
- `channels.discord.voice` włącza rozmowy na kanałach głosowych Discord oraz opcjonalne nadpisania automatycznego dołączania + LLM + TTS. Konfiguracje Discord tylko tekstowe domyślnie pozostawiają głos wyłączony; ustaw `channels.discord.voice.enabled=true`, aby go włączyć.
- `channels.discord.voice.model` opcjonalnie zastępuje model LLM używany do odpowiedzi w kanałach głosowych Discord.
- `channels.discord.voice.daveEncryption` oraz `channels.discord.voice.decryptionFailureTolerance` są przekazywane do opcji DAVE `@discordjs/voice` (domyślnie `true` i `24`).
- `channels.discord.voice.connectTimeoutMs` kontroluje początkowe oczekiwanie Ready `@discordjs/voice` dla `/vc join` oraz prób automatycznego dołączania (domyślnie `30000`).
- `channels.discord.voice.reconnectGraceMs` kontroluje, ile czasu odłączona sesja głosowa może potrzebować na wejście w sygnalizację ponownego połączenia, zanim OpenClaw ją zniszczy (domyślnie `15000`).
- Odtwarzanie głosu Discord nie jest przerywane przez zdarzenie rozpoczęcia mówienia innego użytkownika. Aby uniknąć pętli sprzężenia zwrotnego, OpenClaw ignoruje nowe przechwytywanie głosu podczas odtwarzania TTS.
- OpenClaw dodatkowo próbuje odzyskiwać odbiór głosu przez opuszczenie sesji głosowej i ponowne dołączenie do niej po powtarzających się niepowodzeniach odszyfrowania.
- `channels.discord.streaming` to kanoniczny klucz trybu strumieniowania. Discord domyślnie używa `streaming.mode: "progress"`, więc postęp narzędzi/pracy pojawia się w jednej edytowanej wiadomości podglądu; ustaw `streaming.mode: "off"`, aby go wyłączyć. Starsze wartości `streamMode` oraz logiczne `streaming` pozostają aliasami środowiska uruchomieniowego; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- `channels.discord.autoPresence` mapuje dostępność środowiska uruchomieniowego na obecność bota (healthy => online, degraded => idle, exhausted => dnd) i umożliwia opcjonalne nadpisania tekstu statusu.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza zmienne dopasowywanie nazw/tagów (tryb zgodności awaryjnej).
- `channels.discord.execApprovals`: natywne dla Discord dostarczanie zatwierdzeń exec oraz autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` albo `"auto"` (domyślnie). W trybie automatycznym zatwierdzenia exec aktywują się, gdy zatwierdzających można rozpoznać z `approvers` albo `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discord uprawnionych do zatwierdzania żądań exec. Gdy pominięte, używa zastępczo `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg albo regex).
  - `target`: miejsce wysyłania monitów o zatwierdzenie. `"dm"` (domyślnie) wysyła do DM zatwierdzających, `"channel"` wysyła do kanału źródłowego, `"both"` wysyła do obu. Gdy cel zawiera `"channel"`, przyciski są użyteczne tylko dla rozpoznanych zatwierdzających.
  - `cleanupAfterResolve`: gdy `true`, usuwa DM z zatwierdzeniem po zatwierdzeniu, odmowie lub przekroczeniu limitu czasu.

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
- Obsługiwany jest też SecretRef konta usługi (`serviceAccountRef`).
- Rozwiązania zastępcze env: `GOOGLE_CHAT_SERVICE_ACCOUNT` albo `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Używaj `spaces/<spaceId>` albo `users/<userId>` jako celów dostarczania.
- `channels.googlechat.dangerouslyAllowNameMatching` ponownie włącza zmienne dopasowywanie podmiotów e-mail (tryb zgodności awaryjnej).

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

- **Tryb Socket** wymaga zarówno `botToken`, jak i `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` jako rozwiązanie zastępcze env dla konta domyślnego).
- **Tryb HTTP** wymaga `botToken` oraz `signingSecret` (w katalogu głównym albo per konto).
- `socketMode` przekazuje strojenie transportu Socket Mode SDK Slack do publicznego API odbiornika Bolt. Używaj go tylko podczas badania przekroczeń limitu czasu ping/pong albo zachowania przestarzałego websocketu.
- `botToken`, `appToken`, `signingSecret` oraz `userToken` akceptują zwykłe tekstowe
  ciągi znaków albo obiekty SecretRef.
- Migawki kont Slack ujawniają pola źródła/statusu per dane uwierzytelniające, takie jak
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` oraz, w trybie HTTP,
  `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest
  skonfigurowane przez SecretRef, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego nie mogła
  rozpoznać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Slack.
- Opcjonalne `channels.slack.defaultAccount` zastępuje wybór konta domyślnego, gdy pasuje do identyfikatora skonfigurowanego konta.
- `channels.slack.streaming.mode` to kanoniczny klucz trybu strumieniowania Slack. `channels.slack.streaming.nativeTransport` kontroluje natywny transport strumieniowania Slack. Starsze wartości `streamMode`, logiczne `streaming` oraz `nativeStreaming` pozostają aliasami środowiska uruchomieniowego; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- Używaj `user:<id>` (DM) albo `channel:<id>` jako celów dostarczania.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji wątku:** `thread.historyScope` jest per wątek (domyślnie) albo współdzielony w obrębie kanału. `thread.inheritParent` kopiuje transkrypcję kanału nadrzędnego do nowych wątków.

- Natywne strumieniowanie Slack oraz status wątku w stylu asystenta Slack „is typing...” wymagają celu wątku odpowiedzi. DM najwyższego poziomu domyślnie pozostają poza wątkiem, więc nadal mogą strumieniować przez robocze podglądy Slack publikowane i edytowane, zamiast pokazywać podgląd natywnego strumienia/statusu w stylu wątku.
- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack podczas generowania odpowiedzi, a następnie usuwa ją po zakończeniu. Użyj krótkiego kodu emoji Slack, takiego jak `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slack dostarczanie zatwierdzeń exec oraz autoryzacja zatwierdzających. Ten sam schemat co w Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slack), `agentFilter`, `sessionFilter` oraz `target` (`"dm"`, `"channel"` albo `"both"`).

| Grupa akcji | Domyślnie | Uwagi                         |
| ------------ | ------- | ---------------------- |
| reactions    | włączone | Reagowanie + lista reakcji |
| messages     | włączone | Odczyt/wysyłanie/edycja/usuwanie |
| pins         | włączone | Przypnij/odepnij/listuj |
| memberInfo   | włączone | Informacje o członku |
| emojiList    | włączone | Lista niestandardowych emoji |

### Mattermost

Mattermost jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw. Starsze lub
niestandardowe kompilacje mogą zainstalować bieżący pakiet npm za pomocą
`openclaw plugins install @openclaw/mattermost`. Sprawdź
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
pod kątem bieżących dist-tags przed przypięciem wersji.

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

Tryby czatu: `oncall` (odpowiada na @-wzmiankę, domyślnie), `onmessage` (każda wiadomość), `onchar` (wiadomości zaczynające się od prefiksu wyzwalacza).

Gdy natywne polecenia Mattermost są włączone:

- `commands.callbackPath` musi być ścieżką (na przykład `/api/channels/mattermost/command`), a nie pełnym adresem URL.
- `commands.callbackUrl` musi wskazywać endpoint Gateway OpenClaw i być osiągalny z serwera Mattermost.
- Natywne wywołania zwrotne slash są uwierzytelniane tokenami poszczególnych poleceń zwracanymi
  przez Mattermost podczas rejestracji poleceń slash. Jeśli rejestracja się nie powiedzie albo
  żadne polecenia nie zostaną aktywowane, OpenClaw odrzuca wywołania zwrotne z komunikatem
  `Unauthorized: invalid command token.`
- W przypadku prywatnych, tailnetowych lub wewnętrznych hostów wywołań zwrotnych Mattermost może wymagać,
  aby `ServiceSettings.AllowedUntrustedInternalConnections` zawierało host/domenę wywołania zwrotnego.
  Używaj wartości hosta/domeny, nie pełnych adresów URL.
- `channels.mattermost.configWrites`: zezwalaj na zapisy konfiguracji inicjowane przez Mattermost lub ich odmawiaj.
- `channels.mattermost.requireMention`: wymagaj `@mention` przed odpowiedzią w kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: nadpisanie bramkowania wzmiankami dla danego kanału (`"*"` jako domyślne).
- Opcjonalne `channels.mattermost.defaultAccount` nadpisuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.

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

- `channels.signal.account`: przypnij uruchomienie kanału do konkretnej tożsamości konta Signal.
- `channels.signal.configWrites`: zezwalaj na zapisy konfiguracji inicjowane przez Signal lub ich odmawiaj.
- Opcjonalne `channels.signal.defaultAccount` nadpisuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.

### BlueBubbles

BlueBubbles to starszy most iMessage (obsługiwany przez Plugin, skonfigurowany w `channels.bluebubbles`). Istniejące konfiguracje pozostają obsługiwane, ale nowe wdrożenia OpenClaw iMessage powinny preferować `channels.imessage`, gdy `imsg` może działać na hoście Messages.

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
- Opcjonalne `channels.bluebubbles.defaultAccount` nadpisuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje BlueBubbles z trwałymi sesjami ACP. Użyj uchwytu BlueBubbles lub ciągu docelowego (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Semantyka pól współdzielonych: [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- Pełna konfiguracja kanału BlueBubbles i uzasadnienie wycofania są udokumentowane w [BlueBubbles](/pl/channels/bluebubbles).

### iMessage

OpenClaw uruchamia `imsg rpc` (JSON-RPC przez stdio). Nie jest wymagany daemon ani port. To preferowana ścieżka dla nowych konfiguracji OpenClaw iMessage, gdy host może przyznać uprawnienia do bazy danych Messages i Automation.

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

- Opcjonalne `channels.imessage.defaultAccount` nadpisuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.

- Wymaga Full Disk Access do bazy danych Messages.
- Preferuj cele `chat_id:<id>`. Użyj `imsg chats --limit 20`, aby wyświetlić listę czatów.
- `cliPath` może wskazywać wrapper SSH; ustaw `remoteHost` (`host` lub `user@host`) do pobierania załączników przez SCP.
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają ścieżki załączników przychodzących (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa ścisłego sprawdzania klucza hosta, więc upewnij się, że klucz hosta przekaźnika już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwalaj na zapisy konfiguracji inicjowane przez iMessage lub ich odmawiaj.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje iMessage z trwałymi sesjami ACP. Użyj znormalizowanego uchwytu lub jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Semantyka pól współdzielonych: [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).

<Accordion title="iMessage SSH wrapper example">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix jest obsługiwany przez Plugin i skonfigurowany w `channels.matrix`.

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
- `channels.matrix.proxy` kieruje ruch HTTP Matrix przez jawny proxy HTTP(S). Nazwane konta mogą nadpisać to za pomocą `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` zezwala na prywatne/wewnętrzne homeservery. `proxy` i ta zgoda sieciowa są niezależnymi kontrolkami.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach wielokontowych.
- `channels.matrix.autoJoin` domyślnie ma wartość `off`, więc zaproszone pokoje i nowe zaproszenia w stylu DM są ignorowane, dopóki nie ustawisz `autoJoin: "allowlist"` z `autoJoinAllowlist` albo `autoJoin: "always"`.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` albo `"auto"` (domyślnie). W trybie automatycznym zatwierdzenia exec aktywują się, gdy zatwierdzających można rozwiązać z `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`) uprawnione do zatwierdzania żądań exec.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub regex).
  - `target`: gdzie wysyłać monity o zatwierdzenie. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) albo `"both"`.
  - Nadpisania dla poszczególnych kont: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kontroluje, jak DM-y Matrix grupują się w sesje: `per-user` (domyślnie) współdzieli według routowanego peera, natomiast `per-room` izoluje każdy pokój DM.
- Sondy statusu Matrix i wyszukiwania katalogu na żywo używają tej samej polityki proxy co ruch runtime.
- Pełna konfiguracja Matrix, reguły targetowania i przykłady konfiguracji są udokumentowane w [Matrix](/pl/channels/matrix).

### Microsoft Teams

Microsoft Teams jest obsługiwany przez Plugin i skonfigurowany w `channels.msteams`.

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
- Pełna konfiguracja Teams (poświadczenia, Webhook, polityka DM/grup, nadpisania dla zespołu/kanału) jest udokumentowana w [Microsoft Teams](/pl/channels/msteams).

### IRC

IRC jest obsługiwany przez Plugin i skonfigurowany w `channels.irc`.

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
- Opcjonalne `channels.irc.defaultAccount` nadpisuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Pełna konfiguracja kanału IRC (host/port/TLS/kanały/listy dozwolonych/bramkowanie wzmiankami) jest udokumentowana w [IRC](/pl/channels/irc).

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

- `default` jest używane, gdy `accountId` zostanie pominięte (CLI + routing).
- Tokeny env mają zastosowanie tylko do konta **domyślnego**.
- Bazowe ustawienia kanału mają zastosowanie do wszystkich kont, chyba że zostaną nadpisane dla danego konta.
- Użyj `bindings[].match.accountId`, aby kierować każde konto do innego agenta.
- Jeśli dodasz konto inne niż domyślne przez `openclaw channels add` (lub onboarding kanału), nadal mając jednokontową konfigurację kanału najwyższego poziomu, OpenClaw najpierw przeniesie jednokontowe wartości najwyższego poziomu objęte zakresem konta do mapy kont kanału, aby pierwotne konto nadal działało. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.
- Istniejące powiązania tylko kanałowe (bez `accountId`) nadal pasują do konta domyślnego; powiązania objęte zakresem konta pozostają opcjonalne.
- `openclaw doctor --fix` naprawia także mieszane kształty, przenosząc jednokontowe wartości najwyższego poziomu objęte zakresem konta do promowanego konta wybranego dla tego kanału. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.

### Inne kanały Plugin

Wiele kanałów Plugin jest skonfigurowanych jako `channels.<id>` i udokumentowanych na własnych stronach kanałów (na przykład Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat i Twitch).
Zobacz pełny indeks kanałów: [Kanały](/pl/channels).

### Bramkowanie czatu grupowego wzmiankami

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianka w metadanych lub bezpieczne wzorce regex). Dotyczy czatów grupowych WhatsApp, Telegram, Discord, Google Chat i iMessage.

Widoczne odpowiedzi są kontrolowane osobno. Pokoje grupowe/kanałowe domyślnie używają `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw nadal przetwarza turę, ale zwykłe odpowiedzi końcowe pozostają prywatne, a widoczne wyjście w pokoju wymaga `message(action=send)`. Ustaw `"automatic"` tylko wtedy, gdy chcesz zachowania starszego typu, w którym zwykłe odpowiedzi są publikowane z powrotem w pokoju. Aby zastosować to samo zachowanie widocznych odpowiedzi wyłącznie przez narzędzie także do czatów bezpośrednich, ustaw `messages.visibleReplies: "message_tool"`; harness Codex również używa tego zachowania wyłącznie przez narzędzie jako domyślnego dla nieustawionych czatów bezpośrednich.

Widoczne odpowiedzi wyłącznie przez narzędzie wymagają modelu/środowiska uruchomieniowego, które niezawodnie wywołuje narzędzia. Jeśli
dziennik sesji pokazuje tekst asystenta z `didSendViaMessagingTool: false`,
model utworzył prywatną odpowiedź końcową zamiast wywołać narzędzie wiadomości.
Przełącz na silniejszy model wywołujący narzędzia dla tego kanału albo ustaw
`messages.groupChat.visibleReplies: "automatic"`, aby przywrócić starsze widoczne odpowiedzi końcowe.

Jeśli narzędzie wiadomości jest niedostępne w ramach aktywnej polityki narzędzi, OpenClaw wraca do automatycznych widocznych odpowiedzi zamiast po cichu tłumić odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku. Restartuj tylko wtedy, gdy obserwowanie plików lub przeładowywanie konfiguracji jest wyłączone we wdrożeniu.

**Typy wzmianek:**

- **Wzmianki metadanych**: Natywne wzmianki @ platformy. Ignorowane w trybie czatu z samym sobą w WhatsApp.
- **Wzorce tekstowe**: Bezpieczne wzorce regex w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Bramka wzmianek jest egzekwowana tylko wtedy, gdy wykrywanie jest możliwe (natywne wzmianki lub co najmniej jeden wzorzec).

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

`messages.groupChat.historyLimit` ustawia globalną wartość domyślną. Kanały mogą ją nadpisać przez `channels.<channel>.historyLimit` (albo dla poszczególnych kont). Ustaw `0`, aby wyłączyć.

`messages.visibleReplies` jest globalną wartością domyślną dla tur źródłowych; `messages.groupChat.visibleReplies` nadpisuje ją dla tur źródłowych grup/kanałów. Gdy `messages.visibleReplies` nie jest ustawione, harness może dostarczyć własną wartość domyślną dla bezpośrednich/źródłowych; harness Codex domyślnie używa `message_tool`. Listy dozwolonych kanałów i bramka wzmianek nadal decydują, czy tura jest przetwarzana.

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

<Accordion title="Szczegóły poleceń">

- Ten blok konfiguruje powierzchnie poleceń. Aktualny katalog wbudowanych i dołączonych poleceń znajduje się w [Poleceniach ukośnikowych](/pl/tools/slash-commands).
- Ta strona jest **odniesieniem do kluczy konfiguracji**, a nie pełnym katalogiem poleceń. Polecenia należące do kanałów/Pluginów, takie jak QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, parowanie urządzenia `/pair`, pamięć `/dreaming`, sterowanie telefonem `/phone` oraz Talk `/voice`, są udokumentowane na stronach swoich kanałów/Pluginów oraz w [Poleceniach ukośnikowych](/pl/tools/slash-commands).
- Polecenia tekstowe muszą być **samodzielnymi** wiadomościami zaczynającymi się od `/`.
- `native: "auto"` włącza natywne polecenia dla Discord/Telegram, pozostawia Slack wyłączony.
- `nativeSkills: "auto"` włącza natywne polecenia Skills dla Discord/Telegram, pozostawia Slack wyłączony.
- Nadpisanie dla kanału: `channels.discord.commands.native` (wartość logiczna albo `"auto"`). Dla Discord `false` pomija rejestrację i czyszczenie natywnych poleceń podczas uruchamiania.
- Nadpisz rejestrację natywnych poleceń Skills dla kanału za pomocą `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` dodaje dodatkowe pozycje menu bota Telegram.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` oraz nadawcy w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczytuje/zapisuje `openclaw.json`). Dla klientów Gateway `chat.send` trwałe zapisy `/config set|unset` wymagają także `operator.admin`; tylko do odczytu `/config show` pozostaje dostępne dla zwykłych klientów operatora z zakresem zapisu.
- `mcp: true` włącza `/mcp` dla konfiguracji serwera MCP zarządzanego przez OpenClaw w `mcp.servers`.
- `plugins: true` włącza `/plugins` dla odkrywania, instalowania oraz włączania/wyłączania Pluginów.
- `channels.<provider>.configWrites` bramkuje mutacje konfiguracji dla kanału (domyślnie: true).
- W przypadku kanałów wielokontowych `channels.<provider>.accounts.<id>.configWrites` bramkuje także zapisy kierowane do tego konta (na przykład `/allowlist --config --account <id>` albo `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` wyłącza `/restart` oraz akcje narzędzia restartowania Gateway. Domyślnie: `true`.
- `ownerAllowFrom` to jawna lista dozwolonych właścicieli dla poleceń/narzędzi tylko dla właściciela. Jest oddzielna od `allowFrom`.
- `ownerDisplay: "hash"` haszuje identyfikatory właścicieli w prompcie systemowym. Ustaw `ownerDisplaySecret`, aby kontrolować haszowanie.
- `allowFrom` jest ustawiane per dostawca. Gdy jest ustawione, jest **jedynym** źródłem autoryzacji (listy dozwolone kanałów/parowanie oraz `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala poleceniom omijać polityki grup dostępu, gdy `allowFrom` nie jest ustawione.
- Mapa dokumentacji poleceń:
  - katalog wbudowany i dołączony: [Polecenia ukośnikowe](/pl/tools/slash-commands)
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
