---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

Gotowe do wiadomości prywatnych i kanałów serwera za pośrednictwem oficjalnego Gateway Discord.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Discord domyślnie używają trybu parowania.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Natywne działanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i przepływ naprawczy.
  </Card>
</CardGroup>

## Szybka konfiguracja

Musisz utworzyć nową aplikację z botem, dodać bota do swojego serwera i sparować go z OpenClaw. Zalecamy dodanie bota do własnego prywatnego serwera. Jeśli jeszcze go nie masz, [najpierw go utwórz](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wybierz **Create My Own > For me and my friends**).

<Steps>
  <Step title="Utwórz aplikację Discord i bota">
    Przejdź do [Discord Developer Portal](https://discord.com/developers/applications) i kliknij **New Application**. Nadaj jej nazwę w rodzaju „OpenClaw”.

    Kliknij **Bot** na pasku bocznym. Ustaw **Username** na nazwę, której używasz dla swojego agenta OpenClaw.

  </Step>

  <Step title="Włącz uprzywilejowane intencje">
    Nadal na stronie **Bot** przewiń w dół do **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazw do ID)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem w górę strony **Bot** i kliknij **Reset Token**.

    <Note>
    Mimo nazwy generuje to Twój pierwszy token — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To Twój **Bot Token** i będzie Ci za chwilę potrzebny.

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

    To podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w przepływach kanałów forum lub multimediów, które tworzą albo kontynuują wątek, włącz też **Send Messages in Threads**.
    Skopiuj wygenerowany adres URL na dole, wklej go w przeglądarce, wybierz swój serwer i kliknij **Continue**, aby połączyć. Bot powinien być teraz widoczny na serwerze Discord.

  </Step>

  <Step title="Włącz tryb deweloperski i zbierz swoje ID">
    W aplikacji Discord musisz włączyć tryb deweloperski, aby móc kopiować wewnętrzne ID.

    1. Kliknij **User Settings** (ikona koła zębatego obok awatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem **własny awatar** → **Copy User ID**

    Zapisz swoje **Server ID** i **User ID** obok Bot Token — wyślesz wszystkie trzy do OpenClaw w następnym kroku.

  </Step>

  <Step title="Zezwól na wiadomości prywatne od członków serwera">
    Aby parowanie działało, Discord musi zezwalać botowi na wysyłanie do Ciebie wiadomości prywatnych. Kliknij prawym przyciskiem **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Pozwala to członkom serwera (w tym botom) wysyłać Ci wiadomości prywatne. Pozostaw tę opcję włączoną, jeśli chcesz używać wiadomości prywatnych Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, możesz wyłączyć wiadomości prywatne po sparowaniu.

  </Step>

  <Step title="Ustaw token bota bezpiecznie (nie wysyłaj go na czacie)">
    Token bota Discord jest sekretem (jak hasło). Ustaw go na maszynie uruchamiającej OpenClaw, zanim napiszesz do swojego agenta.

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

    Jeśli OpenClaw działa już jako usługa w tle, uruchom ją ponownie przez aplikację OpenClaw na Macu albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.
    W przypadku instalacji usługi zarządzanej uruchom `openclaw gateway install` z powłoki, w której dostępny jest `DISCORD_BOT_TOKEN`, albo zapisz zmienną w `~/.openclaw/.env`, aby usługa mogła rozwiązać SecretRef env po restarcie.
    Jeśli host jest blokowany lub ograniczany przez limity podczas wyszukiwania aplikacji startowej Discord, ustaw ID aplikacji/klienta Discord z Developer Portal, aby uruchamianie mogło pominąć to wywołanie REST. Użyj `channels.discord.applicationId` dla konta domyślnego albo `channels.discord.accounts.<accountId>.applicationId`, gdy uruchamiasz wiele botów Discord.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i przekaż mu informację. Jeśli Discord jest Twoim pierwszym kanałem, użyj zamiast tego karty CLI / konfiguracja.

        > „Mam już ustawiony token bota Discord w konfiguracji. Dokończ konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`.”
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

        Zapasowa wartość env dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        W przypadku konfiguracji skryptowej lub zdalnej zapisz ten sam blok JSON5 za pomocą `openclaw config patch --file ./discord.patch.json5 --dry-run`, a następnie uruchom ponownie bez `--dry-run`. Wartości `token` w postaci tekstu jawnego są obsługiwane. Wartości SecretRef są również obsługiwane dla `channels.discord.token` przez providerów env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

        W przypadku wielu botów Discord przechowuj każdy token bota i ID aplikacji pod jego kontem. Najwyższego poziomu `channels.discord.applicationId` jest dziedziczone przez konta, więc ustawiaj je tam tylko wtedy, gdy każde konto powinno używać tego samego ID aplikacji.

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
    Poczekaj, aż gateway będzie uruchomiony, a następnie wyślij wiadomość prywatną do bota w Discord. Odpowie kodem parowania.

    <Tabs>
      <Tab title="Zapytaj agenta">
        Wyślij kod parowania do swojego agenta na istniejącym kanale:

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
Rozwiązywanie tokenu uwzględnia konto. Wartości tokenu z konfiguracji mają pierwszeństwo przed zapasową wartością env. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
Jeśli dwa włączone konta Discord rozwiązują się do tego samego tokenu bota, OpenClaw uruchamia tylko jeden monitor gateway dla tego tokenu. Token pochodzący z konfiguracji ma pierwszeństwo przed domyślną zapasową wartością env; w przeciwnym razie wygrywa pierwsze włączone konto, a zduplikowane konto jest zgłaszane jako wyłączone.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/akcje kanału) jawny `token` na wywołanie jest używany dla tego wywołania. Dotyczy to akcji wysyłania i akcji typu odczyt/sondowanie (na przykład odczyt/wyszukiwanie/pobranie/wątek/przypięcia/uprawnienia). Zasady konta i ustawienia ponawiania nadal pochodzą z wybranego konta w aktywnej migawce runtime.
</Note>

## Zalecane: skonfiguruj przestrzeń roboczą serwera

Gdy wiadomości prywatne działają, możesz skonfigurować swój serwer Discord jako pełną przestrzeń roboczą, w której każdy kanał otrzymuje własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteś tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
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
    Domyślnie agent odpowiada w kanałach serwera tylko wtedy, gdy zostanie @wspomniany. W przypadku prywatnego serwera prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    W kanałach serwera zwykłe końcowe odpowiedzi asystenta domyślnie pozostają prywatne. Widoczne wyjście Discord musi być wysłane jawnie za pomocą narzędzia `message`, dzięki czemu agent może domyślnie obserwować i publikować tylko wtedy, gdy uzna, że odpowiedź w kanale jest przydatna.

    Oznacza to, że wybrany model musi niezawodnie wywoływać narzędzia. Jeśli Discord pokazuje pisanie, a logi pokazują użycie tokenów, ale nie ma opublikowanej wiadomości, sprawdź log sesji pod kątem tekstu asystenta z `didSendViaMessagingTool: false`. Oznacza to, że model wygenerował prywatną odpowiedź końcową zamiast wywołać `message(action=send)`. Przełącz się na mocniejszy model wywołujący narzędzia albo użyj poniższej konfiguracji, aby przywrócić starsze automatyczne odpowiedzi końcowe.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Pozwól mojemu agentowi odpowiadać na tym serwerze bez konieczności @wspominania go”
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
        Jeśli potrzebujesz współdzielonego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Przechowuj notatki długoterminowe w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał otrzymuje własną izolowaną sesję — więc możesz skonfigurować `#coding`, `#home`, `#research` albo cokolwiek pasuje do Twojego przepływu pracy.

## Model runtime

- Gateway odpowiada za połączenie Discord.
- Trasowanie odpowiedzi jest deterministyczne: odpowiedzi przychodzące z Discord wracają do Discord.
- Metadane gildii/kanału Discord są dodawane do promptu modelu jako niezaufany
  kontekst, a nie jako widoczny dla użytkownika prefiks odpowiedzi. Jeśli model skopiuje tę kopertę
  z powrotem, OpenClaw usuwa skopiowane metadane z odpowiedzi wychodzących oraz z
  przyszłego kontekstu odtwarzania.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały gildii mają izolowane klucze sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia ukośnikiem działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), nadal przenosząc `CommandTargetSessionKey` do trasowanej sesji konwersacji.
