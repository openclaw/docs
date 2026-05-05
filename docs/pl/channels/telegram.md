---
read_when:
    - Praca nad funkcjami Telegram lub Webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-05-05T06:16:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c75169335378482b80f1ceb669cefaa034ad3e589cf5f1d14c8252608ee46a
    source_path: channels/telegram.md
    workflow: 16
---

Gotowe do produkcji dla wiadomości prywatnych botów i grup przez grammY. Long polling jest trybem domyślnym; tryb webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Domyślną polityką wiadomości prywatnych dla Telegram jest parowanie.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce i przykłady konfiguracji kanałów.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Create the bot token in BotFather">
    Otwórz Telegram i rozpocznij czat z **@BotFather** (upewnij się, że nazwa to dokładnie `@BotFather`).

    Uruchom `/newbot`, postępuj zgodnie z instrukcjami i zapisz token.

  </Step>

  <Step title="Configure token and DM policy">

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

    Zapasowe źródło z env: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w config/env, a następnie uruchom gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kody parowania wygasają po 1 godzinie.

  </Step>

  <Step title="Add the bot to a group">
    Dodaj bota do swojej grupy, a następnie ustaw `channels.telegram.groups` i `groupPolicy` zgodnie ze swoim modelem dostępu.
  </Step>
</Steps>

<Note>
Kolejność rozwiązywania tokenu uwzględnia konto. W praktyce wartości z konfiguracji mają pierwszeństwo przed zapasowym źródłem z env, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Boty Telegram domyślnie używają **Privacy Mode**, który ogranicza wiadomości grupowe, jakie otrzymują.

    Jeśli bot musi widzieć wszystkie wiadomości grupowe:

    - wyłącz tryb prywatności przez `/setprivacy`, albo
    - ustaw bota jako administratora grupy.

    Po przełączeniu trybu prywatności usuń i dodaj ponownie bota w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Group permissions">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty administracyjne otrzymują wszystkie wiadomości grupowe, co jest przydatne przy zawsze aktywnym działaniu w grupie.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups`, aby zezwolić na dodawanie do grup lub je zablokować
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` kontroluje dostęp przez wiadomości bezpośrednie:

    - `pairing` (domyślne)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` pozwala każdemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, wydawać mu polecenia. Używaj tego tylko dla celowo publicznych botów z mocno ograniczonymi narzędziami; boty jednego właściciela powinny używać `allowlist` z numerycznymi identyfikatorami użytkowników.

    `channels.telegram.allowFrom` akceptuje numeryczne identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach wielokontowych restrykcyjne `channels.telegram.allowFrom` najwyższego poziomu jest traktowane jako granica bezpieczeństwa: wpisy `allowFrom: ["*"]` na poziomie konta nie czynią tego konta publicznym, chyba że efektywna allowlista konta po scaleniu nadal zawiera jawny wildcard.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie wiadomości prywatne i jest odrzucane przez walidację konfiguracji.
    Konfiguracja prosi wyłącznie o numeryczne identyfikatory użytkowników.
    Jeśli po aktualizacji konfiguracja zawiera wpisy allowlist `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (najlepsza możliwa próba; wymaga tokenu bota Telegram).
    Jeśli wcześniej używano plików allowlist z magazynu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach allowlist (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    Dla botów jednego właściciela preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi identyfikatorami `allowFrom`, aby polityka dostępu była trwała w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnych nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp do wiadomości prywatnych. Jeśli właściciel poleceń jeszcze nie istnieje, pierwsze zatwierdzone parowanie ustawia także `commands.ownerAllowFrom`, aby polecenia tylko dla właściciela i zatwierdzenia wykonania miały jawne konto operatora.
    Autoryzacja nadawcy w grupie nadal pochodzi z jawnych allowlist konfiguracji.
    Jeśli chcesz, aby „autoryzuję się raz i działają zarówno wiadomości prywatne, jak i polecenia grupowe”, umieść swój numeryczny identyfikator użytkownika Telegram w `channels.telegram.allowFrom`; dla poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

    ### Znajdowanie identyfikatora użytkownika Telegram

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

  <Tab title="Group policy and allowlists">
    Dwie kontrolki działają razem:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - z `groupPolicy: "open"`: dowolna grupa może przejść sprawdzanie identyfikatora grupy
         - z `groupPolicy: "allowlist"` (domyślne): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako allowlista (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślne)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców w grupie. Jeśli nie jest ustawione, Telegram używa zapasowo `allowFrom`.
    Wpisy `groupAllowFrom` powinny być numerycznymi identyfikatorami użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatów grup Telegram ani supergrup w `groupAllowFrom`. Ujemne identyfikatory czatów należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawcy w grupie **nie** dziedziczy zatwierdzeń z magazynu parowania wiadomości prywatnych.
    Parowanie pozostaje tylko dla wiadomości prywatnych. Dla grup ustaw `groupAllowFrom` albo `allowFrom` dla konkretnej grupy lub tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram używa zapasowo konfiguracyjnego `allowFrom`, a nie magazynu parowania.
    Praktyczny wzorzec dla botów jednego właściciela: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na docelowe grupy w `channels.telegram.groups`.
    Uwaga dotycząca działania: jeśli `channels.telegram` całkowicie brakuje, runtime domyślnie używa fail-closed `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest jawnie ustawione.

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
      Częsty błąd: `groupAllowFrom` nie jest allowlistą grup Telegram.

      - Umieszczaj ujemne identyfikatory czatów grup Telegram lub supergrup, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieszczaj identyfikatory użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą wywoływać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Odpowiedzi w grupie domyślnie wymagają wzmianki.

    Wzmianka może pochodzić z:

    - natywnej wzmianki `@botusername`, albo
    - wzorców wzmianek w:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Przełączniki poleceń na poziomie sesji:

    - `/activation always`
    - `/activation mention`

    Aktualizują one tylko stan sesji. Użyj konfiguracji, aby zachować ustawienie trwale.

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

    Uzyskiwanie identyfikatora czatu grupowego:

    - przekaż wiadomość grupową do `@userinfobot` / `@getidsbot`
    - albo odczytaj `chat.id` z `openclaw logs --follow`
    - albo sprawdź `getUpdates` w Bot API

  </Tab>
