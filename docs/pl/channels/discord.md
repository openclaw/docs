---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-04-22T09:51:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 758846d22457ff66e28736a2e4c67c930ad4cd4dd5493b32afcc1912758fd540
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Status: gotowe do DM-ów i kanałów serwerowych przez oficjalną bramkę Discord.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    DM-y Discorda domyślnie działają w trybie parowania.
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
    Przewiń z powrotem do góry strony **Bot** i kliknij **Reset Token**.

    <Note>
    Wbrew nazwie, spowoduje to wygenerowanie pierwszego tokena — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest Twój **Bot Token** i za chwilę będzie Ci potrzebny.

  </Step>

  <Step title="Wygeneruj URL zaproszenia i dodaj bota do serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz URL zaproszenia z odpowiednimi uprawnieniami do dodania bota do serwera.

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

    To podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discorda, w tym w przepływach pracy kanałów forum lub mediów, które tworzą lub kontynuują wątek, włącz także **Send Messages in Threads**.
    Skopiuj wygenerowany URL na dole, wklej go do przeglądarki, wybierz swój serwer i kliknij **Continue**, aby nawiązać połączenie. Bot powinien być teraz widoczny na serwerze Discord.

  </Step>

  <Step title="Włącz Developer Mode i zbierz swoje identyfikatory">
    Po powrocie do aplikacji Discord musisz włączyć Developer Mode, aby móc kopiować wewnętrzne identyfikatory.

    1. Kliknij **User Settings** (ikona koła zębatego obok awatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem myszy **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem myszy swój **własny awatar** → **Copy User ID**

    Zapisz swój **Server ID** i **User ID** razem z Bot Tokenem — w następnym kroku przekażesz wszystkie trzy do OpenClaw.

  </Step>

  <Step title="Zezwól na DM-y od członków serwera">
    Aby parowanie działało, Discord musi pozwalać botowi wysyłać do Ciebie DM-y. Kliknij prawym przyciskiem myszy **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać Ci DM-y. Pozostaw tę opcję włączoną, jeśli chcesz używać DM-ów Discorda z OpenClaw. Jeśli planujesz używać tylko kanałów serwerowych, po sparowaniu możesz wyłączyć DM-y.

  </Step>

  <Step title="Ustaw bezpiecznie token bota (nie wysyłaj go na czacie)">
    Token bota Discord to sekret (jak hasło). Ustaw go na maszynie, na której działa OpenClaw, zanim wyślesz wiadomość do swojego agenta.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Jeśli OpenClaw działa już jako usługa w tle, uruchom go ponownie przez aplikację OpenClaw na Maca albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i przekaż mu to. Jeśli Discord to Twój pierwszy kanał, użyj zamiast tego karty CLI / config.

        > "Mam już ustawiony token bota Discord w config. Dokończ proszę konfigurację Discorda z User ID `<user_id>` i Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Jeśli wolisz config oparty na pliku, ustaw:

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

        Zwykłe wartości `token` w postaci jawnego tekstu są obsługiwane. Wartości SecretRef są również obsługiwane dla `channels.discord.token` w providerach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zatwierdź pierwsze parowanie DM">
    Poczekaj, aż Gateway będzie działać, a następnie wyślij DM do swojego bota w Discordzie. Odpowie kodem parowania.

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

    Powinieneś teraz móc rozmawiać ze swoim agentem przez DM w Discordzie.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenów jest świadome konta. Wartości tokenów z config mają pierwszeństwo przed rezerwą env. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/akcje kanałowe) jawny `token` używany jest dla tego konkretnego wywołania. Dotyczy to działań typu wysyłanie oraz odczyt/sondowanie (na przykład read/search/fetch/thread/pins/permissions). Ustawienia polityki konta/ponawiania nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
</Note>

## Zalecane: skonfiguruj obszar roboczy serwera

