---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-06-30T14:27:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74244c721bfd752bf4ce73a6739503c902a14d07edef5ca6300c87f717669a7e
    source_path: channels/discord.md
    workflow: 16
---

Gotowe dla wiadomości prywatnych i kanałów serwera za pośrednictwem oficjalnego Gateway Discord.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Discord domyślnie używają trybu parowania.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i przepływ naprawy.
  </Card>
</CardGroup>

## Szybka konfiguracja

Musisz utworzyć nową aplikację z botem, dodać bota do swojego serwera i sparować go z OpenClaw. Zalecamy dodanie bota do własnego prywatnego serwera. Jeśli jeszcze go nie masz, [najpierw go utwórz](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wybierz **Create My Own > For me and my friends**).

<Steps>
  <Step title="Utwórz aplikację i bota Discord">
    Przejdź do [Discord Developer Portal](https://discord.com/developers/applications) i kliknij **New Application**. Nazwij ją na przykład „OpenClaw”.

    Kliknij **Bot** na pasku bocznym. Ustaw **Username** na nazwę, której używasz dla swojego agenta OpenClaw.

  </Step>

  <Step title="Włącz uprzywilejowane intencje">
    Nadal na stronie **Bot** przewiń w dół do **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazw do identyfikatorów)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem w górę strony **Bot** i kliknij **Reset Token**.

    <Note>
    Mimo nazwy generuje to pierwszy token — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest Twój **Bot Token** i wkrótce będzie potrzebny.

  </Step>

  <Step title="Wygeneruj URL zaproszenia i dodaj bota do serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do serwera.

    Przewiń w dół do **OAuth2 URL Generator** i włącz:

    - `bot`
    - `applications.commands`

    Poniżej pojawi się sekcja **Bot Permissions**. Włącz co najmniej:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcjonalne)

    To jest zestaw bazowy dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w przepływach forum lub kanałów multimedialnych, które tworzą albo kontynuują wątek, włącz także **Send Messages in Threads**.
    Skopiuj wygenerowany URL na dole, wklej go w przeglądarce, wybierz swój serwer i kliknij **Continue**, aby połączyć. Bot powinien być teraz widoczny na serwerze Discord.

  </Step>

  <Step title="Włącz Developer Mode i zbierz swoje identyfikatory">
    Wróć do aplikacji Discord. Musisz włączyć Developer Mode, aby móc kopiować wewnętrzne identyfikatory.

    1. Kliknij **User Settings** (ikona koła zębatego obok awatara) → przewiń do **Developer** na pasku bocznym → włącz **Developer Mode**

        *(Uwaga: w aplikacji mobilnej Discord Developer Mode znajduje się w **App Settings** → **Advanced**)*

    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem **własny awatar** → **Copy User ID**

    Zapisz **Server ID** i **User ID** razem z Bot Token — w następnym kroku wyślesz wszystkie trzy do OpenClaw.

  </Step>

  <Step title="Zezwól na wiadomości prywatne od członków serwera">
    Aby parowanie działało, Discord musi zezwalać botowi na wysyłanie do Ciebie wiadomości prywatnych. Kliknij prawym przyciskiem **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać Ci wiadomości prywatne. Pozostaw to włączone, jeśli chcesz używać wiadomości prywatnych Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, możesz wyłączyć wiadomości prywatne po parowaniu.

  </Step>

  <Step title="Ustaw token bota bezpiecznie (nie wysyłaj go na czacie)">
    Token bota Discord jest sekretem (jak hasło). Ustaw go na maszynie uruchamiającej OpenClaw przed wysłaniem wiadomości do agenta.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    Jeśli OpenClaw działa już jako usługa w tle, uruchom go ponownie przez aplikację OpenClaw Mac albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.
    W przypadku instalacji jako zarządzana usługa uruchom `openclaw gateway install` z powłoki, w której obecny jest `DISCORD_BOT_TOKEN`, albo zapisz zmienną w `~/.openclaw/.env`, aby usługa mogła rozwiązać env SecretRef po restarcie.
    Jeśli host jest blokowany lub ograniczany przez Discord podczas startowego wyszukiwania aplikacji, ustaw identyfikator aplikacji/klienta Discord z Developer Portal, aby start mógł pominąć to wywołanie REST. Użyj `channels.discord.applicationId` dla konta domyślnego albo `channels.discord.accounts.<accountId>.applicationId`, gdy uruchamiasz wiele botów Discord.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i przekaż mu to. Jeśli Discord jest Twoim pierwszym kanałem, użyj zamiast tego karty CLI / konfiguracja.

        > „Ustawiłem już token mojego bota Discord w konfiguracji. Dokończ konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`.”
      </Tab>
      <Tab title="CLI / konfiguracja">
        Jeśli wolisz konfigurację opartą na pliku, ustaw:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Awaryjne env dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        W przypadku konfiguracji skryptowej lub zdalnej zapisz ten sam blok JSON5 za pomocą `openclaw config patch --file ./discord.patch.json5 --dry-run`, a następnie uruchom ponownie bez `--dry-run`. Wartości `token` w tekście jawnym są obsługiwane. Wartości SecretRef są również obsługiwane dla `channels.discord.token` w dostawcach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

        W przypadku wielu botów Discord trzymaj token każdego bota i identyfikator aplikacji na jego koncie. Najwyższego poziomu `channels.discord.applicationId` jest dziedziczone przez konta, więc ustawiaj je tam tylko wtedy, gdy każde konto ma używać tego samego identyfikatora aplikacji.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zatwierdź pierwsze parowanie przez wiadomość prywatną">
    Poczekaj, aż Gateway będzie uruchomiony, a następnie wyślij wiadomość prywatną do bota w Discord. Odpowie kodem parowania.

    <Tabs>
      <Tab title="Zapytaj agenta">
        Wyślij kod parowania do agenta na istniejącym kanale:

        > „Zatwierdź ten kod parowania Discord: `<CODE>`”
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kody parowania wygasają po 1 godzinie.

    Teraz powinno dać się rozmawiać z agentem w Discord przez wiadomość prywatną.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenów uwzględnia konto. Wartości tokenów z konfiguracji mają pierwszeństwo przed awaryjnym env. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
Jeśli dwa włączone konta Discord rozwiązują się do tego samego tokena bota, OpenClaw uruchamia tylko jeden monitor Gateway dla tego tokena. Token pochodzący z konfiguracji ma pierwszeństwo przed domyślnym awaryjnym env; w przeciwnym razie wygrywa pierwsze włączone konto, a zduplikowane konto jest zgłaszane jako wyłączone.
Dla zaawansowanych wywołań wychodzących (narzędzie wiadomości/akcje kanału) jawny `token` dla danego wywołania jest używany tylko dla tego wywołania. Dotyczy to akcji wysyłania i akcji typu odczyt/sonda (na przykład read/search/fetch/thread/pins/permissions). Ustawienia polityki konta i ponawiania nadal pochodzą z wybranego konta w aktywnej migawce runtime.
</Note>

## Zalecane: skonfiguruj obszar roboczy serwera

Gdy wiadomości prywatne działają, możesz skonfigurować swój serwer Discord jako pełny obszar roboczy, w którym każdy kanał otrzymuje własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteś tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj serwer do listy dozwolonych serwerów">
    Dzięki temu agent może odpowiadać w dowolnym kanale na Twoim serwerze, nie tylko w wiadomościach prywatnych.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Dodaj mój Discord Server ID `<server_id>` do listy dozwolonych serwerów”
      </Tab>
      <Tab title="Konfiguracja">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zezwól na odpowiedzi bez @mention">
    Domyślnie agent odpowiada w kanałach serwera tylko wtedy, gdy zostanie oznaczony przez @mention. W przypadku prywatnego serwera prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    W kanałach serwera zwykłe odpowiedzi są domyślnie publikowane automatycznie. W przypadku współdzielonych, stale aktywnych pokoi włącz `messages.groupChat.visibleReplies: "message_tool"`, aby agent mógł obserwować i publikować tylko wtedy, gdy uzna, że odpowiedź w kanale jest przydatna. Działa to najlepiej z najnowszej generacji modelami niezawodnymi w używaniu narzędzi, takimi jak GPT 5.5. Zdarzenia otoczenia w pokoju pozostają ciche, chyba że narzędzie wyśle wiadomość. Pełną konfigurację trybu obserwowania znajdziesz w [Zdarzeniach otoczenia w pokoju](/pl/channels/ambient-room-events).

    Jeśli Discord pokazuje pisanie, a logi pokazują użycie tokenów, ale nie ma opublikowanej wiadomości, sprawdź, czy tura została skonfigurowana jako zdarzenie otoczenia w pokoju albo czy włączono widoczne odpowiedzi przez narzędzie wiadomości.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Zezwól mojemu agentowi na odpowiadanie na tym serwerze bez konieczności oznaczania go przez @mention”
      </Tab>
      <Tab title="Konfiguracja">
        Ustaw `requireMention: false` w konfiguracji serwera:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        Aby wymagać wysyłania przez narzędzie wiadomości dla widocznych odpowiedzi grupowych/kanałowych, ustaw `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zaplanuj pamięć w kanałach serwera">
    Domyślnie pamięć długoterminowa (MEMORY.md) ładuje się tylko w sesjach wiadomości prywatnych. Kanały serwera nie ładują automatycznie MEMORY.md.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Gdy zadaję pytania w kanałach Discord, używaj memory_search lub memory_get, jeśli potrzebujesz długoterminowego kontekstu z MEMORY.md.”
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Trzymaj długoterminowe notatki w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał otrzymuje własną izolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` albo cokolwiek pasuje do Twojego przepływu pracy.

## Model runtime

- Gateway zarządza połączeniem z Discord.
- Routing odpowiedzi jest deterministyczny: przychodzące odpowiedzi z Discord wracają do Discord.
- Metadane gildii/kanału Discord są dodawane do promptu modelu jako niezaufany
  kontekst, a nie jako widoczny dla użytkownika prefiks odpowiedzi. Jeśli model skopiuje tę otoczkę
  z powrotem, OpenClaw usuwa skopiowane metadane z odpowiedzi wychodzących oraz z
  przyszłego kontekstu odtwarzania.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały gildii są izolowanymi kluczami sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia z ukośnikiem działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), nadal przenosząc `CommandTargetSessionKey` do routowanej sesji konwersacji.
- Dostarczanie tekstowych ogłoszeń Cron/Heartbeat do Discord używa końcowej
  odpowiedzi widocznej dla asystenta jeden raz. Multimedia i ustrukturyzowane ładunki komponentów pozostają
  wieloma wiadomościami, gdy agent emituje wiele możliwych do dostarczenia ładunków.

## Kanały forum

Kanały forum i mediów Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku używa pierwszego niepustego wiersza Twojej wiadomości.
- Użyj `openclaw message thread create`, aby utworzyć wątek bezpośrednio. Nie przekazuj `--message-id` dla kanałów forum.

Przykład: wyślij do nadrzędnego forum, aby utworzyć wątek

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Przykład: jawnie utwórz wątek forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Nadrzędne fora nie akceptują komponentów Discord. Jeśli potrzebujesz komponentów, wyślij je do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są routowane z powrotem do agenta jako zwykłe wiadomości przychodzące i podlegają istniejącym ustawieniom Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowe. Ustaw `components.reusable=true`, aby przyciski, listy wyboru i formularze mogły być używane wielokrotnie, dopóki nie wygasną.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` na tym przycisku (identyfikatory użytkowników Discord, tagi albo `*`). Po skonfigurowaniu niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Callbacki komponentów wygasają domyślnie po 30 minutach. Ustaw `channels.discord.agentComponents.ttlMs`, aby zmienić czas życia rejestru callbacków dla domyślnego konta Discord, albo `channels.discord.accounts.<accountId>.agentComponents.ttlMs`, aby nadpisać jedno konto w konfiguracji wielokontowej. Wartość jest podawana w milisekundach, musi być dodatnią liczbą całkowitą i jest ograniczona do `86400000` (24 godziny). Dłuższe TTL są przydatne w workflowach przeglądu lub zatwierdzania, które wymagają, aby przyciski pozostały użyteczne, ale wydłużają też okno, w którym stara wiadomość Discord może nadal wyzwolić akcję. Preferuj najkrótsze TTL pasujące do workflowu i zachowaj wartość domyślną, gdy przestarzałe callbacki byłyby zaskakujące.

