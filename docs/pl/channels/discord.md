---
read_when:
    - Praca nad funkcjami kanału Discord
summary: Status obsługi bota Discord, możliwości i konfiguracja
title: Discord
x-i18n:
    generated_at: "2026-05-03T21:27:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a38cb3c8e25c1f3d6b7ddfc35a0445dc264be74d74b08d0051528b462b743a3
    source_path: channels/discord.md
    workflow: 16
---

Gotowe do obsługi wiadomości prywatnych i kanałów gildii przez oficjalny Discord Gateway.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Discord domyślnie używają trybu parowania.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Natywne działanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i przepływ naprawy.
  </Card>
</CardGroup>

## Szybka konfiguracja

Musisz utworzyć nową aplikację z botem, dodać bota do swojego serwera i sparować go z OpenClaw. Zalecamy dodanie bota do własnego prywatnego serwera. Jeśli jeszcze go nie masz, [najpierw go utwórz](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wybierz **Create My Own > For me and my friends**).

<Steps>
  <Step title="Utwórz aplikację i bota Discord">
    Przejdź do [Discord Developer Portal](https://discord.com/developers/applications) i kliknij **New Application**. Nadaj jej nazwę, na przykład "OpenClaw".

    Kliknij **Bot** na pasku bocznym. Ustaw **Username** na dowolną nazwę swojego agenta OpenClaw.

  </Step>

  <Step title="Włącz uprzywilejowane intencje">
    Nadal na stronie **Bot** przewiń w dół do **Privileged Gateway Intents** i włącz:

    - **Message Content Intent** (wymagane)
    - **Server Members Intent** (zalecane; wymagane dla list dozwolonych ról i dopasowywania nazwy do ID)
    - **Presence Intent** (opcjonalne; potrzebne tylko do aktualizacji obecności)

  </Step>

  <Step title="Skopiuj token bota">
    Przewiń z powrotem w górę na stronie **Bot** i kliknij **Reset Token**.

    <Note>
    Mimo nazwy generuje to pierwszy token — nic nie jest „resetowane”.
    </Note>

    Skopiuj token i zapisz go w bezpiecznym miejscu. To jest Twój **Bot Token** i wkrótce będzie Ci potrzebny.

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

    To jest podstawowy zestaw dla zwykłych kanałów tekstowych. Jeśli planujesz publikować w wątkach Discord, w tym w przepływach kanałów forum lub multimediów, które tworzą albo kontynuują wątek, włącz także **Send Messages in Threads**.
    Skopiuj wygenerowany URL u dołu, wklej go w przeglądarce, wybierz swój serwer i kliknij **Continue**, aby połączyć. Bot powinien być teraz widoczny na serwerze Discord.

  </Step>

  <Step title="Włącz Developer Mode i zbierz swoje ID">
    Wróć do aplikacji Discord. Musisz włączyć Developer Mode, aby móc kopiować wewnętrzne ID.

    1. Kliknij **User Settings** (ikona koła zębatego obok awatara) → **Advanced** → włącz **Developer Mode**
    2. Kliknij prawym przyciskiem **ikonę serwera** na pasku bocznym → **Copy Server ID**
    3. Kliknij prawym przyciskiem **własny awatar** → **Copy User ID**

    Zapisz **Server ID** i **User ID** obok Bot Token — w następnym kroku wyślesz wszystkie trzy do OpenClaw.

  </Step>

  <Step title="Zezwól na wiadomości prywatne od członków serwera">
    Aby parowanie działało, Discord musi pozwolić botowi wysłać Ci wiadomość prywatną. Kliknij prawym przyciskiem **ikonę serwera** → **Privacy Settings** → włącz **Direct Messages**.

    Dzięki temu członkowie serwera (w tym boty) mogą wysyłać Ci wiadomości prywatne. Pozostaw tę opcję włączoną, jeśli chcesz używać wiadomości prywatnych Discord z OpenClaw. Jeśli planujesz używać tylko kanałów gildii, możesz wyłączyć wiadomości prywatne po sparowaniu.

  </Step>

  <Step title="Ustaw token bota bezpiecznie (nie wysyłaj go na czacie)">
    Token bota Discord jest sekretem (jak hasło). Ustaw go na maszynie, na której działa OpenClaw, zanim napiszesz do swojego agenta.

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

    Jeśli OpenClaw działa już jako usługa w tle, uruchom go ponownie przez aplikację OpenClaw na Macu albo zatrzymując i ponownie uruchamiając proces `openclaw gateway run`.
    W przypadku instalacji jako usługi zarządzanej uruchom `openclaw gateway install` z powłoki, w której obecny jest `DISCORD_BOT_TOKEN`, albo zapisz zmienną w `~/.openclaw/.env`, aby usługa mogła rozwiązać SecretRef środowiska po ponownym uruchomieniu.
    Jeśli Twój host jest blokowany lub ograniczany przez limit zapytań podczas startowego wyszukiwania aplikacji Discord, ustaw ID aplikacji/klienta Discord z Developer Portal, aby start mógł pominąć to wywołanie REST. Użyj `channels.discord.applicationId` dla konta domyślnego albo `channels.discord.accounts.<accountId>.applicationId`, gdy uruchamiasz wiele botów Discord.

  </Step>

  <Step title="Skonfiguruj OpenClaw i sparuj">

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        Porozmawiaj ze swoim agentem OpenClaw na dowolnym istniejącym kanale (np. Telegram) i powiedz mu to. Jeśli Discord jest Twoim pierwszym kanałem, użyj zamiast tego karty CLI / konfiguracja.

        > "Ustawiłem już token bota Discord w konfiguracji. Dokończ konfigurację Discord z User ID `<user_id>` i Server ID `<server_id>`."
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

        Awaryjna zmienna środowiskowa dla konta domyślnego:

```bash
DISCORD_BOT_TOKEN=...
```

        W przypadku konfiguracji skryptowej lub zdalnej zapisz ten sam blok JSON5 za pomocą `openclaw config patch --file ./discord.patch.json5 --dry-run`, a następnie uruchom ponownie bez `--dry-run`. Obsługiwane są jawne wartości `token`. Wartości SecretRef są również obsługiwane dla `channels.discord.token` w providerach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).

        W przypadku wielu botów Discord trzymaj każdy token bota i ID aplikacji pod jego kontem. Najwyższy poziom `channels.discord.applicationId` jest dziedziczony przez konta, więc ustawiaj go tam tylko wtedy, gdy każde konto ma używać tego samego ID aplikacji.

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

    Teraz możesz rozmawiać ze swoim agentem w Discord przez wiadomości prywatne.

  </Step>
