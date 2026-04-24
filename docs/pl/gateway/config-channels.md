---
read_when:
    - Konfigurowanie Plugin kanału (auth, kontrola dostępu, wiele kont)
    - Rozwiązywanie problemów z kluczami konfiguracji per channel
    - Audyt polityki DM, polityki grupowej lub wymagania wzmianki
summary: 'Konfiguracja kanałów: kontrola dostępu, Pairing, klucze per channel w Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych'
title: Konfiguracja — kanały
x-i18n:
    generated_at: "2026-04-24T09:08:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 449275b8eef0ae841157f57baa9e04d35d9e62605726de8ee4ec098c18eb62e2
    source_path: gateway/config-channels.md
    workflow: 15
---

Klucze konfiguracji per channel pod `channels.*`. Obejmuje dostęp DM i grupowy,
konfiguracje wielokontowe, wymaganie wzmianki oraz klucze per channel dla Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage i innych dołączonych Plugin kanałów.

W przypadku agentów, narzędzi, środowiska uruchomieniowego Gateway i innych kluczy najwyższego poziomu zobacz
[Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że `enabled: false`).

### Dostęp DM i grupowy

Wszystkie kanały obsługują polityki DM i polityki grupowe:

| Polityka DM          | Zachowanie                                                      |
| -------------------- | --------------------------------------------------------------- |
| `pairing` (domyślna) | Nieznani nadawcy otrzymują jednorazowy kod Pairing; właściciel musi zatwierdzić |
| `allowlist`          | Tylko nadawcy z `allowFrom` (lub sparowanego magazynu dozwolonych) |
| `open`               | Zezwala na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`) |
| `disabled`           | Ignoruje wszystkie przychodzące DM                              |

| Polityka grupowa       | Zachowanie                                             |
| ---------------------- | ------------------------------------------------------ |
| `allowlist` (domyślna) | Tylko grupy pasujące do skonfigurowanej allowlisty     |
| `open`                 | Pomija allowlisty grupowe (wymaganie wzmianki nadal obowiązuje) |
| `disabled`             | Blokuje wszystkie wiadomości grupowe/pokojów           |

<Note>
`channels.defaults.groupPolicy` ustawia wartość domyślną, gdy `groupPolicy` providera nie jest ustawione.
Kody Pairing wygasają po 1 godzinie. Oczekujące żądania Pairing DM są ograniczone do **3 na kanał**.
Jeśli blok providera całkowicie nie istnieje (`channels.<provider>` jest nieobecne), polityka grupowa środowiska uruchomieniowego wraca do `allowlist` (fail-closed) z ostrzeżeniem przy uruchomieniu.
</Note>

### Nadpisania modeli kanałów

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

Użyj `channels.defaults`, aby współdzielić zachowanie polityki grupowej i Heartbeat między providerami:

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

- `channels.defaults.groupPolicy`: awaryjna polityka grupowa, gdy `groupPolicy` na poziomie providera nie jest ustawione.
- `channels.defaults.contextVisibility`: domyślny tryb widoczności dodatkowego kontekstu dla wszystkich kanałów. Wartości: `all` (domyślnie, uwzględnia cały cytowany/wątkowy/historyczny kontekst), `allowlist` (uwzględnia tylko kontekst od nadawców z allowlisty), `allowlist_quote` (to samo co allowlist, ale zachowuje jawny kontekst cytatu/odpowiedzi). Nadpisanie per channel: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględnia zdrowe statusy kanałów w danych wyjściowych Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: uwzględnia statusy pogorszone/błędów w danych wyjściowych Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderuje kompaktowe dane wyjściowe Heartbeat w stylu wskaźnika.

### WhatsApp

WhatsApp działa przez kanał web Gateway (Baileys Web). Uruchamia się automatycznie, gdy istnieje powiązana sesja.

```json5
{
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

<Accordion title="WhatsApp wielokontowy">

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

- Polecenia wychodzące domyślnie używają konta `default`, jeśli istnieje; w przeciwnym razie pierwszego skonfigurowanego identyfikatora konta (sortowanego).
- Opcjonalne `channels.whatsapp.defaultAccount` nadpisuje ten awaryjny wybór domyślnego konta, gdy pasuje do skonfigurowanego identyfikatora konta.
- Starszy katalog auth Baileys dla pojedynczego konta jest migrowany przez `openclaw doctor` do `whatsapp/default`.
- Nadpisania per account: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bota: `channels.telegram.botToken` lub `channels.telegram.tokenFile` (tylko zwykły plik; symlinki są odrzucane), z `TELEGRAM_BOT_TOKEN` jako wartością awaryjną dla konta domyślnego.
- Opcjonalne `channels.telegram.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- W konfiguracjach wielokontowych (2+ identyfikatory kont) ustaw jawne domyślne konto (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć routingu awaryjnego; `openclaw doctor` ostrzega, gdy tego brakuje lub jest nieprawidłowe.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Telegram (migracje identyfikatorów supergrup, `/config set|unset`).
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla tematów forum (użyj kanonicznego `chatId:topic:topicId` w `match.peer.id`). Semantyka pól jest współdzielona w [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
- Podglądy strumienia Telegram używają `sendMessage` + `editMessageText` (działa w czatach bezpośrednich i grupowych).
- Polityka ponawiania: zobacz [Polityka ponawiania](/pl/concepts/retry).

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

- Token: `channels.discord.token`, z `DISCORD_BOT_TOKEN` jako wartością awaryjną dla konta domyślnego.
- Bezpośrednie wywołania wychodzące, które podają jawny Discord `token`, używają tego tokenu dla wywołania; ustawienia ponawiania/polityki konta nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
- Opcjonalne `channels.discord.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Używaj `user:<id>` (DM) lub `channel:<id>` (kanał guild) jako celów dostarczania; surowe numeryczne identyfikatory są odrzucane.
- Slugi guild są pisane małymi literami, a spacje są zastępowane przez `-`; klucze kanałów używają nazwy w postaci sluga (bez `#`). Preferuj identyfikatory guild.
- Wiadomości autorstwa botów są domyślnie ignorowane. `allowBots: true` je włącza; użyj `allowBots: "mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal są filtrowane).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz nadpisania kanałów) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyłączeniem @everyone/@here).
- `maxLinesPerMessage` (domyślnie 17) dzieli wysokie wiadomości nawet wtedy, gdy mają mniej niż 2000 znaków.
- `channels.discord.threadBindings` steruje routingiem związanym z wątkami Discord:
  - `enabled`: nadpisanie Discord dla funkcji sesji związanych z wątkiem (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązanego dostarczania/routingu)
  - `idleHours`: nadpisanie Discord dla automatycznego odfokusowania po bezczynności w godzinach (`0` wyłącza)
  - `maxAgeHours`: nadpisanie Discord dla twardego maksymalnego wieku w godzinach (`0` wyłącza)
  - `spawnSubagentSessions`: przełącznik opt-in dla automatycznego tworzenia/powiązywania wątków przez `sessions_spawn({ thread: true })`
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (użyj identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest współdzielona w [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu dla kontenerów komponentów Discord v2.
- `channels.discord.voice` włącza konwersacje w kanałach głosowych Discord oraz opcjonalne auto-join + nadpisania TTS.
- `channels.discord.voice.daveEncryption` i `channels.discord.voice.decryptionFailureTolerance` są przekazywane do opcji DAVE `@discordjs/voice` (domyślnie `true` i `24`).
- OpenClaw dodatkowo próbuje odzyskiwać odbiór głosu, opuszczając i ponownie dołączając do sesji głosowej po powtarzających się błędach deszyfrowania.
- `channels.discord.streaming` to kanoniczny klucz trybu strumieniowania. Starsze wartości `streamMode` i logiczne `streaming` są migrowane automatycznie.
- `channels.discord.autoPresence` mapuje dostępność środowiska uruchomieniowego na status obecności bota (healthy => online, degraded => idle, exhausted => dnd) i pozwala na opcjonalne nadpisania tekstu statusu.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie po zmiennych nazwach/tagach (awaryjny tryb zgodności).
- `channels.discord.execApprovals`: natywne dla Discord dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzający mogą zostać rozwiązani z `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discord uprawnionych do zatwierdzania żądań exec. Gdy pominięte, używane jest `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna allowlista identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (substring lub regex).
  - `target`: miejsce wysyłania promptów zatwierdzeń. `"dm"` (domyślnie) wysyła do DM zatwierdzających, `"channel"` wysyła do kanału źródłowego, `"both"` wysyła do obu. Gdy target zawiera `"channel"`, przyciski mogą być używane tylko przez rozwiązanych zatwierdzających.
  - `cleanupAfterResolve`: gdy `true`, usuwa DM z zatwierdzeniami po zatwierdzeniu, odrzuceniu lub przekroczeniu limitu czasu.

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

- JSON konta usługi: inline (`serviceAccount`) lub z pliku (`serviceAccountFile`).
- SecretRef konta usługi jest również obsługiwany (`serviceAccountRef`).
- Awaryjne wartości env: `GOOGLE_CHAT_SERVICE_ACCOUNT` lub `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Używaj `spaces/<spaceId>` lub `users/<userId>` jako celów dostarczania.
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

- **Tryb Socket** wymaga zarówno `botToken`, jak i `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` jako awaryjne wartości env dla konta domyślnego).
- **Tryb HTTP** wymaga `botToken` plus `signingSecret` (na poziomie głównym lub per account).
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują jawne
  ciągi znaków lub obiekty SecretRef.
