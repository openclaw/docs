---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:40:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

Gotowe do wiadomości prywatnych i kanałów serwera przez oficjalny Gateway Discord.

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

  <Step title="Włącz uprzywilejowane intents">
    Nadal na stronie **Bot** przewiń w dół do **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazw do ID)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem w górę na stronie **Bot** i kliknij **Reset Token**.

    <Note>
    Mimo nazwy generuje to pierwszy token — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest Twój **Bot Token** i wkrótce będzie potrzebny.

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
    W aplikacji Discord musisz włączyć Developer Mode, aby móc kopiować wewnętrzne ID.

    1. Kliknij **User Settings** (ikona koła zębatego obok awatara) → przewiń do **Developer** na pasku bocznym → włącz **Developer Mode**

        *(Uwaga: w aplikacji mobilnej Discord tryb Developer Mode znajduje się w **App Settings** → **Advanced**)*

    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem **własny awatar** → **Copy User ID**

    Zapisz **Server ID** i **User ID** obok Bot Token — w następnym kroku wyślesz wszystkie trzy do OpenClaw.

  </Step>

  <Step title="Zezwól na wiadomości prywatne od członków serwera">
    Aby parowanie działało, Discord musi pozwolić botowi wysyłać do Ciebie wiadomości prywatne. Kliknij prawym przyciskiem **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać Ci wiadomości prywatne. Pozostaw to włączone, jeśli chcesz używać wiadomości prywatnych Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, możesz wyłączyć wiadomości prywatne po sparowaniu.

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

    Jeśli OpenClaw działa już jako usługa w tle, uruchom go ponownie przez aplikację OpenClaw na Maca albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.
    W przypadku instalacji jako zarządzana usługa uruchom `openclaw gateway install` z powłoki, w której dostępne jest `DISCORD_BOT_TOKEN`, albo zapisz zmienną w `~/.openclaw/.env`, aby usługa mogła rozwiązać env SecretRef po ponownym uruchomieniu.
    Jeśli Twój host jest blokowany lub ograniczany przez Discord podczas początkowego wyszukiwania aplikacji, ustaw ID aplikacji/klienta Discord z Developer Portal, aby start mógł pominąć to wywołanie REST. Użyj `channels.discord.applicationId` dla konta domyślnego albo `channels.discord.accounts.<accountId>.applicationId`, gdy uruchamiasz wiele botów Discord.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i przekaż mu to. Jeśli Discord jest Twoim pierwszym kanałem, użyj zamiast tego karty CLI / konfiguracja.

        > „Mam już ustawiony token bota Discord w konfiguracji. Dokończ konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`.”
      </Tab>
      <Tab title="CLI / konfiguracja">
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

        Env fallback dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        Przy konfiguracji skryptowej lub zdalnej zapisz ten sam blok JSON5 za pomocą `openclaw config patch --file ./discord.patch.json5 --dry-run`, a następnie uruchom ponownie bez `--dry-run`. Wartości `token` w tekście jawnym są obsługiwane. Wartości SecretRef są również obsługiwane dla `channels.discord.token` przez dostawców env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

        W przypadku wielu botów Discord trzymaj każdy token bota i ID aplikacji pod jego kontem. Najwyższego poziomu `channels.discord.applicationId` jest dziedziczone przez konta, więc ustawiaj je tam tylko wtedy, gdy każde konto powinno używać tego samego ID aplikacji.

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
    Poczekaj, aż Gateway będzie działać, a następnie wyślij wiadomość prywatną do bota w Discord. Odpowie kodem parowania.

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
Rozwiązywanie tokenów uwzględnia konto. Wartości tokenów z konfiguracji mają pierwszeństwo przed env fallback. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
Jeśli dwa włączone konta Discord rozwiązują się do tego samego tokena bota, OpenClaw uruchamia tylko jeden monitor Gateway dla tego tokena. Token pochodzący z konfiguracji ma pierwszeństwo przed domyślnym env fallback; w przeciwnym razie wygrywa pierwsze włączone konto, a zduplikowane konto jest zgłaszane jako wyłączone.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/akcje kanału) jawny `token` dla danego wywołania jest używany tylko dla tego wywołania. Dotyczy to akcji typu wysyłanie i odczyt/sondowanie (na przykład read/search/fetch/thread/pins/permissions). Zasady konta i ustawienia ponawiania nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
</Note>

## Zalecane: skonfiguruj przestrzeń roboczą serwera

Gdy wiadomości prywatne działają, możesz skonfigurować swój serwer Discord jako pełną przestrzeń roboczą, w której każdy kanał ma własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteś tylko Ty i Twój bot.

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

    W kanałach serwera zwykłe odpowiedzi są domyślnie publikowane automatycznie. Dla współdzielonych, zawsze aktywnych pokojów włącz `messages.groupChat.visibleReplies: "message_tool"`, aby agent mógł nasłuchiwać i publikować tylko wtedy, gdy uzna odpowiedź na kanale za przydatną. Działa to najlepiej z modelami najnowszej generacji, niezawodnymi w użyciu narzędzi, takimi jak GPT 5.5. Zdarzenia pokojów w tle pozostają ciche, chyba że narzędzie wyśle wiadomość. Zobacz [Zdarzenia pokojów w tle](/pl/channels/ambient-room-events), aby poznać pełną konfigurację trybu nasłuchiwania.

    Jeśli Discord pokazuje pisanie, a logi pokazują użycie tokenów, ale nie ma opublikowanej wiadomości, sprawdź, czy tura została skonfigurowana jako zdarzenie pokoju w tle albo włączono widoczne odpowiedzi przez narzędzie wiadomości.

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

        Aby wymagać wysyłania przez narzędzie wiadomości dla widocznych odpowiedzi grupowych/kanałowych, ustaw `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zaplanuj pamięć w kanałach serwera">
    Domyślnie pamięć długoterminowa (MEMORY.md) ładuje się tylko w sesjach wiadomości prywatnych. Kanały serwera nie ładują automatycznie MEMORY.md.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Gdy zadaję pytania w kanałach Discord, użyj memory_search albo memory_get, jeśli potrzebujesz długoterminowego kontekstu z MEMORY.md.”
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane dla każdej sesji). Przechowuj długoterminowe notatki w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał dostaje własną izolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` albo cokolwiek pasuje do Twojego przepływu pracy.

## Model środowiska uruchomieniowego

- Gateway odpowiada za połączenie z Discord.
- Routing odpowiedzi jest deterministyczny: przychodzące odpowiedzi z Discord wracają do Discord.
- Metadane gildii/kanału Discord są dodawane do promptu modelu jako niezaufany
  kontekst, a nie jako widoczny dla użytkownika prefiks odpowiedzi. Jeśli model skopiuje tę otoczkę
  z powrotem, OpenClaw usuwa skopiowane metadane z odpowiedzi wychodzących oraz z
  przyszłego kontekstu odtwarzania.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały gildii są izolowanymi kluczami sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe wiadomości DM są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia ukośnikowe działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), nadal przenosząc `CommandTargetSessionKey` do sesji konwersacji wyznaczonej przez routing.
- Dostarczanie tekstowych ogłoszeń cron/heartbeat do Discord używa końcowej
  odpowiedzi widocznej dla asystenta jeden raz. Multimedia i ustrukturyzowane ładunki komponentów pozostają
  wielowiadomościowe, gdy agent emituje wiele ładunków możliwych do dostarczenia.

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

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są kierowane z powrotem do agenta jako zwykłe wiadomości przychodzące i stosują istniejące ustawienia Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowe. Ustaw `components.reusable=true`, aby umożliwić wielokrotne używanie przycisków, pól wyboru i formularzy do czasu ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` na tym przycisku (identyfikatory użytkowników Discord, tagi lub `*`). Po skonfigurowaniu niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Callbacki komponentów domyślnie wygasają po 30 minutach. Ustaw `channels.discord.agentComponents.ttlMs`, aby zmienić czas życia tego rejestru callbacków dla domyślnego konta Discord, albo `channels.discord.accounts.<accountId>.agentComponents.ttlMs`, aby nadpisać jedno konto w konfiguracji wielokontowej. Wartość jest w milisekundach, musi być dodatnią liczbą całkowitą i jest ograniczona do `86400000` (24 godziny). Dłuższe TTL są przydatne w przepływach pracy przeglądu lub zatwierdzania, które wymagają, aby przyciski pozostały użyteczne, ale wydłużają też okno, w którym stara wiadomość Discord nadal może wyzwolić akcję. Preferuj najkrótsze TTL pasujące do przepływu pracy i zachowaj wartość domyślną, gdy przestarzałe callbacki byłyby zaskakujące.

