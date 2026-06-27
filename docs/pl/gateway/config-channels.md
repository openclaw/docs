---
read_when:
    - Konfigurowanie Pluginu kanału (uwierzytelnianie, kontrola dostępu, wiele kont)
    - Rozwiązywanie problemów z kluczami konfiguracji dla poszczególnych kanałów
    - Audytowanie zasad DM, zasad grupowych lub bramkowania wzmianek
summary: 'Konfiguracja kanałów: kontrola dostępu, parowanie, klucze dla poszczególnych kanałów w Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych'
title: Konfiguracja — kanały
x-i18n:
    generated_at: "2026-06-27T17:31:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

Klucze konfiguracji poszczególnych kanałów w `channels.*`. Obejmuje dostęp do DM i grup,
konfiguracje z wieloma kontami, bramkowanie wzmiankami oraz klucze kanałów dla Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage i pozostałych dołączonych Pluginów kanałów.

Informacje o agentach, narzędziach, środowisku wykonawczym gateway i innych kluczach najwyższego poziomu znajdziesz w
[Dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że ustawiono `enabled: false`).

### Dostęp do DM i grup

Wszystkie kanały obsługują zasady DM i zasady grup:

| Zasada DM           | Zachowanie                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (domyślna) | Nieznani nadawcy otrzymują jednorazowy kod parowania; właściciel musi zatwierdzić |
| `allowlist`         | Tylko nadawcy w `allowFrom` (lub w sparowanym magazynie zezwoleń)             |
| `open`              | Zezwalaj na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)             |
| `disabled`          | Ignoruj wszystkie przychodzące DM                                          |

| Zasada grup          | Zachowanie                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (domyślna) | Tylko grupy pasujące do skonfigurowanej listy dozwolonych          |
| `open`                | Pomijaj listy dozwolonych grup (bramkowanie wzmiankami nadal obowiązuje) |
| `disabled`            | Blokuj wszystkie wiadomości z grup/pokoi                          |

<Note>
`channels.defaults.groupPolicy` ustawia wartość domyślną, gdy `groupPolicy` dostawcy nie jest ustawione.
Kody parowania wygasają po 1 godzinie. Oczekujące żądania parowania DM są ograniczone do **3 na kanał**.
Jeśli blok dostawcy całkowicie nie istnieje (brak `channels.<provider>`), zasada grup środowiska wykonawczego wraca do `allowlist` (fail-closed) z ostrzeżeniem przy uruchamianiu.
</Note>

### Nadpisania modelu kanału

Użyj `channels.modelByChannel`, aby przypiąć konkretne identyfikatory kanałów lub rozmówców w wiadomościach bezpośrednich do modelu. Wartości przyjmują format `provider/model` lub skonfigurowane aliasy modeli. Mapowanie kanałów jest stosowane, gdy sesja nie ma już nadpisania modelu (na przykład ustawionego przez `/model`).

