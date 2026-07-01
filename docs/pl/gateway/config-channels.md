---
read_when:
    - Konfigurowanie Plugin kanału (uwierzytelnianie, kontrola dostępu, wiele kont)
    - Rozwiązywanie problemów z kluczami konfiguracji poszczególnych kanałów
    - Audytowanie polityki DM, polityki grup lub bramkowania wzmianek
summary: 'Konfiguracja kanałów: kontrola dostępu, parowanie, klucze per kanał w Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i nie tylko'
title: Konfiguracja — kanały
x-i18n:
    generated_at: "2026-07-01T13:25:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

Klucze konfiguracji poszczególnych kanałów w `channels.*`. Obejmuje dostęp DM i grupowy,
konfiguracje wielu kont, bramkowanie wzmiankami oraz klucze poszczególnych kanałów dla Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage i innych dołączonych pluginów kanałów.

Informacje o agentach, narzędziach, środowisku uruchomieniowym Gateway i innych kluczach najwyższego poziomu znajdziesz w
[Dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że ustawiono `enabled: false`).

### Dostęp DM i grupowy

Wszystkie kanały obsługują zasady DM i zasady grupowe:

| Zasada DM           | Zachowanie                                                      |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (domyślna) | Nieznani nadawcy otrzymują jednorazowy kod parowania; właściciel musi zatwierdzić |
| `allowlist`         | Tylko nadawcy w `allowFrom` (lub sparowanym magazynie zezwoleń) |
| `open`              | Zezwalaj na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`) |
| `disabled`          | Ignoruj wszystkie przychodzące DM                               |

| Zasada grupowa        | Zachowanie                                             |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (domyślna) | Tylko grupy pasujące do skonfigurowanej listy zezwoleń |
| `open`                | Pomijaj grupowe listy zezwoleń (bramkowanie wzmiankami nadal obowiązuje) |
| `disabled`            | Blokuj wszystkie wiadomości grupowe/z pokoi            |

<Note>
`channels.defaults.groupPolicy` ustawia wartość domyślną, gdy `groupPolicy` dostawcy nie jest ustawione.
Kody parowania wygasają po 1 godzinie. Oczekujące żądania parowania DM są ograniczone do **3 na kanał**.
Jeśli blok dostawcy całkowicie nie istnieje (brak `channels.<provider>`), zasada grupowa środowiska uruchomieniowego wraca do `allowlist` (fail-closed) z ostrzeżeniem przy uruchomieniu.
</Note>

### Nadpisania modelu kanału

Użyj `channels.modelByChannel`, aby przypiąć konkretne identyfikatory kanałów lub rozmówców w wiadomościach bezpośrednich do modelu. Wartości akceptują `provider/model` lub skonfigurowane aliasy modeli. Mapowanie kanału ma zastosowanie, gdy sesja nie ma już nadpisania modelu (na przykład ustawionego przez `/model`).

Dla rozmów grupowych/wątków kluczami są specyficzne dla kanału identyfikatory grup, identyfikatory tematów lub nazwy kanałów. Dla rozmów w wiadomościach bezpośrednich (DM) kluczami są identyfikatory rozmówców pochodzące z tożsamości nadawcy kanału (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` lub `SenderId`). Dokładna postać klucza zależy od kanału:

| Kanał    | Postać klucza DM      | Przykład                                     |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | surowy identyfikator użytkownika | `123456789`                                  |
| Discord  | surowy identyfikator użytkownika | `987654321`                                  |
| WhatsApp | numer telefonu lub JID | `15551234567`                                |
| Matrix   | identyfikator użytkownika Matrix | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

Klucze specyficzne dla DM pasują tylko w rozmowach bezpośrednich; nie wpływają na trasowanie grup/wątków.

### Domyślne ustawienia kanałów i Heartbeat

Użyj `channels.defaults` dla współdzielonego zachowania zasad grupowych i Heartbeat u różnych dostawców:

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

- `channels.defaults.groupPolicy`: zapasowa zasada grupowa, gdy `groupPolicy` na poziomie dostawcy nie jest ustawione.
- `channels.defaults.contextVisibility`: domyślny tryb widoczności dodatkowego kontekstu dla wszystkich kanałów. Wartości: `all` (domyślnie, uwzględnia cały cytowany/wątkowy/historyczny kontekst), `allowlist` (uwzględnia tylko kontekst od nadawców z listy zezwoleń), `allowlist_quote` (tak samo jak allowlist, ale zachowuje jawny kontekst cytatu/odpowiedzi). Nadpisanie dla kanału: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględniaj zdrowe statusy kanałów w wyjściu Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: uwzględniaj statusy zdegradowane/błędów w wyjściu Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderuj kompaktowe wyjście Heartbeat w stylu wskaźnika.

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

- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla DM i grup WhatsApp. Użyj bezpośredniego numeru E.164 lub JID grupy WhatsApp w `match.peer.id`. Semantyka pól jest wspólna w [Agentach ACP](/pl/tools/acp-agents#persistent-channel-bindings).

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
- Opcjonalne `channels.whatsapp.defaultAccount` nadpisuje ten zapasowy wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.
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
      streaming: "partial", // off | partial | block | progress (default: partial)
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

- Token bota: `channels.telegram.botToken` lub `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne są odrzucane), z `TELEGRAM_BOT_TOKEN` jako wartością zapasową dla konta domyślnego.
- `apiRoot` to tylko korzeń Telegram Bot API. Użyj `https://api.telegram.org` albo własnego hostowanego/proxy korzenia, a nie `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` usuwa przypadkowy końcowy sufiks `/bot<TOKEN>`.
- Opcjonalne `channels.telegram.defaultAccount` nadpisuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- W konfiguracjach wielu kont (2+ identyfikatory kont) ustaw jawne domyślne konto (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć zapasowego trasowania; `openclaw doctor` ostrzega, gdy tego brakuje albo jest nieprawidłowe.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Telegram (migracje identyfikatorów supergrup, `/config set|unset`).
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla tematów forum (użyj kanonicznego `chatId:topic:topicId` w `match.peer.id`). Semantyka pól jest wspólna w [Agentach ACP](/pl/tools/acp-agents#persistent-channel-bindings).
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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
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

- Token: `channels.discord.token`, z `DISCORD_BOT_TOKEN` jako wartością zastępczą dla domyślnego konta.
- Bezpośrednie wywołania wychodzące, które podają jawny `token` Discord, używają tego tokenu dla wywołania; ustawienia ponawiania i zasad konta nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
- Opcjonalne `channels.discord.defaultAccount` nadpisuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Użyj `user:<id>` (DM) lub `channel:<id>` (kanał gildii) jako celów dostarczania; same numeryczne identyfikatory są odrzucane.
- Slugi gildii są pisane małymi literami, ze spacjami zastąpionymi przez `-`; klucze kanałów używają nazwy w formie sluga (bez `#`). Preferuj identyfikatory gildii.
- Wiadomości utworzone przez boty są domyślnie ignorowane. `allowBots: true` je włącza; użyj `allowBots: "mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal są filtrowane).
- Kanały obsługujące przychodzące wiadomości utworzone przez boty mogą używać wspólnej [ochrony przed pętlą botów](/pl/channels/bot-loop-protection). Ustaw `channels.defaults.botLoopProtection` dla bazowych budżetów par, a następnie nadpisz kanał lub konto tylko wtedy, gdy jedna powierzchnia wymaga innych limitów.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz nadpisania kanałów) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyłączeniem @everyone/@here).
- `channels.discord.mentionAliases` mapuje stabilny tekst wychodzący `@handle` na identyfikatory użytkowników Discord przed wysłaniem, dzięki czemu znani członkowie zespołu mogą być wspominani deterministycznie nawet wtedy, gdy przejściowy cache katalogu jest pusty. Nadpisania dla poszczególnych kont znajdują się w `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (domyślnie 17) dzieli wysokie wiadomości nawet wtedy, gdy mają mniej niż 2000 znaków.
- `channels.discord.suppressEmbeds` domyślnie ma wartość `true`, więc wychodzące adresy URL nie rozwijają się w podglądy linków Discord, chyba że zostanie to wyłączone. Jawne ładunki `embeds` nadal są wysyłane normalnie; wywołania narzędzi dla pojedynczych wiadomości mogą nadpisać to przez `suppressEmbeds`.
- `channels.discord.threadBindings` steruje routingiem powiązanym z wątkami Discord:
  - `enabled`: nadpisanie Discord dla funkcji sesji powiązanych z wątkami (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane dostarczanie/routing)
  - `idleHours`: nadpisanie Discord dla automatycznego cofnięcia skupienia po braku aktywności w godzinach (`0` wyłącza)
  - `maxAgeHours`: nadpisanie Discord dla twardego maksymalnego wieku w godzinach (`0` wyłącza)
  - `spawnSessions`: przełącznik dla `sessions_spawn({ thread: true })` oraz automatycznego tworzenia/powiązania wątków przez ACP thread-spawn (domyślnie: `true`)
  - `defaultSpawnContext`: natywny kontekst subagenta dla uruchomień powiązanych z wątkami (domyślnie `"fork"`)
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (użyj identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest wspólna w [Agentach ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu dla kontenerów komponentów Discord v2.
- `channels.discord.agentComponents.ttlMs` określa, jak długo wysłane callbacki komponentów Discord pozostają zarejestrowane. Wartość domyślna to `1800000` (30 minut), maksimum to `86400000` (24 godziny), a nadpisania dla poszczególnych kont znajdują się w `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Dłuższe wartości pozwalają dłużej używać starych przycisków, selektorów i formularzy, więc preferuj najkrótszy TTL pasujący do przepływu pracy.
- `channels.discord.voice` włącza rozmowy na kanałach głosowych Discord oraz opcjonalne nadpisania automatycznego dołączania, LLM i TTS. Konfiguracje Discord tylko tekstowe domyślnie pozostawiają głos wyłączony; ustaw `channels.discord.voice.enabled=true`, aby go włączyć.
- `channels.discord.voice.model` opcjonalnie nadpisuje model LLM używany dla odpowiedzi na kanałach głosowych Discord.
- `channels.discord.voice.daveEncryption` i `channels.discord.voice.decryptionFailureTolerance` są przekazywane do opcji DAVE `@discordjs/voice` (domyślnie `true` i `24`).
- `channels.discord.voice.connectTimeoutMs` steruje początkowym oczekiwaniem na Ready `@discordjs/voice` dla `/vc join` oraz prób automatycznego dołączania (domyślnie `30000`).
- `channels.discord.voice.reconnectGraceMs` określa, jak długo rozłączona sesja głosowa może wejść w sygnalizację ponownego połączenia, zanim OpenClaw ją zniszczy (domyślnie `15000`).
- Odtwarzanie głosu Discord nie jest przerywane przez zdarzenie rozpoczęcia mówienia innego użytkownika. Aby uniknąć pętli sprzężenia zwrotnego, OpenClaw ignoruje nowe przechwytywanie głosu podczas odtwarzania TTS.
- OpenClaw dodatkowo próbuje odzyskać odbiór głosu przez opuszczenie i ponowne dołączenie do sesji głosowej po powtarzających się niepowodzeniach deszyfrowania.
- `channels.discord.streaming` jest kanonicznym kluczem trybu strumienia. Discord domyślnie używa `streaming.mode: "progress"`, dzięki czemu postęp narzędzi/pracy pojawia się w jednej edytowanej wiadomości podglądu; ustaw `streaming.mode: "off"`, aby to wyłączyć. Starsze wartości `streamMode` i logiczne `streaming` pozostają aliasami środowiska uruchomieniowego; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- `channels.discord.autoPresence` mapuje dostępność środowiska uruchomieniowego na obecność bota (healthy => online, degraded => idle, exhausted => dnd) i pozwala na opcjonalne nadpisania tekstu statusu.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie po zmiennej nazwie/tagu (awaryjny tryb kompatybilności).
- `channels.discord.execApprovals`: natywne dla Discord dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie automatycznym zatwierdzenia exec aktywują się, gdy zatwierdzający mogą zostać ustaleni z `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discord uprawnionych do zatwierdzania żądań exec. Gdy pominięte, używa wartości zastępczej z `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub regex).
  - `target`: gdzie wysyłać monity o zatwierdzenie. `"dm"` (domyślnie) wysyła do DM zatwierdzających, `"channel"` wysyła do kanału źródłowego, `"both"` wysyła do obu. Gdy cel zawiera `"channel"`, przyciski mogą być używane tylko przez ustalonych zatwierdzających.
  - `cleanupAfterResolve`: gdy `true`, usuwa DM z zatwierdzeniami po zatwierdzeniu, odmowie lub przekroczeniu czasu.

**Tryby powiadomień o reakcjach:** `off` (brak), `own` (wiadomości bota, domyślnie), `all` (wszystkie wiadomości), `allowlist` (z `guilds.<id>.users` we wszystkich wiadomościach).

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
- SecretRef konta usługi jest również obsługiwany (`serviceAccountRef`).
- Wartości zastępcze env: `GOOGLE_CHAT_SERVICE_ACCOUNT` lub `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Użyj `spaces/<spaceId>` lub `users/<userId>` jako celów dostarczania.
- `channels.googlechat.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennego podmiotu e-mail (awaryjny tryb kompatybilności).

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
      unfurlLinks: false,
      unfurlMedia: false,
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

- **Tryb Socket** wymaga zarówno `botToken`, jak i `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` jako domyślny awaryjny env konta).
- **Tryb HTTP** wymaga `botToken` oraz `signingSecret` (na poziomie głównym lub dla konta).
- `socketMode` przekazuje dostrajanie transportu Slack SDK Socket Mode do publicznego API odbiornika Bolt. Używaj go tylko podczas badania timeoutów ping/pong lub zachowania nieaktualnego websocketu. `clientPingTimeout` ma domyślną wartość `15000`; `serverPingTimeout` i `pingPongLoggingEnabled` są przekazywane tylko wtedy, gdy są skonfigurowane.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują zwykły tekst
  lub obiekty SecretRef.
- Migawki kont Slack ujawniają pola źródła/statusu dla poszczególnych danych
  uwierzytelniających, takie jak `botTokenSource`, `botTokenStatus`, `appTokenStatus`
  oraz, w trybie HTTP, `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest
  skonfigurowane przez SecretRef, ale bieżąca ścieżka polecenia/runtime nie mogła
  rozwiązać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Slack.
- Opcjonalne `channels.slack.defaultAccount` zastępuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- `channels.slack.streaming.mode` jest kanonicznym kluczem trybu strumienia Slack. `channels.slack.streaming.nativeTransport` kontroluje natywny transport strumieniowania Slack. Starsze wartości `streamMode`, logiczne `streaming` i `nativeStreaming` pozostają aliasami runtime; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- `unfurlLinks` i `unfurlMedia` przekazują wartości logiczne rozwijania linków i mediów z `chat.postMessage` Slack dla odpowiedzi bota. `unfurlLinks` ma domyślną wartość `false`, aby wychodzące linki bota nie rozwijały się inline, chyba że zostanie to włączone; `unfurlMedia` jest pomijane, chyba że jest skonfigurowane. Ustaw dowolną z tych wartości w `channels.slack.accounts.<accountId>`, aby zastąpić wartość najwyższego poziomu dla jednego konta.
- Użyj `user:<id>` (DM) lub `channel:<id>` jako celów dostarczania.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji wątku:** `thread.historyScope` działa dla wątku (domyślnie) albo jest współdzielone w kanale. `thread.inheritParent` kopiuje transkrypt kanału nadrzędnego do nowych wątków.

- Natywne strumieniowanie Slack oraz status wątku w stylu asystenta Slack „pisze...” wymagają docelowego wątku odpowiedzi. DM-y najwyższego poziomu domyślnie pozostają poza wątkiem, więc nadal mogą strumieniować przez szkicowe podglądy publikowania i edycji Slack zamiast pokazywać podgląd natywnego strumienia/statusu w stylu wątku.
- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy odpowiedź jest uruchomiona, a następnie usuwa ją po zakończeniu. Użyj krótkiego kodu emoji Slack, takiego jak `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slack dostarczanie klienta zatwierdzeń i autoryzacja zatwierdzającego exec. Ten sam schemat co w Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slack), `agentFilter`, `sessionFilter` i `target` (`"dm"`, `"channel"` lub `"both"`). Zatwierdzenia Plugin mogą używać tej natywnej ścieżki klienta dla żądań pochodzących ze Slack, gdy zatwierdzający Plugin Slack zostaną rozwiązani; natywne dla Slack dostarczanie zatwierdzeń Plugin można także włączyć przez `approvals.plugin` dla sesji pochodzących ze Slack lub celów Slack. Zatwierdzenia Plugin używają zatwierdzających Plugin Slack z `allowFrom` i domyślnego routingu, a nie zatwierdzających exec.

| Grupa akcji | Domyślnie | Uwagi                  |
| ------------ | ------- | ---------------------- |
| reactions    | włączone | Reaguj + wyświetl reakcje |
| messages     | włączone | Czytaj/wysyłaj/edytuj/usuwaj |
| pins         | włączone | Przypnij/odepnij/wyświetl |
| memberInfo   | włączone | Informacje o członku |
| emojiList    | włączone | Lista niestandardowych emoji |

### Mattermost

Mattermost jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw. Starsze lub
niestandardowe kompilacje mogą zainstalować bieżący pakiet npm za pomocą
`openclaw plugins install @openclaw/mattermost`. Sprawdź
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
pod kątem bieżących dist-tagów przed przypięciem wersji.

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
- `commands.callbackUrl` musi wskazywać endpoint Gateway OpenClaw i być osiągalne z serwera Mattermost.
- Natywne wywołania zwrotne slash są uwierzytelniane tokenami dla poszczególnych poleceń zwracanymi
  przez Mattermost podczas rejestracji polecenia slash. Jeśli rejestracja się nie powiedzie lub żadne
  polecenia nie zostaną aktywowane, OpenClaw odrzuca wywołania zwrotne z komunikatem
  `Unauthorized: invalid command token.`
- Dla prywatnych/tailnet/internal hostów wywołań zwrotnych Mattermost może wymagać, aby
  `ServiceSettings.AllowedUntrustedInternalConnections` obejmowało host/domenę wywołania zwrotnego.
  Używaj wartości hosta/domeny, a nie pełnych adresów URL.
- `channels.mattermost.configWrites`: zezwól lub odmów zapisów konfiguracji inicjowanych przez Mattermost.
- `channels.mattermost.requireMention`: wymagaj `@mention` przed odpowiedzią w kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: nadpisanie bramkowania wzmianki dla kanału (`"*"` jako domyślne).
- Opcjonalne `channels.mattermost.defaultAccount` zastępuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.

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
- `channels.signal.configWrites`: zezwól lub odmów zapisów konfiguracji inicjowanych przez Signal.
- Opcjonalne `channels.signal.defaultAccount` zastępuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.

### iMessage

OpenClaw uruchamia `imsg rpc` (JSON-RPC przez stdio). Nie jest wymagany żaden daemon ani port. To preferowana ścieżka dla nowych konfiguracji iMessage OpenClaw, gdy host może przyznać uprawnienia do bazy danych Wiadomości i Automatyzacji.

Obsługa BlueBubbles została usunięta. `channels.bluebubbles` nie jest obsługiwaną powierzchnią konfiguracji runtime w bieżącym OpenClaw. Przenieś stare konfiguracje do `channels.imessage`; użyj [Usunięcie BlueBubbles i ścieżka imsg iMessage](/pl/announcements/bluebubbles-imessage) jako krótkiej wersji oraz [Przejście z BlueBubbles](/pl/channels/imessage-from-bluebubbles) jako pełnej tabeli tłumaczeń.

Jeśli Gateway nie działa na Macu zalogowanym w Wiadomościach, pozostaw `channels.imessage.enabled=true` i ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg "$@"` na tym Macu. Domyślna lokalna ścieżka `imsg` jest dostępna tylko na macOS.

Zanim zaczniesz polegać na wrapperze SSH przy wysyłkach produkcyjnych, zweryfikuj wychodzące `imsg send` przez dokładnie ten wrapper. Niektóre stany TCC macOS przypisują Automatyzację Wiadomości do `/usr/libexec/sshd-keygen-wrapper`, co może sprawić, że odczyty i próby działają, a wysyłki kończą się niepowodzeniem z AppleEvents `-1743`; zobacz [Wysyłki przez wrapper SSH kończą się niepowodzeniem z AppleEvents -1743](/pl/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- Opcjonalne `channels.imessage.defaultAccount` zastępuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.

- Wymaga pełnego dostępu do dysku dla bazy danych Wiadomości.
- Preferuj cele `chat_id:<id>`. Użyj `imsg chats --limit 20`, aby wyświetlić czaty.
- `cliPath` może wskazywać wrapper SSH; ustaw `remoteHost` (`host` lub `user@host`) do pobierania załączników przez SCP.
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają ścieżki załączników przychodzących (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa ścisłego sprawdzania klucza hosta, więc upewnij się, że klucz hosta przekaźnika już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwól lub odmów zapisów konfiguracji inicjowanych przez iMessage.
- `channels.imessage.sendTransport`: preferowany transport wysyłki RPC `imsg` dla zwykłych odpowiedzi wychodzących. `auto` (domyślnie) używa mostka IMCore dla istniejących czatów, gdy jest uruchomiony, a następnie przełącza się na AppleScript; `bridge` wymaga dostarczania przez prywatne API; `applescript` wymusza publiczną ścieżkę automatyzacji Wiadomości.
- `channels.imessage.actions.*`: włącz akcje prywatnego API, które są również bramkowane przez `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` jest domyślnie wyłączone; ustaw je na `true`, zanim zaczniesz oczekiwać mediów przychodzących w turach agenta.
- Odzyskiwanie wiadomości przychodzących po restarcie mostka/gateway jest automatyczne (deduplikacja GUID plus ograniczenie wieku nieaktualnego backlogu). Istniejące konfiguracje `channels.imessage.catchup.enabled: true` są nadal honorowane jako przestarzały profil zgodności.
- `channels.imessage.groups`: rejestr grup i ustawienia dla grup. Przy `groupPolicy: "allowlist"` skonfiguruj jawne klucze `chat_id` albo wpis wieloznaczny `"*"`, aby wiadomości grupowe mogły przejść przez bramkę rejestru.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje iMessage z trwałymi sesjami ACP. Użyj znormalizowanego uchwytu lub jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Wspólna semantyka pól: [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Przykład wrappera SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix działa z użyciem Plugin i jest konfigurowany w `channels.matrix`.

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
- `channels.matrix.proxy` kieruje ruch HTTP Matrix przez jawny proxy HTTP(S). Nazwane konta mogą go zastąpić za pomocą `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` zezwala na prywatne/wewnętrzne homeserwery. `proxy` i ta opcja sieciowa są niezależnymi mechanizmami kontroli.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach wielokontowych.
- `channels.matrix.autoJoin` domyślnie ma wartość `off`, więc zaproszone pokoje i nowe zaproszenia w stylu DM są ignorowane, dopóki nie ustawisz `autoJoin: "allowlist"` z `autoJoinAllowlist` albo `autoJoin: "always"`.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` albo `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzających można rozpoznać z `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`) uprawnione do zatwierdzania żądań exec.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub regex).
  - `target`: miejsce wysyłania monitów o zatwierdzenie. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) albo `"both"`.
  - Zastąpienia dla konta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kontroluje, jak DM-y Matrix są grupowane w sesje: `per-user` (domyślnie) współdzieli według trasowanego rozmówcy, a `per-room` izoluje każdy pokój DM.
- Sondy statusu Matrix i wyszukiwania w katalogu na żywo używają tej samej polityki proxy co ruch w czasie działania.
- Pełna konfiguracja Matrix, reguły kierowania i przykłady konfiguracji są udokumentowane w [Matrix](/pl/channels/matrix).

### Microsoft Teams

Microsoft Teams jest obsługiwany przez Plugin i konfigurowany pod `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, zasady zespołów/kanałów:
      // see /channels/msteams
    },
  },
}
```

- Główne ścieżki kluczy opisane tutaj: `channels.msteams`, `channels.msteams.configWrites`.
- Pełna konfiguracja Teams (poświadczenia, webhook, polityka DM/grup, zastąpienia dla zespołów/kanałów) jest udokumentowana w [Microsoft Teams](/pl/channels/msteams).

### IRC

IRC jest obsługiwany przez Plugin i konfigurowany pod `channels.irc`.

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

- Główne ścieżki kluczy opisane tutaj: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Opcjonalne `channels.irc.defaultAccount` zastępuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Pełna konfiguracja kanału IRC (host/port/TLS/kanały/listy dozwolonych/bramkowanie wzmianek) jest udokumentowana w [IRC](/pl/channels/irc).

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
- Tokeny env dotyczą tylko konta **default**.
- Podstawowe ustawienia kanału dotyczą wszystkich kont, chyba że zostaną zastąpione dla danego konta.
- Użyj `bindings[].match.accountId`, aby kierować każde konto do innego agenta.
- Jeśli dodasz konto inne niż domyślne przez `openclaw channels add` (albo onboarding kanału), mając nadal jednokontową konfigurację kanału najwyższego poziomu, OpenClaw najpierw promuje jednokontowe wartości najwyższego poziomu o zakresie konta do mapy kont kanału, aby pierwotne konto nadal działało. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.
- Istniejące powiązania tylko kanału (bez `accountId`) nadal pasują do konta domyślnego; powiązania o zakresie konta pozostają opcjonalne.
- `openclaw doctor --fix` naprawia także mieszane kształty, przenosząc jednokontowe wartości najwyższego poziomu o zakresie konta do wypromowanego konta wybranego dla tego kanału. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.

### Inne kanały Plugin

Wiele kanałów Plugin jest konfigurowanych jako `channels.<id>` i udokumentowanych na dedykowanych stronach kanałów (na przykład Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat i Twitch).
Zobacz pełny indeks kanałów: [Kanały](/pl/channels).

### Bramkowanie wzmianek na czacie grupowym

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianki w metadanych lub bezpiecznych wzorców regex). Dotyczy to czatów grupowych WhatsApp, Telegram, Discord, Google Chat i iMessage.

Widoczne odpowiedzi są kontrolowane osobno. Normalne żądania bezpośrednie grupy, kanału i wewnętrznego WebChat domyślnie używają automatycznego dostarczania końcowego: końcowy tekst asystenta jest publikowany przez starszą ścieżkę widocznej odpowiedzi. Włącz `messages.visibleReplies: "message_tool"` lub `messages.groupChat.visibleReplies: "message_tool"`, gdy widoczne wyjście ma być publikowane dopiero po wywołaniu przez agenta `message(action=send)`. Jeśli model zwróci końcowy tekst bez wywołania narzędzia wiadomości w trybie tylko narzędzi, ten końcowy tekst pozostanie prywatny, a szczegółowy dziennik Gateway zapisze metadane wstrzymanego ładunku.

Widoczne odpowiedzi tylko przez narzędzie wymagają modelu/środowiska uruchomieniowego, które niezawodnie wywołuje narzędzia, i są zalecane dla współdzielonych pokojów otoczenia na modelach najnowszej generacji, takich jak GPT 5.5. Niektóre słabsze modele potrafią odpowiedzieć tekstem końcowym, ale nie rozumieją, że wyjście widoczne dla źródła musi zostać wysłane przez `message(action=send)`. Dla tych modeli użyj `"automatic"`, aby końcowa tura asystenta była ścieżką widocznej odpowiedzi. Jeśli dziennik sesji pokazuje tekst asystenta z `didSendViaMessagingTool: false`, model wygenerował prywatny tekst końcowy zamiast wywołać narzędzie wiadomości. Przełącz na silniejszy model wywołujący narzędzia dla tego kanału, sprawdź szczegółowy dziennik Gateway pod kątem podsumowania wstrzymanego ładunku albo ustaw `messages.groupChat.visibleReplies: "automatic"`, aby używać widocznych odpowiedzi końcowych dla każdego żądania grupy/kanału.

Jeśli narzędzie wiadomości jest niedostępne w ramach aktywnej polityki narzędzi, OpenClaw wraca do automatycznych widocznych odpowiedzi zamiast po cichu wstrzymywać odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

Ta reguła dotyczy normalnego końcowego tekstu agenta. Powiązania konwersacji należące do Plugin używają odpowiedzi zwróconej przez właścicielski Plugin jako widocznej odpowiedzi dla przejętych tur powiązanego wątku; Plugin nie musi wywoływać `message(action=send)` dla tych odpowiedzi powiązań.

**Rozwiązywanie problemów: grupowa @wzmianka uruchamia pisanie, a potem cisza (bez błędu)**

Objaw: grupowa/kanałowa @wzmianka pokazuje wskaźnik pisania, a dziennik Gateway raportuje `dispatch complete (queuedFinal=false, replies=0)`, ale żadna wiadomość nie trafia do pokoju. DM-y do tego samego agenta odpowiadają normalnie.

Przyczyna: tryb widocznej odpowiedzi grupy/kanału rozwiązuje się do `"message_tool"`, więc OpenClaw wykonuje turę, ale wstrzymuje końcowy tekst asystenta, chyba że agent wywoła `message(action=send)`. W tym trybie nie ma kontraktu `NO_REPLY`; brak wywołania narzędzia wiadomości oznacza brak odpowiedzi źródłowej. Nie ma błędu, ponieważ wstrzymanie jest skonfigurowanym zachowaniem. Normalne tury grupy i kanału domyślnie używają `"automatic"`, więc ten objaw pojawia się tylko wtedy, gdy `messages.groupChat.visibleReplies` (albo globalne `messages.visibleReplies`) jest jawnie ustawione na `"message_tool"`. Harness `defaultVisibleReplies` nie ma tu zastosowania — resolver grupy/kanału go ignoruje; wpływa tylko na czaty bezpośrednie/źródłowe (harness Codex w ten sposób wstrzymuje finały czatu bezpośredniego).

Naprawa: wybierz silniejszy model wywołujący narzędzia, usuń jawne zastąpienie `"message_tool"`, aby wrócić do domyślnego `"automatic"`, albo ustaw `messages.groupChat.visibleReplies: "automatic"`, aby wymusić widoczne odpowiedzi dla każdego żądania grupy/kanału. Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku; uruchom Gateway ponownie tylko wtedy, gdy obserwowanie plików lub przeładowywanie konfiguracji jest wyłączone we wdrożeniu.

**Typy wzmianek:**

- **Wzmianki w metadanych**: natywne @wzmianki platformy. Ignorowane w trybie self-chat WhatsApp.
- **Wzorce tekstowe**: bezpieczne wzorce regex w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Bramkowanie wzmianek jest egzekwowane tylko wtedy, gdy wykrywanie jest możliwe (natywne wzmianki lub co najmniej jeden wzorzec).

```json5
{
  messages: {
    visibleReplies: "automatic", // wymuś stare automatyczne odpowiedzi końcowe dla czatów bezpośrednich/źródłowych
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // zawsze włączone niewspomniane pogawędki w pokoju stają się cichym kontekstem
      visibleReplies: "message_tool", // opt-in; wymagaj message(action=send) dla widocznych odpowiedzi w pokoju
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` ustawia globalną wartość domyślną. Kanały mogą ją zastąpić za pomocą `channels.<channel>.historyLimit` (albo dla konta). Ustaw `0`, aby wyłączyć.

`messages.groupChat.unmentionedInbound: "room_event"` przesyła niewspomniane, zawsze włączone wiadomości grupowe/kanałowe jako cichy kontekst pokoju w obsługiwanych kanałach. Wspomniane wiadomości, polecenia i wiadomości bezpośrednie pozostają żądaniami użytkownika. Zobacz [Zdarzenia pokoju otoczenia](/pl/channels/ambient-room-events), aby uzyskać kompletne przykłady Discord, Slack i Telegram.

`messages.visibleReplies` jest globalną wartością domyślną zdarzeń źródłowych; `messages.groupChat.visibleReplies` zastępuje ją dla zdarzeń źródłowych grupy/kanału. Gdy `messages.visibleReplies` nie jest ustawione, czaty bezpośrednie/źródłowe używają wybranego środowiska uruchomieniowego lub domyślnej wartości harnessu, ale wewnętrzne bezpośrednie tury WebChat używają automatycznego dostarczania końcowego dla parytetu monitów Pi/Codex. Ustaw `messages.visibleReplies: "message_tool"`, aby celowo wymagać `message(action=send)` dla widocznego wyjścia. Listy dozwolonych kanałów i bramkowanie wzmianek nadal decydują, czy zdarzenie jest przetwarzane.

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

Rozstrzyganie: zastąpienie dla DM → domyślna wartość dostawcy → brak limitu (wszystko zachowywane).

Obsługiwane: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Tryb self-chat

Uwzględnij własny numer w `allowFrom`, aby włączyć tryb self-chat (ignoruje natywne @wzmianki, odpowiada tylko na wzorce tekstowe):

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
    native: "auto", // rejestruj natywne polecenia, gdy są obsługiwane
    nativeSkills: "auto", // rejestruj natywne polecenia Skills, gdy są obsługiwane
    text: true, // analizuj /commands w wiadomościach czatu
    bash: false, // zezwól na ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // zezwól na /config
    mcp: false, // zezwól na /mcp
    plugins: false, // zezwól na /plugins
    debug: false, // zezwól na /debug
    restart: true, // zezwól na /restart + narzędzie restartu Gateway
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

- Ten blok konfiguruje powierzchnie poleceń. Aktualny wbudowany i dołączony katalog poleceń znajdziesz w [Poleceniach slash](/pl/tools/slash-commands).
- Ta strona jest **dokumentacją kluczy konfiguracji**, a nie pełnym katalogiem poleceń. Polecenia należące do kanałów/Plugin, takie jak QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, parowanie urządzeń `/pair`, pamięć `/dreaming`, sterowanie telefonem `/phone` oraz Talk `/voice`, są udokumentowane na stronach ich kanałów/Plugin oraz w [Poleceniach slash](/pl/tools/slash-commands).
- Polecenia tekstowe muszą być **samodzielnymi** wiadomościami z początkowym `/`.
- `native: "auto"` włącza polecenia natywne dla Discord/Telegram, pozostawia Slack wyłączony.
- `nativeSkills: "auto"` włącza natywne polecenia Skills dla Discord/Telegram, pozostawia Slack wyłączony.
- Nadpisanie dla kanału: `channels.discord.commands.native` (bool lub `"auto"`). W przypadku Discord `false` pomija rejestrację i czyszczenie poleceń natywnych podczas uruchamiania.
- Nadpisz rejestrację natywnych Skills dla kanału za pomocą `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` dodaje dodatkowe wpisy menu bota Telegram.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` oraz nadawcy w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczytuje/zapisuje `openclaw.json`). W przypadku klientów gateway `chat.send` trwałe zapisy `/config set|unset` wymagają również `operator.admin`; tylko do odczytu `/config show` pozostaje dostępne dla zwykłych klientów operatora z zakresem zapisu.
- `mcp: true` włącza `/mcp` dla konfiguracji serwera MCP zarządzanej przez OpenClaw w `mcp.servers`.
- `plugins: true` włącza `/plugins` do wykrywania Plugin, instalacji oraz kontroli włączania/wyłączania.
- `channels.<provider>.configWrites` ogranicza mutacje konfiguracji dla kanału (domyślnie: true).
- W przypadku kanałów z wieloma kontami `channels.<provider>.accounts.<id>.configWrites` również ogranicza zapisy skierowane do tego konta (na przykład `/allowlist --config --account <id>` lub `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` wyłącza `/restart` oraz akcje narzędzi restartu gateway. Domyślnie: `true`.
- `ownerAllowFrom` to jawna lista dozwolonych właścicieli dla poleceń tylko dla właściciela oraz akcji kanałów ograniczonych do właściciela. Jest oddzielna od `allowFrom`.
- `ownerDisplay: "hash"` haszuje identyfikatory właścicieli w prompcie systemowym. Ustaw `ownerDisplaySecret`, aby kontrolować haszowanie.
- `allowFrom` jest konfigurowane per dostawca. Gdy jest ustawione, jest **jedynym** źródłem autoryzacji (listy dozwolonych kanałów/parowanie i `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala poleceniom ominąć polityki grup dostępu, gdy `allowFrom` nie jest ustawione.
- Mapa dokumentacji poleceń:
  - wbudowany i dołączony katalog: [Polecenia slash](/pl/tools/slash-commands)
  - powierzchnie poleceń specyficzne dla kanałów: [Kanały](/pl/channels)
  - polecenia QQ Bot: [QQ Bot](/pl/channels/qqbot)
  - polecenia parowania: [Parowanie](/pl/channels/pairing)
  - polecenie karty LINE: [LINE](/pl/channels/line)
  - memory dreaming: [Dreaming](/pl/concepts/dreaming)

</Accordion>

---

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — klucze najwyższego poziomu
- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Przegląd kanałów](/pl/channels)
