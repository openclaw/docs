---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-04-24T08:57:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce73e0e6995702f3b2453b2e5ab4e55b02190e64fdf5805f53b4002be63140a2
    source_path: channels/discord.md
    workflow: 15
---

Gotowe do użycia w wiadomościach DM i kanałach serwera za pośrednictwem oficjalnej bramki Discord.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości DM w Discord domyślnie używają trybu parowania.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i przepływ naprawy.
  </Card>
</CardGroup>

## Szybka konfiguracja

Musisz utworzyć nową aplikację z botem, dodać bota do swojego serwera i sparować go z OpenClaw. Zalecamy dodanie bota do własnego prywatnego serwera. Jeśli jeszcze go nie masz, [najpierw utwórz serwer](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wybierz **Create My Own > For me and my friends**).

<Steps>
  <Step title="Utwórz aplikację Discord i bota">
    Przejdź do [Discord Developer Portal](https://discord.com/developers/applications) i kliknij **New Application**. Nadaj jej nazwę, na przykład „OpenClaw”.

    Kliknij **Bot** na pasku bocznym. Ustaw **Username** na nazwę, której używasz dla swojego agenta OpenClaw.

  </Step>

  <Step title="Włącz uprzywilejowane intencje">
    Nadal na stronie **Bot** przewiń w dół do **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazw do identyfikatorów)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji statusu)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem na górę strony **Bot** i kliknij **Reset Token**.

    <Note>
    Wbrew nazwie spowoduje to wygenerowanie pierwszego tokena — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest twój **Bot Token** i za chwilę będzie potrzebny.

  </Step>

  <Step title="Wygeneruj adres URL zaproszenia i dodaj bota do swojego serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz adres URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do swojego serwera.

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
      - Add Reactions (opcjonalnie)

    To podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w przepływach kanałów forum lub mediów, które tworzą lub kontynuują wątek, włącz także **Send Messages in Threads**.
    Skopiuj wygenerowany adres URL na dole, wklej go do przeglądarki, wybierz swój serwer i kliknij **Continue**, aby się połączyć. Powinieneś teraz zobaczyć swojego bota na serwerze Discord.

  </Step>

  <Step title="Włącz Developer Mode i zbierz swoje identyfikatory">
    Wróć do aplikacji Discord — musisz włączyć Developer Mode, aby móc kopiować wewnętrzne identyfikatory.

    1. Kliknij **User Settings** (ikona koła zębatego obok avatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem myszy ikonę swojego **serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem myszy swój **avatar** → **Copy User ID**

    Zapisz **Server ID** i **User ID** razem z Bot Token — w następnym kroku przekażesz OpenClaw wszystkie trzy.

  </Step>

  <Step title="Zezwól na wiadomości DM od członków serwera">
    Aby parowanie działało, Discord musi pozwalać botowi na wysyłanie ci wiadomości DM. Kliknij prawym przyciskiem myszy ikonę swojego **serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) będą mogli wysyłać ci wiadomości DM. Pozostaw tę opcję włączoną, jeśli chcesz używać wiadomości DM Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, po sparowaniu możesz wyłączyć DM.

  </Step>

  <Step title="Bezpiecznie ustaw token bota (nie wysyłaj go na czacie)">
    Token bota Discord jest sekretem (jak hasło). Ustaw go na komputerze, na którym działa OpenClaw, zanim wyślesz wiadomość do swojego agenta.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Jeśli OpenClaw działa już jako usługa w tle, uruchom go ponownie przez aplikację OpenClaw Mac albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i przekaż mu te informacje. Jeśli Discord jest twoim pierwszym kanałem, użyj karty CLI / config.

        > "Ustawiłem już token bota Discord w konfiguracji. Dokończ konfigurację Discord, używając User ID `<user_id>` i Server ID `<server_id>`."
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

        Rezerwa env dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        Zwykłe tekstowe wartości `token` są obsługiwane. Wartości SecretRef są również obsługiwane dla `channels.discord.token` w providerach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zatwierdź pierwsze parowanie DM">
    Poczekaj, aż Gateway będzie działać, a następnie wyślij wiadomość DM do swojego bota w Discord. Odpowie kodem parowania.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        Wyślij kod parowania do swojego agenta na istniejącym kanale:

        > "Zatwierdź ten kod parowania Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kody parowania wygasają po 1 godzinie.

    Powinieneś teraz móc rozmawiać ze swoim agentem przez wiadomości DM w Discord.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenów uwzględnia konto. Wartości tokenów z konfiguracji mają pierwszeństwo przed rezerwą env. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/działania kanałowe) jawny `token` dla danego wywołania jest używany tylko dla tego wywołania. Dotyczy to działań wysyłania oraz odczytu/sondowania (na przykład read/search/fetch/thread/pins/permissions). Zasady konta i ustawienia ponawiania nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