Dla rozmów grupowych/wątków kluczami są identyfikatory grup specyficzne dla kanału, identyfikatory tematów lub nazwy kanałów. Dla rozmów w wiadomościach bezpośrednich (DM) kluczami są identyfikatory rozmówców pochodzące z tożsamości nadawcy kanału (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` lub `SenderId`). Dokładna postać klucza zależy od kanału:

| Kanał  | Postać klucza DM         | Przykład                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | surowy identyfikator użytkownika         | `123456789`                                  |
| Discord  | surowy identyfikator użytkownika         | `987654321`                                  |
| WhatsApp | numer telefonu lub JID | `15551234567`                                |
| Matrix   | identyfikator użytkownika Matrix      | `@user:matrix.org`                           |
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

Klucze specyficzne dla DM pasują tylko w rozmowach wiadomości bezpośrednich; nie wpływają na routing grup/wątków.

### Domyślne ustawienia kanałów i Heartbeat

Użyj `channels.defaults` dla współdzielonego zachowania zasad grup i Heartbeat między dostawcami:

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
- `channels.defaults.contextVisibility`: domyślny tryb widoczności dodatkowego kontekstu dla wszystkich kanałów. Wartości: `all` (domyślnie, uwzględnia cały kontekst cytatów/wątków/historii), `allowlist` (uwzględnia tylko kontekst od nadawców z listy dozwolonych), `allowlist_quote` (tak samo jak allowlist, ale zachowuje jawny kontekst cytatu/odpowiedzi). Nadpisanie dla kanału: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględniaj poprawne statusy kanałów w wyniku Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: uwzględniaj statusy zdegradowane/błędów w wyniku Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderuj zwarty wynik Heartbeat w stylu wskaźnika.

### WhatsApp

WhatsApp działa przez kanał web gateway (Baileys Web). Uruchamia się automatycznie, gdy istnieje połączona sesja.

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

- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla DM i grup WhatsApp. Użyj bezpośredniego numeru E.164 lub JID grupy WhatsApp w `match.peer.id`. Semantyka pól jest współdzielona w [Agentach ACP](/pl/tools/acp-agents#persistent-channel-bindings).

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
- Opcjonalne `channels.whatsapp.defaultAccount` nadpisuje ten zapasowy domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Starszy katalog uwierzytelniania Baileys dla pojedynczego konta jest migrowany przez `openclaw doctor` do `whatsapp/default`.
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

- Token bota: `channels.telegram.botToken` lub `channels.telegram.tokenFile` (tylko zwykły plik; dowiązania symboliczne są odrzucane), z `TELEGRAM_BOT_TOKEN` jako wartością zapasową dla konta domyślnego.
- `apiRoot` to wyłącznie root Telegram Bot API. Użyj `https://api.telegram.org` albo własnego hostowanego/proxy root, nie `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` usuwa przypadkowy końcowy sufiks `/bot<TOKEN>`.
- Opcjonalne `channels.telegram.defaultAccount` nadpisuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- W konfiguracjach z wieloma kontami (2+ identyfikatory kont) ustaw jawne konto domyślne (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć routingu zapasowego; `openclaw doctor` ostrzega, gdy tego brakuje lub jest nieprawidłowe.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Telegram (migracje identyfikatorów supergrup, `/config set|unset`).
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla tematów forum (użyj kanonicznego `chatId:topic:topicId` w `match.peer.id`). Semantyka pól jest współdzielona w [Agentach ACP](/pl/tools/acp-agents#persistent-channel-bindings).
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

- Token: `channels.discord.token`, z `DISCORD_BOT_TOKEN` jako wartością zapasową dla konta domyślnego.
- Bezpośrednie połączenia wychodzące, które podają jawny `token` Discord, używają tego tokena dla wywołania; ustawienia ponawiania i zasad konta nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
- Opcjonalne `channels.discord.defaultAccount` zastępuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Użyj `user:<id>` (DM) lub `channel:<id>` (kanał gildii) jako celów dostarczania; same identyfikatory numeryczne są odrzucane.
- Slugi gildii są pisane małymi literami, a spacje są zastępowane przez `-`; klucze kanałów używają nazwy w formie sluga (bez `#`). Preferuj identyfikatory gildii.
- Wiadomości utworzone przez boty są domyślnie ignorowane. `allowBots: true` je włącza; użyj `allowBots: "mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal są filtrowane).
- Kanały obsługujące przychodzące wiadomości utworzone przez boty mogą używać współdzielonej [ochrony przed pętlą bota](/pl/channels/bot-loop-protection). Ustaw `channels.defaults.botLoopProtection` dla bazowych budżetów par, a następnie nadpisuj kanał lub konto tylko wtedy, gdy jedna powierzchnia wymaga innych limitów.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz nadpisania kanałów) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyłączeniem @everyone/@here).
- `channels.discord.mentionAliases` mapuje stabilny wychodzący tekst `@handle` na identyfikatory użytkowników Discord przed wysłaniem, dzięki czemu znani członkowie zespołu mogą być wspominani deterministycznie nawet wtedy, gdy tymczasowa pamięć podręczna katalogu jest pusta. Nadpisania dla poszczególnych kont znajdują się w `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (domyślnie 17) dzieli wysokie wiadomości nawet wtedy, gdy mają mniej niż 2000 znaków.
- `channels.discord.suppressEmbeds` ma domyślnie wartość `true`, więc wychodzące adresy URL nie rozwijają się w podglądy linków Discord, chyba że to wyłączysz. Jawne ładunki `embeds` nadal są wysyłane normalnie; wywołania narzędzi dla poszczególnych wiadomości mogą nadpisać to za pomocą `suppressEmbeds`.
- `channels.discord.threadBindings` kontroluje trasowanie Discord powiązane z wątkami:
  - `enabled`: nadpisanie Discord dla funkcji sesji powiązanych z wątkami (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane dostarczanie/trasowanie)
  - `idleHours`: nadpisanie Discord dla automatycznego cofania fokusu po braku aktywności w godzinach (`0` wyłącza)
  - `maxAgeHours`: nadpisanie Discord dla twardego maksymalnego wieku w godzinach (`0` wyłącza)
  - `spawnSessions`: przełącznik dla `sessions_spawn({ thread: true })` oraz automatycznego tworzenia/powiązywania wątków ACP przy uruchamianiu wątku (domyślnie: `true`)
  - `defaultSpawnContext`: natywny kontekst subagenta dla uruchomień powiązanych z wątkiem (domyślnie `"fork"`)
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (użyj identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest współdzielona w [Agentach ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu dla kontenerów komponentów Discord v2.
- `channels.discord.agentComponents.ttlMs` kontroluje, jak długo wysłane wywołania zwrotne komponentów Discord pozostają zarejestrowane. Wartość domyślna to `1800000` (30 minut), maksimum to `86400000` (24 godziny), a nadpisania dla poszczególnych kont znajdują się w `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Dłuższe wartości dłużej utrzymują użyteczność starych przycisków/list wyboru/formularzy, więc preferuj najkrótszy TTL pasujący do przepływu pracy.
- `channels.discord.voice` włącza rozmowy na kanałach głosowych Discord oraz opcjonalne nadpisania automatycznego dołączania + LLM + TTS. Konfiguracje Discord tylko tekstowe domyślnie pozostawiają głos wyłączony; ustaw `channels.discord.voice.enabled=true`, aby go włączyć.
- `channels.discord.voice.model` opcjonalnie nadpisuje model LLM używany dla odpowiedzi na kanałach głosowych Discord.
- `channels.discord.voice.daveEncryption` i `channels.discord.voice.decryptionFailureTolerance` są przekazywane do opcji DAVE `@discordjs/voice` (domyślnie `true` i `24`).
- `channels.discord.voice.connectTimeoutMs` kontroluje początkowe oczekiwanie Ready `@discordjs/voice` dla prób `/vc join` i automatycznego dołączania (domyślnie `30000`).
- `channels.discord.voice.reconnectGraceMs` kontroluje, ile czasu rozłączona sesja głosowa może potrzebować na wejście w sygnalizowanie ponownego połączenia, zanim OpenClaw ją zniszczy (domyślnie `15000`).
- Odtwarzanie głosu Discord nie jest przerywane przez zdarzenie rozpoczęcia mówienia przez innego użytkownika. Aby uniknąć pętli sprzężenia zwrotnego, OpenClaw ignoruje nowe przechwytywanie głosu podczas odtwarzania TTS.
- OpenClaw dodatkowo próbuje odzyskać odbiór głosu przez opuszczenie i ponowne dołączenie do sesji głosowej po powtarzających się błędach odszyfrowywania.
- `channels.discord.streaming` jest kanonicznym kluczem trybu strumienia. Discord domyślnie używa `streaming.mode: "progress"`, więc postęp narzędzi/pracy pojawia się w jednej edytowanej wiadomości podglądu; ustaw `streaming.mode: "off"`, aby to wyłączyć. Starsze wartości `streamMode` oraz logiczne wartości `streaming` pozostają aliasami środowiska uruchomieniowego; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- `channels.discord.autoPresence` mapuje dostępność środowiska uruchomieniowego na obecność bota (healthy => online, degraded => idle, exhausted => dnd) i pozwala na opcjonalne nadpisania tekstu statusu.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennych nazw/tagów (awaryjny tryb zgodności).
- `channels.discord.execApprovals`: natywne dla Discord dostarczanie zatwierdzeń wykonania oraz autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie automatycznym zatwierdzenia wykonania aktywują się, gdy zatwierdzających można rozpoznać z `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discord uprawnionych do zatwierdzania żądań wykonania. W razie pominięcia używa awaryjnie `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub wyrażenie regularne).
  - `target`: miejsce wysyłania monitów zatwierdzenia. `"dm"` (domyślnie) wysyła do DM zatwierdzających, `"channel"` wysyła do kanału źródłowego, `"both"` wysyła do obu. Gdy cel zawiera `"channel"`, przycisków mogą używać tylko rozpoznani zatwierdzający.
  - `cleanupAfterResolve`: gdy `true`, usuwa DM z zatwierdzeniami po zatwierdzeniu, odmowie lub przekroczeniu limitu czasu.

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
- Obsługiwany jest również SecretRef konta usługi (`serviceAccountRef`).
- Wartości zapasowe środowiska: `GOOGLE_CHAT_SERVICE_ACCOUNT` lub `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Użyj `spaces/<spaceId>` lub `users/<userId>` jako celów dostarczania.
- `channels.googlechat.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennych głównych adresów e-mail (awaryjny tryb zgodności).

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

- **Tryb Socket** wymaga zarówno `botToken`, jak i `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` jako fallback env dla domyślnego konta).
- **Tryb HTTP** wymaga `botToken` oraz `signingSecret` (w katalogu głównym albo dla konkretnego konta).
- `socketMode` przekazuje strojenie transportu Slack SDK Socket Mode do publicznego API odbiornika Bolt. Używaj go tylko podczas diagnozowania timeoutów ping/pong albo nieaktualnego zachowania websocketu. `clientPingTimeout` domyślnie ma wartość `15000`; `serverPingTimeout` i `pingPongLoggingEnabled` są przekazywane tylko wtedy, gdy są skonfigurowane.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują zwykłe
  ciągi tekstowe albo obiekty SecretRef.
- Migawki kont Slack ujawniają pola źródła/statusu dla poszczególnych poświadczeń, takie jak
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` oraz, w trybie HTTP,
  `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest
  skonfigurowane przez SecretRef, ale bieżąca ścieżka polecenia/runtime nie mogła
  rozwiązać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Slack.
- Opcjonalne `channels.slack.defaultAccount` zastępuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- `channels.slack.streaming.mode` jest kanonicznym kluczem trybu strumieniowania Slack. `channels.slack.streaming.nativeTransport` kontroluje natywny transport strumieniowania Slack. Starsze wartości `streamMode`, logiczne `streaming` i `nativeStreaming` pozostają aliasami runtime; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- `unfurlLinks` i `unfurlMedia` przekazują wartości logiczne rozwijania linków i multimediów Slack `chat.postMessage` dla odpowiedzi bota. `unfurlLinks` domyślnie ma wartość `false`, więc linki wychodzące bota nie rozwijają się inline, chyba że zostaną włączone; `unfurlMedia` jest pomijane, chyba że zostanie skonfigurowane. Ustaw dowolną z tych wartości w `channels.slack.accounts.<accountId>`, aby zastąpić wartość najwyższego poziomu dla jednego konta.
- Użyj `user:<id>` (DM) albo `channel:<id>` jako celów dostarczania.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji wątków:** `thread.historyScope` działa per wątek (domyślnie) albo jest współdzielone w kanale. `thread.inheritParent` kopiuje transkrypcję kanału nadrzędnego do nowych wątków.

- Natywne strumieniowanie Slack oraz status wątku w stylu asystenta Slack „pisze...” wymagają celu wątku odpowiedzi. DM-y najwyższego poziomu domyślnie pozostają poza wątkiem, więc nadal mogą strumieniować przez podglądy wersji roboczej Slack typu opublikuj-i-edytuj zamiast pokazywać podgląd natywnego strumienia/statusu w stylu wątku.
- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy odpowiedź jest uruchomiona, a następnie usuwa ją po zakończeniu. Użyj shortcode emoji Slack, takiego jak `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slack dostarczanie klienta zatwierdzeń i autoryzacja zatwierdzających exec. Ten sam schemat co Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slack), `agentFilter`, `sessionFilter` i `target` (`"dm"`, `"channel"` albo `"both"`). Zatwierdzenia Plugin mogą używać tej natywnej ścieżki klienta dla żądań pochodzących ze Slack, gdy zatwierdzający Plugin Slack zostaną rozwiązani; natywne dla Slack dostarczanie zatwierdzeń Plugin może być także włączone przez `approvals.plugin` dla sesji pochodzących ze Slack albo celów Slack. Zatwierdzenia Plugin używają zatwierdzających Plugin Slack z `allowFrom` i domyślnego routingu, a nie zatwierdzających exec.

| Grupa akcji | Domyślnie | Uwagi                  |
| ------------ | ------- | ---------------------- |
| reactions    | włączone | Reaguj + wyświetl reakcje |
| messages     | włączone | Odczyt/wysyłanie/edycja/usuwanie  |
| pins         | włączone | Przypnij/odepnij/wyświetl         |
| memberInfo   | włączone | Informacje o członku            |
| emojiList    | włączone | Lista niestandardowych emoji      |

### Mattermost

Mattermost jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw. Starsze albo
niestandardowe buildy mogą zainstalować bieżący pakiet npm za pomocą
`openclaw plugins install @openclaw/mattermost`. Przed przypięciem wersji sprawdź
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
pod kątem bieżących dist-tags.

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

- `commands.callbackPath` musi być ścieżką (na przykład `/api/channels/mattermost/command`), a nie pełnym URL-em.
- `commands.callbackUrl` musi wskazywać endpoint Gateway OpenClaw i być osiągalne z serwera Mattermost.
- Natywne wywołania zwrotne slash są uwierzytelniane tokenami dla poszczególnych poleceń zwracanymi
  przez Mattermost podczas rejestracji polecenia slash. Jeśli rejestracja się nie powiedzie albo żadne
  polecenia nie zostaną aktywowane, OpenClaw odrzuca wywołania zwrotne komunikatem
  `Unauthorized: invalid command token.`
- W przypadku prywatnych/tailnet/wewnętrznych hostów wywołań zwrotnych Mattermost może wymagać,
  aby `ServiceSettings.AllowedUntrustedInternalConnections` obejmowało host/domenę wywołania zwrotnego.
  Używaj wartości hosta/domeny, a nie pełnych URL-i.
- `channels.mattermost.configWrites`: zezwól na zapisy konfiguracji inicjowane przez Mattermost albo ich odmów.
- `channels.mattermost.requireMention`: wymagaj `@mention` przed odpowiedzią w kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: nadpisanie bramkowania wzmianką dla kanału (`"*"` jako domyślne).
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

- `channels.signal.account`: przypnij uruchomienie kanału do konkretnej tożsamości konta Signal.
- `channels.signal.configWrites`: zezwól na zapisy konfiguracji inicjowane przez Signal albo ich odmów.
- Opcjonalne `channels.signal.defaultAccount` zastępuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.

### iMessage

OpenClaw uruchamia `imsg rpc` (JSON-RPC przez stdio). Nie jest wymagany daemon ani port. To preferowana ścieżka dla nowych konfiguracji iMessage w OpenClaw, gdy host może przyznać uprawnienia do bazy danych Messages i Automation.

Obsługa BlueBubbles została usunięta. `channels.bluebubbles` nie jest obsługiwaną powierzchnią konfiguracji runtime w bieżącym OpenClaw. Migruj stare konfiguracje do `channels.imessage`; użyj [Usunięcie BlueBubbles i ścieżka imsg iMessage](/pl/announcements/bluebubbles-imessage) jako krótkiej wersji oraz [Przejście z BlueBubbles](/pl/channels/imessage-from-bluebubbles) jako pełnej tabeli tłumaczeń.

Jeśli Gateway nie działa na Macu zalogowanym do Messages, pozostaw `channels.imessage.enabled=true` i ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg "$@"` na tym Macu. Domyślna lokalna ścieżka `imsg` działa tylko w macOS.

Przed poleganiem na wrapperze SSH przy wysyłkach produkcyjnych zweryfikuj wychodzące `imsg send` przez dokładnie ten wrapper. Niektóre stany TCC macOS przypisują Messages Automation do `/usr/libexec/sshd-keygen-wrapper`, co może sprawiać, że odczyty i sondy działają, a wysyłki kończą się błędem AppleEvents `-1743`; zobacz [Wysyłki przez wrapper SSH kończą się błędem AppleEvents -1743](/pl/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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

- Wymaga Full Disk Access do bazy danych Messages.
- Preferuj cele `chat_id:<id>`. Użyj `imsg chats --limit 20`, aby wyświetlić listę czatów.
- `cliPath` może wskazywać wrapper SSH; ustaw `remoteHost` (`host` albo `user@host`) do pobierania załączników przez SCP.
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają ścieżki załączników przychodzących (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa ścisłego sprawdzania kluczy hosta, więc upewnij się, że klucz hosta przekaźnika już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwól na zapisy konfiguracji inicjowane przez iMessage albo ich odmów.
- `channels.imessage.sendTransport`: preferowany transport wysyłania RPC `imsg` dla zwykłych odpowiedzi wychodzących. `auto` (domyślnie) używa mostu IMCore dla istniejących czatów, gdy jest uruchomiony, a następnie przechodzi na AppleScript; `bridge` wymaga dostarczania przez prywatne API; `applescript` wymusza publiczną ścieżkę automatyzacji Messages.
- `channels.imessage.actions.*`: włącz akcje prywatnego API, które są także bramkowane przez `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` jest domyślnie wyłączone; ustaw je na `true`, zanim zaczniesz oczekiwać przychodzących multimediów w turach agenta.
- Odzyskiwanie przychodzące po restarcie mostu/Gateway jest automatyczne (deduplikacja GUID plus ograniczenie wieku nieaktualnego backlogu). Istniejące konfiguracje `channels.imessage.catchup.enabled: true` są nadal honorowane jako przestarzały profil zgodności.
- `channels.imessage.groups`: rejestr grup i ustawienia per grupa. Przy `groupPolicy: "allowlist"` skonfiguruj jawne klucze `chat_id` albo wpis wieloznaczny `"*"`, aby wiadomości grupowe mogły przejść przez bramkę rejestru.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje iMessage z trwałymi sesjami ACP. Użyj znormalizowanego uchwytu albo jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Wspólna semantyka pól: [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Przykład wrappera SSH dla iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix jest wspierany przez Plugin i konfigurowany w `channels.matrix`.

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
- `channels.matrix.proxy` kieruje ruch HTTP Matrix przez jawny serwer proxy HTTP(S). Nazwane konta mogą go nadpisać przez `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` zezwala na prywatne/wewnętrzne homeserwery. `proxy` i ta zgoda sieciowa są niezależnymi kontrolkami.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach z wieloma kontami.
- `channels.matrix.autoJoin` domyślnie ma wartość `off`, więc zaproszone pokoje i nowe zaproszenia w stylu DM są ignorowane, dopóki nie ustawisz `autoJoin: "allowlist"` z `autoJoinAllowlist` albo `autoJoin: "always"`.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` albo `"auto"` (domyślnie). W trybie automatycznym zatwierdzenia exec aktywują się, gdy zatwierdzających da się rozpoznać z `approvers` albo `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`), którym wolno zatwierdzać żądania exec.
  - `agentFilter`: opcjonalna allowlista identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg albo wyrażenie regularne).
  - `target`: gdzie wysyłać monity o zatwierdzenie. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) albo `"both"`.
  - Nadpisania dla poszczególnych kont: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kontroluje, jak DM-y Matrix są grupowane w sesje: `per-user` (domyślnie) współdzieli według routowanego rozmówcy, a `per-room` izoluje każdy pokój DM.
- Próby statusu Matrix i dynamiczne wyszukiwania katalogowe używają tej samej polityki proxy co ruch wykonywania.
- Pełna konfiguracja Matrix, reguły kierowania i przykłady konfiguracji są udokumentowane w [Matrix](/pl/channels/matrix).

### Microsoft Teams

Microsoft Teams jest oparty na Plugin i konfigurowany pod `channels.msteams`.

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
- Pełna konfiguracja Teams (dane uwierzytelniające, webhook, polityka DM/grup, nadpisania dla zespołów/kanałów) jest udokumentowana w [Microsoft Teams](/pl/channels/msteams).

### IRC

IRC jest oparty na Plugin i konfigurowany pod `channels.irc`.

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
- Opcjonalne `channels.irc.defaultAccount` nadpisuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Pełna konfiguracja kanału IRC (host/port/TLS/kanały/allowlisty/bramkowanie wzmianek) jest udokumentowana w [IRC](/pl/channels/irc).

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
- Tokeny env dotyczą tylko konta **domyślnego**.
- Bazowe ustawienia kanału dotyczą wszystkich kont, chyba że zostaną nadpisane dla konkretnego konta.
- Użyj `bindings[].match.accountId`, aby kierować każde konto do innego agenta.
- Jeśli dodasz konto inne niż domyślne przez `openclaw channels add` (albo onboarding kanału), gdy nadal używasz jednokontowej konfiguracji kanału na najwyższym poziomie, OpenClaw najpierw promuje wartości jednokontowe najwyższego poziomu o zakresie konta do mapy kont kanału, aby oryginalne konto nadal działało. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.
- Istniejące powiązania obejmujące tylko kanał (bez `accountId`) nadal pasują do konta domyślnego; powiązania o zakresie konta pozostają opcjonalne.
- `openclaw doctor --fix` naprawia też mieszane kształty, przenosząc wartości jednokontowe najwyższego poziomu o zakresie konta do promowanego konta wybranego dla tego kanału. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.

### Inne kanały Plugin

Wiele kanałów Plugin jest konfigurowanych jako `channels.<id>` i udokumentowanych na dedykowanych stronach kanałów (na przykład Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat i Twitch).
Zobacz pełny indeks kanałów: [Kanały](/pl/channels).

### Bramkowanie wzmianek na czacie grupowym

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianki w metadanych albo bezpiecznych wzorców regex). Dotyczy czatów grupowych WhatsApp, Telegram, Discord, Google Chat i iMessage.