Polecenia ukośnikowe `/model` i `/models` otwierają interaktywny selektor modeli z listami rozwijanymi dostawcy, modelu i zgodnego runtime oraz krokiem Submit. `/models add` jest przestarzałe i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu. Odpowiedź selektora jest efemeryczna i może jej użyć tylko użytkownik, który ją wywołał. Menu wyboru Discord są ograniczone do 25 opcji, więc dodaj wpisy `provider/*` do `agents.defaults.models`, gdy chcesz, aby selektor pokazywał dynamicznie wykryte modele tylko dla wybranych dostawców, takich jak `openai` lub `vllm`.

Załączniki plików:

- Bloki `file` muszą wskazywać na referencję załącznika (`attachment://<filename>`)
- Podaj załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
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

    - `pairing` (domyślne)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`)
    - `disabled`

    Jeśli zasada DM nie jest otwarta, nieznani użytkownicy są blokowani (albo proszeni o parowanie w trybie `pairing`).

    Priorytet w konfiguracji wielokontowej:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Dla jednego konta `allowFrom` ma pierwszeństwo przed starszym `dm.allowFrom`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` i starsze `dm.allowFrom` nie są ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Starsze `channels.discord.dm.policy` i `channels.discord.dm.allowFrom` nadal są odczytywane ze względu na zgodność. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Format celu DM dla dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Surowe identyfikatory numeryczne zwykle są rozpoznawane jako identyfikatory kanałów, gdy aktywna jest domyślna wartość kanału, ale identyfikatory wymienione w efektywnym DM `allowFrom` konta są traktowane jako cele DM użytkownika ze względu na zgodność.

  </Tab>

  <Tab title="Access groups">
    Autoryzacja DM Discord i poleceń tekstowych może używać dynamicznych wpisów `accessGroup:<name>` w `channels.discord.allowFrom`.

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

    Kanał tekstowy Discord nie ma osobnej listy członków. `type: "discord.channelAudience"` modeluje członkostwo tak: nadawca DM jest członkiem skonfigurowanej gildii i obecnie ma efektywne uprawnienie `ViewChannel` na skonfigurowanym kanale po zastosowaniu ról i nadpisań kanału.

    Przykład: pozwól każdemu, kto widzi `#maintainers`, wysyłać DM do bota, jednocześnie pozostawiając DM zamknięte dla wszystkich pozostałych.

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

    Wyszukiwania zamykają dostęp w przypadku niepowodzenia. Jeśli Discord zwróci `Missing Access`, wyszukanie członka nie powiedzie się albo kanał należy do innej gildii, nadawca DM jest traktowany jako nieautoryzowany.

    Włącz **Server Members Intent** w Discord Developer Portal dla bota, gdy używasz grup dostępu opartych na publiczności kanału. DM nie zawierają stanu członka gildii, więc OpenClaw rozpoznaje członka przez Discord REST w czasie autoryzacji.

  </Tab>

  <Tab title="Guild policy">
    Obsługa gildii jest kontrolowana przez `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczna podstawa, gdy istnieje `channels.discord`, to `allowlist`.

    Zachowanie `allowlist`:

    - gildia musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli skonfigurowano którąkolwiek z nich, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazwy/tagu
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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, fallback runtime to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Wiadomości gildii domyślnie wymagają wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    Podczas pisania wychodzących wiadomości Discord używaj kanonicznej składni wzmianek: `<@USER_ID>` dla użytkowników, `<#CHANNEL_ID>` dla kanałów i `<@&ROLE_ID>` dla ról. Nie używaj starszej formy wzmianki pseudonimu `<@!USER_ID>`.

    `requireMention` jest konfigurowane dla gildii/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów lub slugi)

  </Tab>
</Tabs>

### Routing agenta oparty na rolach

Użyj `bindings[].match.roles`, aby kierować członków gildii Discord do różnych agentów według ID roli. Wiązania oparte na rolach przyjmują wyłącznie ID ról i są oceniane po wiązaniach peer lub parent-peer, a przed wiązaniami tylko dla gildii. Jeśli wiązanie ustawia też inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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

## Polecenia natywne i autoryzacja poleceń

- `commands.native` domyślnie ma wartość `"auto"` i jest włączone dla Discord.
- Nadpisanie dla kanału: `channels.discord.commands.native`.
- `commands.native=false` pomija rejestrację i czyszczenie poleceń slash Discord podczas uruchamiania. Wcześniej zarejestrowane polecenia mogą pozostać widoczne w Discord, dopóki nie usuniesz ich z aplikacji Discord.
- Autoryzacja poleceń natywnych używa tych samych list dozwolonych i zasad Discord co standardowa obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discord dla użytkowników bez autoryzacji; wykonanie nadal egzekwuje autoryzację OpenClaw i zwraca „brak autoryzacji”.

Zobacz [Polecenia slash](/pl/tools/slash-commands), aby poznać katalog poleceń i ich zachowanie.

