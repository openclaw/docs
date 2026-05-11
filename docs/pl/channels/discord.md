---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

Gotowe do wiadomości prywatnych i kanałów serwera za pośrednictwem oficjalnego Gateway Discorda.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Discorda domyślnie używają trybu parowania.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Natywne działanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i przepływ naprawy.
  </Card>
</CardGroup>

## Szybka konfiguracja

Musisz utworzyć nową aplikację z botem, dodać bota do swojego serwera i sparować go z OpenClaw. Zalecamy dodanie bota do własnego prywatnego serwera. Jeśli jeszcze go nie masz, [najpierw go utwórz](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wybierz **Utwórz własny > Dla mnie i moich znajomych**).

<Steps>
  <Step title="Utwórz aplikację Discord i bota">
    Przejdź do [Portalu dewelopera Discord](https://discord.com/developers/applications) i kliknij **Nowa aplikacja**. Nadaj jej nazwę w rodzaju „OpenClaw”.

    Kliknij **Bot** na pasku bocznym. Ustaw **Nazwę użytkownika** na taką, jakiej używasz dla swojego agenta OpenClaw.

  </Step>

  <Step title="Włącz intencje uprzywilejowane">
    Nadal na stronie **Bot** przewiń w dół do **Uprzywilejowane intencje Gateway** i włącz:

    - **Intencja treści wiadomości** (wymagana)
    - **Intencja członków serwera** (zalecana; wymagana dla list dozwolonych ról i dopasowywania nazw do identyfikatorów)
    - **Intencja obecności** (opcjonalna; potrzebna tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem w górę na stronie **Bot** i kliknij **Zresetuj token**.

    <Note>
    Mimo nazwy generuje to Twój pierwszy token — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go gdzieś. To jest Twój **Token bota** i za chwilę będzie Ci potrzebny.

  </Step>

  <Step title="Wygeneruj URL zaproszenia i dodaj bota do serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do serwera.

    Przewiń w dół do **Generatora URL OAuth2** i włącz:

    - `bot`
    - `applications.commands`

    Poniżej pojawi się sekcja **Uprawnienia bota**. Włącz co najmniej:

    **Uprawnienia ogólne**
      - Wyświetlanie kanałów
    **Uprawnienia tekstowe**
      - Wysyłanie wiadomości
      - Odczyt historii wiadomości
      - Osadzanie linków
      - Załączanie plików
      - Dodawanie reakcji (opcjonalne)

    To podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w przepływach kanałów forum lub multimediów, które tworzą albo kontynuują wątek, włącz także **Wysyłanie wiadomości w wątkach**.
    Skopiuj wygenerowany URL na dole, wklej go do przeglądarki, wybierz serwer i kliknij **Kontynuuj**, aby połączyć. Bot powinien być teraz widoczny na serwerze Discord.

  </Step>

  <Step title="Włącz tryb dewelopera i zbierz swoje identyfikatory">
    W aplikacji Discord musisz włączyć tryb dewelopera, aby móc kopiować wewnętrzne identyfikatory.

    1. Kliknij **Ustawienia użytkownika** (ikona koła zębatego obok awatara) → **Zaawansowane** → włącz **Tryb dewelopera**
    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Kopiuj identyfikator serwera**
    3. Kliknij prawym przyciskiem **własny awatar** → **Kopiuj identyfikator użytkownika**

    Zapisz **Identyfikator serwera** i **Identyfikator użytkownika** razem z Tokenem bota — w następnym kroku wyślesz wszystkie trzy do OpenClaw.

  </Step>

  <Step title="Zezwól na wiadomości prywatne od członków serwera">
    Aby parowanie działało, Discord musi zezwalać botowi na wysyłanie Ci wiadomości prywatnych. Kliknij prawym przyciskiem **ikonę serwera** → **Ustawienia prywatności** → włącz **Wiadomości bezpośrednie**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać Ci wiadomości prywatne. Pozostaw to włączone, jeśli chcesz używać wiadomości prywatnych Discorda z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, możesz wyłączyć wiadomości prywatne po sparowaniu.

  </Step>

  <Step title="Ustaw token bota bezpiecznie (nie wysyłaj go na czacie)">
    Token bota Discord jest sekretem (jak hasło). Ustaw go na maszynie uruchamiającej OpenClaw, zanim wyślesz wiadomość do agenta.

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

    Jeśli OpenClaw działa już jako usługa w tle, uruchom ją ponownie z aplikacji OpenClaw na Maca albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.
    W przypadku instalacji usług zarządzanych uruchom `openclaw gateway install` z powłoki, w której dostępny jest `DISCORD_BOT_TOKEN`, albo zapisz zmienną w `~/.openclaw/.env`, aby usługa mogła rozwiązać SecretRef środowiska po ponownym uruchomieniu.
    Jeśli Twój host jest blokowany lub ograniczany przez limit zapytań podczas startowego wyszukiwania aplikacji Discord, ustaw identyfikator aplikacji/klienta Discord z Portalu dewelopera, aby start mógł pominąć to wywołanie REST. Użyj `channels.discord.applicationId` dla konta domyślnego albo `channels.discord.accounts.<accountId>.applicationId`, gdy uruchamiasz wiele botów Discord.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj agenta">
        Porozmawiaj ze swoim agentem OpenClaw w dowolnym istniejącym kanale (np. Telegram) i powiedz mu to. Jeśli Discord jest Twoim pierwszym kanałem, użyj zamiast tego karty CLI / konfiguracja.

        > „Ustawiłem już token bota Discord w konfiguracji. Dokończ konfigurację Discord z identyfikatorem użytkownika `<user_id>` i identyfikatorem serwera `<server_id>`.”
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

        Awaryjna wartość środowiskowa dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        W przypadku konfiguracji skryptowej lub zdalnej zapisz ten sam blok JSON5 poleceniem `openclaw config patch --file ./discord.patch.json5 --dry-run`, a następnie uruchom je ponownie bez `--dry-run`. Wartości `token` w tekście jawnym są obsługiwane. Wartości SecretRef są także obsługiwane dla `channels.discord.token` u dostawców env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

        W przypadku wielu botów Discord trzymaj token każdego bota i identyfikator aplikacji pod jego kontem. `channels.discord.applicationId` na najwyższym poziomie jest dziedziczone przez konta, więc ustawiaj je tam tylko wtedy, gdy każde konto ma używać tego samego identyfikatora aplikacji.

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
    Poczekaj, aż Gateway będzie działać, a następnie wyślij wiadomość prywatną do swojego bota w Discord. Odpowie kodem parowania.

    <Tabs>
      <Tab title="Zapytaj agenta">
        Wyślij kod parowania do agenta w istniejącym kanale:

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

    Możesz teraz rozmawiać ze swoim agentem w Discord przez wiadomość prywatną.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenów uwzględnia konta. Wartości tokenów z konfiguracji mają pierwszeństwo przed awaryjną wartością środowiskową. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
Jeśli dwa włączone konta Discord rozwiązują się do tego samego tokena bota, OpenClaw uruchamia tylko jeden monitor Gateway dla tego tokena. Token pochodzący z konfiguracji ma pierwszeństwo przed domyślną awaryjną wartością środowiskową; w przeciwnym razie wygrywa pierwsze włączone konto, a zduplikowane konto jest zgłaszane jako wyłączone.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/akcje kanału) jawny `token` dla wywołania jest używany dla tego wywołania. Dotyczy to akcji wysyłania oraz akcji typu odczyt/sondowanie (na przykład odczyt/wyszukiwanie/pobieranie/wątek/przypięcia/uprawnienia). Ustawienia zasad konta i ponowień nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
</Note>

## Zalecane: Skonfiguruj obszar roboczy serwera

Gdy wiadomości prywatne działają, możesz skonfigurować swój serwer Discord jako pełny obszar roboczy, w którym każdy kanał otrzymuje własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, gdzie jesteś tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
    Dzięki temu agent może odpowiadać w dowolnym kanale na Twoim serwerze, nie tylko w wiadomościach prywatnych.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Dodaj mój identyfikator serwera Discord `<server_id>` do listy dozwolonych serwerów”
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

  <Step title="Zezwól na odpowiedzi bez @wzmianki">
    Domyślnie agent odpowiada w kanałach serwera tylko po @wzmiance. Na prywatnym serwerze prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    W kanałach serwera zwykłe końcowe odpowiedzi asystenta pozostają domyślnie prywatne. Widoczne wyjście Discord musi być wysłane jawnie narzędziem `message`, aby agent mógł domyślnie obserwować i publikować tylko wtedy, gdy uzna, że odpowiedź w kanale jest przydatna.

    Oznacza to, że wybrany model musi niezawodnie wywoływać narzędzia. Jeśli Discord pokazuje pisanie, a logi pokazują użycie tokenów, ale nie ma opublikowanej wiadomości, sprawdź log sesji pod kątem tekstu asystenta z `didSendViaMessagingTool: false`. Oznacza to, że model utworzył prywatną odpowiedź końcową zamiast wywołać `message(action=send)`. Przełącz się na silniejszy model wywołujący narzędzia albo użyj poniższej konfiguracji, aby przywrócić starsze automatyczne odpowiedzi końcowe.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Zezwól mojemu agentowi odpowiadać na tym serwerze bez konieczności @wzmianki”
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

        Aby przywrócić starsze automatyczne odpowiedzi końcowe dla pokojów grupowych/kanałowych, ustaw `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zaplanuj pamięć w kanałach serwera">
    Domyślnie pamięć długoterminowa (MEMORY.md) ładuje się tylko w sesjach wiadomości prywatnych. Kanały serwera nie ładują automatycznie MEMORY.md.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Gdy zadaję pytania w kanałach Discord, użyj memory_search lub memory_get, jeśli potrzebujesz długoterminowego kontekstu z MEMORY.md.”
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Przechowuj długoterminowe notatki w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał otrzymuje własną izolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` albo cokolwiek pasuje do Twojego przepływu pracy.

## Model środowiska uruchomieniowego

- Gateway jest właścicielem połączenia Discord.
- Routing odpowiedzi jest deterministyczny: odpowiedzi przychodzące z Discord wracają do Discord.
- Metadane gildii/kanału Discord są dodawane do promptu modelu jako niezaufany
  kontekst, a nie jako widoczny dla użytkownika prefiks odpowiedzi. Jeśli model skopiuje tę otoczkę
  z powrotem, OpenClaw usuwa skopiowane metadane z odpowiedzi wychodzących oraz z
  przyszłego kontekstu odtwarzania.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały gildii są izolowanymi kluczami sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia ukośnikowe działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), jednocześnie nadal przenosząc `CommandTargetSessionKey` do routowanej sesji rozmowy.
