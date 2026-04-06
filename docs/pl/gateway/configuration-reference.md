---
read_when:
    - Potrzebujesz dokładnej semantyki pól konfiguracji lub wartości domyślnych
    - Weryfikujesz bloki konfiguracji kanałów, modeli, gatewaya lub narzędzi
summary: Kompletne omówienie wszystkich kluczy konfiguracji OpenClaw, wartości domyślnych i ustawień kanałów
title: Dokumentacja konfiguracji
x-i18n:
    generated_at: "2026-04-06T09:50:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ae6c19666f65433361e1c8b100ae710448c8aa055a60c140241a8aea09b98a5
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Dokumentacja konfiguracji

Każde pole dostępne w `~/.openclaw/openclaw.json`. Aby zobaczyć omówienie zorientowane na zadania, przejdź do [Configuration](/pl/gateway/configuration).

Format konfiguracji to **JSON5** (dozwolone komentarze i końcowe przecinki). Wszystkie pola są opcjonalne — OpenClaw używa bezpiecznych wartości domyślnych, gdy zostaną pominięte.

---

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że ustawiono `enabled: false`).

### Dostęp do DM i grup

Wszystkie kanały obsługują zasady DM i zasady grup:

| Zasada DM            | Zachowanie                                                     |
| -------------------- | -------------------------------------------------------------- |
| `pairing` (domyślna) | Nieznani nadawcy otrzymują jednorazowy kod parowania; właściciel musi zatwierdzić |
| `allowlist`          | Tylko nadawcy z `allowFrom` (lub sparowanego magazynu dozwolonych) |
| `open`               | Zezwalaj na wszystkie przychodzące DM (wymaga `allowFrom: ["*"]`) |
| `disabled`           | Ignoruj wszystkie przychodzące DM                              |

| Zasada grup          | Zachowanie                                             |
| -------------------- | ------------------------------------------------------ |
| `allowlist` (domyślna) | Tylko grupy pasujące do skonfigurowanej listy dozwolonych |
| `open`               | Pomijaj listy dozwolonych grup (nadal obowiązuje wymóg wzmianki) |
| `disabled`           | Blokuj wszystkie wiadomości grupowe/pokojów            |

<Note>
`channels.defaults.groupPolicy` ustawia wartość domyślną, gdy `groupPolicy` dostawcy nie jest ustawione.
Kody parowania wygasają po 1 godzinie. Oczekujące żądania parowania DM są ograniczone do **3 na kanał**.
Jeśli blok dostawcy jest całkowicie nieobecny (`channels.<provider>` nie istnieje), zasada grup w czasie działania wraca do `allowlist` (fail-closed) z ostrzeżeniem przy uruchomieniu.
</Note>

### Zastąpienia modelu dla kanału

Użyj `channels.modelByChannel`, aby przypiąć określone identyfikatory kanałów do modelu. Wartości akceptują `provider/model` lub skonfigurowane aliasy modeli. Mapowanie kanałów jest stosowane, gdy sesja nie ma już ustawionego zastąpienia modelu (na przykład przez `/model`).

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

### Domyślne ustawienia kanałów i heartbeat

Użyj `channels.defaults` dla wspólnej zasady grup i zachowania heartbeat we wszystkich dostawcach:

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
- `channels.defaults.contextVisibility`: domyślny tryb widoczności kontekstu uzupełniającego dla wszystkich kanałów. Wartości: `all` (domyślne, uwzględnia cały cytowany/wątkowy/historyczny kontekst), `allowlist` (uwzględnia tylko kontekst od nadawców z listy dozwolonych), `allowlist_quote` (to samo co allowlist, ale zachowuje jawny kontekst cytatu/odpowiedzi). Zastąpienie per kanał: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględniaj zdrowe stany kanałów w danych wyjściowych heartbeat.
- `channels.defaults.heartbeat.showAlerts`: uwzględniaj stany zdegradowane/błędy w danych wyjściowych heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderuj zwarte dane heartbeat w stylu wskaźnika.

### WhatsApp

