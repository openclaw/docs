---
read_when:
    - Potrzebujesz dokładnej semantyki konfiguracji na poziomie pól lub wartości domyślnych
    - Weryfikujesz bloki konfiguracji kanału, modelu, Gateway lub narzędzia
summary: Dokumentacja konfiguracji Gateway dla podstawowych kluczy OpenClaw, wartości domyślnych i odnośników do dedykowanych dokumentacji podsystemów
title: Dokumentacja konfiguracji
x-i18n:
    generated_at: "2026-04-22T09:51:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0d6fc076f54e84bef5beefbcc42d8f172cc79792c716f76103894303e3042ac
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Dokumentacja konfiguracji

Podstawowa dokumentacja konfiguracji dla `~/.openclaw/openclaw.json`. Aby zobaczyć omówienie zorientowane na zadania, przejdź do [Konfiguracja](/pl/gateway/configuration).

Ta strona obejmuje główne obszary konfiguracji OpenClaw i odsyła dalej, gdy dany podsystem ma własną, bardziej szczegółową dokumentację. **Nie** próbuje umieszczać na jednej stronie pełnego katalogu poleceń należących do kanałów/pluginów ani wszystkich szczegółowych ustawień pamięci/QMD.

Źródło prawdy w kodzie:

- `openclaw config schema` wypisuje aktualny JSON Schema używany do walidacji i interfejsu Control UI, z dołączonymi metadanymi bundled/plugin/channel, gdy są dostępne
- `config.schema.lookup` zwraca jeden węzeł schematu ograniczony do ścieżki dla narzędzi do szczegółowej analizy
- `pnpm config:docs:check` / `pnpm config:docs:gen` weryfikują hash baseline dokumentacji konfiguracji względem bieżącej powierzchni schematu

Dedykowane szczegółowe dokumentacje:

- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config) dla `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` oraz konfiguracji Dreaming w `plugins.entries.memory-core.config.dreaming`
- [Polecenia ukośnikowe](/pl/tools/slash-commands) dla aktualnego wbudowanego + bundled katalogu poleceń
- strony właścicieli kanałów/pluginów dla powierzchni poleceń specyficznych dla kanału

Format konfiguracji to **JSON5** (dozwolone komentarze i końcowe przecinki). Wszystkie pola są opcjonalne — OpenClaw używa bezpiecznych wartości domyślnych, gdy są pominięte.

---

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że `enabled: false`).

### Dostęp do wiadomości prywatnych i grup

Wszystkie kanały obsługują zasady dla wiadomości prywatnych i grup:

| Zasada DM            | Działanie                                                      |
| -------------------- | -------------------------------------------------------------- |
| `pairing` (domyślna) | Nieznani nadawcy otrzymują jednorazowy kod parowania; właściciel musi zatwierdzić |
| `allowlist`          | Tylko nadawcy z `allowFrom` (lub sparowanego magazynu listy dozwolonych) |
| `open`               | Zezwalaj na wszystkie przychodzące wiadomości prywatne (wymaga `allowFrom: ["*"]`) |
| `disabled`           | Ignoruj wszystkie przychodzące wiadomości prywatne             |

| Zasada grupy           | Działanie                                              |
| ---------------------- | ------------------------------------------------------ |
| `allowlist` (domyślna) | Tylko grupy pasujące do skonfigurowanej listy dozwolonych |
| `open`                 | Pomijaj listy dozwolonych grup (ograniczanie do wzmianek nadal obowiązuje) |
| `disabled`             | Blokuj wszystkie wiadomości grupowe/pokojów            |

<Note>
`channels.defaults.groupPolicy` ustawia wartość domyślną, gdy `groupPolicy` dostawcy nie jest ustawione.
Kody parowania wygasają po 1 godzinie. Oczekujące żądania parowania wiadomości prywatnych są ograniczone do **3 na kanał**.
Jeśli blok dostawcy całkowicie nie istnieje (`channels.<provider>` nieobecne), zasada grupy w czasie działania wraca do `allowlist` (fail-closed) z ostrzeżeniem przy uruchamianiu.
</Note>

### Nadpisania modelu dla kanału

Użyj `channels.modelByChannel`, aby przypisać określone identyfikatory kanałów do modelu. Wartości akceptują `provider/model` lub skonfigurowane aliasy modeli. Mapowanie kanału ma zastosowanie, gdy sesja nie ma już nadpisania modelu (na przykład ustawionego przez `/model`).

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

Użyj `channels.defaults` dla współdzielonej zasady grup i zachowania Heartbeat we wszystkich dostawcach:

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

- `channels.defaults.groupPolicy`: zapasowa zasada grupy, gdy `groupPolicy` na poziomie dostawcy nie jest ustawione.
- `channels.defaults.contextVisibility`: domyślny tryb widoczności uzupełniającego kontekstu dla wszystkich kanałów. Wartości: `all` (domyślnie, uwzględnij cały kontekst cytatów/wątków/historii), `allowlist` (uwzględnij tylko kontekst od nadawców z listy dozwolonych), `allowlist_quote` (jak allowlist, ale zachowuje jawny kontekst cytatu/odpowiedzi). Nadpisanie dla kanału: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględniaj statusy zdrowych kanałów w danych wyjściowych Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: uwzględniaj statusy pogorszone/błędów w danych wyjściowych Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderuj zwarte dane wyjściowe Heartbeat w stylu wskaźnika.

### WhatsApp

