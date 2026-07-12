---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Konfiguracja bota Discord, klucze konfiguracji, komponenty, obsługa głosu i rozwiązywanie problemów
title: Discord
x-i18n:
    generated_at: "2026-07-12T14:52:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw łączy się z Discordem jako bot za pośrednictwem oficjalnego Gateway Discorda. Obsługiwane są wiadomości prywatne i kanały serwerów.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Discorda domyślnie działają w trybie parowania.
  </Card>
  <Card title="Polecenia z ukośnikiem" icon="terminal" href="/pl/tools/slash-commands">
    Natywne działanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i proces naprawy.
  </Card>
</CardGroup>

## Szybka konfiguracja

Utwórz aplikację Discorda z botem, dodaj bota do swojego serwera i sparuj go z OpenClaw. Jeśli możesz, użyj prywatnego serwera; w razie potrzeby najpierw [utwórz serwer](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**).

<Steps>
  <Step title="Utwórz aplikację Discorda i bota">
    W [Portalu deweloperskim Discorda](https://discord.com/developers/applications) kliknij **New Application** i nadaj aplikacji nazwę (na przykład „OpenClaw”).

    Otwórz **Bot** na pasku bocznym i ustaw **Username** na nazwę swojego agenta.

  </Step>

  <Step title="Włącz uprzywilejowane intencje">
    Pozostając na stronie **Bot**, w sekcji **Privileged Gateway Intents** włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane w przypadku list dozwolonych ról, dopasowywania nazw do identyfikatorów i grup dostępu do odbiorców kanału)
    - **Presence Intent** (opcjonalne; tylko na potrzeby aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Na stronie **Bot** kliknij **Reset Token** i skopiuj token.

    <Note>
    Wbrew nazwie powoduje to wygenerowanie pierwszego tokenu — nic nie jest „resetowane”.
    </Note>

  </Step>

  <Step title="Wygeneruj adres URL zaproszenia i dodaj bota do serwera">
    Otwórz **OAuth2** na pasku bocznym. W sekcji **OAuth2 URL Generator** włącz zakresy:

    - `bot`
    - `applications.commands`

    W wyświetlonej sekcji **Bot Permissions** włącz co najmniej:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcjonalnie)

    Jest to podstawowy zestaw uprawnień dla zwykłych kanałów tekstowych. Jeśli bot będzie publikować w wątkach — w tym w procesach dotyczących kanałów forum lub multimedialnych, które tworzą albo kontynuują wątek — włącz również **Send Messages in Threads**.

    Skopiuj wygenerowany adres URL, otwórz go w przeglądarce, wybierz swój serwer i kliknij **Continue**. Bot powinien być teraz widoczny na Twoim serwerze.

  </Step>

  <Step title="Włącz tryb deweloperski i zbierz identyfikatory">
    W aplikacji Discord włącz tryb deweloperski, aby móc kopiować identyfikatory:

    1. **User Settings** (ikona koła zębatego) → **Developer** → włącz **Developer Mode**
       *(na urządzeniu mobilnym: **App Settings** → **Advanced**)*
    2. Kliknij prawym przyciskiem myszy **ikonę serwera** → **Copy Server ID**
    3. Kliknij prawym przyciskiem myszy **własny awatar** → **Copy User ID**

    Zachowaj identyfikator serwera i identyfikator użytkownika razem z tokenem bota; w następnym kroku potrzebne będą wszystkie trzy wartości.

  </Step>

  <Step title="Zezwól na wiadomości prywatne od członków serwera">
    Aby parowanie działało, Discord musi pozwalać botowi wysyłać Ci wiadomości prywatne. Kliknij prawym przyciskiem myszy **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Pozostaw tę opcję włączoną, jeśli korzystasz z wiadomości prywatnych Discorda w OpenClaw. Jeśli korzystasz wyłącznie z kanałów serwera, możesz ją wyłączyć po sparowaniu.

  </Step>

  <Step title="Bezpiecznie ustaw token bota (nie wysyłaj go na czacie)">
    Token bota jest poufny. Ustaw go na maszynie, na której działa OpenClaw, zanim wyślesz wiadomość do agenta:

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

    Jeśli OpenClaw działa już jako usługa w tle, uruchom go ponownie za pomocą aplikacji OpenClaw na Maca albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.
    W przypadku instalacji jako usługi zarządzanej uruchom `openclaw gateway install` w powłoce, w której ustawiono `DISCORD_BOT_TOKEN`, albo zapisz zmienną w `~/.openclaw/.env`, aby usługa mogła po ponownym uruchomieniu rozpoznać odwołanie SecretRef do zmiennej środowiskowej.
    Jeśli Twój host jest blokowany albo podlega ograniczeniu liczby żądań podczas początkowego wyszukiwania aplikacji przez Discorda, ustaw identyfikator aplikacji/klienta z Portalu deweloperskiego, aby podczas uruchamiania można było pominąć to wywołanie REST: `channels.discord.applicationId` dla konta domyślnego albo `channels.discord.accounts.<accountId>.applicationId` osobno dla każdego bota.

  </Step>

  <Step title="Skonfiguruj OpenClaw i przeprowadź parowanie">

    <Tabs>
      <Tab title="Poproś agenta">
        Porozmawiaj ze swoim agentem OpenClaw na istniejącym kanale (na przykład Telegramie) i przekaż mu instrukcję. Jeśli Discord jest Twoim pierwszym kanałem, zamiast tego użyj karty CLI / konfiguracja.

        > „Token mojego bota Discorda jest już ustawiony w konfiguracji. Dokończ konfigurację Discorda z identyfikatorem użytkownika `<user_id>` i identyfikatorem serwera `<server_id>`”.
      </Tab>
      <Tab title="CLI / konfiguracja">
        Konfiguracja oparta na pliku:

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

        Zapasowa zmienna środowiskowa dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        W przypadku konfiguracji skryptowej lub zdalnej zapisz ten sam blok JSON5 za pomocą polecenia `openclaw config patch --file ./discord.patch.json5 --dry-run`, a następnie uruchom je ponownie bez `--dry-run`. Działają również zwykłe ciągi `token` w postaci jawnego tekstu, a dla `channels.discord.token` obsługiwane są wartości SecretRef pochodzące od dostawców env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

        W przypadku wielu botów Discorda przechowuj token i identyfikator aplikacji każdego bota na jego koncie. Konta dziedziczą nadrzędną wartość `channels.discord.applicationId`, dlatego ustawiaj ją na tym poziomie tylko wtedy, gdy wszystkie konta używają tego samego identyfikatora aplikacji.

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
    Gdy Gateway jest uruchomiony, wyślij botowi wiadomość prywatną na Discordzie. Bot odpowie kodem parowania.

    <Tabs>
      <Tab title="Poproś agenta">
        Wyślij kod parowania swojemu agentowi na istniejącym kanale:

        > „Zatwierdź ten kod parowania Discorda: `<CODE>`”.
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kody parowania wygasają po godzinie. Po zatwierdzeniu możesz rozmawiać z agentem w wiadomościach prywatnych Discorda.

  </Step>
</Steps>

<Note>
Rozpoznawanie tokenów uwzględnia konto. Wartości tokenów z konfiguracji mają pierwszeństwo przed zapasową zmienną środowiskową, a `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
Jeśli dwa włączone konta Discorda rozpoznają ten sam token bota, OpenClaw uruchamia dla niego tylko jeden monitor Gateway: token pochodzący z konfiguracji ma pierwszeństwo przed zapasową zmienną środowiskową; w przeciwnym razie pierwszeństwo ma pierwsze włączone konto, a zduplikowane konto zostaje zgłoszone jako wyłączone z powodem `duplicate bot token`.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/działania kanału) jawnie określony dla danego wywołania `token` jest używany tylko w tym wywołaniu. Dotyczy to zarówno wysyłania, jak i działań służących do odczytu lub sprawdzania (odczyt/wyszukiwanie/pobieranie/wątek/przypięcia/uprawnienia). Ustawienia zasad konta i ponawiania prób nadal pochodzą z wybranego konta w aktywnym obrazie stanu środowiska wykonawczego.
</Note>

## Zalecane: skonfiguruj przestrzeń roboczą serwera

Gdy wiadomości prywatne już działają, możesz przekształcić serwer w pełną przestrzeń roboczą, w której każdy kanał otrzymuje własną sesję agenta z własnym kontekstem. Jest to zalecane w przypadku prywatnych serwerów, na których znajdujesz się tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
    Pozwoli to agentowi odpowiadać na dowolnym kanale Twojego serwera, a nie tylko w wiadomościach prywatnych.

    <Tabs>
      <Tab title="Poproś agenta">
        > „Dodaj identyfikator mojego serwera Discorda `<server_id>` do listy dozwolonych serwerów”.
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

  <Step title="Zezwól na odpowiedzi bez wzmianki @">
    Domyślnie agent odpowiada na kanałach serwera tylko wtedy, gdy zostanie oznaczony wzmianką @. Na prywatnym serwerze prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    Na kanałach serwera zwykłe odpowiedzi są domyślnie publikowane automatycznie. W przypadku współdzielonych, stale aktywnych pokojów ustaw `messages.groupChat.visibleReplies: "message_tool"`, aby agent mógł obserwować rozmowę i publikować tylko wtedy, gdy uzna, że odpowiedź na kanale będzie przydatna. Najlepiej działa to z modelami najnowszej generacji, które niezawodnie korzystają z narzędzi, takimi jak GPT-5.6 Sol. Zdarzenia pokojów w tle pozostają niewidoczne, dopóki narzędzie czegoś nie wyśle. Pełną konfigurację trybu obserwowania znajdziesz w sekcji [Zdarzenia pokojów w tle](/pl/channels/ambient-room-events).

    Jeśli Discord pokazuje wskaźnik pisania, a dzienniki wskazują użycie tokenów, lecz żadna wiadomość nie została opublikowana, sprawdź, czy tura została skonfigurowana jako zdarzenie pokoju w tle albo czy włączono widoczne odpowiedzi za pomocą narzędzia wiadomości.

    <Tabs>
      <Tab title="Poproś agenta">
        > „Zezwól mojemu agentowi odpowiadać na tym serwerze bez konieczności oznaczania go wzmianką @”.
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

        Aby wymagać wysyłania za pomocą narzędzia wiadomości w przypadku widocznych odpowiedzi grupowych lub kanałowych, ustaw `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zaplanuj korzystanie z pamięci na kanałach serwera">
    Pamięć długoterminowa (`MEMORY.md`) jest automatycznie wczytywana tylko w sesjach wiadomości prywatnych; kanały serwera jej nie wczytują.

    <Tabs>
      <Tab title="Poproś agenta">
        > „Gdy zadaję pytania na kanałach Discorda, używaj `memory_search` lub `memory_get`, jeśli potrzebujesz długoterminowego kontekstu z `MEMORY.md`”.
      </Tab>
      <Tab title="Ręcznie">
        Aby udostępnić wspólny kontekst na każdym kanale, umieść stałe instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Notatki długoterminowe przechowuj w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kanały i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał jest odizolowaną sesją — skonfiguruj `#coding`, `#home`, `#research` lub dowolne inne kanały pasujące do Twojego sposobu pracy.

