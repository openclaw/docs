---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-05-04T07:02:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e00f9d9b134296ac1ca52bb4058fc62ea7a95c4d46d9478648b2ecdd448652a
    source_path: channels/discord.md
    workflow: 16
---

Gotowe do wiadomości prywatnych i kanałów serwera za pośrednictwem oficjalnego Discord gateway.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Discord domyślnie używają trybu parowania.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i przepływ naprawy.
  </Card>
</CardGroup>

## Szybka konfiguracja

Musisz utworzyć nową aplikację z botem, dodać bota do swojego serwera i sparować go z OpenClaw. Zalecamy dodanie bota do własnego prywatnego serwera. Jeśli jeszcze go nie masz, [najpierw go utwórz](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wybierz **Create My Own > For me and my friends**).

<Steps>
  <Step title="Utwórz aplikację Discord i bota">
    Przejdź do [Discord Developer Portal](https://discord.com/developers/applications) i kliknij **New Application**. Nazwij ją na przykład „OpenClaw”.

    Kliknij **Bot** na pasku bocznym. Ustaw **Username** na nazwę, której używasz dla swojego agenta OpenClaw.

  </Step>

  <Step title="Włącz uprzywilejowane intents">
    Nadal na stronie **Bot** przewiń w dół do **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazw do ID)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem w górę na stronie **Bot** i kliknij **Reset Token**.

    <Note>
    Mimo nazwy generuje to twój pierwszy token — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest twój **Bot Token** i będzie potrzebny za chwilę.

  </Step>

  <Step title="Wygeneruj URL zaproszenia i dodaj bota do serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do swojego serwera.

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

    To podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w przepływach kanałów forum lub mediów, które tworzą albo kontynuują wątek, włącz także **Send Messages in Threads**.
    Skopiuj wygenerowany URL na dole, wklej go w przeglądarce, wybierz swój serwer i kliknij **Continue**, aby połączyć. Bot powinien być teraz widoczny na serwerze Discord.

  </Step>

  <Step title="Włącz Developer Mode i zbierz swoje ID">
    Wróć do aplikacji Discord. Musisz włączyć Developer Mode, aby móc kopiować wewnętrzne ID.

    1. Kliknij **User Settings** (ikona koła zębatego obok awatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem **własny awatar** → **Copy User ID**

    Zapisz **Server ID** i **User ID** obok Bot Token — w następnym kroku wyślesz wszystkie trzy do OpenClaw.

  </Step>

  <Step title="Zezwól na wiadomości prywatne od członków serwera">
    Aby parowanie działało, Discord musi pozwalać botowi wysyłać do ciebie wiadomości prywatne. Kliknij prawym przyciskiem **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Pozwala to członkom serwera (w tym botom) wysyłać do ciebie wiadomości prywatne. Pozostaw to włączone, jeśli chcesz używać wiadomości prywatnych Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, możesz wyłączyć wiadomości prywatne po sparowaniu.

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
    W przypadku instalacji jako usługi zarządzanej uruchom `openclaw gateway install` z powłoki, w której dostępne jest `DISCORD_BOT_TOKEN`, albo zapisz zmienną w `~/.openclaw/.env`, aby usługa mogła rozwiązać env SecretRef po restarcie.
    Jeśli host jest blokowany lub ograniczany szybkością przez wyszukiwanie aplikacji startowej Discord, ustaw ID aplikacji/klienta Discord z Developer Portal, aby start mógł pominąć to wywołanie REST. Użyj `channels.discord.applicationId` dla domyślnego konta albo `channels.discord.accounts.<accountId>.applicationId`, gdy uruchamiasz wiele botów Discord.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj agenta">
        Porozmawiaj z agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i powiedz mu to. Jeśli Discord jest twoim pierwszym kanałem, użyj zamiast tego karty CLI / konfiguracja.

        > „Ustawiłem już token bota Discord w konfiguracji. Dokończ konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`.”
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

        Awaryjna zmienna env dla domyślnego konta:

```bash
DISCORD_BOT_TOKEN=...
```

        W przypadku konfiguracji skryptowej lub zdalnej zapisz ten sam blok JSON5 poleceniem `openclaw config patch --file ./discord.patch.json5 --dry-run`, a potem uruchom ponownie bez `--dry-run`. Obsługiwane są wartości `token` w tekście jawnym. Wartości SecretRef są również obsługiwane dla `channels.discord.token` w providerach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

        W przypadku wielu botów Discord przechowuj token i ID aplikacji każdego bota pod jego kontem. Najwyższego poziomu `channels.discord.applicationId` jest dziedziczone przez konta, więc ustawiaj je tam tylko wtedy, gdy każde konto ma używać tego samego ID aplikacji.

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

  <Step title="Zatwierdź pierwsze parowanie wiadomości prywatnej">
    Poczekaj, aż gateway będzie działać, a następnie wyślij wiadomość prywatną do bota w Discord. Odpowie kodem parowania.

    <Tabs>
      <Tab title="Zapytaj agenta">
        Wyślij kod parowania agentowi na istniejącym kanale:

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

    Teraz możesz rozmawiać z agentem w Discord przez wiadomość prywatną.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenu uwzględnia konto. Wartości tokenu w konfiguracji mają pierwszeństwo przed awaryjną zmienną env. `DISCORD_BOT_TOKEN` jest używany tylko dla domyślnego konta.
Jeśli dwa włączone konta Discord rozwiązują się do tego samego tokenu bota, OpenClaw uruchamia tylko jeden monitor gateway dla tego tokenu. Token ze źródła konfiguracji ma pierwszeństwo przed domyślną awaryjną zmienną env; w przeciwnym razie wygrywa pierwsze włączone konto, a zduplikowane konto jest zgłaszane jako wyłączone.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/akcje kanału) jawny `token` dla danego wywołania jest używany dla tego wywołania. Dotyczy to akcji wysyłania oraz akcji typu odczyt/sondowanie (na przykład read/search/fetch/thread/pins/permissions). Ustawienia zasad konta i ponawiania nadal pochodzą z wybranego konta w aktywnej migawce runtime.
</Note>

## Zalecane: skonfiguruj przestrzeń roboczą serwera

Gdy wiadomości prywatne działają, możesz skonfigurować swój serwer Discord jako pełną przestrzeń roboczą, w której każdy kanał otrzymuje własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteś tylko ty i twój bot.

<Steps>
  <Step title="Dodaj serwer do listy dozwolonych serwerów">
    Pozwala to agentowi odpowiadać w dowolnym kanale na twoim serwerze, nie tylko w wiadomościach prywatnych.

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
    Domyślnie agent odpowiada w kanałach serwera tylko po @wzmiance. W przypadku prywatnego serwera prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    W kanałach serwera zwykłe końcowe odpowiedzi asystenta pozostają domyślnie prywatne. Widoczne wyjście Discord musi zostać wysłane jawnie za pomocą narzędzia `message`, aby agent mógł domyślnie pozostawać w tle i publikować tylko wtedy, gdy uzna, że odpowiedź na kanale jest przydatna.

    Oznacza to, że wybrany model musi niezawodnie wywoływać narzędzia. Jeśli Discord pokazuje pisanie, a logi pokazują użycie tokenów, ale nie ma opublikowanej wiadomości, sprawdź log sesji pod kątem tekstu asystenta z `didSendViaMessagingTool: false`. To oznacza, że model utworzył prywatną odpowiedź końcową zamiast wywołać `message(action=send)`. Przełącz na silniejszy model wywołujący narzędzia albo użyj poniższej konfiguracji, aby przywrócić starsze automatyczne odpowiedzi końcowe.

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
        Jeśli potrzebujesz wspólnego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Trzymaj długoterminowe notatki w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał otrzymuje własną izolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` albo cokolwiek pasuje do twojego przepływu pracy.

## Model runtime

- Gateway odpowiada za połączenie z Discord.
- Routing odpowiedzi jest deterministyczny: odpowiedzi przychodzące z Discord wracają do Discord.
- Metadane gildii/kanału Discord są dodawane do promptu modelu jako niezaufany
  kontekst, a nie jako widoczny dla użytkownika prefiks odpowiedzi. Jeśli model skopiuje tę kopertę
  z powrotem, OpenClaw usuwa skopiowane metadane z odpowiedzi wychodzących oraz z
  przyszłego kontekstu odtwarzania.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały gildii używają izolowanych kluczy sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia slash działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), nadal przenosząc `CommandTargetSessionKey` do routowanej sesji konwersacji.