WhatsApp działa przez kanał web gatewaya (Baileys Web). Uruchamia się automatycznie, gdy istnieje powiązana sesja.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // niebieskie ptaszki (false w trybie self-chat)
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
- Opcjonalne `channels.whatsapp.defaultAccount` zastępuje ten wybór domyślnego konta zapasowego, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- Starszy katalog uwierzytelniania Baileys dla pojedynczego konta jest migrowany przez `openclaw doctor` do `whatsapp/default`.
- Zastąpienia per konto: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
      streaming: "partial", // off | partial | block | progress (domyślnie: off; włącz jawnie, aby uniknąć limitów szybkości edycji podglądów)
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
- Opcjonalne `channels.telegram.defaultAccount` zastępuje domyślny wybór konta, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- W konfiguracjach wielokontowych (2+ identyfikatory kont), ustaw jawne konto domyślne (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć routingu zapasowego; `openclaw doctor` ostrzega, gdy tego brakuje lub jest nieprawidłowe.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane z Telegrama (migracje ID supergrup, `/config set|unset`).
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla tematów forów (użyj kanonicznego `chatId:topic:topicId` w `match.peer.id`). Semantyka pól jest współdzielona w [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
- Podglądy strumieni Telegrama używają `sendMessage` + `editMessageText` (działa w czatach bezpośrednich i grupowych).
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
              systemPrompt: "Short answers only.",
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
- Bezpośrednie wywołania wychodzące, które podają jawny `token` Discorda, używają tego tokena dla wywołania; ustawienia ponawiania/zasad kont nadal pochodzą z wybranego konta w aktywnej migawce czasu działania.
- Opcjonalne `channels.discord.defaultAccount` zastępuje domyślny wybór konta, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- Użyj `user:<id>` (DM) lub `channel:<id>` (kanał guild) dla celów dostarczania; same numeryczne identyfikatory są odrzucane.
- Slugi guild są pisane małymi literami, a spacje zastępowane przez `-`; klucze kanałów używają nazwy w formie slug (bez `#`). Preferuj identyfikatory guild.
- Wiadomości autorstwa botów są domyślnie ignorowane. `allowBots: true` je włącza; użyj `allowBots: "mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal są filtrowane).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz zastąpienia na poziomie kanału) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyłączeniem @everyone/@here).
- `maxLinesPerMessage` (domyślnie 17) dzieli wysokie wiadomości nawet wtedy, gdy mają mniej niż 2000 znaków.
- `channels.discord.threadBindings` kontroluje routing powiązany z wątkami Discorda:
  - `enabled`: zastąpienie Discorda dla funkcji sesji powiązanych z wątkami (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane dostarczanie/routing)
  - `idleHours`: zastąpienie Discorda dla automatycznego odfokusowania po bezczynności w godzinach (`0` wyłącza)
  - `maxAgeHours`: zastąpienie Discorda dla twardego maksymalnego wieku w godzinach (`0` wyłącza)
  - `spawnSubagentSessions`: przełącznik opt-in dla automatycznego tworzenia/powiązania wątków przez `sessions_spawn({ thread: true })`
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (użyj identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest współdzielona w [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu dla kontenerów komponentów Discord v2.
- `channels.discord.voice` włącza rozmowy na kanałach głosowych Discorda oraz opcjonalne automatyczne dołączanie i zastąpienia TTS.
- `channels.discord.voice.daveEncryption` i `channels.discord.voice.decryptionFailureTolerance` są przekazywane do opcji DAVE `@discordjs/voice` (domyślnie `true` i `24`).
- OpenClaw dodatkowo próbuje odzyskać odbiór głosu przez opuszczenie i ponowne dołączenie do sesji głosowej po powtarzających się błędach odszyfrowania.
- `channels.discord.streaming` to kanoniczny klucz trybu strumieniowania. Starsze wartości `streamMode` i boolowskie `streaming` są automatycznie migrowane.
- `channels.discord.autoPresence` mapuje dostępność czasu działania na obecność bota (healthy => online, degraded => idle, exhausted => dnd) i umożliwia opcjonalne zastąpienia tekstu statusu.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza dopasowanie po zmiennej nazwie/tagu (tryb kompatybilności typu break-glass).
- `channels.discord.execApprovals`: natywne dla Discorda dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzający mogą zostać rozwiązani z `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discorda, którzy mogą zatwierdzać żądania exec. Po pominięciu używa `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub regex).
  - `target`: gdzie wysyłać prośby o zatwierdzenie. `"dm"` (domyślnie) wysyła do DM zatwierdzających, `"channel"` wysyła do kanału źródłowego, `"both"` wysyła do obu. Gdy target zawiera `"channel"`, przyciski mogą być używane tylko przez rozwiązanych zatwierdzających.
  - `cleanupAfterResolve`: gdy `true`, usuwa DM z zatwierdzeniem po akceptacji, odrzuceniu lub upływie czasu.

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
- Obsługiwany jest też SecretRef konta usługi (`serviceAccountRef`).
- Zapasowe zmienne środowiskowe: `GOOGLE_CHAT_SERVICE_ACCOUNT` lub `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Użyj `spaces/<spaceId>` lub `users/<userId>` jako celów dostarczania.
- `channels.googlechat.dangerouslyAllowNameMatching` ponownie włącza dopasowanie po zmiennym adresie e-mail principal (tryb kompatybilności typu break-glass).

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
      streaming: "partial", // off | partial | block | progress (tryb podglądu)
      nativeStreaming: true, // użyj natywnego API strumieniowania Slacka, gdy streaming=partial
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
- **Tryb HTTP** wymaga `botToken` plus `signingSecret` (na poziomie głównym lub per konto).
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują zwykłe
  ciągi znaków lub obiekty SecretRef.
- Migawki kont Slacka udostępniają pola stanu/źródła poświadczeń, takie jak
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, a w trybie HTTP także
  `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest
  skonfigurowane przez SecretRef, ale bieżąca ścieżka polecenia/czasu działania nie mogła
  rozwiązać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane ze Slacka.
- Opcjonalne `channels.slack.defaultAccount` zastępuje domyślny wybór konta, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- `channels.slack.streaming` to kanoniczny klucz trybu strumieniowania. Starsze wartości `streamMode` i boolowskie `streaming` są automatycznie migrowane.
- Użyj `user:<id>` (DM) lub `channel:<id>` jako celów dostarczania.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji w wątkach:** `thread.historyScope` jest per wątek (domyślnie) lub współdzielone w kanale. `thread.inheritParent` kopiuje transkrypt kanału nadrzędnego do nowych wątków.

- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slacka podczas generowania odpowiedzi, a następnie usuwa ją po zakończeniu. Użyj shortcode emoji Slacka, na przykład `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slacka dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających. Ten sam schemat co dla Discorda: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slacka), `agentFilter`, `sessionFilter` oraz `target` (`"dm"`, `"channel"` lub `"both"`).

| Grupa akcji | Domyślnie | Uwagi                  |
| ----------- | --------- | ---------------------- |
| reactions   | włączone  | Reagowanie + lista reakcji |
| messages    | włączone  | Odczyt/wysyłanie/edycja/usuwanie |
| pins        | włączone  | Przypinanie/odpinanie/listowanie |
| memberInfo  | włączone  | Informacje o członku   |
| emojiList   | włączone  | Lista niestandardowych emoji |

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
        // Opcjonalny jawny URL dla wdrożeń z reverse proxy/publicznych
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Tryby czatu: `oncall` (odpowiada po wzmiance @, domyślnie), `onmessage` (każda wiadomość), `onchar` (wiadomości zaczynające się od prefiksu wyzwalającego).

Gdy natywne polecenia Mattermost są włączone:

- `commands.callbackPath` musi być ścieżką (na przykład `/api/channels/mattermost/command`), a nie pełnym URL-em.
- `commands.callbackUrl` musi wskazywać punkt końcowy gatewaya OpenClaw i być osiągalny z serwera Mattermost.
- Natywne callbacki slash są uwierzytelniane za pomocą tokenów per polecenie zwracanych
  przez Mattermost podczas rejestracji poleceń slash. Jeśli rejestracja się nie powiedzie lub żadne
  polecenia nie zostaną aktywowane, OpenClaw odrzuca callbacki z komunikatem
  `Unauthorized: invalid command token.`
- Dla prywatnych/tailnet/wewnętrznych hostów callbacków Mattermost może wymagać
  uwzględnienia hosta/domeny callbacku w
  `ServiceSettings.AllowedUntrustedInternalConnections`.
  Używaj wartości host/domena, a nie pełnych URL-i.
- `channels.mattermost.configWrites`: zezwalaj lub odmawiaj zapisów konfiguracji inicjowanych z Mattermost.
- `channels.mattermost.requireMention`: wymagaj `@mention` przed odpowiedzią w kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: zastąpienie wymogu wzmianki per kanał (`"*"` jako domyślne).
- Opcjonalne `channels.mattermost.defaultAccount` zastępuje domyślny wybór konta, gdy odpowiada skonfigurowanemu identyfikatorowi konta.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // opcjonalne powiązanie z kontem
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
- `channels.signal.configWrites`: zezwalaj lub odmawiaj zapisów konfiguracji inicjowanych z Signal.
- Opcjonalne `channels.signal.defaultAccount` zastępuje domyślny wybór konta, gdy odpowiada skonfigurowanemu identyfikatorowi konta.

### BlueBubbles

BlueBubbles to zalecana ścieżka dla iMessage (oparta na pluginie, konfigurowana w `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, kontrola grup i zaawansowane akcje:
      // zobacz /channels/bluebubbles
    },
  },
}
```

- Ścieżki kluczy w rdzeniu opisane tutaj: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Opcjonalne `channels.bluebubbles.defaultAccount` zastępuje domyślny wybór konta, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje BlueBubbles z trwałymi sesjami ACP. Użyj uchwytu BlueBubbles lub ciągu docelowego (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Współdzielona semantyka pól: [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
- Pełna konfiguracja kanału BlueBubbles jest opisana w [BlueBubbles](/pl/channels/bluebubbles).

### iMessage

OpenClaw uruchamia `imsg rpc` (JSON-RPC przez stdio). Nie jest wymagany demon ani port.

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

- Opcjonalne `channels.imessage.defaultAccount` zastępuje domyślny wybór konta, gdy odpowiada skonfigurowanemu identyfikatorowi konta.

- Wymaga Full Disk Access do bazy danych Messages.
- Preferuj cele `chat_id:<id>`. Użyj `imsg chats --limit 20`, aby wylistować czaty.
- `cliPath` może wskazywać na wrapper SSH; ustaw `remoteHost` (`host` lub `user@host`) dla pobierania załączników przez SCP.
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają ścieżki przychodzących załączników (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa ścisłego sprawdzania klucza hosta, więc upewnij się, że klucz hosta przekaźnika już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwalaj lub odmawiaj zapisów konfiguracji inicjowanych z iMessage.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać konwersacje iMessage z trwałymi sesjami ACP. Użyj znormalizowanego uchwytu lub jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Współdzielona semantyka pól: [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).

<Accordion title="Przykład wrappera SSH dla iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix jest obsługiwany przez rozszerzenie i konfigurowany w `channels.matrix`.

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
- `channels.matrix.proxy` kieruje ruch HTTP Matrix przez jawny proxy HTTP(S). Nazwane konta mogą to zastąpić przez `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.allowPrivateNetwork` zezwala na prywatne/wewnętrzne homeservery. `proxy` i `allowPrivateNetwork` to niezależne mechanizmy sterowania.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach wielokontowych.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzający mogą zostać rozwiązani z `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`), którzy mogą zatwierdzać żądania exec.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub regex).
  - `target`: gdzie wysyłać prośby o zatwierdzenie. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) lub `"both"`.
  - Zastąpienia per konto: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kontroluje sposób grupowania DM Matrixa w sesje: `per-user` (domyślnie) współdzieli według routowanego peera, natomiast `per-room` izoluje każdy pokój DM.
- Sondy statusu Matrix i wyszukiwania katalogowe na żywo używają tej samej polityki proxy co ruch czasu działania.
- Pełna konfiguracja Matrixa, reguły targetowania i przykłady konfiguracji są opisane w [Matrix](/pl/channels/matrix).

### Microsoft Teams

Microsoft Teams jest obsługiwany przez rozszerzenie i konfigurowany w `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, zasady zespołu/kanału:
      // zobacz /channels/msteams
    },
  },
}
```

- Ścieżki kluczy w rdzeniu opisane tutaj: `channels.msteams`, `channels.msteams.configWrites`.
- Pełna konfiguracja Teams (poświadczenia, webhook, zasady DM/grup, zastąpienia per zespół/per kanał) jest opisana w [Microsoft Teams](/pl/channels/msteams).

### IRC

IRC jest obsługiwany przez rozszerzenie i konfigurowany w `channels.irc`.

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

- Ścieżki kluczy w rdzeniu opisane tutaj: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Opcjonalne `channels.irc.defaultAccount` zastępuje domyślny wybór konta, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- Pełna konfiguracja kanału IRC (host/port/TLS/kanały/listy dozwolonych/wymóg wzmianki) jest opisana w [IRC](/pl/channels/irc).

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
- Tokeny środowiskowe mają zastosowanie tylko do konta **default**.
- Bazowe ustawienia kanału mają zastosowanie do wszystkich kont, chyba że zostaną zastąpione per konto.
- Użyj `bindings[].match.accountId`, aby kierować każde konto do innego agenta.
- Jeśli dodasz konto inne niż domyślne przez `openclaw channels add` (lub onboarding kanału), mając nadal jednokontową konfigurację najwyższego poziomu kanału, OpenClaw najpierw promuje wartości najwyższego poziomu dla pojedynczego konta do mapy kont kanału, aby pierwotne konto nadal działało. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyslny cel.
- Istniejące powiązania tylko-kanałowe (bez `accountId`) nadal dopasowują konto domyślne; powiązania zakresu kont pozostają opcjonalne.
- `openclaw doctor --fix` także naprawia mieszane kształty, przenosząc wartości najwyższego poziomu dla pojedynczego konta do promowanego konta wybranego dla tego kanału. Większość kanałów używa `accounts.default`; Matrix może zachować istniejący pasujący nazwany/domyslny cel.

### Inne kanały rozszerzeń

Wiele kanałów rozszerzeń jest konfigurowanych jako `channels.<id>` i opisanych na ich dedykowanych stronach kanałów (na przykład Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat i Twitch).
Zobacz pełny indeks kanałów: [Channels](/pl/channels).

### Wymóg wzmianki w czatach grupowych

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianka w metadanych lub bezpieczne wzorce regex). Dotyczy czatów grupowych WhatsApp, Telegram, Discord, Google Chat i iMessage.

**Typy wzmianek:**

- **Wzmianki w metadanych**: natywne wzmianki @ platformy. Ignorowane w trybie self-chat WhatsApp.
- **Wzorce tekstowe**: bezpieczne wzorce regex w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Wymóg wzmianki jest egzekwowany tylko wtedy, gdy wykrycie jest możliwe (natywne wzmianki lub co najmniej jeden wzorzec).

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

`messages.groupChat.historyLimit` ustawia globalną wartość domyślną. Kanały mogą ją zastąpić przez `channels.<channel>.historyLimit` (lub per konto). Ustaw `0`, aby wyłączyć.

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

Rozwiązywanie: zastąpienie per DM → domyślna wartość dostawcy → brak limitu (zachowywane wszystko).

Obsługiwane: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Tryb self-chat

Uwzględnij własny numer w `allowFrom`, aby włączyć tryb self-chat (ignoruje natywne wzmianki @, odpowiada tylko na wzorce tekstowe):

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
    text: true, // analizuj /commands w wiadomościach czatu
    bash: false, // zezwól na ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // zezwól na /config
    debug: false, // zezwól na /debug
    restart: false, // zezwól na /restart + narzędzie restartu gatewaya
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Szczegóły poleceń">

- Polecenia tekstowe muszą być **samodzielnymi** wiadomościami zaczynającymi się od `/`.
- `native: "auto"` włącza natywne polecenia dla Discorda/Telegrama, pozostawia Slack wyłączony.
- Zastąpienie per kanał: `channels.discord.commands.native` (bool lub `"auto"`). `false` czyści wcześniej zarejestrowane polecenia.
- `channels.telegram.customCommands` dodaje dodatkowe wpisy do menu bota Telegrama.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` i nadawcy obecnego w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczyt/zapis `openclaw.json`). Dla klientów gateway `chat.send`, trwałe zapisy `/config set|unset` wymagają także `operator.admin`; tylko do odczytu `/config show` pozostaje dostępne dla zwykłych klientów operatora z uprawnieniami zapisu.
- `channels.<provider>.configWrites` kontroluje mutacje konfiguracji per kanał (domyślnie: true).
- Dla kanałów wielokontowych `channels.<provider>.accounts.<id>.configWrites` także kontroluje zapisy, które dotyczą tego konta (na przykład `/allowlist --config --account <id>` lub `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` jest per dostawca. Gdy jest ustawione, jest to **jedyne** źródło autoryzacji (listy dozwolonych/parowanie kanału i `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala poleceniom omijać zasady grup dostępu, gdy `allowFrom` nie jest ustawione.

</Accordion>

---

## Domyślne ustawienia agenta

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

Opcjonalna domyślna lista dozwolonych Skills dla agentów, którzy nie ustawiają
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje domyślne
      { id: "locked-down", skills: [] }, // brak Skills
    ],
  },
}
```

- Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
- Pomiń `agents.list[].skills`, aby dziedziczyć wartości domyślne.
- Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
- Niepusta lista `agents.list[].skills` jest końcowym zbiorem dla tego agenta;
  nie łączy się z wartościami domyślnymi.

### `agents.defaults.skipBootstrap`

Wyłącza automatyczne tworzenie plików bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Kontroluje, kiedy pliki bootstrap workspace są wstrzykiwane do system prompt. Domyślnie: `"always"`.

- `"continuation-skip"`: bezpieczne tury kontynuacji (po zakończonej odpowiedzi asystenta) pomijają ponowne wstrzyknięcie bootstrap workspace, zmniejszając rozmiar promptu. Przebiegi heartbeat i ponowne próby po kompaktowaniu nadal odbudowują kontekst.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maksymalna liczba znaków na plik bootstrap workspace przed obcięciem. Domyślnie: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maksymalna łączna liczba znaków wstrzykniętych we wszystkich plikach bootstrap workspace. Domyślnie: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kontroluje widoczny dla agenta tekst ostrzeżenia, gdy kontekst bootstrap zostanie obcięty.
Domyślnie: `"once"`.

- `"off"`: nigdy nie wstrzykuj tekstu ostrzeżenia do system prompt.
- `"once"`: wstrzyknij ostrzeżenie raz dla każdego unikalnego podpisu obcięcia (zalecane).
- `"always"`: wstrzykuj ostrzeżenie przy każdym uruchomieniu, gdy istnieje obcięcie.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Maksymalny rozmiar pikselowy dłuższego boku obrazu w blokach obrazu transkryptu/narzędzia przed wywołaniami dostawcy.
Domyślnie: `1200`.

Niższe wartości zwykle zmniejszają zużycie vision tokenów i rozmiar ładunku żądania przy sesjach z dużą liczbą zrzutów ekranu.
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

Format czasu w system prompt. Domyślnie: `auto` (preferencje systemu operacyjnego).

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
  - Forma ciągu ustawia tylko model podstawowy.
  - Forma obiektu ustawia model podstawowy oraz uporządkowane modele awaryjne.
- `imageModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez ścieżkę narzędzia `image` jako konfiguracja modelu vision.
  - Używany także jako routing zapasowy, gdy wybrany/domyslny model nie może przyjmować obrazów.
