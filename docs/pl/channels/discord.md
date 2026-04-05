---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Stan obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-04-05T13:47:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e757d321d80d05642cd9e24b51fb47897bacaf8db19df83bd61a49a8ce51ed3a
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Status: gotowy do DM-ów i kanałów serwera za pośrednictwem oficjalnej bramy Discord.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    DM-y Discord domyślnie działają w trybie parowania.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/channels/troubleshooting">
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

  <Step title="Włącz uprzywilejowane intents">
    Nadal na stronie **Bot** przewiń do **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazw do ID)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem na górę strony **Bot** i kliknij **Reset Token**.

    <Note>
    Wbrew nazwie generuje to pierwszy token — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest Twój **Bot Token** i za chwilę będzie potrzebny.

  </Step>

  <Step title="Wygeneruj URL zaproszenia i dodaj bota do swojego serwera">
    Kliknij **OAuth2** na pasku bocznym. Wygenerujesz URL zaproszenia z odpowiednimi uprawnieniami, aby dodać bota do swojego serwera.

    Przewiń do **OAuth2 URL Generator** i włącz:

    - `bot`
    - `applications.commands`

    Poniżej pojawi się sekcja **Bot Permissions**. Włącz:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcjonalnie)

    Skopiuj wygenerowany URL na dole, wklej go do przeglądarki, wybierz swój serwer i kliknij **Continue**, aby połączyć. Powinieneś teraz zobaczyć swojego bota na serwerze Discord.

  </Step>

  <Step title="Włącz tryb deweloperski i zbierz swoje ID">
    Po powrocie do aplikacji Discord musisz włączyć tryb deweloperski, aby móc kopiować wewnętrzne ID.

    1. Kliknij **User Settings** (ikona koła zębatego obok avatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem myszy **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem myszy swój **własny avatar** → **Copy User ID**

    Zapisz swoje **Server ID** i **User ID** razem z Bot Token — w następnym kroku prześlesz wszystkie trzy do OpenClaw.

  </Step>

  <Step title="Zezwól na DM-y od członków serwera">
    Aby parowanie działało, Discord musi zezwalać botowi na wysyłanie Ci DM-ów. Kliknij prawym przyciskiem myszy **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Umożliwia to członkom serwera (w tym botom) wysyłanie Ci DM-ów. Pozostaw tę opcję włączoną, jeśli chcesz używać DM-ów Discord z OpenClaw. Jeśli planujesz używać tylko kanałów serwera, możesz wyłączyć DM-y po sparowaniu.

  </Step>

  <Step title="Ustaw bezpiecznie token bota (nie wysyłaj go na czacie)">
    Token bota Discord jest sekretem (jak hasło). Ustaw go na maszynie uruchamiającej OpenClaw przed wysłaniem wiadomości do agenta.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Jeśli OpenClaw działa już jako usługa w tle, uruchom go ponownie przez aplikację OpenClaw na Macu albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        Rozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i przekaż mu to. Jeśli Discord to Twój pierwszy kanał, zamiast tego użyj zakładki CLI / config.

        > „Ustawiłem już token mojego bota Discord w konfiguracji. Dokończ proszę konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`.”
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

        Fallback env dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        Jawne wartości `token` w postaci zwykłego tekstu są obsługiwane. Wartości SecretRef są także obsługiwane dla `channels.discord.token` w providerach env/file/exec. Zobacz [Zarządzanie sekretami](/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zatwierdź pierwsze parowanie DM">
    Poczekaj, aż brama będzie działać, a następnie wyślij DM do swojego bota w Discord. Odpowie kodem parowania.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
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

    Powinieneś teraz móc rozmawiać ze swoim agentem przez DM w Discord.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokena jest świadome konta. Wartości tokena z konfiguracji mają pierwszeństwo przed fallbackiem env. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/działania kanału) jawny `token` dla wywołania jest używany dla tego wywołania. Dotyczy to działań typu send oraz read/probe (na przykład read/search/fetch/thread/pins/permissions). Zasady konta i ustawienia ponawiania nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
</Note>

## Zalecane: skonfiguruj przestrzeń roboczą serwera

Gdy DM-y już działają, możesz skonfigurować swój serwer Discord jako pełną przestrzeń roboczą, w której każdy kanał ma własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteś tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych serwerów">
    Dzięki temu agent będzie mógł odpowiadać na dowolnym kanale na Twoim serwerze, a nie tylko w DM-ach.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > „Dodaj moje Discord Server ID `<server_id>` do listy dozwolonych serwerów”
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
    Domyślnie agent odpowiada na kanałach serwera tylko wtedy, gdy zostanie oznaczony przez @mention. Na prywatnym serwerze prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > „Pozwól mojemu agentowi odpowiadać na tym serwerze bez konieczności oznaczania go przez @mention”
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

  <Step title="Zaplanuj pamięć na kanałach serwera">
    Domyślnie pamięć długoterminowa (`MEMORY.md`) jest ładowana tylko w sesjach DM. Kanały serwera nie ładują automatycznie `MEMORY.md`.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > „Gdy zadaję pytania na kanałach Discord, używaj `memory_search` lub `memory_get`, jeśli potrzebujesz długoterminowego kontekstu z `MEMORY.md`.”
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu na każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Długoterminowe notatki przechowuj w `MEMORY.md` i uzyskuj do nich dostęp na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał otrzymuje własną izolowaną sesję — dzięki temu możesz skonfigurować `#coding`, `#home`, `#research` lub inne kanały pasujące do Twojego przepływu pracy.

## Model działania środowiska uruchomieniowego

- Brama zarządza połączeniem z Discord.
- Trasowanie odpowiedzi jest deterministyczne: przychodzące odpowiedzi z Discord wracają do Discord.
- Domyślnie (`session.dmScope=main`) rozmowy bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały serwera mają izolowane klucze sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe DM-y są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia ukośnikowe działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), jednocześnie przenosząc `CommandTargetSessionKey` do trasowanej sesji rozmowy.