Widoczne odpowiedzi są kontrolowane osobno. Zwykłe żądania bezpośrednie grup, kanałów i wewnętrznego WebChat domyślnie używają automatycznego dostarczania końcowego: końcowy tekst asystenta jest publikowany przez starszą ścieżkę widocznej odpowiedzi. Włącz `messages.visibleReplies: "message_tool"` albo `messages.groupChat.visibleReplies: "message_tool"`, gdy widoczne wyjście ma być publikowane dopiero po wywołaniu przez agenta `message(action=send)`. Jeśli model zwróci końcowy tekst bez wywołania narzędzia wiadomości w wybranym trybie wyłącznie narzędziowym, ten końcowy tekst pozostaje prywatny, a szczegółowy dziennik gateway zapisuje metadane stłumionego payloadu.

Widoczne odpowiedzi wyłącznie przez narzędzie wymagają modelu/runtime, który niezawodnie wywołuje narzędzia, i są zalecane dla współdzielonych pokojów ambientowych na modelach najnowszej generacji, takich jak GPT 5.5. Niektóre słabsze modele potrafią odpowiedzieć tekstem końcowym, ale nie rozumieją, że wyjście widoczne dla źródła musi zostać wysłane przez `message(action=send)`. Dla tych modeli użyj `"automatic"`, aby końcowy zwrot asystenta był ścieżką widocznej odpowiedzi. Jeśli dziennik sesji pokazuje tekst asystenta z `didSendViaMessagingTool: false`, model wygenerował prywatny tekst końcowy zamiast wywołać narzędzie wiadomości. Przełącz ten kanał na silniejszy model wywołujący narzędzia, sprawdź szczegółowy dziennik gateway pod kątem podsumowania stłumionego payloadu albo ustaw `messages.groupChat.visibleReplies: "automatic"`, aby używać widocznych odpowiedzi końcowych dla każdego żądania grupy/kanału.