- `imageGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną możliwość generowania obrazów oraz wszelkie przyszłe powierzchnie narzędzi/pluginów, które generują obrazy.
  - Typowe wartości: `google/gemini-3.1-flash-image-preview` dla natywnego generowania obrazów przez Gemini, `fal/fal-ai/flux/dev` dla fal lub `openai/gpt-image-1` dla OpenAI Images.
  - Jeśli wybierzesz bezpośrednio `provider/model`, skonfiguruj też odpowiednie uwierzytelnianie/klucz API dostawcy (na przykład `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla `google/*`, `OPENAI_API_KEY` dla `openai/*`, `FAL_KEY` dla `fal/*`).
  - Jeśli pole zostanie pominięte, `image_generate` nadal może wywnioskować domyślnego dostawcę na podstawie uwierzytelnienia. Najpierw próbuje bieżącego domyślnego dostawcy, potem pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców.
- `musicGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną możliwość generowania muzyki i wbudowane narzędzie `music_generate`.
  - Typowe wartości: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` lub `minimax/music-2.5+`.
  - Jeśli pole zostanie pominięte, `music_generate` nadal może wywnioskować domyślnego dostawcę na podstawie uwierzytelnienia. Najpierw próbuje bieżącego domyślnego dostawcy, potem pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców.
  - Jeśli wybierzesz bezpośrednio `provider/model`, skonfiguruj też odpowiednie uwierzytelnianie/klucz API dostawcy.
- `videoGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną możliwość generowania wideo i wbudowane narzędzie `video_generate`.
  - Typowe wartości: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` lub `qwen/wan2.7-r2v`.
  - Jeśli pole zostanie pominięte, `video_generate` nadal może wywnioskować domyślnego dostawcę na podstawie uwierzytelnienia. Najpierw próbuje bieżącego domyślnego dostawcy, potem pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców.
  - Jeśli wybierzesz bezpośrednio `provider/model`, skonfiguruj też odpowiednie uwierzytelnianie/klucz API dostawcy.
  - Dołączony dostawca generowania wideo Qwen obecnie obsługuje maksymalnie 1 wyjściowe wideo, 1 obraz wejściowy, 4 wejściowe wideo, 10 sekund czasu trwania oraz opcje na poziomie dostawcy `size`, `aspectRatio`, `resolution`, `audio` i `watermark`.