- Dostarczanie tekstowych komunikatów Cron/Heartbeat do Discord używa ostatecznej
  odpowiedzi widocznej dla asystenta jeden raz. Multimedia i ustrukturyzowane ładunki komponentów pozostają
  wielowiadomościowe, gdy agent emituje wiele dostarczalnych ładunków.

## Kanały forum

Kanały forum i multimediów Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do rodzica forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku używa pierwszego niepustego wiersza Twojej wiadomości.
- Użyj `openclaw message thread create`, aby utworzyć wątek bezpośrednio. Nie przekazuj `--message-id` dla kanałów forum.

Przykład: wyślij do rodzica forum, aby utworzyć wątek

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Przykład: jawnie utwórz wątek forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Rodzice forum nie akceptują komponentów Discord. Jeśli potrzebujesz komponentów, wyślij do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są trasowane z powrotem do agenta jako zwykłe wiadomości przychodzące i przestrzegają istniejących ustawień Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków lub jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowego użytku. Ustaw `components.reusable=true`, aby pozwolić na wielokrotne używanie przycisków, wyborów i formularzy do czasu ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` na tym przycisku (identyfikatory użytkowników Discord, tagi lub `*`). Po skonfigurowaniu niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Polecenia ukośnikiem `/model` i `/models` otwierają interaktywny selektor modelu z listami rozwijanymi dostawcy, modelu i zgodnego środowiska uruchomieniowego oraz krokiem Submit. `/models add` jest przestarzałe i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu. Odpowiedź selektora jest efemeryczna i może jej użyć tylko użytkownik wywołujący.

Załączniki plików:

- Bloki `file` muszą wskazywać na odwołanie do załącznika (`attachment://<filename>`)
- Podaj załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
- Użyj `filename`, aby zastąpić nazwę przesyłanego pliku, gdy powinna pasować do odwołania do załącznika

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

