---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-05-04T02:21:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: df4e045e39f8977f779fe409abf41dad0d950c92f1230c51ff356343513df812
    source_path: channels/discord.md
    workflow: 16
---

Gotowe do wiadomości prywatnych i kanałów serwera za pośrednictwem oficjalnego Discord gateway.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Discord domyślnie uruchamiają tryb parowania.
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
  <Step title="Utwórz aplikację Discord i bota">
    Przejdź do [Discord Developer Portal](https://discord.com/developers/applications) i kliknij **New Application**. Nazwij ją na przykład „OpenClaw”.

    Kliknij **Bot** na pasku bocznym. Ustaw **Username** na nazwę, której używasz dla swojego agenta OpenClaw.

  </Step>

  <Step title="Włącz uprzywilejowane intencje">
    Nadal na stronie **Bot** przewiń w dół do **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazw do ID)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem w górę na stronie **Bot** i kliknij **Reset Token**.

    <Note>
    Wbrew nazwie generuje to pierwszy token — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To Twój **Bot Token** i wkrótce będzie Ci potrzebny.

  </Step>

  <Step title="Wygeneruj URL zaproszenia i dodaj bota do serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do swojego serwera.

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
      - Załączanie plików
      - Dodawanie reakcji (opcjonalne)

    To podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w przepływach kanałów forum lub multimediów, które tworzą albo kontynuują wątek, włącz też **Send Messages in Threads**.
    Skopiuj wygenerowany URL na dole, wklej go do przeglądarki, wybierz swój serwer i kliknij **Continue**, aby połączyć. Teraz bot powinien być widoczny na serwerze Discord.

  </Step>

  <Step title="Włącz Developer Mode i zbierz swoje ID">
    W aplikacji Discord musisz włączyć Developer Mode, aby móc kopiować wewnętrzne ID.

    1. Kliknij **User Settings** (ikona koła zębatego obok awatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem **własny awatar** → **Copy User ID**

    Zapisz **Server ID** i **User ID** razem z Bot Token — wszystkie trzy wyślesz do OpenClaw w następnym kroku.

  </Step>

  <Step title="Zezwól na wiadomości prywatne od członków serwera">
    Aby parowanie działało, Discord musi pozwalać botowi wysyłać do Ciebie wiadomości prywatne. Kliknij prawym przyciskiem **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać Ci wiadomości prywatne. Pozostaw to włączone, jeśli chcesz używać wiadomości prywatnych Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, możesz wyłączyć wiadomości prywatne po parowaniu.

  </Step>

  <Step title="Ustaw token bota bezpiecznie (nie wysyłaj go na czacie)">
    Token bota Discord jest sekretem (jak hasło). Ustaw go na maszynie uruchamiającej OpenClaw, zanim napiszesz do agenta.

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
    W instalacjach z usługą zarządzaną uruchom `openclaw gateway install` z powłoki, w której obecny jest `DISCORD_BOT_TOKEN`, albo zapisz zmienną w `~/.openclaw/.env`, aby usługa mogła rozwiązać env SecretRef po ponownym uruchomieniu.
    Jeśli host jest blokowany lub ograniczany limitami przez początkowe wyszukiwanie aplikacji Discord, ustaw ID aplikacji/klienta Discord z Developer Portal, aby uruchamianie mogło pominąć to wywołanie REST. Użyj `channels.discord.applicationId` dla konta domyślnego albo `channels.discord.accounts.<accountId>.applicationId`, gdy uruchamiasz wiele botów Discord.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i powiedz mu. Jeśli Discord jest Twoim pierwszym kanałem, użyj zamiast tego karty CLI / config.

        > „Ustawiłem już token mojego bota Discord w konfiguracji. Dokończ konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`.”
      </Tab>
      <Tab title="CLI / config">
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

        Awaryjna wartość env dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        W przypadku konfiguracji skryptowej lub zdalnej zapisz ten sam blok JSON5 przy użyciu `openclaw config patch --file ./discord.patch.json5 --dry-run`, a następnie uruchom ponownie bez `--dry-run`. Wartości `token` w tekście jawnym są obsługiwane. Wartości SecretRef są też obsługiwane dla `channels.discord.token` w dostawcach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

        W przypadku wielu botów Discord trzymaj token każdego bota i ID aplikacji pod jego kontem. `channels.discord.applicationId` na najwyższym poziomie jest dziedziczone przez konta, więc ustaw je tam tylko wtedy, gdy każde konto powinno używać tego samego ID aplikacji.

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

    Teraz możesz rozmawiać ze swoim agentem w Discord przez wiadomość prywatną.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenów uwzględnia konta. Wartości tokenów z konfiguracji mają pierwszeństwo przed awaryjną wartością env. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
Jeśli dwa włączone konta Discord rozwiążą się do tego samego tokena bota, OpenClaw uruchamia tylko jeden monitor Gateway dla tego tokena. Token pochodzący z konfiguracji ma pierwszeństwo przed domyślną awaryjną wartością env; w przeciwnym razie pierwsze włączone konto wygrywa, a zduplikowane konto jest zgłaszane jako wyłączone.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/akcje kanału) jawny `token` dla pojedynczego wywołania jest używany dla tego wywołania. Dotyczy to akcji wysyłania oraz akcji typu odczyt/sonda (na przykład read/search/fetch/thread/pins/permissions). Ustawienia zasad konta i ponowień nadal pochodzą z wybranego konta w aktywnym zrzucie środowiska uruchomieniowego.
</Note>

## Zalecane: Skonfiguruj przestrzeń roboczą serwera

Gdy wiadomości prywatne już działają, możesz skonfigurować swój serwer Discord jako pełną przestrzeń roboczą, w której każdy kanał otrzymuje własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteś tylko Ty i Twój bot.

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

  <Step title="Zezwól na odpowiedzi bez @wzmianki">
    Domyślnie agent odpowiada w kanałach serwera tylko wtedy, gdy zostanie @wspomniany. Na prywatnym serwerze prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    W kanałach serwera zwykłe końcowe odpowiedzi asystenta domyślnie pozostają prywatne. Widoczne wyjście Discord musi zostać wysłane jawnie przy użyciu narzędzia `message`, dzięki czemu agent może domyślnie obserwować i publikować tylko wtedy, gdy uzna, że odpowiedź w kanale jest przydatna.

    Oznacza to, że wybrany model musi niezawodnie wywoływać narzędzia. Jeśli Discord pokazuje pisanie, a logi pokazują użycie tokenów, ale wiadomość nie została opublikowana, sprawdź log sesji pod kątem tekstu asystenta z `didSendViaMessagingTool: false`. Oznacza to, że model wygenerował prywatną końcową odpowiedź zamiast wywołać `message(action=send)`. Przełącz na silniejszy model wywołujący narzędzia albo użyj poniższej konfiguracji, aby przywrócić starsze automatyczne odpowiedzi końcowe.

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
        Jeśli potrzebujesz wspólnego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Przechowuj notatki długoterminowe w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał otrzymuje własną izolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` albo cokolwiek pasuje do Twojego przepływu pracy.

## Model środowiska uruchomieniowego

- Gateway jest właścicielem połączenia Discord.
- Routing odpowiedzi jest deterministyczny: przychodzące odpowiedzi z Discord wracają do Discord.
- Metadane gildii/kanału Discord są dodawane do promptu modelu jako niezaufany
  kontekst, a nie jako widoczny dla użytkownika prefiks odpowiedzi. Jeśli model skopiuje tę kopertę
  z powrotem, OpenClaw usuwa skopiowane metadane z odpowiedzi wychodzących oraz z
  przyszłego kontekstu odtwarzania.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały gildii mają izolowane klucze sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia slash działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), nadal przenosząc `CommandTargetSessionKey` do routowanej sesji rozmowy.