- `pdfModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez narzędzie `pdf` do routingu modelu.
  - Jeśli pole zostanie pominięte, narzędzie PDF wraca do `imageModel`, a następnie do rozwiązanego modelu sesji/domyslnego.
- `pdfMaxBytesMb`: domyślny limit rozmiaru PDF dla narzędzia `pdf`, gdy `maxBytesMb` nie jest przekazane podczas wywołania.
- `pdfMaxPages`: domyślna maksymalna liczba stron branych pod uwagę przez tryb awaryjnego wyodrębniania w narzędziu `pdf`.
- `verboseDefault`: domyślny poziom verbose dla agentów. Wartości: `"off"`, `"on"`, `"full"`. Domyślnie: `"off"`.
- `elevatedDefault`: domyślny poziom danych wyjściowych elevated dla agentów. Wartości: `"off"`, `"on"`, `"ask"`, `"full"`. Domyślnie: `"on"`.
- `model.primary`: format `provider/model` (np. `openai/gpt-5.4`). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania dokładnego identyfikatora modelu w skonfigurowanym dostawcy, a dopiero potem wraca do skonfigurowanego domyślnego dostawcy (przestarzałe zachowanie zgodności, więc preferuj jawne `provider/model`). Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw przechodzi do pierwszego skonfigurowanego dostawcy/modelu zamiast zgłaszać nieaktualny domyślny model usuniętego dostawcy.
- `models`: skonfigurowany katalog modeli i lista dozwolonych dla `/model`. Każdy wpis może zawierać `alias` (skrót) i `params` (specyficzne dla dostawcy, np. `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: globalne domyślne parametry dostawcy stosowane do wszystkich modeli. Ustawiane w `agents.defaults.params` (np. `{ cacheRetention: "long" }`).
- Priorytet scalania `params` (konfiguracja): `agents.defaults.params` (globalna baza) jest zastępowane przez `agents.defaults.models["provider/model"].params` (per model), następnie `agents.list[].params` (dla pasującego identyfikatora agenta) zastępuje klucz po kluczu. Szczegóły znajdziesz w [Prompt Caching](/pl/reference/prompt-caching).
- Narzędzia zapisujące konfigurację, które mutują te pola (na przykład `/models set`, `/models set-image` oraz polecenia dodawania/usuwania fallbacków), zapisują kanoniczną formę obiektową i w miarę możliwości zachowują istniejące listy fallbacków.
- `maxConcurrent`: maksymalna liczba równoległych uruchomień agentów między sesjami (każda sesja nadal jest serializowana). Domyślnie: 4.

**Wbudowane skróty aliasów** (mają zastosowanie tylko wtedy, gdy model jest w `agents.defaults.models`):

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

Modele Z.AI GLM-4.x automatycznie włączają tryb thinking, chyba że ustawisz `--thinking off` lub samodzielnie zdefiniujesz `agents.defaults.models["zai/<model>"].params.thinking`.
Modele Z.AI domyślnie włączają `tool_stream` dla strumieniowania wywołań narzędzi. Ustaw `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby to wyłączyć.
Modele Anthropic Claude 4.6 domyślnie używają `adaptive` thinking, gdy nie ustawiono jawnego poziomu thinking.

- Sesje są obsługiwane, gdy ustawiono `sessionArg`.
- Przekazywanie obrazów jest obsługiwane, gdy `imageArg` akceptuje ścieżki plików.

### `agents.defaults.heartbeat`

Okresowe przebiegi heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m wyłącza
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // domyślnie: false; true zachowuje tylko HEARTBEAT.md z plików bootstrap workspace
        isolatedSession: false, // domyślnie: false; true uruchamia każdy heartbeat w świeżej sesji (bez historii rozmowy)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (domyślnie) | block
        target: "none", // domyślnie: none | opcje: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: ciąg czasu trwania (ms/s/m/h). Domyślnie: `30m` (uwierzytelnianie kluczem API) lub `1h` (uwierzytelnianie OAuth). Ustaw `0m`, aby wyłączyć.
- `suppressToolErrorWarnings`: gdy true, ukrywa ostrzeżenia o błędach narzędzi podczas przebiegów heartbeat.
- `directPolicy`: zasada dostarczania bezpośredniego/DM. `allow` (domyślnie) zezwala na dostarczanie do celu bezpośredniego. `block` blokuje dostarczanie do celu bezpośredniego i emituje `reason=dm-blocked`.
- `lightContext`: gdy true, przebiegi heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap workspace.
- `isolatedSession`: gdy true, każdy heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Ten sam wzorzec izolacji co cron `sessionTarget: "isolated"`. Zmniejsza koszt tokenów na heartbeat z około 100K do około 2-5K tokenów.
- Per agent: ustaw `agents.list[].heartbeat`. Gdy jakikolwiek agent definiuje `heartbeat`, heartbeat uruchamiają **tylko ci agenci**.
- Heartbeat wykonuje pełne tury agenta — krótsze interwały zużywają więcej tokenów.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // używane, gdy identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] wyłącza ponowne wstrzyknięcie
        model: "openrouter/anthropic/claude-sonnet-4-6", // opcjonalne zastąpienie modelu tylko dla kompaktowania
        notifyUser: true, // wyślij krótkie powiadomienie po rozpoczęciu kompaktowania (domyślnie: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` lub `safeguard` (streszczanie fragmentami dla długich historii). Zobacz [Compaction](/pl/concepts/compaction).
- `timeoutSeconds`: maksymalna liczba sekund dozwolona dla pojedynczej operacji kompaktowania, po której OpenClaw ją przerywa. Domyślnie: `900`.
- `identifierPolicy`: `strict` (domyślnie), `off` lub `custom`. `strict` poprzedza streszczanie kompaktowania wbudowanymi wskazówkami zachowania nieprzezroczystych identyfikatorów.
- `identifierInstructions`: opcjonalny własny tekst zachowania identyfikatorów używany, gdy `identifierPolicy=custom`.
- `postCompactionSections`: opcjonalne nazwy sekcji H2/H3 z AGENTS.md do ponownego wstrzyknięcia po kompaktowaniu. Domyślnie `["Session Startup", "Red Lines"]`; ustaw `[]`, aby wyłączyć ponowne wstrzyknięcie. Gdy pole nie jest ustawione lub ustawione jawnie na tę domyślną parę, starsze nagłówki `Every Session`/`Safety` są także akceptowane jako starsze wartości zapasowe.
- `model`: opcjonalne zastąpienie `provider/model-id` tylko dla streszczania kompaktowania. Użyj tego, gdy główna sesja ma pozostać przy jednym modelu, ale podsumowania kompaktowania powinny działać na innym; gdy pole nie jest ustawione, kompaktowanie używa modelu podstawowego sesji.
- `notifyUser`: gdy `true`, wysyła krótkie powiadomienie do użytkownika po rozpoczęciu kompaktowania (na przykład „Compacting context...”). Domyślnie wyłączone, aby kompaktowanie pozostawało ciche.
- `memoryFlush`: cicha agentowa tura przed automatycznym kompaktowaniem w celu zapisania trwałych wspomnień. Pomijana, gdy workspace jest tylko do odczytu.

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
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Zachowanie trybu cache-ttl">

- `mode: "cache-ttl"` włącza przebiegi przycinania.
- `ttl` kontroluje, jak często przycinanie może zostać uruchomione ponownie (po ostatnim dotknięciu cache).
- Przycinanie najpierw delikatnie skraca zbyt duże wyniki narzędzi, a następnie w razie potrzeby całkowicie czyści starsze wyniki narzędzi.

**Soft-trim** zachowuje początek i koniec, a w środku wstawia `...`.

**Hard-clear** zastępuje cały wynik narzędzia placeholderem.

Uwagi:

- Bloki obrazów nigdy nie są przycinane/czyszczone.
- Współczynniki są oparte na znakach (w przybliżeniu), a nie na dokładnej liczbie tokenów.
- Jeśli istnieje mniej niż `keepLastAssistants` wiadomości asystenta, przycinanie jest pomijane.

</Accordion>

Szczegóły zachowania znajdziesz w [Session Pruning](/pl/concepts/session-pruning).

### Strumieniowanie blokowe

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
- Zastąpienia kanału: `channels.<channel>.blockStreamingCoalesce` (oraz warianty per konto). Signal/Slack/Discord/Google Chat domyślnie używają `minChars: 1500`.
- `humanDelay`: losowa pauza między odpowiedziami blokowymi. `natural` = 800–2500ms. Zastąpienie per agent: `agents.list[].humanDelay`.