## Kontrola dostępu i trasowanie

<Tabs>
  <Tab title="Zasady DM">
    `channels.discord.dmPolicy` kontroluje dostęp DM. `channels.discord.allowFrom` jest kanoniczną listą dozwolonych DM.

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`)
    - `disabled`

    Jeśli zasada DM nie jest otwarta, nieznani użytkownicy są blokowani (albo proszeni o parowanie w trybie `pairing`).

    Priorytet wielu kont:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Dla jednego konta `allowFrom` ma pierwszeństwo przed starszym `dm.allowFrom`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` i starsze `dm.allowFrom` nie są ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Starsze `channels.discord.dm.policy` i `channels.discord.dm.allowFrom` są nadal odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Format celu DM do dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same identyfikatory numeryczne zwykle rozpoznają się jako identyfikatory kanałów, gdy aktywna jest domyślność kanału, ale identyfikatory wymienione w efektywnym DM `allowFrom` konta są traktowane jako cele DM użytkownika dla zgodności.

  </Tab>

  <Tab title="Grupy dostępu DM">
    DM Discord mogą używać dynamicznych wpisów `accessGroup:<name>` w `channels.discord.allowFrom`.

    Nazwy grup dostępu są współdzielone między kanałami wiadomości. Użyj `type: "message.senders"` dla statycznej grupy, której członkowie są wyrażeni w normalnej składni `allowFrom` każdego kanału, albo `type: "discord.channelAudience"`, gdy bieżąca publiczność `ViewChannel` kanału Discord powinna dynamicznie definiować członkostwo. Współdzielone zachowanie grup dostępu jest udokumentowane tutaj: [Grupy dostępu](/pl/channels/access-groups).

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

    Kanał tekstowy Discord nie ma osobnej listy członków. `type: "discord.channelAudience"` modeluje członkostwo tak: nadawca DM jest członkiem skonfigurowanej gildii i obecnie ma efektywne uprawnienie `ViewChannel` na skonfigurowanym kanale po zastosowaniu nadpisań ról i kanału.

    Przykład: pozwól każdemu, kto widzi `#maintainers`, wysłać DM do bota, jednocześnie pozostawiając DM zamknięte dla wszystkich innych.

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

    Wyszukiwania zamykają dostęp w razie niepowodzenia. Jeśli Discord zwraca `Missing Access`, wyszukanie członka nie powiedzie się albo kanał należy do innej gildii, nadawca DM jest traktowany jako nieautoryzowany.

    Włącz **Server Members Intent** w Discord Developer Portal dla bota, gdy używasz grup dostępu opartych na publiczności kanału. DM nie zawierają stanu członka gildii, więc OpenClaw rozpoznaje członka przez Discord REST w czasie autoryzacji.

  </Tab>

  <Tab title="Zasady gildii">
    Obsługa gildii jest kontrolowana przez `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczna wartość bazowa, gdy istnieje `channels.discord`, to `allowlist`.

    Zachowanie `allowlist`:

    - gildia musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli którakolwiek jest skonfigurowana, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazw/tagów
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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, awaryjne zachowanie środowiska uruchomieniowego to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` to `open`.

  </Tab>

  <Tab title="Wzmianki i grupowe DM">
    Wiadomości gildii są domyślnie ograniczane wzmianką.

    Wykrywanie wzmianki obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    Podczas pisania wychodzących wiadomości Discord używaj kanonicznej składni wzmianek: `<@USER_ID>` dla użytkowników, `<#CHANNEL_ID>` dla kanałów i `<@&ROLE_ID>` dla ról. Nie używaj starszej formy wzmianki pseudonimu `<@!USER_ID>`.

    `requireMention` jest konfigurowane dla każdej gildii/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów lub slugi)

  </Tab>
