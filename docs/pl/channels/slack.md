---
read_when:
    - Konfigurowanie Slacka lub debugowanie trybu socket/HTTP w Slacku
summary: Konfiguracja Slacka i zachowanie środowiska uruchomieniowego (Socket Mode + HTTP Events API)
title: Slack
x-i18n:
    generated_at: "2026-04-05T13:47:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: efb37e1f04e1ac8ac3786c36ffc20013dacdc654bfa61e7f6e8df89c4902d2ab
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: gotowe do użycia produkcyjnego dla wiadomości prywatnych i kanałów przez integracje aplikacji Slack. Domyślnym trybem jest Socket Mode; obsługiwany jest również tryb HTTP Events API.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Slacka domyślnie działają w trybie parowania.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/channels/troubleshooting">
    Diagnostyka międzykanałowa i instrukcje naprawy.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Tabs>
  <Tab title="Socket Mode (domyślnie)">
    <Steps>
      <Step title="Utwórz aplikację Slack i tokeny">
        W ustawieniach aplikacji Slack:

        - włącz **Socket Mode**
        - utwórz **App Token** (`xapp-...`) z uprawnieniem `connections:write`
        - zainstaluj aplikację i skopiuj **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Skonfiguruj OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Zmienna środowiskowa zapasowa (tylko konto domyślne):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Subskrybuj zdarzenia aplikacji">
        Subskrybuj zdarzenia bota dla:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Włącz też zakładkę App Home **Messages Tab** dla wiadomości prywatnych.
      </Step>

      <Step title="Uruchom gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="Tryb HTTP Events API">
    <Steps>
      <Step title="Skonfiguruj aplikację Slack dla HTTP">

        - ustaw tryb na HTTP (`channels.slack.mode="http"`)
        - skopiuj Slack **Signing Secret**
        - ustaw Request URL dla Event Subscriptions + Interactivity + polecenia Slash na tę samą ścieżkę webhooka (domyślnie `/slack/events`)

      </Step>

      <Step title="Skonfiguruj tryb HTTP OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="Używaj unikalnych ścieżek webhooków dla wielu kont HTTP">
        Tryb HTTP dla wielu kont jest obsługiwany.

        Nadaj każdemu kontu odrębny `webhookPath`, aby rejestracje się nie kolidowały.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Lista kontrolna manifestu i zakresów

<AccordionGroup>
  <Accordion title="Przykład manifestu aplikacji Slack" defaultOpen>

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Accordion>

  <Accordion title="Opcjonalne zakresy tokena użytkownika (operacje odczytu)">
    Jeśli skonfigurujesz `channels.slack.userToken`, typowe zakresy odczytu to:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (jeśli korzystasz z odczytu wyszukiwania Slacka)

  </Accordion>
</AccordionGroup>

## Model tokenów