Szczegóły zachowania i dzielenia na fragmenty znajdziesz w [Streaming](/pl/concepts/streaming).

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
- Zastąpienia per sesja: `session.typingMode`, `session.typingIntervalSeconds`.

Zobacz [Typing Indicators](/pl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Opcjonalne sandboxing dla osadzonego agenta. Pełny przewodnik znajdziesz w [Sandboxing](/pl/gateway/sandboxing).

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
          // SecretRef / zawartości inline także są obsługiwane:
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

<Accordion title="Szczegóły sandbox">

**Backend:**

- `docker`: lokalne środowisko Docker (domyślnie)
- `ssh`: ogólne zdalne środowisko oparte na SSH
- `openshell`: środowisko OpenShell

Gdy wybrano `backend: "openshell"`, ustawienia specyficzne dla środowiska są przenoszone do
`plugins.entries.openshell.config`.

**Konfiguracja backendu SSH:**

- `target`: cel SSH w postaci `user@host[:port]`
- `command`: polecenie klienta SSH (domyślnie: `ssh`)
- `workspaceRoot`: bezwzględny zdalny katalog główny używany dla workspace per scope
- `identityFile` / `certificateFile` / `knownHostsFile`: istniejące lokalne pliki przekazywane do OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: zawartości inline lub SecretRef, które OpenClaw materializuje do plików tymczasowych w czasie działania
- `strictHostKeyChecking` / `updateHostKeys`: parametry zasad kluczy hosta OpenSSH

**Priorytet uwierzytelniania SSH:**

- `identityData` ma pierwszeństwo przed `identityFile`
- `certificateData` ma pierwszeństwo przed `certificateFile`
- `knownHostsData` ma pierwszeństwo przed `knownHostsFile`
- Wartości `*Data` oparte na SecretRef są rozwiązywane z aktywnej migawki czasu działania sekretów przed uruchomieniem sesji sandbox

**Zachowanie backendu SSH:**

- zasiewa zdalny workspace raz po utworzeniu lub odtworzeniu
- następnie utrzymuje zdalny workspace SSH jako kanoniczny
- kieruje `exec`, narzędzia plikowe i ścieżki mediów przez SSH
- nie synchronizuje automatycznie zdalnych zmian z powrotem do hosta
- nie obsługuje kontenerów przeglądarki sandbox

**Dostęp do workspace:**

- `none`: workspace sandbox per scope w `~/.openclaw/sandboxes`
- `ro`: workspace sandbox pod `/workspace`, workspace agenta montowany tylko do odczytu pod `/agent`
- `rw`: workspace agenta montowany do odczytu i zapisu pod `/workspace`

**Scope:**

- `session`: kontener + workspace per sesja
- `agent`: jeden kontener + workspace na agenta (domyślnie)
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
          gateway: "lab", // opcjonalnie
          gatewayEndpoint: "https://lab.example", // opcjonalnie
          policy: "strict", // opcjonalny identyfikator polityki OpenShell
          providers: ["openai"], // opcjonalnie
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Tryb OpenShell:**

- `mirror`: zasiej zdalne z lokalnego przed exec, zsynchronizuj z powrotem po exec; lokalny workspace pozostaje kanoniczny
- `remote`: zasiej zdalne raz podczas tworzenia sandbox, następnie utrzymuj zdalny workspace jako kanoniczny

W trybie `remote` lokalne edycje hosta wykonane poza OpenClaw nie są automatycznie synchronizowane do sandbox po kroku zasiewania.
Transport odbywa się przez SSH do sandbox OpenShell, ale cykl życia sandbox i opcjonalną synchronizację mirror kontroluje plugin.

**`setupCommand`** uruchamia się raz po utworzeniu kontenera (przez `sh -lc`). Wymaga dostępu do sieci wychodzącej, zapisywalnego katalogu głównego i użytkownika root.

**Kontenery domyślnie używają `network: "none"`** — ustaw `"bridge"` (lub własną sieć bridge), jeśli agent potrzebuje dostępu wychodzącego.
`"host"` jest zablokowane. `"container:<id>"` jest domyślnie zablokowane, chyba że jawnie ustawisz
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (tryb break-glass).

**Przychodzące załączniki** są stagingowane do `media/inbound/*` w aktywnym workspace.

**`docker.binds`** montuje dodatkowe katalogi hosta; globalne i per agent bindy są scalane.

**Przeglądarka sandbox** (`sandbox.browser.enabled`): Chromium + CDP w kontenerze. URL noVNC jest wstrzykiwany do system prompt. Nie wymaga `browser.enabled` w `openclaw.json`.
Dostęp obserwatora noVNC domyślnie używa uwierzytelniania VNC, a OpenClaw emituje krótko żyjący URL z tokenem (zamiast ujawniać hasło we współdzielonym URL-u).

- `allowHostControl: false` (domyślnie) blokuje sesjom sandbox targetowanie przeglądarki hosta.
- `network` domyślnie ma wartość `openclaw-sandbox-browser` (dedykowana sieć bridge). Ustaw `bridge` tylko wtedy, gdy jawnie chcesz globalnej łączności bridge.
- `cdpSourceRange` opcjonalnie ogranicza wejście CDP na krawędzi kontenera do zakresu CIDR (na przykład `172.21.0.1/32`).
- `sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko do kontenera przeglądarki sandbox. Gdy jest ustawione (także `[]`), zastępuje `docker.binds` dla kontenera przeglądarki.
- Domyślne parametry uruchomienia są zdefiniowane w `scripts/sandbox-browser-entrypoint.sh` i dostrojone dla hostów kontenerowych:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ponownie włącza rozszerzenia, jeśli Twój workflow
    od nich zależy.
  - `--renderer-process-limit=2` można zmienić przez
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ustaw `0`, aby użyć
    domyślnego limitu procesów Chromium.
  - plus `--no-sandbox` i `--disable-setuid-sandbox`, gdy włączono `noSandbox`.
  - Wartości domyślne są bazą obrazu kontenera; użyj własnego obrazu przeglądarki z własnym
    entrypointem, aby zmienić domyślne ustawienia kontenera.

</Accordion>

Sandboxing przeglądarki i `sandbox.docker.binds` są obecnie dostępne tylko dla Docker.

Budowa obrazów:

```bash
scripts/sandbox-setup.sh           # główny obraz sandbox
scripts/sandbox-browser-setup.sh   # opcjonalny obraz przeglądarki
```

### `agents.list` (zastąpienia per agent)

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
        thinkingDefault: "high", // zastąpienie poziomu thinking per agent
        reasoningDefault: "on", // zastąpienie widoczności reasoning per agent
        fastModeDefault: false, // zastąpienie trybu szybkiego per agent
        params: { cacheRetention: "none" }, // zastępuje klucze pasujących defaults.models params
        skills: ["docs-search"], // zastępuje agents.defaults.skills, gdy ustawione
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
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
- `default`: gdy ustawiono wiele, wygrywa pierwszy (logowane jest ostrzeżenie). Jeśli nie ustawiono żadnego, domyślny jest pierwszy wpis listy.
- `model`: forma ciągu zastępuje tylko `primary`; forma obiektu `{ primary, fallbacks }` zastępuje oba (`[]` wyłącza globalne fallbacki). Zadania cron, które zastępują tylko `primary`, nadal dziedziczą domyślne fallbacki, chyba że ustawisz `fallbacks: []`.
- `params`: parametry strumienia per agent, scalane na wpisie wybranego modelu w `agents.defaults.models`. Użyj tego do nadpisań specyficznych dla agenta, takich jak `cacheRetention`, `temperature` lub `maxTokens`, bez duplikowania całego katalogu modeli.
- `skills`: opcjonalna lista dozwolonych Skills per agent. Jeśli jest pominięta, agent dziedziczy `agents.defaults.skills`, jeśli są ustawione; jawna lista zastępuje wartości domyślne zamiast je scalać, a `[]` oznacza brak Skills.
- `thinkingDefault`: opcjonalny domyślny poziom thinking per agent (`off | minimal | low | medium | high | xhigh | adaptive`). Zastępuje `agents.defaults.thinkingDefault` dla tego agenta, gdy nie ustawiono zastąpienia per wiadomość ani per sesja.
- `reasoningDefault`: opcjonalna domyślna widoczność reasoning per agent (`on | off | stream`). Ma zastosowanie, gdy nie ustawiono zastąpienia reasoning per wiadomość ani per sesja.
- `fastModeDefault`: opcjonalna wartość domyślna trybu szybkiego per agent (`true | false`). Ma zastosowanie, gdy nie ustawiono trybu szybkiego per wiadomość ani per sesja.
- `runtime`: opcjonalny deskryptor środowiska wykonawczego per agent. Użyj `type: "acp"` z domyślnymi wartościami `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), gdy agent ma domyślnie używać sesji harness ACP.
- `identity.avatar`: ścieżka względna do workspace, URL `http(s)` lub URI `data:`.
- `identity` wyprowadza wartości domyślne: `ackReaction` z `emoji`, `mentionPatterns` z `name`/`emoji`.
- `subagents.allowAgents`: lista dozwolonych identyfikatorów agentów dla `sessions_spawn` (`["*"]` = dowolny; domyślnie: tylko ten sam agent).
- Ochrona dziedziczenia sandbox: jeśli sesja żądająca jest sandboxowana, `sessions_spawn` odrzuca cele, które działałyby bez sandbox.
- `subagents.requireAgentId`: gdy true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu; domyślnie: false).