WhatsApp działa przez kanał web Gateway (Baileys Web). Uruchamia się automatycznie, gdy istnieje połączona sesja.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // niebieskie znaczniki (false w trybie czatu z samym sobą)
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
- Opcjonalne `channels.whatsapp.defaultAccount` nadpisuje ten zapasowy wybór domyślnego konta, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- Starszy katalog uwierzytelniania Baileys dla jednego konta jest migrowany przez `openclaw doctor` do `whatsapp/default`.
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bota: `channels.telegram.botToken` lub `channels.telegram.tokenFile` (tylko zwykły plik; symlinki odrzucane), z `TELEGRAM_BOT_TOKEN` jako wartością zapasową dla konta domyślnego.
- Opcjonalne `channels.telegram.defaultAccount` nadpisuje wybór konta domyślnego, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- W konfiguracjach z wieloma kontami (co najmniej 2 identyfikatory kont) ustaw jawny domyślny wybór (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć routingu zapasowego; `openclaw doctor` ostrzega, gdy tego brakuje lub jest nieprawidłowe.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane z Telegrama (migracje identyfikatorów supergrup, `/config set|unset`).
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla tematów forum (użyj kanonicznego `chatId:topic:topicId` w `match.peer.id`). Semantyka pól jest współdzielona w [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
- Podglądy strumienia Telegram używają `sendMessage` + `editMessageText` (działa w czatach prywatnych i grupowych).
- Zasady ponawiania: zobacz [Zasady ponawiania](/pl/concepts/retry).

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
- Bezpośrednie wywołania wychodzące, które podają jawny `token` Discord, używają tego tokena dla wywołania; ustawienia ponawiania/zasad konta nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
- Opcjonalne `channels.discord.defaultAccount` nadpisuje wybór konta domyślnego, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- Użyj `user:<id>` (DM) lub `channel:<id>` (kanał guild), jako celów dostarczania; same numeryczne identyfikatory są odrzucane.
- Slugi guild są pisane małymi literami, a spacje są zastępowane przez `-`; klucze kanałów używają nazwy w postaci sluga (bez `#`). Preferuj identyfikatory guild.
- Wiadomości napisane przez bota są domyślnie ignorowane. `allowBots: true` je włącza; użyj `allowBots: "mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal są filtrowane).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz nadpisania kanałów) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyłączeniem @everyone/@here).
- `maxLinesPerMessage` (domyślnie 17) dzieli długie pionowo wiadomości nawet wtedy, gdy mają mniej niż 2000 znaków.
- `channels.discord.threadBindings` kontroluje routing powiązany z wątkami Discord:
  - `enabled`: nadpisanie Discord dla funkcji sesji powiązanych z wątkiem (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz dostarczanie/routing powiązany z wątkiem)
  - `idleHours`: nadpisanie Discord dla automatycznego wyłączania fokusu po bezczynności w godzinach (`0` wyłącza)
  - `maxAgeHours`: nadpisanie Discord dla sztywnego maksymalnego wieku w godzinach (`0` wyłącza)
  - `spawnSubagentSessions`: przełącznik opt-in dla automatycznego tworzenia/powiązywania wątków przez `sessions_spawn({ thread: true })`
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (użyj identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest współdzielona w [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu dla kontenerów komponentów Discord v2.
- `channels.discord.voice` włącza rozmowy w kanałach głosowych Discord oraz opcjonalne automatyczne dołączanie + nadpisania TTS.
- `channels.discord.voice.daveEncryption` i `channels.discord.voice.decryptionFailureTolerance` są przekazywane do opcji DAVE w `@discordjs/voice` (domyślnie `true` i `24`).
- OpenClaw dodatkowo próbuje odzyskać odbiór głosu, opuszczając i ponownie dołączając do sesji głosowej po powtarzających się błędach deszyfrowania.
- `channels.discord.streaming` to kanoniczny klucz trybu strumieniowania. Starsze wartości `streamMode` i logiczne `streaming` są automatycznie migrowane.
- `channels.discord.autoPresence` mapuje dostępność środowiska uruchomieniowego na status obecności bota (healthy => online, degraded => idle, exhausted => dnd) i pozwala opcjonalnie nadpisywać tekst statusu.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie po zmiennej nazwie/tagu (tryb zgodności break-glass).
- `channels.discord.execApprovals`: natywne dla Discord dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzający mogą zostać rozpoznani na podstawie `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discord, którzy mogą zatwierdzać żądania exec. Gdy pominięte, używane jest `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub regex).
  - `target`: gdzie wysyłać prośby o zatwierdzenie. `"dm"` (domyślnie) wysyła do DM zatwierdzających, `"channel"` wysyła do kanału źródłowego, `"both"` wysyła do obu. Gdy target zawiera `"channel"`, przyciski mogą być używane tylko przez rozpoznanych zatwierdzających.
  - `cleanupAfterResolve`: gdy `true`, usuwa DM z zatwierdzeniami po zatwierdzeniu, odrzuceniu lub przekroczeniu czasu.

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

- JSON konta usługi: osadzony (`serviceAccount`) lub oparty na pliku (`serviceAccountFile`).
- Obsługiwany jest także SecretRef konta usługi (`serviceAccountRef`).
- Zapasowe wartości środowiskowe: `GOOGLE_CHAT_SERVICE_ACCOUNT` lub `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Użyj `spaces/<spaceId>` lub `users/<userId>` jako celów dostarczania.
- `channels.googlechat.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie po zmiennym principalu e-mail (tryb zgodności break-glass).

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

- **Tryb Socket** wymaga zarówno `botToken`, jak i `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` jako zapasowe wartości środowiskowe dla konta domyślnego).
- **Tryb HTTP** wymaga `botToken` oraz `signingSecret` (na poziomie głównym lub per konto).
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują zwykłe ciągi tekstowe lub obiekty SecretRef.
- Migawki kont Slack ujawniają pola źródła/statusu per poświadczenie, takie jak `botTokenSource`, `botTokenStatus`, `appTokenStatus` oraz, w trybie HTTP, `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego nie mogła rozwiązać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane ze Slacka.
- Opcjonalne `channels.slack.defaultAccount` nadpisuje wybór konta domyślnego, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- `channels.slack.streaming.mode` to kanoniczny klucz trybu strumieniowania Slack. `channels.slack.streaming.nativeTransport` kontroluje natywny transport strumieniowania Slack. Starsze wartości `streamMode`, logiczne `streaming` i `nativeStreaming` są automatycznie migrowane.
- Użyj `user:<id>` (DM) lub `channel:<id>` jako celów dostarczania.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji wątków:** `thread.historyScope` jest ustawiane per wątek (domyślnie) lub współdzielone w kanale. `thread.inheritParent` kopiuje transkrypt kanału nadrzędnego do nowych wątków.

- Natywne strumieniowanie Slack oraz status wątku Slack w stylu asystenta „is typing...” wymagają celu odpowiedzi w wątku. DM najwyższego poziomu domyślnie pozostają poza wątkiem, więc używają `typingReaction` lub normalnego dostarczania zamiast podglądu w stylu wątku.
- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack podczas tworzenia odpowiedzi, a następnie usuwa ją po zakończeniu. Użyj shortcode emoji Slack, na przykład `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slack dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających. Ten sam schemat co w Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slack), `agentFilter`, `sessionFilter` i `target` (`"dm"`, `"channel"` lub `"both"`).

| Grupa działań | Domyślnie | Uwagi                    |
| ------------- | --------- | ------------------------ |
| reactions     | włączone  | Reagowanie + lista reakcji |
| messages      | włączone  | Odczyt/wysyłanie/edycja/usuwanie |
| pins          | włączone  | Przypinanie/odpinanie/lista |
| memberInfo    | włączone  | Informacje o członku     |
| emojiList     | włączone  | Lista niestandardowych emoji |

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

Tryby czatu: `oncall` (odpowiadaj na wzmiankę @, domyślnie), `onmessage` (każda wiadomość), `onchar` (wiadomości zaczynające się od prefiksu wyzwalacza).

Gdy natywne polecenia Mattermost są włączone:

- `commands.callbackPath` musi być ścieżką (na przykład `/api/channels/mattermost/command`), a nie pełnym URL.
- `commands.callbackUrl` musi wskazywać punkt końcowy Gateway OpenClaw i być osiągalny z serwera Mattermost.
- Natywne wywołania slash callback są uwierzytelniane za pomocą tokenów per polecenie zwracanych przez Mattermost podczas rejestracji poleceń slash. Jeśli rejestracja się nie powiedzie lub żadne polecenia nie zostaną aktywowane, OpenClaw odrzuci callbacki komunikatem `Unauthorized: invalid command token.`
- W przypadku prywatnych/tailnet/wewnętrznych hostów callback Mattermost może wymagać, aby `ServiceSettings.AllowedUntrustedInternalConnections` zawierało host/domenę callbacku.
  Używaj wartości host/domena, a nie pełnych URL.
- `channels.mattermost.configWrites`: zezwalaj lub zabraniaj zapisów konfiguracji inicjowanych z Mattermost.
- `channels.mattermost.requireMention`: wymagaj `@mention` przed odpowiedzią w kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: nadpisanie ograniczania do wzmianek per kanał (`"*"` dla wartości domyślnej).
- Opcjonalne `channels.mattermost.defaultAccount` nadpisuje wybór konta domyślnego, gdy odpowiada skonfigurowanemu identyfikatorowi konta.

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
- `channels.signal.configWrites`: zezwalaj lub zabraniaj zapisów konfiguracji inicjowanych z Signal.
- Opcjonalne `channels.signal.defaultAccount` nadpisuje wybór konta domyślnego, gdy odpowiada skonfigurowanemu identyfikatorowi konta.

### BlueBubbles

BlueBubbles to zalecana ścieżka dla iMessage (oparta na Plugin, konfigurowana w `channels.bluebubbles`).

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
- Opcjonalne `channels.bluebubbles.defaultAccount` nadpisuje wybór konta domyślnego, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać rozmowy BlueBubbles z trwałymi sesjami ACP. Użyj uchwytu BlueBubbles lub ciągu docelowego (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Współdzielona semantyka pól: [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).
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

- Opcjonalne `channels.imessage.defaultAccount` nadpisuje wybór konta domyślnego, gdy odpowiada skonfigurowanemu identyfikatorowi konta.

- Wymaga Full Disk Access do bazy danych Messages.
- Preferuj cele `chat_id:<id>`. Użyj `imsg chats --limit 20`, aby wyświetlić listę czatów.
- `cliPath` może wskazywać na wrapper SSH; ustaw `remoteHost` (`host` lub `user@host`) do pobierania załączników przez SCP.
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają ścieżki przychodzących załączników (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa ścisłego sprawdzania klucza hosta, więc upewnij się, że klucz hosta przekaźnika już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwalaj lub zabraniaj zapisów konfiguracji inicjowanych z iMessage.
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` mogą wiązać rozmowy iMessage z trwałymi sesjami ACP. Użyj znormalizowanego uchwytu lub jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) w `match.peer.id`. Współdzielona semantyka pól: [ACP Agents](/pl/tools/acp-agents#channel-specific-settings).

<Accordion title="Przykład wrappera SSH dla iMessage">

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
- `channels.matrix.proxy` kieruje ruch HTTP Matrix przez jawny serwer proxy HTTP(S). Nazwane konta mogą go nadpisać przez `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` zezwala na prywatne/wewnętrzne homeservery. `proxy` i to opt-in dla sieci są niezależnymi mechanizmami.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach z wieloma kontami.
- `channels.matrix.autoJoin` ma domyślnie wartość `off`, więc zaproszone pokoje i nowe zaproszenia w stylu DM są ignorowane, dopóki nie ustawisz `autoJoin: "allowlist"` z `autoJoinAllowlist` lub `autoJoin: "always"`.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie zatwierdzeń exec i autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie auto zatwierdzenia exec aktywują się, gdy zatwierdzający mogą zostać rozpoznani na podstawie `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`) uprawnionych do zatwierdzania żądań exec.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pomiń, aby przekazywać zatwierdzenia dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub regex).
  - `target`: gdzie wysyłać prośby o zatwierdzenie. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) lub `"both"`.
  - Nadpisania per konto: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` kontroluje sposób grupowania DM Matrix w sesje: `per-user` (domyślnie) współdzieli według kierowanego peera, podczas gdy `per-room` izoluje każdy pokój DM.
- Sondy statusu Matrix i aktywne wyszukiwania w katalogu używają tych samych zasad proxy co ruch środowiska uruchomieniowego.
- Pełna konfiguracja Matrix, reguły kierowania i przykłady konfiguracji są opisane w [Matrix](/pl/channels/matrix).

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
- Pełna konfiguracja Teams (poświadczenia, webhook, zasady DM/grup, nadpisania per zespół/per kanał) jest opisana w [Microsoft Teams](/pl/channels/msteams).

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
- Opcjonalne `channels.irc.defaultAccount` nadpisuje wybór konta domyślnego, gdy odpowiada skonfigurowanemu identyfikatorowi konta.
- Pełna konfiguracja kanału IRC (host/port/TLS/kanały/listy dozwolonych/ograniczanie do wzmianek) jest opisana w [IRC](/pl/channels/irc).

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
- Bazowe ustawienia kanału mają zastosowanie do wszystkich kont, chyba że są nadpisane per konto.
- Użyj `bindings[].match.accountId`, aby kierować każde konto do innego agenta.
- Jeśli dodasz konto inne niż domyślne przez `openclaw channels add` (lub onboarding kanału), będąc nadal w konfiguracji kanału najwyższego poziomu dla jednego konta, OpenClaw najpierw promuje wartości najwyższego poziomu dla jednego konta o zakresie konta do mapy kont kanału, aby oryginalne konto nadal działało. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.
- Istniejące powiązania tylko kanałowe (bez `accountId`) nadal pasują do konta domyślnego; powiązania o zakresie konta pozostają opcjonalne.
- `openclaw doctor --fix` również naprawia mieszane kształty, przenosząc wartości najwyższego poziomu dla jednego konta o zakresie konta do promowanego konta wybranego dla tego kanału. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący pasujący nazwany/domyślny cel.

### Inne kanały Plugin

Wiele kanałów Plugin jest konfigurowanych jako `channels.<id>` i opisanych na ich dedykowanych stronach kanałów (na przykład Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat i Twitch).
Zobacz pełny indeks kanałów: [Kanały](/pl/channels).

### Ograniczanie do wzmianek w czatach grupowych

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianka w metadanych lub bezpieczne wzorce regex). Dotyczy WhatsApp, Telegram, Discord, Google Chat i czatów grupowych iMessage.

**Typy wzmianek:**

- **Wzmianki w metadanych**: Natywne wzmianki @ danej platformy. Ignorowane w trybie czatu z samym sobą w WhatsApp.
- **Wzorce tekstowe**: Bezpieczne wzorce regex w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Ograniczanie do wzmianek jest wymuszane tylko wtedy, gdy wykrywanie jest możliwe (natywne wzmianki lub co najmniej jeden wzorzec).

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

Rozwiązanie: nadpisanie per DM → domyślna wartość dostawcy → brak limitu (zachowywane wszystko).

Obsługiwane: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Tryb czatu z samym sobą

Uwzględnij własny numer w `allowFrom`, aby włączyć tryb czatu z samym sobą (ignoruje natywne wzmianki @, odpowiada tylko na wzorce tekstowe):

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

- Ten blok konfiguruje powierzchnie poleceń. Aktualny wbudowany + bundled katalog poleceń znajdziesz w [Polecenia ukośnikowe](/pl/tools/slash-commands).
- Ta strona jest **dokumentacją kluczy konfiguracji**, a nie pełnym katalogiem poleceń. Polecenia należące do kanałów/pluginów, takie jak QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` i Talk `/voice`, są opisane na stronach ich kanałów/pluginów oraz w [Poleceniach ukośnikowych](/pl/tools/slash-commands).
- Polecenia tekstowe muszą być **samodzielnymi** wiadomościami zaczynającymi się od `/`.
- `native: "auto"` włącza natywne polecenia dla Discord/Telegram, pozostawia je wyłączone dla Slack.
- `nativeSkills: "auto"` włącza natywne polecenia Skills dla Discord/Telegram, pozostawia je wyłączone dla Slack.
- Nadpisanie per kanał: `channels.discord.commands.native` (bool lub `"auto"`). `false` czyści wcześniej zarejestrowane polecenia.
- Nadpisz rejestrację natywnych poleceń Skills per kanał przez `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` dodaje dodatkowe wpisy menu bota Telegram.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` oraz nadawcy w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczyt/zapis `openclaw.json`). Dla klientów Gateway `chat.send` trwałe zapisy `/config set|unset` wymagają także `operator.admin`; tylko do odczytu `/config show` pozostaje dostępne dla zwykłych klientów operatora z zakresem zapisu.
- `mcp: true` włącza `/mcp` dla konfiguracji serwera MCP zarządzanego przez OpenClaw w `mcp.servers`.
- `plugins: true` włącza `/plugins` do wykrywania Plugin, instalacji oraz sterowania włączaniem/wyłączaniem.
- `channels.<provider>.configWrites` ogranicza mutacje konfiguracji per kanał (domyślnie: true).
- Dla kanałów wielokontowych `channels.<provider>.accounts.<id>.configWrites` także ogranicza zapisy kierowane do tego konta (na przykład `/allowlist --config --account <id>` lub `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` wyłącza `/restart` i działania narzędzia restartu Gateway. Domyślnie: `true`.
- `ownerAllowFrom` to jawna lista dozwolonych właściciela dla poleceń/narzędzi tylko dla właściciela. Jest oddzielna od `allowFrom`.
- `ownerDisplay: "hash"` hashuje identyfikatory właściciela w system prompt. Ustaw `ownerDisplaySecret`, aby kontrolować hashowanie.
- `allowFrom` jest per dostawca. Gdy jest ustawione, jest to **jedyne** źródło autoryzacji (listy dozwolonych/parowanie kanału oraz `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala poleceniom omijać zasady grup dostępu, gdy `allowFrom` nie jest ustawione.
- Mapa dokumentacji poleceń:
  - wbudowany + bundled katalog: [Polecenia ukośnikowe](/pl/tools/slash-commands)
  - powierzchnie poleceń specyficzne dla kanału: [Kanały](/pl/channels)
  - polecenia QQ Bot: [QQ Bot](/pl/channels/qqbot)
  - polecenia parowania: [Parowanie](/pl/channels/pairing)
  - polecenie karty LINE: [LINE](/pl/channels/line)
  - memory dreaming: [Dreaming](/pl/concepts/dreaming)

</Accordion>

---

## Ustawienia domyślne agentów

### `agents.defaults.workspace`

Domyślnie: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Opcjonalny katalog główny repozytorium wyświetlany w wierszu Runtime system prompt. Jeśli nie jest ustawiony, OpenClaw wykrywa go automatycznie, idąc w górę od katalogu roboczego.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Opcjonalna domyślna lista dozwolonych Skills dla agentów, które nie ustawiają
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
- Pomiń `agents.list[].skills`, aby dziedziczyć wartości domyślne.
- Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
- Niepusta lista `agents.list[].skills` jest końcowym zestawem dla tego agenta; nie
  łączy się z wartościami domyślnymi.

### `agents.defaults.skipBootstrap`

Wyłącza automatyczne tworzenie plików bootstrap katalogu roboczego (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Kontroluje, kiedy pliki bootstrap katalogu roboczego są wstrzykiwane do system prompt. Domyślnie: `"always"`.

- `"continuation-skip"`: bezpieczne tury kontynuacji (po ukończonej odpowiedzi asystenta) pomijają ponowne wstrzykiwanie bootstrap katalogu roboczego, zmniejszając rozmiar promptu. Uruchomienia Heartbeat i ponowne próby po Compaction nadal odbudowują kontekst.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maksymalna liczba znaków na plik bootstrap katalogu roboczego przed obcięciem. Domyślnie: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maksymalna łączna liczba znaków wstrzykiwanych we wszystkich plikach bootstrap katalogu roboczego. Domyślnie: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kontroluje widoczny dla agenta tekst ostrzeżenia, gdy kontekst bootstrap zostanie obcięty.
Domyślnie: `"once"`.

- `"off"`: nigdy nie wstrzykuj tekstu ostrzeżenia do system prompt.
- `"once"`: wstrzyknij ostrzeżenie raz dla każdego unikalnego podpisu obcięcia (zalecane).
- `"always"`: wstrzyknij ostrzeżenie przy każdym uruchomieniu, gdy istnieje obcięcie.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa własności budżetu kontekstu

OpenClaw ma wiele budżetów promptu/kontekstu o dużym wolumenie i są one
celowo rozdzielone według podsystemów zamiast przechodzić przez jedno ogólne
ustawienie.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normalne wstrzykiwanie bootstrap katalogu roboczego.
- `agents.defaults.startupContext.*`:
  jednorazowy wstęp uruchamiania dla `/new` i `/reset`, w tym ostatnie
  pliki `memory/*.md` z kolejnych dni.
- `skills.limits.*`:
  zwarta lista Skills wstrzykiwana do system prompt.
- `agents.defaults.contextLimits.*`:
  ograniczone wycinki środowiska uruchomieniowego i wstrzykiwane bloki należące do runtime.
- `memory.qmd.limits.*`:
  rozmiar fragmentów i wstrzykiwania dla indeksowanego wyszukiwania w pamięci.

Użyj pasującego nadpisania per agent tylko wtedy, gdy jeden agent potrzebuje innego
budżetu:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kontroluje wstęp uruchamiania pierwszej tury wstrzykiwany przy pustych uruchomieniach `/new` i `/reset`.

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

- `memoryGetMaxChars`: domyślny limit wycinka `memory_get` przed dodaniem
  metadanych obcięcia i komunikatu o kontynuacji.
- `memoryGetDefaultLines`: domyślne okno linii `memory_get`, gdy `lines` jest
  pominięte.
- `toolResultMaxChars`: limit wyników narzędzi na żywo używany dla utrwalonych wyników i
  odzyskiwania po przepełnieniu.
- `postCompactionMaxChars`: limit wycinka `AGENTS.md` używany podczas wstrzykiwania odświeżenia po Compaction.

#### `agents.list[].contextLimits`

Nadpisanie per agent dla współdzielonych ustawień `contextLimits`. Pominięte pola dziedziczą
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

Globalny limit dla zwartej listy Skills wstrzykiwanej do system prompt. To
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

Maksymalny rozmiar w pikselach dla dłuższego boku obrazu w blokach obrazu transkryptu/narzędzi przed wywołaniami dostawcy.
Domyślnie: `1200`.

Niższe wartości zwykle zmniejszają użycie tokenów vision i rozmiar ładunku żądania przy uruchomieniach z dużą liczbą zrzutów ekranu.
Wyższe wartości zachowują więcej szczegółów wizualnych.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Strefa czasowa dla kontekstu system prompt (nie dla znaczników czasu wiadomości). Wartością zapasową jest strefa czasowa hosta.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format czasu w system prompt. Domyślnie: `auto` (preferencja systemu operacyjnego).

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
        primary: "openai/gpt-image-2",
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
      params: { cacheRetention: "long" }, // global default provider params
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
  - Używany także jako routing zapasowy, gdy wybrany/domyslny model nie może przyjąć wejścia obrazu.
- `imageGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania obrazów oraz każdą przyszłą powierzchnię narzędzia/Plugin, która generuje obrazy.
  - Typowe wartości: `google/gemini-3.1-flash-image-preview` dla natywnego generowania obrazów Gemini, `fal/fal-ai/flux/dev` dla fal lub `openai/gpt-image-2` dla OpenAI Images.
  - Jeśli wybierzesz bezpośrednio `provider/model`, skonfiguruj również odpowiednie uwierzytelnienie/klucz API dostawcy (na przykład `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla `google/*`, `OPENAI_API_KEY` dla `openai/*`, `FAL_KEY` dla `fal/*`).
  - Jeśli pole zostanie pominięte, `image_generate` nadal może wywnioskować domyślną wartość dostawcy obsługiwaną przez uwierzytelnienie. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców.