Gdy DM-y już działają, możesz skonfigurować swój serwer Discord jako pełny obszar roboczy, w którym każdy kanał ma własną sesję agenta z własnym kontekstem. To zalecane rozwiązanie dla prywatnych serwerów, na których jesteście tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
    Dzięki temu agent będzie mógł odpowiadać na dowolnym kanale na Twoim serwerze, a nie tylko w DM-ach.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Dodaj mój Discord Server ID `<server_id>` do listy dozwolonych serwerów"
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

  <Step title="Zezwól na odpowiedzi bez @mention">
    Domyślnie agent odpowiada na kanałach serwerowych tylko wtedy, gdy zostanie oznaczony przez @mention. Na prywatnym serwerze prawdopodobnie zechcesz, aby odpowiadał na każdą wiadomość.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Pozwól mojemu agentowi odpowiadać na tym serwerze bez konieczności używania @mention"
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

  <Step title="Zaplanuj pamięć dla kanałów serwerowych">
    Domyślnie pamięć długoterminowa (`MEMORY.md`) jest ładowana tylko w sesjach DM. Kanały serwerowe nie ładują automatycznie pliku `MEMORY.md`.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Kiedy zadaję pytania na kanałach Discorda, używaj `memory_search` lub `memory_get`, jeśli potrzebujesz długoterminowego kontekstu z `MEMORY.md`."
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu na każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Długoterminowe notatki trzymaj w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał dostaje własną odizolowaną sesję — możesz więc utworzyć `#coding`, `#home`, `#research` albo dowolne inne kanały pasujące do Twojego workflow.

## Model środowiska uruchomieniowego

- Gateway zarządza połączeniem z Discordem.
- Trasowanie odpowiedzi jest deterministyczne: odpowiedzi przychodzące z Discorda wracają do Discorda.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały serwerowe mają odizolowane klucze sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM-y są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia slash działają w odizolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), jednocześnie przenosząc `CommandTargetSessionKey` do trasowanej sesji rozmowy.

## Kanały forum

Kanały forum i mediów Discorda akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku wykorzystuje pierwszą niepustą linię wiadomości.
- Użyj `openclaw message thread create`, aby utworzyć wątek bezpośrednio. Nie przekazuj `--message-id` dla kanałów forum.

