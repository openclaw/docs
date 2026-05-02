---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-05-02T09:42:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42223982a8bfd288d29a1f402b37141557718a407537011956b878b91b894e62
    source_path: channels/discord.md
    workflow: 16
---

Gotowe do wiadomości prywatnych i kanałów serwera przez oficjalny Gateway Discorda.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Discord domyślnie działają w trybie parowania.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Natywne działanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i proces naprawy.
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
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazwy do ID)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem w górę na stronie **Bot** i kliknij **Reset Token**.

    <Note>
    Mimo nazwy generuje to Twój pierwszy token — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest Twój **Bot Token** i będzie Ci zaraz potrzebny.

  </Step>

  <Step title="Wygeneruj URL zaproszenia i dodaj bota do serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do serwera.

    Przewiń w dół do **OAuth2 URL Generator** i włącz:

    - `bot`
    - `applications.commands`

    Poniżej pojawi się sekcja **Bot Permissions**. Włącz co najmniej:

    **General Permissions**
      - Wyświetlanie kanałów
    **Text Permissions**
      - Wysyłanie wiadomości
      - Czytanie historii wiadomości
      - Osadzanie linków
      - Dołączanie plików
      - Dodawanie reakcji (opcjonalne)

    To zestaw bazowy dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w procesach kanałów forum lub multimediów, które tworzą albo kontynuują wątek, włącz też **Send Messages in Threads**.
    Skopiuj wygenerowany URL na dole, wklej go w przeglądarce, wybierz swój serwer i kliknij **Continue**, aby połączyć. Bot powinien być teraz widoczny na serwerze Discord.

  </Step>

  <Step title="Włącz tryb dewelopera i zbierz swoje ID">
    W aplikacji Discord musisz włączyć tryb dewelopera, aby móc kopiować wewnętrzne ID.

    1. Kliknij **User Settings** (ikona koła zębatego obok avatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem **własny avatar** → **Copy User ID**

    Zapisz swoje **Server ID** i **User ID** razem z Bot Token — w następnym kroku wyślesz wszystkie trzy wartości do OpenClaw.

  </Step>

  <Step title="Zezwól na wiadomości prywatne od członków serwera">
    Aby parowanie działało, Discord musi pozwalać botowi wysyłać do Ciebie wiadomości prywatne. Kliknij prawym przyciskiem **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać do Ciebie wiadomości prywatne. Pozostaw tę opcję włączoną, jeśli chcesz używać wiadomości prywatnych Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, możesz wyłączyć wiadomości prywatne po sparowaniu.

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

    Jeśli OpenClaw działa już jako usługa w tle, uruchom ją ponownie przez aplikację OpenClaw Mac albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.
    W przypadku instalacji usług zarządzanych uruchom `openclaw gateway install` z powłoki, w której obecny jest `DISCORD_BOT_TOKEN`, albo zapisz zmienną w `~/.openclaw/.env`, aby usługa mogła rozwiązać env SecretRef po ponownym uruchomieniu.
    Jeśli Twój host jest blokowany albo ograniczany limitem przez wyszukiwanie aplikacji startowej Discord, ustaw ID aplikacji/klienta Discord z Developer Portal, aby uruchamianie mogło pominąć to wywołanie REST. Użyj `channels.discord.applicationId` dla domyślnego konta albo `channels.discord.accounts.<accountId>.applicationId`, gdy uruchamiasz wiele botów Discord.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i powiedz mu to. Jeśli Discord jest Twoim pierwszym kanałem, użyj zamiast tego karty CLI / config.

        > „Mam już ustawiony token bota Discord w konfiguracji. Dokończ konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`.”
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

        Zastępcza zmienna env dla domyślnego konta:

```bash
DISCORD_BOT_TOKEN=...
```

        W przypadku konfiguracji skryptowej lub zdalnej zapisz ten sam blok JSON5 za pomocą `openclaw config patch --file ./discord.patch.json5 --dry-run`, a następnie uruchom ponownie bez `--dry-run`. Wartości `token` w postaci tekstu jawnego są obsługiwane. Wartości SecretRef są również obsługiwane dla `channels.discord.token` w providerach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

        W przypadku wielu botów Discord przechowuj token każdego bota i ID aplikacji pod jego kontem. Najwyższego poziomu `channels.discord.applicationId` jest dziedziczone przez konta, więc ustawiaj je tam tylko wtedy, gdy każde konto powinno używać tego samego ID aplikacji.

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
    Poczekaj, aż Gateway będzie działać, a następnie wyślij wiadomość prywatną do bota w Discord. Odpowie kodem parowania.

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

    Teraz możesz rozmawiać ze swoim agentem w Discord przez wiadomości prywatne.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenów uwzględnia konto. Wartości tokenów z konfiguracji mają pierwszeństwo przed zastępczą zmienną env. `DISCORD_BOT_TOKEN` jest używany tylko dla domyślnego konta.
Jeśli dwa włączone konta Discord rozwiązują się do tego samego tokena bota, OpenClaw uruchamia tylko jeden monitor Gateway dla tego tokena. Token pochodzący z konfiguracji ma pierwszeństwo przed domyślną zastępczą zmienną env; w przeciwnym razie wygrywa pierwsze włączone konto, a zduplikowane konto jest zgłaszane jako wyłączone.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/akcje kanału) jawny `token` dla wywołania jest używany tylko dla tego wywołania. Dotyczy to akcji wysyłania oraz akcji typu odczyt/sonda (na przykład read/search/fetch/thread/pins/permissions). Ustawienia zasad konta i ponowień nadal pochodzą z wybranego konta w aktywnej migawce środowiska wykonawczego.
</Note>

## Zalecane: skonfiguruj obszar roboczy serwera

Gdy wiadomości prywatne już działają, możesz skonfigurować swój serwer Discord jako pełny obszar roboczy, w którym każdy kanał otrzymuje własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, gdzie jesteś tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
    Pozwala to agentowi odpowiadać na dowolnym kanale na Twoim serwerze, nie tylko w wiadomościach prywatnych.

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
    Domyślnie agent odpowiada w kanałach serwera tylko wtedy, gdy zostanie @wspomniany. W przypadku prywatnego serwera prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    W kanałach serwera zwykłe końcowe odpowiedzi asystenta pozostają domyślnie prywatne. Widoczne wyjście Discord musi zostać wysłane jawnie narzędziem `message`, dzięki czemu agent może domyślnie obserwować i publikować tylko wtedy, gdy uzna, że odpowiedź na kanale jest przydatna.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Pozwól mojemu agentowi odpowiadać na tym serwerze bez konieczności @wzmianki”
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

        Aby przywrócić starsze automatyczne końcowe odpowiedzi dla pokojów grupowych/kanałowych, ustaw `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zaplanuj pamięć w kanałach serwera">
    Domyślnie pamięć długoterminowa (MEMORY.md) ładuje się tylko w sesjach wiadomości prywatnych. Kanały serwera nie ładują automatycznie MEMORY.md.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Gdy zadaję pytania w kanałach Discord, używaj memory_search albo memory_get, jeśli potrzebujesz długoterminowego kontekstu z MEMORY.md.”
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` albo `USER.md` (są wstrzykiwane dla każdej sesji). Przechowuj długoterminowe notatki w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał otrzymuje własną izolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` albo cokolwiek pasuje do Twojego procesu pracy.

## Model środowiska wykonawczego

- Gateway obsługuje połączenie z Discord.
- Routing odpowiedzi jest deterministyczny: przychodzące odpowiedzi z Discord wracają do Discord.
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
  wieloma wiadomościami, gdy agent emituje wiele dostarczalnych ładunków.

## Kanały forum

Kanały forum i mediów Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do kanału nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku używa pierwszego niepustego wiersza wiadomości.
- Użyj `openclaw message thread create`, aby utworzyć wątek bezpośrednio. Nie przekazuj `--message-id` dla kanałów forum.

Przykład: wysłanie do kanału nadrzędnego forum w celu utworzenia wątku

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Przykład: jawne utworzenie wątku forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Kanały nadrzędne forum nie akceptują komponentów Discord. Jeśli potrzebujesz komponentów, wyślij wiadomość do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agentów. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są routowane z powrotem do agenta jako zwykłe wiadomości przychodzące i respektują istniejące ustawienia Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowego użytku. Ustaw `components.reusable=true`, aby umożliwić wielokrotne użycie przycisków, list wyboru i formularzy do czasu ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` na tym przycisku (identyfikatory użytkowników Discord, tagi lub `*`). Gdy to skonfigurowano, niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Polecenia ukośnikowe `/model` i `/models` otwierają interaktywny selektor modelu z listami rozwijanymi dostawcy, modelu i zgodnego środowiska uruchomieniowego oraz krokiem przesłania. `/models add` jest przestarzałe i teraz zwraca komunikat o przestarzałości zamiast rejestrować modele z czatu. Odpowiedź selektora jest efemeryczna i może jej użyć tylko wywołujący użytkownik.

Załączniki plików:

- Bloki `file` muszą wskazywać na referencję załącznika (`attachment://<filename>`)
- Przekaż załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
- Użyj `filename`, aby nadpisać nazwę przesyłanego pliku, gdy powinna odpowiadać referencji załącznika

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
  <Tab title="Zasady DM">
    `channels.discord.dmPolicy` kontroluje dostęp DM. `channels.discord.allowFrom` jest kanoniczną listą dozwolonych dla DM.

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`)
    - `disabled`

    Jeśli zasada DM nie jest otwarta, nieznani użytkownicy są blokowani (albo proszeni o parowanie w trybie `pairing`).

    Priorytety dla wielu kont:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Dla jednego konta `allowFrom` ma pierwszeństwo przed starszym `dm.allowFrom`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` i starsze `dm.allowFrom` nie są ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Starsze `channels.discord.dm.policy` i `channels.discord.dm.allowFrom` są nadal odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Format celu DM dla dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same identyfikatory numeryczne zwykle są rozpoznawane jako identyfikatory kanałów, gdy aktywny jest domyślny kanał, ale identyfikatory wymienione w efektywnej liście DM `allowFrom` konta są traktowane jako cele DM użytkowników dla zgodności.

  </Tab>

  <Tab title="Grupy dostępu DM">
    DM Discord mogą używać dynamicznych wpisów `accessGroup:<name>` w `channels.discord.allowFrom`.

    Nazwy grup dostępu są współdzielone między kanałami wiadomości. Użyj `type: "message.senders"` dla statycznej grupy, której członkowie są wyrażani w normalnej składni `allowFrom` każdego kanału, albo `type: "discord.channelAudience"`, gdy bieżąca grupa odbiorców `ViewChannel` kanału Discord ma dynamicznie definiować członkostwo. Wspólne zachowanie grup dostępu jest udokumentowane tutaj: [Grupy dostępu](/pl/channels/access-groups).

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

    Kanał tekstowy Discord nie ma osobnej listy członków. `type: "discord.channelAudience"` modeluje członkostwo tak: nadawca DM jest członkiem skonfigurowanej gildii i aktualnie ma efektywne uprawnienie `ViewChannel` na skonfigurowanym kanale po zastosowaniu ról i nadpisań kanału.

    Przykład: zezwól każdemu, kto widzi `#maintainers`, na wysyłanie DM do bota, pozostawiając DM zamknięte dla wszystkich innych.

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

    Wyszukiwania kończą się odmową przy błędzie. Jeśli Discord zwróci `Missing Access`, wyszukiwanie członka się nie powiedzie albo kanał należy do innej gildii, nadawca DM jest traktowany jako nieupoważniony.

    Włącz **Server Members Intent** w Discord Developer Portal dla bota, gdy używasz grup dostępu opartych na odbiorcach kanału. DM nie zawierają stanu członka gildii, więc OpenClaw rozpoznaje członka przez Discord REST w czasie autoryzacji.

  </Tab>

  <Tab title="Zasady gildii">
    Obsługą gildii steruje `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczną wartością bazową, gdy istnieje `channels.discord`, jest `allowlist`.

    Zachowanie `allowlist`:

    - gildia musi pasować do `channels.discord.guilds` (preferowany `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli skonfigurowano którąkolwiek z nich, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy z nazwami/tagami
    - jeśli gildia ma skonfigurowane `channels`, niewymienione kanały są odrzucane
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

  <Tab title="Wzmianki i grupowe DM">
    Wiadomości gildii są domyślnie bramkowane wzmianką.

    Wykrywanie wzmianki obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    Pisząc wychodzące wiadomości Discord, używaj kanonicznej składni wzmianek: `<@USER_ID>` dla użytkowników, `<#CHANNEL_ID>` dla kanałów i `<@&ROLE_ID>` dla ról. Nie używaj starszej formy wzmianki pseudonimu `<@!USER_ID>`.

    `requireMention` jest konfigurowane per gildia/kanał (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów lub slugi)

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
- `commands.native=false` jawnie czyści wcześniej zarejestrowane natywne polecenia Discord.
- Uwierzytelnianie poleceń natywnych używa tych samych list dozwolonych i zasad Discord co zwykła obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discord dla użytkowników bez uprawnień; wykonanie nadal wymusza uwierzytelnianie OpenClaw i zwraca „brak autoryzacji”.

Zobacz [Polecenia slash](/pl/tools/slash-commands), aby poznać katalog poleceń i ich działanie.

Domyślne ustawienia poleceń slash:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord obsługuje znaczniki odpowiedzi w wynikach agenta:

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
    przychodząca tura była zdławioną partią wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie dla niejednoznacznych, gwałtownych rozmów, a nie dla każdej
    tury z pojedynczą wiadomością.

    Identyfikatory wiadomości są udostępniane w kontekście/historii, aby agenci mogli wskazywać konkretne wiadomości.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw może strumieniować robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływu tekstu. `channels.discord.streaming` przyjmuje `off` (domyślnie) | `partial` | `block` | `progress`. `progress` mapuje się na `partial` w Discord; `streamMode` to starszy alias i jest automatycznie migrowany.

    Wartość domyślna pozostaje `off`, ponieważ edycje podglądu Discord szybko trafiają na limity częstotliwości, gdy wiele botów lub bram współdzieli konto.

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

    - `partial` edytuje pojedynczą wiadomość podglądu w miarę napływu tokenów.
    - `block` emituje fragmenty o rozmiarze wersji roboczej (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału, ograniczone do `textChunkLimit`).
    - Media, błędy i końcowe wiadomości z jawną odpowiedzią anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie używają wiadomości podglądu.

    Strumieniowanie podglądu obsługuje tylko tekst; odpowiedzi z mediami wracają do zwykłego dostarczania. Gdy strumieniowanie `block` jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Kontekst historii gildii:

    - domyślne `channels.discord.historyLimit` to `20`
    - wartość zastępcza: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrola historii wiadomości prywatnych:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są trasowane jako sesje kanału i dziedziczą konfigurację kanału nadrzędnego, chyba że zostanie nadpisana.
    - Sesje wątków dziedziczą wybór `/model` na poziomie sesji kanału nadrzędnego jako awaryjną wartość tylko dla modelu; lokalne dla wątku wybory `/model` nadal mają pierwszeństwo, a historia transkrypcji nadrzędnej nie jest kopiowana, chyba że włączono dziedziczenie transkrypcji.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) pozwala nowym automatycznym wątkom inicjować się z transkrypcji nadrzędnej. Nadpisania dla konta znajdują się w `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozwiązywać cele DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas awaryjnej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych kontrolują, kto może wyzwolić agenta, ale nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord może powiązać wątek z celem sesji, dzięki czemu kolejne wiadomości w tym wątku nadal trafiają do tej samej sesji (w tym sesji podagentów).

    Polecenia:

    - `/focus <target>` wiąże bieżący/nowy wątek z celem podagenta/sesji
    - `/unfocus` usuwa powiązanie bieżącego wątku
    - `/agents` pokazuje aktywne uruchomienia i stan powiązań
    - `/session idle <duration|off>` sprawdza/aktualizuje automatyczne usunięcie skupienia po bezczynności dla aktywnych powiązań
    - `/session max-age <duration|off>` sprawdza/aktualizuje twardy maksymalny wiek dla aktywnych powiązań

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
    - `spawnSessions` kontroluje automatyczne tworzenie/wiązanie wątków dla `sessions_spawn({ thread: true })` i uruchomień wątków ACP. Domyślnie: `true`.
    - `defaultSpawnContext` kontroluje natywny kontekst podagenta dla uruchomień powiązanych z wątkiem. Domyślnie: `"fork"`.
    - Przestarzałe klucze `spawnSubagentSessions`/`spawnAcpSessions` są migrowane przez `openclaw doctor --fix`.
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje wiązania wątku są niedostępne.

    Zobacz [Podagenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) i [Informacje o konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Dla stabilnych, „zawsze włączonych” obszarów roboczych ACP skonfiguruj najwyższego poziomu typowane powiązania ACP kierujące do rozmów Discord.

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
    - `spawnSessions` kontroluje tworzenie/wiązanie wątków podrzędnych przez `--thread auto|here`.

    Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać szczegóły zachowania powiązań.

  </Accordion>

  <Accordion title="Reaction notifications">
    Tryb powiadomień o reakcjach dla gildii:

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (używa `guilds.<id>.users`)

    Zdarzenia reakcji są przekształcane w zdarzenia systemowe i dołączane do trasowanej sesji Discord.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozwiązywania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - awaryjne emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie „👀”)

    Uwagi:

    - Discord akceptuje emoji Unicode lub niestandardowe nazwy emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Config writes">
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

  <Accordion title="Gateway proxy">
    Trasuj ruch WebSocket Discord Gateway oraz startowe zapytania REST (identyfikator aplikacji + rozwiązywanie listy dozwolonych) przez proxy HTTP(S) z `channels.discord.proxy`.

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
    Włącz rozwiązywanie PluralKit, aby mapować wiadomości proxy na tożsamość członka systemu:

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
    - nazwy wyświetlane członków są dopasowywane po nazwie/slug tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - zapytania używają oryginalnego identyfikatora wiadomości i są ograniczone oknem czasowym
    - jeśli zapytanie się nie powiedzie, wiadomości proxy są traktowane jako wiadomości bota i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Użyj `mentionAliases`, gdy agenci potrzebują deterministycznych wychodzących wzmianek dla znanych użytkowników Discord. Klucze to uchwyty bez początkowego `@`; wartości to identyfikatory użytkowników Discord. Nieznane uchwyty, `@everyone`, `@here` oraz wzmianki w spanach kodu Markdown pozostają bez zmian.

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
    Discord obsługuje zatwierdzanie za pomocą przycisków w wiadomościach prywatnych i może opcjonalnie publikować monity o zatwierdzenie w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; w miarę możliwości wraca do `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` jest nieustawione albo ma wartość `"auto"` i można ustalić co najmniej jedną osobę zatwierdzającą, z `execApprovals.approvers` albo z `commands.ownerAllowFrom`. Discord nie wywodzi osób zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani bezpośredniej wiadomości `defaultTo`. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzania.

    Dla wrażliwych poleceń grupowych dostępnych tylko dla właściciela, takich jak `/diagnostics` i `/export-trajectory`, OpenClaw wysyła monity zatwierdzania oraz wyniki końcowe prywatnie. Najpierw próbuje Discord DM, gdy wywołujący właściciel ma trasę właściciela Discord; jeśli nie jest ona dostępna, wraca do pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, takiej jak Telegram.

    Gdy `target` ma wartość `channel` albo `both`, monit zatwierdzania jest widoczny w kanale. Tylko ustalone osoby zatwierdzające mogą używać przycisków; pozostali użytkownicy otrzymują efemeryczną odmowę. Monity zatwierdzania zawierają tekst polecenia, więc włączaj dostarczanie do kanału tylko w zaufanych kanałach. Jeśli identyfikatora kanału nie da się wyprowadzić z klucza sesji, OpenClaw wraca do dostarczania przez DM.

    Discord renderuje także współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Discord dodaje głównie trasowanie DM do osób zatwierdzających oraz fanout kanału.
    Gdy te przyciski są obecne, stanowią podstawowy UX zatwierdzania; OpenClaw
    powinien zawierać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia wskazuje,
    że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    Jeśli natywne środowisko uruchomieniowe zatwierdzania Discord nie jest aktywne, OpenClaw zachowuje
    widoczny lokalny deterministyczny monit `/approve <id> <decision>`. Jeśli
    środowisko uruchomieniowe jest aktywne, ale natywnej karty nie da się dostarczyć do żadnego celu,
    OpenClaw wysyła powiadomienie awaryjne w tym samym czacie z dokładnym poleceniem `/approve`
    z oczekującego zatwierdzenia.

    Uwierzytelnianie Gateway i rozstrzyganie zatwierdzeń są zgodne ze współdzieloną umową klienta Gateway (identyfikatory `plugin:` są rozstrzygane przez `plugin.approval.resolve`; pozostałe identyfikatory przez `exec.approval.resolve`). Zatwierdzenia domyślnie wygasają po 30 minutach.

    Zobacz [zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki akcji

Akcje wiadomości Discord obejmują wiadomości, administrację kanałem, moderację, obecność i akcje metadanych.

Podstawowe przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Akcja `event-create` przyjmuje opcjonalny parametr `image` (URL albo lokalna ścieżka pliku), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki akcji znajdują się pod `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa akcji                                                                                                                                                              | Domyślnie |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone |
| roles                                                                                                                                                                    | wyłączone |
| moderation                                                                                                                                                               | wyłączone |
| presence                                                                                                                                                                 | wyłączone |

