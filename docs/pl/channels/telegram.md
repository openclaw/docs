---
read_when:
    - Praca nad funkcjami Telegram lub Webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:02:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ef1b019a6a0e261b33972b5edffaedd29310b1333d112bade2e79e9d56887c6
    source_path: channels/telegram.md
    workflow: 16
---

Gotowe do użycia produkcyjnego dla wiadomości prywatnych botów i grup za pomocą grammY. Domyślnym trybem jest długie odpytywanie; tryb Webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną polityką wiadomości prywatnych dla Telegram jest parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce i przykłady konfiguracji kanałów.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Utwórz token bota w BotFather">
    Otwórz Telegram i porozmawiaj z **@BotFather** (upewnij się, że nazwa to dokładnie `@BotFather`).

    Uruchom `/newbot`, wykonaj instrukcje i zapisz token.

  </Step>

  <Step title="Skonfiguruj token i politykę wiadomości prywatnych">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Zapasowa zmienna środowiskowa: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w konfiguracji/środowisku, a następnie uruchom gateway.

  </Step>

  <Step title="Uruchom gateway i zatwierdź pierwszą wiadomość prywatną">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kody parowania wygasają po 1 godzinie.

  </Step>

  <Step title="Dodaj bota do grupy">
    Dodaj bota do swojej grupy, a następnie ustaw `channels.telegram.groups` i `groupPolicy` zgodnie ze swoim modelem dostępu.
  </Step>
</Steps>