Przykład: wyślij do nadrzędnego forum, aby utworzyć wątek

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Przykład: utwórz jawnie wątek forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Nadrzędne fora nie akceptują komponentów Discorda. Jeśli potrzebujesz komponentów, wyślij wiadomość do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery Discord components v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są kierowane z powrotem do agenta jako zwykłe wiadomości przychodzące i podlegają istniejącym ustawieniom Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków lub pojedyncze menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowego użytku. Ustaw `components.reusable=true`, aby umożliwić wielokrotne używanie przycisków, selektorów i formularzy aż do ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` dla tego przycisku (identyfikatory użytkowników Discorda, tagi lub `*`). Gdy ta opcja jest skonfigurowana, niedopasowani użytkownicy otrzymają efemeryczną odmowę.

Polecenia slash `/model` i `/models` otwierają interaktywny selektor modelu z listami rozwijanymi providera i modelu oraz krokiem Submit. Odpowiedź selektora jest efemeryczna i tylko użytkownik, który wywołał polecenie, może z niej korzystać.

Załączniki plików:

- bloki `file` muszą wskazywać odwołanie do załącznika (`attachment://<filename>`)
- Przekaż załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
- Użyj `filename`, aby nadpisać nazwę wysyłanego pliku, gdy powinna pasować do odwołania do załącznika

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
  message: "Opcjonalny tekst zastępczy",
  components: {
    reusable: true,
    text: "Wybierz ścieżkę",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Zatwierdź",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Odrzuć", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Wybierz opcję",
          options: [
            { label: "Opcja A", value: "a" },
            { label: "Opcja B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Szczegóły",
      triggerLabel: "Otwórz formularz",
      fields: [
        { type: "text", label: "Wnioskodawca" },
        {
          type: "select",
          label: "Priorytet",
          options: [
            { label: "Niski", value: "low" },
            { label: "Wysoki", value: "high" },
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
    `channels.discord.dmPolicy` kontroluje dostęp do DM-ów (starsza nazwa: `channels.discord.dm.policy`):

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`; starsza nazwa: `channels.discord.dm.allowFrom`)
    - `disabled`

    Jeśli zasady DM nie są otwarte, nieznani użytkownicy są blokowani (lub otrzymują monit o parowanie w trybie `pairing`).

    Pierwszeństwo dla wielu kont:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Format celu DM przy dostarczaniu:

    - `user:<id>`
    - wzmianka `<@id>`

    Same numeryczne identyfikatory są niejednoznaczne i są odrzucane, chyba że jawnie podano rodzaj celu użytkownik/kanał.

  </Tab>

  <Tab title="Zasady serwera">
    Obsługa serwerów jest kontrolowana przez `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczna wartość bazowa, gdy istnieje `channels.discord`, to `allowlist`.

    Zachowanie `allowlist`:

    - serwer musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli skonfigurowano którekolwiek z nich, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako tryb zgodności awaryjnej
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazwa/tag
    - jeśli serwer ma skonfigurowane `channels`, kanały spoza listy są odrzucane
    - jeśli serwer nie ma bloku `channels`, wszystkie kanały na tym serwerze z listy dozwolonych są dozwolone

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

  <Tab title="Wzmianki i grupowe DM-y">
    Wiadomości na serwerach są domyślnie ograniczone wzmiankami.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, rezerwa `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    `requireMention` jest konfigurowane dla każdego serwera/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM-y:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów lub slugi)

  </Tab>
</Tabs>

### Trasowanie agentów według ról

Użyj `bindings[].match.roles`, aby kierować członków serwera Discord do różnych agentów według identyfikatora roli. Powiązania oparte na rolach akceptują tylko identyfikatory ról i są oceniane po powiązaniach peer lub parent-peer, a przed powiązaniami tylko dla serwera. Jeśli powiązanie ustawia również inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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

## Konfiguracja Developer Portal

<AccordionGroup>
  <Accordion title="Utwórz aplikację i bota">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Skopiuj token bota

  </Accordion>

  <Accordion title="Uprzywilejowane intencje">
    W **Bot -> Privileged Gateway Intents** włącz:

    - Message Content Intent
    - Server Members Intent (zalecane)

    Presence Intent jest opcjonalne i wymagane tylko wtedy, gdy chcesz otrzymywać aktualizacje statusu. Ustawianie statusu bota (`setPresence`) nie wymaga włączania aktualizacji statusu dla członków.

  </Accordion>

  <Accordion title="Zakresy OAuth i bazowe uprawnienia">
    Generator URL OAuth:

    - zakresy: `bot`, `applications.commands`

    Typowe bazowe uprawnienia:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opcjonalnie)

    To podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discorda, w tym w przepływach pracy kanałów forum lub mediów, które tworzą lub kontynuują wątek, włącz także **Send Messages in Threads**.
    Unikaj `Administrator`, chyba że jest to wyraźnie potrzebne.

  </Accordion>

  <Accordion title="Skopiuj identyfikatory">
    Włącz Discord Developer Mode, a następnie skopiuj:

    - identyfikator serwera
    - identyfikator kanału
    - identyfikator użytkownika

    W konfiguracji OpenClaw preferuj identyfikatory numeryczne, aby audyty i sondowanie były niezawodne.

  </Accordion>
</AccordionGroup>

## Natywne polecenia i autoryzacja poleceń

- `commands.native` domyślnie ma wartość `"auto"` i jest włączone dla Discorda.
- Nadpisanie dla kanału: `channels.discord.commands.native`.
- `commands.native=false` jawnie czyści wcześniej zarejestrowane natywne polecenia Discorda.
- Autoryzacja natywnych poleceń używa tych samych list dozwolonych/zasad Discorda co zwykła obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discorda dla użytkowników, którzy nie są uprawnieni; wykonanie nadal wymusza autoryzację OpenClaw i zwraca „brak autoryzacji”.

Zobacz [Polecenia slash](/pl/tools/slash-commands), aby poznać katalog poleceń i ich działanie.

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

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal respektowane.
    `first` zawsze dołącza niejawną natywną referencję odpowiedzi do pierwszej wychodzącej wiadomości Discord dla tej tury.
    `batched` dołącza niejawną natywną referencję odpowiedzi Discorda tylko wtedy, gdy
    przychodząca tura była zgrupowaną paczką wielu wiadomości po debounce. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie w niejednoznacznych, gwałtownych czatach,
    a nie przy każdej turze z pojedynczą wiadomością.

    Identyfikatory wiadomości są ujawniane w kontekście/historii, dzięki czemu agenci mogą kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Podgląd strumieniowania na żywo">
    OpenClaw może strumieniować robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją, gdy pojawia się tekst.

    - `channels.discord.streaming` kontroluje strumieniowanie podglądu (`off` | `partial` | `block` | `progress`, domyślnie: `off`).
    - Domyślną wartością pozostaje `off`, ponieważ edycje podglądu w Discordzie mogą szybko trafiać w limity szybkości, zwłaszcza gdy wiele botów lub Gateway współdzieli to samo konto lub ruch serwera.
    - `progress` jest akceptowane dla spójności międzykanałowej i w Discordzie mapuje się na `partial`.
    - `channels.discord.streamMode` to starszy alias i jest automatycznie migrowany.
    - `partial` edytuje jedną wiadomość podglądu, gdy napływają tokeny.
    - `block` emituje fragmenty o rozmiarze roboczego szkicu (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału).
    - Ostateczne odpowiedzi z multimediami, błędami i jawnymi odpowiedziami anulują oczekujące edycje podglądu bez opróżniania tymczasowego szkicu przed normalnym dostarczeniem.
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzi/postępu używają ponownie tej samej wiadomości podglądu szkicu (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.

    Przykład:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Domyślne ustawienia fragmentacji dla trybu `block` (ograniczane do `channels.discord.textChunkLimit`):

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

    Strumieniowanie podglądu obsługuje tylko tekst; odpowiedzi multimedialne wracają do normalnego dostarczania.

    Uwaga: strumieniowanie podglądu jest oddzielne od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie
    włączone dla Discorda, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii serwera:

    - `channels.discord.historyLimit` domyślnie `20`
    - rezerwa: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrole historii DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - wątki Discorda są trasowane jako sesje kanałów
    - metadane wątku nadrzędnego mogą być używane do powiązania z sesją nadrzędną
    - konfiguracja wątku dziedziczy konfigurację kanału nadrzędnego, chyba że istnieje wpis specyficzny dla wątku

    Tematy kanałów są wstrzykiwane jako kontekst **niezaufany** (nie jako system prompt).
    Kontekst odpowiedzi i cytowanych wiadomości obecnie pozostaje taki, jak został odebrany.
    Listy dozwolonych Discorda przede wszystkim ograniczają to, kto może wyzwolić agenta, a nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla subagentów">
    Discord może powiązać wątek z celem sesji, aby kolejne wiadomości w tym wątku nadal były kierowane do tej samej sesji (w tym sesji subagenta).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuń bieżące powiązanie wątku
    - `/agents` pokaż aktywne uruchomienia i stan powiązania
    - `/session idle <duration|off>` sprawdź/zaktualizuj automatyczne odwiązywanie po bezczynności dla powiązań z fokusem
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
        spawnSubagentSessions: false, // tryb opt-in
      },
    },
  },
}
```

    Uwagi:

    - `session.threadBindings.*` ustawia globalne wartości domyślne.
    - `channels.discord.threadBindings.*` nadpisuje zachowanie Discorda.
    - `spawnSubagentSessions` musi mieć wartość true, aby automatycznie tworzyć/powiązywać wątki dla `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` musi mieć wartość true, aby automatycznie tworzyć/powiązywać wątki dla ACP (`/acp spawn ... --thread ...` lub `sessions_spawn({ runtime: "acp", thread: true })`).
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązań wątków są niedostępne.

    Zobacz [Sub-agents](/pl/tools/subagents), [ACP Agents](/pl/tools/acp-agents) i [Configuration Reference](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe powiązania kanałów ACP">
    Dla stabilnych, „zawsze aktywnych” obszarów roboczych ACP skonfiguruj najwyższego poziomu typowane powiązania ACP kierowane do rozmów Discorda.

    Ścieżka config:

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

    - `/acp spawn codex --bind here` wiąże bieżący kanał lub wątek Discorda na miejscu i utrzymuje trasowanie przyszłych wiadomości do tej samej sesji ACP.
    - To nadal może oznaczać „uruchom świeżą sesję ACP Codex”, ale samo w sobie nie tworzy nowego wątku Discorda. Istniejący kanał pozostaje powierzchnią czatu.
    - Codex może nadal działać we własnym `cwd` lub obszarze roboczym backendu na dysku. Ten obszar roboczy jest stanem środowiska uruchomieniowego, a nie wątkiem Discorda.
    - Wiadomości wątków mogą dziedziczyć powiązanie ACP kanału nadrzędnego.
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP na miejscu.
    - Tymczasowe powiązania wątków nadal działają i podczas aktywności mogą nadpisywać rozstrzyganie celu.
    - `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć/powiązać podrzędny wątek przez `--thread auto|here`. Nie jest wymagane dla `/acp spawn ... --bind here` w bieżącym kanale.

    Szczegóły zachowania powiązań znajdziesz w [ACP Agents](/pl/tools/acp-agents).

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Tryb powiadomień o reakcjach dla każdego serwera:

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (używa `guilds.<id>.users`)

    Zdarzenia reakcji są zamieniane na zdarzenia systemowe i dołączane do trasowanej sesji Discorda.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozstrzygania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - rezerwa emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Discord akceptuje emoji unicode lub nazwy niestandardowych emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy config">
    Zapisy config inicjowane z kanału są domyślnie włączone.

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
    Kieruj ruch WebSocket bramki Discord oraz wyszukiwania startowe REST (identyfikator aplikacji + rozstrzyganie listy dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

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
    Włącz rozstrzyganie PluralKit, aby mapować wiadomości przesyłane przez proxy na tożsamość członka systemu:

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
    - wyświetlane nazwy członków są dopasowywane według nazwy/sluga tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania używają oryginalnego identyfikatora wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, wiadomości przesyłane przez proxy są traktowane jako wiadomości bota i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Konfiguracja statusu">
    Aktualizacje statusu są stosowane, gdy ustawisz pole statusu lub aktywności albo włączysz automatyczny status.

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

    Przykład aktywności (niestandardowy status to domyślny typ aktywności):

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

    Przykład streamingu:

```json5
{
  channels: {
    discord: {
      activity: "Kodowanie na żywo",
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
        exhaustedText: "token wyczerpany",
      },
    },
  },
}
```

    Automatyczny status mapuje dostępność środowiska uruchomieniowego na status Discorda: healthy => online, degraded lub unknown => idle, exhausted lub unavailable => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discordzie">
    Discord obsługuje zatwierdzenia oparte na przyciskach w DM-ach i opcjonalnie może publikować monity o zatwierdzenie w kanale źródłowym.

    Ścieżka config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; jeśli to możliwe, rezerwa to `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozstrzygnąć co najmniej jednego zatwierdzającego — albo z `execApprovals.approvers`, albo z `commands.ownerAllowFrom`. Discord nie wyprowadza zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani bezpośredniowiadomościowego `defaultTo`. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzania.

    Gdy `target` ma wartość `channel` lub `both`, monit o zatwierdzenie jest widoczny w kanale. Tylko rozstrzygnięci zatwierdzający mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Monity o zatwierdzenie zawierają tekst polecenia, więc dostarczanie do kanału włączaj tylko w zaufanych kanałach. Jeśli identyfikator kanału nie może zostać wyprowadzony z klucza sesji, OpenClaw wraca do dostarczenia przez DM.

    Discord renderuje także współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Discorda głównie dodaje trasowanie DM zatwierdzających i rozsyłanie do kanałów.
    Gdy te przyciski są obecne, stanowią główne UX zatwierdzania; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

    Autoryzacja Gateway dla tego handlera używa tej samej współdzielonej umowy rozstrzygania poświadczeń co inni klienci Gateway:

    - lokalna autoryzacja env-first (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie `gateway.auth.*`)
    - w trybie lokalnym `gateway.remote.*` może być używane jako rezerwa tylko wtedy, gdy `gateway.auth.*` nie jest ustawione; skonfigurowane, ale nierozstrzygnięte lokalne SecretRef kończą się bezpieczną odmową
    - obsługa trybu zdalnego przez `gateway.remote.*`, gdy ma to zastosowanie
    - nadpisania URL są bezpieczne względem nadpisywania: nadpisania CLI nie używają ponownie niejawnych poświadczeń, a nadpisania env używają tylko poświadczeń env

    Zachowanie rozstrzygania zatwierdzeń:

    - identyfikatory poprzedzone `plugin:` są rozstrzygane przez `plugin.approval.resolve`.
    - inne identyfikatory są rozstrzygane przez `exec.approval.resolve`.
    - Discord nie wykonuje tutaj dodatkowego przeskoku rezerwowego exec-do-plugin; prefiks identyfikatora
      decyduje, którą metodę Gateway wywoła.

    Zatwierdzenia exec wygasają domyślnie po 30 minutach. Jeśli zatwierdzenia kończą się błędem
    nieznanych identyfikatorów zatwierdzeń, sprawdź rozstrzyganie zatwierdzających, włączenie funkcji
    oraz to, czy dostarczony rodzaj identyfikatora zatwierdzenia pasuje do oczekującego żądania.

    Powiązana dokumentacja: [Exec approvals](/pl/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki akcji

Akcje wiadomości Discorda obejmują wiadomości, administrację kanałami, moderację, status i akcje metadanych.

Podstawowe przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- status: `setPresence`

Akcja `event-create` akceptuje opcjonalny parametr `image` (URL lub lokalna ścieżka pliku), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki akcji znajdują się pod `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa akcji                                                                                                                                                              | Domyślnie |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone  |
| roles                                                                                                                                                                    | wyłączone |
| moderation                                                                                                                                                               | wyłączone |
| presence                                                                                                                                                                 | wyłączone |

## UI Components v2

OpenClaw używa Discord components v2 do zatwierdzeń exec i znaczników międzykontekstowych. Akcje wiadomości Discorda mogą również akceptować `components` dla niestandardowego UI (zaawansowane; wymaga zbudowania ładunku komponentów przez narzędzie discord), podczas gdy starsze `embeds` pozostają dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discorda (hex).
- Ustaw dla konta przez `channels.discord.accounts.<id>.ui.components.accentColor`.
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

## Kanały głosowe

OpenClaw może dołączać do kanałów głosowych Discorda do rozmów w czasie rzeczywistym i ciągłych. To coś innego niż załączniki wiadomości głosowych.

Wymagania:

- Włącz natywne polecenia (`commands.native` lub `channels.discord.commands.native`).
- Skonfiguruj `channels.discord.voice`.
- Bot potrzebuje uprawnień Connect + Speak w docelowym kanale głosowym.

Użyj natywnego polecenia tylko dla Discorda `/vc join|leave|status`, aby sterować sesjami. Polecenie używa domyślnego agenta konta i podlega tym samym regułom listy dozwolonych oraz zasad grupowych co inne polecenia Discorda.

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
- Tury transkrypcji głosowej wyprowadzają status właściciela z Discord `allowFrom` (lub `dm.allowFrom`); mówcy niebędący właścicielem nie mogą uzyskiwać dostępu do narzędzi tylko dla właściciela (na przykład `gateway` i `cron`).
- Głos jest domyślnie włączony; ustaw `channels.discord.voice.enabled=false`, aby go wyłączyć.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Wartości domyślne `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- OpenClaw monitoruje także błędy odszyfrowywania odbioru i automatycznie odzyskuje działanie, opuszczając i ponownie dołączając do kanału głosowego po powtarzających się błędach w krótkim oknie czasu.
- Jeśli logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, może to być błąd odbioru po stronie upstream `@discordjs/voice` śledzony w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Wiadomości głosowe

Wiadomości głosowe Discorda pokazują podgląd fali dźwiękowej i wymagają dźwięku OGG/Opus oraz metadanych. OpenClaw generuje falę dźwiękową automatycznie, ale wymaga dostępnych `ffmpeg` i `ffprobe` na hoście Gateway, aby analizować i konwertować pliki audio.

Wymagania i ograniczenia:

- Podaj **lokalną ścieżkę pliku** (URL-e są odrzucane).
- Pomiń treść tekstową (Discord nie pozwala na tekst + wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw konwertuje go do OGG/Opus, gdy to potrzebne.

Przykład:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji lub bot nie widzi wiadomości serwerowych">

    - włącz Message Content Intent
    - włącz Server Members Intent, jeśli polegasz na rozstrzyganiu użytkownika/członka
    - po zmianie intencji uruchom ponownie gateway

  </Accordion>

  <Accordion title="Wiadomości serwerowe są nieoczekiwanie blokowane">

    - sprawdź `groupPolicy`
    - sprawdź listę dozwolonych serwerów w `channels.discord.guilds`
    - jeśli istnieje mapa `channels` serwera, dozwolone są tylko wymienione kanały
    - sprawdź zachowanie `requireMention` i wzorce wzmianek

    Przydatne polecenia sprawdzające:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="requireMention ustawione na false, ale nadal blokowane">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych serwerów/kanałów
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi być pod `channels.discord.guilds` lub wpisem kanału)
    - nadawca zablokowany przez listę dozwolonych `users` serwera/kanału

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

    Zalecana wartość bazowa:

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

    Używaj `eventQueue.listenerTimeout` dla powolnej konfiguracji listenera, a `inboundWorker.runTimeoutMs`
    tylko wtedy, gdy chcesz mieć osobny bezpiecznik dla kolejkowanych tur agenta.

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
    Domyślnie wiadomości utworzone przez boty są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, użyj ścisłych reguł wzmianek i list dozwolonych, aby uniknąć zachowań zapętlających.
    Preferuj `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota.

  </Accordion>

  <Accordion title="Głosowe STT gubi dane z `DecryptionFailed(...)`">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby logika odzyskiwania odbioru głosu Discorda była obecna
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy utrzymują się po automatycznym ponownym dołączeniu, zbierz logi i porównaj je z [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Wskaźniki do Configuration Reference

Główne odniesienie:

- [Configuration reference - Discord](/pl/gateway/configuration-reference#discord)

Pola Discorda o wysokim znaczeniu:

- uruchamianie/autoryzacja: `enabled`, `token`, `accounts.*`, `allowBots`
- zasady: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker przychodzący: `inboundWorker.runTimeoutMs`
- odpowiedzi/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- multimedia/ponawianie: `mediaMaxMb`, `retry`
  - `mediaMaxMb` ogranicza wychodzące przesyłanie do Discorda (domyślnie: `100MB`)
- akcje: `actions.*`
- status: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jak sekrety (w nadzorowanych środowiskach preferowany jest `DISCORD_BOT_TOKEN`).
- Przyznawaj minimalny niezbędny zakres uprawnień Discorda.
- Jeśli wdrożenie/stan poleceń jest nieaktualny, uruchom ponownie gateway i ponownie sprawdź za pomocą `openclaw channels status --probe`.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Trasowanie kanałów](/pl/channels/channel-routing)
- [Bezpieczeństwo](/pl/gateway/security)
- [Trasowanie wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
- [Polecenia slash](/pl/tools/slash-commands)