## Interfejs komponentów v2

OpenClaw używa komponentów Discord v2 do zatwierdzeń exec i znaczników międzykontekstowych. Akcje wiadomości Discord mogą także przyjmować `components` dla niestandardowego interfejsu (zaawansowane; wymaga skonstruowania ładunku komponentu przez narzędzie discord), natomiast starsze `embeds` pozostają dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustaw dla konta za pomocą `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord ma dwie odrębne powierzchnie głosowe: **kanały głosowe** czasu rzeczywistego (ciągłe rozmowy) i **załączniki wiadomości głosowych** (format podglądu przebiegu fali). Gateway obsługuje obie.

### Kanały głosowe

Lista kontrolna konfiguracji:

1. Włącz Message Content Intent w Discord Developer Portal.
2. Włącz Server Members Intent, gdy używane są listy dozwolonych ról/użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Nadaj uprawnienia Connect, Speak, Send Messages i Read Message History w docelowym kanale głosowym.
5. Włącz natywne polecenia (`commands.native` albo `channels.discord.commands.native`).
6. Skonfiguruj `channels.discord.voice`.

Użyj `/vc join|leave|status`, aby kontrolować sesje. Polecenie używa domyślnego agenta konta i stosuje te same reguły list dozwolonych oraz polityki grup co inne polecenia Discord.

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

- `voice.tts` zastępuje `messages.tts` tylko dla odtwarzania głosu.
- `voice.model` zastępuje LLM używany tylko do odpowiedzi kanału głosowego Discord. Pozostaw nieustawione, aby odziedziczyć model trasowanego agenta.
- STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- Nadpisania `systemPrompt` Discord dla poszczególnych kanałów mają zastosowanie do tur transkrypcji głosowej w tym kanale głosowym.
- Tury transkrypcji głosowej wywodzą status właściciela z Discord `allowFrom` (albo `dm.allowFrom`); mówcy niebędący właścicielami nie mogą uzyskiwać dostępu do narzędzi tylko dla właściciela (na przykład `gateway` i `cron`).
- Głos Discord jest opcjonalny dla konfiguracji tylko tekstowych; ustaw `channels.discord.voice.enabled=true` (albo zachowaj istniejący blok `channels.discord.voice`), aby włączyć polecenia `/vc`, środowisko uruchomieniowe głosu i intencję gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` może jawnie nadpisać subskrypcję intencji stanu głosu. Pozostaw nieustawione, aby intencja podążała za efektywnym włączeniem głosu.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- `voice.connectTimeoutMs` kontroluje początkowe oczekiwanie Ready `@discordjs/voice` dla `/vc join` i prób automatycznego dołączania. Domyślnie: `30000`.
- `voice.reconnectGraceMs` kontroluje, jak długo OpenClaw czeka, aż rozłączona sesja głosowa zacznie ponowne łączenie, zanim ją zniszczy. Domyślnie: `15000`.
- OpenClaw obserwuje również błędy odszyfrowywania odbioru i automatycznie przywraca działanie, opuszczając kanał głosowy i dołączając do niego ponownie po powtarzających się awariach w krótkim oknie.
- Jeśli po aktualizacji logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, zbierz raport zależności i logi. Dołączona linia `@discordjs/voice` zawiera poprawkę upstream padding z PR discord.js #11449, która zamknęła issue discord.js #11419.

