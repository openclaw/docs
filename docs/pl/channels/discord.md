---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Stan obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-04-08T09:46:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3cd2886fad941ae2129e681911309539e9a65a2352b777b538d7f4686a68f73f
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Stan: gotowy do DM-ów i kanałów serwera za pośrednictwem oficjalnej bramy Discord.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    DM-y Discord domyślnie działają w trybie parowania.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałem" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i przepływ naprawczy.
  </Card>
</CardGroup>

## Szybka konfiguracja

Musisz utworzyć nową aplikację z botem, dodać bota do swojego serwera i sparować go z OpenClaw. Zalecamy dodanie bota do własnego prywatnego serwera. Jeśli jeszcze go nie masz, [najpierw utwórz serwer](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wybierz **Create My Own > For me and my friends**).

<Steps>
  <Step title="Utwórz aplikację Discord i bota">
    Przejdź do [Discord Developer Portal](https://discord.com/developers/applications) i kliknij **New Application**. Nadaj jej nazwę, na przykład „OpenClaw”.

    Kliknij **Bot** na pasku bocznym. Ustaw **Username** na nazwę, której używasz dla swojego agenta OpenClaw.

  </Step>

  <Step title="Włącz uprawnione intencje">
    Nadal na stronie **Bot** przewiń do sekcji **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazw do ID)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem do góry na stronie **Bot** i kliknij **Reset Token**.

    <Note>
    Mimo nazwy spowoduje to wygenerowanie Twojego pierwszego tokena — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest Twój **Bot Token** i za chwilę będzie potrzebny.

  </Step>

  <Step title="Wygeneruj adres URL zaproszenia i dodaj bota do serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz adres URL zaproszenia z odpowiednimi uprawnieniami do dodania bota do swojego serwera.

    Przewiń do **OAuth2 URL Generator** i włącz:

    - `bot`
    - `applications.commands`

    Poniżej pojawi się sekcja **Bot Permissions**. Włącz:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcjonalne)

    Skopiuj wygenerowany adres URL na dole, wklej go do przeglądarki, wybierz swój serwer i kliknij **Continue**, aby połączyć. Powinieneś teraz zobaczyć swojego bota na serwerze Discord.

  </Step>

  <Step title="Włącz tryb deweloperski i zbierz swoje ID">
    Po powrocie do aplikacji Discord musisz włączyć Developer Mode, aby móc kopiować wewnętrzne identyfikatory.

    1. Kliknij **User Settings** (ikona koła zębatego obok avatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem własny **avatar** → **Copy User ID**

    Zapisz swoje **Server ID** i **User ID** razem z Bot Token — w następnym kroku przekażesz wszystkie trzy do OpenClaw.

  </Step>

  <Step title="Zezwól na DM-y od członków serwera">
    Aby parowanie działało, Discord musi pozwalać Twojemu botowi wysyłać do Ciebie DM-y. Kliknij prawym przyciskiem **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać Ci DM-y. Pozostaw tę opcję włączoną, jeśli chcesz używać DM-ów Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, możesz wyłączyć DM-y po sparowaniu.

  </Step>

  <Step title="Ustaw bezpiecznie token bota (nie wysyłaj go na czacie)">
    Token Twojego bota Discord jest sekretem (jak hasło). Ustaw go na maszynie, na której działa OpenClaw, zanim wyślesz wiadomość do agenta.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Jeśli OpenClaw działa już jako usługa w tle, uruchom go ponownie za pomocą aplikacji OpenClaw Mac albo zatrzymaj i uruchom ponownie proces `openclaw gateway run`.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i przekaż mu to. Jeśli Discord jest Twoim pierwszym kanałem, zamiast tego użyj karty CLI / config.

        > "Ustawiłem już token mojego bota Discord w konfiguracji. Dokończ proszę konfigurację Discord za pomocą User ID `<user_id>` i Server ID `<server_id>`."
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

        Zmienna środowiskowa jako fallback dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        Zwykłe tekstowe wartości `token` są obsługiwane. Wartości SecretRef są również obsługiwane dla `channels.discord.token` we wszystkich dostawcach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zatwierdź pierwsze parowanie DM">
    Poczekaj, aż brama zacznie działać, a następnie wyślij DM do swojego bota w Discord. Odpowie kodem parowania.

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

    Powinieneś teraz móc rozmawiać ze swoim agentem w Discord przez DM.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokena jest zależne od konta. Wartości tokena w konfiguracji mają pierwszeństwo przed fallbackiem z env. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/działania kanałowe) jawny `token` dla pojedynczego wywołania jest używany tylko dla tego wywołania. Dotyczy to działań typu send oraz read/probe (na przykład read/search/fetch/thread/pins/permissions). Zasady konta i ustawienia ponawiania pochodzą nadal z wybranego konta w aktywnej migawce środowiska wykonawczego.
