---
read_when:
    - Konfigurowanie Plugin dla kanału (uwierzytelnianie, kontrola dostępu, wiele kont)
    - Rozwiązywanie problemów z kluczami konfiguracji dla poszczególnych kanałów
    - Audytowanie zasad wiadomości prywatnych, zasad grup lub bramkowania wzmianek
summary: 'Konfiguracja kanałów: kontrola dostępu, parowanie, klucze dla poszczególnych kanałów w Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych'
title: Konfiguracja — kanały
x-i18n:
    generated_at: "2026-05-07T01:52:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f94d41a347ade8b9447e9f31e48d46830b2faac2202823480a68b7986107176e
    source_path: gateway/config-channels.md
    workflow: 16
---

Klucze konfiguracji poszczególnych kanałów pod `channels.*`. Obejmuje dostęp do wiadomości prywatnych i grup,
konfiguracje wielu kont, bramkowanie wzmiankami oraz klucze poszczególnych kanałów dla Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage i innych dołączonych Plugin kanałów.

Informacje o agentach, narzędziach, środowisku uruchomieniowym Gateway i innych kluczach najwyższego poziomu znajdziesz w
[Dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że ustawiono `enabled: false`).

### Dostęp do wiadomości prywatnych i grup

Wszystkie kanały obsługują zasady wiadomości prywatnych i zasady grup:

| Zasada wiadomości prywatnych | Zachowanie                                                      |
| ---------------------------- | --------------------------------------------------------------- |
| `pairing` (domyślnie)        | Nieznani nadawcy otrzymują jednorazowy kod parowania; właściciel musi zatwierdzić |
| `allowlist`                  | Tylko nadawcy w `allowFrom` (lub w magazynie zatwierdzonych sparowanych nadawców) |
| `open`                       | Zezwól na wszystkie przychodzące wiadomości prywatne (wymaga `allowFrom: ["*"]`) |
| `disabled`                   | Ignoruj wszystkie przychodzące wiadomości prywatne              |

| Zasada grupowa                | Zachowanie                                             |
| ----------------------------- | ------------------------------------------------------ |
| `allowlist` (domyślnie)       | Tylko grupy zgodne ze skonfigurowaną listą dozwolonych |
| `open`                        | Pomiń listy dozwolonych grup (bramkowanie wzmiankami nadal obowiązuje) |
| `disabled`                    | Blokuj wszystkie wiadomości grupowe/z pokoi            |

<Note>
`channels.defaults.groupPolicy` ustawia wartość domyślną, gdy `groupPolicy` dostawcy nie jest ustawione.
Kody parowania wygasają po 1 godzinie. Oczekujące żądania parowania wiadomości prywatnych są ograniczone do **3 na kanał**.
Jeśli blok dostawcy całkowicie nie istnieje (brak `channels.<provider>`), zasada grupowa środowiska uruchomieniowego wraca do `allowlist` (bezpiecznie zamknięte) z ostrzeżeniem podczas uruchamiania.
</Note>

### Nadpisania modelu kanału

Użyj `channels.modelByChannel`, aby przypiąć określone identyfikatory kanałów do modelu. Wartości akceptują `provider/model` lub skonfigurowane aliasy modeli. Mapowanie kanału ma zastosowanie, gdy sesja nie ma już nadpisania modelu (na przykład ustawionego przez `/model`).

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

Użyj `channels.defaults`, aby współdzielić zasady grupowe i zachowanie Heartbeat między dostawcami:

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

- `channels.defaults.groupPolicy`: zastępcza zasada grupowa, gdy `groupPolicy` na poziomie dostawcy nie jest ustawione.
- `channels.defaults.contextVisibility`: domyślny tryb widoczności kontekstu uzupełniającego dla wszystkich kanałów. Wartości: `all` (domyślnie, uwzględnia cały cytowany/wątkowy/historyczny kontekst), `allowlist` (uwzględnia tylko kontekst od nadawców z listy dozwolonych), `allowlist_quote` (tak samo jak lista dozwolonych, ale zachowuje jawny kontekst cytatu/odpowiedzi). Nadpisanie dla kanału: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględniaj prawidłowe statusy kanałów w danych wyjściowych Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: uwzględniaj statusy zdegradowane/błędów w danych wyjściowych Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderuj kompaktowe dane wyjściowe Heartbeat w stylu wskaźnika.