Polecenia z ukośnikiem `/model` i `/models` otwierają interaktywny selektor modeli z listami rozwijanymi dostawcy, modelu i zgodnego środowiska uruchomieniowego oraz krokiem przesłania. `/models add` jest przestarzałe i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu. Odpowiedź selektora jest efemeryczna i może jej użyć tylko wywołujący użytkownik. Menu wyboru Discord są ograniczone do 25 opcji, więc dodaj wpisy `provider/*` do `agents.defaults.models`, gdy chcesz, aby selektor pokazywał dynamicznie wykryte modele tylko dla wybranych dostawców, takich jak `openai` lub `vllm`.

Załączniki plików:

- Bloki `file` muszą wskazywać na referencję załącznika (`attachment://<filename>`)
- Przekaż załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
- Użyj `filename`, aby nadpisać nazwę przesyłanego pliku, gdy powinna pasować do referencji załącznika

Formularze modalne:

- Dodaj `components.modal` z maksymalnie 5 polami
- Typy pól: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw automatycznie dodaje przycisk wyzwalający

Przykład:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Kontrola dostępu i routing

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` kontroluje dostęp do DM. `channels.discord.allowFrom` jest kanoniczną listą dozwolonych DM.

    - `pairing` (domyślne)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`)
    - `disabled`

    Jeśli polityka DM nie jest otwarta, nieznani użytkownicy są blokowani (albo proszeni o parowanie w trybie `pairing`).

    Priorytety w konfiguracji wielokontowej:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Dla jednego konta `allowFrom` ma pierwszeństwo przed starszym `dm.allowFrom`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` i starsze `dm.allowFrom` nie są ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Starsze `channels.discord.dm.policy` i `channels.discord.dm.allowFrom` są nadal odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Format celu DM dla dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same identyfikatory liczbowe zwykle rozpoznają się jako identyfikatory kanałów, gdy aktywny jest domyślny kanał, ale identyfikatory wymienione w efektywnym DM `allowFrom` konta są traktowane jako cele DM użytkownika dla zgodności.

  </Tab>

  <Tab title="Access groups">
    DM Discord i autoryzacja poleceń tekstowych mogą używać dynamicznych wpisów `accessGroup:<name>` w `channels.discord.allowFrom`.

    Nazwy grup dostępu są współdzielone między kanałami wiadomości. Użyj `type: "message.senders"` dla statycznej grupy, której członkowie są wyrażeni w zwykłej składni `allowFrom` każdego kanału, albo `type: "discord.channelAudience"`, gdy bieżąca publiczność `ViewChannel` kanału Discord ma dynamicznie definiować członkostwo. Wspólne zachowanie grup dostępu jest udokumentowane tutaj: [Grupy dostępu](/pl/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Kanał tekstowy Discord nie ma osobnej listy członków. `type: "discord.channelAudience"` modeluje członkostwo następująco: nadawca DM jest członkiem skonfigurowanej gildii i obecnie ma efektywne uprawnienie `ViewChannel` na skonfigurowanym kanale po zastosowaniu ról i nadpisań kanału.

    Przykład: pozwól każdemu, kto widzi `#maintainers`, wysyłać DM do bota, pozostawiając DM zamknięte dla wszystkich innych.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    Możesz mieszać wpisy dynamiczne i statyczne:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    Wyszukiwania kończą się odmową w razie błędu. Jeśli Discord zwróci `Missing Access`, wyszukiwanie członka się nie powiedzie albo kanał należy do innej gildii, nadawca DM jest traktowany jako nieautoryzowany.

    Włącz **Server Members Intent** w Discord Developer Portal dla bota podczas używania grup dostępu opartych na publiczności kanału. DM nie zawierają stanu członka gildii, więc OpenClaw rozpoznaje członka przez Discord REST w czasie autoryzacji.

  </Tab>

  <Tab title="Guild policy">
    Obsługą gildii steruje `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczna baza, gdy istnieje `channels.discord`, to `allowlist`.

    Zachowanie `allowlist`:

    - gildia musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli którakolwiek jest skonfigurowana, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowanie nazwy/tagu jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazwy/tagu
    - jeśli gildia ma skonfigurowane `channels`, kanały niewymienione na liście są odrzucane
    - jeśli gildia nie ma bloku `channels`, wszystkie kanały w tej gildii z listy dozwolonych są dozwolone

    Przykład:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, fallback środowiska uruchomieniowego to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Wiadomości w gildiach są domyślnie bramkowane wzmianką.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    Podczas pisania wychodzących wiadomości Discord używaj kanonicznej składni wzmianek: `<@USER_ID>` dla użytkowników, `<#CHANNEL_ID>` dla kanałów i `<@&ROLE_ID>` dla ról. Nie używaj starszej formy wzmianki pseudonimu `<@!USER_ID>`.

    `requireMention` jest konfigurowane per gildia/kanał (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów albo slugi)

  </Tab>