</Note>

## Zalecane: skonfiguruj obszar roboczy serwera

Gdy DM-y już działają, możesz skonfigurować swój serwer Discord jako pełny obszar roboczy, w którym każdy kanał ma własną sesję agenta i własny kontekst. Jest to zalecane w przypadku prywatnych serwerów, na których jesteś tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
    Dzięki temu agent będzie mógł odpowiadać na dowolnym kanale na Twoim serwerze, a nie tylko w DM-ach.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Dodaj moje Discord Server ID `<server_id>` do listy dozwolonych serwerów"
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
    Domyślnie agent odpowiada na kanałach serwera tylko wtedy, gdy zostanie wspomniany przez @mention. Na prywatnym serwerze prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Pozwól mojemu agentowi odpowiadać na tym serwerze bez konieczności używania @mention"
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

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zaplanuj użycie pamięci na kanałach serwera">
    Domyślnie pamięć długoterminowa (MEMORY.md) jest ładowana tylko w sesjach DM. Kanały serwera nie ładują automatycznie MEMORY.md.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Kiedy zadaję pytania na kanałach Discord, używaj memory_search lub memory_get, jeśli potrzebujesz długoterminowego kontekstu z MEMORY.md."
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu na każdym kanale, umieść stałe instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Długoterminowe notatki trzymaj w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Twój agent widzi nazwę kanału, a każdy kanał otrzymuje własną izolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` lub cokolwiek pasuje do Twojego sposobu pracy.

## Model środowiska wykonawczego

- Brama zarządza połączeniem Discord.
- Routing odpowiedzi jest deterministyczny: odpowiedzi przychodzące z Discord wracają do Discord.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały serwera mają izolowane klucze sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM-y są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia ukośnikowe działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), przy jednoczesnym przenoszeniu `CommandTargetSessionKey` do routowanej sesji rozmowy.

## Kanały forum

Kanały forum i mediów Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku używa pierwszej niepustej linii wiadomości.
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

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są kierowane z powrotem do agenta jako zwykłe wiadomości przychodzące i podlegają istniejącym ustawieniom Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków albo pojedyncze menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowe. Ustaw `components.reusable=true`, aby umożliwić wielokrotne użycie przycisków, list wyboru i formularzy aż do ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` dla tego przycisku (ID użytkowników Discord, tagi lub `*`). Gdy jest to skonfigurowane, niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Polecenia ukośnikowe `/model` i `/models` otwierają interaktywny wybór modelu z listami rozwijanymi dostawcy i modelu oraz krokiem Submit. Odpowiedź selektora jest efemeryczna i tylko użytkownik, który go wywołał, może z niej korzystać.

Załączniki plików:

- bloki `file` muszą wskazywać referencję załącznika (`attachment://<filename>`)
- przekaż załącznik przez `media`/`path`/`filePath` (pojedynczy plik); dla wielu plików użyj `media-gallery`
- użyj `filename`, aby nadpisać nazwę przesyłanego pliku, gdy ma odpowiadać referencji załącznika

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
    `channels.discord.dmPolicy` kontroluje dostęp do DM-ów (starsze: `channels.discord.dm.policy`):

    - `pairing` (domyślne)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`; starsze: `channels.discord.dm.allowFrom`)
    - `disabled`

    Jeśli zasady DM nie są otwarte, nieznani użytkownicy są blokowani (lub proszeni o sparowanie w trybie `pairing`).

    Priorytet dla wielu kont:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Format celu DM dla dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same numeryczne ID są niejednoznaczne i odrzucane, chyba że podano jawny rodzaj celu użytkownik/kanał.

  </Tab>

  <Tab title="Zasady serwera">
    Obsługa serwerów jest kontrolowana przez `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczną bazą, gdy istnieje `channels.discord`, jest `allowlist`.

    Zachowanie `allowlist`:

    - serwer musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne ID) i `roles` (tylko ID ról); jeśli skonfigurowano którąkolwiek z nich, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako tryb zgodności awaryjnej
    - nazwy/tagi są obsługiwane dla `users`, ale ID są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazw/tagów
    - jeśli serwer ma skonfigurowane `channels`, kanały spoza listy są odrzucane
    - jeśli serwer nie ma bloku `channels`, wszystkie kanały na tym serwerze z listy dozwolonych są dopuszczone

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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, fallback środowiska wykonawczego to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Wzmianki i grupowe DM-y">
    Wiadomości na serwerze są domyślnie ograniczane przez wzmianki.

    Wykrywanie wzmianki obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    `requireMention` konfiguruje się dla każdego serwera/kanału osobno (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM-y:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (ID kanałów lub slugi)

  </Tab>
</Tabs>

### Routing agenta oparty na rolach

Użyj `bindings[].match.roles`, aby kierować członków serwera Discord do różnych agentów według ID roli. Powiązania oparte na rolach akceptują wyłącznie ID ról i są oceniane po powiązaniach peer lub parent-peer, a przed powiązaniami tylko-serwerowymi. Jeśli powiązanie ustawia także inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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

  <Accordion title="Uprawnione intencje">
    W **Bot -> Privileged Gateway Intents** włącz:

    - Message Content Intent
    - Server Members Intent (zalecane)

    Presence intent jest opcjonalne i wymagane tylko wtedy, gdy chcesz otrzymywać aktualizacje obecności. Ustawianie obecności bota (`setPresence`) nie wymaga włączenia aktualizacji obecności członków.

  </Accordion>

  <Accordion title="Zakresy OAuth i bazowe uprawnienia">
    Generator URL OAuth:

    - zakresy: `bot`, `applications.commands`

    Typowe bazowe uprawnienia:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcjonalne)

    Unikaj `Administrator`, chyba że jest to wyraźnie potrzebne.

  </Accordion>

  <Accordion title="Skopiuj ID">
    Włącz Discord Developer Mode, a następnie skopiuj:

    - ID serwera
    - ID kanału
    - ID użytkownika

    Preferuj numeryczne ID w konfiguracji OpenClaw dla wiarygodnych audytów i testów.

  </Accordion>
</AccordionGroup>

## Polecenia natywne i uwierzytelnianie poleceń

- `commands.native` domyślnie ma wartość `"auto"` i jest włączone dla Discord.
- Nadpisanie dla kanału: `channels.discord.commands.native`.
- `commands.native=false` jawnie usuwa wcześniej zarejestrowane natywne polecenia Discord.
- Uwierzytelnianie natywnych poleceń używa tych samych list dozwolonych/zasad Discord co zwykła obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discord dla użytkowników bez uprawnień; wykonanie nadal wymusza uwierzytelnianie OpenClaw i zwraca „not authorized”.

Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands), aby poznać katalog poleceń i ich zachowanie.