- Dostarczanie tekstowych ogłoszeń cron/heartbeat do Discord używa końcowej
  odpowiedzi widocznej dla asystenta jeden raz. Multimedia i strukturalne ładunki komponentów pozostają
  wieloma wiadomościami, gdy agent emituje wiele dostarczalnych ładunków.

## Kanały forum

Kanały forum i multimedialne Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

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

OpenClaw obsługuje kontenery komponentów v2 Discord dla wiadomości agentów. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są routowane z powrotem do agenta jako zwykłe wiadomości przychodzące i stosują istniejące ustawienia Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji dopuszczają do 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowego użytku. Ustaw `components.reusable=true`, aby umożliwić wielokrotne używanie przycisków, list wyboru i formularzy aż do ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` na tym przycisku (identyfikatory użytkowników Discord, tagi albo `*`). Po skonfigurowaniu niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Polecenia slash `/model` i `/models` otwierają interaktywny selektor modelu z listami rozwijanymi dostawcy, modelu i zgodnego środowiska uruchomieniowego oraz krokiem Prześlij. `/models add` jest przestarzałe i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu. Odpowiedź selektora jest efemeryczna i może jej użyć tylko wywołujący użytkownik.

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
  <Tab title="Zasady DM">
    `channels.discord.dmPolicy` kontroluje dostęp przez DM. `channels.discord.allowFrom` jest kanoniczną listą dozwolonych nadawców DM.

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`)
    - `disabled`

    Jeśli zasady DM nie są otwarte, nieznani użytkownicy są blokowani (albo proszeni o parowanie w trybie `pairing`).

    Priorytet przy wielu kontach:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Dla jednego konta `allowFrom` ma pierwszeństwo przed starszym `dm.allowFrom`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` i starsze `dm.allowFrom` nie są ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Starsze `channels.discord.dm.policy` i `channels.discord.dm.allowFrom` są nadal odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Format celu DM dla dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same identyfikatory liczbowe zwykle są rozpoznawane jako identyfikatory kanałów, gdy aktywna jest domyślna wartość kanału, ale identyfikatory wymienione w efektywnym `allowFrom` DM konta są traktowane jako cele DM użytkowników dla zgodności.

  </Tab>

  <Tab title="Grupy dostępu DM">
    DM Discord mogą używać dynamicznych wpisów `accessGroup:<name>` w `channels.discord.allowFrom`.

    Nazwy grup dostępu są współdzielone między kanałami wiadomości. Użyj `type: "message.senders"` dla statycznej grupy, której członkowie są wyrażeni w zwykłej składni `allowFrom` danego kanału, albo `type: "discord.channelAudience"`, gdy bieżąca publiczność `ViewChannel` kanału Discord powinna dynamicznie definiować członkostwo. Wspólne zachowanie grup dostępu jest udokumentowane tutaj: [Grupy dostępu](/pl/channels/access-groups).

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

    Kanał tekstowy Discord nie ma oddzielnej listy członków. `type: "discord.channelAudience"` modeluje członkostwo tak: nadawca DM jest członkiem skonfigurowanej gildii i obecnie ma efektywne uprawnienie `ViewChannel` na skonfigurowanym kanale po zastosowaniu nadpisań ról i kanału.

    Przykład: zezwól każdemu, kto widzi `#maintainers`, na wysyłanie DM do bota, zachowując DM zamknięte dla wszystkich innych.

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

    Włącz **Server Members Intent** w Discord Developer Portal dla bota, gdy używasz grup dostępu opartych na publiczności kanału. DM nie zawierają stanu członka gildii, więc OpenClaw rozpoznaje członka przez Discord REST w czasie autoryzacji.

  </Tab>

  <Tab title="Zasady gildii">
    Obsługa gildii jest kontrolowana przez `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczną bazą, gdy istnieje `channels.discord`, jest `allowlist`.

    Zachowanie `allowlist`:

    - gildia musi pasować do `channels.discord.guilds` (zalecane `id`, slug akceptowany)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli którakolwiek jest skonfigurowana, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy z nazwami/tagami
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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, awaryjna wartość środowiska uruchomieniowego to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Wzmianki i grupowe DM">
    Wiadomości gildii są domyślnie ograniczone wymogiem wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    Podczas pisania wychodzących wiadomości Discord używaj kanonicznej składni wzmianek: `<@USER_ID>` dla użytkowników, `<#CHANNEL_ID>` dla kanałów i `<@&ROLE_ID>` dla ról. Nie używaj starszej formy wzmianki pseudonimu `<@!USER_ID>`.

    `requireMention` jest konfigurowane dla gildii/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów albo slugi)

  </Tab>