---

## Routing wielu agentów

Uruchamiaj wielu izolowanych agentów wewnątrz jednego Gatewaya. Zobacz [Multi-Agent](/pl/concepts/multi-agent).

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

### Pola dopasowania powiązań

- `type` (opcjonalne): `route` dla zwykłego routingu (brak `type` domyślnie oznacza route), `acp` dla trwałych powiązań konwersacji ACP.
- `match.channel` (wymagane)
- `match.accountId` (opcjonalne; `*` = dowolne konto; pominięcie = konto domyślne)
- `match.peer` (opcjonalne; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcjonalne; zależne od kanału)
- `acp` (opcjonalne; tylko dla `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministyczna kolejność dopasowania:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (dokładne, bez peer/guild/team)
5. `match.accountId: "*"` (na poziomie całego kanału)
6. Domyślny agent

W obrębie każdego poziomu wygrywa pierwszy pasujący wpis `bindings`.

Dla wpisów `type: "acp"` OpenClaw rozwiązuje po dokładnej tożsamości konwersacji (`match.channel` + konto + `match.peer.id`) i nie używa powyższej kolejności poziomów powiązań route.

### Profile dostępu per agent

<Accordion title="Pełny dostęp (bez sandbox)">

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

<Accordion title="Narzędzia i workspace tylko do odczytu">

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

Szczegóły pierwszeństwa znajdziesz w [Multi-Agent Sandbox & Tools](/pl/tools/multi-agent-sandbox-tools).

---

## Sesja

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
      idleHours: 24, // domyślny czas automatycznego odfokusowania po bezczynności w godzinach (`0` wyłącza)
      maxAgeHours: 0, // domyślny twardy maksymalny wiek w godzinach (`0` wyłącza)
    },
    mainKey: "main", // starsze (czas działania zawsze używa "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Szczegóły pól sesji">

- **`scope`**: bazowa strategia grupowania sesji dla kontekstów czatów grupowych.
  - `per-sender` (domyślnie): każdy nadawca otrzymuje izolowaną sesję w kontekście kanału.
  - `global`: wszyscy uczestnicy kontekstu kanału współdzielą jedną sesję (używaj tylko wtedy, gdy współdzielony kontekst jest zamierzony).
- **`dmScope`**: sposób grupowania DM.
  - `main`: wszystkie DM współdzielą główną sesję.
  - `per-peer`: izolacja według identyfikatora nadawcy między kanałami.
  - `per-channel-peer`: izolacja per kanał + nadawca (zalecane dla skrzynek wielu użytkowników).
  - `per-account-channel-peer`: izolacja per konto + kanał + nadawca (zalecane dla wielu kont).
- **`identityLinks`**: mapuje kanoniczne identyfikatory na peery z prefiksem dostawcy dla współdzielenia sesji między kanałami.
- **`reset`**: podstawowa zasada resetu. `daily` resetuje o `atHour` czasu lokalnego; `idle` resetuje po `idleMinutes`. Gdy skonfigurowano oba, wygrywa to, które wygaśnie wcześniej.
- **`resetByType`**: zastąpienia per typ (`direct`, `group`, `thread`). Starsze `dm` jest akceptowane jako alias `direct`.
- **`parentForkMaxTokens`**: maksymalna liczba `totalTokens` sesji nadrzędnej dozwolona przy tworzeniu forkowanej sesji wątku (domyślnie `100000`).
  - Jeśli `totalTokens` sesji nadrzędnej jest powyżej tej wartości, OpenClaw rozpoczyna świeżą sesję wątku zamiast dziedziczyć historię transkryptu sesji nadrzędnej.
  - Ustaw `0`, aby wyłączyć tę ochronę i zawsze pozwalać na forki z rodzica.
- **`mainKey`**: starsze pole. Czas działania zawsze używa teraz `"main"` dla głównego zasobnika czatu bezpośredniego.
- **`agentToAgent.maxPingPongTurns`**: maksymalna liczba tur odpowiedzi zwrotnych między agentami podczas wymian agent-agent (liczba całkowita, zakres: `0`–`5`). `0` wyłącza łańcuchowanie ping-pong.
- **`sendPolicy`**: dopasowanie po `channel`, `chatType` (`direct|group|channel`, ze starszym aliasem `dm`), `keyPrefix` lub `rawKeyPrefix`. Pierwszy deny wygrywa.
- **`maintenance`**: czyszczenie magazynu sesji + mechanizmy retencji.
  - `mode`: `warn` tylko emituje ostrzeżenia; `enforce` stosuje czyszczenie.
  - `pruneAfter`: próg wieku dla nieaktualnych wpisów (domyślnie `30d`).
  - `maxEntries`: maksymalna liczba wpisów w `sessions.json` (domyślnie `500`).
  - `rotateBytes`: obracaj `sessions.json`, gdy przekroczy ten rozmiar (domyślnie `10mb`).
  - `resetArchiveRetention`: retencja dla archiwów transkryptów `*.reset.<timestamp>`. Domyślnie odpowiada `pruneAfter`; ustaw `false`, aby wyłączyć.
  - `maxDiskBytes`: opcjonalny budżet miejsca na dysku dla katalogu sesji. W trybie `warn` loguje ostrzeżenia; w trybie `enforce` najpierw usuwa najstarsze artefakty/sesje.
  - `highWaterBytes`: opcjonalny cel po czyszczeniu budżetu. Domyślnie `80%` wartości `maxDiskBytes`.
- **`threadBindings`**: globalne wartości domyślne dla funkcji sesji powiązanych z wątkami.
  - `enabled`: główny domyślny przełącznik (dostawcy mogą zastąpić; Discord używa `channels.discord.threadBindings.enabled`)
  - `idleHours`: domyślny czas automatycznego odfokusowania po bezczynności w godzinach (`0` wyłącza; dostawcy mogą zastąpić)
  - `maxAgeHours`: domyślny twardy maksymalny wiek w godzinach (`0` wyłącza; dostawcy mogą zastąpić)

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

Zastąpienia per kanał/konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Rozwiązywanie (najbardziej szczegółowe wygrywa): konto → kanał → globalne. `""` wyłącza i zatrzymuje kaskadę. `"auto"` wyprowadza `[{identity.name}]`.

**Zmienne szablonu:**

| Zmienna          | Opis                    | Przykład                    |
| ---------------- | ----------------------- | --------------------------- |
| `{model}`        | Krótka nazwa modelu     | `claude-opus-4-6`           |
| `{modelFull}`    | Pełny identyfikator modelu | `anthropic/claude-opus-4-6` |
| `{provider}`     | Nazwa dostawcy          | `anthropic`                 |
| `{thinkingLevel}` | Bieżący poziom thinking | `high`, `low`, `off`        |
| `{identity.name}` | Nazwa tożsamości agenta | (to samo co `"auto"`)       |

Zmienne nie rozróżniają wielkości liter. `{think}` jest aliasem dla `{thinkingLevel}`.

### Reakcja ack

- Domyślnie używa `identity.emoji` aktywnego agenta, w przeciwnym razie `"👀"`. Ustaw `""`, aby wyłączyć.
- Zastąpienia per kanał: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Kolejność rozwiązywania: konto → kanał → `messages.ackReaction` → zapasowa wartość z identity.
- Zakres: `group-mentions` (domyślnie), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: usuwa ack po odpowiedzi w Slack, Discord i Telegram.
- `messages.statusReactions.enabled`: włącza reakcje statusowe cyklu życia w Slack, Discord i Telegram.
  W Slack i Discord pozostawienie nieustawionego pola zachowuje reakcje statusowe włączone, gdy aktywne są reakcje ack.
  W Telegram ustaw to jawnie na `true`, aby włączyć reakcje statusowe cyklu życia.

### Debounce przychodzących wiadomości

Łączy szybkie wiadomości tekstowe od tego samego nadawcy w jedną turę agenta. Media/załączniki są opróżniane natychmiast. Polecenia sterujące omijają debounce.

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

- `auto` steruje automatycznym TTS. `/tts off|always|inbound|tagged` zastępuje to per sesja.
- `summaryModel` zastępuje `agents.defaults.model.primary` dla automatycznego podsumowania.
- `modelOverrides` jest domyślnie włączone; `modelOverrides.allowProvider` domyślnie ma wartość `false` (opt-in).
- Klucze API wracają do `ELEVENLABS_API_KEY`/`XI_API_KEY` oraz `OPENAI_API_KEY`.
- `openai.baseUrl` zastępuje punkt końcowy OpenAI TTS. Kolejność rozwiązywania: konfiguracja, potem `OPENAI_TTS_BASE_URL`, potem `https://api.openai.com/v1`.
- Gdy `openai.baseUrl` wskazuje na punkt końcowy inny niż OpenAI, OpenClaw traktuje go jako serwer TTS zgodny z OpenAI i łagodzi walidację modelu/głosu.

---

## Talk

Wartości domyślne dla trybu Talk (macOS/iOS/Android).

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

- `talk.provider` musi odpowiadać kluczowi w `talk.providers`, gdy skonfigurowano wielu dostawców Talk.
- Starsze płaskie klucze Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) są tylko dla zgodności i są automatycznie migrowane do `talk.providers.<provider>`.
- Identyfikatory głosu wracają do `ELEVENLABS_VOICE_ID` lub `SAG_VOICE_ID`.
- `providers.*.apiKey` akceptuje zwykłe ciągi znaków lub obiekty SecretRef.
- Zapasowy `ELEVENLABS_API_KEY` ma zastosowanie tylko wtedy, gdy nie skonfigurowano klucza API Talk.
- `providers.*.voiceAliases` pozwala dyrektywom Talk używać przyjaznych nazw.
- `silenceTimeoutMs` określa, jak długo tryb Talk czeka po ciszy użytkownika, zanim wyśle transkrypt. Pozostawienie nieustawionego pola zachowuje domyślne okno pauzy platformy (`700 ms na macOS i Androidzie, 900 ms na iOS`).