- Dostarczanie tekstowych ogłoszeń cron/heartbeat do Discord używa raz końcowej
  odpowiedzi widocznej dla asystenta. Multimedia i strukturalne ładunki komponentów pozostają
  wieloma wiadomościami, gdy agent emituje wiele dostarczalnych ładunków.

## Kanały forum

Kanały forum i mediów Discord akceptują wyłącznie posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku używa pierwszego niepustego wiersza wiadomości.
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

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są routowane z powrotem do agenta jako zwykłe wiadomości przychodzące i stosują istniejące ustawienia Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowego użytku. Ustaw `components.reusable=true`, aby przyciski, pola wyboru i formularze mogły być używane wielokrotnie, dopóki nie wygasną.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` na tym przycisku (identyfikatory użytkowników Discord, tagi albo `*`). Po skonfigurowaniu niedopasowani użytkownicy otrzymają efemeryczną odmowę.

Polecenia ukośnikowe `/model` i `/models` otwierają interaktywny selektor modelu z listami rozwijanymi dostawcy, modelu i zgodnego środowiska uruchomieniowego oraz krokiem Submit. `/models add` jest przestarzałe i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu. Odpowiedź selektora jest efemeryczna i może jej użyć tylko użytkownik wywołujący. Menu wyboru Discord są ograniczone do 25 opcji, więc dodaj wpisy `provider/*` do `agents.defaults.models`, gdy chcesz, aby selektor pokazywał dynamicznie wykryte modele tylko dla wybranych dostawców, takich jak `openai-codex` lub `vllm`.

Załączniki plików:

- Bloki `file` muszą wskazywać na odwołanie do załącznika (`attachment://<filename>`)
- Podaj załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
- Użyj `filename`, aby nadpisać nazwę przesyłanego pliku, gdy powinna pasować do odwołania do załącznika

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

    - `pairing` (domyślne)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`)
    - `disabled`

    Jeśli polityka DM nie jest otwarta, nieznani użytkownicy są blokowani (albo proszeni o parowanie w trybie `pairing`).

    Priorytet wielu kont:

    - `channels.discord.accounts.default.allowFrom` stosuje się tylko do konta `default`.
    - Dla jednego konta `allowFrom` ma pierwszeństwo przed starszym `dm.allowFrom`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` i starsze `dm.allowFrom` nie są ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Starsze `channels.discord.dm.policy` i `channels.discord.dm.allowFrom` nadal są odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Format celu DM dla dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same identyfikatory numeryczne zwykle są rozwiązywane jako identyfikatory kanałów, gdy aktywna jest domyślna wartość kanału, ale identyfikatory wymienione na efektywnej liście DM `allowFrom` konta są traktowane jako cele DM użytkownika dla zgodności.

  </Tab>

  <Tab title="Access groups">
    DM Discord i autoryzacja poleceń tekstowych mogą używać dynamicznych wpisów `accessGroup:<name>` w `channels.discord.allowFrom`.

    Nazwy grup dostępu są współdzielone między kanałami wiadomości. Użyj `type: "message.senders"` dla statycznej grupy, której członkowie są wyrażeni w normalnej składni `allowFrom` każdego kanału, albo `type: "discord.channelAudience"`, gdy bieżąca publiczność `ViewChannel` kanału Discord powinna dynamicznie definiować członkostwo. Wspólne zachowanie grup dostępu jest udokumentowane tutaj: [Grupy dostępu](/pl/channels/access-groups).

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

    Przykład: pozwól każdemu, kto widzi `#maintainers`, wysyłać DM do bota, pozostawiając DM zamknięte dla wszystkich pozostałych.

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

    Wyszukiwania kończą się bezpieczną odmową. Jeśli Discord zwróci `Missing Access`, wyszukiwanie członka się nie powiedzie albo kanał należy do innej gildii, nadawca DM jest traktowany jako nieautoryzowany.

    Włącz **Server Members Intent** w Discord Developer Portal dla bota, gdy używasz grup dostępu opartych na publiczności kanału. DM nie zawierają stanu członka gildii, więc OpenClaw rozwiązuje członka przez Discord REST w czasie autoryzacji.

  </Tab>

  <Tab title="Guild policy">
    Obsługą gildii steruje `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczną podstawą, gdy istnieje `channels.discord`, jest `allowlist`.

    Zachowanie `allowlist`:

    - gildia musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli którakolwiek jest skonfigurowana, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowanie nazwy/tagu jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazw/tagów
    - jeśli gildia ma skonfigurowane `channels`, kanały spoza listy są odrzucane
    - jeśli gildia nie ma bloku `channels`, dozwolone są wszystkie kanały w tej gildii z listy dozwolonych

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
    Wiadomości gildii domyślnie wymagają wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    Podczas pisania wychodzących wiadomości Discord używaj kanonicznej składni wzmianek: `<@USER_ID>` dla użytkowników, `<#CHANNEL_ID>` dla kanałów i `<@&ROLE_ID>` dla ról. Nie używaj starszej formy wzmianki z pseudonimem `<@!USER_ID>`.

    `requireMention` konfiguruje się dla gildii/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów lub slugi)

  </Tab>
</Tabs>

### Routing agenta oparty na rolach

Użyj `bindings[].match.roles`, aby routować członków gildii Discord do różnych agentów według identyfikatora roli. Powiązania oparte na rolach akceptują tylko identyfikatory ról i są oceniane po powiązaniach peer lub parent-peer oraz przed powiązaniami tylko dla gildii. Jeśli powiązanie ustawia też inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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
- `commands.native=false` pomija rejestrację poleceń slash Discord i czyszczenie podczas uruchamiania. Wcześniej zarejestrowane polecenia mogą pozostać widoczne w Discord, dopóki nie usuniesz ich z aplikacji Discord.
- Autoryzacja poleceń natywnych używa tych samych list dozwolonych/polityk Discord co zwykła obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discord dla użytkowników, którzy nie są autoryzowani; wykonanie nadal wymusza autoryzację OpenClaw i zwraca „brak autoryzacji”.

Zobacz [Polecenia slash](/pl/tools/slash-commands), aby poznać katalog poleceń i ich zachowanie.

Domyślne ustawienia poleceń slash:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Znaczniki odpowiedzi i odpowiedzi natywne">
    Discord obsługuje znaczniki odpowiedzi w wyjściu agenta:

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
    przychodząca tura była opóźnioną partią wielu wiadomości. Jest to przydatne,
    gdy chcesz używać odpowiedzi natywnych głównie w niejednoznacznych, gwałtownych rozmowach, a nie przy każdej
    turze z pojedynczą wiadomością.

    Identyfikatory wiadomości są udostępniane w kontekście/historii, aby agenci mogli wskazywać konkretne wiadomości.

  </Accordion>

  <Accordion title="Podgląd strumienia na żywo">
    OpenClaw może strumieniować robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływu tekstu. `channels.discord.streaming` przyjmuje `off` | `partial` | `block` | `progress` (domyślnie). `progress` utrzymuje jeden edytowalny szkic statusu i aktualizuje go postępem narzędzi aż do końcowego dostarczenia; wspólna etykieta początkowa jest przewijaną linią, więc znika z widoku tak jak reszta, gdy pojawi się wystarczająco dużo pracy. `streamMode` to starszy alias środowiska uruchomieniowego. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację na klucz kanoniczny.

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
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` edytuje pojedynczą wiadomość podglądu w miarę napływu tokenów.
    - `block` emituje fragmenty o rozmiarze szkicu (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału, ograniczone do `textChunkLimit`).
    - Media, błędy i finały z jawną odpowiedzią anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie używają wiadomości podglądu.
    - Wiersze narzędzi/postępu renderują się jako zwarte emoji + tytuł + szczegóły, gdy są dostępne, na przykład `🛠️ Bash: run tests` lub `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` kontroluje szczegóły polecenia/wykonania w zwartych liniach postępu: `raw` (domyślnie) lub `status` (tylko etykieta narzędzia).

    Ukryj surowy tekst polecenia/wykonania, zachowując zwarte linie postępu:

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

    Strumieniowanie podglądu obsługuje tylko tekst; odpowiedzi multimedialne wracają do normalnego dostarczania. Gdy strumieniowanie `block` jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii gildii:

    - domyślny `channels.discord.historyLimit` to `20`
    - rozwiązanie zapasowe: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrolki historii wiadomości prywatnych:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są kierowane jako sesje kanału i dziedziczą konfigurację kanału nadrzędnego, chyba że zostanie nadpisana.
    - Sesje wątków dziedziczą wybór `/model` na poziomie sesji kanału nadrzędnego jako zapas wyłącznie dla modelu; lokalne wybory `/model` wątku nadal mają pierwszeństwo, a historia transkryptu nadrzędnego nie jest kopiowana, chyba że włączono dziedziczenie transkryptu.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) powoduje, że nowe automatyczne wątki są inicjowane z transkryptu nadrzędnego. Nadpisania dla kont znajdują się pod `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozwiązywać cele wiadomości prywatnych `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas zapasowej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych kontrolują, kto może wyzwolić agenta, a nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla subagentów">
    Discord może powiązać wątek z celem sesji, aby kolejne wiadomości w tym wątku nadal były kierowane do tej samej sesji (w tym sesji subagentów).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuń powiązanie bieżącego wątku
    - `/agents` pokaż aktywne uruchomienia i stan powiązania
    - `/session idle <duration|off>` sprawdź/zaktualizuj automatyczne usuwanie fokusu po bezczynności dla powiązań z fokusem
    - `/session max-age <duration|off>` sprawdź/zaktualizuj sztywny maksymalny wiek dla powiązań z fokusem

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
    - `defaultSpawnContext` kontroluje natywny kontekst subagenta dla uruchomień powiązanych z wątkiem. Domyślnie: `"fork"`.
    - Przestarzałe klucze `spawnSubagentSessions`/`spawnAcpSessions` są migrowane przez `openclaw doctor --fix`.
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązań wątków są niedostępne.

    Zobacz [Subagenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) i [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

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
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP w miejscu. Tymczasowe powiązania wątków mogą nadpisywać rozwiązywanie celu, gdy są aktywne.
    - `spawnSessions` bramkuje tworzenie/powiązywanie wątków potomnych przez `--thread auto|here`.

    Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać szczegóły zachowania powiązań.

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Tryb powiadomień o reakcjach dla gildii:

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (używa `guilds.<id>.users`)

    Zdarzenia reakcji są przekształcane w zdarzenia systemowe i dołączane do kierowanej sesji Discord.

  </Accordion>

  <Accordion title="Reakcje potwierdzenia">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozwiązywania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - zapasowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie „👀”)

    Uwagi:

    - Discord akceptuje emoji unicode lub niestandardowe nazwy emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji">
    Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone.

    Wpływa to na przepływy `/config set|unset` (gdy funkcje poleceń są włączone).

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
    Kieruj ruch WebSocket Gateway Discord i początkowe wyszukiwania REST (identyfikator aplikacji + rozwiązywanie listy dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

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
    Włącz rozwiązywanie PluralKit, aby mapować wiadomości pośredniczone na tożsamość członka systemu:

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
    - wyświetlane nazwy członków są dopasowywane według nazwy/sluga tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania używają oryginalnego identyfikatora wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, wiadomości pośredniczone są traktowane jako wiadomości botów i odrzucane, chyba że `allowBots=true`

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
    Aktualizacje obecności są stosowane, gdy ustawisz pole statusu lub aktywności albo włączysz automatyczną obecność.

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

    Przykład strumieniowania:

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
    - 4: Niestandardowe (używa tekstu aktywności jako stanu statusu; emoji jest opcjonalne)
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

    Automatyczna obecność mapuje dostępność środowiska uruchomieniowego na status Discord: zdrowe => online, zdegradowane lub nieznane => bezczynny, wyczerpane lub niedostępne => dnd. Opcjonalne zastąpienia tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord obsługuje zatwierdzenia oparte na przyciskach w wiadomościach prywatnych i może opcjonalnie publikować monity o zatwierdzenie w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; gdy to możliwe, wraca do `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` jest nieustawione albo ma wartość `"auto"` i można rozpoznać co najmniej jedną osobę zatwierdzającą, z `execApprovals.approvers` albo z `commands.ownerAllowFrom`. Discord nie wyprowadza osób zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani `defaultTo` wiadomości bezpośredniej. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzania.

    W przypadku wrażliwych poleceń grupowych tylko dla właściciela, takich jak `/diagnostics` i `/export-trajectory`, OpenClaw wysyła monity o zatwierdzenie oraz wyniki końcowe prywatnie. Najpierw próbuje wiadomości prywatnej Discord, gdy wywołujący właściciel ma trasę właściciela Discord; jeśli nie jest ona dostępna, wraca do pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, takiej jak Telegram.

    Gdy `target` ma wartość `channel` albo `both`, monit o zatwierdzenie jest widoczny w kanale. Tylko rozpoznane osoby zatwierdzające mogą używać przycisków; pozostali użytkownicy otrzymują efemeryczną odmowę. Monity o zatwierdzenie zawierają tekst polecenia, więc włączaj dostarczanie do kanału tylko w zaufanych kanałach. Jeśli identyfikatora kanału nie da się wyprowadzić z klucza sesji, OpenClaw wraca do dostarczenia przez wiadomość prywatną.

    Discord renderuje także współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Discord dodaje głównie trasowanie wiadomości prywatnych do osób zatwierdzających oraz fanout kanałów.
    Gdy te przyciski są obecne, są podstawowym UX zatwierdzania; OpenClaw
    powinien zawierać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia przez czat są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    Jeśli natywne środowisko uruchomieniowe zatwierdzania Discord nie jest aktywne, OpenClaw pozostawia
    lokalny deterministyczny monit `/approve <id> <decision>` widoczny. Jeśli
    środowisko uruchomieniowe jest aktywne, ale natywnej karty nie można dostarczyć do żadnego celu,
    OpenClaw wysyła w tym samym czacie zastępcze powiadomienie z dokładnym poleceniem `/approve`
    z oczekującego zatwierdzenia.

    Uwierzytelnianie Gateway i rozstrzyganie zatwierdzeń przestrzegają współdzielonego kontraktu klienta Gateway (identyfikatory `plugin:` są rozstrzygane przez `plugin.approval.resolve`; inne identyfikatory przez `exec.approval.resolve`). Zatwierdzenia wygasają domyślnie po 30 minutach.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki akcji

Akcje wiadomości Discord obejmują wiadomości, administrację kanałami, moderację, obecność i akcje metadanych.

Podstawowe przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Akcja `event-create` przyjmuje opcjonalny parametr `image` (URL albo lokalną ścieżkę pliku), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki akcji znajdują się w `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa akcji                                                                                                                                                              | Domyślnie |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone  |
| roles                                                                                                                                                                    | wyłączone |
| moderation                                                                                                                                                               | wyłączone |
| presence                                                                                                                                                                 | wyłączone |

## Interfejs użytkownika Components v2

OpenClaw używa komponentów Discord v2 do zatwierdzeń exec i znaczników międzykontekstowych. Akcje wiadomości Discord mogą też przyjmować `components` dla niestandardowego interfejsu użytkownika (zaawansowane; wymaga skonstruowania ładunku komponentu przez narzędzie discord), podczas gdy starsze `embeds` pozostają dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustaw dla każdego konta za pomocą `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` są ignorowane, gdy obecne są komponenty v2.

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

Discord ma dwie odrębne powierzchnie głosowe: **kanały głosowe** w czasie rzeczywistym (ciągłe rozmowy) oraz **załączniki wiadomości głosowych** (format podglądu przebiegu fali). Gateway obsługuje oba.

### Kanały głosowe

Lista kontrolna konfiguracji:

1. Włącz Message Content Intent w Discord Developer Portal.
2. Włącz Server Members Intent, gdy używane są listy dozwolonych ról/użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Przyznaj Connect, Speak, Send Messages i Read Message History w docelowym kanale głosowym.
5. Włącz natywne polecenia (`commands.native` albo `channels.discord.commands.native`).
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
        model: "openai-codex/gpt-5.5",
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
          voice: "cedar",
        },
      },
    },
  },
}
```

Uwagi:

- `voice.tts` zastępuje `messages.tts` tylko dla odtwarzania głosu `stt-tts`. Tryby czasu rzeczywistego używają `voice.realtime.voice`.
- `voice.mode` kontroluje ścieżkę rozmowy. Wartość domyślna to `agent-proxy`: frontend głosowy czasu rzeczywistego obsługuje taktowanie tur, przerywanie i odtwarzanie, deleguje zasadniczą pracę do trasowanego agenta OpenClaw przez `openclaw_agent_consult` i traktuje wynik jak wpisany prompt Discord od tego mówcy. `stt-tts` zachowuje starszy przepływ wsadowy STT plus TTS. `bidi` pozwala modelowi czasu rzeczywistego rozmawiać bezpośrednio, jednocześnie udostępniając `openclaw_agent_consult` dla mózgu OpenClaw.
- `voice.agentSession` kontroluje, która rozmowa OpenClaw otrzymuje tury głosowe. Pozostaw to nieustawione dla własnej sesji kanału głosowego albo ustaw `{ mode: "target", target: "channel:<text-channel-id>" }`, aby kanał głosowy działał jako rozszerzenie mikrofonu/głośnika istniejącej sesji kanału tekstowego Discord, takiego jak `#maintainers`.
- `voice.model` zastępuje mózg agenta OpenClaw dla odpowiedzi głosowych Discord i konsultacji czasu rzeczywistego. Pozostaw to nieustawione, aby dziedziczyć model trasowanego agenta. Jest to oddzielne od `voice.realtime.model`.
- `agent-proxy` trasuje mowę przez `discord-voice`, co zachowuje normalną autoryzację właściciela/narzędzi dla mówcy i sesji docelowej, ale ukrywa narzędzie agenta `tts`, ponieważ Discord voice jest właścicielem odtwarzania. Domyślnie `agent-proxy` daje konsultacji pełny, równoważny właścicielowi dostęp do narzędzi dla mówców będących właścicielami (`voice.realtime.toolPolicy: "owner"`) i zdecydowanie preferuje konsultację z agentem OpenClaw przed merytorycznymi odpowiedziami (`voice.realtime.consultPolicy: "always"`). W tym domyślnym trybie `always` warstwa czasu rzeczywistego nie wypowiada automatycznie wypełniaczy przed odpowiedzią z konsultacji; przechwytuje i transkrybuje mowę, a następnie wypowiada trasowaną odpowiedź OpenClaw. Jeśli wiele wymuszonych odpowiedzi z konsultacji zakończy się, gdy Discord nadal odtwarza pierwszą odpowiedź, późniejsze odpowiedzi z dokładną mową są kolejkowane do czasu bezczynności odtwarzania, zamiast zastępować mowę w środku zdania.
- W trybie `stt-tts` STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- W trybach czasu rzeczywistego `voice.realtime.provider`, `voice.realtime.model` i `voice.realtime.voice` konfigurują sesję audio czasu rzeczywistego. Dla OpenAI Realtime 2 plus mózgu Codex użyj `voice.realtime.model: "gpt-realtime-2"` i `voice.model: "openai-codex/gpt-5.5"`.
- Dostawca czasu rzeczywistego OpenAI akceptuje bieżące nazwy zdarzeń Realtime 2 oraz starsze aliasy zgodne z Codex dla zdarzeń audio wyjściowego i transkryptu, dzięki czemu zgodne migawki dostawcy mogą się rozchodzić bez utraty audio asystenta.
- `voice.realtime.bargeIn` kontroluje, czy zdarzenia rozpoczęcia mówienia przez użytkownika Discord przerywają aktywne odtwarzanie czasu rzeczywistego. Jeśli nie jest ustawione, podąża za ustawieniem przerywania audio wejściowego dostawcy czasu rzeczywistego.
- `voice.realtime.minBargeInAudioEndMs` kontroluje minimalny czas odtwarzania asystenta, zanim wtrącenie OpenAI czasu rzeczywistego obetnie audio. Domyślnie: `250`. Ustaw `0`, aby przerywać natychmiast w pomieszczeniach z niskim echem, albo zwiększ tę wartość dla konfiguracji głośników z dużym echem.
- Dla głosu OpenAI w odtwarzaniu Discord ustaw `voice.tts.provider: "openai"` i wybierz głos Text-to-speech w `voice.tts.openai.voice` lub `voice.tts.providers.openai.voice`. `cedar` jest dobrym męsko brzmiącym wyborem w bieżącym modelu TTS OpenAI.
- Zastąpienia `systemPrompt` Discord dla poszczególnych kanałów mają zastosowanie do tur transkryptu głosowego dla tego kanału głosowego.
- Tury transkryptu głosowego wyprowadzają status właściciela z Discord `allowFrom` (lub `dm.allowFrom`); mówcy niebędący właścicielami nie mogą uzyskać dostępu do narzędzi tylko dla właścicieli (na przykład `gateway` i `cron`).
- Discord voice jest opcjonalny dla konfiguracji wyłącznie tekstowych; ustaw `channels.discord.voice.enabled=true` (albo zachowaj istniejący blok `channels.discord.voice`), aby włączyć polecenia `/vc`, runtime głosowy i intencję Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` może jawnie zastąpić subskrypcję intencji stanu głosowego. Pozostaw to nieustawione, aby intencja podążała za efektywnym włączeniem głosu.
- Jeśli `voice.autoJoin` ma wiele wpisów dla tej samej gildii, OpenClaw dołącza do ostatnio skonfigurowanego kanału dla tej gildii.
- `voice.allowedChannels` jest opcjonalną listą dozwolonej rezydencji. Pozostaw to nieustawione, aby zezwolić `/vc join` na dołączanie do dowolnego autoryzowanego kanału głosowego Discord. Gdy jest ustawione, `/vc join`, automatyczne dołączanie przy starcie i przeniesienia stanu głosowego bota są ograniczone do wymienionych wpisów `{ guildId, channelId }`. Ustaw pustą tablicę, aby odmówić wszystkich dołączeń głosowych Discord. Jeśli Discord przeniesie bota poza listę dozwolonych, OpenClaw opuszcza ten kanał i ponownie dołącza do skonfigurowanego celu automatycznego dołączania, gdy jest dostępny.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Wartości domyślne `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- OpenClaw domyślnie używa dekodera pure-JS `opusscript` do odbioru głosu Discord. Opcjonalny natywny pakiet `@discordjs/opus` jest ignorowany przez politykę instalacji pnpm repozytorium, więc zwykłe instalacje, ścieżki Docker i niepowiązane testy nie kompilują natywnego dodatku. Dedykowane hosty wydajności głosowej mogą go włączyć za pomocą `OPENCLAW_DISCORD_OPUS_DECODER=native` po zainstalowaniu natywnego dodatku.
- `voice.connectTimeoutMs` kontroluje początkowe oczekiwanie Ready `@discordjs/voice` dla prób `/vc join` i automatycznego dołączania. Domyślnie: `30000`.
- `voice.reconnectGraceMs` kontroluje, jak długo OpenClaw czeka, aż rozłączona sesja głosowa zacznie ponownie się łączyć, zanim ją zniszczy. Domyślnie: `15000`.
- W trybie `stt-tts` odtwarzanie głosu nie zatrzymuje się tylko dlatego, że inny użytkownik zaczyna mówić. Aby uniknąć pętli sprzężenia zwrotnego, OpenClaw ignoruje nowe przechwytywanie głosu podczas odtwarzania TTS; mów po zakończeniu odtwarzania, aby rozpocząć następną turę. Tryby czasu rzeczywistego przekazują rozpoczęcia mówienia jako sygnały wtrącenia do dostawcy czasu rzeczywistego.
- W trybach czasu rzeczywistego echo z głośników do otwartego mikrofonu może wyglądać jak wtrącenie i przerywać odtwarzanie. Dla pomieszczeń Discord z dużym echem ustaw `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, aby OpenAI nie przerywało automatycznie przy audio wejściowym. Dodaj `voice.realtime.bargeIn: true`, jeśli nadal chcesz, aby zdarzenia rozpoczęcia mówienia Discord przerywały aktywne odtwarzanie. Most czasu rzeczywistego OpenAI ignoruje obcięcia odtwarzania krótsze niż `voice.realtime.minBargeInAudioEndMs` jako prawdopodobne echo/szum i rejestruje je jako pominięte, zamiast czyścić odtwarzanie Discord.
- `voice.captureSilenceGraceMs` kontroluje, jak długo OpenClaw czeka po zgłoszeniu przez Discord, że mówca przestał mówić, zanim sfinalizuje ten segment audio dla STT. Domyślnie: `2500`; zwiększ tę wartość, jeśli Discord dzieli normalne pauzy na poszarpane częściowe transkrypty.
- Gdy wybranym dostawcą TTS jest ElevenLabs, odtwarzanie głosu Discord używa strumieniowego TTS i zaczyna od strumienia odpowiedzi dostawcy. Dostawcy bez obsługi strumieniowania wracają do ścieżki syntetyzowanego pliku tymczasowego.
- OpenClaw monitoruje również niepowodzenia odszyfrowania odbioru i automatycznie odzyskuje działanie przez opuszczenie i ponowne dołączenie do kanału głosowego po powtarzających się niepowodzeniach w krótkim oknie czasowym.
- Jeśli logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` po aktualizacji, zbierz raport zależności i logi. Dołączona linia `@discordjs/voice` obejmuje upstreamową poprawkę wypełniania z PR discord.js #11449, która zamknęła issue discord.js #11419.
- Zdarzenia odbioru `The operation was aborted` są oczekiwane, gdy OpenClaw finalizuje przechwycony segment mówcy; są to szczegółowe diagnostyki, a nie ostrzeżenia.
- Szczegółowe logi głosowe Discord zawierają ograniczony jednowierszowy podgląd transkryptu STT dla każdego zaakceptowanego segmentu mówcy, więc debugowanie pokazuje zarówno stronę użytkownika, jak i stronę odpowiedzi agenta bez zrzucania nieograniczonego tekstu transkryptu.
- W trybie `agent-proxy` wymuszona rezerwowa konsultacja pomija prawdopodobnie niekompletne fragmenty transkryptu, takie jak tekst kończący się na `...` albo końcowy łącznik, taki jak `and`, oraz oczywiste nieakcyjne zakończenia, takie jak „zaraz wracam” lub „pa”. Logi pokazują `forced agent consult skipped reason=...`, gdy zapobiega to nieaktualnej odpowiedzi w kolejce.

Natywna konfiguracja opus dla checkoutów źródłowych:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Użyj Node 22 dla Gateway, gdy chcesz upstreamowy wstępnie zbudowany natywny dodatek macOS arm64. Jeśli używasz innego runtime Node, instalator opt-in może potrzebować lokalnego łańcucha narzędzi budowania ze źródeł `node-gyp`.

Po zainstalowaniu natywnego dodatku uruchom Gateway za pomocą:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Szczegółowe logi głosowe powinny pokazywać `discord voice: opus decoder: @discordjs/opus`. Bez włączenia przez env albo jeśli natywnego dodatku brakuje lub nie może się załadować na hoście, OpenClaw loguje `discord voice: opus decoder: opusscript` i nadal odbiera głos przez rezerwową implementację pure-JS.

Potok STT plus TTS:

- Przechwytywanie PCM Discord jest konwertowane do tymczasowego pliku WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypt jest wysyłany przez wejście Discord i trasowanie, podczas gdy odpowiedź LLM działa z polityką wyjścia głosowego, która ukrywa narzędzie agenta `tts` i prosi o zwrócony tekst, ponieważ Discord voice jest właścicielem końcowego odtwarzania TTS.
- `voice.model`, gdy jest ustawione, zastępuje tylko LLM odpowiedzi dla tej tury kanału głosowego.
- `voice.tts` jest scalane na wierzchu `messages.tts`; dostawcy obsługujący strumieniowanie zasilają odtwarzacz bezpośrednio, w przeciwnym razie wynikowy plik audio jest odtwarzany w dołączonym kanale.

Przykład domyślnej sesji kanału głosowego agent-proxy:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Bez bloku `voice.agentSession` każdy kanał głosowy otrzymuje własną trasowaną sesję OpenClaw. Na przykład `/vc join channel:234567890123456789` rozmawia z sesją dla tego kanału głosowego Discord. Model czasu rzeczywistego jest tylko frontendem głosowym; merytoryczne żądania są przekazywane do skonfigurowanego agenta OpenClaw. Jeśli model czasu rzeczywistego utworzy końcowy transkrypt bez wywołania narzędzia konsultacji, OpenClaw wymusza konsultację jako mechanizm rezerwowy, więc domyślne zachowanie nadal przypomina rozmowę z agentem.

Przykład starszego STT plus TTS:

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
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

Przykład dwukierunkowego czasu rzeczywistego:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

W trybie `agent-proxy` bot dołącza do skonfigurowanego kanału głosowego, ale tury agenta OpenClaw używają normalnej trasowanej sesji i agenta kanału docelowego. Sesja głosowa czasu rzeczywistego wypowiada zwrócony wynik z powrotem w kanale głosowym. Agent nadzorujący nadal może używać zwykłych narzędzi wiadomości zgodnie ze swoją polityką narzędzi, w tym wysłać oddzielną wiadomość Discord, jeśli jest to właściwe działanie.

Przydatne formy celu:

- `target: "channel:123456789012345678"` trasuje przez sesję kanału tekstowego Discord.
- `target: "123456789012345678"` jest traktowane jako cel kanału.
- `target: "dm:123456789012345678"` lub `target: "user:123456789012345678"` trasuje przez tę sesję wiadomości bezpośrednich.

Przykład OpenAI Realtime z dużym echem:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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

Użyj tego, gdy model słyszy własne odtwarzanie Discord przez otwarty mikrofon, ale nadal chcesz przerywać mu mówieniem. OpenClaw zapobiega automatycznemu przerywaniu przez OpenAI na podstawie surowego dźwięku wejściowego, a `bargeIn: true` pozwala zdarzeniom rozpoczęcia mówienia przez użytkownika w Discord oraz dźwiękowi już aktywnego mówcy anulować aktywne odpowiedzi czasu rzeczywistego, zanim kolejna przechwycona tura dotrze do OpenAI. Bardzo wczesne sygnały wejścia w wypowiedź z `audioEndMs` poniżej `minBargeInAudioEndMs` są traktowane jako prawdopodobne echo/szum i ignorowane, aby model nie urywał wypowiedzi przy pierwszej ramce odtwarzania.

Oczekiwane logi głosu:

- Przy dołączaniu: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Przy uruchomieniu trybu czasu rzeczywistego: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Przy dźwięku mówcy: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` oraz `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Przy pominięciu nieaktualnej mowy: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` lub `reason=non-actionable-closing ...`
- Przy zakończeniu odpowiedzi czasu rzeczywistego: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Przy zatrzymaniu/zresetowaniu odtwarzania: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Przy konsultacji czasu rzeczywistego: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Przy odpowiedzi agenta: `discord voice: agent turn answer ...`
- Przy zakolejkowanej dokładnej mowie: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, a następnie `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Przy wykryciu wejścia w wypowiedź: `discord voice: realtime barge-in detected source=speaker-start ...` lub `discord voice: realtime barge-in detected source=active-speaker-audio ...`, a następnie `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Przy przerwaniu trybu czasu rzeczywistego: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, a następnie albo `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...`, albo `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Przy zignorowanym echu/szumie: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Przy wyłączonym wejściu w wypowiedź: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Przy bezczynnym odtwarzaniu: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Aby debugować ucinany dźwięk, czytaj logi głosu czasu rzeczywistego jako oś czasu:

1. `realtime audio playback started` oznacza, że Discord zaczął odtwarzać dźwięk asystenta. Od tego momentu most zaczyna zliczać porcje wyjścia asystenta, bajty PCM Discord, bajty czasu rzeczywistego dostawcy oraz czas trwania syntetyzowanego dźwięku.
2. `realtime speaker turn opened` oznacza, że mówca Discord stał się aktywny. Jeśli odtwarzanie jest już aktywne i `bargeIn` jest włączone, po tym może pojawić się `barge-in detected source=speaker-start`.
3. `realtime input audio started` oznacza pierwszą rzeczywistą ramkę dźwięku otrzymaną dla tej tury mówcy. `outputActive=true` lub niezerowe `outputAudioMs` w tym miejscu oznacza, że mikrofon wysyła wejście, gdy odtwarzanie asystenta jest nadal aktywne.
4. `barge-in detected source=active-speaker-audio` oznacza, że OpenClaw wykrył dźwięk mówcy na żywo, gdy odtwarzanie asystenta było aktywne. Jest to przydatne do odróżnienia prawdziwego przerwania od zdarzenia rozpoczęcia mówienia w Discord bez użytecznego dźwięku.
5. `barge-in requested reason=...` oznacza, że OpenClaw poprosił dostawcę czasu rzeczywistego o anulowanie lub skrócenie aktywnej odpowiedzi. Zawiera `outputAudioMs`, `outputActive` i `playbackChunks`, aby było widać, ile dźwięku asystenta faktycznie odtworzono przed przerwaniem.
6. `realtime audio playback stopped reason=...` to lokalny punkt resetowania odtwarzania Discord. Powód wskazuje, kto zatrzymał odtwarzanie: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` lub `session-close`.
7. `realtime speaker turn closed` podsumowuje przechwyconą turę wejściową. `chunks=0` lub `hasAudio=false` oznacza, że tura mówcy została otwarta, ale do mostu czasu rzeczywistego nie dotarł żaden użyteczny dźwięk. `interruptedPlayback=true` oznacza, że ta tura wejściowa nałożyła się na wyjście asystenta i uruchomiła logikę wejścia w wypowiedź.

Przydatne pola:

- `outputAudioMs`: czas trwania dźwięku asystenta wygenerowanego przez dostawcę czasu rzeczywistego przed danym wierszem logu.
- `audioMs`: czas trwania dźwięku asystenta zliczony przez OpenClaw przed zatrzymaniem odtwarzania.
- `elapsedMs`: czas zegarowy między otwarciem a zamknięciem strumienia odtwarzania lub tury mówcy.
- `discordBytes`: bajty stereo PCM 48 kHz wysłane do lub odebrane z głosu Discord.
- `realtimeBytes`: bajty PCM w formacie dostawcy wysłane do lub odebrane od dostawcy czasu rzeczywistego.
- `playbackChunks`: porcje dźwięku asystenta przekazane do Discord dla aktywnej odpowiedzi.
- `sinceLastAudioMs`: odstęp między ostatnią przechwyconą ramką dźwięku mówcy a zamknięciem tury mówcy.

Typowe wzorce:

- Natychmiastowe ucięcie z `source=active-speaker-audio`, małym `outputAudioMs` i tym samym użytkownikiem w pobliżu zwykle wskazuje na echo głośnika trafiające do mikrofonu. Zwiększ `voice.realtime.minBargeInAudioEndMs`, zmniejsz głośność głośnika, użyj słuchawek albo ustaw `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start`, po którym następuje `speaker turn closed ... hasAudio=false`, oznacza, że Discord zgłosił rozpoczęcie mówienia, ale żaden dźwięk nie dotarł do OpenClaw. Może to być przejściowe zdarzenie głosowe Discord, działanie bramki szumów albo krótkie aktywowanie mikrofonu przez klienta.
- `audio playback stopped reason=stream-close` bez pobliskiego wejścia w wypowiedź lub `provider-clear-audio` oznacza, że lokalny strumień odtwarzania Discord zakończył się nieoczekiwanie. Sprawdź poprzedzające logi dostawcy i odtwarzacza Discord.
- `capture ignored during playback (barge-in disabled)` oznacza, że OpenClaw celowo odrzucił wejście, gdy dźwięk asystenta był aktywny. Włącz `voice.realtime.bargeIn`, jeśli chcesz, aby mowa przerywała odtwarzanie.
- `barge-in ignored ... outputActive=false` oznacza, że VAD Discord lub dostawcy zgłosił mowę, ale OpenClaw nie miał aktywnego odtwarzania do przerwania. Nie powinno to ucinać dźwięku.

Poświadczenia są rozwiązywane osobno dla każdego komponentu: uwierzytelnianie trasy LLM dla `voice.model`, uwierzytelnianie STT dla `tools.media.audio`, uwierzytelnianie TTS dla `messages.tts`/`voice.tts` oraz uwierzytelnianie dostawcy czasu rzeczywistego dla `voice.realtime.providers` lub normalnej konfiguracji uwierzytelniania dostawcy.

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd fali i wymagają dźwięku OGG/Opus. OpenClaw generuje falę automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście Gateway, aby sprawdzić i przekonwertować dźwięk.

- Podaj **lokalną ścieżkę pliku** (adresy URL są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst + wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format dźwięku; OpenClaw w razie potrzeby konwertuje go do OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji albo bot nie widzi wiadomości gildii">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy zależysz od rozwiązywania użytkowników/członków
    - zrestartuj Gateway po zmianie intencji

  </Accordion>

  <Accordion title="Wiadomości gildii są nieoczekiwanie blokowane">

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

  <Accordion title="Require mention jest false, ale nadal blokuje">
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

    - pojedyncze konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - kontroluje to tylko pracę listenera Gateway Discord, nie czas życia tury agenta

    Discord nie stosuje limitu czasu należącego do kanału wobec zakolejkowanych tur agenta. Listenery wiadomości przekazują pracę natychmiast, a zakolejkowane uruchomienia Discord zachowują kolejność w ramach sesji, dopóki cykl życia sesji/narzędzia/środowiska wykonawczego nie zakończy się albo nie przerwie pracy.

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
    OpenClaw pobiera metadane Discord `/gateway/bot` przed połączeniem. Przejściowe błędy wracają do domyślnego adresu URL Gateway Discord i są ograniczane częstotliwościowo w logach.

    Pokrętła limitu czasu metadanych:

    - pojedyncze konto: `channels.discord.gatewayInfoTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - awaryjna zmienna środowiskowa, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - domyślnie: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Restarty po przekroczeniu limitu czasu READY Gateway">
    OpenClaw czeka na zdarzenie `READY` Gateway Discord podczas uruchamiania i po ponownych połączeniach środowiska wykonawczego. Konfiguracje z wieloma kontami i stopniowaniem uruchamiania mogą wymagać dłuższego okna READY podczas startu niż domyślne.

    Pokrętła limitu czasu READY:

    - uruchamianie, pojedyncze konto: `channels.discord.gatewayReadyTimeoutMs`
    - uruchamianie, wiele kont: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - awaryjna zmienna środowiskowa dla uruchamiania, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - domyślnie przy uruchamianiu: `15000` (15 sekund), maks.: `120000`
    - środowisko wykonawcze, pojedyncze konto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - środowisko wykonawcze, wiele kont: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - awaryjna zmienna środowiskowa dla środowiska wykonawczego, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - domyślnie w środowisku wykonawczym: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Kontrole uprawnień `channels status --probe` działają tylko dla numerycznych identyfikatorów kanałów.

    Jeśli używasz kluczy typu slug, dopasowywanie w środowisku wykonawczym nadal może działać, ale sonda nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - polityka DM wyłączona: `channels.discord.dmPolicy="disabled"` (starsze: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot-bot">
    Domyślnie wiadomości autorstwa botów są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, użyj ścisłych reguł wzmianek i listy dozwolonych, aby uniknąć zachowania pętli.
    Preferuj `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Problemy z Voice STT z błędem DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby dostępna była logika odzyskiwania odbioru głosu Discord
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj dzienniki pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli awarie nadal występują po automatycznym ponownym dołączeniu, zbierz dzienniki i porównaj je z historią odbioru upstream DAVE w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) oraz [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="Najważniejsze pola Discord">

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- zasady: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- odpowiedzi/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- przesyłanie strumieniowe: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponawianie: `mediaMaxMb` (ogranicza wychodzące przesyłanie plików Discord, domyślnie `100MB`), `retry`
- akcje: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (w nadzorowanych środowiskach preferowane `DISCORD_BOT_TOKEN`).
- Przyznawaj minimalne wymagane uprawnienia Discord.
- Jeśli wdrożenie poleceń lub stan są nieaktualne, uruchom ponownie gateway i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discord z gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie czatu grupowego i listy dozwolonych.
  </Card>
  <Card title="Routing kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i wzmacnianie zabezpieczeń.
  </Card>
  <Card title="Routing wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj serwery i kanały na agentów.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Zachowanie natywnych poleceń.
  </Card>
</CardGroup>
