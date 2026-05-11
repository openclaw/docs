---
read_when:
    - Konfigurowanie Plugin dla kanału (uwierzytelnianie, kontrola dostępu, obsługa wielu kont)
    - Rozwiązywanie problemów z kluczami konfiguracji dla poszczególnych kanałów
    - Audytowanie zasad DM, zasad grup lub bramkowania wzmianek
summary: 'Konfiguracja kanałów: kontrola dostępu, parowanie, klucze dla poszczególnych kanałów w Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych'
title: Konfiguracja — kanały
x-i18n:
    generated_at: "2026-05-11T20:29:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4199725cdf1216f639ee1c02d5f510e1373edfecacf56977ac3a15d63f207f41
    source_path: gateway/config-channels.md
    workflow: 16
---

Klucze konfiguracji poszczególnych kanałów w `channels.*`. Obejmuje dostęp do DM i grup,
konfiguracje z wieloma kontami, bramkowanie wzmiankami oraz klucze poszczególnych kanałów dla Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage i innych dołączonych Plugin kanałów.

Informacje o agentach, narzędziach, środowisku uruchomieniowym Gateway i innych kluczach najwyższego poziomu znajdziesz w
[Dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że ustawiono `enabled: false`).

### Dostęp do DM i grup

Wszystkie kanały obsługują zasady DM i zasady grup:

