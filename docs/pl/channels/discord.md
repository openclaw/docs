---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status wsparcia bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

Gotowe dla wiadomości prywatnych i kanałów serwera przez oficjalny Gateway Discord.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Discord domyślnie działają w trybie parowania.
  </Card>
  <Card title="Polecenia ukośnikiem" icon="terminal" href="/pl/tools/slash-commands">
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
    Pozostając na stronie **Bot**, przewiń w dół do **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazw do identyfikatorów)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem w górę na stronie **Bot** i kliknij **Reset Token**.

    <Note>
    Pomimo nazwy spowoduje to wygenerowanie pierwszego tokena — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go gdzieś. To jest Twój **Bot Token** i będzie Ci potrzebny za chwilę.

  </Step>

  <Step title="Wygeneruj adres URL zaproszenia i dodaj bota do serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz adres URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do swojego serwera.

    Przewiń w dół do **OAuth2 URL Generator** i włącz:

    - `bot`
    - `applications.commands`

    Poniżej pojawi się sekcja **Bot Permissions**. Włącz co najmniej:

    **Uprawnienia ogólne**
      - Wyświetlanie kanałów
    **Uprawnienia tekstowe**
      - Wysyłanie wiadomości
      - Odczytywanie historii wiadomości
      - Osadzanie linków
      - Dołączanie plików
      - Dodawanie reakcji (opcjonalne)

    To podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w przepływach kanałów forum lub mediów, które tworzą albo kontynuują wątek, włącz też **Send Messages in Threads**.
    Skopiuj wygenerowany adres URL na dole, wklej go w przeglądarce, wybierz swój serwer i kliknij **Continue**, aby połączyć. Bot powinien być teraz widoczny na serwerze Discord.

  </Step>

  <Step title="Włącz tryb deweloperski i zbierz identyfikatory">
    W aplikacji Discord musisz włączyć tryb deweloperski, aby móc kopiować wewnętrzne identyfikatory.

    1. Kliknij **User Settings** (ikona koła zębatego obok avatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem **własny avatar** → **Copy User ID**

    Zapisz **Server ID** i **User ID** razem z Bot Token — w następnym kroku wyślesz wszystkie trzy do OpenClaw.

  </Step>

  <Step title="Zezwól na wiadomości prywatne od członków serwera">
    Aby parowanie działało, Discord musi zezwalać botowi na wysyłanie do Ciebie wiadomości prywatnych. Kliknij prawym przyciskiem **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać Ci wiadomości prywatne. Pozostaw tę opcję włączoną, jeśli chcesz używać wiadomości prywatnych Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, możesz wyłączyć wiadomości prywatne po sparowaniu.

  </Step>

  <Step title="Ustaw token bota bezpiecznie (nie wysyłaj go na czacie)">
    Token bota Discord jest sekretem (jak hasło). Ustaw go na maszynie, na której działa OpenClaw, zanim wyślesz wiadomość do agenta.

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

    Jeśli OpenClaw działa już jako usługa w tle, uruchom go ponownie przez aplikację OpenClaw na Maca albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.
    W przypadku instalacji usługi zarządzanej uruchom `openclaw gateway install` z powłoki, w której dostępny jest `DISCORD_BOT_TOKEN`, albo zapisz zmienną w `~/.openclaw/.env`, aby usługa mogła rozwiązać env SecretRef po ponownym uruchomieniu.
    Jeśli Twój host jest blokowany albo limitowany przez wykonywane przy starcie wyszukiwanie aplikacji Discord, ustaw identyfikator aplikacji/klienta Discord z Developer Portal, aby przy starcie można było pominąć to wywołanie REST. Użyj `channels.discord.applicationId` dla konta domyślnego albo `channels.discord.accounts.<accountId>.applicationId`, gdy uruchamiasz wiele botów Discord.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj agenta">
        Porozmawiaj ze swoim agentem OpenClaw w dowolnym istniejącym kanale (np. Telegram) i przekaż mu to. Jeśli Discord jest Twoim pierwszym kanałem, użyj zamiast tego karty CLI / konfiguracji.

        > „Token bota Discord jest już ustawiony w konfiguracji. Dokończ konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`.”
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

        Zapasowa zmienna env dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        W przypadku konfiguracji skryptowej lub zdalnej zapisz ten sam blok JSON5 za pomocą `openclaw config patch --file ./discord.patch.json5 --dry-run`, a następnie uruchom ponownie bez `--dry-run`. Wartości `token` w tekście jawnym są obsługiwane. Wartości SecretRef są również obsługiwane dla `channels.discord.token` w providerach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

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

  <Step title="Zatwierdź pierwsze parowanie przez wiadomość prywatną">
    Poczekaj, aż Gateway będzie działać, a następnie wyślij wiadomość prywatną do swojego bota w Discord. Odpowie kodem parowania.

    <Tabs>
      <Tab title="Zapytaj agenta">
        Wyślij kod parowania do agenta w swoim istniejącym kanale:

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

    Teraz możesz rozmawiać ze swoim agentem w Discord przez wiadomości prywatne.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenów uwzględnia konta. Wartości tokenów z konfiguracji mają pierwszeństwo przed zapasową zmienną env. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
Jeśli dwa włączone konta Discord rozwiązują się do tego samego tokena bota, OpenClaw uruchamia tylko jeden monitor Gateway dla tego tokena. Token pochodzący z konfiguracji ma pierwszeństwo przed domyślną zapasową zmienną env; w przeciwnym razie wygrywa pierwsze włączone konto, a zduplikowane konto jest zgłaszane jako wyłączone.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/akcje kanału) dla danego wywołania używany jest jawny `token` na wywołanie. Dotyczy to akcji wysyłania i akcji typu odczyt/sondowanie (na przykład read/search/fetch/thread/pins/permissions). Ustawienia zasad konta i ponawiania nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
</Note>

## Zalecane: skonfiguruj przestrzeń roboczą serwera

Gdy wiadomości prywatne działają, możesz skonfigurować swój serwer Discord jako pełną przestrzeń roboczą, w której każdy kanał ma własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteś tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
    Dzięki temu agent może odpowiadać w dowolnym kanale na Twoim serwerze, a nie tylko w wiadomościach prywatnych.

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

  <Step title="Zezwól na odpowiedzi bez @wzmianki">
    Domyślnie agent odpowiada w kanałach serwera tylko wtedy, gdy zostanie wspomniany za pomocą @. Na prywatnym serwerze prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    W kanałach serwera zwykłe końcowe odpowiedzi asystenta domyślnie pozostają prywatne. Widoczny wynik Discord musi zostać wysłany jawnie za pomocą narzędzia `message`, dzięki czemu agent może domyślnie obserwować i publikować tylko wtedy, gdy uzna, że odpowiedź w kanale jest przydatna.

    Oznacza to, że wybrany model musi niezawodnie wywoływać narzędzia. Jeśli Discord pokazuje pisanie, a logi pokazują użycie tokenów, ale nie ma opublikowanej wiadomości, sprawdź log sesji pod kątem tekstu asystenta z `didSendViaMessagingTool: false`. Oznacza to, że model wygenerował prywatną odpowiedź końcową zamiast wywołać `message(action=send)`. Przełącz na silniejszy model wywołujący narzędzia albo użyj poniższej konfiguracji, aby przywrócić starsze automatyczne odpowiedzi końcowe.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Zezwól mojemu agentowi odpowiadać na tym serwerze bez konieczności wzmiankowania go za pomocą @”
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

        Aby przywrócić starsze automatyczne odpowiedzi końcowe dla pokoi grupowych/kanałowych, ustaw `messages.groupChat.visibleReplies: "automatic"`.

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

- Gateway zarządza połączeniem z Discord.
- Routing odpowiedzi jest deterministyczny: odpowiedzi przychodzące z Discord wracają do Discord.
- Metadane gildii/kanału Discord są dodawane do promptu modelu jako niezaufany
  kontekst, a nie jako widoczny dla użytkownika prefiks odpowiedzi. Jeśli model skopiuje tę kopertę
  z powrotem, OpenClaw usuwa skopiowane metadane z odpowiedzi wychodzących oraz z
  przyszłego kontekstu odtwarzania.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały gildii używają izolowanych kluczy sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe wiadomości DM są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia ukośnikowe działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), nadal przenosząc `CommandTargetSessionKey` do routowanej sesji konwersacji.
- Dostarczanie tekstowych ogłoszeń cron/heartbeat do Discord używa końcowej
  odpowiedzi widocznej dla asystenta jeden raz. Ładunki multimediów i komponentów
  strukturalnych pozostają wielowiadomościowe, gdy agent emituje wiele dostarczalnych ładunków.

## Kanały forum

Kanały forum i multimediów Discord akceptują tylko wpisy w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

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

Nadrzędne fora nie akceptują komponentów Discord. Jeśli potrzebujesz komponentów, wyślij do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agentów. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są routowane z powrotem do agenta jako zwykłe wiadomości przychodzące i podążają za istniejącymi ustawieniami Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowe. Ustaw `components.reusable=true`, aby przyciski, listy wyboru i formularze mogły być używane wielokrotnie do czasu wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` na tym przycisku (identyfikatory użytkowników Discord, tagi albo `*`). Po skonfigurowaniu niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Polecenia ukośnikowe `/model` i `/models` otwierają interaktywny selektor modelu z listami rozwijanymi dostawcy, modelu i zgodnego środowiska uruchomieniowego oraz krokiem Submit. `/models add` jest przestarzałe i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu. Odpowiedź selektora jest efemeryczna i może jej użyć tylko wywołujący użytkownik.

Załączniki plików:

- Bloki `file` muszą wskazywać referencję załącznika (`attachment://<filename>`)
- Podaj załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
- Użyj `filename`, aby zastąpić nazwę wysyłanego pliku, gdy powinna pasować do referencji załącznika

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
    `channels.discord.dmPolicy` kontroluje dostęp do DM. `channels.discord.allowFrom` jest kanoniczną listą dozwolonych nadawców DM.

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`)
    - `disabled`

    Jeśli polityka DM nie jest otwarta, nieznani użytkownicy są blokowani (albo proszeni o parowanie w trybie `pairing`).

    Priorytety dla wielu kont:

    - `channels.discord.accounts.default.allowFrom` ma zastosowanie tylko do konta `default`.
    - Dla jednego konta `allowFrom` ma pierwszeństwo przed starszym `dm.allowFrom`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` i starsze `dm.allowFrom` nie są ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Starsze `channels.discord.dm.policy` i `channels.discord.dm.allowFrom` są nadal odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Format celu DM do dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same identyfikatory liczbowe zwykle są rozwiązywane jako identyfikatory kanałów, gdy aktywna jest domyślna konfiguracja kanału, ale identyfikatory wymienione w efektywnym `allowFrom` DM konta są traktowane jako cele DM użytkownika dla zgodności.

  </Tab>

  <Tab title="DM access groups">
    Wiadomości DM Discord mogą używać dynamicznych wpisów `accessGroup:<name>` w `channels.discord.allowFrom`.

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

    Kanał tekstowy Discord nie ma osobnej listy członków. `type: "discord.channelAudience"` modeluje członkostwo tak: nadawca DM jest członkiem skonfigurowanej gildii i obecnie ma efektywne uprawnienie `ViewChannel` na skonfigurowanym kanale po zastosowaniu ról i nadpisań kanału.

    Przykład: zezwól każdemu, kto widzi `#maintainers`, na wysyłanie DM do bota, utrzymując DM zamknięte dla wszystkich pozostałych.

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

    Wyszukiwania domyślnie kończą się odmową. Jeśli Discord zwróci `Missing Access`, wyszukiwanie członka się nie powiedzie albo kanał należy do innej gildii, nadawca DM jest traktowany jako nieautoryzowany.

    Włącz **Server Members Intent** w Discord Developer Portal dla bota, gdy używasz grup dostępu opartych na publiczności kanału. Wiadomości DM nie zawierają stanu członka gildii, więc OpenClaw rozwiązuje członka przez Discord REST w czasie autoryzacji.

  </Tab>

  <Tab title="Guild policy">
    Obsługą gildii steruje `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczna wartość bazowa, gdy istnieje `channels.discord`, to `allowlist`.

    Zachowanie `allowlist`:

    - gildia musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli skonfigurowano którąkolwiek z nich, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazwa/tag
    - jeśli gildia ma skonfigurowane `channels`, kanały spoza listy są odrzucane
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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, rezerwowe zachowanie w czasie uruchomienia to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` to `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Wiadomości gildii są domyślnie bramkowane wzmianką.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, rezerwowo `messages.groupChat.mentionPatterns`)
    - domyślne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    Przy pisaniu wychodzących wiadomości Discord używaj kanonicznej składni wzmianek: `<@USER_ID>` dla użytkowników, `<#CHANNEL_ID>` dla kanałów i `<@&ROLE_ID>` dla ról. Nie używaj starszej formy wzmianki pseudonimu `<@!USER_ID>`.

    `requireMention` jest konfigurowane dla każdej gildii/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów lub slugi)

  </Tab>