<Note>
Kolejność rozwiązywania tokena uwzględnia konto. W praktyce wartości z konfiguracji mają pierwszeństwo przed zapasową zmienną środowiskową, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność grup">
    Boty Telegram domyślnie używają **trybu prywatności**, który ogranicza wiadomości grupowe otrzymywane przez bota.

    Jeśli bot musi widzieć wszystkie wiadomości grupowe:

    - wyłącz tryb prywatności za pomocą `/setprivacy`, albo
    - nadaj botowi uprawnienia administratora grupy.

    Po przełączeniu trybu prywatności usuń i ponownie dodaj bota w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty administracyjne otrzymują wszystkie wiadomości grupowe, co jest przydatne dla stale aktywnego działania w grupie.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić na dodawanie do grup lub je zablokować
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka wiadomości prywatnych">
    `channels.telegram.dmPolicy` kontroluje dostęp do wiadomości bezpośrednich:

    - `pairing` (domyślne)
    - `allowlist` (wymaga co najmniej jednego ID nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` pozwala każdemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, wydawać polecenia botowi. Używaj tego tylko dla celowo publicznych botów z mocno ograniczonymi narzędziami; boty z jednym właścicielem powinny używać `allowlist` z numerycznymi ID użytkowników.

    `channels.telegram.allowFrom` przyjmuje numeryczne ID użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach wielokontowych restrykcyjne `channels.telegram.allowFrom` najwyższego poziomu jest traktowane jako granica bezpieczeństwa: wpisy `allowFrom: ["*"]` na poziomie konta nie czynią tego konta publicznym, chyba że efektywna lista dozwolonych kont po scaleniu nadal zawiera jawny symbol wieloznaczny.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie wiadomości prywatne i jest odrzucane przez walidację konfiguracji.
    Konfiguracja prosi wyłącznie o numeryczne ID użytkowników.
    Jeśli wykonano aktualizację i konfiguracja zawiera wpisy listy dozwolonych w formacie `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (w miarę możliwości; wymaga tokena bota Telegram).
    Jeśli wcześniej używano plików listy dozwolonych z magazynu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach z listą dozwolonych (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych ID).

    Dla botów z jednym właścicielem preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi ID `allowFrom`, aby polityka dostępu była trwale zapisana w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnych nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp do wiadomości prywatnych. Jeśli nie ma jeszcze właściciela poleceń, pierwsze zatwierdzone parowanie ustawia również `commands.ownerAllowFrom`, aby polecenia tylko dla właściciela i zatwierdzenia wykonywania miały jawne konto operatora.
    Autoryzacja nadawcy w grupie nadal pochodzi z jawnych list dozwolonych w konfiguracji.
    Jeśli chcesz, aby „jestem autoryzowany raz i działają zarówno wiadomości prywatne, jak i polecenia grupowe”, umieść swoje numeryczne ID użytkownika Telegram w `channels.telegram.allowFrom`; dla poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

    ### Znajdowanie swojego ID użytkownika Telegram

    Bezpieczniej (bez bota zewnętrznego):

    1. Wyślij wiadomość prywatną do swojego bota.
    2. Uruchom `openclaw logs --follow`.
    3. Odczytaj `from.id`.

    Oficjalna metoda Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metoda zewnętrzna (mniej prywatna): `@userinfobot` lub `@getidsbot`.

  </Tab>

  <Tab title="Polityka grup i listy dozwolonych">
    Dwie kontrolki działają razem:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - z `groupPolicy: "open"`: dowolna grupa może przejść kontrole ID grupy
         - z `groupPolicy: "allowlist"` (domyślne): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - `groups` skonfigurowane: działa jako lista dozwolonych (jawne ID lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślne)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców grupowych. Jeśli nie jest ustawione, Telegram wraca do `allowFrom`.
    Wpisy `groupAllowFrom` powinny być numerycznymi ID użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj ID czatów grup Telegram ani supergrup w `groupAllowFrom`. Ujemne ID czatów należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): uwierzytelnianie nadawcy grupowego **nie** dziedziczy zatwierdzeń z magazynu parowania wiadomości prywatnych.
    Parowanie pozostaje tylko dla wiadomości prywatnych. Dla grup ustaw `groupAllowFrom` albo `allowFrom` na poziomie grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram używa zapasowo `allowFrom` z konfiguracji, a nie magazynu parowania.
    Praktyczny wzorzec dla botów z jednym właścicielem: ustaw swoje ID użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na docelowe grupy w `channels.telegram.groups`.
    Uwaga dotycząca środowiska uruchomieniowego: jeśli całkowicie brakuje `channels.telegram`, środowisko uruchomieniowe domyślnie działa w trybie bezpiecznie zamkniętym `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest ustawione jawnie.

    Przykład: zezwól dowolnemu członkowi w jednej konkretnej grupie:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Przykład: zezwól tylko określonym użytkownikom w jednej konkretnej grupie:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Częsty błąd: `groupAllowFrom` nie jest listą dozwolonych grup Telegram.

      - Umieszczaj ujemne ID czatów grup Telegram lub supergrup, takie jak `-1001234567890`, pod `channels.telegram.groups`.
      - Umieszczaj ID użytkowników Telegram, takie jak `8734062810`, pod `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą wywoływać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby każdy członek dozwolonej grupy mógł rozmawiać z botem.

    </Warning>

  </Tab>

  <Tab title="Zachowanie wzmianek">
    Odpowiedzi grupowe domyślnie wymagają wzmianki.

    Wzmianka może pochodzić z:

    - natywnej wzmianki `@botusername`, albo
    - wzorców wzmianek w:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Przełączniki poleceń na poziomie sesji:

    - `/activation always`
    - `/activation mention`

    Aktualizują one wyłącznie stan sesji. Użyj konfiguracji dla trwałości.

    Przykład trwałej konfiguracji:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Uzyskiwanie ID czatu grupowego:

    - przekaż wiadomość grupową do `@userinfobot` / `@getidsbot`
    - albo odczytaj `chat.id` z `openclaw logs --follow`
    - albo sprawdź `getUpdates` Bot API

  </Tab>
</Tabs>

## Zachowanie w środowisku uruchomieniowym

