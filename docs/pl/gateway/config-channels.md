---
read_when:
    - Konfigurowanie pluginu kanału (uwierzytelnianie, kontrola dostępu, obsługa wielu kont)
    - Rozwiązywanie problemów z kluczami konfiguracji poszczególnych kanałów
    - Audyt zasad wiadomości prywatnych, zasad grupowych lub wymogu wzmianki
summary: 'Konfiguracja kanałów: kontrola dostępu, parowanie i klucze poszczególnych kanałów w Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych usługach'
title: Konfiguracja — kanały
x-i18n:
    generated_at: "2026-07-16T18:23:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

Klucze konfiguracji poszczególnych kanałów w sekcji `channels.*`: dostęp do wiadomości prywatnych i grup, konfiguracje wielu kont, wymóg wzmianki oraz klucze poszczególnych kanałów dla Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych pluginów kanałów.

Informacje o agentach, narzędziach, środowisku uruchomieniowym Gateway i innych kluczach najwyższego poziomu znajdują się w [dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Kanały

Każdy kanał uruchamia się automatycznie, gdy istnieje jego sekcja konfiguracji (chyba że `enabled: false`). Telegram i iMessage są dostarczane w ramach podstawowego pakietu `openclaw`. Inne oficjalne kanały (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost i inne) instaluje się jako oddzielne pluginy za pomocą `openclaw plugins install <spec>`; pełna lista i instrukcje instalacji znajdują się w sekcji [Kanały](/pl/channels).

### Dostęp do wiadomości prywatnych i grup

Wszystkie kanały obsługują zasady wiadomości prywatnych i grup:

| Zasada wiadomości prywatnych | Działanie                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (domyślna) | Nieznani nadawcy otrzymują jednorazowy kod parowania; właściciel musi go zatwierdzić |
| `allowlist`         | Tylko nadawcy z `allowFrom` (lub ze sparowanego magazynu dozwolonych nadawców)             |
| `open`              | Zezwalaj na wszystkie przychodzące wiadomości prywatne (wymaga `allowFrom: ["*"]`)             |
| `disabled`          | Ignoruj wszystkie przychodzące wiadomości prywatne                                          |

| Zasada grup            | Działanie                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (domyślna) | Tylko grupy zgodne ze skonfigurowaną listą dozwolonych          |
| `open`                | Pomijaj listy dozwolonych grup (wymóg wzmianki nadal obowiązuje) |
| `disabled`            | Blokuj wszystkie wiadomości grup i pokojów                          |

<Note>
`channels.defaults.groupPolicy` określa wartość domyślną, gdy `groupPolicy` dostawcy nie jest ustawione.
Kody parowania wygasają po 1 godzinie. Liczba oczekujących żądań parowania jest ograniczona do **3 na konto** (w zakresie kanału i identyfikatora konta).
Jeśli całkowicie brakuje bloku dostawcy (brak `channels.<provider>`), zasada grup w środowisku uruchomieniowym przyjmuje wartość `allowlist` (bezpieczna odmowa dostępu) i podczas uruchamiania wyświetlane jest ostrzeżenie.
</Note>

### Nadpisywanie modelu dla kanałów

Użyj `channels.modelByChannel`, aby przypisać określone identyfikatory kanałów lub uczestników wiadomości prywatnych do modelu. Wartości mogą mieć postać `provider/model` lub skonfigurowanych aliasów modeli. Mapowanie kanału ma zastosowanie tylko wtedy, gdy sesja nie ma jeszcze aktywnego nadpisania modelu (na przykład ustawionego przez `/model`).

W przypadku rozmów grupowych i wątków kluczami są identyfikatory grup, identyfikatory tematów lub nazwy kanałów właściwe dla danego kanału. W przypadku rozmów w wiadomościach prywatnych (DM) kluczami są identyfikatory uczestników pochodzące z tożsamości nadawcy kanału (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` lub `SenderId`). Dokładna postać klucza zależy od kanału:

| Kanał    | Postać klucza DM    | Przykład                                     |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | nieprzetworzony identyfikator użytkownika | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | identyfikator użytkownika Matrix | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | nieprzetworzony identyfikator użytkownika | `123456789`                                  |
| WhatsApp | numer telefonu lub JID | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
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

Klucze właściwe dla wiadomości prywatnych są dopasowywane tylko w rozmowach prywatnych; nie wpływają na trasowanie grup ani wątków.

### Ustawienia domyślne kanałów i Heartbeat

Użyj `channels.defaults` do wspólnego określenia zasad grup i działania Heartbeat dla różnych dostawców:

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

- `channels.defaults.groupPolicy`: rezerwowa zasada grup, gdy `groupPolicy` na poziomie dostawcy nie jest ustawione.
- `channels.defaults.contextVisibility`: domyślny tryb widoczności dodatkowego kontekstu dla wszystkich kanałów. Wartości: `all` (domyślna, uwzględnia cały kontekst cytatów, wątków i historii), `allowlist` (uwzględnia tylko kontekst od nadawców z listy dozwolonych), `allowlist_quote` (tak samo jak lista dozwolonych, ale zachowuje jawny kontekst cytatu lub odpowiedzi). Nadpisanie dla kanału: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: uwzględniaj prawidłowe stany kanałów w danych wyjściowych Heartbeat (domyślnie `false`).
- `channels.defaults.heartbeat.showAlerts`: uwzględniaj stany obniżonej sprawności lub błędów w danych wyjściowych Heartbeat (domyślnie `true`).
- `channels.defaults.heartbeat.useIndicator`: renderuj zwarte dane wyjściowe Heartbeat w formie wskaźnika (domyślnie `true`).

### WhatsApp

WhatsApp działa przez kanał internetowy Gateway (Baileys Web). Uruchamia się automatycznie, gdy istnieje połączona sesja.

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = ponawiaj bez końca
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // niebieskie znaczniki (false w trybie czatu z samym sobą)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- `web.whatsapp.keepAliveIntervalMs` (domyślnie `25000`), `connectTimeoutMs` (domyślnie `60000`) i `defaultQueryTimeoutMs` (domyślnie `60000`) dostrajają gniazdo Baileys.
- Wartości domyślne `web.reconnect`: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. `maxAttempts: 0` powoduje ponawianie bez końca zamiast rezygnacji.
- Wpisy `bindings[]` najwyższego poziomu z `type: "acp"` konfigurują trwałe powiązania ACP dla wiadomości prywatnych i grup WhatsApp. W `match.peer.id` użyj bezpośredniego numeru w formacie E.164 lub identyfikatora JID grupy WhatsApp. Semantyka pól jest wspólna i opisana w sekcji [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).

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

- Polecenia wychodzące domyślnie używają konta `default`, jeśli istnieje; w przeciwnym razie używany jest pierwszy skonfigurowany identyfikator konta (po posortowaniu).
- Opcjonalne `channels.whatsapp.defaultAccount` zastępuje ten rezerwowy wybór konta domyślnego, jeśli odpowiada skonfigurowanemu identyfikatorowi konta.
- Starszy katalog uwierzytelniania Baileys dla jednego konta jest migrowany przez `openclaw doctor` do `whatsapp/default`.
- Nadpisania dla poszczególnych kont: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Odpowiadaj zwięźle.",
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
      streaming: { mode: "partial" }, // off | partial | block | progress (domyślnie: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bota: `channels.telegram.botToken` lub `channels.telegram.tokenFile` (wyłącznie zwykły plik; dowiązania symboliczne są odrzucane), z `TELEGRAM_BOT_TOKEN` jako wartością rezerwową dla konta domyślnego.
- `apiRoot` jest wyłącznie głównym adresem Telegram Bot API. Użyj `https://api.telegram.org` lub własnego adresu głównego hostowanego samodzielnie bądź przez serwer proxy, a nie `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` usuwa przypadkowy końcowy sufiks `/bot<TOKEN>`.
- W przypadku samodzielnie hostowanego serwera Bot API w trybie `--local` parametr `trustedLocalFileRoots` określa ścieżki hosta, które OpenClaw może odczytywać. Zamontuj wolumin danych serwera na hoście OpenClaw i skonfiguruj jego katalog główny danych albo katalog dla danego tokenu; ścieżki kontenera w `/var/lib/telegram-bot-api` są mapowane do tych katalogów głównych. Inne ścieżki bezwzględne nadal są odrzucane.
- Opcjonalne `channels.telegram.defaultAccount` zastępuje domyślny wybór konta, jeśli odpowiada skonfigurowanemu identyfikatorowi konta.
- W konfiguracjach wielu kont (co najmniej 2 identyfikatory kont) ustaw jawne konto domyślne (`channels.telegram.defaultAccount` lub `channels.telegram.accounts.default`), aby uniknąć trasowania rezerwowego; `openclaw doctor` ostrzega, gdy tej wartości brakuje lub jest nieprawidłowa.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Telegram (migracje identyfikatorów supergrup, `/config set|unset`).
- Wpisy `bindings[]` najwyższego poziomu z `type: "acp"` konfigurują trwałe powiązania ACP dla tematów forum (użyj kanonicznego `chatId:topic:topicId` w `match.peer.id`). Semantyka pól jest wspólna i opisana w sekcji [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- Podglądy strumieni Telegram używają `sendMessage` i `editMessageText` (działa w czatach prywatnych i grupowych).
- `network.dnsResultOrder` ma domyślnie wartość `"ipv4first"`, aby uniknąć typowych błędów pobierania przez IPv6.
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
              systemPrompt: "Tylko krótkie odpowiedzi.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (domyślnie w Discord: progress)
        chunkMode: "length", // length | newline
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

- Token: `channels.discord.token`, z `DISCORD_BOT_TOKEN` jako wartością zastępczą dla konta domyślnego.
- Bezpośrednie wywołania wychodzące, które podają jawny `token` Discord, używają tego tokenu do wywołania; ustawienia ponawiania i zasad konta nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
- Opcjonalny `channels.discord.defaultAccount` zastępuje domyślny wybór konta, gdy odpowiada identyfikatorowi skonfigurowanego konta.
- Dla celów dostarczania należy używać `user:<id>` (DM) lub `channel:<id>` (kanał serwera); same identyfikatory numeryczne są odrzucane.
- Slugi serwerów zapisuje się małymi literami, zastępując spacje przez `-`; klucze kanałów używają nazwy w postaci sluga (bez `#`). Preferowane są identyfikatory serwerów.
- Wiadomości utworzone przez boty są domyślnie ignorowane. `allowBots: true` je włącza; `allowBots: "mentions"` pozwala akceptować tylko wiadomości botów, które wspominają bota (własne wiadomości nadal są filtrowane).
- Kanały obsługujące przychodzące wiadomości utworzone przez boty mogą korzystać ze wspólnej [ochrony przed pętlami botów](/pl/channels/bot-loop-protection). Należy ustawić `channels.defaults.botLoopProtection` dla bazowych limitów par, a następnie zastępować ustawienia kanału lub konta tylko wtedy, gdy dana powierzchnia wymaga innych limitów.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (oraz ustawienia zastępujące kanałów) odrzuca wiadomości, które wspominają innego użytkownika lub rolę, ale nie bota (z wyjątkiem @everyone/@here).
- `channels.discord.mentionAliases` mapuje stabilny tekst wychodzący `@handle` na identyfikatory użytkowników Discord przed wysłaniem, dzięki czemu znanych członków zespołu można wspominać deterministycznie nawet wtedy, gdy przejściowa pamięć podręczna katalogu jest pusta. Ustawienia zastępujące dla poszczególnych kont znajdują się w `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (domyślnie `17`) dzieli wysokie wiadomości nawet wtedy, gdy mają mniej niż 2000 znaków.
- `channels.discord.suppressEmbeds` ma domyślną wartość `true`, dlatego wychodzące adresy URL nie rozwijają się w podglądy linków Discord, chyba że ta opcja zostanie wyłączona. Jawne ładunki `embeds` nadal są wysyłane normalnie; wywołania narzędzi dla poszczególnych wiadomości mogą zastąpić to ustawienie przez `suppressEmbeds`.
- `channels.discord.threadBindings` steruje trasowaniem Discord powiązanym z wątkami:
  - `enabled`: ustawienie zastępujące Discord dla funkcji sesji powiązanych z wątkiem (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane dostarczanie/trasowanie)
  - `idleHours`: ustawienie zastępujące Discord dla automatycznego wyłączania aktywności po bezczynności, w godzinach (`0` wyłącza)
  - `maxAgeHours`: ustawienie zastępujące Discord dla bezwzględnego maksymalnego wieku, w godzinach (`0` wyłącza)
  - `spawnSessions`: przełącznik automatycznego tworzenia i wiązania wątków dla `sessions_spawn({ thread: true })` oraz tworzenia wątków ACP (domyślnie: `true`)
  - `defaultSpawnContext`: natywny kontekst podagenta dla instancji tworzonych w powiązaniu z wątkiem (domyślnie `"fork"`)
- Wpisy najwyższego poziomu `bindings[]` z `type: "acp"` konfigurują trwałe powiązania ACP dla kanałów i wątków (należy użyć identyfikatora kanału/wątku w `match.peer.id`). Semantyka pól jest wspólna i opisana w sekcji [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` ustawia kolor akcentu kontenerów komponentów Discord v2.
- `channels.discord.agentComponents.ttlMs` określa, jak długo wywołania zwrotne wysłanych komponentów Discord pozostają zarejestrowane. Domyślnie `1800000` (30 minut), maksymalnie `86400000` (24 godziny). Ustawienia zastępujące dla poszczególnych kont znajdują się w `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Należy preferować najkrótszy TTL odpowiedni dla danego przepływu pracy.
- `channels.discord.voice` włącza rozmowy na kanałach głosowych Discord oraz opcjonalne automatyczne dołączanie i ustawienia zastępujące LLM oraz TTS. Konfiguracje Discord obejmujące tylko tekst domyślnie pozostawiają obsługę głosu wyłączoną; aby ją włączyć, należy ustawić `channels.discord.voice.enabled=true`.
- `channels.discord.voice.model` opcjonalnie zastępuje model LLM używany do odpowiedzi na kanałach głosowych Discord.
- `channels.discord.voice.daveEncryption` (domyślnie `true`) oraz `channels.discord.voice.decryptionFailureTolerance` (domyślnie `24`) są przekazywane do opcji DAVE `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` steruje początkowym oczekiwaniem na stan Ready `@discordjs/voice` dla `/vc join` oraz prób automatycznego dołączenia (domyślnie `30000`).
- `channels.discord.voice.reconnectGraceMs` określa, ile czasu odłączona sesja głosowa może potrzebować na rozpoczęcie sygnalizowania ponownego połączenia, zanim OpenClaw ją zniszczy (domyślnie `15000`).
- Odtwarzanie głosu w Discord nie jest przerywane przez zdarzenie rozpoczęcia mówienia przez innego użytkownika. Aby uniknąć pętli sprzężenia zwrotnego, OpenClaw ignoruje nowe przechwytywanie głosu podczas odtwarzania TTS.
- OpenClaw dodatkowo próbuje przywrócić odbiór głosu przez opuszczenie sesji głosowej i ponowne do niej dołączenie po wielokrotnych niepowodzeniach odszyfrowywania.
- `channels.discord.streaming` jest kanonicznym kluczem trybu strumienia. Discord domyślnie używa `streaming.mode: "progress"`, dzięki czemu postęp narzędzi/pracy pojawia się w jednej edytowanej wiadomości podglądu; aby go wyłączyć, należy ustawić `streaming.mode: "off"`. Starsze płaskie klucze (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) nie są już odczytywane w czasie wykonywania; aby zmigrować utrwaloną konfigurację, należy uruchomić `openclaw doctor --fix`.
- `channels.discord.autoPresence` mapuje dostępność środowiska uruchomieniowego na obecność bota (sprawne => online, zdegradowane => bezczynny, wyczerpane => nie przeszkadzać) i umożliwia opcjonalne zastępowanie tekstu statusu.
- `channels.discord.guilds.<id>.presenceEvents` kieruje zdarzenia pojawienia się dostępności osób do jednego skonfigurowanego kanału Discord jako zdarzenia systemowe agenta. Uprawnieni członkowie muszą mieć możliwość wyświetlania `channelId`; wątki publiczne dziedziczą widoczność elementu nadrzędnego, natomiast wątki prywatne dodatkowo wymagają członkostwa lub uprawnienia Manage Threads. `users` może dodatkowo zawęzić tę grupę odbiorców. Mechanizm inicjuje bieżących członków online z pełnych migawek `GUILD_CREATE`, trasuje zaobserwowane przejścia ze stanu offline do online i traktuje pierwszy późniejszy sygnał online dla wcześniej niewidzianego członka jako nową dostępność, bez stwierdzania, czy osoba przeszła w tryb online, czy dołączyła po wykonaniu migawki. Serwery przekraczające limit migawki Discord wynoszący 75 000 członków wymagają najpierw jawnej aktualizacji stanu offline. Parametry ograniczania: `reconnectSuppressSeconds` (okres ciszy po nowej sesji Gateway, gdy stan obecności serwera jest odbudowywany; domyślnie 300, `0` wyłącza) oraz `burstLimit`/`burstWindowSeconds` (limit częstotliwości pomyślnie kolejkowanych zdarzeń dla każdego serwera; domyślnie 8 zdarzeń na przesuwne okno 60s). Wznowione sesje nie rozpoczynają okna blokowania po ponownym połączeniu. Istniejący czas odnowienia ponownego powitania użytkownika pozostaje równy ośmiu godzinom. Wymaga to `channels.discord.intents.presence=true`, uprzywilejowanego Presence Intent w Developer Portal Discord oraz włączonego Heartbeat agenta.
- `channels.discord.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennych nazw/tagów (awaryjny tryb zgodności).
- `channels.discord.execApprovals`: natywne dla Discord dostarczanie zatwierdzeń wykonywania i autoryzacja osób zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie automatycznym zatwierdzenia wykonywania są aktywowane, gdy osoby zatwierdzające można rozpoznać na podstawie `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Discord uprawnionych do zatwierdzania żądań wykonania. W przypadku pominięcia używana jest wartość zastępcza `commands.ownerAllowFrom`.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pominięcie powoduje przekazywanie zatwierdzeń dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub wyrażenie regularne).
  - `target`: miejsce wysyłania monitów o zatwierdzenie. `"dm"` (domyślnie) wysyła je w wiadomościach DM do osób zatwierdzających, `"channel"` wysyła je do kanału źródłowego, a `"both"` wysyła je do obu miejsc. Gdy cel obejmuje `"channel"`, przyciski mogą być używane wyłącznie przez rozpoznane osoby zatwierdzające.
  - `cleanupAfterResolve`: gdy `true`, usuwa wiadomości DM dotyczące zatwierdzenia po zatwierdzeniu, odmowie lub przekroczeniu limitu czasu.

**Tryby powiadomień o reakcjach:** `off` (brak), `own` (wiadomości bota, domyślnie), `all` (wszystkie wiadomości), `allowlist` (od `guilds.<id>.users` we wszystkich wiadomościach).

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
- Wartości zastępcze ze zmiennych środowiskowych: `GOOGLE_CHAT_SERVICE_ACCOUNT` lub `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (tylko konto domyślne).
- Dla celów dostarczania należy używać `spaces/<spaceId>` lub `users/<userId>`.
- `channels.googlechat.dangerouslyAllowNameMatching` ponownie włącza dopasowywanie zmiennego podmiotu adresu e-mail (awaryjny tryb zgodności).

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
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
      replyToMode: "off", // wyłączone | pierwsza | wszystkie | grupowane
      thread: {
        historyScope: "thread", // wątek | kanał
        inheritParent: false,
        initialHistoryLimit: 20,
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
      streaming: {
        mode: "partial", // wyłączone | częściowe | blok | postęp
        chunkMode: "length", // długość | nowy wiersz
        nativeTransport: true, // używaj natywnego interfejsu API strumieniowania Slack, gdy mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // wiadomość prywatna | kanał | oba
      },
    },
  },
}
```

- **Tryb Socket** wymaga zarówno `botToken`, jak i `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` dla domyślnego mechanizmu rezerwowego zmiennych środowiskowych konta).
- **Tryb HTTP** wymaga `botToken` oraz `signingSecret` (na poziomie głównym lub dla każdego konta).
- `enterpriseOrgInstall: true` włącza dla konta ścieżkę zdarzeń Slack Enterprise Grid
  obejmującą całą organizację. Podczas uruchamiania token bota jest weryfikowany za pomocą `auth.test`, a
  uruchomienie kończy się niepowodzeniem, gdy skonfigurowany tryb nie odpowiada tożsamości instalacji Slack.
  Wiadomości prywatne Enterprise muszą być wyłączone albo używać `dmPolicy: "open"` z obowiązującym
  `allowFrom: ["*"]`. Zasady kanałów i użytkowników muszą używać trwałych identyfikatorów Slack;
  zmienne nazwy i nieobsługiwane prefiksy kanałów powodują niepowodzenie uruchamiania. Wersja V1 obsługuje tylko
  bezpośrednie zdarzenia trybu Socket lub HTTP `message` i `app_mention` z natychmiastowymi
  odpowiedziami; przekaźniki, polecenia, interakcje, App Home, detektory zdarzeń reakcji,
  przypięcia, narzędzia akcji, natywne zatwierdzenia, powiązania, odroczone dostarczanie oraz
  aktywne wysyłanie są niedostępne. Potwierdzanie odbioru, sygnalizowanie pisania i
  reakcje statusu należące do detektora pozostają dostępne z `reactions:write`; powiadomienia o
  reakcjach przychodzących i narzędzia akcji reakcji są niedostępne. Zobacz
  [Instalacje Enterprise Grid obejmujące całą organizację](/pl/channels/slack#enterprise-grid-org-wide-installs),
  aby poznać manifest z najmniejszymi uprawnieniami, procedurę konfiguracji i pełne ograniczenia.
- `socketMode` przekazuje ustawienia transportu trybu Socket zestawu SDK Slack do publicznego interfejsu API odbiornika Bolt. Należy używać tej opcji tylko podczas badania przekroczeń limitu czasu ping/pong lub problemów z nieaktywnym połączeniem WebSocket. `clientPingTimeout` ma domyślnie wartość `15000`; `serverPingTimeout` i `pingPongLoggingEnabled` są przekazywane tylko wtedy, gdy zostały skonfigurowane.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują ciągi
  tekstowe w postaci zwykłego tekstu lub obiekty SecretRef.
- Migawki kont Slack udostępniają pola źródła/statusu dla poszczególnych danych uwierzytelniających, takie jak
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, a w trybie HTTP także
  `signingSecretStatus`. `configured_unavailable` oznacza, że konto jest
  skonfigurowane za pomocą SecretRef, ale bieżąca ścieżka polecenia/środowiska wykonawczego nie mogła
  rozpoznać wartości sekretu.
- `configWrites: false` blokuje zapisy konfiguracji inicjowane przez Slack.
- Opcjonalne `channels.slack.defaultAccount` zastępuje wybór domyślnego konta, gdy odpowiada identyfikatorowi skonfigurowanego konta.
- `channels.slack.streaming.mode` jest kanonicznym kluczem trybu strumienia Slack (domyślnie `"partial"`). `channels.slack.streaming.nativeTransport` steruje natywnym transportem strumieniowym Slack (domyślnie `true`). Starsze wartości `streamMode`, logiczne `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` i `nativeStreaming` nie są już odczytywane w czasie działania; uruchom `openclaw doctor --fix`, aby zmigrować zapisaną konfigurację do `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` i `unfurlMedia` przekazują wartości logiczne `chat.postMessage` Slack dotyczące rozwijania łączy i multimediów w odpowiedziach bota. `unfurlLinks` ma domyślnie wartość `false`, dzięki czemu wychodzące łącza bota nie są rozwijane w treści, chyba że ta funkcja zostanie włączona; `unfurlMedia` jest pomijane, jeśli nie zostało skonfigurowane. Ustaw dowolną z tych wartości w `channels.slack.accounts.<accountId>`, aby zastąpić wartość najwyższego poziomu dla jednego konta.
- W przypadku celów dostarczania użyj `user:<id>` (wiadomość prywatna) lub `channel:<id>`.

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

**Izolacja sesji wątku:** `thread.historyScope` jest ustawiane osobno dla każdego wątku (domyślnie) lub współdzielone w obrębie kanału. `thread.inheritParent` kopiuje transkrypcję kanału nadrzędnego do nowych wątków. `thread.initialHistoryLimit` (domyślnie `20`) ogranicza liczbę istniejących wiadomości wątku pobieranych podczas rozpoczynania nowej sesji wątku; `0` wyłącza pobieranie historii wątku.

- Natywne strumieniowanie Slack oraz status wątku „is typing...” w stylu asystenta Slack wymagają wskazania wątku odpowiedzi jako celu. Wiadomości prywatne najwyższego poziomu domyślnie pozostają poza wątkami, dzięki czemu nadal mogą być przesyłane strumieniowo przy użyciu wersji roboczych Slack publikowanych i edytowanych jako podgląd, zamiast wyświetlać natywny podgląd strumienia/statusu w stylu wątku.
- `typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack podczas generowania odpowiedzi, a następnie usuwa ją po zakończeniu. Użyj krótkiego kodu emoji Slack, takiego jak `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: natywne dla Slack dostarczanie klienta zatwierdzeń i autoryzacja osób zatwierdzających wykonanie. Schemat jest taki sam jak w Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identyfikatory użytkowników Slack), `agentFilter`, `sessionFilter` i `target` (`"dm"`, `"channel"` lub `"both"`). Zatwierdzenia Pluginów mogą korzystać z tej ścieżki natywnego klienta w przypadku żądań pochodzących ze Slack, gdy możliwe jest rozpoznanie osób zatwierdzających Plugin Slack; dostarczanie zatwierdzeń Pluginów natywne dla Slack można również włączyć za pomocą `approvals.plugin` dla sesji pochodzących ze Slack lub celów Slack. Zatwierdzenia Pluginów korzystają z osób zatwierdzających Plugin Slack z `allowFrom` oraz z domyślnego routingu, a nie z osób zatwierdzających wykonanie.

| Grupa akcji | Domyślnie | Uwagi                         |
| ------------ | ---------- | ----------------------------- |
| reactions    | włączone   | Reagowanie i lista reakcji    |
| messages     | włączone   | Odczyt/wysyłanie/edycja/usuwanie |
| pins         | włączone   | Przypinanie/odpinanie/lista   |
| memberInfo   | włączone   | Informacje o członku          |
| emojiList    | włączone   | Lista niestandardowych emoji  |

### Mattermost

Mattermost instaluje się jako osobny Plugin, tak samo jak Discord, Slack i WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Przed przypięciem wersji sprawdź bieżące znaczniki dystrybucji na stronie [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost).

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // przy wywołaniu | przy wiadomości | przy znaku
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opcjonalne włączenie
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Opcjonalny jawny adres URL dla wdrożeń z odwrotnym serwerem proxy/publicznych
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Tryby czatu: `oncall` (odpowiadanie na wzmiankę @, domyślnie), `onmessage` (każda wiadomość), `onchar` (wiadomości zaczynające się od prefiksu wyzwalającego).

Gdy natywne polecenia Mattermost są włączone:

- `commands.callbackPath` musi być ścieżką (na przykład `/api/channels/mattermost/command`), a nie pełnym adresem URL.
- `commands.callbackUrl` musi wskazywać punkt końcowy Gateway OpenClaw i być dostępne z serwera Mattermost.
- Natywne wywołania zwrotne poleceń ukośnikowych są uwierzytelniane za pomocą tokenów poszczególnych poleceń zwracanych
  przez Mattermost podczas rejestrowania poleceń ukośnikowych. Jeśli rejestracja nie powiedzie się lub żadne
  polecenia nie zostaną aktywowane, OpenClaw odrzuca wywołania zwrotne z
  `Unauthorized: invalid command token.`
- W przypadku prywatnych/wewnętrznych hostów wywołań zwrotnych lub hostów w sieci tailnet Mattermost może wymagać,
  aby `ServiceSettings.AllowedUntrustedInternalConnections` zawierało host/domenę wywołania zwrotnego.
  Użyj wartości hosta/domeny, a nie pełnych adresów URL.
- `channels.mattermost.configWrites`: zezwala na zapisy konfiguracji inicjowane przez Mattermost lub ich zabrania.
- `channels.mattermost.requireMention`: wymaga `@mention` przed udzieleniem odpowiedzi na kanałach.
- `channels.mattermost.groups.<channelId>.requireMention`: zastąpienie bramkowania wzmiankami dla poszczególnych kanałów (`"*"` dla wartości domyślnej).
- Opcjonalne `channels.mattermost.defaultAccount` zastępuje wybór domyślnego konta, gdy odpowiada identyfikatorowi skonfigurowanego konta.

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
      reactionNotifications: "own", // wyłączone | własne | wszystkie | lista dozwolonych
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Tryby powiadomień o reakcjach:** `off`, `own` (domyślnie), `all`, `allowlist` (z `reactionAllowlist`).

- `channels.signal.account`: przypisuje uruchamianie kanału do określonej tożsamości konta Signal.
- `channels.signal.configWrites`: zezwala na zapisy konfiguracji inicjowane przez Signal lub ich zabrania.
- Opcjonalne `channels.signal.defaultAccount` zastępuje wybór domyślnego konta, gdy odpowiada identyfikatorowi skonfigurowanego konta.

### iMessage

OpenClaw uruchamia `imsg rpc` (JSON-RPC przez standardowe wejście/wyjście). Demon ani port nie są wymagane. Jest to preferowana ścieżka dla nowych konfiguracji OpenClaw z iMessage, gdy host może przyznać uprawnienia do bazy danych Wiadomości i Automatyzacji.

Obsługa BlueBubbles została usunięta. `channels.bluebubbles` nie jest obsługiwaną powierzchnią konfiguracji środowiska wykonawczego w bieżącej wersji OpenClaw. Należy zmigrować stare konfiguracje do `channels.imessage`; skrócony opis zawiera strona [Usunięcie BlueBubbles i ścieżka imsg dla iMessage](/pl/announcements/bluebubbles-imessage), a pełną tabelę translacji zawiera strona [Migracja z BlueBubbles](/pl/channels/imessage-from-bluebubbles).

Jeśli Gateway nie działa na Macu zalogowanym do Wiadomości, pozostaw `channels.imessage.enabled=true` i ustaw `channels.imessage.cliPath` na skrypt opakowujący SSH, który uruchamia `imsg "$@"` na tym Macu. Domyślna lokalna ścieżka `imsg` jest przeznaczona wyłącznie dla systemu macOS.

Przed wykorzystaniem skryptu opakowującego SSH do wysyłania produkcyjnego zweryfikuj wychodzące `imsg send` za pośrednictwem dokładnie tego skryptu. Niektóre stany TCC systemu macOS przypisują Automatyzację Wiadomości do `/usr/libexec/sshd-keygen-wrapper`, co może sprawić, że odczyty i testy będą działać, podczas gdy wysyłanie zakończy się niepowodzeniem AppleEvents `-1743`; zobacz sekcję rozwiązywania problemów ze skryptem opakowującym SSH w [iMessage](/pl/channels/imessage).

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

- Opcjonalne ustawienie `channels.imessage.defaultAccount` zastępuje domyślny wybór konta, gdy odpowiada identyfikatorowi skonfigurowanego konta.
- Wymaga pełnego dostępu do dysku w celu korzystania z bazy danych Wiadomości.
- Preferowane są cele `chat_id:<id>`. Aby wyświetlić listę czatów, należy użyć `imsg chats --limit 20`.
- `cliPath` może wskazywać skrypt opakowujący SSH; w celu pobierania załączników przez SCP należy ustawić `remoteHost` (`host` lub `user@host`).
- `attachmentRoots` i `remoteAttachmentRoots` ograniczają ścieżki przychodzących załączników (domyślnie: `/Users/*/Library/Messages/Attachments`).
- SCP używa rygorystycznego sprawdzania klucza hosta, dlatego należy upewnić się, że klucz hosta pośredniczącego już istnieje w `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: zezwala na zapisywanie konfiguracji zainicjowane przez iMessage lub je blokuje.
- `channels.imessage.sendTransport`: preferowany transport wysyłania RPC `imsg` dla zwykłych odpowiedzi wychodzących. `auto` (domyślnie) używa mostu IMCore dla istniejących czatów, gdy jest on uruchomiony, a następnie przełącza się na AppleScript; `bridge` wymaga dostarczania przez prywatne API; `applescript` wymusza publiczną ścieżkę automatyzacji Wiadomości.
- `channels.imessage.actions.*`: włącza działania prywatnego API, które są również kontrolowane przez `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` jest domyślnie wyłączone; przed oczekiwaniem przychodzących multimediów w turach agenta należy ustawić tę opcję na `true`.
- Odzyskiwanie wiadomości przychodzących po ponownym uruchomieniu mostu lub gatewaya odbywa się automatycznie (deduplikacja według GUID oraz ograniczenie wieku nieaktualnych zaległości). Istniejące konfiguracje `channels.imessage.catchup.enabled: true` są nadal obsługiwane jako przestarzały profil zgodności; `catchup` jest domyślnie wyłączone.
- `channels.imessage.groups`: rejestr grup i ustawienia poszczególnych grup. W przypadku `groupPolicy: "allowlist"` należy skonfigurować jawne klucze `chat_id` albo wpis wieloznaczny `"*"`, aby wiadomości grupowe mogły przejść przez bramkę rejestru.
- Wpisy najwyższego poziomu `bindings[]` zawierające `type: "acp"` mogą wiązać konwersacje iMessage z trwałymi sesjami ACP. W polu `match.peer.id` należy użyć znormalizowanego uchwytu lub jawnego celu czatu (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`). Wspólna semantyka pól: [Agenci ACP](/pl/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Przykład skryptu opakowującego SSH dla iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix korzysta z pluginu i jest konfigurowany w `channels.matrix`.

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
- `channels.matrix.proxy` kieruje ruch HTTP Matrix przez jawnie określony serwer proxy HTTP(S). Nazwane konta mogą zastąpić to ustawienie za pomocą `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` zezwala na prywatne lub wewnętrzne serwery domowe. `proxy` i ta zgoda na dostęp sieciowy są niezależnymi mechanizmami kontroli.
- `channels.matrix.defaultAccount` wybiera preferowane konto w konfiguracjach z wieloma kontami.
- `channels.matrix.autoJoin` ma domyślnie wartość `"off"`, dlatego zaproszenia do pokojów i nowe zaproszenia przypominające wiadomości bezpośrednie są ignorowane do czasu ustawienia `autoJoin: "allowlist"` za pomocą `autoJoinAllowlist` lub `autoJoin: "always"`.
- `channels.matrix.execApprovals`: natywne dla Matrix dostarczanie próśb o zatwierdzenie wykonania oraz autoryzacja zatwierdzających.
  - `enabled`: `true`, `false` lub `"auto"` (domyślnie). W trybie automatycznym zatwierdzanie wykonania zostaje aktywowane, gdy osoby zatwierdzające można ustalić na podstawie `approvers` lub `commands.ownerAllowFrom`.
  - `approvers`: identyfikatory użytkowników Matrix (np. `@owner:example.org`) uprawnionych do zatwierdzania żądań wykonania.
  - `agentFilter`: opcjonalna lista dozwolonych identyfikatorów agentów. Pominięcie powoduje przekazywanie zatwierdzeń dla wszystkich agentów.
  - `sessionFilter`: opcjonalne wzorce kluczy sesji (podciąg lub wyrażenie regularne).
  - `target`: miejsce wysyłania próśb o zatwierdzenie. `"dm"` (domyślnie), `"channel"` (pokój źródłowy) lub `"both"`.
  - Ustawienia zastępujące dla poszczególnych kont: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` określa sposób grupowania wiadomości bezpośrednich Matrix w sesje: `per-user` (domyślnie) współdzieli sesję według docelowego uczestnika, natomiast `per-room` izoluje każdy pokój wiadomości bezpośrednich.
- Sondy stanu Matrix i bieżące wyszukiwanie w katalogu korzystają z tych samych zasad proxy co ruch w czasie działania.
- Pełną konfigurację Matrix, reguły kierowania i przykłady konfiguracji opisano w [Matrix](/pl/channels/matrix).

### Microsoft Teams

Microsoft Teams korzysta z pluginu i jest konfigurowany w `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook oraz zasady zespołów/kanałów:
      // zobacz /channels/msteams
    },
  },
}
```

- Opisane tutaj główne ścieżki kluczy: `channels.msteams`, `channels.msteams.configWrites`.
- Pełną konfigurację Teams (dane uwierzytelniające, webhook, zasady wiadomości bezpośrednich i grup, ustawienia zastępujące dla poszczególnych zespołów i kanałów) opisano w [Microsoft Teams](/pl/channels/msteams).

### IRC

IRC korzysta z pluginu i jest konfigurowany w `channels.irc`.

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

- Opisane tutaj główne ścieżki kluczy: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Opcjonalne ustawienie `channels.irc.defaultAccount` zastępuje domyślny wybór konta, gdy odpowiada identyfikatorowi skonfigurowanego konta.
- Pełną konfigurację kanału IRC (host, port, TLS, kanały, listy dozwolonych i wymóg wzmianki) opisano w [IRC](/pl/channels/irc).

### Wiele kont (wszystkie kanały)

Można uruchomić wiele kont w każdym kanale (każde z własnym `accountId`):

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

- `default` jest używane, gdy pominięto `accountId` (CLI + kierowanie).
- Tokeny ze zmiennych środowiskowych mają zastosowanie wyłącznie do konta **domyślnego**.
- Podstawowe ustawienia kanału mają zastosowanie do wszystkich kont, chyba że zostaną zastąpione dla danego konta.
- Aby skierować każde konto do innego agenta, należy użyć `bindings[].match.accountId`.
- Jeśli konto inne niż domyślne zostanie dodane za pomocą `openclaw channels add` (lub podczas wdrażania kanału), gdy nadal obowiązuje jednokontowa konfiguracja kanału najwyższego poziomu, OpenClaw najpierw przeniesie wartości jednokontowe najwyższego poziomu właściwe dla konta do mapy kont kanału, dzięki czemu pierwotne konto będzie nadal działać. Większość kanałów przenosi je do `channels.<channel>.accounts.default`; Matrix może zamiast tego zachować istniejący, pasujący nazwany lub domyślny cel.
- Istniejące powiązania dotyczące tylko kanału (bez `accountId`) nadal odpowiadają kontu domyślnemu; powiązania właściwe dla kont pozostają opcjonalne.
- `openclaw doctor --fix` naprawia również mieszane struktury, przenosząc wartości jednokontowe najwyższego poziomu właściwe dla konta do konta wybranego do migracji dla danego kanału. Większość kanałów używa `accounts.default`; Matrix może zamiast tego zachować istniejący, pasujący nazwany lub domyślny cel.

### Inne kanały pluginów

Wiele kanałów pluginów konfiguruje się jako `channels.<id>`, a ich dokumentacja znajduje się na osobnych stronach kanałów (na przykład Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch i Zalo).
Pełny indeks kanałów: [Kanały](/pl/channels).

### Wymóg wzmianki na czatach grupowych

Wiadomości grupowe domyślnie **wymagają wzmianki** (wzmianki w metadanych lub bezpiecznych wzorców wyrażeń regularnych). Dotyczy to czatów grupowych WhatsApp, Telegram, Discord, Google Chat i iMessage.

Widoczne odpowiedzi są kontrolowane osobno. Zwykłe bezpośrednie żądania z grup, kanałów i wewnętrznego WebChat domyślnie korzystają z automatycznego dostarczania odpowiedzi końcowej: końcowy tekst asystenta jest publikowany przez starszą ścieżkę widocznej odpowiedzi. Należy włączyć `messages.visibleReplies: "message_tool"` lub `messages.groupChat.visibleReplies: "message_tool"`, jeśli widoczne dane wyjściowe mają być publikowane dopiero po wywołaniu przez agenta `message(action=send)`. Jeśli model zwróci merytoryczną odpowiedź końcową bez wywołania narzędzia wiadomości w włączonym trybie wyłącznie narzędziowym, tekst końcowy pozostaje prywatny, szczegółowy dziennik gatewaya rejestruje metadane pominiętego ładunku, a OpenClaw umieszcza w kolejce jedną ponowną próbę odzyskiwania, prosząc model o dostarczenie tej samej odpowiedzi za pomocą `message(action=send)`.

Widoczne odpowiedzi wyłącznie narzędziowe wymagają modelu lub środowiska wykonawczego, które niezawodnie wywołuje narzędzia, i są zalecane w przypadku współdzielonych pokojów ogólnych przy użyciu modeli najnowszej generacji, takich jak GPT-5.6 Sol. Niektóre słabsze modele potrafią zwrócić tekst końcowy, ale nie rozumieją, że dane wyjściowe widoczne w źródle muszą zostać wysłane za pomocą `message(action=send)`. OpenClaw domyślnie odzyskuje typowy przypadek niedostarczonej odpowiedzi końcowej tylko wtedy, gdy odpowiedź końcowa jest merytoryczna, tura źródłowa nie była zdarzeniem pokoju, zasady wysyłania nie zabroniły dostarczenia i nie wysłano jeszcze odpowiedzi do źródła. Odzyskiwanie jest ograniczone do jednej ponownej próby; wyłącza zapisywanie syntetycznej prośby ponownej próby i nie uwzględnia jej w grupowaniu zbiorczym, dzięki czemu nie może ona zostać połączona z niezwiązanymi prośbami oczekującymi w kolejce. Jeśli ponowna próba również nie zostanie dostarczona lub nie będzie można umieścić jej w kolejce, OpenClaw dostarczy jedynie oczyszczony komunikat diagnostyczny, na przykład „Wygenerowano odpowiedź, ale nie udało się jej dostarczyć do tego czatu. Spróbuj ponownie.” Pierwotny prywatny tekst końcowy nigdy nie jest oznaczany do automatycznego dostarczenia do źródła. W przypadku modeli, które wielokrotnie nie dostarczają odpowiedzi, należy użyć `"automatic"`, aby końcowa tura asystenta stanowiła ścieżkę widocznej odpowiedzi, przełączyć się na mocniejszy model wywołujący narzędzia, sprawdzić podsumowanie pominiętego ładunku w szczegółowym dzienniku gatewaya albo ustawić `messages.groupChat.visibleReplies: "automatic"`, aby używać widocznych odpowiedzi końcowych dla każdego żądania grupowego lub kanałowego.

Jeśli narzędzie wiadomości jest niedostępne zgodnie z aktywnymi zasadami narzędzi, OpenClaw przełącza się na automatyczne widoczne odpowiedzi zamiast po cichu pomijać odpowiedź. `openclaw doctor` ostrzega o tej niezgodności.

Ta reguła ma zastosowanie do zwykłego tekstu końcowego agenta. Powiązania konwersacji należące do pluginu używają odpowiedzi zwróconej przez plugin będący właścicielem jako widocznej odpowiedzi dla przejętych tur powiązanego wątku; plugin nie musi wywoływać `message(action=send)` dla takich odpowiedzi powiązania.

**Rozwiązywanie problemów: wzmianka @ w grupie uruchamia wskaźnik pisania, po czym zapada cisza (bez błędu)**

Objaw: wzmianka @ w grupie lub kanale powoduje wyświetlenie wskaźnika pisania, a dziennik gatewaya zgłasza `dispatch complete (queuedFinal=false, replies=0)`, ale w pokoju nie pojawia się żadna wiadomość. Wiadomości bezpośrednie do tego samego agenta otrzymują odpowiedzi normalnie.

Przyczyna: tryb widocznych odpowiedzi grupy/kanału jest rozpoznawany jako `"message_tool"`, dlatego OpenClaw wykonuje turę, ale pomija końcowy tekst asystenta, chyba że agent wywoła `message(action=send)`. W tym trybie nie obowiązuje kontrakt `NO_REPLY`; brak wywołania narzędzia wiadomości oznacza, że pierwotny tekst końcowy pozostaje prywatny. W przypadku merytorycznych tur źródłowych OpenClaw podejmuje teraz jedną chronioną próbę odzyskania; krótkie notatki, jawne milczenie, zdarzenia pokoju, tury odrzucone przez zasady wysyłania oraz tury już dostarczone nie są ponawiane. Zwykłe tury grup i kanałów domyślnie używają `"automatic"`, więc ten objaw występuje tylko wtedy, gdy `messages.groupChat.visibleReplies` (lub globalne `messages.visibleReplies`) zostanie jawnie ustawione na `"message_tool"`. Ustawienie uprzęży `defaultVisibleReplies` nie ma tutaj zastosowania — mechanizm rozpoznawania grupy/kanału je ignoruje; wpływa ono tylko na czaty bezpośrednie/źródłowe (uprząż Codex pomija w ten sposób końcowe odpowiedzi czatu bezpośredniego).

Rozwiązanie: należy wybrać model sprawniej wywołujący narzędzia, usunąć jawne nadpisanie `"message_tool"`, aby powrócić do domyślnego ustawienia `"automatic"`, albo ustawić `messages.groupChat.visibleReplies: "automatic"`, aby wymusić widoczne odpowiedzi dla każdego żądania grupy/kanału. Merytoryczna, niedostarczona odpowiedź końcowa nie powinna już kończyć się cichym sukcesem; powinna zostać odzyskana przez jedną próbę `message(action=send)` albo wyświetlić oczyszczony komunikat diagnostyczny o niepowodzeniu dostarczenia. Gateway dynamicznie przeładowuje konfigurację `messages` po zapisaniu pliku; Gateway należy uruchomić ponownie tylko wtedy, gdy w danym wdrożeniu wyłączono obserwowanie plików lub przeładowywanie konfiguracji.

**Typy wzmianek:**

- **Wzmianki w metadanych**: Natywne wzmianki @ platformy. Ignorowane w trybie czatu z samym sobą w WhatsApp.
- **Wzorce tekstowe**: Bezpieczne wzorce wyrażeń regularnych w `agents.list[].groupChat.mentionPatterns`. Nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- Bramkowanie wzmianek jest egzekwowane tylko wtedy, gdy wykrywanie jest możliwe (natywne wzmianki lub co najmniej jeden wzorzec).

```json5
{
  messages: {
    visibleReplies: "automatic", // wymuś stare automatyczne odpowiedzi końcowe dla czatów bezpośrednich/źródłowych
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // stale aktywna rozmowa w pokoju bez wzmianki staje się cichym kontekstem
      visibleReplies: "message_tool", // opcjonalnie; wymagaj message(action=send) dla widocznych odpowiedzi w pokoju
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` ustawia globalną wartość domyślną. Kanały mogą ją nadpisać za pomocą `channels.<channel>.historyLimit` (lub dla poszczególnych kont). Aby wyłączyć, należy ustawić `0`.

`messages.groupChat.unmentionedInbound: "room_event"` przekazuje niewymienione, stale aktywne wiadomości grupy/kanału jako cichy kontekst pokoju w obsługiwanych kanałach. Wiadomości ze wzmiankami, polecenia i wiadomości bezpośrednie nadal pozostają żądaniami użytkownika. Pełne przykłady dla Discord, Slack i Telegram zawiera sekcja [Zdarzenia otoczenia pokoju](/pl/channels/ambient-room-events).

`messages.visibleReplies` jest globalną wartością domyślną zdarzeń źródłowych; `messages.groupChat.visibleReplies` nadpisuje ją dla zdarzeń źródłowych grupy/kanału. Gdy `messages.visibleReplies` nie jest ustawione, czaty bezpośrednie/źródłowe używają ustawienia domyślnego wybranego środowiska uruchomieniowego lub uprzęży, ale wewnętrzne bezpośrednie tury WebChat używają automatycznego dostarczania odpowiedzi końcowych w celu zachowania zgodności promptów Pi/Codex. Aby celowo wymagać `message(action=send)` do uzyskania widocznych danych wyjściowych, należy ustawić `messages.visibleReplies: "message_tool"`. Listy dozwolonych kanałów i bramkowanie wzmianek nadal decydują o tym, czy zdarzenie zostanie przetworzone.

#### Limity historii wiadomości bezpośrednich

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

Kolejność rozstrzygania: nadpisanie dla wiadomości bezpośredniej → wartość domyślna dostawcy → brak limitu (wszystkie są zachowywane).

Ten mechanizm rozpoznawania odczytuje `channels.<provider>.dmHistoryLimit` i `channels.<provider>.dms.<id>.historyLimit` dla każdego kanału, którego klucz sesji jest zgodny ze standardowym formatem `provider:direct:<id>` (lub starszym `provider:dm:<id>`), dlatego działa zarówno w kanałach dołączonych, jak i kanałach Plugin, a nie tylko dla ustalonej listy.

#### Tryb czatu z samym sobą

Aby włączyć tryb czatu z samym sobą, należy dodać własny numer do `allowFrom` (natywne wzmianki @ są ignorowane, a odpowiedzi są wysyłane tylko na wzorce tekstowe):

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
    native: "auto", // rejestruj natywne polecenia, jeśli są obsługiwane
    nativeSkills: "auto", // rejestruj natywne polecenia umiejętności, jeśli są obsługiwane
    text: true, // analizuj polecenia /commands w wiadomościach czatu
    bash: false, // zezwalaj na ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // zezwalaj na /config
    mcp: false, // zezwalaj na /mcp
    plugins: false, // zezwalaj na /plugins
    debug: false, // zezwalaj na /debug
    restart: true, // zezwalaj na /restart i zewnętrzne żądania ponownego uruchomienia SIGUSR1
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

- Ten blok konfiguruje interfejsy poleceń. Aktualny katalog wbudowanych i dołączonych poleceń zawiera sekcja [Polecenia z ukośnikiem](/pl/tools/slash-commands).
- Ta strona jest **dokumentacją kluczy konfiguracji**, a nie pełnym katalogiem poleceń. Polecenia należące do kanałów/Plugin, takie jak QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, parowanie urządzeń `/pair`, pamięć `/dreaming`, sterowanie telefonem `/phone` oraz Talk `/voice`, są opisane na stronach odpowiednich kanałów/Plugin oraz w sekcji [Polecenia z ukośnikiem](/pl/tools/slash-commands).
- Polecenia tekstowe muszą być **samodzielnymi** wiadomościami rozpoczynającymi się od `/`.
- `native: "auto"` włącza natywne polecenia dla Discord/Telegram, pozostawiając je wyłączone dla Slack.
- `nativeSkills: "auto"` włącza natywne polecenia umiejętności dla Discord/Telegram, pozostawiając je wyłączone dla Slack.
- Nadpisanie dla poszczególnych kanałów: `channels.discord.commands.native` (wartość logiczna lub `"auto"`). W przypadku Discord ustawienie `false` pomija rejestrację i czyszczenie natywnych poleceń podczas uruchamiania.
- Natywną rejestrację poleceń umiejętności dla poszczególnych kanałów można nadpisać za pomocą `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` dodaje dodatkowe pozycje menu bota Telegram.
- `bash: true` włącza `! <cmd>` dla powłoki hosta. Wymaga `tools.elevated.enabled` oraz obecności nadawcy w `tools.elevated.allowFrom.<channel>`.
- `config: true` włącza `/config` (odczytuje/zapisuje `openclaw.json`). W przypadku klientów Gateway `chat.send` trwałe zapisy `/config set|unset` wymagają również `operator.admin`; `/config show` tylko do odczytu pozostaje dostępne dla zwykłych klientów operatora z zakresem zapisu.
- `mcp: true` włącza `/mcp` dla konfiguracji serwerów MCP zarządzanych przez OpenClaw w `mcp.servers`.
- `plugins: true` włącza `/plugins` do wykrywania i instalowania Plugin oraz sterowania ich włączaniem/wyłączaniem.
- `channels.<provider>.configWrites` kontroluje możliwość modyfikowania konfiguracji dla poszczególnych kanałów (domyślnie: true).
- W przypadku kanałów obsługujących wiele kont `channels.<provider>.accounts.<id>.configWrites` kontroluje również zapisy kierowane do danego konta (na przykład `/allowlist --config --account <id>` lub `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` wyłącza `/restart` i zewnętrzne żądania ponownego uruchomienia `SIGUSR1`. Wartość domyślna: `true`.
- `ownerAllowFrom` jest jawną listą dozwolonych właścicieli dla poleceń dostępnych tylko dla właściciela i działań kanału ograniczonych do właściciela. Jest niezależna od `allowFrom`.
- `ownerDisplay: "hash"` haszuje identyfikatory właścicieli w prompcie systemowym. Aby kontrolować haszowanie, należy ustawić `ownerDisplaySecret`.
- `allowFrom` jest ustawieniem dla poszczególnych dostawców. Po ustawieniu stanowi **jedyne** źródło autoryzacji (listy dozwolonych kanałów/parowanie oraz `useAccessGroups` są ignorowane).
- `useAccessGroups: false` pozwala poleceniom omijać zasady grup dostępu, gdy `allowFrom` nie jest ustawione.
- Mapa dokumentacji poleceń:
  - katalog wbudowany i dołączony: [Polecenia z ukośnikiem](/pl/tools/slash-commands)
  - interfejsy poleceń właściwe dla kanałów: [Kanały](/pl/channels)
  - polecenia QQ Bot: [QQ Bot](/pl/channels/qqbot)
  - polecenia parowania: [Parowanie](/pl/channels/pairing)
  - polecenie karty LINE: [LINE](/pl/channels/line)
  - śnienie pamięci: [Dreaming](/pl/concepts/dreaming)

</Accordion>

---

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — klucze najwyższego poziomu
- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Omówienie kanałów](/pl/channels)