</Tabs>

### Routing agentów oparty na rolach

Użyj `bindings[].match.roles`, aby kierować członków gildii Discord do różnych agentów według identyfikatora roli. Powiązania oparte na rolach akceptują tylko identyfikatory ról i są oceniane po powiązaniach peer lub parent-peer oraz przed powiązaniami tylko dla gildii. Jeśli powiązanie ustawia także inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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
- Zastąpienie per kanał: `channels.discord.commands.native`.
- `commands.native=false` pomija rejestrację i czyszczenie poleceń slash Discord podczas uruchamiania. Wcześniej zarejestrowane polecenia mogą pozostać widoczne w Discord, dopóki nie usuniesz ich z aplikacji Discord.
- Uwierzytelnianie natywnych poleceń używa tych samych list dozwolonych/polityk Discord co zwykła obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discord dla użytkowników, którzy nie są autoryzowani; wykonanie nadal egzekwuje uwierzytelnianie OpenClaw i zwraca "brak autoryzacji".

Zobacz [Polecenia slash](/pl/tools/slash-commands), aby poznać katalog poleceń i ich działanie.

Domyślne ustawienia poleceń slash:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Znaczniki odpowiedzi i natywne odpowiedzi">
    Discord obsługuje znaczniki odpowiedzi w danych wyjściowych agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Kontrolowane przez `channels.discord.replyToMode`:

    - `off` (domyślne)
    - `first`
    - `all`
    - `batched`

    Uwaga: `off` wyłącza niejawne wątki odpowiedzi. Jawne znaczniki `[[reply_to_*]]` są nadal respektowane.
    `first` zawsze dołącza niejawną natywną referencję odpowiedzi do pierwszej wychodzącej wiadomości Discord w danej turze.
    `batched` dołącza niejawną natywną referencję odpowiedzi Discord tylko wtedy, gdy
    przychodząca tura była odbitym pakietem wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie dla niejednoznacznych, gwałtownych czatów, a nie dla każdej
    tury z pojedynczą wiadomością.

    Identyfikatory wiadomości są udostępniane w kontekście/historii, aby agenci mogli wskazywać konkretne wiadomości.

  </Accordion>

  <Accordion title="Podgląd strumienia na żywo">
    OpenClaw może strumieniować wersje robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływania tekstu. `channels.discord.streaming` przyjmuje `off` | `partial` | `block` | `progress` (domyślne). `progress` utrzymuje jedną edytowalną wersję roboczą statusu i aktualizuje ją postępem narzędzi aż do końcowego dostarczenia; `streamMode` to starszy alias środowiska uruchomieniowego. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację na klucz kanoniczny.

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

    - `partial` edytuje pojedynczą wiadomość podglądu w miarę napływania tokenów.
    - `block` emituje porcje o rozmiarze wersji roboczej (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału, ograniczone do `textChunkLimit`).
    - Media, błędy i końcowe odpowiedzi z jawną odpowiedzią anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie używają wiadomości podglądu.
    - `streaming.preview.commandText` / `streaming.progress.commandText` kontroluje szczegóły poleceń/wykonania w kompaktowych wierszach postępu: `raw` (domyślne) albo `status` (tylko etykieta narzędzia).

    Ukryj surowy tekst poleceń/wykonania, zachowując kompaktowe wiersze postępu:

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

    Strumieniowanie podglądu obsługuje tylko tekst; odpowiedzi z mediami wracają do zwykłego dostarczania. Gdy strumieniowanie `block` jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii gildii:

    - domyślne `channels.discord.historyLimit` to `20`
    - wartość zapasowa: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrolki historii DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są kierowane jako sesje kanału i dziedziczą konfigurację kanału nadrzędnego, chyba że zostanie zastąpiona.
    - Sesje wątków dziedziczą wybór `/model` na poziomie sesji z kanału nadrzędnego jako wartość zapasową tylko dla modelu; lokalne wybory `/model` w wątku nadal mają pierwszeństwo, a historia transkrypcji nadrzędnej nie jest kopiowana, chyba że włączono dziedziczenie transkrypcji.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) włącza dla nowych automatycznych wątków inicjowanie z transkrypcji nadrzędnej. Zastąpienia per konto znajdują się pod `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozwiązywać cele DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas zapasowej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych kontrolują, kto może wyzwolić agenta, a nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla subagentów">
    Discord może powiązać wątek z celem sesji, aby kolejne wiadomości w tym wątku nadal były kierowane do tej samej sesji (w tym sesji subagentów).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuń powiązanie bieżącego wątku
    - `/agents` pokaż aktywne uruchomienia i stan powiązania
    - `/session idle <duration|off>` sprawdź/zaktualizuj automatyczne cofnięcie fokusu z powodu braku aktywności dla powiązań w fokusie
    - `/session max-age <duration|off>` sprawdź/zaktualizuj sztywny maksymalny wiek dla powiązań w fokusie

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
    - `channels.discord.threadBindings.*` zastępuje zachowanie Discord.
    - `spawnSessions` kontroluje automatyczne tworzenie/powiązanie wątków dla `sessions_spawn({ thread: true })` i wywołań tworzenia wątków ACP. Domyślnie: `true`.
    - `defaultSpawnContext` kontroluje natywny kontekst subagenta dla wywołań tworzenia powiązanych z wątkiem. Domyślnie: `"fork"`.
    - Przestarzałe klucze `spawnSubagentSessions`/`spawnAcpSessions` są migrowane przez `openclaw doctor --fix`.
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązania wątku są niedostępne.

    Zobacz [Subagenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) i [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe powiązania kanałów ACP">
    Dla stabilnych, "zawsze włączonych" obszarów roboczych ACP skonfiguruj najwyższego poziomu typowane powiązania ACP skierowane do rozmów Discord.

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
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP w miejscu. Tymczasowe powiązania wątków mogą zastępować rozwiązywanie celu, gdy są aktywne.
    - `spawnSessions` bramkuje tworzenie/powiązanie wątków podrzędnych przez `--thread auto|here`.

    Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać szczegóły zachowania powiązań.

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Tryb powiadomień o reakcjach per gildia:

    - `off`
    - `own` (domyślne)
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
    - zapasowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Discord akceptuje emoji Unicode lub niestandardowe nazwy emoji.
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
    Kieruj ruch WebSocket Gateway Discord oraz początkowe wyszukiwania REST (identyfikator aplikacji + rozwiązywanie list dozwolonych) przez proxy HTTP(S) z `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Zastąpienie per konto:

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
    - nazwy wyświetlane członków są dopasowywane według nazwy/sluga tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania używają oryginalnego identyfikatora wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, wiadomości pośredniczone są traktowane jako wiadomości botów i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Aliasy wzmianek wychodzących">
    Użyj `mentionAliases`, gdy agenci potrzebują deterministycznych wzmianek wychodzących dla znanych użytkowników Discord. Klucze to uchwyty bez początkowego `@`; wartości to identyfikatory użytkowników Discord. Nieznane uchwyty, `@everyone`, `@here` i wzmianki wewnątrz spanów kodu Markdown pozostają bez zmian.

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
    - 1: Strumieniowanie (wymaga `activityUrl`)
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

    Automatyczna obecność mapuje dostępność środowiska wykonawczego na status Discord: healthy => online, degraded lub unknown => idle, exhausted lub unavailable => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord obsługuje zatwierdzanie oparte na przyciskach w wiadomościach DM i może opcjonalnie publikować prośby o zatwierdzenie w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; w miarę możliwości wraca do `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia wykonywania, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jedną osobę zatwierdzającą, z `execApprovals.approvers` albo z `commands.ownerAllowFrom`. Discord nie wywnioskowuje osób zatwierdzających wykonywanie z kanałowego `allowFrom`, starszego `dm.allowFrom` ani bezpośredniej wiadomości `defaultTo`. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzania.

    W przypadku wrażliwych, dostępnych tylko dla właściciela poleceń grupowych, takich jak `/diagnostics` i `/export-trajectory`, OpenClaw wysyła prośby o zatwierdzenie i wyniki końcowe prywatnie. Najpierw próbuje Discord DM, gdy wywołujący właściciel ma trasę właściciela Discord; jeśli nie jest dostępna, wraca do pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, takiej jak Telegram.

    Gdy `target` ma wartość `channel` lub `both`, prośba o zatwierdzenie jest widoczna w kanale. Tylko rozwiązane osoby zatwierdzające mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Prośby o zatwierdzenie zawierają tekst polecenia, więc włączaj dostarczanie do kanału tylko w zaufanych kanałach. Jeśli identyfikatora kanału nie można wyprowadzić z klucza sesji, OpenClaw wraca do dostarczania przez DM.

    Discord renderuje też współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Discord głównie dodaje routing DM dla osób zatwierdzających i rozsyłanie do kanałów.
    Gdy te przyciski są obecne, są podstawowym UX zatwierdzania; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    Jeśli natywne środowisko wykonawcze zatwierdzania Discord nie jest aktywne, OpenClaw zachowuje
    widoczną lokalną, deterministyczną prośbę `/approve <id> <decision>`. Jeśli
    środowisko wykonawcze jest aktywne, ale natywnej karty nie można dostarczyć do żadnego celu,
    OpenClaw wysyła w tym samym czacie powiadomienie awaryjne z dokładnym poleceniem `/approve`
    z oczekującego zatwierdzenia.

    Uwierzytelnianie Gateway i rozwiązywanie zatwierdzeń są zgodne ze współdzielonym kontraktem klienta Gateway (identyfikatory `plugin:` są rozwiązywane przez `plugin.approval.resolve`; inne identyfikatory przez `exec.approval.resolve`). Zatwierdzenia domyślnie wygasają po 30 minutach.

    Zobacz [Zatwierdzenia wykonywania](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki akcji

Akcje wiadomości Discord obejmują wysyłanie wiadomości, administrację kanałami, moderację, obecność i akcje metadanych.

Podstawowe przykłady:

- wysyłanie wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Akcja `event-create` przyjmuje opcjonalny parametr `image` (URL lub lokalną ścieżkę pliku), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki akcji znajdują się pod `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa akcji                                                                                                                                                              | Domyślnie  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone   |
| roles                                                                                                                                                                    | wyłączone  |
| moderation                                                                                                                                                               | wyłączone  |
| presence                                                                                                                                                                 | wyłączone  |