Jeśli narzędzie wiadomości jest niedostępne w aktywnej polityce narzędzi, OpenClaw wraca do automatycznych widocznych odpowiedzi zamiast po cichu tłumić odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

Ta reguła dotyczy zwykłego tekstu końcowego agenta. Powiązania konwersacji należące do Plugin używają odpowiedzi zwróconej przez właścicielski Plugin jako widocznej odpowiedzi dla przejętych zwrotów w powiązanym wątku; Plugin nie musi wywoływać `message(action=send)` dla tych odpowiedzi powiązań.

**Rozwiązywanie problemów: grupowa @wzmianka uruchamia pisanie, a potem ciszę (bez błędu)**

Objaw: grupowa/kanałowa @wzmianka pokazuje wskaźnik pisania, a dziennik gateway raportuje `dispatch complete (queuedFinal=false, replies=0)`, ale żadna wiadomość nie trafia do pokoju. DM-y do tego samego agenta odpowiadają normalnie.

Przyczyna: tryb widocznej odpowiedzi grupy/kanału rozwiązuje się do `"message_tool"`, więc OpenClaw uruchamia zwrot, ale tłumi końcowy tekst asystenta, chyba że agent wywoła `message(action=send)`. W tym trybie nie ma kontraktu `NO_REPLY`; brak wywołania narzędzia wiadomości oznacza brak odpowiedzi źródłowej. Nie ma błędu, ponieważ tłumienie jest skonfigurowanym zachowaniem. Zwykłe zwroty grup i kanałów domyślnie używają `"automatic"`, więc ten objaw pojawia się tylko wtedy, gdy `messages.groupChat.visibleReplies` (albo globalne `messages.visibleReplies`) jest jawnie ustawione na `"message_tool"`. Harness `defaultVisibleReplies` nie ma tu zastosowania — resolver grupy/kanału go ignoruje; wpływa tylko na czaty bezpośrednie/źródłowe (harness Codex tłumi w ten sposób końcowe odpowiedzi czatów bezpośrednich).