- `musicGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania muzyki oraz wbudowane narzędzie `music_generate`.
  - Typowe wartości: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` lub `minimax/music-2.5+`.
  - Jeśli pole zostanie pominięte, `music_generate` nadal może wywnioskować domyślną wartość dostawcy obsługiwaną przez uwierzytelnienie. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców.
  - Jeśli wybierzesz bezpośrednio `provider/model`, skonfiguruj również odpowiednie uwierzytelnienie/klucz API dostawcy.
- `videoGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania wideo oraz wbudowane narzędzie `video_generate`.
  - Typowe wartości: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` lub `qwen/wan2.7-r2v`.
  - Jeśli pole zostanie pominięte, `video_generate` nadal może wywnioskować domyślną wartość dostawcy obsługiwaną przez uwierzytelnienie. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców.
  - Jeśli wybierzesz bezpośrednio `provider/model`, skonfiguruj również odpowiednie uwierzytelnienie/klucz API dostawcy.
  - Dołączony dostawca generowania wideo Qwen obsługuje maksymalnie 1 wyjściowe wideo, 1 wejściowy obraz, 4 wejściowe wideo, czas trwania 10 sekund oraz opcje na poziomie dostawcy `size`, `aspectRatio`, `resolution`, `audio` i `watermark`.
- `pdfModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez narzędzie `pdf` do routingu modelu.
  - Jeśli pole zostanie pominięte, narzędzie PDF wraca do `imageModel`, a następnie do rozwiązanego modelu sesji/domyslnego.
- `pdfMaxBytesMb`: domyślny limit rozmiaru PDF dla narzędzia `pdf`, gdy `maxBytesMb` nie jest przekazane w czasie wywołania.
- `pdfMaxPages`: domyślna maksymalna liczba stron uwzględnianych przez tryb zapasowego wyodrębniania w narzędziu `pdf`.
- `verboseDefault`: domyślny poziom verbose dla agentów. Wartości: `"off"`, `"on"`, `"full"`. Domyślnie: `"off"`.
- `elevatedDefault`: domyślny poziom wyjścia elevated dla agentów. Wartości: `"off"`, `"on"`, `"ask"`, `"full"`. Domyślnie: `"on"`.
- `model.primary`: format `provider/model` (np. `openai/gpt-5.4`). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, następnie unikalnego dopasowania dokładnego identyfikatora modelu do skonfigurowanego dostawcy, a dopiero potem wraca do skonfigurowanego dostawcy domyślnego (przestarzałe zachowanie zgodności, więc preferuj jawne `provider/model`). Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast zgłaszać nieaktualną domyślną wartość usuniętego dostawcy.
- `models`: skonfigurowany katalog modeli i lista dozwolonych dla `/model`. Każdy wpis może zawierać `alias` (skrót) oraz `params` (specyficzne dla dostawcy, na przykład `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: globalne domyślne parametry dostawcy stosowane do wszystkich modeli. Ustawiane w `agents.defaults.params` (np. `{ cacheRetention: "long" }`).
- Kolejność scalania `params` (konfiguracja): `agents.defaults.params` (globalna baza) jest nadpisywane przez `agents.defaults.models["provider/model"].params` (per model), a następnie `agents.list[].params` (pasujący identyfikator agenta) nadpisuje po kluczu. Szczegóły znajdziesz w [Prompt Caching](/pl/reference/prompt-caching).
- `embeddedHarness`: domyślna polityka niskopoziomowego środowiska uruchomieniowego wbudowanego agenta. Użyj `runtime: "auto"`, aby pozwolić zarejestrowanym harnessom Plugin przejmować obsługiwane modele, `runtime: "pi"`, aby wymusić wbudowany harness PI, lub zarejestrowanego identyfikatora harnessu, takiego jak `runtime: "codex"`. Ustaw `fallback: "none"`, aby wyłączyć automatyczny zapasowy powrót do PI.
- Zapisywacze konfiguracji, które mutują te pola (na przykład `/models set`, `/models set-image` oraz polecenia dodawania/usuwania fallbacków), zapisują kanoniczną formę obiektu i w miarę możliwości zachowują istniejące listy fallbacków.
- `maxConcurrent`: maksymalna liczba równoległych uruchomień agentów między sesjami (każda sesja nadal jest serializowana). Domyślnie: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` kontroluje, który niskopoziomowy executor uruchamia tury wbudowanego agenta.
Większość wdrożeń powinna pozostawić wartość domyślną `{ runtime: "auto", fallback: "pi" }`.
Użyj tego, gdy zaufany Plugin udostępnia natywny harness, taki jak dołączony
harness serwera aplikacji Codex.

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

- `runtime`: `"auto"`, `"pi"` lub identyfikator zarejestrowanego harnessu Plugin. Dołączony Plugin Codex rejestruje `codex`.
- `fallback`: `"pi"` lub `"none"`. `"pi"` zachowuje wbudowany harness PI jako zapas zgodności, gdy nie wybrano żadnego harnessu Plugin. `"none"` powoduje, że brak lub nieobsługiwany wybór harnessu Plugin kończy się błędem zamiast cicho używać PI. Błędy wybranego harnessu Plugin są zawsze zgłaszane bezpośrednio.
- Nadpisania środowiskowe: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` nadpisuje `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` wyłącza zapas PI dla tego procesu.
- W wdrożeniach tylko z Codex ustaw `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` oraz `embeddedHarness.fallback: "none"`.
- To kontroluje tylko wbudowany harness czatu. Generowanie multimediów, vision, PDF, muzyka, wideo i TTS nadal używają swoich ustawień dostawcy/modelu.

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

