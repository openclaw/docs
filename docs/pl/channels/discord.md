---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi, możliwości i konfiguracja bota Discord
title: Discord
x-i18n:
    generated_at: "2026-04-22T04:20:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613ae39bc4b8c5661cbaab4f70a57af584f296581c3ce54ddaef0feab44e7e42
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Status: gotowe do DM-ów i kanałów serwerowych za pośrednictwem oficjalnej bramy Discord.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    DM-y Discord domyślnie działają w trybie parowania.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i proces naprawy.
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
    Nadal na stronie **Bot** przewiń do sekcji **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazwy do ID)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem na górę strony **Bot** i kliknij **Reset Token**.

    <Note>
    Wbrew nazwie spowoduje to wygenerowanie pierwszego tokena — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest Twój **Bot Token** i za chwilę będzie potrzebny.

  </Step>

  <Step title="Wygeneruj URL zaproszenia i dodaj bota do swojego serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do swojego serwera.

    Przewiń w dół do **OAuth2 URL Generator** i włącz:

    - `bot`
    - `applications.commands`

    Poniżej pojawi się sekcja **Bot Permissions**. Włącz:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcjonalne)

    Skopiuj wygenerowany URL na dole, wklej go do przeglądarki, wybierz swój serwer i kliknij **Continue**, aby połączyć. Bot powinien być teraz widoczny na serwerze Discord.

  </Step>

  <Step title="Włącz Tryb programisty i zbierz swoje identyfikatory">
    Wróć do aplikacji Discord. Musisz włączyć Tryb programisty, aby móc kopiować wewnętrzne identyfikatory.

    1. Kliknij **User Settings** (ikona koła zębatego obok avatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem swój **własny avatar** → **Copy User ID**

    Zapisz swój **Server ID** i **User ID** razem z Bot Tokenem — w następnym kroku przekażesz OpenClaw wszystkie trzy wartości.

  </Step>

  <Step title="Zezwól na DM-y od członków serwera">
    Aby parowanie działało, Discord musi zezwalać botowi na wysyłanie Ci DM-ów. Kliknij prawym przyciskiem **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    To umożliwia członkom serwera (w tym botom) wysyłanie Ci DM-ów. Pozostaw tę opcję włączoną, jeśli chcesz używać DM-ów Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwerowych, możesz wyłączyć DM-y po sparowaniu.

  </Step>

  <Step title="Ustaw bezpiecznie token bota (nie wysyłaj go na czacie)">
    Token bota Discord jest tajny (jak hasło). Ustaw go na maszynie, na której działa OpenClaw, zanim napiszesz do swojego agenta.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Jeśli OpenClaw działa już jako usługa w tle, uruchom go ponownie za pomocą aplikacji OpenClaw na Macu albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i przekaż mu te informacje. Jeśli Discord to Twój pierwszy kanał, zamiast tego użyj karty CLI / config.

        > „Ustawiłem już token mojego bota Discord w konfiguracji. Dokończ proszę konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`.”
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

        Zapasowa zmienna env dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        Obsługiwane są jawne wartości `token`. Obsługiwane są też wartości SecretRef dla `channels.discord.token` u dostawców env/file/exec. Zobacz [Secrets Management](/pl/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zatwierdź pierwsze parowanie DM">
    Poczekaj, aż Gateway zacznie działać, a następnie wyślij DM do bota w Discord. Odpowie kodem parowania.

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

    Powinieneś teraz móc rozmawiać ze swoim agentem w Discord przez DM.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokena uwzględnia konto. Wartości tokena z konfiguracji mają pierwszeństwo przed zapasową zmienną env. `DISCORD_BOT_TOKEN` jest używane tylko dla konta domyślnego.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/działania kanału) jawny `token` dla pojedynczego wywołania jest używany tylko dla tego wywołania. Dotyczy to działań typu send oraz read/probe (na przykład read/search/fetch/thread/pins/permissions). Ustawienia polityki konta/ponowień nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
</Note>

## Zalecane: skonfiguruj przestrzeń roboczą serwera

Gdy DM-y już działają, możesz skonfigurować swój serwer Discord jako pełną przestrzeń roboczą, w której każdy kanał ma własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteście tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
    To umożliwia agentowi odpowiadanie na dowolnym kanale na Twoim serwerze, a nie tylko w DM-ach.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Dodaj mój Discord Server ID `<server_id>` do listy dozwolonych serwerów”
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
    Domyślnie agent odpowiada na kanałach serwerowych tylko wtedy, gdy zostanie oznaczony przez @mention. Na prywatnym serwerze prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Zezwól mojemu agentowi odpowiadać na tym serwerze bez konieczności oznaczania go przez @mention”
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

  <Step title="Zaplanuj sposób użycia pamięci na kanałach serwerowych">
    Domyślnie pamięć długoterminowa (`MEMORY.md`) jest wczytywana tylko w sesjach DM. Kanały serwerowe nie wczytują automatycznie `MEMORY.md`.

    <Tabs>
      <Tab title="Zapytaj agenta">
        > „Kiedy zadaję pytania na kanałach Discord, użyj `memory_search` lub `memory_get`, jeśli potrzebujesz długoterminowego kontekstu z `MEMORY.md`.”
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu na każdym kanale, umieść stałe instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Długoterminowe notatki trzymaj w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał ma własną odizolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` albo inne kanały pasujące do Twojego sposobu pracy.

## Model działania środowiska uruchomieniowego

- Połączeniem z Discord zarządza Gateway.
- Trasowanie odpowiedzi jest deterministyczne: wiadomości przychodzące z Discord wracają do Discord.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały serwerowe mają odizolowane klucze sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM-y są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia slash działają w odizolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), jednocześnie przenosząc `CommandTargetSessionKey` do trasowanej sesji konwersacji.