</Tabs>

### Routing agentów oparty na rolach

Użyj `bindings[].match.roles`, aby kierować członków gildii Discord do różnych agentów według identyfikatora roli. Powiązania oparte na rolach akceptują tylko identyfikatory ról i są oceniane po powiązaniach peer lub parent-peer oraz przed powiązaniami tylko dla gildii. Jeśli powiązanie ustawia też inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Natywne polecenia i autoryzacja poleceń

- `commands.native` domyślnie ma wartość `"auto"` i jest włączone dla Discord.
- Nadpisanie dla kanału: `channels.discord.commands.native`.
- `commands.native=false` pomija rejestrację i czyszczenie poleceń ukośnikowych Discord podczas uruchamiania. Wcześniej zarejestrowane polecenia mogą pozostać widoczne w Discord, dopóki nie usuniesz ich z aplikacji Discord.
- Autoryzacja natywnych poleceń używa tych samych list dozwolonych/polityk Discord co zwykła obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discord dla użytkowników bez autoryzacji; wykonanie nadal egzekwuje autoryzację OpenClaw i zwraca „not authorized”.

Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands), aby poznać katalog poleceń i ich działanie.

Domyślne ustawienia poleceń ukośnikowych:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Znaczniki odpowiedzi i natywne odpowiedzi">
    Discord obsługuje znaczniki odpowiedzi w danych wyjściowych agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Kontrolowane przez `channels.discord.replyToMode`:

    - `off` (domyślnie)
    - `first`
    - `all`
    - `batched`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne znaczniki `[[reply_to_*]]` są nadal respektowane.
    `first` zawsze dołącza niejawną natywną referencję odpowiedzi do pierwszej wychodzącej wiadomości Discord w danej turze.
    `batched` dołącza niejawną natywną referencję odpowiedzi Discord tylko wtedy, gdy
    zdarzenie wejściowe było zdeduplicowaną partią wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie dla niejednoznacznych, gwałtownych czatów, a nie dla każdej
    tury z pojedynczą wiadomością.

    Identyfikatory wiadomości są udostępniane w kontekście/historii, aby agenci mogli wskazywać konkretne wiadomości.

  </Accordion>

  <Accordion title="Podglądy linków">
    Discord domyślnie generuje bogate osadzenia linków dla adresów URL. OpenClaw domyślnie tłumi te wygenerowane osadzenia w wychodzących wiadomościach Discord, więc adresy URL wysyłane przez agenta pozostają zwykłymi linkami, chyba że włączysz tę opcję:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Ustaw `channels.discord.accounts.<id>.suppressEmbeds`, aby nadpisać jedno konto. Wysyłki narzędzia wiadomości agenta mogą też przekazać `suppressEmbeds: false` dla pojedynczej wiadomości. Jawne ładunki Discord `embeds` nie są tłumione przez domyślne ustawienie podglądu linków.

  </Accordion>

  <Accordion title="Podgląd strumienia na żywo">
    OpenClaw może strumieniować wersje robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływu tekstu. `channels.discord.streaming` przyjmuje `off` | `partial` | `block` | `progress` (domyślnie). `progress` utrzymuje jedną edytowalną wersję roboczą statusu i aktualizuje ją postępem narzędzi aż do finalnej dostawy; wspólna etykieta początkowa jest przewijaną linią, więc znika z widoku jak reszta, gdy pojawi się wystarczająco dużo pracy. `streamMode` to starszy alias środowiska uruchomieniowego. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację do kanonicznego klucza.

    Ustaw `channels.discord.streaming.mode` na `off`, aby wyłączyć edycje podglądu Discord. Jeśli strumieniowanie blokowe Discord jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` edytuje pojedynczą wiadomość podglądu w miarę napływu tokenów.
    - `block` emituje porcje o rozmiarze wersji roboczej (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału, ograniczone przez `textChunkLimit`).
    - Media, błędy i finalne odpowiedzi z jawną odpowiedzią anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie używają wiadomości podglądu.
    - Wiersze narzędzi/postępu renderują się jako zwięzłe emoji + tytuł + szczegół, gdy są dostępne, na przykład `🛠️ Bash: run tests` lub `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (domyślnie `false`) włącza tekst komentarza/preambuły asystenta w tymczasowej wersji roboczej postępu. Komentarz jest czyszczony przed wyświetleniem, pozostaje przejściowy i nie zmienia dostarczania finalnej odpowiedzi.
    - `streaming.progress.maxLineChars` kontroluje budżet podglądu postępu na linię. Proza jest skracana na granicach słów; szczegóły poleceń i ścieżek zachowują przydatne sufiksy.
    - `streaming.preview.commandText` / `streaming.progress.commandText` kontroluje szczegóły polecenia/wykonania w zwięzłych liniach postępu: `raw` (domyślnie) lub `status` (tylko etykieta narzędzia).

    Ukryj surowy tekst polecenia/wykonania, zachowując zwięzłe linie postępu:

    ```json
    {
      "channels": {
        "discord": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Strumieniowanie podglądu obsługuje tylko tekst; odpowiedzi multimedialne wracają do zwykłej dostawy. Gdy strumieniowanie `block` jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii gildii:

    - domyślne `channels.discord.historyLimit` to `20`
    - wartość zastępcza: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrolki historii DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są kierowane jako sesje kanału i dziedziczą konfigurację kanału nadrzędnego, chyba że zostanie nadpisana.
    - Sesje wątków dziedziczą wybór `/model` na poziomie sesji kanału nadrzędnego jako awaryjny wybór tylko modelu; lokalne wybory `/model` wątku nadal mają pierwszeństwo, a historia transkrypcji nadrzędnej nie jest kopiowana, chyba że włączono dziedziczenie transkrypcji.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) włącza inicjowanie nowych automatycznych wątków z transkrypcji nadrzędnej. Nadpisania dla konta znajdują się pod `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozwiązywać cele DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas awaryjnej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych ograniczają, kto może wyzwolić agenta, ale nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla podagentów">
    Discord może powiązać wątek z celem sesji, aby kolejne wiadomości w tym wątku nadal były kierowane do tej samej sesji (w tym sesji podagentów).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem podagenta/sesji
    - `/unfocus` usuń powiązanie bieżącego wątku
    - `/agents` pokaż aktywne uruchomienia i stan powiązań
    - `/session idle <duration|off>` sprawdź/zaktualizuj automatyczne anulowanie fokusu po bezczynności dla aktywnych powiązań
    - `/session max-age <duration|off>` sprawdź/zaktualizuj twardy maksymalny wiek aktywnych powiązań

    Konfiguracja:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Uwagi:

    - `session.threadBindings.*` ustawia globalne wartości domyślne.
    - `channels.discord.threadBindings.*` nadpisuje zachowanie Discord.
    - `spawnSessions` kontroluje automatyczne tworzenie/powiązywanie wątków dla `sessions_spawn({ thread: true })` i uruchomień wątków ACP. Domyślnie: `true`.
    - `defaultSpawnContext` kontroluje natywny kontekst podagenta dla uruchomień powiązanych z wątkiem. Domyślnie: `"fork"`.
    - Przestarzałe klucze `spawnSubagentSessions`/`spawnAcpSessions` są migrowane przez `openclaw doctor --fix`.
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązań wątków są niedostępne.

    Zobacz [Podagenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) oraz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe powiązania kanałów ACP">
    Dla stabilnych, „zawsze włączonych” przestrzeni roboczych ACP skonfiguruj najwyższego poziomu typowane powiązania ACP kierowane do rozmów Discord.

    Ścieżka konfiguracji:

    - `bindings[]` z `type: "acp"` i `match.channel: "discord"`

    Przykład:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Uwagi:

    - `/acp spawn codex --bind here` wiąże bieżący kanał lub wątek w miejscu i utrzymuje przyszłe wiadomości w tej samej sesji ACP. Wiadomości wątku dziedziczą powiązanie kanału nadrzędnego.
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP w miejscu. Tymczasowe powiązania wątków mogą nadpisać rozwiązywanie celu, gdy są aktywne.
    - `spawnSessions` bramkuje tworzenie/powiązywanie wątków podrzędnych przez `--thread auto|here`.

    Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać szczegóły działania powiązań.

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Tryb powiadomień o reakcjach dla gildii:

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (używa `guilds.<id>.users`)

    Zdarzenia reakcji są przekształcane w zdarzenia systemowe i dołączane do kierowanej sesji Discord.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozwiązywania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - awaryjna emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Discord akceptuje emoji Unicode lub nazwy niestandardowych emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji">
    Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone.

    Dotyczy to przepływów `/config set|unset` (gdy funkcje poleceń są włączone).

    Wyłączenie:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Proxy Gateway">
    Kieruj ruch WebSocket Gateway Discord i startowe zapytania REST (identyfikator aplikacji + rozwiązywanie listy dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Nadpisanie dla konta:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Obsługa PluralKit">
    Włącz rozwiązywanie PluralKit, aby mapować wiadomości proxied na tożsamość członka systemu:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Uwagi:

    - listy dozwolonych mogą używać `pk:<memberId>`
    - nazwy wyświetlane członków są dopasowywane według nazwy/sluga tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania używają oryginalnego identyfikatora wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, wiadomości proxied są traktowane jako wiadomości botów i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Aliasy wzmianek wychodzących">
    Użyj `mentionAliases`, gdy agenci potrzebują deterministycznych wzmianek wychodzących dla znanych użytkowników Discord. Klucze to uchwyty bez początkowego `@`; wartości to identyfikatory użytkowników Discord. Nieznane uchwyty, `@everyone`, `@here` oraz wzmianki wewnątrz spanów kodu Markdown pozostają bez zmian.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Konfiguracja obecności">
    Aktualizacje obecności są stosowane po ustawieniu pola statusu lub aktywności albo po włączeniu automatycznej obecności.

    Przykład samego statusu:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Przykład aktywności (status niestandardowy jest domyślnym typem aktywności):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Przykład streamingu:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mapa typów aktywności:

    - 0: Granie
    - 1: Streaming (wymaga `activityUrl`)
    - 2: Słuchanie
    - 3: Oglądanie
    - 4: Niestandardowa (używa tekstu aktywności jako stanu statusu; emoji jest opcjonalne)
    - 5: Rywalizacja

    Przykład automatycznej obecności (sygnał kondycji runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Automatyczna obecność mapuje dostępność runtime na status Discord: zdrowy => online, zdegradowany lub nieznany => idle, wyczerpany lub niedostępny => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discord">
    Discord obsługuje zatwierdzanie oparte na przyciskach w DM-ach i może opcjonalnie publikować prośby o zatwierdzenie w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; gdy to możliwe, wraca do `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego, z `execApprovals.approvers` albo z `commands.ownerAllowFrom`. Discord nie wywodzi zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani direct-message `defaultTo`. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzeń.

    W przypadku wrażliwych poleceń grupowych tylko dla właściciela, takich jak `/diagnostics` i `/export-trajectory`, OpenClaw wysyła prośby o zatwierdzenie i wyniki końcowe prywatnie. Najpierw próbuje Discord DM, gdy wywołujący właściciel ma trasę właściciela Discord; jeśli nie jest ona dostępna, wraca do pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, takiej jak Telegram.

    Gdy `target` ma wartość `channel` lub `both`, prośba o zatwierdzenie jest widoczna w kanale. Tylko rozwiązani zatwierdzający mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Prośby o zatwierdzenie zawierają tekst polecenia, więc włączaj dostarczanie do kanału tylko w zaufanych kanałach. Jeśli identyfikatora kanału nie da się wyprowadzić z klucza sesji, OpenClaw wraca do dostarczania przez DM.

    Discord renderuje również współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Discord głównie dodaje routing DM do zatwierdzających i fanout kanału.
    Gdy te przyciski są obecne, są podstawowym UX zatwierdzania; OpenClaw
    powinien zawierać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    Jeśli natywny runtime zatwierdzeń Discord nie jest aktywny, OpenClaw pozostawia
    widoczny lokalny deterministyczny prompt `/approve <id> <decision>`. Jeśli
    runtime jest aktywny, ale natywnej karty nie da się dostarczyć do żadnego celu,
    OpenClaw wysyła w tym samym czacie zastępcze powiadomienie z dokładnym poleceniem `/approve`
    z oczekującego zatwierdzenia.

    Uwierzytelnianie Gateway i rozwiązywanie zatwierdzeń są zgodne ze współdzielonym kontraktem klienta Gateway (identyfikatory `plugin:` są rozwiązywane przez `plugin.approval.resolve`; pozostałe identyfikatory przez `exec.approval.resolve`). Zatwierdzenia domyślnie wygasają po 30 minutach.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki akcji

Akcje wiadomości Discord obejmują wysyłanie wiadomości, administrację kanałami, moderację, obecność i akcje metadanych.

Podstawowe przykłady:

- wysyłanie wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Akcja `event-create` akceptuje opcjonalny parametr `image` (URL lub ścieżka do pliku lokalnego), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki akcji znajdują się pod `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa akcji                                                                                                                                                              | Domyślnie |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone  |
| roles                                                                                                                                                                    | wyłączone |
| moderation                                                                                                                                                               | wyłączone |
| presence                                                                                                                                                                 | wyłączone |

## Interfejs użytkownika komponentów v2

OpenClaw używa komponentów Discord v2 do zatwierdzeń exec i markerów międzykontekstowych. Akcje wiadomości Discord mogą również akceptować `components` dla niestandardowego UI (zaawansowane; wymaga skonstruowania payloadu komponentu przez narzędzie discord), natomiast starsze `embeds` pozostają dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustaw dla konta przez `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` kontroluje, jak długo wysłane callbacki komponentów Discord pozostają zarejestrowane (domyślnie `1800000`, maksymalnie `86400000`). Ustaw dla konta przez `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` są ignorowane, gdy obecne są komponenty v2.
- Podglądy zwykłych URL-i są domyślnie tłumione. Ustaw `suppressEmbeds: false` w akcji wiadomości, gdy pojedynczy link wychodzący powinien się rozwinąć.

Przykład:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Głos

Discord ma dwie odrębne powierzchnie głosowe: realtime **kanały głosowe** (ciągłe rozmowy) oraz **załączniki wiadomości głosowych** (format podglądu fali). Gateway obsługuje obie.

### Kanały głosowe

Lista kontrolna konfiguracji:

1. Włącz Message Content Intent w Discord Developer Portal.
2. Włącz Server Members Intent, gdy używane są listy dozwolonych ról/użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Nadaj uprawnienia Connect, Speak, Send Messages i Read Message History w docelowym kanale głosowym.
5. Włącz polecenia natywne (`commands.native` lub `channels.discord.commands.native`).
6. Skonfiguruj `channels.discord.voice`.

Użyj `/vc join|leave|status`, aby sterować sesjami. Polecenie używa domyślnego agenta konta i podlega tym samym regułom list dozwolonych oraz polityki grupowej co inne polecenia Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Aby sprawdzić efektywne uprawnienia bota przed dołączeniem, uruchom:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Przykład automatycznego dołączania:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Uwagi:

- `voice.tts` zastępuje `messages.tts` tylko dla odtwarzania głosu `stt-tts`. Tryby czasu rzeczywistego używają `voice.realtime.speakerVoice`.
- `voice.mode` steruje ścieżką rozmowy. Domyślna wartość to `agent-proxy`: głosowy front end czasu rzeczywistego obsługuje taktowanie tur, przerywanie i odtwarzanie, deleguje merytoryczną pracę do trasowanego agenta OpenClaw przez `openclaw_agent_consult` i traktuje wynik jak wpisane polecenie Discord od tego mówcy. `stt-tts` zachowuje starszy przepływ wsadowego STT oraz TTS. `bidi` pozwala modelowi czasu rzeczywistego rozmawiać bezpośrednio, jednocześnie udostępniając `openclaw_agent_consult` dla mózgu OpenClaw.
- `voice.agentSession` steruje tym, która rozmowa OpenClaw otrzymuje tury głosowe. Pozostaw bez ustawienia dla własnej sesji kanału głosowego albo ustaw `{ mode: "target", target: "channel:<text-channel-id>" }`, aby kanał głosowy działał jako rozszerzenie mikrofonu/głośnika istniejącej sesji kanału tekstowego Discord, takiego jak `#maintainers`.
- `voice.model` zastępuje mózg agenta OpenClaw dla odpowiedzi głosowych Discord i konsultacji czasu rzeczywistego. Pozostaw bez ustawienia, aby dziedziczyć trasowany model agenta. Jest to osobne od `voice.realtime.model`.
- `voice.followUsers` pozwala botowi dołączać do głosu Discord, przenosić się i wychodzić razem z wybranymi użytkownikami. Zobacz [Śledzenie użytkowników w głosie](#follow-users-in-voice), aby poznać reguły zachowania i przykłady.
- `agent-proxy` trasuje mowę przez `discord-voice`, co zachowuje normalną autoryzację właściciela/narzędzi dla mówcy i sesji docelowej, ale ukrywa narzędzie agenta `tts`, ponieważ głos Discord jest właścicielem odtwarzania. Domyślnie `agent-proxy` daje konsultacji pełny, równoważny właścicielowi dostęp do narzędzi dla mówców będących właścicielami (`voice.realtime.toolPolicy: "owner"`) i zdecydowanie preferuje konsultację z agentem OpenClaw przed merytorycznymi odpowiedziami (`voice.realtime.consultPolicy: "always"`). W tym domyślnym trybie `always` warstwa czasu rzeczywistego nie wypowiada automatycznie wypełniaczy przed odpowiedzią konsultacji; przechwytuje i transkrybuje mowę, a następnie wypowiada trasowaną odpowiedź OpenClaw. Jeśli wiele wymuszonych odpowiedzi konsultacji zakończy się, gdy Discord nadal odtwarza pierwszą odpowiedź, późniejsze odpowiedzi z dokładną mową są kolejkowane do czasu bezczynności odtwarzania zamiast zastępować mowę w połowie zdania.
- W trybie `stt-tts` STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- W trybach czasu rzeczywistego `voice.realtime.provider`, `voice.realtime.model` i `voice.realtime.speakerVoice` konfigurują sesję audio czasu rzeczywistego. Dla OpenAI Realtime 2 plus mózg Codex użyj `voice.realtime.model: "gpt-realtime-2"` i `voice.model: "openai/gpt-5.5"`.
- Tryby głosu czasu rzeczywistego domyślnie dołączają małe pliki profilu `IDENTITY.md`, `USER.md` i `SOUL.md` do instrukcji dostawcy czasu rzeczywistego, aby szybkie bezpośrednie tury zachowywały tę samą tożsamość, osadzenie użytkownika i personę co trasowany agent OpenClaw. Ustaw `voice.realtime.bootstrapContextFiles` na podzbiór, aby to dostosować, albo `[]`, aby to wyłączyć. Obsługiwane pliki startowe czasu rzeczywistego są ograniczone do tych plików profilu; `AGENTS.md` pozostaje w normalnym kontekście agenta. Wstrzyknięty kontekst profilu nie zastępuje `openclaw_agent_consult` dla pracy w obszarze roboczym, aktualnych faktów, wyszukiwania w pamięci ani działań opartych na narzędziach.
- W trybie czasu rzeczywistego OpenAI `agent-proxy` ustaw `voice.realtime.requireWakeName: true`, aby głos czasu rzeczywistego Discord pozostawał cichy, dopóki transkrypt nie zacznie się lub nie skończy nazwą wybudzającą. Skonfigurowane nazwy wybudzające muszą mieć jedno albo dwa słowa. Jeśli `voice.realtime.wakeNames` nie jest ustawione, OpenClaw używa trasowanej wartości `name` agenta plus `OpenClaw`, a w razie potrzeby identyfikatora agenta plus `OpenClaw`. Bramkowanie nazwą wybudzającą wyłącza automatyczną odpowiedź dostawcy czasu rzeczywistego, trasuje zaakceptowane tury przez ścieżkę konsultacji agenta OpenClaw i daje krótkie wypowiadane potwierdzenie, gdy początkowa nazwa wybudzająca zostanie rozpoznana z częściowej transkrypcji przed nadejściem końcowego transkryptu.
- Dostawca czasu rzeczywistego OpenAI akceptuje bieżące nazwy zdarzeń Realtime 2 oraz starsze aliasy zgodne z Codex dla zdarzeń wyjściowego audio i transkryptu, więc zgodne migawki dostawcy mogą się zmieniać bez utraty audio asystenta.
- `voice.realtime.bargeIn` steruje tym, czy zdarzenia rozpoczęcia mówienia przez użytkownika w Discord przerywają aktywne odtwarzanie czasu rzeczywistego. Jeśli nie jest ustawione, podąża za ustawieniem przerywania wejściowego audio dostawcy czasu rzeczywistego.
- `voice.realtime.minBargeInAudioEndMs` steruje minimalnym czasem odtwarzania asystenta, zanim wtargnięcie OpenAI w czasie rzeczywistym obetnie audio. Domyślnie: `250`. Ustaw `0` dla natychmiastowego przerwania w pomieszczeniach z niskim echem albo zwiększ tę wartość dla konfiguracji głośników z dużym echem.
- Dla głosu OpenAI w odtwarzaniu Discord ustaw `voice.tts.provider: "openai"` i wybierz głos zamiany tekstu na mowę w `voice.tts.providers.openai.speakerVoice`. `cedar` jest dobrym wyborem o męskim brzmieniu w bieżącym modelu OpenAI TTS.
- Nadpisania `systemPrompt` Discord dla kanałów mają zastosowanie do tur transkryptu głosowego dla tego kanału głosowego.
- Tury transkryptu głosowego wyprowadzają status właściciela z Discord `allowFrom` (lub `dm.allowFrom`) dla poleceń bramkowanych właścicielem i działań kanału. Widoczność narzędzi agenta podąża za skonfigurowaną polityką narzędzi dla trasowanej sesji.
- Głos Discord jest opcjonalny dla konfiguracji tylko tekstowych; ustaw `channels.discord.voice.enabled=true` (albo zachowaj istniejący blok `channels.discord.voice`), aby włączyć polecenia `/vc`, środowisko uruchomieniowe głosu i intencję Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` może jawnie zastąpić subskrypcję intencji stanu głosu. Pozostaw bez ustawienia, aby intencja podążała za efektywnym włączeniem głosu.
- Jeśli `voice.autoJoin` ma wiele wpisów dla tej samej gildii, OpenClaw dołącza do ostatnio skonfigurowanego kanału dla tej gildii.
- `voice.allowedChannels` to opcjonalna lista dozwolonych miejsc pobytu. Pozostaw bez ustawienia, aby zezwolić `/vc join` na dowolny autoryzowany kanał głosowy Discord. Po ustawieniu `/vc join`, automatyczne dołączanie przy starcie i przeniesienia stanu głosu bota są ograniczone do wymienionych wpisów `{ guildId, channelId }`. Ustaw pustą tablicę, aby odmówić wszystkich dołączeń do głosu Discord. Jeśli Discord przeniesie bota poza listę dozwolonych, OpenClaw opuści ten kanał i ponownie dołączy do skonfigurowanego celu automatycznego dołączania, gdy taki jest dostępny.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- OpenClaw używa dołączonego kodeka `libopus-wasm` dla odbioru głosu Discord i odtwarzania surowego PCM czasu rzeczywistego. Dostarcza przypiętą kompilację libopus WebAssembly i nie wymaga natywnych dodatków opus.
- `voice.connectTimeoutMs` steruje początkowym oczekiwaniem Ready `@discordjs/voice` dla prób `/vc join` i automatycznego dołączania. Domyślnie: `30000`.
- `voice.reconnectGraceMs` steruje tym, jak długo OpenClaw czeka, aż rozłączona sesja głosowa zacznie się ponownie łączyć, zanim ją zniszczy. Domyślnie: `15000`.
- W trybie `stt-tts` odtwarzanie głosu nie zatrzymuje się tylko dlatego, że inny użytkownik zaczyna mówić. Aby uniknąć pętli sprzężenia zwrotnego, OpenClaw ignoruje nowe przechwytywanie głosu podczas odtwarzania TTS; zacznij mówić po zakończeniu odtwarzania dla następnej tury. Tryby czasu rzeczywistego przekazują rozpoczęcia mówienia jako sygnały wtargnięcia do dostawcy czasu rzeczywistego.
- W trybach czasu rzeczywistego echo z głośników do otwartego mikrofonu może wyglądać jak wtargnięcie i przerywać odtwarzanie. Dla pokojów Discord z dużym echem ustaw `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, aby OpenAI nie przerywał automatycznie na wejściowym audio. Dodaj `voice.realtime.bargeIn: true`, jeśli nadal chcesz, aby zdarzenia rozpoczęcia mówienia w Discord przerywały aktywne odtwarzanie. Most czasu rzeczywistego OpenAI ignoruje obcięcia odtwarzania krótsze niż `voice.realtime.minBargeInAudioEndMs` jako prawdopodobne echo/szum i zapisuje je jako pominięte zamiast czyścić odtwarzanie Discord.
- `voice.captureSilenceGraceMs` steruje tym, jak długo OpenClaw czeka po zgłoszeniu przez Discord, że mówca przestał mówić, zanim sfinalizuje ten segment audio dla STT. Domyślnie: `2000`; zwiększ tę wartość, jeśli Discord dzieli normalne pauzy na poszarpane częściowe transkrypty.
- Gdy wybranym dostawcą TTS jest ElevenLabs, odtwarzanie głosu Discord używa strumieniowego TTS i zaczyna od strumienia odpowiedzi dostawcy. Dostawcy bez obsługi strumieniowania wracają do ścieżki z syntetyzowanym plikiem tymczasowym.
- OpenClaw obserwuje też błędy deszyfrowania odbioru i automatycznie odzyskuje działanie przez opuszczenie i ponowne dołączenie do kanału głosowego po powtarzających się błędach w krótkim oknie.
- Jeśli po aktualizacji logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, zbierz raport zależności i logi. Dołączona linia `@discordjs/voice` zawiera poprawkę upstream dotyczącą dopełniania z PR discord.js #11449, która zamknęła issue discord.js #11419.
- Zdarzenia odbioru `The operation was aborted` są oczekiwane, gdy OpenClaw finalizuje przechwycony segment mówcy; są to szczegółowe diagnostyki, nie ostrzeżenia.
- Szczegółowe logi głosu Discord zawierają ograniczony jednowierszowy podgląd transkryptu STT dla każdego zaakceptowanego segmentu mówcy, więc debugowanie pokazuje zarówno stronę użytkownika, jak i stronę odpowiedzi agenta bez zrzucania nieograniczonego tekstu transkryptu.
- W trybie `agent-proxy` awaryjna wymuszona konsultacja pomija prawdopodobnie niepełne fragmenty transkryptu, takie jak tekst kończący się na `...` albo końcowy łącznik typu `and`, oraz oczywiste, niewymagające działania zakończenia, takie jak „zaraz wracam” lub „pa”. Logi pokazują `forced agent consult skipped reason=...`, gdy zapobiega to nieaktualnej odpowiedzi w kolejce.

### Śledzenie użytkowników w głosie

Użyj `voice.followUsers`, gdy chcesz, aby bot głosowy Discord pozostawał z jednym lub kilkoma znanymi użytkownikami Discord zamiast dołączać do stałego kanału przy starcie albo czekać na `/vc join`.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

Zachowanie:

- `followUsers` akceptuje surowe identyfikatory użytkowników Discord i wartości `discord:<id>`. OpenClaw normalizuje obie formy przed dopasowaniem zdarzeń stanu głosu.
- `followUsersEnabled` domyślnie przyjmuje `true`, gdy skonfigurowano `followUsers`. Ustaw `false`, aby zachować zapisaną listę, ale zatrzymać automatyczne śledzenie głosu.
- Gdy śledzony użytkownik dołącza do dozwolonego kanału głosowego, OpenClaw dołącza do tego kanału. Gdy użytkownik się przenosi, OpenClaw przenosi się z nim. Gdy aktywny śledzony użytkownik rozłącza się, OpenClaw wychodzi.
- Jeśli wielu śledzonych użytkowników jest w tej samej gildii, a aktywny śledzony użytkownik wychodzi, OpenClaw przenosi się do kanału innego śledzonego użytkownika przed opuszczeniem gildii. Jeśli kilku śledzonych użytkowników przenosi się jednocześnie, wygrywa najnowsze zaobserwowane zdarzenie stanu głosu.
- `allowedChannels` nadal obowiązuje. Śledzony użytkownik w niedozwolonym kanale jest ignorowany, a sesja będąca własnością śledzenia przenosi się do innego śledzonego użytkownika albo wychodzi.
- OpenClaw uzgadnia pominięte zdarzenia stanu głosu przy starcie i w ograniczonym interwale. Uzgadnianie próbkuje skonfigurowane gildie i ogranicza wyszukiwania REST na przebieg, więc bardzo duże listy `followUsers` mogą potrzebować więcej niż jednego interwału, aby się zbiec.
- Jeśli Discord lub administrator przeniesie bota, gdy śledzi użytkownika, OpenClaw odbudowuje sesję głosową i zachowuje własność śledzenia, gdy miejsce docelowe jest dozwolone. Jeśli bot zostanie przeniesiony poza `allowedChannels`, OpenClaw wychodzi i ponownie dołącza do skonfigurowanego celu, gdy taki istnieje.
- Odzyskiwanie odbioru DAVE może opuścić i ponownie dołączyć do tego samego kanału po powtarzających się błędach deszyfrowania. Sesje będące własnością śledzenia zachowują własność śledzenia przez tę ścieżkę odzyskiwania, więc późniejsze rozłączenie śledzonego użytkownika nadal opuszcza kanał.

Wybierz między trybami dołączania:

- Użyj `followUsers` dla konfiguracji osobistych lub operatorskich, w których bot powinien automatycznie być w głosie, gdy ty jesteś.
- Użyj `autoJoin` dla botów stałych pokojów, które powinny być obecne nawet wtedy, gdy żaden śledzony użytkownik nie jest w głosie.
- Użyj `/vc join` dla jednorazowych dołączeń albo pokojów, w których automatyczna obecność głosowa byłaby zaskakująca.

Kodek głosu Discord:

- Logi odbioru głosu pokazują `discord voice: opus decoder: libopus-wasm`.
- Odtwarzanie w czasie rzeczywistym koduje surowy stereofoniczny PCM 48 kHz do Opus za pomocą tego samego dołączonego pakietu `libopus-wasm`, zanim przekaże pakiety do `@discordjs/voice`.
- Odtwarzanie plików i strumieni dostawcy transkoduje do surowego stereofonicznego PCM 48 kHz za pomocą ffmpeg, a następnie używa `libopus-wasm` do strumienia pakietów Opus wysyłanego do Discord.

Potok STT i TTS:

- Przechwycony PCM z Discord jest konwertowany do tymczasowego pliku WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypt jest przesyłany przez wejście i routing Discord, podczas gdy odpowiedź LLM działa z zasadą wyjścia głosowego, która ukrywa narzędzie agenta `tts` i prosi o zwrócony tekst, ponieważ głos Discord odpowiada za końcowe odtwarzanie TTS.
- `voice.model`, gdy jest ustawiony, nadpisuje tylko LLM odpowiedzi dla tej tury kanału głosowego.
- `voice.tts` jest scalane na wierzchu `messages.tts`; dostawcy obsługujący strumieniowanie zasilają odtwarzacz bezpośrednio, w przeciwnym razie wynikowy plik audio jest odtwarzany na dołączonym kanale.

Domyślny przykład sesji kanału głosowego agent-proxy:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Bez bloku `voice.agentSession` każdy kanał głosowy otrzymuje własną routowaną sesję OpenClaw. Na przykład `/vc join channel:234567890123456789` rozmawia z sesją dla tego kanału głosowego Discord. Model czasu rzeczywistego jest tylko głosowym interfejsem wejściowym; właściwe żądania są przekazywane do skonfigurowanego agenta OpenClaw. Jeśli model czasu rzeczywistego utworzy końcowy transkrypt bez wywołania narzędzia konsultacji, OpenClaw wymusza konsultację jako zachowanie awaryjne, aby domyślne działanie nadal przypominało rozmowę z agentem.

Starszy przykład STT i TTS:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

Przykład dwukierunkowy w czasie rzeczywistym:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Głos jako rozszerzenie istniejącej sesji kanału Discord:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

W trybie `agent-proxy` bot dołącza do skonfigurowanego kanału głosowego, ale tury agenta OpenClaw używają normalnej routowanej sesji i agenta kanału docelowego. Sesja głosowa czasu rzeczywistego wypowiada zwrócony wynik z powrotem na kanale głosowym. Agent nadzorujący nadal może używać normalnych narzędzi wiadomości zgodnie ze swoją zasadą narzędzi, w tym wysłać osobną wiadomość Discord, jeśli jest to właściwe działanie.

Gdy delegowane uruchomienie OpenClaw jest aktywne, nowe transkrypty głosowe Discord są traktowane jako sterowanie uruchomieniem na żywo przed rozpoczęciem kolejnej tury agenta. Wyrażenia takie jak „status”, „cancel that”, „use the smaller fix” albo „when you're done also check tests” są klasyfikowane jako status, anulowanie, sterowanie albo dane wejściowe dalszych działań dla aktywnej sesji. Wyniki statusu, anulowania, zaakceptowanego sterowania i dalszych działań są wypowiadane z powrotem na kanale głosowym, aby rozmówca wiedział, czy OpenClaw obsłużył żądanie.

Przydatne formy celu:

- `target: "channel:123456789012345678"` kieruje przez sesję kanału tekstowego Discord.
- `target: "123456789012345678"` jest traktowane jako cel kanału.
- `target: "dm:123456789012345678"` lub `target: "user:123456789012345678"` kieruje przez tę sesję wiadomości bezpośrednich.

Przykład OpenAI Realtime z dużym echem:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

Użyj tego, gdy model słyszy własne odtwarzanie Discord przez otwarty mikrofon, ale nadal chcesz przerywać mu mową. OpenClaw uniemożliwia OpenAI automatyczne przerywanie na podstawie surowego dźwięku wejściowego, a `bargeIn: true` pozwala zdarzeniom rozpoczęcia mówienia przez użytkownika Discord i już aktywnemu dźwiękowi mówcy anulować aktywne odpowiedzi czasu rzeczywistego, zanim następna przechwycona tura dotrze do OpenAI. Bardzo wczesne sygnały wejścia w wypowiedź z `audioEndMs` poniżej `minBargeInAudioEndMs` są traktowane jako prawdopodobne echo/szum i ignorowane, aby model nie urywał wypowiedzi przy pierwszej ramce odtwarzania.

Oczekiwane logi głosu:

- Przy dołączaniu: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Przy starcie czasu rzeczywistego: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Przy dźwięku mówcy: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` i `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Przy pominiętej nieaktualnej mowie: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` lub `reason=non-actionable-closing ...`
- Przy ukończeniu odpowiedzi czasu rzeczywistego: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Przy zatrzymaniu/resecie odtwarzania: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Przy konsultacji czasu rzeczywistego: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Przy odpowiedzi agenta: `discord voice: agent turn answer ...`
- Przy zakolejkowanej dokładnej wypowiedzi: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, po czym `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Przy wykryciu wejścia w wypowiedź: `discord voice: realtime barge-in detected source=speaker-start ...` lub `discord voice: realtime barge-in detected source=active-speaker-audio ...`, po czym `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Przy przerwaniu czasu rzeczywistego: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, po czym albo `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...`, albo `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Przy zignorowanym echu/szumie: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Przy wyłączonym wejściu w wypowiedź: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Przy bezczynnym odtwarzaniu: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Aby debugować ucięty dźwięk, czytaj logi głosu czasu rzeczywistego jako oś czasu:

1. `realtime audio playback started` oznacza, że Discord zaczął odtwarzać dźwięk asystenta. Od tego momentu most zaczyna liczyć fragmenty wyjścia asystenta, bajty PCM Discord, bajty dostawcy czasu rzeczywistego i czas trwania syntetyzowanego dźwięku.
2. `realtime speaker turn opened` oznacza, że mówca Discord stał się aktywny. Jeśli odtwarzanie jest już aktywne i `bargeIn` jest włączone, może po tym nastąpić `barge-in detected source=speaker-start`.
3. `realtime input audio started` oznacza pierwszą faktyczną ramkę audio odebraną dla tej tury mówcy. `outputActive=true` albo niezerowe `outputAudioMs` w tym miejscu oznacza, że mikrofon wysyła dane wejściowe, gdy odtwarzanie asystenta nadal jest aktywne.
4. `barge-in detected source=active-speaker-audio` oznacza, że OpenClaw zobaczył dźwięk mówcy na żywo, gdy odtwarzanie asystenta było aktywne. Jest to przydatne do odróżnienia prawdziwego przerwania od zdarzenia rozpoczęcia mówienia Discord bez użytecznego dźwięku.
5. `barge-in requested reason=...` oznacza, że OpenClaw poprosił dostawcę czasu rzeczywistego o anulowanie lub skrócenie aktywnej odpowiedzi. Zawiera `outputAudioMs`, `outputActive` i `playbackChunks`, aby było widać, ile dźwięku asystenta faktycznie odtworzono przed przerwaniem.
6. `realtime audio playback stopped reason=...` to lokalny punkt resetu odtwarzania Discord. Przyczyna wskazuje, kto zatrzymał odtwarzanie: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` albo `session-close`.
7. `realtime speaker turn closed` podsumowuje przechwyconą turę wejściową. `chunks=0` albo `hasAudio=false` oznacza, że tura mówcy została otwarta, ale żaden użyteczny dźwięk nie dotarł do mostu czasu rzeczywistego. `interruptedPlayback=true` oznacza, że ta tura wejściowa nakładała się na wyjście asystenta i uruchomiła logikę wejścia w wypowiedź.

Przydatne pola:

- `outputAudioMs`: czas trwania dźwięku asystenta wygenerowany przez dostawcę czasu rzeczywistego przed wierszem logu.
- `audioMs`: czas trwania dźwięku asystenta policzony przez OpenClaw przed zatrzymaniem odtwarzania.
- `elapsedMs`: czas zegarowy między otwarciem a zamknięciem strumienia odtwarzania albo tury mówcy.
- `discordBytes`: bajty stereofonicznego PCM 48 kHz wysłane do lub odebrane z głosu Discord.
- `realtimeBytes`: bajty PCM w formacie dostawcy wysłane do lub odebrane od dostawcy czasu rzeczywistego.
- `playbackChunks`: fragmenty dźwięku asystenta przekazane do Discord dla aktywnej odpowiedzi.
- `sinceLastAudioMs`: odstęp między ostatnią przechwyconą ramką dźwięku mówcy a zamknięciem tury mówcy.

Typowe wzorce:

- Natychmiastowe ucięcie z `source=active-speaker-audio`, małym `outputAudioMs` i tym samym użytkownikiem w pobliżu zwykle wskazuje na echo głośnika trafiające do mikrofonu. Zwiększ `voice.realtime.minBargeInAudioEndMs`, zmniejsz głośność głośnika, użyj słuchawek albo ustaw `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start`, po którym następuje `speaker turn closed ... hasAudio=false`, oznacza, że Discord zgłosił rozpoczęcie mówienia, ale żaden dźwięk nie dotarł do OpenClaw. Może to być przejściowe zdarzenie głosu Discord, zachowanie bramki szumów albo krótkie włączenie mikrofonu przez klienta.
- `audio playback stopped reason=stream-close` bez pobliskiego wejścia w wypowiedź albo `provider-clear-audio` oznacza, że lokalny strumień odtwarzania Discord zakończył się nieoczekiwanie. Sprawdź poprzedzające logi dostawcy i odtwarzacza Discord.
- `capture ignored during playback (barge-in disabled)` oznacza, że OpenClaw celowo odrzucił dane wejściowe, gdy dźwięk asystenta był aktywny. Włącz `voice.realtime.bargeIn`, jeśli chcesz, aby mowa przerywała odtwarzanie.
- `barge-in ignored ... outputActive=false` oznacza, że Discord albo VAD dostawcy zgłosił mowę, ale OpenClaw nie miał aktywnego odtwarzania do przerwania. Nie powinno to ucinać dźwięku.

Poświadczenia są rozwiązywane osobno dla każdego komponentu: uwierzytelnianie trasy LLM dla `voice.model`, uwierzytelnianie STT dla `tools.media.audio`, uwierzytelnianie TTS dla `messages.tts`/`voice.tts` oraz uwierzytelnianie dostawcy czasu rzeczywistego dla `voice.realtime.providers` albo normalnej konfiguracji uwierzytelniania dostawcy.

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd fali i wymagają dźwięku OGG/Opus. OpenClaw generuje falę automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście Gateway, aby sprawdzać i konwertować.

- Podaj **lokalną ścieżkę pliku** (adresy URL są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst + wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw konwertuje go do OGG/Opus w razie potrzeby.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intents albo bot nie widzi wiadomości z gildii">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy zależysz od rozpoznawania użytkowników/członków
    - uruchom ponownie Gateway po zmianie intents

  </Accordion>

  <Accordion title="Wiadomości z gildii są nieoczekiwanie blokowane">

    - zweryfikuj `groupPolicy`
    - zweryfikuj listę dozwolonych gildii w `channels.discord.guilds`
    - jeśli istnieje mapa `channels` gildii, dozwolone są tylko wymienione kanały
    - zweryfikuj zachowanie `requireMention` i wzorce wzmianek

    Przydatne kontrole:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention jest false, ale nadal blokuje">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych gildii/kanałów
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi być w `channels.discord.guilds` albo we wpisie kanału)
    - nadawca zablokowany przez listę dozwolonych `users` gildii/kanału

  </Accordion>

  <Accordion title="Długotrwałe tury Discord albo zduplikowane odpowiedzi">

    Typowe logi:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Ustawienia kolejki Gateway Discord:

    - jedno konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - to kontroluje tylko pracę listenera Gateway Discord, a nie czas życia tury agenta

    Discord nie stosuje limitu czasu należącego do kanału do kolejkowanych tur agenta. Listenery wiadomości przekazują pracę od razu, a kolejkowane uruchomienia Discord zachowują kolejność w ramach sesji, dopóki cykl życia sesji/narzędzia/runtime nie zakończy pracy albo jej nie przerwie.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Ostrzeżenia o przekroczeniu limitu czasu wyszukiwania metadanych Gateway">
    OpenClaw pobiera metadane Discord `/gateway/bot` przed połączeniem. Przejściowe awarie wracają do domyślnego adresu URL Gateway Discord i są limitowane w logach.

    Ustawienia limitu czasu metadanych:

    - jedno konto: `channels.discord.gatewayInfoTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - domyślnie: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Restarty po przekroczeniu limitu czasu Gateway READY">
    OpenClaw czeka na zdarzenie `READY` Gateway Discord podczas uruchamiania i po ponownych połączeniach runtime. Konfiguracje wielokontowe z rozłożonym startem mogą potrzebować dłuższego okna READY podczas uruchamiania niż domyślne.

    Ustawienia limitu czasu READY:

    - start, jedno konto: `channels.discord.gatewayReadyTimeoutMs`
    - start, wiele kont: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env podczas startu, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - domyślnie podczas startu: `15000` (15 sekund), maks.: `120000`
    - runtime, jedno konto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime, wiele kont: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env runtime, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - domyślnie runtime: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Kontrole uprawnień `channels status --probe` działają tylko dla numerycznych identyfikatorów kanałów.

    Jeśli używasz kluczy typu slug, dopasowywanie runtime nadal może działać, ale probe nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - polityka DM wyłączona: `channels.discord.dmPolicy="disabled"` (starsze: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot-bot">
    Domyślnie wiadomości napisane przez boty są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, użyj ścisłych reguł wzmianek i list dozwolonych, aby uniknąć zachowania pętli.
    Preferuj `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota.

    OpenClaw dostarcza też wspólną [ochronę przed pętlami botów](/pl/channels/bot-loop-protection). Gdy `allowBots` pozwala wiadomościom napisanym przez boty trafić do dispatch, Discord mapuje zdarzenie przychodzące na fakty `(account, channel, bot pair)`, a ogólny strażnik par tłumi parę po przekroczeniu skonfigurowanego budżetu zdarzeń. Strażnik zapobiega niekontrolowanym pętlom dwóch botów, które wcześniej musiały być zatrzymywane przez limity szybkości Discord; nie wpływa na wdrożenia z jednym botem ani jednorazowe odpowiedzi botów, które mieszczą się w budżecie.

    Ustawienia domyślne (aktywne, gdy ustawiono `allowBots`):

    - `maxEventsPerWindow: 20` -- para botów może wymienić 20 wiadomości w oknie kroczącym
    - `windowSeconds: 60` -- długość okna kroczącego
    - `cooldownSeconds: 60` -- po wyczerpaniu budżetu każda dodatkowa wiadomość bot-bot w dowolnym kierunku jest odrzucana przez jedną minutę

    Skonfiguruj wspólną wartość domyślną raz w `channels.defaults.botLoopProtection`, a następnie nadpisz Discord, gdy prawidłowy workflow potrzebuje większego zapasu. Kolejność pierwszeństwa:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - wbudowane wartości domyślne

    Discord używa ogólnych kluczy `maxEventsPerWindow`, `windowSeconds` i `cooldownSeconds`.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="STT głosu odpada z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby była dostępna logika odzyskiwania odbioru głosu Discord
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli awarie trwają po automatycznym ponownym dołączeniu, zbierz logi i porównaj z upstreamową historią odbioru DAVE w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) i [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="Najważniejsze pola Discord">

- uruchamianie/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- polityka: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenie: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- odpowiedź/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponowienie: `mediaMaxMb` (ogranicza wychodzące przesyłanie plików Discord, domyślnie `100MB`), `retry`
- akcje: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (`DISCORD_BOT_TOKEN` preferowane w środowiskach nadzorowanych).
- Przyznawaj uprawnienia Discord zgodnie z zasadą najmniejszych uprawnień.
- Jeśli wdrożenie poleceń/stan jest nieaktualny, uruchom ponownie Gateway i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discord z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Czat grupowy i zachowanie list dozwolonych.
  </Card>
  <Card title="Routing kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Routing wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj gildie i kanały na agentów.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Zachowanie natywnych poleceń.
  </Card>
</CardGroup>