- Migawki kont Slack udostępniają pola źródła/statusu per credential, takie jak
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, a w trybie HTTP także
  `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest
  skonfigurowane przez SecretRef, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego nie mogła
  rozwiązać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Slack.
- Opcjonalne `channels.slack.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- `channels.slack.streaming.mode` to kanoniczny klucz trybu strumieniowania Slack. `channels.slack.streaming.nativeTransport` steruje natywnym transportem strumieniowania Slack. Starsze wartości `streamMode`, logiczne `streaming` i `nativeStreaming` są migrowane automatycznie.
- Używaj `user:<id>` (DM) lub `channel:<id>` jako celów dostarczania.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji wątku:** `thread.historyScope` działa per thread (domyślnie) lub jest współdzielone w całym kanale. `thread.inheritParent` kopiuje transkrypt kanału nadrzędnego do nowych wątków.

- Natywne strumieniowanie Slack plus status wątku w stylu asystenta Slack „is typing...” wymagają celu odpowiedzi w wątku. DM najwyższego poziomu domyślnie pozostają poza wątkiem, więc używają `typingReaction` lub zwykłego dostarczania zamiast podglądu w stylu wątku.
- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy odpowiedź jest uruchomiona, a następnie usuwa ją po zakończeniu. Użyj shortcode emoji Slack, np. `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slack dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających. Ten sam schemat co w Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slack), `agentFilter`, `sessionFilter` oraz `target` (`"dm"`, `"channel"` lub `"both"`).

| Grupa akcji | Domyślnie | Uwagi                      |
| ----------- | --------- | -------------------------- |
| reactions   | enabled   | Reagowanie + lista reakcji |
| messages    | enabled   | Odczyt/wysyłanie/edycja/usuwanie |
| pins        | enabled   | Przypinanie/odpinanie/lista |
| memberInfo  | enabled   | Informacje o członku       |
| emojiList   | enabled   | Lista niestandardowych emoji |

### Mattermost

Mattermost jest dostarczany jako Plugin: `openclaw plugins install @openclaw/mattermost`.

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

Tryby czatu: `oncall` (odpowiada na @wzmiankę, domyślnie), `onmessage` (na każdą wiadomość), `onchar` (na wiadomości zaczynające się od prefiksu wyzwalającego).

Gdy natywne polecenia Mattermost są włączone:

- `commands.callbackPath` musi być ścieżką (na przykład `/api/channels/mattermost/command`), a nie pełnym URL-em.
- `commands.callbackUrl` musi wskazywać punkt końcowy Gateway OpenClaw i być osiągalny z serwera Mattermost.
- Natywne callbacki slash są uwierzytelniane za pomocą tokenów per command zwracanych
  przez Mattermost podczas rejestracji poleceń slash. Jeśli rejestracja się nie powiedzie lub żadne
  polecenia nie zostaną aktywowane, OpenClaw odrzuca callbacki komunikatem
  `Unauthorized: invalid command token.`
- Dla prywatnych/tailnet/wewnętrznych hostów callback Mattermost może wymagać,
  aby `ServiceSettings.AllowedUntrustedInternalConnections` zawierało host/domenę callbacku.
  Używaj wartości host/domena, a nie pełnych URL-i.
- `channels.mattermost.configWrites`: zezwalaj lub odmawiaj zapisów konfiguracji inicjowanych przez Mattermost.
- `channels.mattermost.requireMention`: wymaga `@mention` przed odpowiedzią w kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: nadpisanie wymagania wzmianki per channel (`"*"` jako wartość domyślna).
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

- `channels.signal.account`: przypina uruchamianie kanału do konkretnej tożsamości konta Signal.
- `channels.signal.configWrites`: zezwala lub odmawia zapisów konfiguracji inicjowanych przez Signal.
- Opcjonalne `channels.signal.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.