</Tabs>

### Trasowanie agenta oparte na rolach

Użyj `bindings[].match.roles`, aby trasować członków gildii Discord do różnych agentów według identyfikatora roli. Wiązania oparte na rolach akceptują tylko identyfikatory ról i są oceniane po wiązaniach peer lub parent-peer oraz przed wiązaniami tylko dla gildii. Jeśli wiązanie ustawia też inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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

## Natywne polecenia i uwierzytelnianie poleceń

- Domyślnie `commands.native` ma wartość `"auto"` i jest włączone dla Discord.
- Nadpisanie dla kanału: `channels.discord.commands.native`.
- `commands.native=false` pomija rejestrację poleceń slash Discord oraz czyszczenie podczas uruchamiania. Wcześniej zarejestrowane polecenia mogą pozostać widoczne w Discord, dopóki nie usuniesz ich z aplikacji Discord.
- Uwierzytelnianie poleceń natywnych używa tych samych list dozwolonych i polityk Discord co standardowa obsługa wiadomości.
- Polecenia mogą nadal być widoczne w UI Discord dla użytkowników, którzy nie są autoryzowani; wykonanie nadal egzekwuje uwierzytelnianie OpenClaw i zwraca „not authorized”.

Zobacz [Polecenia slash](/pl/tools/slash-commands), aby poznać katalog poleceń i ich działanie.