- `botToken` + `appToken` są wymagane dla Socket Mode.
- Tryb HTTP wymaga `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują jawne
  ciągi znaków lub obiekty SecretRef.
- Tokeny z konfiguracji mają pierwszeństwo przed zapasowymi zmiennymi środowiskowymi.
- Zapasowe zmienne środowiskowe `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` mają zastosowanie tylko do konta domyślnego.
- `userToken` (`xoxp-...`) jest dostępny tylko w konfiguracji (bez zapasowej zmiennej środowiskowej) i domyślnie działa w trybie tylko do odczytu (`userTokenReadOnly: true`).
- Opcjonalnie: dodaj `chat:write.customize`, jeśli chcesz, aby wiadomości wychodzące używały tożsamości aktywnego agenta (niestandardowa `username` i ikona). `icon_emoji` używa składni `:nazwa_emoji:`.

Zachowanie migawki statusu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status`
  dla każdego poświadczenia (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status ma wartość `available`, `configured_unavailable` lub `missing`.
- `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef
  lub inne niejawne źródło sekretu, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego
  nie mogła rozwiązać rzeczywistej wartości.
- W trybie HTTP uwzględniany jest `signingSecretStatus`; w Socket Mode
  wymaganą parą są `botTokenStatus` + `appTokenStatus`.

<Tip>
W przypadku działań/odczytów katalogu można preferować token użytkownika, jeśli jest skonfigurowany. Do zapisów nadal preferowany jest token bota; zapisy tokenem użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false` i token bota jest niedostępny.
</Tip>

## Działania i bramki

Działania Slacka są kontrolowane przez `channels.slack.actions.*`.

Dostępne grupy działań w bieżących narzędziach Slacka:

| Grupa      | Domyślnie |
| ---------- | --------- |
| messages   | włączone  |
| reactions  | włączone  |
| pins       | włączone  |
| memberInfo | włączone  |
| emojiList  | włączone  |

Obecne działania dotyczące wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` i `emoji-list`.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasady dla wiadomości prywatnych">
    `channels.slack.dmPolicy` kontroluje dostęp do wiadomości prywatnych (starsze: `channels.slack.dm.policy`):

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.slack.allowFrom` zawierało `"*"`; starsze: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flagi wiadomości prywatnych:

    - `dm.enabled` (domyślnie true)
    - `channels.slack.allowFrom` (preferowane)
    - `dm.allowFrom` (starsze)
    - `dm.groupEnabled` (grupowe wiadomości prywatne domyślnie false)
    - `dm.groupChannels` (opcjonalna lista dozwolonych MPIM)

    Pierwszeństwo dla wielu kont:

    - `channels.slack.accounts.default.allowFrom` ma zastosowanie tylko do konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Parowanie w wiadomościach prywatnych używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Zasady dla kanałów">
    `channels.slack.groupPolicy` kontroluje obsługę kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Lista dozwolonych kanałów znajduje się pod `channels.slack.channels` i powinna używać stabilnych identyfikatorów kanałów.

    Uwaga dotycząca działania: jeśli `channels.slack` całkowicie nie istnieje (konfiguracja tylko przez zmienne środowiskowe), środowisko uruchomieniowe używa wartości zapasowej `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logach (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozpoznawanie nazw/ID:

    - wpisy listy dozwolonych kanałów i wpisy listy dozwolonych wiadomości prywatnych są rozwiązywane przy starcie, gdy dostęp tokena na to pozwala
    - nierozwiązane wpisy nazw kanałów są zachowywane zgodnie z konfiguracją, ale domyślnie ignorowane przy routingu
    - autoryzacja przychodząca i routing kanałów domyślnie opierają się najpierw na ID; bezpośrednie dopasowywanie nazw użytkowników/slugów wymaga `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Wzmianki i użytkownicy kanałów">
    Wiadomości na kanałach są domyślnie ograniczane wzmiankami.

    Źródła wzmianek:

    - jawna wzmianka aplikacji (`<@botId>`)
    - wzorce regex dla wzmianek (`agents.list[].groupChat.mentionPatterns`, zapasowo `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi w wątku do bota

    Ustawienia dla każdego kanału (`channels.slack.channels.<id>`; nazwy tylko przez rozwiązywanie przy starcie lub `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista dozwolonych)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `id:`, `e164:`, `username:`, `name:` lub symbol wieloznaczny `"*"`
      (starsze klucze bez prefiksu nadal mapują się tylko do `id:`)

  </Tab>
</Tabs>

## Wątki, sesje i tagi odpowiedzi

- Wiadomości prywatne są routowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Przy domyślnym `session.dmScope=main` wiadomości prywatne Slacka są scalane do głównej sesji agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Odpowiedzi w wątkach mogą tworzyć sufiksy sesji wątku (`:thread:<threadTs>`) tam, gdzie ma to zastosowanie.
- Domyślna wartość `channels.slack.thread.historyScope` to `thread`; domyślna wartość `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` kontroluje, ile istniejących wiadomości w wątku jest pobieranych przy rozpoczęciu nowej sesji wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).

Ustawienia odpowiedzi w wątkach:

- `channels.slack.replyToMode`: `off|first|all` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: dla każdego z `direct|group|channel`
- starsza wartość zapasowa dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Obsługiwane są ręczne tagi odpowiedzi:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Uwaga: `replyToMode="off"` wyłącza **całe** odpowiadanie w wątkach w Slacku, w tym jawne tagi `[[reply_to_*]]`. Różni się to od Telegrama, gdzie jawne tagi są nadal honorowane w trybie `"off"`. Ta różnica odzwierciedla modele wątków na platformach: w Slacku wątki ukrywają wiadomości z kanału, podczas gdy odpowiedzi w Telegramie pozostają widoczne w głównym przepływie czatu.

## Reakcje potwierdzenia

`ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- zapasowo emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"eyes"`).
- Użyj `""`, aby wyłączyć reakcję dla konta Slack lub globalnie.

## Strumieniowanie tekstu

`channels.slack.streaming` kontroluje zachowanie podglądu na żywo:

- `off`: wyłącz strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastąp tekst podglądu najnowszym częściowym wynikiem.
- `block`: dodawaj porcjowane aktualizacje podglądu.
- `progress`: pokazuj tekst statusu postępu podczas generowania, a następnie wyślij końcowy tekst.

`channels.slack.nativeStreaming` kontroluje natywne strumieniowanie tekstu Slacka, gdy `streaming` ma wartość `partial` (domyślnie: `true`).

- Aby natywne strumieniowanie tekstu było widoczne, musi być dostępny wątek odpowiedzi. Wybór wątku nadal podlega `replyToMode`. Bez niego używany jest zwykły roboczy podgląd.
- Media i ładunki inne niż tekst wracają do zwykłego dostarczania.
- Jeśli strumieniowanie nie powiedzie się w trakcie odpowiedzi, OpenClaw wraca do zwykłego dostarczania pozostałych ładunków.

Użyj roboczego podglądu zamiast natywnego strumieniowania tekstu Slacka:

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

Starsze klucze:

- `channels.slack.streamMode` (`replace | status_final | append`) jest automatycznie migrowane do `channels.slack.streaming`.
- logiczne `channels.slack.streaming` jest automatycznie migrowane do `channels.slack.nativeStreaming`.