Poprawka: wybierz silniejszy model wywołujący narzędzia, usuń jawne nadpisanie `"message_tool"`, aby wrócić do domyślnego `"automatic"`, albo ustaw `messages.groupChat.visibleReplies: "automatic"`, aby wymusić widoczne odpowiedzi dla każdego żądania grupy/kanału. Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku; restartuj gateway tylko wtedy, gdy obserwowanie plików lub przeładowywanie konfiguracji jest wyłączone we wdrożeniu.

**Typy wzmianek:**

- **Wzmianki w metadanych**: natywne platformowe @-wzmianki. Ignorowane w trybie self-chat WhatsApp.
- **Wzorce tekstowe**: bezpieczne wzorce regex w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Bramkowanie wzmianek jest egzekwowane tylko wtedy, gdy wykrywanie jest możliwe (natywne wzmianki albo co najmniej jeden wzorzec).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` ustawia globalną wartość domyślną. Kanały mogą ją nadpisać przez `channels.<channel>.historyLimit` (albo dla konkretnego konta). Ustaw `0`, aby wyłączyć.

`messages.groupChat.unmentionedInbound: "room_event"` przesyła niewspomniane, zawsze aktywne wiadomości grupowe/kanałowe jako cichy kontekst pokoju na obsługiwanych kanałach. Wspomniane wiadomości, polecenia i wiadomości bezpośrednie pozostają żądaniami użytkownika. Zobacz [Ambientowe zdarzenia pokoju](/pl/channels/ambient-room-events), aby poznać kompletne przykłady Discord, Slack i Telegram.

`messages.visibleReplies` jest globalną wartością domyślną zdarzeń źródłowych; `messages.groupChat.visibleReplies` nadpisuje ją dla zdarzeń źródłowych grup/kanałów. Gdy `messages.visibleReplies` nie jest ustawione, czaty bezpośrednie/źródłowe używają wybranego domyślnego runtime albo harnessu, ale wewnętrzne bezpośrednie zwroty WebChat używają automatycznego dostarczania końcowego dla parytetu promptów Pi/Codex. Ustaw `messages.visibleReplies: "message_tool"`, aby celowo wymagać `message(action=send)` dla widocznego wyjścia. Allowlisty kanałów i bramkowanie wzmianek nadal decydują, czy zdarzenie jest przetwarzane.

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

Rozwiązanie: nadpisanie dla DM → domyślna wartość providera → brak limitu (wszystko zachowywane).

Obsługiwane: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Tryb self-chat

Umieść własny numer w `allowFrom`, aby włączyć tryb self-chat (ignoruje natywne @-wzmianki, odpowiada tylko na wzorce tekstowe):

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

- Ten blok konfiguruje powierzchnie poleceń. Aktualny wbudowany + dołączony katalog poleceń znajdziesz w [poleceniach ukośnikowych](/pl/tools/slash-commands).
- Ta strona jest **referencją kluczy konfiguracji**, a nie pełnym katalogiem poleceń. Polecenia należące do kanałów/Pluginów, takie jak QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, parowanie urządzeń `/pair`, pamięć `/dreaming`, sterowanie telefonem `/phone` oraz Talk `/voice`, są udokumentowane na stronach ich kanałów/Pluginów oraz w [poleceniach ukośnikowych](/pl/tools/slash-commands).
- Polecenia tekstowe muszą być **samodzielnymi** wiadomościami z początkowym `/`.
- `native: "auto"` włącza natywne polecenia dla Discord/Telegram, pozostawia Slack wyłączony.
- `nativeSkills: "auto"` włącza natywne polecenia Skills dla Discord/Telegram, pozostawia Slack wyłączony.
- Nadpisanie dla kanału: `channels.discord.commands.native` (bool lub `"auto"`). Dla Discord wartość `false` pomija rejestrację i czyszczenie natywnych poleceń podczas uruchamiania.
- Nadpisz rejestrację natywnych Skills dla kanału za pomocą `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` dodaje dodatkowe pozycje menu bota Telegram.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` oraz nadawcy w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczytuje/zapisuje `openclaw.json`). W przypadku klientów Gateway `chat.send` trwałe zapisy `/config set|unset` wymagają także `operator.admin`; tylko do odczytu `/config show` pozostaje dostępne dla zwykłych klientów operatora z zakresem zapisu.
- `mcp: true` włącza `/mcp` dla zarządzanej przez OpenClaw konfiguracji serwera MCP w `mcp.servers`.
- `plugins: true` włącza `/plugins` do wykrywania i instalowania Pluginów oraz sterowania ich włączaniem/wyłączaniem.
- `channels.<provider>.configWrites` bramkuje mutacje konfiguracji dla kanału (domyślnie: true).
- W przypadku kanałów z wieloma kontami `channels.<provider>.accounts.<id>.configWrites` bramkuje także zapisy skierowane do tego konta (na przykład `/allowlist --config --account <id>` lub `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` wyłącza `/restart` oraz akcje narzędzia restartu Gateway. Domyślnie: `true`.
- `ownerAllowFrom` to jawna lista dozwolonych właścicieli dla poleceń dostępnych tylko dla właściciela oraz akcji kanałów bramkowanych przez właściciela. Jest oddzielna od `allowFrom`.
- `ownerDisplay: "hash"` haszuje identyfikatory właścicieli w prompcie systemowym. Ustaw `ownerDisplaySecret`, aby kontrolować haszowanie.
- `allowFrom` jest określane dla każdego dostawcy. Gdy jest ustawione, jest **jedynym** źródłem autoryzacji (listy dozwolonych kanałów/parowanie i `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala poleceniom omijać polityki grup dostępu, gdy `allowFrom` nie jest ustawione.
- Mapa dokumentacji poleceń:
  - wbudowany + dołączony katalog: [polecenia ukośnikowe](/pl/tools/slash-commands)
  - powierzchnie poleceń specyficzne dla kanału: [Kanały](/pl/channels)
  - polecenia QQ Bot: [QQ Bot](/pl/channels/qqbot)
  - polecenia parowania: [Parowanie](/pl/channels/pairing)
  - polecenie karty LINE: [LINE](/pl/channels/line)
  - Dreaming pamięci: [Dreaming](/pl/concepts/dreaming)

</Accordion>

---

## Powiązane

- [Referencja konfiguracji](/pl/gateway/configuration-reference) — klucze najwyższego poziomu
- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Przegląd kanałów](/pl/channels)