### WhatsApp

WhatsApp działa przez kanał webowy Gateway (Baileys Web). Uruchamia się automatycznie, gdy istnieje połączona sesja.

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

- Polecenia wychodzące domyślnie używają konta `default`, jeśli istnieje; w przeciwnym razie pierwszego skonfigurowanego identyfikatora konta (po sortowaniu).
- Opcjonalne `channels.whatsapp.defaultAccount` nadpisuje ten zastępczy domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Starszy katalog uwierzytelniania Baileys dla pojedynczego konta jest migrowany przez `openclaw doctor` do `whatsapp/default`.
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

- Token bota: `channels.telegram.botToken` lub `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne odrzucane), z `TELEGRAM_BOT_TOKEN` jako wartością zastępczą dla konta domyślnego.
- `apiRoot` jest tylko katalogiem głównym Telegram Bot API. Użyj `https://api.telegram.org` albo własnego hostowanego/proksowanego katalogu głównego, nie `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` usuwa przypadkowy końcowy sufiks `/bot<TOKEN>`.
- Opcjonalne `channels.telegram.defaultAccount` nadpisuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- W konfiguracjach wielu kont (co najmniej 2 identyfikatory kont) ustaw jawne konto domyślne (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć trasowania zastępczego; `openclaw doctor` ostrzega, gdy tego brakuje lub jest nieprawidłowe.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Telegram (migracje identyfikatorów supergrup, `/config set|unset`).
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla tematów forum (użyj kanonicznego `chatId:topic:topicId` w `match.peer.id`). Semantyka pól jest współdzielona w [Agentach ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- Podglądy strumienia Telegram używają `sendMessage` + `editMessageText` (działa w czatach bezpośrednich i grupowych).
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

- Token: `channels.discord.token`, z `DISCORD_BOT_TOKEN` jako rozwiązaniem zapasowym dla konta domyślnego.
- Bezpośrednie wywołania wychodzące, które podają jawny Discord `token`, używają tego tokenu dla wywołania; ustawienia ponawiania/polityki konta nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
- Opcjonalne `channels.discord.defaultAccount` zastępuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Użyj `user:<id>` (DM) lub `channel:<id>` (kanał gildii) jako celów dostarczania; same numeryczne identyfikatory są odrzucane.
- Slugi gildii są pisane małymi literami, ze spacjami zastąpionymi przez `-`; klucze kanałów używają nazwy ze slugiem (bez `#`). Preferuj identyfikatory gildii.
- Wiadomości utworzone przez boty są domyślnie ignorowane. `allowBots: true` je włącza; użyj `allowBots: "mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal są filtrowane).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz nadpisania kanałów) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyłączeniem @everyone/@here).
- `channels.discord.mentionAliases` mapuje stabilny wychodzący tekst `@handle` na identyfikatory użytkowników Discord przed wysłaniem, aby znanych członków zespołu można było wspominać deterministycznie, nawet gdy przejściowa pamięć podręczna katalogu jest pusta. Nadpisania dla kont znajdują się pod `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (domyślnie 17) dzieli wysokie wiadomości, nawet gdy mają mniej niż 2000 znaków.
- `channels.discord.threadBindings` steruje trasowaniem Discord powiązanym z wątkiem:
  - `enabled`: nadpisanie Discord dla funkcji sesji powiązanych z wątkiem (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane dostarczanie/trasowanie)
  - `idleHours`: nadpisanie Discord dla automatycznego usuwania skupienia po bezczynności w godzinach (`0` wyłącza)
  - `maxAgeHours`: nadpisanie Discord dla twardego maksymalnego wieku w godzinach (`0` wyłącza)
  - `spawnSessions`: przełącznik dla `sessions_spawn({ thread: true })` oraz automatycznego tworzenia/powiązania wątku ACP przy uruchamianiu wątku (`true` domyślnie)
  - `defaultSpawnContext`: natywny kontekst subagenta dla uruchomień powiązanych z wątkiem (`"fork"` domyślnie)
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (użyj identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest współdzielona w [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu dla kontenerów komponentów Discord v2.
- `channels.discord.voice` włącza rozmowy na kanałach głosowych Discord oraz opcjonalne nadpisania automatycznego dołączania + LLM + TTS. Konfiguracje Discord wyłącznie tekstowe domyślnie pozostawiają głos wyłączony; ustaw `channels.discord.voice.enabled=true`, aby go włączyć.
- `channels.discord.voice.model` opcjonalnie nadpisuje model LLM używany do odpowiedzi na kanałach głosowych Discord.
- `channels.discord.voice.daveEncryption` i `channels.discord.voice.decryptionFailureTolerance` są przekazywane do opcji DAVE `@discordjs/voice` (`true` i `24` domyślnie).
- `channels.discord.voice.connectTimeoutMs` kontroluje początkowe oczekiwanie Ready `@discordjs/voice` dla `/vc join` oraz prób automatycznego dołączania (`30000` domyślnie).
- `channels.discord.voice.reconnectGraceMs` kontroluje, jak długo rozłączona sesja głosowa może przechodzić do sygnalizacji ponownego połączenia, zanim OpenClaw ją zniszczy (`15000` domyślnie).
- OpenClaw dodatkowo próbuje odzyskać odbiór głosu przez opuszczenie i ponowne dołączenie do sesji głosowej po powtarzających się błędach deszyfrowania.
- `channels.discord.streaming` jest kanonicznym kluczem trybu strumienia. Discord domyślnie używa `streaming.mode: "progress"`, więc postęp narzędzi/pracy pojawia się w jednej edytowanej wiadomości podglądu; ustaw `streaming.mode: "off"`, aby to wyłączyć. Starsze wartości `streamMode` oraz logiczne `streaming` pozostają aliasami środowiska uruchomieniowego; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- `channels.discord.autoPresence` mapuje dostępność środowiska uruchomieniowego na obecność bota (healthy => online, degraded => idle, exhausted => dnd) i pozwala na opcjonalne nadpisania tekstu statusu.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie według zmiennej nazwy/tagu (tryb zgodności awaryjnej).
- `channels.discord.execApprovals`: natywne dla Discord dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie automatycznym zatwierdzenia exec aktywują się, gdy zatwierdzający mogą zostać rozwiązani z `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discord uprawnionych do zatwierdzania żądań exec. Gdy pominięte, używa awaryjnie `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna allowlista identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub regex).
  - `target`: gdzie wysyłać monity o zatwierdzenie. `"dm"` (domyślnie) wysyła do DM zatwierdzających, `"channel"` wysyła do kanału źródłowego, `"both"` wysyła do obu. Gdy cel zawiera `"channel"`, przyciski są używalne tylko przez rozwiązanych zatwierdzających.
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

- JSON konta usługi: wbudowany (`serviceAccount`) lub oparty na pliku (`serviceAccountFile`).
- Obsługiwany jest także SecretRef konta usługi (`serviceAccountRef`).
- Rozwiązania zapasowe env: `GOOGLE_CHAT_SERVICE_ACCOUNT` lub `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Użyj `spaces/<spaceId>` lub `users/<userId>` jako celów dostarczania.
- `channels.googlechat.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie według zmiennego głównego adresu e-mail (tryb zgodności awaryjnej).

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

- **Tryb gniazda** wymaga zarówno `botToken`, jak i `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` jako zapasowe zmienne env dla konta domyślnego).
- **Tryb HTTP** wymaga `botToken` oraz `signingSecret` (w katalogu głównym lub dla konta).
- `socketMode` przekazuje dostrajanie transportu Socket Mode SDK Slack do publicznego API odbiornika Bolt. Używaj go tylko podczas badania limitów czasu ping/pong lub zachowania przestarzałego websocketu.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują zwykłe ciągi tekstowe
  lub obiekty SecretRef.
- Migawki kont Slack ujawniają pola źródła/statusu dla poszczególnych poświadczeń, takie jak
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` oraz, w trybie HTTP,
  `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest
  skonfigurowane przez SecretRef, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego nie mogła
  rozwiązać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Slack.
- Opcjonalne `channels.slack.defaultAccount` zastępuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- `channels.slack.streaming.mode` jest kanonicznym kluczem trybu strumienia Slack. `channels.slack.streaming.nativeTransport` kontroluje natywny transport strumieniowy Slack. Starsze wartości `streamMode`, logiczne `streaming` oraz `nativeStreaming` pozostają aliasami środowiska uruchomieniowego; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- Użyj `user:<id>` (DM) lub `channel:<id>` jako celów dostarczania.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji wątku:** `thread.historyScope` jest przypisane do wątku (domyślnie) lub współdzielone w kanale. `thread.inheritParent` kopiuje transkrypt kanału nadrzędnego do nowych wątków.

- Natywne strumieniowanie Slack oraz status wątku w stylu asystenta Slack „is typing...” wymagają celu odpowiedzi w wątku. DM najwyższego poziomu domyślnie pozostają poza wątkiem, więc nadal mogą strumieniować przez robocze podglądy Slack typu publikuj-i-edytuj zamiast pokazywać natywny podgląd strumienia/statusu w stylu wątku.
- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy odpowiedź jest wykonywana, a następnie usuwa ją po zakończeniu. Użyj shortcode emoji Slack, takiego jak `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slack dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających. Ten sam schemat co Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slack), `agentFilter`, `sessionFilter` i `target` (`"dm"`, `"channel"` lub `"both"`).

| Grupa akcji | Domyślnie | Uwagi                  |
| ------------ | ------- | ---------------------- |
| reactions    | włączone | Reagowanie + lista reakcji |
| messages     | włączone | Odczyt/wysyłanie/edycja/usuwanie  |
| pins         | włączone | Przypinanie/odpinanie/lista         |
| memberInfo   | włączone | Informacje o członku            |
| emojiList    | włączone | Lista niestandardowych emoji      |

### Mattermost

Mattermost jest dostarczany jako bundled Plugin w bieżących wydaniach OpenClaw. Starsze lub
niestandardowe kompilacje mogą zainstalować bieżący pakiet npm za pomocą
`openclaw plugins install @openclaw/mattermost`. Sprawdź
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
pod kątem bieżących tagów dist-tags przed przypięciem wersji.

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

Tryby czatu: `oncall` (odpowiada na @-wzmiankę, domyślnie), `onmessage` (każda wiadomość), `onchar` (wiadomości zaczynające się prefiksem wyzwalacza).

Gdy natywne polecenia Mattermost są włączone:

- `commands.callbackPath` musi być ścieżką (na przykład `/api/channels/mattermost/command`), a nie pełnym adresem URL.
- `commands.callbackUrl` musi wskazywać endpoint Gateway OpenClaw i być osiągalny z serwera Mattermost.
- Natywne wywołania zwrotne slash są uwierzytelniane tokenami poszczególnych poleceń zwróconymi
  przez Mattermost podczas rejestracji polecenia slash. Jeśli rejestracja się nie powiedzie albo żadne
  polecenia nie zostaną aktywowane, OpenClaw odrzuca wywołania zwrotne z komunikatem
  `Unauthorized: invalid command token.`
- W przypadku prywatnych/tailnet/wewnętrznych hostów wywołań zwrotnych Mattermost może wymagać,
  aby `ServiceSettings.AllowedUntrustedInternalConnections` zawierało host/domenę wywołania zwrotnego.
  Używaj wartości hosta/domeny, a nie pełnych adresów URL.
- `channels.mattermost.configWrites`: zezwól na zapisy konfiguracji inicjowane przez Mattermost albo ich odmów.
- `channels.mattermost.requireMention`: wymagaj `@mention` przed odpowiadaniem w kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: nadpisanie bramkowania wzmiankami dla kanału (`"*"` jako domyślne).
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

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślne), `all`, `allowlist` (z `reactionAllowlist`).

- `channels.signal.account`: przypnij uruchomienie kanału do określonej tożsamości konta Signal.
- `channels.signal.configWrites`: zezwól na zapisy konfiguracji inicjowane przez Signal albo ich odmów.
- Opcjonalne `channels.signal.defaultAccount` nadpisuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.

### BlueBubbles

BlueBubbles to starszy most iMessage (oparty na Plugin, skonfigurowany pod `channels.bluebubbles`). Istniejące konfiguracje pozostają obsługiwane, ale nowe wdrożenia OpenClaw iMessage powinny preferować `channels.imessage`, gdy `imsg` może działać na hoście Messages.

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
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą powiązać konwersacje BlueBubbles z trwałymi sesjami ACP. Użyj uchwytu BlueBubbles albo ciągu docelowego (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Wspólna semantyka pól: [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- Pełna konfiguracja kanału BlueBubbles i uzasadnienie wycofania są udokumentowane w [BlueBubbles](/pl/channels/bluebubbles).

### iMessage

OpenClaw uruchamia `imsg rpc` (JSON-RPC przez stdio). Nie jest wymagany żaden demon ani port. To preferowana ścieżka dla nowych konfiguracji OpenClaw iMessage, gdy host może przyznać uprawnienia do bazy danych Messages i Automation.

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

- Wymaga pełnego dostępu do dysku dla bazy danych Messages.
- Preferuj cele `chat_id:<id>`. Użyj `imsg chats --limit 20`, aby wyświetlić listę czatów.
- `cliPath` może wskazywać wrapper SSH; ustaw `remoteHost` (`host` albo `user@host`) do pobierania załączników przez SCP.
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają przychodzące ścieżki załączników (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa ścisłego sprawdzania klucza hosta, więc upewnij się, że klucz hosta przekaźnika już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwól na zapisy konfiguracji inicjowane przez iMessage albo ich odmów.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą powiązać konwersacje iMessage z trwałymi sesjami ACP. Użyj znormalizowanego uchwytu albo jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Wspólna semantyka pól: [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Przykład wrappera SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix jest oparty na Plugin i skonfigurowany pod `channels.matrix`.

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` zezwala na prywatne/wewnętrzne homeservery. `proxy` i ta zgoda sieciowa są niezależnymi mechanizmami kontroli.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach z wieloma kontami.
- `channels.matrix.autoJoin` domyślnie ma wartość `off`, więc zaproszone pokoje i nowe zaproszenia w stylu DM są ignorowane, dopóki nie ustawisz `autoJoin: "allowlist"` z `autoJoinAllowlist` albo `autoJoin: "always"`.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` albo `"auto"` (domyślne). W trybie automatycznym zatwierdzenia exec aktywują się, gdy zatwierdzających można rozpoznać z `approvers` albo `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`) uprawnione do zatwierdzania żądań exec.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg albo wyrażenie regularne).
  - `target`: gdzie wysyłać monity o zatwierdzenie. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) albo `"both"`.
  - Nadpisania dla kont: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steruje tym, jak DM Matrix grupują się w sesje: `per-user` (domyślnie) współdzieli według trasowanego peera, a `per-room` izoluje każdy pokój DM.
- Próby statusu Matrix i wyszukiwania w katalogu na żywo używają tej samej polityki proxy co ruch w czasie działania.
- Pełna konfiguracja Matrix, reguły kierowania i przykłady konfiguracji są udokumentowane w [Matrix](/pl/channels/matrix).

### Microsoft Teams

Microsoft Teams jest oparty na Plugin i skonfigurowany pod `channels.msteams`.

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
- Pełna konfiguracja Teams (dane uwierzytelniające, Webhook, polityka DM/grup, nadpisania dla zespołów/kanałów) jest udokumentowana w [Microsoft Teams](/pl/channels/msteams).

### IRC

IRC jest oparty na Plugin i skonfigurowany pod `channels.irc`.

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

Uruchom wiele kont na kanał (każde z własnym `accountId`):

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

- `default` jest używane, gdy `accountId` zostanie pominięte (CLI + trasowanie).
- Tokeny env mają zastosowanie tylko do konta **domyślnego**.
- Podstawowe ustawienia kanału mają zastosowanie do wszystkich kont, chyba że zostaną nadpisane dla konta.
- Użyj `bindings[].match.accountId`, aby kierować każde konto do innego agenta.
- Jeśli dodasz konto inne niż domyślne za pomocą `openclaw channels add` (albo onboardingu kanału), nadal będąc przy konfiguracji kanału najwyższego poziomu z jednym kontem, OpenClaw najpierw promuje wartości pojedynczego konta z najwyższego poziomu, objęte zakresem konta, do mapy kont kanału, aby pierwotne konto nadal działało. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.
- Istniejące powiązania tylko kanałowe (bez `accountId`) nadal pasują do konta domyślnego; powiązania z zakresem konta pozostają opcjonalne.
- `openclaw doctor --fix` naprawia także mieszane kształty, przenosząc wartości pojedynczego konta z najwyższego poziomu, objęte zakresem konta, do promowanego konta wybranego dla tego kanału. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.

### Inne kanały Plugin

Wiele kanałów Plugin jest konfigurowanych jako `channels.<id>` i udokumentowanych na dedykowanych stronach kanałów (na przykład Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat i Twitch).
Zobacz pełny indeks kanałów: [Kanały](/pl/channels).

### Bramkowanie wzmiankami w czacie grupowym

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianka w metadanych albo bezpieczne wzorce regex). Dotyczy to czatów grupowych WhatsApp, Telegram, Discord, Google Chat i iMessage.

Widoczne odpowiedzi są kontrolowane oddzielnie. Pokoje grupowe/kanałowe domyślnie używają `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw nadal przetwarza turę, ale normalne końcowe odpowiedzi pozostają prywatne, a widoczne wyjście w pokoju wymaga `message(action=send)`. Ustaw `"automatic"` tylko wtedy, gdy chcesz zachować starsze zachowanie, w którym normalne odpowiedzi są publikowane z powrotem w pokoju. Aby zastosować to samo zachowanie widocznych odpowiedzi wyłącznie przez narzędzie także do czatów bezpośrednich, ustaw `messages.visibleReplies: "message_tool"`; harness Codex również używa tego zachowania wyłącznie przez narzędzie jako nieustawionej wartości domyślnej dla czatu bezpośredniego.

Widoczne odpowiedzi wyłącznie przez narzędzie wymagają modelu/środowiska wykonawczego, które niezawodnie wywołuje narzędzia. Jeśli
dziennik sesji pokazuje tekst asystenta z `didSendViaMessagingTool: false`, oznacza to, że
model utworzył prywatną odpowiedź końcową zamiast wywołać narzędzie wiadomości.
Przełącz się na mocniejszy model wywołujący narzędzia dla tego kanału albo ustaw
`messages.groupChat.visibleReplies: "automatic"`, aby przywrócić starsze widoczne odpowiedzi końcowe.

Jeśli narzędzie wiadomości jest niedostępne w ramach aktywnej polityki narzędzi, OpenClaw przełącza się na automatyczne widoczne odpowiedzi zamiast po cichu tłumić odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

Gateway ponownie ładuje na gorąco konfigurację `messages` po zapisaniu pliku. Uruchom ponownie tylko wtedy, gdy obserwowanie plików lub ponowne ładowanie konfiguracji jest wyłączone we wdrożeniu.

**Typy wzmianek:**

- **Wzmianki metadanych**: Natywne @-wzmianki platformy. Ignorowane w trybie czatu z samym sobą w WhatsApp.
- **Wzorce tekstowe**: Bezpieczne wzorce regex w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Filtrowanie na podstawie wzmianek jest egzekwowane tylko wtedy, gdy wykrywanie jest możliwe (natywne wzmianki lub co najmniej jeden wzorzec).

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

`messages.groupChat.historyLimit` ustawia globalną wartość domyślną. Kanały mogą ją zastąpić przez `channels.<channel>.historyLimit` (lub dla konkretnego konta). Ustaw `0`, aby wyłączyć.

`messages.visibleReplies` jest globalną wartością domyślną dla tur źródłowych; `messages.groupChat.visibleReplies` zastępuje ją dla tur źródłowych grup/kanałów. Gdy `messages.visibleReplies` nie jest ustawione, harness może podać własną wartość domyślną dla czatów bezpośrednich/źródłowych; harness Codex domyślnie używa `message_tool`. Listy dozwolonych kanałów i filtrowanie na podstawie wzmianek nadal decydują, czy tura zostanie przetworzona.

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

#### Tryb czatu z samym sobą

Dodaj własny numer do `allowFrom`, aby włączyć tryb czatu z samym sobą (ignoruje natywne @-wzmianki, odpowiada tylko na wzorce tekstowe):

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

- Ten blok konfiguruje powierzchnie poleceń. Aktualny wbudowany i dołączony katalog poleceń znajdziesz w [Poleceniach Slash](/pl/tools/slash-commands).
- Ta strona jest **referencją kluczy konfiguracji**, a nie pełnym katalogiem poleceń. Polecenia należące do kanałów/Plugin, takie jak `/bot-ping` `/bot-help` `/bot-logs` QQ Bot, `/card` LINE, `/pair` parowania urządzeń, `/dreaming` pamięci, `/phone` sterowania telefonem i `/voice` Talk, są udokumentowane na stronach ich kanałów/Plugin oraz w [Poleceniach Slash](/pl/tools/slash-commands).
- Polecenia tekstowe muszą być **samodzielnymi** wiadomościami z początkowym `/`.
- `native: "auto"` włącza natywne polecenia dla Discord/Telegram, pozostawia Slack wyłączony.
- `nativeSkills: "auto"` włącza natywne polecenia Skills dla Discord/Telegram, pozostawia Slack wyłączony.
- Zastąpienie dla kanału: `channels.discord.commands.native` (bool lub `"auto"`). Dla Discord wartość `false` pomija rejestrację natywnych poleceń i czyszczenie podczas uruchamiania.
- Zastąp natywną rejestrację Skills dla kanału przez `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` dodaje dodatkowe wpisy menu bota Telegram.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` oraz nadawcy w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczytuje/zapisuje `openclaw.json`). Dla klientów Gateway `chat.send` trwałe zapisy `/config set|unset` wymagają także `operator.admin`; tylko do odczytu `/config show` pozostaje dostępne dla zwykłych klientów operatora z zakresem zapisu.
- `mcp: true` włącza `/mcp` dla konfiguracji serwera MCP zarządzanego przez OpenClaw w `mcp.servers`.
- `plugins: true` włącza `/plugins` do odkrywania Plugin, instalacji i sterowania włączaniem/wyłączaniem.
- `channels.<provider>.configWrites` bramkuje mutacje konfiguracji dla kanału (domyślnie: true).
- W przypadku kanałów z wieloma kontami `channels.<provider>.accounts.<id>.configWrites` także bramkuje zapisy kierowane do tego konta (na przykład `/allowlist --config --account <id>` lub `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` wyłącza `/restart` oraz akcje narzędzia ponownego uruchomienia Gateway. Domyślnie: `true`.
- `ownerAllowFrom` to jawna lista dozwolonych właścicieli dla poleceń/narzędzi tylko dla właściciela. Jest oddzielna od `allowFrom`.
- `ownerDisplay: "hash"` haszuje identyfikatory właścicieli w prompcie systemowym. Ustaw `ownerDisplaySecret`, aby kontrolować haszowanie.
- `allowFrom` jest konfigurowane per dostawca. Gdy jest ustawione, stanowi **jedyne** źródło autoryzacji (listy dozwolonych kanałów/parowanie i `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala poleceniom ominąć polityki grup dostępu, gdy `allowFrom` nie jest ustawione.
- Mapa dokumentacji poleceń:
  - wbudowany i dołączony katalog: [Polecenia Slash](/pl/tools/slash-commands)
  - powierzchnie poleceń specyficzne dla kanału: [Kanały](/pl/channels)
  - polecenia QQ Bot: [QQ Bot](/pl/channels/qqbot)
  - polecenia parowania: [Parowanie](/pl/channels/pairing)
  - polecenie karty LINE: [LINE](/pl/channels/line)
  - memory dreaming: [Dreaming](/pl/concepts/dreaming)

</Accordion>

---

## Powiązane

- [Referencja konfiguracji](/pl/gateway/configuration-reference) — klucze najwyższego poziomu
- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Przegląd kanałów](/pl/channels)