</Tabs>

### Routing agenta na podstawie ról

Użyj `bindings[].match.roles`, aby routować członków gildii Discord do różnych agentów według identyfikatora roli. Powiązania oparte na rolach akceptują tylko identyfikatory ról i są oceniane po powiązaniach peer lub parent-peer oraz przed powiązaniami tylko dla gildii. Jeśli powiązanie ustawia także inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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

- Domyślną wartością `commands.native` jest `"auto"` i jest ona włączona dla Discord.
- Nadpisanie dla kanału: `channels.discord.commands.native`.
- `commands.native=false` pomija rejestrację poleceń ukośnikowych Discord i czyszczenie podczas uruchamiania. Wcześniej zarejestrowane polecenia mogą pozostać widoczne w Discord, dopóki nie usuniesz ich z aplikacji Discord.
- Autoryzacja poleceń natywnych używa tych samych list dozwolonych/polityk Discord co normalna obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discord dla użytkowników, którzy nie są autoryzowani; wykonanie nadal wymusza autoryzację OpenClaw i zwraca „brak autoryzacji”.

Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands), aby poznać katalog poleceń i ich zachowanie.

Domyślne ustawienia poleceń ukośnikowych:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Znaczniki odpowiedzi i odpowiedzi natywne">
    Discord obsługuje znaczniki odpowiedzi w wyjściu agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Sterowane przez `channels.discord.replyToMode`:

    - `off` (domyślnie)
    - `first`
    - `all`
    - `batched`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne znaczniki `[[reply_to_*]]` są nadal honorowane.
    `first` zawsze dołącza niejawną natywną referencję odpowiedzi do pierwszej wychodzącej wiadomości Discord w danej turze.
    `batched` dołącza niejawną natywną referencję odpowiedzi Discord tylko wtedy, gdy
    przychodząca tura była odroczoną partią wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie dla niejednoznacznych, gwałtownych czatów, a nie dla każdej
    tury z pojedynczą wiadomością.

    Identyfikatory wiadomości są udostępniane w kontekście/historii, aby agenci mogli kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Podgląd strumienia na żywo">
    OpenClaw może strumieniować wersje robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływania tekstu. `channels.discord.streaming` przyjmuje `off` (domyślnie) | `partial` | `block` | `progress`. `progress` utrzymuje jedną edytowalną wersję roboczą statusu i aktualizuje ją postępem narzędzi aż do finalnego dostarczenia; `streamMode` jest starszym aliasem i jest automatycznie migrowany.

    Domyślnie pozostaje `off`, ponieważ edycje podglądu Discord szybko trafiają na limity szybkości, gdy wiele botów lub bram współdzieli jedno konto.

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
    - `block` emituje fragmenty o rozmiarze wersji roboczej (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału, ograniczone przez `textChunkLimit`).
    - Media, błędy i finalne odpowiedzi z jawną odpowiedzią anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie używają wiadomości podglądu.

    Strumieniowanie podglądu obsługuje tylko tekst; odpowiedzi multimedialne wracają do normalnego dostarczania. Gdy strumieniowanie `block` jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii gildii:

    - domyślna wartość `channels.discord.historyLimit` to `20`
    - wartość zapasowa: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrolki historii wiadomości prywatnych:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są kierowane jako sesje kanałów i dziedziczą konfigurację kanału nadrzędnego, chyba że zostaną nadpisane.
    - Sesje wątków dziedziczą wybór `/model` na poziomie sesji z kanału nadrzędnego jako zapasowy wybór wyłącznie modelu; lokalne wybory `/model` w wątku nadal mają pierwszeństwo, a historia transkrypcji nadrzędnej nie jest kopiowana, chyba że włączono dziedziczenie transkrypcji.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) włącza zasiewanie nowych automatycznych wątków z transkrypcji nadrzędnej. Nadpisania dla kont znajdują się w `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozwiązywać cele wiadomości prywatnych `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas zapasowej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych kontrolują, kto może wyzwolić agenta, ale nie stanowią pełnej granicy redakcji dodatkowego kontekstu.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkami dla podagentów">
    Discord może powiązać wątek z celem sesji, aby kolejne wiadomości w tym wątku były nadal kierowane do tej samej sesji (w tym sesji podagentów).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem podagenta/sesji
    - `/unfocus` usuń powiązanie bieżącego wątku
    - `/agents` pokaż aktywne uruchomienia i stan powiązania
    - `/session idle <duration|off>` sprawdź/zaktualizuj automatyczne usunięcie fokusu po bezczynności dla powiązań z fokusem
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
    - `spawnSessions` kontroluje automatyczne tworzenie/powiązywanie wątków dla `sessions_spawn({ thread: true })` i odrodzeń wątków ACP. Domyślnie: `true`.
    - `defaultSpawnContext` kontroluje natywny kontekst podagenta dla odrodzeń powiązanych z wątkiem. Domyślnie: `"fork"`.
    - Przestarzałe klucze `spawnSubagentSessions`/`spawnAcpSessions` są migrowane przez `openclaw doctor --fix`.
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązań wątków są niedostępne.

    Zobacz [Podagenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) i [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe powiązania kanałów ACP">
    Dla stabilnych, „zawsze włączonych” obszarów roboczych ACP skonfiguruj powiązania ACP z typami najwyższego poziomu, kierowane do konwersacji Discord.

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
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP w miejscu. Tymczasowe powiązania wątku mogą nadpisywać rozwiązywanie celu, gdy są aktywne.
    - `spawnSessions` kontroluje tworzenie/powiązywanie wątków podrzędnych przez `--thread auto|here`.

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

    - Discord akceptuje emoji Unicode lub nazwy niestandardowych emoji.
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
    Kieruj ruch WebSocket Gateway Discord i startowe wyszukiwania REST (identyfikator aplikacji + rozwiązywanie listy dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

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
    - jeśli wyszukiwanie się nie powiedzie, proxowane wiadomości są traktowane jako wiadomości botów i odrzucane, chyba że `allowBots=true`

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
    Aktualizacje obecności są stosowane, gdy ustawisz pole statusu lub aktywności albo gdy włączysz automatyczną obecność.

    Przykład tylko statusu:

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

    Automatyczna obecność mapuje dostępność środowiska uruchomieniowego na status Discord: zdrowe => online, zdegradowane lub nieznane => idle, wyczerpane lub niedostępne => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discord">
    Discord obsługuje zatwierdzenia oparte na przyciskach w wiadomościach prywatnych i może opcjonalnie publikować monity zatwierdzeń w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; gdy to możliwe, używa awaryjnie `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` jest nieustawione albo ma wartość `"auto"` i można rozpoznać co najmniej jedną osobę zatwierdzającą, z `execApprovals.approvers` albo z `commands.ownerAllowFrom`. Discord nie wyprowadza osób zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzania.

    W przypadku wrażliwych poleceń grupowych tylko dla właściciela, takich jak `/diagnostics` i `/export-trajectory`, OpenClaw wysyła monity zatwierdzenia i końcowe wyniki prywatnie. Najpierw próbuje wiadomości prywatnej Discord, gdy właściciel wywołujący ma trasę właściciela Discord; jeśli nie jest ona dostępna, używa awaryjnie pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, takiej jak Telegram.

    Gdy `target` ma wartość `channel` albo `both`, monit zatwierdzenia jest widoczny w kanale. Tylko rozpoznane osoby zatwierdzające mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Monity zatwierdzenia zawierają tekst polecenia, więc włączaj dostarczanie do kanału tylko w zaufanych kanałach. Jeśli identyfikatora kanału nie da się wyprowadzić z klucza sesji, OpenClaw używa awaryjnie dostarczania przez wiadomość prywatną.

    Discord renderuje też współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Discord dodaje głównie trasowanie wiadomości prywatnych do osób zatwierdzających oraz rozgłaszanie do kanałów.
    Gdy te przyciski są obecne, są podstawowym UX zatwierdzania; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia wskazuje,
    że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    Jeśli natywne środowisko zatwierdzania Discord nie jest aktywne, OpenClaw pozostawia
    widoczny lokalny deterministyczny monit `/approve <id> <decision>`. Jeśli
    środowisko jest aktywne, ale natywnej karty nie da się dostarczyć do żadnego celu,
    OpenClaw wysyła w tym samym czacie powiadomienie awaryjne z dokładnym poleceniem `/approve`
    z oczekującego zatwierdzenia.

    Uwierzytelnianie Gateway i rozpoznawanie zatwierdzeń są zgodne ze współdzielonym kontraktem klienta Gateway (identyfikatory `plugin:` są rozpoznawane przez `plugin.approval.resolve`; inne identyfikatory przez `exec.approval.resolve`). Zatwierdzenia domyślnie wygasają po 30 minutach.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki akcji

Akcje wiadomości Discord obejmują akcje wiadomości, administracji kanałem, moderacji, obecności i metadanych.

Podstawowe przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Akcja `event-create` przyjmuje opcjonalny parametr `image` (URL albo lokalną ścieżkę pliku), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki akcji znajdują się w `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa akcji                                                                                                                                                              | Domyślnie  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone   |
| roles                                                                                                                                                                    | wyłączone  |
| moderation                                                                                                                                                               | wyłączone  |
| presence                                                                                                                                                                 | wyłączone  |

## Interfejs Components v2

OpenClaw używa komponentów Discord v2 do zatwierdzeń exec i znaczników między kontekstami. Akcje wiadomości Discord mogą także przyjmować `components` dla niestandardowego interfejsu (zaawansowane; wymaga skonstruowania ładunku komponentu przez narzędzie discord), natomiast starsze `embeds` pozostają dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustaw dla konta za pomocą `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord ma dwie odrębne powierzchnie głosowe: **kanały głosowe** w czasie rzeczywistym (ciągłe rozmowy) oraz **załączniki wiadomości głosowych** (format podglądu fali dźwiękowej). Gateway obsługuje oba.

### Kanały głosowe

Lista kontrolna konfiguracji:

1. Włącz Message Content Intent w Discord Developer Portal.
2. Włącz Server Members Intent, gdy używane są listy dozwolonych ról/użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Przyznaj uprawnienia Connect, Speak, Send Messages i Read Message History w docelowym kanale głosowym.
5. Włącz natywne polecenia (`commands.native` albo `channels.discord.commands.native`).
6. Skonfiguruj `channels.discord.voice`.

Użyj `/vc join|leave|status`, aby sterować sesjami. Polecenie używa domyślnego agenta konta i przestrzega tych samych reguł listy dozwolonych oraz zasad grupowych co inne polecenia Discord.

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
- `voice.model` zastępuje LLM używany tylko dla odpowiedzi kanału głosowego Discord. Pozostaw nieustawione, aby odziedziczyć model trasowanego agenta.
- STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- Nadpisania `systemPrompt` dla poszczególnych kanałów Discord mają zastosowanie do tur transkryptu głosowego dla tego kanału głosowego.
- Tury transkryptu głosowego wyprowadzają status właściciela z `allowFrom` Discord (albo `dm.allowFrom`); mówcy niebędący właścicielami nie mogą uzyskiwać dostępu do narzędzi tylko dla właściciela (na przykład `gateway` i `cron`).
- Głos Discord jest opt-in dla konfiguracji tekstowych; ustaw `channels.discord.voice.enabled=true` (albo pozostaw istniejący blok `channels.discord.voice`), aby włączyć polecenia `/vc`, środowisko głosowe i intencję gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` może jawnie zastąpić subskrypcję intencji stanu głosu. Pozostaw nieustawione, aby intencja podążała za efektywnym włączeniem głosu.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- `voice.connectTimeoutMs` kontroluje początkowe oczekiwanie Ready `@discordjs/voice` dla prób `/vc join` i automatycznego dołączania. Domyślnie: `30000`.
- `voice.reconnectGraceMs` kontroluje, jak długo OpenClaw czeka, aż rozłączona sesja głosowa zacznie ponownie się łączyć, zanim ją zniszczy. Domyślnie: `15000`.
- OpenClaw obserwuje także błędy odszyfrowywania odbioru i automatycznie przywraca działanie przez opuszczenie kanału głosowego i ponowne dołączenie po powtarzających się błędach w krótkim oknie.
- Jeśli po aktualizacji logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, zbierz raport zależności i logi. Dołączona linia `@discordjs/voice` zawiera upstreamową poprawkę dopełniania z PR discord.js #11449, która zamknęła zgłoszenie discord.js #11419.

Potok kanału głosowego:

- Przechwytywanie PCM Discord jest konwertowane na tymczasowy plik WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypt jest wysyłany przez wejście i trasowanie Discord, a LLM odpowiedzi działa z zasadą wyjścia głosowego, która ukrywa narzędzie `tts` agenta i prosi o zwrócony tekst, ponieważ głos Discord odpowiada za końcowe odtwarzanie TTS.
- `voice.model`, gdy jest ustawione, zastępuje tylko LLM odpowiedzi dla tej tury kanału głosowego.
- `voice.tts` jest scalane nad `messages.tts`; wynikowy dźwięk jest odtwarzany w dołączonym kanale.

Dane uwierzytelniające są rozpoznawane dla każdego komponentu: uwierzytelnianie trasy LLM dla `voice.model`, uwierzytelnianie STT dla `tools.media.audio` oraz uwierzytelnianie TTS dla `messages.tts`/`voice.tts`.

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd fali dźwiękowej i wymagają dźwięku OGG/Opus. OpenClaw generuje falę automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście gateway, aby sprawdzać i konwertować.

- Podaj **lokalną ścieżkę pliku** (URL-e są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst + wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw w razie potrzeby konwertuje do OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji albo bot nie widzi wiadomości gildii">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy zależy Ci na rozpoznawaniu użytkowników/członków
    - uruchom ponownie gateway po zmianie intencji

  </Accordion>

  <Accordion title="Wiadomości gildii są nieoczekiwanie blokowane">

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

  <Accordion title="Wymaganie wzmianki jest fałszywe, ale nadal blokuje">
    Częste przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych gildii/kanałów
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi znajdować się pod `channels.discord.guilds` albo we wpisie kanału)
    - nadawca zablokowany przez listę dozwolonych `users` gildii/kanału

  </Accordion>

  <Accordion title="Długotrwałe tury Discord albo zduplikowane odpowiedzi">

    Typowe logi:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Pokrętła kolejki Gateway Discord:

    - pojedyncze konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - to kontroluje tylko pracę odbiornika Gateway Discord, nie czas życia tury agenta

    Discord nie stosuje limitu czasu należącego do kanału do zakolejkowanych tur agenta. Odbiorniki wiadomości przekazują pracę natychmiast, a zakolejkowane przebiegi Discord zachowują kolejność w ramach sesji do czasu zakończenia cyklu życia sesji/narzędzia/środowiska albo przerwania pracy.

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

  <Accordion title="Ostrzeżenia o limicie czasu wyszukiwania metadanych Gateway">
    OpenClaw pobiera metadane Discord `/gateway/bot` przed połączeniem. Przejściowe błędy używają awaryjnie domyślnego URL-a gateway Discord i są ograniczane częstotliwościowo w logach.

    Pokrętła limitu czasu metadanych:

    - pojedyncze konto: `channels.discord.gatewayInfoTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - awaryjna wartość env, gdy konfiguracja jest nieustawiona: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - domyślnie: `30000` (30 sekund), maksimum: `120000`

  </Accordion>

  <Accordion title="Ponowne uruchomienia po przekroczeniu limitu czasu Gateway READY">
    OpenClaw czeka podczas uruchamiania i po ponownych połączeniach w czasie działania na zdarzenie `READY` Gateway Discorda. Konfiguracje z wieloma kontami i stopniowanym uruchamianiem mogą wymagać dłuższego okna READY przy uruchamianiu niż domyślne.

    Parametry limitu czasu READY:

    - uruchamianie, jedno konto: `channels.discord.gatewayReadyTimeoutMs`
    - uruchamianie, wiele kont: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - zapasowa wartość env przy uruchamianiu, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - domyślna wartość przy uruchamianiu: `15000` (15 sekund), maks.: `120000`
    - czas działania, jedno konto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - czas działania, wiele kont: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - zapasowa wartość env w czasie działania, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - domyślna wartość w czasie działania: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Kontrole uprawnień `channels status --probe` działają tylko dla numerycznych identyfikatorów kanałów.

    Jeśli używasz kluczy typu slug, dopasowanie w czasie działania nadal może działać, ale sonda nie może w pełni zweryfikować uprawnień.

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

  <Accordion title="Zrzucanie STT głosu z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby logika odzyskiwania odbioru głosu Discord była obecna
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostosuj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy będą się utrzymywać po automatycznym ponownym dołączeniu, zbierz logi i porównaj je z historią odbioru upstream DAVE w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) i [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="Najważniejsze pola Discord">

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- polityka: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenie: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- odpowiedź/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponawianie: `mediaMaxMb` (ogranicza wychodzące przesyłanie do Discord, domyślnie `100MB`), `retry`
- akcje: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (w środowiskach nadzorowanych preferowane `DISCORD_BOT_TOKEN`).
- Przyznawaj uprawnienia Discord zgodnie z zasadą najmniejszych uprawnień.
- Jeśli wdrożenie/stan poleceń jest nieaktualny, uruchom ponownie Gateway i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discord z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie czatu grupowego i listy dozwolonych.
  </Card>
  <Card title="Trasowanie kanałów" icon="route" href="/pl/channels/channel-routing">
    Trasuj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i wzmacnianie zabezpieczeń.
  </Card>
  <Card title="Trasowanie wieloagentowe" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj gildie i kanały na agentów.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń.
  </Card>
</CardGroup>