Domyślne ustawienia poleceń ukośnikowych:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Tagi odpowiedzi i natywne odpowiedzi">
    Discord obsługuje tagi odpowiedzi w danych wyjściowych agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Kontrolowane przez `channels.discord.replyToMode`:

    - `off` (domyślne)
    - `first`
    - `all`
    - `batched`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal respektowane.
    `first` zawsze dołącza niejawną natywną referencję odpowiedzi do pierwszej wychodzącej wiadomości Discord w danej turze.
    `batched` dołącza niejawną natywną referencję odpowiedzi Discord tylko wtedy, gdy
    tura przychodząca była odroczoną partią wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie przy niejednoznacznych, gwałtownych seriach czatu, a nie przy każdej
    pojedynczej turze wiadomości.

    ID wiadomości są ujawniane w kontekście/historii, dzięki czemu agenci mogą kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Podgląd transmisji na żywo">
    OpenClaw może strumieniowo wyświetlać szkice odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływu tekstu.

    - `channels.discord.streaming` kontroluje podgląd strumieniowy (`off` | `partial` | `block` | `progress`, domyślnie: `off`).
    - Domyślnie pozostaje `off`, ponieważ edycje podglądu w Discord mogą szybko natrafić na limity szybkości, zwłaszcza gdy wiele botów lub bram współdzieli to samo konto lub ruch serwera.
    - `progress` jest akceptowane dla spójności międzykanałowej i w Discord mapuje się na `partial`.
    - `channels.discord.streamMode` to starszy alias i jest automatycznie migrowany.
    - `partial` edytuje pojedynczą wiadomość podglądu w miarę napływu tokenów.
    - `block` emituje fragmenty o rozmiarze szkicu (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału).

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

    Domyślne fragmentowanie w trybie `block` (ograniczane do `channels.discord.textChunkLimit`):

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

    Podgląd strumieniowy obsługuje tylko tekst; odpowiedzi z mediami wracają do zwykłego dostarczania.

    Uwaga: podgląd strumieniowy jest oddzielny od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie
    włączone dla Discord, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii serwera:

    - `channels.discord.historyLimit` domyślnie `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrola historii DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - wątki Discord są routowane jako sesje kanałów
    - metadane wątku nadrzędnego mogą być używane do powiązania z sesją nadrzędną
    - konfiguracja wątku dziedziczy konfigurację kanału nadrzędnego, chyba że istnieje wpis specyficzny dla wątku

    Tematy kanałów są wstrzykiwane jako kontekst **niezaufany** (nie jako system prompt).
    Kontekst odpowiedzi i cytowanych wiadomości obecnie pozostaje taki, jak został odebrany.
    Listy dozwolonych Discord przede wszystkim ograniczają, kto może uruchomić agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla subagentów">
    Discord może powiązać wątek z celem sesji, tak aby kolejne wiadomości w tym wątku nadal były kierowane do tej samej sesji (w tym sesji subagentów).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuń bieżące powiązanie wątku
    - `/agents` pokaż aktywne uruchomienia i stan powiązań
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
        spawnSubagentSessions: false, // opcjonalne
      },
    },
  },
}
```

    Uwagi:

    - `session.threadBindings.*` ustawia domyślne ustawienia globalne.
    - `channels.discord.threadBindings.*` nadpisuje zachowanie Discord.
    - `spawnSubagentSessions` musi mieć wartość true, aby automatycznie tworzyć/powiązywać wątki dla `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` musi mieć wartość true, aby automatycznie tworzyć/powiązywać wątki dla ACP (`/acp spawn ... --thread ...` lub `sessions_spawn({ runtime: "acp", thread: true })`).
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązań wątków są niedostępne.

    Zobacz [Sub-agenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) oraz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe powiązania kanałów ACP">
    Dla stabilnych, „zawsze aktywnych” obszarów roboczych ACP skonfiguruj najwyższego poziomu typowane powiązania ACP kierowane do rozmów Discord.

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

    - `/acp spawn codex --bind here` wiąże bieżący kanał lub wątek Discord na miejscu i utrzymuje kierowanie przyszłych wiadomości do tej samej sesji ACP.
    - Nadal może to oznaczać „uruchom świeżą sesję Codex ACP”, ale samo w sobie nie tworzy nowego wątku Discord. Istniejący kanał pozostaje powierzchnią czatu.
    - Codex może nadal działać we własnym `cwd` lub obszarze roboczym backendu na dysku. Ten obszar roboczy jest stanem środowiska wykonawczego, a nie wątkiem Discord.
    - Wiadomości wątków mogą dziedziczyć powiązanie ACP kanału nadrzędnego.
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP na miejscu.
    - Tymczasowe powiązania wątków nadal działają i mogą nadpisywać rozwiązywanie celu, gdy są aktywne.
    - `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć/powiązać podrzędny wątek przez `--thread auto|here`. Nie jest wymagane dla `/acp spawn ... --bind here` w bieżącym kanale.

    Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać szczegóły zachowania powiązań.

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Tryb powiadomień o reakcjach dla każdego serwera:

    - `off`
    - `own` (domyślne)
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
    - fallback emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Discord akceptuje emoji unicode lub niestandardowe nazwy emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji">
    Zapisy konfiguracji inicjowane z kanału są domyślnie włączone.

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

  <Accordion title="Proxy bramy">
    Kieruj ruch WebSocket bramy Discord i zapytania REST przy uruchamianiu (ID aplikacji + rozwiązywanie listy dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

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
    Włącz rozwiązywanie PluralKit, aby mapować wiadomości proxy na tożsamość członka systemu:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // opcjonalne; potrzebne dla prywatnych systemów
      },
    },
  },
}
```

    Uwagi:

    - listy dozwolonych mogą używać `pk:<memberId>`
    - wyświetlane nazwy członków są dopasowywane według nazwy/slugu tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania używają oryginalnego ID wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, wiadomości proxy są traktowane jako wiadomości bota i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Konfiguracja obecności">
    Aktualizacje obecności są stosowane, gdy ustawisz pole statusu lub aktywności, albo gdy włączysz automatyczną obecność.

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

    Przykład transmisji:

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

    Automatyczna obecność mapuje dostępność środowiska wykonawczego na status Discord: healthy => online, degraded lub unknown => idle, exhausted lub unavailable => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discord">
    Discord obsługuje zatwierdzanie oparte na przyciskach w DM-ach i może opcjonalnie publikować monity o zatwierdzenie w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; gdy to możliwe, fallback do `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego — albo z `execApprovals.approvers`, albo z `commands.ownerAllowFrom`. Discord nie wywnioskuje zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani z `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzeń.

    Gdy `target` ma wartość `channel` lub `both`, monit o zatwierdzenie jest widoczny w kanale. Tylko rozwiązani zatwierdzający mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Monity o zatwierdzenie zawierają tekst polecenia, dlatego dostarczanie do kanału włączaj tylko na zaufanych kanałach. Jeśli nie można wyprowadzić ID kanału z klucza sesji, OpenClaw wraca do dostarczania przez DM.

    Discord renderuje również współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Discord głównie dodaje routing DM zatwierdzających i rozsyłanie do kanału.
    Gdy te przyciski są obecne, są one podstawowym UX zatwierdzania; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie jest jedyną drogą.

    Uwierzytelnianie bramy dla tego modułu obsługi używa tego samego współdzielonego kontraktu rozwiązywania poświadczeń co inni klienci Gateway:

    - najpierw lokalne uwierzytelnianie z env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie `gateway.auth.*`)
    - w trybie lokalnym `gateway.remote.*` może być używane jako fallback tylko wtedy, gdy `gateway.auth.*` nie jest ustawione; skonfigurowane, ale nierozwiązane lokalne SecretRef kończą się bezpieczną odmową
    - obsługa trybu zdalnego przez `gateway.remote.*`, gdy ma zastosowanie
    - nadpisania URL są bezpieczne względem nadpisywania: nadpisania CLI nie używają ponownie niejawnych poświadczeń, a nadpisania env używają tylko poświadczeń z env

    Zachowanie rozwiązywania zatwierdzeń:

    - ID z prefiksem `plugin:` są rozwiązywane przez `plugin.approval.resolve`.
    - Pozostałe ID są rozwiązywane przez `exec.approval.resolve`.
    - Discord nie wykonuje tutaj dodatkowego przejścia fallback exec-to-plugin; prefiks
      ID decyduje, którą metodę bramy wywoła.

    Zatwierdzenia exec domyślnie wygasają po 30 minutach. Jeśli zatwierdzenia kończą się błędem
    z nieznanymi ID zatwierdzeń, sprawdź rozwiązywanie zatwierdzających, włączenie funkcji oraz
    czy dostarczony rodzaj ID zatwierdzenia pasuje do oczekującego żądania.

    Powiązana dokumentacja: [Zatwierdzenia exec](/pl/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki działań

Działania wiadomości Discord obejmują wiadomości, administrację kanałami, moderację, obecność i działania na metadanych.

Podstawowe przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Działanie `event-create` akceptuje opcjonalny parametr `image` (URL lub lokalna ścieżka pliku), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki działań znajdują się w `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa działań                                                                                                                                                            | Domyślnie |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone  |
| roles                                                                                                                                                                    | wyłączone |
| moderation                                                                                                                                                               | wyłączone |
| presence                                                                                                                                                                 | wyłączone |

## Interfejs Components v2

OpenClaw używa Discord components v2 do zatwierdzeń exec i znaczników międzykontekstowych. Działania wiadomości Discord mogą również przyjmować `components` dla niestandardowego interfejsu (zaawansowane; wymaga skonstruowania ładunku komponentów za pomocą narzędzia discord), podczas gdy starsze `embeds` nadal są dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustawienie per konto: `channels.discord.accounts.<id>.ui.components.accentColor`.
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

OpenClaw może dołączać do kanałów głosowych Discord, aby prowadzić rozmowy w czasie rzeczywistym i ciągłe. To osobna funkcja, niezależna od załączników z wiadomościami głosowymi.

Wymagania:

- Włącz polecenia natywne (`commands.native` lub `channels.discord.commands.native`).
- Skonfiguruj `channels.discord.voice`.
- Bot potrzebuje uprawnień Connect + Speak w docelowym kanale głosowym.

Użyj polecenia natywnego tylko dla Discord `/vc join|leave|status`, aby kontrolować sesje. Polecenie używa domyślnego agenta konta i podlega tym samym zasadom listy dozwolonych oraz group policy co pozostałe polecenia Discord.

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
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane bezpośrednio do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- OpenClaw obserwuje również błędy deszyfrowania podczas odbioru i automatycznie odzyskuje połączenie, opuszczając i ponownie dołączając do kanału głosowego po powtarzających się błędach w krótkim oknie czasu.
- Jeśli logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, może to być błąd odbioru upstream `@discordjs/voice` śledzony w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd przebiegu fali i wymagają dźwięku OGG/Opus oraz metadanych. OpenClaw generuje przebieg automatycznie, ale potrzebuje dostępnych `ffmpeg` i `ffprobe` na hoście bramy, aby analizować i konwertować pliki audio.

Wymagania i ograniczenia:

- Podaj **lokalną ścieżkę pliku** (adresy URL są odrzucane).
- Pomiń treść tekstową (Discord nie pozwala na tekst i wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw w razie potrzeby konwertuje go do OGG/Opus.

Przykład:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji lub bot nie widzi wiadomości z serwera">

    - włącz Message Content Intent
    - włącz Server Members Intent, jeśli polegasz na rozwiązywaniu użytkowników/członków
    - uruchom ponownie bramę po zmianie intencji

  </Accordion>

  <Accordion title="Wiadomości z serwera są nieoczekiwanie blokowane">

    - sprawdź `groupPolicy`
    - sprawdź listę dozwolonych serwerów w `channels.discord.guilds`
    - jeśli istnieje mapa `channels` dla serwera, dozwolone są tylko wymienione kanały
    - sprawdź zachowanie `requireMention` i wzorce wzmianek

    Przydatne polecenia:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention ustawione na false, ale nadal jest blokowane">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych serwera/kanału
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi znajdować się w `channels.discord.guilds` lub we wpisie kanału)
    - nadawca zablokowany przez listę dozwolonych `users` dla serwera/kanału

  </Accordion>

  <Accordion title="Długotrwale działające handlery kończą się timeoutem lub duplikują odpowiedzi">

    Typowe logi:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Parametr budżetu listenera:

    - jedno konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Parametr timeoutu działania workera:

    - jedno konto: `channels.discord.inboundWorker.runTimeoutMs`
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
    tylko wtedy, gdy chcesz oddzielny bezpiecznik dla kolejkowanych tur agenta.

  </Accordion>

  <Accordion title="Niezgodności w audycie uprawnień">
    Kontrole uprawnień `channels status --probe` działają tylko dla numerycznych ID kanałów.

    Jeśli używasz kluczy slug, dopasowanie w czasie działania nadal może działać, ale test nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - zasady DM wyłączone: `channels.discord.dmPolicy="disabled"` (starsze: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot-do-bota">
    Domyślnie wiadomości autorstwa botów są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, użyj ścisłych reguł wzmianki i listy dozwolonych, aby uniknąć zapętlenia.
    Preferuj `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota.

  </Accordion>

  <Accordion title="Głosowe STT gubi dane z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby logika odzyskiwania odbioru głosu Discord była obecna
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślne)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy utrzymują się po automatycznym ponownym dołączeniu, zbierz logi i porównaj je z [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Wskaźniki dokumentacji konfiguracji

Główna dokumentacja:

- [Dokumentacja konfiguracji - Discord](/pl/gateway/configuration-reference#discord)

Kluczowe pola Discord:

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- zasady: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker przychodzący: `inboundWorker.runTimeoutMs`
- odpowiedzi/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponawianie: `mediaMaxMb`, `retry`
  - `mediaMaxMb` ogranicza wychodzące przesyłanie do Discord (domyślnie: `100MB`)
- działania: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- interfejs: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (w środowiskach nadzorowanych preferowane `DISCORD_BOT_TOKEN`).
- Przyznawaj minimalne niezbędne uprawnienia Discord.
- Jeśli wdrożenie poleceń lub ich stan są nieaktualne, uruchom ponownie bramę i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
- [Polecenia ukośnikowe](/pl/tools/slash-commands)