---

## Narzędzia

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych przed `tools.allow`/`tools.deny`:

Lokalny onboarding domyślnie ustawia nowe lokalne konfiguracje na `tools.profile: "coding"` gdy pole jest nieustawione (istniejące jawne profile są zachowywane).

| Profil      | Zawiera                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | tylko `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Bez ograniczeń (to samo co brak ustawienia)                                                                                     |

### Grupy narzędzi

| Grupa              | Narzędzia                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` jest akceptowane jako alias `exec`)                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | Wszystkie wbudowane narzędzia (bez pluginów dostawców)                                                                 |

### `tools.allow` / `tools.deny`

Globalna zasada allow/deny dla narzędzi (deny wygrywa). Bez rozróżniania wielkości liter, obsługa wildcardów `*`. Stosowane nawet wtedy, gdy sandbox Docker jest wyłączony.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Dalsze ograniczenie narzędzi dla określonych dostawców lub modeli. Kolejność: profil bazowy → profil dostawcy → allow/deny.

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

Kontroluje podwyższony dostęp exec poza sandbox:

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

- Zastąpienie per agent (`agents.list[].tools.elevated`) może jedynie dalej ograniczać.
- `/elevated on|off|ask|full` zapisuje stan per sesja; dyrektywy inline dotyczą pojedynczej wiadomości.
- Podwyższone `exec` omija sandbox i używa skonfigurowanej ścieżki ucieczki (`gateway` domyślnie albo `node`, gdy celem exec jest `node`).

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
Ustawienia mogą być zdefiniowane globalnie w `tools.loopDetection` i zastępowane per agent w `agents.list[].tools.loopDetection`.

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

- `historySize`: maksymalna historia wywołań narzędzi zachowywana do analizy pętli.
- `warningThreshold`: próg ostrzeżeń dla powtarzających się wzorców bez postępu.
- `criticalThreshold`: wyższy próg blokowania krytycznych pętli.
- `globalCircuitBreakerThreshold`: twardy próg zatrzymania dla dowolnego przebiegu bez postępu.
- `detectors.genericRepeat`: ostrzegaj przy powtarzających się wywołaniach tego samego narzędzia z tymi samymi argumentami.
- `detectors.knownPollNoProgress`: ostrzegaj/blokuj dla znanych narzędzi poll (`process.poll`, `command_status` itd.).
- `detectors.pingPong`: ostrzegaj/blokuj dla naprzemiennych wzorców par bez postępu.
- Jeśli `warningThreshold >= criticalThreshold` lub `criticalThreshold >= globalCircuitBreakerThreshold`, walidacja zakończy się niepowodzeniem.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // lub BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opcjonalnie; pomiń dla auto-detect
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
        directSend: false, // opt-in: wyślij ukończone asynchroniczne music/video bezpośrednio do kanału
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
- `model`: zastąpienie identyfikatora modelu
- `profile` / `preferredProfile`: wybór profilu `auth-profiles.json`

**Wpis CLI** (`type: "cli"`):

- `command`: wykonywalne polecenie do uruchomienia
- `args`: sparametryzowane argumenty (obsługuje `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` itd.)

**Pola wspólne:**

- `capabilities`: opcjonalna lista (`image`, `audio`, `video`). Domyślnie: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: zastąpienia per wpis.
- Błędy przechodzą do kolejnego wpisu fallback.

Uwierzytelnianie dostawcy używa standardowej kolejności: `auth-profiles.json` → zmienne środowiskowe → `models.providers.*.apiKey`.

**Pola asynchronicznego ukończenia:**

- `asyncCompletion.directSend`: gdy `true`, ukończone asynchroniczne zadania `music_generate`
  i `video_generate` najpierw próbują bezpośredniego dostarczenia do kanału. Domyślnie: `false`
  (starsza ścieżka wybudzania sesji żądającej/dostarczania modelu).

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

Kontroluje, które sesje mogą być celem dla narzędzi sesji (`sessions_list`, `sessions_history`, `sessions_send`).

Domyślnie: `tree` (bieżąca sesja + sesje uruchomione przez nią, takie jak subagenci).

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
- `tree`: bieżąca sesja + sesje uruchomione przez bieżącą sesję (subagenci).
- `agent`: dowolna sesja należąca do bieżącego identyfikatora agenta (może obejmować innych użytkowników, jeśli uruchamiasz sesje per nadawca pod tym samym identyfikatorem agenta).
- `all`: dowolna sesja. Targetowanie między agentami nadal wymaga `tools.agentToAgent`.
- Zacisk sandbox: gdy bieżąca sesja jest sandboxowana i `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, widoczność jest wymuszana do `tree`, nawet jeśli `tools.sessions.visibility="all"`.

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
        retainOnSessionKeep: false, // zachowaj załączniki przy cleanup="keep"
      },
    },
  },
}
```

Uwagi:

- Załączniki są obsługiwane tylko dla `runtime: "subagent"`. Środowisko ACP je odrzuca.
- Pliki są materializowane w workspace potomnym pod `.openclaw/attachments/<uuid>/` wraz z `.manifest.json`.
- Zawartość załączników jest automatycznie redagowana z trwałego zapisu transkryptu.
- Dane wejściowe base64 są walidowane z rygorystycznym sprawdzaniem alfabetu/dopełnienia oraz ochroną rozmiaru przed dekodowaniem.
- Uprawnienia plików to `0700` dla katalogów i `0600` dla plików.
- Czyszczenie podąża za polityką `cleanup`: `delete` zawsze usuwa załączniki; `keep` zachowuje je tylko wtedy, gdy `retainOnSessionKeep: true`.

### `tools.experimental`

Eksperymentalne flagi wbudowanych narzędzi. Domyślnie wyłączone, chyba że obowiązuje reguła automatycznego włączenia specyficzna dla środowiska wykonawczego.

```json5
{
  tools: {
    experimental: {
      planTool: true, // włącz eksperymentalne update_plan
    },
  },
}
```

Uwagi:

- `planTool`: włącza strukturalne narzędzie `update_plan` do śledzenia nietrywialnej pracy wieloetapowej.
- Domyślnie: `false` dla dostawców innych niż OpenAI. Uruchomienia OpenAI i OpenAI Codex włączają je automatycznie.
- Gdy jest włączone, system prompt dodaje także wskazówki użycia, aby model używał go tylko dla znaczącej pracy i utrzymywał co najwyżej jeden krok `in_progress`.

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