</Steps>

<Note>
Rozwiązywanie tokenów uwzględnia konto. Wartości tokenów z konfiguracji mają pierwszeństwo przed awaryjną zmienną środowiskową. `DISCORD_BOT_TOKEN` jest używany tylko dla konta domyślnego.
Jeśli dwa włączone konta Discord rozwiążą się do tego samego tokena bota, OpenClaw uruchomi tylko jeden monitor Gateway dla tego tokena. Token pochodzący z konfiguracji wygrywa z domyślną awaryjną zmienną środowiskową; w przeciwnym razie wygrywa pierwsze włączone konto, a zduplikowane konto zostaje zgłoszone jako wyłączone.
W przypadku zaawansowanych wywołań wychodzących (narzędzie wiadomości/akcje kanału) jawny `token` dla wywołania jest używany dla tego wywołania. Dotyczy to akcji wysyłania i akcji typu odczyt/sondowanie (na przykład read/search/fetch/thread/pins/permissions). Ustawienia zasad konta i ponawiania nadal pochodzą z wybranego konta w aktywnej migawce środowiska uruchomieniowego.
</Note>

## Zalecane: skonfiguruj przestrzeń roboczą gildii

Gdy wiadomości prywatne będą działać, możesz skonfigurować swój serwer Discord jako pełną przestrzeń roboczą, w której każdy kanał otrzymuje własną sesję agenta z własnym kontekstem. Jest to zalecane dla prywatnych serwerów, na których jesteś tylko Ty i Twój bot.

<Steps>
  <Step title="Dodaj swój serwer do listy dozwolonych gildii">
    Dzięki temu agent może odpowiadać w dowolnym kanale na Twoim serwerze, nie tylko w wiadomościach prywatnych.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Dodaj mój Discord Server ID `<server_id>` do listy dozwolonych gildii"
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
    Domyślnie agent odpowiada w kanałach gildii tylko wtedy, gdy zostanie wspomniany przez @. Na prywatnym serwerze prawdopodobnie chcesz, aby odpowiadał na każdą wiadomość.

    W kanałach gildii normalne końcowe odpowiedzi asystenta domyślnie pozostają prywatne. Widoczne wyjście Discord musi zostać wysłane jawnie narzędziem `message`, aby agent mógł domyślnie pozostawać w tle i publikować tylko wtedy, gdy uzna, że odpowiedź w kanale jest przydatna.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Pozwól mojemu agentowi odpowiadać na tym serwerze bez konieczności @wzmianki"
      </Tab>
      <Tab title="Konfiguracja">
        Ustaw `requireMention: false` w konfiguracji gildii:

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

        Aby przywrócić starsze automatyczne odpowiedzi końcowe dla pokoi grupowych/kanałów, ustaw `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Zaplanuj użycie pamięci w kanałach gildii">
    Domyślnie pamięć długoterminowa (MEMORY.md) ładuje się tylko w sesjach wiadomości prywatnych. Kanały gildii nie ładują automatycznie MEMORY.md.

    <Tabs>
      <Tab title="Zapytaj swojego agenta">
        > "Gdy zadaję pytania w kanałach Discord, używaj memory_search lub memory_get, jeśli potrzebujesz długoterminowego kontekstu z MEMORY.md."
      </Tab>
      <Tab title="Ręcznie">
        Jeśli potrzebujesz współdzielonego kontekstu w każdym kanale, umieść stabilne instrukcje w `AGENTS.md` lub `USER.md` (są wstrzykiwane do każdej sesji). Przechowuj długoterminowe notatki w `MEMORY.md` i sięgaj do nich na żądanie za pomocą narzędzi pamięci.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Teraz utwórz kilka kanałów na swoim serwerze Discord i zacznij rozmawiać. Agent widzi nazwę kanału, a każdy kanał otrzymuje własną izolowaną sesję — możesz więc skonfigurować `#coding`, `#home`, `#research` albo cokolwiek pasuje do Twojego przepływu pracy.

## Model środowiska uruchomieniowego