## Model środowiska wykonawczego

- Gateway zarządza połączeniem z Discordem.
- Kierowanie odpowiedzi jest deterministyczne: odpowiedzi na wiadomości przychodzące z Discorda wracają do Discorda.
- Metadane serwera i kanału Discorda są dodawane do monitu modelu jako niezaufany kontekst, a nie jako widoczny dla użytkownika prefiks odpowiedzi. Jeśli model skopiuje tę otoczkę do odpowiedzi, OpenClaw usunie skopiowane metadane z odpowiedzi wychodzących i z kontekstu przyszłych powtórzeń.
- Domyślnie (`session.dmScope=main`) bezpośrednie rozmowy współdzielą główną sesję agenta (`agent:main:main`).
- Kanały serwera mają odizolowane klucze sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe wiadomości prywatne są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia z ukośnikiem działają w odizolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), zachowując jednocześnie `CommandTargetSessionKey` prowadzący do sesji docelowej rozmowy.
- Dostarczanie do Discorda tekstowych ogłoszeń Cron/Heartbeat jest sprowadzane do końcowej odpowiedzi asystenta widocznej dla użytkownika i wysyłane jednokrotnie. Ładunki multimedialne i ładunki komponentów strukturalnych pozostają wielowiadomościowe, gdy agent generuje wiele ładunków przeznaczonych do dostarczenia.

## Kanały forum

Kanały forum i kanały multimedialne Discorda akceptują wyłącznie posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do kanału nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytułem wątku będzie pierwszy niepusty wiersz wiadomości (skrócony do obowiązującego w Discord limitu 100 znaków dla nazwy wątku).
- Użyj `openclaw message thread create`, aby utworzyć wątek bezpośrednio. W przypadku kanałów forum nie przekazuj `--message-id`.

Wyślij wiadomość do kanału nadrzędnego forum, aby utworzyć wątek:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Utwórz wątek forum jawnie:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Kanały nadrzędne forum nie obsługują komponentów Discord. Jeśli potrzebujesz komponentów, wyślij wiadomość do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery komponentów Discord v2 w wiadomościach agenta. Użyj narzędzia do wiadomości z ładunkiem `components`. Wyniki interakcji są przekazywane z powrotem do agenta jako zwykłe wiadomości przychodzące i podlegają istniejącym ustawieniom Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji mogą zawierać maksymalnie 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponentów można użyć tylko raz. Ustaw `components.reusable=true`, aby umożliwić wielokrotne używanie przycisków, pól wyboru i formularzy aż do ich wygaśnięcia.

Aby ograniczyć grono osób, które mogą kliknąć przycisk, ustaw dla niego `allowedUsers` (identyfikatory użytkowników Discord, znaczniki lub `*`). Niedopasowani użytkownicy otrzymają tymczasową odmowę widoczną tylko dla nich.

Wywołania zwrotne komponentów domyślnie wygasają po 30 minutach. Ustaw `channels.discord.agentComponents.ttlMs`, aby zmienić czas przechowywania rejestru wywołań zwrotnych dla konta domyślnego, albo `channels.discord.accounts.<accountId>.agentComponents.ttlMs` dla poszczególnych kont. Wartość jest podawana w milisekundach, musi być dodatnią liczbą całkowitą i nie może przekraczać `86400000` (24 godzin). Dłuższy czas TTL sprawdza się w przepływach przeglądu i zatwierdzania, w których przyciski muszą pozostawać aktywne, ale wydłuża okres, w którym stara wiadomość Discord może nadal wywołać akcję. Wybierz najkrótszy odpowiedni czas TTL i zachowaj wartość domyślną, jeśli nieaktualne wywołania zwrotne mogłyby być zaskakujące.

Polecenia ukośnikowe `/model` i `/models` otwierają interaktywny selektor modelu z listami rozwijanymi dostawcy, modelu i zgodnego środowiska wykonawczego oraz etapem Submit. Polecenie `/models add` jest przestarzałe i zamiast rejestrować modele z poziomu czatu zwraca komunikat o wycofaniu. Odpowiedź selektora jest tymczasowa, widoczna tylko dla użytkownika, który go wywołał, i tylko on może z niej korzystać. Menu wyboru Discord są ograniczone do 25 opcji, dlatego dodaj wpisy `provider/*` do `agents.defaults.models`, jeśli selektor ma wyświetlać dynamicznie wykryte modele tylko dla wybranych dostawców, takich jak `openai` lub `vllm`.

Załączniki:

- Bloki `file` muszą wskazywać odwołanie do załącznika (`attachment://<filename>`)
- Przekaż załącznik przez `media`/`path`/`filePath` (pojedynczy plik); w przypadku wielu plików użyj `media-gallery`
- Użyj `filename`, aby zastąpić nazwę przesyłanego pliku, gdy powinna odpowiadać odwołaniu do załącznika

Formularze modalne:

- Dodaj `components.modal` zawierający maksymalnie 5 pól
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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` kontroluje dostęp do wiadomości prywatnych. `channels.discord.allowFrom` jest kanoniczną listą dozwolonych nadawców wiadomości prywatnych.

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego nadawcy w `allowFrom`)
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`)
    - `disabled`

    Jeśli zasada wiadomości prywatnych nie ma wartości `open`, nieznani użytkownicy są blokowani (lub proszeni o sparowanie w trybie `pairing`).

    Kolejność pierwszeństwa przy wielu kontach:

    - `channels.discord.accounts.default.allowFrom` ma zastosowanie wyłącznie do konta `default`.
    - W przypadku jednego konta `allowFrom` ma pierwszeństwo przed starszym `dm.allowFrom`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy nie ustawiono ich własnego `allowFrom` ani starszego `dm.allowFrom`.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Starsze ustawienia `channels.discord.dm.policy` i `channels.discord.dm.allowFrom` są nadal odczytywane w celu zachowania zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, jeśli może to zrobić bez zmiany dostępu.

    Format celu dostarczania wiadomości prywatnych:

    - `user:<id>`
    - wzmianka `<@id>`

    Same identyfikatory numeryczne są zwykle interpretowane jako identyfikatory kanałów, gdy aktywna jest domyślna wartość kanału, ale identyfikatory wymienione na obowiązującej dla konta liście `allowFrom` wiadomości prywatnych są ze względów zgodności traktowane jako cele wiadomości prywatnych do użytkowników.

  </Tab>

  <Tab title="Access groups">
    Autoryzacja wiadomości prywatnych Discord i poleceń tekstowych może używać dynamicznych wpisów `accessGroup:<name>` w `channels.discord.allowFrom`.

    Nazwy grup dostępu są współdzielone przez kanały wiadomości. Użyj `type: "message.senders"` dla statycznej grupy, której członkowie są wyrażeni za pomocą standardowej składni `allowFrom` każdego kanału, albo `type: "discord.channelAudience"`, gdy bieżący krąg odbiorców uprawnienia `ViewChannel` kanału Discord ma dynamicznie określać członkostwo. Wspólne działanie grup dostępu: [Grupy dostępu](/pl/channels/access-groups).

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

    Kanał tekstowy Discord nie ma osobnej listy członków. `type: "discord.channelAudience"` modeluje członkostwo w następujący sposób: nadawca wiadomości prywatnej jest członkiem skonfigurowanego serwera i ma obecnie skuteczne uprawnienie `ViewChannel` do skonfigurowanego kanału po zastosowaniu nadpisań ról i kanału.

    Przykład: zezwól każdemu, kto widzi `#maintainers`, na wysyłanie wiadomości prywatnych do bota, pozostawiając je zablokowane dla wszystkich pozostałych osób.

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

    Możesz łączyć wpisy dynamiczne i statyczne:

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

    W razie błędu wyszukiwania dostęp jest domyślnie blokowany. Jeśli Discord zwróci `Missing Access`, wyszukiwanie członka zakończy się niepowodzeniem albo kanał należy do innego serwera, nadawca wiadomości prywatnej jest uznawany za nieautoryzowanego.

    Podczas korzystania z grup dostępu opartych na kręgu odbiorców kanału włącz **Server Members Intent** w Discord Developer Portal. Wiadomości prywatne nie zawierają stanu członkostwa w serwerze, dlatego OpenClaw ustala członka za pośrednictwem Discord REST podczas autoryzacji.

  </Tab>

  <Tab title="Guild policy">
    Obsługą serwerów steruje `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczną wartością bazową, gdy istnieje `channels.discord`, jest `allowlist`.

    Działanie `allowlist`:

    - serwer musi odpowiadać wpisowi w `channels.discord.guilds` (preferowany jest `id`, akceptowany jest także uproszczony identyfikator)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane są stabilne identyfikatory) i `roles` (wyłącznie identyfikatory ról); jeśli skonfigurowano którąkolwiek z nich, nadawcy są dopuszczani, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw i znaczników jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` wyłącznie jako awaryjny tryb zgodności
    - `users` obsługuje nazwy i znaczniki, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega o użyciu wpisów nazw lub znaczników
    - jeśli dla serwera skonfigurowano `channels`, kanały niewymienione na liście są blokowane
    - jeśli serwer nie ma bloku `channels`, dozwolone są wszystkie kanały na tym serwerze znajdującym się na liście dozwolonych

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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Starszy klucz `allow` dla poszczególnych kanałów jest migrowany do `enabled` przez `openclaw doctor --fix`.

    Jeśli ustawisz wyłącznie `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, awaryjną wartością środowiska wykonawczego będzie `groupPolicy="allowlist"` (z ostrzeżeniem w dziennikach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Wiadomości na serwerach domyślnie wymagają wzmianki.

    Wykrywanie wzmianek obejmuje:

    - bezpośrednią wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, z wartością rezerwową `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    Podczas tworzenia wychodzących wiadomości Discord używaj kanonicznej składni wzmianek: `<@USER_ID>` dla użytkowników, `<#CHANNEL_ID>` dla kanałów i `<@&ROLE_ID>` dla ról. Nie używaj starszej postaci wzmianki o pseudonimie `<@!USER_ID>`.

    `requireMention` konfiguruje się dla poszczególnych serwerów lub kanałów (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości zawierające wzmiankę o innym użytkowniku lub roli, ale nie o bocie (z wyjątkiem @everyone/@here).

    Grupowe wiadomości prywatne:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych w `dm.groupChannels` (identyfikatory kanałów lub uproszczone identyfikatory)

  </Tab>
</Tabs>

### Trasowanie agentów na podstawie ról

Użyj `bindings[].match.roles`, aby trasować członków serwera Discord do różnych agentów na podstawie identyfikatora roli. Powiązania oparte na rolach przyjmują wyłącznie identyfikatory ról i są oceniane po powiązaniach uczestnika lub uczestnika nadrzędnego, a przed powiązaniami dotyczącymi wyłącznie serwera. Jeśli powiązanie ustawia również inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą być zgodne.

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
- Nadpisanie dla poszczególnych kanałów: `channels.discord.commands.native`.
- `commands.native=false` pomija rejestrowanie poleceń ukośnikowych Discord oraz ich czyszczenie podczas uruchamiania. Wcześniej zarejestrowane polecenia mogą pozostać widoczne w Discord, dopóki nie usuniesz ich z aplikacji Discord.
- Uwierzytelnianie poleceń natywnych korzysta z tych samych list dozwolonych i zasad Discord co zwykła obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discord dla nieuprawnionych użytkowników; podczas wykonywania OpenClaw wymusza uwierzytelnienie i odpowiada „brak autoryzacji”.
- Domyślne ustawienia poleceń ukośnikowych: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Katalog poleceń i opis ich działania zawiera strona [Polecenia ukośnikowe](/pl/tools/slash-commands).

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord obsługuje znaczniki odpowiedzi w danych wyjściowych agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Zachowanie jest kontrolowane przez `channels.discord.replyToMode`:

    - `off` (domyślnie): brak niejawnego tworzenia wątków odpowiedzi; jawne znaczniki `[[reply_to_*]]` są nadal uwzględniane
    - `first`: dołącza niejawną natywną referencję odpowiedzi do pierwszej wychodzącej wiadomości Discord w danej turze
    - `all`: dołącza ją do każdej wychodzącej wiadomości
    - `batched`: dołącza ją tylko wtedy, gdy zdarzenie przychodzące było partią wielu wiadomości po eliminacji drgań — przydatne, gdy natywne odpowiedzi mają być używane głównie w niejednoznacznych, gwałtownych seriach wiadomości, a nie w każdej turze obejmującej pojedynczą wiadomość

    Identyfikatory wiadomości są udostępniane w kontekście i historii, dzięki czemu agenci mogą wskazywać konkretne wiadomości.

  </Accordion>

  <Accordion title="Link previews">
    Discord domyślnie generuje rozbudowane osadzenia odnośników dla adresów URL. OpenClaw domyślnie wyłącza te wygenerowane osadzenia w wychodzących wiadomościach Discord, dzięki czemu adresy URL wysyłane przez agenta pozostają zwykłymi odnośnikami, chyba że jawnie je włączysz:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Ustaw `channels.discord.accounts.<id>.suppressEmbeds`, aby nadpisać ustawienie dla jednego konta. Wiadomości wysyłane przez narzędzie wiadomości agenta mogą również przekazać `suppressEmbeds: false` dla pojedynczej wiadomości. Jawne ładunki Discord `embeds` nie są wyłączane przez domyślne ustawienie podglądu odnośników.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw może strumieniować wersje robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływania tekstu. `channels.discord.streaming.mode` przyjmuje `off` | `partial` | `block` | `progress` (domyślnie, gdy nie ustawiono klucza `streaming` ani starszego `streamMode`). `streamMode` jest starszym aliasem; uruchom `openclaw doctor --fix`, aby przepisać zapisaną konfigurację do kanonicznej, zagnieżdżonej postaci `streaming`.

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

    - `off` wyłącza edycje podglądu Discord.
    - `partial` edytuje pojedynczą wiadomość podglądu w miarę napływania tokenów.
    - `block` emituje fragmenty o rozmiarze wersji roboczej; rozmiar i punkty podziału można dostosować za pomocą `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), z ograniczeniem do `textChunkLimit`. Gdy strumieniowanie blokowe jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.
    - `progress` utrzymuje jedną edytowalną wersję roboczą stanu i aktualizuje ją informacjami o postępie narzędzi aż do końcowego dostarczenia; wspólna etykieta początkowa jest przewijanym wierszem, więc po pojawieniu się wystarczającej ilości informacji znika z widoku tak jak pozostałe treści.
    - Końcowe odpowiedzi zawierające multimedia, błędy lub jawną odpowiedź anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) określa, czy aktualizacje narzędzi i postępu ponownie wykorzystują wiadomość podglądu.
    - Wiersze narzędzi i postępu są wyświetlane jako zwięzłe zestawienie emoji, tytułu i szczegółów, jeśli są dostępne, na przykład `🛠️ Bash: uruchamianie testów` lub `🔎 Wyszukiwanie w sieci: dla „zapytania”`.
    - `streaming.progress.commentary` (domyślnie `false`) włącza tekst komentarzy i wprowadzeń asystenta w tymczasowej wersji roboczej postępu. Komentarze są oczyszczane przed wyświetleniem, pozostają tymczasowe i nie zmieniają sposobu dostarczania końcowej odpowiedzi.
    - `streaming.progress.maxLineChars` określa limit znaków na wiersz podglądu postępu. Proza jest skracana na granicach słów; szczegóły poleceń i ścieżek zachowują przydatne końcówki.
    - `streaming.preview.commandText` / `streaming.progress.commandText` określa sposób prezentowania szczegółów poleceń i wykonania w zwięzłych wierszach postępu: `raw` (domyślnie) lub `status` (tylko etykieta narzędzia).

    Aby ukryć nieprzetworzony tekst poleceń i wykonania, zachowując zwięzłe wiersze postępu:

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

    Strumieniowanie podglądu obsługuje wyłącznie tekst; odpowiedzi z multimediami korzystają ze zwykłego sposobu dostarczania.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Kontekst historii serwera:

    - domyślna wartość `channels.discord.historyLimit` to `20`
    - wartość zastępcza: `messages.groupChat.historyLimit`
    - `0` wyłącza funkcję

    Ustawienia historii wiadomości bezpośrednich:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są kierowane jako sesje kanału i dziedziczą konfigurację kanału nadrzędnego, chyba że zostanie ona nadpisana.
    - Sesje wątków dziedziczą wybór `/model` na poziomie sesji kanału nadrzędnego wyłącznie jako zastępczy wybór modelu; lokalne wybory `/model` w wątku mają pierwszeństwo, a historia transkrypcji kanału nadrzędnego nie jest kopiowana, chyba że włączono dziedziczenie transkrypcji.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) włącza inicjowanie nowych automatycznych wątków na podstawie transkrypcji kanału nadrzędnego. Nadpisanie dla poszczególnych kont: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozpoznawać cele wiadomości bezpośrednich `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` zostaje zachowane podczas zastępczej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych określają, kto może uruchomić agenta, ale nie stanowią pełnej granicy redagowania dodatkowego kontekstu.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord może powiązać wątek z docelową sesją, dzięki czemu kolejne wiadomości w tym wątku są nadal kierowane do tej samej sesji, w tym do sesji podagentów.

    Polecenia:

    - `/focus <target>` wiąże bieżący lub nowy wątek z docelowym podagentem albo sesją
    - `/unfocus` usuwa powiązanie bieżącego wątku
    - `/agents` wyświetla aktywne wykonania i stan powiązań
    - `/session idle <duration|off>` sprawdza lub aktualizuje automatyczne usuwanie aktywnego powiązania po okresie bezczynności
    - `/session max-age <duration|off>` sprawdza lub aktualizuje bezwzględny maksymalny wiek aktywnych powiązań

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

    - `session.threadBindings.*` określa globalne wartości domyślne; `channels.discord.threadBindings.*` nadpisuje zachowanie Discord.
    - `spawnSessions` steruje automatycznym tworzeniem i wiązaniem wątków dla `sessions_spawn({ thread: true })` oraz tworzenia wątków ACP. Wartość domyślna: `true`.
    - `defaultSpawnContext` określa natywny kontekst podagenta dla uruchomień powiązanych z wątkiem. Wartość domyślna: `"fork"`.
    - Przestarzałe klucze `spawnSubagentSessions`/`spawnAcpSessions` są migrowane przez `openclaw doctor --fix`.
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje wiązania wątków są niedostępne.

    Zobacz [Podagenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) oraz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    W przypadku stabilnych, stale aktywnych przestrzeni roboczych ACP skonfiguruj typowane powiązania ACP najwyższego poziomu, wskazujące rozmowy Discord.

    Ścieżka konfiguracji: `bindings[]` z `type: "acp"` oraz `match.channel: "discord"`.

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

    - `/acp spawn codex --bind here` wiąże bieżący kanał lub wątek w miejscu i kieruje przyszłe wiadomości do tej samej sesji ACP. Wiadomości w wątku dziedziczą powiązanie kanału nadrzędnego.
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP w miejscu. Tymczasowe powiązania wątków mogą nadpisywać rozpoznawanie celu, dopóki są aktywne.
    - `spawnSessions` steruje tworzeniem i wiązaniem wątków podrzędnych za pomocą `--thread auto|here`.

    Szczegółowy opis działania powiązań zawiera strona [Agenci ACP](/pl/tools/acp-agents).

  </Accordion>

  <Accordion title="Reaction notifications">
    Tryb powiadomień o reakcjach dla poszczególnych serwerów (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (korzysta z `guilds.<id>.users`)

    Zdarzenia reakcji są przekształcane w zdarzenia systemowe i dołączane do odpowiedniej sesji Discord.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozpoznawania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - zastępcze emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie „👀”)

    Uwagi:

    - Discord akceptuje emoji Unicode lub nazwy niestandardowych emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

    **Zakres (`messages.ackReactionScope`):**

    Wartości: `"all"` (wiadomości bezpośrednie i grupy, w tym zdarzenia otoczenia pokoju), `"direct"` (tylko wiadomości bezpośrednie), `"group-all"` (każda wiadomość grupowa z wyjątkiem zdarzeń otoczenia pokoju, bez wiadomości bezpośrednich), `"group-mentions"` (grupy, gdy bot zostanie wspomniany; **bez wiadomości bezpośrednich**, wartość domyślna), `"off"` / `"none"` (wyłączone).

    <Note>
    Domyślny zakres (`"group-mentions"`) nie wywołuje reakcji potwierdzenia w wiadomościach bezpośrednich ani zdarzeniach otoczenia pokoju. Aby otrzymywać reakcję potwierdzenia dla przychodzących wiadomości bezpośrednich Discord i zdarzeń w nieaktywnych pokojach, ustaw `messages.ackReactionScope` na `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Config writes">
    Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone. Dotyczy to przepływów `/config set|unset`, gdy funkcje poleceń są włączone.

    Aby wyłączyć:

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
    Kieruj ruch WebSocket bramy Discord i początkowe zapytania REST wykonywane podczas uruchamiania (identyfikator aplikacji i rozpoznawanie listy dozwolonych) przez serwer proxy HTTP(S), używając `channels.discord.proxy`.
    Obsługa proxy WebSocket bramy Discord jest jawna; połączenia WebSocket nie dziedziczą środowiskowych zmiennych proxy z procesu Gateway. Początkowe zapytania REST korzystają z tego serwera proxy, gdy skonfigurowano `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Nadpisanie dla poszczególnych kont:

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
    Włącz rozpoznawanie PluralKit, aby mapować wiadomości wysyłane przez proxy na tożsamość członka systemu:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // opcjonalne; wymagane w systemach prywatnych
      },
    },
  },
}
```

    Uwagi:

    - listy dozwolonych elementów mogą używać `pk:<memberId>`
    - nazwy wyświetlane członków są dopasowywane według nazwy lub slugu tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania odpytują API PluralKit przy użyciu identyfikatora oryginalnej wiadomości
    - jeśli wyszukiwanie się nie powiedzie, wiadomości pośredniczone są traktowane jak wiadomości botów i odrzucane, chyba że `allowBots` zezwala na ich przepuszczenie

  </Accordion>

  <Accordion title="Aliasy wzmianek wychodzących">
    Użyj `mentionAliases`, gdy agenci potrzebują deterministycznych wzmianek wychodzących dotyczących znanych użytkowników Discorda. Klucze to nazwy użytkowników bez początkowego znaku `@`, a wartości to identyfikatory użytkowników Discorda. Nieznane nazwy użytkowników, `@everyone`, `@here` oraz wzmianki wewnątrz fragmentów kodu Markdown pozostają bez zmian.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
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

    Tylko status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Aktywność (po ustawieniu `activity` domyślnym typem aktywności jest status niestandardowy):

```json5
{
  channels: {
    discord: {
      activity: "Czas na skupienie",
      activityType: 4,
    },
  },
}
```

    Transmisja strumieniowa:

```json5
{
  channels: {
    discord: {
      activity: "Programowanie na żywo",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mapa typów aktywności:

    - 0: Gra
    - 1: Transmisja strumieniowa (wymaga `activityUrl`; z kolei `activityUrl` wymaga `activityType: 1`)
    - 2: Słuchanie
    - 3: Oglądanie
    - 4: Niestandardowa (używa tekstu aktywności jako treści statusu; emoji jest opcjonalne)
    - 5: Rywalizacja

    Automatyczna obecność (sygnał stanu środowiska uruchomieniowego):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token wyczerpany",
      },
    },
  },
}
```

    Automatyczna obecność odwzorowuje dostępność środowiska uruchomieniowego na status Discorda: prawidłowy stan => online, stan pogorszony lub nieznany => idle, zasoby wyczerpane lub niedostępność => dnd. Wartości domyślne: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (musi być mniejsze lub równe `intervalMs`). Opcjonalne zastąpienia tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje symbol zastępczy `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discordzie">
    Discord obsługuje zatwierdzanie za pomocą przycisków w wiadomościach prywatnych i może opcjonalnie publikować prośby o zatwierdzenie w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; jeśli to możliwe, używa zastępczo `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia wykonania, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można ustalić co najmniej jedną osobę zatwierdzającą — na podstawie `execApprovals.approvers` albo `commands.ownerAllowFrom`. Discord nie wyznacza osób zatwierdzających wykonanie na podstawie kanałowego `allowFrom`, starszego `dm.allowFrom` ani `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discorda jako natywnego klienta zatwierdzeń.

    W przypadku poufnych poleceń grupowych dostępnych wyłącznie dla właściciela, takich jak `/diagnostics` i `/export-trajectory`, OpenClaw wysyła prośby o zatwierdzenie oraz końcowe wyniki prywatnie. Najpierw próbuje użyć wiadomości prywatnej Discorda, jeśli właściciel wywołujący polecenie ma trasę właściciela w Discordzie; w przeciwnym razie używa zastępczo pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, na przykład Telegrama.

    Gdy `target` ma wartość `channel` lub `both`, prośba o zatwierdzenie jest widoczna w kanale. Przycisków mogą używać wyłącznie ustalone osoby zatwierdzające; pozostali użytkownicy otrzymują widoczną tylko dla nich odmowę. Prośby o zatwierdzenie zawierają tekst polecenia, dlatego dostarczanie do kanału należy włączać wyłącznie w zaufanych kanałach. Jeśli identyfikatora kanału nie można wyznaczyć na podstawie klucza sesji, OpenClaw używa zastępczo dostarczania przez wiadomość prywatną.

    Discord renderuje współdzielone przyciski zatwierdzania używane przez inne kanały czatu; natywny adapter Discorda dodaje głównie kierowanie wiadomości prywatnych do osób zatwierdzających oraz rozsyłanie do kanałów. Gdy te przyciski są dostępne, stanowią podstawowy interfejs zatwierdzania; OpenClaw powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia wskazuje, że zatwierdzanie na czacie jest niedostępne lub zatwierdzanie ręczne jest jedyną możliwością. Jeśli natywne środowisko zatwierdzania Discorda nie jest aktywne, OpenClaw pozostawia widoczną lokalną, deterministyczną prośbę `/approve <id> <decision>`. Jeśli środowisko jest aktywne, ale natywnej karty nie można dostarczyć do żadnego celu, OpenClaw wysyła w tym samym czacie powiadomienie zastępcze z dokładnym poleceniem `/approve` oczekującego zatwierdzenia.

    Uwierzytelnianie Gateway i rozstrzyganie zatwierdzeń są zgodne ze współdzielonym kontraktem klienta Gateway (identyfikatory `plugin:` są rozstrzygane przez `plugin.approval.resolve`, a pozostałe identyfikatory przez `exec.approval.resolve`). Domyślnie zatwierdzenia wygasają po 30 minutach.

    Zobacz [Zatwierdzenia wykonania](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i blokady działań

Działania na wiadomościach Discorda obejmują obsługę wiadomości, administrację kanałami, moderację, obecność i metadane.

Podstawowe przykłady:

- obsługa wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Działanie `event-create` przyjmuje opcjonalny parametr `image` (adres URL lub ścieżkę do pliku lokalnego), służący do ustawienia obrazu okładki zaplanowanego wydarzenia.

Blokady działań znajdują się w `channels.discord.actions.*`.

Domyślne działanie blokad:

| Grupa działań                                                                                                                                                             | Domyślnie  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone   |
| roles                                                                                                                                                                    | wyłączone  |
| moderation                                                                                                                                                               | wyłączone  |
| presence                                                                                                                                                                 | wyłączone  |

## Interfejs komponentów v2

OpenClaw używa komponentów Discorda v2 do zatwierdzania wykonania i znaczników międzykontekstowych. Działania na wiadomościach Discorda mogą również przyjmować `components` do tworzenia niestandardowego interfejsu (funkcja zaawansowana; wymaga skonstruowania ładunku komponentu za pomocą narzędzia Discorda), natomiast starsze `embeds` pozostają dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discorda (wartość szesnastkowa). Dla poszczególnych kont: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` określa, jak długo wywołania zwrotne wysłanych komponentów Discorda pozostają zarejestrowane (domyślnie `1800000`, maksymalnie `86400000`). Dla poszczególnych kont: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` są ignorowane, gdy obecne są komponenty v2.
- Podglądy zwykłych adresów URL są domyślnie wyłączone. Ustaw `suppressEmbeds: false` w działaniu na wiadomości, jeśli pojedynczy link wychodzący ma zostać rozwinięty.

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

Discord udostępnia dwa odrębne mechanizmy głosowe: działające w czasie rzeczywistym **kanały głosowe** (ciągłe rozmowy) oraz **załączniki wiadomości głosowych** (format podglądu przebiegu fali). Gateway obsługuje oba.

### Kanały głosowe

Lista kontrolna konfiguracji:

1. Włącz Message Content Intent w Discord Developer Portal.
2. Włącz Server Members Intent, gdy używane są listy dozwolonych ról lub użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Przyznaj uprawnienia Connect, Speak, Send Messages i Read Message History w docelowym kanale głosowym.
5. Włącz polecenia natywne (`commands.native` lub `channels.discord.commands.native`).
6. Skonfiguruj `channels.discord.voice`.

Do sterowania sesjami używaj `/vc join|leave|status`. Polecenie używa domyślnego agenta konta i podlega tym samym regułom list dozwolonych elementów oraz zasadom grupowym co inne polecenia Discorda.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Aby przed dołączeniem sprawdzić efektywne uprawnienia bota:

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
        model: "openai/gpt-5.6-sol",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Uwagi:

- Obsługa głosu w Discordzie jest opcjonalna w konfiguracjach obejmujących wyłącznie tekst; ustaw `channels.discord.voice.enabled=true` (lub zachowaj istniejący blok `channels.discord.voice`), aby włączyć polecenia `/vc`, środowisko wykonawcze głosu oraz intencję Gateway `GuildVoiceStates`. `channels.discord.intents.voiceStates` może jawnie nadpisać subskrypcję intencji; pozostaw tę opcję nieustawioną, aby była zgodna z faktycznym stanem włączenia obsługi głosu.
- `voice.mode` steruje przebiegiem konwersacji. Domyślną wartością jest `agent-proxy`: interfejs głosowy działający w czasie rzeczywistym obsługuje synchronizację tur, przerywanie i odtwarzanie, przekazuje merytoryczne zadania do wyznaczonego agenta OpenClaw za pośrednictwem `openclaw_agent_consult` i traktuje wynik jak tekstowy monit Discorda od danego mówcy. `stt-tts` zachowuje starszy przepływ wsadowego STT i TTS. `bidi` pozwala modelowi czasu rzeczywistego prowadzić rozmowę bezpośrednio, udostępniając jednocześnie `openclaw_agent_consult` jako mechanizm dostępu do głównej logiki OpenClaw.
- `voice.agentSession` określa, która konwersacja OpenClaw otrzymuje tury głosowe. Pozostaw tę opcję nieustawioną, aby używać własnej sesji kanału głosowego, albo ustaw `{ mode: "target", target: "channel:<text-channel-id>" }`, aby kanał głosowy działał jako rozszerzenie mikrofonu i głośnika istniejącej sesji kanału tekstowego Discorda, takiego jak `#maintainers`.
- `voice.model` nadpisuje model głównej logiki agenta OpenClaw używany do odpowiedzi głosowych w Discordzie i konsultacji w czasie rzeczywistym. Pozostaw tę opcję nieustawioną, aby dziedziczyć model wyznaczonego agenta. Jest ona niezależna od `voice.realtime.model`.
- `voice.followUsers` umożliwia botowi dołączanie do kanału głosowego Discorda, przenoszenie się między kanałami i opuszczanie ich wraz z wybranymi użytkownikami. Zobacz [Podążanie za użytkownikami na kanałach głosowych](#follow-users-in-voice).
- `agent-proxy` kieruje mowę przez `discord-voice`, który zachowuje standardową autoryzację właściciela i narzędzi dla mówcy oraz sesji docelowej, ale ukrywa narzędzie agenta `tts`, ponieważ odtwarzaniem zarządza obsługa głosu Discorda. Domyślnie `agent-proxy` zapewnia konsultacji pełny dostęp do narzędzi równoważny właścicielowi w przypadku mówców będących właścicielami (`voice.realtime.toolPolicy: "owner"`) i zdecydowanie preferuje konsultację z agentem OpenClaw przed udzieleniem merytorycznych odpowiedzi (`voice.realtime.consultPolicy: "always"`). W domyślnym trybie `always` warstwa czasu rzeczywistego nie wypowiada automatycznie wypełniaczy przed odpowiedzią z konsultacji; przechwytuje i transkrybuje mowę, a następnie wypowiada odpowiedź wyznaczonego agenta OpenClaw. Jeśli kilka wymuszonych odpowiedzi z konsultacji zostanie ukończonych, gdy Discord nadal odtwarza pierwszą odpowiedź, kolejne odpowiedzi przeznaczone do dokładnego wypowiedzenia są umieszczane w kolejce do czasu zakończenia odtwarzania zamiast zastępować wypowiedź w połowie zdania.
- W trybie `stt-tts` funkcja STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- W trybach czasu rzeczywistego ustawienia `voice.realtime.provider`, `voice.realtime.model` i `voice.realtime.speakerVoice` konfigurują sesję audio czasu rzeczywistego. Aby użyć OpenAI Realtime 2.1 wraz z główną logiką Codex, ustaw `voice.realtime.model: "gpt-realtime-2.1"` i `voice.model: "openai/gpt-5.6-sol"`.
- Tryby głosowe czasu rzeczywistego domyślnie dołączają małe pliki profilu `IDENTITY.md`, `USER.md` i `SOUL.md` do instrukcji dostawcy czasu rzeczywistego, dzięki czemu szybkie bezpośrednie tury zachowują tę samą tożsamość, kontekst użytkownika i osobowość co wyznaczony agent OpenClaw. Ustaw `voice.realtime.bootstrapContextFiles` na podzbiór, aby to dostosować, albo na `[]`, aby wyłączyć tę funkcję. Obsługiwane są wyłącznie te pliki profilu; `AGENTS.md` pozostaje w standardowym kontekście agenta. Wstrzyknięty kontekst profilu nie zastępuje `openclaw_agent_consult` w przypadku pracy w obszarze roboczym, aktualnych informacji, wyszukiwania w pamięci ani działań wspieranych przez narzędzia.
- W trybie czasu rzeczywistego OpenAI `agent-proxy` ustaw `voice.realtime.requireWakeName: true`, aby obsługa głosu Discorda w czasie rzeczywistym pozostawała wyciszona, dopóki transkrypcja nie rozpocznie się lub nie zakończy nazwą wybudzającą. Skonfigurowane nazwy wybudzające muszą składać się z jednego lub dwóch słów. Jeśli `voice.realtime.wakeNames` nie jest ustawione, OpenClaw używa `name` wyznaczonego agenta oraz `OpenClaw`, a w razie braku tej wartości — identyfikatora agenta oraz `OpenClaw`. Bramkowanie nazwą wybudzającą wyłącza automatyczne odpowiedzi dostawcy czasu rzeczywistego, kieruje zaakceptowane tury przez ścieżkę konsultacji z agentem OpenClaw i odtwarza krótkie potwierdzenie głosowe, gdy początkowa nazwa wybudzająca zostanie rozpoznana na podstawie częściowej transkrypcji przed nadejściem transkrypcji końcowej.
- Dostawca czasu rzeczywistego OpenAI akceptuje aktualne nazwy zdarzeń Realtime 2 oraz starsze aliasy zgodne z Codex dla zdarzeń dźwięku wyjściowego i transkrypcji, dzięki czemu zgodne migawki dostawcy mogą się zmieniać bez utraty dźwięku asystenta.
- `voice.realtime.bargeIn` określa, czy zdarzenia rozpoczęcia mówienia w Discordzie przerywają aktywne odtwarzanie w czasie rzeczywistym. Jeśli ta opcja nie jest ustawiona, podąża za ustawieniem dostawcy czasu rzeczywistego dotyczącym przerywania przez dźwięk wejściowy.
- `voice.realtime.minBargeInAudioEndMs` określa minimalny czas odtwarzania odpowiedzi asystenta, zanim przerwanie w czasie rzeczywistym OpenAI skróci dźwięk. Wartość domyślna: `250`. Ustaw `0`, aby umożliwić natychmiastowe przerwanie w pomieszczeniach o niewielkim pogłosie, albo zwiększ tę wartość w konfiguracjach głośnikowych z dużym pogłosem.
- `voice.tts` nadpisuje `messages.tts` wyłącznie dla odtwarzania głosowego w trybie `stt-tts`; tryby czasu rzeczywistego używają zamiast tego `voice.realtime.speakerVoice`. Aby używać głosu OpenAI podczas odtwarzania w Discordzie, ustaw `voice.tts.provider: "openai"` i wybierz głos zamiany tekstu na mowę w `voice.tts.providers.openai.speakerVoice`. `cedar` jest dobrym wyborem o męskim brzmieniu w aktualnym modelu TTS OpenAI.
- Nadpisania `systemPrompt` dla poszczególnych kanałów Discorda mają zastosowanie do tur transkrypcji głosowej na danym kanale głosowym.
- Tury transkrypcji głosowej ustalają status właściciela na podstawie `allowFrom` Discorda (lub `dm.allowFrom`) na potrzeby poleceń i działań kanału ograniczonych do właściciela. Widoczność narzędzi agenta jest zgodna ze skonfigurowaną polityką narzędzi dla wyznaczonej sesji.
- Jeśli `voice.autoJoin` zawiera wiele wpisów dla tej samej gildii, OpenClaw dołącza do ostatniego skonfigurowanego kanału tej gildii.
- `voice.allowedChannels` jest opcjonalną listą dozwolonych kanałów przebywania. Pozostaw tę opcję nieustawioną, aby zezwolić poleceniu `/vc join` na dołączanie do dowolnego autoryzowanego kanału głosowego Discorda. Gdy jest ustawiona, `/vc join`, automatyczne dołączanie przy uruchomieniu i przeniesienia wynikające ze stanu głosowego bota są ograniczone do wymienionych wpisów `{ guildId, channelId }`. Ustaw pustą tablicę, aby zabronić dołączania do wszystkich kanałów głosowych Discorda. Jeśli Discord przeniesie bota poza listę dozwolonych kanałów, OpenClaw opuści ten kanał i ponownie dołączy do skonfigurowanego docelowego kanału automatycznego dołączania, jeśli taki jest dostępny.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`; domyślne wartości biblioteki nadrzędnej to `daveEncryption=true` i `decryptionFailureTolerance=24`.
- OpenClaw używa dołączonego kodeka `libopus-wasm` do odbierania głosu z Discorda i odtwarzania surowego PCM w czasie rzeczywistym. Pakiet zawiera przypiętą wersję libopus w WebAssembly i nie wymaga natywnych dodatków opus.
- `voice.connectTimeoutMs` określa początkowy czas oczekiwania na stan Ready z `@discordjs/voice` dla polecenia `/vc join` i prób automatycznego dołączenia. Wartość domyślna: `30000`.
- `voice.reconnectGraceMs` określa, jak długo OpenClaw czeka, aż rozłączona sesja głosowa rozpocznie ponowne łączenie, zanim ją zniszczy. Wartość domyślna: `15000`.
- W trybie `stt-tts` odtwarzanie głosu nie zatrzymuje się tylko dlatego, że inny użytkownik zaczyna mówić. Aby uniknąć pętli sprzężenia zwrotnego, OpenClaw ignoruje nowe przechwytywanie głosu podczas odtwarzania TTS; zacznij mówić po zakończeniu odtwarzania, aby rozpocząć następną turę. Tryby czasu rzeczywistego przekazują rozpoczęcie mówienia jako sygnał przerwania do dostawcy czasu rzeczywistego.
- W trybach czasu rzeczywistego echo z głośników trafiające do otwartego mikrofonu może wyglądać jak przerwanie i zatrzymywać odtwarzanie. W pomieszczeniach Discorda z dużym pogłosem ustaw `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, aby OpenAI nie przerywało automatycznie odpowiedzi po wykryciu dźwięku wejściowego. Dodaj `voice.realtime.bargeIn: true`, jeśli nadal chcesz, aby zdarzenia rozpoczęcia mówienia w Discordzie przerywały aktywne odtwarzanie. Most czasu rzeczywistego OpenAI ignoruje skrócenia odtwarzania krótsze niż `voice.realtime.minBargeInAudioEndMs`, uznając je za prawdopodobne echo lub szum, i rejestruje je jako pominięte zamiast czyścić odtwarzanie Discorda.
- `voice.captureSilenceGraceMs` określa, jak długo OpenClaw czeka po zgłoszeniu przez Discorda, że mówca przestał mówić, zanim sfinalizuje ten segment dźwięku na potrzeby STT. Wartość domyślna: `2000`; zwiększ ją, jeśli Discord dzieli zwykłe pauzy na poszarpane częściowe transkrypcje.
- Gdy wybranym dostawcą TTS jest ElevenLabs, odtwarzanie głosu w Discordzie używa strumieniowego TTS i rozpoczyna się od strumienia odpowiedzi dostawcy. W przypadku dostawców bez obsługi przesyłania strumieniowego stosowana jest ścieżka z tymczasowym plikiem zsyntetyzowanego dźwięku.
- OpenClaw monitoruje błędy odszyfrowywania odbieranego dźwięku i automatycznie przywraca działanie, opuszczając kanał głosowy i ponownie do niego dołączając po wielokrotnych błędach występujących w krótkim czasie.
- Jeśli po aktualizacji dzienniki odbierania wielokrotnie zawierają `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, zbierz raport zależności i dzienniki. Dołączona wersja `@discordjs/voice` zawiera poprawkę dopełniania z PR discord.js nr 11449, która rozwiązała zgłoszenie discord.js nr 11419.
- Zdarzenia odbierania `The operation was aborted` są oczekiwane, gdy OpenClaw finalizuje przechwycony segment wypowiedzi mówcy; są to szczegółowe informacje diagnostyczne, a nie ostrzeżenia.
- Szczegółowe dzienniki obsługi głosu Discorda zawierają ograniczony, jednowierszowy podgląd transkrypcji STT dla każdego zaakceptowanego segmentu mówcy, dzięki czemu podczas debugowania widoczna jest zarówno strona użytkownika, jak i odpowiedź agenta, bez zapisywania nieograniczonego tekstu transkrypcji.
- W trybie `agent-proxy` mechanizm awaryjny wymuszonej konsultacji pomija prawdopodobnie niepełne fragmenty transkrypcji, takie jak tekst kończący się na `...` lub końcowy spójnik, np. „i”, a także oczywiste zakończenia niewymagające działania, takie jak „zaraz wracam” lub „do widzenia”. Gdy zapobiega to udzieleniu nieaktualnej odpowiedzi oczekującej w kolejce, dzienniki zawierają `forced agent consult skipped reason=...`.

### Podążanie za użytkownikami na kanałach głosowych

Użyj `voice.followUsers`, jeśli chcesz, aby bot głosowy Discorda pozostawał z co najmniej jednym znanym użytkownikiem Discorda, zamiast dołączać podczas uruchamiania do stałego kanału lub czekać na `/vc join`.

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

Działanie:

- `followUsers` akceptuje nieprzetworzone identyfikatory użytkowników Discorda oraz wartości `discord:<id>`. OpenClaw normalizuje obie postacie przed dopasowaniem zdarzeń stanu głosowego.
- `followUsersEnabled` ma domyślnie wartość `true`, gdy skonfigurowano `followUsers`. Ustaw `false`, aby zachować zapisaną listę, ale zatrzymać automatyczne podążanie głosowe.
- Gdy obserwowany użytkownik dołączy do dozwolonego kanału głosowego, OpenClaw dołącza do tego kanału. Gdy użytkownik się przenosi, OpenClaw przenosi się razem z nim. Gdy aktywny obserwowany użytkownik się rozłączy, OpenClaw opuszcza kanał.
- Jeśli wielu obserwowanych użytkowników znajduje się w tej samej gildii, a aktywny obserwowany użytkownik ją opuści, OpenClaw przeniesie się na kanał innego śledzonego użytkownika, zanim opuści gildię. Jeśli kilku obserwowanych użytkowników przeniesie się jednocześnie, decyduje ostatnie zaobserwowane zdarzenie stanu głosowego.
- `allowedChannels` nadal obowiązuje. Obserwowany użytkownik na niedozwolonym kanale jest ignorowany, a sesja zarządzana przez funkcję podążania przenosi się do innego obserwowanego użytkownika lub opuszcza kanał.
- OpenClaw uzgadnia pominięte zdarzenia stanu głosowego podczas uruchamiania oraz w ograniczonych odstępach czasu. Uzgadnianie sprawdza próbkę skonfigurowanych gildii i ogranicza liczbę zapytań REST na każde uruchomienie, dlatego bardzo duże listy `followUsers` mogą potrzebować więcej niż jednego interwału, aby osiągnąć zgodność.
- Jeśli Discord lub administrator przeniesie bota podczas podążania za użytkownikiem, OpenClaw odbudowuje sesję głosową i zachowuje własność funkcji podążania, jeśli kanał docelowy jest dozwolony. Jeśli bot zostanie przeniesiony poza `allowedChannels`, OpenClaw opuści kanał i ponownie dołączy do skonfigurowanego kanału docelowego, jeśli taki istnieje.
- Mechanizm odzyskiwania odbierania DAVE może opuścić ten sam kanał i ponownie do niego dołączyć po wielokrotnych błędach odszyfrowywania. Sesje zarządzane przez funkcję podążania zachowują tę własność podczas odzyskiwania, dlatego późniejsze rozłączenie obserwowanego użytkownika nadal powoduje opuszczenie kanału.

Wybierz jeden z trybów dołączania:

- Używaj `followUsers` w konfiguracjach osobistych lub operatorskich, w których bot powinien automatycznie przebywać na kanale głosowym razem z Tobą.
- Używaj `autoJoin` w przypadku botów przypisanych do stałych kanałów, które powinny być obecne nawet wtedy, gdy żaden śledzony użytkownik nie korzysta z kanału głosowego.
- Używaj `/vc join` do jednorazowego dołączania lub w pomieszczeniach, w których automatyczna obecność głosowa byłaby zaskakująca.

Kodek głosowy Discorda:

- Dzienniki odbierania głosu zawierają `discord voice: opus decoder: libopus-wasm`.
- Odtwarzanie w czasie rzeczywistym koduje surowy, stereofoniczny dźwięk PCM 48 kHz do formatu Opus przy użyciu tego samego dołączonego pakietu `libopus-wasm`, zanim przekaże pakiety do `@discordjs/voice`.
- Odtwarzanie plików i strumieni dostawcy transkoduje dźwięk za pomocą ffmpeg do surowego, stereofonicznego PCM 48 kHz, a następnie używa `libopus-wasm` do utworzenia strumienia pakietów Opus wysyłanego do Discorda.

Potok STT i TTS:

- Przechwycony przez Discord dźwięk PCM jest konwertowany do tymczasowego pliku WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypcja jest przesyłana przez wejście i routing Discord, podczas gdy odpowiedziowy LLM działa z zasadami wyjścia głosowego, które ukrywają przed agentem narzędzie `tts` i wymagają zwrócenia tekstu, ponieważ odtwarzaniem końcowego TTS zarządza kanał głosowy Discord.
- Jeśli ustawiono `voice.model`, zastępuje on tylko odpowiedziowy LLM dla tej interakcji na kanale głosowym.
- `voice.tts` jest scalane ponad `messages.tts`; dostawcy obsługujący strumieniowanie przekazują dane bezpośrednio do odtwarzacza, a w przeciwnym razie wynikowy plik dźwiękowy jest odtwarzany na kanale, do którego dołączono.

Przykład domyślnej sesji kanału głosowego z agentem pośredniczącym:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Bez bloku `voice.agentSession` każdy kanał głosowy otrzymuje własną routowaną sesję OpenClaw. Na przykład `/vc join channel:234567890123456789` komunikuje się z sesją tego kanału głosowego Discord. Model czasu rzeczywistego jest tylko głosowym interfejsem wejściowym; merytoryczne żądania są przekazywane skonfigurowanemu agentowi OpenClaw. Jeśli model czasu rzeczywistego utworzy końcową transkrypcję bez wywołania narzędzia konsultacji, OpenClaw wymusza konsultację jako mechanizm awaryjny, aby domyślne działanie nadal przypominało rozmowę z agentem.

Przykład starszego trybu STT oraz TTS:

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

Przykład dwukierunkowej komunikacji czasu rzeczywistego:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Obsługa głosu jako rozszerzenie istniejącej sesji kanału Discord:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

W trybie `agent-proxy` bot dołącza do skonfigurowanego kanału głosowego, ale interakcje agenta OpenClaw korzystają ze standardowo routowanej sesji i agenta kanału docelowego. Głosowa sesja czasu rzeczywistego odczytuje zwrócony wynik na kanale głosowym. Agent nadzorujący może nadal używać zwykłych narzędzi wiadomości zgodnie ze swoimi zasadami narzędzi, w tym wysłać osobną wiadomość Discord, jeśli jest to właściwe działanie.

Gdy delegowane uruchomienie OpenClaw jest aktywne, nowe transkrypcje głosowe Discord są traktowane jako sterowanie uruchomieniem na żywo przed rozpoczęciem kolejnej interakcji agenta. Wyrażenia takie jak „stan”, „anuluj to”, „zastosuj mniejszą poprawkę” lub „gdy skończysz, sprawdź również testy” są klasyfikowane jako żądanie stanu, anulowanie, instrukcja sterująca lub dane uzupełniające dla aktywnej sesji. Stan, anulowanie, zaakceptowane instrukcje sterujące i wyniki działań uzupełniających są odczytywane na kanale głosowym, aby rozmówca wiedział, czy OpenClaw obsłużył żądanie.

Przydatne postacie celu:

- `target: "channel:123456789012345678"` kieruje przez sesję kanału tekstowego Discord.
- `target: "123456789012345678"` jest traktowane jako cel będący kanałem.
- `target: "dm:123456789012345678"` lub `target: "user:123456789012345678"` kieruje przez sesję wiadomości bezpośrednich danego użytkownika.

Przykład OpenAI Realtime w środowisku z silnym echem:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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

Użyj tego ustawienia, gdy model słyszy własny dźwięk odtwarzany przez Discord za pośrednictwem otwartego mikrofonu, ale nadal chcesz móc przerwać jego wypowiedź głosem. OpenClaw zapobiega automatycznemu przerywaniu przez OpenAI w reakcji na nieprzetworzone wejście dźwiękowe, natomiast `bargeIn: true` pozwala zdarzeniom rozpoczęcia mówienia w Discord oraz dźwiękowi już aktywnego rozmówcy anulować aktywne odpowiedzi czasu rzeczywistego, zanim kolejna przechwycona wypowiedź dotrze do OpenAI. Bardzo wczesne sygnały przerwania z wartością `audioEndMs` mniejszą niż `minBargeInAudioEndMs` są uznawane za prawdopodobne echo lub szum i ignorowane, aby model nie urywał wypowiedzi przy pierwszej ramce odtwarzanego dźwięku.

Oczekiwane dzienniki obsługi głosu:

- Przy dołączeniu: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Przy uruchomieniu trybu czasu rzeczywistego: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Dla dźwięku rozmówcy: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` oraz `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Przy pominięciu nieaktualnej wypowiedzi: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` lub `reason=non-actionable-closing ...`
- Po zakończeniu odpowiedzi czasu rzeczywistego: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Przy zatrzymaniu lub zresetowaniu odtwarzania: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Przy konsultacji czasu rzeczywistego: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Przy odpowiedzi agenta: `discord voice: agent turn answer ...`
- Przy umieszczeniu dokładnej wypowiedzi w kolejce: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, a następnie `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Przy wykryciu przerwania wypowiedzi: `discord voice: realtime barge-in detected source=speaker-start ...` lub `discord voice: realtime barge-in detected source=active-speaker-audio ...`, a następnie `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Przy przerwaniu trybu czasu rzeczywistego: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, a następnie `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` albo `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Przy zignorowaniu echa lub szumu: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Przy wyłączonym przerywaniu wypowiedzi: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Przy bezczynnym odtwarzaniu: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Aby zdiagnozować urywany dźwięk, odczytuj dzienniki głosu czasu rzeczywistego jako oś czasu:

1. `realtime audio playback started` oznacza, że Discord rozpoczął odtwarzanie dźwięku asystenta. Od tego momentu most zlicza fragmenty wyjścia dźwiękowego asystenta, bajty PCM Discord, bajty czasu rzeczywistego dostawcy oraz czas trwania wygenerowanego dźwięku.
2. `realtime speaker turn opened` oznacza, że rozmówca w Discord stał się aktywny. Jeśli odtwarzanie jest już aktywne i włączono `bargeIn`, może po tym wystąpić `barge-in detected source=speaker-start`.
3. `realtime input audio started` oznacza pierwszą rzeczywistą ramkę dźwięku odebraną w ramach danej wypowiedzi rozmówcy. `outputActive=true` lub niezerowa wartość `outputAudioMs` w tym miejscu oznacza, że mikrofon wysyła dane wejściowe, gdy odtwarzanie dźwięku asystenta jest nadal aktywne.
4. `barge-in detected source=active-speaker-audio` oznacza, że OpenClaw wykrył dźwięk aktywnego rozmówcy podczas odtwarzania dźwięku asystenta. Pomaga to odróżnić rzeczywiste przerwanie od zdarzenia rozpoczęcia mówienia w Discord, któremu nie towarzyszy użyteczny dźwięk.
5. `barge-in requested reason=...` oznacza, że OpenClaw poprosił dostawcę czasu rzeczywistego o anulowanie lub skrócenie aktywnej odpowiedzi. Wpis zawiera `outputAudioMs`, `outputActive` i `playbackChunks`, dzięki czemu można sprawdzić, ile dźwięku asystenta rzeczywiście odtworzono przed przerwaniem.
6. `realtime audio playback stopped reason=...` jest lokalnym punktem zresetowania odtwarzania w Discord. Przyczyna wskazuje, co zatrzymało odtwarzanie: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` lub `session-close`.
7. `realtime speaker turn closed` podsumowuje przechwyconą wypowiedź wejściową. `chunks=0` lub `hasAudio=false` oznacza, że wypowiedź rozmówcy została rozpoczęta, ale do mostu czasu rzeczywistego nie dotarł żaden użyteczny dźwięk. `interruptedPlayback=true` oznacza, że ta wypowiedź wejściowa nałożyła się na wyjście asystenta i uruchomiła logikę przerywania.

Przydatne pola:

- `outputAudioMs`: czas trwania dźwięku asystenta wygenerowanego przez dostawcę czasu rzeczywistego przed danym wpisem dziennika.
- `audioMs`: czas trwania dźwięku asystenta zliczony przez OpenClaw przed zatrzymaniem odtwarzania.
- `elapsedMs`: czas zegarowy między otwarciem i zamknięciem strumienia odtwarzania lub wypowiedzi rozmówcy.
- `discordBytes`: bajty stereofonicznego dźwięku PCM 48 kHz wysłane do kanału głosowego Discord lub z niego odebrane.
- `realtimeBytes`: bajty PCM w formacie dostawcy wysłane do dostawcy czasu rzeczywistego lub od niego odebrane.
- `playbackChunks`: fragmenty dźwięku asystenta przekazane do Discord dla aktywnej odpowiedzi.
- `sinceLastAudioMs`: odstęp między ostatnią przechwyconą ramką dźwięku rozmówcy a zamknięciem jego wypowiedzi.

Typowe wzorce:

- Natychmiastowe urwanie z `source=active-speaker-audio`, małą wartością `outputAudioMs` i tym samym użytkownikiem w pobliżu zwykle wskazuje, że echo z głośnika trafia do mikrofonu. Zwiększ `voice.realtime.minBargeInAudioEndMs`, zmniejsz głośność głośnika, użyj słuchawek lub ustaw `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start`, po którym występuje `speaker turn closed ... hasAudio=false`, oznacza, że Discord zgłosił rozpoczęcie mówienia, ale żaden dźwięk nie dotarł do OpenClaw. Przyczyną może być przejściowe zdarzenie głosowe Discord, działanie bramki szumów lub krótkotrwałe włączenie mikrofonu przez klienta.
- `audio playback stopped reason=stream-close` bez występującego w pobliżu przerwania lub `provider-clear-audio` oznacza, że lokalny strumień odtwarzania Discord zakończył się nieoczekiwanie. Sprawdź wcześniejsze dzienniki dostawcy i odtwarzacza Discord.
- `capture ignored during playback (barge-in disabled)` oznacza, że OpenClaw celowo odrzucił wejście, gdy dźwięk asystenta był aktywny. Włącz `voice.realtime.bargeIn`, jeśli chcesz, aby mowa przerywała odtwarzanie.
- `barge-in ignored ... outputActive=false` oznacza, że Discord lub mechanizm VAD dostawcy wykrył mowę, ale OpenClaw nie miał aktywnego odtwarzania do przerwania. Nie powinno to powodować urywania dźwięku.

Poświadczenia są rozwiązywane osobno dla każdego komponentu: uwierzytelnianie trasy LLM dla `voice.model`, uwierzytelnianie STT dla `tools.media.audio`, uwierzytelnianie TTS dla `messages.tts`/`voice.tts` oraz uwierzytelnianie dostawcy czasu rzeczywistego dla `voice.realtime.providers` lub standardowej konfiguracji uwierzytelniania dostawcy.

### Wiadomości głosowe

Wiadomości głosowe Discord wyświetlają podgląd przebiegu fali i wymagają dźwięku OGG/Opus. OpenClaw automatycznie generuje przebieg fali, ale do analizy i konwersji potrzebuje programów `ffmpeg` i `ffprobe` na hoście Gateway.

- Podaj **lokalną ścieżkę pliku** (adresy URL są odrzucane).
- Pomiń treść tekstową (Discord odrzuca połączenie tekstu i wiadomości głosowej w tym samym ładunku).
- Akceptowany jest dowolny format dźwięku; OpenClaw w razie potrzeby konwertuje go do OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji lub bot nie widzi wiadomości z serwera">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy korzystasz z rozpoznawania użytkowników/członków
    - uruchom ponownie Gateway po zmianie intencji

  </Accordion>

  <Accordion title="Nieoczekiwane blokowanie wiadomości z serwera">

    - sprawdź `groupPolicy`
    - sprawdź listę dozwolonych serwerów w `channels.discord.guilds`
    - jeśli istnieje mapa `channels` serwera, dozwolone są tylko wymienione w niej kanały
    - sprawdź działanie `requireMention` i wzorce wzmianek

    Przydatne polecenia diagnostyczne:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Wyłączenie wymogu wzmianki, ale wiadomości nadal są blokowane">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych serwerów/kanałów
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi znajdować się w `channels.discord.guilds` lub we wpisie kanału)
    - nadawca zablokowany przez listę dozwolonych `users` serwera/kanału

  </Accordion>

  <Accordion title="Długotrwałe tury Discord lub zduplikowane odpowiedzi">

    Typowe wpisy w dziennikach:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Parametry kolejki Gateway Discord:

    - jedno konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - steruje to wyłącznie pracą procedury nasłuchującej Gateway Discord, a nie czasem trwania tury agenta

    Discord nie stosuje limitu czasu należącego do kanału wobec zakolejkowanych tur agenta. Procedury nasłuchujące wiadomości natychmiast przekazują zadanie dalej, a zakolejkowane uruchomienia Discord zachowują kolejność w ramach sesji, dopóki cykl życia sesji, narzędzia lub środowiska wykonawczego nie zakończy albo nie przerwie pracy.

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

  <Accordion title="Ostrzeżenia o przekroczeniu limitu czasu pobierania metadanych Gateway">
    Przed połączeniem OpenClaw pobiera metadane Discord `/gateway/bot`. W przypadku przejściowych błędów używany jest domyślny adres URL Gateway Discord, a wpisy w dziennikach są ograniczane częstotliwościowo.

    Parametry limitu czasu metadanych:

    - jedno konto: `channels.discord.gatewayInfoTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - wartość zastępcza ze zmiennej środowiskowej, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - wartość domyślna: `30000` (30 sekund), maksimum: `120000`

  </Accordion>

  <Accordion title="Ponowne uruchomienia po przekroczeniu limitu czasu READY Gateway">
    Podczas uruchamiania oraz po ponownych połączeniach środowiska wykonawczego OpenClaw oczekuje na zdarzenie `READY` Gateway Discord. Konfiguracje wielokontowe z rozłożonym w czasie uruchamianiem mogą wymagać dłuższego początkowego okna READY niż domyślne.

    Parametry limitu czasu READY:

    - uruchamianie, jedno konto: `channels.discord.gatewayReadyTimeoutMs`
    - uruchamianie, wiele kont: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - wartość zastępcza podczas uruchamiania ze zmiennej środowiskowej, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - domyślna wartość podczas uruchamiania: `15000` (15 sekund), maksimum: `120000`
    - środowisko wykonawcze, jedno konto: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - środowisko wykonawcze, wiele kont: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - wartość zastępcza środowiska wykonawczego ze zmiennej środowiskowej, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - domyślna wartość środowiska wykonawczego: `30000` (30 sekund), maksimum: `120000`

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Sprawdzanie uprawnień przez `channels status --probe` działa tylko z numerycznymi identyfikatorami kanałów.

    Jeśli używasz kluczy tekstowych, dopasowywanie w środowisku wykonawczym może nadal działać, ale sonda nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z wiadomościami prywatnymi i parowaniem">

    - wyłączone wiadomości prywatne: `channels.discord.dm.enabled=false`
    - wyłączona polityka wiadomości prywatnych: `channels.discord.dmPolicy="disabled"` (starsza wersja: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle między botami">
    Domyślnie wiadomości utworzone przez boty są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, stosuj ścisłe reguły wzmianek i list dozwolonych, aby uniknąć pętli.
    Zalecane jest użycie `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów zawierające wzmiankę o bocie.

    OpenClaw zawiera również wspólną [ochronę przed pętlami botów](/pl/channels/bot-loop-protection). Gdy `allowBots` pozwala wiadomościom utworzonym przez boty dotrzeć do mechanizmu przekazywania, Discord odwzorowuje zdarzenie przychodzące na dane `(konto, kanał, para botów)`, a ogólna ochrona pary blokuje ją po przekroczeniu skonfigurowanego budżetu zdarzeń. Ochrona zapobiega niekontrolowanym pętlom między dwoma botami, które wcześniej musiały być zatrzymywane przez limity częstotliwości Discord; nie wpływa na wdrożenia z jednym botem ani na jednorazowe odpowiedzi botów mieszczące się w budżecie.

    Ustawienia domyślne (aktywne po ustawieniu `allowBots`):

    - `maxEventsPerWindow: 20` -- para botów może wymienić 20 wiadomości w ruchomym oknie
    - `windowSeconds: 60` -- długość ruchomego okna
    - `cooldownSeconds: 60` -- po wyczerpaniu budżetu każda kolejna wiadomość między botami w dowolnym kierunku jest odrzucana przez minutę

    Skonfiguruj wspólną wartość domyślną raz w `channels.defaults.botLoopProtection`, a następnie nadpisz ją dla Discord, gdy prawidłowy przepływ pracy wymaga większego marginesu. Kolejność pierwszeństwa:

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
      // Opcjonalne nadpisanie dla całego Discord. Bloki kont nadpisują poszczególne
      // pola i dziedziczą stąd pominięte pola.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha nasłuchuje innych botów tylko wtedy, gdy o nim wspominają.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo nasłuchuje wszystkich wiadomości Discord utworzonych przez boty.
          allowBots: true,
          mentionAliases: {
            // Pozwala Bravo utworzyć wzmiankę Discord o Alpha przy użyciu skonfigurowanego identyfikatora użytkownika.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Zezwól na maksymalnie pięć wiadomości na minutę przed zablokowaniem pary.
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

  <Accordion title="Przerwy w STT głosowym z błędem DecryptionFailed(...)">

    - aktualizuj OpenClaw (`openclaw update`), aby korzystać z mechanizmu odzyskiwania odbioru głosu Discord
    - potwierdź, że ustawiono `channels.discord.voice.daveEncryption=true` (wartość domyślna)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość komponentu nadrzędnego) i dostosuj ją tylko w razie potrzeby
    - obserwuj dzienniki pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy występują nadal po automatycznym ponownym dołączeniu, zbierz dzienniki i porównaj je z historią odbioru DAVE w projekcie nadrzędnym: [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) oraz [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji — Discord](/pl/gateway/config-channels#discord).

<Accordion title="Najważniejsze pola Discord">

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- polityka: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups` (globalne), `configWrites`, `slashCommand.ephemeral`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet procedury nasłuchującej, domyślnie `120000`), `eventQueue.maxQueueSize` (domyślnie `10000`), `eventQueue.maxConcurrency` (domyślnie `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- odpowiedzi/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit` (domyślnie `2000`), `maxLinesPerMessage` (domyślnie `17`)
- strumieniowanie: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (starsze płaskie klucze `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` są migrowane do `streaming.*` przez `openclaw doctor --fix`)
- multimedia/ponowienia: `mediaMaxMb` (ogranicza wychodzące pliki przesyłane do Discord, domyślnie `100`), `retry`
- działania: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- interfejs użytkownika: `ui.components.accentColor`
- funkcje: `threadBindings`, `bindings[]` najwyższego poziomu (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i eksploatacja

- Traktuj tokeny botów jako dane poufne (w nadzorowanych środowiskach preferowana jest zmienna `DISCORD_BOT_TOKEN`).
- Przyznawaj minimalne niezbędne uprawnienia Discord.
- Jeśli stan wdrożenia poleceń jest nieaktualny, uruchom ponownie Gateway i sprawdź go ponownie za pomocą `openclaw channels status --probe`.

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discord z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Działanie czatów grupowych i list dozwolonych.
  </Card>
  <Card title="Kierowanie kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i wzmacnianie zabezpieczeń.
  </Card>
  <Card title="Kierowanie do wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Przypisuj serwery i kanały do agentów.
  </Card>
  <Card title="Polecenia z ukośnikiem" icon="terminal" href="/pl/tools/slash-commands">
    Działanie poleceń natywnych.
  </Card>
</CardGroup>