- Dostarczanie tekstowych ogłoszeń cron/heartbeat do Discord używa końcowej
  odpowiedzi widocznej dla asystenta dokładnie raz. Ładunki multimedialne i strukturalne komponentów pozostają
  wielowiadomościowe, gdy agent emituje wiele możliwych do dostarczenia ładunków.

## Kanały forum

Kanały forum i multimediów Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku używa pierwszego niepustego wiersza wiadomości.
- Użyj `openclaw message thread create`, aby utworzyć wątek bezpośrednio. Nie przekazuj `--message-id` dla kanałów forum.

Przykład: wyślij do nadrzędnego forum, aby utworzyć wątek

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Przykład: utwórz wątek forum jawnie

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

Domyślnie komponenty są jednorazowego użytku. Ustaw `components.reusable=true`, aby zezwolić na wielokrotne użycie przycisków, wyborów i formularzy do czasu ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` na tym przycisku (identyfikatory użytkowników Discord, tagi albo `*`). Po skonfigurowaniu niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Polecenia slash `/model` i `/models` otwierają interaktywny selektor modelu z listami rozwijanymi dostawcy, modelu i zgodnego środowiska uruchomieniowego oraz krokiem Prześlij. `/models add` jest przestarzałe i teraz zwraca komunikat o przestarzałości zamiast rejestrować modele z czatu. Odpowiedź selektora jest efemeryczna i może jej użyć tylko wywołujący użytkownik.

Załączniki plików:

- Bloki `file` muszą wskazywać na odwołanie do załącznika (`attachment://<filename>`)
- Podaj załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
- Użyj `filename`, aby nadpisać nazwę przesyłanego pliku, gdy powinna odpowiadać odwołaniu do załącznika

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
    `channels.discord.dmPolicy` kontroluje dostęp przez DM. `channels.discord.allowFrom` jest kanoniczną listą dozwolonych DM.

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`)
    - `disabled`

    Jeśli zasada DM nie jest otwarta, nieznani użytkownicy są blokowani (albo proszeni o parowanie w trybie `pairing`).

    Priorytet dla wielu kont:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Dla jednego konta `allowFrom` ma pierwszeństwo przed starszym `dm.allowFrom`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` i starsze `dm.allowFrom` nie są ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Starsze `channels.discord.dm.policy` i `channels.discord.dm.allowFrom` nadal są odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Format celu DM dla dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same identyfikatory numeryczne zwykle są rozwiązywane jako identyfikatory kanałów, gdy aktywna jest domyślna wartość kanału, ale identyfikatory wymienione w efektywnym DM `allowFrom` konta są traktowane jako cele DM użytkownika dla zgodności.

  </Tab>

  <Tab title="DM access groups">
    DM Discord mogą używać dynamicznych wpisów `accessGroup:<name>` w `channels.discord.allowFrom`.

    Nazwy grup dostępu są współdzielone między kanałami wiadomości. Użyj `type: "message.senders"` dla statycznej grupy, której członkowie są wyrażeni w normalnej składni `allowFrom` każdego kanału, albo `type: "discord.channelAudience"`, gdy bieżąca publiczność `ViewChannel` kanału Discord ma dynamicznie definiować członkostwo. Wspólne zachowanie grup dostępu jest udokumentowane tutaj: [Grupy dostępu](/pl/channels/access-groups).

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

    Przykład: pozwól każdemu, kto widzi `#maintainers`, wysyłać DM do bota, jednocześnie pozostawiając DM zamknięte dla wszystkich innych.

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

    Wyszukiwania domyślnie kończą się odmową. Jeśli Discord zwraca `Missing Access`, wyszukiwanie członka nie powiedzie się albo kanał należy do innej gildii, nadawca DM jest traktowany jako nieautoryzowany.

    Włącz **Server Members Intent** w Discord Developer Portal dla bota, gdy używasz grup dostępu opartych na publiczności kanału. DM nie zawierają stanu członka gildii, więc OpenClaw rozwiązuje członka przez Discord REST w czasie autoryzacji.

  </Tab>

  <Tab title="Guild policy">
    Obsługą gildii steruje `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczna konfiguracja bazowa, gdy istnieje `channels.discord`, to `allowlist`.

    Zachowanie `allowlist`:

    - gildia musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli skonfigurowano którekolwiek, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazw/tagów
    - jeśli gildia ma skonfigurowane `channels`, kanały spoza listy są odrzucane
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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, awaryjna wartość środowiska uruchomieniowego to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` to `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Wiadomości gildii są domyślnie bramkowane wzmiankami.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    Przy pisaniu wychodzących wiadomości Discord używaj kanonicznej składni wzmianek: `<@USER_ID>` dla użytkowników, `<#CHANNEL_ID>` dla kanałów i `<@&ROLE_ID>` dla ról. Nie używaj starszej formy wzmianki pseudonimu `<@!USER_ID>`.

    `requireMention` jest konfigurowane per gildia/kanał (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów lub slugi)

  </Tab>