Domyślne ustawienia poleceń slash:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Tagi odpowiedzi i odpowiedzi natywne">
    Discord obsługuje tagi odpowiedzi w wyjściu agenta:

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
    zdarzenie przychodzące było odbitym pakietem wielu wiadomości. Jest to przydatne,
    gdy chcesz używać odpowiedzi natywnych głównie w niejednoznacznych, gwałtownych czatach, a nie w każdej
    turze z pojedynczą wiadomością.

    ID wiadomości są udostępniane w kontekście/historii, aby agenci mogli kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Podglądy linków">
    Discord domyślnie generuje bogate osadzenia linków dla adresów URL. OpenClaw domyślnie pomija te wygenerowane osadzenia w wychodzących wiadomościach Discord, więc adresy URL wysłane przez agenta pozostają zwykłymi linkami, chyba że włączysz tę opcję:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Ustaw `channels.discord.accounts.<id>.suppressEmbeds`, aby nadpisać jedno konto. Wysyłki narzędzia wiadomości agenta mogą też przekazać `suppressEmbeds: false` dla pojedynczej wiadomości. Jawne ładunki Discord `embeds` nie są pomijane przez domyślne ustawienie podglądu linków.

  </Accordion>

  <Accordion title="Podgląd strumienia na żywo">
    OpenClaw może strumieniować robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływania tekstu. `channels.discord.streaming` przyjmuje `off` | `partial` | `block` | `progress` (domyślnie). `progress` utrzymuje jeden edytowalny szkic statusu i aktualizuje go postępem narzędzi aż do finalnego dostarczenia; wspólna etykieta startowa jest przewijającym się wierszem, więc znika tak jak reszta, gdy pojawi się wystarczająco dużo pracy. `streamMode` to starszy alias runtime. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację do klucza kanonicznego.

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

    - `partial` edytuje pojedynczą wiadomość podglądu w miarę napływania tokenów.
    - `block` emituje fragmenty wielkości szkicu (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału, ograniczone do `textChunkLimit`).
    - Media, błędy i finalne odpowiedzi z jawną odpowiedzią anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie używają wiadomości podglądu.
    - Wiersze narzędzi/postępu renderują się jako kompaktowe emoji + tytuł + szczegóły, gdy są dostępne, na przykład `🛠️ Bash: run tests` lub `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (domyślnie `false`) włącza tekst komentarza/preambuły asystenta w tymczasowym szkicu postępu. Komentarz jest czyszczony przed wyświetleniem, pozostaje przejściowy i nie zmienia dostarczania finalnej odpowiedzi.
    - `streaming.progress.maxLineChars` kontroluje budżet podglądu postępu dla pojedynczego wiersza. Proza jest skracana na granicach słów; szczegóły poleceń i ścieżek zachowują przydatne sufiksy.
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

    - `channels.discord.historyLimit` domyślnie `20`
    - wartość zapasowa: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrole historii DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są kierowane jako sesje kanałów i dziedziczą konfigurację kanału nadrzędnego, chyba że zostaną nadpisane.
    - Sesje wątków dziedziczą wybór `/model` na poziomie sesji kanału nadrzędnego jako zapasowy wybór tylko modelu; lokalne wybory `/model` wątku nadal mają pierwszeństwo, a historia transkryptu nadrzędnego nie jest kopiowana, chyba że dziedziczenie transkryptu jest włączone.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) włącza inicjowanie nowych automatycznych wątków z transkryptu nadrzędnego. Nadpisania dla kont znajdują się pod `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozwiązywać cele DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas zapasowej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych kontrolują, kto może wyzwolić agenta, ale nie stanowią pełnej granicy redakcji dodatkowego kontekstu.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla subagentów">
    Discord może powiązać wątek z celem sesji, aby kolejne wiadomości w tym wątku były nadal kierowane do tej samej sesji (w tym sesji subagentów).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuń bieżące wiązanie wątku
    - `/agents` pokaż aktywne uruchomienia i stan wiązania
    - `/session idle <duration|off>` sprawdź/zaktualizuj automatyczne odpinanie po bezczynności dla skupionych wiązań
    - `/session max-age <duration|off>` sprawdź/zaktualizuj twardy maksymalny wiek dla skupionych wiązań

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
    - `spawnSessions` kontroluje automatyczne tworzenie/powiązywanie wątków dla `sessions_spawn({ thread: true })` i spawnów wątków ACP. Domyślnie: `true`.
    - `defaultSpawnContext` kontroluje natywny kontekst subagenta dla spawnów powiązanych z wątkiem. Domyślnie: `"fork"`.
    - Przestarzałe klucze `spawnSubagentSessions`/`spawnAcpSessions` są migrowane przez `openclaw doctor --fix`.
    - Jeśli wiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje wiązania wątków są niedostępne.

    Zobacz [Subagenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) i [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe wiązania kanałów ACP">
    Dla stabilnych obszarów roboczych ACP „zawsze włączonych” skonfiguruj typowane wiązania ACP najwyższego poziomu kierowane do rozmów Discord.

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

    - `/acp spawn codex --bind here` wiąże bieżący kanał lub wątek w miejscu i utrzymuje przyszłe wiadomości w tej samej sesji ACP. Wiadomości wątku dziedziczą wiązanie kanału nadrzędnego.
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP w miejscu. Tymczasowe wiązania wątków mogą nadpisywać rozwiązywanie celu, gdy są aktywne.
    - `spawnSessions` bramkuje tworzenie/wiązanie wątków podrzędnych przez `--thread auto|here`.

    Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać szczegóły zachowania wiązań.

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
    Kieruj ruch WebSocket Gateway Discord i startowe zapytania REST (ID aplikacji + rozwiązywanie listy dozwolonych) przez proxy HTTP(S) z `channels.discord.proxy`.

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
    Włącz rozwiązywanie PluralKit, aby mapować proxied wiadomości na tożsamość członka systemu:

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
    - wyszukiwania używają oryginalnego ID wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, wiadomości proxy są traktowane jako wiadomości bota i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Aliasy wzmianek wychodzących">
    Użyj `mentionAliases`, gdy agenci potrzebują deterministycznych wzmianek wychodzących dla znanych użytkowników Discord. Klucze to uchwyty bez początkowego `@`; wartości to ID użytkowników Discord. Nieznane uchwyty, `@everyone`, `@here` oraz wzmianki wewnątrz spanów kodu Markdown pozostają bez zmian.

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

    Przykład automatycznej obecności (sygnał kondycji środowiska wykonawczego):

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

    Automatyczna obecność mapuje dostępność środowiska wykonawczego na status Discord: prawidłowy => online, obniżona jakość lub nieznany => idle, wyczerpany lub niedostępny => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discord">
    Discord obsługuje zatwierdzenia oparte na przyciskach w wiadomościach prywatnych i może opcjonalnie publikować monity zatwierdzenia w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; gdy to możliwe, wraca do `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia wykonania, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego, z `execApprovals.approvers` albo z `commands.ownerAllowFrom`. Discord nie wywnioskuje zatwierdzających wykonanie z kanałowego `allowFrom`, starszego `dm.allowFrom` ani `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzeń.

    W przypadku wrażliwych poleceń grupowych dostępnych tylko dla właściciela, takich jak `/diagnostics` i `/export-trajectory`, OpenClaw wysyła monity zatwierdzenia oraz wyniki końcowe prywatnie. Najpierw próbuje wiadomości prywatnej Discord, gdy właściciel wywołujący polecenie ma trasę właściciela Discord; jeśli nie jest ona dostępna, wraca do pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, takiej jak Telegram.

    Gdy `target` ma wartość `channel` albo `both`, monit zatwierdzenia jest widoczny w kanale. Tylko rozwiązani zatwierdzający mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Monity zatwierdzenia zawierają tekst polecenia, więc włączaj dostarczanie do kanału tylko w zaufanych kanałach. Jeśli nie można wyprowadzić ID kanału z klucza sesji, OpenClaw wraca do dostarczania przez wiadomość prywatną.

    Discord renderuje także współdzielone przyciski zatwierdzeń używane przez inne kanały czatu. Natywny adapter Discord dodaje głównie trasowanie wiadomości prywatnych do zatwierdzających oraz fanout do kanałów.
    Gdy te przyciski są obecne, są podstawowym UX zatwierdzania; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    Jeśli natywne środowisko wykonawcze zatwierdzeń Discord nie jest aktywne, OpenClaw zachowuje
    widoczny lokalny, deterministyczny monit `/approve <id> <decision>`. Jeśli
    środowisko wykonawcze jest aktywne, ale nie można dostarczyć natywnej karty do żadnego celu,
    OpenClaw wysyła w tym samym czacie powiadomienie awaryjne z dokładnym poleceniem `/approve`
    z oczekującego zatwierdzenia.

    Rozpoznawanie uwierzytelniania i zatwierdzeń Gateway jest zgodne ze współdzielonym kontraktem klienta Gateway (identyfikatory `plugin:` są rozpoznawane przez `plugin.approval.resolve`; pozostałe identyfikatory przez `exec.approval.resolve`). Zatwierdzenia domyślnie wygasają po 30 minutach.

    Zobacz [Zatwierdzenia Exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki akcji

Akcje wiadomości Discord obejmują akcje wiadomości, administracji kanałami, moderacji, obecności i metadanych.

Podstawowe przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Akcja `event-create` przyjmuje opcjonalny parametr `image` (URL lub ścieżkę do pliku lokalnego), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki akcji znajdują się w `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa akcji                                                                                                                                                              | Domyślne |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone |
| roles                                                                                                                                                                    | wyłączone |
| moderation                                                                                                                                                               | wyłączone |
| presence                                                                                                                                                                 | wyłączone |

## Interfejs użytkownika komponentów v2

OpenClaw używa komponentów Discord v2 do zatwierdzeń exec i znaczników międzykontekstowych. Akcje wiadomości Discord mogą również przyjmować `components` dla niestandardowego interfejsu użytkownika (zaawansowane; wymaga skonstruowania ładunku komponentu za pomocą narzędzia discord), natomiast starsze `embeds` pozostają dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustaw dla każdego konta za pomocą `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` kontroluje, jak długo wysłane wywołania zwrotne komponentów Discord pozostają zarejestrowane (domyślnie `1800000`, maksymalnie `86400000`). Ustaw dla każdego konta za pomocą `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` są ignorowane, gdy obecne są komponenty v2.
- Podglądy zwykłych URL są domyślnie wyłączone. Ustaw `suppressEmbeds: false` w akcji wiadomości, gdy pojedynczy link wychodzący powinien się rozwinąć.

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

1. Włącz Intent treści wiadomości w portalu deweloperskim Discord.
2. Włącz Intent członków serwera, gdy używane są listy dozwolonych ról/użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Przyznaj uprawnienia łączenia, mówienia, wysyłania wiadomości i czytania historii wiadomości w docelowym kanale głosowym.
5. Włącz polecenia natywne (`commands.native` lub `channels.discord.commands.native`).
6. Skonfiguruj `channels.discord.voice`.

Użyj `/vc join|leave|status`, aby kontrolować sesje. Polecenie używa domyślnego agenta konta i przestrzega tych samych reguł list dozwolonych oraz zasad grup, co inne polecenia Discord.

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
- `voice.mode` kontroluje ścieżkę konwersacji. Domyślną wartością jest `agent-proxy`: głosowy interfejs czasu rzeczywistego obsługuje taktowanie tur, przerywanie i odtwarzanie, deleguje zasadniczą pracę do kierowanego agenta OpenClaw przez `openclaw_agent_consult` i traktuje wynik jak wpisany prompt Discord od tego mówcy. `stt-tts` zachowuje starszy przepływ wsadowego STT oraz TTS. `bidi` pozwala modelowi czasu rzeczywistego rozmawiać bezpośrednio, jednocześnie udostępniając `openclaw_agent_consult` dla mózgu OpenClaw.
- `voice.agentSession` kontroluje, która konwersacja OpenClaw otrzymuje tury głosowe. Pozostaw to nieustawione dla własnej sesji kanału głosowego albo ustaw `{ mode: "target", target: "channel:<text-channel-id>" }`, aby kanał głosowy działał jako rozszerzenie mikrofonu/głośnika istniejącej sesji kanału tekstowego Discord, takiej jak `#maintainers`.
- `voice.model` zastępuje mózg agenta OpenClaw dla odpowiedzi głosowych Discord i konsultacji czasu rzeczywistego. Pozostaw nieustawione, aby dziedziczyć kierowany model agenta. Jest to oddzielne od `voice.realtime.model`.
- `voice.followUsers` pozwala botowi dołączać do głosu Discord, przenosić się i opuszczać go wraz z wybranymi użytkownikami. Zobacz [Śledzenie użytkowników w głosie](#follow-users-in-voice), aby poznać reguły zachowania i przykłady.
- `agent-proxy` kieruje mowę przez `discord-voice`, co zachowuje normalną autoryzację właściciela/narzędzi dla mówcy i sesji docelowej, ale ukrywa narzędzie agenta `tts`, ponieważ głos Discord jest właścicielem odtwarzania. Domyślnie `agent-proxy` daje konsultacji pełny dostęp do narzędzi równoważny właścicielowi dla mówców będących właścicielami (`voice.realtime.toolPolicy: "owner"`) i zdecydowanie preferuje konsultowanie agenta OpenClaw przed merytorycznymi odpowiedziami (`voice.realtime.consultPolicy: "always"`). W tym domyślnym trybie `always` warstwa czasu rzeczywistego nie wypowiada automatycznie wypełniaczy przed odpowiedzią konsultacji; przechwytuje i transkrybuje mowę, a następnie wypowiada kierowaną odpowiedź OpenClaw. Jeśli kilka wymuszonych odpowiedzi konsultacji zakończy się, gdy Discord nadal odtwarza pierwszą odpowiedź, późniejsze odpowiedzi w dokładnej mowie są kolejkowane do bezczynności odtwarzania zamiast zastępować mowę w połowie zdania.
- W trybie `stt-tts` STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- W trybach czasu rzeczywistego `voice.realtime.provider`, `voice.realtime.model` i `voice.realtime.speakerVoice` konfigurują sesję audio czasu rzeczywistego. Dla OpenAI Realtime 2 plus mózgu Codex użyj `voice.realtime.model: "gpt-realtime-2"` i `voice.model: "openai/gpt-5.5"`.
- Tryby głosowe czasu rzeczywistego domyślnie uwzględniają małe pliki profilu `IDENTITY.md`, `USER.md` i `SOUL.md` w instrukcjach dostawcy czasu rzeczywistego, aby szybkie bezpośrednie tury zachowywały tę samą tożsamość, osadzenie użytkownika i personę co kierowany agent OpenClaw. Ustaw `voice.realtime.bootstrapContextFiles` na podzbiór, aby to dostosować, albo `[]`, aby to wyłączyć. Obsługiwane pliki rozruchowe czasu rzeczywistego są ograniczone do tych plików profilu; `AGENTS.md` pozostaje w normalnym kontekście agenta. Wstrzyknięty kontekst profilu nie zastępuje `openclaw_agent_consult` przy pracy w obszarze roboczym, bieżących faktach, wyszukiwaniu pamięci ani działaniach wspieranych narzędziami.
- W trybie czasu rzeczywistego OpenAI `agent-proxy` ustaw `voice.realtime.requireWakeName: true`, aby głos czasu rzeczywistego Discord pozostawał cichy, dopóki transkrypt nie zacznie się lub nie skończy nazwą wybudzającą. Skonfigurowane nazwy wybudzające muszą mieć jedno lub dwa słowa. Jeśli `voice.realtime.wakeNames` jest nieustawione, OpenClaw używa kierowanej wartości `name` agenta oraz `OpenClaw`, z awaryjnym użyciem identyfikatora agenta plus `OpenClaw`. Bramkowanie nazwą wybudzającą wyłącza automatyczną odpowiedź dostawcy czasu rzeczywistego, kieruje zaakceptowane tury przez ścieżkę konsultacji agenta OpenClaw i daje krótkie wypowiedziane potwierdzenie, gdy wiodąca nazwa wybudzająca zostanie rozpoznana z częściowej transkrypcji przed nadejściem końcowego transkryptu.
- Dostawca czasu rzeczywistego OpenAI akceptuje bieżące nazwy zdarzeń Realtime 2 i starsze aliasy zgodne z Codex dla zdarzeń audio wyjściowego i transkryptu, dzięki czemu zgodne migawki dostawcy mogą się zmieniać bez utraty audio asystenta.
- `voice.realtime.bargeIn` kontroluje, czy zdarzenia rozpoczęcia mówienia przez użytkownika w Discord przerywają aktywne odtwarzanie czasu rzeczywistego. Jeśli nieustawione, podąża za ustawieniem przerywania audio wejściowego dostawcy czasu rzeczywistego.
- `voice.realtime.minBargeInAudioEndMs` kontroluje minimalny czas odtwarzania asystenta przed tym, jak barge-in OpenAI w czasie rzeczywistym przytnie audio. Domyślnie: `250`. Ustaw `0` dla natychmiastowego przerwania w pokojach o niskim echu albo zwiększ tę wartość dla konfiguracji głośników z dużym echem.
- Dla głosu OpenAI przy odtwarzaniu Discord ustaw `voice.tts.provider: "openai"` i wybierz głos Text-to-speech w `voice.tts.providers.openai.speakerVoice`. `cedar` jest dobrym męsko brzmiącym wyborem w bieżącym modelu TTS OpenAI.
- Nadpisania `systemPrompt` per kanał Discord mają zastosowanie do tur transkryptu głosowego dla tego kanału głosowego.
- Tury transkryptu głosowego wyprowadzają status właściciela z Discord `allowFrom` (lub `dm.allowFrom`) dla poleceń bramkowanych właścicielem i działań kanału. Widoczność narzędzi agenta podąża za skonfigurowaną polityką narzędzi dla kierowanej sesji.
- Głos Discord jest opcjonalny dla konfiguracji tylko tekstowych; ustaw `channels.discord.voice.enabled=true` (albo zachowaj istniejący blok `channels.discord.voice`), aby włączyć polecenia `/vc`, runtime głosowy i intencję Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` może jawnie nadpisać subskrypcję intencji stanu głosu. Pozostaw nieustawione, aby intencja podążała za efektywnym włączeniem głosu.
- Jeśli `voice.autoJoin` ma wiele wpisów dla tej samej gildii, OpenClaw dołącza do ostatniego skonfigurowanego kanału dla tej gildii.
- `voice.allowedChannels` to opcjonalna lista dozwolonych miejsc przebywania. Pozostaw nieustawione, aby zezwolić `/vc join` na dowolny autoryzowany kanał głosowy Discord. Gdy jest ustawione, `/vc join`, automatyczne dołączanie przy starcie i przeniesienia stanu głosowego bota są ograniczone do wymienionych wpisów `{ guildId, channelId }`. Ustaw pustą tablicę, aby odmówić wszystkich dołączeń głosowych Discord. Jeśli Discord przeniesie bota poza listę dozwolonych, OpenClaw opuszcza ten kanał i ponownie dołącza do skonfigurowanego celu automatycznego dołączania, gdy jest dostępny.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli są nieustawione.
- OpenClaw używa dołączonego kodeka `libopus-wasm` do odbioru głosu Discord i odtwarzania surowego PCM w czasie rzeczywistym. Dostarcza przypiętą kompilację libopus WebAssembly i nie wymaga natywnych dodatków opus.
- `voice.connectTimeoutMs` kontroluje początkowe oczekiwanie Ready `@discordjs/voice` dla prób `/vc join` i automatycznego dołączania. Domyślnie: `30000`.
- `voice.reconnectGraceMs` kontroluje, jak długo OpenClaw czeka, aż rozłączona sesja głosowa zacznie ponownie się łączyć, zanim ją zniszczy. Domyślnie: `15000`.
- W trybie `stt-tts` odtwarzanie głosu nie zatrzymuje się tylko dlatego, że inny użytkownik zaczyna mówić. Aby uniknąć pętli sprzężenia zwrotnego, OpenClaw ignoruje nowe przechwytywanie głosu podczas odtwarzania TTS; mów po zakończeniu odtwarzania, aby rozpocząć następną turę. Tryby czasu rzeczywistego przekazują rozpoczęcia mówienia jako sygnały barge-in do dostawcy czasu rzeczywistego.
- W trybach czasu rzeczywistego echo z głośników do otwartego mikrofonu może wyglądać jak barge-in i przerwać odtwarzanie. W pokojach Discord z dużym echem ustaw `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, aby OpenAI nie przerywał automatycznie na audio wejściowe. Dodaj `voice.realtime.bargeIn: true`, jeśli nadal chcesz, aby zdarzenia rozpoczęcia mówienia Discord przerywały aktywne odtwarzanie. Most czasu rzeczywistego OpenAI ignoruje przycięcia odtwarzania krótsze niż `voice.realtime.minBargeInAudioEndMs` jako prawdopodobne echo/szum i rejestruje je jako pominięte zamiast czyścić odtwarzanie Discord.
- `voice.captureSilenceGraceMs` kontroluje, jak długo OpenClaw czeka po zgłoszeniu przez Discord, że mówca przestał mówić, zanim sfinalizuje ten segment audio dla STT. Domyślnie: `2000`; zwiększ tę wartość, jeśli Discord dzieli normalne pauzy na poszarpane częściowe transkrypty.
- Gdy ElevenLabs jest wybranym dostawcą TTS, odtwarzanie głosu Discord używa strumieniowego TTS i zaczyna od strumienia odpowiedzi dostawcy. Dostawcy bez obsługi strumieniowania wracają do ścieżki zsyntetyzowanego pliku tymczasowego.
- OpenClaw obserwuje także błędy odszyfrowywania odbioru i automatycznie odzyskuje działanie, opuszczając kanał głosowy i ponownie do niego dołączając po powtarzających się błędach w krótkim oknie.
- Jeśli logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` po aktualizacji, zbierz raport zależności i logi. Dołączona linia `@discordjs/voice` obejmuje upstreamową poprawkę dopełniania z PR discord.js #11449, która zamknęła issue discord.js #11419.
- Zdarzenia odbioru `The operation was aborted` są oczekiwane, gdy OpenClaw finalizuje przechwycony segment mówcy; są to szczegółowe diagnostyki, nie ostrzeżenia.
- Szczegółowe logi głosu Discord zawierają ograniczony jednowierszowy podgląd transkryptu STT dla każdego zaakceptowanego segmentu mówcy, więc debugowanie pokazuje zarówno stronę użytkownika, jak i stronę odpowiedzi agenta bez zrzucania nieograniczonego tekstu transkryptu.
- W trybie `agent-proxy` wymuszone awaryjne konsultacje pomijają prawdopodobnie niepełne fragmenty transkryptu, takie jak tekst kończący się na `...` lub końcowy łącznik typu `and`, a także oczywiste nieakcyjne zakończenia, takie jak „zaraz wracam” albo „pa”. Logi pokazują `forced agent consult skipped reason=...`, gdy zapobiega to przestarzałej zakolejkowanej odpowiedzi.

### Śledzenie użytkowników w głosie

Użyj `voice.followUsers`, gdy chcesz, aby bot głosowy Discord pozostawał z co najmniej jednym znanym użytkownikiem Discord zamiast dołączać do stałego kanału przy starcie albo czekać na `/vc join`.

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
- `followUsersEnabled` domyślnie ma wartość `true`, gdy `followUsers` jest skonfigurowane. Ustaw `false`, aby zachować zapisaną listę, ale zatrzymać automatyczne śledzenie głosu.
- Gdy śledzony użytkownik dołącza do dozwolonego kanału głosowego, OpenClaw dołącza do tego kanału. Gdy użytkownik się przenosi, OpenClaw przenosi się razem z nim. Gdy aktywny śledzony użytkownik się rozłącza, OpenClaw opuszcza kanał.
- Jeśli wielu śledzonych użytkowników jest w tej samej gildii, a aktywny śledzony użytkownik ją opuszcza, OpenClaw przenosi się do kanału innego śledzonego użytkownika przed opuszczeniem gildii. Jeśli kilku śledzonych użytkowników przenosi się naraz, wygrywa najnowsze zaobserwowane zdarzenie stanu głosu.
- `allowedChannels` nadal ma zastosowanie. Śledzony użytkownik w niedozwolonym kanale jest ignorowany, a sesja należąca do śledzenia przenosi się do innego śledzonego użytkownika albo opuszcza kanał.
- OpenClaw uzgadnia pominięte zdarzenia stanu głosu przy starcie i w ograniczonym interwale. Uzgadnianie próbkuje skonfigurowane gildie i ogranicza wyszukiwania REST na przebieg, więc bardzo duże listy `followUsers` mogą potrzebować więcej niż jednego interwału, aby się zbiec.
- Jeśli Discord lub administrator przeniesie bota, gdy śledzi użytkownika, OpenClaw odbudowuje sesję głosową i zachowuje własność śledzenia, gdy cel jest dozwolony. Jeśli bot zostanie przeniesiony poza `allowedChannels`, OpenClaw opuszcza kanał i ponownie dołącza do skonfigurowanego celu, gdy taki istnieje.
- Odzyskiwanie odbioru DAVE może opuścić i ponownie dołączyć do tego samego kanału po powtarzających się błędach odszyfrowywania. Sesje należące do śledzenia zachowują własność śledzenia przez tę ścieżkę odzyskiwania, więc późniejsze rozłączenie śledzonego użytkownika nadal opuszcza kanał.

Wybierz między trybami dołączania:

- Użyj `followUsers` dla konfiguracji osobistych lub operatorskich, w których bot powinien automatycznie być w głosie, gdy Ty jesteś.
- Użyj `autoJoin` dla botów stałego pokoju, które powinny być obecne nawet wtedy, gdy żaden śledzony użytkownik nie jest w głosie.
- Użyj `/vc join` dla jednorazowych dołączeń lub pokojów, w których automatyczna obecność głosowa byłaby zaskakująca.

Kodek głosowy Discord:

- Logi odbierania głosu pokazują `discord voice: opus decoder: libopus-wasm`.
- Odtwarzanie w czasie rzeczywistym koduje surowe stereo PCM 48 kHz do Opus przy użyciu tego samego dołączonego pakietu `libopus-wasm`, zanim przekaże pakiety do `@discordjs/voice`.
- Odtwarzanie plików i strumieni od dostawcy transkoduje do surowego stereo PCM 48 kHz za pomocą ffmpeg, a następnie używa `libopus-wasm` dla strumienia pakietów Opus wysyłanego do Discord.

Potok STT plus TTS:

- Przechwytywanie PCM z Discord jest konwertowane do tymczasowego pliku WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypcja jest wysyłana przez ingress i routing Discord, podczas gdy LLM odpowiedzi działa z zasadą wyjścia głosowego, która ukrywa narzędzie agenta `tts` i prosi o zwrócony tekst, ponieważ głos Discord odpowiada za końcowe odtwarzanie TTS.
- `voice.model`, gdy jest ustawione, nadpisuje tylko LLM odpowiedzi dla tej tury kanału głosowego.
- `voice.tts` jest scalane z `messages.tts`; dostawcy obsługujący streaming zasilają odtwarzacz bezpośrednio, w przeciwnym razie wynikowy plik audio jest odtwarzany na połączonym kanale.

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

Bez bloku `voice.agentSession` każdy kanał głosowy otrzymuje własną routowaną sesję OpenClaw. Na przykład `/vc join channel:234567890123456789` rozmawia z sesją dla tego kanału głosowego Discord. Model czasu rzeczywistego jest tylko głosowym interfejsem wejściowym; istotne żądania są przekazywane skonfigurowanemu agentowi OpenClaw. Jeśli model czasu rzeczywistego wygeneruje końcową transkrypcję bez wywołania narzędzia konsultacji, OpenClaw wymusza konsultację jako fallback, aby domyślnie nadal zachowywać się jak rozmowa z agentem.

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

Przykład bidi w czasie rzeczywistym:

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

W trybie `agent-proxy` bot dołącza do skonfigurowanego kanału głosowego, ale tury agenta OpenClaw używają normalnej routowanej sesji i agenta kanału docelowego. Sesja głosowa czasu rzeczywistego wypowiada zwrócony wynik z powrotem na kanał głosowy. Agent nadzorujący nadal może używać normalnych narzędzi wiadomości zgodnie ze swoją zasadą narzędzi, w tym wysłać osobną wiadomość Discord, jeśli to właściwe działanie.

Gdy delegowane uruchomienie OpenClaw jest aktywne, nowe transkrypcje głosowe Discord są traktowane jako sterowanie aktywnym uruchomieniem przed rozpoczęciem kolejnej tury agenta. Frazy takie jak „status”, „anuluj to”, „użyj mniejszej poprawki” lub „gdy skończysz, sprawdź też testy” są klasyfikowane jako status, anulowanie, sterowanie lub dane wejściowe follow-up dla aktywnej sesji. Wyniki statusu, anulowania, zaakceptowanego sterowania i follow-up są wypowiadane z powrotem na kanał głosowy, aby dzwoniący wiedział, czy OpenClaw obsłużył żądanie.

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

Użyj tego, gdy model słyszy własne odtwarzanie Discord przez otwarty mikrofon, ale nadal chcesz przerywać mu mówieniem. OpenClaw zapobiega automatycznemu przerywaniu przez OpenAI na podstawie surowego wejścia audio, podczas gdy `bargeIn: true` pozwala zdarzeniom rozpoczęcia mówienia przez użytkownika Discord i już aktywnemu audio mówcy anulować aktywne odpowiedzi czasu rzeczywistego, zanim następna przechwycona tura dotrze do OpenAI. Bardzo wczesne sygnały barge-in z `audioEndMs` poniżej `minBargeInAudioEndMs` są traktowane jako prawdopodobne echo/szum i ignorowane, aby model nie urywał wypowiedzi przy pierwszej ramce odtwarzania.

Oczekiwane logi głosowe:

- Przy dołączeniu: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Przy starcie czasu rzeczywistego: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Przy audio mówcy: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` oraz `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Przy pominiętej nieaktualnej mowie: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` lub `reason=non-actionable-closing ...`
- Przy zakończeniu odpowiedzi czasu rzeczywistego: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Przy zatrzymaniu/resecie odtwarzania: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Przy konsultacji czasu rzeczywistego: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Przy odpowiedzi agenta: `discord voice: agent turn answer ...`
- Przy zakolejkowanej dokładnej mowie: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, po czym `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Przy wykryciu barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` lub `discord voice: realtime barge-in detected source=active-speaker-audio ...`, po czym `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Przy przerwaniu czasu rzeczywistego: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, po czym albo `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...`, albo `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Przy zignorowanym echu/szumie: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Przy wyłączonym barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Przy bezczynnym odtwarzaniu: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Aby debugować ucinanie audio, czytaj logi głosu czasu rzeczywistego jako oś czasu:

1. `realtime audio playback started` oznacza, że Discord zaczął odtwarzać audio asystenta. Bridge zaczyna od tego punktu liczyć fragmenty wyjścia asystenta, bajty PCM Discord, bajty czasu rzeczywistego dostawcy i syntetyzowany czas trwania audio.
2. `realtime speaker turn opened` oznacza, że mówca Discord stał się aktywny. Jeśli odtwarzanie jest już aktywne i `bargeIn` jest włączone, po tym może nastąpić `barge-in detected source=speaker-start`.
3. `realtime input audio started` oznacza pierwszą rzeczywistą ramkę audio odebraną dla tej tury mówcy. `outputActive=true` lub niezerowe `outputAudioMs` tutaj oznacza, że mikrofon wysyła wejście, gdy odtwarzanie asystenta nadal jest aktywne.
4. `barge-in detected source=active-speaker-audio` oznacza, że OpenClaw wykrył audio żywego mówcy, gdy odtwarzanie asystenta było aktywne. Jest to przydatne do odróżnienia rzeczywistego przerwania od zdarzenia rozpoczęcia mówienia Discord bez użytecznego audio.
5. `barge-in requested reason=...` oznacza, że OpenClaw poprosił dostawcę czasu rzeczywistego o anulowanie lub skrócenie aktywnej odpowiedzi. Zawiera `outputAudioMs`, `outputActive` i `playbackChunks`, aby pokazać, ile audio asystenta faktycznie odtworzono przed przerwaniem.
6. `realtime audio playback stopped reason=...` to lokalny punkt resetu odtwarzania Discord. Powód wskazuje, kto zatrzymał odtwarzanie: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` lub `session-close`.
7. `realtime speaker turn closed` podsumowuje przechwyconą turę wejściową. `chunks=0` lub `hasAudio=false` oznacza, że tura mówcy została otwarta, ale do bridge czasu rzeczywistego nie dotarło użyteczne audio. `interruptedPlayback=true` oznacza, że ta tura wejściowa nałożyła się na wyjście asystenta i wyzwoliła logikę barge-in.

Przydatne pola:

- `outputAudioMs`: czas trwania audio asystenta wygenerowany przez dostawcę czasu rzeczywistego przed wierszem logu.
- `audioMs`: czas trwania audio asystenta zliczony przez OpenClaw przed zatrzymaniem odtwarzania.
- `elapsedMs`: czas zegarowy między otwarciem i zamknięciem strumienia odtwarzania lub tury mówcy.
- `discordBytes`: bajty stereo PCM 48 kHz wysłane do lub odebrane z głosu Discord.
- `realtimeBytes`: bajty PCM w formacie dostawcy wysłane do lub odebrane od dostawcy czasu rzeczywistego.
- `playbackChunks`: fragmenty audio asystenta przekazane do Discord dla aktywnej odpowiedzi.
- `sinceLastAudioMs`: przerwa między ostatnią przechwyconą ramką audio mówcy a zamknięciem tury mówcy.

Typowe wzorce:

- Natychmiastowe ucięcie z `source=active-speaker-audio`, małym `outputAudioMs` i tym samym użytkownikiem w pobliżu zwykle wskazuje na echo z głośnika trafiające do mikrofonu. Zwiększ `voice.realtime.minBargeInAudioEndMs`, zmniejsz głośność głośnika, użyj słuchawek albo ustaw `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start`, po którym następuje `speaker turn closed ... hasAudio=false`, oznacza, że Discord zgłosił rozpoczęcie mówienia, ale żadne audio nie dotarło do OpenClaw. Może to być przejściowe zdarzenie głosowe Discord, zachowanie bramki szumów lub krótkie włączenie mikrofonu przez klienta.
- `audio playback stopped reason=stream-close` bez pobliskiego barge-in lub `provider-clear-audio` oznacza, że lokalny strumień odtwarzania Discord zakończył się nieoczekiwanie. Sprawdź poprzedzające logi dostawcy i odtwarzacza Discord.
- `capture ignored during playback (barge-in disabled)` oznacza, że OpenClaw celowo odrzucił wejście, gdy audio asystenta było aktywne. Włącz `voice.realtime.bargeIn`, jeśli chcesz, aby mowa przerywała odtwarzanie.
- `barge-in ignored ... outputActive=false` oznacza, że Discord lub VAD dostawcy zgłosił mowę, ale OpenClaw nie miał aktywnego odtwarzania do przerwania. To nie powinno ucinać audio.

Poświadczenia są rozwiązywane osobno dla każdego komponentu: uwierzytelnianie trasy LLM dla `voice.model`, uwierzytelnianie STT dla `tools.media.audio`, uwierzytelnianie TTS dla `messages.tts`/`voice.tts` oraz uwierzytelnianie dostawcy czasu rzeczywistego dla `voice.realtime.providers` lub normalnej konfiguracji uwierzytelniania dostawcy.

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd fali i wymagają audio OGG/Opus. OpenClaw generuje falę automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście gateway, aby sprawdzać i konwertować.

- Podaj **lokalną ścieżkę pliku** (adresy URL są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst i wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw w razie potrzeby konwertuje go na OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy zależysz od rozpoznawania użytkowników/członków
    - zrestartuj gateway po zmianie intencji

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

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

  <Accordion title="Require mention false but still blocked">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych gildii/kanałów
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi być pod `channels.discord.guilds` lub we wpisie kanału)
    - nadawca zablokowany przez listę dozwolonych `users` gildii/kanału

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Typowe logi:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Pokrętła kolejki Discord gateway:

    - pojedyncze konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - kontroluje to tylko pracę nasłuchiwania Discord gateway, a nie czas życia tury agenta

    Discord nie stosuje limitu czasu należącego do kanału do kolejkowanych tur agenta. Nasłuchiwacze wiadomości przekazują pracę natychmiast, a kolejkowane uruchomienia Discord zachowują kolejność w ramach sesji do czasu zakończenia albo przerwania pracy przez cykl życia sesji/narzędzia/środowiska uruchomieniowego.

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
    OpenClaw pobiera metadane Discord `/gateway/bot` przed połączeniem. Przejściowe awarie przechodzą na domyślny adres URL Discord gateway i są limitowane w logach.

    Pokrętła limitu czasu metadanych:

    - pojedyncze konto: `channels.discord.gatewayInfoTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - domyślnie: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw czeka na zdarzenie Discord gateway `READY` podczas uruchamiania i po ponownych połączeniach środowiska uruchomieniowego. Konfiguracje wielokontowe z rozłożeniem startu w czasie mogą wymagać dłuższego okna READY podczas uruchamiania niż domyślne.

    Pokrętła limitu czasu READY:

    - uruchamianie, pojedyncze konto: `channels.discord.gatewayReadyTimeoutMs`
    - uruchamianie, wiele kont: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env podczas uruchamiania, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - domyślne uruchamianie: `15000` (15 sekund), maks.: `120000`
    - środowisko uruchomieniowe, pojedyncze konto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - środowisko uruchomieniowe, wiele kont: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env środowiska uruchomieniowego, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - domyślne środowisko uruchomieniowe: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Kontrole uprawnień `channels status --probe` działają tylko dla numerycznych identyfikatorów kanałów.

    Jeśli używasz kluczy slug, dopasowywanie w środowisku uruchomieniowym nadal może działać, ale sonda nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - polityka DM wyłączona: `channels.discord.dmPolicy="disabled"` (starsze: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Domyślnie wiadomości napisane przez boty są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, użyj ścisłych reguł wzmianek i list dozwolonych, aby uniknąć zachowania pętli.
    Preferuj `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota.

    OpenClaw dostarcza też współdzieloną [ochronę przed pętlami botów](/pl/channels/bot-loop-protection). Gdy `allowBots` pozwala wiadomościom napisanym przez boty trafić do dispatch, Discord mapuje zdarzenie przychodzące na fakty `(account, channel, bot pair)`, a ogólny strażnik pary wycisza parę po przekroczeniu skonfigurowanego budżetu zdarzeń. Strażnik zapobiega niekontrolowanym pętlom dwóch botów, które wcześniej musiały być zatrzymywane przez limity szybkości Discord; nie wpływa na wdrożenia z jednym botem ani jednorazowe odpowiedzi botów mieszczące się w budżecie.

    Ustawienia domyślne (aktywne, gdy ustawiono `allowBots`):

    - `maxEventsPerWindow: 20` -- para botów może wymienić 20 wiadomości w przesuwanym oknie
    - `windowSeconds: 60` -- długość przesuwanego okna
    - `cooldownSeconds: 60` -- po przekroczeniu budżetu każda dodatkowa wiadomość bot-do-bota w dowolnym kierunku jest odrzucana przez jedną minutę

    Skonfiguruj współdzielone ustawienie domyślne raz pod `channels.defaults.botLoopProtection`, a następnie nadpisz Discord, gdy prawidłowy przepływ pracy potrzebuje większego zapasu. Kolejność pierwszeństwa:

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby logika odzyskiwania odbioru głosu Discord była dostępna
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli awarie trwają po automatycznym ponownym dołączeniu, zbierz logi i porównaj z upstreamową historią odbioru DAVE w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) i [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Odniesienie konfiguracji

Główne odniesienie: [Odniesienie konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- polityka: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenie: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet nasłuchiwacza), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- odpowiedź/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponawianie: `mediaMaxMb` (ogranicza wychodzące przesyłanie Discord, domyślnie `100MB`), `retry`
- akcje: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jak sekrety (`DISCORD_BOT_TOKEN` preferowane w nadzorowanych środowiskach).
- Nadawaj uprawnienia Discord zgodnie z zasadą najmniejszych uprawnień.
- Jeśli wdrożenie poleceń/stan jest nieaktualny, zrestartuj gateway i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discord z gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pl/channels/groups">
    Zachowanie czatu grupowego i list dozwolonych.
  </Card>
  <Card title="Channel routing" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Security" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj gildie i kanały na agentów.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pl/tools/slash-commands">
    Zachowanie poleceń natywnych.
  </Card>
</CardGroup>