</Note>

## Zalecane: skonfiguruj obszar roboczy serwera

Gdy wiadomości DM już działają, możesz skonfigurować swój serwer Discord jako pełny obszar roboczy, w którym każdy kanał ma własną sesję agenta z własnym kontekstem. Jest to zalecane w przypadku prywatnych serwerów, na których jesteście tylko ty i twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
    To umożliwia agentowi odpowiadanie na dowolnym kanale na twoim serwerze, a nie tylko w wiadomościach DM.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Dodaj mój Server ID Discord `<server_id>` do listy dozwolonych serwerów"
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

  <Step title="Zezwól na odpowiedzi bez @wzmianki">
    Domyślnie agent odpowiada na kanałach serwera tylko wtedy, gdy zostanie oznaczony przez @mention. W przypadku prywatnego serwera prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Zezwól mojemu agentowi odpowiadać na tym serwerze bez konieczności używania @mention"
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

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zaplanuj pamięć dla kanałów serwera">
    Domyślnie pamięć długoterminowa (MEMORY.md) jest ładowana tylko w sesjach DM. Kanały serwera nie ładują automatycznie MEMORY.md.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Gdy zadaję pytania na kanałach Discord, używaj memory_search lub memory_get, jeśli potrzebujesz długoterminowego kontekstu z MEMORY.md."
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Notatki długoterminowe trzymaj w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Twój agent widzi nazwę kanału, a każdy kanał ma własną izolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` lub cokolwiek pasuje do twojego sposobu pracy.

## Model środowiska uruchomieniowego

- Gateway zarządza połączeniem z Discord.
- Routowanie odpowiedzi jest deterministyczne: odpowiedzi przychodzące z Discord wracają do Discord.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały serwera używają izolowanych kluczy sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe wiadomości DM są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia slash działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), jednocześnie przenosząc `CommandTargetSessionKey` do routowanej sesji rozmowy.

## Kanały forum

Kanały forum i mediów Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku użyje pierwszej niepustej linii wiadomości.
- Użyj `openclaw message thread create`, aby utworzyć wątek bezpośrednio. Nie przekazuj `--message-id` dla kanałów forum.

Przykład: wyślij do nadrzędnego forum, aby utworzyć wątek

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Przykład: utwórz wątek forum bezpośrednio

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Nadrzędne fora nie akceptują komponentów Discord. Jeśli potrzebujesz komponentów, wysyłaj do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są przekazywane z powrotem do agenta jako zwykłe wiadomości przychodzące i podążają za istniejącymi ustawieniami Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowe. Ustaw `components.reusable=true`, aby zezwolić na wielokrotne użycie przycisków, selektorów i formularzy aż do momentu ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` dla tego przycisku (identyfikatory użytkowników Discord, tagi lub `*`). Gdy jest to skonfigurowane, niedopasowani użytkownicy otrzymają efemeryczną odmowę.

Polecenia slash `/model` i `/models` otwierają interaktywny wybór modelu z listami rozwijanymi providera i modelu oraz krokiem Submit. O ile `commands.modelsWrite=false`, `/models add` obsługuje także dodawanie nowego wpisu provider/model z czatu, a nowo dodane modele pojawiają się bez ponownego uruchamiania Gateway. Odpowiedź selektora jest efemeryczna i tylko użytkownik, który ją wywołał, może z niej korzystać.

