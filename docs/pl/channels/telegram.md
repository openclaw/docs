---
read_when:
    - Praca nad funkcjami Telegram lub Webhook
summary: Stan obsługi botów Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:36:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

Gotowe do produkcji dla wiadomości prywatnych botów i grup przez grammY. Long polling jest trybem domyślnym; tryb webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną zasadą wiadomości prywatnych dla Telegram jest parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce konfiguracji kanałów i przykłady.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Utwórz token bota w BotFather">
    Otwórz Telegram i porozmawiaj z **@BotFather** (upewnij się, że nazwa użytkownika to dokładnie `@BotFather`).

    Uruchom `/newbot`, postępuj zgodnie z monitami i zapisz token.

  </Step>

  <Step title="Skonfiguruj token i zasadę wiadomości prywatnych">

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

  <Step title="Uruchom gateway i zatwierdź pierwszą wiadomość prywatną">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kody parowania wygasają po 1 godzinie.

  </Step>

  <Step title="Dodaj bota do grupy">
    Dodaj bota do swojej grupy, a następnie uzyskaj oba identyfikatory potrzebne do dostępu grupowego:

    - Twój identyfikator użytkownika Telegram, używany w `allowFrom` / `groupAllowFrom`
    - identyfikator czatu grupowego Telegram, używany jako klucz w `channels.telegram.groups`

    Przy pierwszej konfiguracji uzyskaj identyfikator czatu grupowego z `openclaw logs --follow`, bota przekazującego identyfikatory lub Bot API `getUpdates`. Po dopuszczeniu grupy `/whoami@<bot_username>` może potwierdzić identyfikatory użytkownika i grupy.

    Ujemne identyfikatory supergrup Telegram zaczynające się od `-100` są identyfikatorami czatów grupowych. Umieść je w `channels.telegram.groups`, nie w `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Kolejność rozwiązywania tokenów uwzględnia konto. W praktyce wartości z konfiguracji mają pierwszeństwo przed zapasowym źródłem z env, a `TELEGRAM_BOT_TOKEN` ma zastosowanie tylko do konta domyślnego.
Po pomyślnym uruchomieniu OpenClaw zapisuje tożsamość bota w katalogu stanu na maksymalnie 24 godziny, aby ponowne uruchomienia mogły uniknąć dodatkowego wywołania Telegram `getMe`; zmiana lub usunięcie tokena czyści ten cache.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność w grupach">
    Boty Telegram domyślnie używają **trybu prywatności**, który ogranicza wiadomości grupowe, jakie otrzymują.

    Jeśli bot musi widzieć wszystkie wiadomości grupowe, wykonaj jedno z poniższych:

    - wyłącz tryb prywatności przez `/setprivacy`, albo
    - ustaw bota jako administratora grupy.

    Przy przełączaniu trybu prywatności usuń i ponownie dodaj bota w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty będące administratorami otrzymują wszystkie wiadomości grupowe, co jest przydatne dla stale aktywnego zachowania grupowego.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwalać na dodawanie do grup lub tego zabraniać
    - `/setprivacy` dla zachowania widoczności w grupie

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

### Tożsamość bota w grupie

W grupach Telegram i tematach forum jawna wzmianka o skonfigurowanej nazwie użytkownika bota (na przykład `@my_bot`) jest traktowana jako adresowanie wybranego agenta OpenClaw, nawet jeśli nazwa persony agenta różni się od nazwy użytkownika Telegram. Zasada ciszy w grupie nadal ma zastosowanie do niepowiązanego ruchu grupowego, ale sama nazwa użytkownika bota nie jest uznawana za „kogoś innego”.

<Tabs>
  <Tab title="Zasada wiadomości prywatnych">
    `channels.telegram.dmPolicy` kontroluje dostęp przez wiadomości prywatne:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `dmPolicy: "open"` z `allowFrom: ["*"]` pozwala dowolnemu kontu Telegram, które znajdzie lub odgadnie nazwę użytkownika bota, wydawać botowi polecenia. Używaj tego tylko dla celowo publicznych botów z mocno ograniczonymi narzędziami; boty z jednym właścicielem powinny używać `allowlist` z liczbowymi identyfikatorami użytkowników.

    `channels.telegram.allowFrom` akceptuje liczbowe identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    W konfiguracjach wielokontowych restrykcyjne `channels.telegram.allowFrom` najwyższego poziomu jest traktowane jako granica bezpieczeństwa: wpisy `allowFrom: ["*"]` na poziomie konta nie czynią tego konta publicznym, chyba że efektywna lista dozwolonych kont nadal zawiera jawną gwiazdkę po scaleniu.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie wiadomości prywatne i jest odrzucane przez walidację konfiguracji.
    Konfigurator pyta tylko o liczbowe identyfikatory użytkowników.
    Jeśli po aktualizacji konfiguracja zawiera wpisy listy dozwolonych `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (najlepsza możliwa próba; wymaga tokena bota Telegram).
    Jeśli wcześniej polegano na plikach listy dozwolonych w magazynie parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach listy dozwolonych (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    W przypadku botów z jednym właścicielem preferuj `dmPolicy: "allowlist"` z jawnymi liczbowymi identyfikatorami `allowFrom`, aby zasada dostępu była trwała w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania wiadomości prywatnych nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp do wiadomości prywatnych. Jeśli właściciel poleceń jeszcze nie istnieje, pierwsze zatwierdzone parowanie ustawia również `commands.ownerAllowFrom`, dzięki czemu polecenia tylko dla właściciela i zatwierdzenia exec mają jawne konto operatora.
    Autoryzacja nadawcy w grupie nadal pochodzi z jawnych list dozwolonych w konfiguracji.
    Jeśli oczekujesz „autoryzuję się raz i działają zarówno wiadomości prywatne, jak i polecenia grupowe”, umieść swój liczbowy identyfikator użytkownika Telegram w `channels.telegram.allowFrom`; dla poleceń tylko dla właściciela upewnij się, że `commands.ownerAllowFrom` zawiera `telegram:<your user id>`.

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

  <Tab title="Zasada grup i listy dozwolonych">
    Dwa mechanizmy kontroli działają razem:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - z `groupPolicy: "open"`: dowolna grupa może przejść kontrole identyfikatora grupy
         - z `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako lista dozwolonych (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców w grupach. Jeśli nie jest ustawione, Telegram używa jako zapasowego `allowFrom`.
    Wpisy `groupAllowFrom` powinny być liczbowymi identyfikatorami użytkowników Telegram (prefiksy `telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatów grupowych ani supergrup Telegram w `groupAllowFrom`. Ujemne identyfikatory czatów należą do `channels.telegram.groups`.
    Wpisy nieliczbowe są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawcy w grupie **nie** dziedziczy zatwierdzeń z magazynu parowania wiadomości prywatnych.
    Parowanie pozostaje tylko dla wiadomości prywatnych. Dla grup ustaw `groupAllowFrom` albo `allowFrom` na poziomie grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram używa zapasowo `allowFrom` z konfiguracji, a nie magazynu parowania.
    Praktyczny wzorzec dla botów z jednym właścicielem: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i dopuść grupy docelowe w `channels.telegram.groups`.
    Uwaga dotycząca środowiska uruchomieniowego: jeśli całkowicie brakuje `channels.telegram`, środowisko uruchomieniowe domyślnie zamyka dostęp, używając `groupPolicy="allowlist"`, chyba że jawnie ustawiono `channels.defaults.groupPolicy`.

    Konfiguracja grupy tylko dla właściciela:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Przetestuj to z grupy za pomocą `@<bot_username> ping`. Zwykłe wiadomości grupowe nie uruchamiają bota, gdy `requireMention: true`.

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

      - Ujemne identyfikatory czatów grupowych lub supergrup Telegram, takie jak `-1001234567890`, umieszczaj w `channels.telegram.groups`.
      - Identyfikatory użytkowników Telegram, takie jak `8734062810`, umieszczaj w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą uruchamiać bota.
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

    Kontekst historii grupy domyślnie ma wartość `mention-only`: wcześniejsze wiadomości grupowe są
    uwzględniane tylko wtedy, gdy były zaadresowane do bota, są odpowiedziami do bota
    albo są własnymi wiadomościami bota. Ustaw `includeGroupHistoryContext: "recent"`, aby
    uwzględniać najnowszą historię pokoju dla zaufanych grup. Ustaw
    `includeGroupHistoryContext: "none"`, aby nie wysyłać wcześniejszej historii grupy Telegram
    z następną turą.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    Uzyskiwanie identyfikatora czatu grupowego:

    - przekaż wiadomość grupową do `@userinfobot` / `@getidsbot`
    - albo odczytaj `chat.id` z `openclaw logs --follow`
    - albo sprawdź Bot API `getUpdates`
    - po dopuszczeniu grupy uruchom `/whoami@<bot_username>`, jeśli natywne polecenia są włączone

  </Tab>
</Tabs>

## Zachowanie środowiska uruchomieniowego

- Telegram jest własnością procesu Gateway.
- Routing jest deterministyczny: przychodzące odpowiedzi z Telegram wracają do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do wspólnej koperty kanału z metadanymi odpowiedzi, placeholderami multimediów oraz utrwalonym kontekstem łańcucha odpowiedzi dla odpowiedzi Telegram zaobserwowanych przez Gateway.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dodają `:topic:<threadId>`, aby zachować izolację tematów.
- Wiadomości DM mogą zawierać `message_thread_id`; OpenClaw zachowuje je dla odpowiedzi. Sesje tematów DM rozdzielają się tylko wtedy, gdy Telegram `getMe` zgłasza `has_topics_enabled: true` dla bota; w przeciwnym razie DM pozostają w płaskiej sesji.
- Long polling używa grammY runner z sekwencjonowaniem per czat/per wątek. Ogólna współbieżność ujścia runner używa `agents.defaults.maxConcurrent`.
- Uruchamianie wielu kont ogranicza współbieżne sondy Telegram `getMe`, aby duże floty botów nie uruchamiały sondowania wszystkich kont naraz.
- Long polling jest chroniony wewnątrz każdego procesu Gateway, więc tylko jeden aktywny poller może używać tokenu bota w danym momencie. Jeśli nadal widzisz konflikty `getUpdates` 409, prawdopodobnie inny Gateway OpenClaw, skrypt lub zewnętrzny poller używa tego samego tokenu.
- Restarty mechanizmu nadzorującego long polling domyślnie wyzwalają się po 120 sekundach bez ukończonego sygnału żywotności `getUpdates`. Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy twoje wdrożenie nadal widzi fałszywe restarty z powodu zacięcia odpytywania podczas długotrwałej pracy. Wartość jest w milisekundach i jest dozwolona w zakresie od `30000` do `600000`; obsługiwane są nadpisania per konto.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

<Note>
  `channels.telegram.dm.threadReplies` i `channels.telegram.direct.<chatId>.threadReplies` zostały usunięte. Uruchom `openclaw doctor --fix` po uaktualnieniu, jeśli twoja konfiguracja nadal ma te klucze. Routing tematów DM jest teraz zgodny z możliwością bota z Telegram `getMe.has_topics_enabled`, która jest kontrolowana przez tryb wątków BotFather: boty z włączonymi tematami używają sesji DM zakresowanych do wątku, gdy Telegram wysyła `message_thread_id`; pozostałe DM pozostają w płaskiej sesji.
</Note>

## Dokumentacja funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumieniowania na żywo (edycje wiadomości)">
    OpenClaw może strumieniować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` to `off | partial | block | progress` (domyślnie: `partial`)
    - krótkie początkowe podglądy odpowiedzi są debounce’owane, a następnie materializowane po ograniczonym opóźnieniu, jeśli uruchomienie nadal jest aktywne
    - `progress` utrzymuje jedną edytowalną wersję roboczą statusu dla postępu narzędzia, pokazuje stabilną etykietę statusu, gdy aktywność odpowiedzi pojawia się przed postępem narzędzia, czyści ją po ukończeniu i wysyła końcową odpowiedź jako zwykłą wiadomość
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzia/postępu ponownie używają tej samej edytowanej wiadomości podglądu (domyślnie: `true`, gdy strumieniowanie podglądu jest aktywne)
    - `streaming.preview.commandText` kontroluje szczegóły polecenia/wykonania w tych wierszach postępu narzędzia: `raw` (domyślnie, zachowuje wydane zachowanie) lub `status` (tylko etykieta narzędzia)
    - `streaming.progress.commentary` (domyślnie: `false`) włącza tekst komentarza/preambuły asystenta w tymczasowej wersji roboczej postępu
    - starsze `channels.telegram.streamMode`, boolean wartości `streaming` oraz wycofane natywne klucze podglądu wersji roboczej są wykrywane; uruchom `openclaw doctor --fix`, aby zmigrować je do bieżącej konfiguracji strumieniowania

    Aktualizacje podglądu postępu narzędzia to krótkie wiersze statusu pokazywane podczas działania narzędzi, na przykład wykonywania poleceń, odczytów plików, aktualizacji planowania, podsumowań poprawek lub tekstu preambuły/komentarza Codex w trybie serwera aplikacji Codex. Telegram pozostawia je domyślnie włączone, aby dopasować wydane zachowanie OpenClaw od `v2026.4.22` i późniejszych.

    Aby zachować edytowany podgląd tekstu odpowiedzi, ale ukryć wiersze postępu narzędzia, ustaw:

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

    Aby zachować widoczny postęp narzędzia, ale ukryć tekst polecenia/wykonania, ustaw:

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

    Użyj trybu `progress`, gdy chcesz widocznego postępu narzędzia bez edytowania końcowej odpowiedzi w tej samej wiadomości. Umieść politykę tekstu polecenia pod `streaming.progress`:

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

    Używaj `streaming.mode: "off"` tylko wtedy, gdy chcesz dostarczania wyłącznie końcowego: edycje podglądu Telegram są wyłączone, a ogólny szum narzędzi/postępu jest tłumiony zamiast wysyłany jako samodzielne wiadomości statusu. Monity zatwierdzeń, ładunki multimediów i błędy nadal przechodzą przez normalne dostarczanie końcowe. Użyj `streaming.preview.toolProgress: false`, gdy chcesz tylko zachować edycje podglądu odpowiedzi, ukrywając wiersze statusu postępu narzędzia.

    <Note>
      Wybrane odpowiedzi z cytatem Telegram są wyjątkiem. Gdy `replyToMode` ma wartość `"first"`, `"all"` lub `"batched"` i wiadomość przychodząca zawiera wybrany tekst cytatu, OpenClaw wysyła końcową odpowiedź przez natywną ścieżkę odpowiedzi z cytatem Telegram zamiast edytować podgląd odpowiedzi, więc `streaming.preview.toolProgress` nie może pokazać krótkich wierszy statusu dla tego przebiegu. Odpowiedzi na bieżącą wiadomość bez wybranego tekstu cytatu nadal zachowują strumieniowanie podglądu. Ustaw `replyToMode: "off"`, gdy widoczność postępu narzędzia jest ważniejsza niż natywne odpowiedzi z cytatem, albo ustaw `streaming.preview.toolProgress: false`, aby zaakceptować ten kompromis.
    </Note>

    Dla odpowiedzi wyłącznie tekstowych:

    - krótkie podglądy DM/grupy/tematu: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu
    - długie końcowe teksty dzielone na wiele wiadomości Telegram ponownie używają istniejącego podglądu jako pierwszego końcowego fragmentu, gdy to możliwe, a następnie wysyłają tylko pozostałe fragmenty
    - końcowe odpowiedzi w trybie postępu czyszczą wersję roboczą statusu i używają normalnego dostarczania końcowego zamiast edytować wersję roboczą w odpowiedź
    - jeśli końcowa edycja nie powiedzie się, zanim ukończony tekst zostanie potwierdzony, OpenClaw używa normalnego dostarczania końcowego i czyści nieaktualny podgląd

    Dla złożonych odpowiedzi (na przykład ładunków multimediów) OpenClaw wraca do normalnego dostarczania końcowego, a następnie czyści wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielne od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Zachowanie strumienia rozumowania:

    - `/reasoning stream` używa ścieżki podglądu rozumowania obsługiwanego kanału; w Telegram strumieniuje rozumowanie do podglądu na żywo podczas generowania
    - podgląd rozumowania jest usuwany po dostarczeniu końcowym; użyj `/reasoning on`, gdy rozumowanie ma pozostać widoczne
    - końcowa odpowiedź jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Bogate formatowanie wiadomości">
    Tekst wychodzący domyślnie używa standardowych wiadomości HTML Telegram, aby odpowiedzi pozostawały czytelne w bieżących klientach Telegram. Ten tryb zgodności obsługuje zwykłe pogrubienie, kursywę, linki, kod, spoilery i cytaty, ale nie obsługuje bloków dostępnych tylko w bogatym formacie Bot API 10.1, takich jak natywne tabele, szczegóły, bogate multimedia i formuły.

    Ustaw `channels.telegram.richMessages: true`, aby włączyć bogate wiadomości Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Po włączeniu:

    - Agent otrzymuje informację, że bogate wiadomości Telegram są dostępne dla tego bota/konta.
    - Tekst Markdown jest renderowany przez Markdown IR OpenClaw i wysyłany jako bogaty HTML Telegram.
    - Jawne ładunki bogatego HTML zachowują obsługiwane tagi Bot API 10.1, takie jak nagłówki, tabele, szczegóły, bogate multimedia i formuły.
    - Podpisy multimediów nadal używają podpisów HTML Telegram, ponieważ bogate wiadomości nie zastępują podpisów.

    Dzięki temu tekst modelu pozostaje z dala od znaczników Telegram Rich Markdown, więc wartości walutowe takie jak `$400-600K` nie są parsowane jako matematyka. Długi bogaty tekst jest automatycznie dzielony zgodnie z limitami bogatego tekstu i bogatych bloków Telegram. Tabele przekraczające limit kolumn Telegram są wysyłane jako bloki kodu.

    Domyślnie: wyłączone dla zgodności z klientami. Bogate wiadomości wymagają zgodnych klientów Telegram; niektóre obecne klienty Desktop, Web, Android i zewnętrzne wyświetlają zaakceptowane bogate wiadomości jako nieobsługiwane. Pozostaw tę opcję wyłączoną, chyba że każdy klient używany z botem potrafi je renderować. `/status` pokazuje, czy bieżąca sesja Telegram ma bogate wiadomości włączone czy wyłączone.

    Podglądy linków są domyślnie włączone. `channels.telegram.linkPreview: false` pomija automatyczne wykrywanie encji dla bogatego tekstu.

  </Accordion>

  <Accordion title="Natywne polecenia i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana podczas uruchamiania za pomocą `setMyCommands`.

    Domyślne polecenia natywne:

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

    - nazwy są normalizowane (usunięcie początkowego `/`, małe litery)
    - prawidłowy wzorzec: `a-z`, `0-9`, `_`, długość `1..32`
    - polecenia niestandardowe nie mogą nadpisywać poleceń natywnych
    - konflikty/duplikaty są pomijane i logowane

    Uwagi:

    - polecenia niestandardowe są tylko wpisami menu; nie implementują automatycznie zachowania
    - polecenia pluginów/Skills nadal mogą działać po wpisaniu, nawet jeśli nie są pokazane w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/pluginów mogą nadal się rejestrować, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przekroczyło limit po przycięciu; zmniejsz liczbę poleceń pluginów/Skills/niestandardowych albo wyłącz `channels.telegram.commands.native`.
    - Niepowodzenie `deleteWebhook`, `deleteMyCommands` lub `setMyCommands` z `404: Not Found`, gdy bezpośrednie polecenia curl Bot API działają, może oznaczać, że `channels.telegram.apiRoot` ustawiono na pełny endpoint `/bot<TOKEN>`. `apiRoot` musi być tylko korzeniem Bot API, a `openclaw doctor --fix` usuwa przypadkowy końcowy `/bot<TOKEN>`.
    - `getMe returned 401` oznacza, że Telegram odrzucił skonfigurowany token bota. Zaktualizuj `botToken`, `tokenFile` lub `TELEGRAM_BOT_TOKEN` bieżącym tokenem BotFather; OpenClaw zatrzymuje się przed odpytywaniem, więc nie jest to zgłaszane jako błąd czyszczenia Webhook.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzące DNS/HTTPS do `api.telegram.org` jest zablokowane.

    ### Polecenia parowania urządzenia (plugin `device-pair`)

    Gdy plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym role/zakresy)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji przenosi krótkotrwały token bootstrap. Wbudowany bootstrap kodu konfiguracji jest przeznaczony tylko dla węzła: pierwsze połączenie tworzy oczekujące żądanie węzła, a po zatwierdzeniu Gateway zwraca trwały token węzła z `scopes: []`. Nie zwraca przekazanego tokenu operatora; dostęp operatora wymaga oddzielnego zatwierdzonego parowania operatora lub przepływu tokenu.

    Jeśli urządzenie ponawia próbę ze zmienionymi szczegółami uwierzytelniania (na przykład rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostaje zastąpione, a nowe żądanie używa innego `requestId`. Uruchom ponownie `/pair pending` przed zatwierdzeniem.

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

    Przykład przycisku Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Przyciski Telegram `web_app` działają tylko w prywatnych czatach między użytkownikiem a
    botem.

    Kliknięcia callback, które nie zostaną obsłużone przez zarejestrowany interaktywny
    handler pluginu, są przekazywane agentowi jako tekst:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Akcje wiadomości Telegram dla agentów i automatyzacji">
    Akcje narzędzi Telegram obejmują:

    - `sendMessage` (`to`, `content`, opcjonalne `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` lub `caption`, opcjonalne przyciski inline `presentation`; edycje samych przycisków aktualizują znaczniki odpowiedzi)
    - `createForumTopic` (`chatId`, `name`, opcjonalne `iconColor`, `iconCustomEmojiId`)

    Akcje wiadomości kanału udostępniają ergonomiczne aliasy (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrole ograniczeń dostępu:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w czasie działania używają aktywnej migawki konfiguracji/sekretów (uruchomienie/przeładowanie), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef dla każdej wysyłki.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątkowania odpowiedzi">
    Telegram obsługuje jawne tagi wątkowania odpowiedzi w generowanych danych wyjściowych:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na konkretny identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` kontroluje obsługę:

    - `off` (domyślnie)
    - `first`
    - `all`

    Gdy wątkowanie odpowiedzi jest włączone, a oryginalny tekst lub podpis Telegram jest dostępny, OpenClaw automatycznie dołącza natywny cytat Telegram. Telegram ogranicza natywny tekst cytatu do 1024 jednostek kodu UTF-16, więc dłuższe wiadomości są cytowane od początku i przechodzą na zwykłą odpowiedź, jeśli Telegram odrzuci cytat.

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal honorowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy forum:

    - klucze sesji tematu dołączają `:topic:<threadId>`
    - odpowiedzi i wskaźniki pisania są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Szczególny przypadek tematu ogólnego (`threadId=1`):

    - wysyłki wiadomości pomijają `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje pisania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie dziedziczy z domyślnych ustawień grupy.
    `topics."*"` ustawia wartości domyślne dla każdego tematu w tej grupie; dokładne identyfikatory tematów nadal mają pierwszeństwo przed `"*"`.

    **Routing agentów dla poszczególnych tematów**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Dzięki temu każdy temat ma własny izolowany obszar roboczy, pamięć i sesję. Przykład:

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

    **Trwałe wiązanie tematu ACP**: Tematy forum mogą przypinać sesje uprzęży ACP przez typowane wiązania ACP najwyższego poziomu (`bindings[]` z `type: "acp"` oraz `match.channel: "telegram"`, `peer.kind: "group"` i identyfikatorem kwalifikowanym tematem, takim jak `-1001234567890:topic:42`). Obecnie ograniczone do tematów forum w grupach/supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Uruchamianie ACP powiązane z wątkiem z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; kolejne odpowiedzi trafiają tam bezpośrednio. OpenClaw przypina potwierdzenie uruchomienia w temacie. Wymaga, aby `channels.telegram.threadBindings.spawnSessions` pozostało włączone (domyślnie: `true`).

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` zachowują metadane odpowiedzi; używają kluczy sesji świadomych wątków tylko wtedy, gdy Telegram `getMe` zgłasza dla bota `has_topics_enabled: true`.
    Dawne nadpisania `dm.threadReplies` i `direct.*.threadReplies` zostały celowo wycofane; używaj trybu wątków BotFather jako jedynego źródła prawdy i uruchom `openclaw doctor --fix`, aby usunąć nieaktualne klucze konfiguracji.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie notatki głosowej
    - transkrypcje przychodzących notatek głosowych są ujmowane w kontekście agenta jako wygenerowany maszynowo,
      niezaufany tekst; wykrywanie wzmianek nadal używa surowej
      transkrypcji, więc wiadomości głosowe ograniczane wzmiankami nadal działają.

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

    Opisy naklejek są buforowane w stanie pluginu SQLite OpenClaw, aby ograniczyć powtarzane wywołania vision.

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

    Wyszukaj zbuforowane naklejki:

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
    Reakcje Telegram przychodzą jako aktualizacje `message_reaction` (osobno od treści wiadomości).

    Po włączeniu OpenClaw dodaje do kolejki zdarzenia systemowe takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkownika na wiadomości wysłane przez bota (best-effort przez pamięć podręczną wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrole dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy bez forum są kierowane do sesji czatu grupowego
      - grupy forum są kierowane do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla polling/webhook automatycznie obejmuje `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość. `ackReactionScope` decyduje, *kiedy* to emoji jest faktycznie wysyłane.

    **Kolejność rozstrzygania emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - awaryjne emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

    **Zakres (`messages.ackReactionScope`):**

    Dostawca Telegram odczytuje zakres z `messages.ackReactionScope` (domyślnie `"group-mentions"`). Obecnie nie ma nadpisania na poziomie konta Telegram ani kanału Telegram.

    Wartości: `"all"` (DM-y + grupy), `"direct"` (tylko DM-y), `"group-all"` (każda wiadomość grupowa, bez DM-ów), `"group-mentions"` (grupy, gdy bot zostanie wspomniany; **bez DM-ów** — to jest wartość domyślna), `"off"` / `"none"` (wyłączone).

    <Note>
    Domyślny zakres (`"group-mentions"`) nie uruchamia reakcji potwierdzających w wiadomościach bezpośrednich. Aby uzyskać reakcję potwierdzającą na przychodzące DM-y Telegram, ustaw `messages.ackReactionScope` na `"direct"` lub `"all"`. Wartość jest odczytywana przy starcie dostawcy Telegram, więc aby zmiana zaczęła obowiązywać, potrzebny jest restart gateway.
    </Note>

  </Accordion>

  <Accordion title="Zapisy konfiguracji ze zdarzeń i poleceń Telegram">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grupy (`migrate_to_chat_id`) w celu aktualizacji `channels.telegram.groups`
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

  <Accordion title="Long polling kontra webhook">
    Domyślnie używany jest long polling. Dla trybu webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (wartości domyślne: `/telegram-webhook`, `127.0.0.1`, `8787`).

    W trybie long polling OpenClaw utrwala swój znacznik wznowienia po restarcie dopiero po pomyślnym wysłaniu aktualizacji do obsługi. Jeśli handler zawiedzie, ta aktualizacja pozostaje możliwa do ponowienia w tym samym procesie i nie jest zapisywana jako ukończona na potrzeby deduplikacji po restarcie.

    Lokalny listener wiąże się z `127.0.0.1:8787`. Dla publicznego ruchu przychodzącego ustaw reverse proxy przed lokalnym portem albo celowo ustaw `webhookHost: "0.0.0.0"`.

    Tryb Webhook sprawdza zabezpieczenia żądania, tajny token Telegram oraz treść JSON przed zwróceniem `200` do Telegram.
    Następnie OpenClaw przetwarza aktualizację asynchronicznie przez te same bot lanes per czat/per temat, których używa long polling, więc powolne tury agenta nie wstrzymują potwierdzenia dostarczenia ACK Telegram.

  </Accordion>

  <Accordion title="Limity, ponawianie prób i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste wiersze) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów Telegram.
    - `channels.telegram.mediaGroupFlushMs` (domyślnie 500) kontroluje, jak długo albumy/grupy multimediów Telegram są buforowane, zanim OpenClaw wyśle je jako jedną wiadomość przychodzącą. Zwiększ tę wartość, jeśli części albumu docierają z opóźnieniem; zmniejsz ją, aby ograniczyć opóźnienie odpowiedzi na album.
    - `channels.telegram.timeoutSeconds` nadpisuje limit czasu klienta API Telegram (jeśli nie ustawiono, obowiązuje domyślna wartość grammY). Klienci botów ograniczają skonfigurowane wartości poniżej 60-sekundowego zabezpieczenia żądań wychodzącego tekstu/wpisywania, aby grammY nie przerwało dostarczania widocznej odpowiedzi, zanim zabezpieczenie transportu i mechanizm awaryjny OpenClaw zdążą się uruchomić. Długie odpytywanie nadal używa 45-sekundowego zabezpieczenia żądania `getUpdates`, aby bezczynne odpytywania nie były porzucane w nieskończoność.
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; dostrajaj w zakresie od `30000` do `600000` tylko w przypadku fałszywie dodatnich restartów z powodu zatrzymania odpytywania.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` albo `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - dodatkowy kontekst odpowiedzi/cytatu/przekazania jest normalizowany do jednego wybranego okna kontekstu rozmowy, gdy Gateway zaobserwował wiadomości nadrzędne; pamięć podręczna zaobserwowanych wiadomości znajduje się w stanie Plugin SQLite OpenClaw, a `openclaw doctor --fix` importuje starsze sidecary. Telegram uwzględnia w aktualizacjach tylko jedno płytkie `reply_to_message`, więc łańcuchy starsze niż pamięć podręczna są ograniczone do bieżącego payloadu aktualizacji Telegram.
    - listy dozwolonych Telegram przede wszystkim kontrolują, kto może wyzwolić agenta, a nie stanowią pełnej granicy redakcji kontekstu dodatkowego.
    - Kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfiguracja `channels.telegram.retry` dotyczy pomocników wysyłania Telegram (CLI/narzędzia/akcje) dla możliwych do odzyskania wychodzących błędów API. Dostarczanie końcowej odpowiedzi przychodzącej także używa ograniczonego bezpiecznego ponawiania wysyłki dla błędów Telegram przed połączeniem, ale nie ponawia niejednoznacznych powłok sieciowych po wysłaniu, które mogłyby zduplikować widoczne wiadomości.

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
    - `--pin` albo `--delivery '{"pin":true}'`, aby zażądać przypiętej dostawy, gdy bot może przypinać w tym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy, GIF-y i filmy jako dokumenty zamiast skompresowanych zdjęć, multimediów animowanych albo przesyłanych filmów

    Bramkowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając włączone zwykłe wysyłki

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM-ach zatwierdzających i może opcjonalnie publikować prośby w czacie albo temacie źródłowym. Zatwierdzający muszą być numerycznymi ID użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy co najmniej jeden zatwierdzający jest możliwy do rozpoznania)
    - `channels.telegram.execApprovals.approvers` (wraca do numerycznych ID właścicieli z `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` i `defaultTo` kontrolują, kto może rozmawiać z botem i gdzie wysyła on zwykłe odpowiedzi. Nie czynią nikogo zatwierdzającym exec. Pierwsze zatwierdzone parowanie DM inicjalizuje `commands.ownerAllowFrom`, gdy nie istnieje jeszcze właściciel poleceń, więc konfiguracja z jednym właścicielem nadal działa bez duplikowania ID w `execApprovals.approvers`.

    Dostarczanie do kanału pokazuje tekst polecenia na czacie; włączaj `channel` albo `both` tylko w zaufanych grupach/tematach. Gdy prośba trafia do tematu forum, OpenClaw zachowuje temat dla prośby o zatwierdzenie i kolejnej wiadomości. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline wymagają także, aby `channels.telegram.capabilities.inlineButtons` dopuszczało docelową powierzchnię (`dm`, `group` albo `all`). ID zatwierdzeń z prefiksem `plugin:` są rozwiązywane przez zatwierdzenia Plugin; pozostałe najpierw przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrolki odpowiedzi o błędach

Gdy agent napotka błąd dostarczania albo dostawcy, polityka błędów kontroluje, czy komunikaty o błędach są wysyłane do czatu Telegram:

| Klucz                               | Wartości                   | Domyślnie       | Opis                                                                                                                                                                                                                  |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — wysyłaj każdy komunikat o błędzie do czatu. `once` — wysyłaj każdy unikalny komunikat o błędzie raz na okno cooldownu (tłum powtarzające się identyczne błędy). `silent` — nigdy nie wysyłaj komunikatów o błędach do czatu. |
| `channels.telegram.errorCooldownMs` | liczba (ms)                | `14400000` (4h) | Okno cooldownu dla polityki `once`. Po wysłaniu błędu ten sam komunikat o błędzie jest tłumiony do czasu upłynięcia tego interwału. Zapobiega spamowi błędami podczas awarii.                                      |

Obsługiwane są nadpisania na konto, grupę i temat (to samo dziedziczenie co w innych kluczach konfiguracji Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne ID grup; symbol wieloznaczny `"*"` nie może być sprawdzony pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (albo zawierać `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - przejrzyj logi: `openclaw logs --follow` pod kątem powodów pomijania

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj swoją tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy polityka grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele pozycji; ogranicz polecenia pluginów/Skills/niestandardowe albo wyłącz natywne menu
    - wywołania startowe `deleteMyCommands` / `setMyCommands` oraz wywołania wpisywania `sendChatAction` są ograniczone czasowo i ponawiane raz przez awaryjny transport Telegram przy przekroczeniu limitu czasu żądania. Utrzymujące się błędy sieci/fetch zwykle wskazują na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Start zgłasza nieautoryzowany token">

    - `getMe returned 401` to błąd uwierzytelniania Telegram dla skonfigurowanego tokenu bota.
    - Skopiuj ponownie albo wygeneruj od nowa token bota w BotFather, a następnie zaktualizuj `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` albo `TELEGRAM_BOT_TOKEN` dla konta domyślnego.
    - `deleteWebhook 401 Unauthorized` podczas startu także jest błędem uwierzytelniania; potraktowanie go jako „brak istniejącego webhooka” tylko odłożyłoby ten sam błąd złego tokenu do późniejszych wywołań API.

  </Accordion>

  <Accordion title="Niestabilność odpytywania albo sieci">

    - Node 22+ i niestandardowy fetch/proxy mogą wywołać natychmiastowe przerwanie, jeśli typy AbortSignal się nie zgadzają.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` do IPv6; uszkodzony egress IPv6 może powodować sporadyczne błędy API Telegram.
    - Jeśli logi zawierają `TypeError: fetch failed` albo `Network request for 'getUpdates' failed!`, OpenClaw ponawia je teraz jako możliwe do odzyskania błędy sieciowe.
    - Podczas startu odpytywania OpenClaw ponownie używa udanego startowego probe `getMe` dla grammY, aby runner nie potrzebował drugiego `getMe` przed pierwszym `getUpdates`.
    - Jeśli `deleteWebhook` zakończy się przejściowym błędem sieciowym podczas startu odpytywania, OpenClaw przechodzi do długiego odpytywania zamiast wykonywać kolejne przedodpytywujące wywołanie płaszczyzny kontrolnej. Nadal aktywny webhook ujawnia się jako konflikt `getUpdates`; wtedy OpenClaw przebudowuje transport Telegram i ponawia czyszczenie webhooka.
    - Jeśli sockety Telegram są odnawiane w krótkim stałym rytmie, sprawdź niską wartość `channels.telegram.timeoutSeconds`; klienci botów ograniczają skonfigurowane wartości poniżej zabezpieczeń żądań wychodzących i `getUpdates`, ale starsze wydania mogły przerywać każde odpytywanie albo odpowiedź, gdy ustawiono to poniżej tych zabezpieczeń.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw domyślnie restartuje odpytywanie i przebudowuje transport Telegram po 120 sekundach bez ukończonej żywotności długiego odpytywania.
    - `openclaw channels status --probe` i `openclaw doctor` ostrzegają, gdy uruchomione konto odpytywania nie ukończyło `getUpdates` po okresie łaski startu, gdy uruchomione konto webhooka nie ukończyło `setWebhook` po okresie łaski startu albo gdy ostatnia udana aktywność transportu odpytywania jest nieaktualna.
    - Zwiększ `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zatrzymania odpytywania. Utrzymujące się zatrzymania zwykle wskazują na problemy z proxy, DNS, IPv6 albo egress TLS między hostem a `api.telegram.org`.
    - Telegram respektuje także zmienne env proxy procesu dla transportu Bot API, w tym `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i ich warianty pisane małymi literami. `NO_PROXY` / `no_proxy` nadal mogą omijać `api.telegram.org`.
    - Jeśli zarządzane proxy OpenClaw jest skonfigurowane przez `OPENCLAW_PROXY_URL` dla środowiska usługi i nie ma standardowych zmiennych env proxy, Telegram używa tego URL także dla transportu Bot API.
    - Na hostach VPS z niestabilnym bezpośrednim egressem/TLS kieruj wywołania API Telegram przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2). Kolejność wyników DNS Telegram honoruje najpierw `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, potem `channels.telegram.network.dnsResultOrder`, a następnie domyślne ustawienie procesu, takie jak `NODE_OPTIONS=--dns-result-order=ipv4first`; jeśli żadne z nich nie ma zastosowania, Node 22+ wraca do `ipv4first`.
    - Jeśli Twój host to WSL2 albo wyraźnie działa lepiej z zachowaniem tylko IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobierania multimediów Telegram. Jeśli zaufany fake-IP lub
      przezroczysty proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/specjalnego użycia adres podczas pobierania multimediów, możesz włączyć
      obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo włączenie jest dostępne dla każdego konta pod
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli Twój proxy rozwiązuje hosty multimediów Telegram na `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie zezwalają na zakres
      benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia zabezpieczenia SSRF dla multimediów Telegram.
      Używaj tego tylko w zaufanych środowiskach proxy kontrolowanych przez operatora,
      takich jak routing fake-IP Clash, Mihomo lub Surge, gdy syntetyzują
      odpowiedzi prywatne lub specjalnego użycia poza zakresem benchmarkowym RFC 2544.
      Pozostaw to wyłączone dla zwykłego publicznego dostępu Telegram przez internet.
    </Warning>

    - Nadpisania środowiskowe (tymczasowe):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Sprawdź odpowiedzi DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Więcej pomocy: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

## Odniesienie konfiguracji

Główne odniesienie: [Odniesienie konfiguracji - Telegram](/pl/gateway/config-channels#telegram).

<Accordion title="Pola Telegram o wysokiej wartości sygnału">

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; dowiązania symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- domyślne ustawienia tematów: `groups.<chatId>.topics."*"` stosuje się do niedopasowanych tematów forum; dokładne identyfikatory tematów mają pierwszeństwo
- zatwierdzenia wykonywania: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- strumieniowanie: `streaming` (wersja podglądowa), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- niestandardowy główny adres API: `apiRoot` (tylko główny adres Bot API; nie dołączaj `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorytet wielu kont: gdy skonfigurowane są co najmniej dwa identyfikatory kont, ustaw `channels.telegram.defaultAccount` (albo dodaj `channels.telegram.accounts.default`), aby jawnie określić domyślne trasowanie. W przeciwnym razie OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` ostrzega. Nazwane konta dziedziczą `channels.telegram.allowFrom` / `groupAllowFrom`, ale nie wartości `accounts.default.*`.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Telegram z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie listy dozwolonych grup i tematów.
  </Card>
  <Card title="Trasowanie kanałów" icon="route" href="/pl/channels/channel-routing">
    Trasuj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i wzmacnianie zabezpieczeń.
  </Card>
  <Card title="Trasowanie wielu agentów" icon="sitemap" href="/pl/concepts/multi-agent">
    Mapuj grupy i tematy do agentów.
  </Card>
  <Card title="Rozwiązywanie problemów" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa.
  </Card>
</CardGroup>