### BlueBubbles

BlueBubbles to zalecana ścieżka iMessage (oparta na Plugin, konfigurowana pod `channels.bluebubbles`).

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
- Opcjonalne `channels.bluebubbles.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje BlueBubbles z trwałymi sesjami ACP. Użyj uchwytu BlueBubbles lub docelowego ciągu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Współdzielona semantyka pól: [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
- Pełna konfiguracja kanału BlueBubbles jest opisana w [BlueBubbles](/pl/channels/bluebubbles).

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

- Opcjonalne `channels.imessage.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.

- Wymaga Full Disk Access do bazy danych Messages.
- Preferuj cele `chat_id:<id>`. Użyj `imsg chats --limit 20`, aby wyświetlić listę czatów.
- `cliPath` może wskazywać na wrapper SSH; ustaw `remoteHost` (`host` lub `user@host`) do pobierania załączników przez SCP.
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają ścieżki przychodzących załączników (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa ścisłego sprawdzania klucza hosta, więc upewnij się, że klucz hosta przekaźnika już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwalaj lub odmawiaj zapisów konfiguracji inicjowanych przez iMessage.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje iMessage z trwałymi sesjami ACP. Użyj znormalizowanego uchwytu lub jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Współdzielona semantyka pól: [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).

<Accordion title="Przykład wrappera SSH dla iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix jest oparty na Plugin i konfigurowany pod `channels.matrix`.

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
- `channels.matrix.proxy` kieruje ruch HTTP Matrix przez jawny proxy HTTP(S). Nazwane konta mogą to nadpisać przez `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` zezwala na prywatne/wewnętrzne homeserver. `proxy` i to sieciowe ustawienie opt-in to niezależne mechanizmy.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach wielokontowych.
- `channels.matrix.autoJoin` domyślnie ma wartość `off`, więc zaproszone pokoje i nowe zaproszenia w stylu DM są ignorowane, dopóki nie ustawisz `autoJoin: "allowlist"` z `autoJoinAllowlist` albo `autoJoin: "always"`.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzający mogą zostać rozwiązani z `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`) uprawnionych do zatwierdzania żądań exec.
  - `agentFilter`: opcjonalna allowlista identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (substring lub regex).
  - `target`: miejsce wysyłania promptów zatwierdzeń. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) lub `"both"`.
  - Nadpisania per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steruje tym, jak DM Matrix są grupowane w sesje: `per-user` (domyślnie) współdzieli według routowanego peera, natomiast `per-room` izoluje każdy pokój DM.