Załączniki plików:

- bloki `file` muszą wskazywać na odwołanie do załącznika (`attachment://<filename>`)
- podaj załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
- użyj `filename`, aby zastąpić nazwę przesyłanego pliku, gdy powinna odpowiadać odwołaniu do załącznika

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

## Kontrola dostępu i routowanie

<Tabs>
  <Tab title="Zasady DM">
    `channels.discord.dmPolicy` kontroluje dostęp do wiadomości DM (starsza nazwa: `channels.discord.dm.policy`):

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`; starsza nazwa: `channels.discord.dm.allowFrom`)
    - `disabled`

    Jeśli zasady DM nie są otwarte, nieznani użytkownicy są blokowani (lub proszeni o parowanie w trybie `pairing`).

    Pierwszeństwo w trybie wielu kont:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Format celu DM dla dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same numeryczne identyfikatory są niejednoznaczne i odrzucane, chyba że jawnie podano rodzaj celu użytkownik/kanał.

  </Tab>

  <Tab title="Zasady serwera">
    Obsługa serwerów jest kontrolowana przez `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczną podstawą, gdy istnieje `channels.discord`, jest `allowlist`.

    Zachowanie `allowlist`:

    - serwer musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany też slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli skonfigurowano któreś z nich, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazwa/tag
    - jeśli serwer ma skonfigurowane `channels`, kanały spoza listy są odrzucane
    - jeśli serwer nie ma bloku `channels`, wszystkie kanały w tym serwerze z listy dozwolonych są akceptowane

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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, rezerwą środowiska uruchomieniowego będzie `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Wzmianki i grupowe DM">
    Wiadomości na serwerach są domyślnie ograniczone wzmiankami.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, rezerwa `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    `requireMention` jest konfigurowane osobno dla każdego serwera/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które zawierają wzmiankę o innym użytkowniku/roli, ale nie o bocie (z wyłączeniem @everyone/@here).

    Grupowe DM:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów lub slugi)

  </Tab>
</Tabs>

### Routowanie agentów na podstawie ról

Użyj `bindings[].match.roles`, aby kierować członków serwera Discord do różnych agentów według identyfikatora roli. Powiązania oparte na rolach akceptują tylko identyfikatory ról i są oceniane po powiązaniach peer lub parent-peer, a przed powiązaniami opartymi wyłącznie na serwerze. Jeśli powiązanie ustawia również inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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

- `commands.native` ma domyślnie wartość `"auto"` i jest włączone dla Discord.
- Nadpisanie per kanał: `channels.discord.commands.native`.
- `commands.native=false` jawnie czyści wcześniej zarejestrowane natywne polecenia Discord.
- Autoryzacja natywnych poleceń używa tych samych list dozwolonych/zasad Discord co zwykła obsługa wiadomości.
- Polecenia mogą być nadal widoczne w interfejsie Discord dla użytkowników bez uprawnień; wykonanie nadal wymusza autoryzację OpenClaw i zwraca „brak autoryzacji”.

Zobacz [Polecenia slash](/pl/tools/slash-commands), aby poznać katalog poleceń i ich zachowanie.