## Zapasowa reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slacka, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu działania. Jest to najbardziej przydatne poza odpowiedziami w wątkach, które używają domyślnego wskaźnika statusu „pisze...”.

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"hourglass_flowing_sand"`).
- Reakcja jest podejmowana w trybie best-effort, a próba wyczyszczenia następuje automatycznie po odpowiedzi lub po zakończeniu ścieżki błędu.

## Media, porcjowanie i dostarczanie

<AccordionGroup>
  <Accordion title="Załączniki przychodzące">
    Załączniki plików Slacka są pobierane z prywatnych adresów URL hostowanych przez Slacka (przepływ żądania uwierzytelnianego tokenem) i zapisywane w magazynie mediów, gdy pobranie się powiedzie i pozwalają na to limity rozmiaru.

    Limit rozmiaru danych przychodzących w środowisku uruchomieniowym domyślnie wynosi `20MB`, chyba że zostanie nadpisany przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Tekst i pliki wychodzące">
    - porcje tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie najpierw według akapitów
    - wysyłanie plików używa API przesyłania Slacka i może obejmować odpowiedzi w wątkach (`thread_ts`)
    - limit mediów wychodzących jest zgodny z `channels.slack.mediaMaxMb`, jeśli jest skonfigurowany; w przeciwnym razie wysyłanie kanałowe używa domyślnych wartości typu MIME z pipeline'u mediów
  </Accordion>

  <Accordion title="Cele dostarczania">
    Preferowane jawne cele:

    - `user:<id>` dla wiadomości prywatnych
    - `channel:<id>` dla kanałów

    Wiadomości prywatne Slacka są otwierane przez API konwersacji Slacka podczas wysyłania do celów użytkownika.

  </Accordion>
</AccordionGroup>

## Polecenia i zachowanie poleceń slash

- Natywny tryb automatyczny poleceń jest **wyłączony** dla Slacka (`commands.native: "auto"` nie włącza natywnych poleceń Slacka).
- Włącz natywne obsługiwacze poleceń Slacka za pomocą `channels.slack.commands.native: true` (lub globalnego `commands.native: true`).
- Gdy natywne polecenia są włączone, zarejestruj pasujące polecenia slash w Slacku (nazwy `/<command>`), z jednym wyjątkiem:
  - zarejestruj `/agentstatus` dla polecenia statusu (Slack rezerwuje `/status`)
- Jeśli natywne polecenia nie są włączone, możesz uruchamiać pojedyncze skonfigurowane polecenie slash przez `channels.slack.slashCommand`.
- Natywne menu argumentów dostosowują teraz strategię renderowania:
  - do 5 opcji: bloki przycisków
  - 6-100 opcji: statyczne menu wyboru
  - ponad 100 opcji: wybór zewnętrzny z asynchronicznym filtrowaniem opcji, gdy dostępne są obsługiwacze opcji interaktywności
  - jeśli zakodowane wartości opcji przekroczą limity Slacka, przepływ wraca do przycisków
- Dla długich ładunków opcji menu argumentów poleceń slash używają okna potwierdzenia przed wysłaniem wybranej wartości.

Domyślne ustawienia poleceń slash:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Sesje slash używają izolowanych kluczy:

- `agent:<agentId>:slack:slash:<userId>`

i nadal kierują wykonanie poleceń względem docelowej sesji konwersacji (`CommandTargetSessionKey`).

## Odpowiedzi interaktywne

Slack może renderować interaktywne kontrolki odpowiedzi tworzone przez agenta, ale ta funkcja jest domyślnie wyłączona.

Włącz ją globalnie:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Lub włącz ją tylko dla jednego konta Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Gdy funkcja jest włączona, agenci mogą emitować dyrektywy odpowiedzi tylko dla Slacka:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Te dyrektywy są kompilowane do Slack Block Kit i kierują kliknięcia lub wybory z powrotem przez istniejącą ścieżkę zdarzeń interakcji Slacka.

Uwagi:

- Jest to interfejs specyficzny dla Slacka. Inne kanały nie tłumaczą dyrektyw Slack Block Kit na własne systemy przycisków.
- Wartości interaktywnych callbacków to nieprzezroczyste tokeny generowane przez OpenClaw, a nie surowe wartości tworzone przez agenta.
- Jeśli wygenerowane bloki interaktywne przekroczyłyby limity Slack Block Kit, OpenClaw wraca do oryginalnej odpowiedzi tekstowej zamiast wysyłać nieprawidłowy ładunek bloków.

## Zatwierdzenia exec w Slacku

Slack może działać jako natywny klient zatwierdzeń z interaktywnymi przyciskami i interakcjami, zamiast wracać do interfejsu Web UI lub terminala.

- Zatwierdzenia exec używają `channels.slack.execApprovals.*` do natywnego routingu wiadomości prywatnych/kanałów.
- Zatwierdzenia pluginów mogą nadal być rozstrzygane przez tę samą natywną powierzchnię przycisków Slacka, gdy żądanie już trafia do Slacka, a rodzaj identyfikatora zatwierdzenia to `plugin:`.
- Autoryzacja zatwierdzających nadal jest egzekwowana: tylko użytkownicy zidentyfikowani jako zatwierdzający mogą zatwierdzać lub odrzucać żądania przez Slack.

Wykorzystuje to tę samą współdzieloną powierzchnię przycisków zatwierdzeń co inne kanały. Gdy w ustawieniach aplikacji Slack włączona jest `interactivity`, prośby o zatwierdzenie są renderowane bezpośrednio w konwersacji jako przyciski Block Kit.
Gdy te przyciski są obecne, stanowią podstawowy interfejs zatwierdzania; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia wskazuje, że zatwierdzenia na czacie
są niedostępne lub ręczne zatwierdzenie jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalne; gdy to możliwe, wraca do `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i zostanie rozstrzygnięty co najmniej jeden
zatwierdzający. Ustaw `enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzeń.
Ustaw `enabled: true`, aby wymusić włączenie natywnych zatwierdzeń po rozstrzygnięciu zatwierdzających.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzeń exec dla Slacka:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Jawna konfiguracja natywna Slacka jest potrzebna tylko wtedy, gdy chcesz nadpisać zatwierdzających, dodać filtry lub
włączyć dostarczanie do czatu źródłowego:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Współdzielone przekazywanie `approvals.exec` jest oddzielne. Używaj go tylko wtedy, gdy prośby o zatwierdzenie exec muszą być również
kierowane do innych czatów lub jawnych celów poza pasmem. Współdzielone przekazywanie `approvals.plugin` także jest
oddzielne; natywne przyciski Slacka nadal mogą rozstrzygać zatwierdzenia pluginów, gdy te żądania już trafiają
do Slacka.

Polecenie `/approve` w tym samym czacie działa także w kanałach i wiadomościach prywatnych Slacka, które już obsługują polecenia. Pełny model przekazywania zatwierdzeń znajdziesz w [Zatwierdzenia exec](/tools/exec-approvals).

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości i rozgłoszenia wątków są mapowane na zdarzenia systemowe.
- Zdarzenia dodania/usunięcia reakcji są mapowane na zdarzenia systemowe.
- Zdarzenia dołączenia/opuszczenia członka, utworzenia/zmiany nazwy kanału oraz dodania/usunięcia pinezki są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanału, gdy włączone jest `configWrites`.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą być wstrzykiwane do kontekstu routingu.
- Inicjator wątku i początkowe zasiewanie kontekstu historii wątku są filtrowane według skonfigurowanych list dozwolonych nadawców, gdy ma to zastosowanie.
- Akcje bloków i interakcje modalne emitują ustrukturyzowane zdarzenia systemowe `Slack interaction: ...` z bogatymi polami ładunku:
  - akcje bloków: wybrane wartości, etykiety, wartości selektorów i metadane `workflow_*`
  - zdarzenia modalne `view_submission` i `view_closed` z kierowanymi metadanymi kanału i danymi wejściowymi formularza

## Wskaźniki do dokumentacji konfiguracji

Główne odwołanie:

- [Dokumentacja konfiguracji - Slack](/gateway/configuration-reference#slack)

  Najważniejsze pola Slacka:
  - tryb/uwierzytelnianie: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - dostęp do wiadomości prywatnych: `dm.enabled`, `dmPolicy`, `allowFrom` (starsze: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - przełącznik zgodności: `dangerouslyAllowNameMatching` (tylko awaryjnie; pozostaw wyłączone, jeśli nie jest potrzebne)
  - dostęp do kanałów: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - wątki/historia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - operacje/funkcje: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak odpowiedzi na kanałach">
    Sprawdź po kolei:

    - `groupPolicy`
    - lista dozwolonych kanałów (`channels.slack.channels`)
    - `requireMention`
    - lista dozwolonych `users` dla kanału

    Przydatne polecenia:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Wiadomości prywatne są ignorowane">
    Sprawdź:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (lub starsze `channels.slack.dm.policy`)
    - zatwierdzenia parowania / wpisy listy dozwolonych

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Tryb Socket nie łączy się">
    Zweryfikuj tokeny bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` lub
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło rozwiązać wartości
    opartej na SecretRef.

  </Accordion>

  <Accordion title="Tryb HTTP nie odbiera zdarzeń">
    Zweryfikuj:

    - signing secret
    - ścieżkę webhooka
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - unikalny `webhookPath` dla każdego konta HTTP

    Jeśli w migawkach konta pojawia się `signingSecretStatus: "configured_unavailable"`,
    konto HTTP jest skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło
    rozwiązać signing secret opartego na SecretRef.

  </Accordion>

  <Accordion title="Natywne/polecenia slash nie działają">
    Sprawdź, czy zamierzeniem było:

    - natywny tryb poleceń (`channels.slack.commands.native: true`) z pasującymi poleceniami slash zarejestrowanymi w Slacku
    - czy tryb pojedynczego polecenia slash (`channels.slack.slashCommand.enabled: true`)

    Sprawdź także `commands.useAccessGroups` oraz listy dozwolonych kanałów/użytkowników.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Rozwiązywanie problemów](/channels/troubleshooting)
- [Konfiguracja](/gateway/configuration)
- [Polecenia slash](/tools/slash-commands)