Modele Z.AI GLM-4.x automatycznie włączają tryb thinking, chyba że ustawisz `--thinking off` lub samodzielnie zdefiniujesz `agents.defaults.models["zai/<model>"].params.thinking`.
Modele Z.AI domyślnie włączają `tool_stream` dla strumieniowania wywołań narzędzi. Ustaw `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby to wyłączyć.
Modele Anthropic Claude 4.6 domyślnie używają `adaptive` thinking, gdy nie ustawiono jawnego poziomu thinking.

### `agents.defaults.cliBackends`

Opcjonalne backendy CLI dla zapasowych uruchomień tylko tekstowych (bez wywołań narzędzi). Przydatne jako zapas, gdy dostawcy API zawodzą.

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
- Sesje są obsługiwane, gdy ustawione jest `sessionArg`.
- Przekazywanie obrazów jest obsługiwane, gdy `imageArg` akceptuje ścieżki plików.

### `agents.defaults.systemPromptOverride`

Zastępuje cały system prompt złożony przez OpenClaw stałym ciągiem. Ustawiane na poziomie domyślnym (`agents.defaults.systemPromptOverride`) lub per agent (`agents.list[].systemPromptOverride`). Wartości per agent mają pierwszeństwo; wartość pusta lub zawierająca tylko białe znaki jest ignorowana. Przydatne do kontrolowanych eksperymentów z promptami.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
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
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: ciąg czasu trwania (ms/s/m/h). Domyślnie: `30m` (uwierzytelnianie kluczem API) lub `1h` (uwierzytelnianie OAuth). Ustaw `0m`, aby wyłączyć.
- `includeSystemPromptSection`: gdy false, pomija sekcję Heartbeat w system prompt i pomija wstrzykiwanie `HEARTBEAT.md` do kontekstu bootstrap. Domyślnie: `true`.
- `suppressToolErrorWarnings`: gdy true, ukrywa ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
- `timeoutSeconds`: maksymalny czas w sekundach dozwolony dla tury agenta Heartbeat przed jej przerwaniem. Pozostaw nieustawione, aby użyć `agents.defaults.timeoutSeconds`.
- `directPolicy`: zasada bezpośredniego dostarczania/DM. `allow` (domyślnie) pozwala na dostarczanie do celu bezpośredniego. `block` blokuje dostarczanie do celu bezpośredniego i emituje `reason=dm-blocked`.
- `lightContext`: gdy true, uruchomienia Heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap katalogu roboczego.
- `isolatedSession`: gdy true, każde uruchomienie Heartbeat działa w nowej sesji bez wcześniejszej historii rozmowy. Ten sam wzorzec izolacji co Cron `sessionTarget: "isolated"`. Zmniejsza koszt tokenów na Heartbeat z około 100K do około 2-5K tokenów.
- Per agent: ustaw `agents.list[].heartbeat`. Gdy dowolny agent definiuje `heartbeat`, Heartbeat uruchamiają **tylko ci agenci**.
- Heartbeat uruchamia pełne tury agenta — krótsze interwały zużywają więcej tokenów.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
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

- `mode`: `default` lub `safeguard` (sumaryzacja porcjowana dla długich historii). Zobacz [Compaction](/pl/concepts/compaction).
- `provider`: identyfikator zarejestrowanego Plugin dostawcy compaction. Gdy jest ustawiony, zamiast wbudowanej sumaryzacji LLM wywoływane jest `summarize()` dostawcy. W przypadku błędu następuje powrót do wbudowanego mechanizmu. Ustawienie dostawcy wymusza `mode: "safeguard"`. Zobacz [Compaction](/pl/concepts/compaction).
- `timeoutSeconds`: maksymalna liczba sekund dozwolona dla pojedynczej operacji compaction, po której OpenClaw ją przerywa. Domyślnie: `900`.
- `identifierPolicy`: `strict` (domyślnie), `off` lub `custom`. `strict` dodaje na początku wbudowane wskazówki dotyczące zachowania nieprzezroczystych identyfikatorów podczas sumaryzacji compaction.
- `identifierInstructions`: opcjonalny własny tekst dotyczący zachowania identyfikatorów, używany, gdy `identifierPolicy=custom`.
- `postCompactionSections`: opcjonalne nazwy sekcji H2/H3 z `AGENTS.md`, które mają zostać ponownie wstrzyknięte po compaction. Domyślnie `["Session Startup", "Red Lines"]`; ustaw `[]`, aby wyłączyć ponowne wstrzykiwanie. Gdy pole nie jest ustawione lub jest jawnie ustawione na tę domyślną parę, starsze nagłówki `Every Session`/`Safety` są również akceptowane jako zapas zgodności.
- `model`: opcjonalne nadpisanie `provider/model-id` tylko dla sumaryzacji compaction. Użyj tego, gdy główna sesja ma pozostać przy jednym modelu, ale podsumowania compaction mają działać na innym; gdy nie jest ustawione, compaction używa głównego modelu sesji.
- `notifyUser`: gdy `true`, wysyła krótkie powiadomienia do użytkownika, gdy compaction się rozpoczyna i gdy się kończy (na przykład „Compacting context...” i „Compaction complete”). Domyślnie wyłączone, aby compaction pozostawał cichy.
- `memoryFlush`: cicha tura agentowa przed automatycznym compaction w celu zapisania trwałych wspomnień. Pomijana, gdy katalog roboczy jest tylko do odczytu.

### `agents.defaults.contextPruning`

Przycina **stare wyniki narzędzi** z kontekstu w pamięci przed wysłaniem do LLM. **Nie** modyfikuje historii sesji na dysku.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
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
- `ttl` określa, jak często przycinanie może zostać ponownie uruchomione (od ostatniego dotknięcia cache).
- Przycinanie najpierw miękko obcina zbyt duże wyniki narzędzi, a następnie w razie potrzeby całkowicie czyści starsze wyniki narzędzi.

**Soft-trim** zachowuje początek + koniec i wstawia `...` pośrodku.

**Hard-clear** zastępuje cały wynik narzędzia placeholderem.

Uwagi:

- Bloki obrazów nigdy nie są obcinane/czyszczone.
- Współczynniki są oparte na liczbie znaków (w przybliżeniu), a nie na dokładnej liczbie tokenów.
- Jeśli istnieje mniej niż `keepLastAssistants` wiadomości asystenta, przycinanie jest pomijane.

</Accordion>

Szczegóły działania znajdziesz w [Session Pruning](/pl/concepts/session-pruning).

### Strumieniowanie blokowe

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
- Nadpisania kanałów: `channels.<channel>.blockStreamingCoalesce` (oraz warianty per konto). Signal/Slack/Discord/Google Chat mają domyślnie `minChars: 1500`.
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

- Domyślnie: `instant` dla czatów bezpośrednich/wzmianek, `message` dla wiadomości grupowych bez wzmianki.
- Nadpisania per sesja: `session.typingMode`, `session.typingIntervalSeconds`.

Zobacz [Typing Indicators](/pl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Opcjonalny sandboxing dla wbudowanego agenta. Pełny przewodnik znajdziesz w [Sandboxing](/pl/gateway/sandboxing).

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
          // SecretRefs / inline contents also supported:
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

- `docker`: lokalne środowisko uruchomieniowe Docker (domyślnie)
- `ssh`: ogólne zdalne środowisko uruchomieniowe oparte na SSH
- `openshell`: środowisko uruchomieniowe OpenShell

Gdy wybrano `backend: "openshell"`, ustawienia specyficzne dla runtime przenoszą się do
`plugins.entries.openshell.config`.

**Konfiguracja backendu SSH:**

- `target`: cel SSH w formacie `user@host[:port]`
- `command`: polecenie klienta SSH (domyślnie: `ssh`)
- `workspaceRoot`: bezwzględny zdalny katalog główny używany dla katalogów roboczych per scope
- `identityFile` / `certificateFile` / `knownHostsFile`: istniejące lokalne pliki przekazywane do OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: treści inline lub SecretRef, które OpenClaw materializuje do plików tymczasowych w czasie działania
- `strictHostKeyChecking` / `updateHostKeys`: ustawienia zasad kluczy hosta OpenSSH

**Priorytet uwierzytelniania SSH:**

- `identityData` ma pierwszeństwo przed `identityFile`
- `certificateData` ma pierwszeństwo przed `certificateFile`
- `knownHostsData` ma pierwszeństwo przed `knownHostsFile`
- Wartości `*Data` oparte na SecretRef są rozwiązywane z aktywnej migawki runtime sekretów przed rozpoczęciem sesji sandbox

**Zachowanie backendu SSH:**

- inicjalizuje zdalny katalog roboczy jednorazowo po utworzeniu lub odtworzeniu
- następnie utrzymuje zdalny katalog roboczy SSH jako kanoniczny
- kieruje `exec`, narzędzia plikowe i ścieżki multimediów przez SSH
- nie synchronizuje automatycznie zmian zdalnych z powrotem do hosta
- nie obsługuje kontenerów przeglądarki w sandbox

**Dostęp do katalogu roboczego:**

- `none`: katalog roboczy sandbox per scope w `~/.openclaw/sandboxes`
- `ro`: katalog roboczy sandbox w `/workspace`, katalog roboczy agenta montowany tylko do odczytu w `/agent`
- `rw`: katalog roboczy agenta montowany do odczytu i zapisu w `/workspace`

**Zakres:**

- `session`: kontener + katalog roboczy per sesja
- `agent`: jeden kontener + katalog roboczy na agenta (domyślnie)
- `shared`: współdzielony kontener i katalog roboczy (brak izolacji między sesjami)

**Konfiguracja Plugin OpenShell:**

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
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Tryb OpenShell:**

- `mirror`: inicjalizuje zdalne środowisko z lokalnego przed exec, synchronizuje z powrotem po exec; lokalny katalog roboczy pozostaje kanoniczny
- `remote`: inicjalizuje zdalne środowisko jednokrotnie podczas tworzenia sandbox, a następnie utrzymuje zdalny katalog roboczy jako kanoniczny

W trybie `remote` zmiany lokalne hosta wprowadzone poza OpenClaw nie są automatycznie synchronizowane do sandbox po kroku inicjalizacji.
Transport odbywa się przez SSH do sandbox OpenShell, ale Plugin zarządza cyklem życia sandbox oraz opcjonalną synchronizacją mirror.

**`setupCommand`** uruchamia się raz po utworzeniu kontenera (przez `sh -lc`). Wymaga wychodzącego dostępu do sieci, zapisywalnego katalogu głównego i użytkownika root.

**Kontenery domyślnie używają `network: "none"`** — ustaw `"bridge"` (lub własną sieć bridge), jeśli agent potrzebuje dostępu wychodzącego.
`"host"` jest blokowane. `"container:<id>"` jest domyślnie blokowane, chyba że jawnie ustawisz
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (tryb break-glass).

**Przychodzące załączniki** są etapowane do `media/inbound/*` w aktywnym katalogu roboczym.

**`docker.binds`** montuje dodatkowe katalogi hosta; globalne i per-agent `binds` są scalane.

**Przeglądarka w sandbox** (`sandbox.browser.enabled`): Chromium + CDP w kontenerze. URL noVNC jest wstrzykiwany do system prompt. Nie wymaga `browser.enabled` w `openclaw.json`.
Dostęp obserwatora noVNC domyślnie używa uwierzytelniania VNC, a OpenClaw emituje URL z krótkotrwałym tokenem (zamiast ujawniać hasło we współdzielonym URL).

- `allowHostControl: false` (domyślnie) blokuje sesjom sandbox kierowanie do przeglądarki hosta.
- `network` ma domyślnie wartość `openclaw-sandbox-browser` (dedykowana sieć bridge). Ustaw `bridge` tylko wtedy, gdy jawnie chcesz globalnej łączności bridge.
- `cdpSourceRange` opcjonalnie ogranicza ruch przychodzący CDP na krawędzi kontenera do zakresu CIDR (na przykład `172.21.0.1/32`).
- `sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko do kontenera przeglądarki sandbox. Gdy jest ustawione (w tym `[]`), zastępuje `docker.binds` dla kontenera przeglądarki.
- Domyślne opcje uruchamiania są zdefiniowane w `scripts/sandbox-browser-entrypoint.sh` i dostrojone dla hostów kontenerowych:
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
  - plus `--no-sandbox` i `--disable-setuid-sandbox`, gdy `noSandbox` jest włączone.
  - Wartości domyślne stanowią bazę obrazu kontenera; użyj własnego obrazu przeglądarki z własnym
    entrypoint, aby zmienić domyślne ustawienia kontenera.

</Accordion>

Sandboxing przeglądarki i `sandbox.docker.binds` są dostępne tylko dla Docker.

Budowanie obrazów:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
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
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        skills: ["docs-search"], // replaces agents.defaults.skills when set
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
- `default`: gdy ustawiono wiele, wygrywa pierwszy (logowane jest ostrzeżenie). Jeśli żaden nie jest ustawiony, domyślny jest pierwszy wpis na liście.
- `model`: forma ciągu nadpisuje tylko `primary`; forma obiektu `{ primary, fallbacks }` nadpisuje oba (`[]` wyłącza globalne fallbacki). Zadania Cron, które nadpisują tylko `primary`, nadal dziedziczą domyślne fallbacki, chyba że ustawisz `fallbacks: []`.
- `params`: parametry strumienia per agent scalane ponad wybranym wpisem modelu w `agents.defaults.models`. Używaj tego do nadpisań specyficznych dla agenta, takich jak `cacheRetention`, `temperature` lub `maxTokens`, bez duplikowania całego katalogu modeli.
- `skills`: opcjonalna lista dozwolonych Skills per agent. Jeśli pole jest pominięte, agent dziedziczy `agents.defaults.skills`, jeśli jest ustawione; jawna lista zastępuje wartości domyślne zamiast się z nimi scalać, a `[]` oznacza brak Skills.
- `thinkingDefault`: opcjonalny domyślny poziom thinking per agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Nadpisuje `agents.defaults.thinkingDefault` dla tego agenta, gdy nie ustawiono nadpisania per wiadomość ani per sesja.
- `reasoningDefault`: opcjonalna domyślna widoczność reasoning per agent (`on | off | stream`). Ma zastosowanie, gdy nie ustawiono nadpisania reasoning per wiadomość ani per sesja.
- `fastModeDefault`: opcjonalna wartość domyślna trybu szybkiego per agent (`true | false`). Ma zastosowanie, gdy nie ustawiono nadpisania trybu szybkiego per wiadomość ani per sesja.
- `embeddedHarness`: opcjonalne nadpisanie polityki niskopoziomowego harnessu per agent. Użyj `{ runtime: "codex", fallback: "none" }`, aby jeden agent był tylko Codex, podczas gdy inni agenci zachowają domyślny fallback PI.
- `runtime`: opcjonalny deskryptor runtime per agent. Użyj `type: "acp"` z wartościami domyślnymi `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), gdy agent ma domyślnie używać sesji harness ACP.
- `identity.avatar`: ścieżka względna względem katalogu roboczego, URL `http(s)` lub URI `data:`.
- `identity` wyprowadza wartości domyślne: `ackReaction` z `emoji`, `mentionPatterns` z `name`/`emoji`.
- `subagents.allowAgents`: lista dozwolonych identyfikatorów agentów dla `sessions_spawn` (`["*"]` = dowolny; domyślnie: tylko ten sam agent).
- Zabezpieczenie dziedziczenia sandbox: jeśli sesja żądająca działa w sandbox, `sessions_spawn` odrzuca cele, które działałyby bez sandbox.
- `subagents.requireAgentId`: gdy true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu; domyślnie: false).

---

## Routing wieloagentowy

Uruchamiaj wiele odizolowanych agentów w jednym Gateway. Zobacz [Multi-Agent](/pl/concepts/multi-agent).

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

- `type` (opcjonalne): `route` dla zwykłego routingu (brak `type` domyślnie oznacza route), `acp` dla trwałych powiązań rozmów ACP.
- `match.channel` (wymagane)
- `match.accountId` (opcjonalne; `*` = dowolne konto; pominięte = konto domyślne)
- `match.peer` (opcjonalne; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcjonalne; specyficzne dla kanału)
- `acp` (opcjonalne; tylko dla `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministyczna kolejność dopasowania:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (dokładne, bez peer/guild/team)
5. `match.accountId: "*"` (dla całego kanału)
6. Agent domyślny

W obrębie każdego poziomu wygrywa pierwszy pasujący wpis `bindings`.

Dla wpisów `type: "acp"` OpenClaw rozwiązuje dopasowanie według dokładnej tożsamości rozmowy (`match.channel` + konto + `match.peer.id`) i nie używa powyższej kolejności poziomów powiązań route.

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

<Accordion title="Narzędzia tylko do odczytu + katalog roboczy">

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Szczegóły pól sesji">

- **`scope`**: podstawowa strategia grupowania sesji dla kontekstów czatów grupowych.
  - `per-sender` (domyślnie): każdy nadawca otrzymuje odizolowaną sesję w kontekście kanału.
  - `global`: wszyscy uczestnicy w kontekście kanału współdzielą jedną sesję (używaj tylko wtedy, gdy współdzielony kontekst jest zamierzony).
- **`dmScope`**: sposób grupowania DM.
  - `main`: wszystkie DM współdzielą sesję główną.
  - `per-peer`: izolacja według identyfikatora nadawcy między kanałami.
  - `per-channel-peer`: izolacja per kanał + nadawca (zalecane dla skrzynek odbiorczych wielu użytkowników).
  - `per-account-channel-peer`: izolacja per konto + kanał + nadawca (zalecane dla wielu kont).
- **`identityLinks`**: mapuje kanoniczne identyfikatory do peerów z prefiksem dostawcy na potrzeby współdzielenia sesji między kanałami.
- **`reset`**: podstawowa zasada resetu. `daily` resetuje o `atHour` czasu lokalnego; `idle` resetuje po `idleMinutes`. Gdy skonfigurowane są oba, wygrywa ten, który wygaśnie wcześniej.
- **`resetByType`**: nadpisania per typ (`direct`, `group`, `thread`). Starsze `dm` jest akceptowane jako alias `direct`.
- **`parentForkMaxTokens`**: maksymalne `totalTokens` sesji nadrzędnej dozwolone przy tworzeniu rozwidlonej sesji wątku (domyślnie `100000`).
  - Jeśli `totalTokens` rodzica przekracza tę wartość, OpenClaw rozpoczyna nową sesję wątku zamiast dziedziczyć historię transkryptu rodzica.
  - Ustaw `0`, aby wyłączyć to zabezpieczenie i zawsze zezwalać na rozwidlanie od rodzica.
- **`mainKey`**: starsze pole. Runtime zawsze używa `"main"` dla głównego koszyka czatu bezpośredniego.
- **`agentToAgent.maxPingPongTurns`**: maksymalna liczba tur odpowiedzi zwrotnych między agentami podczas wymian agent-agent (liczba całkowita, zakres: `0`–`5`). `0` wyłącza łańcuchowanie ping-pong.
- **`sendPolicy`**: dopasowanie według `channel`, `chatType` (`direct|group|channel`, ze starszym aliasem `dm`), `keyPrefix` lub `rawKeyPrefix`. Pierwsza odmowa wygrywa.
- **`maintenance`**: sterowanie czyszczeniem + retencją magazynu sesji.
  - `mode`: `warn` emituje tylko ostrzeżenia; `enforce` stosuje czyszczenie.
  - `pruneAfter`: próg wieku dla nieaktualnych wpisów (domyślnie `30d`).
  - `maxEntries`: maksymalna liczba wpisów w `sessions.json` (domyślnie `500`).
  - `rotateBytes`: rotuje `sessions.json`, gdy przekroczy ten rozmiar (domyślnie `10mb`).
  - `resetArchiveRetention`: retencja dla archiwów transkryptów `*.reset.<timestamp>`. Domyślnie taka sama jak `pruneAfter`; ustaw `false`, aby wyłączyć.
  - `maxDiskBytes`: opcjonalny budżet miejsca na dysku dla katalogu sesji. W trybie `warn` loguje ostrzeżenia; w trybie `enforce` najpierw usuwa najstarsze artefakty/sesje.
  - `highWaterBytes`: opcjonalny cel po czyszczeniu budżetu. Domyślnie `80%` z `maxDiskBytes`.
- **`threadBindings`**: globalne wartości domyślne dla funkcji sesji powiązanych z wątkami.
  - `enabled`: główny domyślny przełącznik (dostawcy mogą nadpisywać; Discord używa `channels.discord.threadBindings.enabled`)
  - `idleHours`: domyślne automatyczne wyłączanie fokusu po bezczynności w godzinach (`0` wyłącza; dostawcy mogą nadpisywać)
  - `maxAgeHours`: domyślny sztywny maksymalny wiek w godzinach (`0` wyłącza; dostawcy mogą nadpisywać)

</Accordion>

---

## Wiadomości

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
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
      debounceMs: 2000, // 0 disables
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

Rozwiązanie (wygrywa najbardziej szczegółowe): konto → kanał → globalne. `""` wyłącza i zatrzymuje kaskadę. `"auto"` wyprowadza `[{identity.name}]`.

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
- Kolejność rozwiązywania: konto → kanał → `messages.ackReaction` → zapas z tożsamości.
- Zakres: `group-mentions` (domyślnie), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: usuwa ack po odpowiedzi na Slack, Discord i Telegram.
- `messages.statusReactions.enabled`: włącza reakcje statusu cyklu życia na Slack, Discord i Telegram.
  W Slack i Discord brak ustawienia zachowuje reakcje statusu włączone, gdy aktywne są reakcje ack.
  W Telegram ustaw jawnie `true`, aby włączyć reakcje statusu cyklu życia.

### Debounce przychodzących wiadomości

Łączy szybkie wiadomości tekstowe od tego samego nadawcy w jedną turę agenta. Multimedia/załączniki są opróżniane natychmiast. Polecenia sterujące omijają debounce.

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

- `auto` kontroluje domyślny tryb automatycznego TTS: `off`, `always`, `inbound` lub `tagged`. `/tts on|off` może nadpisać lokalne preferencje, a `/tts status` pokazuje stan efektywny.
- `summaryModel` nadpisuje `agents.defaults.model.primary` dla automatycznego podsumowania.
- `modelOverrides` jest domyślnie włączone; `modelOverrides.allowProvider` ma domyślnie wartość `false` (opt-in).
- Klucze API wracają do `ELEVENLABS_API_KEY`/`XI_API_KEY` oraz `OPENAI_API_KEY`.
- `openai.baseUrl` nadpisuje punkt końcowy TTS OpenAI. Kolejność rozwiązywania to konfiguracja, potem `OPENAI_TTS_BASE_URL`, a następnie `https://api.openai.com/v1`.
- Gdy `openai.baseUrl` wskazuje punkt końcowy inny niż OpenAI, OpenClaw traktuje go jako serwer TTS zgodny z OpenAI i łagodzi walidację modelu/głosu.

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
- Starsze płaskie klucze Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) są zachowane wyłącznie dla zgodności i są automatycznie migrowane do `talk.providers.<provider>`.
- Identyfikatory głosów wracają do `ELEVENLABS_VOICE_ID` lub `SAG_VOICE_ID`.
- `providers.*.apiKey` akceptuje zwykłe ciągi tekstowe lub obiekty SecretRef.
- Zapasowe `ELEVENLABS_API_KEY` ma zastosowanie tylko wtedy, gdy nie skonfigurowano klucza API Talk.
- `providers.*.voiceAliases` pozwala dyrektywom Talk używać przyjaznych nazw.
- `silenceTimeoutMs` kontroluje, jak długo tryb Talk czeka po ciszy użytkownika, zanim wyśle transkrypt. Brak ustawienia zachowuje domyślne okno pauzy platformy (`700 ms na macOS i Android, 900 ms na iOS`).

---

## Narzędzia

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych przed `tools.allow`/`tools.deny`:

Lokalny onboarding domyślnie ustawia nowe lokalne konfiguracje na `tools.profile: "coding"`, gdy pole nie jest ustawione (istniejące jawne profile są zachowywane).

| Profil      | Zawiera                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | tylko `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Brak ograniczeń (tak samo jak brak ustawienia)                                                                                  |

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
| `group:openclaw`   | Wszystkie wbudowane narzędzia (z wyłączeniem Plugin dostawców)                                                          |

### `tools.allow` / `tools.deny`

Globalna polityka zezwalania/odmawiania dla narzędzi (odmowa ma pierwszeństwo). Bez rozróżniania wielkości liter, obsługuje symbole wieloznaczne `*`. Stosowana nawet wtedy, gdy sandbox Docker jest wyłączony.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Dodatkowo ogranicza narzędzia dla określonych dostawców lub modeli. Kolejność: profil bazowy → profil dostawcy → allow/deny.

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

Kontroluje podwyższony dostęp `exec` poza sandbox:

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
- Podwyższony `exec` omija sandboxing i używa skonfigurowanej ścieżki wyjścia (`gateway` domyślnie lub `node`, gdy celem exec jest `node`).

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
Ustawienia można definiować globalnie w `tools.loopDetection` i nadpisywać per agent w `agents.list[].tools.loopDetection`.

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
- `criticalThreshold`: wyższy próg powtórzeń do blokowania krytycznych pętli.
- `globalCircuitBreakerThreshold`: próg twardego zatrzymania dla dowolnego przebiegu bez postępu.
- `detectors.genericRepeat`: ostrzegaj przy powtarzanych wywołaniach tego samego narzędzia z tymi samymi argumentami.
- `detectors.knownPollNoProgress`: ostrzegaj/blokuj dla znanych narzędzi typu poll (`process.poll`, `command_status` itd.).
- `detectors.pingPong`: ostrzegaj/blokuj przy naprzemiennych wzorcach par bez postępu.
- Jeśli `warningThreshold >= criticalThreshold` lub `criticalThreshold >= globalCircuitBreakerThreshold`, walidacja kończy się błędem.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
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

Konfiguruje rozumienie przychodzących multimediów (obraz/audio/wideo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
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

<Accordion title="Pola wpisu modelu multimediów">

**Wpis dostawcy** (`type: "provider"` lub pominięte):

- `provider`: identyfikator dostawcy API (`openai`, `anthropic`, `google`/`gemini`, `groq` itd.)
- `model`: nadpisanie identyfikatora modelu
- `profile` / `preferredProfile`: wybór profilu z `auth-profiles.json`

**Wpis CLI** (`type: "cli"`):

- `command`: plik wykonywalny do uruchomienia
- `args`: argumenty szablonowe (obsługuje `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` itd.)

**Wspólne pola:**

- `capabilities`: opcjonalna lista (`image`, `audio`, `video`). Domyślnie: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: nadpisania per wpis.
- W razie błędu następuje przejście do następnego wpisu.

Uwierzytelnianie dostawcy używa standardowej kolejności: `auth-profiles.json` → zmienne środowiskowe → `models.providers.*.apiKey`.

**Pola async completion:**

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

Kontroluje, które sesje mogą być celem narzędzi sesji (`sessions_list`, `sessions_history`, `sessions_send`).

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
- `agent`: dowolna sesja należąca do bieżącego identyfikatora agenta (może obejmować innych użytkowników, jeśli uruchamiasz sesje per nadawca pod tym samym identyfikatorem agenta).
- `all`: dowolna sesja. Kierowanie między agentami nadal wymaga `tools.agentToAgent`.
- Ograniczenie sandbox: gdy bieżąca sesja działa w sandbox, a `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, widoczność jest wymuszana na `tree`, nawet jeśli `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Kontroluje obsługę załączników inline dla `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

Uwagi:

- Załączniki są obsługiwane tylko dla `runtime: "subagent"`. Runtime ACP je odrzuca.
- Pliki są materializowane w katalogu roboczym potomnym w `.openclaw/attachments/<uuid>/` wraz z `.manifest.json`.
- Treść załączników jest automatycznie redagowana podczas utrwalania transkryptu.
- Wejścia base64 są walidowane ze ścisłą kontrolą alfabetu/dopełnienia i zabezpieczeniem rozmiaru przed dekodowaniem.
- Uprawnienia plików to `0700` dla katalogów i `0600` dla plików.
- Czyszczenie podąża za polityką `cleanup`: `delete` zawsze usuwa załączniki; `keep` zachowuje je tylko wtedy, gdy `retainOnSessionKeep: true`.

### `tools.experimental`

Eksperymentalne flagi wbudowanych narzędzi. Domyślnie wyłączone, chyba że ma zastosowanie reguła automatycznego włączenia strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

Uwagi:

- `planTool`: włącza strukturalne narzędzie `update_plan` do śledzenia nietrywialnej pracy wieloetapowej.
- Domyślnie: `false`, chyba że `agents.defaults.embeddedPi.executionContract` (lub nadpisanie per agent) jest ustawione na `"strict-agentic"` dla uruchomienia rodziny OpenAI lub OpenAI Codex GPT-5. Ustaw `true`, aby wymusić włączenie narzędzia poza tym zakresem, lub `false`, aby pozostawić je wyłączone nawet dla uruchomień strict-agentic GPT-5.
- Gdy jest włączone, system prompt dodaje również wskazówki użycia, aby model używał go tylko do istotnej pracy i utrzymywał co najwyżej jeden krok `in_progress`.

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

- `model`: domyślny model dla tworzonych subagentów. Jeśli pominięte, subagenci dziedziczą model wywołującego.
- `allowAgents`: domyślna lista dozwolonych docelowych identyfikatorów agentów dla `sessions_spawn`, gdy agent żądający nie ustawia własnego `subagents.allowAgents` (`["*"]` = dowolny; domyślnie: tylko ten sam agent).
- `runTimeoutSeconds`: domyślny limit czasu (sekundy) dla `sessions_spawn`, gdy wywołanie narzędzia pomija `runTimeoutSeconds`. `0` oznacza brak limitu czasu.
- Polityka narzędzi per subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Niestandardowi dostawcy i base URL

OpenClaw używa wbudowanego katalogu modeli. Dodaj niestandardowych dostawców przez `models.providers` w konfiguracji lub `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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
  - Niepuste wartości `baseUrl` w `models.json` agenta mają pierwszeństwo.
  - Niepuste wartości `apiKey` agenta mają pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
  - Wartości `apiKey` dostawcy zarządzane przez SecretRef są odświeżane na podstawie znaczników źródła (`ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec) zamiast utrwalać rozwiązane sekrety.
  - Wartości nagłówków dostawcy zarządzane przez SecretRef są odświeżane na podstawie znaczników źródła (`secretref-env:ENV_VAR_NAME` dla odwołań env, `secretref-managed` dla odwołań file/exec).
  - Puste lub brakujące `apiKey`/`baseUrl` agenta wracają do `models.providers` w konfiguracji.
  - Pasujące `contextWindow`/`maxTokens` modelu używają wyższej wartości spośród jawnej konfiguracji i domyślnych wartości katalogu.
  - Pasujące `contextTokens` modelu zachowuje jawny limit runtime, jeśli jest obecny; użyj go, aby ograniczyć efektywny kontekst bez zmiany natywnych metadanych modelu.
  - Użyj `models.mode: "replace"`, jeśli chcesz, aby konfiguracja całkowicie nadpisała `models.json`.
  - Utrwalanie znaczników jest autorytatywne względem źródła: znaczniki są zapisywane z aktywnej migawki konfiguracji źródła (przed rozwiązaniem), a nie z rozwiązanych wartości sekretów w runtime.

### Szczegóły pól dostawcy

- `models.mode`: zachowanie katalogu dostawców (`merge` lub `replace`).
- `models.providers`: mapa niestandardowych dostawców z kluczami według identyfikatora dostawcy.
- `models.providers.*.api`: adapter żądań (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` itd.).
- `models.providers.*.apiKey`: poświadczenie dostawcy (preferuj SecretRef/podstawienie env).
- `models.providers.*.auth`: strategia uwierzytelniania (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: dla Ollama + `openai-completions` wstrzykuje `options.num_ctx` do żądań (domyślnie: `true`).
- `models.providers.*.authHeader`: wymusza przesyłanie poświadczeń w nagłówku `Authorization`, gdy jest to wymagane.
- `models.providers.*.baseUrl`: bazowy URL nadrzędnego API.
- `models.providers.*.headers`: dodatkowe statyczne nagłówki dla routingu proxy/tenant.
- `models.providers.*.request`: nadpisania transportu dla żądań HTTP dostawcy modeli.
  - `request.headers`: dodatkowe nagłówki (scalane z domyślnymi ustawieniami dostawcy). Wartości akceptują SecretRef.
  - `request.auth`: nadpisanie strategii uwierzytelniania. Tryby: `"provider-default"` (użyj wbudowanego uwierzytelniania dostawcy), `"authorization-bearer"` (z `token`), `"header"` (z `headerName`, `value`, opcjonalnie `prefix`).
  - `request.proxy`: nadpisanie proxy HTTP. Tryby: `"env-proxy"` (użyj zmiennych środowiskowych `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (z `url`). Oba tryby akceptują opcjonalny podobiekt `tls`.
  - `request.tls`: nadpisanie TLS dla połączeń bezpośrednich. Pola: `ca`, `cert`, `key`, `passphrase` (wszystkie akceptują SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: gdy `true`, zezwala na HTTPS do `baseUrl`, gdy DNS rozwiązuje się do zakresów prywatnych, CGNAT lub podobnych, przez ochronę SSRF pobierania HTTP dostawcy (opt-in operatora dla zaufanych samohostowanych punktów końcowych zgodnych z OpenAI). WebSocket używa tego samego `request` dla nagłówków/TLS, ale nie tej bramki SSRF fetch. Domyślnie `false`.
- `models.providers.*.models`: jawne wpisy katalogu modeli dostawcy.
- `models.providers.*.models.*.contextWindow`: natywne metadane okna kontekstu modelu.
- `models.providers.*.models.*.contextTokens`: opcjonalny limit kontekstu runtime. Użyj tego, gdy chcesz mieć mniejszy efektywny budżet kontekstu niż natywne `contextWindow` modelu.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: opcjonalna wskazówka zgodności. Dla `api: "openai-completions"` z niepustym, nienatywnym `baseUrl` (host inny niż `api.openai.com`) OpenClaw wymusza w runtime wartość `false`. Puste/pominięte `baseUrl` zachowuje domyślne zachowanie OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: opcjonalna wskazówka zgodności dla punktów końcowych czatu zgodnych z OpenAI, które obsługują tylko ciągi. Gdy `true`, OpenClaw spłaszcza czysto tekstowe tablice `messages[].content` do zwykłych ciągów przed wysłaniem żądania.
- `plugins.entries.amazon-bedrock.config.discovery`: główny poziom ustawień automatycznego wykrywania Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: włącza/wyłącza niejawne wykrywanie.
- `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS dla wykrywania.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: opcjonalny filtr identyfikatora dostawcy dla ukierunkowanego wykrywania.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interwał odpytywania dla odświeżania wykrywania.
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

Ustaw `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`). Używaj odwołań `opencode/...` dla katalogu Zen lub odwołań `opencode-go/...` dla katalogu Go. Skrót: `openclaw onboard --auth-choice opencode-zen` lub `openclaw onboard --auth-choice opencode-go`.

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
- Punkt końcowy kodowania (domyślny): `https://api.z.ai/api/coding/paas/v4`
- Dla ogólnego punktu końcowego zdefiniuj niestandardowego dostawcę z nadpisaniem base URL.

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

Dla punktu końcowego w Chinach: `baseUrl: "https://api.moonshot.cn/v1"` lub `openclaw onboard --auth-choice moonshot-api-key-cn`.

Natywne punkty końcowe Moonshot reklamują zgodność użycia strumieniowania we współdzielonym
transporcie `openai-completions`, a OpenClaw opiera to na możliwościach punktu końcowego,
a nie wyłącznie na wbudowanym identyfikatorze dostawcy.

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

Wbudowany dostawca zgodny z Anthropic. Skrót: `openclaw onboard --auth-choice kimi-code-api-key`.

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

Base URL powinien pomijać `/v1` (klient Anthropic dopisuje go sam). Skrót: `openclaw onboard --auth-choice synthetic-api-key`.

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
Katalog modeli domyślnie obejmuje tylko M2.7.
Na ścieżce strumieniowania zgodnej z Anthropic OpenClaw domyślnie wyłącza thinking MiniMax,
chyba że jawnie ustawisz `thinking`. `/fast on` lub
`params.fastMode: true` przepisuje `MiniMax-M2.7` na
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modele lokalne (LM Studio)">

Zobacz [Modele lokalne](/pl/gateway/local-models). W skrócie: uruchom duży model lokalny przez LM Studio Responses API na wydajnym sprzęcie; zachowaj scalone modele hostowane jako fallback.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: opcjonalna lista dozwolonych tylko dla bundled Skills (zarządzane/robocze Skills pozostają bez zmian).
- `load.extraDirs`: dodatkowe współdzielone katalogi główne Skills (najniższy priorytet).
- `install.preferBrew`: gdy true, preferuje instalatory Homebrew, gdy `brew` jest
  dostępne, przed przejściem do innych typów instalatorów.
- `install.nodeManager`: preferencja instalatora node dla specyfikacji `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` wyłącza Skill nawet wtedy, gdy jest bundled/zainstalowany.
- `entries.<skillKey>.apiKey`: wygodny skrót dla Skills deklarujących podstawową zmienną env (zwykły ciąg tekstowy lub obiekt SecretRef).

---

## Pluginy

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
- Wykrywanie akceptuje natywne Pluginy OpenClaw oraz zgodne pakiety Codex i Claude, w tym pakiety Claude bez manifestu w domyślnym układzie.
- **Zmiany konfiguracji wymagają restartu Gateway.**
- `allow`: opcjonalna lista dozwolonych (ładowane są tylko wymienione Pluginy). `deny` ma pierwszeństwo.
- `plugins.entries.<id>.apiKey`: wygodne pole klucza API na poziomie Plugin (gdy obsługiwane przez Plugin).
- `plugins.entries.<id>.env`: mapa zmiennych środowiskowych ograniczona do Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy `false`, rdzeń blokuje `before_prompt_build` i ignoruje pola mutujące prompt ze starszego `before_agent_start`, zachowując starsze `modelOverride` i `providerOverride`. Dotyczy natywnych hooków Plugin oraz obsługiwanych katalogów hooków dostarczanych przez pakiety.
- `plugins.entries.<id>.subagent.allowModelOverride`: jawnie ufa temu Plugin, że może żądać nadpisań `provider` i `model` per uruchomienie dla działających w tle subagentów.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań subagentów. Użyj `"*"`, tylko jeśli świadomie chcesz zezwolić na dowolny model.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez Plugin (walidowany przez natywny schemat Plugin OpenClaw, jeśli jest dostępny).
- `plugins.entries.firecrawl.config.webFetch`: ustawienia dostawcy web-fetch Firecrawl.
  - `apiKey`: klucz API Firecrawl (akceptuje SecretRef). Wraca do `plugins.entries.firecrawl.config.webSearch.apiKey`, starszego `tools.web.fetch.firecrawl.apiKey` lub zmiennej środowiskowej `FIRECRAWL_API_KEY`.
  - `baseUrl`: bazowy URL API Firecrawl (domyślnie: `https://api.firecrawl.dev`).
  - `onlyMainContent`: wyodrębnia tylko główną treść stron (domyślnie: `true`).
  - `maxAgeMs`: maksymalny wiek cache w milisekundach (domyślnie: `172800000` / 2 dni).
  - `timeoutSeconds`: limit czasu żądania scrape w sekundach (domyślnie: `60`).
- `plugins.entries.xai.config.xSearch`: ustawienia X Search xAI (wyszukiwanie web Grok).
  - `enabled`: włącza dostawcę X Search.
  - `model`: model Grok używany do wyszukiwania (np. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ustawienia memory dreaming. Fazy i progi opisano w [Dreaming](/pl/concepts/dreaming).
  - `enabled`: główny przełącznik dreaming (domyślnie `false`).
  - `frequency`: harmonogram Cron dla każdego pełnego przebiegu dreaming (domyślnie `"0 3 * * *"`).
  - polityka faz i progi są szczegółami implementacyjnymi (nie są kluczami konfiguracji dla użytkownika).
- Pełna konfiguracja pamięci znajduje się w [Dokumentacji konfiguracji pamięci](/pl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Włączone Pluginy pakietów Claude mogą również dostarczać osadzone domyślne ustawienia Pi z `settings.json`; OpenClaw stosuje je jako oczyszczone ustawienia agentów, a nie jako surowe patche konfiguracji OpenClaw.
- `plugins.slots.memory`: wybiera identyfikator aktywnego Plugin pamięci lub `"none"`, aby wyłączyć Pluginy pamięci.
- `plugins.slots.contextEngine`: wybiera identyfikator aktywnego Plugin silnika kontekstu; domyślnie `"legacy"`, chyba że zainstalujesz i wybierzesz inny silnik.
- `plugins.installs`: metadane instalacji zarządzane przez CLI, używane przez `openclaw plugins update`.
  - Obejmuje `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Traktuj `plugins.installs.*` jako stan zarządzany; preferuj polecenia CLI zamiast ręcznej edycji.

Zobacz [Pluginy](/pl/tools/plugin).

---

## Przeglądarka

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` jest wyłączone, gdy nie jest ustawione, więc nawigacja przeglądarki pozostaje domyślnie restrykcyjna.
- Ustaw `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` tylko wtedy, gdy świadomie ufasz nawigacji przeglądarki po sieci prywatnej.
- W trybie restrykcyjnym zdalne punkty końcowe profili CDP (`profiles.*.cdpUrl`) podlegają temu samemu blokowaniu sieci prywatnej podczas sprawdzania osiągalności/wykrywania.
- `ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.
- W trybie restrykcyjnym używaj `ssrfPolicy.hostnameAllowlist` i `ssrfPolicy.allowedHostnames` dla jawnych wyjątków.
- Profile zdalne są tylko do podłączania (start/stop/reset są wyłączone).
- `profiles.*.cdpUrl` akceptuje `http://`, `https://`, `ws://` i `wss://`.
  Używaj HTTP(S), gdy chcesz, aby OpenClaw wykrywał `/json/version`; używaj WS(S),
  gdy dostawca udostępnia bezpośredni URL WebSocket DevTools.
- Profile `existing-session` używają Chrome MCP zamiast CDP i mogą dołączać na
  wybranym hoście lub przez podłączony węzeł przeglądarki.
- Profile `existing-session` mogą ustawiać `userDataDir`, aby kierować do określonego
  profilu przeglądarki opartej na Chromium, takiego jak Brave lub Edge.
- Profile `existing-session` zachowują obecne ograniczenia tras Chrome MCP:
  działania oparte na snapshot/ref zamiast kierowania przez selektory CSS, hooki
  przesyłania jednego pliku, brak nadpisań limitu czasu dialogów, brak `wait --load networkidle`
  oraz brak `responsebody`, eksportu PDF, przechwytywania pobrań i działań wsadowych.
- Lokalnie zarządzane profile `openclaw` automatycznie przypisują `cdpPort` i `cdpUrl`; ustawiaj
  `cdpUrl` jawnie tylko dla zdalnego CDP.
- Kolejność automatycznego wykrywania: domyślna przeglądarka, jeśli oparta na Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Usługa sterowania: tylko loopback (port wyprowadzony z `gateway.port`, domyślnie `18791`).
- `extraArgs` dodaje dodatkowe flagi uruchamiania do lokalnego startu Chromium (na przykład
  `--disable-gpu`, rozmiar okna lub flagi debugowania).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: kolor akcentu dla chromowania natywnego UI aplikacji (odcień dymku trybu Talk itd.).
- `assistant`: nadpisanie tożsamości interfejsu Control UI. Wraca do aktywnej tożsamości agenta.

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
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
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
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
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

- `mode`: `local` (uruchom Gateway) lub `remote` (połącz zdalny Gateway). Gateway odmawia uruchomienia, jeśli nie jest `local`.
- `port`: pojedynczy multipleksowany port dla WS + HTTP. Priorytet: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (domyślnie), `lan` (`0.0.0.0`), `tailnet` (tylko adres IP Tailscale) lub `custom`.
- **Starsze aliasy bind**: używaj wartości trybu bind w `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), a nie aliasów hosta (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Uwaga dotycząca Docker**: domyślne wiązanie `loopback` nasłuchuje na `127.0.0.1` wewnątrz kontenera. Przy sieci bridge Docker (`-p 18789:18789`) ruch dociera przez `eth0`, więc Gateway jest nieosiągalny. Użyj `--network host` albo ustaw `bind: "lan"` (lub `bind: "custom"` z `customBindHost: "0.0.0.0"`), aby nasłuchiwać na wszystkich interfejsach.
- **Auth**: domyślnie wymagane. Wiązania inne niż loopback wymagają uwierzytelnienia Gateway. W praktyce oznacza to współdzielony token/hasło albo reverse proxy świadome tożsamości z `gateway.auth.mode: "trusted-proxy"`. Kreator onboardingu domyślnie generuje token.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRef), ustaw jawnie `gateway.auth.mode` na `token` lub `password`. Uruchamianie oraz przepływy instalacji/naprawy usługi kończą się błędem, gdy skonfigurowano oba, a `mode` nie jest ustawione.
- `gateway.auth.mode: "none"`: jawny tryb bez uwierzytelnienia. Używaj tylko dla zaufanych lokalnych konfiguracji local loopback; ten tryb celowo nie jest oferowany w promptach onboardingu.
- `gateway.auth.mode: "trusted-proxy"`: deleguje uwierzytelnianie do reverse proxy świadomego tożsamości i ufa nagłówkom tożsamości z `gateway.trustedProxies` (zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth)). Ten tryb oczekuje źródła proxy **innego niż loopback**; reverse proxy loopback na tym samym hoście nie spełniają wymagań uwierzytelniania trusted-proxy.
- `gateway.auth.allowTailscale`: gdy `true`, nagłówki tożsamości Tailscale Serve mogą spełniać wymagania uwierzytelnienia Control UI/WebSocket (weryfikowane przez `tailscale whois`). Punkty końcowe HTTP API **nie** używają tego uwierzytelniania nagłówkami Tailscale; stosują zwykły tryb uwierzytelniania HTTP Gateway. Ten przepływ bez tokena zakłada, że host Gateway jest zaufany. Domyślnie `true`, gdy `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: opcjonalny limiter nieudanych prób uwierzytelnienia. Stosowany per IP klienta i per zakres uwierzytelniania (współdzielony sekret i token urządzenia są śledzone niezależnie). Zablokowane próby zwracają `429` + `Retry-After`.
  - W asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, clientIp}` są serializowane przed zapisem niepowodzenia. Równoległe błędne próby od tego samego klienta mogą więc uruchomić limiter przy drugim żądaniu zamiast obu przejść wyścigowo jako zwykłe niedopasowania.
  - `gateway.auth.rateLimit.exemptLoopback` ma domyślnie wartość `true`; ustaw `false`, gdy świadomie chcesz również ograniczać ruch localhost (dla środowisk testowych lub restrykcyjnych wdrożeń proxy).
- Próby uwierzytelnienia WS pochodzące z przeglądarki są zawsze ograniczane z wyłączonym wyjątkiem loopback (defense-in-depth przeciwko brute force localhost z poziomu przeglądarki).
- W loopback te blokady pochodzące z przeglądarki są izolowane per znormalizowana
  wartość `Origin`, więc powtarzające się niepowodzenia z jednego pochodzenia localhost
  nie blokują automatycznie innego pochodzenia.
- `tailscale.mode`: `serve` (tylko tailnet, wiązanie loopback) lub `funnel` (publiczne, wymaga uwierzytelnienia).
- `controlUi.allowedOrigins`: jawna lista dozwolonych pochodzeń przeglądarki dla połączeń WebSocket Gateway. Wymagana, gdy oczekiwani są klienci przeglądarkowi z pochodzeń innych niż loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: niebezpieczny tryb, który włącza zapasowe pochodzenie oparte na nagłówku Host dla wdrożeń świadomie polegających na takiej polityce pochodzenia.
- `remote.transport`: `ssh` (domyślnie) lub `direct` (ws/wss). Dla `direct` `remote.url` musi mieć postać `ws://` lub `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: przełącznik break-glass po stronie klienta, który zezwala na jawny tekst `ws://` do zaufanych prywatnych adresów IP; domyślnie zwykły tekst pozostaje dozwolony tylko dla loopback.
- `gateway.remote.token` / `.password` to pola poświadczeń klienta zdalnego. Same w sobie nie konfigurują uwierzytelnienia Gateway.
- `gateway.push.apns.relay.baseUrl`: bazowy HTTPS URL zewnętrznego przekaźnika APNs używanego przez oficjalne/TestFlight buildy iOS po opublikowaniu przez nie rejestracji opartych na relay do Gateway. Ten URL musi odpowiadać URL relay skompilowanemu w buildzie iOS.
- `gateway.push.apns.relay.timeoutMs`: limit czasu wysyłania z Gateway do relay w milisekundach. Domyślnie `10000`.
- Rejestracje oparte na relay są delegowane do określonej tożsamości Gateway. Sparowana aplikacja iOS pobiera `gateway.identity.get`, uwzględnia tę tożsamość w rejestracji relay i przekazuje do Gateway uprawnienie wysyłania o zakresie tej rejestracji. Inny Gateway nie może ponownie użyć tej zapisanej rejestracji.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tymczasowe nadpisania env dla powyższej konfiguracji relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: wyjście awaryjne tylko do celów deweloperskich dla URL relay HTTP w loopback. Produkcyjne URL relay powinny pozostać przy HTTPS.
- `gateway.channelHealthCheckMinutes`: interwał monitora zdrowia kanałów w minutach. Ustaw `0`, aby globalnie wyłączyć restarty monitora zdrowia. Domyślnie: `5`.
- `gateway.channelStaleEventThresholdMinutes`: próg nieaktualnego gniazda w minutach. Zachowaj wartość większą lub równą `gateway.channelHealthCheckMinutes`. Domyślnie: `30`.
- `gateway.channelMaxRestartsPerHour`: maksymalna liczba restartów monitora zdrowia na kanał/konto w ruchomej godzinie. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: rezygnacja per kanał z restartów monitora zdrowia przy zachowaniu globalnego monitora.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie per konto dla kanałów wielokontowych. Gdy ustawione, ma pierwszeństwo przed nadpisaniem na poziomie kanału.
- Lokalne ścieżki wywołań Gateway mogą używać `gateway.remote.*` jako wartości zapasowej tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się fail-closed (bez maskującego fallbacku zdalnego).
- `trustedProxies`: adresy IP reverse proxy, które kończą TLS lub wstrzykują nagłówki klienta przekazywanego dalej. Wymieniaj tylko proxy, które kontrolujesz. Wpisy loopback nadal są prawidłowe dla konfiguracji wykrywania lokalnego/proxy na tym samym hoście (na przykład Tailscale Serve lub lokalne reverse proxy), ale **nie** sprawiają, że żądania loopback kwalifikują się do `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: gdy `true`, Gateway akceptuje `X-Real-IP`, jeśli brakuje `X-Forwarded-For`. Domyślnie `false` dla zachowania fail-closed.
- `gateway.tools.deny`: dodatkowe nazwy narzędzi blokowane dla HTTP `POST /tools/invoke` (rozszerza domyślną listę blokad).
- `gateway.tools.allow`: usuwa nazwy narzędzi z domyślnej listy blokad HTTP.

</Accordion>

### Punkty końcowe zgodne z OpenAI

- Chat Completions: domyślnie wyłączone. Włącz przez `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Utwardzanie wejść URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Puste listy dozwolonych są traktowane jako nieustawione; użyj `gateway.http.endpoints.responses.files.allowUrl=false`
    i/lub `gateway.http.endpoints.responses.images.allowUrl=false`, aby wyłączyć pobieranie URL.
- Opcjonalny nagłówek utwardzania odpowiedzi:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ustawiaj tylko dla kontrolowanych przez siebie pochodzeń HTTPS; zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Izolacja wielu instancji

Uruchamiaj wiele Gateway na jednym hoście z unikalnymi portami i katalogami stanu:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Wygodne flagi: `--dev` (używa `~/.openclaw-dev` + portu `19001`), `--profile <name>` (używa `~/.openclaw-<name>`).

Zobacz [Wiele Gateway](/pl/gateway/multiple-gateways).

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

- `enabled`: włącza terminację TLS na nasłuchu Gateway (HTTPS/WSS) (domyślnie: `false`).
- `autoGenerate`: automatycznie generuje lokalną parę self-signed cert/key, gdy nie skonfigurowano jawnych plików; tylko do użytku lokalnego/deweloperskiego.
- `certPath`: ścieżka systemu plików do pliku certyfikatu TLS.
- `keyPath`: ścieżka systemu plików do prywatnego klucza TLS; zachowaj ograniczone uprawnienia.
- `caPath`: opcjonalna ścieżka pakietu CA do weryfikacji klienta lub niestandardowych łańcuchów zaufania.

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

- `mode`: kontroluje sposób stosowania edycji konfiguracji w runtime.
  - `"off"`: ignoruj edycje na żywo; zmiany wymagają jawnego restartu.
  - `"restart"`: zawsze restartuj proces Gateway przy zmianie konfiguracji.
  - `"hot"`: stosuj zmiany w procesie bez restartu.
  - `"hybrid"` (domyślnie): najpierw spróbuj hot reload; w razie potrzeby wróć do restartu.
- `debounceMs`: okno debounce w ms przed zastosowaniem zmian konfiguracji (nieujemna liczba całkowita).
- `deferralTimeoutMs`: maksymalny czas w ms oczekiwania na operacje w toku przed wymuszeniem restartu (domyślnie: `300000` = 5 minut).

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
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
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
- `hooks.token` musi być **różny** od `gateway.auth.token`; ponowne użycie tokena Gateway jest odrzucane.
- `hooks.path` nie może być `/`; użyj dedykowanej podścieżki, takiej jak `/hooks`.
- Jeśli `hooks.allowRequestSessionKey=true`, ogranicz `hooks.allowedSessionKeyPrefixes` (na przykład `["hook:"]`).
- Jeśli mapowanie lub preset używa szablonowego `sessionKey`, ustaw `hooks.allowedSessionKeyPrefixes` i `hooks.allowRequestSessionKey=true`. Statyczne klucze mapowań nie wymagają tego opt-in.

**Punkty końcowe:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` z ładunku żądania jest akceptowany tylko wtedy, gdy `hooks.allowRequestSessionKey=true` (domyślnie: `false`).
- `POST /hooks/<name>` → rozwiązywane przez `hooks.mappings`
  - Wartości `sessionKey` renderowane z szablonu w mapowaniu są traktowane jako dostarczone z zewnątrz i również wymagają `hooks.allowRequestSessionKey=true`.

<Accordion title="Szczegóły mapowań">

- `match.path` dopasowuje podścieżkę po `/hooks` (np. `/hooks/gmail` → `gmail`).
- `match.source` dopasowuje pole ładunku dla ścieżek ogólnych.
- Szablony takie jak `{{messages[0].subject}}` odczytują dane z ładunku.
- `transform` może wskazywać moduł JS/TS zwracający akcję hooka.
  - `transform.module` musi być ścieżką względną i pozostaje w obrębie `hooks.transformsDir` (ścieżki bezwzględne i traversal są odrzucane).
- `agentId` kieruje do określonego agenta; nieznane identyfikatory wracają do domyślnego.
- `allowedAgentIds`: ogranicza jawne kierowanie (`*` lub brak = zezwól na wszystkie, `[]` = zabroń wszystkich).
- `defaultSessionKey`: opcjonalny stały klucz sesji dla uruchomień agenta hooka bez jawnego `sessionKey`.
- `allowRequestSessionKey`: pozwala wywołującym `/hooks/agent` i kluczom sesji mapowań sterowanych szablonem ustawiać `sessionKey` (domyślnie: `false`).
- `allowedSessionKeyPrefixes`: opcjonalna lista dozwolonych prefiksów dla jawnych wartości `sessionKey` (żądanie + mapowanie), np. `["hook:"]`. Staje się wymagana, gdy dowolne mapowanie lub preset używa szablonowego `sessionKey`.
- `deliver: true` wysyła końcową odpowiedź do kanału; `channel` domyślnie ma wartość `last`.
- `model` nadpisuje LLM dla tego uruchomienia hooka (musi być dozwolone, jeśli ustawiono katalog modeli).

</Accordion>

### Integracja Gmail

- Wbudowany preset Gmail używa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jeśli zachowujesz to kierowanie per wiadomość, ustaw `hooks.allowRequestSessionKey: true` i ogranicz `hooks.allowedSessionKeyPrefixes`, aby pasowały do przestrzeni nazw Gmail, na przykład `["hook:", "hook:gmail:"]`.
- Jeśli potrzebujesz `hooks.allowRequestSessionKey: false`, nadpisz preset statycznym `sessionKey` zamiast domyślnego szablonowego.

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

- Gateway automatycznie uruchamia `gog gmail watch serve` podczas startu, gdy jest skonfigurowany. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby to wyłączyć.
- Nie uruchamiaj osobnego `gog gmail watch serve` równolegle z Gateway.

---

## Host Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Udostępnia przez HTTP pod portem Gateway HTML/CSS/JS oraz A2UI edytowalne przez agenta:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Tylko lokalnie: zachowaj `gateway.bind: "loopback"` (domyślnie).
- Wiązania inne niż loopback: trasy canvas wymagają uwierzytelnienia Gateway (token/hasło/trusted-proxy), tak samo jak inne powierzchnie HTTP Gateway.
- WebView Node zwykle nie wysyłają nagłówków auth; po sparowaniu i połączeniu węzła Gateway reklamuje URL możliwości o zakresie węzła dla dostępu do canvas/A2UI.
- URL możliwości są powiązane z aktywną sesją WS węzła i szybko wygasają. Zapas oparty na IP nie jest używany.
- Wstrzykuje klienta live-reload do serwowanego HTML.
- Automatycznie tworzy startowy `index.html`, gdy katalog jest pusty.
- Udostępnia także A2UI pod `/__openclaw__/a2ui/`.
- Zmiany wymagają restartu Gateway.
- Wyłącz live reload dla dużych katalogów lub przy błędach `EMFILE`.

---

## Wykrywanie

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
- `full`: zawiera `cliPath` + `sshPort`.
- Nazwa hosta domyślnie to `openclaw`. Nadpisz przez `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Zapisuje strefę unicast DNS-SD w `~/.openclaw/dns/`. Dla wykrywania między sieciami połącz to z serwerem DNS (zalecany CoreDNS) + split DNS Tailscale.

Konfiguracja: `openclaw dns setup --apply`.

---

## Środowisko

### `env` (inline zmienne środowiskowe)

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

- Inline zmienne środowiskowe są stosowane tylko wtedy, gdy w środowisku procesu brakuje klucza.
- Pliki `.env`: `.env` bieżącego katalogu roboczego + `~/.openclaw/.env` (żaden nie nadpisuje istniejących zmiennych).
- `shellEnv`: importuje brakujące oczekiwane klucze z profilu powłoki logowania.
- Zobacz [Środowisko](/pl/help/environment), aby poznać pełny priorytet.

### Podstawianie zmiennych środowiskowych

Odwołuj się do zmiennych środowiskowych w dowolnym ciągu konfiguracji przez `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`.
- Brakujące/puste zmienne powodują błąd przy ładowaniu konfiguracji.
- Użyj `$${VAR}`, aby otrzymać dosłowne `${VAR}`.
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
- identyfikatory `source: "exec"` nie mogą zawierać segmentów ścieżki `.` ani `..` rozdzielonych ukośnikami (na przykład `a/../b` jest odrzucane)

### Obsługiwana powierzchnia poświadczeń

- Kanoniczna macierz: [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- `secrets apply` kieruje do obsługiwanych ścieżek poświadczeń w `openclaw.json`.
- Odwołania `auth-profiles.json` są uwzględniane w rozwiązywaniu runtime i pokryciu audytu.

### Konfiguracja dostawców sekretów

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
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
- Dostawca `exec` wymaga bezwzględnej ścieżki `command` i używa ładunków protokołu na stdin/stdout.
- Domyślnie ścieżki poleceń będące symlinkami są odrzucane. Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki symlink przy jednoczesnej walidacji ścieżki celu po rozwiązaniu.
- Jeśli skonfigurowano `trustedDirs`, kontrola zaufanych katalogów ma zastosowanie do rozwiązanej ścieżki celu.
- Środowisko podrzędne `exec` jest domyślnie minimalne; jawnie przekaż wymagane zmienne przez `passEnv`.
- Odwołania do sekretów są rozwiązywane w czasie aktywacji do migawki w pamięci, a następnie ścieżki żądań odczytują już tylko tę migawkę.
- Filtrowanie aktywnej powierzchni jest stosowane podczas aktywacji: nierozwiązane odwołania na włączonych powierzchniach powodują błąd startu/przeładowania, podczas gdy nieaktywne powierzchnie są pomijane z diagnostyką.

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
- Profile trybu OAuth (`auth.profiles.<id>.mode = "oauth"`) nie obsługują poświadczeń profilu auth opartych na SecretRef.
- Statyczne poświadczenia runtime pochodzą z rozwiązanych migawek w pamięci; starsze statyczne wpisy `auth.json` są czyszczone po wykryciu.
- Starsze importy OAuth pochodzą z `~/.openclaw/credentials/oauth.json`.
- Zobacz [OAuth](/pl/concepts/oauth).
- Zachowanie runtime sekretów oraz narzędzia `audit/configure/apply`: [Zarządzanie sekretami](/pl/gateway/secrets).

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

- `billingBackoffHours`: podstawowy backoff w godzinach, gdy profil zawiedzie z powodu rzeczywistych
  błędów rozliczeniowych/niewystarczających środków (domyślnie: `5`). Jawny tekst dotyczący rozliczeń może
  nadal trafić tutaj nawet przy odpowiedziach `401`/`403`, ale dopasowania tekstu specyficzne dla dostawcy
  pozostają ograniczone do dostawcy, do którego należą (na przykład OpenRouter
  `Key limit exceeded`). Retryowalne komunikaty HTTP `402` o oknie użycia lub
  limicie wydatków organizacji/obszaru roboczego pozostają zamiast tego w ścieżce `rate_limit`.
- `billingBackoffHoursByProvider`: opcjonalne nadpisania per dostawca dla godzin backoff rozliczeniowego.
- `billingMaxHours`: limit w godzinach dla wykładniczego wzrostu backoff rozliczeniowego (domyślnie: `24`).
- `authPermanentBackoffMinutes`: podstawowy backoff w minutach dla błędów `auth_permanent` o wysokiej pewności (domyślnie: `10`).
- `authPermanentMaxMinutes`: limit w minutach dla wzrostu backoff `auth_permanent` (domyślnie: `60`).
- `failureWindowHours`: ruchome okno w godzinach używane dla liczników backoff (domyślnie: `24`).
- `overloadedProfileRotations`: maksymalna liczba rotacji auth-profile tego samego dostawcy dla błędów przeciążenia przed przełączeniem na fallback modelu (domyślnie: `1`). Kształty typu provider-busy, takie jak `ModelNotReadyException`, trafiają tutaj.
- `overloadedBackoffMs`: stałe opóźnienie przed ponowną próbą przeciążonej rotacji dostawcy/profilu (domyślnie: `0`).
- `rateLimitedProfileRotations`: maksymalna liczba rotacji auth-profile tego samego dostawcy dla błędów limitu szybkości przed przełączeniem na fallback modelu (domyślnie: `1`). Ten koszyk limitu szybkości obejmuje teksty w kształcie dostawcy, takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` i `resource exhausted`.

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
- `consoleLevel` podnosi się do `debug`, gdy użyto `--verbose`.
- `maxFileBytes`: maksymalny rozmiar pliku logu w bajtach, po przekroczeniu którego zapisy są wstrzymywane (dodatnia liczba całkowita; domyślnie: `524288000` = 500 MB). W środowiskach produkcyjnych używaj zewnętrznej rotacji logów.

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

- `enabled`: główny przełącznik wyjścia instrumentacji (domyślnie: `true`).
- `flags`: tablica ciągów flag włączających ukierunkowane wyjście logów (obsługuje wildcardy, takie jak `"telegram.*"` lub `"*"`).
- `stuckSessionWarnMs`: próg wieku w ms do emitowania ostrzeżeń o zawieszonych sesjach, gdy sesja pozostaje w stanie przetwarzania.
- `otel.enabled`: włącza potok eksportu OpenTelemetry (domyślnie: `false`).
- `otel.endpoint`: URL kolektora dla eksportu OTel.
- `otel.protocol`: `"http/protobuf"` (domyślnie) lub `"grpc"`.
- `otel.headers`: dodatkowe nagłówki metadanych HTTP/gRPC wysyłane wraz z żądaniami eksportu OTel.
- `otel.serviceName`: nazwa usługi dla atrybutów zasobu.
- `otel.traces` / `otel.metrics` / `otel.logs`: włączają eksport trace, metrics lub logów.
- `otel.sampleRate`: współczynnik próbkowania trace `0`–`1`.
- `otel.flushIntervalMs`: okresowy interwał opróżniania telemetrii w ms.
- `cacheTrace.enabled`: loguje migawki śledzenia cache dla uruchomień embedded (domyślnie: `false`).
- `cacheTrace.filePath`: ścieżka wyjściowa dla JSONL śledzenia cache (domyślnie: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kontrolują, co jest uwzględniane w wyjściu śledzenia cache (wszystkie domyślnie: `true`).

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
- `checkOnStart`: sprawdza aktualizacje npm przy uruchomieniu Gateway (domyślnie: `true`).
- `auto.enabled`: włącza automatyczną aktualizację w tle dla instalacji pakietowych (domyślnie: `false`).
- `auto.stableDelayHours`: minimalne opóźnienie w godzinach przed automatycznym zastosowaniem na kanale stable (domyślnie: `6`; maks.: `168`).
- `auto.stableJitterHours`: dodatkowe okno rozłożenia wdrożenia kanału stable w godzinach (domyślnie: `12`; maks.: `168`).
- `auto.betaCheckIntervalHours`: jak często wykonywane są sprawdzenia kanału beta, w godzinach (domyślnie: `1`; maks.: `24`).

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

- `enabled`: globalna bramka funkcji ACP (domyślnie: `false`).
- `dispatch.enabled`: niezależna bramka dla wysyłania tur sesji ACP (domyślnie: `true`). Ustaw `false`, aby zachować dostępność poleceń ACP przy jednoczesnym blokowaniu wykonania.
- `backend`: domyślny identyfikator backendu runtime ACP (musi odpowiadać zarejestrowanemu Plugin runtime ACP).
- `defaultAgent`: zapasowy identyfikator docelowego agenta ACP, gdy spawn nie określa jawnego celu.
- `allowedAgents`: lista dozwolonych identyfikatorów agentów dla sesji runtime ACP; pusty zbiór oznacza brak dodatkowych ograniczeń.
- `maxConcurrentSessions`: maksymalna liczba jednocześnie aktywnych sesji ACP.
- `stream.coalesceIdleMs`: okno opróżniania bezczynności w ms dla tekstu strumieniowanego.
- `stream.maxChunkChars`: maksymalny rozmiar fragmentu przed podziałem projekcji strumieniowanego bloku.
- `stream.repeatSuppression`: tłumi powtarzające się linie statusu/narzędzi per tura (domyślnie: `true`).
- `stream.deliveryMode`: `"live"` strumieniuje przyrostowo; `"final_only"` buforuje do końcowych zdarzeń tury.
- `stream.hiddenBoundarySeparator`: separator przed widocznym tekstem po ukrytych zdarzeniach narzędzi (domyślnie: `"paragraph"`).
- `stream.maxOutputChars`: maksymalna liczba znaków wyjścia asystenta rzutowana per tura ACP.
- `stream.maxSessionUpdateChars`: maksymalna liczba znaków dla rzutowanych linii statusu/aktualizacji ACP.
- `stream.tagVisibility`: zapis mapowania nazw tagów na logiczne nadpisania widoczności dla zdarzeń strumieniowanych.
- `runtime.ttlMinutes`: TTL bezczynności w minutach dla workerów sesji ACP przed kwalifikacją do czyszczenia.
- `runtime.installCommand`: opcjonalne polecenie instalacyjne uruchamiane podczas bootstrap środowiska runtime ACP.

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

- `cli.banner.taglineMode` kontroluje styl sloganu bannera:
  - `"random"` (domyślnie): rotujące zabawne/sezonowe slogany.
  - `"default"`: stały neutralny slogan (`All your chats, one OpenClaw.`).
  - `"off"`: brak tekstu sloganu (tytuł/wersja bannera nadal są wyświetlane).
- Aby ukryć cały banner (nie tylko slogany), ustaw env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadane zapisywane przez prowadzone przepływy konfiguracji CLI (`onboard`, `configure`, `doctor`):

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

Zobacz pola tożsamości `agents.list` w sekcji [Ustawienia domyślne agentów](#agent-defaults).

---

## Bridge (starsze, usunięte)

Bieżące buildy nie zawierają już mostu TCP. Węzły łączą się przez WebSocket Gateway. Klucze `bridge.*` nie są już częścią schematu konfiguracji (walidacja kończy się błędem, dopóki nie zostaną usunięte; `openclaw doctor --fix` może usunąć nieznane klucze).

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
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: jak długo zachowywać ukończone izolowane sesje uruchomień Cron przed usunięciem z `sessions.json`. Kontroluje także czyszczenie zarchiwizowanych usuniętych transkryptów Cron. Domyślnie: `24h`; ustaw `false`, aby wyłączyć.
- `runLog.maxBytes`: maksymalny rozmiar pliku logu na uruchomienie (`cron/runs/<jobId>.jsonl`) przed przycięciem. Domyślnie: `2_000_000` bajtów.
- `runLog.keepLines`: liczba najnowszych linii zachowywanych po uruchomieniu przycinania logu uruchomienia. Domyślnie: `2000`.
- `webhookToken`: token bearer używany do dostarczania POST Webhook dla Cron (`delivery.mode = "webhook"`); jeśli pominięty, żaden nagłówek auth nie jest wysyłany.
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
- `retryOn`: typy błędów wyzwalające ponowienia — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Pomiń, aby ponawiać wszystkie typy przejściowe.

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

- `enabled`: włącza alerty o niepowodzeniach zadań Cron (domyślnie: `false`).
- `after`: liczba kolejnych niepowodzeń przed wysłaniem alertu (dodatnia liczba całkowita, min.: `1`).
- `cooldownMs`: minimalna liczba milisekund między powtarzanymi alertami dla tego samego zadania (nieujemna liczba całkowita).
- `mode`: tryb dostarczania — `"announce"` wysyła przez wiadomość kanałową; `"webhook"` wykonuje POST do skonfigurowanego webhooka.
- `accountId`: opcjonalny identyfikator konta lub kanału ograniczający zakres dostarczania alertu.

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

- Domyślny cel powiadomień o niepowodzeniach Cron dla wszystkich zadań.
- `mode`: `"announce"` lub `"webhook"`; domyślnie `"announce"`, gdy istnieje wystarczająca liczba danych celu.
- `channel`: nadpisanie kanału dla dostarczania announce. `"last"` ponownie używa ostatniego znanego kanału dostarczania.
- `to`: jawny cel announce lub URL webhooka. Wymagane dla trybu webhook.
- `accountId`: opcjonalne nadpisanie konta dla dostarczania.
- `delivery.failureDestination` per zadanie nadpisuje tę globalną wartość domyślną.
- Gdy nie ustawiono ani globalnego, ani per-zadanie celu niepowodzenia, zadania, które już dostarczają przez `announce`, w przypadku niepowodzenia wracają do tego głównego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań `sessionTarget="isolated"`, chyba że główny `delivery.mode` zadania ma wartość `"webhook"`.

Zobacz [Zadania Cron](/pl/automation/cron-jobs). Izolowane wykonania Cron są śledzone jako [zadania w tle](/pl/automation/tasks).

---

## Zmienne szablonu modelu multimediów

Placeholdery szablonu rozwijane w `tools.media.models[].args`:

| Zmienna           | Opis                                              |
| ----------------- | ------------------------------------------------- |
| `{{Body}}`        | Pełna treść wiadomości przychodzącej              |
| `{{RawBody}}`     | Surowa treść (bez opakowań historii/nadawcy)      |
| `{{BodyStripped}}`| Treść z usuniętymi wzmiankami grupowymi           |
| `{{From}}`        | Identyfikator nadawcy                             |
| `{{To}}`          | Identyfikator celu                                |
| `{{MessageSid}}`  | Identyfikator wiadomości kanału                   |
| `{{SessionId}}`   | UUID bieżącej sesji                               |
| `{{IsNewSession}}`| `"true"` po utworzeniu nowej sesji                |
| `{{MediaUrl}}`    | Pseudo-URL przychodzących multimediów             |
| `{{MediaPath}}`   | Lokalna ścieżka multimediów                       |
| `{{MediaType}}`   | Typ multimediów (image/audio/document/…)          |
| `{{Transcript}}`  | Transkrypt audio                                  |
| `{{Prompt}}`      | Rozwiązany prompt multimediów dla wpisów CLI      |
| `{{MaxChars}}`    | Rozwiązana maksymalna liczba znaków wyjściowych dla wpisów CLI |
| `{{ChatType}}`    | `"direct"` lub `"group"`                          |
| `{{GroupSubject}}`| Temat grupy (best effort)                         |
| `{{GroupMembers}}`| Podgląd członków grupy (best effort)              |
| `{{SenderName}}`  | Nazwa wyświetlana nadawcy (best effort)           |
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
- Tablica plików: scalana głęboko w kolejności (późniejsze nadpisują wcześniejsze).
- Klucze sąsiednie: scalane po include’ach (nadpisują wartości z include).
- Zagnieżdżone include’y: do 10 poziomów głębokości.
- Ścieżki: rozwiązywane względem pliku dołączającego, ale muszą pozostać w obrębie katalogu głównego konfiguracji najwyższego poziomu (`dirname` pliku `openclaw.json`). Formy bezwzględne/`../` są dozwolone tylko wtedy, gdy po rozwiązaniu nadal mieszczą się w tym ograniczeniu.
- Błędy: czytelne komunikaty dla brakujących plików, błędów parsowania i cyklicznych include’ów.

---

_Powiązane: [Konfiguracja](/pl/gateway/configuration) · [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Doctor](/pl/gateway/doctor)_