</Tabs>

### Routing agenta na podstawie ról

Użyj `bindings[].match.roles`, aby routować członków gildii Discord do różnych agentów według identyfikatora roli. Powiązania oparte na rolach akceptują tylko identyfikatory ról i są oceniane po powiązaniach peer lub parent-peer, a przed powiązaniami tylko dla gildii. Jeśli powiązanie ustawia też inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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
- Autoryzacja poleceń natywnych używa tych samych list dozwolonych i zasad Discord co normalna obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discord dla użytkowników, którzy nie są autoryzowani; wykonanie nadal egzekwuje autoryzację OpenClaw i zwraca „not authorized”.

Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands), aby poznać katalog poleceń i ich zachowanie.

Domyślne ustawienia poleceń ukośnikowych:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord obsługuje tagi odpowiedzi w danych wyjściowych agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Kontrolowane przez `channels.discord.replyToMode`:

    - `off` (domyślnie)
    - `first`
    - `all`
    - `batched`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal respektowane.
    `first` zawsze dołącza niejawną natywną referencję odpowiedzi do pierwszej wychodzącej wiadomości Discord w danej turze.
    `batched` dołącza niejawną natywną referencję odpowiedzi Discord tylko wtedy, gdy
    przychodząca tura była opóźnioną partią wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie w niejednoznacznych, nagłych rozmowach, a nie w każdej
    turze z pojedynczą wiadomością.

    Identyfikatory wiadomości są udostępniane w kontekście/historii, aby agenci mogli kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw może strumieniować robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływania tekstu. `channels.discord.streaming` przyjmuje `off` (domyślnie) | `partial` | `block` | `progress`. `progress` utrzymuje jeden edytowalny szkic statusu i aktualizuje go postępem narzędzi aż do końcowego dostarczenia; `streamMode` jest starszym aliasem i jest migrowany automatycznie.

    Wartość domyślna pozostaje `off`, ponieważ edycje podglądu Discord szybko trafiają na limity szybkości, gdy wiele botów lub gatewayów współdzieli konto.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` edytuje pojedynczą wiadomość podglądu w miarę napływania tokenów.
    - `block` emituje fragmenty o rozmiarze szkicu (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału, ograniczone do `textChunkLimit`).
    - Media, błędy i końcowe wiadomości z jawną odpowiedzią anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie używają wiadomości podglądu.
    - `streaming.preview.commandText` / `streaming.progress.commandText` kontroluje szczegóły poleceń/wykonań w kompaktowych wierszach postępu: `raw` (domyślnie) lub `status` (tylko etykieta narzędzia).

    Ukryj surowy tekst poleceń/wykonań, zachowując kompaktowe wiersze postępu:

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

    Strumieniowanie podglądu obsługuje tylko tekst; odpowiedzi z mediami wracają do normalnego dostarczania. Gdy strumieniowanie `block` jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Kontekst historii serwera:

    - domyślne `channels.discord.historyLimit` to `20`
    - wartość zapasowa: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrolki historii wiadomości prywatnych:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są kierowane jako sesje kanału i dziedziczą konfigurację kanału nadrzędnego, chyba że zostanie ona nadpisana.
    - Sesje wątków dziedziczą wybór `/model` na poziomie sesji kanału nadrzędnego wyłącznie jako zapasowy model; lokalne dla wątku wybory `/model` nadal mają pierwszeństwo, a historia transkrypcji nadrzędnej nie jest kopiowana, chyba że włączone jest dziedziczenie transkrypcji.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) włącza inicjowanie nowych automatycznych wątków z transkrypcji nadrzędnej. Nadpisania dla kont znajdują się pod `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozwiązywać cele wiadomości prywatnych `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas zapasowej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych kontrolują, kto może wyzwolić agenta, a nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord może powiązać wątek z celem sesji, dzięki czemu kolejne wiadomości w tym wątku nadal są kierowane do tej samej sesji (w tym sesji podagentów).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem podagenta/sesji
    - `/unfocus` usuń powiązanie bieżącego wątku
    - `/agents` pokaż aktywne uruchomienia i stan powiązań
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
    - `spawnSessions` kontroluje automatyczne tworzenie/powiązanie wątków dla `sessions_spawn({ thread: true })` oraz uruchomień wątków ACP. Domyślnie: `true`.
    - `defaultSpawnContext` kontroluje natywny kontekst podagenta dla uruchomień powiązanych z wątkiem. Domyślnie: `"fork"`.
    - Przestarzałe klucze `spawnSubagentSessions`/`spawnAcpSessions` są migrowane przez `openclaw doctor --fix`.
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązań wątków są niedostępne.

    Zobacz [Podagenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) i [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Dla stabilnych, „zawsze włączonych” przestrzeni roboczych ACP skonfiguruj typowane powiązania ACP najwyższego poziomu kierujące do konwersacji Discord.

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
    - `spawnSessions` kontroluje tworzenie/powiązanie wątku podrzędnego przez `--thread auto|here`.

    Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać szczegóły zachowania powiązań.

  </Accordion>

  <Accordion title="Reaction notifications">
    Tryb powiadomień o reakcjach dla serwera:

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (używa `guilds.<id>.users`)

    Zdarzenia reakcji są zamieniane na zdarzenia systemowe i dołączane do kierowanej sesji Discord.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozwiązywania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - zapasowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie „👀”)

    Uwagi:

    - Discord akceptuje emoji Unicode lub nazwy niestandardowych emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Config writes">
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

  <Accordion title="Gateway proxy">
    Kieruj ruch WebSocket Gateway Discord i początkowe wyszukiwania REST (identyfikator aplikacji + rozwiązywanie list dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

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

  <Accordion title="PluralKit support">
    Włącz rozwiązywanie PluralKit, aby mapować wiadomości proxied na tożsamość członka systemu:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // opcjonalne; potrzebne dla systemów prywatnych
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

  <Accordion title="Outbound mention aliases">
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

    Przykład aktywności (niestandardowy status jest domyślnym typem aktywności):

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

    Automatyczna obecność mapuje dostępność środowiska uruchomieniowego na status Discord: healthy => online, degraded lub unknown => idle, exhausted lub unavailable => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discord">
    Discord obsługuje zatwierdzanie za pomocą przycisków w wiadomościach prywatnych i opcjonalnie może publikować monity zatwierdzenia w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; gdy to możliwe, używa awaryjnie `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można ustalić co najmniej jedną osobę zatwierdzającą, z `execApprovals.approvers` albo z `commands.ownerAllowFrom`. Discord nie wyprowadza osób zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzeń.

    W przypadku wrażliwych poleceń grupowych tylko dla właściciela, takich jak `/diagnostics` i `/export-trajectory`, OpenClaw wysyła monity zatwierdzenia i końcowe wyniki prywatnie. Najpierw próbuje wiadomości prywatnej Discord, gdy wywołujący właściciel ma trasę właściciela Discord; jeśli nie jest dostępna, przechodzi awaryjnie do pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, na przykład Telegram.

    Gdy `target` ma wartość `channel` lub `both`, monit zatwierdzenia jest widoczny w kanale. Tylko ustalone osoby zatwierdzające mogą używać przycisków; inni użytkownicy otrzymują tymczasową odmowę. Monity zatwierdzenia zawierają tekst polecenia, więc dostarczanie do kanału włączaj tylko w zaufanych kanałach. Jeśli nie można wyprowadzić identyfikatora kanału z klucza sesji, OpenClaw przechodzi awaryjnie na dostarczenie przez wiadomość prywatną.

    Discord renderuje też współdzielone przyciski zatwierdzeń używane przez inne kanały czatu. Natywny adapter Discord dodaje głównie routing wiadomości prywatnych do osób zatwierdzających oraz fanout do kanałów.
    Gdy te przyciski są obecne, stanowią główne środowisko zatwierdzania; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia wskazuje,
    że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    Jeśli natywne środowisko uruchomieniowe zatwierdzeń Discord nie jest aktywne, OpenClaw pozostawia
    widoczny lokalny deterministyczny monit `/approve <id> <decision>`. Jeśli
    środowisko uruchomieniowe jest aktywne, ale natywnej karty nie można dostarczyć do żadnego celu,
    OpenClaw wysyła w tym samym czacie awaryjne powiadomienie z dokładnym poleceniem `/approve`
    z oczekującego zatwierdzenia.

    Uwierzytelnianie Gateway i rozstrzyganie zatwierdzeń są zgodne ze współdzielonym kontraktem klienta Gateway (identyfikatory `plugin:` są rozwiązywane przez `plugin.approval.resolve`; pozostałe identyfikatory przez `exec.approval.resolve`). Zatwierdzenia domyślnie wygasają po 30 minutach.

    Zobacz [zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki akcji

Akcje wiadomości Discord obejmują akcje wiadomości, administracji kanałem, moderacji, obecności i metadanych.

Główne przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Akcja `event-create` przyjmuje opcjonalny parametr `image` (URL lub ścieżka pliku lokalnego), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki akcji znajdują się pod `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa akcji                                                                                                                                                             | Domyślnie |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone  |
| roles                                                                                                                                                                   | wyłączone |
| moderation                                                                                                                                                              | wyłączone |
| presence                                                                                                                                                                | wyłączone |

## Interfejs użytkownika Components v2

OpenClaw używa komponentów Discord v2 do zatwierdzeń exec i znaczników międzykontekstowych. Akcje wiadomości Discord mogą też przyjmować `components` dla niestandardowego interfejsu użytkownika (zaawansowane; wymaga skonstruowania payloadu komponentu za pomocą narzędzia discord), a starsze `embeds` pozostają dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustawiaj dla każdego konta za pomocą `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` są ignorowane, gdy obecne są components v2.

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

Discord ma dwie odrębne powierzchnie głosowe: **kanały głosowe** w czasie rzeczywistym (ciągłe rozmowy) i **załączniki wiadomości głosowych** (format podglądu fali dźwiękowej). Gateway obsługuje oba.

### Kanały głosowe

Lista kontrolna konfiguracji:

1. Włącz Message Content Intent w Discord Developer Portal.
2. Włącz Server Members Intent, gdy używane są listy dozwolonych ról/użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Przyznaj Connect, Speak, Send Messages i Read Message History w docelowym kanale głosowym.
5. Włącz natywne polecenia (`commands.native` lub `channels.discord.commands.native`).
6. Skonfiguruj `channels.discord.voice`.

Użyj `/vc join|leave|status`, aby sterować sesjami. Polecenie używa domyślnego agenta konta i stosuje te same reguły list dozwolonych oraz polityki grup co inne polecenia Discord.

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

- `voice.tts` nadpisuje `messages.tts` tylko dla odtwarzania głosowego.
- `voice.model` nadpisuje LLM używany tylko dla odpowiedzi kanału głosowego Discord. Pozostaw bez ustawienia, aby odziedziczyć model trasowanego agenta.
- STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- Nadpisania `systemPrompt` Discord dla kanału mają zastosowanie do tur transkryptu głosowego dla tego kanału głosowego.
- Tury transkryptu głosowego wyprowadzają status właściciela z `allowFrom` Discord (lub `dm.allowFrom`); osoby mówiące bez statusu właściciela nie mogą uzyskać dostępu do narzędzi tylko dla właściciela (na przykład `gateway` i `cron`).
- Głos Discord jest opcjonalny dla konfiguracji tylko tekstowych; ustaw `channels.discord.voice.enabled=true` (lub zachowaj istniejący blok `channels.discord.voice`), aby włączyć polecenia `/vc`, środowisko uruchomieniowe głosu i intencję Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` może jawnie nadpisać subskrypcję intencji stanu głosu. Pozostaw bez ustawienia, aby intencja podążała za efektywnym włączeniem głosu.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- `voice.connectTimeoutMs` steruje początkowym oczekiwaniem Ready `@discordjs/voice` dla prób `/vc join` i automatycznego dołączania. Domyślnie: `30000`.
- `voice.reconnectGraceMs` steruje tym, jak długo OpenClaw czeka, aż rozłączona sesja głosowa zacznie ponowne łączenie, zanim zostanie zniszczona. Domyślnie: `15000`.
- OpenClaw obserwuje też niepowodzenia odszyfrowywania odbioru i automatycznie odzyskuje działanie przez opuszczenie i ponowne dołączenie do kanału głosowego po powtarzających się niepowodzeniach w krótkim oknie.
- Jeśli po aktualizacji logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, zbierz raport zależności i logi. Dołączona linia `@discordjs/voice` zawiera poprawkę paddingu z upstream z PR discord.js #11449, która zamknęła issue discord.js #11419.

Potok kanału głosowego:

- Przechwytywanie PCM Discord jest konwertowane na tymczasowy plik WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypt jest wysyłany przez wejście i routing Discord, podczas gdy LLM odpowiedzi działa z polityką wyjścia głosowego, która ukrywa narzędzie agenta `tts` i prosi o zwrócony tekst, ponieważ Discord voice odpowiada za końcowe odtwarzanie TTS.
- `voice.model`, gdy jest ustawiony, nadpisuje tylko LLM odpowiedzi dla tej tury kanału głosowego.
- `voice.tts` jest scalane nad `messages.tts`; wynikowy dźwięk jest odtwarzany w dołączonym kanale.

Poświadczenia są rozwiązywane dla każdego komponentu: uwierzytelnianie trasy LLM dla `voice.model`, uwierzytelnianie STT dla `tools.media.audio` i uwierzytelnianie TTS dla `messages.tts`/`voice.tts`.

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd fali dźwiękowej i wymagają dźwięku OGG/Opus. OpenClaw automatycznie generuje falę, ale potrzebuje `ffmpeg` i `ffprobe` na hoście Gateway do inspekcji i konwersji.

- Podaj **ścieżkę pliku lokalnego** (URL-e są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst + wiadomość głosową w tym samym payloadzie).
- Akceptowany jest dowolny format audio; OpenClaw w razie potrzeby konwertuje na OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji lub bot nie widzi wiadomości gildii">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy polegasz na rozwiązywaniu użytkowników/członków
    - uruchom ponownie gateway po zmianie intencji

  </Accordion>

  <Accordion title="Wiadomości gildii są nieoczekiwanie blokowane">

    - zweryfikuj `groupPolicy`
    - zweryfikuj listę dozwolonych gildii pod `channels.discord.guilds`
    - jeśli istnieje mapa `channels` gildii, dozwolone są tylko wymienione kanały
    - zweryfikuj zachowanie `requireMention` i wzorce wzmianek

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
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi być pod `channels.discord.guilds` lub wpisem kanału)
    - nadawca zablokowany przez listę dozwolonych `users` gildii/kanału

  </Accordion>

  <Accordion title="Długotrwałe tury Discord lub zduplikowane odpowiedzi">

    Typowe logi:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Pokrętła kolejki Gateway Discord:

    - jedno konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - kontroluje to tylko pracę listenera Gateway Discord, nie czas trwania tury agenta

    Discord nie stosuje limitu czasu należącego do kanału dla kolejkowanych tur agenta. Listenery wiadomości przekazują pracę natychmiast, a kolejkowane uruchomienia Discord zachowują kolejność w ramach sesji, dopóki cykl życia sesji/narzędzia/środowiska uruchomieniowego nie zakończy się lub nie przerwie pracy.

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
    OpenClaw pobiera metadane Discord `/gateway/bot` przed połączeniem. Przejściowe błędy powodują użycie domyślnego adresu URL gateway Discord i są limitowane w logach.

    Ustawienia limitu czasu metadanych:

    - pojedyncze konto: `channels.discord.gatewayInfoTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - zastępcza zmienna środowiskowa, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - domyślnie: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Ponowne uruchomienia po przekroczeniu limitu czasu READY Gateway">
    OpenClaw czeka na zdarzenie gateway Discord `READY` podczas uruchamiania i po ponownych połączeniach w czasie działania. Konfiguracje z wieloma kontami i stopniowym uruchamianiem mogą wymagać dłuższego okna READY podczas startu niż domyślne.

    Ustawienia limitu czasu READY:

    - uruchamianie, pojedyncze konto: `channels.discord.gatewayReadyTimeoutMs`
    - uruchamianie, wiele kont: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - zastępcza zmienna środowiskowa uruchamiania, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - domyślnie przy uruchamianiu: `15000` (15 sekund), maks.: `120000`
    - czas działania, pojedyncze konto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - czas działania, wiele kont: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - zastępcza zmienna środowiskowa czasu działania, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - domyślnie w czasie działania: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Sprawdzanie uprawnień przez `channels status --probe` działa tylko dla numerycznych identyfikatorów kanałów.

    Jeśli używasz kluczy typu slug, dopasowanie w czasie działania nadal może działać, ale probe nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - zasada DM wyłączona: `channels.discord.dmPolicy="disabled"` (starsze: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot do bota">
    Domyślnie wiadomości utworzone przez boty są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, użyj ścisłych reguł wzmianek i listy dozwolonych, aby uniknąć pętli.
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

  <Accordion title="Zaniki STT głosu z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby była dostępna logika odzyskiwania odbioru głosu Discord
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostosuj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy nadal występują po automatycznym ponownym dołączeniu, zbierz logi i porównaj z historią odbioru DAVE upstream w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) oraz [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referencja konfiguracji

Główna referencja: [Referencja konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="Najważniejsze pola Discord">

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- zasady: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet odbiornika), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- odpowiedzi/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- multimedia/ponawianie: `mediaMaxMb` (ogranicza wychodzące przesyłanie do Discord, domyślnie `100MB`), `retry`
- akcje: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (w środowiskach nadzorowanych preferowane `DISCORD_BOT_TOKEN`).
- Nadaj uprawnienia Discord zgodnie z zasadą najmniejszych uprawnień.
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
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Routing wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj gildie i kanały na agentów.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Zachowanie poleceń natywnych.
  </Card>
</CardGroup>