- Telegram jest obsługiwany przez proces gateway.
- Routing jest deterministyczny: wiadomości przychodzące z Telegram otrzymują odpowiedzi w Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do współdzielonej koperty kanału z metadanymi odpowiedzi i placeholderami multimediów.
- Sesje grupowe są izolowane według ID grupy. Tematy forum dopisują `:topic:<threadId>`, aby utrzymać izolację tematów.
- Wiadomości prywatne mogą zawierać `message_thread_id`; OpenClaw zachowuje ID wątku dla odpowiedzi, ale domyślnie utrzymuje wiadomości prywatne w płaskiej sesji. Skonfiguruj `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` albo pasującą konfigurację tematu, gdy celowo chcesz izolacji sesji tematu w wiadomościach prywatnych.
- Długie odpytywanie używa runnera grammY z sekwencjonowaniem per czat/per wątek. Ogólna współbieżność ujścia runnera używa `agents.defaults.maxConcurrent`.
- Długie odpytywanie jest chronione wewnątrz każdego procesu gateway, tak aby tylko jeden aktywny poller mógł używać tokena bota w danym czasie. Jeśli nadal widzisz konflikty `getUpdates` 409, inny gateway OpenClaw, skrypt lub zewnętrzny poller prawdopodobnie używa tego samego tokena.
- Ponowne uruchomienia watchdog długiego odpytywania są domyślnie wyzwalane po 120 sekundach bez ukończonej żywotności `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy wdrożenie nadal widzi fałszywe ponowne uruchomienia z powodu zatrzymania odpytywania podczas długotrwałej pracy. Wartość jest w milisekundach i może wynosić od `30000` do `600000`; obsługiwane są nadpisania per konto.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Opis funkcji

<AccordionGroup>
  <Accordion title="Podgląd transmisji na żywo (edycje wiadomości)">
    OpenClaw może strumieniować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` to `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` utrzymuje jeden edytowalny szkic statusu i aktualizuje go postępem narzędzia aż do ostatecznego dostarczenia
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzia/postępu ponownie używają tej samej edytowanej wiadomości podglądu (domyślnie: `true`, gdy strumieniowanie podglądu jest aktywne)
    - `streaming.preview.commandText` kontroluje szczegóły polecenia/wykonania w tych wierszach postępu narzędzia: `raw` (domyślne, zachowuje wydane zachowanie) albo `status` (tylko etykieta narzędzia)
    - starsze `channels.telegram.streamMode` i logiczne wartości `streaming` są wykrywane; uruchom `openclaw doctor --fix`, aby zmigrować je do `channels.telegram.streaming.mode`

    Aktualizacje podglądu postępu narzędzi to krótkie wiersze statusu pokazywane podczas działania narzędzi, na przykład wykonywanie poleceń, odczyty plików, aktualizacje planowania lub podsumowania poprawek. Telegram domyślnie pozostawia je włączone, aby odpowiadały wydanemu zachowaniu OpenClaw od `v2026.4.22` i nowszych. Aby zachować edytowany podgląd dla tekstu odpowiedzi, ale ukryć wiersze postępu narzędzi, ustaw:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Aby zachować widoczny postęp narzędzi, ale ukryć tekst polecenia/wykonania, ustaw:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    W trybie wersji roboczej postępu umieść tę samą politykę tekstu polecenia pod `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
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

    Używaj `streaming.mode: "off"` tylko wtedy, gdy chcesz dostarczać wyłącznie odpowiedzi końcowe: edycje podglądu Telegram są wyłączone, a ogólne komunikaty narzędzi/postępu są wyciszane zamiast wysyłane jako osobne wiadomości statusu. Monity zatwierdzeń, ładunki multimedialne i błędy nadal przechodzą przez normalne dostarczanie końcowe. Użyj `streaming.preview.toolProgress: false`, gdy chcesz zachować tylko edycje podglądu odpowiedzi, ukrywając wiersze statusu postępu narzędzi.

    <Note>
      Wyjątkiem są odpowiedzi Telegram z wybranym cytatem. Gdy `replyToMode` ma wartość `"first"`, `"all"` lub `"batched"` i wiadomość przychodząca zawiera wybrany tekst cytatu, OpenClaw wysyła odpowiedź końcową przez natywną ścieżkę odpowiedzi z cytatem Telegram zamiast edytować podgląd odpowiedzi, więc `streaming.preview.toolProgress` nie może pokazać krótkich wierszy statusu dla tej tury. Odpowiedzi na bieżącą wiadomość bez wybranego tekstu cytatu nadal zachowują strumieniowanie podglądu. Ustaw `replyToMode: "off"`, gdy widoczność postępu narzędzi jest ważniejsza niż natywne odpowiedzi z cytatem, albo ustaw `streaming.preview.toolProgress: false`, aby zaakceptować ten kompromis.
    </Note>

    Dla odpowiedzi tekstowych:

    - krótkie podglądy w DM/grupie/temacie: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu, chyba że po pojawieniu się podglądu wysłano widoczną wiadomość niebędącą podglądem
    - podglądy, po których następuje widoczna treść niebędąca podglądem: OpenClaw wysyła ukończoną odpowiedź jako nową wiadomość końcową i usuwa starszy podgląd, dzięki czemu odpowiedź końcowa pojawia się po treści pośredniej
    - podglądy starsze niż około jedna minuta: OpenClaw wysyła ukończoną odpowiedź jako nową wiadomość końcową, a następnie usuwa podgląd, dzięki czemu widoczny znacznik czasu Telegram odzwierciedla czas ukończenia zamiast czasu utworzenia podglądu

    W przypadku złożonych odpowiedzi (na przykład ładunków multimedialnych) OpenClaw wraca do normalnego dostarczania końcowego, a następnie usuwa wiadomość podglądu.

    Strumieniowanie podglądu jest niezależne od strumieniowania bloków. Gdy strumieniowanie bloków jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - podgląd rozumowania jest usuwany po dostarczeniu odpowiedzi końcowej; użyj `/reasoning on`, gdy rozumowanie ma pozostać widoczne
    - odpowiedź końcowa jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i awaryjne użycie HTML">
    Tekst wychodzący używa Telegram `parse_mode: "HTML"`.

    - Tekst podobny do Markdown jest renderowany do HTML bezpiecznego dla Telegram.
    - Surowy HTML z modelu jest escapowany, aby ograniczyć błędy parsowania Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponawia próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć za pomocą `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Polecenia natywne i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana przy starcie przez `setMyCommands`.

    Domyślne ustawienia poleceń natywnych:

    - `commands.native: "auto"` włącza polecenia natywne dla Telegram

    Dodaj niestandardowe wpisy menu poleceń:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Reguły:

    - nazwy są normalizowane (usunięcie początkowego `/`, małe litery)
    - prawidłowy wzorzec: `a-z`, `0-9`, `_`, długość `1..32`
    - polecenia niestandardowe nie mogą nadpisywać poleceń natywnych
    - konflikty/duplikaty są pomijane i logowane

    Uwagi:

    - polecenia niestandardowe są wyłącznie wpisami menu; nie implementują automatycznie zachowania
    - polecenia plugin/skill mogą nadal działać po wpisaniu, nawet jeśli nie są widoczne w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/plugin mogą nadal zostać zarejestrowane, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przekroczyło limit po przycięciu; ogranicz polecenia plugin/skill/niestandardowe albo wyłącz `channels.telegram.commands.native`.
    - Niepowodzenie `deleteWebhook`, `deleteMyCommands` lub `setMyCommands` z `404: Not Found`, gdy bezpośrednie polecenia curl Bot API działają, może oznaczać, że `channels.telegram.apiRoot` ustawiono na pełny punkt końcowy `/bot<TOKEN>`. `apiRoot` musi być tylko katalogiem głównym Bot API, a `openclaw doctor --fix` usuwa przypadkowy końcowy `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Zaktualizuj `botToken`, `tokenFile` lub `TELEGRAM_BOT_TOKEN` bieżącym tokenem BotFather; OpenClaw zatrzymuje się przed odpytywaniem, więc nie jest to zgłaszane jako błąd czyszczenia Webhook.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzące DNS/HTTPS do `api.telegram.org` jest zablokowane.

    ### Polecenia parowania urządzeń (Plugin `device-pair`)

    Gdy Plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym rolę/zakresy)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji zawiera krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap utrzymuje token węzła głównego przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Sprawdzenia zakresów bootstrap mają prefiks roli, więc ta lista dozwolonych operatora spełnia tylko żądania operatora; role nieoperatorskie nadal wymagają zakresów pod własnym prefiksem roli.

    Jeśli urządzenie ponawia próbę ze zmienionymi szczegółami uwierzytelniania (na przykład rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie jest zastępowane, a nowe żądanie używa innego `requestId`. Uruchom ponownie `/pair pending` przed zatwierdzeniem.

    Więcej szczegółów: [Parowanie](/pl/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Przyciski inline">
    Skonfiguruj zakres klawiatury inline:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Nadpisanie dla konta:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Zakresy:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (domyślnie)

    Starsze `capabilities: ["inlineButtons"]` mapuje się na `inlineButtons: "all"`.

    Przykład akcji wiadomości:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Kliknięcia callback są przekazywane agentowi jako tekst:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Akcje wiadomości Telegram dla agentów i automatyzacji">
    Akcje narzędzi Telegram obejmują:

    - `sendMessage` (`to`, `content`, opcjonalnie `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcjonalnie `iconColor`, `iconCustomEmojiId`)

    Akcje wiadomości kanału udostępniają ergonomiczne aliasy (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrolki bramkowania:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w czasie działania używają aktywnej migawki konfiguracji/sekretów (start/przeładowanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdym wysłaniu.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątkowania odpowiedzi">
    Telegram obsługuje jawne tagi wątkowania odpowiedzi w wygenerowanej treści:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na konkretny identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` steruje obsługą:

    - `off` (domyślnie)
    - `first`
    - `all`

    Gdy wątkowanie odpowiedzi jest włączone i oryginalny tekst lub podpis Telegram jest dostępny, OpenClaw automatycznie dołącza natywny fragment cytatu Telegram. Telegram ogranicza natywny tekst cytatu do 1024 jednostek kodu UTF-16, więc dłuższe wiadomości są cytowane od początku i wracają do zwykłej odpowiedzi, jeśli Telegram odrzuci cytat.

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal respektowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematów dopisują `:topic:<threadId>`
    - odpowiedzi i wskaźnik pisania są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Szczególny przypadek tematu ogólnego (`threadId=1`):

    - wysyłki wiadomości pomijają `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje pisania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy z domyślnych ustawień grupy.

    **Routing agentów według tematów**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własny izolowany obszar roboczy, pamięć i sesję. Przykład:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Każdy temat ma wtedy własny klucz sesji: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Trwałe powiązanie tematu ACP**: Tematy forum mogą przypinać sesje uprzęży ACP przez typowane powiązania ACP najwyższego poziomu (`bindings[]` z `type: "acp"` i `match.channel: "telegram"`, `peer.kind: "group"` oraz identyfikatorem z kwalifikatorem tematu, takim jak `-1001234567890:topic:42`). Obecnie zakres jest ograniczony do tematów forum w grupach/supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Uruchamianie ACP z czatu powiązane z wątkiem**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne wiadomości trafiają tam bezpośrednio. OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga, aby `channels.telegram.threadBindings.spawnSessions` pozostało włączone (domyślnie: `true`).

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` domyślnie zachowują routing DM i metadane odpowiedzi w płaskich sesjach; używają kluczy sesji świadomych wątku tylko wtedy, gdy skonfigurowano `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` albo pasującą konfigurację tematu. Użyj nadrzędnego `channels.telegram.dm.threadReplies` jako ustawienia domyślnego konta albo `direct.<chatId>.threadReplies` dla pojedynczego DM.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie jako notatki głosowej
    - przychodzące transkrypcje notatek głosowych są ujmowane w kontekście agenta jako wygenerowany maszynowo,
      niezaufany tekst; wykrywanie wzmianki nadal używa surowej
      transkrypcji, więc wiadomości głosowe wymagające wzmianki nadal działają.

    Przykład akcji wiadomości:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Wiadomości wideo

    Telegram rozróżnia pliki wideo i notatki wideo.

    Przykład akcji wiadomości:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Notatki wideo nie obsługują podpisów; podany tekst wiadomości jest wysyłany osobno.

    ### Naklejki

    Obsługa przychodzących naklejek:

    - statyczny WEBP: pobierany i przetwarzany (placeholder `<media:sticker>`)
    - animowany TGS: pomijany
    - wideo WEBM: pomijany

    Pola kontekstu naklejki:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Plik pamięci podręcznej naklejek:

    - `~/.openclaw/telegram/sticker-cache.json`

    Naklejki są opisywane raz (gdy to możliwe) i buforowane, aby ograniczyć powtarzające się wywołania wizyjne.

    Włącz akcje naklejek:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Wyślij akcję naklejki:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Przeszukaj zapisane w pamięci podręcznej naklejki:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Reakcje Telegram przychodzą jako aktualizacje `message_reaction` (oddzielnie od ładunków wiadomości).

    Po włączeniu OpenClaw kolejkowuje zdarzenia systemowe takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza wyłącznie reakcje użytkowników na wiadomości wysłane przez bota (best-effort przez pamięć podręczną wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrole dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie podaje identyfikatorów wątków w aktualizacjach reakcji.
      - grupy bez forum są kierowane do sesji czatu grupowego
      - grupy forum są kierowane do ogólnej sesji tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla polling/Webhook automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje ack">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozstrzygania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - awaryjne emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji ze zdarzeń i poleceń Telegram">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grupy (`migrate_to_chat_id`) aktualizujące `channels.telegram.groups`
    - `/config set` i `/config unset` (wymaga włączenia poleceń)

    Wyłącz:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling a Webhook">
    Domyślnie używany jest long polling. Dla trybu Webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (domyślnie `/telegram-webhook`, `127.0.0.1`, `8787`).

    Lokalny listener wiąże się z `127.0.0.1:8787`. Dla publicznego ruchu przychodzącego umieść reverse proxy przed lokalnym portem albo celowo ustaw `webhookHost: "0.0.0.0"`.

    Tryb Webhook sprawdza zabezpieczenia żądania, tajny token Telegram i treść JSON przed zwróceniem `200` do Telegram.
    Następnie OpenClaw przetwarza aktualizację asynchronicznie przez te same pasy bota per czat/per temat, których używa long polling, więc wolne tury agenta nie blokują ACK dostarczenia Telegram.

  </Accordion>

  <Accordion title="Limity, ponawianie i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów Telegram.
    - `channels.telegram.mediaGroupFlushMs` (domyślnie 500) kontroluje, jak długo albumy/grupy multimediów Telegram są buforowane, zanim OpenClaw wyśle je jako jedną wiadomość przychodzącą. Zwiększ tę wartość, jeśli części albumu przychodzą z opóźnieniem; zmniejsz ją, aby ograniczyć opóźnienie odpowiedzi na album.
    - `channels.telegram.timeoutSeconds` nadpisuje timeout klienta API Telegram (jeśli nie ustawiono, obowiązuje domyślna wartość grammY). Klienci bota ograniczają skonfigurowane wartości poniżej 60-sekundowej straży żądań wychodzących tekstu/pisania, aby grammY nie przerwał dostarczenia widocznej odpowiedzi, zanim straż transportu OpenClaw i fallback zdążą zadziałać. Long polling nadal używa 45-sekundowej straży żądania `getUpdates`, aby bezczynne odpytywania nie były porzucane w nieskończoność.
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; ustawiaj w zakresie od `30000` do `600000` tylko przy fałszywie dodatnich restartach z powodu zastoju polling.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` albo `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania jest obecnie przekazywany w takiej postaci, w jakiej został odebrany.
    - listy dozwolonych Telegram przede wszystkim kontrolują, kto może wyzwolić agenta, a nie stanowią pełnej granicy redakcji dodatkowego kontekstu.
    - Kontrole historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfiguracja `channels.telegram.retry` ma zastosowanie do helperów wysyłania Telegram (CLI/narzędzia/akcje) dla możliwych do odzyskania błędów wychodzącego API. Dostarczenie końcowej odpowiedzi przychodzącej także używa ograniczonego bezpiecznego ponowienia wysyłki dla awarii Telegram przed połączeniem, ale nie ponawia niejednoznacznych kopert sieciowych po wysłaniu, które mogłyby zduplikować widoczne wiadomości.

    Cel wysyłki CLI może być numerycznym ID czatu albo nazwą użytkownika:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Ankiety Telegram używają `openclaw message poll` i obsługują tematy forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flagi ankiet tylko dla Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` dla tematów forum (albo użyj celu `:topic:`)

    Wysyłanie Telegram obsługuje także:

    - `--presentation` z blokami `buttons` dla klawiatur inline, gdy pozwala na to `channels.telegram.capabilities.inlineButtons`
    - `--pin` albo `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać w tym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć lub przesyłanych animowanych multimediów

    Bramkowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając zwykłe wysyłki włączone

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM zatwierdzających i może opcjonalnie publikować monity w czacie lub temacie źródłowym. Zatwierdzający muszą być numerycznymi identyfikatorami użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy da się rozwiązać co najmniej jednego zatwierdzającego)
    - `channels.telegram.execApprovals.approvers` (używa awaryjnie numerycznych ID właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` kontrolują, kto może rozmawiać z botem i gdzie bot wysyła zwykłe odpowiedzi. Nie czynią nikogo zatwierdzającym exec. Pierwsze zatwierdzone parowanie DM inicjalizuje `commands.ownerAllowFrom`, gdy nie istnieje jeszcze właściciel poleceń, więc konfiguracja z jednym właścicielem nadal działa bez duplikowania ID pod `execApprovals.approvers`.

    Dostarczenie do kanału pokazuje tekst polecenia na czacie; włączaj `channel` albo `both` tylko w zaufanych grupach/tematach. Gdy monit trafia do tematu forum, OpenClaw zachowuje temat dla monitu zatwierdzenia i dalszej wiadomości. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline także wymagają, aby `channels.telegram.capabilities.inlineButtons` pozwalało na docelową powierzchnię (`dm`, `group` albo `all`). ID zatwierdzeń z prefiksem `plugin:` są rozwiązywane przez zatwierdzenia Plugin; pozostałe są najpierw rozwiązywane przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrole odpowiedzi na błędy

Gdy agent napotka błąd dostarczenia lub dostawcy, Telegram może odpowiedzieć tekstem błędu albo go pominąć. To zachowanie kontrolują dwa klucze konfiguracji:

| Klucz                               | Wartości          | Domyślne | Opis                                                                                                  |
| ----------------------------------- | ----------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` wysyła przyjazny komunikat błędu do czatu. `silent` całkowicie pomija odpowiedzi na błędy.    |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`  | Minimalny czas między odpowiedziami o błędach do tego samego czatu. Zapobiega spamowi błędów podczas awarii. |

Obsługiwane są nadpisania per konto, per grupa i per temat (takie samo dziedziczenie jak w innych kluczach konfiguracji Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Bot nie odpowiada na wiadomości grupowe bez wzmianki">

    - Jeśli `requireMention=false`, tryb prywatności Telegram musi pozwalać na pełną widoczność.
      - BotFather: `/setprivacy` -> Disable
      - następnie usuń i ponownie dodaj bota do grupy
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne ID grup; wildcard `"*"` nie może być sprawdzony pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (albo zawierać `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow`, aby poznać powody pominięcia

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje nawet wtedy, gdy zasada grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele pozycji; ogranicz polecenia plugin/skill/niestandardowe albo wyłącz natywne menu
    - wywołania startowe `deleteMyCommands` / `setMyCommands` oraz wywołania wpisywania `sendChatAction` są ograniczone czasowo i ponawiane raz przez awaryjny transport Telegram w razie przekroczenia limitu czasu żądania. Utrzymujące się błędy sieciowe/fetch zwykle wskazują na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Uruchamianie zgłasza nieautoryzowany token">

    - `getMe returned 401` to błąd uwierzytelniania Telegram dla skonfigurowanego tokenu bota.
    - Skopiuj ponownie albo wygeneruj ponownie token bota w BotFather, a następnie zaktualizuj `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` albo `TELEGRAM_BOT_TOKEN` dla konta domyślnego.
    - `deleteWebhook 401 Unauthorized` podczas uruchamiania również jest błędem uwierzytelniania; potraktowanie go jako „nie istnieje żaden webhook” tylko odroczyłoby tę samą awarię złego tokenu do późniejszych wywołań API.

  </Accordion>

  <Accordion title="Niestabilność odpytywania lub sieci">

    - Node 22+ + niestandardowy fetch/proxy mogą wywołać natychmiastowe zachowanie przerywania, jeśli typy AbortSignal nie pasują do siebie.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` do IPv6; uszkodzony ruch wychodzący IPv6 może powodować sporadyczne błędy API Telegram.
    - Jeśli logi zawierają `TypeError: fetch failed` albo `Network request for 'getUpdates' failed!`, OpenClaw ponawia je teraz jako odwracalne błędy sieciowe.
    - Podczas uruchamiania odpytywania OpenClaw ponownie używa udanej startowej próby `getMe` dla grammY, więc runner nie potrzebuje drugiego `getMe` przed pierwszym `getUpdates`.
    - Jeśli `deleteWebhook` zakończy się przejściowym błędem sieciowym podczas uruchamiania odpytywania, OpenClaw przechodzi do długiego odpytywania zamiast wykonywać kolejne przedodpytywaniowe wywołanie płaszczyzny sterowania. Nadal aktywny webhook ujawnia się jako konflikt `getUpdates`; wtedy OpenClaw odbudowuje transport Telegram i ponawia czyszczenie webhooka.
    - Jeśli gniazda Telegram są odtwarzane w krótkim, stałym rytmie, sprawdź, czy `channels.telegram.timeoutSeconds` nie ma niskiej wartości; klienci botów ograniczają skonfigurowane wartości poniżej zabezpieczeń żądań wychodzących i `getUpdates`, ale starsze wydania mogły przerywać każde odpytywanie albo odpowiedź, gdy ta wartość była ustawiona poniżej tych zabezpieczeń.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw domyślnie restartuje odpytywanie i odbudowuje transport Telegram po 120 sekundach bez zakończonej żywotności długiego odpytywania.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy uruchomione konto odpytywania nie ukończyło `getUpdates` po okresie łaski uruchomienia, gdy uruchomione konto webhooka nie ukończyło `setWebhook` po okresie łaski uruchomienia albo gdy ostatnia udana aktywność transportu odpytywania jest nieaktualna.
    - Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zastoju odpytywania. Utrzymujące się zastoje zwykle wskazują na problemy z proxy, DNS, IPv6 albo ruchem wychodzącym TLS między hostem a `api.telegram.org`.
    - Telegram uwzględnia też zmienne env proxy procesu dla transportu Bot API, w tym `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` oraz ich warianty pisane małymi literami. `NO_PROXY` / `no_proxy` nadal mogą omijać `api.telegram.org`.
    - Jeśli zarządzany proxy OpenClaw jest skonfigurowany przez `OPENCLAW_PROXY_URL` dla środowiska usługi i nie ma standardowej zmiennej env proxy, Telegram również używa tego URL-a dla transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS kieruj wywołania API Telegram przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2). Kolejność wyników DNS Telegram uwzględnia kolejno `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, potem `channels.telegram.network.dnsResultOrder`, a następnie domyślne ustawienie procesu, takie jak `NODE_OPTIONS=--dns-result-order=ipv4first`; jeśli żadne z nich nie ma zastosowania, Node 22+ wraca do `ipv4first`.
    - Jeśli host to WSL2 albo wyraźnie działa lepiej przy zachowaniu wyłącznie IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobrań multimediów Telegram. Jeśli zaufany fake-IP albo
      transparentny proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/specjalnego użycia adres podczas pobierania multimediów, możesz włączyć
      obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Ta sama opcja włączenia jest dostępna dla każdego konta w
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli proxy rozwiązuje hosty multimediów Telegram na `198.18.x.x`, najpierw zostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie dopuszczają
      zakres benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia SSRF
      multimediów Telegram. Używaj jej tylko w zaufanych, kontrolowanych przez operatora środowiskach proxy,
      takich jak routing fake-IP Clash, Mihomo albo Surge, gdy syntetyzują
      odpowiedzi prywatne albo specjalnego użycia poza zakresem benchmarkowym RFC 2544.
      Pozostaw ją wyłączoną dla zwykłego publicznego dostępu Telegram przez internet.
    </Warning>

    - Nadpisania środowiskowe (tymczasowe):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Zweryfikuj odpowiedzi DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Więcej pomocy: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

## Odniesienie konfiguracji

Główne odniesienie: [Odniesienie konfiguracji - Telegram](/pl/gateway/config-channels#telegram).

<Accordion title="Najważniejsze pola Telegram">

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; dowiązania symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- zatwierdzenia exec: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- strumieniowanie: `streaming` (podgląd), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- niestandardowy katalog główny API: `apiRoot` (tylko katalog główny Bot API; nie dołączaj `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Kolejność pierwszeństwa wielu kont: gdy skonfigurowane są co najmniej dwa identyfikatory kont, ustaw `channels.telegram.defaultAccount` (albo dodaj `channels.telegram.accounts.default`), aby jawnie określić domyślny routing. W przeciwnym razie OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` ostrzega. Nazwane konta dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Telegram z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie listy dozwolonych grup i tematów.
  </Card>
  <Card title="Routing kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i wzmacnianie zabezpieczeń.
  </Card>
  <Card title="Routing wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj grupy i tematy na agentów.
  </Card>
  <Card title="Rozwiązywanie problemów" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa.
  </Card>
</CardGroup>
