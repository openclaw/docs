---
read_when:
    - Praca nad funkcjami Telegrama lub Webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:24:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

Gotowość produkcyjna dla DM botów i grup przez grammY. Long polling jest trybem domyślnym; tryb Webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną zasadą DM dla Telegram jest parowanie.
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
    Otwórz Telegram i rozpocznij czat z **@BotFather** (potwierdź, że nazwa użytkownika to dokładnie `@BotFather`).

    Uruchom `/newbot`, postępuj zgodnie z instrukcjami i zapisz token.

  </Step>

  <Step title="Skonfiguruj token i zasadę DM">

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

    Rezerwowe źródło z env: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w konfiguracji/env, a następnie uruchom gateway.

  </Step>

  <Step title="Uruchom gateway i zatwierdź pierwszy DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kody parowania wygasają po 1 godzinie.

  </Step>

  <Step title="Dodaj bota do grupy">
    Dodaj bota do swojej grupy, a następnie ustaw `channels.telegram.groups` i `groupPolicy`, aby odpowiadały Twojemu modelowi dostępu.
  </Step>
</Steps>

<Note>
Kolejność rozwiązywania tokenu uwzględnia konto. W praktyce wartości z konfiguracji mają pierwszeństwo przed rezerwowym źródłem z env, a `TELEGRAM_BOT_TOKEN` ma zastosowanie tylko do konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność grup">
    Boty Telegram domyślnie używają **trybu prywatności**, który ogranicza wiadomości grupowe, które otrzymują.

    Jeśli bot musi widzieć wszystkie wiadomości grupowe, wykonaj jedną z czynności:

    - wyłącz tryb prywatności przez `/setprivacy`, albo
    - ustaw bota jako administratora grupy.

    Po przełączeniu trybu prywatności usuń i ponownie dodaj bota w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty administracyjne otrzymują wszystkie wiadomości grupowe, co jest przydatne dla zawsze aktywnego zachowania w grupie.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić na dodawanie do grup lub je zablokować
    - `/setprivacy` dla zachowania widoczności w grupie

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Zasada DM">
    `channels.telegram.dmPolicy` kontroluje dostęp przez wiadomości bezpośrednie:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego ID nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` pozwala dowolnemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, wydawać mu polecenia. Używaj tego tylko dla celowo publicznych botów z ściśle ograniczonymi narzędziami; boty jednego właściciela powinny używać `allowlist` z liczbowymi ID użytkowników.

    `channels.telegram.allowFrom` akceptuje liczbowe ID użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach wielokontowych restrykcyjne `channels.telegram.allowFrom` najwyższego poziomu jest traktowane jako granica bezpieczeństwa: wpisy `allowFrom: ["*"]` na poziomie konta nie upubliczniają tego konta, chyba że efektywna allowlist konta nadal zawiera jawny symbol wieloznaczny po scaleniu.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie DM i jest odrzucane przez walidację konfiguracji.
    Konfigurator prosi wyłącznie o liczbowe ID użytkowników.
    Jeśli wykonano uaktualnienie, a konfiguracja zawiera wpisy allowlist `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (best-effort; wymaga tokenu bota Telegram).
    Jeśli wcześniej polegano na plikach allowlist magazynu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach allowlist (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych ID).

    Dla botów jednego właściciela preferuj `dmPolicy: "allowlist"` z jawnymi liczbowymi ID `allowFrom`, aby zasada dostępu była trwała w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania DM nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp przez DM. Jeśli nie istnieje jeszcze właściciel poleceń, pierwsze zatwierdzone parowanie ustawia też `commands.ownerAllowFrom`, aby polecenia tylko dla właściciela i zatwierdzenia exec miały jawne konto operatora.
    Autoryzacja nadawcy w grupie nadal pochodzi z jawnych allowlist w konfiguracji.
    Jeśli chcesz, aby „jestem raz autoryzowany i działają zarówno DM, jak i polecenia grupowe”, umieść swoje liczbowe ID użytkownika Telegram w `channels.telegram.allowFrom`; dla poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

    ### Znajdowanie ID użytkownika Telegram

    Bezpieczniej (bez bota zewnętrznego):

    1. Wyślij DM do swojego bota.
    2. Uruchom `openclaw logs --follow`.
    3. Odczytaj `from.id`.

    Oficjalna metoda Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metoda zewnętrzna (mniej prywatna): `@userinfobot` lub `@getidsbot`.

  </Tab>

  <Tab title="Zasada grup i allowlist">
    Dwie kontrolki mają zastosowanie razem:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - z `groupPolicy: "open"`: dowolna grupa może przejść kontrole ID grupy
         - z `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako allowlist (jawne ID lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` jest używane do filtrowania nadawców w grupie. Jeśli nie jest ustawione, Telegram używa rezerwowo `allowFrom`.
    Wpisy `groupAllowFrom` powinny być liczbowymi ID użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj ID czatów grup Telegram ani supergrup w `groupAllowFrom`. Ujemne ID czatów należą do `channels.telegram.groups`.
    Wpisy nieliczbowe są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawcy w grupie **nie** dziedziczy zatwierdzeń z magazynu parowania DM.
    Parowanie pozostaje wyłącznie dla DM. Dla grup ustaw `groupAllowFrom` albo `allowFrom` na poziomie grupy/tematu.
    Jeśli `groupAllowFrom` jest nieustawione, Telegram używa rezerwowo konfiguracji `allowFrom`, a nie magazynu parowania.
    Praktyczny wzorzec dla botów jednego właściciela: ustaw swoje ID użytkownika w `channels.telegram.allowFrom`, zostaw `groupAllowFrom` nieustawione i zezwól na docelowe grupy w `channels.telegram.groups`.
    Uwaga runtime: jeśli całkowicie brakuje `channels.telegram`, runtime domyślnie działa w trybie fail-closed `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest jawnie ustawione.

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

    Przykład: zezwól tylko konkretnym użytkownikom w jednej konkretnej grupie:

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
      Częsty błąd: `groupAllowFrom` nie jest allowlist grup Telegram.

      - Umieszczaj ujemne ID czatów grup Telegram lub supergrup, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieszczaj ID użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą uruchamiać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.

    </Warning>

  </Tab>

  <Tab title="Zachowanie wzmianek">
    Odpowiedzi w grupie domyślnie wymagają wzmianki.

    Wzmianka może pochodzić z:

    - natywnej wzmianki `@botusername`, albo
    - wzorców wzmianek w:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Przełączniki poleceń na poziomie sesji:

    - `/activation always`
    - `/activation mention`

    Aktualizują one tylko stan sesji. Użyj konfiguracji, aby uzyskać trwałość.

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
    - albo sprawdź Bot API `getUpdates`

  </Tab>
</Tabs>

## Zachowanie runtime

- Telegram jest obsługiwany przez proces gateway.
- Routing jest deterministyczny: przychodzące wiadomości Telegram otrzymują odpowiedzi w Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi, placeholderami mediów i utrwalonym kontekstem łańcucha odpowiedzi dla odpowiedzi Telegram zaobserwowanych przez gateway.
- Sesje grupowe są izolowane według ID grupy. Tematy forum dodają `:topic:<threadId>`, aby utrzymać izolację tematów.
- Wiadomości DM mogą przenosić `message_thread_id`; OpenClaw zachowuje ID wątku dla odpowiedzi, ale domyślnie utrzymuje DM w płaskiej sesji. Skonfiguruj `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` lub pasującą konfigurację tematu, gdy celowo chcesz izolować sesje tematów DM.
- Long polling używa grammY runner z sekwencjonowaniem per czat/per wątek. Ogólna współbieżność ujścia runner używa `agents.defaults.maxConcurrent`.
- Long polling jest chroniony wewnątrz każdego procesu gateway, więc tylko jeden aktywny poller może używać tokenu bota naraz. Jeśli nadal widzisz konflikty `getUpdates` 409, inny gateway OpenClaw, skrypt lub zewnętrzny poller prawdopodobnie używa tego samego tokenu.
- Restart watchdoga long-polling uruchamia się domyślnie po 120 sekundach bez zakończonej aktywności `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy wdrożenie nadal obserwuje fałszywe restarty polling-stall podczas długotrwałej pracy. Wartość jest podawana w milisekundach i może wynosić od `30000` do `600000`; obsługiwane są nadpisania per konto.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Informacje o funkcjach