Domyślne ustawienia poleceń slash:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Tagi odpowiedzi i odpowiedzi natywne">
    Discord obsługuje tagi odpowiedzi w danych wyjściowych agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Kontrolowane przez `channels.discord.replyToMode`:

    - `off` (domyślnie)
    - `first`
    - `all`
    - `batched`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal honorowane.
    `first` zawsze dołącza niejawną natywną referencję odpowiedzi do pierwszej wychodzącej wiadomości Discord dla danej tury.
    `batched` dołącza niejawną natywną referencję odpowiedzi Discord tylko wtedy, gdy
    tura przychodząca była wsadem wielu wiadomości po debouncingu. Jest to przydatne,
    gdy chcesz używać odpowiedzi natywnych głównie w niejednoznacznych, gwałtownych rozmowach, a nie w każdej
    turze z pojedynczą wiadomością.

    Identyfikatory wiadomości są udostępniane w kontekście/historii, aby agenci mogli kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Podgląd strumienia na żywo">
    OpenClaw może strumieniować robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływania tekstu. `channels.discord.streaming` przyjmuje `off` | `partial` | `block` | `progress` (domyślnie). `progress` utrzymuje jeden edytowalny szkic statusu i aktualizuje go postępem narzędzi aż do końcowego dostarczenia; `streamMode` to starszy alias runtime. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację na kanoniczny klucz.

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
    - `block` emituje fragmenty o rozmiarze szkicu (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału, ograniczone do `textChunkLimit`).
    - Media, błędy i końcowe odpowiedzi z jawną odpowiedzią anulują oczekujące edycje podglądu.
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

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii gildii:

    - domyślnie `channels.discord.historyLimit` to `20`
    - wartość awaryjna: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrolki historii DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są kierowane jako sesje kanałów i dziedziczą konfigurację kanału nadrzędnego, chyba że zostaną nadpisane.
    - Sesje wątków dziedziczą wybór `/model` na poziomie sesji kanału nadrzędnego wyłącznie jako awaryjny wybór modelu; lokalne wybory `/model` wątku nadal mają pierwszeństwo, a historia transkrypcji nadrzędnej nie jest kopiowana, chyba że włączono dziedziczenie transkrypcji.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) włącza dla nowych automatycznych wątków inicjowanie z transkrypcji nadrzędnej. Nadpisania dla kont znajdują się pod `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozpoznawać cele DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas awaryjnej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych kontrolują, kto może uruchomić agenta, a nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla subagentów">
    Discord może powiązać wątek z celem sesji, dzięki czemu kolejne wiadomości w tym wątku pozostają kierowane do tej samej sesji (w tym sesji subagentów).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuń powiązanie bieżącego wątku
    - `/agents` pokaż aktywne uruchomienia i stan powiązań
    - `/session idle <duration|off>` sprawdź/zaktualizuj automatyczne odłączenie po bezczynności dla aktywnych powiązań
    - `/session max-age <duration|off>` sprawdź/zaktualizuj twardy maksymalny wiek dla aktywnych powiązań

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
    - `spawnSessions` kontroluje automatyczne tworzenie/powiązywanie wątków dla `sessions_spawn({ thread: true })` i tworzenia wątków ACP. Domyślnie: `true`.
    - `defaultSpawnContext` kontroluje natywny kontekst subagenta dla tworzenia powiązanego z wątkiem. Domyślnie: `"fork"`.
    - Przestarzałe klucze `spawnSubagentSessions`/`spawnAcpSessions` są migrowane przez `openclaw doctor --fix`.
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązań wątków są niedostępne.

    Zobacz [Subagenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) i [Informacje o konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe powiązania kanałów ACP">
    Dla stabilnych, „zawsze włączonych” obszarów roboczych ACP skonfiguruj typowane powiązania ACP najwyższego poziomu kierowane do rozmów Discord.

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

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozpoznawania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - awaryjnie emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie „👀”)

    Uwagi:

    - Discord akceptuje emoji Unicode lub niestandardowe nazwy emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji">
    Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone.

    Ma to wpływ na przepływy `/config set|unset` (gdy funkcje poleceń są włączone).

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
    Kieruj ruch WebSocket Gateway Discord i początkowe wyszukiwania REST (identyfikator aplikacji + rozpoznawanie listy dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

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
    Włącz rozpoznawanie PluralKit, aby mapować wiadomości proxied na tożsamość członka systemu:

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
    - nazwy wyświetlane członków są dopasowywane według nazwy/slug tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
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

    - 0: Playing
    - 1: Streaming (wymaga `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (używa tekstu aktywności jako stanu statusu; emoji jest opcjonalne)
    - 5: Competing

    Przykład automatycznej obecności (sygnał stanu runtime):

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

    Automatyczna obecność mapuje dostępność środowiska uruchomieniowego na status Discord: sprawny => online, ograniczony lub nieznany => bezczynny, wyczerpany lub niedostępny => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discord">
    Discord obsługuje zatwierdzanie za pomocą przycisków w wiadomościach prywatnych i opcjonalnie może publikować monity zatwierdzeń w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; w miarę możliwości wraca do `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` jest nieustawione albo ma wartość `"auto"` i można rozpoznać co najmniej jedną osobę zatwierdzającą, z `execApprovals.approvers` albo z `commands.ownerAllowFrom`. Discord nie wywnioskuje osób zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzeń.

    W przypadku wrażliwych poleceń grupowych tylko dla właściciela, takich jak `/diagnostics` i `/export-trajectory`, OpenClaw wysyła monity zatwierdzeń i końcowe wyniki prywatnie. Najpierw próbuje wiadomości prywatnej Discord, gdy właściciel wywołujący ma trasę właściciela Discord; jeśli nie jest ona dostępna, wraca do pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, takiej jak Telegram.

    Gdy `target` ma wartość `channel` albo `both`, monit zatwierdzenia jest widoczny w kanale. Tylko rozpoznane osoby zatwierdzające mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Monity zatwierdzeń zawierają tekst polecenia, dlatego dostarczanie w kanale włączaj tylko w zaufanych kanałach. Jeśli identyfikatora kanału nie można wyprowadzić z klucza sesji, OpenClaw wraca do dostarczenia przez wiadomość prywatną.

    Discord renderuje też współdzielone przyciski zatwierdzeń używane przez inne kanały czatu. Natywny adapter Discord dodaje głównie routing wiadomości prywatnych do osób zatwierdzających i rozsyłanie do kanałów.
    Gdy te przyciski są obecne, stanowią główny interfejs zatwierdzeń; OpenClaw
    powinien uwzględniać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    Jeśli natywne środowisko zatwierdzeń Discord nie jest aktywne, OpenClaw zachowuje
    widoczny lokalny deterministyczny monit `/approve <id> <decision>`. Jeśli
    środowisko jest aktywne, ale natywnej karty nie można dostarczyć do żadnego celu,
    OpenClaw wysyła w tym samym czacie powiadomienie awaryjne z dokładnym poleceniem `/approve`
    z oczekującego zatwierdzenia.

    Uwierzytelnianie Gateway i rozwiązywanie zatwierdzeń podążają za współdzielonym kontraktem klienta Gateway (identyfikatory `plugin:` są rozwiązywane przez `plugin.approval.resolve`; inne identyfikatory przez `exec.approval.resolve`). Zatwierdzenia domyślnie wygasają po 30 minutach.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki akcji