</Tabs>

## Zachowanie runtime

- Telegram jest własnością procesu gateway.
- Routing jest deterministyczny: wiadomości przychodzące z Telegram wracają do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi i placeholderami multimediów.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dopisują `:topic:<threadId>`, aby utrzymać izolację tematów.
- Wiadomości prywatne mogą zawierać `message_thread_id`; OpenClaw zachowuje identyfikator wątku dla odpowiedzi, ale domyślnie utrzymuje wiadomości prywatne w płaskiej sesji. Skonfiguruj `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` albo pasującą konfigurację tematu, gdy celowo chcesz izolacji sesji tematów wiadomości prywatnych.
- Long polling używa runnera grammY z sekwencjonowaniem na czat i wątek. Ogólna współbieżność sink runnera używa `agents.defaults.maxConcurrent`.
- Long polling jest chroniony wewnątrz każdego procesu gateway, aby tylko jeden aktywny poller mógł używać tokenu bota naraz. Jeśli nadal widzisz konflikty `getUpdates` 409, inny gateway OpenClaw, skrypt lub zewnętrzny poller prawdopodobnie używa tego samego tokenu.
- Restarty watchdoga long-pollingu domyślnie uruchamiają się po 120 sekundach bez zakończonego sprawdzenia żywotności `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy wdrożenie nadal widzi fałszywe restarty z powodu zatrzymania pollingu podczas długo trwającej pracy. Wartość jest w milisekundach i jest dozwolona od `30000` do `600000`; obsługiwane są nadpisania dla kont.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Odniesienie do funkcji

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw może przesyłać częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` to `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` utrzymuje jeden edytowalny szkic statusu i aktualizuje go postępem narzędzi aż do finalnego dostarczenia
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzi/postępu ponownie używają tej samej edytowanej wiadomości podglądu (domyślnie: `true`, gdy aktywne jest strumieniowanie podglądu)
    - `streaming.preview.commandText` kontroluje szczegóły command/exec w tych liniach postępu narzędzi: `raw` (domyślne, zachowuje wydane zachowanie) albo `status` (tylko etykieta narzędzia)
    - starsze `channels.telegram.streamMode` i boolowskie wartości `streaming` są wykrywane; uruchom `openclaw doctor --fix`, aby zmigrować je do `channels.telegram.streaming.mode`

    Aktualizacje podglądu postępu narzędzi to krótkie linie statusu pokazywane podczas działania narzędzi, na przykład wykonywania poleceń, odczytu plików, aktualizacji planu lub podsumowań poprawek. Telegram utrzymuje je domyślnie włączone, aby pasować do zachowania OpenClaw wydanego w `v2026.4.22` i później. Aby zachować edytowany podgląd dla tekstu odpowiedzi, ale ukryć linie postępu narzędzi, ustaw:

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

    Aby postęp narzędzi pozostał widoczny, ale ukryć tekst command/exec, ustaw:

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

    W trybie wersji roboczej postępu umieść tę samą zasadę tekstu polecenia w `streaming.progress`:

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

    Używaj `streaming.mode: "off"` tylko wtedy, gdy chcesz dostarczania wyłącznie odpowiedzi końcowej: edycje podglądu Telegram są wyłączone, a ogólne komunikaty narzędzi/postępu są wyciszane zamiast wysyłania ich jako samodzielnych wiadomości statusu. Monity zatwierdzenia, ładunki multimedialne i błędy nadal przechodzą przez normalne dostarczanie końcowe. Użyj `streaming.preview.toolProgress: false`, gdy chcesz zachować tylko edycje podglądu odpowiedzi, ukrywając jednocześnie wiersze statusu postępu narzędzia.

    <Note>
      Odpowiedzi Telegram na wybrane cytaty są wyjątkiem. Gdy `replyToMode` ma wartość `"first"`, `"all"` lub `"batched"`, a wiadomość przychodząca zawiera wybrany tekst cytatu, OpenClaw wysyła odpowiedź końcową przez natywną ścieżkę odpowiedzi z cytatem Telegram zamiast edytować podgląd odpowiedzi, więc `streaming.preview.toolProgress` nie może pokazać krótkich wierszy statusu dla tej tury. Odpowiedzi na bieżącą wiadomość bez wybranego tekstu cytatu nadal zachowują strumieniowanie podglądu. Ustaw `replyToMode: "off"`, gdy widoczność postępu narzędzia jest ważniejsza niż natywne odpowiedzi z cytatem, albo ustaw `streaming.preview.toolProgress: false`, aby zaakceptować ten kompromis.
    </Note>

    Dla odpowiedzi wyłącznie tekstowych:

    - krótkie podglądy w DM/grupie/temacie: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu, chyba że po pojawieniu się podglądu wysłano widoczną wiadomość niebędącą podglądem
    - długie końcowe odpowiedzi tekstowe dzielone na wiele wiadomości Telegram ponownie używają istniejącego podglądu jako pierwszego końcowego fragmentu, gdy to możliwe, a następnie wysyłają tylko pozostałe fragmenty
    - podglądy, po których następuje widoczne wyjście niebędące podglądem: OpenClaw wysyła ukończoną odpowiedź jako nową wiadomość końcową i czyści starszy podgląd, dzięki czemu odpowiedź końcowa pojawia się po wyjściu pośrednim
    - podglądy starsze niż około jedna minuta: OpenClaw wysyła ukończoną odpowiedź jako nową wiadomość końcową, a następnie czyści podgląd, dzięki czemu widoczny znacznik czasu Telegram odzwierciedla czas ukończenia zamiast czasu utworzenia podglądu

    Dla złożonych odpowiedzi (na przykład ładunków multimedialnych) OpenClaw przełącza się na normalne dostarczanie końcowe, a następnie czyści wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielne od strumieniowania bloków. Gdy strumieniowanie bloków jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - podgląd rozumowania jest usuwany po dostarczeniu końcowym; użyj `/reasoning on`, gdy rozumowanie powinno pozostać widoczne
    - odpowiedź końcowa jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i awaryjny HTML">
    Tekst wychodzący używa Telegram `parse_mode: "HTML"`.

    - Tekst w stylu Markdown jest renderowany do HTML bezpiecznego dla Telegram.
    - Surowy HTML modelu jest escapowany, aby ograniczyć błędy parsowania Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponawia próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć za pomocą `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Polecenia natywne i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana przy uruchamianiu za pomocą `setMyCommands`.

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

    Zasady:

    - nazwy są normalizowane (usunięcie początkowego `/`, małe litery)
    - prawidłowy wzorzec: `a-z`, `0-9`, `_`, długość `1..32`
    - polecenia niestandardowe nie mogą zastępować poleceń natywnych
    - konflikty/duplikaty są pomijane i logowane

    Uwagi:

    - polecenia niestandardowe są tylko wpisami menu; nie implementują automatycznie zachowania
    - polecenia pluginu/umiejętności mogą nadal działać po wpisaniu, nawet jeśli nie są pokazane w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/pluginu mogą nadal się rejestrować, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przekracza limit po przycięciu; zmniejsz liczbę poleceń pluginu/umiejętności/niestandardowych albo wyłącz `channels.telegram.commands.native`.
    - Niepowodzenie `deleteWebhook`, `deleteMyCommands` lub `setMyCommands` z `404: Not Found`, podczas gdy bezpośrednie polecenia curl Bot API działają, może oznaczać, że `channels.telegram.apiRoot` ustawiono na pełny punkt końcowy `/bot<TOKEN>`. `apiRoot` musi być tylko katalogiem głównym Bot API, a `openclaw doctor --fix` usuwa przypadkowe końcowe `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Zaktualizuj `botToken`, `tokenFile` lub `TELEGRAM_BOT_TOKEN`, używając bieżącego tokenu BotFather; OpenClaw zatrzymuje się przed odpytywaniem, więc nie jest to zgłaszane jako błąd czyszczenia webhooka.
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

    Kod konfiguracji przenosi krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap utrzymuje token węzła podstawowego przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Kontrole zakresu bootstrap mają prefiks roli, więc ta lista dozwolonych operatora spełnia tylko żądania operatora; role nieoperatorskie nadal potrzebują zakresów pod własnym prefiksem roli.

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
    - `allowlist` (domyślne)

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

    - `sendMessage` (`to`, `content`, opcjonalne `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcjonalne `iconColor`, `iconCustomEmojiId`)

    Akcje wiadomości kanału udostępniają ergonomiczne aliasy (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrole bramkowania:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają oddzielnych przełączników `channels.telegram.actions.*`.
    Wysyłki w czasie wykonywania używają aktywnej migawki konfiguracji/sekretów (uruchomienie/przeładowanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdym wysłaniu.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątkowania odpowiedzi">
    Telegram obsługuje jawne tagi wątkowania odpowiedzi w wygenerowanym wyjściu:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na konkretny identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` kontroluje obsługę:

    - `off` (domyślne)
    - `first`
    - `all`

    Gdy wątkowanie odpowiedzi jest włączone, a oryginalny tekst lub podpis Telegram jest dostępny, OpenClaw automatycznie dołącza natywny fragment cytatu Telegram. Telegram ogranicza natywny tekst cytatu do 1024 jednostek kodowych UTF-16, więc dłuższe wiadomości są cytowane od początku i przechodzą do zwykłej odpowiedzi, jeśli Telegram odrzuci cytat.

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` nadal są honorowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematu dodają `:topic:<threadId>`
    - odpowiedzi i pisanie są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Specjalny przypadek tematu ogólnego (`threadId=1`):

    - wysyłki wiadomości pomijają `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje pisania nadal zawierają `message_thread_id`

    Dziedziczenie tematu: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy z domyślnych ustawień grupy.

    **Routing agenta dla każdego tematu**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Dzięki temu każdy temat ma własny izolowany obszar roboczy, pamięć i sesję. Przykład:

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

    **Trwałe powiązanie tematu ACP**: Tematy forum mogą przypinać sesje uprzęży ACP przez typowane powiązania ACP najwyższego poziomu (`bindings[]` z `type: "acp"` i `match.channel: "telegram"`, `peer.kind: "group"` oraz identyfikatorem kwalifikowanym tematem, takim jak `-1001234567890:topic:42`). Obecnie ograniczone do tematów forum w grupach/supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Uruchamianie ACP związane z wątkiem z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne odpowiedzi trafiają tam bezpośrednio. OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga, aby `channels.telegram.threadBindings.spawnSessions` pozostało włączone (domyślnie: `true`).

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` domyślnie zachowują routing DM i metadane odpowiedzi w płaskich sesjach; używają kluczy sesji świadomych wątków tylko wtedy, gdy skonfigurowano `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` albo pasującą konfigurację tematu. Użyj najwyższego poziomu `channels.telegram.dm.threadReplies` jako wartości domyślnej konta albo `direct.<chatId>.threadReplies` dla jednej rozmowy DM.

  </Accordion>

  <Accordion title="Dźwięk, wideo i naklejki">
    ### Wiadomości dźwiękowe

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - znacznik `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie notatki głosowej
    - transkrypcje przychodzących notatek głosowych są ujmowane w kontekście agenta jako tekst wygenerowany maszynowo i niezaufany; wykrywanie wzmianki nadal używa surowej transkrypcji, więc wiadomości głosowe bramkowane wzmianką nadal działają.

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

    - statyczne WEBP: pobierane i przetwarzane (placeholder `<media:sticker>`)
    - animowane TGS: pomijane
    - wideo WEBM: pomijane

    Pola kontekstu naklejki:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Plik pamięci podręcznej naklejek:

    - `~/.openclaw/telegram/sticker-cache.json`

    Naklejki są opisywane raz (gdy to możliwe) i zapisywane w pamięci podręcznej, aby ograniczyć powtarzane wywołania wizyjne.

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

    Akcja wysyłania naklejki:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Przeszukaj naklejki w pamięci podręcznej:

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

    Po włączeniu OpenClaw umieszcza w kolejce zdarzenia systemowe takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkowników na wiadomości wysłane przez bota (best effort przez pamięć podręczną wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrolę dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie podaje identyfikatorów wątków w aktualizacjach reakcji.
      - grupy bez forum kierują do sesji czatu grupowego
      - grupy forum kierują do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla polling/Webhook automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje ack">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

    Kolejność rozstrzygania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - awaryjna wartość emoji z tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

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

  <Accordion title="Długie odpytywanie kontra Webhook">
    Domyślne jest długie odpytywanie. Dla trybu Webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (domyślnie `/telegram-webhook`, `127.0.0.1`, `8787`).

    Lokalny listener wiąże się z `127.0.0.1:8787`. Dla publicznego wejścia wystaw reverse proxy przed portem lokalnym albo celowo ustaw `webhookHost: "0.0.0.0"`.

    Tryb Webhook sprawdza zabezpieczenia żądania, tajny token Telegram i ciało JSON przed zwróceniem `200` do Telegram.
    Następnie OpenClaw przetwarza aktualizację asynchronicznie przez te same tory bota per czat/per temat, których używa długie odpytywanie, więc powolne tury agenta nie blokują ACK dostarczenia Telegram.

  </Accordion>

  <Accordion title="Limity, ponawianie i cele CLI">
    - `channels.telegram.textChunkLimit` domyślnie wynosi 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów Telegram.
    - `channels.telegram.mediaGroupFlushMs` (domyślnie 500) kontroluje, jak długo albumy/grupy multimediów Telegram są buforowane, zanim OpenClaw wyśle je jako jedną wiadomość przychodzącą. Zwiększ tę wartość, jeśli części albumu docierają późno; zmniejsz ją, aby ograniczyć opóźnienie odpowiedzi na album.
    - `channels.telegram.timeoutSeconds` nadpisuje timeout klienta API Telegram (jeśli nie ustawiono, obowiązuje domyślna wartość grammY). Klienci botów ograniczają skonfigurowane wartości poniżej 60-sekundowego zabezpieczenia żądania wychodzącego tekstu/pisania, aby grammY nie przerwało dostarczenia widocznej odpowiedzi, zanim uruchomią się zabezpieczenie transportu i fallback OpenClaw. Długie odpytywanie nadal używa 45-sekundowego zabezpieczenia żądania `getUpdates`, aby bezczynne odpytywania nie były porzucane bezterminowo.
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; dostrajaj w zakresie od `30000` do `600000` tylko przy fałszywie dodatnich restartach z powodu zastoju polling.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` albo `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - uzupełniający kontekst odpowiedzi/cytatu/przekazania jest obecnie przekazywany tak, jak został otrzymany.
    - allowlisty Telegram głównie bramkują, kto może wyzwolić agenta, a nie stanowią pełnej granicy redakcji kontekstu uzupełniającego.
    - Kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - konfiguracja `channels.telegram.retry` dotyczy helperów wysyłania Telegram (CLI/narzędzia/akcje) dla możliwych do odzyskania błędów wychodzącego API. Dostarczenie końcowej odpowiedzi przychodzącej także używa ograniczonego ponowienia bezpiecznego wysyłania dla awarii Telegram sprzed połączenia, ale nie ponawia niejednoznacznych kopert sieciowych po wysłaniu, które mogłyby zduplikować widoczne wiadomości.

    Cele wysyłki CLI i narzędzia wiadomości mogą być numerycznym ID czatu, nazwą użytkownika albo celem tematu forum:

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

    Wysyłanie Telegram obsługuje także:

    - `--presentation` z blokami `buttons` dla klawiatur inline, gdy `channels.telegram.capabilities.inlineButtons` na to pozwala
    - `--pin` albo `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać w tym czacie
    - `--force-document`, aby wysyłać obrazy wychodzące i GIF-y jako dokumenty zamiast skompresowanych zdjęć albo przesyłania animowanych multimediów

    Bramkowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając włączone zwykłe wysyłki

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM zatwierdzających i może opcjonalnie publikować prompty w czacie lub temacie źródłowym. Zatwierdzający muszą być numerycznymi ID użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy co najmniej jeden zatwierdzający jest rozwiązywalny)
    - `channels.telegram.execApprovals.approvers` (cofa się do numerycznych ID właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` kontrolują, kto może rozmawiać z botem i gdzie bot wysyła zwykłe odpowiedzi. Nie czynią nikogo zatwierdzającym exec. Pierwsze zatwierdzone parowanie DM bootstrapuje `commands.ownerAllowFrom`, gdy nie istnieje jeszcze właściciel poleceń, więc konfiguracja z jednym właścicielem nadal działa bez duplikowania ID w `execApprovals.approvers`.

    Dostarczenie kanałem pokazuje tekst polecenia w czacie; włączaj `channel` albo `both` tylko w zaufanych grupach/tematach. Gdy prompt trafia do tematu forum, OpenClaw zachowuje temat dla promptu zatwierdzenia i dalszej odpowiedzi. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzenia inline również wymagają, aby `channels.telegram.capabilities.inlineButtons` zezwalało na docelową powierzchnię (`dm`, `group` albo `all`). ID zatwierdzeń z prefiksem `plugin:` są rozwiązywane przez zatwierdzenia pluginów; pozostałe najpierw przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrolki odpowiedzi błędów

Gdy agent napotka błąd dostarczenia lub dostawcy, Telegram może odpowiedzieć tekstem błędu albo go wyciszyć. To zachowanie kontrolują dwa klucze konfiguracji:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                              |
| ----------------------------------- | ----------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła przyjazny komunikat błędu do czatu. `silent` całkowicie wycisza odpowiedzi błędów. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | Minimalny czas między odpowiedziami błędów do tego samego czatu. Zapobiega spamowi błędów podczas awarii. |

Obsługiwane są nadpisania per konto, per grupa i per temat (to samo dziedziczenie co dla innych kluczy konfiguracji Telegram).

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
      - BotFather: `/setprivacy` -> Wyłącz
      - następnie usuń bota z grupy i dodaj go ponownie
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne identyfikatory grup; wieloznacznik `"*"` nie może być sprawdzony pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (albo zawierać `"*"`)
    - sprawdź członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow`, aby znaleźć powody pominięcia

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - autoryzuj swoją tożsamość nadawcy (parowanie lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy zasada grupy ma wartość `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele pozycji; ogranicz polecenia pluginów/Skills/niestandardowe albo wyłącz natywne menu
    - wywołania startowe `deleteMyCommands` / `setMyCommands` oraz wywołania wpisywania `sendChatAction` są ograniczone czasowo i ponawiane raz przez zapasowy transport Telegram po przekroczeniu limitu czasu żądania. Utrzymujące się błędy sieciowe/fetch zwykle wskazują na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` to błąd uwierzytelniania Telegram dla skonfigurowanego tokena bota.
    - Skopiuj ponownie albo wygeneruj ponownie token bota w BotFather, a następnie zaktualizuj `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` albo `TELEGRAM_BOT_TOKEN` dla konta domyślnego.
    - `deleteWebhook 401 Unauthorized` podczas uruchamiania również jest błędem uwierzytelniania; potraktowanie go jako „brak istniejącego Webhook” jedynie odłożyłoby tę samą awarię błędnego tokena do późniejszych wywołań API.

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ oraz niestandardowy fetch/proxy mogą wyzwalać natychmiastowe przerywanie, jeśli typy AbortSignal się nie zgadzają.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` do IPv6; niedziałający ruch wychodzący IPv6 może powodować sporadyczne awarie API Telegram.
    - Jeśli logi zawierają `TypeError: fetch failed` albo `Network request for 'getUpdates' failed!`, OpenClaw ponawia je teraz jako możliwe do odzyskania błędy sieciowe.
    - Podczas uruchamiania odpytywania OpenClaw ponownie używa udanej startowej próby `getMe` dla grammY, więc runner nie potrzebuje drugiego `getMe` przed pierwszym `getUpdates`.
    - Jeśli `deleteWebhook` zawiedzie z przejściowym błędem sieciowym podczas uruchamiania odpytywania, OpenClaw przechodzi do long polling zamiast wykonywać kolejne przedodpytywaniowe wywołanie płaszczyzny sterowania. Nadal aktywny Webhook ujawni się jako konflikt `getUpdates`; OpenClaw przebuduje wtedy transport Telegram i ponowi czyszczenie Webhook.
    - Jeśli gniazda Telegram są odnawiane w krótkim, stałym cyklu, sprawdź, czy `channels.telegram.timeoutSeconds` nie ma niskiej wartości; klienci botów ograniczają skonfigurowane wartości poniżej zabezpieczeń żądań wychodzących i `getUpdates`, ale starsze wersje mogły przerywać każde odpytywanie lub odpowiedź, gdy ta wartość była ustawiona poniżej tych zabezpieczeń.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw domyślnie restartuje odpytywanie i przebudowuje transport Telegram po 120 sekundach bez ukończonej żywotności long-poll.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy działające konto odpytywania nie ukończyło `getUpdates` po okresie karencji uruchamiania, gdy działające konto Webhook nie ukończyło `setWebhook` po okresie karencji uruchamiania albo gdy ostatnia udana aktywność transportu odpytywania jest nieaktualna.
    - Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zatrzymania odpytywania. Utrzymujące się zatrzymania zwykle wskazują na problemy z proxy, DNS, IPv6 albo ruchem wychodzącym TLS między hostem a `api.telegram.org`.
    - Telegram respektuje również zmienne środowiskowe proxy procesu dla transportu Bot API, w tym `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` oraz ich warianty pisane małymi literami. `NO_PROXY` / `no_proxy` nadal mogą omijać `api.telegram.org`.
    - Jeśli zarządzane proxy OpenClaw jest skonfigurowane przez `OPENCLAW_PROXY_URL` dla środowiska usługi i nie ma standardowej zmiennej środowiskowej proxy, Telegram również używa tego URL-a do transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim ruchem wychodzącym/TLS kieruj wywołania API Telegram przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2). Kolejność wyników DNS Telegram respektuje najpierw `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, potem `channels.telegram.network.dnsResultOrder`, a następnie domyślne ustawienie procesu, takie jak `NODE_OPTIONS=--dns-result-order=ipv4first`; jeśli żadne nie ma zastosowania, Node 22+ wraca do `ipv4first`.
    - Jeśli host działa w WSL2 albo jawnie działa lepiej z zachowaniem wyłącznie IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu testów porównawczych RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania mediów Telegram. Jeśli zaufane fake-IP albo
      przezroczyste proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/specjalnego przeznaczenia adres podczas pobierania mediów, możesz
      włączyć obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo włączenie jest dostępne dla konta pod
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli proxy rozwiązuje hosty mediów Telegram do `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Media Telegram już domyślnie zezwalają
      na zakres testów porównawczych RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia
      SSRF mediów Telegram. Używaj tego tylko w zaufanych, kontrolowanych przez operatora
      środowiskach proxy, takich jak routing fake-IP Clash, Mihomo albo Surge, gdy
      syntetyzują prywatne lub specjalnego przeznaczenia odpowiedzi spoza zakresu testów porównawczych
      RFC 2544. Pozostaw wyłączone dla zwykłego publicznego dostępu Telegram przez internet.
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

<Accordion title="High-signal Telegram fields">

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; dowiązania symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- zatwierdzenia exec: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (podgląd), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/sieć: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- niestandardowy korzeń API: `apiRoot` (tylko korzeń Bot API; nie dołączaj `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Pierwszeństwo wielu kont: gdy skonfigurowane są co najmniej dwa identyfikatory kont, ustaw `channels.telegram.defaultAccount` (albo dołącz `channels.telegram.accounts.default`), aby jawnie określić domyślny routing. W przeciwnym razie OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` ostrzega. Nazwane konta dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Telegram z Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pl/channels/groups">
    Zachowanie list dozwolonych grup i tematów.
  </Card>
  <Card title="Channel routing" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Security" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj grupy i tematy do agentów.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa.
  </Card>
</CardGroup>