<AccordionGroup>
  <Accordion title="Podgląd strumienia na żywo (edycje wiadomości)">
    OpenClaw może strumieniować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` to `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` utrzymuje jeden edytowalny szkic statusu dla postępu narzędzia, czyści go po zakończeniu i wysyła finalną odpowiedź jako zwykłą wiadomość
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzia/postępu ponownie używają tej samej edytowanej wiadomości podglądu (domyślnie: `true`, gdy strumieniowanie podglądu jest aktywne)
    - `streaming.preview.commandText` kontroluje szczegóły polecenia/exec w tych wierszach postępu narzędzia: `raw` (domyślnie, zachowuje wydane zachowanie) lub `status` (tylko etykieta narzędzia)
    - starsze `channels.telegram.streamMode` i boolowskie wartości `streaming` są wykrywane; uruchom `openclaw doctor --fix`, aby zmigrować je do `channels.telegram.streaming.mode`

    Aktualizacje podglądu postępu narzędzi to krótkie wiersze statusu pokazywane podczas działania narzędzi, na przykład wykonywania poleceń, odczytów plików, aktualizacji planowania lub podsumowań poprawek. Telegram utrzymuje je domyślnie włączone, aby odpowiadały wydanemu zachowaniu OpenClaw od `v2026.4.22` i później. Aby zachować edytowany podgląd tekstu odpowiedzi, ale ukryć wiersze postępu narzędzi, ustaw:

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

    Aby pozostawić widoczny postęp narzędzi, ale ukryć tekst poleceń/wykonania, ustaw:

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

    Użyj trybu `progress`, gdy chcesz widocznego postępu narzędzi bez edytowania końcowej odpowiedzi w tej samej wiadomości. Umieść zasadę tekstu polecenia w `streaming.progress`:

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

    Użyj `streaming.mode: "off"` tylko wtedy, gdy chcesz dostarczania wyłącznie wersji końcowej: edycje podglądu Telegram są wyłączone, a ogólne komunikaty narzędzi/postępu są tłumione zamiast wysyłania ich jako samodzielnych wiadomości statusu. Monity o zatwierdzenie, ładunki multimedialne i błędy nadal przechodzą przez zwykłe dostarczanie końcowe. Użyj `streaming.preview.toolProgress: false`, gdy chcesz zachować tylko edycje podglądu odpowiedzi, ukrywając wiersze statusu postępu narzędzi.

    <Note>
      Odpowiedzi Telegram z zaznaczonym cytatem są wyjątkiem. Gdy `replyToMode` ma wartość `"first"`, `"all"` lub `"batched"`, a wiadomość przychodząca zawiera zaznaczony cytowany tekst, OpenClaw wysyła końcową odpowiedź przez natywną ścieżkę odpowiedzi z cytatem Telegram zamiast edytować podgląd odpowiedzi, więc `streaming.preview.toolProgress` nie może pokazać krótkich wierszy statusu dla tego przebiegu. Odpowiedzi na bieżącą wiadomość bez zaznaczonego cytowanego tekstu nadal zachowują strumieniowanie podglądu. Ustaw `replyToMode: "off"`, gdy widoczność postępu narzędzi jest ważniejsza niż natywne odpowiedzi z cytatem, albo ustaw `streaming.preview.toolProgress: false`, aby zaakceptować ten kompromis.
    </Note>

    Dla odpowiedzi tekstowych:

    - krótkie podglądy DM/grupy/tematu: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu
    - długie końcowe odpowiedzi tekstowe podzielone na wiele wiadomości Telegram ponownie używają istniejącego podglądu jako pierwszej końcowej części, gdy to możliwe, a następnie wysyłają tylko pozostałe części
    - końcowe odpowiedzi w trybie postępu czyszczą roboczy status i używają zwykłego dostarczania końcowego zamiast edytować wersję roboczą w odpowiedź
    - jeśli końcowa edycja nie powiedzie się przed potwierdzeniem ukończonego tekstu, OpenClaw używa zwykłego dostarczania końcowego i usuwa nieaktualny podgląd

    Dla złożonych odpowiedzi (na przykład ładunków multimedialnych) OpenClaw wraca do zwykłego dostarczania końcowego, a następnie usuwa wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielne od strumieniowania bloków. Gdy strumieniowanie bloków jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - podgląd rozumowania jest usuwany po dostarczeniu końcowym; użyj `/reasoning on`, gdy rozumowanie ma pozostać widoczne
    - końcowa odpowiedź jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i awaryjne użycie HTML">
    Tekst wychodzący używa Telegram `parse_mode: "HTML"`.

    - Tekst podobny do Markdown jest renderowany do HTML bezpiecznego dla Telegram.
    - Surowy HTML modelu jest escapowany, aby ograniczyć błędy parsowania Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponawia próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć przez `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Natywne polecenia i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana przy uruchomieniu za pomocą `setMyCommands`.

    Domyślne wartości poleceń natywnych:

    - `commands.native: "auto"` włącza natywne polecenia dla Telegram

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

    - nazwy są normalizowane (usuwany jest początkowy `/`, zamiana na małe litery)
    - prawidłowy wzorzec: `a-z`, `0-9`, `_`, długość `1..32`
    - polecenia niestandardowe nie mogą nadpisywać poleceń natywnych
    - konflikty/duplikaty są pomijane i zapisywane w logu

    Uwagi:

    - polecenia niestandardowe są tylko wpisami menu; nie implementują automatycznie zachowania
    - polecenia plugin/skill mogą nadal działać po wpisaniu, nawet jeśli nie są widoczne w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/plugin mogą nadal zostać zarejestrowane, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przekroczyło limit po przycięciu; zmniejsz liczbę poleceń plugin/skill/niestandardowych albo wyłącz `channels.telegram.commands.native`.
    - Niepowodzenie `deleteWebhook`, `deleteMyCommands` lub `setMyCommands` z `404: Not Found`, gdy bezpośrednie polecenia curl Bot API działają, może oznaczać, że `channels.telegram.apiRoot` ustawiono na pełny punkt końcowy `/bot<TOKEN>`. `apiRoot` musi być tylko katalogiem głównym Bot API, a `openclaw doctor --fix` usuwa przypadkowy końcowy fragment `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Zaktualizuj `botToken`, `tokenFile` lub `TELEGRAM_BOT_TOKEN` aktualnym tokenem BotFather; OpenClaw zatrzymuje się przed odpytywaniem, więc nie jest to zgłaszane jako błąd czyszczenia Webhook.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzący DNS/HTTPS do `api.telegram.org` jest zablokowany.

    ### Polecenia parowania urządzeń (plugin `device-pair`)

    Gdy plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym rolę/zakresy)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji przenosi krótkotrwały token inicjalizacyjny. Wbudowane przekazanie inicjalizacyjne utrzymuje token głównego węzła przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Sprawdzenia zakresów inicjalizacyjnych mają prefiks roli, więc ta allowlista operatora spełnia tylko żądania operatora; role niebędące operatorem nadal potrzebują zakresów pod własnym prefiksem roli.

    Jeśli urządzenie ponowi próbę ze zmienionymi szczegółami uwierzytelniania (na przykład rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostanie zastąpione, a nowe żądanie użyje innego `requestId`. Uruchom ponownie `/pair pending` przed zatwierdzeniem.

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

    Kliknięcia wywołania zwrotnego są przekazywane agentowi jako tekst:
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

    Kontrole bramkowania:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w czasie wykonywania używają aktywnego zrzutu konfiguracji/secrets (uruchomienie/przeładowanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdej wysyłce.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątkowania odpowiedzi">
    Telegram obsługuje jawne tagi wątkowania odpowiedzi w wygenerowanym wyjściu:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na konkretny identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` kontroluje obsługę:

    - `off` (domyślnie)
    - `first`
    - `all`

    Gdy wątkowanie odpowiedzi jest włączone, a oryginalny tekst lub podpis Telegram jest dostępny, OpenClaw automatycznie dołącza natywny fragment cytatu Telegram. Telegram ogranicza natywny tekst cytatu do 1024 jednostek kodu UTF-16, więc dłuższe wiadomości są cytowane od początku i przechodzą na zwykłą odpowiedź, jeśli Telegram odrzuci cytat.

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal honorowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematu dodają `:topic:<threadId>`
    - odpowiedzi i wpisywanie celują w wątek tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Specjalny przypadek tematu ogólnego (`threadId=1`):

    - wysyłki wiadomości pomijają `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje wpisywania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy wartości domyślnych grupy.

    **Routing agentów według tematu**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własną odizolowaną przestrzeń roboczą, pamięć i sesję. Przykład:

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

    **Trwałe powiązanie tematu ACP**: Tematy forum mogą przypinać sesje uprzęży ACP przez typowane powiązania ACP najwyższego poziomu (`bindings[]` z `type: "acp"` i `match.channel: "telegram"`, `peer.kind: "group"` oraz identyfikatorem kwalifikowanym tematem, takim jak `-1001234567890:topic:42`). Obecnie zakres jest ograniczony do tematów forum w grupach/supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Powiązane z wątkiem uruchamianie ACP z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne wiadomości trafiają tam bezpośrednio. OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga, aby `channels.telegram.threadBindings.spawnSessions` pozostało włączone (domyślnie: `true`).

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` domyślnie zachowują trasowanie DM i metadane odpowiedzi w płaskich sesjach; używają kluczy sesji świadomych wątku tylko wtedy, gdy skonfigurowano `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` albo pasującą konfigurację tematu. Użyj `channels.telegram.dm.threadReplies` najwyższego poziomu jako domyślnego ustawienia konta albo `direct.<chatId>.threadReplies` dla jednego DM.

  </Accordion>

  <Accordion title="Dźwięk, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta, aby wymusić wysłanie notatki głosowej
    - transkrypcje przychodzących notatek głosowych są ujmowane w kontekście agenta jako tekst wygenerowany maszynowo,
      niezaufany; wykrywanie wzmianki nadal używa surowej
      transkrypcji, więc wiadomości głosowe bramkowane wzmianką nadal działają.

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

    Naklejki są opisywane raz (gdy to możliwe) i buforowane, aby ograniczyć powtarzane wywołania wizji.

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

    Akcja wysłania naklejki:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Wyszukaj buforowane naklejki:

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

    Po włączeniu OpenClaw kolejkowuje zdarzenia systemowe, takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkowników na wiadomości wysłane przez bota (najlepszym możliwym sposobem przez pamięć podręczną wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrole dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy niebędące forami trafiają do sesji czatu grupowego
      - grupy forum trafiają do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla odpytywania/Webhook automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje potwierdzenia">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozstrzygania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - awaryjnie emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji Unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji ze zdarzeń i poleceń Telegram">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grupy (`migrate_to_chat_id`) do aktualizacji `channels.telegram.groups`
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

  <Accordion title="Długie odpytywanie a Webhook">
    Domyślne jest długie odpytywanie. Dla trybu Webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (domyślnie `/telegram-webhook`, `127.0.0.1`, `8787`).

    W trybie długiego odpytywania OpenClaw utrwala znacznik restartu dopiero po pomyślnym wysłaniu aktualizacji do obsługi. Jeśli handler zawiedzie, ta aktualizacja pozostaje możliwa do ponowienia w tym samym procesie i nie jest zapisywana jako ukończona na potrzeby deduplikacji po restarcie.

    Lokalny listener wiąże się z `127.0.0.1:8787`. Dla publicznego wejścia umieść reverse proxy przed lokalnym portem albo celowo ustaw `webhookHost: "0.0.0.0"`.

    Tryb Webhook weryfikuje zabezpieczenia żądania, tajny token Telegram i treść JSON przed zwróceniem `200` do Telegram.
    Następnie OpenClaw przetwarza aktualizację asynchronicznie przez te same pasy bota per czat/per temat, których używa długie odpytywanie, więc wolne tury agenta nie blokują ACK dostarczenia Telegram.

  </Accordion>

  <Accordion title="Limity, ponawianie i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów Telegram.
    - `channels.telegram.mediaGroupFlushMs` (domyślnie 500) kontroluje, jak długo albumy/grupy multimediów Telegram są buforowane, zanim OpenClaw wyśle je jako jedną wiadomość przychodzącą. Zwiększ tę wartość, jeśli części albumu docierają późno; zmniejsz ją, aby skrócić opóźnienie odpowiedzi na album.
    - `channels.telegram.timeoutSeconds` nadpisuje limit czasu klienta API Telegram (jeśli nie ustawiono, obowiązuje domyślna wartość grammY). Klienci botów ograniczają skonfigurowane wartości poniżej 60-sekundowego zabezpieczenia żądań wychodzącego tekstu/pisania, aby grammY nie przerywał widocznego dostarczania odpowiedzi, zanim zabezpieczenie transportu OpenClaw i mechanizm awaryjny będą mogły się uruchomić. Długie odpytywanie nadal używa 45-sekundowego zabezpieczenia żądania `getUpdates`, aby bezczynne odpytywania nie były porzucane w nieskończoność.
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; dostrajaj między `30000` a `600000` tylko w przypadku fałszywie dodatnich restartów po zastoju odpytywania.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` albo `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania jest normalizowany do jednego wybranego okna kontekstu rozmowy, gdy Gateway zaobserwował wiadomości nadrzędne; pamięć podręczna zaobserwowanych wiadomości jest utrwalana obok magazynu sesji. Telegram obejmuje w aktualizacjach tylko jedną płytką wiadomość `reply_to_message`, więc łańcuchy starsze niż pamięć podręczna są ograniczone do bieżącego ładunku aktualizacji Telegram.
    - listy dozwolonych Telegram przede wszystkim bramkują to, kto może wyzwolić agenta, a nie stanowią pełnej granicy redakcji kontekstu dodatkowego.
    - Kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfiguracja `channels.telegram.retry` ma zastosowanie do helperów wysyłania Telegram (CLI/narzędzia/akcje) dla możliwych do odzyskania błędów wychodzącego API. Dostarczanie końcowej odpowiedzi przychodzącej również używa ograniczonego bezpiecznego ponawiania wysyłki dla błędów Telegram przed połączeniem, ale nie ponawia niejednoznacznych kopert sieciowych po wysłaniu, które mogłyby zduplikować widoczne wiadomości.

    Cele wysyłania CLI i narzędzia wiadomości mogą być numerycznym identyfikatorem czatu, nazwą użytkownika albo celem tematu forum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
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

    Wysyłanie Telegram obsługuje też:

    - `--presentation` z blokami `buttons` dla klawiatur inline, gdy `channels.telegram.capabilities.inlineButtons` na to pozwala
    - `--pin` albo `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać w tym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć albo przesyłek animowanych multimediów

    Bramkowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając zwykłe wysyłki włączone

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM zatwierdzających i może opcjonalnie publikować prompty w czacie lub temacie źródłowym. Zatwierdzający muszą być numerycznymi identyfikatorami użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy można rozpoznać co najmniej jednego zatwierdzającego)
    - `channels.telegram.execApprovals.approvers` (przechodzi awaryjnie na numeryczne identyfikatory właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` kontrolują, kto może rozmawiać z botem i gdzie wysyła on zwykłe odpowiedzi. Nie czynią nikogo zatwierdzającym exec. Pierwsze zatwierdzone parowanie DM inicjalizuje `commands.ownerAllowFrom`, gdy nie istnieje jeszcze właściciel poleceń, więc konfiguracja z jednym właścicielem nadal działa bez duplikowania identyfikatorów w `execApprovals.approvers`.

    Dostarczenie do kanału pokazuje tekst polecenia w czacie; włączaj `channel` albo `both` tylko w zaufanych grupach/tematach. Gdy prompt trafia do tematu forum, OpenClaw zachowuje temat dla promptu zatwierdzenia i dalszej odpowiedzi. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline również wymagają, aby `channels.telegram.capabilities.inlineButtons` dopuszczało powierzchnię docelową (`dm`, `group` albo `all`). Identyfikatory zatwierdzeń z prefiksem `plugin:` są rozwiązywane przez zatwierdzenia plugin; pozostałe są najpierw rozwiązywane przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrolki odpowiedzi błędów

Gdy agent napotka błąd dostarczenia lub dostawcy, Telegram może odpowiedzieć tekstem błędu albo go wyciszyć. To zachowanie kontrolują dwa klucze konfiguracji:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                                       |
| ----------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła przyjazną wiadomość o błędzie do czatu. `silent` całkowicie wycisza odpowiedzi błędów.       |
| `channels.telegram.errorCooldownMs` | liczba (ms)       | `60000`   | Minimalny czas między odpowiedziami błędów do tego samego czatu. Zapobiega spamowi błędów podczas awarii. |

Obsługiwane są nadpisania per konto, per grupa i per temat (takie samo dziedziczenie jak inne klucze konfiguracji Telegram).

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

    - Jeśli `requireMention=false`, tryb prywatności Telegram musi zezwalać na pełną widoczność.
      - BotFather: `/setprivacy` -> Disable
      - następnie usuń bota z grupy i dodaj go ponownie
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne identyfikatory grup; wildcard `"*"` nie może być sprawdzony pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (albo trzeba uwzględnić `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow`, aby sprawdzić powody pomijania

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy zasada grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele pozycji; ogranicz polecenia pluginów/Skills/niestandardowe albo wyłącz natywne menu
    - wywołania startowe `deleteMyCommands` / `setMyCommands` oraz wywołania wpisywania `sendChatAction` są ograniczone czasowo i ponawiane raz przez awaryjny transport Telegram po przekroczeniu limitu czasu żądania. Utrzymujące się błędy sieciowe/fetch zwykle oznaczają problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Uruchamianie zgłasza nieautoryzowany token">

    - `getMe returned 401` to błąd uwierzytelniania Telegram dla skonfigurowanego tokena bota.
    - Skopiuj ponownie albo wygeneruj ponownie token bota w BotFather, a następnie zaktualizuj `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` albo `TELEGRAM_BOT_TOKEN` dla konta domyślnego.
    - `deleteWebhook 401 Unauthorized` podczas uruchamiania także jest błędem uwierzytelniania; traktowanie go jako „brak webhooka” tylko odłożyłoby ten sam błąd złego tokena do późniejszych wywołań API.

  </Accordion>

  <Accordion title="Niestabilność odpytywania albo sieci">

    - Node 22+ wraz z niestandardowym fetch/proxy może wywołać natychmiastowe przerwanie, jeśli typy AbortSignal są niezgodne.
    - Niektóre hosty rozwiązują `api.telegram.org` najpierw na IPv6; uszkodzony ruch wychodzący IPv6 może powodować sporadyczne błędy API Telegram.
    - Jeśli logi zawierają `TypeError: fetch failed` albo `Network request for 'getUpdates' failed!`, OpenClaw ponawia je teraz jako możliwe do odzyskania błędy sieciowe.
    - Podczas uruchamiania odpytywania OpenClaw ponownie używa udanego testu startowego `getMe` dla grammY, więc runner nie potrzebuje drugiego `getMe` przed pierwszym `getUpdates`.
    - Jeśli `deleteWebhook` zakończy się przejściowym błędem sieciowym podczas uruchamiania odpytywania, OpenClaw przechodzi do long pollingu zamiast wykonywać kolejne przedodpytywujące wywołanie płaszczyzny sterowania. Nadal aktywny webhook ujawnia się jako konflikt `getUpdates`; wtedy OpenClaw odbudowuje transport Telegram i ponawia czyszczenie webhooka.
    - Jeśli gniazda Telegram są odnawiane w krótkim, stałym cyklu, sprawdź, czy `channels.telegram.timeoutSeconds` nie ma niskiej wartości; klienci botów ograniczają skonfigurowane wartości poniżej zabezpieczeń żądań wychodzących i `getUpdates`, ale starsze wydania mogły przerywać każde odpytywanie lub odpowiedź, gdy ustawienie było niższe od tych zabezpieczeń.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw domyślnie restartuje odpytywanie i odbudowuje transport Telegram po 120 sekundach bez ukończonej żywotności long pollingu.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy uruchomione konto odpytywania nie ukończyło `getUpdates` po okresie karencji startowej, gdy uruchomione konto webhooka nie ukończyło `setWebhook` po okresie karencji startowej albo gdy ostatnia udana aktywność transportu odpytywania jest nieaktualna.
    - Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zastoju odpytywania. Utrzymujące się zastoje zwykle wskazują na problemy z proxy, DNS, IPv6 albo ruchem wychodzącym TLS między hostem a `api.telegram.org`.
    - Telegram uwzględnia też zmienne środowiskowe proxy procesu dla transportu Bot API, w tym `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` oraz ich warianty zapisane małymi literami. `NO_PROXY` / `no_proxy` nadal mogą pomijać `api.telegram.org`.
    - Jeśli zarządzane proxy OpenClaw jest skonfigurowane przez `OPENCLAW_PROXY_URL` dla środowiska usługi i nie ma standardowej zmiennej środowiskowej proxy, Telegram również używa tego URL-a dla transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS kieruj wywołania API Telegram przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2). Kolejność wyników DNS Telegram uwzględnia najpierw `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, potem `channels.telegram.network.dnsResultOrder`, a następnie domyślne ustawienie procesu, takie jak `NODE_OPTIONS=--dns-result-order=ipv4first`; jeśli żadne z nich nie ma zastosowania, Node 22+ wraca do `ipv4first`.
    - Jeśli host to WSL2 albo jawnie działa lepiej z zachowaniem tylko IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania multimediów Telegram. Jeśli zaufane fake-IP albo
      przezroczyste proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/specjalny adres podczas pobierania multimediów, możesz włączyć
      obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo włączenie jest dostępne dla każdego konta pod
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli proxy rozwiązuje hosty multimediów Telegram na `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie dopuszczają zakres
      benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia SSRF
      dla multimediów Telegram. Używaj tego tylko w zaufanych środowiskach proxy kontrolowanych
      przez operatora, takich jak routing fake-IP Clash, Mihomo albo Surge, gdy syntetyzują one
      odpowiedzi prywatne albo specjalnego przeznaczenia spoza zakresu benchmarkowego RFC 2544.
      Pozostaw to wyłączone dla normalnego publicznego dostępu Telegram przez internet.
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

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji - Telegram](/pl/gateway/config-channels#telegram).

<Accordion title="Pola Telegram o wysokiej wartości diagnostycznej">

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; dowiązania symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- zatwierdzenia wykonania poleceń: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- strumieniowanie: `streaming` (podgląd), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- niestandardowy katalog główny API: `apiRoot` (tylko katalog główny Bot API; nie dołączaj `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorytet wielu kont: gdy skonfigurowane są co najmniej dwa identyfikatory kont, ustaw `channels.telegram.defaultAccount` (albo uwzględnij `channels.telegram.accounts.default`), aby domyślne routowanie było jawne. W przeciwnym razie OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` ostrzega. Nazwane konta dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Telegram z gatewayem.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie listy dozwolonych grup i tematów.
  </Card>
  <Card title="Routowanie kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Routowanie wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj grupy i tematy na agentów.
  </Card>
  <Card title="Rozwiązywanie problemów" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa.
  </Card>
</CardGroup>
