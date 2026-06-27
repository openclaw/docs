---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Stan obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-06-27T17:09:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

Gotowe do wiadomości prywatnych i kanałów serwera przez oficjalny Discord gateway.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Discord domyślnie używają trybu parowania.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pl/tools/slash-commands">
    Natywne działanie poleceń i katalog poleceń.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i proces naprawy.
  </Card>
</CardGroup>

## Szybka konfiguracja

Musisz utworzyć nową aplikację z botem, dodać bota do swojego serwera i sparować go z OpenClaw. Zalecamy dodanie bota do własnego prywatnego serwera. Jeśli jeszcze go nie masz, [najpierw go utwórz](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wybierz **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    Przejdź do [Discord Developer Portal](https://discord.com/developers/applications) i kliknij **New Application**. Nadaj mu nazwę podobną do „OpenClaw”.

    Kliknij **Bot** na pasku bocznym. Ustaw **Username** na nazwę, której używasz dla swojego agenta OpenClaw.

  </Step>

  <Step title="Enable privileged intents">
    Nadal na stronie **Bot** przewiń w dół do **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazw do identyfikatorów)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Copy your bot token">
    Przewiń z powrotem w górę na stronie **Bot** i kliknij **Reset Token**.

    <Note>
    Pomimo nazwy generuje to Twój pierwszy token — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go gdzieś. To jest Twój **Bot Token** i będzie potrzebny za chwilę.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz adres URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do swojego serwera.

    Przewiń w dół do **OAuth2 URL Generator** i włącz:

    - `bot`
    - `applications.commands`

    Poniżej pojawi się sekcja **Bot Permissions**. Włącz co najmniej:

    **General Permissions**
      - Wyświetlanie kanałów
    **Text Permissions**
      - Wysyłanie wiadomości
      - Odczytywanie historii wiadomości
      - Osadzanie linków
      - Dołączanie plików
      - Dodawanie reakcji (opcjonalne)

    To jest zestaw bazowy dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w przepływach kanałów forum lub mediów, które tworzą albo kontynuują wątek, włącz także **Send Messages in Threads**.
    Skopiuj wygenerowany adres URL na dole, wklej go w przeglądarce, wybierz swój serwer i kliknij **Continue**, aby połączyć. Bot powinien być teraz widoczny na serwerze Discord.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    W aplikacji Discord musisz włączyć tryb deweloperski, aby móc kopiować wewnętrzne identyfikatory.

    1. Kliknij **User Settings** (ikona koła zębatego obok awatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem **własny awatar** → **Copy User ID**

    Zapisz **Server ID** i **User ID** obok Bot Token — w następnym kroku wyślesz wszystkie trzy wartości do OpenClaw.

  </Step>

  <Step title="Allow DMs from server members">
    Aby parowanie działało, Discord musi zezwalać botowi na wysyłanie do Ciebie wiadomości prywatnych. Kliknij prawym przyciskiem **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać Ci wiadomości prywatne. Pozostaw to włączone, jeśli chcesz używać wiadomości prywatnych Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, możesz wyłączyć wiadomości prywatne po sparowaniu.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
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
    W przypadku instalacji jako usługa zarządzana uruchom `openclaw gateway install` z powłoki, w której obecny jest `DISCORD_BOT_TOKEN`, albo zapisz zmienną w `~/.openclaw/.env`, aby usługa mogła rozwiązać env SecretRef po ponownym uruchomieniu.
    Jeśli host jest blokowany albo ograniczany przez Discord podczas początkowego wyszukiwania aplikacji, ustaw identyfikator aplikacji/klienta Discord z Developer Portal, aby uruchamianie mogło pominąć to wywołanie REST. Użyj `channels.discord.applicationId` dla konta domyślnego albo `channels.discord.accounts.<accountId>.applicationId`, gdy uruchamiasz wiele botów Discord.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i powiedz mu. Jeśli Discord jest Twoim pierwszym kanałem, zamiast tego użyj karty CLI / config.

        > „Ustawiłem już token mojego bota Discord w konfiguracji. Dokończ konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`.”
      </Tab>
      <Tab title="CLI / config">
        Jeśli wolisz konfigurację opartą na plikach, ustaw:

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

        Zapasowa zmienna env dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        W przypadku konfiguracji skryptowej lub zdalnej zapisz ten sam blok JSON5 za pomocą `openclaw config patch --file ./discord.patch.json5 --dry-run`, a potem uruchom ponownie bez `--dry-run`. Wartości `token` w postaci jawnego tekstu są obsługiwane. Wartości SecretRef są również obsługiwane dla `channels.discord.token` przez dostawców env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

        W przypadku wielu botów Discord trzymaj token i identyfikator aplikacji każdego bota na jego koncie. Najwyższego poziomu `channels.discord.applicationId` jest dziedziczone przez konta, więc ustawiaj je tam tylko wtedy, gdy każde konto ma używać tego samego identyfikatora aplikacji.

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

  <Step title="Approve first DM pairing">
    Poczekaj, aż gateway będzie uruchomiony, a potem wyślij wiadomość prywatną do bota w Discord. Odpowie kodem parowania.

    <Tabs>
      <Tab title="Ask your agent">
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

    Teraz możesz czatować ze swoim agentem w Discord przez wiadomości prywatne.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenów uwzględnia konta. Wartości tokenów z konfiguracji mają pierwszeństwo przed zapasową zmienną env. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
Jeśli dwa włączone konta Discord rozwiązują się do tego samego tokena bota, OpenClaw uruchamia tylko jeden monitor gateway dla tego tokena. Token pochodzący z konfiguracji ma pierwszeństwo przed domyślną zapasową zmienną env; w przeciwnym razie wygrywa pierwsze włączone konto, a zduplikowane konto jest zgłaszane jako wyłączone.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/akcje kanału) jawny `token` dla danego wywołania jest używany właśnie dla tego wywołania. Dotyczy to akcji wysyłania i odczytu/sondowania (na przykład read/search/fetch/thread/pins/permissions). Zasady konta i ustawienia ponawiania nadal pochodzą z wybranego konta w aktywnej migawce runtime.
</Note>

## Zalecane: skonfiguruj obszar roboczy serwera

Gdy wiadomości prywatne działają, możesz skonfigurować serwer Discord jako pełny obszar roboczy, w którym każdy kanał otrzymuje własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteś tylko Ty i Twój bot.

<Steps>
  <Step title="Add your server to the guild allowlist">
    Dzięki temu agent może odpowiadać w dowolnym kanale na Twoim serwerze, nie tylko w wiadomościach prywatnych.

    <Tabs>
      <Tab title="Ask your agent">
        > „Dodaj mój Discord Server ID `<server_id>` do listy dozwolonych serwerów”
      </Tab>
      <Tab title="Config">

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

  <Step title="Allow responses without @mention">
    Domyślnie agent odpowiada w kanałach serwera tylko wtedy, gdy zostanie @wspomniany. W przypadku prywatnego serwera prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    W kanałach serwera zwykłe odpowiedzi domyślnie są publikowane automatycznie. W przypadku współdzielonych, zawsze aktywnych pokojów włącz `messages.groupChat.visibleReplies: "message_tool"`, aby agent mógł obserwować i publikować tylko wtedy, gdy uzna, że odpowiedź w kanale jest przydatna. Działa to najlepiej z modelami najnowszej generacji, niezawodnie korzystającymi z narzędzi, takimi jak GPT 5.5. Zdarzenia pokojów w tle pozostają ciche, chyba że narzędzie coś wyśle. Zobacz [Zdarzenia pokojów w tle](/pl/channels/ambient-room-events), aby poznać pełną konfigurację trybu obserwowania.

    Jeśli Discord pokazuje pisanie, a logi pokazują użycie tokenów, ale żadna wiadomość nie została opublikowana, sprawdź, czy tura została skonfigurowana jako zdarzenie pokoju w tle albo czy włączono widoczne odpowiedzi przez narzędzie wiadomości.

    <Tabs>
      <Tab title="Ask your agent">
        > „Pozwól mojemu agentowi odpowiadać na tym serwerze bez konieczności @wspominania”
      </Tab>
      <Tab title="Config">
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

  <Step title="Plan for memory in guild channels">
    Domyślnie pamięć długoterminowa (MEMORY.md) ładuje się tylko w sesjach wiadomości prywatnych. Kanały serwera nie ładują automatycznie MEMORY.md.

    <Tabs>
      <Tab title="Ask your agent">
        > „Gdy zadaję pytania w kanałach Discord, użyj memory_search albo memory_get, jeśli potrzebujesz długoterminowego kontekstu z MEMORY.md.”
      </Tab>
      <Tab title="Manual">
        Jeśli potrzebujesz wspólnego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` albo `USER.md` (są wstrzykiwane do każdej sesji). Przechowuj długoterminowe notatki w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij czatować. Agent widzi nazwę kanału, a każdy kanał otrzymuje własną izolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` albo cokolwiek pasuje do Twojego przepływu pracy.

## Model runtime

- Gateway zarządza połączeniem z Discord.
- Routing odpowiedzi jest deterministyczny: odpowiedzi przychodzące z Discord wracają do Discord.
- Metadane gildii/kanału Discord są dodawane do promptu modelu jako niezaufany
  kontekst, a nie jako widoczny dla użytkownika prefiks odpowiedzi. Jeśli model skopiuje tę kopertę
  z powrotem, OpenClaw usuwa skopiowane metadane z odpowiedzi wychodzących i z
  przyszłego kontekstu odtwarzania.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały gildii są izolowanymi kluczami sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia ukośnikowe działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), nadal przenosząc `CommandTargetSessionKey` do routowanej sesji rozmowy.
- Dostarczanie tekstowych ogłoszeń cron/heartbeat do Discord używa końcowej
  odpowiedzi widocznej dla asystenta jeden raz. Multimedia i ustrukturyzowane ładunki komponentów pozostają
  wielowiadomościowe, gdy agent emituje wiele możliwych do dostarczenia ładunków.

## Kanały forum

Kanały forum i mediów Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do rodzica forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku używa pierwszego niepustego wiersza wiadomości.
- Użyj `openclaw message thread create`, aby utworzyć wątek bezpośrednio. Nie przekazuj `--message-id` dla kanałów forum.

Przykład: wyślij do rodzica forum, aby utworzyć wątek

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Przykład: utwórz wątek forum jawnie

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Rodzice forum nie akceptują komponentów Discord. Jeśli potrzebujesz komponentów, wyślij je do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agentów. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są routowane z powrotem do agenta jako normalne wiadomości przychodzące i respektują istniejące ustawienia Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowe. Ustaw `components.reusable=true`, aby pozwolić na wielokrotne używanie przycisków, pól wyboru i formularzy do czasu ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` na tym przycisku (identyfikatory użytkowników Discord, tagi albo `*`). Po skonfigurowaniu niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Wywołania zwrotne komponentów wygasają domyślnie po 30 minutach. Ustaw `channels.discord.agentComponents.ttlMs`, aby zmienić ten czas życia rejestru wywołań zwrotnych dla domyślnego konta Discord, albo `channels.discord.accounts.<accountId>.agentComponents.ttlMs`, aby nadpisać jedno konto w konfiguracji wielokontowej. Wartość jest w milisekundach, musi być dodatnią liczbą całkowitą i jest ograniczona do `86400000` (24 godziny). Dłuższe TTL są przydatne w przepływach pracy przeglądu lub zatwierdzania, które wymagają, aby przyciski pozostały używalne, ale wydłużają też okno, w którym stara wiadomość Discord nadal może wyzwolić akcję. Preferuj najkrótszy TTL pasujący do przepływu pracy i zachowaj wartość domyślną, gdy nieaktualne wywołania zwrotne byłyby zaskakujące.

Polecenia ukośnikowe `/model` i `/models` otwierają interaktywny selektor modelu z listami rozwijanymi dostawcy, modelu i zgodnego środowiska uruchomieniowego oraz krokiem Submit. `/models add` jest przestarzałe i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu. Odpowiedź selektora jest efemeryczna i może jej używać tylko wywołujący użytkownik. Menu wyboru Discord są ograniczone do 25 opcji, więc dodaj wpisy `provider/*` do `agents.defaults.models`, gdy chcesz, aby selektor pokazywał dynamicznie wykryte modele tylko dla wybranych dostawców, takich jak `openai` lub `vllm`.

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
    `channels.discord.dmPolicy` kontroluje dostęp DM. `channels.discord.allowFrom` jest kanoniczną listą dozwolonych DM.

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`)
    - `disabled`

    Jeśli polityka DM nie jest otwarta, nieznani użytkownicy są blokowani (albo proszeni o parowanie w trybie `pairing`).

    Priorytet w konfiguracji wielokontowej:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Dla jednego konta `allowFrom` ma pierwszeństwo przed starszym `dm.allowFrom`.
    - Konta nazwane dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` i starsze `dm.allowFrom` nie są ustawione.
    - Konta nazwane nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Starsze `channels.discord.dm.policy` i `channels.discord.dm.allowFrom` nadal są odczytywane w celu zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Format celu DM do dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same identyfikatory numeryczne zwykle rozwiązują się jako identyfikatory kanałów, gdy aktywna jest domyślność kanału, ale identyfikatory wymienione w efektywnym `allowFrom` DM konta są traktowane jako cele DM użytkownika w celu zgodności.

  </Tab>

  <Tab title="Access groups">
    DM Discord i autoryzacja poleceń tekstowych mogą używać dynamicznych wpisów `accessGroup:<name>` w `channels.discord.allowFrom`.

    Nazwy grup dostępu są współdzielone między kanałami wiadomości. Użyj `type: "message.senders"` dla statycznej grupy, której członkowie są wyrażeni w normalnej składni `allowFrom` każdego kanału, albo `type: "discord.channelAudience"`, gdy bieżąca grupa odbiorców `ViewChannel` kanału Discord ma definiować członkostwo dynamicznie. Wspólne zachowanie grup dostępu jest udokumentowane tutaj: [Grupy dostępu](/pl/channels/access-groups).

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

    Kanał tekstowy Discord nie ma osobnej listy członków. `type: "discord.channelAudience"` modeluje członkostwo następująco: nadawca DM jest członkiem skonfigurowanej gildii i obecnie ma efektywne uprawnienie `ViewChannel` na skonfigurowanym kanale po zastosowaniu nadpisań ról i kanału.

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

    Wyszukiwania zamykają dostęp w przypadku błędu. Jeśli Discord zwróci `Missing Access`, wyszukiwanie członka nie powiedzie się albo kanał należy do innej gildii, nadawca DM jest traktowany jako nieautoryzowany.

    Włącz **Server Members Intent** dla bota w Discord Developer Portal, gdy używasz grup dostępu opartych na odbiorcach kanału. DM nie obejmują stanu członka gildii, więc OpenClaw rozwiązuje członka przez Discord REST w czasie autoryzacji.

  </Tab>

  <Tab title="Guild policy">
    Obsługą gildii steruje `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczną bazą, gdy istnieje `channels.discord`, jest `allowlist`.

    Zachowanie `allowlist`:

    - gildia musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli którakolwiek jest skonfigurowana, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako tryb zgodności awaryjnej
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazw/tagów
    - jeśli gildia ma skonfigurowane `channels`, kanały niewymienione na liście są odrzucane
    - jeśli gildia nie ma bloku `channels`, wszystkie kanały w tej dozwolonej gildii są dozwolone

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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, awaryjne zachowanie środowiska uruchomieniowego to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Wiadomości gildii są domyślnie ograniczone wymogiem wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    Podczas pisania wychodzących wiadomości Discord używaj kanonicznej składni wzmianek: `<@USER_ID>` dla użytkowników, `<#CHANNEL_ID>` dla kanałów i `<@&ROLE_ID>` dla ról. Nie używaj starszej formy wzmianki z pseudonimem `<@!USER_ID>`.

    `requireMention` jest konfigurowane dla gildii/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów albo slugi)

  </Tab>
</Tabs>

### Routing agenta oparty na rolach

Użyj `bindings[].match.roles`, aby kierować członków gildii Discord do różnych agentów według ID roli. Powiązania oparte na rolach akceptują tylko ID ról i są oceniane po powiązaniach peer lub parent-peer oraz przed powiązaniami tylko dla gildii. Jeśli powiązanie ustawia także inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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
- Polecenia mogą nadal być widoczne w interfejsie Discord dla użytkowników, którzy nie są autoryzowani; wykonanie nadal egzekwuje autoryzację OpenClaw i zwraca "not authorized".

Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands), aby poznać katalog poleceń i ich zachowanie.

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
    zdarzenie przychodzące było odbitą partią wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie w niejednoznacznych, gwałtownych czatach, a nie w każdej
    turze z pojedynczą wiadomością.

    ID wiadomości są udostępniane w kontekście/historii, aby agenci mogli kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Podglądy linków">
    Discord domyślnie generuje rozbudowane osadzenia linków dla URL-i. OpenClaw domyślnie tłumi te wygenerowane osadzenia w wychodzących wiadomościach Discord, więc URL-e wysyłane przez agenta pozostają zwykłymi linkami, chyba że włączysz tę funkcję:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Ustaw `channels.discord.accounts.<id>.suppressEmbeds`, aby nadpisać jedno konto. Wysyłki z narzędzia wiadomości agenta mogą też przekazać `suppressEmbeds: false` dla pojedynczej wiadomości. Jawne ładunki Discord `embeds` nie są tłumione przez domyślne ustawienie podglądu linków.

  </Accordion>

  <Accordion title="Podgląd strumienia na żywo">
    OpenClaw może strumieniować robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływu tekstu. `channels.discord.streaming` przyjmuje `off` | `partial` | `block` | `progress` (domyślnie). `progress` utrzymuje jeden edytowalny szkic statusu i aktualizuje go postępem narzędzi aż do finalnego dostarczenia; współdzielona etykieta startowa jest przewijaną linią, więc znika tak jak reszta, gdy pojawi się wystarczająco dużo pracy. `streamMode` to starszy alias środowiska uruchomieniowego. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację na klucz kanoniczny.

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
    - `block` emituje fragmenty wielkości szkicu (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału, ograniczone do `textChunkLimit`).
    - Media, błędy i finały z jawną odpowiedzią anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie używają wiadomości podglądu.
    - Wiersze narzędzi/postępu renderują się jako kompaktowe emoji + tytuł + szczegół, gdy są dostępne, na przykład `🛠️ Bash: run tests` lub `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (domyślnie `false`) włącza tekst komentarza/preambuły asystenta w tymczasowym szkicu postępu. Komentarz jest czyszczony przed wyświetleniem, pozostaje tymczasowy i nie zmienia dostarczania finalnej odpowiedzi.
    - `streaming.progress.maxLineChars` kontroluje budżet podglądu postępu na linię. Proza jest skracana na granicach słów; szczegóły poleceń i ścieżek zachowują przydatne sufiksy.
    - `streaming.preview.commandText` / `streaming.progress.commandText` kontroluje szczegóły poleceń/wykonań w kompaktowych liniach postępu: `raw` (domyślnie) lub `status` (tylko etykieta narzędzia).

    Ukryj surowy tekst poleceń/wykonań, zachowując kompaktowe linie postępu:

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

    Strumieniowanie podglądu obsługuje tylko tekst; odpowiedzi z multimediami wracają do normalnego dostarczania. Gdy strumieniowanie `block` jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii gildii:

    - domyślna wartość `channels.discord.historyLimit` to `20`
    - wartość awaryjna: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrolki historii DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są kierowane jako sesje kanału i dziedziczą konfigurację kanału nadrzędnego, chyba że zostaną nadpisane.
    - Sesje wątków dziedziczą wybór `/model` na poziomie sesji kanału nadrzędnego jako awaryjny wybór wyłącznie modelu; lokalne wybory `/model` w wątku nadal mają pierwszeństwo, a historia transkrypcji nadrzędnej nie jest kopiowana, chyba że włączono dziedziczenie transkrypcji.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) włącza dla nowych automatycznych wątków inicjowanie z transkrypcji nadrzędnej. Nadpisania dla konta znajdują się w `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozwiązywać cele DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas awaryjnej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych kontrolują, kto może wyzwolić agenta, a nie pełną granicę redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla podagentów">
    Discord może powiązać wątek z celem sesji, aby kolejne wiadomości w tym wątku nadal były kierowane do tej samej sesji (w tym sesji podagentów).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z docelowym podagentem/sesją
    - `/unfocus` usuń powiązanie bieżącego wątku
    - `/agents` pokaż aktywne uruchomienia i stan powiązania
    - `/session idle <duration|off>` sprawdź/zaktualizuj automatyczne usuwanie fokusu po bezczynności dla powiązań z fokusem
    - `/session max-age <duration|off>` sprawdź/zaktualizuj twardy maksymalny wiek dla powiązań z fokusem

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
    W przypadku stabilnych obszarów roboczych ACP działających „zawsze włączone” skonfiguruj typowane powiązania ACP najwyższego poziomu kierowane do rozmów Discord.

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

    - `/acp spawn codex --bind here` wiąże bieżący kanał lub wątek w miejscu i utrzymuje przyszłe wiadomości w tej samej sesji ACP. Wiadomości w wątku dziedziczą powiązanie kanału nadrzędnego.
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP w miejscu. Tymczasowe powiązania wątków mogą nadpisywać rozwiązywanie celu, gdy są aktywne.
    - `spawnSessions` steruje tworzeniem/powiązywaniem wątków podrzędnych przez `--thread auto|here`.

    Szczegóły zachowania powiązań znajdziesz w [Agenci ACP](/pl/tools/acp-agents).

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Tryb powiadomień o reakcjach dla serwera:

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (używa `guilds.<id>.users`)

    Zdarzenia reakcji są przekształcane w zdarzenia systemowe i dołączane do kierowanej sesji Discord.

  </Accordion>

  <Accordion title="Reakcje potwierdzenia">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozwiązywania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - zastępcze emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Discord akceptuje emoji unicode lub niestandardowe nazwy emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji">
    Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone.

    Dotyczy to przepływów `/config set|unset` (gdy funkcje poleceń są włączone).

    Wyłącz:

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
    Kieruj ruch WebSocket Gateway Discord oraz startowe wyszukiwania REST (identyfikator aplikacji + rozwiązywanie listy dozwolonych) przez proxy HTTP(S) z `channels.discord.proxy`.

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
    Włącz rozwiązywanie PluralKit, aby mapować proxowane wiadomości na tożsamość członka systemu:

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
    - jeśli wyszukiwanie się nie powiedzie, wiadomości proxied są traktowane jako wiadomości bota i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Użyj `mentionAliases`, gdy agenci potrzebują deterministycznych wychodzących wzmianek dla znanych użytkowników Discord. Klucze to uchwyty bez początkowego `@`; wartości to identyfikatory użytkowników Discord. Nieznane uchwyty, `@everyone`, `@here` oraz wzmianki wewnątrz spanów kodu Markdown pozostają bez zmian.

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

  <Accordion title="Presence configuration">
    Aktualizacje obecności są stosowane, gdy ustawisz pole statusu lub aktywności albo gdy włączysz automatyczną obecność.

    Przykład tylko ze statusem:

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

    Przykład automatycznej obecności (sygnał kondycji środowiska uruchomieniowego):

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

    Automatyczna obecność mapuje dostępność środowiska uruchomieniowego na status Discord: zdrowe => online, zdegradowane lub nieznane => bezczynny, wyczerpane lub niedostępne => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord obsługuje zatwierdzanie za pomocą przycisków w wiadomościach prywatnych i może opcjonalnie publikować monity zatwierdzenia w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; gdy to możliwe, wraca do `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` jest nieustawione lub ma wartość `"auto"` i można ustalić co najmniej jednego zatwierdzającego, z `execApprovals.approvers` albo z `commands.ownerAllowFrom`. Discord nie wyprowadza zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzania.

    W przypadku wrażliwych poleceń grupowych tylko dla właściciela, takich jak `/diagnostics` i `/export-trajectory`, OpenClaw wysyła monity zatwierdzenia i wyniki końcowe prywatnie. Najpierw próbuje wiadomości prywatnej Discord, gdy właściciel wywołujący ma trasę właściciela Discord; jeśli nie jest ona dostępna, wraca do pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, takiej jak Telegram.

    Gdy `target` ma wartość `channel` lub `both`, monit zatwierdzenia jest widoczny w kanale. Przycisków mogą używać tylko ustaleni zatwierdzający; inni użytkownicy otrzymują efemeryczną odmowę. Monity zatwierdzenia zawierają tekst polecenia, więc włączaj dostarczanie do kanału tylko w zaufanych kanałach. Jeśli nie można wyprowadzić identyfikatora kanału z klucza sesji, OpenClaw wraca do dostarczania przez wiadomość prywatną.

    Discord renderuje też współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Discord dodaje głównie routing wiadomości prywatnych zatwierdzających i fanout kanałów.
    Gdy te przyciski są obecne, są podstawowym UX zatwierdzania; OpenClaw
    powinien uwzględniać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    Jeśli natywne środowisko uruchomieniowe zatwierdzania Discord nie jest aktywne, OpenClaw zachowuje
    widoczny lokalny deterministyczny monit `/approve <id> <decision>`. Jeśli
    środowisko uruchomieniowe jest aktywne, ale natywnej karty nie można dostarczyć do żadnego celu,
    OpenClaw wysyła w tym samym czacie zastępcze powiadomienie z dokładnym poleceniem `/approve`
    z oczekującego zatwierdzenia.

    Uwierzytelnianie Gateway i rozstrzyganie zatwierdzeń są zgodne ze współdzielonym kontraktem klienta Gateway (identyfikatory `plugin:` są rozstrzygane przez `plugin.approval.resolve`; inne identyfikatory przez `exec.approval.resolve`). Zatwierdzenia domyślnie wygasają po 30 minutach.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki akcji