## UI Components v2

OpenClaw używa Components v2 Discord do zatwierdzeń wykonywania i znaczników międzykontekstowych. Akcje wiadomości Discord mogą też przyjmować `components` dla niestandardowego UI (zaawansowane; wymaga skonstruowania ładunku komponentu przez narzędzie discord), a starsze `embeds` pozostają dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustawiaj dla konta za pomocą `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` są ignorowane, gdy obecne są Components v2.

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

Discord ma dwie odrębne powierzchnie głosowe: **kanały głosowe** czasu rzeczywistego (ciągłe rozmowy) i **załączniki wiadomości głosowych** (format podglądu fali dźwiękowej). Gateway obsługuje oba.

### Kanały głosowe

Lista kontrolna konfiguracji:

1. Włącz Message Content Intent w Discord Developer Portal.
2. Włącz Server Members Intent, gdy używane są listy dozwolonych ról/użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Przyznaj Connect, Speak, Send Messages i Read Message History w docelowym kanale głosowym.
5. Włącz natywne polecenia (`commands.native` lub `channels.discord.commands.native`).
6. Skonfiguruj `channels.discord.voice`.

Użyj `/vc join|leave|status`, aby kontrolować sesje. Polecenie używa domyślnego agenta konta i przestrzega tych samych reguł list dozwolonych oraz zasad grupowych co inne polecenia Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Przykład automatycznego dołączania:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
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
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Uwagi:

- `voice.tts` nadpisuje `messages.tts` tylko dla odtwarzania głosu.
- `voice.model` nadpisuje LLM używany tylko dla odpowiedzi w kanałach głosowych Discord. Pozostaw bez ustawienia, aby dziedziczyć model kierowanego agenta.
- STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- Nadpisania `systemPrompt` Discord dla kanału mają zastosowanie do tur transkrypcji głosu dla tego kanału głosowego.
- Tury transkrypcji głosu wyprowadzają status właściciela z Discord `allowFrom` (lub `dm.allowFrom`); mówcy niebędący właścicielami nie mogą uzyskiwać dostępu do narzędzi tylko dla właściciela (na przykład `gateway` i `cron`).
- Głos Discord jest opcjonalny dla konfiguracji tylko tekstowych; ustaw `channels.discord.voice.enabled=true` (lub zachowaj istniejący blok `channels.discord.voice`), aby włączyć polecenia `/vc`, środowisko wykonawcze głosu i intencję gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` może jawnie nadpisać subskrypcję intencji stanu głosu. Pozostaw bez ustawienia, aby intencja podążała za efektywnym włączeniem głosu.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- `voice.connectTimeoutMs` kontroluje początkowe oczekiwanie Ready `@discordjs/voice` dla prób `/vc join` i automatycznego dołączania. Domyślnie: `30000`.
- `voice.reconnectGraceMs` kontroluje, jak długo OpenClaw czeka, aż rozłączona sesja głosowa zacznie ponownie się łączyć, zanim ją zniszczy. Domyślnie: `15000`.
- OpenClaw obserwuje też błędy odszyfrowywania odbioru i automatycznie przywraca działanie przez opuszczenie kanału głosowego oraz ponowne dołączenie po powtarzających się błędach w krótkim oknie.
- Jeśli po aktualizacji logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, zbierz raport zależności i logi. Dołączona linia `@discordjs/voice` zawiera poprawkę paddingu z upstream z PR discord.js #11449, która zamknęła issue discord.js #11419.

Potok kanału głosowego:

- Przechwytywanie PCM Discord jest konwertowane do tymczasowego pliku WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypcja jest wysyłana przez ingress i routing Discord, podczas gdy LLM odpowiedzi działa z zasadą wyjścia głosowego, która ukrywa narzędzie `tts` agenta i prosi o zwrócony tekst, ponieważ głos Discord odpowiada za końcowe odtwarzanie TTS.
- `voice.model`, gdy jest ustawione, nadpisuje tylko LLM odpowiedzi dla tej tury kanału głosowego.
- `voice.tts` jest scalane nad `messages.tts`; wynikowy dźwięk jest odtwarzany w dołączonym kanale.

Poświadczenia są rozwiązywane dla każdego komponentu: uwierzytelnianie trasy LLM dla `voice.model`, uwierzytelnianie STT dla `tools.media.audio` oraz uwierzytelnianie TTS dla `messages.tts`/`voice.tts`.

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd fali dźwiękowej i wymagają dźwięku OGG/Opus. OpenClaw generuje falę automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście gateway, aby sprawdzać i konwertować.

- Podaj **lokalną ścieżkę pliku** (URL-e są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst + wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw konwertuje do OGG/Opus według potrzeb.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy zależy Ci na rozwiązywaniu użytkowników/członków
    - uruchom ponownie gateway po zmianie intencji

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - sprawdź `groupPolicy`
    - sprawdź listę dozwolonych serwerów pod `channels.discord.guilds`
    - jeśli istnieje mapa `channels` serwera, dozwolone są tylko wymienione kanały
    - sprawdź zachowanie `requireMention` i wzorce wzmianek

    Przydatne kontrole:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych serwerów/kanałów
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi być pod `channels.discord.guilds` albo we wpisie kanału)
    - nadawca zablokowany przez listę dozwolonych `users` serwera/kanału

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Typowe logi:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Pokrętła kolejki Discord gateway:

    - pojedyncze konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - to kontroluje tylko pracę listenera Discord gateway, a nie czas życia tury agenta

    Discord nie stosuje limitu czasu należącego do kanału do zakolejkowanych tur agenta. Listenery wiadomości przekazują pracę natychmiast, a zakolejkowane uruchomienia Discord zachowują kolejność w ramach sesji, dopóki cykl życia sesji/narzędzia/środowiska wykonawczego nie zakończy się albo nie przerwie pracy.

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
    OpenClaw pobiera metadane Discord `/gateway/bot` przed nawiązaniem połączenia. Przejściowe błędy używają domyślnego adresu URL Gateway Discord jako rozwiązania awaryjnego i są ograniczane częstotliwościowo w logach.

    Ustawienia limitu czasu metadanych:

    - pojedyncze konto: `channels.discord.gatewayInfoTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - awaryjna wartość ze środowiska, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - domyślnie: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Ponowne uruchomienia po przekroczeniu limitu czasu READY Gateway">
    OpenClaw czeka na zdarzenie Gateway Discord `READY` podczas uruchamiania i po ponownych połączeniach w czasie działania. Konfiguracje z wieloma kontami i rozłożonym uruchamianiem mogą wymagać dłuższego okna READY podczas uruchamiania niż domyślne.

    Ustawienia limitu czasu READY:

    - uruchamianie, pojedyncze konto: `channels.discord.gatewayReadyTimeoutMs`
    - uruchamianie, wiele kont: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - awaryjna wartość ze środowiska podczas uruchamiania, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - domyślnie podczas uruchamiania: `15000` (15 sekund), maks.: `120000`
    - czas działania, pojedyncze konto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - czas działania, wiele kont: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - awaryjna wartość ze środowiska w czasie działania, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - domyślnie w czasie działania: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Kontrole uprawnień `channels status --probe` działają tylko dla numerycznych identyfikatorów kanałów.

    Jeśli używasz kluczy slug, dopasowanie w czasie działania nadal może działać, ale probe nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - zasady DM wyłączone: `channels.discord.dmPolicy="disabled"` (starsze: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot-bot">
    Domyślnie wiadomości autorstwa botów są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, użyj ścisłych reguł wzmianek i listy dozwolonych, aby uniknąć zapętlenia.
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

  <Accordion title="Utrata STT głosu z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby dostępna była logika odzyskiwania odbioru głosu Discord
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy nadal występują po automatycznym ponownym dołączeniu, zbierz logi i porównaj je z historią odbioru upstream DAVE w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) i [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Odwołanie konfiguracji

Główne odwołanie: [Odwołanie konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="Najważniejsze pola Discord">

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- zasady: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenie: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet odbiornika), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- odpowiedź/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponawianie: `mediaMaxMb` (ogranicza wychodzące przesyłanie do Discord, domyślnie `100MB`), `retry`
- działania: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (`DISCORD_BOT_TOKEN` preferowane w środowiskach nadzorowanych).
- Nadawaj minimalne wymagane uprawnienia Discord.
- Jeśli wdrożenie/stan polecenia jest nieaktualny, uruchom ponownie Gateway i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discord z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Czat grupowy i zachowanie listy dozwolonych.
  </Card>
  <Card title="Routing kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Routing wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj serwery i kanały na agentów.
  </Card>
  <Card title="Polecenia ukośnikiem" icon="terminal" href="/pl/tools/slash-commands">
    Zachowanie natywnych poleceń.
  </Card>
</CardGroup>