Potok kanału głosowego:

- Przechwycony PCM Discord jest konwertowany na tymczasowy plik WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypcja jest wysyłana przez wejście i trasowanie Discord, a LLM odpowiedzi działa z polityką wyjścia głosowego, która ukrywa narzędzie agenta `tts` i prosi o zwrócony tekst, ponieważ Discord voice odpowiada za końcowe odtwarzanie TTS.
- `voice.model`, gdy jest ustawione, zastępuje tylko LLM odpowiedzi dla tej tury kanału głosowego.
- `voice.tts` jest scalane nad `messages.tts`; wynikowy dźwięk jest odtwarzany w dołączonym kanale.

Poświadczenia są rozstrzygane dla każdego komponentu: uwierzytelnianie trasy LLM dla `voice.model`, uwierzytelnianie STT dla `tools.media.audio` oraz uwierzytelnianie TTS dla `messages.tts`/`voice.tts`.

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd przebiegu fali i wymagają dźwięku OGG/Opus. OpenClaw generuje przebieg fali automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście gateway, aby sprawdzać i konwertować.

- Podaj **lokalną ścieżkę pliku** (adresy URL są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst + wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw konwertuje do OGG/Opus według potrzeby.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy zależysz od rozstrzygania użytkowników/członków
    - uruchom ponownie gateway po zmianie intencji

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - zweryfikuj `groupPolicy`
    - zweryfikuj listę dozwolonych gildii pod `channels.discord.guilds`
    - jeśli mapa `channels` gildii istnieje, dozwolone są tylko wymienione kanały
    - zweryfikuj zachowanie `requireMention` i wzorce wzmianek

    Przydatne kontrole:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych gildii/kanałów
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi znajdować się pod `channels.discord.guilds` albo we wpisie kanału)
    - nadawca zablokowany przez listę dozwolonych `users` gildii/kanału

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Typowe logi:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Pokrętła kolejki gateway Discord:

    - jedno konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - kontroluje to tylko pracę listenera gateway Discord, nie czas życia tury agenta

    Discord nie stosuje limitu czasu należącego do kanału wobec kolejkowanych tur agenta. Listenery wiadomości przekazują zadanie natychmiast, a kolejkowane uruchomienia Discord zachowują kolejność w obrębie sesji, dopóki cykl życia sesji/narzędzia/środowiska uruchomieniowego nie zakończy się albo nie przerwie pracy.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw pobiera metadane Discord `/gateway/bot` przed połączeniem. Przejściowe awarie wracają do domyślnego adresu URL gateway Discord i są limitowane w logach.

    Pokrętła limitu czasu metadanych:

    - jedno konto: `channels.discord.gatewayInfoTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - awaryjna zmienna środowiskowa, gdy konfiguracja jest nieustawiona: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - domyślnie: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Ponowne uruchomienia po przekroczeniu limitu czasu READY Gateway">
    OpenClaw czeka na zdarzenie `READY` Gateway Discord podczas uruchamiania i po ponownych połączeniach w czasie działania. Konfiguracje z wieloma kontami i rozłożonym w czasie startem mogą wymagać dłuższego okna READY podczas uruchamiania niż domyślne.

    Parametry limitu czasu READY:

    - uruchamianie, jedno konto: `channels.discord.gatewayReadyTimeoutMs`
    - uruchamianie, wiele kont: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - awaryjna wartość env podczas uruchamiania, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - domyślna wartość uruchamiania: `15000` (15 sekund), maks.: `120000`
    - czas działania, jedno konto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - czas działania, wiele kont: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - awaryjna wartość env w czasie działania, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - domyślna wartość czasu działania: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Kontrole uprawnień `channels status --probe` działają tylko dla numerycznych identyfikatorów kanałów.

    Jeśli używasz kluczy slug, dopasowywanie w czasie działania nadal może działać, ale probe nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - zasady DM wyłączone: `channels.discord.dmPolicy="disabled"` (starsze: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot do bota">
    Domyślnie wiadomości utworzone przez boty są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, użyj ścisłych reguł wzmianek i listy dozwolonych, aby uniknąć zachowania pętli.
    Preferuj `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota.

  </Accordion>

  <Accordion title="Zaniki STT głosu z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby logika odzyskiwania odbioru głosu Discord była dostępna
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy nadal występują po automatycznym ponownym dołączeniu, zbierz logi i porównaj je z upstreamową historią odbioru DAVE w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) i [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Odniesienie konfiguracji

Główne odniesienie: [Odniesienie konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="Najważniejsze pola Discord">

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- zasady: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenie: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- odpowiedź/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponawianie: `mediaMaxMb` (ogranicza wychodzące przesyłanie do Discord, domyślnie `100MB`), `retry`
- działania: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (`DISCORD_BOT_TOKEN` preferowane w nadzorowanych środowiskach).
- Przyznawaj minimalne wymagane uprawnienia Discord.
- Jeśli wdrożenie/stan poleceń jest nieaktualny, zrestartuj Gateway i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discord z Gateway.
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
    Mapuj guilds i kanały do agentów.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń.
  </Card>
</CardGroup>