Akcje wiadomości Discord obejmują wysyłanie wiadomości, administrację kanałami, moderację, obecność i akcje metadanych.

Podstawowe przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Akcja `event-create` przyjmuje opcjonalny parametr `image` (URL albo lokalną ścieżkę pliku), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki akcji znajdują się pod `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa akcji                                                                                                                                                              | Domyślnie  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone   |
| roles                                                                                                                                                                    | wyłączone  |
| moderation                                                                                                                                                               | wyłączone  |
| presence                                                                                                                                                                 | wyłączone  |

## Interfejs komponentów v2

OpenClaw używa komponentów Discord v2 do zatwierdzeń exec i znaczników międzykontekstowych. Akcje wiadomości Discord mogą też przyjmować `components` dla niestandardowego interfejsu (zaawansowane; wymaga skonstruowania payloadu komponentu przez narzędzie discord), natomiast starsze `embeds` pozostają dostępne, ale nie są zalecane.

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

Discord ma dwie odrębne powierzchnie głosowe: **kanały głosowe** czasu rzeczywistego (ciągłe rozmowy) i **załączniki wiadomości głosowych** (format podglądu fali dźwiękowej). Gateway obsługuje oba.

### Kanały głosowe

Lista kontrolna konfiguracji:

1. Włącz Message Content Intent w Discord Developer Portal.
2. Włącz Server Members Intent, gdy używane są listy dozwolonych ról/użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Przyznaj uprawnienia Connect, Speak, Send Messages i Read Message History w docelowym kanale głosowym.
5. Włącz polecenia natywne (`commands.native` albo `channels.discord.commands.native`).
6. Skonfiguruj `channels.discord.voice`.

Użyj `/vc join|leave|status`, aby sterować sesjami. Polecenie używa domyślnego agenta konta i podąża za tymi samymi regułami listy dozwolonych i polityki grupowej co inne polecenia Discord.

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
- `voice.model` nadpisuje LLM używany tylko dla odpowiedzi kanału głosowego Discord. Pozostaw nieustawione, aby dziedziczyć model agenta z routingu.
- STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- Nadpisania `systemPrompt` Discord dla kanału dotyczą tur transkrypcji głosowej dla tego kanału głosowego.
- Tury transkrypcji głosowej wyprowadzają status właściciela z Discord `allowFrom` (albo `dm.allowFrom`); mówcy niebędący właścicielami nie mogą uzyskać dostępu do narzędzi tylko dla właściciela (na przykład `gateway` i `cron`).
- Głos Discord jest opcjonalny dla konfiguracji tylko tekstowych; ustaw `channels.discord.voice.enabled=true` (albo zachowaj istniejący blok `channels.discord.voice`), aby włączyć polecenia `/vc`, środowisko głosowe i intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` może jawnie nadpisać subskrypcję intentu stanu głosu. Pozostaw nieustawione, aby intent podążał za efektywnym włączeniem głosu.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączenia `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- `voice.connectTimeoutMs` kontroluje początkowe oczekiwanie `@discordjs/voice` na Ready dla `/vc join` i prób automatycznego dołączania. Domyślnie: `30000`.
- `voice.reconnectGraceMs` kontroluje, jak długo OpenClaw czeka, aż rozłączona sesja głosowa zacznie ponownie się łączyć, zanim ją zniszczy. Domyślnie: `15000`.
- Odtwarzanie głosu nie zatrzymuje się tylko dlatego, że inny użytkownik zaczyna mówić. Aby uniknąć pętli sprzężenia zwrotnego, OpenClaw ignoruje nowe przechwytywanie głosu podczas odtwarzania TTS; mów po zakończeniu odtwarzania, aby rozpocząć następną turę.
- `voice.captureSilenceGraceMs` kontroluje, jak długo OpenClaw czeka po zgłoszeniu przez Discord, że mówca przestał mówić, zanim sfinalizuje ten segment audio dla STT. Domyślnie: `2500`; zwiększ tę wartość, jeśli Discord dzieli normalne pauzy na poszarpane częściowe transkrypcje.
- Gdy wybranym dostawcą TTS jest ElevenLabs, odtwarzanie głosu Discord używa strumieniowego TTS i zaczyna od strumienia odpowiedzi dostawcy. Dostawcy bez obsługi strumieniowania wracają do ścieżki syntetyzowanego pliku tymczasowego.
- OpenClaw obserwuje też błędy deszyfrowania odbioru i automatycznie odzyskuje działanie przez opuszczenie i ponowne dołączenie do kanału głosowego po powtarzających się błędach w krótkim oknie.
- Jeśli po aktualizacji logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, zbierz raport zależności i logi. Dołączona linia `@discordjs/voice` zawiera upstreamową poprawkę paddingu z PR discord.js #11449, która zamknęła issue discord.js #11419.
- Zdarzenia odbioru `The operation was aborted` są oczekiwane, gdy OpenClaw finalizuje przechwycony segment mówcy; to szczegółowa diagnostyka, nie ostrzeżenia.

Pipeline kanału głosowego:

- Przechwycony PCM z Discord jest konwertowany do tymczasowego pliku WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypcja jest wysyłana przez wejście Discord i routing, podczas gdy odpowiedź LLM działa z polityką wyjścia głosowego, która ukrywa narzędzie agenta `tts` i prosi o zwrócony tekst, ponieważ Discord voice posiada końcowe odtwarzanie TTS.
- `voice.model`, gdy jest ustawione, nadpisuje tylko LLM odpowiedzi dla tej tury kanału głosowego.
- `voice.tts` jest scalane na wierzchu `messages.tts`; dostawcy obsługujący strumieniowanie zasilają odtwarzacz bezpośrednio, w przeciwnym razie wynikowy plik audio jest odtwarzany w dołączonym kanale.

Poświadczenia są rozwiązywane dla każdego komponentu: uwierzytelnianie trasy LLM dla `voice.model`, uwierzytelnianie STT dla `tools.media.audio` i uwierzytelnianie TTS dla `messages.tts`/`voice.tts`.

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd fali dźwiękowej i wymagają audio OGG/Opus. OpenClaw generuje falę automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście Gateway, aby sprawdzać i konwertować.

- Podaj **lokalną ścieżkę pliku** (adresy URL są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst + wiadomość głosową w tym samym payloadzie).
- Akceptowany jest dowolny format audio; OpenClaw konwertuje do OGG/Opus w razie potrzeby.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intentów albo bot nie widzi wiadomości gildii">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy zależy Ci na rozwiązywaniu użytkowników/członków
    - uruchom ponownie Gateway po zmianie intentów

  </Accordion>

  <Accordion title="Wiadomości gildii są nieoczekiwanie blokowane">

    - sprawdź `groupPolicy`
    - sprawdź listę dozwolonych gildii pod `channels.discord.guilds`
    - jeśli istnieje mapa gildii `channels`, dozwolone są tylko wymienione kanały
    - sprawdź zachowanie `requireMention` i wzorce wzmianek

    Przydatne kontrole:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Wymaganie wzmianki ustawione na false, ale nadal blokowane">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych guild/kanałów
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi znajdować się pod `channels.discord.guilds` albo we wpisie kanału)
    - nadawca zablokowany przez listę dozwolonych `users` guild/kanału

  </Accordion>

  <Accordion title="Długotrwałe tury Discord lub zduplikowane odpowiedzi">

    Typowe logi:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Ustawienia kolejki Gateway Discord:

    - jedno konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - kontroluje to tylko pracę listenera Gateway Discord, a nie czas życia tury agenta

    Discord nie stosuje timeoutu należącego do kanału do zakolejkowanych tur agenta. Listenery wiadomości przekazują pracę natychmiast, a zakolejkowane uruchomienia Discord zachowują kolejność w ramach sesji, dopóki cykl życia sesji/narzędzia/środowiska uruchomieniowego nie zakończy się albo nie przerwie pracy.

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

  <Accordion title="Ostrzeżenia o timeoucie wyszukiwania metadanych Gateway">
    OpenClaw pobiera metadane Discord `/gateway/bot` przed nawiązaniem połączenia. Przejściowe błędy przełączają się awaryjnie na domyślny URL Gateway Discord i są ograniczane częstotliwościowo w logach.

    Ustawienia timeoutu metadanych:

    - jedno konto: `channels.discord.gatewayInfoTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - awaryjna wartość env, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - domyślnie: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Restarty przy timeoucie READY Gateway">
    OpenClaw czeka na zdarzenie Gateway `READY` Discord podczas uruchamiania i po ponownych połączeniach środowiska uruchomieniowego. Konfiguracje z wieloma kontami i rozłożonym startem mogą wymagać dłuższego okna READY przy uruchamianiu niż domyślne.

    Ustawienia timeoutu READY:

    - uruchamianie, jedno konto: `channels.discord.gatewayReadyTimeoutMs`
    - uruchamianie, wiele kont: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - awaryjna wartość env przy uruchamianiu, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - domyślnie przy uruchamianiu: `15000` (15 sekund), maks.: `120000`
    - środowisko uruchomieniowe, jedno konto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - środowisko uruchomieniowe, wiele kont: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - awaryjna wartość env dla środowiska uruchomieniowego, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - domyślnie dla środowiska uruchomieniowego: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Sprawdzanie uprawnień `channels status --probe` działa tylko dla numerycznych identyfikatorów kanałów.

    Jeśli używasz kluczy slug, dopasowanie w czasie działania może nadal działać, ale probe nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - polityka DM wyłączona: `channels.discord.dmPolicy="disabled"` (starsze: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot-bot">
    Domyślnie wiadomości autorstwa botów są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, używaj ścisłych reguł wzmianek i listy dozwolonych, aby uniknąć zachowania pętli.
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

  <Accordion title="Voice STT przerywa z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby logika odzyskiwania odbioru głosu Discord była dostępna
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli awarie nadal występują po automatycznym ponownym dołączeniu, zbierz logi i porównaj je z historią odbioru upstream DAVE w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) i [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Odniesienie do konfiguracji

Główne odniesienie: [Odniesienie do konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="Najważniejsze pola Discord">

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- polityka: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- odpowiedzi/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponawianie: `mediaMaxMb` (ogranicza wychodzące przesyłanie plików Discord, domyślnie `100MB`), `retry`
- akcje: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (`DISCORD_BOT_TOKEN` preferowane w nadzorowanych środowiskach).
- Przyznawaj najmniej uprzywilejowane uprawnienia Discord.
- Jeśli wdrożenie/stan poleceń jest nieaktualny, uruchom ponownie Gateway i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discord z gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie czatu grupowego i listy dozwolonych.
  </Card>
  <Card title="Routing kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj przychodzące wiadomości do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Routing wieloagentowy" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj gildie i kanały na agentów.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Zachowanie natywnych poleceń.
  </Card>
</CardGroup>