## Kanały forum

Kanały forum i kanały multimedialne Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku wykorzystuje pierwszą niepustą linię wiadomości.
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

Nadrzędne fora nie akceptują komponentów Discord. Jeśli potrzebujesz komponentów, wysyłaj do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są kierowane z powrotem do agenta jako zwykłe wiadomości przychodzące i stosują istniejące ustawienia Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowe. Ustaw `components.reusable=true`, aby umożliwić wielokrotne używanie przycisków, selektorów i formularzy aż do ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` dla tego przycisku (ID użytkowników Discord, tagi lub `*`). Gdy opcja jest skonfigurowana, niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Polecenia slash `/model` i `/models` otwierają interaktywny wybór modelu z listami rozwijanymi dostawcy i modelu oraz krokiem Submit. Odpowiedź wyboru jest efemeryczna i może jej używać tylko użytkownik, który wywołał polecenie.

Załączniki plików:

- bloki `file` muszą wskazywać odwołanie do załącznika (`attachment://<filename>`)
- podaj załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
- użyj `filename`, aby nadpisać nazwę przesyłanego pliku, gdy ma odpowiadać odwołaniu do załącznika

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
  message: "Opcjonalny tekst zapasowy",
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
        { type: "text", label: "Zgłaszający" },
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
  <Tab title="Polityka DM">
    `channels.discord.dmPolicy` steruje dostępem do DM-ów (starsza nazwa: `channels.discord.dm.policy`):

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`; starsza nazwa: `channels.discord.dm.allowFrom`)
    - `disabled`

    Jeśli polityka DM nie jest otwarta, nieznani użytkownicy są blokowani (albo proszeni o parowanie w trybie `pairing`).

    Priorytet dla wielu kont:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Format celu DM dla dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same numeryczne ID są niejednoznaczne i są odrzucane, chyba że podano jawny typ celu użytkownik/kanał.

  </Tab>

  <Tab title="Polityka serwerów">
    Obsługą serwerów steruje `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczna baza, gdy istnieje `channels.discord`, to `allowlist`.

    Zachowanie `allowlist`:

    - serwer musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany też slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne ID) i `roles` (wyłącznie ID ról); jeśli skonfigurowano którekolwiek z nich, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako tryb zgodności awaryjnej
    - nazwy/tagi są obsługiwane w `users`, ale ID są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazwa/tag
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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, zapasowe ustawienie środowiska uruchomieniowego to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Wzmianki i grupowe DM-y">
    Wiadomości na serwerach są domyślnie ograniczone wzmiankami.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, zapasowo `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    `requireMention` jest konfigurowane osobno dla serwera/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które zawierają wzmiankę o innym użytkowniku/roli, ale nie o bocie (z wyłączeniem @everyone/@here).

    Grupowe DM-y:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (ID kanałów lub slugi)

  </Tab>
</Tabs>

### Trasowanie agentów według ról

Użyj `bindings[].match.roles`, aby kierować członków serwera Discord do różnych agentów na podstawie ID roli. Powiązania oparte na rolach akceptują wyłącznie ID ról i są oceniane po powiązaniach peer lub parent-peer, a przed powiązaniami opartymi tylko na serwerze. Jeśli powiązanie ustawia także inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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

    Presence Intent jest opcjonalne i wymagane tylko wtedy, gdy chcesz otrzymywać aktualizacje obecności. Ustawianie obecności bota (`setPresence`) nie wymaga włączania aktualizacji obecności dla członków.

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
    Włącz Tryb programisty Discord, a następnie skopiuj:

    - ID serwera
    - ID kanału
    - ID użytkownika

    W konfiguracji OpenClaw preferuj numeryczne ID dla wiarygodnych audytów i sprawdzeń.

  </Accordion>
</AccordionGroup>

## Natywne polecenia i uwierzytelnianie poleceń

- `commands.native` domyślnie ma wartość `"auto"` i jest włączone dla Discord.
- Nadpisanie dla kanału: `channels.discord.commands.native`.
- `commands.native=false` jawnie czyści wcześniej zarejestrowane natywne polecenia Discord.
- Uwierzytelnianie natywnych poleceń używa tych samych list dozwolonych/polityk Discord co zwykła obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discord dla użytkowników, którzy nie mają uprawnień; wykonanie nadal egzekwuje uwierzytelnianie OpenClaw i zwraca „brak autoryzacji”.

Zobacz [Polecenia slash](/pl/tools/slash-commands), aby poznać katalog poleceń i ich zachowanie.

Domyślne ustawienia poleceń slash:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Tagi odpowiedzi i natywne odpowiedzi">
    Discord obsługuje tagi odpowiedzi w wyjściu agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Sterowane przez `channels.discord.replyToMode`:

    - `off` (domyślnie)
    - `first`
    - `all`
    - `batched`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal respektowane.
    `first` zawsze dołącza niejawną natywną referencję odpowiedzi do pierwszej wychodzącej wiadomości Discord dla tej tury.
    `batched` dołącza niejawną natywną referencję odpowiedzi Discord tylko wtedy, gdy
    tura wejściowa była odroczoną partią wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie w niejednoznacznych, gwałtownych rozmowach, a nie przy każdej
    turze z pojedynczą wiadomością.

    ID wiadomości są ujawniane w kontekście/historii, aby agenci mogli kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Podgląd strumienia na żywo">
    OpenClaw może strumieniować wersje robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływu tekstu.

    - `channels.discord.streaming` steruje strumieniowaniem podglądu (`off` | `partial` | `block` | `progress`, domyślnie: `off`).
    - Domyślnie pozostaje `off`, ponieważ edycje podglądu w Discord mogą szybko trafić na limity szybkości, zwłaszcza gdy wiele botów lub bram współdzieli to samo konto albo ruch serwera.
    - `progress` jest akceptowane dla spójności międzykanałowej i w Discord mapuje się na `partial`.
    - `channels.discord.streamMode` to starszy alias i jest migrowany automatycznie.
    - `partial` edytuje pojedynczą wiadomość podglądu w miarę napływu tokenów.
    - `block` emituje fragmenty o rozmiarze wersji roboczej (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału).
    - Końcowe wiadomości z mediami, błędami i jawnymi odpowiedziami anulują oczekujące edycje podglądu bez opróżniania tymczasowej wersji roboczej przed zwykłym dostarczeniem.
    - `streaming.preview.toolProgress` steruje tym, czy aktualizacje narzędzi/postępu używają ponownie tej samej wiadomości podglądu wersji roboczej (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.

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

    Domyślne ustawienia fragmentacji trybu `block` (ograniczane do `channels.discord.textChunkLimit`):

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

    Strumieniowanie podglądu działa tylko dla tekstu; odpowiedzi z mediami wracają do zwykłego dostarczania.

    Uwaga: strumieniowanie podglądu jest oddzielne od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie
    włączone dla Discord, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="Historia, kontekst i zachowanie wątków">
    Kontekst historii serwera:

    - `channels.discord.historyLimit` domyślnie `20`
    - wartość zapasowa: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Sterowanie historią DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - wątki Discord są trasowane jako sesje kanałów
    - metadane nadrzędnego wątku mogą być używane do powiązania z sesją nadrzędną
    - konfiguracja wątku dziedziczy konfigurację kanału nadrzędnego, chyba że istnieje wpis specyficzny dla wątku

    Tematy kanałów są wstrzykiwane jako kontekst **niezaufany** (nie jako system prompt).
    Kontekst odpowiedzi i cytowanych wiadomości obecnie pozostaje bez zmian.
    Listy dozwolonych Discord przede wszystkim ograniczają, kto może wywołać agenta, a nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla subagentów">
    Discord może powiązać wątek z celem sesji, aby kolejne wiadomości w tym wątku nadal były kierowane do tej samej sesji (w tym sesji subagentów).

    Polecenia:

    - `/focus <target>` wiąże bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuwa bieżące powiązanie wątku
    - `/agents` pokazuje aktywne uruchomienia i stan powiązania
    - `/session idle <duration|off>` sprawdza/aktualizuje automatyczne odwiązywanie po bezczynności dla skupionych powiązań
    - `/session max-age <duration|off>` sprawdza/aktualizuje twardy maksymalny wiek dla skupionych powiązań

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
        spawnSubagentSessions: false, // opcjonalne, po włączeniu
      },
    },
  },
}
```

    Uwagi:

    - `session.threadBindings.*` ustawia globalne wartości domyślne.
    - `channels.discord.threadBindings.*` nadpisuje zachowanie Discord.
    - `spawnSubagentSessions` musi mieć wartość true, aby automatycznie tworzyć/wiązać wątki dla `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` musi mieć wartość true, aby automatycznie tworzyć/wiązać wątki dla ACP (`/acp spawn ... --thread ...` lub `sessions_spawn({ runtime: "acp", thread: true })`).
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązań wątków są niedostępne.

    Zobacz [Sub-agenci](/pl/tools/subagents), [Agenci ACP](/pl/tools/acp-agents) i [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe powiązania kanałów ACP">
    Dla stabilnych, „zawsze aktywnych” przestrzeni roboczych ACP skonfiguruj najwyższego poziomu typowane powiązania ACP kierowane do konwersacji Discord.

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

    - `/acp spawn codex --bind here` wiąże bieżący kanał lub wątek Discord na miejscu i utrzymuje trasowanie przyszłych wiadomości do tej samej sesji ACP.
    - Nadal może to oznaczać „uruchom świeżą sesję ACP Codex”, ale samo w sobie nie tworzy nowego wątku Discord. Istniejący kanał pozostaje powierzchnią czatu.
    - Codex może nadal działać we własnym `cwd` lub przestrzeni roboczej backendu na dysku. Ta przestrzeń robocza jest stanem środowiska uruchomieniowego, a nie wątkiem Discord.
    - Wiadomości wątku mogą dziedziczyć powiązanie ACP kanału nadrzędnego.
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP na miejscu.
    - Tymczasowe powiązania wątków nadal działają i mogą nadpisywać rozwiązywanie celu, gdy są aktywne.
    - `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć/powiązać podrzędny wątek przez `--thread auto|here`. Nie jest wymagane dla `/acp spawn ... --bind here` w bieżącym kanale.

    Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać szczegóły zachowania powiązań.

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Tryb powiadomień o reakcjach dla każdego serwera:

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (używa `guilds.<id>.users`)

    Zdarzenia reakcji są zamieniane na zdarzenia systemowe i dołączane do trasowanej sesji Discord.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozwiązywania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - zapasowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie „👀”)

    Uwagi:

    - Discord akceptuje emoji unicode lub nazwy niestandardowych emoji.
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
    Kieruj ruch WebSocket bramy Discord i początkowe zapytania REST przy uruchomieniu (ID aplikacji + rozwiązywanie listy dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

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

    - listy dozwolonych mogą używać `pk:<memberId>`
    - nazwy wyświetlane członków są dopasowywane według nazwy/slugu tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania używają oryginalnego ID wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, wiadomości wysyłane przez proxy są traktowane jako wiadomości bota i odrzucane, chyba że `allowBots=true`

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

    Przykład aktywności (custom status to domyślny typ aktywności):

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

    Przykład transmisji:

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

    Przykład automatycznej obecności (sygnał stanu środowiska uruchomieniowego):

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

    Automatyczna obecność mapuje dostępność środowiska uruchomieniowego na status Discord: healthy => online, degraded lub unknown => idle, exhausted lub unavailable => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discord">
    Discord obsługuje zatwierdzenia za pomocą przycisków w DM-ach i może opcjonalnie publikować prośby o zatwierdzenie w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; jeśli to możliwe, używa wartości zapasowej z `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego — albo z `execApprovals.approvers`, albo z `commands.ownerAllowFrom`. Discord nie wyprowadza zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzeń.

    Gdy `target` ma wartość `channel` albo `both`, prośba o zatwierdzenie jest widoczna w kanale. Tylko rozwiązani zatwierdzający mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Prośby o zatwierdzenie zawierają tekst polecenia, więc dostarczanie do kanału włączaj tylko w zaufanych kanałach. Jeśli nie da się wyprowadzić ID kanału z klucza sesji, OpenClaw wraca do dostarczania przez DM.

    Discord renderuje także współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Discord głównie dodaje trasowanie DM zatwierdzających i rozsyłanie do kanałów.
    Gdy te przyciski są obecne, stanowią podstawowy UX zatwierdzeń; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia czatowe są niedostępne albo ręczne zatwierdzenie jest jedyną drogą.

    Uwierzytelnianie Gateway dla tego modułu obsługi używa tego samego współdzielonego kontraktu rozwiązywania poświadczeń co inni klienci Gateway:

    - lokalne uwierzytelnianie env-first (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, następnie `gateway.auth.*`)
    - w trybie lokalnym `gateway.remote.*` może być używane jako wartość zapasowa tylko wtedy, gdy `gateway.auth.*` nie jest ustawione; skonfigurowane, ale nierozwiązane lokalne SecretRef są domyślnie zamykane
    - obsługa trybu zdalnego przez `gateway.remote.*`, gdy ma zastosowanie
    - nadpisania URL są bezpieczne dla nadpisań: nadpisania CLI nie używają ponownie niejawnych poświadczeń, a nadpisania env używają tylko poświadczeń env

    Zachowanie rozwiązywania zatwierdzeń:

    - ID z prefiksem `plugin:` są rozwiązywane przez `plugin.approval.resolve`.
    - Inne ID są rozwiązywane przez `exec.approval.resolve`.
    - Discord nie wykonuje tutaj dodatkowego zapasowego przejścia exec-to-plugin; prefiks
      ID decyduje, którą metodę Gateway wywoła.

    Zatwierdzenia exec domyślnie wygasają po 30 minutach. Jeśli zatwierdzenia kończą się błędem z
    nieznanymi ID zatwierdzeń, sprawdź rozwiązywanie zatwierdzających, włączenie funkcji oraz to,
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

Działanie `event-create` akceptuje opcjonalny parametr `image` (URL lub lokalna ścieżka pliku) do ustawienia obrazu okładki zaplanowanego wydarzenia.

Bramki działań znajdują się pod `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa działań                                                                                                                                                            | Domyślnie |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone  |
| roles                                                                                                                                                                    | wyłączone |
| moderation                                                                                                                                                               | wyłączone |
| presence                                                                                                                                                                 | wyłączone |

## Interfejs Components v2

OpenClaw używa Discord components v2 dla zatwierdzeń exec i znaczników międzykontekstowych. Działania wiadomości Discord mogą także akceptować `components` dla niestandardowego interfejsu (zaawansowane; wymaga skonstruowania ładunku komponentu przez narzędzie discord), podczas gdy starsze `embeds` są nadal dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
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

OpenClaw może dołączać do kanałów głosowych Discord do rozmów ciągłych w czasie rzeczywistym. To oddzielna funkcja względem załączników wiadomości głosowych.

Wymagania:

- Włącz natywne polecenia (`commands.native` lub `channels.discord.commands.native`).
- Skonfiguruj `channels.discord.voice`.
- Bot potrzebuje uprawnień Connect + Speak w docelowym kanale głosowym.

Użyj polecenia natywnego tylko dla Discord `/vc join|leave|status`, aby sterować sesjami. Polecenie używa domyślnego agenta konta i stosuje te same reguły list dozwolonych oraz polityki serwerów co inne polecenia Discord.

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
- Tury transkrypcji głosowej wyprowadzają status właściciela z Discord `allowFrom` (lub `dm.allowFrom`); rozmówcy niebędący właścicielami nie mogą uzyskiwać dostępu do narzędzi tylko dla właściciela (na przykład `gateway` i `cron`).
- Głos jest domyślnie włączony; ustaw `channels.discord.voice.enabled=false`, aby go wyłączyć.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Wartości domyślne `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- OpenClaw monitoruje także błędy odszyfrowania przy odbiorze i automatycznie odzyskuje działanie przez opuszczenie i ponowne dołączenie do kanału głosowego po powtarzających się błędach w krótkim oknie czasowym.
- Jeśli logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, może to być błąd odbioru upstream `@discordjs/voice` śledzony w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd przebiegu fali i wymagają dźwięku OGG/Opus oraz metadanych. OpenClaw generuje przebieg fali automatycznie, ale na hoście Gateway muszą być dostępne `ffmpeg` i `ffprobe`, aby można było analizować i konwertować pliki audio.

Wymagania i ograniczenia:

- Podaj **lokalną ścieżkę pliku** (URL-e są odrzucane).
- Pomiń treść tekstową (Discord nie pozwala na tekst i wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw konwertuje go do OGG/Opus, gdy jest to potrzebne.

Przykład:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji albo bot nie widzi wiadomości z serwera">

    - włącz Message Content Intent
    - włącz Server Members Intent, jeśli polegasz na rozwiązywaniu użytkownika/członka
    - uruchom ponownie Gateway po zmianie intencji

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

  <Accordion title="Require mention ma wartość false, ale nadal jest blokowane">
    Częste przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych serwerów/kanałów
    - `requireMention` skonfigurowano w niewłaściwym miejscu (musi znajdować się pod `channels.discord.guilds` albo we wpisie kanału)
    - nadawca jest blokowany przez listę dozwolonych `users` serwera/kanału

  </Accordion>

  <Accordion title="Długo działające handlery przekraczają limit czasu albo powodują zduplikowane odpowiedzi">

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

  <Accordion title="Niezgodności w audycie uprawnień">
    Sprawdzenia uprawnień `channels status --probe` działają tylko dla numerycznych ID kanałów.

    Jeśli używasz kluczy slug, dopasowanie w środowisku uruchomieniowym nadal może działać, ale probe nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - polityka DM wyłączona: `channels.discord.dmPolicy="disabled"` (starsza nazwa: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot-do-bota">
    Domyślnie wiadomości napisane przez boty są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, używaj ścisłych reguł wzmianek i list dozwolonych, aby uniknąć pętli.
    Preferuj `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które zawierają wzmiankę o bocie.

  </Accordion>

  <Accordion title="Voice STT gubi dane z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby była dostępna logika odzyskiwania odbioru głosowego Discord
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy utrzymują się po automatycznym ponownym dołączeniu, zbierz logi i porównaj je z [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Wskaźniki do dokumentacji konfiguracji

Główna dokumentacja:

- [Dokumentacja konfiguracji - Discord](/pl/gateway/configuration-reference#discord)

Kluczowe pola Discord:

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- polityka: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker wejściowy: `inboundWorker.runTimeoutMs`
- odpowiedzi/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponawianie: `mediaMaxMb`, `retry`
  - `mediaMaxMb` ogranicza wychodzące przesyłanie do Discord (domyślnie: `100MB`)
- działania: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- interfejs: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (w nadzorowanych środowiskach preferowane jest `DISCORD_BOT_TOKEN`).
- Nadawaj minimalne niezbędne uprawnienia Discord.
- Jeśli wdrożenie/stos poleceń jest nieaktualny, uruchom ponownie Gateway i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Trasowanie kanałów](/pl/channels/channel-routing)
- [Bezpieczeństwo](/pl/gateway/security)
- [Trasowanie wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
- [Polecenia slash](/pl/tools/slash-commands)