- Gateway jest właścicielem połączenia Discord.
- Trasowanie odpowiedzi jest deterministyczne: przychodzące odpowiedzi Discord wracają do Discord.
- Metadane gildii/kanału Discord są dodawane do promptu modelu jako niezaufany
  kontekst, a nie jako widoczny dla użytkownika prefiks odpowiedzi. Jeśli model skopiuje tę otoczkę
  z powrotem, OpenClaw usuwa skopiowane metadane z odpowiedzi wychodzących oraz z
  przyszłego kontekstu odtwarzania.
- Domyślnie (`session.dmScope=main`) czaty bezpośrednie współdzielą główną sesję agenta (`agent:main:main`).
- Kanały gildii są izolowanymi kluczami sesji (`agent:<agentId>:discord:channel:<channelId>`).
- Grupowe wiadomości prywatne są domyślnie ignorowane (`channels.discord.dm.groupEnabled=false`).
- Natywne polecenia ukośnikowe działają w izolowanych sesjach poleceń (`agent:<agentId>:discord:slash:<userId>`), nadal przenosząc `CommandTargetSessionKey` do trasowanej sesji konwersacji.
- Dostarczanie ogłoszeń tekstowych cron/heartbeat do Discord używa raz końcowej
  odpowiedzi widocznej dla asystenta. Multimedia i ustrukturyzowane ładunki komponentów pozostają
  wieloma wiadomościami, gdy agent emituje wiele możliwych do dostarczenia ładunków.

## Kanały forum

Kanały forum i multimediów Discord akceptują tylko posty w wątkach. OpenClaw obsługuje dwa sposoby ich tworzenia:

- Wyślij wiadomość do nadrzędnego forum (`channel:<forumId>`), aby automatycznie utworzyć wątek. Tytuł wątku używa pierwszego niepustego wiersza wiadomości.
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

OpenClaw obsługuje kontenery komponentów Discord v2 dla wiadomości agenta. Użyj narzędzia wiadomości z ładunkiem `components`. Wyniki interakcji są trasowane z powrotem do agenta jako zwykłe wiadomości przychodzące i podążają za istniejącymi ustawieniami Discord `replyToMode`.

Obsługiwane bloki:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Wiersze akcji pozwalają na maksymalnie 5 przycisków albo jedno menu wyboru
- Typy wyboru: `string`, `user`, `role`, `mentionable`, `channel`

Domyślnie komponenty są jednorazowego użytku. Ustaw `components.reusable=true`, aby przyciski, listy wyboru i formularze mogły być używane wielokrotnie aż do wygaśnięcia.

Aby ograniczyć, kto może kliknąć przycisk, ustaw `allowedUsers` na tym przycisku (identyfikatory użytkowników Discord, tagi albo `*`). Po skonfigurowaniu niedopasowani użytkownicy otrzymują efemeryczną odmowę.

Polecenia ukośnikowe `/model` i `/models` otwierają interaktywny selektor modelu z listami rozwijanymi dostawcy, modelu i zgodnego środowiska uruchomieniowego oraz krokiem Prześlij. `/models add` jest przestarzałe i teraz zwraca komunikat o wycofaniu zamiast rejestrować modele z czatu. Odpowiedź selektora jest efemeryczna i może jej użyć tylko wywołujący użytkownik.

Załączniki plików:

- Bloki `file` muszą wskazywać odwołanie do załącznika (`attachment://<filename>`)
- Podaj załącznik przez `media`/`path`/`filePath` (pojedynczy plik); dla wielu plików użyj `media-gallery`
- Użyj `filename`, aby nadpisać nazwę przesyłanego pliku, gdy ma ona odpowiadać odwołaniu do załącznika

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
    `channels.discord.dmPolicy` kontroluje dostęp do DM. `channels.discord.allowFrom` jest kanoniczną listą dozwolonych DM.

    - `pairing` (domyślne)
    - `allowlist`
    - `open` (wymaga, aby `channels.discord.allowFrom` zawierało `"*"`)
    - `disabled`

    Jeśli zasady DM nie są otwarte, nieznani użytkownicy są blokowani (albo proszeni o parowanie w trybie `pairing`).

    Priorytetyzacja wielu kont:

    - `channels.discord.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Dla jednego konta `allowFrom` ma pierwszeństwo przed starszym `dm.allowFrom`.
    - Nazwane konta dziedziczą `channels.discord.allowFrom`, gdy ich własne `allowFrom` i starsze `dm.allowFrom` nie są ustawione.
    - Nazwane konta nie dziedziczą `channels.discord.accounts.default.allowFrom`.

    Starsze `channels.discord.dm.policy` i `channels.discord.dm.allowFrom` są nadal odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Format celu DM przy dostarczaniu:

    - `user:<id>`
    - wzmianka `<@id>`

    Same identyfikatory numeryczne zwykle są rozpoznawane jako identyfikatory kanałów, gdy aktyślna jest domyślna wartość kanału, ale identyfikatory wymienione w efektywnej liście DM `allowFrom` konta są traktowane jako cele DM użytkowników dla zgodności.

  </Tab>

  <Tab title="Grupy dostępu DM">
    DM Discord mogą używać dynamicznych wpisów `accessGroup:<name>` w `channels.discord.allowFrom`.

    Nazwy grup dostępu są współdzielone między kanałami wiadomości. Użyj `type: "message.senders"` dla statycznej grupy, której członkowie są wyrażeni w normalnej składni `allowFrom` każdego kanału, albo `type: "discord.channelAudience"`, gdy bieżąca publiczność `ViewChannel` kanału Discord ma dynamicznie definiować członkostwo. Współdzielone zachowanie grup dostępu jest udokumentowane tutaj: [Grupy dostępu](/pl/channels/access-groups).

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

    Przykład: pozwól każdemu, kto widzi `#maintainers`, wysyłać DM do bota, pozostawiając DM zamknięte dla wszystkich innych.

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

    Wyszukiwania kończą się odmową w razie błędu. Jeśli Discord zwróci `Missing Access`, wyszukiwanie członka się nie powiedzie albo kanał należy do innej gildii, nadawca DM jest traktowany jako nieautoryzowany.

    Włącz **Server Members Intent** w Discord Developer Portal dla bota, gdy używasz grup dostępu opartych na publiczności kanału. DM nie zawierają stanu członka gildii, więc OpenClaw rozpoznaje członka przez Discord REST w czasie autoryzacji.

  </Tab>

  <Tab title="Zasady gildii">
    Obsługa gildii jest kontrolowana przez `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Bezpieczną podstawą, gdy `channels.discord` istnieje, jest `allowlist`.

    Zachowanie `allowlist`:

    - gildia musi pasować do `channels.discord.guilds` (preferowane `id`, akceptowany slug)
    - opcjonalne listy dozwolonych nadawców: `users` (zalecane stabilne identyfikatory) i `roles` (tylko identyfikatory ról); jeśli którakolwiek jest skonfigurowana, nadawcy są dozwoleni, gdy pasują do `users` LUB `roles`
    - bezpośrednie dopasowywanie nazwy/tagu jest domyślnie wyłączone; włącz `channels.discord.dangerouslyAllowNameMatching: true` tylko jako awaryjny tryb zgodności
    - nazwy/tagi są obsługiwane dla `users`, ale identyfikatory są bezpieczniejsze; `openclaw security audit` ostrzega, gdy używane są wpisy z nazwą/tagiem
    - jeśli gildia ma skonfigurowane `channels`, kanały niewymienione na liście są odmawiane
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

    Jeśli ustawisz tylko `DISCORD_BOT_TOKEN` i nie utworzysz bloku `channels.discord`, awaryjna wartość w czasie działania to `groupPolicy="allowlist"` (z ostrzeżeniem w logach), nawet jeśli `channels.defaults.groupPolicy` ma wartość `open`.

  </Tab>

  <Tab title="Wzmianki i grupowe DM">
    Wiadomości gildii są domyślnie ograniczone wymogiem wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawną wzmiankę o bocie
    - skonfigurowane wzorce wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - domyślne zachowanie odpowiedzi do bota w obsługiwanych przypadkach

    Podczas pisania wychodzących wiadomości Discord używaj kanonicznej składni wzmianek: `<@USER_ID>` dla użytkowników, `<#CHANNEL_ID>` dla kanałów i `<@&ROLE_ID>` dla ról. Nie używaj starszej formy wzmianki pseudonimu `<@!USER_ID>`.

    `requireMention` jest konfigurowane dla każdej gildii/kanału (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcjonalnie odrzuca wiadomości, które wspominają innego użytkownika/rolę, ale nie bota (z wyłączeniem @everyone/@here).

    Grupowe DM:

    - domyślnie: ignorowane (`dm.groupEnabled=false`)
    - opcjonalna lista dozwolonych przez `dm.groupChannels` (identyfikatory kanałów lub slugi)

  </Tab>
</Tabs>

### Trasowanie agentów na podstawie ról

Użyj `bindings[].match.roles`, aby trasować członków gildii Discord do różnych agentów według identyfikatora roli. Powiązania oparte na rolach akceptują tylko identyfikatory ról i są oceniane po powiązaniach peer lub parent-peer, a przed powiązaniami tylko dla gildii. Jeśli powiązanie ustawia też inne pola dopasowania (na przykład `peer` + `guildId` + `roles`), wszystkie skonfigurowane pola muszą pasować.

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
- `commands.native=false` pomija rejestrację poleceń slash Discord i czyszczenie podczas uruchamiania. Wcześniej zarejestrowane polecenia mogą pozostać widoczne w Discord, dopóki nie usuniesz ich z aplikacji Discord.
- Natywna autoryzacja poleceń używa tych samych list dozwolonych i zasad Discord co zwykła obsługa wiadomości.
- Polecenia mogą nadal być widoczne w interfejsie Discord dla użytkowników bez autoryzacji; wykonanie nadal egzekwuje autoryzację OpenClaw i zwraca "not authorized".

Zobacz [Polecenia slash](/pl/tools/slash-commands), aby poznać katalog poleceń i ich zachowanie.

Domyślne ustawienia poleceń slash:

- `ephemeral: true`

## Szczegóły funkcji

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord obsługuje znaczniki odpowiedzi w danych wyjściowych agenta:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Kontrolowane przez `channels.discord.replyToMode`:

    - `off` (domyślnie)
    - `first`
    - `all`
    - `batched`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne znaczniki `[[reply_to_*]]` są nadal respektowane.
    `first` zawsze dołącza niejawną natywną referencję odpowiedzi do pierwszej wychodzącej wiadomości Discord dla danej tury.
    `batched` dołącza niejawną natywną referencję odpowiedzi Discord tylko wtedy, gdy
    przychodząca tura była zdebouncowaną partią wielu wiadomości. Jest to przydatne,
    gdy chcesz używać natywnych odpowiedzi głównie dla niejednoznacznych, gwałtownych rozmów, a nie dla każdej
    tury z pojedynczą wiadomością.

    Identyfikatory wiadomości są udostępniane w kontekście/historii, aby agenci mogli wskazywać konkretne wiadomości.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw może strumieniować wersje robocze odpowiedzi, wysyłając tymczasową wiadomość i edytując ją w miarę napływania tekstu. `channels.discord.streaming` przyjmuje `off` (domyślnie) | `partial` | `block` | `progress`. `progress` utrzymuje jedną edytowalną wersję roboczą statusu i aktualizuje ją postępem narzędzi aż do końcowego dostarczenia; `streamMode` to starszy alias i jest automatycznie migrowany.

    Domyślnie pozostaje `off`, ponieważ edycje podglądu Discord szybko trafiają na limity szybkości, gdy wiele botów lub bram współdzieli konto.

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
    - `block` emituje fragmenty o rozmiarze wersji roboczej (użyj `draftChunk`, aby dostroić rozmiar i punkty podziału, ograniczone do `textChunkLimit`).
    - Media, błędy i finalne odpowiedzi z jawną referencją anulują oczekujące edycje podglądu.
    - `streaming.preview.toolProgress` (domyślnie `true`) kontroluje, czy aktualizacje narzędzi/postępu ponownie używają wiadomości podglądu.

    Strumieniowanie podglądu obsługuje tylko tekst; odpowiedzi z mediami wracają do zwykłego dostarczania. Gdy strumieniowanie `block` jest jawnie włączone, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Kontekst historii serwera:

    - domyślna wartość `channels.discord.historyLimit` to `20`
    - wartość awaryjna: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Kontrolki historii DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Zachowanie wątków:

    - Wątki Discord są kierowane jako sesje kanału i dziedziczą konfigurację kanału nadrzędnego, chyba że zostanie ona nadpisana.
    - Sesje wątków dziedziczą wybór `/model` na poziomie sesji kanału nadrzędnego jako wartość awaryjną tylko dla modelu; lokalne wybory `/model` w wątku nadal mają pierwszeństwo, a historia transkrypcji nadrzędnej nie jest kopiowana, chyba że włączono dziedziczenie transkrypcji.
    - `channels.discord.thread.inheritParent` (domyślnie `false`) włącza inicjowanie nowych automatycznych wątków z transkrypcji nadrzędnej. Nadpisania dla konta znajdują się pod `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reakcje narzędzia wiadomości mogą rozwiązywać cele DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` jest zachowywane podczas awaryjnej aktywacji na etapie odpowiedzi.

    Tematy kanałów są wstrzykiwane jako **niezaufany** kontekst. Listy dozwolonych kontrolują, kto może uruchomić agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord może powiązać wątek z celem sesji, aby kolejne wiadomości w tym wątku nadal były kierowane do tej samej sesji (w tym sesji subagentów).

    Polecenia:

    - `/focus <target>` wiąże bieżący/nowy wątek z celem subagenta/sesji
    - `/unfocus` usuwa powiązanie bieżącego wątku
    - `/agents` pokazuje aktywne uruchomienia i stan powiązania
    - `/session idle <duration|off>` sprawdza/aktualizuje automatyczne usunięcie skupienia po bezczynności dla skupionych powiązań
    - `/session max-age <duration|off>` sprawdza/aktualizuje twardy maksymalny wiek skupionych powiązań

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
    - `spawnSessions` kontroluje automatyczne tworzenie/wiązanie wątków dla `sessions_spawn({ thread: true })` i tworzenia wątków ACP. Domyślnie: `true`.
    - `defaultSpawnContext` kontroluje natywny kontekst subagenta dla tworzeń powiązanych z wątkiem. Domyślnie: `"fork"`.
    - Przestarzałe klucze `spawnSubagentSessions`/`spawnAcpSessions` są migrowane przez `openclaw doctor --fix`.
    - Jeśli powiązania wątków są wyłączone dla konta, `/focus` i powiązane operacje wiązania wątku są niedostępne.

    Zobacz [Subagentów](/pl/tools/subagents), [Agentów ACP](/pl/tools/acp-agents) oraz [Dokumentację konfiguracji](/pl/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
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
    - `spawnSessions` bramkuje tworzenie/wiązanie wątków podrzędnych przez `--thread auto|here`.

    Zobacz [Agentów ACP](/pl/tools/acp-agents), aby poznać szczegóły zachowania powiązań.

  </Accordion>

  <Accordion title="Reaction notifications">
    Tryb powiadomień o reakcjach dla serwera:

    - `off`
    - `own` (domyślnie)
    - `all`
    - `allowlist` (używa `guilds.<id>.users`)

    Zdarzenia reakcji są zamieniane na zdarzenia systemowe i dołączane do kierowanej sesji Discord.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozwiązywania:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - awaryjna wartość emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Discord akceptuje emoji Unicode lub nazwy niestandardowych emoji.
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Config writes">
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

  <Accordion title="Gateway proxy">
    Kieruj ruch WebSocket Gateway Discord oraz początkowe wyszukiwania REST (identyfikator aplikacji + rozwiązywanie list dozwolonych) przez proxy HTTP(S) za pomocą `channels.discord.proxy`.

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
    - nazwy wyświetlane członków są dopasowywane według nazwy/sluga tylko wtedy, gdy `channels.discord.dangerouslyAllowNameMatching: true`
    - wyszukiwania używają oryginalnego identyfikatora wiadomości i są ograniczone oknem czasowym
    - jeśli wyszukiwanie się nie powiedzie, wiadomości proxy są traktowane jako wiadomości botów i odrzucane, chyba że `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
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

  <Accordion title="Presence configuration">
    Aktualizacje obecności są stosowane, gdy ustawisz pole statusu lub aktywności albo włączysz automatyczną obecność.

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

    - 0: Granie
    - 1: Strumieniowanie (wymaga `activityUrl`)
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

    Automatyczna obecność mapuje dostępność środowiska wykonawczego na status Discord: healthy => online, degraded lub unknown => idle, exhausted lub unavailable => dnd. Opcjonalne nadpisania tekstu:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (obsługuje placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord obsługuje zatwierdzanie za pomocą przycisków w DM i może opcjonalnie publikować monity zatwierdzenia w kanale źródłowym.

    Ścieżka konfiguracji:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcjonalne; gdy to możliwe, używa awaryjnie `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord automatycznie włącza natywne zatwierdzenia wykonywania, gdy `enabled` jest nieustawione albo ma wartość `"auto"` i można rozpoznać co najmniej jedną osobę zatwierdzającą, z `execApprovals.approvers` albo z `commands.ownerAllowFrom`. Discord nie wywnioskuje osób zatwierdzających wykonanie z kanałowego `allowFrom`, starszego `dm.allowFrom` ani `defaultTo` dla wiadomości bezpośrednich. Ustaw `enabled: false`, aby jawnie wyłączyć Discord jako natywnego klienta zatwierdzeń.

    W przypadku wrażliwych poleceń grupowych tylko dla właścicieli, takich jak `/diagnostics` i `/export-trajectory`, OpenClaw wysyła prośby o zatwierdzenie i wyniki końcowe prywatnie. Najpierw próbuje Discord DM, gdy właściciel wywołujący ma trasę właściciela Discord; jeśli nie jest ona dostępna, używa awaryjnie pierwszej dostępnej trasy właściciela z `commands.ownerAllowFrom`, takiej jak Telegram.

    Gdy `target` ma wartość `channel` albo `both`, prośba o zatwierdzenie jest widoczna w kanale. Tylko rozpoznane osoby zatwierdzające mogą używać przycisków; inni użytkownicy otrzymują efemeryczną odmowę. Prośby o zatwierdzenie zawierają tekst polecenia, więc włączaj dostarczanie do kanału tylko w zaufanych kanałach. Jeśli identyfikatora kanału nie można wyprowadzić z klucza sesji, OpenClaw używa awaryjnie dostarczenia przez DM.

    Discord renderuje także współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Discord dodaje głównie kierowanie DM do osób zatwierdzających i rozsyłanie do kanałów.
    Gdy te przyciski są obecne, są głównym UX zatwierdzania; OpenClaw
    powinien uwzględniać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.
    Jeśli natywne środowisko wykonawcze zatwierdzeń Discord nie jest aktywne, OpenClaw zachowuje
    widoczną lokalną deterministyczną prośbę `/approve <id> <decision>`. Jeśli
    środowisko wykonawcze jest aktywne, ale natywnej karty nie można dostarczyć do żadnego celu,
    OpenClaw wysyła w tym samym czacie powiadomienie awaryjne z dokładnym poleceniem `/approve`
    z oczekującego zatwierdzenia.

    Uwierzytelnianie Gateway i rozpoznawanie zatwierdzeń są zgodne ze współdzielonym kontraktem klienta Gateway (identyfikatory `plugin:` są rozpoznawane przez `plugin.approval.resolve`; inne identyfikatory przez `exec.approval.resolve`). Zatwierdzenia domyślnie wygasają po 30 minutach.

    Zobacz [zatwierdzenia wykonywania](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Narzędzia i bramki akcji

Akcje wiadomości Discord obejmują wysyłanie wiadomości, administrację kanałami, moderację, obecność i akcje metadanych.

Główne przykłady:

- wiadomości: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reakcje: `react`, `reactions`, `emojiList`
- moderacja: `timeout`, `kick`, `ban`
- obecność: `setPresence`

Akcja `event-create` akceptuje opcjonalny parametr `image` (URL albo lokalna ścieżka pliku), aby ustawić obraz okładki zaplanowanego wydarzenia.

Bramki akcji znajdują się pod `channels.discord.actions.*`.

Domyślne zachowanie bramek:

| Grupa akcji                                                                                                                                                             | Domyślnie  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reakcje, wiadomości, wątki, przypięcia, ankiety, wyszukiwanie, memberInfo, roleInfo, channelInfo, kanały, voiceStatus, wydarzenia, naklejki, emojiUploads, stickerUploads, uprawnienia | włączone  |
| role                                                                                                                                                                    | wyłączone |
| moderacja                                                                                                                                                               | wyłączona |
| obecność                                                                                                                                                                 | wyłączona |

## Interfejs UI komponentów v2

OpenClaw używa komponentów Discord v2 do zatwierdzeń wykonywania i znaczników międzykontekstowych. Akcje wiadomości Discord mogą także akceptować `components` dla niestandardowego UI (zaawansowane; wymaga skonstruowania ładunku komponentu przez narzędzie discord), natomiast starsze `embeds` pozostają dostępne, ale nie są zalecane.

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

Discord ma dwie odrębne powierzchnie głosowe: **kanały głosowe** czasu rzeczywistego (ciągłe rozmowy) oraz **załączniki wiadomości głosowych** (format podglądu fali dźwiękowej). Gateway obsługuje oba.

### Kanały głosowe

Lista kontrolna konfiguracji:

1. Włącz Message Content Intent w Discord Developer Portal.
2. Włącz Server Members Intent, gdy używane są listy dozwolonych ról/użytkowników.
3. Zaproś bota z zakresami `bot` i `applications.commands`.
4. Przyznaj Connect, Speak, Send Messages i Read Message History w docelowym kanale głosowym.
5. Włącz natywne polecenia (`commands.native` albo `channels.discord.commands.native`).
6. Skonfiguruj `channels.discord.voice`.

Użyj `/vc join|leave|status`, aby kontrolować sesje. Polecenie używa domyślnego agenta konta i stosuje te same reguły list dozwolonych oraz zasad grupowych co inne polecenia Discord.

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

- `voice.tts` nadpisuje `messages.tts` tylko dla odtwarzania głosu.
- `voice.model` nadpisuje LLM używany tylko dla odpowiedzi w kanałach głosowych Discord. Pozostaw nieustawione, aby dziedziczyć model kierowanego agenta.
- STT używa `tools.media.audio`; `voice.model` nie wpływa na transkrypcję.
- Nadpisania `systemPrompt` Discord dla kanału mają zastosowanie do tur transkryptu głosu dla tego kanału głosowego.
- Tury transkryptu głosu wyprowadzają status właściciela z Discord `allowFrom` (albo `dm.allowFrom`); mówcy niebędący właścicielami nie mogą uzyskać dostępu do narzędzi tylko dla właścicieli (na przykład `gateway` i `cron`).
- Głos Discord jest opcjonalny dla konfiguracji tekstowych; ustaw `channels.discord.voice.enabled=true` (albo zachowaj istniejący blok `channels.discord.voice`), aby włączyć polecenia `/vc`, środowisko wykonawcze głosu i intencję Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` może jawnie nadpisać subskrypcję intencji stanu głosowego. Pozostaw nieustawione, aby intencja podążała za efektywnym włączeniem głosu.
- `voice.daveEncryption` i `voice.decryptionFailureTolerance` są przekazywane do opcji dołączania `@discordjs/voice`.
- Domyślne wartości `@discordjs/voice` to `daveEncryption=true` i `decryptionFailureTolerance=24`, jeśli nie są ustawione.
- `voice.connectTimeoutMs` kontroluje początkowe oczekiwanie `@discordjs/voice` na Ready dla prób `/vc join` i automatycznego dołączania. Domyślnie: `30000`.
- `voice.reconnectGraceMs` kontroluje, jak długo OpenClaw czeka, aż rozłączona sesja głosowa zacznie się ponownie łączyć, zanim ją zniszczy. Domyślnie: `15000`.
- OpenClaw obserwuje także niepowodzenia odszyfrowywania odbioru i automatycznie odzyskuje działanie przez opuszczenie kanału głosowego i ponowne dołączenie po powtarzających się awariach w krótkim oknie.
- Jeśli po aktualizacji logi odbioru wielokrotnie pokazują `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, zbierz raport zależności i logi. Dołączona linia `@discordjs/voice` zawiera poprawkę paddingu z upstream z PR discord.js #11449, która zamknęła zgłoszenie discord.js #11419.

Potok kanału głosowego:

- Przechwytywanie PCM Discord jest konwertowane na tymczasowy plik WAV.
- `tools.media.audio` obsługuje STT, na przykład `openai/gpt-4o-mini-transcribe`.
- Transkrypt jest wysyłany przez wejście i routing Discord, podczas gdy odpowiedź LLM działa z zasadą wyjścia głosowego, która ukrywa narzędzie agenta `tts` i prosi o zwrócony tekst, ponieważ Discord voice odpowiada za końcowe odtwarzanie TTS.
- `voice.model`, gdy jest ustawione, nadpisuje tylko LLM odpowiedzi dla tej tury kanału głosowego.
- `voice.tts` jest scalane nad `messages.tts`; wynikowy dźwięk jest odtwarzany w dołączonym kanale.

Poświadczenia są rozpoznawane dla każdego komponentu: uwierzytelnianie trasy LLM dla `voice.model`, uwierzytelnianie STT dla `tools.media.audio` i uwierzytelnianie TTS dla `messages.tts`/`voice.tts`.

### Wiadomości głosowe

Wiadomości głosowe Discord pokazują podgląd fali dźwiękowej i wymagają audio OGG/Opus. OpenClaw generuje falę dźwiękową automatycznie, ale potrzebuje `ffmpeg` i `ffprobe` na hoście gateway, aby analizować i konwertować.

- Podaj **lokalną ścieżkę pliku** (adresy URL są odrzucane).
- Pomiń treść tekstową (Discord odrzuca tekst + wiadomość głosową w tym samym ładunku).
- Akceptowany jest dowolny format audio; OpenClaw konwertuje do OGG/Opus w razie potrzeby.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Użyto niedozwolonych intencji albo bot nie widzi wiadomości gildii">

    - włącz Message Content Intent
    - włącz Server Members Intent, gdy zależysz od rozpoznawania użytkowników/członków
    - uruchom ponownie gateway po zmianie intencji

  </Accordion>

  <Accordion title="Wiadomości gildii są nieoczekiwanie blokowane">

    - zweryfikuj `groupPolicy`
    - zweryfikuj listę dozwolonych gildii pod `channels.discord.guilds`
    - jeśli istnieje mapa `channels` gildii, dozwolone są tylko wymienione kanały
    - zweryfikuj zachowanie `requireMention` i wzorce wzmianek

    Przydatne sprawdzenia:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention ma wartość false, ale nadal jest blokowane">
    Typowe przyczyny:

    - `groupPolicy="allowlist"` bez pasującej listy dozwolonych gildii/kanałów
    - `requireMention` skonfigurowane w niewłaściwym miejscu (musi być pod `channels.discord.guilds` albo wpisem kanału)
    - nadawca zablokowany przez listę dozwolonych `users` gildii/kanału

  </Accordion>

  <Accordion title="Długotrwałe tury Discord albo zduplikowane odpowiedzi">

    Typowe logi:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Pokrętła kolejki Gateway Discord:

    - jedno konto: `channels.discord.eventQueue.listenerTimeout`
    - wiele kont: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - kontroluje to tylko pracę listenera Gateway Discord, nie czas życia tury agenta

    Discord nie stosuje limitu czasu należącego do kanału do kolejkowanych tur agenta. Listenery wiadomości przekazują dalej natychmiast, a kolejkowane uruchomienia Discord zachowują kolejność w ramach sesji do czasu zakończenia cyklu życia sesji/narzędzia/środowiska wykonawczego albo przerwania pracy.

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

  <Accordion title="Ostrzeżenia o przekroczeniu czasu wyszukiwania metadanych Gateway">
    OpenClaw pobiera metadane Discord `/gateway/bot` przed połączeniem. Przejściowe awarie używają awaryjnie domyślnego adresu URL Gateway Discord i są limitowane w logach.

    Pokrętła limitu czasu metadanych:

    - jedno konto: `channels.discord.gatewayInfoTimeoutMs`
    - wiele kont: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - awaryjnie env, gdy konfiguracja jest nieustawiona: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - domyślnie: `30000` (30 sekund), maks.: `120000`

  </Accordion>

  <Accordion title="Restarty po przekroczeniu limitu czasu READY Gateway">
    OpenClaw oczekuje na zdarzenie `READY` gateway Discorda podczas uruchamiania oraz po ponownych połączeniach w czasie działania. Konfiguracje wielokontowe z rozłożonym uruchamianiem mogą wymagać dłuższego okna READY podczas uruchamiania niż domyślne.

    Ustawienia limitu czasu READY:

    - pojedyncze konto podczas uruchamiania: `channels.discord.gatewayReadyTimeoutMs`
    - wiele kont podczas uruchamiania: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - awaryjna wartość env podczas uruchamiania, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - wartość domyślna podczas uruchamiania: `15000` (15 sekund), maksimum: `120000`
    - pojedyncze konto w czasie działania: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - wiele kont w czasie działania: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - awaryjna wartość env w czasie działania, gdy konfiguracja nie jest ustawiona: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - wartość domyślna w czasie działania: `30000` (30 sekund), maksimum: `120000`

  </Accordion>

  <Accordion title="Niezgodności audytu uprawnień">
    Sprawdzanie uprawnień przez `channels status --probe` działa tylko dla numerycznych identyfikatorów kanałów.

    Jeśli używasz kluczy typu slug, dopasowanie w czasie działania nadal może działać, ale probe nie może w pełni zweryfikować uprawnień.

  </Accordion>

  <Accordion title="Problemy z DM i parowaniem">

    - DM wyłączone: `channels.discord.dm.enabled=false`
    - zasada DM wyłączona: `channels.discord.dmPolicy="disabled"` (starsze: `channels.discord.dm.policy`)
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

  <Accordion title="Zaniki STT głosu z DecryptionFailed(...)">

    - utrzymuj OpenClaw w aktualnej wersji (`openclaw update`), aby logika odzyskiwania odbioru głosu Discord była dostępna
    - potwierdź `channels.discord.voice.daveEncryption=true` (domyślnie)
    - zacznij od `channels.discord.voice.decryptionFailureTolerance=24` (domyślna wartość upstream) i dostrajaj tylko w razie potrzeby
    - obserwuj logi pod kątem:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jeśli błędy nadal występują po automatycznym ponownym dołączeniu, zbierz logi i porównaj je z historią odbioru DAVE upstream w [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) oraz [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Odniesienie konfiguracji

Główne odniesienie: [Odniesienie konfiguracji - Discord](/pl/gateway/config-channels#discord).

<Accordion title="Najważniejsze pola Discorda">

- uruchamianie/uwierzytelnianie: `enabled`, `token`, `accounts.*`, `allowBots`
- zasada: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- polecenie: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- kolejka zdarzeń: `eventQueue.listenerTimeout` (budżet listenera), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- odpowiedź/historia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (starszy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- multimedia/ponowienie: `mediaMaxMb` (ogranicza wychodzące przesyłanie do Discord, domyślnie `100MB`), `retry`
- działania: `actions.*`
- obecność: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funkcje: `threadBindings`, najwyższego poziomu `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Bezpieczeństwo i operacje

- Traktuj tokeny botów jako sekrety (w nadzorowanych środowiskach preferowane `DISCORD_BOT_TOKEN`).
- Przyznawaj uprawnienia Discord zgodnie z zasadą najmniejszych uprawnień.
- Jeśli wdrożenie poleceń lub stan są nieaktualne, zrestartuj gateway i sprawdź ponownie za pomocą `openclaw channels status --probe`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Discorda z gateway.
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
  <Card title="Routing wieloagentowy" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj serwery i kanały na agentów.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń.
  </Card>
</CardGroup>