| Zasada DM           | Zachowanie                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (domyślna) | Nieznani nadawcy otrzymują jednorazowy kod parowania; właściciel musi zatwierdzić |
| `allowlist`         | Tylko nadawcy w `allowFrom` (lub w sparowanym magazynie dozwolonych)             |
| `open`              | Zezwól na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`)             |
| `disabled`          | Ignoruj wszystkie przychodzące DM                                          |

| Zasada grup          | Zachowanie                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (domyślna) | Tylko grupy pasujące do skonfigurowanej listy dozwolonych          |
| `open`                | Pomijaj listy dozwolonych grup (bramkowanie wzmiankami nadal obowiązuje) |
| `disabled`            | Blokuj wszystkie wiadomości z grup/pokoi                          |

<Note>
`channels.defaults.groupPolicy` ustawia wartość domyślną, gdy `groupPolicy` dostawcy nie jest ustawione.
Kody parowania wygasają po 1 godzinie. Oczekujące żądania parowania DM są ograniczone do **3 na kanał**.
Jeśli całkowicie brakuje bloku dostawcy (`channels.<provider>` jest nieobecne), zasada grup w środowisku uruchomieniowym wraca do `allowlist` (fail-closed) z ostrzeżeniem przy uruchomieniu.
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

Użyj `channels.defaults` dla wspólnych zachowań zasad grup i Heartbeat u różnych dostawców:

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
- `channels.defaults.contextVisibility`: domyślny tryb widoczności kontekstu uzupełniającego dla wszystkich kanałów. Wartości: `all` (domyślna, uwzględnia cały cytowany/wątkowy/historyczny kontekst), `allowlist` (uwzględnia tylko kontekst od nadawców z listy dozwolonych), `allowlist_quote` (tak samo jak allowlist, ale zachowuje jawny kontekst cytatu/odpowiedzi). Nadpisanie dla kanału: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględniaj statusy zdrowych kanałów w wyniku Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: uwzględniaj statusy zdegradowane/błędu w wyniku Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderuj kompaktowy wynik Heartbeat w stylu wskaźnika.

### WhatsApp

WhatsApp działa przez webowy kanał Gateway (Baileys Web). Uruchamia się automatycznie, gdy istnieje połączona sesja.

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
- Opcjonalne `channels.whatsapp.defaultAccount` nadpisuje ten zastępczy domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Starszy katalog auth Baileys dla jednego konta jest migrowany przez `openclaw doctor` do `whatsapp/default`.
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

- Token bota: `channels.telegram.botToken` lub `channels.telegram.tokenFile` (tylko zwykły plik; symlinki odrzucane), z `TELEGRAM_BOT_TOKEN` jako wartością zastępczą dla domyślnego konta.
- `apiRoot` to tylko korzeń Telegram Bot API. Użyj `https://api.telegram.org` albo własnego korzenia self-hosted/proxy, nie `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` usuwa przypadkowy końcowy sufiks `/bot<TOKEN>`.
- Opcjonalne `channels.telegram.defaultAccount` nadpisuje domyślny wybór konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- W konfiguracjach z wieloma kontami (2+ identyfikatory kont) ustaw jawne konto domyślne (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć trasowania zastępczego; `openclaw doctor` ostrzega, gdy go brakuje lub jest nieprawidłowe.
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

- Token: `channels.discord.token`, z `DISCORD_BOT_TOKEN` jako fallbackiem dla konta domyślnego.
- Bezpośrednie wywołania wychodzące, które podają jawny Discord `token`, używają tego tokenu dla wywołania; ustawienia ponawiania/polityki konta nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
- Opcjonalne `channels.discord.defaultAccount` zastępuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Użyj `user:<id>` (DM) albo `channel:<id>` (kanał gildii) jako celów dostarczania; same identyfikatory numeryczne są odrzucane.
- Slugi gildii są pisane małymi literami, a spacje zastępuje się `-`; klucze kanałów używają nazwy w postaci sluga (bez `#`). Preferuj identyfikatory gildii.
- Wiadomości autorstwa bota są domyślnie ignorowane. `allowBots: true` je włącza; użyj `allowBots: "mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal są filtrowane).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz nadpisania kanałów) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyłączeniem @everyone/@here).
- `channels.discord.mentionAliases` mapuje stabilny wychodzący tekst `@handle` na identyfikatory użytkowników Discord przed wysłaniem, dzięki czemu znani członkowie zespołu mogą być wspominani deterministycznie nawet wtedy, gdy tymczasowa pamięć podręczna katalogu jest pusta. Nadpisania dla poszczególnych kont znajdują się pod `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (domyślnie 17) dzieli wysokie wiadomości nawet wtedy, gdy mają mniej niż 2000 znaków.
- `channels.discord.threadBindings` steruje routingiem powiązanym z wątkami Discord:
  - `enabled`: nadpisanie Discord dla funkcji sesji powiązanych z wątkiem (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane dostarczanie/routing)
  - `idleHours`: nadpisanie Discord dla automatycznego wycofania fokusu po bezczynności, w godzinach (`0` wyłącza)
  - `maxAgeHours`: nadpisanie Discord dla twardego maksymalnego wieku, w godzinach (`0` wyłącza)
  - `spawnSessions`: przełącznik dla `sessions_spawn({ thread: true })` oraz automatycznego tworzenia/powiązania wątku ACP thread-spawn (domyślnie: `true`)
  - `defaultSpawnContext`: natywny kontekst subagenta dla uruchomień powiązanych z wątkiem (domyślnie `"fork"`)
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (użyj identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest wspólna w [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu dla kontenerów komponentów Discord v2.
- `channels.discord.voice` włącza rozmowy w kanałach głosowych Discord oraz opcjonalne nadpisania automatycznego dołączania + LLM + TTS. Konfiguracje Discord wyłącznie tekstowe domyślnie pozostawiają głos wyłączony; ustaw `channels.discord.voice.enabled=true`, aby się włączyć.
- `channels.discord.voice.model` opcjonalnie nadpisuje model LLM używany do odpowiedzi w kanale głosowym Discord.
- `channels.discord.voice.daveEncryption` i `channels.discord.voice.decryptionFailureTolerance` są przekazywane do opcji DAVE `@discordjs/voice` (domyślnie `true` i `24`).
- `channels.discord.voice.connectTimeoutMs` kontroluje początkowe oczekiwanie Ready `@discordjs/voice` dla prób `/vc join` i automatycznego dołączania (domyślnie `30000`).
- `channels.discord.voice.reconnectGraceMs` kontroluje, ile czasu rozłączona sesja głosowa może mieć na wejście w sygnalizację ponownego połączenia, zanim OpenClaw ją zniszczy (domyślnie `15000`).
- Odtwarzanie głosu Discord nie jest przerywane przez zdarzenie rozpoczęcia mówienia innego użytkownika. Aby uniknąć pętli sprzężenia zwrotnego, OpenClaw ignoruje nowe przechwytywanie głosu podczas odtwarzania TTS.
- OpenClaw dodatkowo próbuje odzyskać odbiór głosu przez opuszczenie sesji głosowej i ponowne do niej dołączenie po powtarzających się błędach odszyfrowywania.
- `channels.discord.streaming` jest kanonicznym kluczem trybu strumienia. Discord domyślnie używa `streaming.mode: "progress"`, dzięki czemu postęp narzędzia/pracy pojawia się w jednej edytowanej wiadomości podglądu; ustaw `streaming.mode: "off"`, aby go wyłączyć. Starsze wartości `streamMode` oraz boolowskie `streaming` pozostają aliasami środowiska uruchomieniowego; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- `channels.discord.autoPresence` mapuje dostępność środowiska uruchomieniowego na obecność bota (healthy => online, degraded => idle, exhausted => dnd) i pozwala na opcjonalne nadpisania tekstu statusu.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie według zmiennej nazwy/tagu (tryb zgodności awaryjnej).
- `channels.discord.execApprovals`: natywne dla Discord dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` albo `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzających można rozpoznać z `approvers` albo `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discord uprawnionych do zatwierdzania żądań exec. Gdy pominięte, używa fallbacku do `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg albo regex).
  - `target`: gdzie wysyłać monity zatwierdzenia. `"dm"` (domyślnie) wysyła do DM zatwierdzających, `"channel"` wysyła do kanału źródłowego, `"both"` wysyła do obu. Gdy target obejmuje `"channel"`, przycisków mogą używać tylko rozpoznani zatwierdzający.
  - `cleanupAfterResolve`: gdy `true`, usuwa DM zatwierdzeń po zatwierdzeniu, odmowie albo przekroczeniu limitu czasu.

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

- JSON konta usługi: wbudowany (`serviceAccount`) albo oparty na pliku (`serviceAccountFile`).
- Obsługiwany jest również SecretRef konta usługi (`serviceAccountRef`).
- Fallbacki env: `GOOGLE_CHAT_SERVICE_ACCOUNT` albo `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Użyj `spaces/<spaceId>` albo `users/<userId>` jako celów dostarczania.
- `channels.googlechat.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie według zmiennego pryncypała e-mail (tryb zgodności awaryjnej).

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

- **Tryb Socket** wymaga zarówno `botToken`, jak i `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` dla fallbacku env konta domyślnego).
- **Tryb HTTP** wymaga `botToken` oraz `signingSecret` (na poziomie root albo dla konta).
- `socketMode` przekazuje strojenie transportu Slack SDK Socket Mode do publicznego API odbiornika Bolt. Używaj go tylko podczas badania limitów czasu ping/pong albo zachowania przestarzałego websocketu.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują zwykłe tekstowe
  ciągi znaków albo obiekty SecretRef.
- Migawki kont Slack ujawniają pola źródła/statusu dla poszczególnych poświadczeń, takie jak
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` oraz, w trybie HTTP,
  `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest
  skonfigurowane przez SecretRef, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego nie mogła
  rozpoznać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Slack.
- Opcjonalne `channels.slack.defaultAccount` zastępuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- `channels.slack.streaming.mode` jest kanonicznym kluczem trybu strumienia Slack. `channels.slack.streaming.nativeTransport` steruje natywnym transportem strumieniowym Slack. Starsze wartości `streamMode`, boolowskie `streaming` oraz `nativeStreaming` pozostają aliasami środowiska uruchomieniowego; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- `unfurlLinks` i `unfurlMedia` przekazują wartości boolowskie rozwijania linków i mediów `chat.postMessage` Slack dla odpowiedzi bota. Pomiń je, aby zachować domyślne zachowanie Slack; ustaw je w `channels.slack.accounts.<accountId>`, aby nadpisać domyślną wartość najwyższego poziomu dla jednego konta.
- Użyj `user:<id>` (DM) albo `channel:<id>` jako celów dostarczania.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji wątku:** `thread.historyScope` jest osobny dla wątku (domyślnie) albo współdzielony w kanale. `thread.inheritParent` kopiuje transkrypt kanału nadrzędnego do nowych wątków.

- Natywne strumieniowanie Slack oraz status wątku w stylu asystenta Slack „is typing...” wymagają celu wątku odpowiedzi. DM najwyższego poziomu domyślnie pozostają poza wątkiem, więc nadal mogą strumieniować przez robocze podglądy publikowania i edycji Slack zamiast pokazywać podgląd natywnego strumienia/statusu w stylu wątku.
- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack podczas generowania odpowiedzi, a następnie usuwa ją po zakończeniu. Użyj skrótu emoji Slack, takiego jak `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slack dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających. Ten sam schemat co Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slack), `agentFilter`, `sessionFilter` i `target` (`"dm"`, `"channel"` albo `"both"`).

| Grupa akcji | Domyślnie | Uwagi                  |
| ------------ | ------- | ---------------------- |
| reactions    | włączone | Reagowanie + lista reakcji |
| messages     | włączone | Odczyt/wysyłanie/edycja/usuwanie  |
| pins         | włączone | Przypinanie/odpinanie/lista         |
| memberInfo   | włączone | Informacje o członku            |
| emojiList    | włączone | Lista niestandardowych emoji      |

### Mattermost

Mattermost jest dostarczany jako dołączany Plugin w bieżących wydaniach OpenClaw. Starsze albo
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

Tryby czatu: `oncall` (odpowiada na @-wzmiankę, domyślnie), `onmessage` (każda wiadomość), `onchar` (wiadomości zaczynające się od prefiksu wyzwalającego).

Gdy natywne polecenia Mattermost są włączone:

- `commands.callbackPath` musi być ścieżką (na przykład `/api/channels/mattermost/command`), a nie pełnym adresem URL.
- `commands.callbackUrl` musi wskazywać endpoint Gateway OpenClaw i być osiągalny z serwera Mattermost.
- Natywne wywołania zwrotne slash są uwierzytelniane za pomocą tokenów właściwych dla polecenia zwracanych
  przez Mattermost podczas rejestracji polecenia slash. Jeśli rejestracja się nie powiedzie albo żadne
  polecenia nie zostaną aktywowane, OpenClaw odrzuca wywołania zwrotne komunikatem
  `Unauthorized: invalid command token.`
- W przypadku prywatnych/tailnet/wewnętrznych hostów wywołań zwrotnych Mattermost może wymagać,
  aby `ServiceSettings.AllowedUntrustedInternalConnections` zawierało host/domenę wywołania zwrotnego.
  Używaj wartości hosta/domeny, nie pełnych adresów URL.
- `channels.mattermost.configWrites`: zezwól na zapisy konfiguracji inicjowane przez Mattermost albo ich odmów.
- `channels.mattermost.requireMention`: wymagaj `@mention` przed odpowiedzią w kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: zastąpienie bramkowania wzmianki dla kanału (`"*"` jako domyślne).
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

OpenClaw uruchamia `imsg rpc` (JSON-RPC przez stdio). Nie jest wymagany demon ani port. To preferowana ścieżka dla nowych konfiguracji OpenClaw iMessage, gdy host może przyznać uprawnienia do bazy danych Wiadomości i Automatyzacji.

Obsługa BlueBubbles została usunięta. `channels.bluebubbles` nie jest obsługiwaną powierzchnią konfiguracji runtime w bieżącym OpenClaw. Przenieś stare konfiguracje do `channels.imessage`; użyj [Usunięcie BlueBubbles i ścieżka imsg iMessage](/pl/announcements/bluebubbles-imessage) dla krótkiej wersji oraz [Migracja z BlueBubbles](/pl/channels/imessage-from-bluebubbles) dla pełnej tabeli tłumaczeń.

Jeśli Gateway nie działa na Macu zalogowanym do Wiadomości, pozostaw `channels.imessage.enabled=true` i ustaw `channels.imessage.cliPath` na wrapper SSH, który uruchamia `imsg "$@"` na tym Macu. Domyślna lokalna ścieżka `imsg` działa tylko na macOS.

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
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
      catchup: {
        enabled: false,
      },
    },
  },
}
```

- Opcjonalne `channels.imessage.defaultAccount` zastępuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.

- Wymaga pełnego dostępu do dysku dla bazy danych Wiadomości.
- Preferuj cele `chat_id:<id>`. Użyj `imsg chats --limit 20`, aby wyświetlić czaty.
- `cliPath` może wskazywać wrapper SSH; ustaw `remoteHost` (`host` albo `user@host`) do pobierania załączników przez SCP.
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają ścieżki załączników przychodzących (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa ścisłego sprawdzania klucza hosta, więc upewnij się, że klucz hosta przekaźnika już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwól na zapisy konfiguracji inicjowane przez iMessage albo ich odmów.
- `channels.imessage.actions.*`: włącz akcje prywatnego API, które są również bramkowane przez `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` jest domyślnie wyłączone; ustaw je na `true`, zanim zaczniesz oczekiwać multimediów przychodzących w turach agenta.
- `channels.imessage.catchup.enabled`: włącz odtwarzanie wiadomości przychodzących, które dotarły, gdy Gateway był wyłączony.
- `channels.imessage.groups`: rejestr grup i ustawienia dla grup. Przy `groupPolicy: "allowlist"` skonfiguruj jawne klucze `chat_id` albo wpis wieloznaczny `"*"`, aby wiadomości grupowe mogły przejść przez bramkę rejestru.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą powiązać rozmowy iMessage z trwałymi sesjami ACP. Użyj znormalizowanego uchwytu albo jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Semantyka pól współdzielonych: [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Przykład wrappera SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix jest oparty na Plugin i konfigurowany w `channels.matrix`.

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
- `channels.matrix.proxy` kieruje ruch HTTP Matrix przez jawny serwer proxy HTTP(S). Nazwane konta mogą je zastąpić za pomocą `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` zezwala na prywatne/wewnętrzne homeservery. `proxy` i ta zgoda sieciowa są niezależnymi kontrolkami.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach z wieloma kontami.
- `channels.matrix.autoJoin` domyślnie ma wartość `off`, więc zaproszone pokoje i nowe zaproszenia w stylu DM są ignorowane, dopóki nie ustawisz `autoJoin: "allowlist"` z `autoJoinAllowlist` albo `autoJoin: "always"`.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` albo `"auto"` (domyślnie). W trybie automatycznym zatwierdzenia exec aktywują się, gdy zatwierdzających można rozpoznać z `approvers` albo `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`) uprawnione do zatwierdzania żądań exec.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg albo wyrażenie regularne).
  - `target`: dokąd wysyłać prośby o zatwierdzenie. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) albo `"both"`.
  - Zastąpienia dla konta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kontroluje, jak DM Matrix grupują się w sesje: `per-user` (domyślnie) współdzieli według trasowanego rozmówcy, a `per-room` izoluje każdy pokój DM.
- Sondy statusu Matrix i dynamiczne wyszukiwania katalogu używają tej samej polityki proxy co ruch runtime.
- Pełna konfiguracja Matrix, reguły targetowania i przykłady konfiguracji są udokumentowane w [Matrix](/pl/channels/matrix).

### Microsoft Teams

Microsoft Teams jest oparty na Plugin i konfigurowany w `channels.msteams`.

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
- Pełna konfiguracja Teams (poświadczenia, webhook, polityka DM/grup, zastąpienia dla zespołu/kanału) jest udokumentowana w [Microsoft Teams](/pl/channels/msteams).

### IRC

IRC jest oparty na Plugin i konfigurowany w `channels.irc`.

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
- Opcjonalne `channels.irc.defaultAccount` zastępuje wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Pełna konfiguracja kanału IRC (host/port/TLS/kanały/listy dozwolonych/bramkowanie wzmianki) jest udokumentowana w [IRC](/pl/channels/irc).

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

- `default` jest używane, gdy `accountId` zostanie pominięte (CLI + trasowanie).
- Tokeny env dotyczą tylko konta **domyślnego**.
- Podstawowe ustawienia kanału dotyczą wszystkich kont, chyba że zostaną zastąpione dla konta.
- Użyj `bindings[].match.accountId`, aby kierować każde konto do innego agenta.
- Jeśli dodasz konto inne niż domyślne za pomocą `openclaw channels add` (albo onboardingu kanału), gdy nadal używasz jednokontowej konfiguracji kanału najwyższego poziomu, OpenClaw najpierw promuje wartości jednokontowe najwyższego poziomu zależne od konta do mapy kont kanału, aby pierwotne konto nadal działało. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.
- Istniejące powiązania tylko kanału (bez `accountId`) nadal pasują do domyślnego konta; powiązania zależne od konta pozostają opcjonalne.
- `openclaw doctor --fix` naprawia także mieszane kształty, przenosząc wartości jednokontowe najwyższego poziomu zależne od konta do promowanego konta wybranego dla tego kanału. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.

### Inne kanały Plugin

Wiele kanałów Plugin jest konfigurowanych jako `channels.<id>` i dokumentowanych na swoich dedykowanych stronach kanałów (na przykład Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat i Twitch).
Zobacz pełny indeks kanałów: [Kanały](/pl/channels).

### Bramkowanie wzmianek w czacie grupowym

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianka metadanych albo bezpieczne wzorce regex). Dotyczy czatów grupowych WhatsApp, Telegram, Discord, Google Chat i iMessage.

Widoczne odpowiedzi są kontrolowane osobno. Pokoje grup/kanałów domyślnie używają `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw nadal przetwarza turę, ale zwykłe odpowiedzi końcowe pozostają prywatne, a widoczny wynik w pokoju wymaga `message(action=send)`. Ustaw `"automatic"` tylko wtedy, gdy chcesz starsze zachowanie, w którym zwykłe odpowiedzi są publikowane z powrotem w pokoju. Aby zastosować takie samo zachowanie widocznej odpowiedzi wyłącznie przez narzędzie także do czatów bezpośrednich, ustaw `messages.visibleReplies: "message_tool"`; harness Codex używa również tego zachowania wyłącznie przez narzędzie jako domyślnego dla nieustawionych czatów bezpośrednich.

Widoczne odpowiedzi wyłącznie przez narzędzie wymagają modelu/środowiska runtime, które niezawodnie wywołuje narzędzia. Jeśli
dziennik sesji pokazuje tekst asystenta z `didSendViaMessagingTool: false`,
model utworzył prywatną odpowiedź końcową zamiast wywołać narzędzie wiadomości.
Przełącz ten kanał na silniejszy model wywołujący narzędzia albo ustaw
`messages.groupChat.visibleReplies: "automatic"`, aby przywrócić starsze widoczne odpowiedzi
końcowe.

Jeśli narzędzie wiadomości jest niedostępne w ramach aktywnej polityki narzędzi, OpenClaw przechodzi na automatyczne widoczne odpowiedzi zamiast po cichu tłumić odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

Gateway przeładowuje konfigurację `messages` na gorąco po zapisaniu pliku. Uruchom ponownie tylko wtedy, gdy obserwowanie plików lub przeładowanie konfiguracji jest wyłączone we wdrożeniu.

**Typy wzmianek:**

- **Wzmianki metadanych**: natywne wzmianki @ platformy. Ignorowane w trybie czatu z samym sobą WhatsApp.
- **Wzorce tekstowe**: bezpieczne wzorce regex w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Bramkowanie wzmianek jest wymuszane tylko wtedy, gdy wykrywanie jest możliwe (wzmianki natywne lub co najmniej jeden wzorzec).

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

`messages.groupChat.historyLimit` ustawia globalną wartość domyślną. Kanały mogą ją nadpisać za pomocą `channels.<channel>.historyLimit` (lub dla poszczególnych kont). Ustaw `0`, aby wyłączyć.

`messages.visibleReplies` jest globalną wartością domyślną dla tur źródłowych; `messages.groupChat.visibleReplies` nadpisuje ją dla tur źródłowych grup/kanałów. Gdy `messages.visibleReplies` nie jest ustawione, harness może dostarczyć własną domyślną wartość dla bezpośredniego/źródłowego czatu; harness Codex domyślnie używa `message_tool`. Listy dozwolonych kanałów i bramkowanie wzmianek nadal decydują, czy tura jest przetwarzana.

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

Rozstrzyganie: nadpisanie dla danego DM → domyślna wartość dostawcy → brak limitu (wszystko zachowane).

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

- Ten blok konfiguruje powierzchnie poleceń. Aktualny katalog poleceń wbudowanych i dołączonych znajdziesz w [Poleceniach ukośnikiem](/pl/tools/slash-commands).
- Ta strona jest **referencją kluczy konfiguracji**, a nie pełnym katalogiem poleceń. Polecenia należące do kanałów/Plugin, takie jak QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, parowanie urządzeń `/pair`, pamięć `/dreaming`, sterowanie telefonem `/phone` i Talk `/voice`, są udokumentowane na stronach ich kanałów/Plugin oraz w [Poleceniach ukośnikiem](/pl/tools/slash-commands).
- Polecenia tekstowe muszą być **samodzielnymi** wiadomościami z początkowym `/`.
- `native: "auto"` włącza natywne polecenia dla Discord/Telegram, pozostawia Slack wyłączony.
- `nativeSkills: "auto"` włącza natywne polecenia Skills dla Discord/Telegram, pozostawia Slack wyłączony.
- Nadpisanie dla kanału: `channels.discord.commands.native` (bool lub `"auto"`). Dla Discord `false` pomija rejestrację i czyszczenie natywnych poleceń podczas uruchamiania.
- Nadpisz rejestrację natywnych Skills dla kanału za pomocą `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` dodaje dodatkowe wpisy menu bota Telegram.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` i nadawcy w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczytuje/zapisuje `openclaw.json`). Dla klientów Gateway `chat.send` trwałe zapisy `/config set|unset` wymagają także `operator.admin`; tylko do odczytu `/config show` pozostaje dostępne dla zwykłych klientów operatora z zakresem zapisu.
- `mcp: true` włącza `/mcp` dla konfiguracji serwera MCP zarządzanego przez OpenClaw pod `mcp.servers`.
- `plugins: true` włącza `/plugins` dla wykrywania Plugin, instalacji oraz kontrolek włączania/wyłączania.
- `channels.<provider>.configWrites` bramkuje mutacje konfiguracji dla kanału (domyślnie: true).
- W kanałach wielokontowych `channels.<provider>.accounts.<id>.configWrites` także bramkuje zapisy kierowane do tego konta (na przykład `/allowlist --config --account <id>` lub `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` wyłącza `/restart` i akcje narzędzia restartu Gateway. Domyślnie: `true`.
- `ownerAllowFrom` to jawna lista dozwolonych właścicieli dla poleceń/narzędzi tylko dla właściciela. Jest oddzielna od `allowFrom`.
- `ownerDisplay: "hash"` haszuje identyfikatory właścicieli w prompcie systemowym. Ustaw `ownerDisplaySecret`, aby kontrolować haszowanie.
- `allowFrom` jest per dostawca. Gdy jest ustawione, jest **jedynym** źródłem autoryzacji (listy dozwolonych kanałów/parowanie i `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala poleceniom omijać polityki grup dostępu, gdy `allowFrom` nie jest ustawione.
- Mapa dokumentacji poleceń:
  - katalog wbudowany i dołączony: [Polecenia ukośnikiem](/pl/tools/slash-commands)
  - powierzchnie poleceń specyficzne dla kanałów: [Kanały](/pl/channels)
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