- Testy statusu Matrix i wyszukiwania katalogu na żywo używają tej samej polityki proxy co ruch środowiska uruchomieniowego.
- Pełna konfiguracja Matrix, reguły kierowania i przykłady konfiguracji są opisane w [Matrix](/pl/channels/matrix).

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
- Pełna konfiguracja Teams (poświadczenia, Webhook, polityka DM/grupowa, nadpisania per team/per channel) jest opisana w [Microsoft Teams](/pl/channels/msteams).

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
- Opcjonalne `channels.irc.defaultAccount` nadpisuje wybór konta domyślnego, gdy pasuje do skonfigurowanego identyfikatora konta.
- Pełna konfiguracja kanału IRC (host/port/TLS/channels/allowlisty/wymaganie wzmianki) jest opisana w [IRC](/pl/channels/irc).

### Wiele kont (wszystkie kanały)

Uruchamiaj wiele kont per channel (każde z własnym `accountId`):

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
- Bazowe ustawienia kanału mają zastosowanie do wszystkich kont, chyba że zostaną nadpisane per account.
- Użyj `bindings[].match.accountId`, aby kierować każde konto do innego agenta.
- Jeśli dodasz konto inne niż domyślne przez `openclaw channels add` (lub onboarding kanału), będąc nadal przy jednokontowej konfiguracji kanału na poziomie głównym, OpenClaw najpierw promuje wartości jednokontowe z najwyższego poziomu o zakresie konta do mapy kont kanału, aby oryginalne konto nadal działało. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/docelowy domyślny wpis.
- Istniejące powiązania tylko kanałowe (bez `accountId`) nadal dopasowują konto domyślne; powiązania o zakresie konta pozostają opcjonalne.
- `openclaw doctor --fix` także naprawia mieszane kształty, przenosząc wartości jednokontowe z najwyższego poziomu o zakresie konta do promowanego konta wybranego dla tego kanału. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/docelowy domyślny wpis.

### Inne kanały Plugin