Domyślne ustawienia poleceń slash:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Tagi odpowiedzi i natywne odpowiedzi">
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
    przychodząca tura była odrzuconą czasowo partią wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie w niejednoznacznych, gwałtownych rozmowach, a nie w każdej
    pojedynczej turze wiadomości.

    Identyfikatory wiadomości są ujawniane w kontekście/historii, dzięki czemu agenci mogą kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Podgląd strumienia na żywo">
    OpenClaw może strumieniować wersje robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływu tekstu. `channels.discord.streaming` przyjmuje `off` (domyślnie) | `partial` | `block` | `progress`. `progress` jest mapowane do `partial` w Discord; `streamMode` jest starszym aliasem i jest migrowane automatycznie.

    Domyślnie pozostaje `off`, ponieważ edycje podglądu w Discord szybko trafiają na limity szybkości, gdy wiele botów lub Gateway współdzieli konto.

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
    - Ostateczne odpowiedzi z multimediami, błędami i jawną odpowiedzią anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie wykorzystują wiadomość podglądu.

    Strumieniowanie podglądu działa tylko dla tekstu; odpowiedzi multimedialne wracają do zwykłego dostarczania. Gdy strumieniowanie `block` jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii serwera:

    - `channels.discord.historyLimit` domyślnie `20`
    - rezerwa: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrola historii DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są routowane jako sesje kanałów i dziedziczą konfigurację kanału nadrzędnego, chyba że ją nadpisano.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) powoduje, że nowe automatyczne wątki są inicjalizowane transkrypcją z elementu nadrzędnego. Nadpisania per konto znajdują się w `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozwiązywać cele DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas rezerwy aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako kontekst **niezaufany**. Listy dozwolonych kontrolują, kto może uruchomić agenta, ale nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla subagentów">
    Discord może powiązać wątek z celem sesji, tak aby kolejne wiadomości w tym wątku były nadal kierowane do tej samej sesji (w tym sesji subagenta).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuń bieżące powiązanie wątku
    - `/agents` pokaż aktywne uruchomienia i stan powiązań
    - `/session idle <duration|off>` sprawdź/zaktualizuj automatyczne odwiązywanie po bezczynności dla skupionych powiązań
    - `/session max-age <duration|off>` sprawdź/zaktualizuj twardy maksymalny wiek dla skupionych powiązań

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
        spawnSubagentSessions: false, // opcjonalne
      },
    },
  },
}
```

    Uwagi:

    - `session.threadBindings.*` ustawia wartości domyślne globalnie.
    - `channels.discord.threadBindings.*` nadpisuje zachowanie Discord.
    - `spawnSubagentSessions` musi mieć wartość true, aby automatycznie tworzyć/powiązywać wątki dla `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` musi mieć wartość true, aby automatycznie tworzyć/powiązywać wątki dla ACP (`/acp spawn ... --thread ...` lub `sessions_spawn({ runtime: "acp", thread: true })`).
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązań wątków są niedostępne.

    Zobacz [Sub-agenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) i [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe powiązania kanałów ACP">
    W przypadku stabilnych, „zawsze włączonych” obszarów roboczych ACP skonfiguruj najwyższego poziomu typowane powiązania ACP kierowane do rozmów Discord.

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

    - `/acp spawn codex --bind here` wiąże bieżący kanał lub wątek na miejscu i utrzymuje przyszłe wiadomości w tej samej sesji ACP. Wiadomości w wątkach dziedziczą powiązanie kanału nadrzędnego.
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP na miejscu. Tymczasowe powiązania wątków mogą podczas aktywności nadpisywać rozwiązywanie celu.
    - `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć/powiązać podrzędny wątek przez `--thread auto|here`.

    Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać szczegóły zachowania powiązań.

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Tryb powiadomień o reakcjach per serwer:

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (używa `guilds.<id>.users`)

    Zdarzenia reakcji są zamieniane na zdarzenia systemowe i dołączane do routowanej sesji Discord.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozwiązywania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - rezerwa emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Discord akceptuje emoji Unicode lub nazwy niestandardowych emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji">
    Zapisy konfiguracji inicjowane z kanału są domyślnie włączone.

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
    Kieruj ruch WebSocket bramki Discord oraz wyszukiwania REST podczas uruchamiania (ID aplikacji + rozwiązywanie allowlist) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Nadpisanie per konto:

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
    Włącz rozwiązywanie PluralKit, aby mapować wiadomości wysyłane przez proxy na tożsamość członka systemu:

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

    - allowlist mogą używać `pk:<memberId>`
    - wyświetlane nazwy członków są dopasowywane według nazwy/slugu tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania używają oryginalnego ID wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, wiadomości wysyłane przez proxy są traktowane jak wiadomości bota i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Konfiguracja statusu">
    Aktualizacje statusu są stosowane, gdy ustawisz pole statusu lub aktywności albo gdy włączysz automatyczny status.

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

    Przykład aktywności (niestandardowy status to domyślny typ aktywności):

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

    - 0: Playing
    - 1: Streaming (wymaga `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (używa tekstu aktywności jako stanu statusu; emoji jest opcjonalne)
    - 5: Competing

    Przykład automatycznego statusu (sygnał kondycji środowiska uruchomieniowego):

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

    Automatyczny status mapuje dostępność środowiska uruchomieniowego na status Discord: healthy => online, degraded lub unknown => idle, exhausted lub unavailable => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discord">
    Discord obsługuje zatwierdzanie oparte na przyciskach w wiadomościach DM i może opcjonalnie publikować prośby o zatwierdzenie w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; gdy to możliwe, rezerwa to `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego, albo z `execApprovals.approvers`, albo z `commands.ownerAllowFrom`. Discord nie wyprowadza zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani z `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzeń.

    Gdy `target` ma wartość `channel` lub `both`, prośba o zatwierdzenie jest widoczna w kanale. Tylko rozpoznani zatwierdzający mogą używać przycisków; inni użytkownicy otrzymają efemeryczną odmowę. Prośby o zatwierdzenie zawierają tekst polecenia, więc dostarczanie do kanału włączaj tylko w zaufanych kanałach. Jeśli nie można wyprowadzić ID kanału z klucza sesji, OpenClaw wraca do dostarczania przez DM.

    Discord renderuje także współdzielone przyciski zatwierdzeń używane przez inne kanały czatu. Natywny adapter Discord głównie dodaje routowanie DM dla zatwierdzających i rozsyłanie do kanału.
    Gdy te przyciski są obecne, stanowią podstawowy interfejs zatwierdzania; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia czatowe są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

    Uwierzytelnianie Gateway i rozwiązywanie zatwierdzeń podążają za współdzielonym kontraktem klienta Gateway (`plugin:` IDs są rozwiązywane przez `plugin.approval.resolve`; inne ID przez `exec.approval.resolve`). Zatwierdzenia domyślnie wygasają po 30 minutach.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki działań

Działania wiadomości Discord obejmują wiadomości, administrację kanałami, moderację, status i działania na metadanych.

Podstawowe przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- status: `setPresence`

Działanie `event-create` akceptuje opcjonalny parametr `image` (URL lub lokalna ścieżka pliku), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki działań znajdują się w `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa działań                                                                                                                                                             | Domyślnie |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone  |
| roles                                                                                                                                                                     | wyłączone |
| moderation                                                                                                                                                                | wyłączone |
| presence                                                                                                                                                                  | wyłączone |

## Interfejs Components v2

OpenClaw używa komponentów Discord v2 do zatwierdzeń exec i znaczników międzykontekstowych. Działania wiadomości Discord mogą także akceptować `components` dla niestandardowego interfejsu (zaawansowane; wymaga skonstruowania ładunku komponentu przez narzędzie discord), podczas gdy starsze `embeds` nadal są dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustawienie per konto: `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord ma dwie odrębne powierzchnie głosowe: działające w czasie rzeczywistym **kanały głosowe** (ciągłe rozmowy) i **załączniki wiadomości głosowych** (format podglądu fali dźwiękowej). Gateway obsługuje oba.

### Kanały głosowe

Wymagania:

- Włącz polecenia natywne (`commands.native` lub `channels.discord.commands.native`).
- Skonfiguruj `channels.discord.voice`.
- Bot potrzebuje uprawnień Connect + Speak w docelowym kanale głosowym.

Użyj `/vc join|leave|status`, aby sterować sesjami. Polecenie używa domyślnego agenta konta i podlega tym samym zasadom allowlist i group policy co inne polecenia Discord.

Przykład automatycznego dołączania:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Uwagi:

- `voice.tts` nadpisuje `messages.tts` tylko dla odtwarzania głosowego.
- Tury transkrypcji głosowej wyprowadzają status właściciela z Discord `allowFrom` (lub `dm.allowFrom`); mówcy niebędący właścicielami nie mogą uzyskiwać dostępu do narzędzi tylko dla właściciela (na przykład `gateway` i `cron`).
- Głos jest domyślnie włączony; ustaw `channels.discord.voice.enabled=false`, aby go wyłączyć.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- OpenClaw monitoruje także błędy odszyfrowywania odbioru i automatycznie odzyskuje działanie przez opuszczenie/ponowne dołączenie do kanału głosowego po powtarzających się błędach w krótkim oknie czasu.
- Jeśli logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, może to być błąd odbioru po stronie `@discordjs/voice`, śledzony w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd fali dźwiękowej i wymagają dźwięku OGG/Opus. OpenClaw generuje falę automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście Gateway do inspekcji i konwersji.

- Podaj **lokalną ścieżkę pliku** (adresy URL są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst + wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw konwertuje go do OGG/Opus w razie potrzeby.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji lub bot nie widzi wiadomości z serwera">

    - włącz Message Content Intent
    - włącz Server Members Intent, jeśli zależysz od rozwiązywania użytkowników/członków
    - po zmianie intencji uruchom Gateway ponownie

  </Accordion>

  <Accordion title="Wiadomości z serwera są niespodziewanie blokowane">

    - sprawdź `groupPolicy`
    - sprawdź allowlist serwera w `channels.discord.guilds`
    - jeśli istnieje mapa `channels` dla serwera, dozwolone są tylko wymienione kanały
    - sprawdź zachowanie `requireMention` i wzorce wzmianek

    Przydatne kontrole:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="requireMention ma wartość false, ale nadal jest blokowane">
    Częste przyczyny:

    - `groupPolicy="allowlist"` bez pasującej allowlist serwera/kanału
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi znajdować się w `channels.discord.guilds` lub we wpisie kanału)
    - nadawca zablokowany przez allowlist `users` serwera/kanału

  </Accordion>

  <Accordion title="Długotrwałe handlery przekraczają limit czasu lub duplikują odpowiedzi">

    Typowe logi:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Parametr budżetu listenera:

    - pojedyncze konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Parametr limitu czasu działania workera:

    - pojedyncze konto: `channels.discord.inboundWorker.runTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - domyślnie: `1800000` (30 minut); ustaw `0`, aby wyłączyć

    Zalecana baza:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Użyj `eventQueue.listenerTimeout` dla powolnej konfiguracji listenera, a `inboundWorker.runTimeoutMs`
    tylko wtedy, gdy chcesz osobny zawór bezpieczeństwa dla kolejkowanych tur agenta.

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Kontrole uprawnień `channels status --probe` działają tylko dla numerycznych identyfikatorów kanałów.

    Jeśli używasz kluczy slug, dopasowanie w środowisku uruchomieniowym nadal może działać, ale sonda nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - zasady DM wyłączone: `channels.discord.dmPolicy="disabled"` (starsza nazwa: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot-do-bota">
    Domyślnie wiadomości napisane przez boty są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, używaj ścisłych reguł wzmiankowania i allowlist, aby uniknąć zapętleń.
    Preferuj `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które zawierają wzmiankę o bocie.

  </Accordion>

  <Accordion title="Voice STT gubi dane z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby była obecna logika odzyskiwania odbioru głosu Discord
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślnie upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy trwają po automatycznym ponownym dołączeniu, zbierz logi i porównaj je z [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="Pola Discord o wysokim znaczeniu">

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- zasady: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker wejściowy: `inboundWorker.runTimeoutMs`
- odpowiedzi/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- multimedia/ponawianie: `mediaMaxMb` (ogranicza wychodzące wysyłki Discord, domyślnie `100MB`), `retry`
- działania: `actions.*`
- status: `activity`, `status`, `activityType`, `activityUrl`
- interfejs: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jak sekrety (`DISCORD_BOT_TOKEN` jest preferowane w środowiskach nadzorowanych).
- Przyznawaj minimalny niezbędny zakres uprawnień Discord.
- Jeśli wdrożenie/stan poleceń jest nieaktualny, uruchom Gateway ponownie i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discord z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie czatów grupowych i allowlist.
  </Card>
  <Card title="Routowanie kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i wzmacnianie zabezpieczeń.
  </Card>
  <Card title="Routowanie wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj serwery i kanały do agentów.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Zachowanie poleceń natywnych.
  </Card>
</CardGroup>