## Kanały forum

Kanały forum i media w Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku używa pierwszej niepustej linii wiadomości.
- Użyj `openclaw message thread create`, aby utworzyć wątek bezpośrednio. Nie przekazuj `--message-id` dla kanałów forum.

Przykład: wyślij do forum nadrzędnego, aby utworzyć wątek

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Przykład: utwórz jawnie wątek forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Fora nadrzędne nie akceptują komponentów Discord. Jeśli potrzebujesz komponentów, wyślij do samego wątku (`channel:<threadId>`).

## Komponenty interaktywne

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są kierowane z powrotem do agenta jako zwykłe wiadomości przychodzące i podążają za istniejącymi ustawieniami Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków lub jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowe. Ustaw `components.reusable=true`, aby umożliwić wielokrotne użycie przycisków, selektorów i formularzy do czasu ich wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` dla tego przycisku (ID użytkowników Discord, tagi lub `*`). Po skonfigurowaniu niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Polecenia ukośnikowe `/model` i `/models` otwierają interaktywny selektor modeli z listami rozwijanymi providera i modelu oraz krokiem Submit. Odpowiedź selektora jest efemeryczna i tylko użytkownik, który go wywołał, może z niego korzystać.

Załączniki plików:

- bloki `file` muszą wskazywać referencję załącznika (`attachment://<filename>`)
- przekaż załącznik przez `media`/`path`/`filePath` (pojedynczy plik); użyj `media-gallery` dla wielu plików
- użyj `filename`, aby nadpisać nazwę przesyłanego pliku, gdy powinna odpowiadać referencji załącznika

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
    `channels.discord.dmPolicy` kontroluje dostęp do DM-ów (starsze: `channels.discord.dm.policy`):

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`; starsze: `channels.discord.dm.allowFrom`)
    - `disabled`

    Jeśli zasady DM nie są otwarte, nieznani użytkownicy są blokowani (lub proszeni o parowanie w trybie `pairing`).

    Pierwszeństwo dla wielu kont:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Format celu DM do dostarczania:

    - `user:<id>`
    - wzmianka `<@id>`

    Same numeryczne ID są niejednoznaczne i są odrzucane, chyba że podano jawny rodzaj celu użytkownik/kanał.

  </Tab>

  <Tab title="Zasady serwera">
    Obsługa serwera jest kontrolowana przez `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczna baza, gdy istnieje `channels.discord`, to `allowlist`.

    Zachowanie `allowlist`:

    - serwer musi pasować do `channels.discord.guilds` (`id` preferowane, slug akceptowany)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne ID) i `roles` (tylko ID ról); jeśli skonfigurowano którekolwiek z nich, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazw/tagów jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako tryb awaryjnej zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale ID są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy nazwa/tag
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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, fallback środowiska uruchomieniowego będzie miał wartość `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Wzmianki i grupowe DM-y">
    Wiadomości serwera są domyślnie ograniczone przez wzmianki.

    Wykrywanie wzmianki obejmuje:

    - jawną wzmiankę bota
    - skonfigurowane wzorce wzmianki (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi na bota w obsługiwanych przypadkach

    `requireMention` jest konfigurowane per serwer/kanał (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM-y:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (ID kanałów lub slugi)

  </Tab>
</Tabs>

### Trasowanie agentów oparte na rolach

Użyj `bindings[].match.roles`, aby kierować członków serwera Discord do różnych agentów na podstawie ID ról. Powiązania oparte na rolach akceptują tylko ID ról i są oceniane po powiązaniach peer lub parent-peer, a przed powiązaniami tylko dla serwera. Jeśli powiązanie ustawia też inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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

  <Accordion title="Uprzywilejowane intents">
    W **Bot -> Privileged Gateway Intents** włącz:

    - Message Content Intent
    - Server Members Intent (zalecane)

    Presence intent jest opcjonalny i wymagany tylko wtedy, gdy chcesz otrzymywać aktualizacje obecności. Ustawianie obecności bota (`setPresence`) nie wymaga włączania aktualizacji obecności dla członków.

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
    - Add Reactions (opcjonalnie)

    Unikaj `Administrator`, chyba że jest jawnie potrzebne.

  </Accordion>

  <Accordion title="Skopiuj ID">
    Włącz tryb deweloperski Discord, a następnie skopiuj:

    - ID serwera
    - ID kanału
    - ID użytkownika

    Dla wiarygodnych audytów i testów zalecane są numeryczne ID w konfiguracji OpenClaw.

  </Accordion>
</AccordionGroup>

## Natywne polecenia i autoryzacja poleceń

- `commands.native` domyślnie ma wartość `"auto"` i jest włączone dla Discord.
- Nadpisanie per kanał: `channels.discord.commands.native`.
- `commands.native=false` jawnie czyści wcześniej zarejestrowane natywne polecenia Discord.
- Autoryzacja natywnych poleceń używa tych samych list dozwolonych i zasad Discord co zwykła obsługa wiadomości.
- Polecenia mogą być nadal widoczne w interfejsie Discord dla użytkowników bez uprawnień; wykonanie nadal wymusza autoryzację OpenClaw i zwraca „not authorized”.

Zobacz [Polecenia ukośnikowe](/tools/slash-commands), aby poznać katalog poleceń i ich zachowanie.

Domyślne ustawienia poleceń ukośnikowych:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Tagi odpowiedzi i natywne odpowiedzi">
    Discord obsługuje tagi odpowiedzi w wyjściu agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Kontrolowane przez `channels.discord.replyToMode`:

    - `off` (domyślnie)
    - `first`
    - `all`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal respektowane.

    ID wiadomości są udostępniane w kontekście/historii, dzięki czemu agenci mogą kierować odpowiedzi do konkretnych wiadomości.

  </Accordion>

  <Accordion title="Podgląd transmisji na żywo">
    OpenClaw może strumieniować szkice odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływu tekstu.

    - `channels.discord.streaming` kontroluje strumieniowanie podglądu (`off` | `partial` | `block` | `progress`, domyślnie: `off`).
    - Domyślna wartość pozostaje `off`, ponieważ edycje podglądu w Discord mogą szybko trafić na limity szybkości, szczególnie gdy wiele botów lub bram współdzieli to samo konto albo ruch serwera.
    - `progress` jest akceptowane dla spójności międzykanałowej i w Discord jest mapowane na `partial`.
    - `channels.discord.streamMode` to starszy alias i jest automatycznie migrowany.
    - `partial` edytuje jedną wiadomość podglądu w miarę napływu tokenów.
    - `block` wysyła fragmenty o rozmiarze szkicu (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału).

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

    Domyślne wartości fragmentowania dla trybu `block` (ograniczone do `channels.discord.textChunkLimit`):

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

    Strumieniowanie podglądu dotyczy tylko tekstu; odpowiedzi z mediami wracają do normalnego dostarczania.

    Uwaga: strumieniowanie podglądu jest oddzielne od strumieniowania blokowego. Gdy
    strumieniowanie blokowe jest jawnie włączone dla Discord, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

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

    - Wątki Discord są trasowane jako sesje kanałów
    - metadane wątku nadrzędnego mogą być używane do powiązania z sesją nadrzędną
    - konfiguracja wątku dziedziczy konfigurację kanału nadrzędnego, chyba że istnieje wpis specyficzny dla wątku

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst (nie jako system prompt).
    Kontekst odpowiedzi i cytowanych wiadomości obecnie pozostaje taki, jak został odebrany.
    Listy dozwolonych Discord przede wszystkim kontrolują, kto może wyzwolić agenta, a nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.

  </Accordion>

  <Accordion title="Sesje powiązane z wątkiem dla subagentów">
    Discord może powiązać wątek z celem sesji, dzięki czemu kolejne wiadomości w tym wątku będą nadal kierowane do tej samej sesji (w tym sesji subagentów).

    Polecenia:

    - `/focus <target>` powiąż bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuń bieżące powiązanie wątku
    - `/agents` pokaż aktywne przebiegi i stan powiązań
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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Uwagi:

    - `session.threadBindings.*` ustawia globalne wartości domyślne.
    - `channels.discord.threadBindings.*` nadpisuje zachowanie Discord.
    - `spawnSubagentSessions` musi mieć wartość true, aby automatycznie tworzyć/powiązywać wątki dla `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` musi mieć wartość true, aby automatycznie tworzyć/powiązywać wątki dla ACP (`/acp spawn ... --thread ...` lub `sessions_spawn({ runtime: "acp", thread: true })`).
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje powiązań wątków są niedostępne.

    Zobacz [Sub-agents](/tools/subagents), [ACP Agents](/tools/acp-agents) i [Configuration Reference](/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Trwałe powiązania kanałów ACP">
    W przypadku stabilnych, „zawsze aktywnych” przestrzeni roboczych ACP skonfiguruj najwyższego poziomu typowane powiązania ACP kierowane do rozmów Discord.

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
    - To nadal może oznaczać „uruchom nową sesję Codex ACP”, ale samo w sobie nie tworzy nowego wątku Discord. Istniejący kanał pozostaje powierzchnią czatu.
    - Codex może nadal działać we własnym `cwd` lub obszarze roboczym backendu na dysku. Ten obszar roboczy jest stanem środowiska uruchomieniowego, a nie wątkiem Discord.
    - Wiadomości w wątkach mogą dziedziczyć nadrzędne powiązanie ACP kanału.
    - W powiązanym kanale lub wątku `/new` i `/reset` resetują tę samą sesję ACP na miejscu.
    - Tymczasowe powiązania wątków nadal działają i mogą nadpisywać rozwiązywanie celu, gdy są aktywne.
    - `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć/powiązać podrzędny wątek przez `--thread auto|here`. Nie jest wymagane dla `/acp spawn ... --bind here` w bieżącym kanale.

    Zobacz [ACP Agents](/tools/acp-agents), aby poznać szczegóły zachowania powiązań.

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Tryb powiadomień o reakcjach per serwer:

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
    - fallback do emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Discord akceptuje emoji unicode lub nazwy niestandardowych emoji.
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

  <Accordion title="Proxy bramy">
    Kieruj ruch WebSocket bramy Discord i początkowe zapytania REST (ID aplikacji + rozwiązywanie listy dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

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
    Włącz rozwiązywanie PluralKit, aby mapować wiadomości proxowane do tożsamości członka systemu:

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
    - wyświetlane nazwy członków są dopasowywane po nazwie/slug tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania używają oryginalnego ID wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, proxowane wiadomości są traktowane jako wiadomości bota i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Konfiguracja obecności">
    Aktualizacje obecności są stosowane, gdy ustawisz pole statusu lub aktywności albo gdy włączysz auto presence.

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

    Przykład auto presence (sygnał kondycji środowiska uruchomieniowego):

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

    Auto presence mapuje dostępność środowiska uruchomieniowego na status Discord: healthy => online, degraded lub unknown => idle, exhausted lub unavailable => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Zatwierdzenia w Discord">
    Discord obsługuje zatwierdzanie za pomocą przycisków w DM-ach i może opcjonalnie publikować prompty zatwierdzeń w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; w miarę możliwości fallback do `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego, albo z `execApprovals.approvers`, albo z `commands.ownerAllowFrom`. Discord nie wyprowadza zatwierdzających exec z kanałowego `allowFrom`, starszego `dm.allowFrom` ani `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzeń.

    Gdy `target` ma wartość `channel` lub `both`, prompt zatwierdzenia jest widoczny w kanale. Tylko rozpoznani zatwierdzający mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Prompty zatwierdzeń zawierają tekst polecenia, więc dostarczanie do kanału włączaj tylko w zaufanych kanałach. Jeśli nie można wyprowadzić ID kanału z klucza sesji, OpenClaw przechodzi do dostarczania przez DM.

    Discord renderuje również współdzielone przyciski zatwierdzeń używane przez inne kanały czatu. Natywny adapter Discord głównie dodaje trasowanie DM dla zatwierdzających i fanout do kanałów.
    Gdy te przyciski są obecne, stanowią one podstawowy UX zatwierdzeń; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia wskazuje,
    że zatwierdzenia na czacie są niedostępne lub ręczne zatwierdzenie jest jedyną ścieżką.

    Uwierzytelnianie bramy dla tego modułu obsługi używa tego samego współdzielonego kontraktu rozwiązywania poświadczeń co inni klienci bramy:

    - uwierzytelnianie lokalne z pierwszeństwem env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie `gateway.auth.*`)
    - w trybie lokalnym `gateway.remote.*` może być użyte jako fallback tylko wtedy, gdy `gateway.auth.*` nie jest ustawione; skonfigurowane, ale nierozwiązane lokalne SecretRefs kończą się bezpiecznym niepowodzeniem
    - obsługa trybu zdalnego przez `gateway.remote.*`, gdy ma zastosowanie
    - nadpisania URL są bezpieczne względem nadpisywania: nadpisania CLI nie używają ponownie niejawnych poświadczeń, a nadpisania env używają tylko poświadczeń env

    Zachowanie rozwiązywania zatwierdzeń:

    - ID z prefiksem `plugin:` są rozwiązywane przez `plugin.approval.resolve`.
    - Inne ID są rozwiązywane przez `exec.approval.resolve`.
    - Discord nie wykonuje tu dodatkowego przeskoku fallback z exec do plugin; o tym,
      którą metodę bramy wywoła, decyduje prefiks ID.

    Zatwierdzenia exec domyślnie wygasają po 30 minutach. Jeśli zatwierdzenia kończą się niepowodzeniem z
    nieznanymi ID zatwierdzeń, sprawdź rozwiązywanie zatwierdzających, włączenie funkcji oraz
    czy dostarczony rodzaj ID zatwierdzenia odpowiada oczekującemu żądaniu.

    Powiązana dokumentacja: [Zatwierdzenia exec](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki działań

Działania na wiadomościach Discord obejmują wiadomości, administrację kanałami, moderację, obecność i działania na metadanych.

Główne przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Bramki działań znajdują się pod `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa działań                                                                                                                                                            | Domyślnie |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | włączone  |
| roles                                                                                                                                                                    | wyłączone |
| moderation                                                                                                                                                               | wyłączone |
| presence                                                                                                                                                                 | wyłączone |

## Interfejs Components v2

OpenClaw używa Discord components v2 do zatwierdzeń exec i znaczników międzykontekstowych. Działania na wiadomościach Discord mogą również akceptować `components` dla własnego interfejsu (zaawansowane; wymaga skonstruowania ładunku komponentów za pomocą narzędzia Discord), podczas gdy starsze `embeds` nadal są dostępne, ale nie są zalecane.

- `channels.discord.ui.components.accentColor` ustawia kolor akcentu używany przez kontenery komponentów Discord (hex).
- Ustaw per konto przez `channels.discord.accounts.<id>.ui.components.accentColor`.
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

OpenClaw może dołączać do kanałów głosowych Discord w celu prowadzenia rozmów w czasie rzeczywistym i w trybie ciągłym. Jest to odrębne od załączników wiadomości głosowych.

Wymagania:

- Włącz natywne polecenia (`commands.native` lub `channels.discord.commands.native`).
- Skonfiguruj `channels.discord.voice`.
- Bot musi mieć uprawnienia Connect + Speak w docelowym kanale głosowym.

Użyj natywnego polecenia Discord-only `/vc join|leave|status`, aby sterować sesjami. Polecenie używa domyślnego agenta konta i podlega tym samym regułom list dozwolonych oraz zasad grupowych co inne polecenia Discord.

Przykład auto-dołączania:

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

- `voice.tts` nadpisuje `messages.tts` tylko dla odtwarzania głosu.
- Tury transkrypcji głosowej wyprowadzają status właściciela z Discord `allowFrom` (lub `dm.allowFrom`); mówcy niebędący właścicielami nie mogą uzyskać dostępu do narzędzi tylko dla właściciela (na przykład `gateway` i `cron`).
- Głos jest domyślnie włączony; ustaw `channels.discord.voice.enabled=false`, aby go wyłączyć.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- OpenClaw obserwuje też niepowodzenia odszyfrowywania odbioru i automatycznie odzyskuje działanie, opuszczając i ponownie dołączając do kanału głosowego po powtarzających się niepowodzeniach w krótkim oknie czasu.
- Jeśli logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, może to być błąd odbioru upstream `@discordjs/voice` śledzony w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd przebiegu fali i wymagają dźwięku OGG/Opus oraz metadanych. OpenClaw generuje przebieg fali automatycznie, ale do sprawdzania i konwersji plików audio potrzebuje `ffmpeg` i `ffprobe` dostępnych na hoście bramy.

Wymagania i ograniczenia:

- Podaj **lokalną ścieżkę pliku** (URL-e są odrzucane).
- Pomiń treść tekstową (Discord nie pozwala na tekst + wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw w razie potrzeby konwertuje do OGG/Opus.

Przykład:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intents lub bot nie widzi wiadomości serwera">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy zależysz od rozwiązywania użytkowników/członków
    - po zmianie intents uruchom ponownie bramę

  </Accordion>

  <Accordion title="Wiadomości serwera są nieoczekiwanie blokowane">

    - sprawdź `groupPolicy`
    - sprawdź listę dozwolonych serwerów w `channels.discord.guilds`
    - jeśli istnieje mapa `channels` serwera, dozwolone są tylko wymienione kanały
    - sprawdź zachowanie `requireMention` i wzorce wzmianki

    Przydatne sprawdzenia:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, ale nadal blokowane">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych serwera/kanału
    - `requireMention` skonfigurowane w złym miejscu (musi być pod `channels.discord.guilds` lub we wpisie kanału)
    - nadawca blokowany przez listę dozwolonych `users` serwera/kanału

  </Accordion>

  <Accordion title="Długo działające handlery przekraczają limit czasu lub duplikują odpowiedzi">

    Typowe logi:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Parametr budżetu listenera:

    - jedno konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Parametr limitu czasu uruchomienia workera:

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

    Użyj `eventQueue.listenerTimeout` dla wolnego przygotowania listenera, a `inboundWorker.runTimeoutMs`
    tylko wtedy, gdy chcesz mieć osobny bezpiecznik dla kolejkowanych tur agenta.

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Sprawdzenia uprawnień `channels status --probe` działają tylko dla numerycznych ID kanałów.

    Jeśli używasz kluczy typu slug, dopasowanie w czasie działania nadal może działać, ale test nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - zasady DM wyłączone: `channels.discord.dmPolicy="disabled"` (starsze: `channels.discord.dm.policy`)
    - oczekiwanie na zatwierdzenie parowania w trybie `pairing`

  </Accordion>

  <Accordion title="Pętle bot-do-bota">
    Domyślnie wiadomości napisane przez boty są ignorowane.

    Jeśli ustawisz `channels.discord.allowBots=true`, używaj ścisłych reguł wzmianki i list dozwolonych, aby uniknąć zapętleń.
    Zalecane jest `channels.discord.allowBots="mentions"`, aby akceptować tylko wiadomości botów, które wspominają bota.

  </Accordion>

  <Accordion title="Głosowe STT przestaje działać z DecryptionFailed(...)">

    - aktualizuj OpenClaw (`openclaw update`), aby logika odzyskiwania odbioru głosowego Discord była obecna
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli problemy trwają po automatycznym ponownym dołączeniu, zbierz logi i porównaj z [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Wskaźniki do dokumentacji konfiguracji

Główna dokumentacja:

- [Dokumentacja konfiguracji - Discord](/gateway/configuration-reference#discord)

Kluczowe pola Discord o wysokim znaczeniu:

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- zasady: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenia: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker przychodzący: `inboundWorker.runTimeoutMs`
- odpowiedź/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- strumieniowanie: `streaming` (starszy alias: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/ponawianie: `mediaMaxMb`, `retry`
  - `mediaMaxMb` ogranicza wychodzące przesyłania do Discord (domyślnie: `8MB`)
- działania: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- interfejs: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Bezpieczeństwo i operacje

- Traktuj tokeny bota jako sekrety (`DISCORD_BOT_TOKEN` preferowane w środowiskach nadzorowanych).
- Przyznawaj minimalne niezbędne uprawnienia Discord.
- Jeśli wdrożenie poleceń lub ich stan są nieaktualne, uruchom ponownie bramę i sprawdź ponownie przez `openclaw channels status --probe`.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Trasowanie kanałów](/pl/channels/channel-routing)
- [Bezpieczeństwo](/gateway/security)
- [Trasowanie wielu agentów](/concepts/multi-agent)
- [Rozwiązywanie problemów](/channels/troubleshooting)
- [Polecenia ukośnikowe](/tools/slash-commands)