Wiele kanałów Plugin jest konfigurowanych jako `channels.<id>` i opisanych na ich dedykowanych stronach kanałów (na przykład Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat i Twitch).
Zobacz pełny indeks kanałów: [Kanały](/pl/channels).

### Wymaganie wzmianki w czatach grupowych

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianka w metadanych lub bezpieczne wzorce regex). Dotyczy WhatsApp, Telegram, Discord, Google Chat i czatów grupowych iMessage.

**Typy wzmianek:**

- **Wzmianki w metadanych**: natywne @wzmianki platformy. Ignorowane w trybie self-chat WhatsApp.
- **Wzorce tekstowe**: bezpieczne wzorce regex w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Wymaganie wzmianki jest egzekwowane tylko wtedy, gdy wykrycie jest możliwe (natywne wzmianki lub co najmniej jeden wzorzec).

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

`messages.groupChat.historyLimit` ustawia wartość domyślną globalnie. Kanały mogą ją nadpisać przez `channels.<channel>.historyLimit` (lub per account). Ustaw `0`, aby wyłączyć.

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

Rozwiązywanie: nadpisanie per DM → domyślna wartość providera → brak limitu (wszystko zachowane).

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

- Ten blok konfiguruje powierzchnie poleceń. Aktualny katalog poleceń wbudowanych + dołączonych znajdziesz w [Polecenia Slash](/pl/tools/slash-commands).
- Ta strona to **dokumentacja kluczy konfiguracji**, a nie pełny katalog poleceń. Polecenia należące do kanałów/Plugin, takie jak QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` i Talk `/voice`, są opisane na stronach ich kanałów/Plugin oraz w [Polecenia Slash](/pl/tools/slash-commands).
- Polecenia tekstowe muszą być samodzielnymi wiadomościami **standalone** z wiodącym `/`.
- `native: "auto"` włącza polecenia natywne dla Discord/Telegram, pozostawia Slack wyłączony.
- `nativeSkills: "auto"` włącza natywne polecenia Skills dla Discord/Telegram, pozostawia Slack wyłączony.
- Nadpisanie per channel: `channels.discord.commands.native` (bool lub `"auto"`). `false` czyści wcześniej zarejestrowane polecenia.
- Nadpisz rejestrację natywnych Skills per channel przez `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` dodaje dodatkowe wpisy menu bota Telegram.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` oraz nadawcy w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczyt/zapis `openclaw.json`). Dla klientów Gateway `chat.send` trwałe zapisy `/config set|unset` wymagają także `operator.admin`; tylko do odczytu `/config show` pozostaje dostępne dla zwykłych klientów operatora z zakresem zapisu.
- `mcp: true` włącza `/mcp` dla konfiguracji serwerów MCP zarządzanych przez OpenClaw pod `mcp.servers`.
- `plugins: true` włącza `/plugins` do wykrywania Plugin, instalacji i sterowania włączaniem/wyłączaniem.
- `channels.<provider>.configWrites` kontroluje mutacje konfiguracji per channel (domyślnie: true).
- Dla kanałów wielokontowych `channels.<provider>.accounts.<id>.configWrites` także kontroluje zapisy kierowane do tego konta (na przykład `/allowlist --config --account <id>` lub `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` wyłącza działania `/restart` i narzędzia ponownego uruchamiania Gateway. Domyślnie: `true`.
- `ownerAllowFrom` to jawna allowlista właściciela dla poleceń/narzędzi tylko dla właściciela. Jest oddzielna od `allowFrom`.
- `ownerDisplay: "hash"` haszuje identyfikatory właścicieli w system prompt. Ustaw `ownerDisplaySecret`, aby sterować haszowaniem.
- `allowFrom` działa per provider. Gdy jest ustawione, jest **jedynym** źródłem autoryzacji (allowlisty kanałów/Pairing i `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala poleceniom omijać polityki grup dostępu, gdy `allowFrom` nie jest ustawione.
- Mapa dokumentacji poleceń:
  - katalog wbudowany + dołączony: [Polecenia Slash](/pl/tools/slash-commands)
  - powierzchnie poleceń specyficzne dla kanałów: [Kanały](/pl/channels)
  - polecenia QQ Bot: [QQ Bot](/pl/channels/qqbot)
  - polecenia Pairing: [Pairing](/pl/channels/pairing)
  - polecenie karty LINE: [LINE](/pl/channels/line)
  - dreaming memory: [Dreaming](/pl/concepts/dreaming)

</Accordion>

---

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — klucze najwyższego poziomu
- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Przegląd kanałów](/pl/channels)