- `model`: domyślny model dla uruchamianych subagentów. Jeśli pole zostanie pominięte, subagenci dziedziczą model wywołującego.
- `allowAgents`: domyślna lista dozwolonych docelowych identyfikatorów agentów dla `sessions_spawn`, gdy agent żądający nie ustawia własnego `subagents.allowAgents` (`["*"]` = dowolny; domyślnie: tylko ten sam agent).
- `runTimeoutSeconds`: domyślny timeout (sekundy) dla `sessions_spawn`, gdy wywołanie narzędzia pomija `runTimeoutSeconds`. `0` oznacza brak limitu czasu.
- Zasada narzędzi per subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Własni dostawcy i base URL

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

- Użyj `authHeader: true` + `headers` dla własnych potrzeb uwierzytelniania.
- Zastąp katalog główny konfiguracji agenta przez `OPENCLAW_AGENT_DIR` (lub `PI_CODING_AGENT_DIR`, starszy alias zmiennej środowiskowej).
- Priorytet scalania dla pasujących identyfikatorów dostawców:
  - Niepuste wartości `baseUrl` z agent `models.json` mają pierwszeństwo.
  - Niepuste wartości `apiKey` agenta mają pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
  - Wartości `apiKey` dostawcy zarządzane przez SecretRef są odświeżane z markerów źródłowych (`ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec) zamiast utrwalać rozwiązane sekrety.
  - Wartości nagłówków dostawcy zarządzane przez SecretRef są odświeżane z markerów źródłowych (`secretref-env:ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec).
  - Puste lub brakujące `apiKey`/`baseUrl` agenta wracają do `models.providers` w konfiguracji.
  - Pasujące `contextWindow`/`maxTokens` modelu używają wyższej wartości z jawnej konfiguracji i niejawnych wartości katalogowych.
  - Pasujące `contextTokens` modelu zachowuje jawny limit czasu działania, jeśli istnieje; użyj go, aby ograniczyć efektywny kontekst bez zmieniania natywnych metadanych modelu.
  - Użyj `models.mode: "replace"`, jeśli chcesz, aby konfiguracja całkowicie przepisała `models.json`.
  - Trwałość markerów jest źródłowo autorytatywna: markery są zapisywane z aktywnej migawki konfiguracji źródłowej (przed rozwiązaniem), a nie z rozwiązanych wartości sekretów w czasie działania.

### Szczegóły pól dostawcy

- `models.mode`: zachowanie katalogu dostawców (`merge` lub `replace`).
- `models.providers`: mapa własnych dostawców kluczowana identyfikatorem dostawcy.
- `models.providers.*.api`: adapter żądań (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` itd.).
- `models.providers.*.apiKey`: poświadczenie dostawcy (preferuj SecretRef/podstawienie env).
- `models.providers.*.auth`: strategia uwierzytelniania (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: dla Ollama + `openai-completions`, wstrzykuj `options.num_ctx` do żądań (domyślnie: `true`).
- `models.providers.*.authHeader`: wymuś transport poświadczenia w nagłówku `Authorization`, gdy jest to wymagane.
- `models.providers.*.baseUrl`: nadrzędny base URL API.
- `models.providers.*.headers`: dodatkowe statyczne nagłówki do routingu proxy/tenant.
- `models.providers.*.request`: zastąpienia transportu dla żądań HTTP dostawcy modeli.
  - `request.headers`: dodatkowe nagłówki (scalane z domyślnymi dostawcy). Wartości akceptują SecretRef.
  - `request.auth`: zastąpienie strategii uwierzytelniania. Tryby: `"provider-default"` (użyj wbudowanego uwierzytelniania dostawcy), `"authorization-bearer"` (z `token`), `"header"` (z `headerName`, `value`, opcjonalnie `prefix`).
  - `request.proxy`: zastąpienie proxy HTTP. Tryby: `"env-proxy"` (użyj zmiennych środowiskowych `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (z `url`). Oba tryby akceptują opcjonalny podobiekt `tls`.
  - `request.tls`: zastąpienie TLS dla połączeń bezpośrednich. Pola: `ca`, `cert`, `key`, `passphrase` (wszystkie akceptują SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: jawne wpisy katalogu modeli dostawcy.
- `models.providers.*.models.*.contextWindow`: natywne metadane okna kontekstu modelu.
- `models.providers.*.models.*.contextTokens`: opcjonalny limit kontekstu czasu działania. Użyj tego, gdy chcesz mniejszego efektywnego budżetu kontekstu niż natywne `contextWindow` modelu.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: opcjonalna wskazówka zgodności. Dla `api: "openai-completions"` z niepustym nienatywnym `baseUrl` (host nie jest `api.openai.com`) OpenClaw wymusza w czasie działania `false`. Puste/pominięte `baseUrl` zachowuje domyślne zachowanie OpenAI.
- `plugins.entries.amazon-bedrock.config.discovery`: katalog główny ustawień auto-discovery Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: włącz/wyłącz niejawne discovery.
- `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS dla discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: opcjonalny filtr identyfikatora dostawcy dla ukierunkowanego discovery.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interwał odświeżania pollingowego dla discovery.
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

- Ogólny punkt końcowy: `https://api.z.ai/api/paas/v4`
- Punkt końcowy coding (domyślny): `https://api.z.ai/api/coding/paas/v4`
- Dla ogólnego punktu końcowego zdefiniuj własnego dostawcę z zastąpieniem base URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
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
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Dla punktu końcowego w Chinach: `baseUrl: "https://api.moonshot.cn/v1"` lub `openclaw onboard --auth-choice moonshot-api-key-cn`.

Natywne punkty końcowe Moonshot reklamują zgodność użycia strumieniowania na współdzielonym
transporcie `openai-completions`, a OpenClaw opiera to teraz na możliwościach punktu końcowego,
a nie wyłącznie na identyfikatorze wbudowanego dostawcy.

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
Katalog modeli domyślnie używa teraz tylko M2.7.
Na ścieżce strumieniowania zgodnej z Anthropic OpenClaw domyślnie wyłącza thinking MiniMax,
chyba że jawnie ustawisz `thinking`. `/fast on` lub
`params.fastMode: true` przepisuje `MiniMax-M2.7` na
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modele lokalne (LM Studio)">

Zobacz [Local Models](/pl/gateway/local-models). W skrócie: uruchom duży model lokalny przez LM Studio Responses API na wydajnym sprzęcie; zachowaj połączone modele hostowane jako fallback.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // lub zwykły ciąg znaków
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: opcjonalna lista dozwolonych tylko dla dołączonych Skills (zarządzane/workspace Skills nie są objęte).
- `load.extraDirs`: dodatkowe współdzielone katalogi główne Skills (najniższy priorytet).
- `install.preferBrew`: gdy true, preferuj instalatory Homebrew, jeśli `brew` jest
  dostępne, zanim nastąpi przejście do innych typów instalatorów.
- `install.nodeManager`: preferencja instalatora node dla specyfikacji `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` wyłącza Skill nawet wtedy, gdy jest dołączony/zainstalowany.
- `entries.<skillKey>.apiKey`: wygodne pole klucza API dla Skills deklarujących podstawową zmienną env (zwykły ciąg znaków lub obiekt SecretRef).

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

- Ładowane z `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` oraz `plugins.load.paths`.
- Discovery akceptuje natywne pluginy OpenClaw oraz zgodne bund­le Codex i Claude, w tym bund­le Claude bez manifestu w domyślnym układzie.
- **Zmiany konfiguracji wymagają restartu gatewaya.**
- `allow`: opcjonalna lista dozwolonych (ładują się tylko wymienione pluginy). `deny` wygrywa.
- `plugins.entries.<id>.apiKey`: wygodne pole klucza API na poziomie pluginu (gdy plugin to obsługuje).
- `plugins.entries.<id>.env`: mapa zmiennych środowiskowych w zakresie pluginu.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy `false`, rdzeń blokuje `before_prompt_build` i ignoruje pola mutujące prompt ze starszego `before_agent_start`, zachowując starsze `modelOverride` i `providerOverride`. Dotyczy natywnych hooków pluginów i obsługiwanych katalogów hooków dostarczanych przez bund­le.
- `plugins.entries.<id>.subagent.allowModelOverride`: jawnie zaufaj temu pluginowi, że może żądać zastąpień `provider` i `model` per uruchomienie dla przebiegów subagentów w tle.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych zastąpień subagentów. Używaj `"*"` tylko wtedy, gdy świadomie chcesz dopuścić dowolny model.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez plugin (walidowany przez natywny schemat pluginu OpenClaw, jeśli jest dostępny).
- `plugins.entries