Akcje wiadomości Discord obejmują wiadomości, administrowanie kanałami, moderację, obecność i akcje metadanych.

Podstawowe przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Akcja `event-create` przyjmuje opcjonalny parametr `image` (URL lub ścieżkę do pliku lokalnego), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki akcji znajdują się pod `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa akcji                                                                                                                                                              | Domyślne |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone |
| roles                                                                                                                                                                    | wyłączone |
| moderation                                                                                                                                                               | wyłączone |
| presence                                                                                                                                                                 | wyłączone |

## Interfejs użytkownika Components v2

OpenClaw używa komponentów Discord v2 do zatwierdzeń exec i markerów międzykontekstowych. Akcje wiadomości Discord mogą też przyjmować `components` dla niestandardowego interfejsu użytkownika (zaawansowane; wymaga skonstruowania payloadu komponentu przez narzędzie discord), a starsze `embeds` pozostają dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustaw dla konta za pomocą `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` kontroluje, jak długo wysłane wywołania zwrotne komponentów Discord pozostają zarejestrowane (domyślnie `1800000`, maksimum `86400000`). Ustaw dla konta za pomocą `channels.discord.accounts.<id>.agentComponents.ttlMs`.
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

Discord ma dwie odrębne powierzchnie głosowe: **kanały głosowe** w czasie rzeczywistym (ciągłe rozmowy) oraz **załączniki wiadomości głosowych** (format podglądu fali dźwiękowej). Gateway obsługuje obie.

### Kanały głosowe

Lista kontrolna konfiguracji:

1. Włącz Message Content Intent w Discord Developer Portal.
2. Włącz Server Members Intent, gdy używane są listy dozwolonych ról/użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Przyznaj Connect, Speak, Send Messages i Read Message History w docelowym kanale głosowym.
5. Włącz natywne polecenia (`commands.native` lub `channels.discord.commands.native`).
6. Skonfiguruj `channels.discord.voice`.

Użyj `/vc join|leave|status`, aby kontrolować sesje. Polecenie używa domyślnego agenta konta i stosuje te same reguły listy dozwolonych oraz polityki grupowej co inne polecenia Discord.

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

- `voice.tts` nadpisuje `messages.tts` tylko dla odtwarzania głosu `stt-tts`. Tryby realtime używają `voice.realtime.speakerVoice`.
- `voice.mode` kontroluje ścieżkę rozmowy. Wartość domyślna to `agent-proxy`: frontend głosowy realtime obsługuje taktowanie tur, przerywanie i odtwarzanie, deleguje merytoryczną pracę do trasowanego agenta OpenClaw przez `openclaw_agent_consult` i traktuje wynik jak wpisany prompt Discord od tego mówcy. `stt-tts` zachowuje starszy przepływ wsadowego STT plus TTS. `bidi` pozwala modelowi realtime rozmawiać bezpośrednio, jednocześnie udostępniając `openclaw_agent_consult` dla mózgu OpenClaw.
- `voice.agentSession` kontroluje, która rozmowa OpenClaw otrzymuje tury głosowe. Pozostaw to nieustawione dla własnej sesji kanału głosowego albo ustaw `{ mode: "target", target: "channel:<text-channel-id>" }`, aby kanał głosowy działał jako rozszerzenie mikrofonu/głośnika istniejącej sesji kanału tekstowego Discord, takiej jak `#maintainers`.
- `voice.model` nadpisuje mózg agenta OpenClaw dla odpowiedzi głosowych Discord i konsultacji realtime. Pozostaw to nieustawione, aby odziedziczyć trasowany model agenta. Jest to oddzielne od `voice.realtime.model`.
- `voice.followUsers` pozwala botowi dołączać, przenosić się i opuszczać głos Discord z wybranymi użytkownikami. Zobacz [Śledź użytkowników w głosie](#follow-users-in-voice), aby poznać reguły zachowania i przykłady.
- `agent-proxy` trasuje mowę przez `discord-voice`, co zachowuje normalną autoryzację właściciela/narzędzi dla mówcy i sesji docelowej, ale ukrywa narzędzie agenta `tts`, ponieważ głos Discord jest właścicielem odtwarzania. Domyślnie `agent-proxy` daje konsultacji pełny dostęp do narzędzi równoważny właścicielowi dla mówców właścicieli (`voice.realtime.toolPolicy: "owner"`) i zdecydowanie preferuje konsultowanie agenta OpenClaw przed merytorycznymi odpowiedziami (`voice.realtime.consultPolicy: "always"`). W tym domyślnym trybie `always` warstwa realtime nie wypowiada automatycznie wypełniacza przed odpowiedzią konsultacji; przechwytuje i transkrybuje mowę, a następnie wypowiada trasowaną odpowiedź OpenClaw. Jeśli wiele wymuszonych odpowiedzi konsultacji zakończy się, gdy Discord nadal odtwarza pierwszą odpowiedź, późniejsze odpowiedzi dokładnej mowy są kolejkowane do bezczynności odtwarzania zamiast zastępować mowę w środku zdania.
- W trybie `stt-tts` STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- W trybach realtime `voice.realtime.provider`, `voice.realtime.model` i `voice.realtime.speakerVoice` konfigurują sesję audio realtime. Dla OpenAI Realtime 2 plus mózg Codex użyj `voice.realtime.model: "gpt-realtime-2"` i `voice.model: "openai/gpt-5.5"`.
- Tryby głosowe realtime domyślnie dołączają małe pliki profilu `IDENTITY.md`, `USER.md` i `SOUL.md` do instrukcji dostawcy realtime, aby szybkie bezpośrednie tury zachowały tę samą tożsamość, osadzenie użytkownika i personę co trasowany agent OpenClaw. Ustaw `voice.realtime.bootstrapContextFiles` na podzbiór, aby to dostosować, albo `[]`, aby to wyłączyć. Obsługiwane pliki rozruchowe realtime są ograniczone do tych plików profilu; `AGENTS.md` pozostaje w normalnym kontekście agenta. Wstrzyknięty kontekst profilu nie zastępuje `openclaw_agent_consult` dla pracy w obszarze roboczym, bieżących faktów, wyszukiwania w pamięci ani działań wspieranych narzędziami.
- W trybie realtime OpenAI `agent-proxy` ustaw `voice.realtime.requireWakeName: true`, aby głos realtime Discord pozostawał cichy, dopóki transkrypt nie zacznie się lub nie skończy nazwą wybudzającą. Skonfigurowane nazwy wybudzające muszą mieć jedno lub dwa słowa. Jeśli `voice.realtime.wakeNames` nie jest ustawione, OpenClaw używa trasowanej wartości `name` agenta plus `OpenClaw`, a awaryjnie identyfikatora agenta plus `OpenClaw`. Bramkowanie nazwą wybudzającą wyłącza automatyczną odpowiedź dostawcy realtime, trasuje zaakceptowane tury przez ścieżkę konsultacji agenta OpenClaw i daje krótkie wypowiedziane potwierdzenie, gdy początkowa nazwa wybudzająca zostanie rozpoznana z częściowej transkrypcji przed nadejściem końcowego transkryptu.
- Dostawca realtime OpenAI akceptuje bieżące nazwy zdarzeń Realtime 2 oraz starsze aliasy zgodne z Codex dla zdarzeń audio wyjściowego i transkryptu, więc zgodne migawki dostawcy mogą się przesuwać bez gubienia audio asystenta.
- `voice.realtime.bargeIn` kontroluje, czy zdarzenia rozpoczęcia mówienia przez użytkownika Discord przerywają aktywne odtwarzanie realtime. Jeśli nie jest ustawione, podąża za ustawieniem przerywania audio wejściowego dostawcy realtime.
- `voice.realtime.minBargeInAudioEndMs` kontroluje minimalny czas odtwarzania asystenta, zanim wtrącenie OpenAI realtime skróci audio. Domyślnie: `250`. Ustaw `0` dla natychmiastowego przerwania w pomieszczeniach o niskim echu albo zwiększ tę wartość dla konfiguracji głośników z dużym echem.
- Dla głosu OpenAI w odtwarzaniu Discord ustaw `voice.tts.provider: "openai"` i wybierz głos zamiany tekstu na mowę pod `voice.tts.providers.openai.speakerVoice`. `cedar` jest dobrym wyborem brzmiącym męsko w bieżącym modelu TTS OpenAI.
- Nadpisania `systemPrompt` Discord dla poszczególnych kanałów mają zastosowanie do tur transkryptu głosowego dla tego kanału głosowego.
- Tury transkryptu głosowego wyprowadzają status właściciela z Discord `allowFrom` (lub `dm.allowFrom`) dla poleceń bramkowanych właścicielem i działań kanału. Widoczność narzędzi agenta podąża za skonfigurowaną polityką narzędzi dla trasowanej sesji.
- Głos Discord jest opcjonalny dla konfiguracji tylko tekstowych; ustaw `channels.discord.voice.enabled=true` (albo zachowaj istniejący blok `channels.discord.voice`), aby włączyć polecenia `/vc`, runtime głosu i intencję Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` może jawnie nadpisać subskrypcję intencji stanu głosu. Pozostaw to nieustawione, aby intencja podążała za efektywnym włączeniem głosu.
- Jeśli `voice.autoJoin` ma wiele wpisów dla tej samej gildii, OpenClaw dołącza do ostatniego skonfigurowanego kanału dla tej gildii.
- `voice.allowedChannels` jest opcjonalną listą dozwolonych miejsc pobytu. Pozostaw ją nieustawioną, aby zezwolić `/vc join` na dołączenie do dowolnego autoryzowanego kanału głosowego Discord. Gdy jest ustawiona, `/vc join`, automatyczne dołączanie przy starcie i przeniesienia stanu głosu bota są ograniczone do wymienionych wpisów `{ guildId, channelId }`. Ustaw ją na pustą tablicę, aby odmówić wszystkich dołączeń do głosu Discord. Jeśli Discord przeniesie bota poza listę dozwolonych, OpenClaw opuszcza ten kanał i ponownie dołącza do skonfigurowanego celu automatycznego dołączania, gdy taki jest dostępny.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- OpenClaw używa dołączonego kodeka `libopus-wasm` do odbioru głosu Discord i odtwarzania surowego PCM realtime. Dostarcza przypiętą kompilację WebAssembly libopus i nie wymaga natywnych dodatków opus.
- `voice.connectTimeoutMs` kontroluje początkowe oczekiwanie Ready `@discordjs/voice` dla prób `/vc join` i automatycznego dołączania. Domyślnie: `30000`.
- `voice.reconnectGraceMs` kontroluje, jak długo OpenClaw czeka, aż rozłączona sesja głosowa zacznie się ponownie łączyć, zanim ją zniszczy. Domyślnie: `15000`.
- W trybie `stt-tts` odtwarzanie głosu nie zatrzymuje się tylko dlatego, że inny użytkownik zaczyna mówić. Aby uniknąć pętli sprzężenia zwrotnego, OpenClaw ignoruje nowe przechwytywanie głosu podczas odtwarzania TTS; mów po zakończeniu odtwarzania dla następnej tury. Tryby realtime przekazują rozpoczęcia mówienia jako sygnały wtrącenia do dostawcy realtime.
- W trybach realtime echo z głośników do otwartego mikrofonu może wyglądać jak wtrącenie i przerywać odtwarzanie. Dla pomieszczeń Discord z dużym echem ustaw `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, aby OpenAI nie przerywał automatycznie przy audio wejściowym. Dodaj `voice.realtime.bargeIn: true`, jeśli nadal chcesz, aby zdarzenia rozpoczęcia mówienia Discord przerywały aktywne odtwarzanie. Most realtime OpenAI ignoruje skrócenia odtwarzania krótsze niż `voice.realtime.minBargeInAudioEndMs` jako prawdopodobne echo/szum i loguje je jako pominięte zamiast czyścić odtwarzanie Discord.
- `voice.captureSilenceGraceMs` kontroluje, jak długo OpenClaw czeka po zgłoszeniu przez Discord, że mówca przestał mówić, zanim sfinalizuje ten segment audio dla STT. Domyślnie: `2000`; zwiększ tę wartość, jeśli Discord dzieli normalne pauzy na poszarpane częściowe transkrypty.
- Gdy wybranym dostawcą TTS jest ElevenLabs, odtwarzanie głosu Discord używa strumieniowego TTS i zaczyna od strumienia odpowiedzi dostawcy. Dostawcy bez obsługi strumieniowania wracają do ścieżki z syntetyzowanym plikiem tymczasowym.
- OpenClaw obserwuje też niepowodzenia odszyfrowywania odbioru i automatycznie odzyskuje działanie, opuszczając kanał głosowy i ponownie do niego dołączając po powtarzających się niepowodzeniach w krótkim oknie.
- Jeśli logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` po aktualizacji, zbierz raport zależności i logi. Dołączona linia `@discordjs/voice` zawiera upstreamową poprawkę wypełnienia z PR discord.js #11449, która zamknęła issue discord.js #11419.
- Zdarzenia odbioru `The operation was aborted` są oczekiwane, gdy OpenClaw finalizuje przechwycony segment mówcy; to szczegółowe diagnostyki, a nie ostrzeżenia.
- Szczegółowe logi głosu Discord zawierają ograniczony jednowierszowy podgląd transkryptu STT dla każdego zaakceptowanego segmentu mówcy, więc debugowanie pokazuje zarówno stronę użytkownika, jak i stronę odpowiedzi agenta bez zrzucania nieograniczonego tekstu transkryptu.
- W trybie `agent-proxy` wymuszona awaryjna konsultacja pomija prawdopodobnie niekompletne fragmenty transkryptu, takie jak tekst kończący się na `...` albo końcowy łącznik jak `and`, plus oczywiste nieoperacyjne zakończenia jak „zaraz wracam” lub „pa”. Logi pokazują `forced agent consult skipped reason=...`, gdy zapobiega to nieaktualnej zakolejkowanej odpowiedzi.

### Śledź użytkowników w głosie

Użyj `voice.followUsers`, gdy chcesz, aby bot głosowy Discord pozostawał z jednym lub większą liczbą znanych użytkowników Discord zamiast dołączać do stałego kanału przy starcie albo czekać na `/vc join`.

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

- `followUsers` akceptuje surowe identyfikatory użytkowników Discord oraz wartości `discord:<id>`. OpenClaw normalizuje obie formy przed dopasowaniem zdarzeń stanu głosu.
- `followUsersEnabled` domyślnie ma wartość `true`, gdy `followUsers` jest skonfigurowane. Ustaw ją na `false`, aby zachować zapisaną listę, ale zatrzymać automatyczne śledzenie głosu.
- Gdy śledzony użytkownik dołączy do dozwolonego kanału głosowego, OpenClaw dołącza do tego kanału. Gdy użytkownik się przenosi, OpenClaw przenosi się z nim. Gdy aktywny śledzony użytkownik się rozłączy, OpenClaw opuszcza kanał.
- Jeśli wielu śledzonych użytkowników jest w tej samej gildii, a aktywny śledzony użytkownik odejdzie, OpenClaw przenosi się do kanału innego śledzonego użytkownika przed opuszczeniem gildii. Jeśli kilku śledzonych użytkowników przeniesie się jednocześnie, wygrywa ostatnio zaobserwowane zdarzenie stanu głosu.
- `allowedChannels` nadal ma zastosowanie. Śledzony użytkownik w niedozwolonym kanale jest ignorowany, a sesja należąca do śledzenia przenosi się do innego śledzonego użytkownika albo opuszcza kanał.
- OpenClaw uzgadnia pominięte zdarzenia stanu głosu przy starcie i w ograniczonym interwale. Uzgadnianie próbkuje skonfigurowane gildie i ogranicza wyszukiwania REST na przebieg, więc bardzo duże listy `followUsers` mogą potrzebować więcej niż jednego interwału, aby się zbiegły.
- Jeśli Discord lub administrator przeniesie bota, gdy śledzi użytkownika, OpenClaw odbudowuje sesję głosową i zachowuje własność śledzenia, gdy miejsce docelowe jest dozwolone. Jeśli bot zostanie przeniesiony poza `allowedChannels`, OpenClaw opuszcza kanał i ponownie dołącza do skonfigurowanego celu, gdy taki istnieje.
- Odzyskiwanie odbioru DAVE może opuścić i ponownie dołączyć do tego samego kanału po powtarzających się niepowodzeniach odszyfrowywania. Sesje należące do śledzenia zachowują swoją własność śledzenia przez tę ścieżkę odzyskiwania, więc późniejsze rozłączenie śledzonego użytkownika nadal opuszcza kanał.

Wybierz między trybami dołączania:

- Użyj `followUsers` dla konfiguracji osobistych lub operatorskich, w których bot powinien automatycznie być w głosie, gdy Ty jesteś.
- Użyj `autoJoin` dla botów stałego pokoju, które powinny być obecne nawet wtedy, gdy żaden śledzony użytkownik nie jest w głosie.
- Użyj `/vc join` dla jednorazowych dołączeń albo pokojów, w których automatyczna obecność głosowa byłaby zaskakująca.

Kodek głosu Discord:

- Logi odbioru głosu pokazują `discord voice: opus decoder: libopus-wasm`.
- Odtwarzanie w czasie rzeczywistym koduje surowe stereo PCM 48 kHz do Opus przy użyciu tego samego dołączonego pakietu `libopus-wasm`, zanim przekaże pakiety do `@discordjs/voice`.
- Odtwarzanie plików i strumieni od dostawcy transkoduje dźwięk do surowego stereo PCM 48 kHz za pomocą ffmpeg, a następnie używa `libopus-wasm` dla strumienia pakietów Opus wysyłanego do Discord.

Potok STT i TTS:

- Przechwycony PCM z Discord jest konwertowany do tymczasowego pliku WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypcja jest wysyłana przez wejście i routing Discord, podczas gdy odpowiedź LLM działa z zasadą wyjścia głosowego, która ukrywa narzędzie agenta `tts` i prosi o zwrócony tekst, ponieważ Discord voice odpowiada za końcowe odtwarzanie TTS.
- `voice.model`, gdy jest ustawione, nadpisuje tylko LLM odpowiedzi dla tej tury kanału głosowego.
- `voice.tts` jest scalane nad `messages.tts`; dostawcy obsługujący strumieniowanie zasilają odtwarzacz bezpośrednio, w przeciwnym razie wynikowy plik audio jest odtwarzany na dołączonym kanale.

Przykład domyślnej sesji kanału głosowego agent-proxy:

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

Bez bloku `voice.agentSession` każdy kanał głosowy otrzymuje własną routowaną sesję OpenClaw. Na przykład `/vc join channel:234567890123456789` rozmawia z sesją dla tego kanału głosowego Discord. Model czasu rzeczywistego jest tylko głosowym interfejsem wejściowym; istotne żądania są przekazywane do skonfigurowanego agenta OpenClaw. Jeśli model czasu rzeczywistego wygeneruje końcową transkrypcję bez wywołania narzędzia konsultacji, OpenClaw wymusza konsultację jako fallback, aby ustawienie domyślne nadal zachowywało się jak rozmowa z agentem.

Przykład starszego STT i TTS:

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

Przykład dwukierunkowego trybu czasu rzeczywistego:

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

Gdy delegowane uruchomienie OpenClaw jest aktywne, nowe transkrypcje głosowe Discord są traktowane jako sterowanie aktywnym uruchomieniem przed rozpoczęciem kolejnej tury agenta. Frazy takie jak „status”, „anuluj to”, „użyj mniejszej poprawki” albo „gdy skończysz, sprawdź też testy” są klasyfikowane jako dane wejściowe statusu, anulowania, sterowania lub dalszego działania dla aktywnej sesji. Wyniki statusu, anulowania, zaakceptowanego sterowania i dalszego działania są wypowiadane z powrotem na kanale głosowym, aby rozmówca wiedział, czy OpenClaw obsłużył żądanie.

Przydatne formy celu:

- `target: "channel:123456789012345678"` routuje przez sesję kanału tekstowego Discord.
- `target: "123456789012345678"` jest traktowane jako cel kanału.
- `target: "dm:123456789012345678"` lub `target: "user:123456789012345678"` routuje przez tę sesję wiadomości bezpośredniej.

Przykład OpenAI Realtime z silnym echem:

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

Użyj tego, gdy model słyszy własne odtwarzanie Discord przez otwarty mikrofon, ale nadal chcesz móc mu przerwać, mówiąc. OpenClaw zapobiega automatycznemu przerywaniu przez OpenAI na podstawie surowego wejścia audio, a `bargeIn: true` pozwala zdarzeniom rozpoczęcia mówienia w Discord i już aktywnemu audio mówcy anulować aktywne odpowiedzi czasu rzeczywistego, zanim następna przechwycona tura dotrze do OpenAI. Bardzo wczesne sygnały wejścia w słowo z `audioEndMs` poniżej `minBargeInAudioEndMs` są traktowane jako prawdopodobne echo/szum i ignorowane, aby model nie urywał wypowiedzi przy pierwszej ramce odtwarzania.

Oczekiwane logi głosowe:

- Przy dołączeniu: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Przy uruchomieniu czasu rzeczywistego: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Przy audio mówcy: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` oraz `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Przy pominiętej nieaktualnej mowie: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` lub `reason=non-actionable-closing ...`
- Przy ukończeniu odpowiedzi czasu rzeczywistego: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Przy zatrzymaniu/resecie odtwarzania: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Przy konsultacji czasu rzeczywistego: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Przy odpowiedzi agenta: `discord voice: agent turn answer ...`
- Przy zakolejkowanej dokładnej wypowiedzi: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, po czym następuje `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Przy wykryciu wejścia w słowo: `discord voice: realtime barge-in detected source=speaker-start ...` lub `discord voice: realtime barge-in detected source=active-speaker-audio ...`, po czym następuje `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Przy przerwaniu czasu rzeczywistego: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, po czym następuje albo `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...`, albo `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Przy zignorowanym echu/szumie: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Przy wyłączonym wejściu w słowo: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Przy bezczynnym odtwarzaniu: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Aby debugować ucinane audio, czytaj logi głosu czasu rzeczywistego jako oś czasu:

1. `realtime audio playback started` oznacza, że Discord rozpoczął odtwarzanie audio asystenta. Od tego momentu most zaczyna zliczać fragmenty wyjścia asystenta, bajty PCM Discord, bajty czasu rzeczywistego dostawcy oraz czas trwania syntetyzowanego audio.
2. `realtime speaker turn opened` oznacza, że mówca Discord stał się aktywny. Jeśli odtwarzanie jest już aktywne i `bargeIn` jest włączone, po tym może nastąpić `barge-in detected source=speaker-start`.
3. `realtime input audio started` oznacza pierwszą rzeczywistą ramkę audio odebraną dla tej tury mówcy. `outputActive=true` lub niezerowe `outputAudioMs` tutaj oznacza, że mikrofon wysyła wejście, gdy odtwarzanie asystenta jest nadal aktywne.
4. `barge-in detected source=active-speaker-audio` oznacza, że OpenClaw wykrył audio aktywnego mówcy, gdy odtwarzanie asystenta było aktywne. Jest to przydatne do odróżnienia prawdziwego przerwania od zdarzenia rozpoczęcia mówienia Discord bez użytecznego audio.
5. `barge-in requested reason=...` oznacza, że OpenClaw poprosił dostawcę czasu rzeczywistego o anulowanie lub przycięcie aktywnej odpowiedzi. Zawiera `outputAudioMs`, `outputActive` i `playbackChunks`, aby można było zobaczyć, ile audio asystenta faktycznie odtworzono przed przerwaniem.
6. `realtime audio playback stopped reason=...` to lokalny punkt resetu odtwarzania Discord. Powód mówi, kto zatrzymał odtwarzanie: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` albo `session-close`.
7. `realtime speaker turn closed` podsumowuje przechwyconą turę wejściową. `chunks=0` lub `hasAudio=false` oznacza, że tura mówcy została otwarta, ale do mostu czasu rzeczywistego nie dotarło użyteczne audio. `interruptedPlayback=true` oznacza, że ta tura wejściowa nałożyła się na wyjście asystenta i uruchomiła logikę wejścia w słowo.

Przydatne pola:

- `outputAudioMs`: czas trwania audio asystenta wygenerowanego przez dostawcę czasu rzeczywistego przed wierszem logu.
- `audioMs`: czas trwania audio asystenta zliczony przez OpenClaw przed zatrzymaniem odtwarzania.
- `elapsedMs`: czas zegarowy między otwarciem i zamknięciem strumienia odtwarzania lub tury mówcy.
- `discordBytes`: bajty stereo PCM 48 kHz wysłane do albo odebrane z Discord voice.
- `realtimeBytes`: bajty PCM w formacie dostawcy wysłane do albo odebrane od dostawcy czasu rzeczywistego.
- `playbackChunks`: fragmenty audio asystenta przekazane do Discord dla aktywnej odpowiedzi.
- `sinceLastAudioMs`: odstęp między ostatnią przechwyconą ramką audio mówcy a zamknięciem tury mówcy.

Typowe wzorce:

- Natychmiastowe ucięcie z `source=active-speaker-audio`, małym `outputAudioMs` i tym samym użytkownikiem w pobliżu zwykle wskazuje na echo głośnika trafiające do mikrofonu. Zwiększ `voice.realtime.minBargeInAudioEndMs`, zmniejsz głośność głośnika, użyj słuchawek albo ustaw `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start`, po którym następuje `speaker turn closed ... hasAudio=false`, oznacza, że Discord zgłosił rozpoczęcie mówienia, ale do OpenClaw nie dotarło audio. Może to być przejściowe zdarzenie Discord voice, działanie bramki szumów albo krótkie włączenie mikrofonu przez klienta.
- `audio playback stopped reason=stream-close` bez pobliskiego wejścia w słowo lub `provider-clear-audio` oznacza, że lokalny strumień odtwarzania Discord zakończył się nieoczekiwanie. Sprawdź poprzedzające logi dostawcy i odtwarzacza Discord.
- `capture ignored during playback (barge-in disabled)` oznacza, że OpenClaw celowo odrzucił wejście, gdy audio asystenta było aktywne. Włącz `voice.realtime.bargeIn`, jeśli chcesz, aby mowa przerywała odtwarzanie.
- `barge-in ignored ... outputActive=false` oznacza, że VAD Discord lub dostawcy zgłosił mowę, ale OpenClaw nie miał aktywnego odtwarzania do przerwania. Nie powinno to ucinać audio.

Poświadczenia są rozwiązywane osobno dla każdego komponentu: uwierzytelnianie trasy LLM dla `voice.model`, uwierzytelnianie STT dla `tools.media.audio`, uwierzytelnianie TTS dla `messages.tts`/`voice.tts` oraz uwierzytelnianie dostawcy czasu rzeczywistego dla `voice.realtime.providers` albo normalnej konfiguracji uwierzytelniania dostawcy.

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd przebiegu fali i wymagają audio OGG/Opus. OpenClaw generuje przebieg fali automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście Gateway, aby przeprowadzić inspekcję i konwersję.

- Podaj **lokalną ścieżkę pliku** (adresy URL są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst + wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw konwertuje go do OGG/Opus w razie potrzeby.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji albo bot nie widzi wiadomości z gildii">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy zależysz od rozpoznawania użytkowników/członków
    - zrestartuj gateway po zmianie intencji

  </Accordion>

  <Accordion title="Wiadomości z gildii są nieoczekiwanie blokowane">

    - sprawdź `groupPolicy`
    - sprawdź listę dozwolonych gildii w `channels.discord.guilds`
    - jeśli istnieje mapa `channels` gildii, dozwolone są tylko wymienione kanały
    - sprawdź zachowanie `requireMention` i wzorce wzmianek

    Przydatne kontrole:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, ale nadal blokowane">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych gildii/kanałów
    - `requireMention` skonfigurowane w złym miejscu (musi być pod `channels.discord.guilds` albo we wpisie kanału)
    - nadawca zablokowany przez listę dozwolonych `users` gildii/kanału

  </Accordion>

  <Accordion title="Długotrwałe tury Discord albo zduplikowane odpowiedzi">

    Typowe logi:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Pokrętła kolejki Gateway Discord:

    - jedno konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - to kontroluje tylko pracę nasłuchiwania Gateway Discord, a nie czas życia tury agenta

    Discord nie stosuje limitu czasu właściciela kanału do zakolejkowanych tur agenta. Nasłuchiwacze wiadomości przekazują pracę natychmiast, a zakolejkowane uruchomienia Discord zachowują kolejność w obrębie sesji, dopóki cykl życia sesji/narzędzia/środowiska uruchomieniowego nie zakończy albo nie przerwie pracy.

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

  <Accordion title="Ostrzeżenia o przekroczeniu czasu wyszukiwania metadanych Gateway">
    OpenClaw pobiera metadane Discord `/gateway/bot` przed połączeniem. Przejściowe awarie wracają do domyślnego adresu URL Gateway Discord i są ograniczane częstotliwościowo w logach.

    Pokrętła limitu czasu metadanych:

    - jedno konto: `channels.discord.gatewayInfoTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - awaryjna zmienna środowiskowa, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - domyślnie: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Restarty po przekroczeniu czasu READY Gateway">
    OpenClaw czeka na zdarzenie `READY` Gateway Discord podczas uruchamiania i po ponownych połączeniach środowiska uruchomieniowego. Konfiguracje z wieloma kontami i stopniowanym uruchamianiem mogą wymagać dłuższego okna READY przy starcie niż domyślne.

    Pokrętła limitu czasu READY:

    - start, jedno konto: `channels.discord.gatewayReadyTimeoutMs`
    - start, wiele kont: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - awaryjna zmienna środowiskowa przy starcie, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - domyślnie przy starcie: `15000` (15 sekund), maks.: `120000`
    - środowisko uruchomieniowe, jedno konto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - środowisko uruchomieniowe, wiele kont: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - awaryjna zmienna środowiskowa środowiska uruchomieniowego, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - domyślnie dla środowiska uruchomieniowego: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Kontrole uprawnień `channels status --probe` działają tylko dla numerycznych identyfikatorów kanałów.

    Jeśli używasz kluczy typu slug, dopasowanie w środowisku uruchomieniowym nadal może działać, ale probe nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - zasada DM wyłączona: `channels.discord.dmPolicy="disabled"` (starsze: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot-bot">
    Domyślnie wiadomości autorstwa botów są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, użyj ścisłych reguł wzmianek i list dozwolonych, aby uniknąć zachowania pętli.
    Preferuj `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota.

    OpenClaw dostarcza też współdzieloną [ochronę przed pętlami botów](/pl/channels/bot-loop-protection). Gdy `allowBots` pozwala wiadomościom autorstwa botów dotrzeć do wysyłki, Discord mapuje zdarzenie przychodzące na fakty `(account, channel, bot pair)`, a ogólna osłona pary tłumi parę po przekroczeniu skonfigurowanego budżetu zdarzeń. Osłona zapobiega niekontrolowanym pętlom dwóch botów, które wcześniej trzeba było zatrzymywać limitami częstotliwości Discord; nie wpływa na wdrożenia z jednym botem ani jednorazowe odpowiedzi botów, które mieszczą się w budżecie.

    Ustawienia domyślne (aktywne, gdy `allowBots` jest ustawione):

    - `maxEventsPerWindow: 20` -- para botów może wymienić 20 wiadomości w oknie przesuwnym
    - `windowSeconds: 60` -- długość okna przesuwnego
    - `cooldownSeconds: 60` -- po przekroczeniu budżetu każda dodatkowa wiadomość bot-bot w dowolnym kierunku jest odrzucana przez minutę

    Skonfiguruj współdzieloną wartość domyślną raz pod `channels.defaults.botLoopProtection`, a następnie nadpisz Discord, gdy prawidłowy przepływ pracy potrzebuje większego zapasu. Priorytet jest następujący:

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

  <Accordion title="Zrzuty Voice STT z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby dostępna była logika odzyskiwania odbioru głosu Discord
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli awarie trwają po automatycznym ponownym dołączeniu, zbierz logi i porównaj z historią odbioru DAVE upstream w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) i [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Odniesienie konfiguracji

Główne odniesienie: [Odniesienie konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="Najważniejsze pola Discord">

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- zasady: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet nasłuchiwacza), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- odpowiedzi/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponawianie: `mediaMaxMb` (ogranicza wychodzące przesyłanie do Discord, domyślnie `100MB`), `retry`
- akcje: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jak sekrety (w nadzorowanych środowiskach preferowane `DISCORD_BOT_TOKEN`).
- Nadawaj Discord uprawnienia zgodne z zasadą najmniejszych uprawnień.
- Jeśli wdrożenie/stan poleceń jest nieaktualne, zrestartuj Gateway i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discord z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie czatu grupowego i listy dozwolonych.
  </Card>
  <Card title="Trasowanie kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Trasowanie wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj gildie i kanały na agentów.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Zachowanie natywnych poleceń.
  </Card>
</CardGroup>
